from __future__ import annotations

import json
import logging
import uuid
from dataclasses import dataclass

from app.llm.client import llm_client
from app.llm.prompts.classifier import CLASSIFIER_SYSTEM_PROMPT
from app.schemas.session import PlanNode

logger = logging.getLogger(__name__)


@dataclass
class ClassificationResult:
    scale: str  # lesson | topic | module | profession
    title: str
    time_estimate: str


def _ensure_node_ids(raw: dict) -> dict:
    """Ensure every node in the outline tree has a valid id."""
    if "id" not in raw or not raw["id"]:
        raw["id"] = str(uuid.uuid4())
    for child in raw.get("children", []):
        _ensure_node_ids(child)
    return raw


def _parse_outline(raw_nodes: list[dict]) -> list[PlanNode]:
    """Recursively parse raw outline dicts into PlanNode models."""
    nodes: list[PlanNode] = []
    for raw in raw_nodes:
        _ensure_node_ids(raw)
        node = PlanNode(
            id=raw["id"],
            type=raw.get("type", "lesson"),
            title=raw.get("title", "Без названия"),
            status="planned",
            children=_parse_outline(raw.get("children", [])),
            lesson_id=raw["id"] if raw.get("type") == "lesson" else None,
        )
        nodes.append(node)
    return nodes


async def classify(user_request: str) -> tuple[ClassificationResult, list[PlanNode]]:
    """Classify user request and build content outline.

    Returns a tuple of (classification, outline_tree).
    """
    response = await llm_client.generate(
        system=CLASSIFIER_SYSTEM_PROMPT,
        user=user_request,
        max_tokens=4096,
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
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.error("Failed to parse classifier response: %s", text[:500])
        # Fallback: single lesson
        fallback_id = str(uuid.uuid4())
        return (
            ClassificationResult(
                scale="lesson",
                title=user_request[:100],
                time_estimate="15-20 минут",
            ),
            [
                PlanNode(
                    id=fallback_id,
                    type="lesson",
                    title=user_request[:100],
                    status="planned",
                    children=[],
                    lesson_id=fallback_id,
                )
            ],
        )

    classification = ClassificationResult(
        scale=data.get("scale", "lesson"),
        title=data.get("title", user_request[:100]),
        time_estimate=data.get("time_estimate", "15-20 минут"),
    )

    raw_outline = data.get("outline", [])
    outline = _parse_outline(raw_outline)

    # If outline is empty, create a single lesson node
    if not outline:
        fallback_id = str(uuid.uuid4())
        outline = [
            PlanNode(
                id=fallback_id,
                type="lesson",
                title=classification.title,
                status="planned",
                children=[],
                lesson_id=fallback_id,
            )
        ]

    return classification, outline
