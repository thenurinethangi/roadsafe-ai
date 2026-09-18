# RoadSafe AI

**AI-Powered Road Safety & Route Intelligence Platform**

Machine Learning Module — Group Project

---

## What this project does

A web app that finds routes between two places and shows how **safe** each route is,
not just how fast it is.

The user enters a journey (From, To, Date, Time). The app:

1. Gets 2-3 possible routes
2. Gets the weather forecast for that time
3. Uses our trained ML model to score the risk of each road section
4. Shows a Safety Score for each route
5. Shows risky sections on a map in green / orange / red
6. Explains **why** a section is risky

---

## The Machine Learning problem

**Type:** Multiclass classification

**Target variable:** Collision severity — `Slight`, `Serious`, `Fatal`

**Important:** The model does NOT predict "this road has an X% chance of a crash."
It predicts the likely **severity** of a collision given the conditions.
We use that to build a **relative** safety score. This is what the data actually supports.

**Dataset:** UK STATS19 road collision data (Department for Transport, official open data)

- Source: https://www.gov.uk/government/statistics/road-safety-data
- File used: `Road Safety Data - Collisions - last 5 years` (~93 MB CSV)
- The data is **coded** — columns hold numbers, not words. The DfT data guide
  file explains what each number means. Keep it in `ml/data/raw/`.

---

## Architecture

```
Frontend (Next.js)
        |
        v
Backend REST API (FastAPI)
        |
        v
ML Prediction Service  (backend/app/services/prediction.py)
        |
        v
Trained Model  (ml/artifacts/model.joblib)
        |
        v
Route Safety Score + Explanation
        |
        v
Frontend (map + route comparison)
```

---

## Tech stack

| Part | Tool |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind |
| Map | Leaflet + react-leaflet (free, no API key) |
| Backend | FastAPI (Python) |
| ML | scikit-learn, XGBoost, pandas |
| Notebooks | Jupyter |
| Database | PostgreSQL (via Docker) |
| Routing API | OSRM public demo (free, no key) |
| Weather API | Open-Meteo (free, no key) |

---

## Folder structure

```
roadsafe-ai/
├── ml/                  <- all model work happens here
│   ├── data/raw/        <- downloaded CSV (NOT pushed to git)
│   ├── data/processed/  <- files the notebooks create (NOT pushed to git)
│   ├── notebooks/       <- 01 to 05, run in order
│   ├── src/             <- reusable python code (features, training)
│   └── artifacts/       <- trained model and precomputed data (pushed to git)
│
├── backend/             <- FastAPI REST API
│   ├── app/
│   │   ├── api/         <- endpoints
│   │   ├── services/    <- prediction, routing, weather, scoring, route history
│   │   ├── models/      <- request/response shapes
│   │   └── db/          <- database tables, create and seed scripts
│   └── scripts/         <- rebuild insights and the score reference
│
├── frontend/            <- Next.js app
│
└── docs/REPORT.md       <- data quality and limitations
```

---

## Important rule: do not rewrite the feature code

The feature engineering functions live in **`ml/src/features.py`**.

The backend **imports the same file** when making predictions.

Do NOT write a second copy of the feature logic inside the backend.
If training and prediction build features differently, the predictions will be
wrong and it is very hard to find the bug.

---

## Setup

You need Python 3.11+, Node.js 20+ and Docker Desktop.

### 1. Download the data

1. Go to https://www.gov.uk/government/statistics/road-safety-data
2. Download **Road Safety Data - Collisions - last 5 years** (CSV, ~93 MB)
3. Download the **data guide** file (explains the number codes)
4. Put both in `ml/data/raw/` and rename the CSV to **`collisions_last_5_years.csv`**

`ml/data/raw/` is in `.gitignore`. The big CSV must not go on GitHub.

### 2. Run the notebooks (creates the data files)

```bash
cd ml
pip install -r requirements.txt
jupyter notebook
```

Run the notebooks **in order**. Each one saves files the next one needs:

| Notebook | Creates |
|---|---|
| `01_data_exploration` | nothing, exploration only |
| `02_preprocessing` | `data/processed/collisions_clean.parquet` |
| `03_feature_engineering` | `data/processed/collisions_features.parquet`, `grid_risk.parquet` |
| `04_model_training` | `artifacts/model.joblib`, `metrics.json` (already in git) |
| `05_clustering_hotspots` | `data/processed/hotspot_clusters.parquet`, `artifacts/hotspot_kmeans.joblib` |

The backend needs `collisions_clean.parquet` for route history, and the
database seed needs `grid_risk.parquet` and `hotspot_clusters.parquet`.

### 3. Database

```bash
docker compose up -d
```

PostgreSQL runs on port **5433**. Then create the tables and load the data
(from the `backend` folder, after step 4 installs the packages):

```bash
python -m app.db.init_db
python -m app.db.seed
```

### 4. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs then open at: http://localhost:8000/docs

No `.env` file is needed for local use. `backend/.env.example` shows the
settings if your database runs somewhere else.

If you retrain the model, rebuild the files that depend on it:

```bash
python -m scripts.build_score_reference
python -m scripts.build_insights
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at: http://localhost:3000

The frontend calls the backend at `http://localhost:8000`. To change it, copy
`frontend/.env.local.example` to `frontend/.env.local`.

---

## Out of scope (on purpose)

We are NOT building these:

- User login / accounts
- Admin panel
- Real-time alerts
- Mobile app
- Live police or traffic feeds

Keeping the scope small so the ML work is done properly.
