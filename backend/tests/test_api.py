from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from backend.api.routes import trip_routes
from backend.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def make_plan_response() -> Dict[str, Any]:
    return {
        "status": "complete",
        "warnings": [],
        "destination": {"name": "Coorg", "reason": "Nature-focused destination."},
        "budget": {
            "travel": 1000,
            "stay": 2000,
            "food": 1500,
            "activities": 500,
            "total": 5000,
        },
        "weather": {
            "temperature": "22 C",
            "condition": "Cloudy",
            "humidity": "75%",
            "advice": "Carry a jacket.",
        },
        "itinerary": {
            "day1": {"morning": "Walk", "afternoon": "Lunch", "evening": "Rest"},
            "day2": {"morning": "Hike", "afternoon": "Visit", "evening": "Dinner"},
            "day3": {"morning": "Explore", "afternoon": "Shop", "evening": "Depart"},
        },
    }


def test_plan_trip_executes_workflow_and_returns_plan(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    received: Dict[str, Any] = {}

    def run_workflow(payload: Dict[str, Any]) -> Dict[str, Any]:
        received.update(payload)
        return make_plan_response()

    monkeypatch.setattr(trip_routes.travel_workflow, "run", run_workflow)

    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 3,
            "travelers": 2,
            "interests": ["Nature", "Food"],
        },
    )

    assert response.status_code == 200
    assert response.json() == make_plan_response()
    assert received == {
        "source": "Hyderabad",
        "destination": "Coorg",
        "budget": 15000.0,
        "days": 3,
        "travelers": 2,
        "interests": ["Nature", "Food"],
    }


def test_plan_trip_rejects_invalid_values(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={"source": "", "destination": "", "budget": -1, "days": 0, "travelers": 0, "interests": []},
    )

    assert response.status_code == 422


def test_plan_trip_rejects_unknown_fields(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 3,
            "travelers": 2,
            "interests": ["Nature"],
            "unexpected": True,
        },
    )

    assert response.status_code == 422


def test_plan_trip_accepts_ten_days(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(trip_routes.travel_workflow, "run", lambda payload: make_plan_response())

    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 10,
            "travelers": 2,
            "interests": ["Nature"],
        },
    )

    assert response.status_code == 200


def test_plan_trip_rejects_more_than_ten_days(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 11,
            "travelers": 2,
            "interests": ["Nature"],
        },
    )

    assert response.status_code == 422


def test_plan_trip_exposes_degraded_workflow_result(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    degraded_response = make_plan_response()
    degraded_response["status"] = "degraded"
    degraded_response["warnings"] = ["Weather analysis used fallback data."]
    monkeypatch.setattr(trip_routes.travel_workflow, "run", lambda payload: degraded_response)

    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 3,
            "travelers": 2,
            "interests": ["Nature"],
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "degraded"
    assert response.json()["warnings"] == ["Weather analysis used fallback data."]


def test_plan_trip_returns_internal_error_when_workflow_fails(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail_workflow(payload: Dict[str, Any]) -> Dict[str, Any]:
        raise RuntimeError("workflow unavailable")

    monkeypatch.setattr(trip_routes.travel_workflow, "run", fail_workflow)

    response = client.post(
        "/plan-trip",
        json={
            "source": "Hyderabad",
            "destination": "Coorg",
            "budget": 15000,
            "days": 3,
            "travelers": 2,
            "interests": ["Nature"],
        },
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "Unable to generate a travel plan at this time."}


def test_plan_trip_is_documented_in_openapi() -> None:
    operation = app.openapi()["paths"]["/plan-trip"]["post"]

    assert operation["summary"] == "Generate a complete travel plan"
    assert operation["tags"] == ["Travel Planning"]
    assert operation["responses"]["200"]["content"]["application/json"]["schema"]
