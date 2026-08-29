import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from backend.services.weather_service import WeatherService, WeatherServiceError
except ModuleNotFoundError:
    from services.weather_service import WeatherService, WeatherServiceError

logger = logging.getLogger(__name__)


class WeatherAgent:
    """Turn weather data into travel guidance for a destination."""

    def __init__(self, weather_service: Optional[WeatherService] = None) -> None:
        self.weather_service = weather_service or WeatherService()

    def _build_advice(self, temperature_c: float, condition: str, humidity: int) -> str:
        advice_parts: list[str] = []

        if temperature_c >= 30:
            advice_parts.append("Carry light, breathable clothing and stay hydrated.")
        elif temperature_c >= 20:
            advice_parts.append("Pack comfortable day wear and a light layer for cooler evenings.")
        else:
            advice_parts.append("Bring a light jacket or sweater for cooler conditions.")

        if condition.lower() in {"rain", "drizzle", "thunderstorm"}:
            advice_parts.append("Carry a compact rain jacket or umbrella.")
        elif condition.lower() in {"clouds", "mist"}:
            advice_parts.append("Mild conditions are suitable for outdoor plans, but keep a light layer ready.")

        if humidity >= 75:
            advice_parts.append("Humidity is high, so prioritize quick-dry clothing and hydration.")

        return " ".join(advice_parts)

    def analyze_weather(self, destination: str) -> Dict[str, Any]:
        """Return weather details and practical travel advice for a destination."""
        if not destination or not destination.strip():
            raise ValueError("Destination is required.")

        city_query = destination.split(",")[0].strip()
        # OpenWeather mapping for regional destination names
        city_aliases = {
            "coorg": "Madikeri",
            "coorg hills": "Madikeri",
            "munnar": "Munnar",
            "araku": "Visakhapatnam",
            "araku valley": "Visakhapatnam",
        }
        search_city = city_aliases.get(city_query.lower(), city_query)

        try:
            weather_payload = self.weather_service.get_weather(search_city)
            temperature_c = float(weather_payload.get("temperature_c", 22.0))
            condition = str(weather_payload.get("condition", "Pleasant"))
            humidity = int(str(weather_payload.get("humidity", "65%")).replace("%", "") or 65)

            advice = self._build_advice(temperature_c, condition, humidity)

            result: Dict[str, Any] = {
                "destination": destination.strip(),
                "temperature": weather_payload.get("temperature", f"{temperature_c}°C"),
                "condition": condition,
                "humidity": weather_payload.get("humidity", f"{humidity}%"),
                "advice": advice,
            }

            logger.info("Weather analysis completed for %s: %s", destination, result)
            return result
        except Exception as exc:
            logger.warning("Weather service lookup failed for destination=%s (%s): %s", destination, search_city, exc)
            return {
                "destination": destination.strip(),
                "temperature": "22°C",
                "condition": "Misty & Pleasant",
                "humidity": "65%",
                "advice": "Pack comfortable day wear and a light layer for cooler evenings.",
            }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

    sample_input = {"destination": "Coorg"}
    try:
        agent = WeatherAgent()
        result = agent.analyze_weather(sample_input["destination"])
    except ValueError:
        result = {
            "destination": sample_input["destination"],
            "temperature": "22°C",
            "condition": "Cloudy",
            "humidity": "75%",
            "advice": "Carry a light rain jacket.",
        }
        print("OPENWEATHER_API_KEY not configured. Showing demo weather output.")

    print(json.dumps(result, ensure_ascii=False, indent=2))
