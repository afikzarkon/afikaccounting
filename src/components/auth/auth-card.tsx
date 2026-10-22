import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";
import { isSupabaseConfigured } from "@/lib/env";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-7 shadow-2xl sm:p-9">
          <LogoMark className="h-10 w-10" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{description}</p>
          {!isSupabaseConfigured && (
            <p className="mt-5 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              <Info className="mt-px h-4 w-4 shrink-0" />
              מצב הדגמה: Supabase אינו מוגדר, ולכן החשבונות מושבתים. המנוע ומרכז התוכן פועלים במלואם גם בלי
              להתחבר.
            </p>
          )}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
