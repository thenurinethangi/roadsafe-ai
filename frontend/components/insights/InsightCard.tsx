"use client";

import { IconAlertTriangle, IconChartBar, IconTable } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

interface Props {
  title: string;
  description?: string;
  aside?: ReactNode;
  table?: ReactNode;
  status?: "loading" | "error" | "ready";
  error?: string;
  loadingHeight?: number;
  children: ReactNode;
  className?: string;
}

export default function InsightCard({
  title,
  description,
  aside,
  table,
  status = "ready",
  error,
  loadingHeight = 260,
  children,
  className = "",
}: Props) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className={`flex min-w-0 flex-col rounded-card border-hair border-line-soft bg-surface-card ${className}`}>
      <header className="flex items-start justify-between gap-6 px-6 pt-5">
        <div className="min-w-0">
          <h2 className="text-[16px] font-medium">{title}</h2>
          {description && <p className="mt-1 text-[14px] leading-[1.55] text-text-muted">{description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {status === "ready" && aside}
          {table && status === "ready" && (
            <button
              type="button"
              onClick={() => setShowTable((current) => !current)}
              aria-pressed={showTable}
              aria-label={showTable ? "Show as chart" : "Show as table"}
              title={showTable ? "Show as chart" : "Show as table"}
              className="grid h-8 w-8 place-items-center rounded-control text-text-muted transition-colors hover:bg-track hover:text-text-primary"
            >
              {showTable ? <IconChartBar size={17} stroke={1.5} /> : <IconTable size={17} stroke={1.5} />}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-6 pb-6 pt-5">
        {status === "loading" && (
          <div className="animate-pulse rounded-control bg-track" style={{ height: loadingHeight }} aria-label="Loading" />
        )}
        {status === "error" && (
          <div role="alert" className="flex items-start gap-3 rounded-control bg-track px-4 py-4 text-[14px] text-text-secondary">
            <IconAlertTriangle size={18} stroke={1.5} className="mt-0.5 shrink-0 text-text-muted" />
            <span>Could not load this section. {error}</span>
          </div>
        )}
        {status === "ready" && (showTable && table ? table : children)}
      </div>
    </section>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-[340px] overflow-auto">
      <table className="w-full border-collapse text-[14px]">
        <thead className="sticky top-0 bg-surface-card">
          <tr>
            {head.map((label, index) => (
              <th
                key={label}
                scope="col"
                className={`pb-2.5 pr-4 text-[13px] font-normal text-text-muted last:pr-0 ${
                  index === 0 ? "text-left" : "text-right"
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t-hair border-line-soft">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`py-2.5 pr-4 last:pr-0 ${index === 0 ? "text-left" : "text-right tabular-nums text-text-secondary"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
