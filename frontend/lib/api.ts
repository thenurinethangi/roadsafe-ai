export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export type RiskLevel = "low" | "moderate" | "high";

export interface RiskFactor {
  label: string;
  impact: "low" | "medium" | "high";
}

export interface RouteSegment {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  safety_score: number;
  risk_level: RiskLevel;
  road_name: string | null;
  factors: RiskFactor[];
}

export interface Route {
  route_id: string;
  label: string;
  distance_km: number;
  duration_minutes: number;
  safety_score: number;
  geometry: [number, number][];
  segments: RouteSegment[];
}

export interface JourneyResponse {
  weather_summary: string;
  weather_available: boolean;
  routes: Route[];
}

export interface HotspotZone {
  cluster_id: number;
  centre_lat: number;
  centre_lon: number;
  radius_km: number;
  total_collisions: number;
  severe_rate: number;
  risk_band: RiskLevel;
}

export interface SeverityShare {
  label: string;
  collisions: number;
  fatal_pct: number;
  serious_pct: number;
  slight_pct: number;
}

export interface Insights {
  total_collisions: number;
  collisions_by_hour: { hour: number; collisions: number }[];
  severity_by_weather: SeverityShare[];
  severity_by_road_type: SeverityShare[];
  severity_totals: { fatal: number; serious: number; slight: number } | null;
  collisions_by_month: { month: string; collisions: number; severe: number; fatal: number }[];
  collisions_by_year: { year: number; collisions: number; severe_pct: number }[];
  day_hour: number[][];
  severity_by_light: SeverityShare[];
  severity_by_speed_limit: SeverityShare[];
  severity_by_area: SeverityShare[];
}

export interface RouteHistory {
  corridor_m: number;
  first_year: number;
  last_year: number;
  route_km: number;
  total_collisions: number;
  fatal: number;
  serious: number;
  severe_pct: number;
  national_severe_pct: number;
  by_hour: number[];
  by_day: { day: string; collisions: number }[];
  by_year: { year: number; collisions: number }[];
  by_light: SeverityShare[];
  by_surface: SeverityShare[];
  along_route: { bin_km: number; collisions: number[]; severe: number[] };
}

export interface Health {
  status: string;
  model_loaded: boolean;
  hotspot_model_loaded: boolean;
  database_connected: boolean;
  model_version: string | null;
  detail: string | null;
}

export interface JourneyRequest {
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  departure_time: string;
}

export interface MapBounds {
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
}

// Scoring a long journey takes a few seconds, so this only catches a stuck server
const TIMEOUT_MS = 30000;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("The service took too long to respond. Please try again in a moment.");
    }
    throw new Error("Cannot reach the RoadSafe service. Check your connection and try again.");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(errorMessage(body, response.status));
  }
  return body as T;
}

function errorMessage(body: unknown, status: number): string {
  if (status === 422) return "Please check the journey details and try again.";
  if (status >= 500 && status !== 502) return "This service is temporarily unavailable. Please try again in a moment.";

  if (body && typeof body === "object") {
    const { error } = body as { error?: string };
    if (typeof error === "string") return `${error}.`;
  }
  return "Something went wrong. Please try again.";
}

export function analyseJourney(journey: JourneyRequest) {
  return request<JourneyResponse>("/api/journey/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(journey),
  });
}

export function getRouteHistory(geometry: [number, number][]) {
  return request<RouteHistory>("/api/journey/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ geometry }),
  });
}

export function getHotspots(bounds?: MapBounds) {
  const query = bounds
    ? "?" + new URLSearchParams(Object.entries(bounds).map(([key, value]) => [key, String(value)]))
    : "";
  return request<HotspotZone[]>(`/api/hotspots${query}`);
}

export function getInsights() {
  return request<Insights>("/api/insights/summary");
}

export function getHealth() {
  return request<Health>("/api/health");
}
