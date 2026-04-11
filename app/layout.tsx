import type { Metadata } from "next";
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
        </AuthProvider>
        </LangProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
