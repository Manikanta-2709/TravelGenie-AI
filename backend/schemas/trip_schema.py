from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, field_validator


class PlanTripRequest(BaseModel):
    """Input parameters used to generate a complete travel plan from the frontend."""

    model_config = ConfigDict(extra="ignore")

    starting_city: str = Field(..., examples=["Hyderabad"], description="Starting city or origin")
    destination: Optional[str] = Field(None, examples=["Goa"], description="Optional destination city if specified by user")
    budget: float = Field(..., gt=0, examples=[15000], description="Total trip budget")
    days: int = Field(..., ge=1, le=30, examples=[3], description="Trip duration in days (1-30)")
    travelers: int = Field(..., ge=1, examples=[2], description="Number of travelers")
    interests: List[str] = Field(
        ...,
        min_length=1,
        examples=[["Nature", "Food"]],
        description="One or more travel interests",
    )

    @field_validator("starting_city")
    @classmethod
    def validate_starting_city(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("starting_city cannot be empty or blank")
        return s

    @field_validator("interests")
    @classmethod
    def validate_interests(cls, v: List[str]) -> List[str]:
        cleaned = [item.strip() for item in v if isinstance(item, str) and item.strip()]
        if not cleaned:
            raise ValueError("interests must contain at least one non-empty string")
        return cleaned


class ItineraryItem(BaseModel):
    day: int = Field(..., ge=1)
    title: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class RouteInfo(BaseModel):
    origin: str = Field(..., examples=["Hyderabad"])
    destination: str = Field(..., examples=["Coorg"])
    recommended_mode: str = Field(..., examples=["Express Train / Scenic Drive"])
    estimated_distance: str = Field(..., examples=["approx. 320 km"])
    estimated_duration: str = Field(..., examples=["approx. 6 hours"])
    transit_cost: str = Field(..., examples=["₹2,250"])
    journey_highlights: List[str] = Field(default_factory=list)
    route_tip: str = Field(..., examples=["Book an early morning express train."])


class PlanTripResponse(BaseModel):
    """Final response schema returned to the frontend."""

    id: Optional[int] = None
    destination: str = Field(..., examples=["Coorg"])
    destination_reason: Optional[str] = None
    budget: Union[str, float] = Field(..., examples=["₹15,000"])
    weather: str = Field(..., examples=["21°C, Misty & Pleasant"])
    tips: str = Field(..., examples=["Carry a light jacket and comfortable walking shoes."])
    route: Optional[RouteInfo] = None
    itinerary: List[ItineraryItem]
    status: Optional[str] = "complete"
    warnings: Optional[List[str]] = Field(default_factory=list)


class TripHistoryItem(BaseModel):
    """Summary representation of a travel plan for history listing."""

    id: int
    starting_city: str
    destination: str
    budget: float
    days: int
    travelers: int
    created_at: Optional[str] = None


class TripDetailResponse(PlanTripResponse):
    """Detailed travel plan response including database metadata."""

    starting_city: str
    days: int
    travelers: int
    interests: List[str]
    created_at: Optional[str] = None
