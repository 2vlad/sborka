from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.blocks import Block
from app.schemas.session import PlanNode

# ---------------------------------------------------------------------------
# SSE Event types — discriminated union on "type" field
# ---------------------------------------------------------------------------


class SessionCreatedEvent(BaseModel):
    type: Literal["session_created"] = "session_created"
    session_id: str


class ClassificationReadyEvent(BaseModel):
    type: Literal["classification_ready"] = "classification_ready"
    session_id: str
    scale: Literal["lesson", "topic", "module", "profession"]
    title: str
    time_estimate: str


class OutlineReadyEvent(BaseModel):
    type: Literal["outline_ready"] = "outline_ready"
    session_id: str
    outline: list[PlanNode]


class LessonScaffoldReadyEvent(BaseModel):
    type: Literal["lesson_scaffold_ready"] = "lesson_scaffold_ready"
    session_id: str
    lesson_id: str
    blocks: list[Block]


class BlockStartedEvent(BaseModel):
    type: Literal["block_started"] = "block_started"
    session_id: str
    lesson_id: str
    block_id: str


class BlockDeltaEvent(BaseModel):
    type: Literal["block_delta"] = "block_delta"
    session_id: str
    lesson_id: str
    block_id: str
    delta: str


class BlockReadyEvent(BaseModel):
    type: Literal["block_ready"] = "block_ready"
    session_id: str
    lesson_id: str
    block_id: str
    payload: dict


class AssetReservedEvent(BaseModel):
    type: Literal["asset_reserved"] = "asset_reserved"
    session_id: str
    lesson_id: str
    block_id: str
    asset_id: str
    aspect_ratio: str
    caption: str


class AssetReadyEvent(BaseModel):
    type: Literal["asset_ready"] = "asset_ready"
    session_id: str
    asset_id: str
    url: str


class ErrorEvent(BaseModel):
    type: Literal["error"] = "error"
    session_id: str
    scope: Literal["session", "lesson", "block", "asset"]
    message: str
    block_id: str | None = None


class DoneEvent(BaseModel):
    type: Literal["done"] = "done"
    session_id: str


class PlanNodeStatusEvent(BaseModel):
    type: Literal["plan_node_status"] = "plan_node_status"
    session_id: str
    node_id: str
    status: str


SSEEvent = (
    SessionCreatedEvent
    | ClassificationReadyEvent
    | OutlineReadyEvent
    | LessonScaffoldReadyEvent
    | BlockStartedEvent
    | BlockDeltaEvent
    | BlockReadyEvent
    | AssetReservedEvent
    | AssetReadyEvent
    | ErrorEvent
    | DoneEvent
    | PlanNodeStatusEvent
)
