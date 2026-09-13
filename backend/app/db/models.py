"""
Database tables.

The database stores PRECOMPUTED values only - historical risk worked out
once from the training data. Live predictions are not stored here; they
are computed per request by the prediction service.
"""
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.db.session import Base


class GridCell(Base):
    """Historical collision counts per ~1km square."""
    __tablename__ = "grid_cells"

    id = Column(Integer, primary_key=True)

    # index=True because every prediction looks a point up by lat/lon
    lat_bin = Column(Float, index=True, nullable=False)
    lon_bin = Column(Float, index=True, nullable=False)

    total_collisions = Column(Integer, nullable=False)
    fatal_count = Column(Integer, nullable=False)
    serious_count = Column(Integer, nullable=False)
    slight_count = Column(Integer, nullable=False)

    # Weighted danger value - fatal counts more than serious, more than slight
    severity_index = Column(Float, nullable=False)


class HotspotCluster(Base):
    """Output of the k-Means clustering. Drawn as zones on the map."""
    __tablename__ = "hotspot_clusters"

    id = Column(Integer, primary_key=True)
    cluster_id = Column(Integer, nullable=False)

    centre_lat = Column(Float, nullable=False)
    centre_lon = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False)

    total_collisions = Column(Integer, nullable=False)

    # Share of collisions here that were fatal or serious
    severe_rate = Column(Float, nullable=False)
    risk_band = Column(String(20), nullable=False)   # low / moderate / high


class PredictionLog(Base):
    """
    Every journey the system scores.

    This is the performance monitoring element from Module 6 - the system
    records what it predicted and how long it took.
    """
    __tablename__ = "prediction_log"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    from_lat = Column(Float, nullable=False)
    from_lon = Column(Float, nullable=False)
    to_lat = Column(Float, nullable=False)
    to_lon = Column(Float, nullable=False)
    departure_time = Column(DateTime, nullable=False)

    routes_returned = Column(Integer, nullable=False)
    best_safety_score = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=False)
    model_version = Column(String(50), nullable=False)
