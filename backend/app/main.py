"""
RoadSafe AI - FastAPI entry point.
"""
from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(
    title="RoadSafe AI API",
    description="Route safety scoring built on UK STATS19 collision data.",
    version="0.1.0",
)

app.include_router(router)
