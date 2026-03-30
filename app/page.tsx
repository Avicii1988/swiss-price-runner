import { Search } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Swiss<span className="text-red-600">Price</span>Runner
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Der echte Preisvergleich f&uuml;r die Schweiz &ndash; inkl. Zoll,
          MwSt. &amp; Lieferkosten.
        </p>

        <form
          action="/search"
          method="GET"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
        >
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="q"
            placeholder="Produkt, GTIN oder URL suchen..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Suchen
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-400">
          Amazon.de &middot; Zalando &middot; Galaxus &middot; und mehr
        </p>
      </div>
    </main>
  );
}
