"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight, X } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export function CategoryNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 sm:px-3"
      >
        {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Kategorien</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Mega menu */}
          <div className="absolute left-0 top-full z-50 mt-2 w-[90vw] max-w-3xl rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:w-[600px]">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              Alle Kategorien
            </p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-red-50 group-hover:text-red-500">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-[10px] text-gray-400">{cat.productCount} Produkte</p>
                    </div>
                    <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-gray-300 group-hover:text-red-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
