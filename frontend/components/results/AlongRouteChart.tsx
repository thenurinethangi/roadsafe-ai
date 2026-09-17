"use client";

import { useState } from "react";
import type { RouteHistory } from "@/lib/api";
import type { MeasuredSection } from "@/lib/route";
import { RISK_COLOURS } from "@/lib/risk";

interface Props {
  along: RouteHistory["along_route"];
  routeKm: number;
  sections: MeasuredSection[];
  focused: number;
  onPick: (index: number) => void;
}

// Sections are measured on the map and bins on the server, so match them by share of the trip
export function sectionAtShare(sections: MeasuredSection[], share: number) {
  const total = sections.reduce((sum, section) => sum + section.km, 0);
  let passed = 0;
  for (let index = 0; index < sections.length; index++) {
    passed += sections[index].km;
    if (share * total < passed) return index;
  }
  return Math.max(0, sections.length - 1);
}

export function stretchLabel(bin: number, binKm: number, routeKm: number) {
  const from = bin * binKm;
  const to = Math.min((bin + 1) * binKm, routeKm);
  return `km ${from}–${Math.round(to)}`;
}

export default function AlongRouteChart({ along, routeKm, sections, focused, onPick }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const counts = along.collisions;
  const top = Math.max(1, ...counts);
  const busiest = counts.indexOf(Math.max(...counts));
  const shown = active ?? busiest;
  const sectionOf = (bin: number) => sectionAtShare(sections, Math.min(1, ((bin + 0.5) * along.bin_km) / routeKm));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1.5" aria-live="polite">
        <span className="text-[26px] font-medium leading-none tracking-[-0.6px] tabular-nums">
          {stretchLabel(shown, along.bin_km, routeKm)}
        </span>
        <span className="text-[15px] tabular-nums text-text-secondary">
          {counts[shown]} collisions · {along.severe[shown]} fatal or serious
        </span>
        <span className="text-[13px] text-text-muted">{active === null ? "Most collisions" : ""}</span>
      </div>

      <div className="flex h-[180px] items-end gap-[3px]" onMouseLeave={() => setActive(null)}>
        {counts.map((count, bin) => (
          <button
            key={bin}
            type="button"
            onClick={() => onPick(sectionOf(bin))}
            onMouseEnter={() => setActive(bin)}
            onFocus={() => setActive(bin)}
            onBlur={() => setActive(null)}
            aria-label={`${stretchLabel(bin, along.bin_km, routeKm)}, ${count} collisions. Open this part of the route`}
            className="flex h-full flex-1 items-end"
          >
            <span
              className="w-full rounded-t-[3px] transition-colors duration-150"
              style={{
                height: `${Math.max((count / top) * 100, count ? 3 : 1)}%`,
                backgroundColor:
                  active === bin
                    ? "var(--text-primary)"
                    : sectionOf(bin) === focused
                      ? "var(--chart-strong)"
                      : "var(--chart-base)",
              }}
            />
          </button>
        ))}
      </div>

      {/* The route itself, on the same scale as the bars above */}
      <div className="mt-3 flex h-3 items-center gap-[3px]" role="group" aria-label="Sections of this route">
        {sections.map((section, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPick(index)}
            aria-label={`Section ${index + 1}, ${section.segment.road_name ?? "unnamed road"}`}
            aria-current={index === focused ? "step" : undefined}
            className="rounded-full transition-all duration-200 hover:!opacity-100"
            style={{
              flexGrow: Math.max(section.km, 0.1),
              flexBasis: 0,
              minWidth: 4,
              height: index === focused ? 12 : 6,
              opacity: index === focused ? 1 : 0.5,
              backgroundColor: RISK_COLOURS[section.segment.risk_level],
            }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex justify-between text-[12px] tabular-nums text-text-muted">
        <span>Start</span>
        <span>{Math.round(routeKm / 2)} km</span>
        <span>{Math.round(routeKm)} km · Destination</span>
      </div>
    </div>
  );
}
