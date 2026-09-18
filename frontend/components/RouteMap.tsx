"use client";

import { IconArrowsMaximize, IconPointer } from "@tabler/icons-react";
import L from "leaflet";
import { useEffect, useState } from "react";
import {
  AttributionControl,
  Circle,
  CircleMarker,
  MapContainer,
  Pane,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { HotspotZone, Route } from "@/lib/api";
import type { MeasuredSection } from "@/lib/route";
import { RISK_COLOURS, RISK_LABELS, RISK_ORDER } from "@/lib/risk";

const IMPACT_COLOURS = {
  high: RISK_COLOURS.high,
  medium: RISK_COLOURS.moderate,
  low: "#7a7a75",
};

export interface ZoomRequest {
  points: [number, number][];
  id: number;
}

interface Props {
  routes: Route[];
  selectedId: string;
  onSelectRoute: (routeId: string) => void;
  hotspots: HotspotZone[];
  sections: MeasuredSection[];
  focused: number;
  onFocus: (index: number) => void;
  zoomTo: ZoomRequest | null;
  fitKey: number;
  onFit: () => void;
}

function FitToRoutes({ routes, fitKey }: { routes: Route[]; fitKey: number }) {
  const map = useMap();

  useEffect(() => {
    const points = routes.flatMap((route) => route.geometry);
    if (points.length) map.flyToBounds(L.latLngBounds(points), { padding: [48, 48], duration: 0.6 });
  }, [routes, fitKey, map]);

  return null;
}

function ZoomToSection({ request }: { request: ZoomRequest | null }) {
  const map = useMap();

  useEffect(() => {
    if (request?.points.length) map.flyToBounds(L.latLngBounds(request.points), { padding: [90, 90], duration: 0.6 });
  }, [request, map]);

  return null;
}

// The map sits in a resizable layout, so Leaflet must re-measure when its box changes
function KeepSized() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function RouteMap({
  routes,
  selectedId,
  onSelectRoute,
  hotspots,
  sections,
  focused,
  onFocus,
  zoomTo,
  fitKey,
  onFit,
}: Props) {
  const selected = routes.find((route) => route.route_id === selectedId) ?? routes[0];
  const others = routes.filter((route) => route !== selected);
  const start = selected?.geometry[0];
  const end = selected?.geometry[selected.geometry.length - 1];
  const focusedPoints = sections[focused]?.points;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="absolute inset-0">
      <MapContainer center={[54, -2]} zoom={6} attributionControl={false} className="h-full w-full">
        <AttributionControl prefix={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KeepSized />
        <FitToRoutes routes={routes} fitKey={fitKey} />
        <ZoomToSection request={zoomTo} />

        {/* The rings ignore the mouse so they never cover the route. Their details sit on the centre dot */}
        {hotspots.map((zone) => (
          <Circle
            key={zone.cluster_id}
            center={[zone.centre_lat, zone.centre_lon]}
            radius={zone.radius_km * 1000}
            pathOptions={{
              color: RISK_COLOURS[zone.risk_band],
              weight: 1,
              opacity: 0.55,
              dashArray: "3 5",
              fillOpacity: 0.05,
              interactive: false,
            }}
          />
        ))}

        <Pane name="hotspot-centres" style={{ zIndex: 402 }}>
          {hotspots.map((zone) => (
            <CircleMarker
              key={zone.cluster_id}
              center={[zone.centre_lat, zone.centre_lon]}
              radius={4}
              pathOptions={{ color: RISK_COLOURS[zone.risk_band], fillColor: RISK_COLOURS[zone.risk_band], fillOpacity: 0.9, weight: 1 }}
            >
              <Tooltip direction="top" offset={[0, -6]} className="rich-tip">
                <div className="mb-1 font-medium">Hotspot zone</div>
                <div className="text-text-secondary">
                  {zone.total_collisions.toLocaleString()} collisions within {zone.radius_km.toFixed(1)} km
                </div>
                <div className="text-text-secondary">{Math.round(zone.severe_rate * 100)}% were fatal or serious</div>
              </Tooltip>
            </CircleMarker>
          ))}
        </Pane>

        <Pane name="alternatives" style={{ zIndex: 405 }}>
          {others.map((route) => (
            <Polyline
              key={route.route_id}
              positions={route.geometry}
              pathOptions={{ color: "#8a8a84", weight: 6, opacity: 0.55, lineCap: "round" }}
              eventHandlers={{ click: () => onSelectRoute(route.route_id) }}
            >
              <Tooltip sticky>
                {route.label}, score {route.safety_score}. Click to compare
              </Tooltip>
            </Polyline>
          ))}
        </Pane>

        <Pane name="casing" style={{ zIndex: 410 }}>
          {selected && (
            <Polyline
              positions={selected.geometry}
              pathOptions={{ color: "#0b0b0a", weight: 13, opacity: 0.85, lineCap: "round", interactive: false }}
            />
          )}
          {focusedPoints && (
            <Polyline
              positions={focusedPoints}
              pathOptions={{ color: "#f2f2f0", weight: 15, opacity: 0.95, lineCap: "round", interactive: false }}
            />
          )}
        </Pane>

        <Pane name="sections" style={{ zIndex: 420 }}>
          {sections.map(({ segment, points }, index) => (
            <Polyline
              key={`${selected?.route_id}-${index}`}
              positions={points}
              pathOptions={{
                color: RISK_COLOURS[segment.risk_level],
                weight: index === focused || index === hovered ? 9 : 7,
                opacity: 1,
                lineCap: "round",
                interactive: false,
              }}
            />
          ))}
        </Pane>

        {/* Invisible wide lines on top, so a section is easy to hover and click */}
        <Pane name="section-targets" style={{ zIndex: 425 }}>
          {sections.map(({ segment, points, km }, index) => (
            <Polyline
              key={`${selected?.route_id}-target-${index}`}
              positions={points}
              pathOptions={{ color: "#000000", weight: 22, opacity: 0, lineCap: "round" }}
              eventHandlers={{
                click: () => onFocus(index),
                mouseover: () => setHovered(index),
                mouseout: () => setHovered(null),
              }}
            >
              <Tooltip sticky direction="top" offset={[0, -14]} className="rich-tip">
                <div className="mb-0.5 flex items-center justify-between gap-4">
                  <span className="font-medium">{segment.road_name ?? "Unnamed road"}</span>
                  <span className="tabular-nums" style={{ color: RISK_COLOURS[segment.risk_level] }}>
                    {segment.safety_score} / 100
                  </span>
                </div>
                <div className="mb-2 text-text-muted">
                  {RISK_LABELS[segment.risk_level]} risk · {km.toFixed(1)} km · section {index + 1} of {sections.length}
                </div>

                {segment.factors.length === 0 ? (
                  <div className="text-text-secondary">Nothing on this section pushed the risk up.</div>
                ) : (
                  <ul className="space-y-1">
                    {segment.factors.map((factor) => (
                      <li key={factor.label} className="flex items-center gap-2 text-text-secondary">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: IMPACT_COLOURS[factor.impact] }}
                        />
                        {factor.label}
                      </li>
                    ))}
                  </ul>
                )}

                {index !== focused && <div className="mt-2 text-accent-text">Click for the full explanation</div>}
              </Tooltip>
            </Polyline>
          ))}
        </Pane>

        <Pane name="ends" style={{ zIndex: 430 }}>
          {start && (
            <CircleMarker
              center={start}
              radius={7}
              pathOptions={{ color: "#f2f2f0", fillColor: "#171716", fillOpacity: 1, weight: 2.5 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                Start
              </Tooltip>
            </CircleMarker>
          )}
          {end && (
            <CircleMarker
              center={end}
              radius={7}
              pathOptions={{ color: "#171716", fillColor: "#f2f2f0", fillOpacity: 1, weight: 2.5 }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                Destination
              </Tooltip>
            </CircleMarker>
          )}
        </Pane>
      </MapContainer>

      <div className="pointer-events-none absolute left-1/2 top-3 z-[400] hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border-hair border-line bg-surface-2 px-3.5 py-1.5 text-[13px] text-text-secondary md:flex">
        <IconPointer size={15} stroke={1.5} />
        Click any part of the route to see why it scored that way
      </div>

      <button
        type="button"
        onClick={onFit}
        className="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-control border-hair border-line bg-surface-2 px-3 py-2 text-[13px] text-text-secondary transition-colors hover:border-line-strong hover:text-text-primary"
      >
        <IconArrowsMaximize size={15} stroke={1.5} />
        Whole route
      </button>

      <div className="absolute bottom-6 left-3 z-[400] flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-control border-hair border-line bg-surface-2 px-3.5 py-2.5">
        {RISK_ORDER.map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: RISK_COLOURS[level] }} />
            <span className="text-[13px] text-text-secondary">{RISK_LABELS[level]}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-dashed border-text-muted" />
          <span className="text-[13px] text-text-secondary">Hotspot zone</span>
        </span>
      </div>
    </div>
  );
}
