from app.schemas.events import SSEEvent


def encode_sse_event(event: SSEEvent, event_id: int) -> dict:
    """Encode an SSE event into the dict format expected by sse-starlette.

    Returns a dict with ``id``, ``event``, and ``data`` keys.
    """
    return {
        "id": str(event_id),
        "event": event.type,
        "data": event.model_dump_json(),
    }
