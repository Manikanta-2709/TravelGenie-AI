"""Tests and execution example for DestinationAgent."""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest

from backend.agents.destination_agent import (
    DestinationAgent,
    DestinationAgentError,
    DestinationInput,
    DestinationOutput,
)

# Configure logging for test execution output
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


class MockGroqService:
    """Mock GroqService for unit testing without live API calls."""

    def __init__(self, mock_response: Dict[str, Any] = None) -> None:
        self.mock_response = mock_response or {
            "destination": "Coorg",
            "reason": "Coorg offers waterfalls, trekking, coffee plantations, and fits within the given budget.",
        }

    def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500,
        json_mode: bool = True,
    ) -> str:
        return json.dumps(self.mock_response)


def test_destination_agent_success() -> None:
    """Test successful recommendation processing using mock LLM service."""
    mock_service = MockGroqService()
    agent = DestinationAgent(groq_service=mock_service)

    input_payload = {
        "city": "Hyderabad",
        "budget": 15000,
        "days": 3,
        "interest": "Nature",
    }

    result = agent.get_destination(input_payload)

    assert isinstance(result, DestinationOutput)
    assert result.destination == "Coorg"
    assert "budget" in result.reason.lower() or "waterfalls" in result.reason.lower()


def test_destination_agent_invalid_budget() -> None:
    """Test input validation failure when budget is negative or zero."""
    mock_service = MockGroqService()
    agent = DestinationAgent(groq_service=mock_service)

    invalid_input = {
        "city": "Hyderabad",
        "budget": -500,
        "days": 3,
        "interest": "Nature",
    }

    with pytest.raises(DestinationAgentError) as exc_info:
        agent.get_destination(invalid_input)

    assert "Invalid travel preferences input" in str(exc_info.value)


def main() -> None:
    """Example execution script."""
    print("=" * 60)
    print("      AGENTIC AI TRAVEL PLANNER - DESTINATION AGENT      ")
    print("=" * 60)

    sample_input = {
        "city": "Hyderabad",
        "budget": 15000,
        "days": 3,
        "interest": "Nature",
    }

    print("\nINPUT REQUEST:")
    print(json.dumps(sample_input, indent=2))

    # Initialize agent (uses MockGroqService if GROQ_API_KEY is not set)
    try:
        agent = DestinationAgent()
        print("\n[INFO] Calling DestinationAgent with live Groq API...")
    except Exception as exc:
        print(f"\n[INFO] GROQ_API_KEY not found ({exc}). Using Mock Service for demonstration.")
        agent = DestinationAgent(groq_service=MockGroqService())

    try:
        response: DestinationOutput = agent.get_destination(sample_input)

        print("\nEXPECTED OUTPUT:")
        print(json.dumps(response.model_dump(), indent=2))
        print("\nExecution successful!")

    except DestinationAgentError as err:
        print(f"\n[ERROR] Destination Agent Execution Failed: {err}", file=sys.stderr)


if __name__ == "__main__":
    main()