"""
Shared settings for the ML side of RoadSafe AI.
All paths and constants live here, so they are never typed twice.
"""

from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = ML_DIR / "data" / "raw"
PROCESSED_DIR = ML_DIR / "data" / "processed"
ARTIFACTS_DIR = ML_DIR / "artifacts"

COLLISIONS_FILE = RAW_DIR / "collisions_last_5_years.csv"
DATA_GUIDE_FILE = RAW_DIR / "dft-road-casualty-statistics-road-safety-open-dataset-data-guide-2025.xlsx"

CLEAN_FILE = PROCESSED_DIR / "collisions_clean.parquet"

# The column the model must learn to predict.
TARGET = "collision_severity"

# Codes confirmed against the DfT data guide.
SEVERITY_LABELS = {
    1: "Fatal",
    2: "Serious",
    3: "Slight",
}

# Fixed seed so every run gives the same result. Needed for the report.
RANDOM_STATE = 42

# 80% train, 20% test
TEST_SIZE = 0.2




