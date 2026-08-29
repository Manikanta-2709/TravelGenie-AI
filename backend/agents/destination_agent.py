"""Destination Agent Module.

Handles user travel preference validation, prompt building, LLM execution,
and structured response parsing for destination recommendations.
"""

import json
import logging
import sys
from pathlib import Path

# Ensure project root is in sys.path when executing script directly
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from typing import Any, Dict, Union
from pydantic import BaseModel, Field, ValidationError

try:
    from backend.services.groq_service import GroqService, GroqServiceError
except ModuleNotFoundError:
    from services.groq_service import GroqService, GroqServiceError

logger = logging.getLogger(__name__)


class DestinationInput(BaseModel):
    """Input model for traveler preferences."""

    city: str = Field(..., min_length=1, description="Source city of travel")
    budget: float = Field(..., gt=0, description="Total travel budget in INR")
    days: int = Field(..., gt=0, description="Duration of the trip in days")
    interest: str = Field(..., min_length=1, description="Primary travel interest/theme")


class DestinationOutput(BaseModel):
    """Output model for destination recommendation."""

    destination: str = Field(..., min_length=1, description="Recommended travel destination")
    reason: str = Field(..., min_length=1, description="Justification for recommendation")


class DestinationAgentError(Exception):
    """Custom exception raised when DestinationAgent fails."""

    pass


class DestinationAgent:
    """Agent responsible for selecting the optimal travel destination."""

    def __init__(
        self,
        groq_service: Union[GroqService, None] = None,
        prompt_path: Union[str, Path, None] = None,
    ) -> None:
        """Initialize DestinationAgent.

        Args:
            groq_service: Optional custom GroqService instance.
            prompt_path: Optional custom path to destination_prompt.txt.
        """
        self.groq_service = groq_service or GroqService()

        if prompt_path:
            self.prompt_path = Path(prompt_path)
        else:
            self.prompt_path = (
                Path(__file__).resolve().parents[1] / "prompts" / "destination_prompt.txt"
            )

    def _load_prompt_template(self) -> str:
        """Load the system prompt template from file."""
        try:
            if not self.prompt_path.exists():
                raise FileNotFoundError(f"Prompt file not found at {self.prompt_path}")
            return self.prompt_path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            logger.error("Failed to load prompt template from %s: %s", self.prompt_path, exc)
            raise DestinationAgentError(f"Error loading system prompt template: {exc}") from exc

    def _build_user_prompt(self, input_data: DestinationInput) -> str:
        """Build the user prompt from validated input criteria."""
        return (
            f"Traveler Request:\n"
            f"- Source City: {input_data.city}\n"
            f"- Budget: INR {input_data.budget:,.2f}\n"
            f"- Trip Duration: {input_data.days} days\n"
            f"- Primary Interest: {input_data.interest}\n\n"
            f"Recommend the single best destination and state the reason in valid JSON format."
        )

    def _clean_and_parse_json(self, raw_llm_response: str) -> Dict[str, Any]:
        """Clean potential markdown wrappers and parse JSON string."""
        cleaned_str = raw_llm_response.strip()

        # Remove markdown fence wrappers if present
        if cleaned_str.startswith("```json"):
            cleaned_str = cleaned_str[7:]
        elif cleaned_str.startswith("```"):
            cleaned_str = cleaned_str[3:]

        if cleaned_str.endswith("```"):
            cleaned_str = cleaned_str[:-3]

        cleaned_str = cleaned_str.strip()

        try:
            return json.loads(cleaned_str)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse JSON response from LLM output: %s", raw_llm_response)
            raise DestinationAgentError("LLM returned non-JSON response string.") from exc

    def get_destination(
        self,
        preferences: Union[Dict[str, Any], DestinationInput],
    ) -> DestinationOutput:
        """Process travel preferences and return a structured destination recommendation.

        Args:
            preferences: Dictionary or DestinationInput object containing traveler criteria.

        Returns:
            DestinationOutput: Pydantic object containing destination and reason.

        Raises:
            DestinationAgentError: On validation failure, Groq service failure, or parsing error.
        """
        # 1. Validate Input
        try:
            if isinstance(preferences, dict):
                input_model = DestinationInput(**preferences)
            elif isinstance(preferences, DestinationInput):
                input_model = preferences
            else:
                raise ValueError("Preferences must be a dict or DestinationInput instance.")
        except (ValidationError, ValueError) as exc:
            logger.error("Input validation failed: %s", exc)
            raise DestinationAgentError(f"Invalid travel preferences input: {exc}") from exc

        # 2. Prepare Prompts
        system_prompt = self._load_prompt_template()
        user_prompt = self._build_user_prompt(input_model)

        # 3. Invoke Groq LLM
        try:
            raw_response = self.groq_service.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.2,
                max_tokens=400,
                json_mode=True,
            )
        except GroqServiceError as exc:
            logger.error("GroqService call failed for DestinationAgent: %s", exc)
            raise DestinationAgentError(f"Groq API recommendation failure: {exc}") from exc

        # 4. Clean & Parse LLM JSON Output
        parsed_dict = self._clean_and_parse_json(raw_response)

        # 5. Validate Output Schema
        try:
            output_model = DestinationOutput(**parsed_dict)
            logger.info("Destination recommendation successful: %s", output_model.destination)
            return output_model
        except ValidationError as exc:
            logger.error("LLM JSON output schema mismatch: %s. Response dict: %s", exc, parsed_dict)
            raise DestinationAgentError(f"Invalid output schema from LLM: {exc}") from exc

if __name__ == "__main__":
    print("Destination Agent loaded successfully.")
