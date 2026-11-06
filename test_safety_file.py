
import unittest

from safety_file import run_safety_agent, run_safety_workflow


class TestSafetyAgent(unittest.TestCase):

    def test_ppe_violation_generates_alert(self):
        detections = [
            {
                "class": "NO-Hardhat",
                "confidence": 0.92,
            }
        ]

        result = run_safety_agent(detections)

        self.assertEqual(result["total_events"], 1)
        self.assertEqual(result["total_alerts"], 1)
        self.assertEqual(
            result["events"][0]["event_type"],
            "ppe_violation",
        )
        self.assertEqual(result["alerts"][0]["status"], "Open")

    def test_multiple_ppe_violations(self):
        detections = [
            {"class": "NO-Hardhat", "confidence": 0.90},
            {"class": "NO-Safety Vest", "confidence": 0.85},
        ]

        result = run_safety_agent(detections)

        self.assertEqual(result["total_events"], 2)
        self.assertEqual(result["total_alerts"], 2)

    def test_normal_detection_generates_no_alert(self):
        detections = [
            {"class": "Hardhat", "confidence": 0.95},
            {"class": "Safety Vest", "confidence": 0.90},
        ]

        result = run_safety_agent(detections)

        self.assertEqual(result["total_events"], 0)
        self.assertEqual(result["total_alerts"], 0)

    def test_low_confidence_detection_is_ignored(self):
        detections = [
            {"class": "NO-Hardhat", "confidence": 0.15},
        ]

        result = run_safety_agent(detections)

        self.assertEqual(result["total_events"], 0)

    def test_invalid_detection_input(self):
        with self.assertRaises(ValueError):
            run_safety_agent("invalid input")

    def test_invalid_confidence(self):
        detections = [
            {"class": "NO-Hardhat", "confidence": 1.5},
        ]

        with self.assertRaises(ValueError):
            run_safety_agent(detections)

    # -------- LangGraph Conditional Routing Tests --------

    def test_langgraph_routes_ppe_violation_to_alert(self):
        detections = [
            {"class": "NO-Hardhat", "confidence": 0.92}
        ]

        result = run_safety_workflow(detections)

        self.assertTrue(result["alert_required"])
        self.assertEqual(result["decision"], "alert_required")

    def test_langgraph_routes_normal_detection_to_no_alert(self):
        detections = [
            {"class": "Hardhat", "confidence": 0.95},
            {"class": "Safety Vest", "confidence": 0.90},
        ]

        result = run_safety_workflow(detections)

        self.assertFalse(result["alert_required"])
        self.assertEqual(result["decision"], "no_alert")


if __name__ == "__main__":
    unittest.main()
