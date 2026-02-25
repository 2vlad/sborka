from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator

from app.schemas.events import SSEEvent

logger = logging.getLogger(__name__)


class EventBus:
    """In-memory event bus with per-session replay buffer and subscriber queues.

    Each session accumulates events in a replay buffer so that late-joining
    subscribers (or reconnecting clients) can catch up from ``last_event_id``.
    """

    def __init__(self) -> None:
        self._sessions: dict[str, list[SSEEvent]] = {}
        self._subscribers: dict[str, list[asyncio.Queue[SSEEvent | None]]] = {}

    def emit(self, session_id: str, event: SSEEvent) -> None:
        """Append *event* to the session buffer and fan out to all subscribers."""
        buf = self._sessions.setdefault(session_id, [])
        buf.append(event)
        event_idx = len(buf) - 1

        for queue in self._subscribers.get(session_id, []):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.warning(
                    "Subscriber queue full for session %s at event %d — dropping event",
                    session_id,
                    event_idx,
                )

    async def subscribe(
        self,
        session_id: str,
        last_event_id: int | None = None,
    ) -> AsyncGenerator[tuple[int, SSEEvent], None]:
        """Yield ``(event_index, event)`` tuples for the given session.

        If *last_event_id* is provided, replay all events after that index
        before switching to live delivery.
        """
        queue: asyncio.Queue[SSEEvent | None] = asyncio.Queue(maxsize=256)
        subs = self._subscribers.setdefault(session_id, [])
        subs.append(queue)

        try:
            # Replay missed events
            buf = self._sessions.get(session_id, [])
            start = (last_event_id + 1) if last_event_id is not None else 0
            for idx in range(start, len(buf)):
                yield idx, buf[idx]

            # Live events
            next_idx = len(buf)
            while True:
                event = await queue.get()
                if event is None:
                    break
                yield next_idx, event
                next_idx += 1
        finally:
            subs.remove(queue)
            if not subs:
                self._subscribers.pop(session_id, None)

    def close_session(self, session_id: str) -> None:
        """Signal all subscribers that the session is done."""
        for queue in self._subscribers.get(session_id, []):
            try:
                queue.put_nowait(None)
            except asyncio.QueueFull:
                pass

    def get_events(self, session_id: str) -> list[SSEEvent]:
        """Return all buffered events for a session (for debugging)."""
        return list(self._sessions.get(session_id, []))


event_bus = EventBus()
