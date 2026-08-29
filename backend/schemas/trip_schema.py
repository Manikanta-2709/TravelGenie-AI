from typing import Dict, Literal

from pydantic import BaseModel, ConfigDict, Field


class PlanTripRequest(BaseModel):
    """Input parameters used to generate a complete travel plan."""

    model_config = ConfigDict(extra="forbid")

    source: str = Field(..., min_length=1, examples=["Hyderabad"], description="Starting city or origin")
    destination: str = Field(..., min_length=1, examples=["Coorg"], description="Requested destination")
    budget: float = Field(..., gt=0, examples=[15000])
    days: int = Field(..., gt=0, le=10, examples=[3], description="Trip duration in days (1-10)")
    travelers: int = Field(..., gt=0, examples=[2])
    interests: list[str] = Field(
        ...,
        min_length=1,
        examples=[["Nature", "Food"]],
        description="One or more travel interests",
    )


class DestinationResponse(BaseModel):
    name: str = Field(..., examples=["Araku Valley, Andhra Pradesh"])
    reason: str


class BudgetResponse(BaseModel):
    travel: float = Field(..., ge=0)
    stay: float = Field(..., ge=0)
    food: float = Field(..., ge=0)
    activities: float = Field(..., ge=0)
    total: float = Field(..., ge=0)


class WeatherResponse(BaseModel):
    temperature: str
    condition: str
    humidity: str
    advice: str


class DayPlan(BaseModel):
    morning: str = ""
    afternoon: str = ""
    evening: str = ""


class ItineraryResponse(BaseModel):
    day1: DayPlan = Field(default_factory=DayPlan)
    day2: DayPlan = Field(default_factory=DayPlan)
    day3: DayPlan = Field(default_factory=DayPlan)


class PlanTripResponse(BaseModel):
    """Final response returned by the travel planning workflow."""

    status: Literal["complete", "degraded"] = "complete"
    destination: DestinationResponse
    budget: BudgetResponse
    weather: WeatherResponse
    itinerary: ItineraryResponse
    warnings: list[str] = Field(default_factory=list)
