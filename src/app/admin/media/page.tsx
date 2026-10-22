import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaManager } from "@/components/admin/media-manager";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { listMedia, unlessSetupRequired } from "@/lib/data/admin";
import { CALCULATORS } from "@/lib/engine/registry";

export const metadata: Metadata = { title: "קבצים ומדיה" };

export default function AdminMediaPage() {
  return (
    <>
      <AdminHeader title="קבצים ומדיה" description="Excel, PDF וסרטונים — מועלים לשרת או מוטמעים מ-YouTube ו-Vimeo. לכל פריט אפשר לשייך קטגוריה, מודול ותגיות." />
      <Suspense fallback={<AdminSkeleton />}>
        <Media />
      </Suspense>
    </>
  );
}

async function Media() {
  await requireAdmin("/admin/media");
  const items = await unlessSetupRequired(listMedia());
  if (!items) return <SetupRequired />;
  const modules = [{ value: "content", label: "מרכז התוכן" }, { value: "ias16-guide", label: "מדריך IAS 16" }, ...CALCULATORS.map((c) => ({ value: c.slug, label: `${c.standard} — ${c.title}` }))];
  return <MediaManager items={items} modules={modules} />;
}
