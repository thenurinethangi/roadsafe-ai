"""
All API endpoints.
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import HotspotCluster
from app.db.session import engine, get_db
from app.errors import PredictionUnavailable
from app.models.schemas import (
    HealthResponse,
    HotspotZone,
    InsightsResponse,
    JourneyRequest,
    JourneyResponse,
    RouteHistoryRequest,
    RouteHistoryResponse,
)
from app.services.corridor import collision_history
from app.services.journey import analyse_journey
from app.services.prediction import prediction_service

# prefix="/api" is applied to every route below
router = APIRouter(prefix="/api")


def _database_is_reachable() -> bool:

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@router.get("/health", response_model=HealthResponse)
def health():

    return HealthResponse(
        status="ok",
        model_loaded=prediction_service.is_ready,
        hotspot_model_loaded=prediction_service.hotspot_model is not None,
        database_connected=_database_is_reachable(),
        model_version=prediction_service.model_version,
        detail=prediction_service.load_error,
    )


@router.post("/journey/analyze", response_model=JourneyResponse)
def analyze_journey(request: JourneyRequest, db: Session = Depends(get_db)):
    return analyse_journey(request, db)


@router.post("/journey/history", response_model=RouteHistoryResponse)
def route_history(request: RouteHistoryRequest):
    return collision_history.for_route(request.geometry)


@router.get("/hotspots", response_model=list[HotspotZone])
def hotspots(
    lat_min: float | None = None,
    lat_max: float | None = None,
    lon_min: float | None = None,
    lon_max: float | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(HotspotCluster)

    if lat_min is not None:
        query = query.filter(HotspotCluster.centre_lat >= lat_min)
    if lat_max is not None:
        query = query.filter(HotspotCluster.centre_lat <= lat_max)
    if lon_min is not None:
        query = query.filter(HotspotCluster.centre_lon >= lon_min)
    if lon_max is not None:
        query = query.filter(HotspotCluster.centre_lon <= lon_max)

    return query.order_by(HotspotCluster.severe_rate.desc()).all()


@router.get("/insights/summary", response_model=InsightsResponse)
def insights_summary():
    path = settings.MODEL_DIR / "insights.json"
    if not path.exists():
        raise HTTPException(status_code=503, detail="insights.json missing - run scripts.build_insights")

    return json.loads(path.read_text())


@router.get("/model/metrics")
def model_metrics():
    path = settings.MODEL_DIR / "metrics.json"
    if not path.exists():
        raise PredictionUnavailable("metrics.json not found - model not trained yet")

    return json.loads(path.read_text())
