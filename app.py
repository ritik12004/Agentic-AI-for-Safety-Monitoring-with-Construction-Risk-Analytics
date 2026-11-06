
import os
import shutil
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from fastapi import (
    Depends, FastAPI, File, Form, HTTPException, UploadFile
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from ultralytics import YOLO

from site_risk_agent import run_site_risk_agent
from compliance_agent import run_compliance_agent
from safety_file import run_safety_workflow
from backend.app_safety import run_safety_graph

from db import (
    init_db,
    save_assessment,
    list_assessments,
    create_user,
    get_user_by_email,
    verify_user_password,
    ensure_admin_account,
    save_notifications,
    list_notifications,
    update_notification_status,
)

from gemini_agent import generate_safety_explanation


load_dotenv()

app = FastAPI(title="Construction Site Safety Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing. Add it to your .env file.")

ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60
security = HTTPBearer()

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"
UPLOAD_DIR = BASE_DIR / "uploads"
RESULT_DIR = BASE_DIR / "results"

UPLOAD_DIR.mkdir(exist_ok=True)
RESULT_DIR.mkdir(exist_ok=True)

model = YOLO(str(MODEL_PATH))

init_db()
ensure_admin_account()


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class AlertStatusUpdate(BaseModel):
    status: str


def make_access_token(user_id: int, role: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expires_at,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (
        jwt.InvalidTokenError,
        KeyError,
        TypeError,
        ValueError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from db import SessionLocal, User

    with SessionLocal() as session:
        user = session.query(User).filter(User.id == user_id).first()

        if user is None or not user.is_active:
            raise HTTPException(
                status_code=401,
                detail="Account not found or inactive.",
            )

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


@app.get("/")
def home():
    return {"message": "Construction Safety Monitoring API is running"}


@app.post("/auth/signup", status_code=201)
def signup(data: SignupRequest):
    name = data.name.strip()
    email = data.email.strip().lower()

    if not name or not email:
        raise HTTPException(status_code=400, detail="Name and email are required.")

    if email == "admin":
        raise HTTPException(status_code=400, detail="This username is reserved.")

    try:
        user = create_user(
            name=name,
            email=email,
            password=data.password,
            role="user",
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return {
        "message": "Account created. You can now log in.",
        "user": user,
    }


@app.post("/auth/login")
def login(data: LoginRequest):
    username = data.username.strip().lower()
    user = get_user_by_email(username)

    if (
        user is None
        or not user.is_active
        or not verify_user_password(data.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username/email or password.",
        )

    token = make_access_token(user.id, user.role)

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_MINUTES * 60,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


@app.get("/auth/me")
def get_my_account(user=Depends(get_current_user)):
    return {"user": user}


@app.post("/detect")
async def detect_hazards(
    current_user=Depends(get_current_user),
    file: UploadFile = File(...),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        await file.close()
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_id = uuid.uuid4().hex
    extension = Path(file.filename or "").suffix.lower()

    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = (
            ".jpg" if file.content_type == "image/jpeg"
            else ".png" if file.content_type == "image/png"
            else ".webp"
        )

    image_path = UPLOAD_DIR / f"{image_id}{extension}"
    output_path = RESULT_DIR / f"{image_id}.jpg"

    try:
        with image_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        predictions = model.predict(
            source=str(image_path),
            conf=0.25,
            verbose=False,
        )

        result = predictions[0]
        result.save(filename=str(output_path))

        detections = []

        for box in result.boxes:
            class_id = int(box.cls[0].item())
            detections.append({
                "class": model.names[class_id],
                "confidence": round(float(box.conf[0].item()), 3),
            })

        environmental_data = None

        try:
            agent_result = run_site_risk_agent(
                detections,
                environmental_data=environmental_data,
            )

            compliance_result = run_compliance_agent(detections)
            safety_workflow_result = run_safety_workflow(detections)
            day3_safety_result = run_safety_graph(detections)

        except (ValueError, TypeError) as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        save_assessment(
            image_id,
            environmental_data,
            detections,
            agent_result,
            compliance_result,
        )

        safety_result = day3_safety_result.get("safety_result", {})
        generated_alerts = safety_result.get("alerts", [])

        save_notifications(
            user_id=current_user["id"],
            image_id=image_id,
            alerts=generated_alerts,
        )

        gemini_result = generate_safety_explanation(
            detections=detections,
            risk_analysis=agent_result["risk_analysis"],
            environmental_data=environmental_data,
        )

        return {
            "image_id": image_id,
            "detections": detections,
            "count": len(detections),
            "risk_analysis": agent_result["risk_analysis"],
            "agent": agent_result,
            "compliance": compliance_result,
            "safety_workflow": safety_workflow_result,
            "day3_safety_workflow": day3_safety_result,
            "gemini_analysis": gemini_result,
            "result_image": f"/result/{image_id}",
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(exc)}",
        ) from exc
    finally:
        await file.close()


@app.get("/assessments")
def get_assessments(
    limit: int = 50,
    current_user=Depends(require_admin),
):
    return list_assessments(min(max(limit, 1), 200))


@app.get("/alerts")
def get_my_alerts(current_user=Depends(get_current_user)):
    alerts = list_notifications(current_user["id"])

    return {
        "alerts": alerts,
        "unread_count": sum(
            1 for alert in alerts if alert["status"] == "Unread"
        ),
    }


@app.patch("/alerts/{alert_id}")
def update_my_alert(
    alert_id: int,
    data: AlertStatusUpdate,
    current_user=Depends(get_current_user),
):
    if data.status not in {"Acknowledged", "Resolved"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be Acknowledged or Resolved.",
        )

    updated = update_notification_status(
        current_user["id"],
        alert_id,
        data.status,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found.")

    return {"message": "Alert status updated.", "status": data.status}


@app.get("/result/{image_id}")
def get_result(
    image_id: str,
    current_user=Depends(get_current_user),
):
    if not image_id.isalnum():
        raise HTTPException(status_code=400, detail="Invalid image ID")

    result_path = RESULT_DIR / f"{image_id}.jpg"

    if not result_path.is_file():
        raise HTTPException(status_code=404, detail="Result image not found")

    return FileResponse(result_path, media_type="image/jpeg")
