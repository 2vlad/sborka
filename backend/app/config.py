from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    OPENROUTER_API_KEY: str = ""
    DATABASE_URL: str = "sqlite+aiosqlite:///./sborka.db"
    LLM_MODEL: str = "anthropic/claude-sonnet-4.6"
    IMAGE_MODEL: str = "google/gemini-3-pro-image-preview"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
