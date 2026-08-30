import json
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest

from backend.agents.itinerary_agent import ItineraryAgent


class MockGroqService:
    def call_llm(self, system_prompt: str, user_prompt: str, temperature: float = 0.2, max_tokens: int = 500, json_mode: bool = True) -> str:
        return json.dumps({
            "day1": {
                "morning": "Visit coffee plantations and enjoy a scenic walk.",
                "afternoon": "Explore Abbey Falls and take a short nature trail.",
                "evening": "Relax at a hill-view café and enjoy a quiet sunset.",
            },
            "day2": {
                "morning": "Start with trekking in the forested hills.",
                "afternoon": "Visit a local viewpoint and enjoy lunch with valley views.",
                "evening": "Stroll through a local market and have dinner at a cozy spot.",
            },
            "day3": {
                "morning": "Take a guided nature walk and enjoy birdwatching.",
                "afternoon": "Visit a waterfall and spend time at a scenic picnic spot.",
                "evening": "Enjoy local cuisine and a sunset viewpoint before winding down.",
            },
        })


def test_itinerary_agent_generates_valid_structure() -> None:
    agent = ItineraryAgent(groq_service=MockGroqService())

    result = agent.generate_itinerary("Coorg", 3, "Nature")

    assert set(result.keys()) == {"day1", "day2", "day3"}
    assert {"morning", "afternoon", "evening"}.issubset(set(result["day1"].keys()))
    assert "stay_location" in result["day1"]



def test_itinerary_agent_rejects_invalid_days() -> None:
    agent = ItineraryAgent(groq_service=MockGroqService())

    with pytest.raises(ValueError):
        agent.generate_itinerary("Coorg", 0, "Nature")


def test_itinerary_agent_requires_interest() -> None:
    agent = ItineraryAgent(groq_service=MockGroqService())

    with pytest.raises(ValueError):
        agent.generate_itinerary("Coorg", 3, "   ")
