"""Budget Agent Module for TravelGenie AI.
Estimates trip expense breakdowns (travel, stay, food, activities, total)
based on destination, max budget, duration, and number of travelers.
"""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Union
from pydantic import BaseModel, Field, ValidationError

# Ensure project root is in sys.path when executing script directly
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from backend.services.groq_service import GroqService, GroqServiceError
except ModuleNotFoundError:
    from services.groq_service import GroqService, GroqServiceError

logger = logging.getLogger(__name__)

class BudgetInput(BaseModel):
    """Input model for travel budget estimation."""
    destination: str = Field(..., min_length=1, description="Target travel destination")
    budget: float = Field(..., gt=0, description="Maximum total budget in INR")
    days: int = Field(..., gt=0, description="Duration of the trip in days")
    travelers: int = Field(1, gt=0, description="Number of travelers")

class BudgetOutput(BaseModel):
    """Output model for itemized travel budget breakdown."""
    travel: float = Field(..., ge=0, description="Estimated transportation cost")
    stay: float = Field(..., ge=0, description="Estimated accommodation cost")
    food: float = Field(..., ge=0, description="Estimated dining and food cost")
    activities: float = Field(..., ge=0, description="Estimated sightseeing and activity cost")
    total: float = Field(..., ge=0, description="Total calculated trip cost")

class BudgetAgentError(Exception):
    """Custom exception raised when BudgetAgent fails."""
    pass

class BudgetAgent:
    """Agent responsible for calculating itemized travel cost breakdowns."""

    def __init__(
        self,
        groq_service: Union[GroqService, None] = None,
        prompt_path: Union[str, Path, None] = None,
    ) -> None:
        self.groq_service = groq_service or GroqService()
        if prompt_path:
            self.prompt_path = Path(prompt_path)
        else:
            self.prompt_path = (
                Path(__file__).resolve().parents[1] / "prompts" / "budget_prompt.txt"
            )

    def _load_prompt_template(self) -> str:
        try:
            if not self.prompt_path.exists():
                raise FileNotFoundError(f"Budget prompt template missing at {self.prompt_path}")
            return self.prompt_path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            logger.error("Failed to load budget prompt template from %s: %s", self.prompt_path, exc)
            raise BudgetAgentError(f"Error loading budget prompt template: {exc}") from exc

    def _build_user_prompt(self, input_data: BudgetInput) -> str:
        return (
            f"Trip Criteria:\n"
            f"- Destination: {input_data.destination}\n"
            f"- Max Budget: INR {input_data.budget:,.2f}\n"
            f"- Trip Duration: {input_data.days} days\n"
            f"- Travelers: {input_data.travelers}\n\n"
            f"Generate itemized cost breakdown (travel, stay, food, activities, total) in valid JSON format."
        )

    def _clean_and_parse_json(self, raw_llm_response: str) -> Dict[str, Any]:
        cleaned_str = raw_llm_response.strip()
        if cleaned_str.startswith("`json"):
            cleaned_str = cleaned_str[7:]
        elif cleaned_str.startswith("`"):
            cleaned_str = cleaned_str[3:]
        if cleaned_str.endswith("`"):
            cleaned_str = cleaned_str[:-3]
        cleaned_str = cleaned_str.strip()
        try:
            return json.loads(cleaned_str)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse JSON from LLM response: %s", raw_llm_response)
            raise BudgetAgentError("LLM returned non-JSON response string.") from exc

    def generate_cost_breakdown(
        self,
        preferences: Union[Dict[str, Any], BudgetInput],
    ) -> BudgetOutput:
        try:
            if isinstance(preferences, dict):
                input_model = BudgetInput(**preferences)
            elif isinstance(preferences, BudgetInput):
                input_model = preferences
            else:
                raise ValueError("Preferences must be a dict or BudgetInput.")
        except (ValidationError, ValueError) as exc:
            logger.error("Budget input validation failed: %s", exc)
            raise BudgetAgentError(f"Invalid budget input preferences: {exc}") from exc

        system_prompt = self._load_prompt_template()
        user_prompt = self._build_user_prompt(input_model)

        try:
            raw_response = self.groq_service.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=400,
                json_mode=True,
            )
        except GroqServiceError as exc:
            logger.error("GroqService call failed for BudgetAgent: %s", exc)
            raise BudgetAgentError(f"Budget API estimation failure: {exc}") from exc

        parsed_dict = self._clean_and_parse_json(raw_response)
        travel = float(parsed_dict.get("travel", 0))
        stay = float(parsed_dict.get("stay", 0))
        food = float(parsed_dict.get("food", 0))
        activities = float(parsed_dict.get("activities", 0))
        parsed_dict["total"] = travel + stay + food + activities

        try:
            output_model = BudgetOutput(**parsed_dict)
            logger.info("Budget breakdown generated successfully: Total INR %s", output_model.total)
            return output_model
        except ValidationError as exc:
            logger.error("Budget output schema mismatch: %s. Dict: %s", exc, parsed_dict)
            raise BudgetAgentError(f"Invalid budget output schema from LLM: {exc}") from exc

    def calculate_budget(
        self,
        preferences: Union[Dict[str, Any], BudgetInput],
    ) -> BudgetOutput:
        return self.generate_cost_breakdown(preferences)

if __name__ == "__main__":
    print("Budget Agent loaded successfully.")
