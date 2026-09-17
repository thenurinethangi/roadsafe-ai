"use client";

import { useState } from "react";
import type { Insights, SeverityShare } from "@/lib/api";
import { DataTable } from "@/components/insights/InsightCard";

interface Props {
  insights: Insights;
  average: number;
  smallSample: number;
}

const HEIGHT = 240;

function severe(row: SeverityShare) {
  return row.fatal_pct + row.serious_pct;
}

export default function ConditionExplorer({ insights, average, smallSample }: Props) {
  const tabs: { key: string; label: string; rows: SeverityShare[]; ordered: boolean }[] = [
    { key: "speed", label: "Speed limit", rows: insights.severity_by_speed_limit, ordered: true },
    { key: "light", label: "Light", rows: insights.severity_by_light, ordered: true },
    { key: "area", label: "Urban or rural", rows: insights.severity_by_area, ordered: true },
    { key: "road", label: "Road type", rows: insights.severity_by_road_type, ordered: false },
    { key: "weather", label: "Weather", rows: insights.severity_by_weather, ordered: false },
  ].filter((tab) => tab.rows.length > 0);

  const [tabKey, setTabKey] = useState(tabs[0]?.key);
  const [active, setActive] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const tab = tabs.find((item) => item.key === tabKey) ?? tabs[0];
  if (!tab) return null;

  const rows = tab.ordered ? tab.rows : [...tab.rows].sort((a, b) => severe(b) - severe(a));
  const top = Math.max(10, Math.ceil(Math.max(average, ...rows.map(severe)) / 10) * 10);
  const shown = rows[active ?? rows.reduce((best, row, index) => (severe(row) > severe(rows[best]) ? index : best), 0)];

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Condition" className="flex flex-wrap gap-1 rounded-control bg-track p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={item.key === tab.key}
              onClick={() => {
                setTabKey(item.key);
                setActive(null);
              }}
              className={`rounded-[6px] px-3.5 py-1.5 text-[14px] transition-colors ${
                item.key === tab.key ? "bg-surface-2 text-text-primary" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAsTable((current) => !current)}
          className="text-[13px] text-text-muted hover:text-text-primary"
        >
          {asTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {asTable ? (
        <DataTable
          head={[tab.label, "Collisions", "Fatal", "Serious", "Fatal or serious"]}
          rows={rows.map((row) => [
            row.label,
            row.collisions.toLocaleString(),
            `${row.fatal_pct}%`,
            `${row.serious_pct}%`,
            `${severe(row).toFixed(1)}%`,
          ])}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
            <span className="text-[24px] font-medium leading-none tracking-[-0.5px]">{shown.label}</span>
            <span className="text-[15px] tabular-nums text-text-secondary">
              {severe(shown).toFixed(1)}% fatal or serious · {shown.fatal_pct}% fatal
            </span>
            <span className="text-[13px] tabular-nums text-text-muted">{shown.collisions.toLocaleString()} collisions</span>
          </div>

          <div className="relative" style={{ height: HEIGHT }} onMouseLeave={() => setActive(null)}>
            {[0, top / 2, top].map((tick) => (
              <div
                key={tick}
                className="pointer-events-none absolute left-0 right-0 border-t-hair border-line-soft"
                style={{ bottom: `${(tick / top) * 100}%` }}
              >
                <span className="absolute left-0 -translate-y-full pb-1 text-[12px] tabular-nums text-text-muted">{tick}%</span>
              </div>
            ))}

            <div
              className="pointer-events-none absolute left-0 right-0 z-10 border-t border-dashed border-text-secondary"
              style={{ bottom: `${(average / top) * 100}%` }}
            >
              <span className="absolute right-0 -translate-y-full pb-1 text-[12px] tabular-nums text-text-secondary">
                Average {average.toFixed(1)}%
              </span>
            </div>

            <div className="absolute inset-0 flex items-end justify-around gap-4 px-10">
              {rows.map((row, index) => {
                const small = row.collisions < smallSample;
                const faded = active !== null && active !== index;
                return (
                  <button
                    key={row.label}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    aria-label={`${row.label}: ${severe(row).toFixed(1)}% fatal or serious`}
                    className="flex h-full w-full max-w-[72px] flex-col justify-end"
                    style={{ opacity: small ? 0.4 : faded ? 0.55 : 1 }}
                  >
                    <span
                      className="w-full rounded-t-[4px] bg-chart-strong"
                      style={{ height: `${(row.fatal_pct / top) * 100}%`, minHeight: row.fatal_pct ? 2 : 0 }}
                    />
                    <span
                      className="w-full border-t-2 border-surface-card bg-chart-base"
                      style={{ height: `${(row.serious_pct / top) * 100}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-around gap-4 border-t-hair border-line px-10 pt-3">
            {rows.map((row, index) => (
              <span
                key={row.label}
                className={`w-full max-w-[110px] text-center text-[13px] leading-tight ${
                  active === index ? "text-text-primary" : "text-text-secondary"
                }`}
                style={{ opacity: row.collisions < smallSample ? 0.5 : 1 }}
              >
                {row.label}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-chart-strong" />
              Fatal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-chart-base" />
              Serious
            </span>
            {rows.some((row) => row.collisions < smallSample) && (
              <span className="text-text-muted">Faded groups have under {smallSample.toLocaleString()} collisions</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
