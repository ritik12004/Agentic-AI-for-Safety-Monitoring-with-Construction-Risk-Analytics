
from pathlib import Path
from typing import TypedDict

from langgraph.graph import StateGraph, START, END

from safety_file import run_safety_agent


# ---------------- Project Path ----------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent


# ---------------- Safety Graph State ----------------

class SafetyState(TypedDict, total=False):
    detections: list
    findings: list
    safety_result: dict
    decision: str


# ---------------- Analyze Safety ----------------

def analyze_safety(state: SafetyState):
    """
    Analyze YOLOv8 detections using the existing Safety Agent.
    """

    result = run_safety_agent(state.get("detections", []))

    return {
        "safety_result": result,
        "findings": result["events"],
    }


# ---------------- Conditional Router ----------------

def decide_route(state: SafetyState):
    """
    Route the workflow based on detected safety findings.
    """

    if state.get("findings"):
        return "alert"

    return "no_finding"


# ---------------- Review Action ----------------

def create_review_state(state: SafetyState):
    """
    Mark detected PPE findings for human review.
    """

    print("Review alert required")

    return {
        "decision": "pending_safety_review"
    }


# ---------------- No Finding Action ----------------

def record_no_finding(state: SafetyState):
    """
    Record that no PPE violation was detected.
    """

    print("No PPE violation detected")

    return {
        "decision": "no_violation_detected"
    }


# ---------------- Build Safety Graph ----------------

workflow = StateGraph(SafetyState)

workflow.add_node("analyze_safety", analyze_safety)
workflow.add_node("create_review_state", create_review_state)
workflow.add_node("record_no_finding", record_no_finding)

workflow.add_edge(START, "analyze_safety")

workflow.add_conditional_edges(
    "analyze_safety",
    decide_route,
    {
        "alert": "create_review_state",
        "no_finding": "record_no_finding",
    },
)

workflow.add_edge("create_review_state", END)
workflow.add_edge("record_no_finding", END)

safety_graph = workflow.compile()


# ---------------- Run Workflow ----------------

def run_safety_graph(detections: list):
    """
    Run detections through the Day 3 conditional safety graph.
    """

    if not isinstance(detections, list):
        raise ValueError("Detections must be provided as a list.")

    return safety_graph.invoke({
        "detections": detections
    })
