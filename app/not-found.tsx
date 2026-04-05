import Link from "next/link";
import { SearchX, ArrowRight, Flame } from "lucide-react";
import { getFeaturedProducts } from "@/lib/integrations/mock-service";

export default function NotFound() {
  const deals = getFeaturedProducts().slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Preis<span className="text-red-600">Alarm</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
        <SearchX className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
          Seite nicht gefunden
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Zur Startseite
          </Link>
          <Link
            href="/category/smartphones"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
          >
            Kategorien
          </Link>
        </div>

        {/* Top Deals suggestions */}
        <div className="mt-14">
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Stattdessen: Unsere Top Deals
            </h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {deals.map((item) => (
              <Link
                key={item.product.gtin}
                href={`/product/${item.product.gtin}`}
                className="group rounded-xl border border-gray-100 bg-white p-3 transition hover:shadow-md hover:border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.imageUrl}
                  alt={item.product.title}
                  width={100}
                  height={100}
                  className="mx-auto h-20 w-20 object-contain transition-transform group-hover:scale-105"
                />
                <p className="mt-2 truncate text-xs font-semibold text-gray-900">
                  {item.product.title}
                </p>
                <p className="text-xs font-bold text-red-600">
                  CHF {item.bestPrice.totalChf.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400">{item.product.brand}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
