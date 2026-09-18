import { IconArrowRight, IconMapQuestion } from "@tabler/icons-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-6 grid h-14 w-14 place-items-center rounded-card bg-chart-tint text-chart-strong">
        <IconMapQuestion size={28} stroke={1.5} />
      </span>
      <h1 className="text-[32px] font-medium tracking-[-0.8px]">This page took a wrong turn</h1>
      <p className="mt-3 max-w-[440px] text-[16px] leading-[1.6] text-text-secondary">
        The page you were looking for does not exist. Plan a journey to compare your routes instead.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-control bg-fill-primary px-6 py-3.5 text-[16px] font-medium text-on-primary"
      >
        Plan a journey
        <IconArrowRight size={18} stroke={1.5} />
      </Link>
    </div>
  );
}
