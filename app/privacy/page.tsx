import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – SwissPrice",
  description:
    "Datenschutzerklärung von SwissPrice gemäss dem Schweizer Datenschutzgesetz (nDSG).",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Branded header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight sm:text-lg">
            SWISS<span className="text-red-600">PRICE</span>
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
          Datenschutzerklärung
        </h1>
        <p className="mt-2 text-xs text-gray-400 sm:text-sm">
          Gemäss dem Schweizer Bundesgesetz über den Datenschutz (nDSG, in Kraft
          seit 1. September 2023) und, soweit anwendbar, der EU-DSGVO.
        </p>
        <p className="mt-1 text-xs text-gray-400 sm:text-sm">Stand: 30. März 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-gray-700 sm:mt-10 sm:space-y-10">
          {/* 1. Verantwortliche Stelle */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              1. Verantwortliche Stelle
            </h2>
            <div className="mt-3 space-y-1">
              <p>Verantwortlich für die Datenbearbeitung auf dieser Website:</p>
              <p className="mt-2 font-semibold">SwissPrice</p>
              <p>Jan Feusi</p>
              <p>Falknisstrasse 47</p>
              <p>7304 Maienfeld, Schweiz</p>
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:jan.feusi[at]gmx.ch"
                  className="text-red-600 hover:underline"
                >
                  jan.feusi[at]gmx.ch
                </a>
              </p>
            </div>
          </section>

          {/* 2. Grundsätze */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              2. Grundsätze der Datenbearbeitung
            </h2>
            <p className="mt-3">
              Wir bearbeiten Personendaten im Einklang mit dem Schweizer
              Datenschutzgesetz (nDSG). Wir erheben nur diejenigen Personendaten,
              die für die Erbringung unserer Dienste erforderlich sind, und
              bearbeiten sie rechtmässig, nach Treu und Glauben sowie
              verhältnismässig (Art. 6 nDSG).
            </p>
          </section>

          {/* 3. Erhobene Daten */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              3. Welche Daten wir erheben
            </h2>
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  a) Automatisch erhobene Daten
                </h3>
                <p className="mt-1">
                  Beim Besuch unserer Website werden automatisch folgende Daten
                  erhoben und in Server-Logfiles gespeichert:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
                  <li>IP-Adresse (anonymisiert)</li>
                  <li>Datum und Uhrzeit des Zugriffs</li>
                  <li>Aufgerufene Seite / URL</li>
                  <li>Referrer-URL</li>
                  <li>Browser-Typ und -Version</li>
                  <li>Betriebssystem</li>
                </ul>
                <p className="mt-2">
                  Diese Daten sind technisch notwendig, um die Website
                  bereitzustellen, und werden nach 30 Tagen automatisch gelöscht.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">
                  b) Preisalarme (freiwillig)
                </h3>
                <p className="mt-1">
                  Wenn du einen Preisalarm einrichtest, speichern wir:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
                  <li>E-Mail-Adresse</li>
                  <li>Gewünschter Zielpreis</li>
                  <li>Verknüpftes Produkt</li>
                </ul>
                <p className="mt-2">
                  Rechtsgrundlage: Deine Einwilligung (Art. 6 Abs. 6 nDSG). Du
                  kannst den Alarm jederzeit deaktivieren, woraufhin deine Daten
                  gelöscht werden.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Zweck */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              4. Zweck der Datenbearbeitung
            </h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-gray-600">
              <li>Bereitstellung und Verbesserung der Website</li>
              <li>Preisvergleich und Berechnung der Schweizer Importkosten</li>
              <li>Versand von Preisalarm-Benachrichtigungen</li>
              <li>Erkennung und Behebung technischer Fehler</li>
              <li>Aggregierte, anonyme Nutzungsstatistiken</li>
            </ul>
          </section>

          {/* 5. Affiliate */}
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <h2 className="text-base font-bold text-gray-900">
              5. Affiliate-Links &amp; Drittanbieter
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              Unsere Website enthält Affiliate-Links zu Amazon.de (Amazon
              PartnerNet), Galaxus und Zalando. Wenn du auf einen solchen Link
              klickst, wird ein Cookie des jeweiligen Anbieters gesetzt, um die
              Zuordnung der Provision zu ermöglichen. Wir haben keinen Einfluss
              auf Art und Umfang der durch den Anbieter erhobenen Daten. Bitte
              beachte die jeweilige Datenschutzerklärung des Anbieters.
            </p>
          </section>

          {/* 6. Cookies */}
          <section>
            <h2 className="text-base font-bold text-gray-900">6. Cookies</h2>
            <p className="mt-3">
              Wir verwenden ausschliesslich technisch notwendige Cookies, die für
              den Betrieb der Website erforderlich sind (z.B. Spracheinstellung).
              Diese Cookies werden nicht für Tracking- oder Werbezwecke verwendet.
            </p>
            <p className="mt-2">
              Affiliate-Partner können eigene Cookies setzen, wenn du auf einen
              externen Link klickst. Siehe Abschnitt 5.
            </p>
          </section>

          {/* 7. Datenweitergabe */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              7. Weitergabe an Dritte
            </h2>
            <p className="mt-3">
              Wir geben Personendaten nur weiter, wenn dies für die Erbringung
              unserer Dienste erforderlich ist:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
              <li>
                <strong>Hosting:</strong> Vercel Inc., San Francisco, USA —
                Auftragsbearbeitung gemäss Art. 9 nDSG, mit angemessenen
                Garantien (Standardvertragsklauseln)
              </li>
              <li>
                <strong>Datenbank:</strong> Supabase Inc., San Francisco, USA —
                Verschlüsselte PostgreSQL-Datenbank
              </li>
            </ul>
            <p className="mt-2">
              Datenübermittlung ins Ausland: Soweit Daten in die USA übermittelt
              werden, stellen wir durch geeignete Garantien (Art. 16–17 nDSG)
              sicher, dass ein angemessenes Datenschutzniveau gewährleistet ist.
            </p>
          </section>

          {/* 8. Aufbewahrung */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              8. Aufbewahrungsdauer
            </h2>
            <p className="mt-3">
              Wir speichern Personendaten nur so lange, wie es für den jeweiligen
              Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten
              bestehen:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
              <li>Server-Logs: 30 Tage</li>
              <li>Preisalarm-Daten: bis zur Deaktivierung durch den Nutzer</li>
              <li>Preisdaten (anonymisiert): unbegrenzt</li>
            </ul>
          </section>

          {/* 9. Datensicherheit */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              9. Datensicherheit
            </h2>
            <p className="mt-3">
              Wir treffen angemessene technische und organisatorische Massnahmen
              zum Schutz deiner Personendaten (Art. 8 nDSG), insbesondere:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
              <li>TLS/SSL-Verschlüsselung der gesamten Website</li>
              <li>Verschlüsselte Datenbankverbindungen</li>
              <li>Regelmässige Sicherheitsupdates</li>
              <li>Zugriffsbeschränkung nach dem Need-to-know-Prinzip</li>
            </ul>
          </section>

          {/* 10. Rechte */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              10. Deine Rechte
            </h2>
            <p className="mt-3">Gemäss nDSG stehen dir folgende Rechte zu:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
              <li>
                <strong>Auskunftsrecht (Art. 25 nDSG):</strong> Du kannst
                jederzeit Auskunft über die von uns bearbeiteten Personendaten
                verlangen.
              </li>
              <li>
                <strong>Recht auf Datenherausgabe (Art. 28 nDSG):</strong> Du
                hast das Recht, deine Daten in einem gängigen elektronischen
                Format zu erhalten.
              </li>
              <li>
                <strong>Berichtigung:</strong> Du kannst die Berichtigung
                unrichtiger Personendaten verlangen.
              </li>
              <li>
                <strong>Löschung:</strong> Du kannst die Löschung deiner
                Personendaten verlangen, sofern keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </li>
              <li>
                <strong>Widerspruch:</strong> Du kannst der Bearbeitung deiner
                Daten jederzeit widersprechen.
              </li>
            </ul>
            <p className="mt-3">
              Zur Ausübung deiner Rechte kontaktiere uns unter:{" "}
              <a
                href="mailto:jan.feusi[at]gmx.ch"
                className="text-red-600 hover:underline"
              >
                jan.feusi[at]gmx.ch
              </a>
            </p>
          </section>

          {/* 11. Aufsichtsbehörde */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              11. Aufsichtsbehörde
            </h2>
            <p className="mt-3">
              Die zuständige Datenschutz-Aufsichtsbehörde ist der Eidgenössische
              Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB):
            </p>
            <div className="mt-2 space-y-1 text-gray-600">
              <p>Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter</p>
              <p>Feldeggweg 1</p>
              <p>3003 Bern</p>
              <p>Schweiz</p>
            </div>
          </section>

          {/* 12. Änderungen */}
          <section>
            <h2 className="text-base font-bold text-gray-900">
              12. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="mt-3">
              Wir behalten uns vor, diese Datenschutzerklärung jederzeit
              anzupassen. Die jeweils aktuelle Fassung gilt ab dem auf der Seite
              angegebenen Datum. Wir empfehlen, diese Seite regelmässig zu
              besuchen.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
