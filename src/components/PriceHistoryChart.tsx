"use client";

import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { formatPrice } from "@/lib/utils";
import type { PricePoint } from "@/lib/types";

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function label(date: string) {
  const [y, m] = date.split("-");
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}

interface TipProps {
  active?: boolean;
  payload?: { payload: PricePoint }[];
}

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label(p.date)}</p>
      <p className="font-serif text-base font-semibold tabular-nums">{formatPrice(p.price)}</p>
    </div>
  );
}

export function PriceHistoryChart({ data, current }: { data: PricePoint[]; current: number }) {
  const min = Math.min(...data.map((d) => d.price));
  const max = Math.max(...data.map((d) => d.price));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8a33d" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#e8a33d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={label} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis domain={[Math.floor(min * 0.95), Math.ceil(max * 1.03)]} tickFormatter={(v) => `${v}€`} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<Tip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
          <ReferenceLine y={current} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="price" stroke="#e8a33d" strokeWidth={2.5} fill="url(#priceFill)" dot={false} activeDot={{ r: 5, fill: "#e8a33d", stroke: "var(--background)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
