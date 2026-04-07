import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth/auth-context";
import { NextAuthProvider } from "@/components/session-provider";
import { AuthModal } from "@/components/auth-modal";
import { BackToTop } from "@/components/back-to-top";
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
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de-CH">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <NextAuthProvider>
        <AuthProvider>
          <AuthModal />
          {children}
          <BackToTop />

          <footer className="border-t border-gray-200 bg-slate-50 pb-20 sm:pb-0">
            <div className="rainbow-bar" />

            {/* Partner Network */}
            <div className="border-b border-gray-200/60 py-6">
              <p className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                Partner-Netzwerk
              </p>
              <div className="mt-4 flex items-center justify-center gap-8 sm:gap-12">
                <div className="flex flex-col items-center gap-1 opacity-60 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 120 36" fill="none">
                    <text x="0" y="24" fontFamily="Helvetica Neue, sans-serif" fontSize="20" fontWeight="900" fill="#1e293b" letterSpacing="-0.5">amazon</text>
                    <path d="M38 28C50 33 72 35 92 29" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M88 26L93 29L88 32" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex flex-col items-center gap-1 opacity-60 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Helvetica Neue, sans-serif" fontSize="22" fontWeight="800" fill="#0D2B5E" letterSpacing="-0.5">Galaxus</text>
                  </svg>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex flex-col items-center gap-1 opacity-60 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Helvetica Neue, sans-serif" fontSize="18" fontWeight="700" fill="#FF6900" letterSpacing="2">ZALANDO</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer content */}
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {/* About */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <PreisAlarmLogo size="sm" />
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    Die Schweizer Vergleichsplattform für Lifestyle-Produkte.
                    Echte Endpreise inkl. Zoll, MwSt. und Lieferkosten.
                  </p>
                </div>

                {/* Legal */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Rechtliches</p>
                  <nav className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
                    <Link href="/impressum" className="transition hover:text-slate-900">Impressum</Link>
                    <Link href="/privacy" className="transition hover:text-slate-900">Datenschutz (nDSG)</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">AGB</Link>
                  </nav>
                </div>

                {/* Service */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Service</p>
                  <nav className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
                    <Link href="/account" className="transition hover:text-slate-900">Mein Konto</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">Über uns</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">FAQ</Link>
                  </nav>
                </div>

                {/* Trust */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Sicherheit</p>
                  <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0"><rect width="12" height="12" rx="1" fill="#D81E05"/><path d="M5 3h2v6H5z" fill="#fff"/><path d="M3 5h6v2H3z" fill="#fff"/></svg>
                      Swiss-hosted (Supabase Zürich)
                    </span>
                    <span>SSL-verschlüsselt</span>
                    <span>nDSG-konform</span>
                  </div>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <div className="mt-8 border-t border-gray-200/60 pt-5">
                <p className="text-[10px] leading-relaxed text-gray-400">
                  <strong className="font-semibold text-gray-500">Affiliate-Hinweis:</strong>{" "}
                  PreisAlarm.ch enthält Affiliate-Links zu Partnershops wie Amazon.de, Galaxus und Zalando.
                  Wenn du über einen dieser Links einkaufst, erhalten wir eine kleine Provision — für dich
                  entstehen keine Mehrkosten. Alle Preise werden in Echtzeit berechnet und enthalten
                  Schweizer MwSt. (8.1%), Zollgebühren und Lieferkosten. Wir empfehlen nur Produkte, die
                  wir selbst einem Preisvergleich unterzogen haben. Als Amazon-Partner verdienen wir an
                  qualifizierten Verkäufen. · Betreiber: Jan Feusi, Falknisstrasse 47, 7304 Maienfeld, Schweiz.
                </p>
              </div>

              {/* Copyright */}
              <div className="mt-4 border-t border-gray-200/60 pt-4">
                <p className="text-center text-[10px] text-gray-400">
                  &copy; {new Date().getFullYear()} PreisAlarm.ch — Preisvergleich Schweiz. Alle Rechte vorbehalten.
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
