import { attentionCount, extraMinutes, formatDuration, formatKm, riskMix } from "@/lib/format";
import { scoreTone } from "@/lib/risk";
import type { Route } from "@/lib/types";

type RouteCardProps = {
  route: Route;
  routes: Route[];
  selected: boolean;
  onSelect: () => void;
};

export function RouteCard({ route, routes, selected, onSelect }: RouteCardProps) {
  const extra = extraMinutes(route, routes);
  const mix = riskMix(route.segments);
  const attention = attentionCount(route.segments);
  const mixLabel =
    mix.high > 0
      ? "has higher-risk stretches"
      : mix.moderate > 0
        ? "mostly lower risk"
        : "mostly lower risk";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full min-w-0 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-moss bg-cream shadow-md ring-2 ring-moss/20"
          : "border-line bg-cream/70 hover:border-moss/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-moss">
            {route.label}
          </p>
          <p className="mt-1 text-sm text-ink/65">
            {formatDuration(route.duration_minutes)} · {formatKm(route.distance_km)}
          </p>
        </div>
        <p className={`font-serif text-3xl leading-none ${scoreTone(route.safety_score)}`}>
          {route.safety_score}
        </p>
      </div>

      {extra > 0 && (
        <p className="mt-2 text-xs text-ink/55">+{extra} min vs fastest</p>
      )}
      {extra === 0 && routes.length > 1 && (
        <p className="mt-2 text-xs text-ink/55">Fastest of these options</p>
      )}

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line">
        <span className="bg-risk-low" style={{ width: `${mix.lowPct}%` }} />
        <span className="bg-risk-moderate" style={{ width: `${mix.moderatePct}%` }} />
        <span className="bg-risk-high" style={{ width: `${mix.highPct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink/60">
        {mixLabel}
        {attention > 0
          ? ` · ${attention} section${attention === 1 ? "" : "s"} need attention`
          : " · no flagged sections"}
      </p>
    </button>
  );
}
