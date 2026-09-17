import type { Route, RouteSegment } from "./types";

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatKm(km: number) {
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(score: number) {
  return `${score}/100`;
}

export function extraMinutes(route: Route, routes: Route[]) {
  const fastest = Math.min(...routes.map((item) => item.duration_minutes));
  return route.duration_minutes - fastest;
}

export function attentionCount(segments: RouteSegment[]) {
  return segments.filter((segment) => segment.risk_level !== "low").length;
}

export function riskMix(segments: RouteSegment[]) {
  const total = Math.max(segments.length, 1);
  const counts = {
    low: segments.filter((segment) => segment.risk_level === "low").length,
    moderate: segments.filter((segment) => segment.risk_level === "moderate").length,
    high: segments.filter((segment) => segment.risk_level === "high").length,
  };

  return {
    ...counts,
    lowPct: (counts.low / total) * 100,
    moderatePct: (counts.moderate / total) * 100,
    highPct: (counts.high / total) * 100,
  };
}

export function hourLabel(hour: number) {
  const suffix = hour < 12 ? "am" : "pm";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}${suffix}`;
}

export function asPercent(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return value <= 1 ? formatPercent(value * 100) : formatPercent(value);
}

export function asMetric(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}
