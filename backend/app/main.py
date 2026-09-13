"""
RoadSafe AI - FastAPI entry point.

This is the "model serving" layer from Module 6. It loads the trained
model once at startup and exposes it over HTTP.
"""
from fastapi import FastAPI

app = FastAPI(
    title="RoadSafe AI API",
    description="Route safety scoring built on UK STATS19 collision data.",
    version="0.1.0",
)


@app.get("/api/health")
def health():
    return {"status": "ok"}
