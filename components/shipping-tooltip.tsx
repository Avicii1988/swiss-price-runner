"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { PriceBreakdown } from "@/lib/pricing/calculator";

interface ShippingTooltipProps {
  breakdown: PriceBreakdown;
  sourceId: string;
}

export function ShippingTooltip({ breakdown, sourceId }: ShippingTooltipProps) {
  const [show, setShow] = useState(false);
  // A DE-import row is any source whose breakdown started from a non-zero
  // EUR price. Our current Adtraction feeds all ship CHF-native, so they
  // short-circuit this tooltip to the "Schweizer Preis" view. The legacy
  // amazon_de / zalando_de sourceIds are gone — the EUR > 0 heuristic
  // replaces them and survives future EU-shop integrations.
  const isImport = breakdown.originalEur > 0;
  void sourceId;

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-gray-400 transition hover:text-gray-600"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {isImport ? "Importkosten-Berechnung" : "Schweizer Preis"}
          </p>

          <div className="mt-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Bruttopreis (EUR)</span>
              <span className="font-mono font-semibold">&euro; {breakdown.originalEur.toFixed(2)}</span>
            </div>
            {isImport && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">&minus; DE-MwSt. (19%)</span>
                  <span className="font-mono text-green-600">&minus; &euro; {(breakdown.originalEur - breakdown.netEur).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Netto (EUR)</span>
                  <span className="font-mono">&euro; {breakdown.netEur.toFixed(2)}</span>
                </div>
                <div className="border-t border-dashed border-gray-100 pt-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">EUR &rarr; CHF ({breakdown.exchangeRate})</span>
                    <span className="font-mono">CHF {breakdown.netChf.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">+ CH-MwSt. (8.1%)</span>
              <span className="font-mono text-red-500">+ CHF {breakdown.chVat.toFixed(2)}</span>
            </div>
            {breakdown.customsFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">+ Zollgebühr (vereinf.)</span>
                <span className="font-mono text-red-500">+ CHF {breakdown.customsFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-1.5">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Endpreis Schweiz</span>
                <span className="font-mono">CHF {breakdown.totalChf.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {isImport && (
            <p className="mt-2 text-[9px] leading-relaxed text-gray-400">
              Berechnung gem. Schweizer Zollrecht: DE-MwSt. wird abgezogen,
              CH-MwSt. (8.1%) und ggf. Zollgebühren (CHF 11.50 vereinfacht)
              werden addiert. Kurs: {breakdown.exchangeRate} CHF/EUR.
            </p>
          )}

          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gray-200 bg-white" />
        </div>
      )}
    </div>
  );
}
