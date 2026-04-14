"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  // On mobile (<sm) the compact MobileFooter provides an inline "Nach oben"
  // button — no floating FAB needed to avoid overlapping content.
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Zurück nach oben"
      className="fixed bottom-6 right-6 z-30 hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-lg transition hover:bg-gray-50 hover:text-gray-900 sm:flex"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
