"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "it", label: "Italiano", flag: "IT" },
  { code: "en", label: "English", flag: "EN" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

interface LanguageSwitcherProps {
  current: LangCode;
  onChange: (lang: LangCode) => void;
}

export function LanguageSwitcher({ current, onChange }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300"
      >
        <Globe className="h-3.5 w-3.5" />
        {LANGUAGES.find((l) => l.code === current)?.flag}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onChange(lang.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-gray-50 ${
                current === lang.code ? "font-semibold text-red-600" : "text-gray-700"
              }`}
            >
              <span className="w-5 text-center text-[10px] font-bold text-gray-400">
                {lang.flag}
              </span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
