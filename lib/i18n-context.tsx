"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { LangCode } from "@/components/language-switcher";
import { t as translate } from "@/lib/i18n";

interface LangContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("de");

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "de" ? "de-CH" : l;
    }
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextType {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
