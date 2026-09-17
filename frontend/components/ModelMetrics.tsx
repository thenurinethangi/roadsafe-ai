import { asMetric, asPercent } from "@/lib/format";
import {
  chosenModelName,
  classLabels,
  comparisonRows,
  headlineMetrics,
  perClassScores,
} from "@/lib/metrics";
import type { ModelMetrics } from "@/lib/types";

export function ModelMetricsPanel({ metrics }: { metrics: ModelMetrics }) {
  const chosen = chosenModelName(metrics);
  const headlines = headlineMetrics(metrics);
  const rows = comparisonRows(metrics);
  const classes = perClassScores(metrics);
  const labels = classLabels(metrics);
  const matrix = metrics.confusion_matrix;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-moss">
          Chosen model
        </p>
        <h2 className="mt-1 font-serif text-2xl">{chosen}</h2>
        {metrics.selection_reason && (
          <p className="mt-2 text-sm leading-6 text-ink/70">{metrics.selection_reason}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Accuracy" value={asPercent(headlines.accuracy)} note="Misleading here" />
        <MetricTile label="Macro F1" value={asMetric(headlines.macroF1)} note="Primary metric" />
        <MetricTile label="Macro recall" value={asMetric(headlines.macroRecall)} />
        <MetricTile label="Macro precision" value={asMetric(headlines.macroPrecision)} />
      </div>

      {classes.some((row) => row.recall != null) && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Recall by severity class</h3>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2">Precision</th>
                  <th className="px-3 py-2">Recall</th>
                  <th className="px-3 py-2">F1</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((row) => (
                  <tr key={row.label} className="border-t border-line">
                    <td className="px-3 py-2 font-medium">{row.label}</td>
                    <td className="px-3 py-2">{asMetric(row.precision)}</td>
                    <td className="px-3 py-2">{asMetric(row.recall)}</td>
                    <td className="px-3 py-2">{asMetric(row.f1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Model comparison</h3>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Accuracy</th>
                  <th className="px-3 py-2">Macro precision</th>
                  <th className="px-3 py-2">Macro recall</th>
                  <th className="px-3 py-2">Macro F1</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.model} className="border-t border-line">
                    <td className="px-3 py-2 font-medium">{row.model}</td>
                    <td className="px-3 py-2">{asPercent(row.accuracy)}</td>
                    <td className="px-3 py-2">{asMetric(row.macro_precision)}</td>
                    <td className="px-3 py-2">{asMetric(row.macro_recall)}</td>
                    <td className="px-3 py-2">{asMetric(row.macro_f1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {matrix && matrix.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Confusion matrix</h3>
          <p className="mb-3 text-xs text-ink/55">Rows are actual class, columns are predicted class.</p>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-center text-sm">
              <thead className="bg-paper text-xs text-ink/55">
                <tr>
                  <th className="px-3 py-2" />
                  {labels.slice(0, matrix[0]?.length ?? 0).map((label) => (
                    <th key={label} className="px-3 py-2">
                      Pred {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={labels[i] ?? i} className="border-t border-line">
                    <th className="px-3 py-2 text-left text-xs text-ink/55">
                      Actual {labels[i] ?? i}
                    </th>
                    {row.map((cell, j) => (
                      <td key={`${i}-${j}`} className="px-3 py-2">
                        {cell.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-serif text-2xl">{value}</p>
      {note && <p className="mt-1 text-xs text-ink/50">{note}</p>}
    </div>
  );
}
