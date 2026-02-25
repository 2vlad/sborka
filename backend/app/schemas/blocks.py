from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

BlockType = Literal[
    "heading",
    "markdown",
    "quiz_single",
    "quiz_multi",
    "practice_task",
    "callout",
    "dialog",
    "image",
]

BlockStatus = Literal["planned", "generating", "ready", "error"]


# ---------------------------------------------------------------------------
# Payload models
# ---------------------------------------------------------------------------


class HeadingPayload(BaseModel):
    level: Literal[2, 3]
    text: str


class MarkdownPayload(BaseModel):
    markdown: str


class QuizOption(BaseModel):
    id: str
    text: str


class QuizSinglePayload(BaseModel):
    question: str
    options: list[QuizOption]
    correct_option_id: str
    explanation: str


class QuizMultiPayload(BaseModel):
    question: str
    options: list[QuizOption]
    correct_option_ids: list[str]
    explanation: str


class CodeTest(BaseModel):
    label: str
    expression: str


class PracticeTaskPayload(BaseModel):
    description: str
    criteria: list[str]
    code_snippet: str | None = None
    tests: list[CodeTest] | None = None


class CalloutPayload(BaseModel):
    style: Literal["info", "warning", "tip"]
    markdown: str


class DialogMessage(BaseModel):
    role: str
    text: str


class DialogPayload(BaseModel):
    messages: list[DialogMessage]


class ImagePayload(BaseModel):
    alt: str
    caption: str
    aspect_ratio: str = "16:9"
    image_prompt: str
    url: str | None = None


# ---------------------------------------------------------------------------
# Block model
# ---------------------------------------------------------------------------


class Block(BaseModel):
    """A single content block in a lesson document."""

    id: str
    type: BlockType
    status: BlockStatus = "planned"
    payload: dict = Field(default_factory=dict)
