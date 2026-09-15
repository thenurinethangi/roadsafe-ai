# RoadSafe AI — Report

## Data Quality

This section covers the dataset, the problems found in it, and how each one
was handled. The exploration is in `ml/notebooks/01_data_exploration.ipynb`,
the cleaning in `ml/notebooks/02_preprocessing.ipynb`, and the cleaning rules
in `ml/src/preprocessing.py`.

### The dataset

| | |
|---|---|
| Source | UK Department for Transport, Road Safety Data (STATS19) |
| File | Road Safety Data – Collisions – last 5 years |
| Licence | Open Government Licence v3.0 |
| Records | 513,801 collisions |
| Columns | 44 |
| Years | 2021–2025, about 100,000 collisions per year |
| Target | `collision_severity` — 1 Fatal, 2 Serious, 3 Slight |

Every row is one personal-injury collision reported to the police. Collisions
with damage only, where nobody was hurt, are never recorded.

| Year | Collisions |
|---|---|
| 2021 | 101,087 |
| 2022 | 106,004 |
| 2023 | 104,258 |
| 2024 | 100,927 |
| 2025 | 101,525 |

---

### Issue 1 — The data is coded, not written

Every value is a number. `weather_conditions = 2` means nothing until it is
looked up in the DfT data guide, where it means "Raining no high winds".

The codes are also not in order. `road_type` uses 1, 2, 3, 6, 7, 9 and 12, with
no 4 or 5. Guessing codes, or copying them from an older tutorial, would give
wrong meanings.

**Action:** every code meaning was copied from the 2025 DfT data guide into
`ml/src/lookups.py`. Nothing was guessed.

This is also the 2025 release, which renamed `accident_severity` to
`collision_severity`. Code written for older releases does not work on this file.

---

### Issue 2 — Missing values are hidden as -1

A normal check for blank values (`df.isna()`) found only **53** missing values,
all in the coordinate columns. That makes the data look almost complete. It is
not.

STATS19 stores missing values as **-1**, which pandas reads as an ordinary
number. Counting -1 directly found missing values in **21 columns**:

| Column | -1 count | Share |
|---|---|---|
| local_authority_district | 513,607 | 99.96% |
| junction_control | 217,897 | 42.4% |
| enhanced_severity_collision | 204,752 | 39.9% |
| second_road_number | 178,098 | 34.7% |
| special_conditions_at_site | 151,370 | 29.5% |
| carriageway_hazards_historic | 151,367 | 29.5% |
| pedestrian_crossing_human_control_historic | 150,889 | 29.4% |
| pedestrian_crossing_physical_facilities_historic | 150,860 | 29.4% |
| junction_detail_historic | 147,476 | 28.7% |
| trunk_road_flag | 36,318 | 7.1% |
| junction_detail | 19,982 | 3.9% |
| second_road_class | 11,566 | 2.3% |
| pedestrian_crossing | 11,238 | 2.2% |
| carriageway_hazards | 9,891 | 1.9% |
| road_surface_conditions | 3,527 | 0.7% |
| light_conditions | 34 | |
| weather_conditions | 12 | |
| urban_or_rural_area | 8 | |
| first_road_number | 6 | |
| first_road_class | 6 | |
| speed_limit | 3 | |

If this had been missed, the model would have treated "unknown weather" as a
real type of weather and learned patterns from it.

---

### Issue 3 — Three different codes mean "unknown"

Checking the DfT guide showed that -1 is not the only way "we do not know" is
recorded. Depending on the column, it can also be **9** or **99**:

| Code | Meaning in the DfT guide |
|---|---|
| -1 | Data missing or out of range |
| 9 or 99 | Unknown (self reported) — reported by the public, not attended by police |

These extra unknowns were invisible to the -1 check:

| Column | Hidden unknown code | Rows |
|---|---|---|
| weather_conditions | 9 = Unknown | 14,566 |
| road_type | 9 = Unknown | 13,060 |
| pedestrian_crossing | 99 = unknown (self reported) | 12,652 |
| carriageway_hazards | 99 = unknown (self reported) | 9,172 |
| road_surface_conditions | 9 = unknown (self reported) | 6,721 |
| junction_detail | 99 = unknown (self reported) | 1,429 |
| urban_or_rural_area | 3 = Unallocated | 50 |
| second_road_class | 9 = Unknown (self rep only) | 48 |

**Action:** every code meaning "unknown" was merged into a single category,
**99**, so each column has exactly one unknown group rather than two or three
that mean the same thing.

Unknown values were kept as their own category rather than filled in with the
most common value. Whether a detail was recorded may itself be a pattern: the
self-reported collisions are ones the police did not attend, which tend to be
less severe. Filling in a guess would hide that.

One code was deliberately **not** treated as unknown.
`light_conditions = 7` means "Darkness – lighting unknown" (8,596 rows). The
street lighting is unknown, but it is known to be dark, so it stays as its own
category.

---

### Issue 4 — Missing coordinates

53 rows had no latitude or longitude. The map and the location-based features
both need coordinates.

**Action:** these rows had to be removed. In practice all 53 had already been
removed by the code checks in the rules below, so this step removed no further
rows.

---

### Issue 5 — Duplicates

The raw file has **0** exact duplicate rows, but only because every row has a
unique ID. After the ID columns were removed, **3** rows were identical in every
remaining column.

**Action:** the 3 duplicate rows were removed. They may have been separate
collisions with the same conditions at the same place and time, but 3 rows out
of 513,698 cannot change the result either way.

---

### Issue 6 — Columns that leak the answer

Four columns are worked out from the severity we are trying to predict:

- `enhanced_severity_collision`
- `collision_adjusted_severity_serious`
- `collision_adjusted_severity_slight`
- `collision_injury_based`

A model given any of these would score almost perfectly and still be useless,
because it would be reading the answer.

**Action:** all four were removed before any modelling.

---

### Issue 7 — Columns only known after a collision

The app scores a road before anyone has driven down it. Some columns are only
known once a collision has already happened:

- `number_of_casualties`
- `number_of_vehicles`
- `did_police_officer_attend_scene_of_accident`

**Action:** all three were removed. A model trained on them could never be
given those values when scoring a real journey.

---

### Issue 8 — Severity recording changed during the five years

Police forces have been moving to an injury-based way of grading severity. The
`collision_injury_based` column shows which system was used:

| Year | Share recorded as injury-based |
|---|---|
| 2021 | 49.6% |
| 2022 | 52.6% |
| 2023 | 53.7% |
| 2024 | 58.8% |
| 2025 | 86.5% |

The two systems grade collisions differently. Collisions recorded under the
injury-based system were classed as **Serious 25.8%** of the time, compared with
**18.1%** under the older system.

The same split explains one of the -1 counts in Issue 2:
`enhanced_severity_collision` is missing on **204,752** rows, which is exactly
the number of collisions not recorded as injury-based.

**This cannot be fixed by cleaning.** It means part of any rise in Serious
collisions across these years comes from the change in recording method, not
from the roads themselves. It is stated here as a limitation.

---

### Issue 9 — The target is badly imbalanced

| Severity | Rows | Share |
|---|---|---|
| Fatal | 7,553 | 1.47% |
| Serious | 116,813 | 22.74% |
| Slight | 389,435 | 75.79% |

A model that ignores every input and always answers "Slight" would be
**75.79% accurate** and would find **zero** fatal collisions.

**Action:** accuracy is not used as the main measure. Models are judged on
macro F1 and on recall for each class, trained with `class_weight="balanced"`,
split with `stratify=y`, and compared against a dummy baseline that always
predicts the most common class.

---

### Issue 10 — Things the data cannot tell us

These are limits of the public dataset rather than errors that can be cleaned:

- **Under-reporting.** Fatal collisions are almost always reported to the
  police. Minor injuries often are not, so the real number of Slight collisions
  is higher than the data shows.
- **Contributory factors are withheld.** What the police judged caused each
  collision is not in the public release.
- **No traffic volumes.** A road with many collisions may simply be very busy.
  Without knowing how many vehicles passed, busy and dangerous cannot be told
  apart.
- **Only collisions are recorded.** There is no record of the journeys where
  nothing went wrong, so the probability of a collision happening cannot be
  calculated. This is why the project predicts **how severe** a collision would
  be, not **whether** one will happen.

---

### Cleaning rules

| Situation | Rule | Columns |
|---|---|---|
| Derived from the target | Remove column | 4 leakage columns |
| Only known after a collision | Remove column | casualties, vehicles, police attended |
| Unique per row | Remove column | collision_index, collision_ref_no |
| Same information as another column | Remove column | eastings/northings, 4 superseded `_historic` columns |
| About who recorded it, not the road | Remove column | police force and 5 local authority columns |
| Too much missing (29% or more) | Remove column | junction_control, special_conditions_at_site, second_road_number |
| Thousands of unique values | Remove column | first_road_number |
| Many unknowns | Keep column, set unknown to 99 | weather, road surface, road type, junction detail, second road class, pedestrian crossing, carriageway hazards, trunk road flag |
| Very few unknowns and no unknown category | Remove those rows | light_conditions, urban_or_rural_area, first_road_class, speed_limit |

### Rows removed

Each step runs on what the step before it left, so every row is counted once.

| Step | Rows removed |
|---|---|
| light_conditions is -1 | 34 |
| urban_or_rural_area is -1 or 3 (Unallocated) | 58 |
| first_road_class is -1 | 5 |
| speed_limit is -1 | 3 |
| No latitude or longitude | 0 |
| Duplicate rows | 3 |
| **Total** | **103 (0.02%)** |

### Result

| | Before | After |
|---|---|---|
| Rows | 513,801 | 513,698 |
| Columns | 44 | 19 |
| -1 values | in 21 columns | none |
| Blank values | 53 | none |

The target balance is unchanged, so cleaning did not remove one severity class
more than another:

| Severity | Before | After |
|---|---|---|
| Fatal | 1.47% | 1.47% |
| Serious | 22.74% | 22.73% |
| Slight | 75.79% | 75.80% |

Rows now in the "unknown" category (99):

| Column | Rows |
|---|---|
| trunk_road_flag | 36,290 |
| pedestrian_crossing | 23,879 |
| junction_detail | 21,410 |
| carriageway_hazards | 19,063 |
| weather_conditions | 14,566 |
| road_type | 13,053 |
| second_road_class | 11,603 |
| road_surface_conditions | 10,230 |

The cleaned data is saved as `ml/data/processed/collisions_clean.parquet`.

---

## Known Limitations of Route Scoring

These were found while testing real journeys through the API.

- **Road names can be slightly off.** Road names come from OSRM, which can
  keep one name for a long stretch of the same road number. For example, on
  Manchester to Sheffield the last segment is in Sheffield city centre but is
  labelled "A57 Snake Road". Scores are not affected, because each segment's
  speed limit is worked out from that segment alone.
- **Speed limits are estimated.** OSRM does not give speed limits. They are
  estimated from how fast OSRM expects traffic to move on each segment: under
  50 km/h is treated as 30 mph, under 80 km/h as 60 mph, and faster as 70 mph.
  40 mph and 50 mph roads cannot be told apart from these.
- **Often only one route.** The free OSRM server frequently returns a single
  route, even when alternatives are requested, so route comparison is not
  always possible.
- **Weather forecasts only reach about 16 days ahead.** For later journeys
  the score uses the most common conditions for that month in our data, and
  the response says so.
