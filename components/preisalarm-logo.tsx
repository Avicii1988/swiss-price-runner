import Link from "next/link";

interface PreisAlarmLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  linkHome?: boolean;
}

export function PreisAlarmLogo({ className = "", size = "md", linkHome = true }: PreisAlarmLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg", gap: "gap-1.5" },
    md: { icon: 28, text: "text-xl", gap: "gap-2" },
    lg: { icon: 34, text: "text-2xl xl:text-3xl", gap: "gap-2.5" },
  };
  const s = sizes[size];

  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Bell icon with Swiss cross badge */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        {/* Bell body */}
        <path d="M16 4C11.6 4 8 7.6 8 12V20L6 22V23H26V22L24 20V12C24 7.6 20.4 4 16 4Z" fill="#1f2937" />
        {/* Bell clapper */}
        <rect x="13" y="25" width="6" height="2" rx="1" fill="#1f2937" />
        {/* Swiss cross badge */}
        <circle cx="23" cy="9" r="6" fill="#dc2626" />
        <rect x="21" y="5.5" width="4" height="7" rx="0.5" fill="white" />
        <rect x="19.5" y="7" width="7" height="4" rx="0.5" fill="white" />
      </svg>
      {/* Text */}
      <span className={`${s.text} font-black tracking-tight`}>
        Preis<span className="text-red-600">Alarm</span>
      </span>
    </span>
  );

  if (linkHome) {
    return <Link href="/" className="shrink-0">{content}</Link>;
  }
  return content;
}
