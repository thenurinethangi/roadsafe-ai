"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { AttributionControl, Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { HotspotZone } from "@/lib/api";
import { RISK_COLOURS } from "@/lib/risk";

interface Props {
  zones: HotspotZone[];
  ranks: Map<number, number>;
  activeId: number | null;
  onSelect: (clusterId: number) => void;
}

function zoneBounds(zone: HotspotZone) {
  return L.latLng(zone.centre_lat, zone.centre_lon).toBounds(zone.radius_km * 2000);
}

function allBounds(zones: HotspotZone[]) {
  return zones.reduce((all, zone) => all.extend(zoneBounds(zone)), L.latLngBounds([]));
}

function FollowSelection({ zones, activeId }: { zones: HotspotZone[]; activeId: number | null }) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
    const active = zones.find((zone) => zone.cluster_id === activeId);
    const bounds = active ? zoneBounds(active) : allBounds(zones);
    if (!bounds.isValid()) return;

    // Snap into place on first load, then animate when the user picks a zone
    if (first.current) {
      first.current = false;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [36, 36], animate: false });
    } else {
      map.flyToBounds(bounds, { padding: [36, 36], duration: 0.6 });
    }
  }, [zones, activeId, map]);

  return null;
}

function KeepSized() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export default function ZoneMap({ zones, ranks, activeId, onSelect }: Props) {
  return (
    <div className="absolute inset-0">
      <MapContainer
        bounds={allBounds(zones)}
        boundsOptions={{ padding: [36, 36] }}
        scrollWheelZoom={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <AttributionControl prefix={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KeepSized />
        <FollowSelection zones={zones} activeId={activeId} />

        {zones.map((zone) => {
          const active = zone.cluster_id === activeId;
          const colour = RISK_COLOURS[zone.risk_band];
          return (
            <Circle
              key={zone.cluster_id}
              center={[zone.centre_lat, zone.centre_lon]}
              radius={zone.radius_km * 1000}
              pathOptions={{
                color: colour,
                weight: active ? 2.5 : 1.5,
                opacity: active || activeId === null ? 0.95 : 0.4,
                dashArray: active ? undefined : "4 5",
                fillColor: colour,
                fillOpacity: active ? 0.2 : 0.1,
              }}
              eventHandlers={{ click: () => onSelect(zone.cluster_id) }}
            >
              <Tooltip className="rich-tip">
                <div className="mb-0.5 font-medium">Zone {ranks.get(zone.cluster_id)}</div>
                <div className="text-text-secondary">{zone.total_collisions.toLocaleString()} collisions</div>
                <div className="text-text-secondary">{(zone.severe_rate * 100).toFixed(1)}% fatal or serious</div>
              </Tooltip>
            </Circle>
          );
        })}

        {zones.map((zone) => (
          <CircleMarker
            key={`centre-${zone.cluster_id}`}
            center={[zone.centre_lat, zone.centre_lon]}
            radius={zone.cluster_id === activeId ? 5 : 3.5}
            pathOptions={{
              color: RISK_COLOURS[zone.risk_band],
              fillColor: RISK_COLOURS[zone.risk_band],
              fillOpacity: 1,
              weight: 1,
              interactive: false,
            }}
          />
        ))}
      </MapContainer>

    </div>
  );
}
