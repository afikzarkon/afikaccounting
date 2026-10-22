import Link from "next/link";
import { site } from "@/lib/site";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8bff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lm)" />
      {/* A T-account: the double-entry mark */}
      <path d="M8 10.5h16M16 10.5V23" stroke="#04112b" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 15.5h3.5M18.5 18.5H22" stroke="#04112b" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={`${site.name} — דף הבית`}>
      <LogoMark className="h-8 w-8 transition-transform duration-300 group-hover:rotate-[-6deg]" />
      <span className="text-[17px] font-semibold tracking-tight text-fg">{site.name}</span>
    </Link>
  );
}
