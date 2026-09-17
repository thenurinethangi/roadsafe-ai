"use client";

import { useState } from "react";

interface Props {
  months: { month: string; collisions: number; severe: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const HEIGHT = 260;

function niceTop(max: number) {
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const scaled = max / magnitude;
  const step = scaled <= 2 ? 0.5 : scaled <= 5 ? 1 : 2;
  return Math.ceil(scaled / step) * step * magnitude;
}

function monthName(month: string) {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

export function TrendLegend() {
  return (
    <div className="flex items-center gap-4 text-[13px] text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full bg-chart-strong" />
        All collisions
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full bg-chart-base" />
        Fatal or serious
      </span>
    </div>
  );
}

export default function TrendChart({ months }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const top = niceTop(Math.max(...months.map((row) => row.collisions)));
  const ticks = [0, top / 2, top];
  const x = (index: number) => (index / (months.length - 1)) * 100;
  const y = (value: number) => (1 - value / top) * HEIGHT;
  const path = (key: "collisions" | "severe") =>
    months.map((row, index) => `${index ? "L" : "M"} ${x(index)} ${y(row[key])}`).join(" ");

  const shown = active === null ? null : months[active];
  const yearStarts = months.map((row, index) => ({ row, index })).filter(({ row }) => row.month.endsWith("-01"));

  return (
    <div>
      <div className="relative pl-10">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="pointer-events-none absolute left-10 right-0 border-t-hair border-line-soft"
            style={{ top: y(tick) }}
          >
            <span className="absolute -left-10 w-8 -translate-y-1/2 text-right text-[12px] tabular-nums text-text-muted">
              {tick >= 1000 ? `${tick / 1000}k` : tick}
            </span>
          </div>
        ))}

        <div className="relative" style={{ height: HEIGHT }} onMouseLeave={() => setActive(null)}>
          <svg viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d={`${path("collisions")} L 100 ${HEIGHT} L 0 ${HEIGHT} Z`} fill="var(--chart-tint)" />
            <path d={path("collisions")} fill="none" stroke="var(--chart-strong)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <path d={path("severe")} fill="none" stroke="var(--chart-base)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </svg>

          {shown && active !== null && (
            <>
              <div
                className="pointer-events-none absolute bottom-0 top-0 border-l-hair border-text-muted"
                style={{ left: `${x(active)}%` }}
              />
              {(["collisions", "severe"] as const).map((key) => (
                <span
                  key={key}
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-card"
                  style={{
                    left: `${x(active)}%`,
                    top: y(shown[key]),
                    backgroundColor: key === "collisions" ? "var(--chart-strong)" : "var(--chart-base)",
                  }}
                />
              ))}
              <div
                className="pointer-events-none absolute top-2 z-10 w-[190px] rounded-control border-hair border-line bg-surface-2 px-3.5 py-3"
                style={
                  x(active) > 60
                    ? { right: `calc(${100 - x(active)}% + 12px)` }
                    : { left: `calc(${x(active)}% + 12px)` }
                }
              >
                <div className="mb-2 text-[13px] text-text-secondary">{monthName(shown.month)}</div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-chart-strong" />
                    All
                  </span>
                  <span className="tabular-nums">{shown.collisions.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-chart-base" />
                    Fatal or serious
                  </span>
                  <span className="tabular-nums">{shown.severe.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          <div className="absolute inset-0 flex">
            {months.map((row, index) => (
              <span
                key={row.month}
                className="h-full flex-1"
                onMouseEnter={() => setActive(index)}
                aria-label={`${monthName(row.month)}: ${row.collisions} collisions, ${row.severe} fatal or serious`}
              />
            ))}
          </div>
        </div>

        <div className="relative mt-3 h-4">
          {yearStarts.map(({ row, index }) => (
            <span
              key={row.month}
              className="absolute text-[12px] tabular-nums text-text-muted"
              style={{ left: `${x(index)}%` }}
            >
              {row.month.slice(0, 4)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
