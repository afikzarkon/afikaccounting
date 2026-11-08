import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GroupRoom } from "@/components/groups/group-room";
import { Container, Skeleton } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { getGroup } from "@/lib/data/groups";
import { STUDY_MODULES } from "@/lib/study";
import { outlineOf } from "@/lib/study/paths";

export const metadata: Metadata = { title: "קבוצת לימוד", robots: { index: false } };

/** One study group, for its members only (anyone else gets "not found"). */
export default function GroupPage({ params }: PageProps<"/groups/[id]">) {
  return (
    <Container className="max-w-3xl pt-8 pb-16 sm:pt-12">
      <Link href="/groups" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowRight className="h-4 w-4" aria-hidden /> כל הקבוצות
      </Link>
      <Suspense fallback={<Skeleton className="mt-6 h-96 rounded-2xl" />}>
        <Room params={params} />
      </Suspense>
    </Container>
  );
}

async function Room({ params }: Pick<PageProps<"/groups/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/groups/${id}`);
  const data = await getGroup(id);
  if (!data) notFound();
  const topic = TOPICS.find((t) => t.id === data.group.course);
  // Outlines only (titles, ids, counts): enough for the reader's readiness, never the questions.
  const lessons = topic ? Object.values(STUDY_MODULES).filter((m) => m.backHref === topic.href).sort((a, b) => a.n - b.n).map(outlineOf) : [];
  const courseName = topic ? (topic.standard ?? topic.title) : data.group.course;
  return (
    <>
      <h1 className="mt-4 text-[2rem] font-black [overflow-wrap:anywhere] text-fg">{data.group.name}</h1>
      <p className="mt-1 text-[15px] text-muted">{topic ? (topic.standard ? `${topic.standard} · ${topic.title}` : topic.title) : data.group.course}</p>
      <div className="mt-6">
        <GroupRoom group={data.group} members={data.members} me={user.id} courseName={courseName} lessons={lessons} />
      </div>
    </>
  );
}
