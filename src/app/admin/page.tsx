import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView, GRAINS, type Grain, RANGES } from "@/components/admin/dashboard-view";
import { AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getAnalytics, getStorageUse, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "דאשבורד" };

export default function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin("/admin");
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r.days) === one(sp.range))?.days ?? 30;
  const grain: Grain = GRAINS.find((g) => g.value === one(sp.by))?.value ?? (days > 90 ? "month" : days > 30 ? "week" : "day");

  const loaded = await unlessSetupRequired(Promise.all([getAnalytics(days), getStorageUse()]));
  if (!loaded) return <SetupRequired />;
  const [data, storage] = loaded;

  return <DashboardView data={data} storage={storage} days={days} grain={grain} />;
}
