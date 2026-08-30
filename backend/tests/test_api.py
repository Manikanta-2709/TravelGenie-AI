"""Stateless API tests — /plan-trip is monkeypatched (no network, no DB)."""

from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

import backend.main as main_module
from backend.main import app


def _fake_v2_plan(**overrides) -> Dict[str, Any]:
    """Minimal V2 payload the real workflow would return from live data."""
    plan = {
        "status": "ok",
        "warnings": [],
        "hero": {
            "destination": "Goa",
            "tagline": "Coastal paradise",
            "image_url": "https://upload.wikimedia.org/x.jpg",
            "trip_score": 88,
            "origin": "Hyderabad",
            "distance_km": 660,
            "distance_label": "660 km",
            "duration": "3 Days",
            "travelers": 2,
            "maps_url": "https://maps.google.com",
        },
        "overview": {
            "budget": {
                "travel": 3000, "hotel": 6000, "food": 3750,
                "activities": 2250, "misc": 750, "total": 15000, "daily_avg": 5000,
            },
            "weather": {
                "temp": "29°C", "condition": "Clear Sky", "humidity": "70%",
                "best_time": "October – March", "advice": "Stay hydrated.",
            },
            "best_time": "October – March",
            "ai_score": 88,
            "route_efficiency": 90,
        },
        "transport": [{
            "mode": "train", "title": "Indian Railways Express",
            "duration": "12h", "estimated_fare": "₹600 – ₹960",
            "booking_url": "https://www.irctc.co.in", "recommended": True,
        }],
        "hotels": [{
            "name": "Taj Fort Aguada", "rating": 4.8, "price": "₹18,000/night",
            "maps_url": "https://maps.google.com", "booking_url": "https://booking.com",
        }],
        "itinerary": [{
            "day": 1, "title": "Day 1: Baga Beach", "place_count": 2,
            "walking_km": 3.2,
            "morning": {"summary": "Beach time", "places": [{
                "name": "Baga Beach", "category": "nature", "lat": 15.555,
                "lng": 73.751, "maps_url": "https://maps.google.com",
                "travel_from_prev": "", "geo_source": "wikipedia",
            }]},
            "afternoon": {"summary": "Fort", "places": []},
            "evening": {"summary": "Market", "places": []},
        }],
        "recommendations": {"food": ["Fish curry rice"], "hidden_gems": [], "shopping": [], "safety_tips": []},
        "metrics": {"route_efficiency": 90, "walking_km": 3.2, "transport_hours": 12.0, "ai_score": 88},
    }
    plan.update(overrides)
    return plan


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr(
        main_module.workflow, "run", lambda payload: _fake_v2_plan(), raising=True
    )
    return TestClient(app)


def test_read_root(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "TravelGenie AI"
    assert body["mode"].startswith("stateless")


def test_health_check(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_plan_trip_valid_request(client: TestClient):
    r = client.post("/plan-trip", json={
        "starting_city": "Hyderabad", "budget": 15000, "days": 3,
        "travelers": 2, "interests": ["Beaches"],
    })
    assert r.status_code == 200
    body = r.json()
    for section in ("hero", "overview", "transport", "hotels", "itinerary",
                    "recommendations", "metrics"):
        assert section in body
    assert body["hero"]["destination"] == "Goa"
    assert body["hero"]["distance_km"] == 660


def test_plan_trip_invalid_budget():
    with TestClient(app) as c:  # workflow.run must NOT be called
        r = c.post("/plan-trip", json={
            "starting_city": "Hyderabad", "budget": 0, "days": 3,
        })
    assert r.status_code == 422


def test_plan_trip_invalid_days():
    with TestClient(app) as c:
        r = c.post("/plan-trip", json={
            "starting_city": "Hyderabad", "budget": 15000, "days": 0,
        })
    assert r.status_code == 422


def test_plan_trip_empty_city():
    with TestClient(app) as c:
        r = c.post("/plan-trip", json={
            "starting_city": "   ", "budget": 15000, "days": 3,
        })
    assert r.status_code == 422


def test_plan_trip_empty_interests():
    with TestClient(app) as c:
        r = c.post("/plan-trip", json={
            "starting_city": "Hyderabad", "budget": 15000, "days": 3,
            "interests": [],
        })
    assert r.status_code == 422


def test_plan_trip_passes_payload_to_workflow(monkeypatch: pytest.MonkeyPatch):
    captured: Dict[str, Any] = {}

    def fake_run(payload):
        captured.update(payload)
        return _fake_v2_plan()

    monkeypatch.setattr(main_module.workflow, "run", fake_run, raising=True)
    with TestClient(app) as c:
        r = c.post("/plan-trip", json={
            "starting_city": "Mumbai", "budget": 20000, "days": 4,
            "travelers": 3, "interests": "History, Food", "destination": "Jaipur",
        })
    assert r.status_code == 200
    assert captured["starting_city"] == "Mumbai"
    assert captured["destination"] == "Jaipur"
    assert captured["interests"] == ["History", "Food"]