"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import { Place, searchPlaces } from "@/lib/geocode";

interface Props {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  text: string;
  place: Place | null;
  onTextChange: (text: string) => void;
  onPick: (place: Place) => void;
}

export default function PlaceField({ id, label, placeholder, icon, text, place, onTextChange, onPick }: Props) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (place || text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    // Wait for typing to pause: the free place search allows one request per second
    const timer = setTimeout(() => {
      searchPlaces(text, controller.signal)
        .then((places) => {
          setSuggestions(places);
          setActive(0);
          setOpen(true);
        })
        .catch(() => {});
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, place]);

  function handleKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onPick(suggestions[active]);
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative flex-1 px-5 py-3.5">
      <label htmlFor={id} className="mb-2 block text-[12px] tracking-[0.4px] text-text-muted">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <span className="text-text-primary">{icon}</span>
        <input
          id={id}
          value={text}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onChange={(event) => onTextChange(event.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeys}
          className="w-full bg-transparent text-[16px] outline-none placeholder:text-text-muted"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-2 right-2 top-full z-20 mt-1 max-h-60 overflow-auto rounded-control border-hair border-line bg-surface-2 py-1 text-[15px]"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.lat},${suggestion.lon},${index}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(suggestion);
                  setOpen(false);
                }}
                onMouseEnter={() => setActive(index)}
                className={`block w-full px-3 py-2 text-left ${index === active ? "bg-surface-1" : ""}`}
              >
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
