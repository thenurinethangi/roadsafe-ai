"""
Request and response shapes for the API.

These are Pydantic models. FastAPI uses them for three jobs:
  1. validate every incoming request before our code runs
  2. describe the response, which is what fills in the /docs page
  3. convert Python objects to JSON on the way out

Defining them here means the frontend knows the exact shape to expect
without having to read any backend logic.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# health

class HealthResponse(BaseModel):
    """Returned by GET /api/health."""

    status: str
    model_loaded: bool
    hotspot_model_loaded: bool
    database_connected: bool
    model_version: str | None = None

    # Why something is not loaded, so a failure is readable at a glance
    # instead of needing the server logs.
    detail: str | None = None


# request

class JourneyRequest(BaseModel):
    """
    Body of POST /api/journey/analyze.

    The ge/le bounds are roughly Great Britain. The model was trained only
    on GB collisions, so a journey anywhere else would get a meaningless
    score. Rejecting it here is more honest than returning a number.
    """

    from_lat: float = Field(..., ge=49.0, le=61.0, description="Start latitude")
    from_lon: float = Field(..., ge=-8.0, le=2.0, description="Start longitude")
    to_lat: float = Field(..., ge=49.0, le=61.0, description="End latitude")
    to_lon: float = Field(..., ge=-8.0, le=2.0, description="End longitude")

    departure_time: datetime = Field(
        ...,
        description="When the journey starts. Used for weather and darkness.",
    )


# response

class RiskFactor(BaseModel):
    """
    One readable reason a segment scored the way it did.
    """

    label: str   
    impact: Literal["low", "medium", "high"]


class RouteSegment(BaseModel):
    """One scored piece of a route, roughly 5-10 km long."""

    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float

    safety_score: int = Field(..., ge=0, le=100, description="Higher is safer")
    risk_level: Literal["low", "moderate", "high"]

    road_name: str | None = None
    factors: list[RiskFactor] = []


class Route(BaseModel):
    """One complete route option."""

    route_id: str
    label: str                      # "Safest" / "Fastest" / "Best Balance"

    distance_km: float
    duration_minutes: int

    safety_score: int = Field(..., ge=0, le=100)

    geometry: list[list[float]]

    segments: list[RouteSegment]


class JourneyResponse(BaseModel):
    """Full response of POST /api/journey/analyze."""

    weather_summary: str
    routes: list[Route]

    # True when the weather API worked. False means we fell back to seasonal averages - the app must still work if Open-Meteo is down.
    weather_available: bool = True
