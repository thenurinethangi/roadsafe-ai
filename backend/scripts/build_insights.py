"""
Works out the dashboard chart data once from the cleaned collisions, so the
API never has to load 500k rows.

Run again if the cleaned data changes:
    python -m scripts.build_insights
"""
import json
import sys

import pandas as pd

from app.config import settings

ML_DIR = settings.MODEL_DIR.parent.resolve()
sys.path.insert(0, str(ML_DIR))

from src import lookups  # noqa: E402

CLEAN_FILE = ML_DIR / "data" / "processed" / "collisions_clean.parquet"
OUTPUT = settings.MODEL_DIR / "insights.json"


def severity_shares(df, column, labels):
    rows = []
    for code, group in df.groupby(column):
        if code not in labels:
            continue

        counts = group["collision_severity"].value_counts()
        total = len(group)
        rows.append({
            "label": labels[code],
            "collisions": total,
            "fatal_pct": round(counts.get(1, 0) / total * 100, 2),
            "serious_pct": round(counts.get(2, 0) / total * 100, 2),
            "slight_pct": round(counts.get(3, 0) / total * 100, 2),
        })

    return sorted(rows, key=lambda row: row["collisions"], reverse=True)


def main():
    df = pd.read_parquet(CLEAN_FILE, columns=["time", "collision_severity", "weather_conditions", "road_type"])
    hours = pd.to_datetime(df["time"], format="%H:%M").dt.hour.value_counts().sort_index()

    insights = {
        "total_collisions": len(df),
        "collisions_by_hour": [{"hour": int(h), "collisions": int(n)} for h, n in hours.items()],
        "severity_by_weather": severity_shares(df, "weather_conditions", lookups.WEATHER_CONDITIONS),
        "severity_by_road_type": severity_shares(df, "road_type", lookups.ROAD_TYPE),
    }

    with open(OUTPUT, "w") as f:
        json.dump(insights, f, indent=2)

    print(f"Saved {OUTPUT.name} from {len(df):,} collisions")
    for key in ["severity_by_weather", "severity_by_road_type"]:
        print(f"\n{key}:")
        for row in insights[key]:
            print(f"  {row['label']:<24} {row['collisions']:>7,}  fatal {row['fatal_pct']:>5}%  serious {row['serious_pct']:>5}%")


if __name__ == "__main__":
    main()
