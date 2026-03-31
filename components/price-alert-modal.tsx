"use client";

import { useState } from "react";
import { X, Bell, Mail, Smartphone, SlidersHorizontal } from "lucide-react";
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
  const { product, bestPrice } = item;

  const [condition, setCondition] = useState<"below" | "drops_by_percent" | "drops_by_amount">("below");
  const [targetPrice, setTargetPrice] = useState(Math.floor(bestPrice.totalChf * 0.9));
  const [dropPercent, setDropPercent] = useState(10);
  const [dropAmount, setDropAmount] = useState(50);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(false);

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
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Preisalarm einrichten</h2>
              <p className="text-xs text-gray-400 line-clamp-1">{product.title}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-[10px] text-gray-400">Aktueller Bestpreis</p>
            <p className="text-lg font-bold text-gray-900">CHF {bestPrice.totalChf.toFixed(2)}</p>
          </div>
        </div>

        {/* Condition */}
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
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400"
                    />
                  </div>
                )}
              </label>

              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${condition === "drops_by_percent" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                <input type="radio" name="condition" checked={condition === "drops_by_percent"} onChange={() => setCondition("drops_by_percent")} className="accent-red-600" />
                <span className="flex-1">Preis sinkt um Prozent</span>
                {condition === "drops_by_percent" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={dropPercent}
                      onChange={(e) => setDropPercent(Number(e.target.value))}
                      min={1}
                      max={90}
                      className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400"
                    />
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
                    <input
                      type="number"
                      value={dropAmount}
                      onChange={(e) => setDropAmount(Number(e.target.value))}
                      min={1}
                      className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-xs font-semibold outline-none focus:border-red-400"
                    />
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

        {/* Submit */}
        <div className="border-t border-gray-100 p-5">
          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {isLoggedIn ? "Alarm aktivieren" : "Anmelden & Alarm setzen"}
          </button>
        </div>
      </div>
    </div>
  );
}
