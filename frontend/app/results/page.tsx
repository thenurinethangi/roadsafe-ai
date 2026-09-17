"use client";

import { IconAlertTriangle, IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import JourneyInsights from "@/components/JourneyInsights";
import ResultsHeader from "@/components/ResultsHeader";
import RiskPanel from "@/components/RiskPanel";
import RouteOptionCard from "@/components/RouteOptionCard";
import RouteHistorySection from "@/components/results/RouteHistorySection";
import type { ZoomRequest } from "@/components/RouteMap";
import { analyseJourney, getHotspots, getRouteHistory, HotspotZone, JourneyResponse, RouteHistory } from "@/lib/api";
import { lowestSection, measuredSections } from "@/lib/route";

// Leaflet needs the browser's window object, so the map never renders on the server
const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[14px] text-text-muted">Loading map…</div>,
});

const STEPS = ["Finding routes", "Checking the weather", "Scoring each section"];

type HistoryLoad = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: RouteHistory };

function Loading({ step, from, to }: { step: number; from: string; to: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-[400px] rounded-card border-hair border-line bg-surface-1 px-7 py-8">
        <span
          aria-hidden
          className="mb-6 block h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent-text"
        />
        <p className="text-[18px] font-medium">Scoring your journey</p>
        <p className="mt-1 truncate text-[15px] text-text-muted">
          {from} to {to}
        </p>

        <ol className="mt-6 space-y-3" role="status">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`flex items-center gap-3 text-[15px] transition-colors ${
                index === step ? "text-text-primary" : index < step ? "text-text-secondary" : "text-text-muted"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  index === step ? "animate-pulse bg-accent-text" : index < step ? "bg-text-secondary" : "bg-line-strong"
                }`}
              />
              {label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Results() {
  const params = useSearchParams();

  const from = params.get("from") ?? "Start";
  const to = params.get("to") ?? "Destination";
  const departure = params.get("departure") ?? "";

  const [result, setResult] = useState<JourneyResponse | null>(null);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [focused, setFocused] = useState(0);
  const [zoomTo, setZoomTo] = useState<ZoomRequest | null>(null);
  const [fitKey, setFitKey] = useState(0);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [histories, setHistories] = useState<Record<string, HistoryLoad>>({});

  useEffect(() => {
    if (result || error) return;
    const timer = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 1200);
    return () => clearInterval(timer);
  }, [result, error]);

  useEffect(() => {
    const journey = {
      from_lat: Number(params.get("from_lat")),
      from_lon: Number(params.get("from_lon")),
      to_lat: Number(params.get("to_lat")),
      to_lon: Number(params.get("to_lon")),
      departure_time: departure,
    };

    if (!Number.isFinite(journey.from_lat) || !Number.isFinite(journey.to_lat) || !departure) {
      setCanRetry(false);
      setError("This link is missing the journey details. Start again from the planner.");
      return;
    }

    let live = true;

    analyseJourney(journey)
      .then((response) => {
        if (!live) return;
        const first = response.routes[0];
        setResult(response);
        setSelectedId(first?.route_id ?? "");
        setFocused(first ? lowestSection(first) : 0);

        const points = response.routes.flatMap((route) => route.geometry);
        const lats = points.map((point) => point[0]);
        const lons = points.map((point) => point[1]);

        // Hotspots only add context to the map, so the scores still show if they fail
        getHotspots({
          lat_min: Math.min(...lats) - 0.25,
          lat_max: Math.max(...lats) + 0.25,
          lon_min: Math.min(...lons) - 0.25,
          lon_max: Math.max(...lons) + 0.25,
        })
          .then((zones) => live && setHotspots(zones))
          .catch(() => live && setHotspots([]));
      })
      .catch((err) => live && setError(err instanceof Error ? err.message : "Could not score this journey"));

    return () => {
      live = false;
    };
  }, [params, departure, attempt]);

  const selected = result?.routes.find((route) => route.route_id === selectedId) ?? result?.routes[0] ?? null;
  const sections = useMemo(() => (selected ? measuredSections(selected) : []), [selected]);

  // Each route's history is fetched once, when it is first selected
  useEffect(() => {
    if (!selected || histories[selected.route_id]) return;
    const routeId = selected.route_id;

    setHistories((current) => ({ ...current, [routeId]: { state: "loading" } }));
    getRouteHistory(selected.geometry)
      .then((data) => setHistories((current) => ({ ...current, [routeId]: { state: "ready", data } })))
      .catch((err) =>
        setHistories((current) => ({
          ...current,
          [routeId]: { state: "error", message: err instanceof Error ? err.message : "" },
        })),
      );
  }, [selected, histories]);

  const pick = useCallback(
    (index: number) => {
      if (index < 0 || index >= sections.length) return;
      setFocused(index);
      setZoomTo({ points: sections[index].points, id: Date.now() });
    },
    [sections],
  );

  // Left and right arrow keys step through the sections
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, .leaflet-container")) return;
      if (event.key === "ArrowRight") pick(focused + 1);
      if (event.key === "ArrowLeft") pick(focused - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick, focused]);

  function retry() {
    setError("");
    setResult(null);
    setHotspots([]);
    setHistories({});
    setStep(0);
    setAttempt((current) => current + 1);
  }

  function selectRoute(routeId: string) {
    const route = result?.routes.find((item) => item.route_id === routeId);
    if (!route) return;
    setSelectedId(routeId);
    setFocused(lowestSection(route));
    setZoomTo(null);
    setFitKey((current) => current + 1);
  }

  if (error) {
    return (
      <>
        <ResultsHeader from={from} to={to} departure={departure} weather={null} />
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div role="alert" className="w-full max-w-[440px] rounded-card border-hair border-line bg-surface-1 px-7 py-8">
            <span className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-danger-bg text-risk-high">
              <IconAlertTriangle size={22} stroke={1.5} />
            </span>
            <p className="text-[18px] font-medium">Could not score this journey</p>
            <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{error}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {canRetry && (
                <button
                  type="button"
                  onClick={retry}
                  className="flex items-center gap-2 rounded-control bg-fill-primary px-4 py-2.5 text-[15px] font-medium text-on-primary"
                >
                  <IconRefresh size={17} stroke={1.5} />
                  Try again
                </button>
              )}
              <Link
                href="/"
                className="flex items-center gap-2 rounded-control border-hair border-line px-4 py-2.5 text-[15px] text-text-secondary transition-colors hover:border-line-strong hover:text-text-primary"
              >
                <IconArrowLeft size={17} stroke={1.5} />
                Change journey
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!result || !selected) {
    return (
      <>
        <ResultsHeader from={from} to={to} departure={departure} weather={null} />
        <Loading step={step} from={from} to={to} />
      </>
    );
  }

  const fastest = Math.min(...result.routes.map((route) => route.duration_minutes));
  const history: HistoryLoad = histories[selected.route_id] ?? { state: "loading" };

  return (
    <>
      <div id="results-top" />
      <ResultsHeader from={from} to={to} departure={departure} weather={result.weather_summary} />

      <div className="flex flex-col lg:h-[calc(100dvh-150px)] lg:min-h-[600px] lg:flex-row">
        <section className="flex flex-col lg:min-h-0 lg:flex-1">
          <div className="relative h-[55vh] min-h-[340px] lg:h-auto lg:min-h-0 lg:flex-1">
            <RouteMap
              routes={result.routes}
              selectedId={selected.route_id}
              onSelectRoute={selectRoute}
              hotspots={hotspots}
              sections={sections}
              focused={focused}
              onFocus={pick}
              zoomTo={zoomTo}
              fitKey={fitKey}
              onFit={() => {
                setZoomTo(null);
                setFitKey((current) => current + 1);
              }}
            />
          </div>
          <RiskPanel sections={sections} focused={focused} onPick={pick} />
        </section>

        <aside className="border-t-hair border-line lg:w-[440px] lg:min-h-0 lg:overflow-y-auto lg:border-l-hair lg:border-t-0 xl:w-[480px]">
          <div className="flex items-baseline justify-between px-5 pb-3 pt-5">
            <h2 className="text-[15px] font-medium">Route options</h2>
            <span className="text-[14px] text-text-muted">
              {result.routes.length} {result.routes.length === 1 ? "route" : "routes"} found
            </span>
          </div>

          <div className="flex flex-col gap-3 px-5">
            {result.routes.map((route) => (
              <RouteOptionCard
                key={route.route_id}
                route={route}
                fastestMinutes={fastest}
                selected={route.route_id === selected.route_id}
                onSelect={() => selectRoute(route.route_id)}
              />
            ))}

            {result.routes.length === 1 && (
              <p className="px-1 text-[14px] text-text-muted">
                Only one route was found between these places, so there is nothing to compare it with.
              </p>
            )}
          </div>

          <div className="mx-5 mt-6 border-t-hair border-line" />
          <JourneyInsights route={selected} sections={sections} hotspots={hotspots} onPick={pick} />
        </aside>
      </div>

      <RouteHistorySection
        status={history.state}
        error={history.state === "error" ? history.message : undefined}
        history={history.state === "ready" ? history.data : null}
        routeLabel={selected.label}
        departure={departure}
        sections={sections}
        focused={focused}
        onPick={(index) => {
          pick(index);
          document.getElementById("results-top")?.scrollIntoView({ behavior: "smooth" });
        }}
        onRetry={() =>
          setHistories((current) => {
            const next = { ...current };
            delete next[selected.route_id];
            return next;
          })
        }
      />
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <Results />
    </Suspense>
  );
}
