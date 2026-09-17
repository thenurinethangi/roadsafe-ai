"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Finding routes…",
  "Checking weather…",
  "Scoring each road section…",
];

export function LoadingStatus() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % STEPS.length);
    }, 1600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-cream px-5 py-8 text-center">
      <p className="font-serif text-xl text-ink">{STEPS[index]}</p>
      <p className="mt-2 text-sm text-ink/55">
        This can take a few seconds while we call routing, weather and the model.
      </p>
    </div>
  );
}
