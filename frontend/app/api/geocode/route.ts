import { NextRequest, NextResponse } from "next/server";

import type { Place } from "@/lib/types";
import { inGreatBritain } from "@/lib/places";

type NominatimHit = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    suburb?: string;
    road?: string;
  };
};

function shortName(hit: NominatimHit) {
  const address = hit.address ?? {};
  const primary =
    hit.name ||
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.road ||
    hit.display_name.split(",")[0];

  const extra = hit.display_name
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== primary)
    .slice(0, 2)
    .join(", ");

  return extra ? `${primary}, ${extra}` : primary;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("limit", "6");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "RoadSafeAI/1.0 (ITS2140 university ML project)",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json([], { status: 200 });
  }

  const hits = (await res.json()) as NominatimHit[];
  const places: Place[] = hits
    .map((hit) => ({
      name: shortName(hit),
      lat: Number(hit.lat),
      lon: Number(hit.lon),
    }))
    .filter(
      (place) =>
        Number.isFinite(place.lat) &&
        Number.isFinite(place.lon) &&
        inGreatBritain(place.lat, place.lon),
    );

  return NextResponse.json(places);
}
