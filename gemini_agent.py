
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

MODEL_NAME = "gemini-3-flash-preview"


def generate_safety_explanation(
    detections,
    risk_analysis=None,
    environmental_data=None,
):
    """
    Generate an AI explanation of construction-site
    detections and risk findings.

    YOLO and the existing risk engine remain the
    source of detection and risk scores.
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return {
            "status": "unavailable",
            "explanation": (
                "Gemini API key is not configured. "
                "Please check the .env file."
            ),
            "recommendations": [],
        }

    if not isinstance(detections, list):
        return {
            "status": "error",
            "explanation": "Invalid detection data.",
            "recommendations": [],
        }

    prompt = f"""
You are an assistant for a construction-site safety
monitoring prototype.

Analyze the supplied information and explain possible
safety concerns in simple English.

Detections from the YOLO model:
{detections}

Existing risk analysis:
{risk_analysis}

Environmental information:
{environmental_data}

Instructions:
1. Explain only concerns supported by the supplied data.
2. Suggest practical actions for a site supervisor.
3. Do not invent detections or claim that a hazard is confirmed.
4. A detected object alone does not prove a safety violation.
5. Do not change or recalculate the existing risk score.
6. Clearly mention when the available information is insufficient.
7. Keep the explanation concise.

Return:
- explanation: a short paragraph
- recommendations: a list of practical actions
- limitations: what cannot be confirmed from the supplied data
"""

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        explanation = response.text

        if not explanation:
            return {
                "status": "unavailable",
                "explanation": (
                    "Gemini returned no text. "
                    "Please try again later."
                ),
                "recommendations": [],
            }

        return {
            "status": "success",
            "explanation": explanation,
            "recommendations": [],
        }

    except Exception:
        # Do not expose API keys or internal error details.
        return {
            "status": "unavailable",
            "explanation": (
                "AI explanation is temporarily unavailable. "
                "Use the existing risk analysis for now."
            ),
            "recommendations": [],
        }
