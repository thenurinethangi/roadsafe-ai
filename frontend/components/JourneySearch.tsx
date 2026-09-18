"use client";

import {
  IconArrowRight,
  IconArrowsExchange,
  IconCalendar,
  IconCircle,
  IconClock,
  IconMapPin,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import PlaceField from "@/components/PlaceField";
import { Place, shortName } from "@/lib/geocode";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export default function JourneySearch() {
  const router = useRouter();

  const [fromText, setFromText] = useState("");
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toText, setToText] = useState("");
  const [toPlace, setToPlace] = useState<Place | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  // Set on the browser, not the server, so the default is the user's own clock
  useEffect(() => {
    const now = new Date();
    setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);

  function swap() {
    setFromText(toText);
    setFromPlace(toPlace);
    setToText(fromText);
    setToPlace(fromPlace);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!fromPlace || !toPlace) {
      setError("Choose both places from the suggestions list.");
      return;
    }
    if (fromPlace.lat === toPlace.lat && fromPlace.lon === toPlace.lon) {
      setError("Start and destination are the same place.");
      return;
    }
    if (!date || !time) {
      setError("Choose a date and a departure time.");
      return;
    }

    const query = new URLSearchParams({
      from: shortName(fromPlace.name),
      to: shortName(toPlace.name),
      from_lat: String(fromPlace.lat),
      from_lon: String(fromPlace.lon),
      to_lat: String(toPlace.lat),
      to_lon: String(toPlace.lon),
      departure: `${date}T${time}:00`,
    });

    router.push(`/results?${query}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-card bg-surface-1 p-1.5">
        <div className="mb-1.5 flex items-stretch rounded-control border-hair border-line bg-surface-2">
          <PlaceField
            id="from"
            label="FROM"
            placeholder="Town, city or postcode"
            icon={<IconCircle size={14} stroke={1.5} />}
            text={fromText}
            place={fromPlace}
            onTextChange={(value) => {
              setFromText(value);
              setFromPlace(null);
            }}
            onPick={(picked) => {
              setFromText(shortName(picked.name));
              setFromPlace(picked);
            }}
          />

          <div className="border-l-hair border-r-hair border-line">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap start and destination"
              className="flex h-full items-center px-2.5 text-text-muted hover:text-text-primary"
            >
              <IconArrowsExchange size={17} stroke={1.5} />
            </button>
          </div>

          <PlaceField
            id="to"
            label="TO"
            placeholder="Town, city or postcode"
            icon={<IconMapPin size={14} stroke={1.5} />}
            text={toText}
            place={toPlace}
            onTextChange={(value) => {
              setToText(value);
              setToPlace(null);
            }}
            onPick={(picked) => {
              setToText(shortName(picked.name));
              setToPlace(picked);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <label className="flex-1 rounded-control border-hair border-line bg-surface-2 px-5 py-3.5">
            <span className="mb-2 block text-[12px] tracking-[0.4px] text-text-muted">DATE</span>
            <span className="flex items-center gap-2">
              <IconCalendar size={14} stroke={1.5} className="text-text-secondary" />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full bg-transparent text-[16px] outline-none"
              />
            </span>
          </label>

          <label className="flex-1 rounded-control border-hair border-line bg-surface-2 px-5 py-3.5">
            <span className="mb-2 block text-[12px] tracking-[0.4px] text-text-muted">DEPART</span>
            <span className="flex items-center gap-2">
              <IconClock size={14} stroke={1.5} className="text-text-secondary" />
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full bg-transparent text-[16px] outline-none"
              />
            </span>
          </label>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-control bg-fill-primary px-8 py-3.5 text-[16px] font-medium text-on-primary"
          >
            Analyse
            <IconArrowRight size={18} stroke={1.5} />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[15px] text-risk-high">
          {error}
        </p>
      )}
    </form>
  );
}
