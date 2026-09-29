"""
Incident Service

Orchestrates the incident analysis pipeline:
1. Store incoming incident
2. Search Hindsight memory for similar incidents
3. Send to LLM for analysis
4. Return structured results
"""

import uuid
from datetime import datetime
from typing import Optional

from models import IncidentCreate, IncidentAnalysis, ResolutionSubmit
from services import memory
from services.llm import analyze_incident


def process_incident(data: IncidentCreate) -> IncidentAnalysis:
    """Process a new incident through the full pipeline."""

    incident_id = str(uuid.uuid4())[:8]

    # Step 1: Store the incident
    memory.store_incident(
        incident_id=incident_id,
        title=data.title,
        description=data.description,
        service=data.service or "",
        environment=data.environment or "",
        error=data.error or "",
        symptoms=data.symptoms or "",
    )

    # Step 2: Search Hindsight memory for similar resolved incidents
    similar = memory.find_similar(
        service=data.service or "",
        environment=data.environment or "",
        error=data.error or "",
        symptoms=data.symptoms or "",
        title=data.title,
        description=data.description,
        top_k=5,
    )

    # Step 3: Send to LLM with incident + memories
    analysis = analyze_incident(
        title=data.title,
        description=data.description,
        service=data.service or "",
        environment=data.environment or "",
        error=data.error or "",
        symptoms=data.symptoms or "",
        similar_incidents=similar,
    )

    # Step 4: Return structured analysis
    return IncidentAnalysis(
        incident_id=incident_id,
        service=analysis["service"],
        environment=analysis["environment"],
        error=analysis["error"],
        symptoms=analysis["symptoms"],
        similar_incidents=similar,
        likely_root_cause=analysis["likely_root_cause"],
        recommended_resolution=analysis["recommended_resolution"],
        relevant_runbook=analysis["relevant_runbook"],
        created_at=datetime.utcnow(),
    )


def submit_resolution(data: ResolutionSubmit) -> dict:
    """Store the resolution in Hindsight memory."""
    memory.store_resolution(
        incident_id=data.incident_id,
        root_cause=data.root_cause,
        resolution=data.resolution,
    )
    return {"status": "stored", "incident_id": data.incident_id}


def get_incident(incident_id: str) -> Optional[dict]:
    return memory.get_incident(incident_id)


def list_incidents(limit: int = 50) -> list[dict]:
    return memory.get_all_incidents(limit)


def memory_stats() -> dict:
    return {
        "resolved_incidents": memory.get_resolved_count(),
        "message": "Hindsight memory is active. Resolved incidents are stored and retrieved for future analysis."
    }
