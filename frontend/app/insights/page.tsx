"use client";

import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import ConditionExplorer from "@/components/insights/ConditionExplorer";
import DayHourHeatmap, { peakCell } from "@/components/insights/DayHourHeatmap";
import HotspotExplorer from "@/components/insights/HotspotExplorer";
import InsightCard, { DataTable } from "@/components/insights/InsightCard";
import SeverityDrivers, { averageSevere } from "@/components/insights/SeverityDrivers";
import SeverityMix from "@/components/insights/SeverityMix";
import TrendChart, { TrendLegend } from "@/components/insights/TrendChart";
import { getHotspots, getInsights, HotspotZone, Insights } from "@/lib/api";
import { RISK_COLOURS, RISK_LABELS, RISK_ORDER } from "@/lib/risk";
import SiteFooter from "@/components/SiteFooter";

// Groups smaller than this are too small to compare fairly
const SMALL_SAMPLE = 1000;
const WEEKS_PER_MONTH = 52 / 12;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Load<T> = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; data: T };

function useLoad<T>(load: () => Promise<T>): Load<T> {
  const [result, setResult] = useState<Load<T>>({ state: "loading" });

  useEffect(() => {
    let live = true;
    load()
      .then((data) => live && setResult({ state: "ready", data }))
      .catch((err) => live && setResult({ state: "error", message: err instanceof Error ? err.message : "" }));
    return () => {
      live = false;
    };
    // Each loader runs once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return result;
}

function Change({ value, unit, since }: { value: number; unit: "%" | " pts"; since: string }) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  const Icon = rounded > 0 ? IconArrowUpRight : rounded < 0 ? IconArrowDownRight : IconMinus;
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-text-secondary">
      <Icon size={15} stroke={1.5} className="text-chart-strong" />
      <span className="tabular-nums">
        {rounded > 0 ? "+" : rounded < 0 ? "−" : ""}
        {Math.abs(rounded).toFixed(1)}
        {unit}
      </span>
      <span className="text-text-muted">since {since}</span>
    </span>
  );
}

function Kpi({
  label,
  value,
  change,
  loading,
}: {
  label: string;
  value: string;
  change?: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col rounded-card border-hair border-line-soft bg-surface-card px-6 py-6">
      <span className="text-[14px] text-text-secondary">{label}</span>
      {loading ? (
        <>
          <div className="mt-4 h-9 w-32 animate-pulse rounded-control bg-track" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-track" />
        </>
      ) : (
        <>
          <span className="mt-4 text-[34px] font-medium leading-none tracking-[-0.9px] tabular-nums">{value}</span>
          {change && <div className="mt-3">{change}</div>}
        </>
      )}
    </div>
  );
}

function ZoneLegend() {
  return (
    <div className="hidden items-center gap-4 text-[13px] text-text-secondary md:flex">
      {RISK_ORDER.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLOURS[level] }} />
          {RISK_LABELS[level]}
        </span>
      ))}
    </div>
  );
}

function Kpis({ data, loading, failed }: { data: Insights | null; loading: boolean; failed: boolean }) {
  if (failed) {
    return (
      <div role="alert" className="rounded-card bg-surface-card px-5 py-4 text-[15px] text-text-secondary">
        Could not load the collision figures. Please try again in a moment.
      </div>
    );
  }

  const months = data?.collisions_by_month ?? [];
  const years = data?.collisions_by_year ?? [];
  const first = years[0];
  const last = years[years.length - 1];
  const average = data ? averageSevere(data) : null;
  const weeks = months.length * WEEKS_PER_MONTH;
  const peak = data?.day_hour.length ? peakCell(data.day_hour) : null;

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        loading={loading}
        label="Collisions"
        value={data ? data.total_collisions.toLocaleString() : ""}
        change={
          first && last && first !== last ? (
            <Change value={((last.collisions - first.collisions) / first.collisions) * 100} unit="%" since={String(first.year)} />
          ) : undefined
        }
      />
      <Kpi
        loading={loading}
        label="Fatal or serious"
        value={average === null ? "" : `${average.toFixed(1)}%`}
        change={
          first && last && first !== last ? (
            <Change value={last.severe_pct - first.severe_pct} unit=" pts" since={String(first.year)} />
          ) : undefined
        }
      />
      <Kpi
        loading={loading}
        label="Fatal collisions"
        value={data?.severity_totals ? data.severity_totals.fatal.toLocaleString() : ""}
        change={
          data?.severity_totals && weeks ? (
            <span className="text-[13px] text-text-muted">
              about {Math.round(data.severity_totals.fatal / weeks)} a week
            </span>
          ) : undefined
        }
      />
      <Kpi
        loading={loading}
        label="Busiest hour of the week"
        value={peak ? `${DAYS[peak.day]} ${String(peak.hour).padStart(2, "0")}:00` : ""}
        change={
          peak && weeks ? (
            <span className="text-[13px] text-text-muted">about {Math.round(peak.value / weeks)} a week</span>
          ) : undefined
        }
      />
    </div>
  );
}

export default function InsightsPage() {
  const insights = useLoad<Insights>(getInsights);
  const zones = useLoad<HotspotZone[]>(() => getHotspots());

  const data = insights.state === "ready" ? insights.data : null;
  const insightsError = insights.state === "error" ? insights.message : undefined;
  const average = data ? averageSevere(data) : null;
  const zoneList = zones.state === "ready" ? zones.data : [];
  const years = data?.collisions_by_year ?? [];
  const period = years.length ? `${years[0].year} – ${years[years.length - 1].year}` : null;

  // An older insights file has none of the extra breakdowns
  const extended = Boolean(data?.severity_totals && data.collisions_by_month.length && data.day_hour.length);
  const extendedState = insights.state === "ready" && !extended ? "error" : insights.state;
  const extendedError = insightsError ?? "This section is not available right now.";

  return (
    <div className="flex flex-1 flex-col">
      <div className="w-full px-6 pb-16 pt-10 lg:px-10 lg:pt-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.8px] sm:text-[36px]">Insights</h1>
            <p className="mt-2 text-[16px] text-text-secondary">
              How, when and where injury collisions happen on Britain&apos;s roads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[13px] text-text-secondary">
            <span className="rounded-full border-hair border-line px-3 py-1">Great Britain</span>
            {period && <span className="rounded-full border-hair border-line px-3 py-1 tabular-nums">{period}</span>}
          </div>
        </header>

        <Kpis data={extended ? data : null} loading={insights.state === "loading"} failed={extendedState === "error"} />

        <div className="mt-5 grid gap-5 xl:grid-cols-12">
          <InsightCard
            className="xl:col-span-8"
            title="Collisions over time"
            description="Every month, all collisions and those that were fatal or serious."
            aside={<TrendLegend />}
            status={extendedState}
            error={extendedError}
            loadingHeight={290}
            table={
              data && (
                <DataTable
                  head={["Month", "Collisions", "Fatal or serious", "Fatal"]}
                  rows={data.collisions_by_month.map((row) => [
                    row.month,
                    row.collisions.toLocaleString(),
                    row.severe.toLocaleString(),
                    row.fatal.toLocaleString(),
                  ])}
                />
              )
            }
          >
            {data && <TrendChart months={data.collisions_by_month} />}
          </InsightCard>

          <InsightCard
            className="xl:col-span-4"
            title="How serious"
            description="Every collision by its worst injury."
            status={extendedState}
            error={extendedError}
            loadingHeight={290}
          >
            {data?.severity_totals && <SeverityMix totals={data.severity_totals} />}
          </InsightCard>

          <InsightCard
            className="xl:col-span-8"
            title="When collisions happen"
            description="Collisions for each hour of each day of the week. Hover a square to read it."
            status={extendedState}
            error={extendedError}
            loadingHeight={320}
            table={
              data && (
                <DataTable
                  head={["Day", ...Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"))]}
                  rows={data.day_hour.map((row, day) => [DAYS[day], ...row.map((value) => value.toLocaleString())])}
                />
              )
            }
          >
            {data && <DayHourHeatmap grid={data.day_hour} />}
          </InsightCard>

          <InsightCard
            className="xl:col-span-4"
            title="When collisions turn serious"
            description={`Conditions with the highest share of fatal or serious collisions. Groups under ${SMALL_SAMPLE.toLocaleString()} collisions are left out.`}
            status={extendedState}
            error={extendedError}
            loadingHeight={320}
          >
            {data && <SeverityDrivers insights={data} minCollisions={SMALL_SAMPLE} />}
          </InsightCard>

          <InsightCard
            className="xl:col-span-12"
            title="Severity by condition"
            description="Share of collisions that were fatal or serious. Pick a condition to compare its groups with the average."
            status={extendedState}
            error={extendedError}
            loadingHeight={360}
          >
            {data && average !== null && <ConditionExplorer insights={data} average={average} smallSample={SMALL_SAMPLE} />}
          </InsightCard>

          <InsightCard
            className="xl:col-span-12"
            title="Where collisions cluster"
            description="Areas between Manchester and Sheffield where collisions are most concentrated. Colour shows how often they were serious."
            aside={<ZoneLegend />}
            status={zones.state}
            error={zones.state === "error" ? zones.message : undefined}
            loadingHeight={500}
            table={
              zoneList.length > 0 && (
                <DataTable
                  head={["Zone", "Collisions", "Radius", "Fatal or serious"]}
                  rows={[...zoneList]
                    .sort((a, b) => b.severe_rate - a.severe_rate)
                    .map((zone, index) => [
                      `Zone ${index + 1}`,
                      zone.total_collisions.toLocaleString(),
                      `${zone.radius_km.toFixed(1)} km`,
                      `${(zone.severe_rate * 100).toFixed(1)}%`,
                    ])}
                />
              )
            }
          >
            <HotspotExplorer zones={zoneList} />
          </InsightCard>

        </div>

        <p className="mt-6 text-[13px] leading-[1.65] text-text-muted">
          Minor injuries often go unreported, so the true numbers are higher.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
