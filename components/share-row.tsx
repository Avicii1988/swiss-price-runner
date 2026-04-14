"use client";

import { useCallback, useEffect, useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

interface ShareRowProps {
  /** Display-title that will be included in the share payload. */
  title: string;
  /**
   * Absolute URL to share. If omitted, uses window.location.href on the client.
   * Pass an absolute URL when rendering server-side to avoid hydration drift.
   */
  url?: string;
  className?: string;
}

/** Minimal WhatsApp glyph — lucide-react doesn't ship one. */
function WhatsAppIcon({ className = "h-[16px] w-[16px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.02 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.02 0C5.495 0 .188 5.307.185 11.833c0 2.096.547 4.142 1.588 5.945L.057 24l6.335-1.652a11.88 11.88 0 0 0 5.679 1.447h.005c6.526 0 11.833-5.308 11.836-11.833a11.78 11.78 0 0 0-3.479-8.474z" />
    </svg>
  );
}

/** Minimal Telegram paper-plane glyph — lucide's Send is visually close but Telegram brand icon is preferred. */
function TelegramIcon({ className = "h-[16px] w-[16px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M9.036 15.558 8.728 19.9c.44 0 .63-.189.858-.416l2.06-1.968 4.27 3.126c.783.432 1.336.205 1.547-.724l2.803-13.137.001-.001c.249-1.159-.418-1.613-1.181-1.328L2.06 10.91c-1.128.44-1.112 1.07-.192 1.355l4.308 1.343 10.013-6.305c.471-.312.9-.14.547.173L9.036 15.558z" />
    </svg>
  );
}

/**
 * Share icon row — WhatsApp · Telegram · Copy Link.
 *
 * - Subtle, boutique styling: 40×40 icon buttons, light borders, hover lift.
 * - Meets the 44×44 touch target via a generous hit area on mobile.
 * - Copy feedback toggles the icon to a Check for 1.5 s.
 */
export function ShareRow({ title, url, className = "" }: ShareRowProps) {
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url || "");

  // Hydrate window.location.href on the client when a URL wasn't supplied.
  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [url]);

  const copyLink = useCallback(async () => {
    if (!currentUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        // Fallback for non-secure contexts / older browsers
        const ta = document.createElement("textarea");
        ta.value = currentUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silently ignore — clipboard may be blocked */
    }
  }, [currentUrl]);

  const encodedText = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(currentUrl);
  const whatsAppHref = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const telegramHref = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  const baseBtn =
    "flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white text-gray-500 transition hover:-translate-y-px hover:border-gray-300 hover:text-gray-900 active:scale-95";

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Teilen">
      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
        Teilen
      </span>
      <a
        href={whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Per WhatsApp teilen"
        className={baseBtn}
      >
        <WhatsAppIcon />
      </a>
      <a
        href={telegramHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Per Telegram teilen"
        className={baseBtn}
      >
        <TelegramIcon />
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link kopiert" : "Link kopieren"}
        className={baseBtn}
      >
        {copied ? (
          <Check className="h-[16px] w-[16px] text-green-600" strokeWidth={2} />
        ) : (
          <LinkIcon className="h-[16px] w-[16px]" />
        )}
      </button>
    </div>
  );
}
