# SURAKSHA
## Agentic AI for Safety Monitoring with Construction Risk Analytics

**Milestone 1 Documentation: Site Risk Monitoring & Hazard Detection**

**Project Platform:** Construction Risk Intelligence Platform  
**Milestone Duration:** Weeks 1–2  
**Frontend:** React.js  
**Backend:** FastAPI and Python  
**Object Detection:** YOLO  
**Database Layer:** SQLAlchemy  
**Repository:** [GitHub – Agentic AI for Safety Monitoring](https://github.com/ritik12004/Agentic-AI-for-Safety-Monitoring-with-Construction-Risk-Analytics)

---

## 1. Project Overview

Construction sites involve several types of risks, including worker safety risks, site hazards, equipment-related risks, regulatory compliance issues, insurance risks, delayed incident reporting, and dependence on manual inspections.

Risks may not be identified until an incident occurs. Early identification of potential hazards can help site personnel review unsafe conditions and take appropriate preventive action.

**Suraksha** is a construction safety monitoring prototype designed to analyse construction-site images, identify potential hazards, evaluate basic environmental conditions, generate risk scores, and present assessment results through a dashboard.

The broader project aims to bring different risk-monitoring capabilities together in one platform. This implementation focuses on Milestone 1: Site Risk Monitoring and Hazard Detection.

## 2. Problem Statement

Traditional construction-site inspections can depend heavily on manual observation and periodic reporting. This can make it difficult to identify every potential concern promptly.

The project addresses this challenge by combining image-based object detection, rule-based risk assessment, environmental inputs, compliance-related checks, and a dashboard for reviewing findings.

The system supports preliminary risk identification. It does not replace qualified safety personnel or certified safety inspections.

## 3. Objectives of Milestone 1

The main objectives are to:

1. Monitor construction-site information supplied through images and optional environmental data.
2. Detect construction objects and PPE-related classes.
3. Identify potential missing-PPE concerns.
4. Flag equipment and site objects for further review.
5. Analyse basic environmental risk indicators.
6. Calculate a prototype site risk score and risk level.
7. Display assessment results through a web dashboard.
8. Store assessments for subsequent retrieval and review.

## 4. System Architecture

The system follows this general workflow:

**Image and Environmental Inputs → Object Detection → Risk Assessment → Compliance Review → Database Storage → Dashboard Results**

### 4.1 Input Layer

The user uploads a construction-site image in JPG, PNG, or WEBP format. Optional environmental inputs include:

- Rainfall in millimetres
- Wind speed in kilometres per hour
- Temperature in degrees Celsius

### 4.2 Object Detection Layer

A trained YOLO model processes the uploaded image and returns detected classes with confidence scores.

The application extracts the detected class names and confidence values for downstream assessment.

### 4.3 Site Risk Agent

The Site Risk Agent analyses the detection results and optional environmental data. It generates findings, recommendations, an image-based risk score, an environmental assessment, and a combined risk score.

### 4.4 Compliance Agent

The Compliance Agent reviews configured PPE-related detection labels. It flags possible missing hardhats, safety vests, and masks for human review.

### 4.5 Language Explanation Layer

The application calls the Gemini explanation module to generate additional safety-related explanatory text. The existing assessment can still be returned if Gemini is unavailable.

### 4.6 Database Layer

Assessment results are saved through the database module and can be retrieved through the assessments endpoint.

### 4.7 Dashboard Layer

The React frontend provides the user interface for uploading images and viewing detection results and risk assessments.

## 5. Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Interactive frontend |
| Python | Backend logic and risk assessment |
| FastAPI | REST API and request handling |
| YOLO / Ultralytics | Construction object detection |
| SQLAlchemy | Database interaction layer |
| Configured database | Persistence and retrieval of assessments |
| Gemini integration | Additional safety explanation |
| Git and GitHub | Version control and source-code hosting |
| Vite | Frontend development and build tooling |

The mentor's broader recommended stack also mentions Tailwind CSS, OpenCV, LangGraph, PostgreSQL, Recharts, JWT, and Docker. Their inclusion as completed technologies should only be claimed if they are actually implemented and verified in the relevant project files.

## 6. Site Risk Agent

The Site Risk Agent is an initial rule-based module that evaluates detected classes and optional environmental conditions.

### 6.1 PPE-Related Findings

The following detection labels are configured as possible missing-PPE concerns:

- `NO-Hardhat`
- `NO-Safety Vest`
- `NO-Mask`

These findings receive a high-severity review flag in the risk engine.

Detected PPE labels such as `Hardhat`, `Safety Vest`, `Gloves`, and `Mask` are recorded as informational findings. Their presence does not prove that the equipment is correctly worn by a particular worker.

### 6.2 Equipment and Site Objects

Equipment and vehicle detections include classes such as excavators, machinery, wheel loaders, trucks, and other configured vehicle categories.

Site-object review flags include persons, ladders, and safety cones.

These detections trigger recommendations to review the surrounding scene. The presence of equipment or an object alone is not treated as proof of an unsafe condition.

## 7. Risk-Scoring Methodology

The risk engine uses a transparent, rule-based prototype score.

### 7.1 Image-Based Risk Score

The scoring rules are:

| Category | Scoring rule | Maximum points |
|---|---|---:|
| Missing-PPE categories | 25 points per distinct category | 75 |
| Equipment/vehicle categories | 5 points per distinct category | 15 |
| Site-object review categories | 5 points per distinct category | 10 |
| **Maximum base score** | Capped at 100 | **100** |

Repeated detections of the same class do not repeatedly increase category points.

The score is calculated as:

`Base score = PPE points + equipment points + site-object review points`

### 7.2 Environmental Risk Score

The Site Risk Agent adds 20 points for each supplied environmental measurement that meets its configured review threshold.

| Environmental input | Configured threshold | Additional points |
|---|---|---:|
| Rainfall | 20 mm or above | 20 |
| Wind speed | 40 km/h or above | 20 |
| Temperature | 40°C or above | 20 |

Only supplied measurements are evaluated. These thresholds are illustrative prototype settings and require validation against applicable site procedures and safety guidance.

### 7.3 Combined Risk Score

The combined score is calculated as:

`Combined score = min(base score + environmental points, 100)`

The configured risk levels are:

| Score | Risk level |
|---|---|
| Below 25 | Low |
| 25–59 | Medium |
| 60–100 | High |

These levels represent the prototype's configured categories, not calibrated probabilities of an accident.

## 8. Compliance Agent

The Compliance Agent examines the detected labels and identifies configured missing-PPE concerns.

Its output includes:

- Compliance review status
- Possible missing-PPE concerns
- Detected PPE classes
- Confidence values for flagged detections
- A human-review note

When a configured missing-PPE label is detected at the required confidence threshold, the status becomes **Review Required**.

When no configured concern is detected, the status is **No Issues Detected**. This does not certify that the site or its workers are compliant.

The current implementation checks detection labels; it does not establish which PPE belongs to a particular worker or verify all applicable regulatory requirements.

## 9. API Documentation

The backend exposes the following endpoints.

### 9.1 Health Check

**Method:** `GET`  
**Endpoint:** `/`

Returns a message indicating that the API is running.

### 9.2 Construction-Site Detection and Assessment

**Method:** `POST`  
**Endpoint:** `/detect`

**Input:** Multipart form data containing:

- `file` — required image file
- `rainfall_mm` — optional non-negative number
- `wind_speed_kmh` — optional non-negative number
- `temperature_c` — optional numeric value

**Response includes:**

- Image identifier
- Detection results and detection count
- Risk analysis
- Site Risk Agent output
- Compliance Agent output
- Gemini explanation
- URL for the annotated result image

The endpoint also saves the assessment through the database module.

### 9.3 Retrieve Assessments

**Method:** `GET`  
**Endpoint:** `/assessments`

The optional `limit` parameter controls the number of records returned. The application constrains this value to a range of 1–200, with a default of 50.

### 9.4 Retrieve an Annotated Result Image

**Method:** `GET`  
**Endpoint:** `/result/{image_id}`

Returns the saved result image when the requested identifier is valid and the corresponding image exists.

## 10. Database Integration

The application initialises its database layer during startup. After a detection and assessment, it saves the image identifier, environmental inputs, detections, risk analysis, and compliance result through the database module.

The assessments endpoint provides access to stored records.

**Verification evidence:** During the reported test, the detection endpoint returned a successful response, and the resulting assessment was subsequently available through `GET /assessments`. The recorded example included an image identifier, environmental measurements, detection count, scores, risk level, and findings.

The exact database engine and deployment configuration should be documented according to the actual settings used in the project.

## 11. Testing and Results

The following functional checks have been reported as successful:

| Test area | Reported result |
|---|---|
| Image upload and object detection | Successful |
| Detection result generation | Successful |
| Risk analysis response | Successful |
| Environmental inputs | Integrated into assessment |
| Compliance assessment | Included in API response |
| Database save and retrieval | Successful |
| Dashboard image upload and result display | Working according to project testing |

### Example Assessment

In one reported test, the system processed an image with one Excavator detection at approximately 0.532 confidence. The environmental inputs were:

- Rainfall: 25 mm
- Wind speed: 45 km/h
- Temperature: 40°C

The reported image-based score was 5, the environmental additional score was 60, and the combined score was 65, classified as High under the configured rules.

This example demonstrates the configured scoring workflow. It does not establish that the construction site was actually unsafe.

## 12. Limitations

The current implementation has the following limitations:

1. Object detection does not independently confirm a real-world hazard.
2. Detected objects do not identify unique workers.
3. The system does not associate PPE detections with individual workers.
4. The risk-scoring thresholds are illustrative and have not been established as certified safety standards.
5. Environmental assessment runs only when corresponding measurements are supplied.
6. The current compliance checks cover selected PPE-related labels rather than every regulatory requirement.
7. The system does not currently establish that every broader platform capability, such as insurance-risk analysis, automated alerts, or complete incident reporting, is implemented.
8. Human review is required before operational safety decisions are made.

## 13. Future Scope

Future development may include:

- Additional specialist agents for safety, compliance, insurance, and reporting
- Validated environmental and site-specific risk rules
- Better association between workers and their PPE
- Historical trend analysis and interactive charts
- Incident reports and notification workflows
- Role-based access and authentication
- A validated agent workflow using an orchestration framework if required
- Production database configuration and deployment improvements
- Further model evaluation on representative construction-site images

These are future possibilities, not claims about completed Milestone 1 functionality.

## 14. Conclusion

Suraksha implements the core components of the first milestone: construction object detection, a rule-based Site Risk Agent, basic environmental risk analysis, a prototype Compliance Agent, database persistence, and a dashboard for reviewing assessment results.

The system provides a foundation for a broader Construction Risk Intelligence Platform. Its scores and findings are intended to support preliminary review and must not be interpreted as certified safety decisions.

**Milestone 1 focus:** Site Risk Monitoring and Hazard Detection.
