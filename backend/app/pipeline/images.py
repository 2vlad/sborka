from __future__ import annotations

import asyncio
import base64
import logging
import random
import time
from pathlib import Path

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.events import AssetReadyEvent
from app.sse.event_bus import event_bus

logger = logging.getLogger(__name__)

GENERATED_DIR = Path("generated_images")


def _aspect_to_dimensions(aspect_ratio: str) -> tuple[int, int]:
    """Convert aspect ratio string to placeholder dimensions."""
    ratios = {
        "16:9": (800, 450),
        "4:3": (800, 600),
        "1:1": (600, 600),
        "3:2": (800, 533),
    }
    return ratios.get(aspect_ratio, (800, 450))


async def generate_image(
    session_id: str,
    asset_id: str,
    block_id: str,
    image_prompt: str,
    aspect_ratio: str = "16:9",
) -> None:
    """Generate an image via Gemini 2.5 Flash Image through OpenRouter.

    Falls back to mock placeholder if no API key is configured or on error.
    """
    if not settings.OPENROUTER_API_KEY:
        logger.info("No API key configured, falling back to mock image generation")
        await _mock_generate_image(session_id, asset_id, block_id, image_prompt, aspect_ratio)
        return

    try:
        await _real_generate_image(session_id, asset_id, block_id, image_prompt, aspect_ratio)
    except Exception:
        logger.exception("Image generation failed for asset %s, falling back to mock", asset_id)
        await _mock_generate_image(session_id, asset_id, block_id, image_prompt, aspect_ratio)


async def _real_generate_image(
    session_id: str,
    asset_id: str,
    block_id: str,
    image_prompt: str,
    aspect_ratio: str,
) -> None:
    """Call OpenRouter Gemini 2.5 Flash Image to generate an image."""
    client = AsyncOpenAI(
        base_url=settings.OPENROUTER_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY,
    )

    width, height = _aspect_to_dimensions(aspect_ratio)

    prompt = (
        f"Generate a bold, colorful editorial illustration: {image_prompt}. "
        f"Aspect ratio: {aspect_ratio}. "
        "Style: bright solid-color background (green, purple, blue, or orange), "
        "hand-drawn ink outlines, flat characters with exaggerated proportions, "
        "wide landscape composition, no text or labels on the image."
    )

    logger.info("Requesting image generation for asset %s via %s", asset_id, settings.IMAGE_MODEL)

    t0 = time.perf_counter()
    response = await client.chat.completions.create(
        model=settings.IMAGE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        extra_body={"modalities": ["image", "text"]},
    )
    duration = time.perf_counter() - t0

    # Extract image from response
    message = response.choices[0].message
    images = getattr(message, "model_extra", {}).get("images", [])

    if not images:
        raise ValueError("No images returned in response")

    raw = images[0]

    # OpenRouter returns {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    if isinstance(raw, dict):
        data_url = raw.get("image_url", {}).get("url", "")
        # Strip data URI prefix: "data:image/png;base64,..."
        if ";base64," in data_url:
            image_b64 = data_url.split(";base64,", 1)[1]
        else:
            raise ValueError("Unexpected image_url format")
    else:
        image_b64 = raw

    ext = "png"

    # Save to disk
    GENERATED_DIR.mkdir(exist_ok=True)
    filename = f"{asset_id}.{ext}"
    filepath = GENERATED_DIR / filename
    filepath.write_bytes(base64.b64decode(image_b64))

    url = f"/generated_images/{filename}"
    size_bytes = filepath.stat().st_size

    event_bus.emit(
        session_id,
        AssetReadyEvent(
            session_id=session_id,
            asset_id=asset_id,
            url=url,
        ),
    )

    logger.info(
        "Image generation completed",
        extra={
            "event": "image_generation",
            "asset_id": asset_id,
            "model": settings.IMAGE_MODEL,
            "duration_s": round(duration, 2),
            "size_bytes": size_bytes,
            "mock": False,
        },
    )
    if duration > 60:
        logger.warning("Image generation slow: %.1fs (asset=%s)", duration, asset_id)


async def _mock_generate_image(
    session_id: str,
    asset_id: str,
    block_id: str,
    image_prompt: str,
    aspect_ratio: str = "16:9",
) -> None:
    """Simulate image generation with a delay, then emit asset_ready.

    Uses placehold.co to generate a placeholder image URL.
    """
    delay = random.uniform(3.0, 5.0)
    logger.info(
        "Starting mock image generation for asset %s (delay=%.1fs)",
        asset_id,
        delay,
    )

    t0 = time.perf_counter()
    await asyncio.sleep(delay)

    width, height = _aspect_to_dimensions(aspect_ratio)
    url = (
        f"https://placehold.co/{width}x{height}/e8edf2/4a5568"
        f"?text={_short_label(image_prompt)}&font=roboto"
    )

    event_bus.emit(
        session_id,
        AssetReadyEvent(
            session_id=session_id,
            asset_id=asset_id,
            url=url,
        ),
    )

    duration = time.perf_counter() - t0
    logger.info(
        "Image generation completed",
        extra={
            "event": "image_generation",
            "asset_id": asset_id,
            "duration_s": round(duration, 2),
            "mock": True,
        },
    )


def _short_label(prompt: str) -> str:
    """Create a short URL-safe label from the prompt for the placeholder."""
    words = prompt.split()[:4]
    label = "+".join(words)
    return label[:40]
