from pydantic import BaseModel, Field
from typing import List, Optional

class ScenarioMetadata(BaseModel):
    hazard_type: str = Field(description="Primary hazard category, e.g., 'tornado', 'chemical spill', 'cyberattack'.")
    location: str = Field(description="Geographic area in plain language.")
    season: Optional[str] = Field(description="Season or weather context if relevant.")
    severity: Optional[str] = Field(description="Qualitative severity such as 'low', 'moderate', 'severe'.")
    assumptions: List[str] = Field(default_factory=list, description="Explicit scenario assumptions the model relied on.")

class ScenarioEvent(BaseModel):
    timestamp: str = Field(description="Relative or absolute timestamp, e.g. 'T+30m' or '2025-02-10 13:00'.")
    description: str = Field(description="Narrative description of what happens at this point.")

class ScenarioNarrative(BaseModel):
    summary: str = Field(description="High-level description of scenario.")
    events: List[ScenarioEvent] = Field(description="Timeline of events from onset to current state.")

class CascadingEffect(BaseModel):
    cause: str = Field(description="Triggering event or failure.")
    effect: str = Field(description="Resulting consequence.")
    impacted_systems: List[str] = Field(description="Critical infrastructure, populations, or services affected.")
    probability: Optional[float] = Field(description="Estimated probability of this cascade, 0–1.")

class ResponseTask(BaseModel):
    task_id: str = Field(description="Stable ID such as 'T1'.")
    description: str = Field(description="Clear task description.")
    owner: Optional[str] = Field(description="Responsible role or agency.")
    estimated_time_minutes: Optional[int] = Field(description="Estimated time to complete.")
    dependencies: List[str] = Field(default_factory=list, description="List of task_ids this task relies on.")

class DraftResponsePlan(BaseModel):
    objectives: List[str] = Field(description="High-level emergency response objectives.")
    tasks: List[ResponseTask] = Field(description="Structured breakdown of tasks.")
    resource_notes: List[str] = Field(description="Key resources needed, constraints, shortages, or warnings.")
    confidence: Optional[float] = Field(description="Model confidence in this plan, 0–1.")
    references: List[str] = Field(default_factory=list, description="Cited source documents from RAG or database.")

class EmergencyScenario(BaseModel):
    metadata: ScenarioMetadata
    narrative: ScenarioNarrative
    cascading_effects: List[CascadingEffect]
    draft_response_plan: DraftResponsePlan
