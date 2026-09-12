# RoadSafe AI — Team Tasks & Timeline

Module: ITS 2140 — Machine Learning
Team size: 3
Start: **9 September**
Deadline: **18 September** (not extendable)

Read `PROJECT_SPECIFICATION.md` first. This document assumes you know what we
are building.

---

## Contents

1. [How the work is divided](#1-how-the-work-is-divided)
2. [Ground rules](#2-ground-rules)
3. [Git workflow](#3-git-workflow)
4. [Owner 1 — Data & Prediction Service](#4-owner-1--data--prediction-service)
5. [Owner 2 — Features & Clustering](#5-owner-2--features--clustering)
6. [Owner 3 — Models & Evaluation](#6-owner-3--models--evaluation)
7. [Day-by-day timeline](#7-day-by-day-timeline)
8. [Dependency map](#8-dependency-map)
9. [What to do while blocked](#9-what-to-do-while-blocked)
10. [Handover checklist](#10-handover-checklist)
11. [Viva preparation](#11-viva-preparation)
12. [Demo script](#12-demo-script)

---

## 1. How the work is divided

### The principle

This is a Machine Learning module. **Every member must own a real piece of the
ML work.** Nobody is "the frontend person".

We split by **ownership**, not by layer.

| | **Owner 1** | **Owner 2** | **Owner 3** |
|---|---|---|---|
| **ML area** | Data & preprocessing | Feature engineering & clustering | Models & evaluation |
| **App area** | Backend API + prediction service | Weather, routing & scoring logic | Frontend & map |
| **Notebooks** | 01, 02 | 03, 05 | 04 |
| **Report sections** | Dataset, data quality | Feature engineering, clustering | Models, evaluation, metrics |

### Balancing the load

The ML areas are not equal in size. Data cleaning is roughly one day; model
training and evaluation is closer to three. So the app work is deliberately
weighted the other way:

- **Owner 1** has the lightest ML load, so takes the heaviest backend load.
- **Owner 3** has the heaviest ML load, so takes the frontend, which starts
  earlier and has more slack.
- **Owner 2** sits in the middle on both.

Total effort comes out roughly even.

### What "owner" means

The owner:
- makes the final decision in that area
- writes that section of the report
- leads that part of the demo
- **must answer for it in the individual viva**

The owner does **not** have to be the only person who touches it. Others can help
and should. But when a question is asked, the owner answers.

---

## 2. Ground rules

**1. Everyone commits every day.**
GitHub contribution history is graded. A day with no commit is a day that looks
like you did nothing. Even a documentation commit counts.

**2. Everyone must understand the whole pipeline.**
The viva is individual. You will be asked about parts you did not build. Read
each other's notebooks. Ask questions.

**3. Daily 15-minute check-in.**
Same time each day. Three questions: what did you finish, what is next, what is
blocking you. Fifteen minutes, not an hour.

**4. Do not edit someone else's notebook.**
Jupyter notebooks merge badly in Git. One owner per notebook. If you need
something changed in someone else's notebook, ask them.

**5. Never rewrite `features.py` logic in the backend.**
Import it. See section 15 of the specification for why this matters.

**6. Feature freeze after Day 7.**
After Day 7, no new features. Bug fixes and polish only. This rule is what
protects the deadline.

**7. If you are stuck for more than one hour, say so.**
Do not lose a day to something the other two could have solved in ten minutes.

---

## 3. Git workflow

### Branch naming

```
data/cleaning-preprocessing        Owner 1
data/decode-lookup                 Owner 1
backend/api-setup                  Owner 1
backend/prediction-service         Owner 1

feature/engineering                Owner 2
feature/clustering-hotspots        Owner 2
backend/weather-routing            Owner 2
backend/scoring                    Owner 2

model/training-evaluation          Owner 3
frontend/setup                     Owner 3
frontend/map                       Owner 3
frontend/dashboard                 Owner 3
```

Pattern: `area/short-description`. Lowercase, hyphens, no spaces.

### Working on a task

```bash
# start from an up-to-date main
git checkout main
git pull

# create your branch
git checkout -b feature/engineering

# ... do the work ...

git add .
git commit -m "Add time-of-day binning and weekend flag features"
git push -u origin feature/engineering
```

Then open a Pull Request on GitHub. Ask one teammate to review it. Merge it.

### Commit messages

Write what changed, not "update" or "fix".

Good:
```
Add weather code mapping from WMO to STATS19
Handle -1 missing value codes in preprocessing
Fix confusion matrix labels showing indices instead of severity names
```

Bad:
```
update
changes
asdf
fix bug
```

The lecturer may read these. They are evidence of what you did.

### Rules

- Never commit directly to `main`. Always branch, then PR.
- Never commit the raw CSV files. They are in `.gitignore` for a reason.
- **Do** commit the files in `ml/artifacts/` — the trained models. They are only
  a few MB and it means everyone can run the backend without retraining.
- Pull from `main` every morning before you start.

---

## 4. Owner 1 — Data & Prediction Service

### Your responsibility in one sentence

You turn 93 MB of coded government CSV into clean, trustworthy data — and later
you build the service that loads the trained model and serves predictions.

### Why your part matters

Everything downstream depends on you. If the missing-value codes are handled
wrong, every feature is wrong, every model result is wrong, and nobody will know
until it is too late to fix. You are the foundation.

In the viva you will be asked: *"How did you handle missing values, and why did
you choose that approach?"* Have a real answer, not "I dropped them".

---

### Phase 1 — Data (Days 1–2)

#### Task 1.1 — Get the data

1. Go to https://www.gov.uk/government/statistics/road-safety-data
2. Download **Road Safety Data - Collisions - last 5 years** (CSV, ~93 MB)
3. Download the **data guide / variable lookup** file on the same page
4. Put both in `ml/data/raw/`
5. Rename the collisions file to `collisions_last_5_years.csv` (or update
   `ml/src/config.py` to match your filename)

**Do this first, before anything else.** It is the critical path.

#### Task 1.2 — Exploration (notebook 01)

Run `01_data_exploration.ipynb` and answer every question the assignment asks:

- How many records?
- How many features?
- What is each feature?
- What data types?
- How many missing values per column?
- How many duplicates?
- What does the target distribution look like?

**The important cell** is the target distribution. Print the counts and the
percentages. You will find that most collisions are "Slight" and very few are
"Fatal". Screenshot this. It is the single most important fact in the project.

Write your findings in markdown cells as you go. Do not leave it until report
day — you will forget the details.

#### Task 1.3 — Build the decode lookups

This is the task people underestimate.

The data is all numbers. `weather_conditions = 2` is meaningless until you open
the DfT guide and find that it means "Raining no high winds".

Build a Python dictionary for every column you care about:

```python
WEATHER_MAP = {
    1: "Fine no high winds",
    2: "Raining no high winds",
    3: "Snowing no high winds",
    # ... etc
}
```

Do this for: `weather_conditions`, `road_surface_conditions`, `light_conditions`,
`road_type`, `junction_detail`, `junction_control`, `urban_or_rural_area`,
`accident_severity`, `day_of_week`.

Put them in `ml/src/config.py` so everyone can use them.

**Warning:** the codes in the guide are the truth. Do not guess them from the
placeholder values I put in the starter code. Check every one.

#### Task 1.4 — Cleaning (notebook 02)

Write each step as a function in `ml/src/preprocessing.py`, then call it from
the notebook. Do not leave logic only in the notebook — the backend cannot
import a notebook.

Steps:

1. **Convert `-1` to NaN.** Critical. If you skip this, the model learns that
   "unknown" is a weather type.
2. **Decide what to do with each column that has missing values.** Options: drop
   the column, drop the rows, or fill with a sensible value. Different columns
   need different answers. **Write down your reason for each one.**
3. **Drop rows with no latitude/longitude.** We need coordinates. Report how many
   were dropped.
4. **Remove duplicates.** Report how many were found.
5. **Drop columns we will not use.** Things like local authority reference codes,
   LSOA codes, police force numbers. Justify each removal.
6. **Check for outliers.** Speed limits outside 20–70. Impossible dates.
   Coordinates outside Great Britain.

Save the result:
```python
df_clean.to_parquet(config.PROCESSED_DIR / "collisions_clean.parquet")
```

Parquet, not CSV. It is much smaller and much faster to load, and it keeps the
data types.

#### Task 1.5 — Write the data quality section

While it is fresh, write the data quality section of the report. Section 6 of
the specification lists the issues — confirm each one against your actual data
and add the real numbers.

**Deliverables for Phase 1:**
- [ ] `collisions_clean.parquet` exists
- [ ] `preprocessing.py` has real, working functions
- [ ] Decode dictionaries in `config.py`
- [ ] Notebooks 01 and 02 run cleanly top to bottom
- [ ] Data quality notes written
- [ ] **Told Owner 2 the data is ready**

---

### Phase 2 — Backend (Days 3–7)

You start this while Owners 2 and 3 work on features and models. You do not need
the model to exist yet — build the structure, and plug the model in when it
arrives.

#### Task 1.6 — Database setup (Day 3)

```bash
docker compose up -d
```

Create the tables from `backend/app/db/models.py`. Write `db/seed.py` to load the
grid and hotspot data into them. It will not have data to load until Owners 2
and 3 finish, but write it now.

#### Task 1.7 — FastAPI skeleton (Day 3)

Get `uvicorn app.main:app --reload` running. Confirm `/docs` opens. Get
`/api/health` returning a response.

#### Task 1.8 — The prediction service (Days 5–6)

This is your main piece. `backend/app/services/prediction.py`.

It must:

1. Load `model.joblib` **once at startup**, not per request. Loading a model
   takes time; doing it per request would make the app unusably slow.
2. Load `hotspot_kmeans.joblib` the same way.
3. Read the feature column list from `metrics.json` and check it matches what
   `features.py` produces. **Fail loudly at startup if it does not.**
4. Expose `predict_segment(conditions: dict)` which:
   - turns the dict into a one-row DataFrame
   - calls `build_features()` from `ml/src/features.py` — the same function used
     in training
   - calls `model.predict_proba()`
   - returns the three class probabilities

**The rule you must not break:** import the feature code. Do not rewrite it.

#### Task 1.9 — Wire up the main endpoint (Day 6)

`POST /api/journey/analyze` orchestrates everything: routing, weather, features,
prediction, scoring, response.

Owner 2 provides the routing, weather and scoring functions. You call them in
the right order and shape the response.

#### Task 1.10 — Supporting endpoints (Day 7)

- `GET /api/hotspots` — for the dashboard map
- `GET /api/insights/summary` — for the charts
- `GET /api/model/metrics` — reads `metrics.json`
- Prediction logging into `prediction_log`

#### Task 1.11 — Error handling (Day 7)

Every failure mode from section 13 of the specification. Especially: **if the
weather API is down, the app must still return routes.** Degrade, do not crash.

**Deliverables for Phase 2:**
- [ ] `/api/health` shows `model_loaded: true`
- [ ] `/api/journey/analyze` returns a valid, complete response
- [ ] All supporting endpoints work
- [ ] `/docs` page is complete — screenshot it for the report
- [ ] Errors handled, no stack traces reach the user
- [ ] Predictions logged to the database

---

## 5. Owner 2 — Features & Clustering

### Your responsibility in one sentence

You decide what the model actually looks at — and you find where collisions
cluster on the map.

### Why your part matters

Feature engineering is **explicitly graded**. The assignment demands at least 5–6
meaningful techniques. Your work is the direct answer to that requirement.

You also own the clustering, which is the module's unsupervised learning topic
(Module 5) and is what most competing groups will not have.

In the viva you will be asked: *"Explain your feature engineering. Why does each
feature help?"* Every feature needs a reason. "It seemed useful" is not a reason.

---

### Phase 1 — Features (Days 2–3)

**You are blocked until Owner 1 finishes cleaning.** See section 9 for what to
do meanwhile — do not sit idle.

#### Task 2.1 — Build the features (notebook 03)

Implement every function in `ml/src/features.py`. The starter file has the
skeletons. Fill them in.

The nine techniques from section 7 of the specification:

1. Date/time extraction
2. Binning (hour into time-of-day buckets)
3. New feature (weekend flag)
4. Interaction (adverse conditions)
5. Interaction (speed × road type)
6. Geographic aggregation (grid cells)
7. Grouping rare categories
8. Encoding — you define which columns; Owner 3 applies it in the pipeline
9. Scaling — same

**Critical:** the placeholder code numbers are guesses. Owner 1's decode
dictionaries are the truth. Check every code against them before you trust a
feature.

#### Task 2.2 — Validate every feature

Do not just build features. **Prove each one relates to the target.**

For a categorical feature:
```python
pd.crosstab(df["time_of_day"], df[config.TARGET], normalize="index")
```

If the severity proportions are the same across every bucket, the feature is
telling the model nothing. Drop it or redesign it.

For each feature, write one markdown line: what it is, why it should help, and
what the data actually showed.

**Do not keep a feature just to reach a count of six.** A lecturer who asks
"why is this feature here?" and hears silence will not be impressed. Six good
features beat nine padded ones.

#### Task 2.3 — Build the grid risk table

Group by grid cell. Count total, fatal, serious, slight. Compute a severity
index. Save it.

This becomes a database table and a live lookup at prediction time.

#### Task 2.4 — Save the outputs

```
collisions_features.parquet
grid_risk.parquet
```

Then **tell Owner 3 immediately.** They are blocked until this exists.

**Deliverables for Phase 1:**
- [ ] `features.py` complete and working
- [ ] Every feature validated against the target, with written findings
- [ ] `collisions_features.parquet` saved
- [ ] `grid_risk.parquet` saved
- [ ] Feature table written for the report
- [ ] **Told Owner 3 the features are ready**

---

### Phase 2 — Clustering (Day 4)

#### Task 2.5 — k-Means hotspots (notebook 05)

Work through the notebook. Key decisions you own:

- **Which geographic area?** Start with one region. Great Britain all at once is
  slow and the demo only needs one area.
- **What value of k?** Use the elbow method and the silhouette score, but also
  ask what is actually useful on a map. Three zones is useless; fifty is a mess.
  **Write down your reasoning.**
- **What risk band thresholds?** The starter values are guesses. Look at your
  real numbers and choose cut-offs that split your clusters sensibly.

Save `hotspot_kmeans.joblib` and `hotspot_clusters.parquet`.

**Be ready for this viva question:** *"Why k-Means and not DBSCAN?"* The honest
answer is in section 17 of the specification. Know it.

---

### Phase 3 — External data & scoring (Days 5–7)

#### Task 2.6 — Routing integration (Day 5)

`backend/app/services/routing.py`.

- Call OSRM, request alternatives, get 2–3 routes
- **Watch out:** OSRM wants longitude first, then latitude. This trips everyone up.
- Write `split_into_segments()` — sample a point every 5–10 km along the polyline
- Extract road classification and map it to STATS19 road types
- **Cache responses.** The public OSRM demo server can be slow, and you will call
  it many times while testing.

#### Task 2.7 — Weather integration (Day 5)

`backend/app/services/weather.py`.

- Call Open-Meteo for the journey time and location
- **Write the WMO → STATS19 mapping table.** This is manual work. Open-Meteo's
  codes and STATS19's codes are different systems and nothing maps them for you.
- Derive `road_surface_conditions` from precipitation and temperature
- Derive `light_conditions` from sunrise/sunset for that date, location, and
  whether the area is urban

These derivations are more work than they look. Budget real time.

#### Task 2.8 — The scoring service (Day 6)

`backend/app/services/scoring.py`. This is where the model's output becomes
something a human understands.

**Segment score.** Combine the severity probabilities with the historical grid
risk into a 0–100 number. You design the formula. **Write it down and justify
it** — a lecturer may ask why you weighted it that way.

**Route score.** Combine segment scores, weighted by segment length. A 20 km
risky stretch matters more than a 2 km one.

**Risk bands.** Score to colour: green / orange / red.

**Explanations.** This is the feature that makes the app feel intelligent.
Take the model's coefficients (Owner 3 provides them) and the segment's actual
conditions, and produce readable lines:

```
• Rain forecast during travel window
• Travelling after dark
• 60 mph single carriageway
• Higher than average serious collision share
```

Not hardcoded rules — driven by which inputs actually pushed the risk up for
this segment.

**Deliverables:**
- [ ] OSRM returns routes reliably
- [ ] Routes split into scoreable segments
- [ ] Weather fetched and mapped to model inputs
- [ ] Light conditions derived correctly
- [ ] Scoring formula written and documented
- [ ] Explanations generated from real model weights

---

## 6. Owner 3 — Models & Evaluation

### Your responsibility in one sentence

You train the models, prove which one is best and why, and build the interface
that shows it all off.

### Why your part matters

You own the core of the module. Modules 3 and 4 are almost entirely about what
you do in notebook 04. The lecturer's deepest questions will land on you.

You also own the frontend, because it starts early and can proceed in parallel
while you wait for features to be ready.

In the viva you will be asked: *"Your accuracy is high. Why is that misleading?"*
That question is aimed at you.

---

### Phase 1 — Frontend foundation (Days 1–3)

Start here. You are blocked on ML work until Day 4, so use this time.

#### Task 3.1 — Next.js setup (Day 1)

```bash
cd frontend
npm install
npm run dev
```

Get it running. Add Tailwind. Confirm the page loads.

#### Task 3.2 — Journey form (Day 2)

From, To, Date, Time, and a submit button. Basic validation. Wire it to
`lib/api.ts` with mock data for now — the backend is not ready.

#### Task 3.3 — Map (Days 2–3)

Leaflet with react-leaflet.

**The one thing that will catch you out:** Leaflet does not work with
server-side rendering. You must load the map component dynamically:

```tsx
const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });
```

Get a map showing. Draw a hardcoded polyline. Add markers.

---

### Phase 2 — Models (Days 4–5) — your main ML work

**You are blocked until Owner 2 delivers `collisions_features.parquet`.**

#### Task 3.4 — Setup (Day 4)

Choose the final feature columns with Owner 2. Split them into numeric and
categorical. Build the `ColumnTransformer` with `StandardScaler` and
`OneHotEncoder`.

#### Task 3.5 — The baseline

Run the `DummyClassifier` cell first, before any real model.

It predicts the most common class every time. It will get high accuracy and a
terrible macro F1, with zero recall on Fatal.

**This single result is the strongest thing in your entire notebook.** It proves,
on your own data, why accuracy is the wrong metric — which is exactly the point
Module 4 makes. Screenshot it.

#### Task 3.6 — Logistic Regression (your main model)

Train it with `class_weight="balanced"`. Then:

- Classification report — precision, recall, F1 per class
- Confusion matrix, plotted, with real severity labels not indices
- Train vs test macro F1 — the overfitting check
- 5-fold stratified cross-validation
- Hyperparameter sweep over `C`
- **Coefficient analysis** — which conditions push risk up?

That last one is not optional. Owner 2 needs those coefficients to build the
explanations in the app. This is where the "why is this risky" text comes from.

#### Task 3.7 — Comparison models

Random Forest, and XGBoost if time allows.

Present these honestly: they are beyond the module, included to check whether a
non-linear model helps enough to justify losing explainability.

#### Task 3.8 — Compare and choose

Build the comparison table: accuracy, macro precision, macro recall, macro F1
for every model including the dummy.

Then **choose, and write down why.**

Do not just pick the highest number. Consider:
- Which catches more Fatal and Serious cases?
- Can we explain how it works?
- Does it give usable probabilities and readable reasons for the app?

A defensible answer: *"Random Forest scored slightly higher on macro F1, but we
chose Logistic Regression because its coefficients let us explain each prediction
to the user, and for a safety tool that transparency outweighs a small metric
gain."*

That is a mature answer. So is the opposite, argued as well.

#### Task 3.9 — Save

Save the **whole pipeline** — preprocessing and model together — as
`model.joblib`. Not just the model. If you save only the model, the encoders get
separated from it and the backend will build features that do not match.

Save `metrics.json` including the feature column list. Owner 1 needs it for the
startup check.

**Then tell Owner 1 immediately.** They are blocked until the model exists.

**Deliverables:**
- [ ] Dummy baseline result captured
- [ ] Logistic Regression trained and fully evaluated
- [ ] Confusion matrix plotted with proper labels
- [ ] Cross-validation done
- [ ] Overfitting checked
- [ ] Hyperparameters explored
- [ ] Coefficients extracted and given to Owner 2
- [ ] Comparison table complete
- [ ] Choice made and justified in writing
- [ ] `model.joblib` and `metrics.json` saved
- [ ] **Told Owner 1 the model is ready**

---

### Phase 3 — Frontend delivery (Days 6–8)

#### Task 3.10 — Connect to the real API (Day 6)

Replace mock data with real calls. Handle loading states and errors.

#### Task 3.11 — Route visualisation (Day 7)

- Draw all routes, highlight the selected one
- Colour each segment green / orange / red by risk band
- Click a segment → popup with score and reasons
- Route comparison cards, sorted by safety score
- Weather summary

#### Task 3.12 — Insights dashboard (Day 7)

- Hotspot zones on a map
- Charts: collisions by hour, severity by weather, severity by road type
- Model performance panel using `/api/model/metrics`

This page is where you show the lecturer your evaluation work inside the running
app, not only in a notebook. It is worth the effort.

#### Task 3.13 — About page (Day 8)

Methodology, data source and licence, what the score means, what it does not
mean, and the safety disclaimer.

Short page. Easy to build. It is also the page you point at during the demo when
explaining limitations, which makes it worth more than its size suggests.

---

## 7. Day-by-day timeline

### Day 1 — Tuesday 9 September — Setup

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| **Download the dataset** (do this first) | Read the DfT data guide | Frontend setup, `npm install` |
| Download the DfT guide | Read the specification fully | Get Next.js running |
| Run notebook 01 | Help Owner 1 read the codes | Add Tailwind |
| Report the target distribution to the team | Set up Python environment | Set up Python environment |

**Everyone:** clone the repo, get it running, read `PROJECT_SPECIFICATION.md`
end to end.

**End of day:** everyone has the repo running. The dataset is downloading or
downloaded. Everyone has seen the class imbalance.

---

### Day 2 — Wednesday 10 September — Clean

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| Build the decode dictionaries | **Help Owner 1 with decoding** (it is a big job) | Journey form component |
| Notebook 02 — cleaning | Plan the features on paper | Start the map component |
| Handle `-1` codes | Sketch which interactions to try | Mock data for testing |
| Drop bad rows and columns | | |
| Save `collisions_clean.parquet` | | |

**End of day:** clean data exists. Owner 2 is unblocked.

---

### Day 3 — Thursday 11 September — Features

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| FastAPI skeleton running | **Notebook 03 — all features** | Map working with a hardcoded route |
| `/api/health` works | Validate each against the target | Route card components |
| Docker + Postgres up | Build the grid risk table | Basic layout |
| Write `db/seed.py` | Save both parquet files | |

**End of day:** features exist. Owner 3 is unblocked.

---

### Day 4 — Friday 12 September — Models & clustering

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| Database tables created | **Notebook 05 — k-Means** | **Notebook 04 — training** |
| Seed the grid data | Choose k, justify it | Dummy baseline first |
| Prepare `prediction.py` structure | Score the clusters | Logistic Regression |
| | Save the hotspot artifacts | Confusion matrix, CV, overfitting check |

**End of day:** Logistic Regression trained and evaluated. Clusters saved.

---

### Day 5 — Saturday 13 September — Comparison & integration

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| **Prediction service** — load model | OSRM routing works | Random Forest comparison |
| Startup column check | Weather API works | Comparison table |
| `predict_segment()` working | **WMO → STATS19 mapping** | **Choose the model, justify it** |
| | Light conditions derivation | Save `model.joblib` + `metrics.json` |
| | Segment splitting | Extract coefficients → give to Owner 2 |

**End of day:** `/api/health` shows `model_loaded: true`.

**This is the most important checkpoint in the project.** If the model is not
saved and loading by the end of today, raise it immediately and cut scope
elsewhere.

---

### Day 6 — Sunday 14 September — End to end

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| **Wire up `/api/journey/analyze`** | **Scoring formula** | Connect frontend to real API |
| Orchestrate the full flow | Route score weighting | Loading and error states |
| Return the full response | Risk bands | Draw real routes on the map |
| | Explanation generation | |

**End of day:** the system works end to end. It may look rough. That is fine —
today is about the pipeline working, not looking good.

---

### Day 7 — Monday 15 September — Make it good

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| Supporting endpoints | Tune the scoring formula | Segment colouring |
| Prediction logging | Improve explanation wording | Click → explanation popup |
| Error handling everywhere | Cache OSRM responses | Route comparison cards |
| Weather fallback | | Insights dashboard |

**End of day: FEATURE FREEZE.** Nothing new after tonight.

---

### Day 8 — Tuesday 16 September — Buffer & polish

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| Fix bugs | Fix bugs | Fix bugs |
| Test edge cases | Pre-cache demo routes | About page |
| Verify a clean clone runs | Verify scoring on real journeys | Responsive check |

**This day has no new work planned. That is deliberate.** Something will have
overrun. This is where it gets absorbed.

If everything is genuinely done, start the report early. Do not add features.

---

### Day 9 — Wednesday 17 September — Documentation

**Everyone writes their own report sections.**

| Owner 1 | Owner 2 | Owner 3 |
|---|---|---|
| Dataset section | Feature engineering section | Model development section |
| Data quality issues | Clustering section | Evaluation and metrics |
| Architecture and API docs | Scoring methodology | Model selection reasoning |

**Together:**
- [ ] Finish the README
- [ ] Architecture diagram
- [ ] Screenshots: app pages, `/docs`, confusion matrix, feature importance,
      cluster map, comparison table
- [ ] **Check every member's GitHub contributions** — fix any imbalance today,
      not tomorrow
- [ ] Test a clean `git clone` and full setup from scratch

---

### Day 10 — Thursday 18 September — Submit

**No new code.**

Morning:
- [ ] Final check that everything runs
- [ ] Rehearse the demo twice
- [ ] Each member practises explaining the whole pipeline

Afternoon:
- [ ] Submit before the deadline
- [ ] Do not wait until the last hour

---

## 8. Dependency map

```
Day 1   Owner 1: download data
              |
              v
Day 2   Owner 1: clean data
              |
              +--> collisions_clean.parquet
                          |
                          v
Day 3               Owner 2: features
                          |
                          +--> collisions_features.parquet
                          +--> grid_risk.parquet
                                   |
        Day 4                      v
        Owner 2: clustering   Owner 3: train models
              |                    |
              +--> hotspot_*.joblib|
                                   +--> model.joblib
                                   +--> metrics.json
                                            |
        Day 5                               v
                                  Owner 1: prediction service
                                            |
        Day 6                               v
                              Owner 1: /api/journey/analyze
                              Owner 2: scoring
                                            |
                                            v
                                  Owner 3: frontend connects
```

**Runs in parallel, blocked by nothing:**
- Owner 3's frontend work, Days 1–3
- Owner 1's backend skeleton, Day 3

### The three critical handovers

| When | From | To | What |
|---|---|---|---|
| End of Day 2 | Owner 1 | Owner 2 | `collisions_clean.parquet` |
| End of Day 3 | Owner 2 | Owner 3 | `collisions_features.parquet` |
| End of Day 5 | Owner 3 | Owner 1 | `model.joblib` + `metrics.json` |

**Miss one of these and the whole chain slips.** If you are going to be late,
say so the day before, not on the day.

---

## 9. What to do while blocked

The pipeline is sequential, so there will be waiting. Do not sit idle.

**Owner 2, waiting on clean data (Day 1–2):**
- Read the DfT guide properly — you will need it more than anyone
- Help Owner 1 build the decode dictionaries; it is a two-person job
- Plan your features on paper — which interactions might matter and why
- Read the k-Means notebook so Day 4 is not your first look at it

**Owner 3, waiting on features (Days 1–3):**
- Build the entire frontend against mock data
- Read notebook 04 line by line so you understand it before running it
- Revise Module 4 — sigmoid, cross-entropy, precision/recall
- Prepare the confusion matrix and comparison table code in advance

**Owner 1, waiting on the model (Day 4):**
- Build every part of the backend that does not need the model
- Set up the database and write the seeding code
- Write the API error handling
- Test endpoints with fake prediction values

**Everyone, any time:**
- Read the other two notebooks — the viva is individual
- Write your report sections as you go, not on Day 9
- Take screenshots as you produce results; you will not want to regenerate them

---

## 10. Handover checklist

When you hand something to the next person, do all of this. Not some of it.

**Owner 1 → Owner 2 (end of Day 2)**
- [ ] `collisions_clean.parquet` saved in `ml/data/processed/`
- [ ] Row count before and after cleaning, reported
- [ ] Every dropped column listed with a reason
- [ ] Decode dictionaries in `config.py` and confirmed against the DfT guide
- [ ] Notebook 02 runs top to bottom in a fresh kernel
- [ ] Pushed to `main`
- [ ] **Owner 2 has opened it and confirmed it loads**

**Owner 2 → Owner 3 (end of Day 3)**
- [ ] `collisions_features.parquet` and `grid_risk.parquet` saved
- [ ] Final feature list agreed with Owner 3
- [ ] Each feature validated against the target, with written findings
- [ ] Which columns are numeric and which are categorical, stated clearly
- [ ] Notebook 03 runs top to bottom in a fresh kernel
- [ ] Pushed to `main`
- [ ] **Owner 3 has opened it and confirmed the columns are what they expected**

**Owner 3 → Owner 1 (end of Day 5)**
- [ ] `model.joblib` saved — **the whole pipeline, not just the model**
- [ ] `metrics.json` saved, including the feature column list
- [ ] Model choice justified in writing
- [ ] Coefficients extracted and passed to Owner 2
- [ ] Notebook 04 runs top to bottom in a fresh kernel
- [ ] Pushed to `main`
- [ ] **Owner 1 has loaded it and `/api/health` shows `model_loaded: true`**

---

## 11. Viva preparation

The viva is **individual**. You will be asked about parts you did not build.

### Everyone must be able to answer

1. What real problem does this solve, and for whom?
2. Where is the data from, how big is it, and what is in it?
3. Walk me through the whole pipeline, from raw CSV to what the user sees.
4. Why did you predict severity rather than accident probability?
5. Your accuracy is high — why is that misleading here?
6. What is macro F1 and why did you use it?
7. Why Logistic Regression as the main model?
8. What does the clustering add?
9. What are the main limitations of this project?
10. What would you do with another month?

### Owner 1 must also answer

- How did you handle missing values, and why that approach for each column?
- What is the `-1` problem and what happens if you ignore it?
- What data quality issues did you find?
- Why did you drop the columns you dropped?
- How does the backend load the model, and why at startup rather than per request?
- What is training/serving skew and how does your architecture prevent it?
- Why one Python service instead of separate backend and ML services?

### Owner 2 must also answer

- Name every feature engineering technique and why each one helps.
- How did you check a feature was actually useful?
- Why bin the hour instead of using it raw?
- Explain the adverse-conditions interaction. Why not use weather alone?
- How does k-Means work, step by step?
- How did you choose k?
- What is inertia? What is a silhouette score?
- Why is k-Means a poor fit for road-shaped data? What would be better?
- How does the safety score formula work, and why did you weight it that way?

### Owner 3 must also answer

- What does the sigmoid function do?
- How does Logistic Regression handle three classes?
- What is `class_weight="balanced"` doing and why did you need it?
- Why `stratify=y` in the split?
- What is cross-validation and what did it tell you?
- Is the model overfitting? How do you know?
- Read the confusion matrix — what does it say about Fatal collisions?
- What does the `C` hyperparameter control?
- Why did you choose this model over the others?
- How do the coefficients become user-facing explanations?

### How to prepare

Day 9 evening: each person explains their area to the other two for ten minutes.
The other two ask hard questions. Anything you cannot answer is what you revise.

Do this once more on Day 10 morning.

---

## 12. Demo script

Rehearse this twice. Keep it under ten minutes.

**1. The problem (30 seconds)**
Every navigation app optimises for time. None optimises for safety. But road risk
changes with weather, darkness and road design, and drivers cannot see any of it.

**2. The data (1 minute)**
Official UK government collision records, five years, about half a million
incidents. Show notebook 01 — the class imbalance chart.

**3. The problem with accuracy (1 minute)**
Show the dummy baseline. High accuracy, useless model, zero recall on fatal
collisions. **This is the strongest moment in the demo.** It shows you understand
what the metrics actually mean.

**4. Feature engineering (1 minute)**
Show the feature table. Pick one interaction feature and explain why the
combination carries information neither column has alone.

**5. Model comparison (1 minute)**
Show the comparison table and the confusion matrix. Explain the choice and the
reasoning behind it.

**6. Clustering (30 seconds)**
Show the hotspot map. Explain the difference between busy areas and severe areas.

**7. The live app (3 minutes)**
Run a real journey. Show the routes, the scores, the coloured map. Click a red
section and show the explanation. Then open the Insights dashboard.

**8. Limitations (1 minute)**
Volunteer them. Severity not likelihood. No traffic volume data. k-Means fits
roads imperfectly. **Raising these yourself scores better than being caught by
them.**

**9. Architecture (30 seconds)**
Show the diagram. Name the layers in the syllabus's own words: data preparation,
model training and validation, trained model, prediction service, monitoring.

### Demo safety

- **Pre-cache two or three journeys.** Do not rely on the public OSRM server
  responding quickly in front of the class.
- Have screenshots ready in case anything fails live.
- Test on the actual machine you will present from, on the actual network.

---

## Quick reference

| | Owner 1 | Owner 2 | Owner 3 |
|---|---|---|---|
| **ML** | Data & preprocessing | Features & clustering | Models & evaluation |
| **App** | Backend & prediction service | Weather, routing, scoring | Frontend & map |
| **Notebooks** | 01, 02 | 03, 05 | 04 |
| **Delivers** | `collisions_clean.parquet` | `collisions_features.parquet`, `hotspot_*.joblib` | `model.joblib`, `metrics.json` |
| **Deadline for handover** | End Day 2 | End Day 3 | End Day 5 |
| **Report sections** | Dataset, quality, architecture | Features, clustering, scoring | Models, evaluation, selection |

---

**Feature freeze: end of Day 7 (15 September).**
**Submission: 18 September. Do not leave it to the last hour.**
