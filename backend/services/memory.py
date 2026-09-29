"""
Hindsight Memory Service

Persistent memory system for IncidentMind.

SQLite is used for operational incident records.
Hindsight Cloud is the actual AI memory layer used to:
- retain resolved incidents
- recall similar historical incidents
- provide persistent learning across incidents
"""

import sqlite3
import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from hindsight_client import Hindsight


# =========================================================
# Environment
# =========================================================

load_dotenv()

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")

HINDSIGHT_BASE_URL = os.getenv(
    "HINDSIGHT_BASE_URL",
    "https://api.hindsight.vectorize.io"
)

HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID")


if not HINDSIGHT_API_KEY:
    raise RuntimeError(
        "HINDSIGHT_API_KEY is missing. "
        "Add it to backend/.env"
    )

if not HINDSIGHT_BANK_ID:
    raise RuntimeError(
        "HINDSIGHT_BANK_ID is missing. "
        "Add the exact Hindsight memory bank ID to backend/.env"
    )


# =========================================================
# Hindsight Client Helper
# =========================================================

def _get_hindsight_client():
    """
    Create a fresh Hindsight client.

    A fresh client is used for each operation so that
    HTTP sessions are properly closed after the operation.
    """

    return Hindsight(
        base_url=HINDSIGHT_BASE_URL,
        api_key=HINDSIGHT_API_KEY,
    )


# =========================================================
# Local SQLite Database
# =========================================================

DB_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "incidents.db"
)


def _get_db():
    """
    Create/connect to the local SQLite database.
    """

    os.makedirs(
        os.path.dirname(DB_PATH),
        exist_ok=True
    )

    conn = sqlite3.connect(DB_PATH)

    conn.row_factory = sqlite3.Row

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            service TEXT,
            environment TEXT,
            error TEXT,
            symptoms TEXT,
            root_cause TEXT,
            resolution TEXT,
            resolved INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            resolved_at TEXT
        )
        """
    )

    conn.commit()

    return conn


# =========================================================
# Store Incoming Incident
# =========================================================

def store_incident(
    incident_id: str,
    title: str,
    description: str,
    service: str,
    environment: str,
    error: str,
    symptoms: str,
) -> None:

    conn = _get_db()

    try:

        conn.execute(
            """
            INSERT OR REPLACE INTO incidents
            (
                id,
                title,
                description,
                service,
                environment,
                error,
                symptoms,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident_id,
                title,
                description,
                service,
                environment,
                error,
                symptoms,
                datetime.utcnow().isoformat(),
            ),
        )

        conn.commit()

    finally:
        conn.close()


# =========================================================
# Store Resolved Incident in Hindsight
# =========================================================

def store_resolution(
    incident_id: str,
    root_cause: str,
    resolution: str,
) -> None:

    conn = _get_db()

    try:

        row = conn.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

        if row is None:
            raise ValueError(
                f"Incident {incident_id} was not found."
            )

        resolved_at = datetime.utcnow().isoformat()

        # -------------------------------------------------
        # Update local operational database
        # -------------------------------------------------

        conn.execute(
            """
            UPDATE incidents
            SET
                root_cause = ?,
                resolution = ?,
                resolved = 1,
                resolved_at = ?
            WHERE id = ?
            """,
            (
                root_cause,
                resolution,
                resolved_at,
                incident_id,
            ),
        )

        conn.commit()

        # Convert SQLite Row to dictionary before
        # closing the connection.
        incident = dict(row)

    finally:
        conn.close()

    # -----------------------------------------------------
    # Store complete resolved incident in Hindsight.
    #
    # This becomes persistent AI memory.
    # -----------------------------------------------------

    memory_content = f"""
Production incident resolved.

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
{root_cause}

Resolution:
{resolution}

This incident was resolved on {resolved_at}.

When a future incident has similar symptoms,
error patterns, service behavior, or root cause,
use this incident as historical evidence when
recommending a response.
""".strip()

    client = _get_hindsight_client()

    try:

        client.retain(
            bank_id=HINDSIGHT_BANK_ID,
            content=memory_content,
        )

    finally:
        client.close()


# =========================================================
# Find Similar Incidents Using Hindsight Recall
# =========================================================

def find_similar(
    service: str,
    environment: str,
    error: str,
    symptoms: str,
    title: str,
    description: str,
    top_k: int = 5,
) -> list[dict]:

    query = f"""
Find previous production incidents similar to this incident.

Title:
{title}

Description:
{description}

Service:
{service}

Environment:
{environment}

Error:
{error}

Symptoms:
{symptoms}

Identify historical incidents with similar:
- services
- errors
- symptoms
- root causes
- resolutions
- operational patterns
""".strip()

    client = _get_hindsight_client()

    try:

        result = client.recall(
            bank_id=HINDSIGHT_BANK_ID,
            query=query,
            max_tokens=2000,
        )

        similar = []

        for item in result.results:

            text = getattr(
                item,
                "text",
                ""
            )

            memory_type = getattr(
                item,
                "type",
                "experience"
            )

            score = getattr(
                item,
                "score",
                None
            )

            similar.append(
    {
        "id": f"hindsight-{len(similar) + 1}",
        "title": "Historical Incident Memory",

        # Do not label historical memories with the
        # current incident's service/environment.
        "service": "Historical Incident",
        "environment": "Production",

        "error": "",
        "symptoms": "",
        "root_cause": "",
        "resolution": text,

        "similarity": (
            round(score, 3)
            if isinstance(score, (int, float))
            else None
        ),

        "memory_type": memory_type,
        "memory_source": "Hindsight",
    }
)

            # Respect top_k if Hindsight returns many memories.
            if len(similar) >= top_k:
                break

        return similar

    finally:
        client.close()


# =========================================================
# Get One Incident
# =========================================================

def get_incident(
    incident_id: str,
) -> Optional[dict]:

    conn = _get_db()

    try:

        row = conn.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

        if row is None:
            return None

        return dict(row)

    finally:
        conn.close()


# =========================================================
# Get All Incidents
# =========================================================

def get_all_incidents(
    limit: int = 50,
) -> list[dict]:

    conn = _get_db()

    try:

        rows = conn.execute(
            """
            SELECT *
            FROM incidents
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:
        conn.close()


# =========================================================
# Count Resolved Incidents
# =========================================================

def get_resolved_count() -> int:

    conn = _get_db()

    try:

        row = conn.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM incidents
            WHERE resolved = 1
            """
        ).fetchone()

        return row["cnt"] if row else 0

    finally:
        conn.close()


# =========================================================
# Test Hindsight Connection
# =========================================================

def test_hindsight_connection() -> dict:

    test_memory = """
IncidentMind connection test.

Payment Service experienced a temporary database
connection timeout during a production deployment.
The issue was resolved by restarting the service.
""".strip()

    client = _get_hindsight_client()

    try:

        # -------------------------------------------------
        # Test RETAIN
        # -------------------------------------------------

        client.retain(
            bank_id=HINDSIGHT_BANK_ID,
            content=test_memory,
        )

        # -------------------------------------------------
        # Test RECALL
        # -------------------------------------------------

        result = client.recall(
            bank_id=HINDSIGHT_BANK_ID,
            query=(
                "What happened with the Payment Service "
                "database connection timeout?"
            ),
            max_tokens=1000,
        )

        memories = [
            getattr(memory, "text", "")
            for memory in result.results
        ]

        return {
            "status": "connected",
            "bank_id": HINDSIGHT_BANK_ID,
            "memories_found": len(memories),
            "memories": memories,
        }

    except Exception as e:

        return {
            "status": "error",
            "bank_id": HINDSIGHT_BANK_ID,
            "message": str(e),
        }

    finally:

        # -------------------------------------------------
        # IMPORTANT:
        # Always close the Hindsight HTTP client.
        # This prevents:
        #
        # Unclosed client session
        # Unclosed connector
        # -------------------------------------------------

        client.close()