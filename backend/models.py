from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Short incident title")
    description: str = Field(..., min_length=10, description="Detailed incident description")
    service: Optional[str] = Field(None, description="Affected service name")
    environment: Optional[str] = Field(None, description="Environment (prod, staging, etc.)")
    error: Optional[str] = Field(None, description="Error message or code")
    symptoms: Optional[str] = Field(None, description="Observed symptoms")


class IncidentAnalysis(BaseModel):
    incident_id: str
    service: str
    environment: str
    error: str
    symptoms: str
    similar_incidents: list[dict]
    likely_root_cause: str
    recommended_resolution: str
    relevant_runbook: str
    created_at: datetime


class ResolutionSubmit(BaseModel):
    incident_id: str
    root_cause: str = Field(..., min_length=5)
    resolution: str = Field(..., min_length=5)
    resolved: bool = True


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    service: str
    environment: str
    error: str
    symptoms: str
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    resolved: bool = False
    created_at: datetime
    resolved_at: Optional[datetime] = None
