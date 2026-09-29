import json
import os
from pathlib import Path

from dotenv import load_dotenv
from hindsight_client import Hindsight


# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------

load_dotenv("backend/.env")

API_KEY = os.getenv("HINDSIGHT_API_KEY")
BASE_URL = os.getenv(
    "HINDSIGHT_BASE_URL",
    "https://api.hindsight.vectorize.io"
)
BANK_ID = os.getenv("HINDSIGHT_BANK_ID")

if not API_KEY:
    raise RuntimeError(
        "HINDSIGHT_API_KEY is missing from backend/.env"
    )

if not BANK_ID:
    raise RuntimeError(
        "HINDSIGHT_BANK_ID is missing from backend/.env"
    )


# ---------------------------------------------------------
# Load incident dataset
# ---------------------------------------------------------

DATA_FILE = Path(__file__).parent / "data" / "incidents.json"

with open(DATA_FILE, "r", encoding="utf-8") as file:
    incidents = json.load(file)

print(f"Found {len(incidents)} incidents.")
print(f"Loading into Hindsight memory bank: {BANK_ID}")
print()


# ---------------------------------------------------------
# Create Hindsight client
# ---------------------------------------------------------

client = Hindsight(
    base_url=BASE_URL,
    api_key=API_KEY,
)


# ---------------------------------------------------------
# Prepare batch
# ---------------------------------------------------------

items = []

for incident in incidents:

    memory = f"""
Production incident:

Incident ID: {incident["id"]}
Title: {incident["title"]}

Service: {incident["service"]}
Environment: {incident["environment"]}

Description:
{incident["description"]}

Error:
{incident["error"]}

Symptoms:
{incident["symptoms"]}

Root cause:
{incident["root_cause"]}

Resolution:
{incident["resolution"]}

Runbook:
{incident["runbook"]}

This is a historical production incident that was successfully
resolved. Future incident analysis should use this experience
when similar errors, symptoms, services, root causes, or
operational patterns appear.
""".strip()

    items.append(
        {
            "content": memory,
            "document_id": incident["id"],
            "context": "Historical production incident for IncidentMind",
            "metadata": {
                "incident_id": incident["id"],
                "service": incident["service"],
                "environment": incident["environment"],
            },
        }
    )


# ---------------------------------------------------------
# Send batch to Hindsight
# ---------------------------------------------------------

try:

    print("Sending incident batch to Hindsight...")

    result = client.retain_batch(
        bank_id=BANK_ID,
        items=items,
    )

    print()
    print("====================================")
    print("Incident memory loading complete.")
    print("====================================")
    print()
    print(f"Items processed: {len(items)}")
    print(f"Hindsight response: {result}")

finally:

    client.close()
    print()
    print("Hindsight client closed.")