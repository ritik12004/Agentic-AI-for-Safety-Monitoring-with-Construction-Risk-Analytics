
from risk_engine import calculate_site_risk


def test_hardhat_and_person():
    detections = [
        {"class": "Hardhat", "confidence": 0.753},
        {"class": "Person", "confidence": 0.659},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 5
    assert result["risk_level"] == "Low"


def test_missing_hardhat():
    detections = [
        {"class": "NO-Hardhat", "confidence": 0.90},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 25
    assert result["risk_level"] == "Medium"


def test_multiple_missing_ppe_categories():
    detections = [
        {"class": "NO-Hardhat", "confidence": 0.90},
        {"class": "NO-Safety Vest", "confidence": 0.85},
        {"class": "NO-Mask", "confidence": 0.80},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 75
    assert result["risk_level"] == "High"


def test_repeated_detections_do_not_increase_score():
    detections = [
        {"class": "NO-Hardhat", "confidence": 0.90},
        {"class": "NO-Hardhat", "confidence": 0.80},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 25


def test_low_confidence_detection_is_ignored():
    detections = [
        {"class": "NO-Hardhat", "confidence": 0.20},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 0
    assert result["risk_level"] == "Low"
    assert result["findings"] == []


def test_equipment_detection():
    detections = [
        {"class": "Excavator", "confidence": 0.90},
    ]

    result = calculate_site_risk(detections)

    assert result["risk_score"] == 5
    assert result["risk_level"] == "Low"


def test_empty_detections():
    result = calculate_site_risk([])

    assert result["risk_score"] == 0
    assert result["risk_level"] == "Low"
    assert result["findings"] == []
