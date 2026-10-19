
# Agentic AI for Safety Monitoring with Construction Risk Analytics

## Project Overview

This project is a prototype for construction site safety monitoring using computer vision. It detects safety-related objects and possible missing Personal Protective Equipment (PPE) in site images, calculates a rule-based prototype risk score, and displays the results through a web dashboard.

## Milestone 1: Site Risk Monitoring and Hazard Detection

- Detect construction site objects using a trained YOLO model.
- Identify PPE-related objects, including hardhats, safety vests, gloves, and masks.
- Flag possible missing PPE for further review.
- Calculate a prototype site risk score using rule-based logic.
- Display detection labels, confidence scores, risk findings, and annotated images.
- Integrate an initial Site Risk Agent with the risk analysis engine.
- Provide a web dashboard to upload and analyze site images.

## Technology Stack

- Python
- FastAPI
- YOLOv8 and Ultralytics
- OpenCV
- React, Vite, JavaScript, and CSS
- Pytest for automated testing

## Project Structure

- `app.py` - Backend API and YOLO inference
- `site_risk_agent.py` - Initial Site Risk Agent
- `risk_engine.py` - Rule-based risk scoring and findings
- `test_risk_engine.py` - Automated risk engine tests
- `models/best.pt` - Trained YOLO model
- `data.yaml` - Dataset configuration
- `requirements.txt` - Python dependencies
- `frontend/` - React dashboard
- `train/`, `valid/`, `test/` - Dataset splits, if retained locally

## Setup and Run

### 1. Install backend dependencies

Run from the project root:

```bash
python -m pip install -r requirements.txt
python -m pip install pytest
```

### 2. Start the backend

```bash
python -m uvicorn app:app --reload
```

API documentation: http://127.0.0.1:8000/docs

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal, usually:

http://localhost:5173

## Dataset

The model uses the Construction Site Safety dataset from Roboflow Universe.

Dataset:
https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30

Refer to the included dataset attribution files for source and licensing information.

## Testing

The risk engine has been tested using Pytest.

Command:

```bash
python -m pytest test_risk_engine.py -v
```

Latest local test result: 7 tests passed.

Tests cover:
- Hardhat and person detections
- Possible missing PPE
- Multiple missing-PPE categories
- Repeated detections
- Low-confidence detections
- Equipment detections
- Empty input

## Limitations

This is an experimental prototype. Object detection does not independently confirm a real hazard, establish whether PPE is correctly worn by a specific worker, or assess environmental conditions.

Risk scores are based on predefined rules and detected objects. Results may be inaccurate and require human review. The system must not replace professional safety inspections or be used as a certified safety assessment.
