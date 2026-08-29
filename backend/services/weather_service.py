import logging
import os
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


class WeatherServiceError(RuntimeError):
    """Raised when the OpenWeather API cannot provide valid weather data."""


class WeatherService:
    """Fetch current weather data for a city using the OpenWeather API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        session: Optional[requests.Session] = None,
    ) -> None:
        load_dotenv()
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY")
        self.base_url = base_url or "https://api.openweathermap.org/data/2.5/weather"
        self.session = session or requests.Session()

        if not self.api_key:
            raise ValueError("OPENWEATHER_API_KEY is missing. Please set it in your environment or .env file.")

    def get_weather(self, city: str) -> Dict[str, Any]:
        """Return weather metadata for a given city as a JSON-compatible dict."""
        if not city or not city.strip():
            raise ValueError("City name is required.")

        params: Dict[str, Any] = {
            "q": city.strip(),
            "appid": self.api_key,
            "units": "metric",
        }

        try:
            response = self.session.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            logger.exception("OpenWeather API request failed for city=%s", city)
            raise WeatherServiceError(f"Failed to fetch weather for '{city}': {exc}") from exc
        except ValueError as exc:
            logger.exception("OpenWeather API returned invalid JSON for city=%s", city)
            raise WeatherServiceError(f"Invalid weather payload returned for '{city}'.") from exc

        if "main" not in data or "weather" not in data:
            logger.error("OpenWeather payload missing expected fields: %s", data)
            raise WeatherServiceError(f"Weather data for '{city}' is incomplete.")

        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        temperature_c = float(main.get("temp", 0.0))
        humidity = int(main.get("humidity", 0))
        condition = weather.get("main", "Unknown")

        return {
            "city": data.get("name", city.strip()),
            "temperature_c": round(temperature_c, 1),
            "temperature": f"{round(temperature_c, 1)}°C",
            "condition": condition,
            "humidity": f"{humidity}%",
        }
