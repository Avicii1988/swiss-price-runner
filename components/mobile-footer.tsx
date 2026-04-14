"use client";

import { ChevronUp } from "lucide-react";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";

/**
 * Compact mobile-only footer — logo + inline Back to Top.
 * Rendered for `<sm` breakpoints only; larger viewports keep the full
 * 4-column footer defined in app/layout.tsx.
 */
export function MobileFooter() {
  return (
    <div className="sm:hidden">
      <div className="rainbow-bar" />
      <footer className="bg-white px-5 py-6">
        <div className="flex items-center justify-between">
          <PreisAlarmLogo size="sm" />
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Zurück nach oben"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 active:bg-gray-50"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Nach oben
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-gray-300">
          &copy; {new Date().getFullYear()} PreisAlarm.ch
        </p>
      </footer>
    </div>
  );
}
