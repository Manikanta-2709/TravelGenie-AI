import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.db import get_db
from backend.database.models import TravelPlan
from backend.schemas.trip_schema import (
    PlanTripRequest,
    PlanTripResponse,
    TripDetailResponse,
    TripHistoryItem,
)
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
        "estimate the budget, analyze weather, and create an itinerary, then persists the result in SQLite."
    ),
    response_description="The generated destination, budget, weather, and itinerary.",
)
def plan_trip(
    request: PlanTripRequest,
    db: Session = Depends(get_db),
) -> PlanTripResponse:
    """Execute the travel workflow and save the result to SQLite."""
    try:
        req_dict = request.model_dump()
        logger.info("Executing travel workflow for starting_city=%s", req_dict.get("starting_city"))
        
        workflow_result: Dict[str, Any] = travel_workflow.run(req_dict)
        if not workflow_result:
            raise RuntimeError("Travel workflow returned an empty response.")

        # Save generated plan to SQLite database
        dest_name = workflow_result.get("destination", "Coorg")
        dest_reason = workflow_result.get("destination_reason", "Recommended destination")
        weather_str = workflow_result.get("weather", "21°C, Pleasant")
        tips_str = workflow_result.get("tips", "Carry light clothing and comfortable walking shoes.")
        route_data = workflow_result.get("route")
        itinerary_data = workflow_result.get("itinerary", [])

        db_plan = TravelPlan(
            starting_city=request.starting_city,
            budget=request.budget,
            days=request.days,
            interests=request.interests,
            travelers=request.travelers,
            destination=dest_name,
            destination_reason=dest_reason,
            weather=weather_str,
            tips=tips_str,
            route=route_data,
            itinerary=itinerary_data,
        )

        try:
            db.add(db_plan)
            db.commit()
            db.refresh(db_plan)
            logger.info("Saved travel plan to DB with ID=%s", db_plan.id)
            workflow_result["id"] = db_plan.id
        except Exception as db_exc:
            db.rollback()
            logger.exception("Database commit failed for travel plan")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error occurred while saving travel plan.",
            ) from db_exc

        return PlanTripResponse.model_validate(workflow_result)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to generate travel plan")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate a travel plan at this time.",
        ) from exc


@router.get(
    "/history",
    response_model=List[TripHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get previously generated travel plans",
    description="Returns a list of saved travel plans from SQLite history.",
)
def get_history(db: Session = Depends(get_db)) -> List[TripHistoryItem]:
    """Retrieve history of saved travel plans."""
    try:
        plans = db.query(TravelPlan).order_by(TravelPlan.created_at.desc()).all()
        result = []
        for plan in plans:
            result.append(
                TripHistoryItem(
                    id=plan.id,
                    starting_city=plan.starting_city,
                    destination=plan.destination,
                    budget=plan.budget,
                    days=plan.days,
                    travelers=plan.travelers,
                    created_at=plan.created_at.isoformat() if plan.created_at else None,
                )
            )
        return result
    except Exception as exc:
        logger.exception("Failed to fetch travel history")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve travel plan history.",
        ) from exc


@router.get(
    "/trip/{trip_id}",
    response_model=TripDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get details of a specific saved travel plan",
    description="Returns the complete travel plan for a given trip ID.",
)
def get_trip_by_id(
    trip_id: int,
    db: Session = Depends(get_db),
) -> TripDetailResponse:
    """Retrieve a single travel plan by ID."""
    plan = db.query(TravelPlan).filter(TravelPlan.id == trip_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Travel plan with ID {trip_id} not found.",
        )

    formatted_budget = f"₹{int(plan.budget):,}"
    
    return TripDetailResponse(
        id=plan.id,
        starting_city=plan.starting_city,
        destination=plan.destination,
        destination_reason=plan.destination_reason,
        budget=formatted_budget,
        days=plan.days,
        travelers=plan.travelers,
        interests=plan.interests if isinstance(plan.interests, list) else [str(plan.interests)],
        weather=plan.weather,
        tips=plan.tips,
        route=plan.route,
        itinerary=plan.itinerary,
        status="complete",
        warnings=[],
        created_at=plan.created_at.isoformat() if plan.created_at else None,
    )
