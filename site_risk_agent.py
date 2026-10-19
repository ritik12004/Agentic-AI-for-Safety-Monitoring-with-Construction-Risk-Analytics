
from risk_engine import calculate_site_risk


def run_site_risk_agent(detections):
    """
    Initial Site Risk Agent for Milestone 1.

    Uses YOLO detections to generate risk analysis.
    This is a rule-based prototype, not a certified
    safety assessment.
    """

    if not isinstance(detections, list):
        raise ValueError("Detections must be provided as a list.")

    risk_analysis = calculate_site_risk(detections)

    return {
        "agent": "Site Risk Agent",
        "status": "completed",
        "detection_count": len(detections),
        "risk_analysis": risk_analysis,
        "limitations": [
            "Object detection does not confirm a real hazard.",
            "Detected objects do not identify unique workers.",
            "Environmental risks require additional site data.",
            "Human review is required before safety decisions.",
        ],
    }
