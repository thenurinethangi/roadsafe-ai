import math
from functools import lru_cache

import httpx

from app.config import settings
from app.errors import RoutingUnavailable

SEGMENT_LENGTH_KM = 8

MOTORWAY, A_M, A_ROAD, B_ROAD, UNCLASSIFIED = 1, 2, 3, 4, 6

# OSRM gives no speed limit or carriageway type, so use typical values per
# road class. STATS19 road_type: 3 = dual carriageway, 6 = single carriageway.
ROAD_DEFAULTS = {
    MOTORWAY: {"road_type": 3, "speed_limit": 70},
    A_M: {"road_type": 3, "speed_limit": 70},
    A_ROAD: {"road_type": 6, "speed_limit": 60},
    B_ROAD: {"road_type": 6, "speed_limit": 60},
    UNCLASSIFIED: {"road_type": 6, "speed_limit": 30},
}


def distance_km(lat1, lon1, lat2, lon2):
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    d_lat = p2 - p1
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(d_lon / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def road_class_from_ref(ref):
    first = (ref or "").split(";")[0].strip().upper()

    if first.startswith("A") and first.endswith("(M)"):
        return A_M
    if first.startswith("M"):
        return MOTORWAY
    if first.startswith("A"):
        return A_ROAD
    if first.startswith("B"):
        return B_ROAD
    return UNCLASSIFIED


@lru_cache(maxsize=128)
def _fetch_routes(from_lat, from_lon, to_lat, to_lon):
    # OSRM wants lon,lat - the opposite order to everything else
    coords = f"{from_lon},{from_lat};{to_lon},{to_lat}"
    url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{coords}"
    params = {
        "alternatives": "true",
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
    }

    try:
        response = httpx.get(url, params=params, timeout=15)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RoutingUnavailable(f"OSRM request failed: {exc}") from exc

    data = response.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingUnavailable(f"OSRM returned no route ({data.get('code')})")

    return data


def get_routes(from_lat, from_lon, to_lat, to_lon):
    # Rounded so near-identical requests reuse the cached response
    data = _fetch_routes(
        round(from_lat, 4), round(from_lon, 4), round(to_lat, 4), round(to_lon, 4)
    )

    routes = []
    for i, raw in enumerate(data["routes"]):
        routes.append({
            "route_id": f"route_{i + 1}",
            "distance_km": round(raw["distance"] / 1000, 1),
            "duration_minutes": round(raw["duration"] / 60),
            "geometry": [[lat, lon] for lon, lat in raw["geometry"]["coordinates"]],
            "steps": raw["legs"][0]["steps"],
        })

    return routes


def split_into_segments(route):
    points = route["geometry"]

    along = [0.0]
    for (lat1, lon1), (lat2, lon2) in zip(points, points[1:]):
        along.append(along[-1] + distance_km(lat1, lon1, lat2, lon2))

    step_ranges = _step_ranges(route["steps"], along[-1])

    segments = []
    start = 0

    for i in range(1, len(points)):
        is_last = i == len(points) - 1
        if along[i] - along[start] < SEGMENT_LENGTH_KM and not is_last:
            continue

        mid_km = (along[start] + along[i]) / 2
        mid = next(j for j in range(start, i + 1) if along[j] >= mid_km)

        step = _main_step(step_ranges, along[start], along[i])
        road_class = road_class_from_ref(step.get("ref"))

        segments.append({
            "start_lat": points[start][0],
            "start_lon": points[start][1],
            "end_lat": points[i][0],
            "end_lon": points[i][1],
            "mid_lat": points[mid][0],
            "mid_lon": points[mid][1],
            "length_km": round(along[i] - along[start], 2),
            "road_name": _road_name(step),
            "first_road_class": road_class,
            **ROAD_DEFAULTS[road_class],
        })

        start = i

    return segments


def _step_ranges(steps, route_km):
    osrm_km = sum(step["distance"] for step in steps) / 1000

    # OSRM's step lengths and our polyline length differ slightly; scale to match
    scale = route_km / osrm_km if osrm_km else 1.0

    ranges = []
    position = 0.0
    for step in steps:
        length = step["distance"] / 1000 * scale
        ranges.append((position, position + length, step))
        position += length

    return ranges


def _main_step(step_ranges, seg_start, seg_end):
    """The road covering most of the segment, not just the one at its midpoint."""
    best_step = step_ranges[-1][2]
    best_overlap = 0.0

    for start, end, step in step_ranges:
        overlap = min(end, seg_end) - max(start, seg_start)
        if overlap > best_overlap:
            best_step = step
            best_overlap = overlap

    return best_step


def _road_name(step):
    ref = (step.get("ref") or "").split(";")[0].strip()
    name = (step.get("name") or "").strip()
    return " ".join(part for part in [ref, name] if part) or None
