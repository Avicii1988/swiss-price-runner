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

          <footer className="border-t border-gray-100 bg-white pb-20 sm:pb-0">
            <div className="rainbow-bar" />

            {/* Partner Network */}
            <div className="border-b border-gray-100 bg-gray-50/40 py-8">
              <p className="text-center text-[8px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                Partner-Netzwerk
              </p>
              <div className="mt-5 flex items-center justify-center gap-10 sm:gap-14">
                <div className="opacity-50 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 120 36" fill="none">
                    <text x="0" y="24" fontFamily="Helvetica Neue, sans-serif" fontSize="20" fontWeight="900" fill="#1e293b" letterSpacing="-0.5">amazon</text>
                    <path d="M38 28C50 33 72 35 92 29" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M88 26L93 29L88 32" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="h-5 w-px bg-gray-200/80" />
                <div className="opacity-50 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Helvetica Neue, sans-serif" fontSize="22" fontWeight="800" fill="#0D2B5E" letterSpacing="-0.5">Galaxus</text>
                  </svg>
                </div>
                <div className="h-5 w-px bg-gray-200/80" />
                <div className="opacity-50 transition hover:opacity-100">
                  <svg className="h-5 sm:h-6" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Helvetica Neue, sans-serif" fontSize="18" fontWeight="700" fill="#FF6900" letterSpacing="2">ZALANDO</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer content — luxurious spacing */}
            <div className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-[1.5fr_1fr_1fr]">
                {/* Über uns */}
                <div>
                  <PreisAlarmLogo size="sm" />
                  <p className="mt-4 text-[13px] leading-relaxed text-gray-500">
                    PreisAlarm.ch ist die unabhängige Schweizer Preisvergleichsplattform für
                    Lifestyle, Technik und Beauty. Wir berechnen den echten Schweizer Endpreis —
                    inklusive Zoll, MwSt. und Lieferkosten.
                  </p>
                </div>

                {/* Rechtliches — centered */}
                <div className="sm:text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">Rechtliches</p>
                  <nav className="mt-4 flex flex-col gap-2.5 text-[13px] text-gray-500">
                    <Link href="/impressum" className="transition hover:text-slate-900">Impressum</Link>
                    <Link href="/privacy" className="transition hover:text-slate-900">Datenschutz (nDSG)</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">AGB</Link>
                  </nav>
                </div>

                {/* Service — centered */}
                <div className="sm:text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-700">Service</p>
                  <nav className="mt-4 flex flex-col gap-2.5 text-[13px] text-gray-500">
                    <Link href="/account" className="transition hover:text-slate-900">Mein Konto</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">Über uns</Link>
                    <Link href="/impressum" className="transition hover:text-slate-900">FAQ</Link>
                  </nav>
                </div>
              </div>

              {/* Affiliate Disclosure */}
              <div className="mt-10 border-t border-gray-100 pt-6">
                <p className="mx-auto max-w-2xl text-center text-[10px] leading-relaxed text-gray-400">
                  <strong className="font-semibold text-gray-500">Affiliate-Hinweis:</strong>{" "}
                  PreisAlarm.ch enthält Affiliate-Links. Beim Kauf über diese Links erhalten wir
                  eine kleine Provision — für dich entstehen keine Mehrkosten. Alle Preise inkl.
                  MwSt. (8.1%), Zoll und Lieferkosten. Als Amazon-Partner verdienen wir an
                  qualifizierten Verkäufen.
                </p>
              </div>

              {/* Copyright */}
              <div className="mt-5 pt-5">
                <p className="text-center text-[10px] tracking-wide text-gray-400">
                  &copy; {new Date().getFullYear()} PreisAlarm.ch — Preisvergleich Schweiz
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
