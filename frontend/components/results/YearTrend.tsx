"use client";

interface Props {
  items: { year: number; collisions: number }[];
}

const WIDTH = 400;
const HEIGHT = 150;
const SIDE = 22;
const TOP = 30;
const BOTTOM = 30;

export function trendText(items: Props["items"]) {
  if (items.length < 2 || items[0].collisions === 0) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const change = Math.round(((last.collisions - first.collisions) / first.collisions) * 100);
  if (change === 0) return `No change since ${first.year}`;
  return `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% since ${first.year}`;
}

export default function YearTrend({ items }: Props) {
  const values = items.map((item) => item.collisions);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const spread = Math.max(high - low, high * 0.2, 1);
  const floor = Math.max(0, low - spread * 0.6);
  const ceiling = high + spread * 0.3;

  const x = (index: number) => SIDE + (index * (WIDTH - SIDE * 2)) / Math.max(items.length - 1, 1);
  const y = (value: number) => TOP + (1 - (value - floor) / (ceiling - floor)) * (HEIGHT - TOP - BOTTOM);
  const line = items.map((item, index) => `${index ? "L" : "M"} ${x(index)} ${y(item.collisions)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Collisions each year">
      <line
        x1={SIDE}
        x2={WIDTH - SIDE}
        y1={HEIGHT - BOTTOM}
        y2={HEIGHT - BOTTOM}
        stroke="var(--border-soft)"
        strokeWidth={1}
      />
      <path d={line} fill="none" stroke="var(--chart-strong)" strokeWidth={2} strokeLinejoin="round" />
      {items.map((item, index) => (
        <g key={item.year}>
          <circle
            cx={x(index)}
            cy={y(item.collisions)}
            r={4.5}
            fill="var(--surface-2)"
            stroke="var(--chart-strong)"
            strokeWidth={2}
          />
          <text
            x={x(index)}
            y={y(item.collisions) - 12}
            textAnchor="middle"
            fontSize={13}
            fill="var(--text-primary)"
            className="tabular-nums"
          >
            {item.collisions}
          </text>
          <text x={x(index)} y={HEIGHT - 8} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
            {item.year}
          </text>
        </g>
      ))}
    </svg>
  );
}
