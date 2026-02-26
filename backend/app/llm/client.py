from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Mock data returned when API key is not configured
# ---------------------------------------------------------------------------

_MOCK_CLASSIFICATION = json.dumps(
    {
        "scale": "lesson",
        "title": "Введение в тему",
        "time_estimate": "15-20 минут",
        "outline": [
            {
                "id": str(uuid.uuid4()),
                "type": "lesson",
                "title": "Введение в тему",
                "children": [],
            }
        ],
    },
    ensure_ascii=False,
)

_MOCK_SCAFFOLD = json.dumps(
    [
        {"type": "heading", "payload": {"level": 2, "text": "Введение"}},
        {"type": "markdown", "payload": {"markdown": "Mock content."}},
        {"type": "heading", "payload": {"level": 2, "text": "Итоги"}},
        {"type": "markdown", "payload": {"markdown": "Mock summary."}},
    ],
    ensure_ascii=False,
)

_MOCK_DEFAULT = "Это демонстрационный контент. Настройте OPENROUTER_API_KEY."


class LLMClient:
    """Async wrapper around OpenRouter (OpenAI-compatible) API.

    When ``OPENROUTER_API_KEY`` is empty, all calls return deterministic
    mock responses so the application can run without a real API key.
    """

    def __init__(self) -> None:
        self._api_key = settings.OPENROUTER_API_KEY
        self._model = settings.LLM_MODEL
        self._client: AsyncOpenAI | None = None
        if self._api_key:
            self._client = AsyncOpenAI(
                api_key=self._api_key,
                base_url=settings.OPENROUTER_BASE_URL,
            )

    @property
    def is_mock(self) -> bool:
        return self._client is None

    async def generate(
        self,
        system: str,
        user: str,
        max_tokens: int = 4096,
        label: str | None = None,
    ) -> str:
        """Non-streaming LLM call. Returns the full text response."""
        if self._client is None:
            logger.warning("LLM client running in mock mode (no API key)")
            return self._mock_response(system, user)

        t0 = time.perf_counter()
        response = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        duration = time.perf_counter() - t0

        finish_reason = response.choices[0].finish_reason if response.choices else None
        usage = response.usage
        prompt_tokens = usage.prompt_tokens if usage else None
        completion_tokens = usage.completion_tokens if usage else None
        total_tokens = usage.total_tokens if usage else None

        logger.info(
            "LLM call completed",
            extra={
                "event": "llm_call",
                "label": label,
                "model": self._model,
                "stream": False,
                "duration_s": round(duration, 2),
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "finish_reason": finish_reason,
            },
        )
        if finish_reason == "length":
            logger.warning(
                "LLM response truncated (max_tokens reached), label=%s", label,
            )
        if duration > 30:
            logger.warning("LLM call slow: %.1fs (label=%s)", duration, label)

        return response.choices[0].message.content or ""

    async def generate_stream(
        self,
        system: str,
        user: str,
        max_tokens: int = 4096,
        label: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming LLM call. Yields text deltas as they arrive."""
        if self._client is None:
            logger.warning("LLM client running in mock mode (no API key)")
            mock = self._mock_response(system, user)
            chunk_size = 40
            for i in range(0, len(mock), chunk_size):
                yield mock[i : i + chunk_size]
            return

        t0 = time.perf_counter()
        usage_data: dict | None = None

        stream = await self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            stream=True,
            stream_options={"include_usage": True},
        )
        async for chunk in stream:
            if chunk.usage is not None:
                usage_data = {
                    "prompt_tokens": chunk.usage.prompt_tokens,
                    "completion_tokens": chunk.usage.completion_tokens,
                    "total_tokens": chunk.usage.total_tokens,
                }
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

        duration = time.perf_counter() - t0
        logger.info(
            "LLM call completed",
            extra={
                "event": "llm_call",
                "label": label,
                "model": self._model,
                "stream": True,
                "duration_s": round(duration, 2),
                "prompt_tokens": usage_data["prompt_tokens"] if usage_data else None,
                "completion_tokens": usage_data["completion_tokens"] if usage_data else None,
                "total_tokens": usage_data["total_tokens"] if usage_data else None,
            },
        )
        if duration > 30:
            logger.warning("LLM call slow: %.1fs (label=%s)", duration, label)

    def _mock_response(self, system: str, user: str) -> str:
        """Return a mock response based on prompt hints."""
        system_lower = system.lower()
        if "классификатор" in system_lower or "classifier" in system_lower:
            return _MOCK_CLASSIFICATION
        if "каркас" in system_lower or "scaffold" in system_lower:
            return _MOCK_SCAFFOLD
        return _MOCK_DEFAULT


llm_client = LLMClient()
