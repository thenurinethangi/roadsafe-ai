"use client";

import { IconClock, IconRoute } from "@tabler/icons-react";
import { useMemo } from "react";
import type { Route } from "@/lib/api";
import { measuredSections } from "@/lib/route";
import { formatDuration, levelForScore, RISK_COLOURS, RISK_LABELS } from "@/lib/risk";

interface Props {
  route: Route;
  fastestMinutes: number;
  selected: boolean;
  onSelect: () => void;
}

function summaryLine(route: Route, fastestMinutes: number) {
  const extra = route.duration_minutes - fastestMinutes;
  if (extra > 0) return `${formatDuration(extra)} longer than the fastest`;
  return route.label.toLowerCase().includes("safest") ? "Best balance of time and safety" : "Fastest of the routes found";
}

export default function RouteOptionCard({ route, fastestMinutes, selected, onSelect }: Props) {
  const sections = useMemo(() => measuredSections(route), [route]);
  const level = levelForScore(route.safety_score);
  const higher = route.segments.filter((segment) => segment.risk_level === "high").length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-card border-hair px-5 py-4 text-left transition-colors ${
        selected
          ? "border-accent-border bg-surface-1 outline outline-1 outline-accent-border"
          : "border-line hover:border-line-strong hover:bg-surface-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className={`mb-2 text-[11px] uppercase tracking-[0.9px] ${selected ? "text-accent-text" : "text-text-muted"}`}
          >
            {route.label}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[16px] text-text-primary">
            <span className="flex items-center gap-1.5">
              <IconClock size={16} stroke={1.5} className="text-text-muted" />
              {formatDuration(route.duration_minutes)}
            </span>
            <span className="flex items-center gap-1.5">
              <IconRoute size={16} stroke={1.5} className="text-text-muted" />
              {route.distance_km} km
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-baseline justify-end gap-0.5">
            <span
              className="text-[38px] font-medium leading-none tracking-[-1px] tabular-nums"
              style={{ color: RISK_COLOURS[level] }}
            >
              {route.safety_score}
            </span>
            <span className="text-[14px] text-text-muted">/100</span>
          </div>
          <div className="mt-1.5 text-[13px] text-text-secondary">{RISK_LABELS[level]} risk</div>
        </div>
      </div>

      {/* Each bar is one section, as long as the road it covers */}
      <div className="mt-4 flex h-1.5 gap-[3px]" aria-hidden>
        {sections.map(({ segment, km }, index) => (
          <span
            key={index}
            className="rounded-full"
            style={{
              flexGrow: Math.max(km, 0.1),
              flexBasis: 0,
              minWidth: 3,
              backgroundColor: RISK_COLOURS[segment.risk_level],
              opacity: selected ? 1 : 0.7,
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[14px]">
        <span className="text-text-secondary">{summaryLine(route, fastestMinutes)}</span>
        <span className="flex items-center gap-1.5 text-text-muted">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: higher ? RISK_COLOURS.high : RISK_COLOURS.low }}
          />
          {higher === 0 ? "No higher-risk sections" : `${higher} higher-risk ${higher === 1 ? "section" : "sections"}`}
        </span>
      </div>
    </button>
  );
}
