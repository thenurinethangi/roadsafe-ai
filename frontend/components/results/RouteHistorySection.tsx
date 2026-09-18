"use client";

import { IconAlertTriangle, IconArrowRight, IconRefresh } from "@tabler/icons-react";
import { ReactNode } from "react";
import HourlyChart, { hourLabel } from "@/components/insights/HourlyChart";
import SeverityBars, { SeverityLegend } from "@/components/insights/SeverityBars";
import AlongRouteChart, { sectionAtShare, stretchLabel } from "@/components/results/AlongRouteChart";
import DayBars from "@/components/results/DayBars";
import YearTrend, { trendText } from "@/components/results/YearTrend";
import type { RouteHistory } from "@/lib/api";
import type { MeasuredSection } from "@/lib/route";

// Below this, a single bad week can swing the patterns
const FEW_COLLISIONS = 50;
const SMALL_GROUP = 20;

interface Props {
  status: "loading" | "error" | "ready";
  error?: string;
  history: RouteHistory | null;
  routeLabel: string;
  departure: string;
  sections: MeasuredSection[];
  focused: number;
  onPick: (index: number) => void;
  onRetry: () => void;
}

function departureParts(departure: string) {
  const when = new Date(departure);
  if (Number.isNaN(when.getTime())) return { hour: undefined, weekday: undefined };
  // JavaScript counts Sunday as 0, the charts start on Monday
  return { hour: when.getHours(), weekday: (when.getDay() + 6) % 7 };
}

function Block({
  title,
  description,
  aside,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-[16px] font-medium">{title}</h3>
          {description && <p className="mt-1 text-[14px] leading-[1.55] text-text-muted">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Figure({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-t-hair border-line-soft py-5 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[14px] text-text-secondary">{label}</span>
        <span className="text-[28px] font-medium leading-none tracking-[-0.6px] tabular-nums">{value}</span>
      </div>
      <div className="mt-2 text-[13px] text-text-muted">{detail}</div>
      {children}
    </div>
  );
}

function NationalCompare({ route, national }: { route: number; national: number }) {
  const top = Math.max(route, national) * 1.15;
  const rows = [
    { label: "This route", value: route, colour: "var(--chart-strong)", text: "text-text-primary" },
    { label: "National average", value: national, colour: "var(--text-muted)", text: "text-text-secondary" },
  ];

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[116px_minmax(0,1fr)_48px] items-center gap-3">
          <span className="text-[13px] text-text-secondary">{row.label}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-track">
            <span className="block h-full rounded-full" style={{ width: `${(row.value / top) * 100}%`, backgroundColor: row.colour }} />
          </span>
          <span className={`text-right text-[13px] tabular-nums ${row.text}`}>{row.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function RouteHistorySection({
  status,
  error,
  history,
  routeLabel,
  departure,
  sections,
  focused,
  onPick,
  onRetry,
}: Props) {
  const { hour, weekday } = departureParts(departure);
  const ready = status === "ready" && history !== null;
  const empty = ready && history.total_collisions === 0;

  return (
    <section aria-labelledby="route-history" className="border-t-hair border-line">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="min-w-0 px-6 pb-14 pt-12">
          <p className="mb-3 text-[12px] uppercase tracking-[1.6px] text-text-muted">Collision history</p>
          <h2 id="route-history" className="text-[28px] font-medium leading-[1.2] tracking-[-0.6px]">
            What has happened along this route
          </h2>
          <p className="mt-2 max-w-[680px] text-[15px] leading-[1.6] text-text-secondary">
            Collisions recorded within {history?.corridor_m ?? 100} m of the{" "}
            <span className="text-text-primary">{routeLabel.toLowerCase()}</span> route
            {history ? ` since ${history.first_year}` : ""}.
          </p>

          {status === "loading" && (
            <div className="mt-12 flex flex-col gap-10">
              <div className="h-[260px] animate-pulse rounded-card bg-surface-card" />
              <div className="h-[260px] animate-pulse rounded-card bg-surface-card" />
            </div>
          )}

          {status === "error" && (
            <div role="alert" className="mt-10 flex flex-wrap items-center gap-4 rounded-card bg-surface-card px-5 py-4">
              <IconAlertTriangle size={20} stroke={1.5} className="text-text-muted" />
              <p className="flex-1 text-[15px] text-text-secondary">Could not load the collision history. {error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 rounded-control border-hair border-line px-4 py-2 text-[14px] text-text-secondary hover:border-line-strong hover:text-text-primary"
              >
                <IconRefresh size={16} stroke={1.5} />
                Try again
              </button>
            </div>
          )}

          {empty && (
            <p className="mt-10 text-[15px] text-text-secondary">
              No collisions have been recorded within {history.corridor_m} m of this route since {history.first_year}.
            </p>
          )}

          {ready && !empty && (
            <>
              {history.total_collisions < FEW_COLLISIONS && (
                <p className="mt-4 text-[14px] text-text-muted">
                  Only {history.total_collisions} collisions were recorded, so these patterns are less certain.
                </p>
              )}

              <Block
                className="mt-12"
                title="Where along the route"
                description={`Collisions in every ${history.along_route.bin_km} km. The coloured strip is your route, section by section. Click either to open that stretch on the map.`}
              >
                <AlongRouteChart
                  along={history.along_route}
                  routeKm={history.route_km}
                  sections={sections}
                  focused={focused}
                  onPick={onPick}
                />
              </Block>

              <div className="mt-14 grid gap-14 border-t-hair border-line-soft pt-12 2xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <Block
                  title="Time of day"
                  description={hour === undefined ? "Collisions by hour." : "Collisions by hour. Your departure hour is highlighted."}
                >
                  <HourlyChart
                    data={history.by_hour.map((collisions, index) => ({ hour: index, collisions }))}
                    markHour={hour}
                    markLabel={hour === undefined ? "Busiest hour" : "Your departure hour"}
                    shareOf="this route"
                  />
                </Block>

                <Block
                  title="Day of the week"
                  description={weekday === undefined ? "Collisions by day." : "Your travel day is highlighted."}
                >
                  <DayBars items={history.by_day} highlight={weekday} />
                </Block>
              </div>

              <Block
                className="mt-14 border-t-hair border-line-soft pt-12"
                title="Conditions"
                description="Share of collisions that were fatal or serious in each condition."
                aside={<SeverityLegend />}
              >
                <div className="grid gap-12 xl:grid-cols-2">
                  <div>
                    <div className="mb-4 text-[13px] text-text-secondary">Light</div>
                    <SeverityBars data={history.by_light} smallSample={SMALL_GROUP} />
                  </div>
                  <div>
                    <div className="mb-4 text-[13px] text-text-secondary">Road surface</div>
                    <SeverityBars data={history.by_surface} smallSample={SMALL_GROUP} />
                  </div>
                </div>
              </Block>
            </>
          )}
        </div>

        <aside className="border-t-hair border-line px-5 pb-14 pt-12 lg:border-l-hair lg:border-t-0">
          {status === "loading" && (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((key) => (
                <div key={key} className="h-[72px] animate-pulse rounded-control bg-surface-card" />
              ))}
            </div>
          )}

          {ready && !empty && (
            <RailContent history={history} hour={hour} sections={sections} onPick={onPick} />
          )}
        </aside>
      </div>
    </section>
  );
}

function RailContent({
  history,
  hour,
  sections,
  onPick,
}: {
  history: RouteHistory;
  hour?: number;
  sections: MeasuredSection[];
  onPick: (index: number) => void;
}) {
  const along = history.along_route;
  const busiest = along.collisions.indexOf(Math.max(...along.collisions));
  const busiestSection = sectionAtShare(sections, Math.min(1, ((busiest + 0.5) * along.bin_km) / history.route_km));
  const trend = trendText(history.by_year);

  return (
    <div className="flex flex-col gap-12 lg:sticky lg:top-10">
      <div>
        <h3 className="mb-5 text-[16px] font-medium">At a glance</h3>

        <Figure
          label="Collisions recorded"
          value={history.total_collisions.toLocaleString()}
          detail={`${(history.total_collisions / history.route_km).toFixed(1)} per km of road`}
        />

        <Figure
          label="Fatal or serious"
          value={`${history.severe_pct.toFixed(1)}%`}
          detail={`${history.fatal} fatal and ${history.serious} serious`}
        >
          <NationalCompare route={history.severe_pct} national={history.national_severe_pct} />
        </Figure>

        {hour !== undefined && (
          <Figure
            label={`Around ${hourLabel(hour)}`}
            value={history.by_hour[hour].toLocaleString()}
            detail="Collisions in the hour you leave"
          />
        )}

        <Figure
          label="Most collisions"
          value={stretchLabel(busiest, along.bin_km, history.route_km)}
          detail={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {along.collisions[busiest]} collisions
              <button
                type="button"
                onClick={() => onPick(busiestSection)}
                className="group flex items-center gap-1 text-accent-text hover:text-text-primary"
              >
                Show on map
                <IconArrowRight size={14} stroke={1.5} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </span>
          }
        />
      </div>

      <div>
        <div className="mb-4">
          <h3 className="text-[16px] font-medium">Year by year</h3>
          {trend && <p className="mt-1 text-[14px] text-text-muted">{trend}.</p>}
        </div>
        <YearTrend items={history.by_year} />
      </div>
    </div>
  );
}
