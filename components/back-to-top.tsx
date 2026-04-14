"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Floating "Back to top" — glass-morphism pill.
 *
 * Design spec (per product ask):
 *   - Glass-like semi-transparent circle (white/55 + blur-lg + thin ring)
 *   - Small, thin ChevronUp — minimalist boutique look
 *   - Fades in/out via opacity + translate-y after ~500 px scroll
 *   - Positioned bottom-right, offset above the mobile sticky bar so
 *     it never overlaps main navigation.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 500);
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
      className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white/55 text-gray-700 ring-1 ring-black/[0.04] backdrop-blur-lg transition-[opacity,transform] duration-300 ease-out hover:bg-white/80 hover:text-gray-900 active:scale-95 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      } bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6`}
      style={{
        // Soft dual-layer glow for the glass feel — inner highlight + outer drop
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -6px rgba(0,0,0,0.14)",
      }}
    >
      <ChevronUp className="h-[18px] w-[18px]" strokeWidth={1.5} />
    </button>
  );
}
