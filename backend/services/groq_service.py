"""Groq Service Module.

Provides a generic, reusable service for calling the Groq LLM API with environment
variable management, logging, fallback models, and exponential backoff retry handling.
"""

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class GroqServiceError(Exception):
    """Custom exception raised when a Groq API call fails."""

    pass


class GroqAPIKeyError(GroqServiceError):
    """Raised when the Groq API key is missing or unconfigured."""

    pass


class GroqService:
    """Reusable service wrapper for interacting with the Groq API with robust fallback models."""

    DEFAULT_MODEL = "qwen/qwen3.8-27b"
    FALLBACK_MODELS = [
        "qwen/qwen3.8-27b",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "groq/compound-mini",
    ]
    DEFAULT_API_URL = "https://api.groq.com/openai/v1/chat/completions"



    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_url: Optional[str] = None,
        timeout: int = 35,
    ) -> None:
        """Initialize the GroqService instance.

        Args:
            api_key: Groq API key. Defaults to GROQ_API_KEY environment variable.
            model: Groq model name. Defaults to GROQ_MODEL env var or llama-3.3-70b-versatile.
            api_url: Groq API endpoint URL.
            timeout: HTTP request timeout in seconds.
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        configured_model = os.getenv("GROQ_MODEL")
        if configured_model and configured_model != "groq/compound-mini":
            self.model = model or configured_model
        else:
            self.model = model or self.DEFAULT_MODEL
            
        self.api_url = api_url or os.getenv("GROQ_API_URL", self.DEFAULT_API_URL)
        self.timeout = timeout

        if not self.api_key:
            logger.warning("GROQ_API_KEY is not configured in environment or constructor.")

    def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 700,
        json_mode: bool = True,
    ) -> str:
        """Execute a completion request against the Groq API with fallback models and retry on 429."""
        if not self.api_key:
            raise GroqAPIKeyError(
                "GROQ_API_KEY is missing. Please set GROQ_API_KEY in your environment or .env file."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        candidate_models = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
        last_exception: Optional[Exception] = None

        for model_name in candidate_models:
            payload: Dict[str, Any] = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            if json_mode:
                payload["response_format"] = {"type": "json_object"}

            # Try up to 2 attempts per model with short backoff on rate limits
            for attempt in range(2):
                try:
                    logger.info("Calling Groq API model=%s (attempt %d)", model_name, attempt + 1)
                    response = requests.post(
                        self.api_url,
                        headers=headers,
                        json=payload,
                        timeout=self.timeout,
                    )

                    if response.status_code == 429:
                        logger.warning(
                            "Groq rate limit (429) on model=%s, backing off before retry/fallback...",
                            model_name,
                        )
                        time.sleep(1.5 * (attempt + 1))
                        continue

                    response.raise_for_status()

                    response_data = response.json()
                    choices = response_data.get("choices", [])
                    if not choices:
                        raise GroqServiceError("Groq API returned a response with no choices.")

                    content = choices[0].get("message", {}).get("content", "")
                    if not content:
                        raise GroqServiceError("Groq API returned empty content in message.")

                    logger.info("Groq API request completed successfully with model=%s.", model_name)
                    return content.strip()

                except requests.exceptions.Timeout as exc:
                    logger.warning("Groq API request timed out for model=%s: %s", model_name, exc)
                    last_exception = exc
                    time.sleep(1.0)
                except requests.exceptions.HTTPError as exc:
                    status_code = exc.response.status_code if exc.response is not None else "N/A"
                    error_body = exc.response.text if exc.response is not None else str(exc)
                    logger.warning(
                        "Groq API HTTP error %s for model=%s: %s",
                        status_code,
                        model_name,
                        error_body,
                    )
                    last_exception = exc
                    if status_code == 429:
                        time.sleep(1.5)
                        break  # Fallback to next model
                except requests.exceptions.RequestException as exc:
                    logger.warning("Network error on model=%s: %s", model_name, exc)
                    last_exception = exc
                    time.sleep(1.0)
                except Exception as exc:
                    logger.warning("Unexpected error on model=%s: %s", model_name, exc)
                    last_exception = exc

        logger.error("All Groq models failed. Last exception: %s", last_exception)
        raise GroqServiceError(f"All Groq model attempts failed: {last_exception}")