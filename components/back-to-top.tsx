"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Elegant back-to-top circle — fixed bottom-right, appears after
 * scrolling 400 px. Subtle gray circle with arrow, fades in with
 * a smooth translate. No glass morphism — clean and minimal.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Zurück nach oben"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-lg transition-all duration-300 ease-out hover:border-gray-400 hover:text-gray-900 hover:shadow-xl active:scale-95 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2} />
    </button>
  );
}
