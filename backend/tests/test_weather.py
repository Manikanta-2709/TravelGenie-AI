import json
import sys
from pathlib import Path
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pytest

from backend.agents.weather_agent import WeatherAgent


class MockWeatherService:
    def get_weather(self, city: str) -> Dict[str, Any]:
        return {
            "city": city,
            "temperature_c": 22.0,
            "temperature": "22.0°C",
            "condition": "Clouds",
            "humidity": "75%",
        }


def test_analyze_weather_returns_expected_fields() -> None:
    agent = WeatherAgent(weather_service=MockWeatherService())

    result = agent.analyze_weather("Coorg")

    assert result["destination"] == "Coorg"
    assert result["temperature"] == "22.0°C"
    assert result["condition"] == "Clouds"
    assert result["humidity"] == "75%"
    assert "advice" in result
    assert isinstance(result["advice"], str)


def test_analyze_weather_rejects_empty_destination() -> None:
    agent = WeatherAgent(weather_service=MockWeatherService())

    with pytest.raises(ValueError):
        agent.analyze_weather("   ")


def test_agent_main_example_output_shape() -> None:
    agent = WeatherAgent(weather_service=MockWeatherService())
    data = agent.analyze_weather("Coorg")

    assert set(data.keys()) == {"destination", "temperature", "condition", "humidity", "advice"}
    json.dumps(data)
