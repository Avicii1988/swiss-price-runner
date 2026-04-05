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

          <footer className="border-t border-gray-200 bg-white pb-20 sm:pb-0">
            <div className="rainbow-bar" />

            {/* Partner logos */}
            <div className="border-b border-gray-100 py-6">
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Partner-Netzwerk
              </p>
              <div className="mt-4 flex items-center justify-center gap-8 sm:gap-12">
                {/* Amazon — wordmark + smile */}
                <div className="flex flex-col items-center gap-1 transition hover:opacity-80">
                  <svg className="h-6 sm:h-7" viewBox="0 0 120 36" fill="none">
                    <text x="0" y="24" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="900" fill="#232F3E" letterSpacing="-0.5">amazon</text>
                    <path d="M38 28C50 33 72 35 92 29" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M88 26L93 29L88 32" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[8px] text-gray-400">PartnerNet</span>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                {/* Galaxus — brand navy */}
                <div className="flex flex-col items-center gap-1 transition hover:opacity-80">
                  <svg className="h-6 sm:h-7" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="800" fill="#0D2B5E" letterSpacing="-0.5">Galaxus</text>
                  </svg>
                  <span className="text-[8px] text-gray-400">Affiliate</span>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                {/* Zalando — orange with triangle accent */}
                <div className="flex flex-col items-center gap-1 transition hover:opacity-80">
                  <svg className="h-6 sm:h-7" viewBox="0 0 110 28" fill="none">
                    <text x="0" y="22" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" fill="#FF6900" letterSpacing="2">ZALANDO</text>
                  </svg>
                  <span className="text-[8px] text-gray-400">Partner</span>
                </div>
              </div>
            </div>

            {/* About + Links */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                {/* About */}
                <div>
                  <PreisAlarmLogo size="sm" />
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">
                    PreisAlarm ist die Schweizer Vergleichsplattform für Lifestyle-Produkte.
                    Wir helfen dir, die besten Deals bei Parfum, Mode, Elektronik und mehr
                    zu finden — inklusive Zoll, MwSt. und Lieferkosten in die Schweiz.
                  </p>
                </div>
                {/* Links */}
                <div>
                  <p className="text-xs font-bold text-gray-700">Links</p>
                  <nav className="mt-2 flex flex-col gap-1.5 text-xs text-gray-500">
                    <Link href="/impressum" className="transition hover:text-gray-900">Impressum</Link>
                    <Link href="/privacy" className="transition hover:text-gray-900">Datenschutz</Link>
                    <Link href="/account" className="transition hover:text-gray-900">Mein Konto</Link>
                  </nav>
                </div>
                {/* Kategorien */}
                <div>
                  <p className="text-xs font-bold text-gray-700">Beliebte Kategorien</p>
                  <nav className="mt-2 flex flex-col gap-1.5 text-xs text-gray-500">
                    <Link href="/category/parfum" className="transition hover:text-gray-900">Parfum & Düfte</Link>
                    <Link href="/category/mode" className="transition hover:text-gray-900">Mode & Schuhe</Link>
                    <Link href="/category/smartphones" className="transition hover:text-gray-900">Smartphones</Link>
                    <Link href="/category/haushalt" className="transition hover:text-gray-900">Haushalt & Küche</Link>
                  </nav>
                </div>
              </div>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-center text-[10px] text-gray-400">
                  &copy; {new Date().getFullYear()} Jan Feusi – PreisAlarm. Alle Rechte vorbehalten.
                  · Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.
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
