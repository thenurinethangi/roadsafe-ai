"use client";

import {
  IconArrowLeft,
  IconArrowNarrowRight,
  IconClock,
  IconCloud,
  IconCloudRain,
  IconSnowflake,
  IconSun,
} from "@tabler/icons-react";
import Link from "next/link";
import { formatDayTime } from "@/lib/risk";

interface Props {
  from: string;
  to: string;
  departure: string;
  weather: string | null;
}

function weatherIcon(weather: string) {
  const text = weather.toLowerCase();
  if (text.includes("snow")) return <IconSnowflake size={16} stroke={1.5} />;
  if (text.includes("rain")) return <IconCloudRain size={16} stroke={1.5} />;
  if (text.includes("fog") || text.includes("no forecast")) return <IconCloud size={16} stroke={1.5} />;
  return <IconSun size={16} stroke={1.5} />;
}

export default function ResultsHeader({ from, to, departure, weather }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b-hair border-line px-6 py-3.5">
      <Link
        href="/"
        aria-label="Back to the journey planner"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-control border-hair border-line text-text-secondary transition-colors hover:border-line-strong hover:text-text-primary"
      >
        <IconArrowLeft size={18} stroke={1.5} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2.5 text-[17px] font-medium">
          <span className="truncate">{from}</span>
          <IconArrowNarrowRight size={18} stroke={1.5} className="shrink-0 text-text-muted" />
          <span className="truncate">{to}</span>
        </div>
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[15px] text-text-muted">
          <IconClock size={16} stroke={1.5} />
          {formatDayTime(departure)}
        </span>
      </div>

      {weather && (
        <div className="flex items-center gap-2 rounded-control bg-accent-bg px-3.5 py-2 text-accent-text">
          {weatherIcon(weather)}
          <span className="text-[14px]">{weather}</span>
        </div>
      )}
    </div>
  );
}
