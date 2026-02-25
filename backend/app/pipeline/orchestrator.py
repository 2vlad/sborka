from __future__ import annotations

import json
import logging
import uuid

from app.db.engine import async_session_factory
from app.models.lesson import Lesson as LessonModel
from app.models.session import Session as SessionModel
from app.pipeline.classifier import classify
from app.pipeline.filler import fill_block
from app.pipeline.scaffolder import scaffold_lesson
from app.schemas.events import (
    ClassificationReadyEvent,
    DoneEvent,
    ErrorEvent,
    LessonScaffoldReadyEvent,
    OutlineReadyEvent,
    PlanNodeStatusEvent,
    SessionCreatedEvent,
)
from app.schemas.session import PlanNode
from app.sse.event_bus import event_bus

logger = logging.getLogger(__name__)


def _find_first_lesson(nodes: list[PlanNode]) -> PlanNode | None:
    """Depth-first search for the first lesson node in the outline."""
    for node in nodes:
        if node.type == "lesson":
            return node
        found = _find_first_lesson(node.children)
        if found:
            return found
    return None


async def run_pipeline(session_id: str, user_request: str, skill_level: int | None = None) -> None:
    """Execute the full generation pipeline for a session.

    Steps:
    1. Emit session_created
    2. Classify request -> emit classification_ready + outline_ready
    3. Find first lesson -> scaffold -> emit lesson_scaffold_ready
    4. Fill each block sequentially
    5. Emit done
    """
    try:
        # 1. Session created
        event_bus.emit(
            session_id,
            SessionCreatedEvent(session_id=session_id),
        )

        # 2. Classify
        logger.info("Classifying request for session %s", session_id)
        classification, outline = await classify(user_request)

        # Update session in DB
        async with async_session_factory() as db:
            session_record = await db.get(SessionModel, session_id)
            if session_record:
                session_record.status = "classified"
                session_record.classification_json = json.dumps(
                    {
                        "scale": classification.scale,
                        "title": classification.title,
                        "time_estimate": classification.time_estimate,
                    },
                    ensure_ascii=False,
                )
                session_record.outline_json = json.dumps(
                    [n.model_dump() for n in outline],
                    ensure_ascii=False,
                )
                await db.commit()

        event_bus.emit(
            session_id,
            ClassificationReadyEvent(
                session_id=session_id,
                scale=classification.scale,
                title=classification.title,
                time_estimate=classification.time_estimate,
            ),
        )

        event_bus.emit(
            session_id,
            OutlineReadyEvent(
                session_id=session_id,
                outline=outline,
            ),
        )

        # 3. Find first lesson and scaffold it
        first_lesson = _find_first_lesson(outline)
        if not first_lesson:
            logger.error("No lesson found in outline for session %s", session_id)
            event_bus.emit(
                session_id,
                ErrorEvent(
                    session_id=session_id,
                    scope="session",
                    message="No lessons found in the generated outline",
                ),
            )
            event_bus.emit(session_id, DoneEvent(session_id=session_id))
            return

        lesson_id = first_lesson.lesson_id or str(uuid.uuid4())
        lesson_title = first_lesson.title

        # Update plan node status to generating
        event_bus.emit(
            session_id,
            PlanNodeStatusEvent(
                session_id=session_id,
                node_id=first_lesson.id,
                status="generating",
            ),
        )

        logger.info("Scaffolding lesson '%s' for session %s", lesson_title, session_id)
        blocks = await scaffold_lesson(
            lesson_title=lesson_title,
            lesson_context=user_request,
            skill_level=skill_level,
        )

        # Save lesson to DB
        async with async_session_factory() as db:
            lesson_record = LessonModel(
                id=lesson_id,
                session_id=session_id,
                title=lesson_title,
                blocks_json=json.dumps(
                    [b.model_dump() for b in blocks],
                    ensure_ascii=False,
                ),
                status="scaffolded",
            )
            db.add(lesson_record)
            await db.commit()

        event_bus.emit(
            session_id,
            LessonScaffoldReadyEvent(
                session_id=session_id,
                lesson_id=lesson_id,
                blocks=blocks,
            ),
        )

        # 4. Fill each block sequentially
        logger.info(
            "Filling %d blocks for lesson %s in session %s",
            len(blocks),
            lesson_id,
            session_id,
        )
        for idx, block in enumerate(blocks):
            await fill_block(
                block=block,
                blocks=blocks,
                block_index=idx,
                lesson_title=lesson_title,
                session_id=session_id,
                lesson_id=lesson_id,
                skill_level=skill_level,
            )

        # Update lesson in DB with filled blocks
        async with async_session_factory() as db:
            lesson_record = await db.get(LessonModel, lesson_id)
            if lesson_record:
                lesson_record.blocks_json = json.dumps(
                    [b.model_dump() for b in blocks],
                    ensure_ascii=False,
                )
                lesson_record.status = "ready"
                await db.commit()

        # Update plan node status to ready
        event_bus.emit(
            session_id,
            PlanNodeStatusEvent(
                session_id=session_id,
                node_id=first_lesson.id,
                status="ready",
            ),
        )

        # Update session status
        async with async_session_factory() as db:
            session_record = await db.get(SessionModel, session_id)
            if session_record:
                session_record.status = "done"
                await db.commit()

        # 5. Done
        event_bus.emit(session_id, DoneEvent(session_id=session_id))
        logger.info("Pipeline completed for session %s", session_id)

    except Exception:
        logger.exception("Pipeline error for session %s", session_id)
        event_bus.emit(
            session_id,
            ErrorEvent(
                session_id=session_id,
                scope="session",
                message="Internal pipeline error. Please try again.",
            ),
        )
        event_bus.emit(session_id, DoneEvent(session_id=session_id))

        # Update session status to error
        try:
            async with async_session_factory() as db:
                session_record = await db.get(SessionModel, session_id)
                if session_record:
                    session_record.status = "error"
                    await db.commit()
        except Exception:
            logger.exception("Failed to update session status to error")
