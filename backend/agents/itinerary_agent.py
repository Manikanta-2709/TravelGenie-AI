import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Union

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from backend.services.groq_service import GroqService, GroqServiceError
except ModuleNotFoundError:
    from services.groq_service import GroqService, GroqServiceError

logger = logging.getLogger(__name__)


class ItineraryAgentError(Exception):
    """Raised when itinerary generation fails."""


class ItineraryAgent:
    """Generate a day-wise travel itinerary from destination, duration, and interest."""

    def __init__(
        self,
        groq_service: Optional[GroqService] = None,
        prompt_path: Optional[Union[str, Path]] = None,
    ) -> None:
        self.groq_service = groq_service or GroqService()
        self.prompt_path = (
            Path(prompt_path)
            if prompt_path
            else Path(__file__).resolve().parents[1] / "prompts" / "itinerary_prompt.txt"
        )

    def _load_prompt(self) -> str:
        try:
            if not self.prompt_path.exists():
                raise FileNotFoundError(f"Prompt file not found at {self.prompt_path}")
            return self.prompt_path.read_text(encoding="utf-8").strip()
        except Exception as exc:
            logger.error("Failed to load itinerary prompt: %s", exc)
            raise ItineraryAgentError(f"Unable to load itinerary prompt: {exc}") from exc

    def _build_user_prompt(self, destination: str, days: int, interest: str) -> str:
        return (
            f"Create a realistic, detailed day-by-day travel itinerary for {destination}.\n"
            f"- Destination: {destination}\n"
            f"- Trip Duration: {days} days\n"
            f"- Interests: {interest}\n\n"
            f"REQUIREMENT: Name real, specific landmarks, real attractions, exact local food specialties, timestamps (e.g. 08:30 AM, 01:30 PM, 06:00 PM), and the recommended stay_location (hotel or area) for {destination}.\n"
            f"Return strict JSON with keys day1, day2, ... up to day{days}. Each day MUST contain morning, afternoon, evening, stay_location, and places keys.\n"
            f"- places: a JSON array of 3-6 REAL, well-known place names in {destination} visited that day (landmarks, attractions, markets — actual names tourists can find on Google Maps)."
        )

    def _validate_itinerary(self, parsed: Dict[str, Any], days: int = 3, destination: str = "") -> Dict[str, Any]:
        if not isinstance(parsed, dict):
            raise ItineraryAgentError("Generated itinerary is not a valid JSON object.")

        for i in range(1, days + 1):
            day_key = f"day{i}"
            if day_key not in parsed or not isinstance(parsed[day_key], dict):
                parsed[day_key] = {
                    "morning": f"Morning exploration and local sightseeing in {destination}.",
                    "afternoon": f"Afternoon cultural tours and regional dining.",
                    "evening": f"Evening sunset view and market stroll.",
                    "stay_location": f"Recommended hotel/resort in {destination}",
                    "places": [destination],
                }
            day_data = parsed[day_key]
            for slot in ["morning", "afternoon", "evening"]:
                if slot not in day_data or not isinstance(day_data[slot], str):
                    day_data[slot] = f"Explore local highlights and enjoy regional experiences in {destination}."
            if "stay_location" not in day_data or not isinstance(day_data["stay_location"], str):
                day_data["stay_location"] = f"Recommended central hotel / resort in {destination}"
            if not isinstance(day_data.get("places"), list) or not day_data.get("places"):
                day_data["places"] = [destination]

        return parsed


    def generate_itinerary(self, destination: str, days: int, interest: str) -> Dict[str, Any]:
        """Generate a structured itinerary for a destination based on interest and trip length."""
        if not destination or not destination.strip():
            raise ValueError("destination is required.")
        if not isinstance(days, int) or days <= 0:
            raise ValueError("days must be a positive integer.")
        if not interest or not interest.strip():
            raise ValueError("interest is required.")

        system_prompt = self._load_prompt()
        user_prompt = self._build_user_prompt(destination.strip(), days, interest.strip())

        try:
            raw = self.groq_service.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=0.7,
                max_tokens=800,
                json_mode=True,
            )
        except GroqServiceError as exc:
            logger.exception("Groq failed while generating itinerary for %s", destination)
            raise ItineraryAgentError(f"Failed to generate itinerary: {exc}") from exc

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("LLM output was not valid JSON: %s", raw)
            raise ItineraryAgentError("The Groq model returned invalid JSON for the itinerary.") from exc

        validated = self._validate_itinerary(parsed, days, destination.strip())
        logger.info("Itinerary generated successfully for destination=%s, days=%s", destination, days)
        return validated



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    sample = {
        "destination": "Coorg",
        "days": 3,
        "interest": "Nature",
    }

    try:
        agent = ItineraryAgent()
        print(json.dumps(agent.generate_itinerary(sample["destination"], sample["days"], sample["interest"]), ensure_ascii=False, indent=2))
    except Exception as exc:
        print(json.dumps({
            "error": str(exc),
            "demo": {
                "day1": {
                    "morning": "Visit coffee plantations and enjoy a scenic walk.",
                    "afternoon": "Explore Abbey Falls and take a short nature trail.",
                    "evening": "Relax at a hill-view café and enjoy a peaceful sunset.",
                },
                "day2": {
                    "morning": "Start with trekking in the forested hills.",
                    "afternoon": "Visit a local viewpoint and enjoy lunch with valley views.",
                    "evening": "Stroll through a local market and have a quiet dinner.",
                },
                "day3": {
                    "morning": "Take a guided nature walk and enjoy birdwatching.",
                    "afternoon": "Visit a waterfall and spend time at a scenic picnic spot.",
                    "evening": "Enjoy a cozy evening with local cuisine and a sunset viewpoint.",
                },
            },
        }, ensure_ascii=False, indent=2))
