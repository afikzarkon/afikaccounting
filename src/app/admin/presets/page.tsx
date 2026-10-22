import type { Metadata } from "next";
import { Suspense } from "react";
import { PresetManager } from "@/components/admin/preset-manager";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { listPresetsAdmin, unlessSetupRequired } from "@/lib/data/admin";
import { CALCULATORS } from "@/lib/engine/registry";

export const metadata: Metadata = { title: "תרחישים מוכנים" };

export default function AdminPresetsPage() {
  return (
    <>
      <AdminHeader
        title="תרחישים מוכנים"
        description="שאלות דוגמה שמשתמשים טוענים בלחיצה בשלב הראשון של המחשבון. הדרך הקלה ליצור תרחיש: לפתור אותו במחשבון, להעתיק את הקישור, ולהדביק כאן."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <Presets />
      </Suspense>
    </>
  );
}

async function Presets() {
  await requireAdmin("/admin/presets");
  const presets = await unlessSetupRequired(listPresetsAdmin());
  if (!presets) return <SetupRequired />;
  const calculators = CALCULATORS.map((c) => ({ value: c.slug, label: `${c.standard} — ${c.title}` }));
  return <PresetManager presets={presets} calculators={calculators} />;
}
