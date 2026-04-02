"use client";

import { useState } from "react";
import {
  X,
  Calculator,
  ArrowRight,
  MinusCircle,
  RefreshCw,
  PlusCircle,
  Package,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export function HowWeCalculateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 transition hover:text-red-700"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Wie berechnen wir den Schweizer Preis?
      </button>

      {open && <HowWeCalculateModal onClose={() => setOpen(false)} />}
    </>
  );
}

function HowWeCalculateModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Calculator className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Schweizer Endpreis-Berechnung</h2>
              <p className="text-xs text-gray-500">
                So berechnen wir den echten Preis für die Schweiz
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-5 sm:p-6">
          {/* Example calculation */}
          <div className="mb-5 rounded-xl bg-gray-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Beispiel: Produkt auf Amazon.de</p>
            <p className="mt-1 text-lg font-bold text-gray-900">€ 100.00</p>
          </div>

          <div className="space-y-4">
            {/* Step 1: Remove DE-VAT */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
                <MinusCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Deutsche MwSt. entfernen</p>
                  <span className="font-mono text-sm font-bold text-green-600">− € 15.97</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Der deutsche Mehrwertsteuersatz von <strong>19%</strong> wird abgezogen,
                  da Schweizer Käufer keine DE-MwSt. schulden.
                </p>
                <div className="mt-1 rounded-lg bg-green-50 px-2 py-1">
                  <p className="font-mono text-xs text-green-700">€ 100.00 ÷ 1.19 = <strong>€ 84.03</strong> (netto)</p>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center text-gray-300">
              <ArrowRight className="h-3 w-3" />
            </div>

            {/* Step 2: EUR → CHF */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">EUR → CHF umrechnen</p>
                  <span className="font-mono text-sm font-bold text-blue-600">= CHF 79.03</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Umrechnung zum aktuellen Wechselkurs <strong>0.94 CHF/EUR</strong>.
                  Wir verwenden den tagesaktuellen Mittelkurs.
                </p>
                <div className="mt-1 rounded-lg bg-blue-50 px-2 py-1">
                  <p className="font-mono text-xs text-blue-700">€ 84.03 × 0.94 = <strong>CHF 79.03</strong></p>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center text-gray-300">
              <ArrowRight className="h-3 w-3" />
            </div>

            {/* Step 3: Add CH-VAT */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                <PlusCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Schweizer MwSt. addieren</p>
                  <span className="font-mono text-sm font-bold text-red-600">+ CHF 6.40</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Der Schweizer Normalsteuersatz von <strong>8.1%</strong> wird auf den
                  Nettobetrag in CHF erhoben.
                </p>
                <div className="mt-1 rounded-lg bg-red-50 px-2 py-1">
                  <p className="font-mono text-xs text-red-700">CHF 79.03 × 0.081 = <strong>CHF 6.40</strong></p>
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center text-gray-300">
              <ArrowRight className="h-3 w-3" />
            </div>

            {/* Step 4: Customs */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Zollgebühr (falls nötig)</p>
                  <span className="font-mono text-sm font-bold text-amber-600">+ CHF 11.50</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  Über <strong>CHF 65 Warenwert</strong> fällt eine Zollgebühr an.
                  Vereinfachte Verzollung: <strong>CHF 11.50</strong> pauschal.
                  Vollverzollung: CHF 18.00 + CHF 0.50/kg.
                </p>
                <div className="mt-1 rounded-lg bg-amber-50 px-2 py-1">
                  <p className="font-mono text-xs text-amber-700">Warenwert &gt; CHF 65 → <strong>CHF 11.50</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-5 rounded-xl border-2 border-gray-900 bg-gray-900 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Endpreis Schweiz</p>
            <p className="mt-1 text-2xl font-extrabold text-white">CHF 96.93</p>
            <p className="mt-1 text-xs text-gray-400">
              statt CHF 94.00 (naiver EUR→CHF)
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
              <ShieldCheck className="h-3 w-3" /> Transparent
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
              <Calculator className="h-3 w-3" /> Tagesaktuell
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
              <RefreshCw className="h-3 w-3" /> Live-Kurs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
