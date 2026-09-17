import type { Route, RouteSegment } from "@/lib/api";

export interface Section {
  segment: RouteSegment;
  points: [number, number][];
}

export function sectionsOf(route: Route): Section[] {
  const sections: Section[] = [];
  let from = 0;

  for (const segment of route.segments) {
    let to = from;
    // Each segment ends exactly on a point of the route line, so walk forward until we reach it
    while (
      to < route.geometry.length - 1 &&
      !(route.geometry[to][0] === segment.end_lat && route.geometry[to][1] === segment.end_lon)
    ) {
      to++;
    }
    sections.push({ segment, points: route.geometry.slice(from, to + 1) });
    from = to;
  }

  return sections;
}

// Measured along the real route line, not start to end in a straight line
export function sectionKm(points: [number, number][]) {
  const EARTH_KM = 6371;
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const [lat1, lon1] = points[i - 1];
    const [lat2, lon2] = points[i];
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    total += 2 * EARTH_KM * Math.asin(Math.sqrt(a));
  }

  return total;
}

export interface MeasuredSection extends Section {
  km: number;
}

export function measuredSections(route: Route): MeasuredSection[] {
  return sectionsOf(route).map((section) => ({ ...section, km: sectionKm(section.points) }));
}

export function lowestSection(route: Route) {
  let lowest = 0;
  route.segments.forEach((segment, index) => {
    if (segment.safety_score < route.segments[lowest].safety_score) lowest = index;
  });
  return lowest;
}
