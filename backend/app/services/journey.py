import logging
import time
from datetime import timedelta
from zoneinfo import ZoneInfo

from app.db.models import PredictionLog
from app.db.session import SessionLocal
from app.errors import RoutingUnavailable
from app.services import scoring
from app.services.prediction import prediction_service
from app.services.routing import get_routes, split_into_segments
from app.services.weather import get_conditions, summarise

UK = ZoneInfo("Europe/London")
CONDITION_KEYS = ["weather_conditions", "road_surface_conditions", "light_conditions", "urban_or_rural_area"]

logger = logging.getLogger(__name__)


def analyse_journey(request, background_tasks):
    started = time.perf_counter()
    departure = _uk_time(request.departure_time)

    routes = get_routes(request.from_lat, request.from_lon, request.to_lat, request.to_lon)
    route_segments = [split_into_segments(route) for route in routes]

    if not all(route_segments):
        raise RoutingUnavailable("Start and end are too close together to score")

    route_points = [_segment_points(r, s, departure) for r, s in zip(routes, route_segments)]

    # One weather request for every segment of every route
    all_points = [point for points in route_points for point in points]
    conditions, weather_available = get_conditions(all_points)

    position = 0
    for route, segments, points in zip(routes, route_segments, route_points):
        route_conditions = conditions[position:position + len(points)]
        position += len(points)

        for segment, point, condition in zip(segments, points, route_conditions):
            segment.update(scoring.score_segment(_model_input(segment, point, condition)))

        route["segments"] = segments
        route["safety_score"] = scoring.route_score(segments)

    routes = scoring.label_routes(routes)
    elapsed_ms = round((time.perf_counter() - started) * 1000)
    # Logged after the response is sent, so a slow database never delays the driver
    background_tasks.add_task(_log_prediction, request, departure, routes, elapsed_ms)

    return {
        "weather_summary": summarise(conditions, weather_available),
        "weather_available": weather_available,
        "routes": routes,
    }


def _uk_time(when):
    if when.tzinfo is None:
        return when.replace(tzinfo=UK)
    return when.astimezone(UK)


def _segment_points(route, segments, departure):
    points = []
    done_km = 0.0

    for segment in segments:
        # The time the driver reaches the middle of this segment
        share = (done_km + segment["length_km"] / 2) / route["distance_km"]
        points.append({
            "lat": segment["mid_lat"],
            "lon": segment["mid_lon"],
            "time": departure + timedelta(minutes=route["duration_minutes"] * share),
            "speed_limit": segment["speed_limit"],
        })
        done_km += segment["length_km"]

    return points


def _model_input(segment, point, condition):
    when = point["time"]
    return {
        "latitude": segment["mid_lat"],
        "longitude": segment["mid_lon"],
        "date": when.strftime("%d/%m/%Y"),
        "time": when.strftime("%H:%M"),
        # Python counts Monday as 0, STATS19 counts Sunday as 1
        "day_of_week": (when.weekday() + 1) % 7 + 1,
        "speed_limit": segment["speed_limit"],
        "road_type": segment["road_type"],
        "first_road_class": segment["first_road_class"],
        **{key: condition[key] for key in CONDITION_KEYS},
    }


def _log_prediction(request, departure, routes, elapsed_ms):
    db = SessionLocal()
    try:
        db.add(PredictionLog(
            from_lat=request.from_lat,
            from_lon=request.from_lon,
            to_lat=request.to_lat,
            to_lon=request.to_lon,
            departure_time=departure.replace(tzinfo=None),
            routes_returned=len(routes),
            best_safety_score=max(route["safety_score"] for route in routes),
            response_time_ms=elapsed_ms,
            model_version=prediction_service.model_version or "unknown",
        ))
        db.commit()
    except Exception:
        # Monitoring must never stop the driver getting their result
        db.rollback()
        logger.exception("Could not write prediction log")
    finally:
        db.close()
