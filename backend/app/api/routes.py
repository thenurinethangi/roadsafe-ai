"""
All API endpoints.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.db.session import engine
from app.models.schemas import HealthResponse
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
