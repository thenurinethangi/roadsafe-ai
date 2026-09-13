"""
Loads the precomputed risk data into the database.

Seeding is separate from the API on purpose. The app reads this data on
every request but never writes it, so it is loaded once, offline.
"""

import pandas as pd

from app.db.models import GridCell, HotspotCluster
from app.db.session import SessionLocal
from app.config import settings

PROCESSED_DIR = settings.MODEL_DIR.parent / "data" / "processed"

GRID_FILE = PROCESSED_DIR / "grid_risk.parquet"
HOTSPOT_FILE = PROCESSED_DIR / "hotspot_clusters.parquet"


def seed_grid(db):
    if not GRID_FILE.exists():
        print(f"SKIPPED grid_cells - {GRID_FILE.name} not found yet")
        return

    df = pd.read_parquet(GRID_FILE)

    # Clear first, so re-running does not create duplicate rows
    db.query(GridCell).delete()

    for row in df.itertuples():
        db.add(GridCell(
            lat_bin=row.lat_bin,
            lon_bin=row.lon_bin,
            total_collisions=int(row.total),
            fatal_count=int(row.fatal),
            serious_count=int(row.serious),
            slight_count=int(row.slight),
            severity_index=float(row.severity_index),
        ))

    db.commit()
    print(f"Loaded {len(df)} grid cells")


def seed_hotspots(db):
    if not HOTSPOT_FILE.exists():
        print(f"SKIPPED hotspot_clusters - {HOTSPOT_FILE.name} not found yet")
        return

    df = pd.read_parquet(HOTSPOT_FILE)

    db.query(HotspotCluster).delete()

    for row in df.itertuples():
        db.add(HotspotCluster(
            cluster_id=int(row.cluster),
            centre_lat=float(row.centre_lat),
            centre_lon=float(row.centre_lon),
            radius_km=float(row.radius_km),
            total_collisions=int(row.total_collisions),
            severe_rate=float(row.severe_rate),
            risk_band=str(row.risk_band),
        ))

    db.commit()
    print(f"Loaded {len(df)} hotspot clusters")


def main():
    db = SessionLocal()
    try:
        seed_grid(db)
        seed_hotspots(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()


