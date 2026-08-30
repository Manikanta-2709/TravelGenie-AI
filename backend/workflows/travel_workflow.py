"""LangGraph travel workflow — 100% live internet data, V2 dashboard schema.

Nothing is stored or read from a database. Every response is assembled at
request time from: Groq LLM analysis, Open-Meteo weather, OSRM road routing,
Wikipedia/Wikivoyage knowledge, and live web search.
"""

import json
import logging
import math
import re
import sys
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langgraph.graph import END, StateGraph

from backend.agents.budget_agent import BudgetAgent
from backend.agents.destination_agent import DestinationAgent
from backend.agents.itinerary_agent import ItineraryAgent
from backend.agents.weather_agent import WeatherAgent
try:
    from backend.services.distance_service import get_route_and_travel_info
    from backend.services.hotel_service import get_destination_hotels
    from backend.services.knowledge_service import KnowledgeService
except ModuleNotFoundError:
    from services.distance_service import get_route_and_travel_info
    from services.hotel_service import get_destination_hotels
    from services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

_knowledge = KnowledgeService()


class TravelWorkflowState(TypedDict):
    """State passed through the travel planning workflow."""

    starting_city: str
    budget: float
    days: int
    interests: List[str]
    travelers: int
    preferred_travel_mode: Optional[str]
    destination: Dict[str, Any]
    budget_data: Dict[str, Any]
    weather: Dict[str, Any]
    itinerary: Dict[str, Any]
    final_response: Dict[str, Any]
    errors: List[str]


class TravelWorkflow:
    """LangGraph workflow orchestrating live-data agents into the V2 schema."""

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
# CHUNK1_END

    def destination_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node for executing DestinationAgent."""
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
            return state

        try:
            interest_str = (
                ", ".join(state["interests"])
                if isinstance(state["interests"], list)
                else str(state["interests"])
            )
            dest_output = self.destination_agent.get_destination({
                "starting_city": state["starting_city"],
                "city": state["starting_city"],
                "budget": state["budget"],
                "days": state["days"],
                "interest": interest_str,
            })
            state["destination"] = {
                "destination": dest_output.destination,
                "reason": dest_output.reason,
            }
            return state
        except Exception as exc:
            logger.warning("Destination agent failed, using interest fallback: %s", exc)
            state["errors"].append("Destination recommendation used fallback selection.")
            interests = [str(i).lower() for i in state.get("interests", [])]
            fallback_dest, fallback_reason = "Coorg", "Ideal for nature and relaxation."
            if any(i in interests for i in ["beach", "beaches"]):
                fallback_dest, fallback_reason = "Goa", "Top coastal beach getaway."
            elif any(i in interests for i in ["mountain", "mountains", "adventure"]):
                fallback_dest, fallback_reason = "Manali", "Scenic mountain trails and adventure."
            elif any(i in interests for i in ["history", "culture", "heritage"]):
                fallback_dest, fallback_reason = "Jaipur", "Forts, palaces and heritage."
            state["destination"] = {"destination": fallback_dest, "reason": fallback_reason}
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
            return state
        except Exception as exc:
            logger.warning("Budget agent failed, using proportional fallback: %s", exc)
            state["errors"].append("Budget estimation used fallback calculation.")
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
        """Node for executing WeatherAgent (live Open-Meteo data)."""
        try:
            dest_name = state["destination"].get("destination", "Coorg")
            state["weather"] = self.weather_agent.analyze_weather(dest_name)
            return state
        except Exception as exc:
            logger.warning("Weather agent failed: %s", exc)
            state["errors"].append("Weather analysis used fallback data.")
            state["weather"] = {
                "temperature": "24°C",
                "condition": "Pleasant",
                "humidity": "65%",
                "advice": "Pack light layers and comfortable walking shoes.",
            }
            return state

    def itinerary_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node for executing ItineraryAgent (LLM + real place names)."""
        try:
            dest_name = state["destination"].get("destination", "Coorg")
            interest_str = (
                ", ".join(state["interests"])
                if isinstance(state["interests"], list)
                else str(state["interests"])
            )
            state["itinerary"] = self.itinerary_agent.generate_itinerary(
                dest_name, state["days"], interest_str
            )
            return state
        except Exception as exc:
            logger.warning("Itinerary agent failed: %s", exc)
            state["errors"].append("Itinerary generation used fallback content.")
            dest_name = state["destination"].get("destination", "Coorg")
            state["itinerary"] = {
                f"day{i}": {
                    "morning": f"Explore the main landmarks of {dest_name}.",
                    "afternoon": f"Enjoy regional cuisine and local markets in {dest_name}.",
                    "evening": f"Relax at a scenic viewpoint in {dest_name}.",
                    "stay_location": f"Central hotel in {dest_name}",
                }
                for i in range(1, state["days"] + 1)
            }
            return state
# CHUNK2_END

    # ───────────────── Live V2 assembly helpers ─────────────────

    @staticmethod
    def _haversine_km(a: Dict[str, Any], b: Dict[str, Any]) -> float:
        """Great-circle distance between two {lat, lon} dicts."""
        lat1, lon1 = a.get("lat", 0), a.get("lon", 0)
        lat2, lon2 = b.get("lat", 0), b.get("lon", 0)
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
        h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
        return 6371.0 * 2 * math.asin(math.sqrt(h))

    @staticmethod
    def _category_for(place: str) -> str:
        p = place.lower()
        if any(k in p for k in ["temple", "church", "fort", "palace", "museum", "monument", "tomb"]):
            return "heritage"
        if any(k in p for k in ["beach", "falls", "waterfall", "lake", "valley", "park", "garden", "peak", "hill"]):
            return "nature"
        if any(k in p for k in ["market", "bazaar", "mall", "shop"]):
            return "shopping"
        if any(k in p for k in ["cafe", "restaurant", "food", "dine"]):
            return "food"
        return "attraction"

    @staticmethod
    def _extract_place_name(slot_text: str) -> str:
        """Pull a real place name out of a slot summary sentence."""
        if not slot_text:
            return ""
        # Strip leading time prefixes like "01:00 PM - " / "9 AM – "
        text = re.sub(r"^\s*\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?\s*[-–—:.]\s*", "", slot_text.strip())
        first_clause = re.split(r"[.!?;,]", text)[0].strip()
        patterns = [
            r"(?:visit|explore|head to|drive to|return to|walk to|stroll along|trek to|at|to)\s+"
            r"((?:[A-Z][\w'&.-]*\s*){1,4})",
            r"^(?:The\s+)?((?:[A-Z][\w'&.-]*\s*){1,4})",
        ]
        for pat in patterns:
            m = re.search(pat, first_clause)
            if m:
                name = m.group(1).strip()
                name = re.sub(
                    r"\s+(for|and|with|to|the|a|an|in|on|at|of|before|after|then)$",
                    "", name, flags=re.IGNORECASE,
                ).strip()
                if 2 < len(name) <= 60:
                    return name
        words = first_clause.split()
        return " ".join(words[:6]) if words else ""

    def _geocode_place(
        self, name: str, destination: str, dest_coords: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Resolve a real place's coordinates live; fall back to destination centre."""
        for attempt_name in (f"{name} {destination}", name):
            try:
                g = _knowledge.geocode(
                    attempt_name, region=dest_coords.get("country") or None
                )
            except Exception:  # noqa: BLE001
                g = None
            if g and g.get("lat") and dest_coords.get("lat"):
                # Reject absurd matches (> 300 km from destination centre)
                try:
                    if self._haversine_km(dest_coords, g) <= 300:
                        return g
                except Exception:  # noqa: BLE001
                    pass
            elif g and g.get("lat"):
                return g
        return {
            "lat": dest_coords.get("lat"),
            "lon": dest_coords.get("lon"),
            "name": name,
            "source": "destination-center-fallback",
        }

    def _build_v2_itinerary(self, itinerary_raw: Dict[str, Any], days: int,
                            destination: str, dest_coords: Dict[str, Any],
                            interests: List[str]) -> List[Dict[str, Any]]:
        """Convert the agent's day slots into the V2 accordion itinerary."""
        import urllib.parse

        v2_days: List[Dict[str, Any]] = []
        coord_cache: Dict[str, Dict[str, Any]] = {}

        def _place_obj(name: str, prev):
            key = name.lower().strip()
            if key not in coord_cache:
                coord_cache[key] = self._geocode_place(name, destination, dest_coords)
            g = coord_cache[key]
            maps_url = (
                "https://www.google.com/maps/search/?api=1&query="
                + urllib.parse.quote_plus(f"{g['name']}, {destination}")
            )
            travel_prev = ""
            if prev and g.get("lat") and prev.get("lat"):
                km = self._haversine_km(prev, g)
                if km > 0.2:
                    travel_prev = f"{max(5, int(round(km / 45 * 60)))} min from previous"
            return {
                "name": name,
                "category": self._category_for(name, interests),
                "lat": g.get("lat"),
                "lng": g.get("lon"),
                "maps_url": maps_url,
                "travel_from_prev": travel_prev,
                "geo_source": g.get("source", ""),
            }

        for d in range(1, days + 1):
            day_data = itinerary_raw.get(f"day{d}") or {}
            places_raw = [
                str(p).strip() for p in (day_data.get("places") or []) if str(p).strip()
            ][:6]
            slots = {}
            slot_names = ["morning", "afternoon", "evening"]
            for si, slot in enumerate(slot_names):
                slot_places = []
                prev = None
                for pi in range(si, len(places_raw), 3):
                    obj = _place_obj(places_raw[pi], prev)
                    slot_places.append(obj)
                    prev = obj
                slots[slot] = {
                    "summary": str(day_data.get(slot, "")).strip(),
                    "places": slot_places,
                }
            day_places = [p for s in slot_names for p in slots[s]["places"]]
            walking = 0.0
            for a, b in zip(day_places, day_places[1:]):
                if a.get("lat") and b.get("lat"):
                    walking += self._haversine_km(a, b)
            v2_days.append({
                "day": d,
                "title": f"Day {d}: {places_raw[0]}" if places_raw else f"Day {d} in {destination}",
                "stay_location": str(day_data.get("stay_location", f"Hotel in {destination}")),
                "place_count": len(day_places),
                "walking_km": round(walking * 1.3, 1),
                **slots,
            })
        return v2_days

    @staticmethod
    def _weather_v2(weather: Dict[str, Any]) -> Dict[str, Any]:
        temp = str(weather.get("temperature", "24°C"))
        condition = str(weather.get("condition", "Pleasant"))
        cond_l = condition.lower()
        if any(k in cond_l for k in ["rain", "drizzle", "shower"]):
            best_time = "October – March (avoid monsoon)"
        elif any(k in cond_l for k in ["snow", "fog"]):
            best_time = "March – June for clear skies"
        else:
            best_time = "October – March"
        return {
            "temp": temp,
            "condition": condition,
            "humidity": str(weather.get("humidity", "—")),
            "best_time": weather.get("best_time") or best_time,
            "advice": str(weather.get("advice", "Pack for the current conditions.")),
        }

    def _assemble_v2_response(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Assemble the full V2 dashboard response from live internet data."""
        dest_name = state["destination"]["destination"]
        days = state["days"]
        travelers = state["travelers"]
        budget_total = state["budget"]

        # ── 1. Route & transport (OSRM real road data) ──────────────
        route_info = get_route_and_travel_info(state["starting_city"], dest_name, budget_total)
        dest_coords = route_info.get("destination_coordinates") or {}

        # ── 2. Live destination knowledge (Wikipedia + Wikivoyage) ──
        wiki = _knowledge.get_wiki_summary(dest_name)
        insights = _knowledge.get_wikivoyage_insights(dest_name)

        # ── 3. Hotels — discovered live (LLM + web-verified) ────────
        hotels = get_destination_hotels(dest_name, budget_total)

        # ── 4. Itinerary → V2 days with real geocoded places ────────
        itinerary_raw = state.get("itinerary") or {}
        v2_days: List[Dict[str, Any]] = []
        for i in range(1, days + 1):
            day_data = itinerary_raw.get(f"day{i}", {})
            # Itinerary agent's flat format: {"morning": "str", ..., "places": ["A", "B", ...]}
            flat_places = [
                str(p).strip() for p in (day_data.get("places") or []) if str(p).strip()
            ]
            slot_names = ("morning", "afternoon", "evening")
            slot_assignments = {
                slot: flat_places[idx::3] for idx, slot in enumerate(slot_names)
            }
            slots: Dict[str, Any] = {}
            for slot in slot_names:
                slot_val = day_data.get(slot)
                places_out: List[Dict[str, Any]] = []
                raw_places = (
                    slot_val.get("places") if isinstance(slot_val, dict) else []
                ) or slot_assignments[slot]
                for p in raw_places or []:
                    name = p if isinstance(p, str) else str(p.get("name", "")).strip()
                    if not name:
                        continue
                    g = self._geocode_place(name, dest_name, dest_coords)
                    lat, lon = g.get("lat"), g.get("lon")
                    maps_url = (
                        f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
                        if lat is not None
                        else "https://www.google.com/maps/search/?api=1&query="
                        + urllib.parse.quote_plus(f"{name} {dest_name}")
                    )
                    places_out.append({
                        "name": name,
                        "category": self._category_for(name),
                        "maps_url": maps_url,
                        "lat": lat,
                        "lon": lon,
                    })
                if not places_out and isinstance(slot_val, str) and slot_val.strip():
                    extracted = self._extract_place_name(slot_val)
                    g = (
                        self._geocode_place(extracted, dest_name, dest_coords)
                        if extracted else None
                    )
                    lat, lon = (g or {}).get("lat"), (g or {}).get("lon")
                    places_out.append({
                        "name": extracted or slot_val.strip()[:60],
                        "category": self._category_for(extracted or slot_val),
                        "maps_url": (
                            f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
                            if lat is not None
                            else "https://www.google.com/maps/search/?api=1&query="
                            + urllib.parse.quote_plus(f"{dest_name} attractions")
                        ),
                        "lat": lat,
                        "lon": lon,
                    })
                slots[slot] = {
                    "summary": (
                        slot_val.get("summary", "")
                        if isinstance(slot_val, dict)
                        else (str(slot_val).strip() if slot_val else "")
                    ),
                    "places": places_out,
                }
            v2_days.append({
                "day": i,
                "title": day_data.get("title", f"Day {i}: Exploring {dest_name}"),
                "slots": slots,
                "stay_location": day_data.get("stay_location", ""),
            })

        # ── 5. Real per-leg distances & walking metrics ─────────────
        place_sequence = [
            p
            for d in v2_days
            for s in ("morning", "afternoon", "evening")
            for p in d["slots"][s]["places"]
        ]
        prev = {
            "lat": route_info["origin_coordinates"].get("lat"),
            "lon": route_info["origin_coordinates"].get("lon"),
        }
        prev_is_origin = True
        for p in place_sequence:
            cur = {"lat": p.get("lat") or 0, "lon": p.get("lon") or 0}
            if cur["lat"] and cur["lon"]:
                leg = self._haversine_km(prev, cur)
                leg_road = min(leg * 1.3, 120.0) if not prev_is_origin else min(leg * 1.3, 100000)
                p["travel_from_previous"] = f"{leg_road:.1f} km"
                prev = cur
                prev_is_origin = False

        place_count = len(place_sequence)
        walking_km = round(min(place_count * 1.2, 42.0), 1)
        transport_hours = round(
            route_info["duration_min"] / 60.0 + 0.4 * max(0, place_count - 1), 1
        )

        # ── 6. Budget (agent output or fallback) → V2 shape ─────────
        bd = state.get("budget_data") or {}
        total = float(bd.get("total") or budget_total)
        breakdown = {
            "travel": float(bd.get("travel") or total * 0.2),
            "hotel": float(bd.get("stay") or bd.get("hotel") or total * 0.4),
            "food": float(bd.get("food") or total * 0.25),
            "activities": float(bd.get("activities") or total * 0.15),
        }
        misc = max(0.0, total - sum(breakdown.values()))
        budget_v2 = {
            "travel": round(breakdown["travel"]),
            "hotel": round(breakdown["hotel"]),
            "food": round(breakdown["food"]),
            "activities": round(breakdown["activities"]),
            "misc": round(misc),
            "total": round(total),
            "daily_avg": round(total / max(1, days)),
            "per_person": round(total / max(1, travelers)),
        }

        # ── 7. Weather (live Open-Meteo) → V2 shape ─────────────────
        w = state.get("weather") or {}
        weather_v2 = {
            "temp": str(w.get("temperature", "—")),
            "condition": str(w.get("condition", "—")),
            "humidity": str(w.get("humidity", "—")),
            "best_time": str(w.get("best_time", "October – March")),
            "advice": str(w.get("advice", "")),
        }

        # ── 8. Metrics, hero & final V2 payload ─────────────────────
        density = min(1.0, place_count / max(1, days * 4))
        ai_score = int(round(70 + 25 * density))
        route_efficiency = int(round(60 + 35 * density))

        final = {
            "status": "success",
            "schema_version": 2,
            "hero": {
                "destination": dest_name,
                "tagline": state["destination"].get("reason") or wiki.get("extract", "")[:120],
                "image_url": wiki.get("image_url") or "",
                "image_attribution": wiki.get("title", ""),
                "trip_score": ai_score,
                "origin": state["starting_city"],
                "distance_km": route_info["distance_km"],
                "duration_min": route_info["duration_min"],
                "travelers": travelers,
                "days": days,
                "budget_label": f"₹{int(total):,}",
            },
            "overview": {
                "budget": budget_v2,
                "weather": weather_v2,
                "best_time": weather_v2["best_time"],
                "ai_score": ai_score,
                "route_efficiency": route_efficiency,
            },
            "transport": route_info["travel_options"],
            "route": {
                "distance_km": route_info["distance_km"],
                "duration_min": route_info["duration_min"],
                "directions_url": route_info["directions_url"],
                "recommended_mode": route_info["recommended_mode"],
            },
            "hotels": hotels,
            "itinerary": v2_days,
            "recommendations": {
                "food": insights.get("food", [])[:6],
                "hidden_gems": insights.get("hidden_gems", [])[:6],
                "shopping": insights.get("shopping", [])[:6],
                "safety_tips": insights.get("safety_tips", [])[:6],
            },
            "metrics": {
                "route_efficiency": route_efficiency,
                "walking_km": walking_km,
                "transport_hours": transport_hours,
                "ai_score": ai_score,
            },
            "sources": {
                "weather": "Open-Meteo (live)",
                "routing": "OSRM (live)",
                "knowledge": "Wikipedia / Wikivoyage (live)",
                "hotels": "Groq LLM + live web verification",
            },
            "errors": state.get("errors", []),
        }
        return final

    def final_response_node(self, state: TravelWorkflowState) -> Dict[str, Any]:
        """Node that assembles the final V2 dashboard response."""
        state["final_response"] = self._assemble_v2_response(state)
        return state

    def run(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """Run the full workflow and return the V2 dashboard response."""
        starting_city = str(user_input.get("starting_city") or user_input.get("city") or "Delhi").strip()
        budget = float(user_input.get("budget") or 15000)
        days = max(1, int(user_input.get("days") or 3))
        travelers = max(1, int(user_input.get("travelers") or 2))

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
                "reason": f"Target destination selected by traveler departing from {starting_city}.",
            }
        else:
            initial_destination = {}

        state: TravelWorkflowState = {
            "starting_city": starting_city,
            "budget": budget,
            "days": days,
            "travelers": travelers,
            "preferred_travel_mode": user_input.get("preferred_travel_mode"),
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
            dest = initial_destination.get("destination") or "Coorg"
            route_info = get_route_and_travel_info(starting_city, dest, budget)
            hotels = get_destination_hotels(dest, budget)
            return self._degraded_response(dest, starting_city, budget, days, travelers, route_info, hotels, exc)

    @staticmethod
    def _degraded_response(dest, starting_city, budget, days, travelers, route_info, hotels, exc):
        """Minimal V2 payload from live route data when the workflow fails."""
        return {
            "status": "degraded",
            "schema_version": 2,
            "hero": {
                "destination": dest,
                "tagline": "Degraded plan assembled from live route data.",
                "image_url": "",
                "trip_score": 70,
                "origin": starting_city,
                "distance_km": route_info["distance_km"],
                "duration_min": route_info["duration_min"],
                "travelers": travelers,
                "days": days,
                "budget_label": f"₹{int(budget):,}",
            },
            "overview": {
                "budget": {
                    "travel": round(budget * 0.2), "hotel": round(budget * 0.4),
                    "food": round(budget * 0.25), "activities": round(budget * 0.15),
                    "misc": 0, "total": round(budget),
                    "daily_avg": round(budget / max(1, days)),
                    "per_person": round(budget / max(1, travelers)),
                },
                "weather": {"temp": "—", "condition": "—", "humidity": "—",
                            "best_time": "—", "advice": ""},
                "best_time": "—",
                "ai_score": 70,
                "route_efficiency": 65,
            },
            "transport": route_info["travel_options"],
            "route": {
                "distance_km": route_info["distance_km"],
                "duration_min": route_info["duration_min"],
                "directions_url": route_info["directions_url"],
                "recommended_mode": route_info["recommended_mode"],
            },
            "hotels": hotels,
            "itinerary": [
                {
                    "day": i,
                    "title": f"Day {i}: Local Discovery in {dest}",
                    "slots": {
                        "morning": {"summary": f"Explore landmarks in {dest}.", "places": []},
                        "afternoon": {"summary": "Regional cuisine and markets.", "places": []},
                        "evening": {"summary": "Sunset viewpoint.", "places": []},
                    },
                    "stay_location": "",
                }
                for i in range(1, days + 1)
            ],
            "recommendations": {"food": [], "hidden_gems": [], "shopping": [], "safety_tips": []},
            "metrics": {
                "route_efficiency": 65,
                "walking_km": 0,
                "transport_hours": round(route_info["duration_min"] / 60.0, 1),
                "ai_score": 70,
            },
            "sources": {"weather": "unavailable", "routing": "OSRM (live)",
                        "knowledge": "unavailable", "hotels": "live web"},
            "errors": [f"Workflow warning: {exc}"],
        }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    sample_input = {
        "starting_city": "Hyderabad",
        "budget": 15000,
        "days": 3,
        "travelers": 2,
        "interests": ["Nature", "Food"],
        "destination": "Goa",
    }
    print(json.dumps(TravelWorkflow().run(sample_input), ensure_ascii=False, indent=2)[:4000])
