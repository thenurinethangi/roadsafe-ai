"use client";

interface Props {
  items: { day: string; collisions: number }[];
  highlight?: number;
}

export default function DayBars({ items, highlight }: Props) {
  const top = Math.max(1, ...items.map((item) => item.collisions));

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item, index) => {
        const strong = index === highlight;
        return (
          <li key={item.day} className="grid grid-cols-[88px_minmax(0,1fr)_40px] items-center gap-4">
            <span className={`text-[14px] ${strong ? "text-text-primary" : "text-text-secondary"}`}>{item.day}</span>
            <span className="h-2 overflow-hidden rounded-full bg-track">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(item.collisions / top) * 100}%`,
                  backgroundColor: strong ? "var(--chart-strong)" : "var(--chart-base)",
                }}
              />
            </span>
            <span className={`text-right text-[14px] tabular-nums ${strong ? "text-text-primary" : "text-text-secondary"}`}>
              {item.collisions}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
