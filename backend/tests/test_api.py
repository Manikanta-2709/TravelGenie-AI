from typing import Any, Dict
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database.db import Base, get_db
from backend.main import app


# Setup isolated SQLite database in memory for testing
from sqlalchemy.pool import StaticPool

SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def make_mock_workflow_response() -> Dict[str, Any]:
    return {
        "status": "complete",
        "warnings": [],
        "destination": "Coorg",
        "destination_reason": "Ideal nature getaway.",
        "budget": "₹15,000",
        "weather": "21°C, Misty & Pleasant",
        "tips": "Carry a light jacket and comfortable walking shoes.",
        "itinerary": [
            {
                "day": 1,
                "title": "Arrival & Local Discovery",
                "description": "Morning: Check in. Afternoon: Coffee tour. Evening: Sunset view.",
            },
            {
                "day": 2,
                "title": "Waterfalls & Nature Walk",
                "description": "Morning: Abbey falls. Afternoon: Trekking. Evening: Local market.",
            },
            {
                "day": 3,
                "title": "Sightseeing & Farewell",
                "description": "Morning: Viewpoint. Afternoon: Souvenir shopping. Evening: Return journey.",
            },
        ],
    }


# Test 1: GET /
def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "TravelGenie API Running"}


# Test 2: GET /health
def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# Test 3: Valid POST /plan-trip
def test_plan_trip_valid_request(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from backend.api.routes import trip_routes

    monkeypatch.setattr(
        trip_routes.travel_workflow,
        "run",
        lambda payload: make_mock_workflow_response(),
    )

    request_payload = {
        "starting_city": "Hyderabad",
        "budget": 15000,
        "days": 3,
        "interests": ["Nature", "Food"],
        "travelers": 2,
    }

    response = client.post("/plan-trip", json=request_payload)
    assert response.status_code == 200

    data = response.json()
    assert data["destination"] == "Coorg"
    assert data["budget"] == "₹15,000"
    assert data["weather"] == "21°C, Misty & Pleasant"
    assert "tips" in data
    assert len(data["itinerary"]) == 3
    assert data["id"] is not None


# Test 4: Invalid budget <= 0
def test_plan_trip_invalid_budget(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "starting_city": "Hyderabad",
            "budget": 0,
            "days": 3,
            "interests": ["Nature"],
            "travelers": 2,
        },
    )
    assert response.status_code == 422


# Test 5: Invalid days < 1
def test_plan_trip_invalid_days(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "starting_city": "Hyderabad",
            "budget": 15000,
            "days": 0,
            "interests": ["Nature"],
            "travelers": 2,
        },
    )
    assert response.status_code == 422


# Test 6: Empty city
def test_plan_trip_empty_city(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "starting_city": "   ",
            "budget": 15000,
            "days": 3,
            "interests": ["Nature"],
            "travelers": 2,
        },
    )
    assert response.status_code == 422


# Test 7: Empty interests
def test_plan_trip_empty_interests(client: TestClient) -> None:
    response = client.post(
        "/plan-trip",
        json={
            "starting_city": "Hyderabad",
            "budget": 15000,
            "days": 3,
            "interests": [],
            "travelers": 2,
        },
    )
    assert response.status_code == 422


# Test 8: GET /history
def test_get_history(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.api.routes import trip_routes

    monkeypatch.setattr(
        trip_routes.travel_workflow,
        "run",
        lambda payload: make_mock_workflow_response(),
    )

    # First generate a trip
    client.post(
        "/plan-trip",
        json={
            "starting_city": "Guntur",
            "budget": 12000,
            "days": 2,
            "interests": ["Beaches"],
            "travelers": 1,
        },
    )

    response = client.get("/history")
    assert response.status_code == 200

    history = response.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    assert history[0]["starting_city"] == "Guntur"
    assert history[0]["destination"] == "Coorg"


# Test 9: GET /trip/{id} (existing)
def test_get_trip_by_existing_id(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    from backend.api.routes import trip_routes

    monkeypatch.setattr(
        trip_routes.travel_workflow,
        "run",
        lambda payload: make_mock_workflow_response(),
    )

    post_resp = client.post(
        "/plan-trip",
        json={
            "starting_city": "Bengaluru",
            "budget": 20000,
            "days": 4,
            "interests": ["Mountains"],
            "travelers": 3,
        },
    )
    trip_id = post_resp.json()["id"]

    get_resp = client.get(f"/trip/{trip_id}")
    assert get_resp.status_code == 200
    trip = get_resp.json()
    assert trip["id"] == trip_id
    assert trip["starting_city"] == "Bengaluru"
    assert trip["destination"] == "Coorg"


# Test 10: GET /trip/{id} (invalid)
def test_get_trip_by_invalid_id(client: TestClient) -> None:
    response = client.get("/trip/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Travel plan with ID 99999 not found."
