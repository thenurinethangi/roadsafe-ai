interface Props {
  totals: { fatal: number; serious: number; slight: number };
}

export default function SeverityMix({ totals }: Props) {
  const total = totals.fatal + totals.serious + totals.slight;
  const rows = [
    { label: "Fatal", value: totals.fatal, colour: "var(--chart-strong)" },
    { label: "Serious", value: totals.serious, colour: "var(--chart-base)" },
    { label: "Slight", value: totals.slight, colour: "var(--track-strong)" },
  ];
  const severe = totals.fatal + totals.serious;
  const oneIn = severe ? Math.round(total / severe) : null;

  return (
    <div className="flex h-full flex-col">
      {oneIn && (
        <p className="mb-7 text-[22px] font-medium leading-[1.3] tracking-[-0.4px]">
          1 in {oneIn} collisions left someone killed or seriously injured.
        </p>
      )}

      <div className="mb-6 flex h-3 overflow-hidden rounded-full" aria-hidden>
        {rows.map((row) => (
          <span
            key={row.label}
            className="h-full border-r-2 border-surface-card last:border-r-0"
            style={{ width: `${(row.value / total) * 100}%`, minWidth: row.value ? 4 : 0, backgroundColor: row.colour }}
          />
        ))}
      </div>

      <dl className="flex flex-col">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-t-hair border-line-soft py-3.5">
            <dt className="flex items-center gap-2.5 text-[14px] text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.colour }} />
              {row.label}
            </dt>
            <dd className="flex items-baseline gap-3 tabular-nums">
              <span className="text-[15px]">{row.value.toLocaleString()}</span>
              <span className="w-14 text-right text-[13px] text-text-muted">{((row.value / total) * 100).toFixed(1)}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
