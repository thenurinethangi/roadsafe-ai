"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { SegmentPopup } from "@/components/SegmentPopup";
import { segmentPath } from "@/lib/geometry";
import { RISK_COLOUR } from "@/lib/risk";
import type { HotspotZone, Route, RouteSegment } from "@/lib/types";

function markerIcon(kind: "start" | "end") {
  return L.divIcon({
    className: `rs-marker rs-marker-${kind}`,
    html: `<span>${kind === "start" ? "A" : "B"}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

type RouteMapProps = {
  routes: Route[];
  selectedRouteId: string | null;
  selectedSegment: RouteSegment | null;
  hotspots: HotspotZone[];
  showHotspots: boolean;
  onSelectRoute: (routeId: string) => void;
  onSelectSegment: (segment: RouteSegment | null) => void;
};

function FitRoutes({ routes }: { routes: Route[] }) {
  const map = useMap();

  useEffect(() => {
    const points = routes.flatMap((route) => route.geometry);
    if (points.length < 2) return;
    map.fitBounds(points, { padding: [36, 36] });
  }, [map, routes]);

  return null;
}

export default function RouteMap({
  routes,
  selectedRouteId,
  selectedSegment,
  hotspots,
  showHotspots,
  onSelectRoute,
  onSelectSegment,
}: RouteMapProps) {
  const selected = routes.find((route) => route.route_id === selectedRouteId) ?? routes[0];
  const others = routes.filter((route) => route.route_id !== selected?.route_id);
  const start = selected?.geometry[0];
  const end = selected?.geometry.at(-1);
  const startIcon = useMemo(() => markerIcon("start"), []);
  const endIcon = useMemo(() => markerIcon("end"), []);

  const selectedPaths = useMemo(() => {
    if (!selected) return [];
    return selected.segments.map((segment) => ({
      segment,
      path: segmentPath(selected.geometry, segment),
    }));
  }, [selected]);

  return (
    <MapContainer
      center={[53.48, -2.24]}
      zoom={8}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitRoutes routes={routes} />

      {showHotspots &&
        hotspots.map((zone) => (
          <Circle
            key={`${zone.cluster_id}-${zone.centre_lat}-${zone.centre_lon}`}
            center={[zone.centre_lat, zone.centre_lon]}
            radius={zone.radius_km * 1000}
            pathOptions={{
              color: RISK_COLOUR[zone.risk_band] ?? RISK_COLOUR.moderate,
              fillColor: RISK_COLOUR[zone.risk_band] ?? RISK_COLOUR.moderate,
              fillOpacity: 0.12,
              weight: 1,
            }}
          >
            <Popup>
              <div className="p-3 text-sm">
                <p className="font-semibold">Hotspot {zone.cluster_id}</p>
                <p>{zone.total_collisions.toLocaleString()} collisions</p>
                <p>{(zone.severe_rate * 100).toFixed(1)}% fatal or serious</p>
                <p className="capitalize">{zone.risk_band} band</p>
              </div>
            </Popup>
          </Circle>
        ))}

      {others.map((route) => (
        <Polyline
          key={route.route_id}
          positions={route.geometry}
          pathOptions={{ color: "#6b746e", weight: 5, opacity: 0.35 }}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent);
              onSelectRoute(route.route_id);
              onSelectSegment(null);
            },
          }}
        />
      ))}

      {selectedPaths.map(({ segment, path }, index) => (
        <Polyline
          key={`${selected?.route_id}-${index}`}
          positions={path}
          pathOptions={{
            color: RISK_COLOUR[segment.risk_level],
            weight:
              selectedSegment &&
              selectedSegment.start_lat === segment.start_lat &&
              selectedSegment.start_lon === segment.start_lon &&
              selectedSegment.end_lat === segment.end_lat
                ? 9
                : 7,
            opacity: 0.95,
          }}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent);
              if (selected) onSelectRoute(selected.route_id);
              onSelectSegment(segment);
            },
          }}
        >
          <Popup>
            <SegmentPopup segment={segment} />
          </Popup>
        </Polyline>
      ))}

      {start && <Marker position={start} icon={startIcon} />}
      {end && <Marker position={end} icon={endIcon} />}
    </MapContainer>
  );
}
