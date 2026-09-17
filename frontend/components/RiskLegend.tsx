export function RiskLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-ink/65">
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-risk-low" /> Lower risk
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-risk-moderate" /> Needs attention
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-2.5 w-2.5 rounded-full bg-risk-high" /> Higher risk
      </span>
    </div>
  );
}
