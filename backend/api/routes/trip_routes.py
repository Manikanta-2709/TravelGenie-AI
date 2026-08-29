import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status

from backend.schemas.trip_schema import PlanTripRequest, PlanTripResponse
from backend.workflows.travel_workflow import TravelWorkflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Travel Planning"])
travel_workflow = TravelWorkflow()


@router.post(
    "/plan-trip",
    response_model=PlanTripResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a complete travel plan",
    description=(
        "Runs the LangGraph travel workflow to recommend a destination, "
        "estimate the budget, analyze weather, and create an itinerary."
    ),
    response_description="The generated destination, budget, weather, and itinerary.",
)
def plan_trip(request: PlanTripRequest) -> PlanTripResponse:
    """Execute the travel workflow for the supplied trip preferences."""
    try:
        workflow_result: Dict[str, Any] = travel_workflow.run(request.model_dump())
        if not workflow_result:
            raise RuntimeError("Travel workflow returned an empty response.")
        return PlanTripResponse.model_validate(workflow_result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to generate travel plan")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate a travel plan at this time.",
        ) from exc
