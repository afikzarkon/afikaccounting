import Link from "next/link";
import { site } from "@/lib/site";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="var(--accent)" />
      {/* A T-account: the double-entry mark */}
      <path d="M8 10.5h16M16 10.5V23" stroke="var(--accent-fg)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 15.5h3.5M18.5 18.5H22" stroke="var(--accent-fg)" strokeWidth="2.4" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} — דף הבית`}>
      <LogoMark className="h-8 w-8" />
      <span className="font-display text-[19px] font-bold text-fg">{site.name}</span>
    </Link>
  );
}
