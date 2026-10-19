
def calculate_site_risk(detections):
    """
    Milestone 1: Site Risk Monitoring and Hazard Detection.

    Rule-based prototype for PPE-related risk scoring and
    equipment/site-object review flags.

    This is not a certified safety assessment.
    """

    findings = []
    missing_ppe_categories = set()
    equipment_categories = set()
    site_review_categories = set()

    # Classes indicating possible missing protective equipment.
    high_risk_ppe = {
        "no-hardhat",
        "no-safety vest",
        "no-mask",
    }

    # Classes indicating PPE was detected.
    ppe_classes = {
        "hardhat",
        "safety vest",
        "gloves",
        "mask",
    }

    # Detection of equipment does not automatically mean danger.
    equipment_classes = {
        "excavator",
        "machinery",
        "wheel loader",
        "dump truck",
        "truck",
        "semi",
        "truck and trailer",
        "bus",
        "suv",
        "mini-van",
        "sedan",
        "trailer",
        "van",
        "vehicle",
    }

    site_object_classes = {
        "person",
        "ladder",
        "safety cone",
    }

    for item in detections:
        class_name = str(item.get("class", "")).strip().lower()

        try:
            confidence = float(item.get("confidence", 0))
        except (TypeError, ValueError):
            continue

        # Ignore invalid or low-confidence detections.
        if not 0.25 <= confidence <= 1.0:
            continue

        original_name = str(item.get("class", "")).strip()

        if class_name in high_risk_ppe:
            missing_ppe_categories.add(class_name)

            findings.append({
                "hazard": f"Possible missing PPE: {original_name}",
                "severity": "High",
                "confidence": confidence,
                "recommendation": (
                    "Review the image and verify PPE compliance "
                    "before taking safety action."
                ),
            })

        elif class_name in ppe_classes:
            findings.append({
                "hazard": f"PPE detected: {original_name}",
                "severity": "Information",
                "confidence": confidence,
                "recommendation": (
                    "Review the image to verify that PPE is worn "
                    "correctly by the relevant worker."
                ),
            })

        elif class_name in equipment_classes:
            equipment_categories.add(class_name)

            findings.append({
                "hazard": f"Equipment or vehicle detected: {original_name}",
                "severity": "Review",
                "confidence": confidence,
                "recommendation": (
                    "Review equipment movement, nearby workers, "
                    "and separation from pedestrian areas."
                ),
            })

        elif class_name in site_object_classes:
            site_review_categories.add(class_name)

            findings.append({
                "hazard": f"Site object detected: {original_name}",
                "severity": "Review",
                "confidence": confidence,
                "recommendation": (
                    "Review the scene for potential safety concerns."
                ),
            })

    # Transparent prototype score:
    # Missing-PPE categories carry the greatest weight.
    # Equipment and site objects add limited review points.
    # Repeated detections of the same class do not repeatedly
    # increase the score.
    ppe_points = min(len(missing_ppe_categories) * 25, 75)
    equipment_points = min(len(equipment_categories) * 5, 15)
    site_review_points = min(len(site_review_categories) * 5, 10)

    score = min(
        ppe_points + equipment_points + site_review_points,
        100,
    )

    if score >= 60:
        risk_level = "High"
    elif score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "findings": findings,
        "note": (
            "Prototype risk score based on detected missing-PPE "
            "categories and equipment/site-object review flags. "
            "Repeated detections of the same class do not add "
            "repeated points. Object detection alone does not prove "
            "a hazard, identify unique workers, establish which PPE "
            "belongs to a person, or assess environmental conditions. "
            "Review the image and findings before making safety "
            "decisions. This score is not a certified safety assessment."
        ),
    }
