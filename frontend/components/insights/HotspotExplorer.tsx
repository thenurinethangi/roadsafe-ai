"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { HotspotZone } from "@/lib/api";
import { RISK_COLOURS } from "@/lib/risk";

const ZoneMap = dynamic(() => import("@/components/insights/ZoneMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[14px] text-text-muted">Loading map…</div>,
});

export default function HotspotExplorer({ zones }: { zones: HotspotZone[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const ranked = useMemo(() => [...zones].sort((a, b) => b.severe_rate - a.severe_rate), [zones]);
  const ranks = useMemo(() => new Map(ranked.map((zone, index) => [zone.cluster_id, index + 1])), [ranked]);
  const topRate = ranked[0]?.severe_rate ?? 1;

  function toggle(clusterId: number) {
    setActiveId((current) => (current === clusterId ? null : clusterId));
  }

  if (zones.length === 0) {
    return <p className="text-[15px] text-text-secondary">No hotspot zones have been loaded yet.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="relative h-[380px] overflow-hidden rounded-control lg:h-auto lg:min-h-[500px]">
        <ZoneMap zones={zones} ranks={ranks} activeId={activeId} onSelect={toggle} />
      </div>

      <ol className="flex flex-col gap-1">
        {ranked.map((zone, index) => {
          const active = zone.cluster_id === activeId;
          const colour = RISK_COLOURS[zone.risk_band];
          return (
            <li key={zone.cluster_id}>
              <button
                type="button"
                onClick={() => toggle(zone.cluster_id)}
                aria-pressed={active}
                className={`w-full rounded-control px-3.5 py-3 text-left transition-colors ${
                  active ? "bg-track" : "hover:bg-track"
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="flex items-baseline gap-2.5">
                    <span className="w-4 text-[13px] tabular-nums text-text-muted">{index + 1}</span>
                    <span className="text-[15px]">Zone {index + 1}</span>
                    <span className="text-[13px] tabular-nums text-text-muted">
                      {zone.total_collisions.toLocaleString()} collisions
                    </span>
                  </span>
                  <span className="text-[15px] tabular-nums" style={{ color: colour }}>
                    {(zone.severe_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="ml-[26px] h-1.5 overflow-hidden rounded-full bg-track">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${(zone.severe_rate / topRate) * 100}%`, backgroundColor: colour }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
