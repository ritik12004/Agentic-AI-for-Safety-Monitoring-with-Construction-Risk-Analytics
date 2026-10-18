# Agentic AI for Safety Monitoring with Construction Risk Analytics

## Project Overview
This project is a prototype for monitoring construction site safety using computer vision. It detects safety-related objects and missing Personal Protective Equipment (PPE) in site images and displays risk analysis.

## Milestone 1: Site Risk Monitoring
- Detect construction site objects using YOLO.
- Identify PPE-related objects such as hardhats and safety vests.
- Display detection results and confidence scores.
- Calculate a prototype site risk score.
- Show annotated images and risk findings in a web interface.

## Technology Stack
- Python, FastAPI
- YOLOv8, Ultralytics, OpenCV
- React, Vite, JavaScript, CSS

## Project Structure
- `app.py` - Backend API and object detection
- `risk_engine.py` - Risk scoring logic
- `models/best.pt` - Trained YOLO model
- `data.yaml` - Dataset configuration
- `requirements.txt` - Python dependencies
- `frontend/` - React frontend

## Setup and Run

### Install backend dependencies
Run from the project root:

```bash
pip install -r requirements.txt
```

### Start the backend

```bash
python -m uvicorn app:app --reload
```

API documentation: http://127.0.0.1:8000/docs

### Start the frontend
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal, usually http://localhost:5173.

## Dataset
The model uses the Construction Site Safety dataset from Roboflow Universe. See the included dataset attribution files for source and licensing details.

## Limitations
This is an experimental prototype. Detection and risk scores may be inaccurate. Results require human review and must not replace professional safety inspections.