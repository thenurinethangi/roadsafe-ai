"use client";

import type { SeverityShare } from "@/lib/api";

interface Props {
  data: SeverityShare[];
  smallSample: number;
}

export function SeverityLegend() {
  return (
    <div className="flex items-center gap-4 text-[13px] text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-chart-strong" />
        Fatal
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-chart-base" />
        Serious
      </span>
    </div>
  );
}

export default function SeverityBars({ data, smallSample }: Props) {
  const rows = data
    .map((row) => ({ ...row, severe: row.fatal_pct + row.serious_pct }))
    .sort((a, b) => b.severe - a.severe);

  const scale = Math.max(10, Math.ceil(Math.max(...rows.map((row) => row.severe)) / 10) * 10);

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const small = row.collisions < smallSample;
        return (
          <li key={row.label} title={`${row.collisions.toLocaleString()} collisions`}>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <span className={`truncate text-[14px] ${small ? "text-text-muted" : ""}`}>
                {row.label}
                {small && <span className="ml-2 text-[12px] text-text-muted">small sample</span>}
              </span>
              <span className={`text-[14px] tabular-nums ${small ? "text-text-muted" : ""}`}>{row.severe.toFixed(1)}%</span>
            </div>

            <div
              className="flex h-2 overflow-hidden rounded-full bg-track"
              style={{ opacity: small ? 0.45 : 1 }}
              aria-label={`${row.fatal_pct}% fatal, ${row.serious_pct}% serious`}
            >
              <span className="h-full bg-chart-strong" style={{ width: `${(row.fatal_pct / scale) * 100}%` }} />
              <span className="h-full bg-chart-base" style={{ width: `${(row.serious_pct / scale) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function scaleNote(data: SeverityShare[]) {
  const max = Math.max(...data.map((row) => row.fatal_pct + row.serious_pct));
  return `Bars run from 0 to ${Math.max(10, Math.ceil(max / 10) * 10)}%`;
}
