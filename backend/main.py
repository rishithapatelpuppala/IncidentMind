"""
IncidentMind - AI Incident Response Agent
FastAPI backend with Hindsight persistent memory and Groq LLM.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import IncidentCreate, IncidentAnalysis, ResolutionSubmit
from services import incident

load_dotenv()

app = FastAPI(
    title="IncidentMind",
    description="AI Incident Response Agent with persistent memory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": "IncidentMind",
        "status": "running",
        "memory": incident.memory_stats(),
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "IncidentMind"
    }

@app.post("/api/incidents/analyze", response_model=IncidentAnalysis)
def analyze_incident_endpoint(data: IncidentCreate):
    """Submit an incident for AI analysis with memory retrieval."""
    try:
        return incident.process_incident(data)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/incidents/resolve")
def resolve_incident_endpoint(data: ResolutionSubmit):
    """Submit resolution to store in Hindsight memory."""
    return incident.submit_resolution(data)


@app.get("/api/incidents/{incident_id}")
def get_incident_endpoint(incident_id: str):
    result = incident.get_incident(incident_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return result


@app.get("/api/incidents")
def list_incidents_endpoint(limit: int = 50):
    return incident.list_incidents(limit)


@app.get("/api/memory/stats")
def memory_stats_endpoint():
    return incident.memory_stats()
