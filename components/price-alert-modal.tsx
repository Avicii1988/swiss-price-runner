"use client";

import { useState } from "react";
import {
  X, Bell, Mail, Smartphone, SlidersHorizontal,
  TrendingDown, CheckCircle2, Zap, Clock, Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import type { MockProductWithHistory } from "@/lib/integrations/mock-service";

interface PriceAlertModalProps {
  item: MockProductWithHistory;
  onClose: () => void;
}

const SOURCE_OPTIONS = [
  { id: null, label: "Alle Quellen" },
  { id: "amazon_de", label: "Amazon.de" },
  { id: "galaxus_ch", label: "Galaxus" },
  { id: "zalando_de", label: "Zalando" },
];

export function PriceAlertModal({ item, onClose }: PriceAlertModalProps) {
  const { isLoggedIn, setShowAuthModal, addAlert } = useAuth();
  const { product, bestPrice, avgChf30d, priceDrop30d } = item;

  // Smart defaults based on product data
  const fivePercentBelow = Math.floor(bestPrice.totalChf * 0.95);
  const tenPercentBelow = Math.floor(bestPrice.totalChf * 0.9);
  const allTimeLowEstimate = Math.floor(bestPrice.totalChf * 0.85);

  const [condition, setCondition] = useState<"below" | "drops_by_percent" | "drops_by_amount">("below");
  const [targetPrice, setTargetPrice] = useState(tenPercentBelow);
  const [dropPercent, setDropPercent] = useState(10);
  const [dropAmount, setDropAmount] = useState(50);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!isLoggedIn) {
      onClose();
      setShowAuthModal(true);
      return;
    }

    const conditionValue =
      condition === "below" ? targetPrice :
      condition === "drops_by_percent" ? dropPercent : dropAmount;

    addAlert({
      gtin: product.gtin,
      productTitle: product.title,
      targetPriceChf: targetPrice,
      condition,
      conditionValue,
      notifyEmail,
      notifyPush,
      sourceFilter,
    });

    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">Alarm aktiviert!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Wir benachrichtigen dich bei{" "}
            {condition === "below" && `unter CHF ${targetPrice}`}
            {condition === "drops_by_percent" && `${dropPercent}% Preissenkung`}
            {condition === "drops_by_amount" && `CHF ${dropAmount} Preissenkung`}
            {" "}für:
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900">{product.title}</p>
          <div className="mt-3 flex justify-center gap-2">
            {notifyEmail && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-600">E-Mail</span>}
            {notifyPush && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-600">Push</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Header ── */}
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">Preisalarm einrichten</h2>
              <p className="truncate text-xs text-gray-400">{product.title}</p>
            </div>
          </div>

          {/* Price context bar */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-center">
              <p className="text-[9px] font-medium uppercase text-gray-400">Aktuell</p>
              <p className="text-sm font-bold text-gray-900">CHF {bestPrice.totalChf.toFixed(0)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-center">
              <p className="text-[9px] font-medium uppercase text-gray-400">Ø 30 Tage</p>
              <p className="text-sm font-bold text-gray-500">CHF {avgChf30d.toFixed(0)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-2.5 py-2 text-center">
              <p className="text-[9px] font-medium uppercase text-gray-400">30d Trend</p>
              <p className={`text-sm font-bold ${priceDrop30d > 0 ? "text-green-600" : "text-red-500"}`}>
                {priceDrop30d > 0 ? "−" : "+"}{Math.abs(priceDrop30d).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Smart Quick Picks ── */}
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Zap className="h-3 w-3" /> Schnellauswahl
          </p>
          <div className="mt-2 flex gap-2">
            {[
              { label: "−5%", price: fivePercentBelow, icon: Target },
              { label: "−10%", price: tenPercentBelow, icon: TrendingDown },
              { label: "Tiefstwert", price: allTimeLowEstimate, icon: Clock },
            ].map(({ label, price, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { setCondition("below"); setTargetPrice(price); }}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-center transition ${
                  condition === "below" && targetPrice === price
                    ? "border-red-300 bg-red-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-700">{label}</span>
                <span className="text-xs font-bold text-gray-900">CHF {price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Condition ── */}
        <div className="space-y-4 p-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Alarm-Bedingung
            </div>
            <div className="mt-2 space-y-2">
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${condition === "below" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="radio" name="condition" checked={condition === "below"} onChange={() => setCondition("below")} className="accent-red-600" />
                <span className="flex-1">Preis fällt unter Zielpreis</span>
                {condition === "below" && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">CHF</span>
                    <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(Number(e.target.value))} className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400" />
                  </div>
                )}
              </label>

              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${condition === "drops_by_percent" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="radio" name="condition" checked={condition === "drops_by_percent"} onChange={() => setCondition("drops_by_percent")} className="accent-red-600" />
                <span className="flex-1">Preis sinkt um Prozent</span>
                {condition === "drops_by_percent" && (
                  <div className="flex items-center gap-1">
                    <input type="number" value={dropPercent} onChange={(e) => setDropPercent(Number(e.target.value))} min={1} max={90} className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400" />
                    <span className="text-gray-400">%</span>
                  </div>
                )}
              </label>

              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${condition === "drops_by_amount" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="radio" name="condition" checked={condition === "drops_by_amount"} onChange={() => setCondition("drops_by_amount")} className="accent-red-600" />
                <span className="flex-1">Preis sinkt um Betrag</span>
                {condition === "drops_by_amount" && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">CHF</span>
                    <input type="number" value={dropAmount} onChange={(e) => setDropAmount(Number(e.target.value))} min={1} className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Source filter */}
          <div>
            <p className="text-xs font-semibold text-gray-700">Quelle</p>
            <select
              value={sourceFilter ?? ""}
              onChange={(e) => setSourceFilter(e.target.value || null)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-red-400"
            >
              {SOURCE_OPTIONS.map((s) => (
                <option key={s.id ?? "all"} value={s.id ?? ""}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Notification preferences */}
          <div>
            <p className="text-xs font-semibold text-gray-700">Benachrichtigung</p>
            <div className="mt-1.5 flex gap-3">
              <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${notifyEmail ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="accent-red-600" />
                <Mail className="h-3.5 w-3.5 text-gray-500" />
                E-Mail
              </label>
              <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition ${notifyPush ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="accent-red-600" />
                <Smartphone className="h-3.5 w-3.5 text-gray-500" />
                Push
              </label>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="border-t border-gray-100 p-5">
          <button
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <Bell className="h-4 w-4" />
            {isLoggedIn ? "Alarm aktivieren" : "Anmelden & Alarm setzen"}
          </button>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            Kostenlos · Jederzeit kündbar · Kein Spam
          </p>
        </div>
      </div>
    </div>
  );
}
