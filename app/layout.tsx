import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LangProvider } from "@/lib/i18n-context";
import { NextAuthProvider } from "@/components/session-provider";
import { AuthModal } from "@/components/auth-modal";
import { BackToTop } from "@/components/back-to-top";
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
        <LangProvider>
        <AuthProvider>
          <AuthModal />
          {children}
          <BackToTop />

          {/* ═══ Global Footer ═══ */}
          <div className="rainbow-bar" />
          <footer className="bg-white px-4 py-10 sm:px-6">
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 text-[12px] text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <a href="/" className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4 text-[#D81E05]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  <span className="text-[15px] font-black tracking-tight text-gray-900">Preis<span className="text-[#D81E05]">Alarm</span></span>
                </a>
                <p className="mt-3 leading-relaxed">Dein neutraler Schweizer Preisvergleich für Beauty, Parfum & Lifestyle. Transparent, unabhängig, mit Echtzeit-Alarmen.</p>
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
                  <Link href="/" className="transition hover:text-gray-600 hover:underline">Shop-Übersicht</Link>
                  <a href="mailto:bugs@preisalarm.ch" className="transition hover:text-gray-600 hover:underline">Bug melden</a>
                </nav>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Partner-Shops</p>
                <nav className="mt-3 flex flex-col gap-1.5">
                  <span>XXL Parfum</span>
                  <span>Parfumsale</span>
                  <span>Import Parfumerie</span>
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
