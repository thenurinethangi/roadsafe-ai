"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Plan a journey" },
  { href: "/insights", label: "Insights" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link href="/" className="group">
          <p className="font-serif text-lg tracking-tight text-ink">RoadSafe AI</p>
          <p className="text-xs text-ink/60 group-hover:text-ink/80">
            Safer routes, not just faster ones
          </p>
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 ${
                  active
                    ? "bg-moss text-cream"
                    : "text-ink/70 hover:bg-line/70 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
