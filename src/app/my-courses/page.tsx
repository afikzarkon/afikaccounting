import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Container, Skeleton } from "@/components/ui/primitives";
import { getGateState } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { homeFor } from "@/lib/gate";

export const metadata: Metadata = { title: "הקורסים שלי", robots: { index: false } };

/**
 * An approved account's home on the closed site: the courses the admin opened
 * for it, and nothing else. The proxy sends every other page here, with a
 * notice when the reader tried to open something that isn't theirs.
 */
export default function MyCoursesPage({ searchParams }: PageProps<"/my-courses">) {
  return (
    <Container className="max-w-4xl pt-10 pb-16 sm:pt-14">
      <p className="text-xs font-semibold text-accent">האזור האישי</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">הקורסים שלי</h1>
      <Suspense fallback={<Skeleton className="mt-8 h-64 rounded-2xl" />}>
        <Courses searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Courses({ searchParams }: Pick<PageProps<"/my-courses">, "searchParams">) {
  const [state, params] = await Promise.all([getGateState(), searchParams]);
  if (!state.signedIn) redirect("/login?next=/my-courses");
  if (!state.admin && state.status !== "approved") redirect(homeFor(state));
  const courses = state.admin ? TOPICS : TOPICS.filter((t) => state.courses.includes(t.id));
  const denied = params.denied === "1";

  return (
    <div className="mt-8 space-y-6">
      {denied && (
        <p role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-fg">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
          <span>
            <strong className="font-semibold">נדרשת הרשאה.</strong> הדף שניסיתם לפתוח אינו חלק מהקורסים שנפתחו לחשבון שלכם. לגישה לקורס נוסף, פנו למנהל האתר.
          </span>
        </p>
      )}

      {courses.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((t) => (
            <li key={t.id}>
              <Link href={t.href} className="card group flex h-full flex-col gap-3 p-6 transition-colors hover:border-line-strong">
                <span className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <BookOpen className="h-4 w-4 text-accent" aria-hidden />
                  {t.standard ? (
                    <bdi dir="ltr" className="num">
                      {t.standard}
                    </bdi>
                  ) : (
                    "קורס"
                  )}
                  <span aria-hidden>·</span> {t.lessons} שיעורים
                </span>
                <span className="text-xl font-bold text-fg group-hover:text-accent">{t.title}</span>
                <span className="line-clamp-3 text-sm leading-relaxed text-muted">{t.description}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-accent">
                  לקורס <ArrowLeft className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-6 text-sm text-muted">עדיין לא נפתח לחשבון שלכם אף קורס. מנהל האתר יפתח לכם את הקורס שלכם בקרוב.</p>
      )}
    </div>
  );
}
