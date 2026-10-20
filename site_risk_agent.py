
from risk_engine import calculate_site_risk


def run_site_risk_agent(detections, environmental_data=None):
    """
    Initial Site Risk Agent for Milestone 1.

    Analyzes detected objects and, when supplied,
    basic environmental site conditions.

    This is a rule-based prototype, not a certified
    safety assessment.
    """

    if not isinstance(detections, list):
        raise ValueError("Detections must be provided as a list.")

    if environmental_data is not None and not isinstance(
        environmental_data, dict
    ):
        raise ValueError("Environmental data must be a dictionary.")

    risk_analysis = calculate_site_risk(detections)

    environmental_findings = []
    environmental_score = 0

    if environmental_data is not None:
        rainfall_mm = environmental_data.get("rainfall_mm")
        wind_speed_kmh = environmental_data.get("wind_speed_kmh")
        temperature_c = environmental_data.get("temperature_c")

        if rainfall_mm is not None:
            rainfall_mm = float(rainfall_mm)

            if rainfall_mm < 0:
                raise ValueError("Rainfall cannot be negative.")

            if rainfall_mm >= 20:
                environmental_score += 20
                environmental_findings.append({
                    "risk": "Heavy rainfall requires site review",
                    "value": rainfall_mm,
                    "unit": "mm",
                    "recommendation": (
                        "Review drainage, ground conditions, "
                        "and access routes."
                    ),
                })

        if wind_speed_kmh is not None:
            wind_speed_kmh = float(wind_speed_kmh)

            if wind_speed_kmh < 0:
                raise ValueError("Wind speed cannot be negative.")

            if wind_speed_kmh >= 40:
                environmental_score += 20
                environmental_findings.append({
                    "risk": "High wind speed requires site review",
                    "value": wind_speed_kmh,
                    "unit": "km/h",
                    "recommendation": (
                        "Review lifting operations and exposed "
                        "equipment against site safety procedures."
                    ),
                })

        if temperature_c is not None:
            temperature_c = float(temperature_c)

            if temperature_c >= 40:
                environmental_score += 20
                environmental_findings.append({
                    "risk": "High temperature requires site review",
                    "value": temperature_c,
                    "unit": "°C",
                    "recommendation": (
                        "Review heat-stress precautions and "
                        "worker hydration arrangements."
                    ),
                })

    combined_score = min(
        risk_analysis["risk_score"] + environmental_score,
        100,
    )

    if combined_score >= 60:
        combined_level = "High"
    elif combined_score >= 25:
        combined_level = "Medium"
    else:
        combined_level = "Low"

    return {
        "agent": "Site Risk Agent",
        "status": "completed",
        "detection_count": len(detections),
        "risk_analysis": risk_analysis,
        "environmental_analysis": {
            "data_provided": environmental_data is not None,
            "findings": environmental_findings,
            "additional_score": environmental_score,
        },
        "combined_risk": {
            "risk_score": combined_score,
            "risk_level": combined_level,
        },
        "limitations": [
            "Object detection does not confirm a real hazard.",
            "Detected objects do not identify unique workers.",
            "Environmental analysis runs only when data is supplied.",
            "Thresholds are illustrative and require validation.",
            "Human review is required before safety decisions.",
        ],
    }
