from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.sessions import router as sessions_router
from app.db.engine import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database on startup."""
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized")
    yield


app = FastAPI(
    title="Sborka API",
    description="Generative educational platform backend",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(sessions_router)

# Serve generated images
GENERATED_IMAGES_DIR = Path("generated_images")
GENERATED_IMAGES_DIR.mkdir(exist_ok=True)
app.mount("/generated_images", StaticFiles(directory=str(GENERATED_IMAGES_DIR)), name="generated-images")

# Serve frontend static files if built
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Catch-all route for SPA — serve index.html for non-API routes."""
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        # Try to serve the exact file first
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))

        # Fall back to index.html for SPA routing
        index_path = FRONTEND_DIST / "index.html"
        if index_path.is_file():
            return FileResponse(str(index_path))

        return JSONResponse({"detail": "Not Found"}, status_code=404)
