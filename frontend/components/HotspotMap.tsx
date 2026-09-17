"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { RISK_COLOUR } from "@/lib/risk";
import type { HotspotZone } from "@/lib/types";

function FitHotspots({ hotspots }: { hotspots: HotspotZone[] }) {
  const map = useMap();

  useEffect(() => {
    if (!hotspots.length) return;
    const bounds = hotspots.map(
      (zone) => [zone.centre_lat, zone.centre_lon] as [number, number],
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [hotspots, map]);

  return null;
}

export default function HotspotMap({ hotspots }: { hotspots: HotspotZone[] }) {
  return (
    <MapContainer
      center={[53.4, -1.9]}
      zoom={9}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitHotspots hotspots={hotspots} />
      {hotspots.map((zone) => (
        <Circle
          key={zone.cluster_id}
          center={[zone.centre_lat, zone.centre_lon]}
          radius={Math.max(zone.radius_km, 0.8) * 1000}
          pathOptions={{
            color: RISK_COLOUR[zone.risk_band] ?? RISK_COLOUR.moderate,
            fillColor: RISK_COLOUR[zone.risk_band] ?? RISK_COLOUR.moderate,
            fillOpacity: 0.22,
            weight: 2,
          }}
        >
          <Popup>
            <div className="space-y-1 p-3 text-sm text-ink">
              <p className="font-semibold">Cluster {zone.cluster_id}</p>
              <p>{zone.total_collisions.toLocaleString()} collisions in this zone</p>
              <p>
                {(zone.severe_rate <= 1
                  ? zone.severe_rate * 100
                  : zone.severe_rate
                ).toFixed(1)}
                % were fatal or serious
              </p>
              <p className="capitalize">{zone.risk_band} risk band</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
