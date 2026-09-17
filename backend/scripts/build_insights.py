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

COLUMNS = [
    "date", "time", "day_of_week", "collision_severity", "weather_conditions", "road_type",
    "light_conditions", "speed_limit", "urban_or_rural_area",
]

LIGHT_GROUPS = {"Daylight": [1], "Dark, street lights on": [4], "Dark, unlit": [5, 6]}
# STATS19 counts Sunday as 1, the heatmap starts on Monday
MONDAY_FIRST = [2, 3, 4, 5, 6, 7, 1]


def share_row(label, group):
    counts = group["collision_severity"].value_counts()
    total = len(group)
    return {
        "label": label,
        "collisions": total,
        "fatal_pct": round(counts.get(1, 0) / total * 100, 2),
        "serious_pct": round(counts.get(2, 0) / total * 100, 2),
        "slight_pct": round(counts.get(3, 0) / total * 100, 2),
    }


def severity_shares(df, column, labels):
    rows = [share_row(labels[code], group) for code, group in df.groupby(column) if code in labels]
    return sorted(rows, key=lambda row: row["collisions"], reverse=True)


def grouped_shares(df, column, groups):
    return [share_row(label, df[df[column].isin(codes)]) for label, codes in groups.items()]


def main():
    df = pd.read_parquet(CLEAN_FILE, columns=COLUMNS)
    df["hour"] = pd.to_datetime(df["time"], format="%H:%M").dt.hour
    df["month"] = pd.to_datetime(df["date"], format="%d/%m/%Y").dt.to_period("M")
    df["severe"] = df["collision_severity"] <= 2
    df["fatal"] = df["collision_severity"] == 1

    hours = df["hour"].value_counts().sort_index()
    severity = df["collision_severity"].value_counts()
    monthly = df.groupby("month").agg(collisions=("severe", "size"), severe=("severe", "sum"), fatal=("fatal", "sum"))
    yearly = df.groupby(df["month"].dt.year).agg(collisions=("severe", "size"), severe=("severe", "mean"))
    day_hour = df.groupby(["day_of_week", "hour"]).size().unstack(fill_value=0).reindex(columns=range(24), fill_value=0)

    insights = {
        "total_collisions": len(df),
        "collisions_by_hour": [{"hour": int(h), "collisions": int(n)} for h, n in hours.items()],
        "severity_by_weather": severity_shares(df, "weather_conditions", lookups.WEATHER_CONDITIONS),
        "severity_by_road_type": severity_shares(df, "road_type", lookups.ROAD_TYPE),
        "severity_totals": {
            "fatal": int(severity.get(1, 0)),
            "serious": int(severity.get(2, 0)),
            "slight": int(severity.get(3, 0)),
        },
        "collisions_by_month": [
            {"month": str(month), "collisions": int(row.collisions), "severe": int(row.severe), "fatal": int(row.fatal)}
            for month, row in monthly.iterrows()
        ],
        "collisions_by_year": [
            {"year": int(year), "collisions": int(row.collisions), "severe_pct": round(float(row.severe) * 100, 2)}
            for year, row in yearly.iterrows()
        ],
        "day_hour": [[int(n) for n in day_hour.loc[code]] for code in MONDAY_FIRST],
        "severity_by_light": grouped_shares(df, "light_conditions", LIGHT_GROUPS),
        "severity_by_speed_limit": [
            share_row(f"{limit} mph", group) for limit, group in df.groupby("speed_limit")
        ],
        "severity_by_area": [
            share_row(lookups.URBAN_OR_RURAL_AREA[code], df[df["urban_or_rural_area"] == code]) for code in [1, 2]
        ],
    }

    with open(OUTPUT, "w") as f:
        json.dump(insights, f, indent=2)

    print(f"Saved {OUTPUT.name} from {len(df):,} collisions")
    print(f"  months {len(insights['collisions_by_month'])}, years {[y['year'] for y in insights['collisions_by_year']]}")
    for key in ["severity_by_weather", "severity_by_road_type", "severity_by_light", "severity_by_speed_limit", "severity_by_area"]:
        print(f"\n{key}:")
        for row in insights[key]:
            print(f"  {row['label']:<24} {row['collisions']:>7,}  fatal {row['fatal_pct']:>5}%  serious {row['serious_pct']:>5}%")


if __name__ == "__main__":
    main()
