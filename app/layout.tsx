import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth/auth-context";
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
              <div className="mt-4 flex items-center justify-center gap-10 sm:gap-14">
                <div className="text-center transition hover:opacity-80">
                  <p className="text-lg font-extrabold tracking-tight sm:text-xl" style={{ color: "#FF9900", letterSpacing: "-0.5px" }}>amazon</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">PartnerNet</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center transition hover:opacity-80">
                  <p className="text-lg font-extrabold tracking-tight sm:text-xl" style={{ color: "#0D2B5E", letterSpacing: "-0.5px" }}>Galaxus</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">Affiliate</p>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div className="text-center transition hover:opacity-80">
                  <p className="text-base font-bold uppercase tracking-[0.2em] sm:text-lg" style={{ color: "#FF6900" }}>Zalando</p>
                  <p className="mt-0.5 text-[8px] text-gray-400">Partner</p>
                </div>
              </div>
            </div>

            {/* Links + legal */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <PreisAlarmLogo size="sm" />
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-gray-500">
                  <Link href="/impressum" className="transition hover:text-gray-900">Impressum</Link>
                  <Link href="/privacy" className="transition hover:text-gray-900">Datenschutz</Link>
                  <Link href="/account" className="transition hover:text-gray-900">Mein Konto</Link>
                </nav>
              </div>
              <p className="mt-4 text-center text-[10px] leading-relaxed text-gray-400">
                &copy; {new Date().getFullYear()} Jan Feusi – PreisAlarm. Alle Rechte vorbehalten.
              </p>
              <p className="mt-1 text-center text-[10px] text-gray-400">
                Als Amazon-Partner verdiene ich an qualifizierten Verkäufen.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
