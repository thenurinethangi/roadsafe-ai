"""
Ranks the model's predicted KSI (killed or seriously injured) across
recorded rural collisions. Scoring uses these rankings to turn a probability
into a 0-100 safety score.

Run again whenever model.joblib changes:
    python -m scripts.build_score_reference
"""
import json

import numpy as np
import pandas as pd

from app.config import settings
from app.services.prediction import prediction_service
from app.services import scoring

CLEAN_FILE = settings.MODEL_DIR.parent / "data" / "processed" / "collisions_clean.parquet"
OUTPUT = settings.MODEL_DIR / "score_reference.json"


def main():
    prediction_service.load()
    if not prediction_service.is_ready:
        raise SystemExit(f"Model not ready: {prediction_service.load_error}")

    from src.features import build_features

    df = pd.read_parquet(CLEAN_FILE)

    # Journeys between places are mostly on rural roads, so rank against those.
    # Against all collisions, every open road landed in the worst 10%.
    df = df[df["urban_or_rural_area"] == 2]
    features = build_features(df.copy())[prediction_service.feature_columns]

    model = prediction_service.model
    classes = list(model.classes_)
    proba = model.predict_proba(features)
    p_ksi = proba[:, classes.index(1)] + proba[:, classes.index(2)]

    percentiles = np.percentile(p_ksi, range(101)).round(6).tolist()

    with open(OUTPUT, "w") as f:
        json.dump({
            "model_version": prediction_service.model_version,
            "reference": "rural collisions",
            "rows": int(len(p_ksi)),
            "ksi_percentiles": percentiles,
        }, f, indent=2)

    print(f"Saved {OUTPUT.name} from {len(p_ksi):,} rural collisions")

    prediction_service.score_reference = percentiles
    check_bands(p_ksi, df["collision_severity"].isin([1, 2]).to_numpy())


def check_bands(p_ksi, real_ksi):
    """Shows whether each risk band really had more severe collisions."""
    levels = np.array([scoring.risk_level(scoring.score_from_ksi(p)) for p in p_ksi])

    print(f"\nOverall real KSI rate: {real_ksi.mean():.1%}")
    for level in ["low", "moderate", "high"]:
        mask = levels == level
        print(f"  {level:<9} {mask.mean():>6.1%} of collisions, real KSI rate {real_ksi[mask].mean():.1%}")


if __name__ == "__main__":
    main()
