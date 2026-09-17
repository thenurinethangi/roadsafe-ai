"use client";

import { IconAlertTriangle, IconArrowRight, IconMapPins, IconMoon, IconTrendingDown } from "@tabler/icons-react";
import type { HotspotZone, Route } from "@/lib/api";
import { lowestSection, MeasuredSection } from "@/lib/route";
import { RISK_COLOURS, RISK_LABELS, RISK_ORDER } from "@/lib/risk";

interface Props {
  route: Route;
  sections: MeasuredSection[];
  hotspots: HotspotZone[];
  onPick: (index: number) => void;
}

const valueClass = "text-[26px] font-medium leading-none tracking-[-0.6px] tabular-nums";
const ofClass = "text-[15px] font-normal text-text-muted";

export default function JourneyInsights({ route, sections, hotspots, onPick }: Props) {
  const flagged = route.segments.filter((segment) => segment.risk_level === "high").length;
  const afterDark = route.segments.filter((segment) =>
    segment.factors.some((factor) => factor.label.toLowerCase().includes("dark")),
  ).length;
  const worstIndex = lowestSection(route);
  const worst = route.segments[worstIndex];
  const severeZones = hotspots.filter((zone) => zone.risk_band === "high").length;

  const kmByLevel = RISK_ORDER.map((level) => ({
    level,
    km: sections
      .filter((section) => section.segment.risk_level === level)
      .reduce((sum, section) => sum + section.km, 0),
  }));
  const measuredKm = kmByLevel.reduce((sum, item) => sum + item.km, 0);

  return (
    <div className="px-5 pb-6 pt-6">
      <h2 className="mb-3 text-[15px] font-medium">Insights for this journey</h2>

      {measuredKm > 0 && (
        <div className="mb-3 rounded-card border-hair border-line px-4 py-4">
          <div className="mb-3 text-[14px] text-text-secondary">Distance at each risk level</div>
          <div className="mb-3 flex h-2 gap-[3px]">
            {kmByLevel
              .filter((item) => item.km > 0)
              .map((item) => (
                <span
                  key={item.level}
                  className="rounded-full"
                  style={{ flexGrow: item.km, flexBasis: 0, backgroundColor: RISK_COLOURS[item.level] }}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {kmByLevel.map((item) => (
              <span key={item.level} className="flex items-center gap-1.5 text-[14px]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RISK_COLOURS[item.level] }} />
                <span className="text-text-secondary">{RISK_LABELS[item.level]}</span>
                <span className="tabular-nums">{item.km.toFixed(1)} km</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border-hair border-line bg-line">
        <div className="bg-surface-2 px-4 py-4">
          <IconAlertTriangle size={18} stroke={1.5} className="mb-3 text-text-muted" />
          <div className={valueClass} style={{ color: flagged ? RISK_COLOURS.high : undefined }}>
            {flagged}
            <span className={ofClass}> of {route.segments.length}</span>
          </div>
          <div className="mt-2 text-[14px] leading-snug text-text-secondary">sections at higher risk</div>
        </div>

        <button
          type="button"
          onClick={() => onPick(worstIndex)}
          className="group bg-surface-2 px-4 py-4 text-left transition-colors hover:bg-surface-1"
        >
          <IconTrendingDown size={18} stroke={1.5} className="mb-3 text-text-muted" />
          <div className={valueClass} style={{ color: RISK_COLOURS[worst.risk_level] }}>
            {worst.safety_score}
            <span className={ofClass}> / 100</span>
          </div>
          <div className="mt-2 text-[14px] leading-snug text-text-secondary">
            lowest section, {worst.road_name ?? "unnamed road"}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[13px] text-accent-text">
            Show on map
            <IconArrowRight size={14} stroke={1.5} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </button>

        <div className="bg-surface-2 px-4 py-4">
          <IconMoon size={18} stroke={1.5} className="mb-3 text-text-muted" />
          <div className={valueClass}>{afterDark}</div>
          <div className="mt-2 text-[14px] leading-snug text-text-secondary">sections travelled after dark</div>
        </div>

        <div className="bg-surface-2 px-4 py-4">
          <IconMapPins size={18} stroke={1.5} className="mb-3 text-text-muted" />
          <div className={valueClass}>
            {severeZones}
            <span className={ofClass}> of {hotspots.length}</span>
          </div>
          <div className="mt-2 text-[14px] leading-snug text-text-secondary">
            nearby hotspot zones with a high severe share
          </div>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-text-muted">
        Scores compare the roads on your route with each other. They are not the chance of a crash.
      </p>
    </div>
  );
}
