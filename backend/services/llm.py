"""
Groq LLM Service

Sends incident context + historical memories to Groq
and parses structured analysis results.
"""

import json
import os

from dotenv import load_dotenv
from groq import Groq


# =========================================================
# Load backend/.env
# =========================================================

ENV_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    ".env"
)

load_dotenv(ENV_PATH)


# =========================================================
# System Prompt
# =========================================================

SYSTEM_PROMPT = """You are an expert SRE incident response agent called IncidentMind.
You analyze production incidents and provide structured root cause analysis.

You will receive:
1. The current incident details
2. Similar past incidents from memory (if any)

You MUST respond with valid JSON in this exact format:
{
  "service": "identified service name",
  "environment": "identified environment",
  "error": "identified error or error pattern",
  "symptoms": "identified symptoms summary",
  "likely_root_cause": "detailed root cause analysis",
  "recommended_resolution": "step-by-step resolution recommendation",
  "relevant_runbook": "relevant runbook name or link, or 'none'"
}

Be specific and actionable.

Use the historical incidents to inform your analysis.

If similar incidents were resolved before, reference their
root causes and resolutions.

Do not invent historical incidents.
Only use the provided memory context as historical evidence.
"""


# =========================================================
# Groq Client
# =========================================================

def _get_client() -> Groq:
    """
    Create a Groq client using GROQ_API_KEY from backend/.env.
    """

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY environment variable not set. "
            "Add GROQ_API_KEY to backend/.env"
        )

    return Groq(api_key=api_key)


# =========================================================
# Analyze Incident
# =========================================================

def analyze_incident(
    title: str,
    description: str,
    service: str,
    environment: str,
    error: str,
    symptoms: str,
    similar_incidents: list[dict],
) -> dict:
    """
    Send the current incident and Hindsight memories
    to Groq and return structured analysis.
    """

    client = _get_client()

    # -----------------------------------------------------
    # Current incident
    # -----------------------------------------------------

    incident_block = f"""
CURRENT INCIDENT:

Title:
{title}

Description:
{description}

Service:
{service or 'unknown'}

Environment:
{environment or 'unknown'}

Error:
{error or 'unknown'}

Symptoms:
{symptoms or 'unknown'}
""".strip()

    # -----------------------------------------------------
    # Historical Hindsight memories
    # -----------------------------------------------------

    if similar_incidents:

        memories_block = """
SIMILAR PAST INCIDENTS FROM HINDSIGHT MEMORY:
"""

        for i, inc in enumerate(similar_incidents, 1):

            memories_block += f"""

--- Historical Memory {i} ---

Memory Source:
{inc.get('memory_source', 'Hindsight')}

Memory Type:
{inc.get('memory_type', 'experience')}

Similarity:
{inc.get('similarity', 'N/A')}

Title:
{inc.get('title', 'N/A')}

Service:
{inc.get('service', 'N/A')}

Environment:
{inc.get('environment', 'N/A')}

Error:
{inc.get('error', 'N/A')}

Symptoms:
{inc.get('symptoms', 'N/A')}

Root Cause:
{inc.get('root_cause', 'N/A')}

Resolution:
{inc.get('resolution', 'N/A')}

"""

    else:

        memories_block = """
SIMILAR PAST INCIDENTS FROM HINDSIGHT MEMORY:

No similar past incidents were found.
"""

    # -----------------------------------------------------
    # Final prompt
    # -----------------------------------------------------

    user_prompt = (
        incident_block +
        "\n\n" +
        memories_block
    )

    # -----------------------------------------------------
    # Call Groq
    # -----------------------------------------------------

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
        temperature=0.3,
        max_tokens=2048,
        response_format={
            "type": "json_object"
        },
    )

    # -----------------------------------------------------
    # Parse response
    # -----------------------------------------------------

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            "Groq returned an empty response."
        )

    result = json.loads(content)

    # -----------------------------------------------------
    # Ensure required fields exist
    # -----------------------------------------------------

    required_fields = [
        "service",
        "environment",
        "error",
        "symptoms",
        "likely_root_cause",
        "recommended_resolution",
        "relevant_runbook",
    ]

    for field in required_fields:

        if field not in result:
            result[field] = "unknown"

    return result