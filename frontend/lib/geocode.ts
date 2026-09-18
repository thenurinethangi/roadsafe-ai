export interface Place {
  name: string;
  lat: number;
  lon: number;
}

// OpenStreetMap's free place search. Limited to Great Britain, the only area the model knows.
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&countrycodes=gb&limit=5&q=" +
    encodeURIComponent(query);

  const response = await fetch(url, { signal, headers: { "Accept-Language": "en" } });
  if (!response.ok) {
    return [];
  }

  const results: { display_name: string; lat: string; lon: string }[] = await response.json();
  return results.map((result) => ({
    name: result.display_name,
    lat: Number(result.lat),
    lon: Number(result.lon),
  }));
}

export function shortName(name: string) {
  return name.split(",").slice(0, 2).join(",").trim();
}
