"use client";

import { FormEvent } from "react";

import { PlaceInput } from "@/components/PlaceInput";
import { DEMO_JOURNEYS } from "@/lib/places";
import type { Place } from "@/lib/types";

type JourneyFormProps = {
  fromQuery: string;
  toQuery: string;
  from: Place | null;
  to: Place | null;
  date: string;
  time: string;
  loading: boolean;
  onFromQuery: (value: string) => void;
  onToQuery: (value: string) => void;
  onFrom: (place: Place | null) => void;
  onTo: (place: Place | null) => void;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  onSubmit: () => void;
  onDemo: (from: Place, to: Place) => void;
};

export function JourneyForm({
  fromQuery,
  toQuery,
  from,
  to,
  date,
  time,
  loading,
  onFromQuery,
  onToQuery,
  onFrom,
  onDate,
  onTime,
  onTo,
  onSubmit,
  onDemo,
}: JourneyFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-cream p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2 lg:col-span-2">
          <PlaceInput
            id="from"
            label="From"
            placeholder="Manchester"
            value={from}
            query={fromQuery}
            onQueryChange={(value) => {
              onFromQuery(value);
              if (from && value !== from.name) onFrom(null);
            }}
            onSelect={onFrom}
          />
        </div>
        <div className="col-span-2 lg:col-span-2">
          <PlaceInput
            id="to"
            label="To"
            placeholder="Sheffield"
            value={to}
            query={toQuery}
            onQueryChange={(value) => {
              onToQuery(value);
              if (to && value !== to.name) onTo(null);
            }}
            onSelect={onTo}
          />
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => onDate(event.target.value)}
            className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="time" className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
            Time
          </label>
          <input
            id="time"
            type="time"
            value={time}
            onChange={(event) => onTime(event.target.value)}
            className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 outline-none ring-moss/30 focus:ring-2"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/55">
          Great Britain only. The model was trained on UK collision records, so
          a journey elsewhere would get a meaningless score.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full shrink-0 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-cream hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Analysing…" : "Analyse routes"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {DEMO_JOURNEYS.map((journey) => (
          <button
            key={journey.id}
            type="button"
            onClick={() => onDemo(journey.from, journey.to)}
            className="rounded-full border border-line px-3 py-1 text-xs text-ink/70 hover:border-moss hover:text-moss"
          >
            {journey.label}
          </button>
        ))}
      </div>
    </form>
  );
}
