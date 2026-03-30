"use client";

import type { MockPricePoint } from "@/lib/integrations/mock-service";

interface PriceHistoryChartProps {
  history: MockPricePoint[];
  width?: number;
  height?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  amazon_de: "#FF9900",
  galaxus_ch: "#0D2B5E",
  zalando_de: "#FF6900",
};

export function PriceHistoryChart({
  history,
  width = 600,
  height = 260,
}: PriceHistoryChartProps) {
  if (history.length === 0) return null;

  const sourceIds = [...new Set(history.map((p) => p.sourceId))];
  const dates = [...new Set(history.map((p) => p.date))].sort();

  const allChf = history.map((p) => p.amountChf);
  const dataMin = Math.min(...allChf);
  const dataMax = Math.max(...allChf);
  const padding = (dataMax - dataMin) * 0.1 || 5;
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;

  const marginLeft = 62;
  const marginRight = 16;
  const marginTop = 16;
  const marginBottom = 36;
  const plotW = width - marginLeft - marginRight;
  const plotH = height - marginTop - marginBottom;

  function toX(i: number) {
    return marginLeft + (i / Math.max(dates.length - 1, 1)) * plotW;
  }
  function toY(v: number) {
    return marginTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
  }

  // Y-axis grid lines (5 steps)
  const yTicks: number[] = [];
  const yStep = (yMax - yMin) / 4;
  for (let i = 0; i <= 4; i++) {
    yTicks.push(yMin + yStep * i);
  }

  // X-axis labels (show every ~7 days)
  const xLabelIndices: number[] = [];
  const step = Math.max(1, Math.floor(dates.length / 4));
  for (let i = 0; i < dates.length; i += step) xLabelIndices.push(i);
  if (!xLabelIndices.includes(dates.length - 1)) xLabelIndices.push(dates.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={marginLeft}
            y1={toY(tick)}
            x2={width - marginRight}
            y2={toY(tick)}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
          <text
            x={marginLeft - 8}
            y={toY(tick) + 3.5}
            textAnchor="end"
            className="fill-gray-400"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {tick.toFixed(0)}
          </text>
        </g>
      ))}

      {/* CHF label */}
      <text
        x={marginLeft - 8}
        y={marginTop - 4}
        textAnchor="end"
        className="fill-gray-400"
        fontSize={8}
        fontFamily="system-ui, sans-serif"
      >
        CHF
      </text>

      {/* X-axis labels */}
      {xLabelIndices.map((idx) => {
        const d = dates[idx];
        const label = d.slice(5); // MM-DD
        return (
          <text
            key={idx}
            x={toX(idx)}
            y={height - 8}
            textAnchor="middle"
            className="fill-gray-400"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        );
      })}

      {/* Lines per source */}
      {sourceIds.map((sid) => {
        const points = dates.map((d, i) => {
          const match = history.find((p) => p.sourceId === sid && p.date === d);
          return match ? { x: toX(i), y: toY(match.amountChf) } : null;
        }).filter(Boolean) as { x: number; y: number }[];

        if (points.length < 2) return null;

        const path = points
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");

        // Fill area
        const fillPath = `${path} L${points[points.length - 1].x.toFixed(1)},${toY(yMin).toFixed(1)} L${points[0].x.toFixed(1)},${toY(yMin).toFixed(1)} Z`;

        const color = SOURCE_COLORS[sid] ?? "#888";
        const last = points[points.length - 1];

        return (
          <g key={sid}>
            <path d={fillPath} fill={color} opacity={0.06} />
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
          </g>
        );
      })}

      {/* Legend */}
      {sourceIds.map((sid, i) => {
        const name = history.find((p) => p.sourceId === sid)?.sourceName ?? sid;
        const lx = marginLeft + i * 110;
        return (
          <g key={`legend-${sid}`}>
            <rect
              x={lx}
              y={height - 20}
              width={8}
              height={8}
              rx={2}
              fill={SOURCE_COLORS[sid] ?? "#888"}
            />
            <text
              x={lx + 12}
              y={height - 13}
              className="fill-gray-600"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
            >
              {name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
