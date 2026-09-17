import type { RouteSegment } from "./types";

function nearestIndex(geometry: [number, number][], lat: number, lon: number) {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  geometry.forEach(([pointLat, pointLon], index) => {
    const distance = (pointLat - lat) ** 2 + (pointLon - lon) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  });

  return best;
}

export function segmentPath(
  geometry: [number, number][],
  segment: RouteSegment,
): [number, number][] {
  if (geometry.length < 2) {
    return [
      [segment.start_lat, segment.start_lon],
      [segment.end_lat, segment.end_lon],
    ];
  }

  const start = nearestIndex(geometry, segment.start_lat, segment.start_lon);
  const end = nearestIndex(geometry, segment.end_lat, segment.end_lon);
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const slice = geometry.slice(from, to + 1);

  if (slice.length >= 2) return slice;

  return [
    [segment.start_lat, segment.start_lon],
    [segment.end_lat, segment.end_lon],
  ];
}

export function segmentMidpoint(path: [number, number][]): [number, number] {
  return path[Math.floor(path.length / 2)] ?? path[0];
}
