import type {
  HealthResponse,
  HotspotZone,
  InsightsResponse,
  JourneyResponse,
  ModelMetrics,
  Place,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: string;
      detail?: string | Array<{ msg?: string }>;
    };

    if (typeof body.error === "string") {
      return typeof body.detail === "string"
        ? `${body.error}. ${body.detail}`
        : body.error;
    }

    if (typeof body.detail === "string") return body.detail;

    if (Array.isArray(body.detail)) {
      const messages = body.detail
        .map((item) => item.msg)
        .filter((msg): msg is string => Boolean(msg));
      if (messages.length) return messages.join(". ");
    }
  } catch {
    // body was not JSON
  }

  if (res.status === 503) {
    return "Prediction service unavailable. The trained model may not be loaded yet.";
  }
  if (res.status === 502) {
    return "Could not find a route between these points.";
  }
  if (res.status === 422) {
    return "Those journey details are not valid. Use places inside Great Britain.";
  }

  return `Request failed (${res.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Is the backend running on http://localhost:8000?",
      0,
    );
  }

  if (!res.ok) {
    throw new ApiError(await readError(res), res.status);
  }

  return (await res.json()) as T;
}

export function getHealth() {
  return request<HealthResponse>("/api/health");
}

export function analyzeJourney(input: {
  from: Place;
  to: Place;
  departureTime: string;
}) {
  return request<JourneyResponse>("/api/journey/analyze", {
    method: "POST",
    body: JSON.stringify({
      from_lat: input.from.lat,
      from_lon: input.from.lon,
      to_lat: input.to.lat,
      to_lon: input.to.lon,
      departure_time: input.departureTime,
    }),
  });
}

export function getHotspots() {
  return request<HotspotZone[]>("/api/hotspots");
}

export function getInsights() {
  return request<InsightsResponse>("/api/insights/summary");
}

export function getMetrics() {
  return request<ModelMetrics>("/api/model/metrics");
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return (await res.json()) as Place[];
}
