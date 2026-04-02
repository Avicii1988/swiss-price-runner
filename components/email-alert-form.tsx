"use client";

import { useState } from "react";
import { Bell, Mail, CheckCircle2, Loader2 } from "lucide-react";

interface EmailAlertFormProps {
  productGtin: string;
  productTitle: string;
  currentPriceChf: number;
}

export function EmailAlertForm({
  productGtin,
  productTitle,
  currentPriceChf,
}: EmailAlertFormProps) {
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    Math.floor(currentPriceChf * 0.9),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          productId: productGtin, // mock — in prod this would be the DB ID
          gtin: productGtin,
          targetPrice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler beim Erstellen des Alarms");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
        <p className="mt-2 text-sm font-bold text-gray-900">Preisalarm aktiv!</p>
        <p className="mt-1 text-xs text-gray-500">
          Wir benachrichtigen <strong>{email}</strong> sobald der Preis unter
          CHF {targetPrice.toFixed(2)} fällt.
        </p>
        <button
          onClick={() => { setStatus("idle"); setEmail(""); }}
          className="mt-3 text-xs font-medium text-red-600 hover:underline"
        >
          Weiteren Alarm einrichten
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-red-50 via-white to-amber-50 p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
          <Bell className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">Preisalarm per E-Mail</p>
          <p className="text-[11px] text-gray-500">
            Kostenlos benachrichtigt werden, wenn der Preis fällt
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {/* Email input */}
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
          <Mail className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.ch"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Target price */}
        <div>
          <label className="text-[11px] font-medium text-gray-500">
            Benachrichtigen bei unter:
          </label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
            <span className="text-sm font-medium text-gray-400">CHF</span>
            <input
              type="number"
              required
              min={1}
              step={1}
              value={targetPrice}
              onChange={(e) => setTargetPrice(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none"
            />
          </div>
          {/* Quick picks */}
          <div className="mt-2 flex gap-2">
            {[5, 10, 15].map((pct) => {
              const price = Math.floor(currentPriceChf * (1 - pct / 100));
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTargetPrice(price)}
                  className={`flex-1 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
                    targetPrice === price
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  −{pct}% (CHF {price})
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {status === "error" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {errorMsg}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {status === "loading" ? "Wird aktiviert..." : "Alarm aktivieren"}
        </button>

        <p className="text-center text-[10px] text-gray-400">
          Kostenlos · Kein Spam · Jederzeit kündbar
        </p>
      </form>
    </div>
  );
}
