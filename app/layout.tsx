import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwissPriceRunner – Price Comparison for Switzerland",
  description:
    "Compare prices across Amazon.de, Zalando, and Galaxus. See the real landed cost in CHF including VAT, customs, and shipping.",
  keywords: [
    "price comparison",
    "Switzerland",
    "Preisvergleich",
    "Schweiz",
    "Amazon",
    "Galaxus",
    "Zalando",
    "CHF",
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
        {children}
      </body>
    </html>
  );
}
