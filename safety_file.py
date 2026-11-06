
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import TypedDict
from uuid import uuid4

from langgraph.graph import StateGraph, START, END


MISSING_PPE_CLASSES = {
    "NO-Hardhat": "Possible missing hardhat",
    "NO-Safety Vest": "Possible missing safety vest",
    "NO-Mask": "Possible missing mask",
}

CONFIDENCE_THRESHOLD = 0.25


# ---------------- Safety Agent ----------------

def run_safety_agent(detections):
    """
    Reviews YOLOv8 detections and generates
    possible PPE violation events and alerts.
    """

    if not isinstance(detections, list):
        raise ValueError("Detections must be provided as a list.")

    events = []
    alerts = []

    for item in detections:
        if not isinstance(item, Mapping):
            raise ValueError("Each detection must be a dictionary.")

        label = item.get("class")
        confidence = item.get("confidence", 0)

        if not isinstance(label, str):
            raise ValueError("Each detection must include a class name.")

        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, (int, float))
            or not 0 <= confidence <= 1
        ):
            raise ValueError(
                "Detection confidence must be between 0 and 1."
            )

        if confidence < CONFIDENCE_THRESHOLD:
            continue

        if label not in MISSING_PPE_CLASSES:
            continue

        event_id = str(uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        event = {
            "event_id": event_id,
            "event_type": "ppe_violation",
            "class": label,
            "message": MISSING_PPE_CLASSES[label],
            "confidence": round(float(confidence), 3),
            "timestamp": timestamp,
            "requires_human_review": True,
        }

        alert = {
            "alert_id": str(uuid4()),
            "event_id": event_id,
            "message": MISSING_PPE_CLASSES[label],
            "status": "Open",
            "timestamp": timestamp,
            "requires_human_review": True,
        }

        events.append(event)
        alerts.append(alert)

    return {
        "agent": "Safety Agent",
        "status": "completed",
        "total_events": len(events),
        "total_alerts": len(alerts),
        "events": events,
        "alerts": alerts,
        "analytics": {
            "ppe_violations": len(events),
            "open_alerts": len(alerts),
        },
        "note": (
            "These are prototype PPE alerts based on detected labels. "
            "They do not identify individual workers or confirm an actual "
            "violation. Human review is required."
        ),
    }


# ---------------- LangGraph State ----------------

class SafetyState(TypedDict, total=False):
    detections: list
    safety_result: dict
    alert_required: bool
    decision: str


# ---------------- LangGraph Nodes ----------------

def analyze_safety(state: SafetyState):
    """Run the Safety Agent on YOLOv8 detections."""

    result = run_safety_agent(state["detections"])

    return {
        "safety_result": result,
        "alert_required": result["total_alerts"] > 0,
    }


def generate_alert(state: SafetyState):
    """Select the alert-required outcome."""

    return {
        "decision": "alert_required",
    }


def no_alert(state: SafetyState):
    """Select the no-alert outcome."""

    return {
        "decision": "no_alert",
    }


# ---------------- Conditional Routing ----------------

def route_safety(state: SafetyState):
    """Choose the next node based on PPE detection results."""

    if state.get("alert_required", False):
        return "generate_alert"

    return "no_alert"


# ---------------- Build LangGraph ----------------

workflow = StateGraph(SafetyState)

workflow.add_node("analyze_safety", analyze_safety)
workflow.add_node("generate_alert", generate_alert)
workflow.add_node("no_alert", no_alert)

workflow.add_edge(START, "analyze_safety")

workflow.add_conditional_edges(
    "analyze_safety",
    route_safety,
    {
        "generate_alert": "generate_alert",
        "no_alert": "no_alert",
    },
)

workflow.add_edge("generate_alert", END)
workflow.add_edge("no_alert", END)

safety_graph = workflow.compile()


# ---------------- Run Safety Workflow ----------------

def run_safety_workflow(detections):
    """
    Runs YOLOv8 detection results through the Safety Agent
    and LangGraph conditional routing.
    """

    if not isinstance(detections, list):
        raise ValueError("Detections must be provided as a list.")

    return safety_graph.invoke({
        "detections": detections,
    })
