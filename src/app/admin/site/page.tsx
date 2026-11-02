import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton } from "@/components/admin/ui";
import { VisibilityManager } from "@/components/admin/visibility-manager";
import { requireAdmin } from "@/lib/auth/dal";
import { listVisibility, unlessSetupRequired } from "@/lib/data/admin";
import { controlGroups } from "@/lib/visibility/server";

export const metadata: Metadata = { title: "מה מוצג באתר" };

export default function AdminSitePage() {
  return (
    <>
      <AdminHeader
        title="מה מוצג באתר"
        description="כיבוי מסתיר מיד מכולם: מהתפריטים, מדף הבית, מהתחתית ומהחיפוש. לדף מוסתר אי אפשר להיכנס גם בקישור ישיר (אחרי עד 30 שניות) — חוץ ממך: כמנהל אתה ממשיך לפתוח אותו, דרך כפתור ״פתיחה״."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <Manager />
      </Suspense>
    </>
  );
}

async function Manager() {
  await requireAdmin("/admin/site");
  const state = await unlessSetupRequired(listVisibility());
  if (!state)
    return (
      <p className="card p-5 text-sm text-muted">
        כדי להפעיל את הדף, יש להריץ ב-Supabase את ה-migration ‏<span dir="ltr" className="font-mono">20261106000000_site_visibility.sql</span>.
      </p>
    );
  return <VisibilityManager groups={controlGroups()} initial={state} />;
}
