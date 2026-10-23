
from pathlib import Path
import shutil
import uuid

from dotenv import load_dotenv
load_dotenv()

from fastapi import (
    FastAPI,
    File,
    UploadFile,
    HTTPException,
    Form,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from ultralytics import YOLO

from site_risk_agent import run_site_risk_agent
from compliance_agent import run_compliance_agent
from db import init_db, save_assessment, list_assessments
from gemini_agent import generate_safety_explanation


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

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best.pt"
UPLOAD_DIR = BASE_DIR / "uploads"
RESULT_DIR = BASE_DIR / "results"

UPLOAD_DIR.mkdir(exist_ok=True)
RESULT_DIR.mkdir(exist_ok=True)

model = YOLO(str(MODEL_PATH))
init_db()


@app.get("/")
def home():
    return {
        "message": "Construction Safety Monitoring API is running"
    }


@app.post("/detect")
async def detect_hazards(
    file: UploadFile = File(...),
    rainfall_mm: float | None = Form(None, ge=0),
    wind_speed_kmh: float | None = Form(None, ge=0),
    temperature_c: float | None = Form(None),
):
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

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
            ".jpg"
            if file.content_type == "image/jpeg"
            else ".png"
            if file.content_type == "image/png"
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
                "confidence": round(
                    float(box.conf[0].item()), 3
                ),
            })

        # Prepare optional environmental data.
        environmental_data = None

        if any(
            value is not None
            for value in (
                rainfall_mm,
                wind_speed_kmh,
                temperature_c,
            )
        ):
            environmental_data = {
                "rainfall_mm": rainfall_mm,
                "wind_speed_kmh": wind_speed_kmh,
                "temperature_c": temperature_c,
            }

        # Run existing risk and compliance agents.
        try:
            agent_result = run_site_risk_agent(
                detections,
                environmental_data=environmental_data,
            )

            compliance_result = run_compliance_agent(
                detections
            )

        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=422,
                detail=str(exc),
            ) from exc

        # Save the existing assessment to the database.
        save_assessment(
            image_id,
            environmental_data,
            detections,
            agent_result,
            compliance_result,
        )

        # Generate an additional Gemini explanation.
        # If Gemini is unavailable, keep the original
        # detection, risk analysis and database result.
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
def get_assessments(limit: int = 50):
    return list_assessments(min(max(limit, 1), 200))


@app.get("/result/{image_id}")
def get_result(image_id: str):
    if not image_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid image ID",
        )

    result_path = RESULT_DIR / f"{image_id}.jpg"

    if not result_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Result image not found",
        )

    return FileResponse(
        result_path,
        media_type="image/jpeg",
    )
