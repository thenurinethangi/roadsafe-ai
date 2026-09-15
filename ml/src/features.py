"""
RoadSafe AI — Feature Engineering
All feature logic lives here so training notebooks and the backend use the exact same code.
"""

from __future__ import annotations
import pandas as pd
import numpy as np
from typing import List, Tuple


CATEGORICAL_COLS: List[str] = [
    "time_of_day",
    "is_weekend",
    "road_type",
    "light_conditions",
    "weather_conditions",
    "road_surface_conditions",
    "urban_or_rural_area",
    "junction_detail",
    "adverse_conditions",
    "speed_x_roadtype",
    "first_road_class",
]

NUMERIC_COLS: List[str] = [
    "hour",
    "month",
    "day_of_year",
    "speed_limit",
    "grid_risk",          # historical severity index from grid
]

# Categories with fewer than 300 rows in collisions_clean.parquet.
# Fixed here instead of counted at run time: the backend scores one row at a
# time, where every value would look rare.
RARE_CATEGORIES = {
    "weather_conditions": [6],   # Snowing + high winds, 234 rows
}


def extract_datetime_features(df: pd.DataFrame) -> pd.DataFrame:
    """1. Date/time extraction"""
    df = df.copy()
    # date is DD/MM/YYYY text, time is HH:MM
    dt = pd.to_datetime(
        df["date"].astype(str) + " " + df["time"].astype(str),
        dayfirst=True,
        errors="coerce"
    )
    df["hour"] = dt.dt.hour
    df["month"] = dt.dt.month
    df["day_of_year"] = dt.dt.dayofyear
    return df


def bin_time_of_day(df: pd.DataFrame) -> pd.DataFrame:
    """2. Binning — behavioural buckets, not equal clock slices"""
    df = df.copy()

    def _bucket(h: float) -> str:
        if pd.isna(h):
            return "unknown"
        h = int(h)
        if 0 <= h < 6:
            return "early_morning"      # 00-05
        elif 6 <= h < 10:
            return "morning_rush"       # 06-09
        elif 10 <= h < 16:
            return "daytime"            # 10-15
        elif 16 <= h < 19:
            return "evening_rush"       # 16-18
        elif 19 <= h < 22:
            return "evening"            # 19-21
        else:
            return "night"              # 22-23

    df["time_of_day"] = df["hour"].apply(_bucket)
    return df


def create_weekend_flag(df: pd.DataFrame) -> pd.DataFrame:
    """3. New feature — weekend vs weekday"""
    df = df.copy()
    # day_of_week: 1=Sunday … 7=Saturday (STATS19)
    df["is_weekend"] = df["day_of_week"].isin([1, 7]).astype(int)
    return df


def create_adverse_conditions(df: pd.DataFrame) -> pd.DataFrame:
    """4. Interaction — bad weather AND bad surface"""
    df = df.copy()
    # From lookups: weather 1 = Fine, surface 1 = Dry
    # 99 = unknown (we treat unknown as NOT adverse — deliberate choice)
    bad_weather = ~df["weather_conditions"].isin([1, 99])
    bad_surface = ~df["road_surface_conditions"].isin([1, 99])
    df["adverse_conditions"] = (bad_weather & bad_surface).astype(int)
    return df


def create_speed_x_roadtype(df: pd.DataFrame) -> pd.DataFrame:
    """5. Interaction — speed limit × road type (high risk combination)"""
    df = df.copy()
    # High-speed single carriageway is particularly dangerous
    # road_type codes (from DfT): 6 = Single carriageway, 3 = Dual, etc.
    high_speed = df["speed_limit"] >= 60
    single = df["road_type"] == 6
    df["speed_x_roadtype"] = (high_speed & single).astype(int)
    # Also create a more granular version if needed later
    df["speed_road_combo"] = (
        df["speed_limit"].astype(str) + "_" + df["road_type"].astype(str)
    )
    return df


def create_grid_cell(df: pd.DataFrame, precision: int = 2) -> pd.DataFrame:
    """6. Geographic aggregation — ~1 km cells"""
    df = df.copy()
    df["lat_bin"] = df["latitude"].round(precision)
    df["lon_bin"] = df["longitude"].round(precision)
    df["grid_cell"] = (
        df["lat_bin"].astype(str) + "_" + df["lon_bin"].astype(str)
    )
    return df


def group_rare_categories(
    df: pd.DataFrame,
    col: str,
    rare_codes: List[int],
    other_label: int | str = 99
) -> pd.DataFrame:
    """7. Grouping rare categories"""
    df = df.copy()
    df[col] = df[col].where(~df[col].isin(rare_codes), other_label)
    return df


def build_features(df: pd.DataFrame, grid_risk: pd.DataFrame | None = None) -> pd.DataFrame:
    """
    Master function — called by both training and the prediction service.
    Order matters.
    """
    df = extract_datetime_features(df)
    df = bin_time_of_day(df)
    df = create_weekend_flag(df)
    df = create_adverse_conditions(df)
    df = create_speed_x_roadtype(df)
    df = create_grid_cell(df)

    for col, rare_codes in RARE_CATEGORIES.items():
        if col in df.columns:
            df = group_rare_categories(df, col, rare_codes)

    # Attach historical grid risk if provided
    if grid_risk is not None and "grid_cell" in df.columns:
        df = df.merge(
            grid_risk[["grid_cell", "severity_index", "total_collisions"]],
            on="grid_cell",
            how="left"
        )
        df["grid_risk"] = df["severity_index"].fillna(df["severity_index"].median())
        df["grid_total"] = df["total_collisions"].fillna(0)
    else:
        df["grid_risk"] = 0.0
        df["grid_total"] = 0

    return df


def get_feature_columns() -> Tuple[List[str], List[str]]:
    """Return the lists Owner 3 needs for ColumnTransformer"""
    return CATEGORICAL_COLS, NUMERIC_COLS