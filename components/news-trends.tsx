"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ARTICLES = [
  {
    slug: "top-5-spring-scents-2026",
    title: "Top 5 Frühlingsdüfte 2026",
    excerpt:
      "Entdecke die angesagtesten Parfums für die warme Jahreszeit — von Dior bis Chanel.",
    image:
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=340&fit=crop",
    category: "Beauty",
  },
  {
    slug: "on-running-guide-schweiz",
    title: "On Running: Der Schweizer Guide",
    excerpt:
      "Welcher On-Schuh passt zu deinem Laufstil? Modelle im Vergleich.",
    image:
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=340&fit=crop",
    category: "Sport",
  },
  {
    slug: "apple-iphone-2026-geruechte",
    title: "iPhone 2026: Was wir wissen",
    excerpt:
      "Alle Gerüchte, Leaks und Preiseinschätzungen für die Schweiz im Überblick.",
    image:
      "https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=600&h=340&fit=crop",
    category: "Tech",
  },
];

export function NewsTrends() {
  return (
    <section className="border-t border-gray-100 bg-gray-50/40 px-3 py-12 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            News &amp; Trends
          </h2>
          <span className="text-xs text-gray-400">Magazin</span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/impressum`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
            >
              {/* 16:9 image */}
              <div className="aspect-video overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.image}
                  alt={article.title}
                  width={600}
                  height={340}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0076bd]">
                  {article.category}
                </span>
                <h3 className="mt-1.5 text-sm font-bold text-slate-900 group-hover:text-[#0076bd]">
                  {article.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {article.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#0076bd]">
                  Weiterlesen <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
