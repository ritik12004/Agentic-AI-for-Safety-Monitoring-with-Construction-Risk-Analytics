
def calculate_site_risk(detections):
    """
    Calculate a prototype construction site risk score
    using YOLO detections.

    This is a rule-based prototype, not a certified
    safety assessment.
    """

    findings = []
    missing_ppe_counts = {}

    high_risk_ppe = {
        "no-hardhat",
        "no-safety vest",
        "no-mask",
    }

    ppe_classes = {
        "hardhat",
        "safety vest",
        "gloves",
        "mask",
    }

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

    for item in detections:
        class_name = item.get("class", "").strip().lower()
        confidence = float(item.get("confidence", 0))

        if confidence < 0.25:
            continue

        if class_name in high_risk_ppe:
            missing_ppe_counts[class_name] = (
                missing_ppe_counts.get(class_name, 0) + 1
            )

        if class_name in high_risk_ppe:
            findings.append({
                "hazard": f"Possible missing PPE: {item['class']}",
                "severity": "High",
                "confidence": confidence,
                "recommendation": (
                    "Review the image and verify PPE compliance."
                ),
            })

        elif class_name in ppe_classes:
            findings.append({
                "hazard": f"PPE detected: {item['class']}",
                "severity": "Information",
                "confidence": confidence,
                "recommendation": (
                    "Verify that PPE is worn correctly."
                ),
            })

        elif class_name in equipment_classes:
            findings.append({
                "hazard": (
                    f"Equipment or vehicle detected: {item['class']}"
                ),
                "severity": "Review",
                "confidence": confidence,
                "recommendation": (
                    "Review equipment movement and nearby workers."
                ),
            })

        elif class_name in {"person", "ladder", "safety cone"}:
            findings.append({
                "hazard": f"Site object detected: {item['class']}",
                "severity": "Review",
                "confidence": confidence,
                "recommendation": (
                    "Review the scene for potential safety concerns."
                ),
            })

    # Score each missing-PPE category only once.
    # Multiple detections of the same category do not
    # repeatedly add 25 points.
    score = min(len(missing_ppe_counts) * 25, 100)

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
            "Prototype score based on detected missing-PPE "
            "categories. Multiple detections in one category "
            "are not counted as separate score increments. "
            "This does not identify unique workers or confirm "
            "which PPE belongs to each person. Review detections "
            "before making safety decisions."
        ),
    }
