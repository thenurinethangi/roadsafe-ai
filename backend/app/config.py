"""
Backend settings, read from the .env file.

pydantic-settings validates them at startup, so a missing or malformed
value fails immediately instead of halfway through a request.
"""
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://roadsafe:roadsafe@localhost:5432/roadsafe"

    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    WEATHER_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"

    MODEL_DIR: Path = Path("../ml/artifacts")

    class Config:
        env_file = ".env"
        

settings = Settings()
