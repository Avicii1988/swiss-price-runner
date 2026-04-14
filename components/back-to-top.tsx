"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Floating "Back to top" pill — semi-transparent, backdrop-blurred.
 *
 * - Shown on all breakpoints after the user scrolls ~500 px.
 * - Fades in/out via opacity so it never "pops" on the page.
 * - Rendered to the bottom-right corner, offset above the mobile
 *   sticky bar (64 px) so it never overlaps main navigation.
 * - 44×44 touch target, thin ChevronUp glyph, boutique feel.
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
      className={`fixed z-40 flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white/70 text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[opacity,transform] duration-300 ease-out hover:bg-white hover:text-gray-900 active:scale-95 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      } bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6`}
    >
      <ChevronUp className="h-[18px] w-[18px]" strokeWidth={1.5} />
    </button>
  );
}
