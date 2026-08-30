"""Request/response schemas for the stateless TravelGenie AI API (V2)."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class TripRequest(BaseModel):
    """Incoming trip-planning request (stateless — nothing is stored)."""

    starting_city: str = Field(..., min_length=1, description="Origin city")
    budget: float = Field(..., gt=0, description="Total budget in INR")
    days: int = Field(..., ge=1, le=30, description="Trip duration in days")
    travelers: int = Field(default=2, ge=1, le=20)
    interests: List[str] = Field(default=["Nature"])
    destination: Optional[str] = Field(default=None, description="Optional fixed destination")
    preferred_travel_mode: Optional[str] = None

    @field_validator("starting_city")
    @classmethod
    def city_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("starting_city cannot be empty")
        return v.strip()

    @field_validator("interests", mode="before")
    @classmethod
    def interests_not_empty(cls, v):
        if isinstance(v, str):
            v = [i.strip() for i in v.split(",") if i.strip()]
        if not v:
            raise ValueError("At least one interest is required")
        return v


class TripPlanResponse(BaseModel):
    """V2 dashboard payload (open-ended for live-data flexibility)."""

    model_config = {"extra": "allow"}

    status: str = "ok"
    hero: Dict[str, Any] = Field(default_factory=dict)
    overview: Dict[str, Any] = Field(default_factory=dict)
    transport: List[Dict[str, Any]] = Field(default_factory=list)
    hotels: List[Dict[str, Any]] = Field(default_factory=list)
    itinerary: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: Dict[str, List[str]] = Field(default_factory=dict)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)