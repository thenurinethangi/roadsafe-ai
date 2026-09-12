"""
Cleaning the raw STATS19 collision data.

Every rule here was decided from the counts found in notebook 01
and the code meanings in the DfT guide (see lookups.py).
"""

import pandas as pd

#columns to remove, with a reason for each group
DROP_COLUMNS = [
    # LEAKAGE - these are derived from the target. Using them would give a fake high score and prove nothing.
    "enhanced_severity_collision",
    "collision_adjusted_severity_serious",
    "collision_adjusted_severity_slight",
    "collision_injury_based",

    # IDs - unique per row, so no pattern to learn
    "collision_index",
    "collision_ref_no",

    # Duplicate location - we already keep latitude/longitude
    "location_easting_osgr",
    "location_northing_osgr",

    # Administrative codes - about who recorded it, not about the road
    "police_force",
    "local_authority_district",          
    "local_authority_ons_district",
    "local_authority_highway",
    "local_authority_highway_current",
    "lsoa_of_accident_location",

    # Superseded columns - we keep the current version of each
    "junction_detail_historic",
    "carriageway_hazards_historic",
    "pedestrian_crossing_human_control_historic",
    "pedestrian_crossing_physical_facilities_historic",

    # Too much missing to be useful
    "junction_control",                  # 42% missing
    "special_conditions_at_site",        # 29% missing
    "second_road_number",                # 35% missing

    # Road numbers - thousands of unique values, and the road class already carries the useful part
    "first_road_number",

    # Only known AFTER a collision, so the app can never supply them
    "number_of_casualties",
    "number_of_vehicles",
    "did_police_officer_attend_scene_of_accident",
]

# Codes that mean "we do not know". All of these become 99.
UNKNOWN_CODES = {
    "weather_conditions":      [-1, 9],
    "road_surface_conditions": [-1, 9],
    "road_type":               [-1, 9],
    "junction_detail":         [-1, 99],
    "second_road_class":       [-1, 9],
    "pedestrian_crossing":     [-1, 99],
    "carriageway_hazards":     [-1, 99],
    "trunk_road_flag":         [-1],
}

UNKNOWN_MARKER = 99

# Columns with no "unknown" category in the DfT guide, where only a handful of rows are affected. Cheaper to drop the rows than to invent a category for 34 of them.
DROP_ROWS_IF = {
    "light_conditions":    [-1],
    "urban_or_rural_area": [-1, 3],
    "first_road_class":    [-1],
    "speed_limit":         [-1],
}



def load_raw(path):
    return pd.read_csv(path, low_memory=False)


def drop_unused_columns(df):
    cols = [c for c in DROP_COLUMNS if c in df.columns]
    return df.drop(columns=cols)


def drop_rows_with_missing_codes(df):
    for col, codes in DROP_ROWS_IF.items():
        if col in df.columns:
            df = df[~df[col].isin(codes)]
    return df


def mark_unknown_codes(df):
    for col, codes in UNKNOWN_CODES.items():
        if col in df.columns:
            df[col] = df[col].replace(codes, UNKNOWN_MARKER)
    return df


def drop_rows_without_location(df):
    return df.dropna(subset=["latitude", "longitude"])


def remove_duplicates(df):
    return df.drop_duplicates()


def clean(df):
    """Run every cleaning step in order."""
    df = drop_unused_columns(df)
    df = drop_rows_with_missing_codes(df)
    df = mark_unknown_codes(df)
    df = drop_rows_without_location(df)
    df = remove_duplicates(df)
    return df


