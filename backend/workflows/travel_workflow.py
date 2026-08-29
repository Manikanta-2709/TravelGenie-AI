import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, TypedDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langgraph.graph import END, StateGraph

from backend.agents.budget_agent import BudgetAgent
from backend.agents.destination_agent import DestinationAgent
from backend.agents.itinerary_agent import ItineraryAgent
from backend.agents.weather_agent import WeatherAgent

logger = logging.getLogger(__name__)


class TravelWorkflowState(TypedDict):
    """State passed through the travel planning workflow."""

    source: str
    requested_destination: str
    budget: float
    days: int
    interests: list[str]
    travelers: int
    destination: Dict[str, Any]
    budget_data: Dict[str, Any]
    weather: Dict[str, Any]
    itinerary: Dict[str, Any]
    final_response: Dict[str, Any]
    errors: list[str]


class TravelWorkflow:
    """LangGraph workflow that orchestrates destination, budget, weather, and itinerary agents."""

    def __init__(self) -> None:
        self.destination_agent = DestinationAgent()
        self.budget_agent = BudgetAgent()
        self.weather_agent = WeatherAgent()
        self.itinerary_agent = ItineraryAgent()
        self.workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        workflow = StateGraph(TravelWorkflowState)

        workflow.add_node("destination_agent", self.destination_node)
        workflow.add_node("budget_agent", self.budget_node)
        workflow.add_node("weather_agent", self.weather_node)
        workflow.add_node("itinerary_agent", self.itinerary_node)
        workflow.add_node("final_response", self.final_response_node)

        workflow.set_entry_point("destination_agent")
        workflow.add_edge("destination_agent", "budget_agent")
        workflow.add_edge("budget_agent", "weather_agent")
        workflow.add_edge("weather_agent", "itinerary_agent")
        workflow.add_edge("itinerary_agent", "final_response")
        workflow.add_edge("final_response", END)

        return workflow.compile()

    def destination_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        try:
            state["destination"] = {
                "destination": state["requested_destination"],
                "reason": "User-selected destination.",
            }
            logger.info("Destination agent completed: %s", state["destination"])
            return state
        except Exception as exc:
            logger.exception("Destination node failed")
            state["errors"].append("Destination recommendation used fallback data.")
            state["destination"] = {
                "destination": state["requested_destination"],
                "reason": "Fallback destination recommendation due to agent failure.",
            }
            return state

    def budget_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        try:
            destination_name = state["destination"].get("destination") or state["requested_destination"]
            budget_result = self.budget_agent.calculate_budget(
                {
                    "destination": destination_name,
                    "budget": state["budget"],
                    "days": state["days"],
                    "travelers": state["travelers"],
                }
            )
            state["budget_data"] = budget_result.model_dump()
            logger.info("Budget agent completed: %s", state["budget_data"])
            return state
        except Exception as exc:
            logger.exception("Budget node failed")
            state["errors"].append("Budget estimation used fallback data.")
            state["budget_data"] = {
                "travel": 0,
                "stay": 0,
                "food": 0,
                "activities": 0,
                "total": 0,
            }
            return state

    def weather_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        try:
            destination_name = state["destination"].get("destination") or state["requested_destination"]
            weather_result = self.weather_agent.analyze_weather(destination_name)
            state["weather"] = weather_result
            logger.info("Weather agent completed: %s", state["weather"])
            return state
        except Exception as exc:
            logger.exception("Weather node failed")
            state["errors"].append("Weather analysis used fallback data.")
            state["weather"] = {
                "destination": state["requested_destination"],
                "temperature": "22°C",
                "condition": "Cloudy",
                "humidity": "75%",
                "advice": "Carry a light rain jacket.",
            }
            return state

    def itinerary_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        try:
            destination_name = state["destination"].get("destination") or state["requested_destination"]
            itinerary_result = self.itinerary_agent.generate_itinerary(
                destination=destination_name,
                days=state["days"],
                interest=", ".join(state["interests"]),
            )
            state["itinerary"] = itinerary_result
            logger.info("Itinerary agent completed: %s", state["itinerary"])
            return state
        except Exception as exc:
            logger.exception("Itinerary node failed")
            state["errors"].append("Itinerary generation used fallback data.")
            state["itinerary"] = {
                "day1": {
                    "morning": "Explore local highlights and scenic viewpoints.",
                    "afternoon": "Enjoy a relaxed lunch and an easy walk.",
                    "evening": "Spend a calm evening with local food and sunset views.",
                },
                "day2": {
                    "morning": "Visit a nature trail or lookout point.",
                    "afternoon": "Discover a local attraction and take photos.",
                    "evening": "Relax at a café or scenic spot.",
                },
                "day3": {
                    "morning": "Enjoy a gentle sightseeing session.",
                    "afternoon": "Visit a cultural or natural landmark.",
                    "evening": "Wrap up the trip with a memorable dinner.",
                },
            }
            return state

    def final_response_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        destination_payload = state.get("destination", {})
        budget_payload = state.get("budget_data", {})
        weather_payload = state.get("weather", {})
        itinerary_payload = state.get("itinerary", {})

        final_payload = {
            "status": "degraded" if state["errors"] else "complete",
            "destination": {
                "name": destination_payload.get("destination") or state.get("requested_destination"),
                "reason": destination_payload.get("reason") or "Recommended based on traveler preferences.",
            },
            "budget": {
                "travel": budget_payload.get("travel", 0),
                "stay": budget_payload.get("stay", 0),
                "food": budget_payload.get("food", 0),
                "activities": budget_payload.get("activities", 0),
                "total": budget_payload.get("total", 0),
            },
            "weather": {
                "temperature": weather_payload.get("temperature", "N/A"),
                "condition": weather_payload.get("condition", "N/A"),
                "humidity": weather_payload.get("humidity", "N/A"),
                "advice": weather_payload.get("advice", "Plan according to local conditions."),
            },
            "itinerary": itinerary_payload,
        }
        if state["errors"]:
            final_payload["warnings"] = state["errors"]

        state["final_response"] = final_payload
        logger.info("Final travel response composed: %s", final_payload)
        return state

    def run(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the workflow for a single user input payload."""
        state: TravelWorkflowState = {
            "source": str(user_input.get("source", "Hyderabad")),
            "requested_destination": str(user_input.get("destination", "Coorg")),
            "budget": float(user_input.get("budget", 15000)),
            "days": int(user_input.get("days", 3)),
            "interests": [str(item) for item in user_input.get("interests", ["Nature"])],
            "destination": {},
            "budget_data": {},
            "weather": {},
            "itinerary": {},
            "final_response": {},
            "errors": [],
            "travelers": int(user_input.get("travelers", 1)),
        }

        try:
            result = self.workflow.invoke(state)
            return result.get("final_response", {})
        except Exception as exc:
            logger.exception("Workflow execution failed")
            return {
                "destination": {
                    "name": state["requested_destination"],
                    "reason": "Workflow execution failed; fallback response returned.",
                },
                "budget": {
                    "travel": 0,
                    "stay": 0,
                    "food": 0,
                    "activities": 0,
                    "total": 0,
                },
                "weather": {
                    "temperature": "N/A",
                    "condition": "N/A",
                    "humidity": "N/A",
                    "advice": "Please retry the workflow.",
                },
                "itinerary": {
                    "day1": {},
                    "day2": {},
                    "day3": {},
                },
                "error": str(exc),
            }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    sample_input = {
        "source": "Hyderabad",
        "destination": "Coorg",
        "budget": 15000,
        "days": 3,
        "travelers": 2,
        "interests": ["Nature", "Food"],
    }

    workflow = TravelWorkflow()
    output = workflow.run(sample_input)
    print(json.dumps(output, ensure_ascii=False, indent=2))
