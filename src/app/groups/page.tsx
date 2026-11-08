import { ArrowLeft, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CreateGroupForm } from "@/components/groups/group-forms";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/env";
import { listMyGroups } from "@/lib/data/groups";

export const metadata: Metadata = { title: "קבוצות לימוד" };

const courseLabel = (id: string) => {
  const t = TOPICS.find((x) => x.id === id);
  return t ? (t.standard ? `${t.standard} · ${t.title}` : t.title) : id;
};

/** The reader's study groups, and a new one. */
export default function GroupsPage({ searchParams }: PageProps<"/groups">) {
  return (
    <Container className="max-w-3xl pt-10 pb-16 sm:pt-14">
      <h1 className="text-[2rem] font-black text-fg">קבוצות לימוד</h1>
      <p className="mt-2 text-[16px] leading-relaxed text-muted">
        לומדים עם החברים לאותו מבחן: ספירה לאחור משותפת, ורואים מי למד היום. כל אחד מחליט אם להראות גם את המוכנות שלו.
      </p>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-2xl" />}>
        <Groups searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Groups({ searchParams }: Pick<PageProps<"/groups">, "searchParams">) {
  if (!isSupabaseConfigured)
    return <div className="mt-8"><EmptyState icon={<Users className="h-5 w-5" />} title="קבוצות דורשות חשבון" description="במצב הדגמה (בלי חיבור לחשבונות) אין קבוצות." /></div>;
  await requireUser("/groups");
  const [groups, profile, sp] = await Promise.all([listMyGroups(), getProfile(), searchParams]);
  const courses = TOPICS.filter((t) => t.format === "lessons").map((t) => ({ id: t.id, label: courseLabel(t.id) }));
  const course = typeof sp.course === "string" && courses.some((c) => c.id === sp.course) ? sp.course : undefined;
  return (
    <>
      {groups.length > 0 && (
        <ul className="mt-8 grid gap-3">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-accent/50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Users className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{g.name}</span>
                  <span className="num block text-[13.5px] text-muted">
                    {courseLabel(g.course)} · {g.members} {g.members === 1 ? "חבר" : "חברים"}
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <section className="card mt-8 p-5 sm:p-6">
        <h2 className="mb-4 text-[18px] font-bold text-fg">קבוצה חדשה</h2>
        <CreateGroupForm courses={courses} course={course} name={profile?.fullName?.split(" ")[0] ?? ""} />
      </section>
    </>
  );
}
