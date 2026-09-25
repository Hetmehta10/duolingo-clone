"""Main FastAPI application entry point.

Initializes the FastAPI application, registers startup lifecycle hooks for database table creation
and initial seed population, registers API routers under /api, and provides health check endpoints.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Dict

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.routers.course import router as course_router
from app.routers.dev import router as dev_router
from app.routers.leaderboard import router as leaderboard_router
from app.routers.sessions import router as sessions_router
from app.routers.users import router as users_router
from app.seed import print_summary, seed_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager that ensures database tables exist and are seeded upon startup."""
    # Create all tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Run idempotent seed script
    with SessionLocal() as db:
        seed_db(db)
        print_summary(db)

    yield


app = FastAPI(
    title="Duolingo Clone Backend",
    version="1.0.0",
    description="Backend API for Duolingo Web App Clone - Phase 2 API Layer",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers under /api
api_router = APIRouter(prefix="/api")
api_router.include_router(users_router)
api_router.include_router(course_router)
api_router.include_router(sessions_router)
api_router.include_router(leaderboard_router)
api_router.include_router(dev_router)

app.include_router(api_router)


@app.get("/health", response_model=Dict[str, str], tags=["Health"])
def health_check() -> Dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok"}
