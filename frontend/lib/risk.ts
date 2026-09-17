import type { RiskLevel } from "@/lib/api";

// The only three colours that carry meaning
export const RISK_COLOURS: Record<RiskLevel, string> = {
  low: "#1D9E75",
  moderate: "#EF9F27",
  high: "#E24B4A",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Lower",
  moderate: "Moderate",
  high: "Higher",
};

export const RISK_ORDER: RiskLevel[] = ["low", "moderate", "high"];

export const CHART_INK = {
  grid: "rgba(255,255,255,0.12)",
  axis: "#7a7a75",
  label: "#a8a8a2",
  bar: "#a8a8a2",
};

// Same bands as the backend scoring service
export const LOW_RISK_MIN_SCORE = 67;
export const HIGH_RISK_MAX_SCORE = 33;

export function levelForScore(score: number): RiskLevel {
  if (score >= LOW_RISK_MIN_SCORE) return "low";
  if (score <= HIGH_RISK_MAX_SCORE) return "high";
  return "moderate";
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${String(rest).padStart(2, "0")}m` : `${rest} min`;
}

export function formatDayTime(value: string) {
  const when = new Date(value);
  if (Number.isNaN(when.getTime())) return value;

  const day = when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}
