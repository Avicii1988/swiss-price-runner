import type { Metadata } from "next";
import Link from "next/link";
import { Instagram, Facebook, Youtube } from "lucide-react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LangProvider } from "@/lib/i18n-context";
import { NextAuthProvider } from "@/components/session-provider";
import { AuthModal } from "@/components/auth-modal";
import { BackToTop } from "@/components/back-to-top";
import { MobileStickyBar } from "@/components/mobile-sticky-bar";
import { PreisAlarmLogo } from "@/components/preisalarm-logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreisAlarm – Preisvergleich Schweiz",
  description:
    "Preise vergleichen auf Amazon.de, Zalando und Galaxus. Echter Schweizer Endpreis inkl. Zoll, MwSt. und Lieferkosten.",
  keywords: [
    "Preisvergleich",
    "Schweiz",
    "PreisAlarm",
    "Amazon",
    "Galaxus",
    "Zalando",
    "CHF",
    "Preisalarm",
    "Zoll",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180" },
    ],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

// Minimal inline TikTok glyph — lucide-react doesn't ship one.
function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.321 5.562a5.124 5.124 0 0 1-5.16-4.964h-3.376v13.705a3.09 3.09 0 1 1-3.09-3.09c.17 0 .337.016.5.045V7.82a6.466 6.466 0 0 0-.5-.02 6.465 6.465 0 1 0 6.465 6.465V8.158a8.475 8.475 0 0 0 5.161 1.748V6.53a5.09 5.09 0 0 1 0-.968z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/preisalarm.ch", label: "Instagram", Icon: Instagram },
  { href: "https://www.tiktok.com/@preisalarm.ch", label: "TikTok", Icon: TikTokIcon },
  { href: "https://www.facebook.com/preisalarm.ch", label: "Facebook", Icon: Facebook },
  { href: "https://www.youtube.com/@preisalarm", label: "YouTube", Icon: Youtube },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de-CH">
      {/*
        Body reserves 64 + safe-area for the mobile sticky bar so scrollable
        content is never hidden behind it. Desktop (sm+) removes the padding.
      */}
      <body
        className="min-h-screen bg-white text-gray-900 antialiased"
        style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
      >
        <NextAuthProvider>
        <LangProvider>
        <AuthProvider>
          <AuthModal />
          {children}
          <BackToTop />
          <MobileStickyBar />

          {/* ═══ Global Footer — visible on ALL breakpoints, stacked on mobile ═══ */}
          <div className="rainbow-bar" />
          <footer className="bg-white px-5 py-10 sm:px-6 sm:py-12">
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 text-[12px] text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <PreisAlarmLogo size="sm" />
                <p className="mt-3 leading-relaxed">
                  Dein neutraler Schweizer Preisvergleich für Beauty, Parfum &amp; Lifestyle.
                  Transparent, unabhängig, mit Echtzeit-Alarmen.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Rechtliches</p>
                <nav className="mt-3 flex flex-col gap-1.5">
                  <Link href="/impressum" className="transition hover:text-gray-600 hover:underline">Impressum</Link>
                  <Link href="/privacy" className="transition hover:text-gray-600 hover:underline">Datenschutz (nDSG)</Link>
                  <Link href="/impressum" className="transition hover:text-gray-600 hover:underline">AGB</Link>
                </nav>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Service</p>
                <nav className="mt-3 flex flex-col gap-1.5">
                  <Link href="/" className="transition hover:text-gray-600 hover:underline">Preisalarm setzen</Link>
                  <Link href="/shops" className="transition hover:text-gray-600 hover:underline">Shop-Übersicht</Link>
                  <Link href="/brands" className="transition hover:text-gray-600 hover:underline">Marken-Übersicht</Link>
                  <a href="mailto:bugs@preisalarm.ch" className="transition hover:text-gray-600 hover:underline">Bug melden</a>
                </nav>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Folge uns</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.06] text-gray-500 transition hover:-translate-y-px hover:border-gray-300 hover:text-gray-900"
                    >
                      <Icon className="h-[16px] w-[16px]" />
                    </a>
                  ))}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Partner-Shops</p>
                <nav className="mt-2 flex flex-col gap-1.5">
                  <span>XXL Parfum · Parfumsale</span>
                  <span>Import Parfumerie · Coop Vitality</span>
                  <span>New Balance · Parfum.ch · Ackermann</span>
                </nav>
              </div>
            </div>
            <div className="mx-auto mt-8 max-w-[1400px] border-t border-[#f0f0f2] pt-5 text-center text-[10px] text-gray-300">
              &copy; {new Date().getFullYear()} PreisAlarm.ch — Preisvergleich Schweiz
            </div>
          </footer>
        </AuthProvider>
        </LangProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
