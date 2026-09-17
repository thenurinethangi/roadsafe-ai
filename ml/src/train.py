"""
Owner 3 — train the severity model and save the production pipeline.

The notebook imports these helpers so the report evidence and the artifact
come from the same code. The backend loads the saved Pipeline as a whole.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.base import BaseEstimator, ClassifierMixin, clone
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

from src import config
from src.features import build_features, get_feature_columns
from src.preprocessing import clean, load_raw

CLASS_ORDER = [1, 2, 3]
CLASS_NAMES = [config.SEVERITY_LABELS[c] for c in CLASS_ORDER]
CHOSEN_MODEL = "logreg-v1"


def prepare_feature_table() -> pd.DataFrame:
    """
    Load Owner 2's feature table if it is already on disk.

    If this clone has no parquet files (they are gitignored), rebuild them
    with Owner 1's clean() and Owner 2's build_features() — the same functions
    the notebooks already use. Do not copy that logic here.
    """
    config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    config.ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    if config.FEATURES_FILE.exists():
        return pd.read_parquet(config.FEATURES_FILE)

    if not config.COLLISIONS_FILE.exists():
        raise FileNotFoundError(
            f"Missing {config.COLLISIONS_FILE.name}. "
            "Download Road Safety Data - Collisions - last 5 years into ml/data/raw/."
        )

    raw = load_raw(config.COLLISIONS_FILE)
    cleaned = clean(raw)
    cleaned.to_parquet(config.CLEAN_FILE, index=False)

    featured = build_features(cleaned)
    drop_cols = ["date", "time", "latitude", "longitude", "lat_bin", "lon_bin"]
    featured = featured.drop(columns=[c for c in drop_cols if c in featured.columns])
    featured.to_parquet(config.FEATURES_FILE, index=False)
    return featured


def xy_from_features(df: pd.DataFrame):
    cat_cols, num_cols = get_feature_columns()
    feature_columns = cat_cols + num_cols
    missing = [c for c in feature_columns + [config.TARGET] if c not in df.columns]
    if missing:
        raise ValueError(f"Feature table is missing columns: {missing}")

    data = df[feature_columns + [config.TARGET]].dropna()
    X = data[feature_columns]
    y = data[config.TARGET].astype(int)
    return X, y, feature_columns, cat_cols, num_cols


def make_preprocessor(cat_cols, num_cols) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_cols,
            ),
            ("num", StandardScaler(), num_cols),
        ]
    )


def split_xy(X, y):
    return train_test_split(
        X,
        y,
        test_size=config.TEST_SIZE,
        stratify=y,
        random_state=config.RANDOM_STATE,
    )


def metrics_block(y_true, y_pred) -> dict:
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_precision": float(
            precision_score(y_true, y_pred, average="macro", zero_division=0)
        ),
        "macro_recall": float(
            recall_score(y_true, y_pred, average="macro", zero_division=0)
        ),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
    }


def per_class_block(y_true, y_pred) -> dict:
    report = classification_report(
        y_true,
        y_pred,
        labels=CLASS_ORDER,
        target_names=CLASS_NAMES,
        output_dict=True,
        zero_division=0,
    )
    out = {}
    for name in CLASS_NAMES:
        row = report[name]
        out[name] = {
            "precision": float(row["precision"]),
            "recall": float(row["recall"]),
            "f1": float(row["f1-score"]),
            "support": int(row["support"]),
        }
    return out


def evaluate(model, X_train, y_train, X_test, y_test, name: str) -> dict:
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    result = {
        "model": name,
        **metrics_block(y_test, test_pred),
        "train_macro_f1": float(
            f1_score(y_train, train_pred, average="macro", zero_division=0)
        ),
        "test_macro_f1": float(
            f1_score(y_test, test_pred, average="macro", zero_division=0)
        ),
        "per_class": per_class_block(y_test, test_pred),
        "confusion_matrix": confusion_matrix(
            y_test, test_pred, labels=CLASS_ORDER
        ).tolist(),
        "classification_report": classification_report(
            y_test,
            test_pred,
            labels=CLASS_ORDER,
            target_names=CLASS_NAMES,
            zero_division=0,
        ),
        "y_pred": test_pred,
    }
    print(f"\n=== {name} ===")
    print(result["classification_report"])
    print(
        "accuracy={accuracy:.4f}  macro_f1={macro_f1:.4f}  "
        "train_macro_f1={train_macro_f1:.4f}  test_macro_f1={test_macro_f1:.4f}".format(
            **result
        )
    )
    return result


def dummy_model():
    return DummyClassifier(strategy="most_frequent", random_state=config.RANDOM_STATE)


def logreg_pipeline(preprocessor, C: float = 1.0) -> Pipeline:
    return Pipeline(
        [
            ("preprocess", preprocessor),
            (
                "model",
                LogisticRegression(
                    C=C,
                    class_weight="balanced",
                    max_iter=2000,
                    solver="lbfgs",
                    random_state=config.RANDOM_STATE,
                ),
            ),
        ]
    )


def tune_logreg(preprocessor, X_train, y_train) -> tuple[Pipeline, float, dict]:
    """Sweep C on a stratified sample so the full 5-fold CV can stay on all rows."""
    sample_size = min(80_000, len(X_train))
    if sample_size < len(X_train):
        X_sample, _, y_sample, _ = train_test_split(
            X_train,
            y_train,
            train_size=sample_size,
            stratify=y_train,
            random_state=config.RANDOM_STATE,
        )
    else:
        X_sample, y_sample = X_train, y_train

    search = GridSearchCV(
        logreg_pipeline(preprocessor),
        param_grid={"model__C": [0.1, 1.0, 10.0]},
        scoring="f1_macro",
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=config.RANDOM_STATE),
        n_jobs=-1,
        refit=True,
    )
    search.fit(X_sample, y_sample)
    best_C = float(search.best_params_["model__C"])
    print("LogReg C sweep (macro F1 on sample):")
    for C, score in zip(
        search.cv_results_["param_model__C"], search.cv_results_["mean_test_score"]
    ):
        print(f"  C={C:<4}  mean macro F1={score:.4f}")
    print(f"Chosen C={best_C}")

    pipeline = logreg_pipeline(preprocessor, C=best_C)
    return pipeline, best_C, {
        "Cs": [float(c) for c in search.cv_results_["param_model__C"]],
        "mean_macro_f1": [float(s) for s in search.cv_results_["mean_test_score"]],
        "best_C": best_C,
    }


def cross_validate(pipeline, X_train, y_train) -> dict:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)
    scores = []
    for fold, (idx_tr, idx_va) in enumerate(cv.split(X_train, y_train), start=1):
        fold_model = clone(pipeline)
        fold_model.fit(X_train.iloc[idx_tr], y_train.iloc[idx_tr])
        pred = fold_model.predict(X_train.iloc[idx_va])
        score = f1_score(y_train.iloc[idx_va], pred, average="macro", zero_division=0)
        scores.append(float(score))
        print(f"  fold {fold}: macro F1={score:.4f}")
    return {
        "folds": scores,
        "mean": float(np.mean(scores)),
        "std": float(np.std(scores)),
    }


def forest_pipeline(preprocessor) -> Pipeline:
    return Pipeline(
        [
            ("preprocess", preprocessor),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=80,
                    max_depth=14,
                    min_samples_leaf=8,
                    class_weight="balanced",
                    n_jobs=-1,
                    random_state=config.RANDOM_STATE,
                ),
            ),
        ]
    )


class MappedXGB(BaseEstimator, ClassifierMixin):
    """XGBoost wants classes 0,1,2. STATS19 uses 1,2,3. Map both ways."""

    def __init__(self, **kwargs):
        self.xgb_params = kwargs
        self.estimator_ = None
        self.classes_ = np.array(CLASS_ORDER)

    def fit(self, X, y, sample_weight=None):
        y = np.asarray(y)
        y_mapped = np.array([{1: 0, 2: 1, 3: 2}[int(v)] for v in y])
        self.estimator_ = XGBClassifier(**self.xgb_params)
        self.estimator_.fit(X, y_mapped, sample_weight=sample_weight)
        return self

    def predict(self, X):
        return self.classes_[self.estimator_.predict(X)]

    def predict_proba(self, X):
        return self.estimator_.predict_proba(X)

    def get_params(self, deep=True):
        return dict(self.xgb_params)

    def set_params(self, **params):
        self.xgb_params.update(params)
        return self


def xgb_pipeline(preprocessor) -> Pipeline:
    return Pipeline(
        [
            ("preprocess", preprocessor),
            (
                "model",
                MappedXGB(
                    n_estimators=80,
                    max_depth=6,
                    learning_rate=0.1,
                    subsample=0.8,
                    colsample_bytree=0.8,
                    objective="multi:softprob",
                    eval_metric="mlogloss",
                    n_jobs=-1,
                    random_state=config.RANDOM_STATE,
                    verbosity=0,
                ),
            ),
        ]
    )


def fit_xgboost(pipeline, X_train, y_train):
    weights = compute_sample_weight("balanced", y_train)
    pipeline.fit(X_train, y_train, model__sample_weight=weights)
    return pipeline


def plot_confusion(matrix, path: Path):
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        matrix,
        annot=True,
        fmt="d",
        cmap="Greens",
        xticklabels=CLASS_NAMES,
        yticklabels=CLASS_NAMES,
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Logistic Regression — confusion matrix")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)
    return path


def coefficient_table(pipeline) -> list[dict]:
    names = pipeline.named_steps["preprocess"].get_feature_names_out()
    model = pipeline.named_steps["model"]
    classes = list(model.classes_)
    coef = model.coef_
    slight = coef[classes.index(3)]
    ksi_weight = (coef[classes.index(1)] - slight) + (coef[classes.index(2)] - slight)

    rows = []
    for name, fatal, serious, slight_c, ksi in zip(
        names,
        coef[classes.index(1)],
        coef[classes.index(2)],
        slight,
        ksi_weight,
    ):
        rows.append(
            {
                "feature": name,
                "coef_fatal": float(fatal),
                "coef_serious": float(serious),
                "coef_slight": float(slight_c),
                "ksi_weight": float(ksi),
            }
        )
    rows.sort(key=lambda r: r["ksi_weight"], reverse=True)
    return rows


def save_metrics(payload: dict):
    path = config.ARTIFACTS_DIR / "metrics.json"
    path.write_text(json.dumps(payload, indent=2))
    return path


def save_pipeline(pipeline):
    path = config.ARTIFACTS_DIR / "model.joblib"
    joblib.dump(pipeline, path)
    return path


def comparison_row(name, block) -> dict:
    return {
        "model": name,
        "accuracy": block["accuracy"],
        "macro_precision": block["macro_precision"],
        "macro_recall": block["macro_recall"],
        "macro_f1": block["macro_f1"],
    }


def run() -> dict:
    print("Loading feature table…")
    df = prepare_feature_table()
    X, y, feature_columns, cat_cols, num_cols = xy_from_features(df)
    print(f"Rows: {len(X):,}  features: {len(feature_columns)}")
    print("Class mix:\n", y.value_counts(normalize=True).sort_index().round(4))

    X_train, X_test, y_train, y_test = split_xy(X, y)
    preprocessor = make_preprocessor(cat_cols, num_cols)

    dummy = dummy_model()
    dummy.fit(X_train, y_train)
    dummy_result = evaluate(dummy, X_train, y_train, X_test, y_test, "dummy")

    print("\nTuning Logistic Regression C…")
    logreg, best_C, sweep = tune_logreg(preprocessor, X_train, y_train)

    print("\n5-fold stratified CV (train set, chosen C)…")
    cv = cross_validate(logreg, X_train, y_train)

    print("\nFitting Logistic Regression on full train set…")
    logreg.fit(X_train, y_train)
    logreg_result = evaluate(logreg, X_train, y_train, X_test, y_test, "logistic_regression")

    print("\nFitting Random Forest (comparison only)…")
    forest = forest_pipeline(preprocessor)
    forest.fit(X_train, y_train)
    forest_result = evaluate(forest, X_train, y_train, X_test, y_test, "random_forest")

    print("\nFitting XGBoost (comparison only)…")
    xgb = xgb_pipeline(preprocessor)
    fit_xgboost(xgb, X_train, y_train)
    xgb_result = evaluate(xgb, X_train, y_train, X_test, y_test, "xgboost")

    coeffs = coefficient_table(logreg)
    (config.ARTIFACTS_DIR / "coefficients.json").write_text(
        json.dumps(coeffs[:40], indent=2)
    )
    plot_confusion(
        np.array(logreg_result["confusion_matrix"]),
        config.ARTIFACTS_DIR / "confusion_matrix.png",
    )

    selection_reason = (
        "Random Forest and XGBoost are included as a check, not as the served "
        "model. Logistic Regression is the production choice because its "
        "coefficients can be turned into readable reasons for each segment, "
        "class_weight='balanced' lifts recall on Fatal/Serious, and the "
        "backend already scores from those coefficients. A small macro-F1 "
        "gain from a tree model would not be worth losing that explanation."
    )

    metrics = {
        "chosen_model": CHOSEN_MODEL,
        "selection_reason": selection_reason,
        "feature_columns": feature_columns,
        "class_labels": CLASS_NAMES,
        "best_C": best_C,
        "C_sweep": sweep,
        "cv_macro_f1_mean": cv["mean"],
        "cv_macro_f1_std": cv["std"],
        "cv_folds": cv["folds"],
        "train_macro_f1": logreg_result["train_macro_f1"],
        "test_macro_f1": logreg_result["test_macro_f1"],
        "accuracy": logreg_result["accuracy"],
        "macro_precision": logreg_result["macro_precision"],
        "macro_recall": logreg_result["macro_recall"],
        "macro_f1": logreg_result["macro_f1"],
        "per_class": logreg_result["per_class"],
        "confusion_matrix": logreg_result["confusion_matrix"],
        "comparison": [
            comparison_row("dummy", dummy_result),
            comparison_row("logistic_regression", logreg_result),
            comparison_row("random_forest", forest_result),
            comparison_row("xgboost", xgb_result),
        ],
        "top_ksi_coefficients": coeffs[:15],
    }
    save_metrics(metrics)
    save_pipeline(logreg)
    print(f"\nSaved {config.ARTIFACTS_DIR / 'model.joblib'}")
    print(f"Saved {config.ARTIFACTS_DIR / 'metrics.json'}")
    print("Chosen model:", CHOSEN_MODEL, "C=", best_C)
    return metrics


if __name__ == "__main__":
    run()
