"use client";

import { useEffect, useRef, useState } from "react";

import { searchPlaces } from "@/lib/api";
import type { Place } from "@/lib/types";

type PlaceInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: Place | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (place: Place) => void;
};

export function PlaceInput({
  id,
  label,
  placeholder,
  value,
  query,
  onQueryChange,
  onSelect,
}: PlaceInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipSearch = query.trim().length < 2 || Boolean(value && query === value.name);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (skipSearch) return;

    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(query)
        .then((places) => {
          setSuggestions(places);
          setOpen(true);
        })
        .finally(() => setSearching(false));
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, skipSearch]);

  const visible = skipSearch ? [] : suggestions;

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
        {label}
      </label>
      <input
        id={id}
        value={query}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => visible.length && setOpen(true)}
        className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-ink outline-none ring-moss/30 focus:ring-2"
      />
      {open && (visible.length > 0 || searching) && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-cream shadow-lg">
          {searching && (
            <li className="px-3 py-2 text-sm text-ink/50">Searching places…</li>
          )}
          {visible.map((place) => (
            <li key={`${place.name}-${place.lat}-${place.lon}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
                onClick={() => {
                  onSelect(place);
                  onQueryChange(place.name);
                  setOpen(false);
                }}
              >
                {place.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
