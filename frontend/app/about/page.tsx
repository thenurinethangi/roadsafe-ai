"use client";

import {
  IconArrowRight,
  IconBarrierBlock,
  IconCar,
  IconCheck,
  IconCloud,
  IconCloudQuestion,
  IconCloudRain,
  IconDatabase,
  IconEyeOff,
  IconHistory,
  IconListCheck,
  IconMap2,
  IconMapPin,
  IconMoon,
  IconRoute,
  IconRoute2,
  IconRuler,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import { getInsights } from "@/lib/api";
import { HIGH_RISK_MAX_SCORE, levelForScore, LOW_RISK_MIN_SCORE, RISK_COLOURS, RISK_LABELS, RISK_ORDER } from "@/lib/risk";

const STEPS = [
  {
    icon: IconRoute,
    title: "We break your route into pieces",
    body: "Every few kilometres becomes its own section, judged on its own.",
  },
  {
    icon: IconCloudRain,
    title: "Then we check the conditions",
    body: "Rain, darkness, speed limit, junctions — for the hour you're actually travelling.",
  },
  {
    icon: IconHistory,
    title: "And what happened there before",
    body: "Police collision records for that stretch of road, going back five years.",
  },
  {
    icon: IconListCheck,
    title: "You see the reasons, not just a number",
    body: "If a section scores badly, we tell you exactly why.",
  },
];

const GAPS = [
  { icon: IconCar, title: "A busy road looks worse than it is", body: "We count collisions, not how many cars pass safely." },
  { icon: IconEyeOff, title: "Small crashes go unrecorded", body: "Minor knocks often never reach the police." },
  { icon: IconBarrierBlock, title: "Roads get fixed, history doesn't", body: "A junction rebuilt last year still carries its old record." },
  { icon: IconMapPin, title: "Great Britain only", body: "We have no data for roads outside it." },
  { icon: IconRuler, title: "We check points, not every metre", body: "A single bad junction can slip between them." },
  { icon: IconCloudQuestion, title: "Forecasts can be wrong", body: "Weather further ahead is less certain." },
];

const eyebrow = "mb-3 text-[12px] uppercase tracking-[1.6px] text-text-muted";
const card = "rounded-card border-hair border-line-soft bg-surface-card";
const tile = "grid h-10 w-10 shrink-0 place-items-center rounded-control bg-chart-tint text-chart-strong";

function SectionHeader({ label, title, intro }: { label: string; title: string; intro: string }) {
  return (
    <div className="mx-auto mb-12 max-w-[640px] text-center">
      <p className={eyebrow}>{label}</p>
      <h2 className="text-[32px] font-medium leading-[1.2] tracking-[-0.8px]">{title}</h2>
      <p className="mt-3 text-[17px] leading-[1.65] text-text-secondary">{intro}</p>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="px-6 py-16 lg:px-10 lg:py-20">{children}</section>;
}

// Sections along one path, in travel order. Colours follow the risk scale
const ROUTE_PATH = "M 48 318 C 150 322, 160 218, 262 206 S 382 118, 512 74";
const ROUTE_SECTIONS = [
  { from: 0, to: 22, level: "low" },
  { from: 22, to: 44, level: "moderate" },
  { from: 44, to: 70, level: "high" },
  { from: 70, to: 86, level: "moderate" },
  { from: 86, to: 100, level: "low" },
] as const;

function RouteIllustration() {
  return (
    <div className={`relative aspect-[7/5] w-full overflow-hidden ${card}`}>
      <svg viewBox="0 0 560 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="about-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--border-strong)" />
          </pattern>
        </defs>
        <rect width="560" height="400" fill="url(#about-dots)" />

        <path
          d="M 48 318 C 190 372, 330 318, 420 236 S 500 120, 512 74"
          fill="none"
          stroke="#8a8a84"
          strokeOpacity="0.45"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <path d={ROUTE_PATH} fill="none" stroke="#0b0b0a" strokeWidth="14" strokeLinecap="round" />
        {ROUTE_SECTIONS.map((section) => (
          <path
            key={section.from}
            d={ROUTE_PATH}
            pathLength={100}
            fill="none"
            stroke={RISK_COLOURS[section.level]}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${section.to - section.from - 1.4} 200`}
            strokeDashoffset={-(section.from + 0.7)}
          />
        ))}

        <circle cx="48" cy="318" r="7" fill="#171716" stroke="#f2f2f0" strokeWidth="2.5" />
        <circle cx="512" cy="74" r="7" fill="#f2f2f0" stroke="#171716" strokeWidth="2.5" />
      </svg>

      <div className="absolute bottom-[9%] right-[5%] hidden w-[52%] min-w-[220px] rounded-control border-hair border-line bg-surface-2 p-3.5 sm:block">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[14px] font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLOURS.high }} />
            Why this stretch
          </span>
          <span className="text-[11px] uppercase tracking-[0.9px] text-text-muted">Example</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span
            className="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-[13px]"
            style={{ background: "var(--bg-danger)", color: RISK_COLOURS.high }}
          >
            <IconMoon size={15} stroke={1.5} />
            Unlit after dark
          </span>
          <span
            className="flex items-center gap-2 rounded-control px-2.5 py-1.5 text-[13px]"
            style={{ background: "var(--bg-warning)", color: RISK_COLOURS.moderate }}
          >
            <IconCloudRain size={15} stroke={1.5} />
            Rain forecast
          </span>
        </div>
      </div>

      <div className="absolute left-[4%] top-[6%] flex gap-3.5 rounded-control border-hair border-line bg-surface-2 px-3 py-2">
        {RISK_ORDER.map((level) => (
          <span key={level} className="flex items-center gap-1.5">
            <span className="h-1.5 w-3.5 rounded-full" style={{ backgroundColor: RISK_COLOURS[level] }} />
            <span className="text-[12px] text-text-secondary">{RISK_LABELS[level]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const BANDS = [
  {
    level: "high" as const,
    from: 0,
    to: HIGH_RISK_MAX_SCORE,
    body: "Collisions here, in these conditions, tend to be more serious than on most roads.",
  },
  {
    level: "moderate" as const,
    from: HIGH_RISK_MAX_SCORE + 1,
    to: LOW_RISK_MIN_SCORE - 1,
    body: "About typical for roads in similar conditions.",
  },
  {
    level: "low" as const,
    from: LOW_RISK_MIN_SCORE,
    to: 100,
    body: "Collisions here, in these conditions, tend to be less serious than on most roads.",
  },
];

function ScoreExplorer() {
  const [score, setScore] = useState(74);
  const level = levelForScore(score);

  return (
    <div className="mx-auto max-w-[980px]">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="text-[72px] font-medium leading-none tracking-[-2px] tabular-nums">{score}</span>
        <span
          className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[14px]"
          style={{ backgroundColor: `${RISK_COLOURS[level]}26`, color: RISK_COLOURS[level] }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLOURS[level] }} />
          {RISK_LABELS[level]} risk
        </span>
        <span className="mt-4 text-[13px] text-text-muted">Drag the marker to try a score</span>
      </div>

      <div className="relative h-8">
        <input
          type="range"
          min={0}
          max={100}
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          aria-label="Example safety score"
          className="peer absolute inset-0 z-10 w-full cursor-pointer opacity-0"
        />
        <div className="absolute inset-x-0 top-1/2 flex h-2.5 -translate-y-1/2 gap-1.5">
          {BANDS.map((band) => (
            <span
              key={band.level}
              className="rounded-full transition-opacity duration-200"
              style={{
                flexGrow: band.to - band.from + 1,
                flexBasis: 0,
                backgroundColor: RISK_COLOURS[band.level],
                opacity: band.level === level ? 1 : 0.3,
              }}
            />
          ))}
        </div>
        <span
          className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-surface-2 bg-text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-border-accent"
          style={{ left: `${score}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-6 flex gap-1.5">
        {BANDS.map((band) => (
          <div
            key={band.level}
            className="min-w-0 px-1 transition-opacity duration-200"
            style={{ flexGrow: band.to - band.from + 1, flexBasis: 0, opacity: band.level === level ? 1 : 0.45 }}
          >
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[15px] font-medium">{RISK_LABELS[band.level]} risk</span>
              <span className="text-[13px] tabular-nums text-text-muted">
                {band.from}–{band.to}
              </span>
            </div>
            <p className="mt-1.5 hidden text-[14px] leading-[1.55] text-text-secondary sm:block">{band.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-[15px] leading-[1.6] text-text-secondary sm:hidden">
        {BANDS.find((band) => band.level === level)?.body}
      </p>
    </div>
  );
}

function PlanButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-control bg-fill-primary px-6 py-3.5 text-[16px] font-medium text-on-primary"
    >
      Plan a journey
      <IconArrowRight size={18} stroke={1.5} />
    </Link>
  );
}

export default function AboutPage() {
  const [collisions, setCollisions] = useState<number | null>(null);

  // The count comes from the API, never hardcoded
  useEffect(() => {
    getInsights()
      .then((insights) => setCollisions(insights.total_collisions))
      .catch(() => setCollisions(null));
  }, []);

  const sources = [
    {
      icon: IconDatabase,
      name: "Department for Transport",
      role: "Police collision records (STATS19), under the Open Government Licence v3.0",
      value: collisions === null ? null : `${collisions.toLocaleString()} collisions`,
    },
    { icon: IconRoute2, name: "OSRM", role: "Route options, distances and road speeds", value: null },
    { icon: IconCloud, name: "Open-Meteo", role: "Hourly weather forecast for your departure time", value: null },
    { icon: IconMap2, name: "OpenStreetMap", role: "Map tiles and place search", value: null },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <section className="grid w-full items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:px-10 lg:py-20">
        <div>
          <p className={eyebrow}>About RoadSafe</p>
          <h1 className="text-[36px] font-medium leading-[1.12] tracking-[-1px] sm:text-[48px]">
            <span className="text-text-secondary">Every map picks the fastest road.</span>
            <br />
            We look at the road itself.
          </h1>
          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.7] text-text-secondary">
            Same start, same destination, ten minutes apart — and one route has been far worse to drive on a wet night
            than the other. That difference was never shown to you. Now it is.
          </p>
          <div className="mt-8">
            <PlanButton />
          </div>
        </div>

        <RouteIllustration />
      </section>

      <div className="border-t-hair border-line" />

      <Section>
        <SectionHeader
          label="How it works"
          title="Four steps, every section"
          intro="Your route is never scored as one number. Each stretch of road is judged on its own."
        />

        <ol className="relative grid gap-12 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          <span className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-line xl:block" aria-hidden />
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border-hair border-line bg-surface-2 text-chart-strong">
                <step.icon size={21} stroke={1.5} />
              </span>
              <span className="mt-5 text-[12px] uppercase tracking-[1.4px] text-text-muted">Step {index + 1}</span>
              <h3 className="mt-2 text-[18px] font-medium">{step.title}</h3>
              <p className="mt-2 max-w-[300px] text-[15px] leading-[1.6] text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeader
          label="Reading the score"
          title="A comparison, not a prediction"
          intro="Every section and every route gets a score from 0 to 100. Higher is safer."
        />

        <ScoreExplorer />

        <div className="mx-auto mt-16 grid max-w-[980px] gap-x-12 gap-y-10 md:grid-cols-2">
          <div className="flex gap-4">
            <span className={tile}>
              <IconCheck size={19} stroke={1.5} />
            </span>
            <div>
              <h3 className="text-[17px] font-medium">What a higher score means</h3>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-text-secondary">
                Collisions on that stretch, at that time and in that weather, tend to be less serious than elsewhere.
                Use it to compare your route options.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className={tile}>
              <IconX size={19} stroke={1.5} />
            </span>
            <div>
              <h3 className="text-[17px] font-medium">What it doesn&apos;t mean</h3>
              <p className="mt-1.5 text-[15px] leading-[1.6] text-text-secondary">
                It isn&apos;t a chance of crashing, and a score of 90 isn&apos;t &ldquo;90% safe&rdquo;. No score here
                predicts whether something will happen to you.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          label="Good to know"
          title="Where we fall short"
          intro="Every source of data has gaps. These are the ones worth knowing before you rely on a score."
        />

        <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {GAPS.map((gap) => (
            <div key={gap.title} className="flex gap-4">
              <span className={tile}>
                <gap.icon size={19} stroke={1.5} />
              </span>
              <div>
                <h3 className="text-[17px] font-medium">{gap.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-text-secondary">{gap.body}</p>
              </div>
            </div>
          ))}
        </div>

      </Section>

      <Section>
        <SectionHeader
          label="Built on"
          title="Open data, openly credited"
          intro="Every score is traced back to public records and open services."
        />

        <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {sources.map((source) => (
            <div key={source.name} className="flex gap-4">
              <span className={tile}>
                <source.icon size={19} stroke={1.5} />
              </span>
              <div>
                <h3 className="text-[17px] font-medium">{source.name}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-text-secondary">{source.role}</p>
                {source.value && (
                  <span className="mt-3 inline-flex rounded-full bg-chart-tint px-3 py-1 text-[13px] tabular-nums text-chart-strong">
                    {source.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="px-6 pb-16 lg:px-10 lg:pb-20">
        <div className="flex flex-col items-center py-8 text-center">
          <h2 className="text-[32px] font-medium tracking-[-0.8px]">See it on your own journey</h2>
          <p className="mt-3 text-[17px] text-text-secondary">Compare your routes before you set off.</p>
          <div className="mt-8">
            <PlanButton />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
