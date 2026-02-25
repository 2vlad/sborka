from __future__ import annotations

import json
import logging
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.db.engine import get_db
from app.models.lesson import Lesson as LessonModel
from app.models.session import Session as SessionModel
from app.pipeline.orchestrator import run_pipeline
from app.schemas.session import SessionCreate, SessionResponse
from app.sse.encoder import encode_sse_event
from app.sse.event_bus import event_bus


class GenerateRequest(BaseModel):
    skill_level: int | None = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """Create a new generation session (does NOT start the pipeline)."""
    session_id = str(uuid.uuid4())

    # Save session to database
    session = SessionModel(
        id=session_id,
        user_request=body.user_request,
        status="created",
    )
    db.add(session)
    await db.commit()

    logger.info("Session %s created for request: %s", session_id, body.user_request[:100])
    return SessionResponse(session_id=session_id)


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return full session snapshot from DB for hydration after reconnect."""
    session = await db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    classification = None
    if session.classification_json:
        try:
            classification = json.loads(session.classification_json)
        except (json.JSONDecodeError, TypeError):
            pass

    outline = None
    if session.outline_json:
        try:
            outline = json.loads(session.outline_json)
        except (json.JSONDecodeError, TypeError):
            pass

    result = await db.execute(
        select(LessonModel).where(LessonModel.session_id == session_id)
    )
    lesson_rows = result.scalars().all()

    lessons: dict[str, dict] = {}
    for lesson in lesson_rows:
        blocks = []
        if lesson.blocks_json:
            try:
                blocks = json.loads(lesson.blocks_json)
            except (json.JSONDecodeError, TypeError):
                pass
        lessons[lesson.id] = {
            "title": lesson.title,
            "status": lesson.status,
            "blocks": blocks,
        }

    return {
        "session_id": session_id,
        "status": session.status,
        "classification": classification,
        "outline": outline,
        "lessons": lessons,
    }


@router.get("/sessions/{session_id}/events")
async def session_events(
    session_id: str,
    last_event_id: int | None = Query(None, alias="lastEventId"),
) -> EventSourceResponse:
    """SSE endpoint for streaming session events.

    Supports reconnection via ``Last-Event-ID`` header or ``lastEventId`` query param.
    """

    async def event_generator() -> AsyncGenerator[dict, None]:
        async for event_id, event in event_bus.subscribe(
            session_id, last_event_id=last_event_id
        ):
            yield encode_sse_event(event, event_id)

            # Stop streaming after done or error at session scope
            if event.type == "done":
                break

    return EventSourceResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/sessions/{session_id}/generate")
async def trigger_generation(
    session_id: str,
    background_tasks: BackgroundTasks,
    body: GenerateRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger pipeline generation for an existing session."""
    session = await db.get(SessionModel, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    skill_level = body.skill_level if body else None
    background_tasks.add_task(run_pipeline, session_id, session.user_request, skill_level)
    return {"status": "started", "session_id": session_id}
