from bisect import bisect_left

from app.errors import PredictionUnavailable
from app.services.prediction import prediction_service

# Thirds of the rural collision scale - each lower third had a clearly higher
# real KSI rate. Recheck with scripts.build_score_reference when the model changes.
LOW_RISK_MIN_SCORE = 67
HIGH_RISK_MAX_SCORE = 33

MAX_REASONS = 4

REASON_LABELS = {
    "road_type": {"3": "Dual carriageway", "6": "Single carriageway", "7": "Slip road"},
    "first_road_class": {"1": "Motorway", "2": "A(M) road", "3": "A road", "4": "B road"},
    "weather_conditions": {
        "2": "Rain forecast",
        "3": "Snow forecast",
        "4": "High winds forecast",
        "5": "Rain and high winds forecast",
        "6": "Snow and high winds forecast",
        "7": "Fog forecast",
    },
    "road_surface_conditions": {
        "2": "Wet road surface",
        "3": "Snow on the road",
        "4": "Frost or ice on the road",
        "5": "Flooding on the road",
    },
    "light_conditions": {
        "4": "Travelling after dark",
        "5": "Travelling after dark, street lights off",
        "6": "Travelling after dark on an unlit road",
        "7": "Travelling after dark",
    },
    "urban_or_rural_area": {"2": "Rural road"},
    "is_weekend": {"1": "Weekend travel"},
}


def score_from_ksi(p_ksi):
    reference = prediction_service.score_reference
    if not reference:
        raise PredictionUnavailable("score_reference.json missing - run scripts.build_score_reference")

    # Higher score = lower predicted KSI than more of the recorded rural collisions
    rank = bisect_left(reference, p_ksi)
    return max(0, min(100, 100 - rank))


def risk_level(score):
    if score >= LOW_RISK_MIN_SCORE:
        return "low"
    if score <= HIGH_RISK_MAX_SCORE:
        return "high"
    return "moderate"


def score_segment(conditions):
    probabilities = prediction_service.predict_segment(conditions)
    score = score_from_ksi(probabilities[1] + probabilities[2])

    return {
        "safety_score": score,
        "risk_level": risk_level(score),
        "factors": explain(conditions),
    }


def explain(conditions):
    contributions = prediction_service.ksi_contributions(conditions)
    ranked = sorted(contributions.items(), key=lambda item: item[1], reverse=True)

    labels = []
    for name, value in ranked:
        if value <= 0:
            break
        label = _reason_label(name, conditions)
        if label and label not in labels:
            labels.append(label)
        if len(labels) == MAX_REASONS:
            break

    impacts = ["high", "medium", "low", "low"]
    return [{"label": label, "impact": impacts[i]} for i, label in enumerate(labels)]


def route_score(segments):
    total_km = sum(s["length_km"] for s in segments)
    weighted = sum(s["safety_score"] * s["length_km"] for s in segments)
    return round(weighted / total_km)


def label_routes(routes):
    safest = max(routes, key=lambda r: r["safety_score"])
    fastest = min(routes, key=lambda r: r["duration_minutes"])

    for route in routes:
        if route is safest and route is fastest:
            route["label"] = "Safest and fastest"
        elif route is safest:
            route["label"] = "Safest"
        elif route is fastest:
            route["label"] = "Fastest"
        else:
            route["label"] = "Alternative"

    return sorted(routes, key=lambda r: r["safety_score"], reverse=True)


def _reason_label(feature_name, conditions):
    column = feature_name.split("__", 1)[-1]

    if column == "speed_limit":
        return f"{conditions['speed_limit']} mph speed limit"

    for prefix, labels in REASON_LABELS.items():
        if column.startswith(prefix + "_"):
            return labels.get(column[len(prefix) + 1:])

    return None
