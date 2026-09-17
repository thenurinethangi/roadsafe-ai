import type { ClassScores, ComparisonRow, ModelMetrics } from "./types";

const CLASS_ORDER = ["Fatal", "Serious", "Slight"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function classScores(value: unknown): ClassScores | undefined {
  if (!isRecord(value)) return undefined;
  return {
    precision: asNumber(value.precision),
    recall: asNumber(value.recall),
    f1: asNumber(value.f1) ?? asNumber(value["f1-score"]),
    "f1-score": asNumber(value["f1-score"]),
    support: asNumber(value.support),
  };
}

export function chosenModelName(metrics: ModelMetrics) {
  return metrics.chosen_model || metrics.model_name || metrics.model_version || "Trained model";
}

export function comparisonRows(metrics: ModelMetrics): ComparisonRow[] {
  if (Array.isArray(metrics.comparison) && metrics.comparison.length) {
    return metrics.comparison;
  }

  if (metrics.models && Object.keys(metrics.models).length) {
    return Object.entries(metrics.models).map(([model, values]) => ({
      model,
      ...values,
    }));
  }

  const topLevel: ComparisonRow = {
    model: chosenModelName(metrics),
    accuracy: metrics.accuracy,
    macro_precision: metrics.macro_precision,
    macro_recall: metrics.macro_recall,
    macro_f1: metrics.macro_f1,
  };

  const hasValues = [topLevel.accuracy, topLevel.macro_f1, topLevel.macro_recall].some(
    (value) => value != null,
  );

  return hasValues ? [topLevel] : [];
}

export function classLabels(metrics: ModelMetrics) {
  const labels =
    metrics.class_labels ||
    metrics.target_names ||
    metrics.labels ||
    metrics.classes ||
    [];

  if (labels.length) return labels;

  const fromReport = Object.keys(metrics.classification_report ?? {}).filter(
    (key) => !["accuracy", "macro avg", "weighted avg", "micro avg"].includes(key),
  );
  if (fromReport.length) return fromReport;

  const fromPerClass = Object.keys(metrics.per_class ?? {});
  return fromPerClass.length ? fromPerClass : CLASS_ORDER;
}

export function perClassScores(metrics: ModelMetrics) {
  const labels = classLabels(metrics);
  const report = metrics.classification_report ?? {};
  const perClass = metrics.per_class ?? {};

  return labels.map((label) => ({
    label,
    ...(classScores(perClass[label]) ?? classScores(report[label]) ?? {}),
  }));
}

export function headlineMetrics(metrics: ModelMetrics) {
  const rows = comparisonRows(metrics);
  const chosen = rows.find((row) =>
    chosenModelName(metrics).toLowerCase().includes(String(row.model).toLowerCase()),
  ) ?? rows[0];

  return {
    accuracy: chosen?.accuracy ?? metrics.accuracy,
    macroF1: chosen?.macro_f1 ?? metrics.macro_f1,
    macroRecall: chosen?.macro_recall ?? metrics.macro_recall,
    macroPrecision: chosen?.macro_precision ?? metrics.macro_precision,
  };
}
