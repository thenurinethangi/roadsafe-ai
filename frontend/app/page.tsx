import { IconCloudRain, IconListCheck, IconRoute } from "@tabler/icons-react";
import JourneySearch from "@/components/JourneySearch";
import SiteFooter from "@/components/SiteFooter";

const BENEFITS = [
  {
    icon: IconRoute,
    title: "Every stretch scored",
    body: "Your route is split into sections, so you see exactly where the risk sits.",
  },
  {
    icon: IconCloudRain,
    title: "Conditions when you leave",
    body: "Forecast weather and daylight for the time you set off, not right now.",
  },
  {
    icon: IconListCheck,
    title: "Reasons, not just a number",
    body: "See why a stretch scores low, from speed limits to unlit roads.",
  },
];

export default function PlannerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="mb-4 text-[12px] uppercase tracking-[1.6px] text-text-muted">Route safety intelligence</p>
        <h1 className="mb-3 text-center text-[34px] font-medium leading-[1.2] tracking-[-0.9px] sm:text-[44px]">
          Not just the fastest route.
          <br />
          The safest one.
        </h1>
        <p className="text-center text-[16px] leading-relaxed text-text-secondary">
          Compare your routes before you set off, stretch by stretch.
        </p>

        <div className="mt-10 w-full max-w-[880px]">
          <JourneySearch />
        </div>
      </div>

      <div className="grid gap-px border-t-hair border-line bg-line sm:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex items-start gap-4 bg-surface-2 px-6 py-6 lg:px-10">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-chart-tint text-chart-strong">
              <benefit.icon size={19} stroke={1.5} />
            </span>
            <div>
              <div className="mb-1 text-[16px] font-medium">{benefit.title}</div>
              <div className="text-[14px] leading-[1.55] text-text-secondary">{benefit.body}</div>
            </div>
          </div>
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}
