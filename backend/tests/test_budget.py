"""Tests and execution example for BudgetAgent."""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict
import pytest

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.agents.budget_agent import (
    BudgetAgent,
    BudgetAgentError,
    BudgetInput,
    BudgetOutput,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class MockGroqService:
    """Mock GroqService for unit testing without live API calls."""

    def __init__(self, mock_response: Dict[str, Any] = None) -> None:
        self.mock_response = mock_response or {
            "travel": 3000,
            "stay": 5000,
            "food": 3000,
            "activities": 2000,
            "total": 13000,
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

def test_calculate_budget_success() -> None:
    mock_service = MockGroqService()
    agent = BudgetAgent(groq_service=mock_service)

    input_payload = {
        "destination": "Coorg",
        "budget": 15000,
        "days": 3,
        "travelers": 2,
    }

    result = agent.calculate_budget(input_payload)

    assert isinstance(result, BudgetOutput)
    assert result.travel == 3000
    assert result.stay == 5000
    assert result.food == 3000
    assert result.activities == 2000
    assert result.total == 13000

def test_generate_cost_breakdown_success() -> None:
    mock_service = MockGroqService()
    agent = BudgetAgent(groq_service=mock_service)

    input_model = BudgetInput(
        destination="Coorg",
        budget=15000,
        days=3,
        travelers=2,
    )

    result = agent.generate_cost_breakdown(input_model)

    assert isinstance(result, BudgetOutput)
    assert result.total == 13000

def test_budget_agent_invalid_budget() -> None:
    mock_service = MockGroqService()
    agent = BudgetAgent(groq_service=mock_service)

    invalid_input = {
        "destination": "Coorg",
        "budget": -500,
        "days": 3,
        "travelers": 2,
    }

    with pytest.raises(BudgetAgentError) as exc_info:
        agent.calculate_budget(invalid_input)

    assert "Invalid budget input preferences" in str(exc_info.value)

def test_direct_script_execution() -> None:
    import subprocess
    agent_script = Path(__file__).resolve().parents[1] / "agents" / "budget_agent.py"
    result = subprocess.run([sys.executable, "-u", str(agent_script)], capture_output=True, text=True)
    assert result.returncode == 0, f"Script execution failed: {result.stderr}"
    assert "Budget Agent loaded successfully." in result.stdout

def main() -> None:
    sample_input = {
        "destination": "Coorg",
        "budget": 15000,
        "days": 3,
        "travelers": 2,
    }

    print("INPUT:")
    print(json.dumps(sample_input, indent=2))

    try:
        agent = BudgetAgent()
        print("\n[INFO] Calling BudgetAgent with live Groq API...")
    except Exception as exc:
        print(f"\n[INFO] {exc}. Using MockGroqService for demonstration.")
        agent = BudgetAgent(groq_service=MockGroqService())

    try:
        response: BudgetOutput = agent.calculate_budget(sample_input)
        print("\nOUTPUT:")
        print(json.dumps(response.model_dump(), indent=2))
    except BudgetAgentError as err:
        print(f"\n[ERROR] Budget Agent Execution Failed: {err}", file=sys.stderr)

if __name__ == "__main__":
    main()
