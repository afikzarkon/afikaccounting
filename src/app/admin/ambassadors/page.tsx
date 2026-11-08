import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbassadorsView } from "@/components/admin/ambassadors-view";
import { RANGES } from "@/components/admin/dashboard-view";
import { AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getAmbassadors, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "שגרירים" };

export default function AdminAmbassadorsPage({ searchParams }: PageProps<"/admin/ambassadors">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AmbassadorsPage searchParams={searchParams} />
    </Suspense>
  );
}

async function AmbassadorsPage({ searchParams }: { searchParams: PageProps<"/admin/ambassadors">["searchParams"] }) {
  await requireAdmin("/admin/ambassadors");
  const { range } = await searchParams;
  const days = RANGES.find((r) => String(r.days) === (Array.isArray(range) ? range[0] : range))?.days ?? 30;

  const rows = await unlessSetupRequired(getAmbassadors(days));
  if (!rows) return <SetupRequired />;

  return <AmbassadorsView rows={rows} days={days} />;
}
