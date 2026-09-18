import type { Insights, SeverityShare } from "@/lib/api";

interface Props {
  insights: Insights;
  minCollisions: number;
  limit?: number;
}

function severe(row: SeverityShare) {
  return row.fatal_pct + row.serious_pct;
}

export function averageSevere(insights: Insights) {
  const totals = insights.severity_totals;
  if (!totals) return null;
  return ((totals.fatal + totals.serious) / insights.total_collisions) * 100;
}

export default function SeverityDrivers({ insights, minCollisions, limit = 6 }: Props) {
  const average = averageSevere(insights);
  const groups: [string, SeverityShare[]][] = [
    ["Light", insights.severity_by_light],
    ["Speed limit", insights.severity_by_speed_limit],
    ["Area", insights.severity_by_area],
    ["Weather", insights.severity_by_weather],
    ["Road type", insights.severity_by_road_type],
  ];

  const rows = groups
    .flatMap(([group, shares]) => shares.map((share) => ({ group, share })))
    .filter(({ share }) => share.collisions >= minCollisions)
    .sort((a, b) => severe(b.share) - severe(a.share))
    .slice(0, limit);

  if (average === null || rows.length === 0) return null;
  const top = Math.max(...rows.map(({ share }) => severe(share))) * 1.1;

  return (
    <div>
      <ol className="flex flex-col">
        {rows.map(({ group, share }, index) => {
          const value = severe(share);
          return (
            <li key={`${group}-${share.label}`} className="border-t-hair border-line-soft py-3.5 first:border-t-0 first:pt-0">
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2.5">
                  <span className="w-4 text-[13px] tabular-nums text-text-muted">{index + 1}</span>
                  <span className="truncate text-[15px]">{share.label}</span>
                  <span className="text-[12px] text-text-muted">{group}</span>
                </span>
                <span className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-[15px]">{value.toFixed(1)}%</span>
                  <span className="text-[12px] text-chart-strong">+{(value - average).toFixed(1)}</span>
                </span>
              </div>
              <div className="relative ml-[26px] h-1.5 rounded-full bg-track">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-chart-strong"
                  style={{ width: `${(value / top) * 100}%` }}
                />
                <span
                  className="absolute -bottom-1 -top-1 w-0.5 rounded-full bg-text-secondary"
                  style={{ left: `${(average / top) * 100}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-[13px] text-text-muted">
        <span className="h-3 w-0.5 rounded-full bg-text-secondary" />
        Average across all collisions: {average.toFixed(1)}%
      </p>
    </div>
  );
}
