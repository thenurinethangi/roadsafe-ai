import type { Place } from "./types";

export const GB_LAT = { min: 49, max: 61 };
export const GB_LON = { min: -8, max: 2 };

export const DEMO_JOURNEYS: Array<{
  id: string;
  label: string;
  note: string;
  from: Place;
  to: Place;
}> = [
  {
    id: "manchester-sheffield",
    label: "Manchester → Sheffield",
    note: "Demo journey from the specification",
    from: { name: "Manchester", lat: 53.4808, lon: -2.2426 },
    to: { name: "Sheffield", lat: 53.3811, lon: -1.4701 },
  },
  {
    id: "leeds-manchester",
    label: "Leeds → Manchester",
    note: "Pennines corridor",
    from: { name: "Leeds", lat: 53.8008, lon: -1.5491 },
    to: { name: "Manchester", lat: 53.4808, lon: -2.2426 },
  },
  {
    id: "birmingham-nottingham",
    label: "Birmingham → Nottingham",
    note: "Midlands A-roads vs motorway",
    from: { name: "Birmingham", lat: 52.4862, lon: -1.8904 },
    to: { name: "Nottingham", lat: 52.9548, lon: -1.1581 },
  },
];

export function inGreatBritain(lat: number, lon: number) {
  return (
    lat >= GB_LAT.min &&
    lat <= GB_LAT.max &&
    lon >= GB_LON.min &&
    lon <= GB_LON.max
  );
}

export function defaultDate() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
