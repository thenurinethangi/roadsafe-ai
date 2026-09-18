"use client";

import {
  IconAlertTriangle,
  IconArrowsCross,
  IconChevronLeft,
  IconChevronRight,
  IconCloudRain,
  IconDroplet,
  IconGauge,
  IconMoon,
  IconRoadSign,
  IconSnowflake,
  IconWind,
} from "@tabler/icons-react";
import type { RiskFactor } from "@/lib/api";
import type { MeasuredSection } from "@/lib/route";
import { RISK_COLOURS } from "@/lib/risk";

interface Props {
  sections: MeasuredSection[];
  focused: number;
  onPick: (index: number) => void;
}

function factorIcon(label: string) {
  const text = label.toLowerCase();
  const props = { size: 17, stroke: 1.5 };
  if (text.includes("rain")) return <IconCloudRain {...props} />;
  if (text.includes("snow")) return <IconSnowflake {...props} />;
  if (text.includes("wind")) return <IconWind {...props} />;
  if (text.includes("dark") || text.includes("unlit")) return <IconMoon {...props} />;
  if (text.includes("wet") || text.includes("ice") || text.includes("flood")) return <IconDroplet {...props} />;
  if (text.includes("mph")) return <IconGauge {...props} />;
  if (text.includes("junction") || text.includes("roundabout")) return <IconArrowsCross {...props} />;
  if (text.includes("carriageway") || text.includes("road")) return <IconRoadSign {...props} />;
  return <IconAlertTriangle {...props} />;
}

function factorStyle(factor: RiskFactor) {
  if (factor.impact === "high") return { background: "var(--bg-danger)", color: RISK_COLOURS.high };
  if (factor.impact === "medium") return { background: "var(--bg-warning)", color: RISK_COLOURS.moderate };
  return { background: "var(--bg-subtle)", color: "var(--text-secondary)" };
}

const stepButton =
  "grid h-9 w-9 place-items-center rounded-control border-hair border-line text-text-secondary transition-colors hover:border-line-strong hover:text-text-primary disabled:pointer-events-none disabled:opacity-35";

// Always visible under the map, never hidden in a popup
export default function RiskPanel({ sections, focused, onPick }: Props) {
  const current = sections[focused];
  if (!current) return null;
  const { segment, km } = current;

  return (
    <div className="border-t-hair border-line bg-surface-1 px-6 pb-5 pt-4">
      {/* The whole journey as a strip. Longer roads get longer bars */}
      <div className="mb-4 flex h-3 items-center gap-[3px]" role="group" aria-label="Sections of this route">
        {sections.map((section, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onPick(index)}
            aria-label={`Section ${index + 1}, ${section.segment.road_name ?? "unnamed road"}, ${section.segment.safety_score} of 100`}
            aria-current={index === focused ? "step" : undefined}
            className="rounded-full transition-all duration-200 hover:!opacity-100"
            style={{
              flexGrow: Math.max(section.km, 0.1),
              flexBasis: 0,
              minWidth: 6,
              height: index === focused ? 12 : 6,
              opacity: index === focused ? 1 : 0.45,
              backgroundColor: RISK_COLOURS[section.segment.risk_level],
            }}
          />
        ))}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2" aria-live="polite">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: RISK_COLOURS[segment.risk_level] }}
            aria-hidden
          />
          <span className="truncate text-[17px] font-medium">{segment.road_name ?? "Unnamed road"}</span>
          <span className="whitespace-nowrap text-[15px] text-text-muted">{km.toFixed(km < 10 ? 1 : 0)} km stretch</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[16px] tabular-nums" style={{ color: RISK_COLOURS[segment.risk_level] }}>
            {segment.safety_score} / 100
          </span>
          <div className="flex items-center gap-1.5">
            <span className="mr-1.5 whitespace-nowrap text-[14px] tabular-nums text-text-muted">
              {focused + 1} of {sections.length}
            </span>
            <button
              type="button"
              onClick={() => onPick(focused - 1)}
              disabled={focused === 0}
              aria-label="Previous section"
              className={stepButton}
            >
              <IconChevronLeft size={18} stroke={1.5} />
            </button>
            <button
              type="button"
              onClick={() => onPick(focused + 1)}
              disabled={focused === sections.length - 1}
              aria-label="Next section"
              className={stepButton}
            >
              <IconChevronRight size={18} stroke={1.5} />
            </button>
          </div>
        </div>
      </div>

      {segment.factors.length === 0 ? (
        <p className="rounded-control bg-fill-subtle px-4 py-3 text-[15px] text-text-secondary">
          Nothing on this section pushed the risk up.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {segment.factors.map((factor) => (
            <span
              key={factor.label}
              className="flex items-center gap-2.5 rounded-control px-4 py-3 text-[15px]"
              style={factorStyle(factor)}
            >
              <span className="shrink-0">{factorIcon(factor.label)}</span>
              {factor.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
