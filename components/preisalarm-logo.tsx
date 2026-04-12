import Link from "next/link";

interface PreisAlarmLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  linkHome?: boolean;
}

export function PreisAlarmLogo({ className = "", size = "md", linkHome = true }: PreisAlarmLogoProps) {
  const sizes = {
    sm: { icon: 22, text: "text-base", gap: "gap-1.5" },
    md: { icon: 26, text: "text-lg", gap: "gap-2" },
    lg: { icon: 32, text: "text-2xl xl:text-[28px]", gap: "gap-2" },
  };
  const s = sizes[size];

  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Modern bell with Swiss cross negative-space cutout */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        {/* Bell body — rounded, modern shape */}
        <path d="M18 3C12.5 3 8 7.5 8 13V21C8 21 7 22 6 23V24H30V23C29 22 28 21 28 21V13C28 7.5 23.5 3 18 3Z" fill="#E30613" />
        {/* Bell clapper */}
        <path d="M14.5 26C14.5 28 16 30 18 30C20 30 21.5 28 21.5 26H14.5Z" fill="#E30613" />
        {/* Swiss cross — white negative space on bell */}
        <rect x="16" y="9" width="4" height="10" rx="0.8" fill="white" />
        <rect x="13" y="12" width="10" height="4" rx="0.8" fill="white" />
        {/* Bell highlight — subtle shine */}
        <path d="M12 11C12 8.5 14 6 17 5.2" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </svg>
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
