"use client";

import Link from "next/link";
import { Heart, User } from "lucide-react";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";

/**
 * Sticky mobile bottom bar — always visible on `<sm` breakpoints.
 *
 * Layout: [Favoriten] · [PreisAlarm Logo+Bell (central)] · [Account]
 *
 * - Fixed to bottom of viewport, safe-area-inset respected.
 * - All touch targets are a minimum of 44×44 px per Apple HIG.
 * - Light, semi-transparent bar with backdrop-blur so products
 *   underneath can faintly show through (boutique aesthetic).
 *
 * Body content must leave room for this bar: layout.tsx adds
 * `pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0` on the body.
 */
export function MobileStickyBar() {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        {/* Left — Favoriten */}
        <Link
          href="/account"
          aria-label="Favoriten"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition active:scale-95 active:bg-gray-100"
        >
          <Heart className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </Link>

        {/* Center — PreisAlarm brand (logo already contains the bell icon) */}
        <Link
          href="/"
          aria-label="Startseite"
          className="flex h-11 items-center rounded-full px-3 transition active:scale-[0.98] active:bg-gray-100"
        >
          <PreisAlarmLogo size="sm" linkHome={false} />
        </Link>

        {/* Right — Account */}
        <Link
          href="/account"
          aria-label="Account"
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 transition active:scale-95 active:bg-gray-100"
        >
          <User className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </Link>
      </div>
    </nav>
  );
}
