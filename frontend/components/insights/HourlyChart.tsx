"use client";

import { useState } from "react";

interface Props {
  data: { hour: number; collisions: number }[];
  markHour?: number;
  markLabel?: string;
  shareOf?: string;
}

function niceStep(max: number) {
  const raw = max / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const scaled = raw / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

export function hourLabel(hour: number) {
  return `${String(hour % 24).padStart(2, "0")}:00`;
}

function shortNumber(value: number) {
  return value >= 1000 ? `${value / 1000}k` : String(value);
}

export default function HourlyChart({ data, markHour, markLabel = "Busiest hour", shareOf = "the day" }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(...data.map((row) => row.collisions));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
  const total = data.reduce((sum, row) => sum + row.collisions, 0);
  const peak = data.reduce((best, row) => (row.collisions > best.collisions ? row : best), data[0]);
  const resting = data.find((row) => row.hour === markHour) ?? peak;

  const shown = data.find((row) => row.hour === active) ?? resting;
  const share = total ? ((shown.collisions / total) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
        <span className="text-[28px] font-medium leading-none tracking-[-0.6px] tabular-nums">
          {hourLabel(shown.hour)}
        </span>
        <span className="text-[15px] tabular-nums text-text-secondary">
          {shown.collisions.toLocaleString()} collisions
        </span>
        <span className="rounded-full bg-chart-tint px-2.5 py-0.5 text-[13px] tabular-nums text-chart-strong">
          {share}% of {shareOf}
        </span>
        <span className="text-[13px] text-text-muted">{active === null ? markLabel : ""}</span>
      </div>

      <div className="relative h-[220px] pl-9" onMouseLeave={() => setActive(null)}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className="pointer-events-none absolute left-9 right-0 border-t-hair border-line-soft"
            style={{ bottom: `${(tick / top) * 100}%` }}
          >
            <span className="absolute -left-9 w-7 -translate-y-1/2 text-right text-[12px] tabular-nums text-text-muted">
              {shortNumber(tick)}
            </span>
          </div>
        ))}

        <div className="absolute inset-0 left-9 flex items-end gap-[6px]">
          {data.map((row) => {
            const emphasised = active === null ? row.hour === resting.hour : row.hour === active;
            return (
              <button
                key={row.hour}
                type="button"
                aria-label={`${hourLabel(row.hour)}, ${row.collisions.toLocaleString()} collisions`}
                onMouseEnter={() => setActive(row.hour)}
                onFocus={() => setActive(row.hour)}
                onBlur={() => setActive(null)}
                className="flex h-full flex-1 items-end"
              >
                <span
                  className="w-full rounded-t-[4px] transition-colors duration-150"
                  style={{
                    height: `${(row.collisions / top) * 100}%`,
                    backgroundColor: emphasised ? "var(--chart-strong)" : "var(--chart-base)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 flex gap-[6px] pl-9">
        {data.map((row) => (
          <span key={row.hour} className="flex-1 text-center text-[12px] tabular-nums text-text-muted">
            {row.hour % 3 === 0 ? String(row.hour).padStart(2, "0") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
