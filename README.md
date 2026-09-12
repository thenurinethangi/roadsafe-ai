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
│   ├── data/raw/        <- downloaded CSVs (NOT pushed to git)
│   ├── data/processed/  <- cleaned data
│   ├── notebooks/       <- exploration + training notebooks
│   ├── src/             <- reusable python code
│   └── artifacts/       <- trained model files (pushed to git)
│
├── backend/             <- FastAPI REST API
│   └── app/
│       ├── api/         <- endpoints
│       ├── services/    <- prediction, routing, weather, scoring
│       ├── models/      <- request/response shapes
│       └── db/          <- database code
│
├── frontend/            <- Next.js app
│
└── docs/                <- report notes, screenshots, diagrams
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

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs then open at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at: http://localhost:3000

### 4. ML notebooks

```bash
cd ml
pip install -r requirements.txt
jupyter notebook
```

---

## Data download (do this first)

1. Go to https://www.gov.uk/government/statistics/road-safety-data
2. Download **Road Safety Data - Collisions - last 5 years** (CSV, ~93 MB)
3. Download the **data guide** file (explains the number codes)
4. Put both in `ml/data/raw/`

`ml/data/raw/` is in `.gitignore`. The big CSV must not go on GitHub.

---

## Out of scope (on purpose)

We are NOT building these:

- User login / accounts
- Admin panel
- Real-time alerts
- Mobile app
- Live police or traffic feeds

Keeping the scope small so the ML work is done properly.
