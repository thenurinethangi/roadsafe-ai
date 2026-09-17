import type { FactorImpact, RiskLevel } from "./types";

export const RISK_COLOUR: Record<RiskLevel, string> = {
  low: "#1f7a46",
  moderate: "#c47b16",
  high: "#c2410c",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Lower risk",
  moderate: "Needs attention",
  high: "Higher risk",
};

export function impactDot(impact: FactorImpact) {
  if (impact === "high") return "bg-risk-high";
  if (impact === "medium") return "bg-risk-moderate";
  return "bg-ink/30";
}

export function scoreTone(score: number) {
  if (score >= 67) return "text-risk-low";
  if (score <= 33) return "text-risk-high";
  return "text-risk-moderate";
}
