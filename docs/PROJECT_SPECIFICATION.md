# RoadSafe AI — Project Specification

**AI-Powered Road Safety & Route Intelligence Platform**

Module: ITS 2140 — Machine Learning: Foundations to Production Systems
Assignment: Final Group Project (40% of module grade)
Team size: 3
Deadline: **18 September** (not extendable)

Document version: 1.0

---

## Table of contents

1. [What we are building](#1-what-we-are-building)
2. [The real-world problem](#2-the-real-world-problem)
3. [Why this is not a basic ML project](#3-why-this-is-not-a-basic-ml-project)
4. [How the system works](#4-how-the-system-works)
5. [The machine learning](#5-the-machine-learning)
6. [The dataset](#6-the-dataset)
7. [Feature engineering](#7-feature-engineering)
8. [Users and user flow](#8-users-and-user-flow)
9. [Features list](#9-features-list)
10. [Screens and what each one does](#10-screens-and-what-each-one-does)
11. [Technology stack](#11-technology-stack)
12. [Folder structure](#12-folder-structure)
13. [API design](#13-api-design)
14. [Database design](#14-database-design)
15. [How the model connects to the app](#15-how-the-model-connects-to-the-app)
16. [Scope — in and out](#16-scope--in-and-out)
17. [Limitations and honesty](#17-limitations-and-honesty)
18. [Ethics, licensing and disclaimer](#18-ethics-licensing-and-disclaimer)
19. [How this maps to the module syllabus](#19-how-this-maps-to-the-module-syllabus)
20. [Risks and what we do about them](#20-risks-and-what-we-do-about-them)
21. [Definition of done](#21-definition-of-done)
22. [Glossary](#22-glossary)

---

## 1. What we are building

RoadSafe AI is a web application that helps a driver choose a **safer** route,
not just a faster one.

The user enters where they are going and when. The system finds a few possible
routes. It then studies each route using real historical collision data, the
weather forecast, the time of day, and the road characteristics. It gives each
route a **Safety Score** out of 100, colours the risky sections on a map, and
explains in plain words why a section is risky.

In one sentence:

> A navigation tool that answers "which of these routes is safest right now,
> and why?" using machine learning trained on five years of official road
> collision records.

---

## 2. The real-world problem

Every navigation app in common use — Google Maps, Waze, Apple Maps — optimises
for **time**. Sometimes fuel. Never safety.

But not all roads carry the same risk, and the risk is not fixed. It changes
with:

- **Time of day.** A road at 8am and the same road at 11pm are different roads.
- **Weather.** Rain on a fast rural road changes stopping distance.
- **Light.** Darkness with no street lighting raises severity.
- **Road design.** A 60mph single carriageway with unmarked junctions behaves
  very differently from a 60mph dual carriageway.

A driver has no way to see any of this. They pick the route the app suggests
and hope.

### Who this actually matters to

- **New and young drivers**, who have the highest collision rates and the least
  experience judging road risk.
- **Parents** deciding a route for a teenager's first long drive.
- **Night-shift workers and delivery drivers**, who travel at the riskiest hours
  by necessity and could choose a safer road for the same journey.
- **Driving instructors**, choosing where to teach.
- **Fleet and logistics managers**, who carry legal duty-of-care for drivers and
  currently have no route-level safety data.
- **Local councils and road safety teams**, who need to see where severe
  collisions cluster in order to prioritise spending.

### The gap we fill

The UK government publishes every reported injury collision — location,
severity, weather, road type, time. That data is public and free. Almost nobody
uses it at the moment a driver is choosing a route.

RoadSafe AI closes that gap. It takes data that already exists, turns it into a
model, and puts the answer in front of the driver **before** the journey, not in
a statistics report afterwards.

### A concrete example

A driver plans Manchester to Sheffield, leaving at 7:30pm on a wet November
evening.

The fastest route is 1 hour 5 minutes. It goes over a fast rural stretch with a
history of serious collisions in poor weather and no street lighting.

An alternative route is 10 minutes slower but uses a lit dual carriageway for
most of the distance.

Google Maps shows the first one and says nothing. RoadSafe AI shows both, scores
them 74 and 88, colours the risky stretch red, and says:

```
A628 Woodhead Pass
Safety Score: 61/100

Why:
• Rain forecast during your travel window
• Travelling after dark
• 60 mph single carriageway
• Higher than average share of serious collisions here
```

Now the driver makes an informed choice. Ten minutes is a small price if they
know what they are buying with it.

---

## 3. Why this is not a basic ML project

A typical student ML project is:

```
CSV file -> model.fit() -> accuracy: 94% -> a form that returns one number
```

RoadSafe AI is different in six specific ways. These are the points to raise in
the viva.

**1. Two different ML techniques, used for different jobs.**
Supervised classification (Logistic Regression) predicts collision severity from
conditions. Unsupervised clustering (k-Means) finds geographic hotspots. They
answer different questions and the app combines both.

**2. The imbalance is the interesting part, not a problem to hide.**
Most collisions are "Slight". Fatal collisions are rare. A model that always
guesses "Slight" scores high accuracy and saves nobody. We prove this with a
dummy baseline in our notebook, then show why macro F1 and recall on the rare
classes are the honest measures. This is straight out of Module 4's
"Accuracy and its limitations".

**3. The model output is explained, not just displayed.**
We chose Logistic Regression partly because its coefficients are readable. When
the app says a section is risky, the reasons come from the model's own weights —
not a hardcoded list of rules. A safety tool that cannot justify itself will not
be trusted.

**4. Live data meets historical data.**
The model is trained on the past. The prediction runs on the present — tonight's
forecast, tonight's darkness, this route's roads. Joining the two requires real
engineering: mapping live weather codes onto the codes the model was trained on,
sampling points along a route polyline, handling API failures.

**5. Geography is a feature, not decoration.**
Latitude and longitude are not passed raw to the model. They are aggregated into
grid cells and clustered into zones, producing a historical risk value per
location. The map is not a picture stuck on at the end — it is the output of a
feature engineering decision.

**6. It is a real system, not a notebook.**
Trained model saved as an artifact. A prediction service that loads it once at
startup. A REST API. A database of precomputed risk. Shared feature code so
training and serving cannot drift apart. This is exactly what Module 6
("Production ML Systems") describes.

---

## 4. How the system works

### High level

```
        USER
          |
          v
   Frontend (Next.js)
          |
          v
   Backend REST API (FastAPI)
          |
    +-----+-----+-----------+
    |           |           |
    v           v           v
 Routing     Weather    Database
 (OSRM)   (Open-Meteo)  (hotspots +
    |           |        grid risk)
    +-----+-----+-----------+
          |
          v
   ML PREDICTION SERVICE
          |
          v
  Trained Model (model.joblib)
  + Hotspot model (kmeans.joblib)
          |
          v
   Scoring Service
   (probabilities -> 0-100 score
    + list of reasons)
          |
          v
   JSON response
          |
          v
   Frontend: map + route cards
```

### Step by step, what happens on one request

1. **User submits a journey.** From, To, date, time.

2. **Frontend geocodes the place names** into latitude/longitude and sends a
   POST request to the backend.

3. **Backend asks OSRM for routes.** It requests alternatives, so we usually get
   2 to 3 different paths. Each comes back as a list of coordinates (a polyline),
   plus distance and duration.

4. **Backend splits each route into segments.** Roughly every 5 to 10 km, we
   take a point. A long route becomes maybe 8 to 15 points to score. We do not
   score every coordinate — that would be thousands of predictions and far too
   slow.

5. **Backend fetches the weather forecast** for the journey time, for a few
   points along the route. Open-Meteo gives temperature, precipitation,
   visibility and a weather code per hour.

6. **Backend translates the live data into model inputs.** This is the important
   glue step. Open-Meteo uses WMO weather codes. Our model was trained on STATS19
   codes. We map one to the other. We also derive light conditions from the time
   and date (is it dark at 7:30pm in November?).

7. **Backend looks up historical risk** for each segment: which grid cell is this
   point in, and which hotspot cluster does it fall in? Both come from the
   database, precomputed from the training data.

8. **ML Prediction Service runs.** For each segment, it builds a feature row
   using the **same functions used in training**, applies the saved encoders,
   and calls the model. It gets back three probabilities: Fatal, Serious, Slight.

9. **Scoring Service converts probabilities to a Safety Score.** It combines the
   severity probabilities with the historical risk of that location into a single
   0–100 number, where higher is safer. It also assigns a colour band
   (green / orange / red).

10. **Scoring Service builds the explanation.** It looks at which inputs pushed
    the risk up for this segment and turns them into readable lines
    ("Rain expected", "Travelling after dark").

11. **Route score is calculated** by combining segment scores, weighted by
    segment length. A 20 km risky stretch matters more than a 2 km one.

12. **Routes are labelled** — Safest, Fastest, Best Balance — and sorted.

13. **Response goes back as JSON.** The frontend draws the routes on the map with
    coloured sections, shows the comparison cards, and lets the user click any
    section for the explanation.

Target time for the whole thing: **under 5 seconds**.

---

## 5. The machine learning

### The problem type

**Supervised, multi-class classification.**

Given the conditions of a road at a moment in time, predict the likely
**severity** of a collision there: Fatal, Serious, or Slight.

### The target variable

`accident_severity` from the STATS19 collision table.

| Code | Meaning |
|---|---|
| 1 | Fatal |
| 2 | Serious |
| 3 | Slight |

### What the model does and does not do

This distinction matters. Get it right in the report and the viva.

**It does:** given that a collision occurs under these conditions, estimate how
severe it is likely to be.

**It does not:** predict the probability that a collision will occur.

The reason is honest and simple. STATS19 only records collisions that happened.
There is no record of the millions of safe journeys on the same roads. Without
that, we cannot compute a true accident probability. Claiming otherwise would be
statistically wrong, and a lecturer will spot it.

So we present the output as a **relative safety score**. It compares routes
against each other. It is not an absolute chance of crashing.

### Models

| Model | Role | Why |
|---|---|---|
| **Dummy (most frequent)** | Baseline | Proves accuracy is misleading on imbalanced data |
| **Logistic Regression** | **Main model** | Taught in Module 4. Gives probabilities. Coefficients are readable, which powers our explanations. |
| **Random Forest** | Comparison | Checks whether a non-linear model helps enough to justify the loss of explainability |
| **XGBoost** | Optional comparison | Only if time allows |
| **k-Means** | Separate task | Module 5. Finds collision hotspot zones for the map |

### Evaluation

We do not report accuracy alone. We report:

- **Confusion matrix** — shows exactly which classes get confused
- **Precision, Recall, F1 per class** — recall on Fatal is the number that
  actually matters for a safety tool
- **Macro F1** — treats all three classes equally, so ignoring Fatal is punished
- **Cross-validation** (5-fold, stratified) — proves the result is not luck
- **Train vs test comparison** — checks for overfitting

`class_weight="balanced"` is used so the model does not simply learn to always
say "Slight".

`stratify=y` is used in the split so all three classes appear in the same
proportions in train and test.

### The clustering side

k-Means groups collision locations into zones. For each zone we compute:

- Total collisions (how busy)
- Share that were fatal or serious (how bad)

These are two different kinds of danger and we treat them separately. A city
centre may have thousands of minor collisions. A rural road may have few
collisions but a high proportion of fatal ones. Both are dangerous; not in the
same way.

k is chosen using the elbow method and silhouette score, and sanity-checked
against what is actually useful to draw on a map.

---

## 6. The dataset

### Source

**UK Department for Transport — Road Safety Data (STATS19)**

https://www.gov.uk/government/statistics/road-safety-data

This is official government open data. Every personal-injury road collision
reported to the police in Great Britain, recorded on the STATS19 form.

### File used

`Road Safety Data - Collisions - last 5 years` (CSV, approximately 93 MB)

We use the last five years rather than the full 1979-onward archive (~1.5 GB).
Recent data reflects current road layouts, speed limits and vehicle safety
standards. Older data would add volume but reduce relevance.

### Scale

Roughly **100,000 collisions per year**, so approximately **500,000 records**
across five years, with around **38 columns**.

### Key columns we use

| Column | What it is |
|---|---|
| `accident_severity` | **Our target.** 1 Fatal, 2 Serious, 3 Slight |
| `latitude`, `longitude` | Where it happened |
| `date`, `time` | When |
| `day_of_week` | 1 = Sunday to 7 = Saturday |
| `speed_limit` | Posted limit at the location |
| `road_type` | Single carriageway, dual carriageway, roundabout, slip road |
| `junction_detail` | What kind of junction, if any |
| `junction_control` | Give way, traffic signals, uncontrolled |
| `light_conditions` | Daylight, darkness lit, darkness unlit |
| `weather_conditions` | Fine, raining, snowing, fog, with/without high winds |
| `road_surface_conditions` | Dry, wet, snow, ice, flood |
| `urban_or_rural_area` | Urban or rural |
| `number_of_vehicles` | How many vehicles involved |
| `number_of_casualties` | How many people hurt |
| `special_conditions_at_site` | Roadworks, defective signals, oil |
| `carriageway_hazards` | Object in road, animal, pedestrian |

### Data quality issues (required by the assignment)

These must appear in the report. Each is real.

**1. The data is coded, not written.**
Every value is a number. `weather_conditions = 2` means "Raining, no high winds".
The DfT publishes a lookup guide that decodes every column. Without it the data
is meaningless. **Download the guide and keep it in `ml/data/raw/`.**

**2. Missing values are stored as `-1`, not blank.**
Pandas will read `-1` as a valid number. If we do not convert it to NaN, the
model will treat "unknown weather" as a real weather category and learn nonsense
from it.

**3. Some rows have no location.**
A number of records have missing or zero latitude/longitude. We need coordinates
for the map and for grid features, so those rows are dropped. We report how many.

**4. Severity reporting changed partway through the period.**
DfT notes that some police forces moved to injury-based severity reporting,
which changed how collisions were graded as Serious vs Slight. This creates
inconsistency across years. It is a genuine limitation and we state it rather
than hide it.

**5. Under-reporting of non-fatal collisions.**
Fatal collisions are almost always reported. Slight injuries often are not.
Hospital and insurance data both suggest higher real numbers than police records
show. So our dataset is not a complete picture of what happens on the roads.

**6. Sensitive fields are removed from the public release.**
Contributory factors — what the police judged actually caused the collision —
are not in the open data. Those would be extremely useful features. They require
a formal request from DfT, which we cannot do within the deadline.

**7. Survivorship problem.**
The dataset contains only collisions. There is no record of safe journeys on the
same roads. This is why we predict severity rather than likelihood. It is the
most important limitation in the project.

**8. Duplicates.**
Checked and removed. We report the count found.

### Licence

Open Government Licence v3.0. Free to use, including for this project, as long
as the source is credited. We credit DfT in the README, the report and the app
footer.

---

## 7. Feature engineering

The assignment requires **at least 5 to 6 meaningful techniques**. We have nine.

All feature code lives in `ml/src/features.py` and is imported by both the
training notebooks and the backend.

| # | Technique | What we do | Why it should help |
|---|---|---|---|
| 1 | **Date/time extraction** | Pull hour, month, day-of-year from `date` and `time` | Raw timestamps are useless to a model; the components carry the pattern |
| 2 | **Binning** | Group 24 hours into: early morning, morning rush, daytime, evening rush, evening, night | 24 separate hour values fragment the data; 6 buckets carry the real behaviour difference |
| 3 | **Creating new features** | `is_weekend` flag from `day_of_week` | Weekend traffic is different — less commuting, more leisure and night driving |
| 4 | **Feature interaction** | `adverse_conditions` = bad weather AND bad road surface | Rain on an already wet road is worse than either alone; the combination carries information neither column has by itself |
| 5 | **Feature interaction** | `speed_x_roadtype` = speed limit combined with road type | 60mph on a single carriageway is a very different risk from 60mph on a dual carriageway |
| 6 | **Geographic aggregation** | Round lat/lon into ~1km grid cells, count collisions and severity per cell | Turns raw coordinates into a usable historical risk value |
| 7 | **Grouping rare categories** | Merge categories with very few rows into "Other" | Rare categories add noise and can cause the model to overfit to a handful of rows |
| 8 | **Encoding** | One-hot encode all categorical columns | Models need numbers; and the category codes are labels, not quantities — weather code 3 is not "more" than code 1 |
| 9 | **Scaling** | Standardise numeric columns | Logistic Regression is sensitive to scale; without it, speed_limit (20–70) would overpower hour (0–23) |

Plus **k-Means clustering** (notebook 05), which produces a hotspot zone feature.

Every one of these is checked in notebook 03 against the target. A feature that
shows no relationship to severity gets dropped. We do not keep features just to
reach a count.

---

## 8. Users and user flow

### Who uses this

| User | What they want |
|---|---|
| Everyday driver | Is there a safer way to go tonight? |
| New / young driver | Which route should I take for my first long drive? |
| Parent | Which route should my teenager take? |
| Night worker / delivery driver | I have to drive at 2am — which road is less bad? |
| Fleet manager | Duty-of-care evidence for driver route choices |
| Driving instructor | Where should I teach in poor weather? |
| Road safety analyst | Where are the severe-collision clusters in my area? |

### Main user flow — planning a journey

```
1. User opens the app
        |
        v
2. Enters journey details
   - From:  Manchester
   - To:    Sheffield
   - Date:  9 November
   - Time:  19:30
        |
        v
3. Clicks "Analyse Routes"
        |
        v
4. Loading (a few seconds)
   "Finding routes... Checking weather... Scoring segments..."
        |
        v
5. Results appear
   - Map with 2-3 coloured routes
   - Route comparison cards below
   - Weather summary for the journey
        |
        v
6. User compares
   Route A — 82/100 — 1h 05m — Best balance
   Route B — 88/100 — 1h 15m — Safest  (+10 min)
   Route C — 74/100 — 1h 20m
        |
        v
7. User clicks a route card
   -> That route highlights on the map
   -> Its risky sections show in orange/red
        |
        v
8. User clicks a red section on the map
   -> Popup explains why:
      "A628 Woodhead Pass — 61/100
       • Rain forecast during travel window
       • Travelling after dark
       • 60 mph single carriageway
       • Higher than average serious collision share"
        |
        v
9. User makes a decision
```

### Second flow — exploring the safety dashboard

```
1. User opens the Insights page
        |
        v
2. Sees collision hotspot zones on a map
   (from k-Means clustering)
        |
        v
3. Views charts
   - Collisions by hour of day
   - Severity by weather condition
   - Severity by road type
   - Model performance summary
        |
        v
4. Clicks a hotspot zone
   -> Zone details: total collisions,
      share fatal/serious, risk band
```

This second page does double duty. It is genuinely useful to a road safety
analyst, and it is where we show the lecturer our data analysis and model
evaluation work inside the running application rather than only in a notebook.

---

## 9. Features list

### Must have — the project fails without these

| # | Feature | Description |
|---|---|---|
| F1 | Journey input | From, To, date, time |
| F2 | Route generation | 2–3 alternative routes via OSRM |
| F3 | Weather integration | Forecast for the journey time and location |
| F4 | Segment risk prediction | ML model scores each part of each route |
| F5 | Route safety score | Single 0–100 number per route, length-weighted |
| F6 | Map visualisation | Routes drawn, sections coloured green/orange/red |
| F7 | Route comparison | Cards showing score, time, distance, label |
| F8 | Risk explanation | Click a section, see why it scored that way |
| F9 | Model artifact loading | Backend loads the trained model at startup |
| F10 | Health endpoint | Confirms the API is up and the model loaded |

### Should have — makes it a strong project

| # | Feature | Description |
|---|---|---|
| F11 | Hotspot zones | k-Means clusters drawn on the map |
| F12 | Insights dashboard | Charts of collision patterns from our analysis |
| F13 | Model performance panel | Shows our metrics inside the app |
| F14 | Weather summary | Plain-language conditions for the journey |
| F15 | Route labels | Safest / Fastest / Best Balance |
| F16 | Prediction logging | Every prediction stored with a timestamp (this is the "monitoring" element from Module 6) |

### Could have — only if ahead of schedule

| # | Feature |
|---|---|
| F17 | Time comparison — "how does this route score at 2pm vs 10pm?" |
| F18 | Recent searches |
| F19 | Share/export a route summary |
| F20 | Alternative departure time suggestion |

### Will not have — explicitly out of scope

Login and user accounts · admin panel · real-time alerts · mobile app · live
traffic data · live police feeds · turn-by-turn navigation · collision detection
from cameras · IoT integration · payment · multi-language.

We list these deliberately. Being able to say what we chose **not** to build,
and why, is a sign of engineering judgement.

---

## 10. Screens and what each one does

### Screen 1 — Journey Planner (home)

**Top:** Application name and one-line description.

**Journey form:**
- From (text input with place suggestions)
- To (text input with place suggestions)
- Date (date picker, defaults to today)
- Time (time picker, defaults to now)
- "Analyse Routes" button

**Below:** empty state explaining what the app does, until a search runs.

### Screen 2 — Results

**Map (main area, roughly 60% of the screen):**
- All routes drawn
- Selected route highlighted, others faded
- Each route split into coloured sections: green, orange, red
- Hotspot zones as translucent circles (toggle on/off)
- Start and end markers
- Click a section -> popup with score and reasons

**Route cards (side panel, roughly 40%):**

```
┌─────────────────────────────────┐
│  SAFEST                    88   │
│  ─────────────────────────────  │
│  1h 15m  ·  68 km               │
│  +10 min vs fastest             │
│                                 │
│  ██████████░░  mostly low risk  │
│  2 sections need attention      │
└─────────────────────────────────┘
```

Cards are sorted by safety score. Clicking one selects it on the map.

**Weather strip:** conditions expected during the journey window.

### Screen 3 — Insights Dashboard

- Hotspot map from k-Means clustering
- Chart: collisions by hour of day
- Chart: severity share by weather condition
- Chart: severity share by road type
- Panel: our model's performance (macro F1, per-class recall, confusion matrix)
- Note on data source and limitations

### Screen 4 — About / Methodology

Short page covering: data source and licence, how the model works, what the
score means, what it does **not** mean, and the safety disclaimer.

This page exists partly for honesty and partly because it is the page you can
point the lecturer at during the demo.

---

## 11. Technology stack

| Layer | Choice | Why this one |
|---|---|---|
| **ML language** | Python 3.11 | Module prerequisite is Python for Data Science; all ML tooling is here |
| **ML libraries** | scikit-learn, pandas, numpy | scikit-learn is what the module teaches; Logistic Regression, k-Means, metrics, pipelines all come from it |
| **Optional ML** | XGBoost | Only for comparison |
| **Charts (notebooks)** | matplotlib, seaborn | Standard, quick |
| **Notebooks** | Jupyter | Required for the exploration and evaluation evidence |
| **Model format** | joblib | Standard for scikit-learn objects; keeps the whole pipeline including encoders |
| **Backend** | FastAPI (Python) | Same language as the model, so the model loads in-process. Auto-generates API docs at `/docs`, which we screenshot for the report. Pydantic validates every request. |
| **Server** | Uvicorn | Standard ASGI server for FastAPI |
| **Frontend** | Next.js + TypeScript | React with routing and structure built in; TypeScript catches errors before runtime |
| **Styling** | Tailwind CSS | Fast to build a clean UI without writing CSS files |
| **Map** | Leaflet + react-leaflet | Free and open source, **no API key, no billing setup, no quota** |
| **Charts (frontend)** | Recharts | Simple React charts for the dashboard |
| **Database** | PostgreSQL (via Docker) | Stores precomputed grid risk and hotspot zones; Docker means all three of us get an identical setup |
| **ORM** | SQLAlchemy | Standard Python database layer |
| **Routing API** | OSRM public demo | Free, **no API key**, returns alternative routes |
| **Weather API** | Open-Meteo | Free, **no API key**, gives hourly forecast with precipitation and visibility |
| **Version control** | Git + GitHub | Required — contribution history is graded |

### Why one Python backend and not two services

An obvious alternative is a Node/Express backend calling a separate Python ML
service over HTTP.

We deliberately did not do that. It means two runtimes, two deployments, an
extra network hop, and a serialisation layer between them — all of which is
integration risk with no benefit to a project of this size and timeline.

FastAPI loads the model directly in memory. The **ML Prediction Service is still
a distinct layer** — it is `backend/app/services/prediction.py`, with its own
responsibility and its own box on the architecture diagram. It is separated by
module boundary rather than by network boundary.

This is a design decision we can defend. Module 6 covers "serving design
decisions", and this is exactly one.

### Why no API keys anywhere

Both OSRM and Open-Meteo are free and keyless. This is a deliberate choice.
Nobody has to set up billing, nobody hits a quota wall the night before the
deadline, and any of the three of us can run the full system immediately after
cloning the repo.

---

## 12. Folder structure

```
roadsafe-ai/
│
├── README.md                     Project overview and setup
├── .gitignore                    Excludes big data files and secrets
├── .env.example                  Template for environment variables
├── docker-compose.yml            PostgreSQL database
│
├── docs/
│   ├── PROJECT_SPECIFICATION.md  This document
│   ├── TEAM_TASKS.md             Work split and timeline
│   ├── PLAN.md                   Day-by-day checklist
│   ├── REPORT.md                 Final report (written Days 8-9)
│   └── screenshots/              Evidence for the report
│
├── ml/                           ALL MODEL WORK
│   ├── requirements.txt
│   ├── data/
│   │   ├── raw/                  Downloaded CSVs — NOT in git
│   │   │   ├── collisions_last_5_years.csv
│   │   │   └── dft_data_guide.xlsx
│   │   └── processed/            Cleaned outputs — NOT in git
│   │       ├── collisions_clean.parquet
│   │       ├── collisions_features.parquet
│   │       ├── grid_risk.parquet
│   │       └── hotspot_clusters.parquet
│   │
│   ├── notebooks/
│   │   ├── 01_data_exploration.ipynb
│   │   ├── 02_preprocessing.ipynb
│   │   ├── 03_feature_engineering.ipynb
│   │   ├── 04_model_training.ipynb
│   │   └── 05_clustering_hotspots.ipynb
│   │
│   ├── src/                      REUSABLE CODE — imported by the backend
│   │   ├── config.py             Paths and constants
│   │   ├── preprocessing.py      Cleaning functions
│   │   ├── features.py           ★ Feature engineering — shared with backend
│   │   └── train.py              Training script
│   │
│   └── artifacts/                COMMITTED TO GIT
│       ├── model.joblib          Trained model + encoders + scaler
│       ├── hotspot_kmeans.joblib k-Means model + scaler
│       └── metrics.json          Evaluation results
│
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py               FastAPI entry point
│       ├── config.py             Settings from .env
│       ├── api/
│       │   └── routes.py         All endpoints
│       ├── services/
│       │   ├── prediction.py     ★ THE ML PREDICTION SERVICE
│       │   ├── routing.py        OSRM integration
│       │   ├── weather.py        Open-Meteo integration
│       │   └── scoring.py        Probabilities -> score + reasons
│       ├── models/
│       │   └── schemas.py        Pydantic request/response shapes
│       └── db/
│           ├── models.py         Table definitions
│           ├── session.py        Connection
│           └── seed.py           Loads grid + hotspots into the DB
│
└── frontend/
    ├── package.json
    ├── app/
    │   ├── page.tsx              Journey planner
    │   ├── insights/page.tsx     Dashboard
    │   └── about/page.tsx        Methodology
    ├── components/
    │   ├── JourneyForm.tsx
    │   ├── RouteMap.tsx
    │   ├── RouteCard.tsx
    │   ├── SegmentPopup.tsx
    │   └── charts/
    └── lib/
        └── api.ts                All backend calls go through here
```

### The two starred files

`ml/src/features.py` and `backend/app/services/prediction.py` are the two files
that must not drift. Everything else can be refactored freely.

---

## 13. API design

Base URL: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs` (FastAPI generates these — screenshot for the report)

### `GET /api/health`

Confirms the service is up and the model loaded.

```json
{
  "status": "ok",
  "model_loaded": true,
  "hotspot_model_loaded": true,
  "model_version": "logreg-v1"
}
```

### `POST /api/journey/analyze`

The main endpoint.

**Request:**
```json
{
  "from_lat": 53.4808,
  "from_lon": -2.2426,
  "to_lat": 53.3811,
  "to_lon": -1.4701,
  "departure_time": "2026-11-09T19:30:00"
}
```

**Response:**
```json
{
  "weather_summary": "Rain expected, 8°C, reduced visibility",
  "routes": [
    {
      "route_id": "route_1",
      "label": "Safest",
      "distance_km": 68.4,
      "duration_minutes": 75,
      "safety_score": 88,
      "geometry": [[53.4808, -2.2426], [53.4790, -2.2380]],
      "segments": [
        {
          "start_lat": 53.4808,
          "start_lon": -2.2426,
          "end_lat": 53.4650,
          "end_lon": -2.1900,
          "safety_score": 61,
          "risk_level": "high",
          "road_name": "A628 Woodhead Pass",
          "factors": [
            { "label": "Rain forecast during travel window", "impact": "high" },
            { "label": "Travelling after dark", "impact": "high" },
            { "label": "60 mph single carriageway", "impact": "medium" },
            { "label": "Higher than average serious collision share", "impact": "medium" }
          ]
        }
      ]
    }
  ]
}
```

### `GET /api/hotspots`

Returns the k-Means clusters for the dashboard map.

Optional query parameters to bound the area: `lat_min`, `lat_max`, `lon_min`, `lon_max`.

### `GET /api/insights/summary`

Aggregated statistics for the dashboard charts — collisions by hour, severity by
weather, severity by road type. Computed once and cached.

### `GET /api/model/metrics`

Returns the contents of `metrics.json` so the frontend can show model
performance inside the app.

### Error handling

Every endpoint returns a clear error, never a raw stack trace.

| Situation | Status | Message |
|---|---|---|
| Model not loaded | 503 | "Prediction service unavailable" |
| OSRM down or no route | 502 | "Could not find a route between these points" |
| Weather API down | 200 | Route still returned, with a note that weather could not be included |
| Invalid input | 422 | Pydantic's validation message |

The weather case matters. If Open-Meteo is unreachable during the demo, the app
must still work — degraded, but working. Falling back to seasonal averages and
saying so is far better than an error screen in front of the lecturer.

---

## 14. Database design

We keep this small on purpose. The database holds precomputed values, not
predictions.

### Table: `grid_cells`

Historical collision density and severity, per ~1km square.

| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| lat_bin | float | Rounded latitude — indexed |
| lon_bin | float | Rounded longitude — indexed |
| total_collisions | int | |
| fatal_count | int | |
| serious_count | int | |
| slight_count | int | |
| severity_index | float | Weighted danger value |

### Table: `hotspot_clusters`

Output of the k-Means clustering.

| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| cluster_id | int | From k-Means |
| centre_lat | float | |
| centre_lon | float | |
| radius_km | float | For drawing on the map |
| total_collisions | int | |
| severe_rate | float | Share fatal or serious |
| risk_band | string | low / moderate / high |

### Table: `prediction_log`

Every prediction the system makes. This is our **performance monitoring**
element from Module 6.

| Column | Type | Notes |
|---|---|---|
| id | int | Primary key |
| created_at | timestamp | |
| from_lat, from_lon | float | |
| to_lat, to_lon | float | |
| departure_time | timestamp | |
| routes_returned | int | |
| best_safety_score | int | |
| response_time_ms | int | |
| model_version | string | |

Small table, twenty lines of code, and it lets us say honestly that the system
records what it predicts and how fast it responded. That is a real production
concern, and it is in the syllabus.

### Why not PostGIS?

PostGIS would give proper geographic queries. We do not need it. Rounded
lat/lon bins with a normal index are fast enough at our scale, and adding a
spatial extension is setup risk we do not need in a ten-day project.

---

## 15. How the model connects to the app

This is the part that most student projects get wrong, so it is written out
explicitly.

### The rule

> The feature engineering code in `ml/src/features.py` is used by **both**
> training and prediction. It is never rewritten in the backend.

### Why

If training builds features one way and the backend builds them another way —
different column order, different bucket boundaries, a missing interaction term
— the model still runs. It returns numbers. The numbers are wrong, and nothing
crashes to tell you.

This is called **training/serving skew**. It is a well-known production ML
failure and it is very hard to debug under deadline pressure.

### How we prevent it

```
TRAINING TIME
  notebooks -> imports ml/src/features.py -> builds features
            -> fits model + encoders + scaler inside one sklearn Pipeline
            -> joblib.dump(pipeline, "model.joblib")

SERVING TIME
  backend/app/services/prediction.py
            -> sys.path includes the ml folder
            -> imports the SAME ml/src/features.py
            -> builds features with the SAME functions
            -> pipeline.predict_proba()
```

Two further safeguards:

**1. Save the whole pipeline, not just the model.** The scikit-learn `Pipeline`
object contains the scaler, the one-hot encoder and the model together. Saving
it as one artifact means the encoders can never get out of sync with the model.

**2. Save the feature column list into `metrics.json`.** On startup the backend
checks that the columns it is about to build match the list the model was trained
on. If they do not, it fails loudly at startup instead of silently at prediction
time.

### What the prediction service actually receives

For one route segment:

```python
{
  "latitude": 53.4650,
  "longitude": -2.1900,
  "hour": 19,
  "date": "2026-11-09",
  "day_of_week": 2,
  "speed_limit": 60,
  "road_type": 6,                    # from OSRM road class, mapped
  "junction_detail": 0,
  "light_conditions": 4,             # derived from time + date + location
  "weather_conditions": 2,           # mapped from Open-Meteo WMO code
  "road_surface_conditions": 2,      # derived from precipitation
  "urban_or_rural_area": 2,
  "grid_severity_index": 1.84,       # looked up from the database
  "hotspot_risk_band": "moderate"    # from the k-Means model
}
```

Three of these need real translation work and are easy to underestimate:

- **Weather:** Open-Meteo returns WMO codes. STATS19 uses its own. A mapping
  table has to be written by hand.
- **Light conditions:** not given by any API. Derived from sunrise/sunset for
  that date and location, plus whether the area is urban (likely lit) or rural.
- **Road type and speed limit:** OSRM gives a road classification. It has to be
  mapped onto STATS19 categories, with sensible defaults where it cannot be
  determined.

Budget real time for these. They are where "connect the backend" day usually
overruns.

---

## 16. Scope — in and out

### In scope

- Complete ML pipeline: raw data through to a saved, evaluated model
- Two ML techniques: supervised classification and unsupervised clustering
- Model comparison with proper metrics and cross-validation
- REST API with a distinct prediction service layer
- Web frontend with an interactive map
- Route comparison and per-segment risk explanation
- Insights dashboard
- Prediction logging
- Full documentation and report

### Out of scope, and why

| Not building | Reason |
|---|---|
| Login / accounts | Adds auth complexity, teaches us nothing about ML |
| Admin panel | No admin users exist |
| Real-time alerts | Needs infrastructure we do not have time for |
| Mobile app | Web is enough to demonstrate everything |
| Live traffic data | Not available free; not needed for a safety score |
| Turn-by-turn navigation | We are a planning tool, not a satnav |
| Deployment to a cloud host | Runs locally for the demo; deployment is not graded |
| Whole-of-Britain hotspots at once | Slow; we scope the map to a region |

### Geographic scope — important

**The model is trained on Great Britain data and only works for journeys in
Great Britain.**

This is a real constraint and we state it clearly in the app. A journey entered
in another country would produce a meaningless score.

We say so on the About page and in the report. Being explicit about where a
model does not apply is a mark of understanding, not a weakness. If someone asks
"could this work elsewhere?", the answer is yes — the method transfers, but it
would need that country's own collision dataset, and most countries do not
publish one at this level of detail.

---

## 17. Limitations and honesty

Every one of these should be in the report. Volunteering them scores better than
being caught by them.

**1. We predict severity, not likelihood.**
The most important limitation. Explained in section 5.

**2. Relative, not absolute.**
A score of 88 does not mean "88% safe". It means safer than a route scoring 74,
under these conditions, based on this data.

**3. Historical patterns may not hold.**
Roads change. Junctions get rebuilt, speed limits change, average speed cameras
get installed. A location that was dangerous three years ago may not be now.

**4. Under-reporting.**
Only police-reported injury collisions are in the data. Minor collisions are
under-recorded.

**5. Severity grading changed mid-period.**
The DfT reporting change makes Serious vs Slight less consistent across years.

**6. No contributory factors.**
The most predictive columns — what actually caused each collision — are withheld
from the open release.

**7. No traffic volume.**
We know where collisions happened but not how many vehicles pass. A road with
many collisions may simply be very busy rather than badly designed. This is
the single biggest thing we would add with more time and data.

**8. k-Means makes round clusters.**
Roads are long and thin. Our zones are an approximation. DBSCAN would fit road
shapes better. We used k-Means because it is the module's technique and it is
adequate for zone-level risk.

**9. Segment sampling is coarse.**
We score a point every few kilometres, not every metre. A short dangerous
junction can be missed between sample points.

**10. Weather forecasts are forecasts.**
They can be wrong, especially further ahead.

---

## 18. Ethics, licensing and disclaimer

### Data licence

STATS19 data is published under the **Open Government Licence v3.0**. Free to
use with attribution. We credit the Department for Transport in the README, the
report, and the app footer.

The public release contains no personal data. Sensitive and identifying fields
are removed by DfT before publication.

### Safety disclaimer

This must appear in the app.

> RoadSafe AI is an academic project. Its scores are relative estimates based on
> historical collision patterns and should not be the only factor in a route
> decision. It does not predict whether a collision will occur. Always drive
> according to the conditions and follow the Highway Code.

### Ethical considerations worth raising in the viva

**Could this stigmatise areas?** Labelling roads or neighbourhoods as "dangerous"
has consequences — for property, for perception, for the people who live there.
We show relative risk bands rather than raw danger labels, and we always give
the reasons behind a score rather than an unexplained verdict.

**Could it cause harm if trusted too much?** A driver who sees "88/100" may drive
less carefully. The disclaimer and the wording of the interface are written to
present the score as one input to a decision, not as a promise of safety.

**Is the data itself biased?** Yes, in a specific way. Under-reporting is not
uniform — it varies by injury severity and possibly by area and demographics.
A model trained on police-reported collisions inherits the patterns of what gets
reported, not only what happens.

Raising these unprompted in the viva demonstrates thinking beyond the code.

---

## 19. How this maps to the module syllabus

Use this table when writing the report. It shows the lecturer, directly, that
the project was built around the module rather than found on the internet.

| Module | Topic taught | Where we use it |
|---|---|---|
| **1** | Supervised vs unsupervised learning | We use both — classification and clustering — and explain why each suits its job |
| **2** | Data & dataset characteristics | Notebook 01: records, features, types, distributions, missing values, duplicates, quality issues |
| **2** | Training / evaluating / inference | Notebooks 02–04 train and evaluate; the backend performs inference |
| **3** | Train-test split | Notebook 04, stratified |
| **3** | Cross-validation | Notebook 04, 5-fold StratifiedKFold |
| **3** | Overfitting / underfitting | Notebook 04, train vs test macro F1 comparison |
| **3** | Hyperparameters | Notebook 04, testing the `C` regularisation parameter |
| **4** | Multi-class classification | Three severity classes |
| **4** | Logistic Regression | Our main model |
| **4** | Sigmoid / probability output | We use `predict_proba` to build the safety score |
| **4** | Decision threshold | Discussed — how confident before we call a section high risk |
| **4** | Confusion matrix | Notebook 04, plotted |
| **4** | **Accuracy and its limitations** | Notebook 04 — the dummy baseline proves it on our own data |
| **4** | Precision, recall, F1 | Reported per class and as macro averages |
| **4** | When to use which metric | Argued explicitly: recall on Fatal matters most for a safety tool |
| **5** | k-Means clustering | Notebook 05, collision hotspot zones |
| **5** | Cluster quality assessment | Elbow method and silhouette score |
| **5** | Anomaly detection use case | Identifying unusually severe zones |
| **6** | Architecting ML systems | Section 4 of this document |
| **6** | Data extraction, analysis, preparation | Notebooks 01–03 |
| **6** | Model training, evaluation, validation | Notebooks 04–05 |
| **6** | Trained model and prediction service | `model.joblib` + `prediction.py` |
| **6** | Performance monitoring | `prediction_log` table |
| **6** | Serving design decisions | Section 11 — why one Python service, not two |
| **6** | Structured data prediction | The entire project |

---

## 20. Risks and what we do about them

| Risk | Likelihood | Impact | What we do |
|---|---|---|---|
| Dataset download fails or is slow | Low | High | Start it on Day 1 before anything else |
| Data is too big for a laptop | Medium | Medium | Load only the columns we need; sample if necessary; save as parquet |
| Decoding the STATS19 codes takes longer than expected | Medium | High | Download the DfT guide on Day 1 and build the lookup dictionaries on Day 2 |
| OSRM public demo is slow or rate-limited | Medium | High | Cache route responses; have 2–3 fixed demo journeys pre-cached for the presentation |
| Weather API unreachable during the demo | Low | High | Fall back to seasonal averages and display a notice; never error out |
| Logistic Regression performs poorly | Medium | Medium | Expected on messy data. Frame the comparison honestly and choose based on explainability as well as score |
| Training/serving skew | Medium | **Very high** | Shared `features.py`, whole-pipeline artifact, startup column check |
| Someone falls behind | Medium | High | Daily 15-minute check-in; the plan has a buffer day |
| Merge conflicts in notebooks | **High** | Medium | One owner per notebook; never two people editing the same `.ipynb` |
| Uneven GitHub contributions | Medium | **Very high** — it is graded | Everyone commits every day; rotate who types in shared sessions |
| Scope creep | **High** | High | Feature freeze after Day 7. Nothing new after that, only fixes |
| Running out of time | Medium | Very high | Day 8 is a buffer with nothing planned in it |

### The two biggest risks, honestly

**Scope creep.** AI coding tools make it very easy to add "just one more thing".
Every addition costs testing time and creates bugs. The feature freeze is not a
suggestion.

**Uneven contributions.** This is graded directly and it is the easiest mark to
lose for a reason that has nothing to do with the quality of the work.

---

## 21. Definition of done

A task is not finished until all of these are true.

**For ML tasks:**
- [ ] Code runs top to bottom in a fresh kernel without errors
- [ ] Every decision has a written reason in a markdown cell
- [ ] Outputs are saved to the expected path
- [ ] The other two members have seen it and understand it
- [ ] Committed and pushed

**For backend tasks:**
- [ ] Endpoint appears and works in `/docs`
- [ ] Handles bad input without crashing
- [ ] Handles a failed external API without crashing
- [ ] Returns a response matching the Pydantic schema
- [ ] Committed and pushed

**For frontend tasks:**
- [ ] Works against the real backend, not mock data
- [ ] Shows a loading state
- [ ] Shows a readable message on error
- [ ] Does not break on a narrow window
- [ ] Committed and pushed

**For the project overall:**
- [ ] `git clone`, follow the README, and it runs — verified by someone who did not write it
- [ ] All three members have meaningful commits across multiple days
- [ ] All three can explain the whole pipeline, not only their own part
- [ ] Report complete with all required sections
- [ ] Screenshots captured
- [ ] Demo rehearsed at least twice

---

## 22. Glossary

Terms that may come up in the viva.

| Term | Meaning |
|---|---|
| **STATS19** | The form UK police use to record injury collisions; also the name of the resulting dataset |
| **Supervised learning** | Training with labelled data — we know the right answer for each row |
| **Unsupervised learning** | Finding structure in data with no labels — our clustering |
| **Multi-class classification** | Predicting one of three or more categories |
| **Class imbalance** | When one class has far more rows than others |
| **Macro F1** | The average of the F1 score for each class, treating every class equally |
| **Precision** | Of everything predicted as class X, how much really was X |
| **Recall** | Of everything that really was class X, how much did we catch |
| **Confusion matrix** | A grid showing predicted class against actual class |
| **Stratified split** | A split that keeps the class proportions the same in both parts |
| **Cross-validation** | Splitting the data several ways and averaging, for a more reliable score |
| **Overfitting** | The model memorised the training data and does worse on new data |
| **One-hot encoding** | Turning a category column into several 0/1 columns |
| **Standardisation** | Rescaling numbers so they have mean 0 and standard deviation 1 |
| **Pipeline** | A scikit-learn object holding preprocessing and model together as one unit |
| **Inertia** | How tightly packed k-Means clusters are; lower is tighter |
| **Silhouette score** | How well each point fits its assigned cluster, from −1 to 1 |
| **Elbow method** | Plotting inertia against k and looking for the bend |
| **Training/serving skew** | When features are built differently in training and in production, silently breaking predictions |
| **Polyline** | A list of coordinates describing a route path |
| **WMO weather codes** | The international weather code standard Open-Meteo returns |
| **OSRM** | Open Source Routing Machine — the free routing engine we use |
| **Open Government Licence** | The UK licence allowing free reuse of government data with attribution |

---

## Attribution

Contains public sector information licensed under the Open Government Licence v3.0.
Road collision data: UK Department for Transport, STATS19.
Routing: Open Source Routing Machine (OSRM).
Weather: Open-Meteo.
