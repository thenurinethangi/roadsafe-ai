"use client";

import { useState } from "react";

interface Props {
  grid: number[][];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// One hue, light steps checked for contrast on the card surface
const RAMP = ["#415168", "#546b8e", "#6685b3", "#789ed9", "#8ab8ff"];

function hourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function peakCell(grid: number[][]) {
  let best = { day: 0, hour: 0, value: -1 };
  grid.forEach((row, day) =>
    row.forEach((value, hour) => {
      if (value > best.value) best = { day, hour, value };
    }),
  );
  return best;
}

export default function DayHourHeatmap({ grid }: Props) {
  const [active, setActive] = useState<{ day: number; hour: number } | null>(null);

  const values = grid.flat();
  const low = Math.min(...values);
  const high = Math.max(...values);
  const step = (value: number) => Math.min(RAMP.length - 1, Math.floor(((value - low) / (high - low || 1)) * RAMP.length));

  const peak = peakCell(grid);
  const shown = active ?? peak;
  const shownValue = grid[shown.day][shown.hour];
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
        <span className="text-[24px] font-medium leading-none tracking-[-0.5px]">
          {DAYS[shown.day]} {hourLabel(shown.hour)}
        </span>
        <span className="text-[15px] tabular-nums text-text-secondary">{shownValue.toLocaleString()} collisions</span>
        <span className="rounded-full bg-chart-tint px-2.5 py-0.5 text-[13px] tabular-nums text-chart-strong">
          {((shownValue / total) * 100).toFixed(2)}% of the week
        </span>
        {!active && <span className="text-[13px] text-text-muted">Busiest hour of the week</span>}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]" onMouseLeave={() => setActive(null)}>
          {grid.map((row, day) => (
            <div key={DAYS[day]} className="mb-[3px] grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-[3px]">
              <span className="self-center text-[12px] text-text-muted">{DAYS[day].slice(0, 3)}</span>
              {row.map((value, hour) => {
                const selected = shown.day === day && shown.hour === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    onMouseEnter={() => setActive({ day, hour })}
                    onFocus={() => setActive({ day, hour })}
                    onBlur={() => setActive(null)}
                    aria-label={`${DAYS[day]} ${hourLabel(hour)}, ${value} collisions`}
                    className={`h-9 rounded-[3px] transition-shadow ${selected ? "ring-2 ring-text-primary" : ""}`}
                    style={{ backgroundColor: RAMP[step(value)] }}
                  />
                );
              })}
            </div>
          ))}

          <div className="mt-2 grid grid-cols-[44px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span />
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className="text-[12px] tabular-nums text-text-muted">
                {hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-[12px] text-text-muted">
        Fewer
        {RAMP.map((colour) => (
          <span key={colour} className="h-2.5 w-6 rounded-[2px]" style={{ backgroundColor: colour }} />
        ))}
        More
      </div>
    </div>
  );
}
