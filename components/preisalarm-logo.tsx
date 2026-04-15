import Link from "next/link";

interface PreisAlarmLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  linkHome?: boolean;
}

/**
 * Standalone bell SVG — the PreisAlarm "mark" without the wordmark.
 * Use this wherever a symbol-only treatment is needed (CTA banners,
 * favicons, notifications), so the bell stays in lockstep with the
 * main logo. Avoid re-inlining the SVG elsewhere.
 */
export function PreisAlarmBell({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d="M18 3C12.5 3 8 7.5 8 13V21C8 21 7 22 6 23V24H30V23C29 22 28 21 28 21V13C28 7.5 23.5 3 18 3Z" fill="#E30613" />
      <path d="M14.5 26C14.5 28 16 30 18 30C20 30 21.5 28 21.5 26H14.5Z" fill="#E30613" />
      <rect x="16" y="9" width="4" height="10" rx="0.8" fill="white" />
      <rect x="13" y="12" width="10" height="4" rx="0.8" fill="white" />
      <path
        d="M12 11C12 8.5 14 6 17 5.2"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function PreisAlarmLogo({ className = "", size = "md", linkHome = true }: PreisAlarmLogoProps) {
  const sizes = {
    sm: { icon: 22, text: "text-base", gap: "gap-1.5" },
    md: { icon: 28, text: "text-xl", gap: "gap-2" },
    lg: { icon: 36, text: "text-2xl xl:text-[30px]", gap: "gap-2.5" },
    xl: { icon: 44, text: "text-3xl xl:text-[34px]", gap: "gap-3" },
  };
  const s = sizes[size];

  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <PreisAlarmBell size={s.icon} />
      <span className={`${s.text} font-black tracking-tight text-black`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif" }}>
        Preis<span className="text-[#E30613]">Alarm</span>
      </span>
    </span>
  );

  if (linkHome) {
    return <Link href="/" className="shrink-0">{content}</Link>;
  }
  return content;
}
