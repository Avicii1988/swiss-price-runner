"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronRight, ChevronDown, X, Grid3X3 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

// Top-level groupings for the horizontal bar
const NAV_GROUPS = [
  { label: "Elektronik", slugs: ["smartphones", "laptops", "kopfhoerer", "tv-audio", "foto"] },
  { label: "Gaming", slugs: ["gaming"] },
  { label: "Haushalt", slugs: ["haushalt"] },
  { label: "Mode", slugs: ["schuhe", "mode"] },
  { label: "Beauty", slugs: ["beauty"] },
  { label: "Sport", slugs: ["sport"] },
  { label: "Uhren", slugs: ["uhren"] },
];

export function CategoryNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Horizontal category bar — desktop */}
      <nav className="hidden items-center gap-1 lg:flex">
        {NAV_GROUPS.map((group) => {
          const cats = CATEGORIES.filter((c) => group.slugs.includes(c.slug));
          if (cats.length === 0) return null;
          const firstSlug = cats[0].slug;
          return (
            <Link
              key={group.label}
              href={`/category/${firstSlug}`}
              className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {group.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          Mehr <ChevronDown className="h-3 w-3" />
        </button>
      </nav>

      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 lg:hidden"
      >
        {open ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Kategorien</span>
      </button>

      {/* Mega dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-xl sm:left-auto sm:right-auto sm:w-[680px] sm:rounded-b-2xl">
            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <Grid3X3 className="h-3.5 w-3.5" />
                  Alle Kategorien
                </p>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 lg:hidden">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition group-hover:bg-red-50 group-hover:text-red-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-[10px] text-gray-400">{cat.productCount} Produkte</p>
                      </div>
                      <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100 group-hover:text-red-400" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
