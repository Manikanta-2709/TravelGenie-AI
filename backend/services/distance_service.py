"""Live road distance & transport options — nothing saved, everything fetched.

All distances are REAL road figures resolved at request time:
  - Coordinates .... Open-Meteo geocoding / Wikipedia (KnowledgeService)
  - Road routing ... OSRM public router (real driving distance & duration)
  - Fares .......... transparent per-km heuristics (calculation, not stored data)
"""

import logging
import urllib.parse
from typing import Any, Dict, Optional, Tuple

try:
    from services.knowledge_service import KnowledgeService
except ModuleNotFoundError:  # running as `backend.services...`
    from backend.services.knowledge_service import KnowledgeService

logger = logging.getLogger(__name__)

_knowledge = KnowledgeService()

# Fares are computed per-km (transparent heuristics, not a stored database)
FARE = {
    "train_per_km": 0.9,
    "train_min": 280,
    "flight_base": 1800,
    "flight_per_km": 2.2,
    "bus_per_km": 1.2,
    "bus_min": 450,
    "fuel_per_km": 7.5,
    "toll_per_km": 1.2,
}


def _resolve_pair(
    origin: str, destination: str, region: Optional[str] = "India"
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Geocode both endpoints from the live web."""
    origin_coords = _knowledge.geocode(origin, region=region)
    dest_coords = _knowledge.geocode(destination, region=region)
    return origin_coords, dest_coords


def _fmt_hours(minutes: float) -> str:
    hours = minutes / 60.0
    h = int(hours)
    m = int(round((hours - h) * 60))
    if m == 60:
        return f"{h + 1}h"
    return f"{h}h {m:02d}m" if m else f"{h}h"


def get_realistic_road_distance(origin: str, destination: str) -> int:
    """Real road distance (km) between origin and destination via OSRM."""
    origin_coords, dest_coords = _resolve_pair(origin, destination)
    route = _knowledge.get_road_route(origin_coords, dest_coords)
    return int(round(route["distance_km"]))


def _build_transport_options(
    origin: str,
    destination: str,
    origin_coords: Dict[str, Any],
    dest_coords: Dict[str, Any],
    distance_km: float,
    road_minutes: float,
) -> list:
    """Build transport options from the real OSRM road distance/duration."""
    o_enc = urllib.parse.quote(origin_coords.get("name", origin))
    d_enc = urllib.parse.quote(dest_coords.get("name", destination))
    maps_url = (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={origin_coords['lat']},{origin_coords['lon']}"
        f"&destination={dest_coords['lat']},{dest_coords['lon']}&travelmode=driving"
    )
    options = []

    # 1. Train — distance-based fare & timing heuristic
    train_h = max(2.5, distance_km / 55.0)
    train_fare = max(FARE["train_min"], int(distance_km * FARE["train_per_km"]))
    options.append({
        "mode": "train",
        "title": "Indian Railways Express",
        "duration": _fmt_hours(train_h * 60),
        "estimated_fare": f"₹{train_fare:,} – ₹{int(train_fare * 1.6):,}",
        "details": f"Scenic rail journey of ~{int(round(distance_km))} km connecting {origin} to {destination}.",
        "booking_url": "https://www.irctc.co.in/nget/train-search",
        "booking_label": "Check Trains on IRCTC",
        "maps_url": maps_url,
        "pros": ["Affordable fares", "Comfortable sleeper classes", "Station in city centre"],
        "recommended": distance_km <= 650,
    })

    # 2. Flight — only sensible for long hauls
    flight_fare = int(FARE["flight_base"] + distance_km * FARE["flight_per_km"])
    options.append({
        "mode": "flight",
        "title": "Domestic Flight",
        "duration": "1h – 2h 30m (fly time)",
        "estimated_fare": f"₹{flight_fare:,} – ₹{int(flight_fare * 1.8):,}",
        "details": f"Fastest way to cover ~{int(round(distance_km))} km. Airport transfers extra.",
        "booking_url": f"https://www.google.com/travel/flights?q=flights+from+{o_enc}+to+{d_enc}",
        "booking_label": "Compare on Google Flights",
        "maps_url": maps_url,
        "pros": ["Fastest travel time", "Ideal for short getaways"],
        "recommended": distance_km > 700,
    })

    # 3. Bus — AC sleeper market rates
    bus_h = max(3.0, distance_km / 48.0)
    bus_fare = max(FARE["bus_min"], int(distance_km * FARE["bus_per_km"]))
    options.append({
        "mode": "bus",
        "title": "AC Sleeper / Volvo Bus",
        "duration": _fmt_hours(bus_h * 60),
        "estimated_fare": f"₹{bus_fare:,} – ₹{int(bus_fare * 1.4):,}",
        "details": "Premium intercity AC sleeper/Volvo buses with night departures.",
        "booking_url": f"https://www.redbus.in/bus-tickets/{o_enc.lower()}-to-{d_enc.lower()}",
        "booking_label": "Book Seats on RedBus",
        "maps_url": maps_url,
        "pros": ["Flexible departure timings", "Central boarding points", "Overnight journeys"],
        "recommended": distance_km < 600,
    })

    # 4. Drive — REAL duration from OSRM, real fuel/toll estimate
    fuel_cost = int(distance_km * FARE["fuel_per_km"])
    toll_cost = int(distance_km * FARE["toll_per_km"])
    drive_fare = fuel_cost + toll_cost
    options.append({
        "mode": "drive",
        "title": "Self-Drive / Outstation Taxi",
        "duration": _fmt_hours(road_minutes),
        "estimated_fare": f"₹{drive_fare:,} (Fuel+Toll) / ₹{int(drive_fare * 1.8):,} (Cab)",
        "details": f"Real highway route of ~{int(round(distance_km))} km ({_fmt_hours(road_minutes)} drive).",
        "booking_url": maps_url,
        "booking_label": "Open in Google Maps Navigation",
        "maps_url": maps_url,
        "pros": ["Complete schedule freedom", "Scenic roadside stops", "Luggage flexibility"],
        "recommended": distance_km <= 350,
    })
    return options


def get_route_and_travel_info(origin: str, destination: str, budget: float = 15000) -> Dict[str, Any]:
    """Real route metadata: OSRM distance/duration, coordinates, transport options.

    Everything is fetched live from the internet; nothing is read from storage.
    """
    origin_coords, dest_coords = _resolve_pair(origin, destination)
    route = _knowledge.get_road_route(origin_coords, dest_coords)
    distance_km = float(route["distance_km"])
    road_minutes = float(route["duration_min"])

    options = _build_transport_options(
        origin, destination, origin_coords, dest_coords, distance_km, road_minutes
    )

    recommended_mode = next(
        (o["title"] for o in options if o["recommended"]),
        options[0]["title"],
    )
    recommended_duration = next(
        (o["duration"] for o in options if o["recommended"]),
        options[0]["duration"],
    )

    return {
        "origin": origin,
        "destination": destination,
        "origin_coordinates": origin_coords,
        "destination_coordinates": dest_coords,
        "distance_km": int(round(distance_km)),
        "estimated_distance": f"{int(round(distance_km)):,} km",
        "duration_min": int(round(road_minutes)),
        "route_source": route.get("source", "osrm"),
        "recommended_mode": recommended_mode,
        "estimated_duration": recommended_duration,
        "transit_cost": f"₹{int(budget * 0.18):,}",
        "directions_url": (
            "https://www.google.com/maps/dir/?api=1"
            f"&origin={origin_coords['lat']},{origin_coords['lon']}"
            f"&destination={dest_coords['lat']},{dest_coords['lon']}&travelmode=driving"
        ),
        "travel_options": options,
        "journey_highlights": [
            f"Live OSRM road route: {int(round(distance_km))} km, approx. {_fmt_hours(road_minutes)} driving",
            f"Best value option: {recommended_mode} ({recommended_duration})",
        ],
    }