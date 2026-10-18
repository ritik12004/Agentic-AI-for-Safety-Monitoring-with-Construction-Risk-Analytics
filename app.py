
from pathlib import Path
import shutil
import uuid
from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from ultralytics import YOLO
from risk_engine import calculate_site_risk

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


@app.get("/")
def home():
    return {
        "message": "Construction Safety Monitoring API is running"
    }


@app.post("/detect")
async def detect_hazards(file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
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
            verbose=False
        )

        result = predictions[0]
        result.save(filename=str(output_path))

        detections = []

        for box in result.boxes:
            class_id = int(box.cls[0].item())
            detections.append({
                "class": model.names[class_id],
                "confidence": round(float(box.conf[0].item()), 3)
            })

        # Calculate risk using detected objects
        risk_analysis = calculate_site_risk(detections)

        return {
            "image_id": image_id,
            "detections": detections,
            "count": len(detections),
            "risk_analysis": risk_analysis,
            "result_image": f"/result/{image_id}"
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(exc)}"
        ) from exc

    finally:
        await file.close()


@app.get("/result/{image_id}")
def get_result(image_id: str):
    if not image_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid image ID"
        )

    result_path = RESULT_DIR / f"{image_id}.jpg"

    if not result_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Result image not found"
        )

    return FileResponse(
        result_path,
        media_type="image/jpeg"
    )
