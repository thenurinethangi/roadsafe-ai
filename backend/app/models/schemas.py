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

from pydantic import BaseModel, ConfigDict, Field


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
    label: str                      # "Safest" / "Fastest" / "Safest and fastest" / "Alternative"

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


class HotspotZone(BaseModel):
    """One k-Means collision zone for the map."""

    model_config = ConfigDict(from_attributes=True)

    cluster_id: int
    centre_lat: float
    centre_lon: float
    radius_km: float
    total_collisions: int
    severe_rate: float
    risk_band: Literal["low", "moderate", "high"]


class HourCount(BaseModel):
    hour: int
    collisions: int


class SeverityShare(BaseModel):
    label: str
    collisions: int
    fatal_pct: float
    serious_pct: float
    slight_pct: float


class SeverityTotals(BaseModel):
    fatal: int
    serious: int
    slight: int


class MonthCount(BaseModel):
    month: str          # "2021-01"
    collisions: int
    severe: int
    fatal: int = 0


class YearSummary(BaseModel):
    year: int
    collisions: int
    severe_pct: float


class InsightsResponse(BaseModel):
    """Dashboard chart data, worked out once from the cleaned collisions."""

    total_collisions: int
    collisions_by_hour: list[HourCount]
    severity_by_weather: list[SeverityShare]
    severity_by_road_type: list[SeverityShare]

    # Added later, so an older insights.json still loads
    severity_totals: SeverityTotals | None = None
    collisions_by_month: list[MonthCount] = []
    collisions_by_year: list[YearSummary] = []
    day_hour: list[list[int]] = Field(default=[], description="7 rows Monday to Sunday, 24 hours each")
    severity_by_light: list[SeverityShare] = []
    severity_by_speed_limit: list[SeverityShare] = []
    severity_by_area: list[SeverityShare] = []


# route history

class RouteHistoryRequest(BaseModel):
    """Body of POST /api/journey/history."""

    geometry: list[tuple[float, float]] = Field(
        ...,
        min_length=2,
        max_length=50_000,
        description="[lat, lon] points of one route, as returned by /journey/analyze",
    )


class DayCount(BaseModel):
    day: str
    collisions: int


class YearCount(BaseModel):
    year: int
    collisions: int


class AlongRoute(BaseModel):
    """Collisions counted in equal stretches from the start of the route."""

    bin_km: int
    collisions: list[int]
    severe: list[int]


class RouteHistoryResponse(BaseModel):
    """Police-reported collisions close to one route."""

    corridor_m: int
    first_year: int
    last_year: int
    route_km: float

    total_collisions: int
    fatal: int
    serious: int
    severe_pct: float
    national_severe_pct: float

    by_hour: list[int]
    by_day: list[DayCount]
    by_year: list[YearCount]
    by_light: list[SeverityShare]
    by_surface: list[SeverityShare]
    along_route: AlongRoute
