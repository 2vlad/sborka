from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class PlanNode(BaseModel):
    """A node in the content plan tree."""

    id: str
    type: Literal["profession", "module", "topic", "lesson"]
    title: str
    status: Literal["planned", "generating", "ready"] = "planned"
    children: list[PlanNode] = []
    lesson_id: str | None = None


class SessionCreate(BaseModel):
    """Request body for creating a new generation session."""

    user_request: str


class SessionResponse(BaseModel):
    """Response for session creation."""

    session_id: str
