
import pytest

from compliance_agent import run_compliance_agent


def test_missing_hardhat_is_flagged():
    result = run_compliance_agent([
        {"class": "NO-Hardhat", "confidence": 0.91}
    ])

    assert result["status"] == "Review Required"
    assert len(result["possible_concerns"]) == 1


def test_low_confidence_detection_is_ignored():
    result = run_compliance_agent([
        {"class": "NO-Mask", "confidence": 0.10}
    ])

    assert result["status"] == "No Issues Detected"
    assert result["possible_concerns"] == []


def test_detected_ppe_is_recorded():
    result = run_compliance_agent([
        {"class": "Hardhat", "confidence": 0.88},
        {"class": "Safety Vest", "confidence": 0.95},
    ])

    assert "Hardhat" in result["detected_ppe_classes"]
    assert "Safety Vest" in result["detected_ppe_classes"]


def test_empty_detections():
    result = run_compliance_agent([])

    assert result["status"] == "No Issues Detected"
    assert result["possible_concerns"] == []


def test_invalid_input_is_rejected():
    with pytest.raises(ValueError):
        run_compliance_agent("invalid")
