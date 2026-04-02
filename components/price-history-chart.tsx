"use client";

import { useState, useMemo } from "react";
import type { MockPricePoint } from "@/lib/integrations/mock-service";
import type { MockProduct } from "@/prisma/seed";
import { generatePriceHistory } from "@/lib/integrations/mock-service";

interface PriceHistoryChartProps {
  product: MockProduct;
  history30d: MockPricePoint[];
  width?: number;
  height?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  amazon_de: "#FF9900",
  galaxus_ch: "#0D2B5E",
  zalando_de: "#FF6900",
};

const RANGES = [
  { key: "30d", label: "30 Tage", days: 30 },
  { key: "90d", label: "90 Tage", days: 90 },
  { key: "1y", label: "1 Jahr", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function PriceHistoryChart({
  product,
  history30d,
  width = 640,
  height = 280,
}: PriceHistoryChartProps) {
  const [activeRange, setActiveRange] = useState<RangeKey>("30d");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const history = useMemo(() => {
    if (activeRange === "30d") return history30d;
    const days = RANGES.find((r) => r.key === activeRange)!.days;
    return generatePriceHistory(product, days);
  }, [activeRange, product, history30d]);

  if (history.length === 0) return null;

  const sourceIds = [...new Set(history.map((p) => p.sourceId))];
  const dates = [...new Set(history.map((p) => p.date))].sort();

  const allChf = history.map((p) => p.amountChf);
  const dataMin = Math.min(...allChf);
  const dataMax = Math.max(...allChf);
  const padding = (dataMax - dataMin) * 0.12 || 5;
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;

  const ml = 58, mr = 16, mt = 12, mb = 42;
  const pw = width - ml - mr;
  const ph = height - mt - mb;

  const toX = (i: number) => ml + (i / Math.max(dates.length - 1, 1)) * pw;
  const toY = (v: number) => mt + ph - ((v - yMin) / (yMax - yMin)) * ph;

  // Y-axis ticks
  const yTicks: number[] = [];
  const yStep = (yMax - yMin) / 4;
  for (let i = 0; i <= 4; i++) yTicks.push(yMin + yStep * i);

  // X-axis labels
  const xStep = Math.max(1, Math.floor(dates.length / (activeRange === "1y" ? 6 : 4)));
  const xLabels: number[] = [];
  for (let i = 0; i < dates.length; i += xStep) xLabels.push(i);
  if (!xLabels.includes(dates.length - 1)) xLabels.push(dates.length - 1);

  // Build per-source polylines
  const lines = sourceIds.map((sid) => {
    const pts = dates.map((d, i) => {
      const m = history.find((p) => p.sourceId === sid && p.date === d);
      return m ? { x: toX(i), y: toY(m.amountChf), chf: m.amountChf } : null;
    }).filter(Boolean) as { x: number; y: number; chf: number }[];
    return { sid, pts };
  });

  // Hover data
  const hoverData = hoverIdx !== null
    ? sourceIds.map((sid) => {
        const pt = history.find((p) => p.sourceId === sid && p.date === dates[hoverIdx]);
        return pt ? { sid, name: pt.sourceName, chf: pt.amountChf } : null;
      }).filter(Boolean) as { sid: string; name: string; chf: number }[]
    : null;

  return (
    <div>
      {/* Range toggle */}
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
                activeRange === r.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Grid */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={ml} y1={toY(tick)} x2={width - mr} y2={toY(tick)} stroke="#f0f0f0" strokeWidth={0.5} />
              <text x={ml - 6} y={toY(tick) + 3} textAnchor="end" fontSize={8} fontFamily="system-ui" className="fill-gray-400">
                {tick.toFixed(0)}
              </text>
            </g>
          ))}
          <text x={ml - 6} y={mt - 3} textAnchor="end" fontSize={7} fontFamily="system-ui" className="fill-gray-400">CHF</text>

          {/* X labels */}
          {xLabels.map((idx) => (
            <text key={idx} x={toX(idx)} y={height - mb + 14} textAnchor="middle" fontSize={8} fontFamily="system-ui" className="fill-gray-400">
              {activeRange === "1y" ? dates[idx].slice(2, 7) : dates[idx].slice(5)}
            </text>
          ))}

          {/* Area + Lines */}
          {lines.map(({ sid, pts }) => {
            if (pts.length < 2) return null;
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            const fill = `${path} L${pts[pts.length - 1].x.toFixed(1)},${toY(yMin).toFixed(1)} L${pts[0].x.toFixed(1)},${toY(yMin).toFixed(1)} Z`;
            const col = SOURCE_COLORS[sid] ?? "#888";
            const last = pts[pts.length - 1];
            return (
              <g key={sid}>
                <path d={fill} fill={col} opacity={0.05} />
                <path d={path} fill="none" stroke={col} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={last.x} cy={last.y} r={3} fill={col} />
              </g>
            );
          })}

          {/* Hover column targets (invisible rects) */}
          {dates.map((_, i) => (
            <rect
              key={i}
              x={toX(i) - pw / dates.length / 2}
              y={mt}
              width={pw / dates.length}
              height={ph}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          ))}

          {/* Hover line */}
          {hoverIdx !== null && (
            <line x1={toX(hoverIdx)} y1={mt} x2={toX(hoverIdx)} y2={mt + ph} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="3,3" />
          )}

          {/* Legend */}
          {sourceIds.map((sid, i) => {
            const name = history.find((p) => p.sourceId === sid)?.sourceName ?? sid;
            const lx = ml + i * 100;
            return (
              <g key={`l-${sid}`}>
                <rect x={lx} y={height - 16} width={8} height={8} rx={2} fill={SOURCE_COLORS[sid] ?? "#888"} />
                <text x={lx + 12} y={height - 9} fontSize={8} fontFamily="system-ui" className="fill-gray-500">{name}</text>
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoverIdx !== null && hoverData && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg"
            style={{
              left: `${((toX(hoverIdx) / width) * 100).toFixed(1)}%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-[10px] font-medium text-gray-400">{dates[hoverIdx]}</p>
            {hoverData.map((d) => (
              <div key={d.sid} className="flex items-center gap-1.5 text-[10px]">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: SOURCE_COLORS[d.sid] }} />
                <span className="text-gray-600">{d.name}</span>
                <span className="ml-auto font-bold text-gray-900">CHF {d.chf.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
