"use client";

import Link from "next/link";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";

/**
 * Sticky mobile bottom bar — always visible on `<sm` breakpoints.
 *
 * Per the latest product direction, the bar is purely a brand anchor:
 * a single centered PreisAlarm logo (which contains the bell icon) that
 * links to the homepage. Utility actions (Favoriten, Merkliste, Account)
 * now live in the mobile header row 1, next to the logo, so the bottom
 * bar stays clean and doesn't duplicate controls.
 *
 * Body content reserves space for this bar: layout.tsx adds
 * `padding-bottom: calc(64px + env(safe-area-inset-bottom))` on the body.
 */
export function MobileStickyBar() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
        <Link
          href="/"
          aria-label="Startseite"
          className="flex h-11 items-center rounded-full px-4 transition active:scale-[0.98] active:bg-gray-100"
        >
          <PreisAlarmLogo size="sm" linkHome={false} />
        </Link>
      </div>
    </nav>
  );
}
