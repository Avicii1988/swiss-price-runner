import { TrendingDown } from "lucide-react";

interface PriceDropBadgeProps {
  currentChf: number;
  avgChf30d: number;
}

export function PriceDropBadge({ currentChf, avgChf30d }: PriceDropBadgeProps) {
  if (avgChf30d <= 0 || currentChf >= avgChf30d) return null;

  const dropPercent = Math.round(((avgChf30d - currentChf) / avgChf30d) * 100);
  if (dropPercent < 2) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
      <TrendingDown className="h-3.5 w-3.5" />
      {dropPercent}% unter Durchschnitt
    </span>
  );
}
