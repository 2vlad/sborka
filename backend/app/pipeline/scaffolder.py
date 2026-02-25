from __future__ import annotations

import json
import logging
import uuid

from app.llm.client import llm_client
from app.llm.prompts.scaffolder import SCAFFOLDER_SYSTEM_PROMPT
from app.schemas.blocks import Block

logger = logging.getLogger(__name__)


def _parse_blocks(raw_blocks: list[dict]) -> list[Block]:
    """Parse raw block dicts into Block models, assigning UUIDs."""
    blocks: list[Block] = []
    for raw in raw_blocks:
        block_type = raw.get("type", "markdown")
        payload = raw.get("payload", {})

        block = Block(
            id=str(uuid.uuid4()),
            type=block_type,
            status="planned",
            payload=payload,
        )
        blocks.append(block)
    return blocks


async def scaffold_lesson(lesson_title: str, lesson_context: str) -> list[Block]:
    """Generate the block scaffold for a lesson.

    Returns a list of Block objects with status='planned' and initial payloads
    (headings filled in, content blocks with placeholder descriptions).
    """
    user_prompt = f"""\
Создайте каркас урока на тему: «{lesson_title}»

Дополнительный контекст:
{lesson_context if lesson_context else "(отсутствует)"}

Верните массив блоков, следуя обязательной 12-секционной структуре урока.
"""

    response = await llm_client.generate(
        system=SCAFFOLDER_SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=8192,
    )

    # Strip markdown code fences if present
    text = response.strip()
    if text.startswith("```"):
        first_newline = text.index("\n")
        text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        raw_blocks = json.loads(text)
    except json.JSONDecodeError:
        logger.error("Failed to parse scaffolder response: %s", text[:500])
        # Return a minimal scaffold on parse failure
        return _minimal_scaffold(lesson_title)

    if not isinstance(raw_blocks, list):
        logger.error("Scaffolder returned non-array: %s", type(raw_blocks))
        return _minimal_scaffold(lesson_title)

    blocks = _parse_blocks(raw_blocks)
    return _inject_hero_image(blocks, lesson_title)


def _inject_hero_image(blocks: list[Block], lesson_title: str) -> list[Block]:
    """Insert a hero image block right after the first heading."""
    hero = Block(
        id=str(uuid.uuid4()),
        type="image",
        status="planned",
        payload={
            "alt": lesson_title,
            "caption": "",
            "aspect_ratio": "21:9",
            "image_prompt": (
                f"Hero illustration for an educational lesson titled "
                f'"{lesson_title}". Modern, clean, minimalist style. '
                f"No text on the image."
            ),
        },
    )
    # Insert after the first heading (index 1), or at the start if no heading
    insert_at = 1
    for i, b in enumerate(blocks):
        if b.type == "heading":
            insert_at = i + 1
            break
    blocks.insert(insert_at, hero)
    return blocks


def _minimal_scaffold(lesson_title: str) -> list[Block]:
    """Return a minimal 3-block scaffold as a fallback."""
    return [
        Block(
            id=str(uuid.uuid4()),
            type="heading",
            status="planned",
            payload={"level": 2, "text": lesson_title},
        ),
        Block(
            id=str(uuid.uuid4()),
            type="markdown",
            status="planned",
            payload={"markdown": ""},
        ),
        Block(
            id=str(uuid.uuid4()),
            type="callout",
            status="planned",
            payload={
                "style": "info",
                "markdown": "Содержимое урока будет сгенерировано.",
            },
        ),
    ]
