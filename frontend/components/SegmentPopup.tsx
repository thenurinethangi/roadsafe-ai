import { RISK_LABEL, impactDot } from "@/lib/risk";
import type { RouteSegment } from "@/lib/types";

export function SegmentPopup({
  segment,
  onClose,
}: {
  segment: RouteSegment;
  onClose?: () => void;
}) {
  return (
    <div className="p-3 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{segment.road_name ?? "Road section"}</p>
          <p className="text-xs text-ink/60">{RISK_LABEL[segment.risk_level]}</p>
        </div>
        <div className="flex items-start gap-2">
          <p className="font-serif text-xl leading-none">{segment.safety_score}/100</p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-ink/45 hover:text-ink"
              aria-label="Close section details"
            >
              Close
            </button>
          )}
        </div>
      </div>
      {segment.factors.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {segment.factors.map((factor) => (
            <li key={factor.label} className="flex items-start gap-2 text-xs leading-5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${impactDot(factor.impact)}`} />
              <span>{factor.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-ink/60">No standout risk factors on this stretch.</p>
      )}
    </div>
  );
}
