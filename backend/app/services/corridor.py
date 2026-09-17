"""
Collision history along one route.

The cleaned collisions are loaded once at startup. The route line is filled
in with points every few metres, and a KD-tree finds every collision close
to the road, so no spatial database is needed.
"""
import math

import numpy as np
import pandas as pd
from scipy.spatial import cKDTree

from app.config import settings
from app.errors import HistoryUnavailable

CORRIDOR_M = 100
STEP_M = 20
MAX_BINS = 50

METRES_PER_DEGREE_LAT = 110_574
METRES_PER_DEGREE_LON_AT_EQUATOR = 111_320

COLUMNS = [
    "latitude", "longitude", "collision_severity", "collision_year",
    "day_of_week", "time", "light_conditions", "road_surface_conditions",
]

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
# STATS19 counts Sunday as 1
WEEKDAY_CODES = [2, 3, 4, 5, 6, 7, 1]

LIGHT_GROUPS = {"Daylight": [1], "Dark, street lights on": [4], "Dark, unlit": [5, 6]}
SURFACE_GROUPS = {"Dry": [1], "Wet or damp": [2], "Snow, frost or ice": [3, 4]}


def _severe_pct(severity):
    return round(float((severity <= 2).mean() * 100), 2) if len(severity) else 0.0


def _densify(route_xy):
    steps = np.diff(route_xy, axis=0)
    lengths = np.hypot(steps[:, 0], steps[:, 1])
    counts = np.maximum(1, np.ceil(lengths / STEP_M).astype(int))

    piece = np.repeat(np.arange(len(lengths)), counts)
    position = np.arange(counts.sum()) - np.repeat(np.cumsum(counts) - counts, counts)
    fraction = (position + 1) / counts[piece]

    points = route_xy[piece] + steps[piece] * fraction[:, None]
    along = np.concatenate([[0.0], np.cumsum(lengths)])[piece] + lengths[piece] * fraction

    return np.vstack([route_xy[:1], points]), np.concatenate([[0.0], along])


def _shares(rows, column, groups):
    shares = []
    for label, codes in groups.items():
        severity = rows.loc[rows[column].isin(codes), "severity"].to_numpy()
        if len(severity) == 0:
            continue
        shares.append({
            "label": label,
            "collisions": len(severity),
            "fatal_pct": round(float((severity == 1).mean() * 100), 2),
            "serious_pct": round(float((severity == 2).mean() * 100), 2),
            "slight_pct": round(float((severity == 3).mean() * 100), 2),
        })
    return shares


class CollisionHistory:

    def __init__(self):
        self.data: pd.DataFrame | None = None
        self.load_error: str | None = None
        self.national_severe_pct = 0.0
        self.first_year = 0
        self.last_year = 0

    @property
    def is_ready(self) -> bool:
        return self.data is not None

    def load(self) -> None:
        path = settings.COLLISIONS_FILE
        if not path.exists():
            self.load_error = f"{path.name} not found"
            return

        raw = pd.read_parquet(path, columns=COLUMNS)
        raw["hour"] = pd.to_numeric(raw["time"].str.slice(0, 2), errors="coerce")
        raw = raw.dropna(subset=["latitude", "longitude", "hour"])

        self.data = pd.DataFrame({
            "lat": raw["latitude"].to_numpy(np.float64),
            "lon": raw["longitude"].to_numpy(np.float64),
            "severity": raw["collision_severity"].to_numpy(np.int8),
            "year": raw["collision_year"].to_numpy(np.int16),
            "day": raw["day_of_week"].to_numpy(np.int8),
            "hour": raw["hour"].to_numpy(np.int8),
            "light": raw["light_conditions"].to_numpy(np.int8),
            "surface": raw["road_surface_conditions"].to_numpy(np.int8),
        })
        self.national_severe_pct = _severe_pct(self.data["severity"].to_numpy())
        self.first_year = int(self.data["year"].min())
        self.last_year = int(self.data["year"].max())

    def for_route(self, geometry) -> dict:
        if not self.is_ready:
            raise HistoryUnavailable(self.load_error or "collision data not loaded")

        route = np.asarray(geometry, dtype=np.float64)
        lon_scale = METRES_PER_DEGREE_LON_AT_EQUATOR * math.cos(math.radians(route[:, 0].mean()))
        to_metres = np.array([METRES_PER_DEGREE_LAT, lon_scale])

        points, along_m = _densify(route * to_metres)

        lat_margin = CORRIDOR_M / METRES_PER_DEGREE_LAT
        lon_margin = CORRIDOR_M / lon_scale
        lat = self.data["lat"].to_numpy()
        lon = self.data["lon"].to_numpy()
        in_box = (
            (lat >= route[:, 0].min() - lat_margin) & (lat <= route[:, 0].max() + lat_margin)
            & (lon >= route[:, 1].min() - lon_margin) & (lon <= route[:, 1].max() + lon_margin)
        )
        candidates = np.flatnonzero(in_box)

        candidate_xy = np.column_stack([lat[candidates], lon[candidates]]) * to_metres
        distance, nearest = cKDTree(points).query(candidate_xy, distance_upper_bound=CORRIDOR_M)
        near = np.isfinite(distance)

        rows = self.data.iloc[candidates[near]]
        along_km = along_m[nearest[near]] / 1000
        return self._summarise(rows, along_km, along_m[-1] / 1000)

    def _summarise(self, rows, along_km, route_km) -> dict:
        severity = rows["severity"].to_numpy()

        bin_km = max(1, math.ceil(route_km / MAX_BINS))
        bin_count = max(1, math.ceil(route_km / bin_km))
        bins = np.minimum((along_km // bin_km).astype(int), bin_count - 1)

        return {
            "corridor_m": CORRIDOR_M,
            "first_year": self.first_year,
            "last_year": self.last_year,
            "route_km": round(route_km, 1),
            "total_collisions": len(rows),
            "fatal": int((severity == 1).sum()),
            "serious": int((severity == 2).sum()),
            "severe_pct": _severe_pct(severity),
            "national_severe_pct": self.national_severe_pct,
            "by_hour": np.bincount(rows["hour"].to_numpy(int), minlength=24)[:24].tolist(),
            "by_day": [
                {"day": name, "collisions": int((rows["day"] == code).sum())}
                for name, code in zip(WEEKDAYS, WEEKDAY_CODES)
            ],
            "by_year": [
                {"year": year, "collisions": int((rows["year"] == year).sum())}
                for year in range(self.first_year, self.last_year + 1)
            ],
            "by_light": _shares(rows, "light", LIGHT_GROUPS),
            "by_surface": _shares(rows, "surface", SURFACE_GROUPS),
            "along_route": {
                "bin_km": bin_km,
                "collisions": np.bincount(bins, minlength=bin_count).tolist(),
                "severe": np.bincount(bins, weights=severity <= 2, minlength=bin_count).astype(int).tolist(),
            },
        }


collision_history = CollisionHistory()
