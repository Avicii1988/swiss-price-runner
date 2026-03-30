import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum – SwissPriceRunner",
  description: "Impressum und rechtliche Angaben von SwissPriceRunner.",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Branded header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight sm:text-lg">
            Swiss<span className="text-red-600">Price</span>Runner
          </Link>
          <Link
            href="/"
            className="text-xs text-gray-400 transition hover:text-gray-600"
          >
            &larr; Startseite
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Impressum
        </h1>
        <p className="mt-2 text-xs text-gray-400 sm:text-sm">
          Angaben gemäss Art. 3 Abs. 1 Bst. s UWG und Art. 5 E-Commerce-Verordnung
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700 sm:mt-10 sm:space-y-10">
          {/* Company info */}
          <section>
            <h2 className="text-base font-bold text-gray-900">Betreiber</h2>
            <div className="mt-3 space-y-1">
              <p className="font-semibold">SwissPriceRunner</p>
              <p>Musterstrasse 42</p>
              <p>8001 Zürich</p>
              <p>Schweiz</p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-base font-bold text-gray-900">Kontakt</h2>
            <div className="mt-3 space-y-1">
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:kontakt@swisspricerunner.ch"
                  className="text-red-600 hover:underline"
                >
                  kontakt@swisspricerunner.ch
                </a>
              </p>
              <p>Telefon: +41 44 000 00 00</p>
            </div>
          </section>

          {/* UID */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              Handelsregistereintrag
            </h2>
            <div className="mt-3 space-y-1">
              <p>Eingetragen im Handelsregister des Kantons Zürich</p>
              <p>UID: CHE-000.000.000</p>
            </div>
          </section>

          {/* MWST */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              Mehrwertsteuer-Nummer
            </h2>
            <p className="mt-3">CHE-000.000.000 MWST</p>
          </section>

          {/* Responsible for content */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              Verantwortlich für den Inhalt
            </h2>
            <div className="mt-3 space-y-1">
              <p>Max Muster, Geschäftsführer</p>
              <p>Musterstrasse 42, 8001 Zürich</p>
            </div>
          </section>

          {/* Affiliate Disclaimer */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <h2 className="text-base font-bold text-gray-900">
              Affiliate-Hinweis
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              SwissPriceRunner enthält sogenannte Affiliate-Links. Wenn du über
              diese Links ein Produkt kaufst, erhalten wir eine Provision vom
              jeweiligen Anbieter. Für dich entstehen dadurch keine zusätzlichen
              Kosten. Die Provisionen beeinflussen weder die Reihenfolge der
              angezeigten Produkte noch die dargestellten Preise. Wir vergleichen
              Preise unabhängig und transparent.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-base font-bold text-gray-900">Haftungsausschluss</h2>
            <p className="mt-3">
              Der Autor übernimmt keine Gewähr für die Richtigkeit, Genauigkeit,
              Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
            </p>
            <p className="mt-2">
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder
              immaterieller Art, die aus dem Zugriff oder der Nutzung bzw.
              Nichtnutzung der veröffentlichten Informationen, durch Missbrauch der
              Verbindung oder durch technische Störungen entstanden sind, werden
              ausgeschlossen.
            </p>
            <p className="mt-2">
              Alle Angebote sind freibleibend. Der Autor behält es sich ausdrücklich
              vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte
              Ankündigung zu verändern, zu ergänzen, zu löschen oder die
              Veröffentlichung zeitweise oder endgültig einzustellen.
            </p>
          </section>

          {/* External links */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              Haftungsausschluss für Links
            </h2>
            <p className="mt-3">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
              Verantwortungsbereichs. Es wird jegliche Verantwortung für solche
              Webseiten abgelehnt. Der Zugriff und die Nutzung solcher Webseiten
              erfolgen auf eigene Gefahr des jeweiligen Nutzers.
            </p>
          </section>

          {/* Copyright */}
          <section>
            <h2 className="text-base font-bold text-gray-900">Urheberrechte</h2>
            <p className="mt-3">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos
              oder anderen Dateien auf dieser Website gehören ausschliesslich
              SwissPriceRunner oder den speziell genannten Rechteinhabern. Für die
              Reproduktion jeglicher Elemente ist die schriftliche Zustimmung des
              Urheberrechtsträgers im Voraus einzuholen.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
