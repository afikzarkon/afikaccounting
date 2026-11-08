import { Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinGroupForm } from "@/components/groups/group-forms";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { previewGroup } from "@/lib/data/groups";
import { shareCard } from "@/lib/site";

const TITLE = "הזמנה לקבוצת לימוד";
const LINE = "חברים לומדים יחד לאותו מבחן: ספירה לאחור משותפת, ורואים מי למד היום.";
export const metadata: Metadata = { title: TITLE, description: LINE, openGraph: shareCard(TITLE, LINE), robots: { index: false } };

/** An invite link: sign in if needed, see the group's name and size, and join. */
export default function JoinPage({ params }: PageProps<"/groups/join/[code]">) {
  return (
    <Container className="max-w-xl pt-10 pb-16 sm:pt-14">
      <Suspense fallback={<Skeleton className="h-64 rounded-2xl" />}>
        <Join params={params} />
      </Suspense>
    </Container>
  );
}

async function Join({ params }: Pick<PageProps<"/groups/join/[code]">, "params">) {
  const { code } = await params;
  await requireUser(`/groups/join/${code}`);
  const [group, profile] = await Promise.all([previewGroup(code), getProfile()]);
  if (!group) return <EmptyState icon={<Users className="h-5 w-5" />} title="הקישור לא תקין" description="ייתכן שהקבוצה נסגרה. בקשו מהחברים קישור חדש." />;
  const t = TOPICS.find((x) => x.id === group.course);
  return (
    <section className="card p-6">
      <p className="text-sm font-semibold text-accent">{TITLE}</p>
      <h1 className="mt-2 text-[1.75rem] font-black [overflow-wrap:anywhere] text-fg">{group.name}</h1>
      <p className="num mt-1 text-[15px] text-muted">
        {t ? (t.standard ? `${t.standard} · ${t.title}` : t.title) : group.course} · {group.members} {group.members === 1 ? "חבר" : "חברים"}
        {group.exam_date && ` · מבחן ב־${group.exam_date.split("-").reverse().join(".")}`}
      </p>
      <p className="mt-4 text-[15px] text-fg/90">בקבוצה רואים מי למד היום. את המוכנות והרצף שלכם תראו לקבוצה רק אם תבחרו.</p>
      <div className="mt-5">
        <JoinGroupForm code={code} name={profile?.fullName?.split(" ")[0] ?? ""} />
      </div>
    </section>
  );
}
