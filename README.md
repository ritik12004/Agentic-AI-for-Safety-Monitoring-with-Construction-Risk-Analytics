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
- SQLAlchemy and SQLite for database operations
- PostgreSQL as an optional database backend, if configured
- Pytest for automated testing

## Project Structure

- `app.py` - Backend API and YOLO inference
- `site_risk_agent.py` - Initial Site Risk Agent, if included
- `risk_engine.py` - Rule-based risk scoring and findings, if included
- `test_risk_engine.py` - Automated risk engine tests, if included
- `db.py` - Database connection and database operations
- `gemini_agent.py` - Additional analysis integration, if configured
- `models/best.pt` - Trained YOLO model
- `data.yaml` - Dataset configuration
- `requirements.txt` - Python dependencies
- `frontend/` - React dashboard
- `train/`, `valid/`, `test/` - Dataset splits, if retained locally

## Setup and Run

### 1. Clone the Repository

```bash
git clone https://github.com/ritik12004/Agentic-AI-for-Safety-Monitoring-with-Construction-Risk-Analytics.git
cd Agentic-AI-for-Safety-Monitoring-with-Construction-Risk-Analytics
```

### 2. Install Backend Dependencies

Run these commands from the project root:

```bash
python -m pip install -r requirements.txt
python -m pip install pytest
```

### 3. Database Setup

The project is designed to use SQLite as the default database, subject to the database configuration in `db.py`. SQLite is file-based, so a separate database server is not required for local development.

#### Default Setup: SQLite

1. Check `db.py` for the database connection URL and initialization logic.
2. If the project uses the default SQLite configuration, the database file is created at the configured path when the application initializes the database.
3. The application should initialize the required tables before database operations are performed.
4. Start the backend as described in the next section.

For example, a SQLite connection URL may look like this:

```text
sqlite:///./safety.db
```

The actual database filename and location depend on the project's configuration.

#### Optional Setup: PostgreSQL

PostgreSQL can be used only if the application supports it and the required driver is installed.

1. Install and start PostgreSQL.
2. Create a database for the project.
3. Configure the `DATABASE_URL` environment variable using your own database credentials:

```text
postgresql+psycopg2://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

4. Install the appropriate PostgreSQL driver if it is required and is not already included in `requirements.txt`:

```bash
python -m pip install psycopg2-binary
```

5. Confirm that `db.py` reads the configured database URL and that the application initializes the required tables.

**Important:** The connection URL above is an example, not a ready-to-use credential. Do not upload real passwords, database credentials, or API keys to GitHub.

### 4. Start the Backend

From the project root, run:

```bash
python -m uvicorn app:app --reload
```

Backend API:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

Keep this terminal running while using the frontend.

### 5. Start the Frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal, usually:

http://localhost:5173

The frontend communicates with the backend API. Make sure the backend is running and that the API URL configured in the frontend matches your backend address.

## Environment Variables and Security

Some integrations may require environment variables, such as API keys or database connection settings.

- Create a local `.env` file only if the application requires it.
- Use `.env.example` to document required variable names without including real secrets.
- Keep `.env` excluded from Git using `.gitignore`.
- Never commit API keys, database passwords, or other private credentials.
- If a secret has already been exposed publicly, revoke or rotate it.

Example `.env.example` format:

```text
DATABASE_URL=
GEMINI_API_KEY=
```

Only include variables that are actually supported by the application.

## Dataset

The model uses the Construction Site Safety dataset from Roboflow Universe.

Dataset:

https://universe.roboflow.com/roboflow-universe-projects/construction-site-safety/dataset/30

Refer to the included dataset attribution files for source and licensing information.

## Testing

The risk engine can be tested using Pytest.

```bash
python -m pytest test_risk_engine.py -v
```

Latest reported local test result: 7 tests passed.

Tests cover:

- Hardhat and person detections
- Possible missing PPE
- Multiple missing-PPE categories
- Repeated detections
- Low-confidence detections
- Equipment detections
- Empty input

Run the test command from the project root. Ensure the listed test file exists in your local checkout.

## Limitations

This is an experimental prototype. Object detection does not independently confirm a real hazard, establish whether PPE is correctly worn by a specific worker, or assess environmental conditions.

Risk scores are based on predefined rules and detected objects. Results may be inaccurate and require human review. The system must not replace professional safety inspections or be used as a certified safety assessment.
