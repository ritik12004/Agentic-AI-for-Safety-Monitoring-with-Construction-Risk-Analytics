
import pytest

from site_risk_agent import run_site_risk_agent


def test_agent_returns_combined_risk():
    result = run_site_risk_agent(
        [],
        {"rainfall_mm": 25},
    )

    assert result["agent"] == "Site Risk Agent"
    assert result["environmental_analysis"]["data_provided"] is True
    assert len(result["environmental_analysis"]["findings"]) == 1
    assert result["combined_risk"]["risk_score"] == 20


def test_agent_without_environmental_data():
    result = run_site_risk_agent([])

    assert result["environmental_analysis"]["data_provided"] is False
    assert result["environmental_analysis"]["findings"] == []
    assert result["combined_risk"]["risk_score"] == 0


def test_high_wind_generates_finding():
    result = run_site_risk_agent(
        [],
        {"wind_speed_kmh": 45},
    )

    findings = result["environmental_analysis"]["findings"]
    assert len(findings) == 1
    assert "wind" in findings[0]["risk"].lower()


def test_negative_rainfall_is_rejected():
    with pytest.raises(ValueError):
        run_site_risk_agent([], {"rainfall_mm": -1})
