import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.models.base import Base

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

_MIGRATIONS = [
    "ALTER TABLE sessions ADD COLUMN completed_at DATETIME",
    "ALTER TABLE sessions ADD COLUMN error_message VARCHAR(1000)",
    "ALTER TABLE sessions ADD COLUMN error_trace VARCHAR(4000)",
]


async def init_db() -> None:
    """Create all database tables and run idempotent migrations."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with engine.begin() as conn:
        for ddl in _MIGRATIONS:
            try:
                await conn.execute(text(ddl))
                logger.info("Migration applied: %s", ddl)
            except Exception:
                pass  # Column already exists


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
