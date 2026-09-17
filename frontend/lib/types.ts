export type Place = {
  name: string;
  lat: number;
  lon: number;
};

export type RiskLevel = "low" | "moderate" | "high";
export type FactorImpact = "low" | "medium" | "high";

export type RiskFactor = {
  label: string;
  impact: FactorImpact;
};

export type RouteSegment = {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  safety_score: number;
  risk_level: RiskLevel;
  road_name: string | null;
  factors: RiskFactor[];
};

export type Route = {
  route_id: string;
  label: string;
  distance_km: number;
  duration_minutes: number;
  safety_score: number;
  geometry: [number, number][];
  segments: RouteSegment[];
};

export type JourneyResponse = {
  weather_summary: string;
  weather_available: boolean;
  routes: Route[];
};

export type HealthResponse = {
  status: string;
  model_loaded: boolean;
  hotspot_model_loaded: boolean;
  database_connected: boolean;
  model_version: string | null;
  detail: string | null;
};

export type HotspotZone = {
  cluster_id: number;
  centre_lat: number;
  centre_lon: number;
  radius_km: number;
  total_collisions: number;
  severe_rate: number;
  risk_band: RiskLevel;
};

export type HourCount = {
  hour: number;
  collisions: number;
};

export type SeverityShare = {
  label: string;
  collisions: number;
  fatal_pct: number;
  serious_pct: number;
  slight_pct: number;
};

export type InsightsResponse = {
  total_collisions: number;
  collisions_by_hour: HourCount[];
  severity_by_weather: SeverityShare[];
  severity_by_road_type: SeverityShare[];
};

export type ComparisonRow = {
  model: string;
  accuracy?: number;
  macro_precision?: number;
  macro_recall?: number;
  macro_f1?: number;
  [key: string]: string | number | undefined;
};

export type ClassScores = {
  precision?: number;
  recall?: number;
  f1?: number;
  "f1-score"?: number;
  support?: number;
};

export type ModelMetrics = {
  chosen_model?: string;
  model_name?: string;
  model_version?: string;
  selection_reason?: string;
  notes?: string;
  accuracy?: number;
  macro_f1?: number;
  macro_precision?: number;
  macro_recall?: number;
  feature_columns?: string[];
  class_labels?: string[];
  labels?: string[];
  target_names?: string[];
  classes?: string[];
  confusion_matrix?: number[][];
  per_class?: Record<string, ClassScores>;
  classification_report?: Record<string, ClassScores | number>;
  comparison?: ComparisonRow[];
  models?: Record<string, Omit<ComparisonRow, "model">>;
};
