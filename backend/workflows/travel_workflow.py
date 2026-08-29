import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, TypedDict, Union

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

    starting_city: str
    budget: float
    days: int
    interests: List[str]
    travelers: int
    destination: Dict[str, Any]
    budget_data: Dict[str, Any]
    weather: Dict[str, Any]
    itinerary: Dict[str, Any]
    final_response: Dict[str, Any]
    errors: List[str]


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
        """Node for executing DestinationAgent."""
        # If user explicitly specified a destination in request, respect it
        existing_dest = state.get("destination")
        user_dest = ""
        if isinstance(existing_dest, str) and existing_dest.strip():
            user_dest = existing_dest.strip()
        elif isinstance(existing_dest, dict) and existing_dest.get("destination"):
            user_dest = str(existing_dest["destination"]).strip()

        if user_dest:
            state["destination"] = {
                "destination": user_dest,
                "reason": f"Custom destination selected by traveler departing from {state['starting_city']}.",
            }
            logger.info("Using user-specified destination: %s", user_dest)
            return state

        try:
            interest_str = (
                ", ".join(state["interests"])
                if isinstance(state["interests"], list)
                else str(state["interests"])
            )
            dest_input = {
                "starting_city": state["starting_city"],
                "city": state["starting_city"],
                "budget": state["budget"],
                "days": state["days"],
                "interest": interest_str,
            }
            dest_output = self.destination_agent.get_destination(dest_input)
            state["destination"] = {
                "destination": dest_output.destination,
                "reason": dest_output.reason,
            }
            logger.info("Destination agent completed: %s", state["destination"])
            return state
        except Exception as exc:
            logger.warning("Destination agent failed, using dynamic fallback: %s", exc)
            state["errors"].append("Destination recommendation used fallback data.")
            
            # Select realistic destination based on interests
            interests = [i.lower() for i in state.get("interests", [])]
            fallback_dest = "Coorg"
            fallback_reason = f"Ideal hill station destination for travelers from {state['starting_city']} seeking nature and relaxation."

            if any(i in interests for i in ["beach", "beaches"]):
                fallback_dest = "Goa (South Coast)"
                fallback_reason = "Top coastal beach getaway with vibrant local food and relaxation spots."
            elif any(i in interests for i in ["mountain", "mountains", "adventure"]):
                fallback_dest = "Munnar Hills"
                fallback_reason = "Scenic mountain valley with lush tea estates and trekking trails."
            elif any(i in interests for i in ["history", "culture", "heritage"]):
                fallback_dest = "Jaipur Forts & Palaces"
                fallback_reason = "Rich historical city with iconic architecture, forts, and culture."

            state["destination"] = {
                "destination": fallback_dest,
                "reason": fallback_reason,
            }
            return state

    def budget_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node for executing BudgetAgent."""
        try:
            dest_name = state["destination"].get("destination", "Coorg")
            budget_result = self.budget_agent.calculate_budget(
                {
                    "destination": dest_name,
                    "budget": state["budget"],
                    "days": state["days"],
                    "travelers": state["travelers"],
                }
            )
            state["budget_data"] = budget_result.model_dump()
            logger.info("Budget agent completed: %s", state["budget_data"])
            return state
        except Exception as exc:
            logger.warning("Budget agent failed, using fallback breakdown: %s", exc)
            state["errors"].append("Budget estimation used fallback data.")
            tot = state["budget"]
            state["budget_data"] = {
                "travel": round(tot * 0.20, 2),
                "stay": round(tot * 0.40, 2),
                "food": round(tot * 0.25, 2),
                "activities": round(tot * 0.15, 2),
                "total": tot,
            }
            return state

    def weather_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node for executing WeatherAgent."""
        try:
            dest_name = state["destination"].get("destination", "Coorg")
            weather_result = self.weather_agent.analyze_weather(dest_name)
            state["weather"] = weather_result
            logger.info("Weather agent completed: %s", state["weather"])
            return state
        except Exception as exc:
            logger.warning("Weather agent failed, using fallback weather: %s", exc)
            state["errors"].append("Weather analysis used fallback data.")
            state["weather"] = {
                "destination": state["destination"].get("destination", "Coorg"),
                "temperature": "22°C",
                "condition": "Misty & Pleasant",
                "humidity": "65%",
                "advice": "Pack comfortable walking shoes and a light jacket for cooler evenings.",
            }
            return state

    def itinerary_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node for executing ItineraryAgent."""
        try:
            dest_name = state["destination"].get("destination", "Coorg")
            interest_str = ", ".join(state["interests"]) if isinstance(state["interests"], list) else str(state["interests"])
            itinerary_result = self.itinerary_agent.generate_itinerary(
                destination=dest_name,
                days=state["days"],
                interest=interest_str,
            )
            state["itinerary"] = itinerary_result
            logger.info("Itinerary agent completed: %s", state["itinerary"])
            return state
        except Exception as exc:
            logger.warning("Itinerary agent failed, generating fallback itinerary: %s", exc)
            state["errors"].append("Itinerary generation used fallback data.")
            fallback_dict = {}
            dest_name = state["destination"].get("destination", "Coorg")
            dest_lower = dest_name.lower()

            # Destination-specific realistic landmark database for high quality fallback
            landmark_db = {
                "coorg": [
                    ("08:30 AM - Coffee plantation tour & breakfast at Madikeri", "01:30 PM - Visit Abbey Falls & nature walk", "05:30 PM - Sunset view at Raja's Seat with Coorg filter coffee & Pandi Curry dinner"),
                    ("09:00 AM - Dubare Elephant Camp river rafting", "02:00 PM - Namdroling Monastery (Golden Temple) in Bylakuppe", "06:30 PM - Local spices & honey shopping in Madikeri town"),
                    ("08:00 AM - Morning hike to Mandalpatti Peak viewpoint", "01:00 PM - Traditional Karnataka lunch (Akki Roti & Bamboo shoots)", "05:00 PM - Relaxing evening at coffee estate resort"),
                ],
                "goa": [
                    ("09:00 AM - Relax at Baga & Calangute beaches", "01:30 PM - Goan Fish Thali lunch at a beach shack", "06:00 PM - Sunset drinks at Chapora Fort & Anjuna flea market"),
                    ("08:30 AM - Explore Old Goa churches (Basilica of Bom Jesus)", "01:00 PM - Spice plantation tour with authentic Goan lunch", "05:30 PM - Mandovi River sunset cruise with live cultural dance"),
                    ("09:00 AM - Visit Aguada Fort & lighthouse", "02:00 PM - Water sports at Candolim Beach", "07:00 PM - Seafood dinner & live music in Panaji"),
                ],
                "hampi": [
                    ("08:00 AM - Sunrise at Virupaksha Temple & Hampi Bazaar", "01:00 PM - Lunch at Mango Tree Restaurant with South Indian thali", "05:30 PM - Climb Matanga Hill for panoramic sunset over boulder ruins"),
                    ("08:30 AM - Visit Vijaya Vittala Temple & iconic Stone Chariot", "01:30 PM - Coracle boat ride across Tungabhadra River to Anegundi", "06:00 PM - Explore Royal Enclosure, Lotus Mahal & Elephant Stables"),
                    ("09:00 AM - Sanapur Lake cliff jumping & nature walk", "02:00 PM - Explore Hippie Island cafes & boulder landscapes", "06:30 PM - Farewell dinner overlooking ancient stone temple ruins"),
                ],
                "munnar": [
                    ("08:30 AM - Walk through KDHP Tea Museum & Kannan Devan Tea Gardens", "01:30 PM - Kerala Sadya lunch served on banana leaf", "05:30 PM - Visit Mattupetty Dam & Echo Point lake view"),
                    ("08:00 AM - Trek to Eravikulam National Park to spot Nilgiri Tahr", "01:00 PM - Anamudi Peak vantage point & tea plantation picnic", "06:00 PM - Kathakali dance performance & spice shopping in Munnar market"),
                    ("09:00 AM - Visit Attukad Waterfalls & blossom park", "02:00 PM - Lock Heart Gap viewpoint & photo stop", "06:30 PM - Relaxing Kerala Ayurvedic massage & dinner"),
                ],
                "araku": [
                    ("08:30 AM - Explore million-year-old Borra Caves stalactites", "01:00 PM - Taste famous Araku Valley Bamboo Chicken & Andhra lunch", "05:30 PM - Visit Coffee Museum & sample organic Araku Arabica coffee"),
                    ("09:00 AM - Trek to Katiki Waterfalls & Chaparai water cascades", "02:00 PM - Tribal Museum tour & Dhimsa folk dance performance", "06:00 PM - Sunset at Galikonda View Point"),
                    ("08:30 AM - Ananthagiri Hills tea & coffee plantations walk", "01:30 PM - Local organic berry & spice shopping", "05:30 PM - Evening bonfire at hill resort"),
                ],
                "manali": [
                    ("09:00 AM - Visit ancient Hadimba Devi Temple & Van Vihar pine forest", "01:30 PM - Himachali Siddu & trout fish lunch on Mall Road", "06:00 PM - Shopping & café hopping along Old Manali cobblestone streets"),
                    ("08:00 AM - Excursion to Solang Valley for ropeway & adventure sports", "01:00 PM - Snow activities & mountain view lunch", "05:30 PM - Visit Vashisht hot springs & temple"),
                    ("08:30 AM - Scenic drive towards Rohtang Pass / Atal Tunnel", "02:00 PM - Hike to Jogini Waterfalls near Vashisht", "06:30 PM - Cozy dinner at a riverside wooden cafe"),
                ],
                "jaipur": [
                    ("08:30 AM - Elephant ride & guided tour of Amer Fort", "01:30 PM - Authentic Rajasthani Dal Baati Churma lunch at Laxmi Mishthan Bhandar", "05:30 PM - Photo stop at Hawa Mahal & Jal Mahal sunset view"),
                    ("09:00 AM - Explore City Palace museum & Jantar Mantar observatory", "02:00 PM - Shopping for block print textiles & blue pottery at Johari Bazaar", "06:30 PM - Sunset view from Nahargarh Fort overlooking pink city lights"),
                    ("09:00 AM - Visit Jaigarh Fort & massive Jaivana Cannon", "01:30 PM - Street food tasting (Pyaaz Kachori & Lassi)", "06:00 PM - Cultural evening at Chokhi Dhani village resort"),
                ]
            }

            matched_key = next((k for k in landmark_db if k in dest_lower), None)
            template_days = landmark_db[matched_key] if matched_key else [
                (f"08:30 AM - Morning exploration of iconic landmarks in {dest_name}", f"01:30 PM - Regional lunch featuring local delicacies of {dest_name}", f"05:30 PM - Scenic sunset view and local handicraft market stroll in {dest_name}"),
                (f"09:00 AM - Guided tour of top heritage & natural sites in {dest_name}", f"02:00 PM - Cultural experience and authentic regional cuisine", f"06:00 PM - Evening leisure walk and night street food tasting"),
                (f"08:30 AM - Morning panoramic viewpoint trek in {dest_name}", f"01:30 PM - Souvenir shopping and local café relaxation", f"05:30 PM - Farewell sunset reflection and evening dinner"),
            ]

            for i in range(1, state["days"] + 1):
                day_tuple = template_days[(i - 1) % len(template_days)]
                fallback_dict[f"day{i}"] = {
                    "morning": day_tuple[0],
                    "afternoon": day_tuple[1],
                    "evening": day_tuple[2],
                }

            state["itinerary"] = fallback_dict
            return state

    def final_response_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Compose final response matching frontend contract."""
        dest_payload = state.get("destination", {})
        dest_name = dest_payload.get("destination", "Coorg")
        dest_reason = dest_payload.get("reason", "Recommended destination based on your preferences.")

        weather_payload = state.get("weather", {})
        temp = weather_payload.get("temperature", "22°C")
        cond = weather_payload.get("condition", "Pleasant")
        advice = weather_payload.get("advice", "Carry comfortable walking shoes and light clothing.")
        weather_str = f"{temp}, {cond}" if temp and cond else (temp or cond or "Pleasant")

        # Process itinerary items array for all N days
        num_days = state.get("days", 3)
        itinerary_raw = state.get("itinerary", {})
        itinerary_list = []

        if isinstance(itinerary_raw, dict):
            for i in range(1, num_days + 1):
                day_key = f"day{i}"
                day_info = itinerary_raw.get(day_key, {})
                if isinstance(day_info, dict):
                    morning = day_info.get("morning", "Sightseeing and local discovery.")
                    afternoon = day_info.get("afternoon", "Regional lunch and cultural exploration.")
                    evening = day_info.get("evening", "Relax at sunset viewpoint and local market.")
                    desc = f"Morning: {morning} Afternoon: {afternoon} Evening: {evening}"
                    
                    if i == 1:
                        title = f"Arrival & Local Discovery"
                    elif i == num_days:
                        title = f"Sightseeing & Farewell"
                    else:
                        title = f"Day {i}: Highlights & Exploration"

                    itinerary_list.append({
                        "day": i,
                        "title": title,
                        "description": desc.strip(),
                    })
                elif isinstance(day_info, str):
                    itinerary_list.append({
                        "day": i,
                        "title": f"Day {i}: Exploration",
                        "description": day_info,
                    })
        elif isinstance(itinerary_raw, list):
            for idx, item in enumerate(itinerary_raw):
                if isinstance(item, dict):
                    itinerary_list.append({
                        "day": item.get("day", idx + 1),
                        "title": item.get("title", f"Day {idx + 1}"),
                        "description": item.get("description", item.get("activity", str(item))),
                    })
                else:
                    itinerary_list.append({
                        "day": idx + 1,
                        "title": f"Day {idx + 1}",
                        "description": str(item),
                    })

        # Ensure all requested days are present
        if len(itinerary_list) < num_days:
            for i in range(len(itinerary_list) + 1, num_days + 1):
                itinerary_list.append({
                    "day": i,
                    "title": f"Day {i}: Local Exploration",
                    "description": f"Morning: Local sightseeing. Afternoon: Regional dining. Evening: Sunset viewpoint.",
                })

        total_budget = state.get("budget", 15000)
        formatted_budget = f"₹{int(total_budget):,}"
        transit_cost_formatted = f"₹{int(total_budget * 0.15):,}"

        # Synthesize Route & Transit Experience (Start -> Destination)
        starting_city = state.get("starting_city", "Origin")
        mode = "Scenic Express Train / Highway Drive"
        dist = "approx. 280 - 420 km"
        dur = "approx. 5.5 - 7 hours"
        
        interests_lower = [str(i).lower() for i in state.get("interests", [])]
        if any(b in interests_lower for b in ["beach", "beaches"]):
            mode = "Direct Flight / AC Sleeper Bus"
            dur = "approx. 2.5 hrs (Flight) / 9 hrs (Bus)"
        elif any(m in interests_lower for m in ["mountain", "mountains", "adventure"]):
            mode = "Intercity Express Train + Hill Taxi"
            dur = "approx. 6 - 8 hours"

        route_payload = {
            "origin": starting_city,
            "destination": dest_name,
            "recommended_mode": mode,
            "estimated_distance": dist,
            "estimated_duration": dur,
            "transit_cost": transit_cost_formatted,
            "journey_highlights": [
                f"Boarding at {starting_city} transit hub",
                "Scenic highway & countryside landscapes en route",
                "Authentic regional highway refreshment stop",
                f"Arrival & check-in in {dest_name}",
            ],
            "route_tip": f"Plan an early morning departure from {starting_city} to enjoy scenic daytime views and maximize day 1 in {dest_name}."
        }

        final_payload = {
            "status": "degraded" if state.get("errors") else "complete",
            "destination": dest_name,
            "destination_reason": dest_reason,
            "budget": formatted_budget,
            "weather": weather_str,
            "tips": advice,
            "route": route_payload,
            "itinerary": itinerary_list,
            "warnings": state.get("errors", []),
        }

        state["final_response"] = final_payload
        logger.info("Final response generated: %s", final_payload)
        return state

    def run(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the workflow for a user input payload."""
        starting_city = str(user_input.get("starting_city") or user_input.get("source") or "Hyderabad")
        budget = float(user_input.get("budget", 15000))
        days = int(user_input.get("days", 3))
        travelers = int(user_input.get("travelers", 2))
        
        raw_interests = user_input.get("interests", ["Nature"])
        if isinstance(raw_interests, str):
            interests = [i.strip() for i in raw_interests.split(",") if i.strip()]
        elif isinstance(raw_interests, list):
            interests = [str(i).strip() for i in raw_interests if str(i).strip()]
        else:
            interests = ["Nature"]

        raw_dest = user_input.get("destination") or user_input.get("target_destination") or ""
        if isinstance(raw_dest, str) and raw_dest.strip():
            initial_destination = {
                "destination": raw_dest.strip(),
                "reason": f"Target destination selected by traveler departing from {starting_city}."
            }
        else:
            initial_destination = {}

        state: TravelWorkflowState = {
            "starting_city": starting_city,
            "budget": budget,
            "days": days,
            "travelers": travelers,
            "interests": interests,
            "destination": initial_destination,
            "budget_data": {},
            "weather": {},
            "itinerary": {},
            "final_response": {},
            "errors": [],
        }

        try:
            result = self.workflow.invoke(state)
            return result.get("final_response", {})
        except Exception as exc:
            logger.exception("Workflow execution failed")
            # Produce complete fallback plan matching frontend contract
            num_days = max(1, days)
            fallback_itinerary = []
            for i in range(1, num_days + 1):
                fallback_itinerary.append({
                    "day": i,
                    "title": f"Day {i}: Local Discovery",
                    "description": f"Explore iconic spots and regional cuisine in Coorg."
                })

            return {
                "status": "degraded",
                "destination": "Coorg",
                "destination_reason": "Recommended travel destination based on your preferences.",
                "budget": f"₹{int(budget):,}",
                "weather": "21°C, Misty & Pleasant",
                "tips": "Carry a light rain jacket and comfortable walking shoes.",
                "itinerary": fallback_itinerary,
                "warnings": [f"Workflow error: {exc}"],
            }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    sample_input = {
        "starting_city": "Hyderabad",
        "budget": 15000,
        "days": 3,
        "travelers": 2,
        "interests": ["Nature", "Food"],
    }

    workflow = TravelWorkflow()
    output = workflow.run(sample_input)
    print(json.dumps(output, ensure_ascii=False, indent=2))
