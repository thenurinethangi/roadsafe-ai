"""
ML prediction service.

Features are built by importing ml/src/features.py - the same file used in
training. Never rewrite that logic here: if the two drift apart the model
still runs and still returns numbers, but the numbers are wrong and nothing
crashes to tell us.
"""
import json
import sys

import joblib
import pandas as pd

from app.config import settings

ML_DIR = settings.MODEL_DIR.parent.resolve()
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))


class PredictionService:

    def __init__(self):
        self.model = None
        self.hotspot_model = None
        self.feature_columns: list[str] = []
        self.model_version: str | None = None
        self.load_error: str | None = None

    def load(self) -> None:
        """Load the model once at startup, not per request."""
        model_path = settings.MODEL_DIR / "model.joblib"
        hotspot_path = settings.MODEL_DIR / "hotspot_kmeans.joblib"
        metrics_path = settings.MODEL_DIR / "metrics.json"

        if not model_path.exists():
            self.load_error = f"{model_path.name} not found - model not trained yet"
            return

        self.model = joblib.load(model_path)

        if hotspot_path.exists():
            self.hotspot_model = joblib.load(hotspot_path)

        if metrics_path.exists():
            with open(metrics_path) as f:
                metrics = json.load(f)
            self.feature_columns = metrics.get("feature_columns", [])
            self.model_version = metrics.get("chosen_model")

        self._check_feature_columns()

    def _check_feature_columns(self) -> None:
        """Refuse to serve if features.py no longer produces the trained columns."""
        if not self.feature_columns:
            self.load_error = "metrics.json has no feature_columns list"
            self.model = None
            return

        try:
            from src.features import build_features  # noqa: F401
        except ImportError as exc:
            self.load_error = f"cannot import ml/src/features.py: {exc}"
            self.model = None
            return

        produced = set(self._build_feature_row(self._example_conditions()).columns)
        missing = [c for c in self.feature_columns if c not in produced]

        if missing:
            self.load_error = "feature mismatch - missing: " + ", ".join(missing)
            self.model = None

    @property
    def is_ready(self) -> bool:
        return self.model is not None

    def _build_feature_row(self, conditions: dict) -> pd.DataFrame:
        from src.features import build_features

        return build_features(pd.DataFrame([conditions]))

    def predict_segment(self, conditions: dict) -> dict:
        """
        Chance a collision here would be Fatal / Serious / Slight.

        Not the chance of a collision happening - the training data
        contains only collisions, so that cannot be calculated.
        """
        if not self.is_ready:
            raise RuntimeError(f"Prediction service not ready: {self.load_error}")

        features = self._build_feature_row(conditions)

        # The fitted pipeline expects the training column order
        features = features[self.feature_columns]

        probabilities = self.model.predict_proba(features)[0]

        # Read the class order from the model rather than assuming 1, 2, 3
        return {
            int(cls): float(prob)
            for cls, prob in zip(self.model.classes_, probabilities)
        }

    @staticmethod
    def _example_conditions() -> dict:
        return {
            "latitude": 53.4650,
            "longitude": -2.1900,
            "date": "09/11/2026",
            "time": "19:30",
            "day_of_week": 2,
            "speed_limit": 60,
            "road_type": 6,
            "first_road_class": 3,
            "second_road_class": 6,
            "junction_detail": 0,
            "pedestrian_crossing": 0,
            "light_conditions": 4,
            "weather_conditions": 2,
            "road_surface_conditions": 2,
            "carriageway_hazards": 0,
            "urban_or_rural_area": 2,
            "trunk_road_flag": 2,
        }


prediction_service = PredictionService()
