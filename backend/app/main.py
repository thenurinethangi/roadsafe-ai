"""
RoadSafe AI - FastAPI entry point.

This is the model serving layer from Module 6. Its only jobs are to
create the app, load the model once at startup, and connect the pieces.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.errors import register_error_handlers
from app.services.prediction import prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the server starts, before it accepts any request.

    Loading the model here - not inside a request - is the whole point.
    Every request afterwards reuses the same object in memory.
    """
    prediction_service.load()

    if prediction_service.is_ready:
        print(f"Model loaded: {prediction_service.model_version}")
    else:
        print(f"Model NOT loaded: {prediction_service.load_error}")

    yield


app = FastAPI(
    title="RoadSafe AI API",
    description="Route safety scoring built on UK STATS19 collision data.",
    version="0.1.0",
    lifespan=lifespan,
)

register_error_handlers(app)
app.include_router(router)
