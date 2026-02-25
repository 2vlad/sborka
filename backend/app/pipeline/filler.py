from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid

from app.llm.client import llm_client
from app.llm.prompts.filler import (
    FILLER_SYSTEM_PROMPT,
    build_callout_prompt,
    build_image_prompt_prompt,
    build_markdown_prompt,
    build_practice_prompt,
    build_quiz_prompt,
)
from app.pipeline.images import generate_image
from app.schemas.blocks import Block
from app.schemas.events import (
    AssetReservedEvent,
    BlockDeltaEvent,
    BlockReadyEvent,
    BlockStartedEvent,
    ErrorEvent,
)
from app.sse.event_bus import event_bus

logger = logging.getLogger(__name__)


def _skill_context(skill_level: int | None) -> str:
    """Return a skill-level hint to append to prompts."""
    if skill_level is None:
        return ""
    return (
        f"\n\nУровень ученика: {skill_level}/100 "
        f"(0 — начинающий, 100 — продвинутый). "
        f"Адаптируйте сложность, глубину и терминологию под этот уровень."
    )


def _build_context(blocks: list[Block], current_index: int) -> str:
    """Build context string from previously filled blocks."""
    parts: list[str] = []
    for b in blocks[:current_index]:
        if b.type == "heading" and b.payload.get("text"):
            parts.append(f"## {b.payload['text']}")
        elif b.type == "markdown" and b.payload.get("markdown"):
            parts.append(b.payload["markdown"][:200])
    return "\n\n".join(parts[-6:])  # Last 6 items for context


def _find_heading_for_block(blocks: list[Block], current_index: int) -> str:
    """Find the most recent heading before the current block."""
    for i in range(current_index - 1, -1, -1):
        if blocks[i].type == "heading" and blocks[i].payload.get("text"):
            return blocks[i].payload["text"]
    return "Урок"


async def fill_block(
    block: Block,
    blocks: list[Block],
    block_index: int,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Fill a single block with content, emitting SSE events along the way.

    - heading: already filled by scaffolder, just emit block_ready
    - markdown: stream content via block_delta events
    - quiz_single/quiz_multi: single LLM call, parse JSON
    - practice_task: single LLM call, parse JSON
    - callout: single LLM call or keep existing
    - image: reserve asset, trigger mock generation
    """
    context = _build_context(blocks, block_index)
    heading = _find_heading_for_block(blocks, block_index)

    t0 = time.perf_counter()
    try:
        if block.type == "heading":
            await _fill_heading(block, session_id, lesson_id)

        elif block.type == "markdown":
            await _fill_markdown(block, heading, context, lesson_title, session_id, lesson_id, skill_level)

        elif block.type in ("quiz_single", "quiz_multi"):
            await _fill_quiz(block, heading, context, lesson_title, session_id, lesson_id, skill_level)

        elif block.type == "practice_task":
            await _fill_practice(block, heading, context, lesson_title, session_id, lesson_id, skill_level)

        elif block.type == "callout":
            await _fill_callout(block, heading, context, lesson_title, session_id, lesson_id, skill_level)

        elif block.type == "image":
            await _fill_image(block, heading, context, lesson_title, session_id, lesson_id, skill_level)

        elif block.type == "dialog":
            # Dialog blocks: keep existing payload or mark ready
            await _fill_heading(block, session_id, lesson_id)

        else:
            logger.warning("Unknown block type: %s", block.type)
            block.status = "ready"
            event_bus.emit(
                session_id,
                BlockReadyEvent(
                    session_id=session_id,
                    lesson_id=lesson_id,
                    block_id=block.id,
                    payload=block.payload,
                ),
            )

    except Exception:
        logger.exception("Error filling block %s (type=%s)", block.id, block.type)
        block.status = "error"
        event_bus.emit(
            session_id,
            ErrorEvent(
                session_id=session_id,
                scope="block",
                message=f"Failed to generate content for block {block.id}",
                block_id=block.id,
            ),
        )
    finally:
        duration = time.perf_counter() - t0
        logger.info(
            "Block filled",
            extra={
                "event": "block_fill",
                "block_id": block.id,
                "block_type": block.type,
                "block_index": block_index,
                "block_status": block.status,
                "duration_s": round(duration, 2),
            },
        )


async def _fill_heading(block: Block, session_id: str, lesson_id: str) -> None:
    """Heading blocks are already filled by the scaffolder."""
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )


async def _fill_markdown(
    block: Block,
    heading: str,
    context: str,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Fill a markdown block using streaming."""
    event_bus.emit(
        session_id,
        BlockStartedEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
        ),
    )

    user_prompt = build_markdown_prompt(heading, context, lesson_title) + _skill_context(skill_level)
    full_text = ""

    async for delta in llm_client.generate_stream(
        system=FILLER_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=2048,
        label="fill_markdown",
    ):
        full_text += delta
        event_bus.emit(
            session_id,
            BlockDeltaEvent(
                session_id=session_id,
                lesson_id=lesson_id,
                block_id=block.id,
                delta=delta,
            ),
        )

    block.payload = {"markdown": full_text}
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )


async def _fill_quiz(
    block: Block,
    heading: str,
    context: str,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Fill a quiz block with a single LLM call."""
    event_bus.emit(
        session_id,
        BlockStartedEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
        ),
    )

    user_prompt = build_quiz_prompt(heading, context, lesson_title) + _skill_context(skill_level)
    response = await llm_client.generate(
        system=FILLER_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=2048,
        label="fill_quiz",
    )

    # Parse JSON from response
    text = response.strip()
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse quiz JSON, using scaffold payload: %s", text[:200])
        payload = block.payload  # Keep whatever the scaffolder put in

    block.payload = payload
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )


async def _fill_practice(
    block: Block,
    heading: str,
    context: str,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Fill a practice_task block with a single LLM call."""
    event_bus.emit(
        session_id,
        BlockStartedEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
        ),
    )

    user_prompt = build_practice_prompt(heading, context, lesson_title) + _skill_context(skill_level)
    response = await llm_client.generate(
        system=FILLER_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=2048,
        label="fill_practice",
    )

    # Parse JSON from response
    text = response.strip()
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse practice JSON, using scaffold payload: %s", text[:200])
        payload = block.payload

    block.payload = payload
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )


async def _fill_callout(
    block: Block,
    heading: str,
    context: str,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Fill a callout block."""
    # If the scaffolder already provided good content, keep it
    if block.payload.get("markdown") and len(block.payload["markdown"]) > 20:
        block.status = "ready"
        event_bus.emit(
            session_id,
            BlockReadyEvent(
                session_id=session_id,
                lesson_id=lesson_id,
                block_id=block.id,
                payload=block.payload,
            ),
        )
        return

    event_bus.emit(
        session_id,
        BlockStartedEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
        ),
    )

    user_prompt = build_callout_prompt(heading, context, lesson_title) + _skill_context(skill_level)
    response = await llm_client.generate(
        system=FILLER_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=512,
        label="fill_callout",
    )

    block.payload = {
        "style": block.payload.get("style", "info"),
        "markdown": response.strip(),
    }
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )


async def _fill_image(
    block: Block,
    heading: str,
    context: str,
    lesson_title: str,
    session_id: str,
    lesson_id: str,
    skill_level: int | None = None,
) -> None:
    """Reserve an image asset and generate a content-aware prompt if enough context."""
    image_prompt = block.payload.get("image_prompt", "educational illustration")

    if len(context.strip()) >= 50:
        try:
            user_prompt = build_image_prompt_prompt(heading, context, lesson_title)
            image_prompt = await llm_client.generate(
                system=FILLER_SYSTEM_PROMPT,
                user=user_prompt,
                max_tokens=256,
                label="fill_image_prompt",
            )
            image_prompt = image_prompt.strip().strip('"').strip("'")
            logger.info("Generated content-aware image prompt for block %s", block.id)
        except Exception:
            logger.warning("Failed to generate image prompt for block %s, using scaffold hint", block.id, exc_info=True)

    block.payload["image_prompt"] = image_prompt

    asset_id = str(uuid.uuid4())
    aspect_ratio = block.payload.get("aspect_ratio", "16:9")
    caption = block.payload.get("caption", "")

    event_bus.emit(
        session_id,
        AssetReservedEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            asset_id=asset_id,
            aspect_ratio=aspect_ratio,
            caption=caption,
        ),
    )

    block.payload["asset_id"] = asset_id
    block.status = "ready"
    event_bus.emit(
        session_id,
        BlockReadyEvent(
            session_id=session_id,
            lesson_id=lesson_id,
            block_id=block.id,
            payload=block.payload,
        ),
    )

    # Start image generation in background
    asyncio.create_task(
        generate_image(
            session_id=session_id,
            asset_id=asset_id,
            block_id=block.id,
            image_prompt=image_prompt,
            aspect_ratio=aspect_ratio,
        )
    )
