export function WeatherStrip({
  summary,
  available,
}: {
  summary: string;
  available: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
        Weather during this journey
      </p>
      <p className="mt-1 text-ink">{summary}</p>
      {!available && (
        <p className="mt-1 text-xs text-risk-moderate">
          Live forecast was unavailable, so seasonal averages were used. Routes
          were still scored.
        </p>
      )}
    </div>
  );
}
