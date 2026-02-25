from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), nullable=False)
    lesson_id: Mapped[str] = mapped_column(String(36), nullable=False)
    block_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="reserved")
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    aspect_ratio: Mapped[str] = mapped_column(String(16), default="16:9")
    caption: Mapped[str] = mapped_column(Text, default="")
    image_prompt: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
