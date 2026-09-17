"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { hourLabel } from "@/lib/format";
import type { HourCount } from "@/lib/types";

export function HourChart({ data }: { data: HourCount[] }) {
  const rows = data.map((row) => ({
    ...row,
    label: hourLabel(row.hour),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="#d7d0c0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" interval={2} tick={{ fill: "#12211a", fontSize: 11 }} />
          <YAxis tick={{ fill: "#12211a", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: "#d7d0c0" }}
            formatter={(value) => [Number(value).toLocaleString(), "Collisions"]}
          />
          <Bar dataKey="collisions" fill="#215c3b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
