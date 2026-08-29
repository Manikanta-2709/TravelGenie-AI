"""Groq Service Module.

Provides a generic, reusable service for calling the Groq LLM API with environment
variable management, logging, and error handling.
"""

import json
import logging
import os
from typing import Any, Dict, Optional
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
    """Reusable service wrapper for interacting with the Groq API."""

    DEFAULT_MODEL = "groq/compound-mini"
    DEFAULT_API_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        api_url: Optional[str] = None,
        timeout: int = 30,
    ) -> None:
        """Initialize the GroqService instance.

        Args:
            api_key: Groq API key. Defaults to GROQ_API_KEY environment variable.
            model: Groq model name. Defaults to GROQ_MODEL env var or llama-3.3-70b-versatile.
            api_url: Groq API endpoint URL.
            timeout: HTTP request timeout in seconds.
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model = model or os.getenv("GROQ_MODEL", self.DEFAULT_MODEL)
        self.api_url = api_url or os.getenv("GROQ_API_URL", self.DEFAULT_API_URL)
        self.timeout = timeout

        if not self.api_key:
            logger.error("GROQ_API_KEY is not configured in environment or constructor.")
            raise GroqAPIKeyError(
                "GROQ_API_KEY is missing. Please set GROQ_API_KEY in your environment or .env file."
            )

    def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 500,
        json_mode: bool = True,
    ) -> str:
        """Execute a completion request against the Groq API.

        Args:
            system_prompt: System role instructions for the LLM.
            user_prompt: User prompt content.
            temperature: Model sampling temperature (0.0 - 1.0).
            max_tokens: Maximum response token limit.
            json_mode: Enforce strict JSON object response format.

        Returns:
            str: Raw text content response from the model.

        Raises:
            GroqServiceError: When request fails, times out, or returns invalid status.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        logger.info("Executing Groq API call with model: %s", self.model)

        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()

            response_data = response.json()
            choices = response_data.get("choices", [])
            if not choices:
                raise GroqServiceError("Groq API returned a response with no choices.")

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                raise GroqServiceError("Groq API returned empty content in message.")

            logger.info("Groq API request completed successfully.")
            return content.strip()

        except requests.exceptions.Timeout as exc:
            logger.error("Groq API request timed out (%s seconds).", self.timeout)
            raise GroqServiceError(f"Groq API request timed out: {exc}") from exc

        except requests.exceptions.HTTPError as exc:
            status_code = exc.response.status_code if exc.response is not None else "N/A"
            error_body = exc.response.text if exc.response is not None else str(exc)
            logger.error("Groq API HTTP error %s: %s", status_code, error_body)
            raise GroqServiceError(
                f"Groq API call failed with status code {status_code}: {error_body}"
            ) from exc

        except requests.exceptions.RequestException as exc:
            logger.error("Network error during Groq API call: %s", exc)
            raise GroqServiceError(f"Network error while connecting to Groq API: {exc}") from exc

        except Exception as exc:
            logger.error("Unexpected error in GroqService: %s", exc)
            raise GroqServiceError(f"Unexpected Groq service error: {exc}") from exc