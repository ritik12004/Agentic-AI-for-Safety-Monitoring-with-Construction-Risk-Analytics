
from collections.abc import Mapping


MISSING_PPE_CLASSES = {
    "NO-Hardhat": "Hardhat may be missing",
    "NO-Safety Vest": "Safety vest may be missing",
    "NO-Mask": "Mask may be missing",
}

REQUIRED_PPE_CLASSES = {
    "Hardhat",
    "Safety Vest",
    "Gloves",
    "Mask",
}


def run_compliance_agent(detections):
    """
    Review detected PPE labels and return a prototype
    compliance summary. Human review is required.
    """
    if not isinstance(detections, list):
        raise ValueError("detections must be a list")

    concerns = []
    detected_ppe = set()

    for item in detections:
        if not isinstance(item, Mapping):
            raise ValueError("Each detection must be a dictionary")

        label = item.get("class")
        confidence = item.get("confidence", 0)

        if not isinstance(label, str):
            raise ValueError("Each detection must include a class name")

        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, (int, float))
            or not 0 <= confidence <= 1
        ):
            raise ValueError("Detection confidence must be between 0 and 1")

        if confidence < 0.25:
            continue

        if label in MISSING_PPE_CLASSES:
            concerns.append({
                "type": "possible_missing_ppe",
                "class": label,
                "message": MISSING_PPE_CLASSES[label],
                "confidence": round(float(confidence), 3),
                "requires_human_review": True,
            })

        elif label in REQUIRED_PPE_CLASSES:
            detected_ppe.add(label)

    return {
        "agent": "Compliance Agent",
        "status": (
            "Review Required"
            if concerns
            else "No Issues Detected"
        ),
        "possible_concerns": concerns,
        "detected_ppe_classes": sorted(detected_ppe),
        "note": (
            "This prototype reviews detected labels only. "
            "It cannot confirm whether a specific worker is compliant. "
            "Human review is required."
        ),
    }
