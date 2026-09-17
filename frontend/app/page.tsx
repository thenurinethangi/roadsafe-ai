"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EmptyState } from "@/components/EmptyState";
import { JourneyForm } from "@/components/JourneyForm";
import { LoadingStatus } from "@/components/LoadingStatus";
import { RiskLegend } from "@/components/RiskLegend";
import { RouteCard } from "@/components/RouteCard";
import { SegmentPopup } from "@/components/SegmentPopup";
import { WeatherStrip } from "@/components/WeatherStrip";
import { analyzeJourney, ApiError, getHealth, getHotspots } from "@/lib/api";
import { defaultDate, defaultTime, inGreatBritain } from "@/lib/places";
import type { HealthResponse, HotspotZone, JourneyResponse, Place, RouteSegment } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink/50">
      Loading map…
    </div>
  ),
});

export default function HomePage() {
  const [fromQuery, setFromQuery] = useState("Manchester");
  const [toQuery, setToQuery] = useState("Sheffield");
  const [from, setFrom] = useState<Place | null>({
    name: "Manchester",
    lat: 53.4808,
    lon: -2.2426,
  });
  const [to, setTo] = useState<Place | null>({
    name: "Sheffield",
    lat: 53.3811,
    lon: -1.4701,
  });
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JourneyResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [showHotspots, setShowHotspots] = useState(false);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() =>
        setHealth({
          status: "down",
          model_loaded: false,
          hotspot_model_loaded: false,
          database_connected: false,
          model_version: null,
          detail: "API unreachable",
        }),
      );

    getHotspots()
      .then(setHotspots)
      .catch(() => setHotspots([]));
  }, []);

  const selectedRoute = useMemo(
    () => result?.routes.find((route) => route.route_id === selectedRouteId) ?? result?.routes[0],
    [result, selectedRouteId],
  );

  async function runAnalysis() {
    if (!from || !to) {
      setError("Choose a From and To place from the suggestions, or use a demo journey.");
      return;
    }
    if (from.lat === to.lat && from.lon === to.lon) {
      setError("From and To need to be different places.");
      return;
    }
    if (!date || !time) {
      setError("Choose a date and time for the journey.");
      return;
    }
    if (!inGreatBritain(from.lat, from.lon) || !inGreatBritain(to.lat, to.lon)) {
      setError("Both places must be in Great Britain. The model was not trained elsewhere.");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedSegment(null);

    try {
      const response = await analyzeJourney({
        from,
        to,
        departureTime: `${date}T${time}:00`,
      });
      setResult(response);
      setSelectedRouteId(response.routes[0]?.route_id ?? null);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-3xl font-serif text-3xl tracking-tight sm:text-4xl">
            Which of these routes is safest right now?
          </h1>
          <HealthBadge health={health} />
        </div>
        <p className="max-w-2xl text-sm leading-6 text-ink/70">
          Every navigation app optimises for time. RoadSafe AI scores each
          option using historical collision severity, the weather forecast,
          darkness and the kind of road you would actually drive.
        </p>
      </section>

      <JourneyForm
        fromQuery={fromQuery}
        toQuery={toQuery}
        from={from}
        to={to}
        date={date}
        time={time}
        loading={loading}
        onFromQuery={setFromQuery}
        onToQuery={setToQuery}
        onFrom={setFrom}
        onTo={setTo}
        onDate={setDate}
        onTime={setTime}
        onSubmit={runAnalysis}
        onDemo={(nextFrom, nextTo) => {
          setFrom(nextFrom);
          setTo(nextTo);
          setFromQuery(nextFrom.name);
          setToQuery(nextTo.name);
          setError(null);
        }}
      />

      {error && (
        <p className="rounded-xl border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">
          {error}
        </p>
      )}

      {loading && <LoadingStatus />}

      {!loading && !result && !error && <EmptyState />}

      {!loading && result && selectedRoute && (
        <>
          <WeatherStrip
            summary={result.weather_summary}
            available={result.weather_available}
          />

          <div className="grid min-w-0 gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink/65">
                  Click a coloured stretch for the reasons behind that score.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <RiskLegend />
                  <label className="flex items-center gap-2 text-xs text-ink/70">
                    <input
                      type="checkbox"
                      checked={showHotspots}
                      onChange={(event) => setShowHotspots(event.target.checked)}
                    />
                    Hotspot zones
                  </label>
                </div>
              </div>
              <div className="h-[min(70vh,560px)] min-h-[280px] overflow-hidden rounded-2xl border border-line sm:h-[min(70vh,640px)]">
                <RouteMap
                  routes={result.routes}
                  selectedRouteId={selectedRoute.route_id}
                  selectedSegment={selectedSegment}
                  hotspots={hotspots}
                  showHotspots={showHotspots}
                  onSelectRoute={setSelectedRouteId}
                  onSelectSegment={setSelectedSegment}
                />
              </div>
              {selectedSegment && (
                <div className="mt-3 rounded-2xl border border-line bg-cream lg:hidden">
                  <SegmentPopup
                    segment={selectedSegment}
                    onClose={() => setSelectedSegment(null)}
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-3 lg:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
                Routes, safest first
              </p>
              {result.routes.map((route) => (
                <RouteCard
                  key={route.route_id}
                  route={route}
                  routes={result.routes}
                  selected={route.route_id === selectedRoute.route_id}
                  onSelect={() => {
                    setSelectedRouteId(route.route_id);
                    setSelectedSegment(null);
                  }}
                />
              ))}
              {selectedSegment && (
                <div className="hidden rounded-2xl border border-moss/30 bg-cream lg:block">
                  <SegmentPopup
                    segment={selectedSegment}
                    onClose={() => setSelectedSegment(null)}
                  />
                </div>
              )}
            </div>
          </div>

          <DisclaimerBanner />
        </>
      )}
    </div>
  );
}

function HealthBadge({ health }: { health: HealthResponse | null }) {
  if (!health) {
    return <p className="text-xs text-ink/45">Checking API…</p>;
  }

  const ready = health.model_loaded;
  return (
    <p
      className={`rounded-full px-3 py-1 text-xs ${
        ready ? "bg-risk-low/10 text-risk-low" : "bg-risk-moderate/10 text-risk-moderate"
      }`}
    >
      {ready
        ? `Model loaded${health.model_version ? ` · ${health.model_version}` : ""}`
        : health.detail || "Model not loaded yet"}
    </p>
  );
}
