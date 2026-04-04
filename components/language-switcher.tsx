"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "🇨🇭" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

interface LanguageSwitcherProps {
  current: LangCode;
  onChange: (lang: LangCode) => void;
}

export function LanguageSwitcher({ current, onChange }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active = LANGUAGES.find((l) => l.code === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100"
        title={active?.label}
      >
        <Globe className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sprache</p>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { onChange(lang.code); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                  current === lang.code ? "font-semibold text-gray-900" : "text-gray-600"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
                {current === lang.code && <span className="ml-auto text-xs text-red-600">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
