"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#06B6D4", "#14B8A6", "#0EA5E9", "#22D3EE", "#0891B2", "#0E7490", "#67E8F9", "#155E75", "#A5F3FC", "#5EEAD4", "#F59E0B", "#F43F5E"];

export function JobStatusChart({ data }: { data: { status: string; count: number; label?: string }[] }) {
  const filtered = data.filter((d) => d.count > 0);
  if (filtered.length === 0) return <p className="text-sm text-muted-foreground p-8 text-center">—</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={filtered} dataKey="count" nameKey="label" outerRadius={90} label>
          {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SalesByChannelChart({ data }: { data: { channel: string; total: number; label?: string }[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground p-8 text-center">—</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => Intl.NumberFormat("en", { notation: "compact" }).format(v)} />
        <Tooltip formatter={(v: any) => Intl.NumberFormat("en").format(v)} />
        <Bar dataKey="total" fill="#06B6D4" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
