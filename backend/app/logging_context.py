"""Logging context: session_id propagation via contextvars."""

from __future__ import annotations

import contextvars
import logging

session_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "session_id", default=None
)


class SessionContextFilter(logging.Filter):
    """Inject session_id from contextvar into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.session_id = session_id_var.get()  # type: ignore[attr-defined]
        return True
