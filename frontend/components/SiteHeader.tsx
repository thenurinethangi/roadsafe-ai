"use client";

import { IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Plan" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b-hair border-line px-6 py-4 lg:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <IconShieldCheck size={22} stroke={1.5} className="text-text-primary" />
        <span className="text-[17px] font-medium tracking-[-0.2px]">RoadSafe</span>
      </Link>

      <nav className="flex gap-6 text-[15px] text-text-secondary">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" || pathname === "/results" : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={active ? "text-text-primary" : "hover:text-text-primary"}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
