"use client";

import { Camera, Sparkles } from "lucide-react";

/**
 * Compact AI Feature Callout — proves unique tech value to brand managers.
 */
export function AiFeatureCallout() {
  return (
    <section className="border-b border-gray-100 bg-white py-5">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-3 sm:px-5 lg:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100">
          <Camera className="h-4 w-4 text-violet-600" />
        </div>
        <p className="text-xs text-gray-500 sm:text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            KI-Bildsuche
          </span>
          {" "}— Lade ein Foto hoch und finde das günstigste Angebot in der Schweiz. Powered by OpenAI Vision.
        </p>
      </div>
    </section>
  );
}
