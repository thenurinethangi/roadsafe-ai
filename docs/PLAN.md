# 10-Day Plan

Deadline: **18 September**. No extension.

Everyone takes part in the ML work. There is an individual viva,
so everyone must be able to explain the whole system.

---

## Day 1 — Setup

- [ ] Download the STATS19 collisions file (last 5 years) and the DfT data guide
- [ ] Put them in `ml/data/raw/`
- [ ] Push this repo to GitHub, add all members
- [ ] Everyone runs the setup steps in the main README
- [ ] Run notebook `01_data_exploration.ipynb` together and look at the data

**End of day:** everyone has the repo running and has seen the dataset.

---

## Day 2 — Understand and clean

- [ ] Decode the number codes using the DfT guide
- [ ] Decide which columns to keep and which to drop
- [ ] Handle the -1 missing codes
- [ ] Remove duplicates and rows with no location
- [ ] Save the cleaned file
- [ ] Write down the data quality issues for the report

**End of day:** `collisions_clean.parquet` exists.

---

## Day 3 — Feature engineering

- [ ] Build all the features in `ml/src/features.py`
- [ ] Check each feature actually relates to severity
- [ ] Build the grid risk table
- [ ] Write the feature table for the report (need 5-6 minimum)

**End of day:** `collisions_features.parquet` exists.

---

## Day 4 — Train the models

- [ ] Encode and scale
- [ ] Train/test split with `stratify=y`
- [ ] Train Logistic Regression, Random Forest, XGBoost
- [ ] Compare using **macro F1**, not accuracy
- [ ] Pick the best, save it to `ml/artifacts/`

**End of day:** `model.joblib` exists.

---

## Day 5 — Connect the backend

- [ ] OSRM routing works
- [ ] Open-Meteo weather works
- [ ] Map WMO weather codes to STATS19 codes
- [ ] `prediction.py` loads the model and predicts

**End of day:** `/api/health` shows `model_loaded: true`.

---

## Day 6 — End to end

- [ ] `/api/journey/analyze` returns real data
- [ ] Safety score formula decided and written down
- [ ] Frontend form calls the API
- [ ] Map shows the routes

**End of day:** it works end to end, even if it looks bad.

---

## Day 7 — Make it look good

- [ ] Colour the route sections green / orange / red
- [ ] Route comparison cards
- [ ] Click a section to see why it is risky

---

## Day 8 — Polish and buffer

- [ ] Fix bugs
- [ ] Handle errors nicely (API down, no route found)
- [ ] Small analytics page if there is time

**This is your buffer day. Do not plan new features here.**

---

## Day 9 — Report and documentation

- [ ] README finished
- [ ] Architecture diagram
- [ ] Dataset explanation (source, records, features, target, types,
      missing values, duplicates, quality issues)
- [ ] Feature engineering table
- [ ] Model comparison and metrics
- [ ] Screenshots
- [ ] Check everyone has real commits

---

## Day 10 — Viva prep

**No new code today.**

- [ ] Practise explaining the whole pipeline
- [ ] Each member explains their part AND the whole system
- [ ] Prepare answers for likely questions

---

## Likely viva questions

- Why did you pick this problem and this dataset?
- What are the data quality issues?
- Name your feature engineering techniques and why each one helps.
- Your data is imbalanced. Why is accuracy a bad measure here?
- What is macro F1 and why did you use it?
- Why did you pick this model over the others?
- Walk me through what happens when a user clicks Search.
- What would you improve with more time?

---

## Rules to protect the deadline

1. **No new features after Day 7.** Only fixes.
2. **If Day 6 arrives and the ML is not done**, cut the routing/weather
   part down, not the ML part. The ML is what is graded.
3. **Do not rewrite the feature code in the backend.** Import it.
4. **Commit every day.** Contribution history is checked.
