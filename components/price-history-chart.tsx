"use client";

import { useMemo, useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
} from "recharts";
import type { MockPricePoint } from "@/lib/integrations/mock-service";
import type { MockProduct } from "@/prisma/seed";
import { generatePriceHistory } from "@/lib/integrations/mock-service";
import { getShopSource } from "@/lib/shop-sources";

interface PriceHistoryChartProps {
  product: MockProduct;
  history30d: MockPricePoint[];
}

// Shop colour / label lookups now go through the shared shop-sources
// registry so every new feed (Jelmoli, Bergfreunde, Mobilezone, …)
// picks up its proper branding without touching this file.
const colorFor = (sid: string) => getShopSource(sid).color;
const labelFor = (sid: string) => getShopSource(sid).name;

const RANGES = [
  { key: "30d", label: "30 Tage", days: 30 },
  { key: "90d", label: "90 Tage", days: 90 },
  { key: "1y", label: "1 Jahr", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

// Custom tooltip — deduplicated
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  // Deduplicate by dataKey (Area + Line both produce entries)
  const seen = new Set<string>();
  const unique = payload.filter((entry) => {
    if (seen.has(entry.dataKey)) return false;
    seen.add(entry.dataKey);
    return true;
  });
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
      {unique.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5 text-[11px]">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-600">{labelFor(entry.dataKey)}</span>
          <span className="ml-auto font-bold text-gray-900">CHF {entry.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export function PriceHistoryChart({ product, history30d }: PriceHistoryChartProps) {
  const [activeRange, setActiveRange] = useState<RangeKey>("90d");

  const history = useMemo(() => {
    if (activeRange === "30d") return history30d;
    const days = RANGES.find((r) => r.key === activeRange)!.days;
    return generatePriceHistory(product, days);
  }, [activeRange, product, history30d]);

  // Pivot: { date, <sourceId1>, <sourceId2>, … } — one column per shop.
  const sourceIds = useMemo(() => [...new Set(history.map((p) => p.sourceId))], [history]);
  const chartData = useMemo(() => {
    const dates = [...new Set(history.map((p) => p.date))].sort();
    return dates.map((date) => {
      const row: Record<string, string | number> = {
        date: activeRange === "1y" ? date.slice(2, 7) : date.slice(5),
      };
      for (const sid of sourceIds) {
        const pt = history.find((p) => p.sourceId === sid && p.date === date);
        if (pt) row[sid] = pt.amountChf;
      }
      return row;
    });
  }, [history, sourceIds, activeRange]);

  if (chartData.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">
          Preisverlauf (CHF inkl. Zoll &amp; MwSt.)
        </p>
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setActiveRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
                activeRange === r.key ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pure LineChart — no Area, no duplicates */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }}
            interval={Math.max(0, Math.floor(chartData.length / 5) - 1)} />
          <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
            label={{ value: "CHF", position: "insideTopLeft", offset: -5, style: { fontSize: 8, fill: "#9ca3af" } }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value: string) => labelFor(value)} />
          {sourceIds.map((sid) => (
            <Line key={sid} type="monotone" dataKey={sid} stroke={colorFor(sid)}
              strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
