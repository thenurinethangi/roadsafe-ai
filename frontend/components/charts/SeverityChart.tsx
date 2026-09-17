"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SeverityShare } from "@/lib/types";

export function SeverityChart({ data }: { data: SeverityShare[] }) {
  const rows = data.map((row) => ({
    name: row.label,
    Fatal: row.fatal_pct,
    Serious: row.serious_pct,
    Slight: row.slight_pct,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="#d7d0c0" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#12211a", fontSize: 11 }} unit="%" />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: "#12211a", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: "#d7d0c0" }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`]}
          />
          <Legend />
          <Bar dataKey="Fatal" stackId="sev" fill="#c2410c" />
          <Bar dataKey="Serious" stackId="sev" fill="#c47b16" />
          <Bar dataKey="Slight" stackId="sev" fill="#1f7a46" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
