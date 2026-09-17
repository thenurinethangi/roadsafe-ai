"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

import { HourChart } from "@/components/charts/HourChart";
import { SeverityChart } from "@/components/charts/SeverityChart";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { ModelMetricsPanel } from "@/components/ModelMetrics";
import { RiskLegend } from "@/components/RiskLegend";
import { ApiError, getHotspots, getInsights, getMetrics } from "@/lib/api";
import type { HotspotZone, InsightsResponse, ModelMetrics } from "@/lib/types";

const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ink/50">
      Loading hotspot map…
    </div>
  ),
});

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [hotspots, setHotspots] = useState<HotspotZone[]>([]);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summary, zones] = await Promise.all([getInsights(), getHotspots()]);
        if (cancelled) return;
        setInsights(summary);
        setHotspots(zones);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load insights.");
        }
      }

      try {
        const model = await getMetrics();
        if (!cancelled) setMetrics(model);
      } catch (err) {
        if (!cancelled) {
          setMetricsError(
            err instanceof ApiError
              ? err.message
              : "Model metrics are not available yet.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <section>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">Insights</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Collision patterns from the cleaned STATS19 records, hotspot zones
          from k-Means clustering, and the evaluation numbers from notebook 04.
          This is the analysis view — it does not score a live journey.
        </p>
      </section>

      {loading && <p className="text-sm text-ink/55">Loading dashboard…</p>}
      {error && (
        <p className="rounded-xl border border-risk-high/30 bg-risk-high/10 px-4 py-3 text-sm text-risk-high">
          {error}
        </p>
      )}

      {insights && (
        <>
          <p className="text-sm text-ink/70">
            <span className="font-serif text-2xl text-ink">
              {insights.total_collisions.toLocaleString()}
            </span>{" "}
            injury collisions in the cleaned dataset.
          </p>

          <section className="rounded-2xl border border-line bg-cream p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl">Collision hotspot zones</h2>
                <p className="text-sm text-ink/60">
                  k-Means clusters on the Manchester–Sheffield corridor. Click a
                  zone for counts and the severe-collision share.
                </p>
              </div>
              <RiskLegend />
            </div>
            <div className="h-[min(60vh,480px)] min-h-[260px] overflow-hidden rounded-2xl border border-line sm:h-[min(60vh,520px)]">
              {hotspots.length ? (
                <HotspotMap hotspots={hotspots} />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink/55">
                  No hotspot zones in the database yet. Seed the clusters from
                  notebook 05 after the backend is running.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Collisions by hour of day" note="UK local time">
              <HourChart data={insights.collisions_by_hour} />
            </ChartCard>
            <ChartCard
              title="Severity share by weather"
              note="Percent of collisions in each weather group"
            >
              <SeverityChart data={insights.severity_by_weather} />
            </ChartCard>
          </div>

          <ChartCard title="Severity share by road type">
            <SeverityChart data={insights.severity_by_road_type} />
          </ChartCard>
        </>
      )}

      <section className="rounded-2xl border border-line bg-cream p-4 sm:p-5">
        <h2 className="font-serif text-2xl">Model performance</h2>
        <p className="mt-1 mb-4 text-sm text-ink/60">
          Accuracy looks high because most collisions are Slight. Macro F1 and
          Fatal/Serious recall are the honest numbers for this problem.
        </p>
        {loading && !metrics ? (
          <p className="text-sm text-ink/60">Loading model metrics…</p>
        ) : metrics ? (
          <ModelMetricsPanel metrics={metrics} />
        ) : (
          <p className="text-sm text-ink/60">
            {metricsError ?? "Waiting for metrics.json from model training."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-cream p-4 text-sm leading-6 text-ink/70">
        <h2 className="font-serif text-xl text-ink">Data notes</h2>
        <p className="mt-2">
          Source: UK Department for Transport, STATS19 road collision data, last
          five years, Open Government Licence v3.0. Only police-reported injury
          collisions are included. The dataset contains collisions, not safe
          journeys, which is why the model predicts severity rather than the
          chance of a crash.
        </p>
      </section>

      <DisclaimerBanner />
    </div>
  );
}

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-cream p-4">
      <h2 className="font-serif text-xl">{title}</h2>
      {note && <p className="mb-2 text-xs text-ink/55">{note}</p>}
      {children}
    </section>
  );
}
