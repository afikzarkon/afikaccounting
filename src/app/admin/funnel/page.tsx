import type { Metadata } from "next";
import { Suspense } from "react";
import { RANGES } from "@/components/admin/dashboard-view";
import { type FunnelLabels, FunnelView } from "@/components/admin/funnel-view";
import { AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { getFunnel, unlessSetupRequired } from "@/lib/data/admin";
import { STUDY_MODULES } from "@/lib/study";

export const metadata: Metadata = { title: "משפך וצמיחה" };

export default function AdminFunnelPage({ searchParams }: PageProps<"/admin/funnel">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <FunnelPage searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function FunnelPage({ searchParams }: { searchParams: PageProps<"/admin/funnel">["searchParams"] }) {
  await requireAdmin("/admin/funnel");
  const sp = await searchParams;
  const days = RANGES.find((r) => String(r.days) === one(sp.range))?.days ?? 30;
  const source = one(sp.source)?.slice(0, 120) || undefined;

  const loaded = await unlessSetupRequired(getFunnel(days, source));
  if (!loaded) return <SetupRequired />;

  // Names for the ids the numbers come with, from the lessons the site holds now (only those that appear).
  const slugs = new Set([...loaded.now.lessons.map((l) => l.slug), ...loaded.now.traps.map((t) => t.slug)]);
  const lessons: FunnelLabels["lessons"] = {};
  const traps: FunnelLabels["traps"] = {};
  for (const slug of slugs) {
    const m = STUDY_MODULES[slug];
    if (!m) continue;
    lessons[slug] = `${m.course} · ${m.n}: ${m.title}`;
  }
  for (const t of loaded.now.traps) {
    const trap = STUDY_MODULES[t.slug]?.traps.find((x) => x.id === t.id);
    if (trap) traps[`${t.slug}:${t.id}`] = trap.prompt.length > 110 ? `${trap.prompt.slice(0, 110)}…` : trap.prompt;
  }
  const courses = Object.fromEntries(TOPICS.map((t) => [t.id, t.standard ? `${t.standard} · ${t.title}` : t.title]));

  return <FunnelView now={loaded.now} before={loaded.before} days={days} source={source} labels={{ lessons, traps, courses }} asOf={loaded.asOf} />;
}
