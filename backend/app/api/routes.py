"""
All API endpoints.

Routes stay thin on purpose: take the request, call a service, return the
response. The real work lives in app/services/, so the prediction service
is a proper layer rather than logic buried inside a URL handler.
"""
from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.db.session import engine
from app.models.schemas import HealthResponse

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

    model_file = settings.MODEL_DIR / "model.joblib"
    hotspot_file = settings.MODEL_DIR / "hotspot_kmeans.joblib"

    return HealthResponse(
        status="ok",
        model_loaded=model_file.exists(),
        hotspot_model_loaded=hotspot_file.exists(),
        database_connected=_database_is_reachable(),
        model_version=None,
    )
