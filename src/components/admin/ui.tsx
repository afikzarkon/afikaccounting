import { DatabaseZap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("he-IL");
export const count = (n: number) => nf.format(Math.round(n));
export const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—");

export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

export function AdminHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A headline number. The value is the loudest thing on the tile; the hint explains it. */
export function Kpi({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: string; hint?: ReactNode; tone?: "good" | "warn" }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="h-3.5 w-3.5 text-accent" /> {label}
      </p>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-fg">{value}</p>
      {hint && (
        <p className={cn("mt-1 text-xs", tone === "good" ? "text-success" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-subtle")}>{hint}</p>
      )}
    </div>
  );
}

export function Panel({ title, description, actions, children, className }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Shown when the admin migration hasn't been applied to the database yet. */
export function SetupRequired() {
  return (
    <div className="card flex flex-col items-start gap-3 border-amber-500/40 p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <DatabaseZap className="h-5 w-5" />
      </span>
      <p className="font-semibold text-fg">מסד הנתונים עוד לא הוכן למערכת הניהול</p>
      <p className="max-w-2xl text-sm leading-relaxed text-muted">
        יש להריץ את הקובץ <code dir="ltr" className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">supabase/migrations/20261023000000_admin.sql</code> ב-SQL
        Editor של Supabase (או <code dir="ltr" className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">npx supabase db push</code>). הוא יוצר את טבלאות
        המדיה, התרחישים והאנליטיקה ואת דלי האחסון.
      </p>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
