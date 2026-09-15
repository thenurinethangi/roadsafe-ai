from datetime import timedelta
from functools import lru_cache
from zoneinfo import ZoneInfo

import httpx
from astral import Observer
from astral.sun import sun

from app.config import settings

UK = ZoneInfo("Europe/London")

# One reused connection is about 2 seconds faster than reconnecting every request
http_client = httpx.Client(timeout=15)

FINE, RAIN, SNOW, FINE_WIND, RAIN_WIND, SNOW_WIND, FOG, OTHER = 1, 2, 3, 4, 5, 6, 7, 8
DRY, WET, SNOW_SURFACE, ICE = 1, 2, 3, 4
DAYLIGHT, DARK_LIT, DARK_NO_LIGHTING = 1, 4, 6
URBAN, RURAL = 1, 2

# Beaufort 7, "near gale"
HIGH_WIND_KMH = 50

RAIN_CODES = {51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99}
SNOW_CODES = {71, 73, 75, 77, 85, 86}
FOG_CODES = {45, 48}
CLEAR_CODES = {0, 1, 2, 3}

SUMMARY_WORDS = {
    FINE: "Fine",
    RAIN: "Rain",
    SNOW: "Snow",
    FINE_WIND: "High winds",
    RAIN_WIND: "Rain and high winds",
    SNOW_WIND: "Snow and high winds",
    FOG: "Fog",
    OTHER: "Mixed conditions",
}


def wmo_to_stats19(wmo_code, wind_kmh):
    windy = wind_kmh >= HIGH_WIND_KMH

    if wmo_code in FOG_CODES:
        return FOG
    if wmo_code in SNOW_CODES:
        return SNOW_WIND if windy else SNOW
    if wmo_code in RAIN_CODES:
        return RAIN_WIND if windy else RAIN
    if wmo_code in CLEAR_CODES:
        return FINE_WIND if windy else FINE
    return OTHER


def road_surface(wmo_code, precipitation_mm, temperature_c):
    if wmo_code in SNOW_CODES:
        return SNOW_SURFACE
    if temperature_c <= 0:
        return ICE
    if precipitation_mm > 0:
        return WET
    return DRY


def light_conditions(lat, lon, when, speed_limit):
    times = sun(Observer(latitude=lat, longitude=lon), date=when.date(), tzinfo=UK)

    if times["sunrise"] <= when <= times["sunset"]:
        return DAYLIGHT

    # In UK law a road with street lighting defaults to 30 mph,
    # so 30 mph and below is treated as lit
    return DARK_LIT if speed_limit <= 30 else DARK_NO_LIGHTING


def area_type(speed_limit):
    return URBAN if speed_limit <= 30 else RURAL


@lru_cache(maxsize=64)
def _fetch_forecast(points, day):
    params = {
        "latitude": ",".join(str(lat) for lat, _ in points),
        "longitude": ",".join(str(lon) for _, lon in points),
        "hourly": "weather_code,precipitation,temperature_2m,wind_speed_10m",
        "timezone": "Europe/London",
        "start_date": day.isoformat(),
        # Include the next day so a journey crossing midnight still finds its hour
        "end_date": (day + timedelta(days=1)).isoformat(),
    }

    response = http_client.get(settings.WEATHER_BASE_URL, params=params)
    response.raise_for_status()
    data = response.json()

    # One location comes back as an object, several as a list
    return data if isinstance(data, list) else [data]


def _typical_conditions(month):
    # Most common in our own 5 years of data: always Fine, Dry except December
    return FINE, (WET if month == 12 else DRY)


def get_conditions(points):
    """
    points: list of dicts with lat, lon, time and speed_limit.
    Returns (conditions per point, whether a real forecast was used).
    """
    for p in points:
        if p["time"].tzinfo is None:
            p["time"] = p["time"].replace(tzinfo=UK)

    try:
        forecast = _forecast_for(points)
        weather_available = True
    except (httpx.HTTPError, KeyError, ValueError):
        forecast = None
        weather_available = False

    conditions = []
    for i, p in enumerate(points):
        if forecast:
            weather, surface, precip, temp, wind = forecast[i]
        else:
            weather, surface = _typical_conditions(p["time"].month)
            precip = temp = wind = None

        conditions.append({
            "weather_conditions": weather,
            "road_surface_conditions": surface,
            "light_conditions": light_conditions(p["lat"], p["lon"], p["time"], p["speed_limit"]),
            "urban_or_rural_area": area_type(p["speed_limit"]),
            "precipitation_mm": precip,
            "temperature_c": temp,
            "wind_kmh": wind,
        })

    return conditions, weather_available


def _forecast_for(points):
    rounded = tuple((round(p["lat"], 2), round(p["lon"], 2)) for p in points)
    locations = _fetch_forecast(rounded, points[0]["time"].date())

    results = []
    for p, location in zip(points, locations):
        hourly = location["hourly"]
        i = hourly["time"].index(p["time"].strftime("%Y-%m-%dT%H:00"))

        code = hourly["weather_code"][i]
        temp = hourly["temperature_2m"][i]
        wind = hourly["wind_speed_10m"][i]

        # Roads stay wet for a while after rain stops
        precip = max(hourly["precipitation"][i], hourly["precipitation"][max(i - 1, 0)])

        results.append((
            wmo_to_stats19(code, wind),
            road_surface(code, precip, temp),
            precip,
            temp,
            wind,
        ))

    return results


def summarise(conditions, weather_available):
    if not weather_available:
        return "No forecast for this date yet - scored with typical conditions for the month"

    words = list(dict.fromkeys(SUMMARY_WORDS[c["weather_conditions"]] for c in conditions))
    temps = [c["temperature_c"] for c in conditions]
    low, high = round(min(temps)), round(max(temps))
    temp_text = f"{low}°C" if low == high else f"{low}-{high}°C"

    return f"{', '.join(words)}, {temp_text}"
