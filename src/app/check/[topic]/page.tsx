import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckQuiz } from "@/components/check/check-quiz";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container } from "@/components/ui/primitives";
import { CHECK_SIZE, CHECK_TOPICS, checkFor } from "@/lib/check";
import { SITE_URL } from "@/lib/env";
import { shareCard } from "@/lib/site";

export function generateStaticParams() {
  return CHECK_TOPICS.map((topic) => ({ topic }));
}

const nameOf = (t: { title: string; standard?: string }) => (t.standard ? `${t.standard} ${t.title}` : t.title);

export async function generateMetadata({ params }: PageProps<"/check/[topic]">): Promise<Metadata> {
  const c = checkFor((await params).topic);
  if (!c) return { title: "לא נמצא" };
  const title = `בדקו את הסיכום שלכם: ${nameOf(c.topic)}`;
  const description = `${CHECK_SIZE} שאלות ברמת מבחן, כל אחת עם מלכודת. פותחים את הסיכום, עונים, ורואים איפה הייתם מפסידים נקודות — בלי הרשמה.`;
  return { title, description, openGraph: shareCard(title, description) };
}

/**
 * The answer to "I already have a summary": a public check of five traps from one
 * course. Use the summary, then see whether you can actually do it. Prerendered;
 * the quiz runs in the browser and needs no account.
 */
export default function CheckPage({ params }: PageProps<"/check/[topic]">) {
  return (
    <Suspense fallback={<Container className="max-w-3xl pt-8 pb-16 sm:pt-12" aria-busy="true" />}>
      <CheckBody params={params} />
    </Suspense>
  );
}

async function CheckBody({ params }: Pick<PageProps<"/check/[topic]">, "params">) {
  const { topic } = await params;
  const c = checkFor(topic);
  if (!c) notFound();
  return (
    <Container className="max-w-3xl pt-8 pb-16 sm:pt-12">
      <Breadcrumbs trail={[{ label: nameOf(c.topic), href: c.topic.href }, { label: "בדקו את הסיכום" }]} />
      <h1 className="mt-3 text-[2rem] leading-tight font-black text-fg sm:text-[2.6rem]">בדקו את הסיכום שלכם</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">
        יש לכם סיכום ב־{nameOf(c.topic)}? מצוין, תפתחו אותו. הנה {CHECK_SIZE} שאלות ברמת מבחן, ובכל אחת מלכודת שסטודנטים נופלים בה. בסוף תראו איפה הייתם מפסידים נקודות, ולמה. בלי הרשמה.
      </p>
      <div className="mt-7">
        <CheckQuiz check={c} url={`${SITE_URL}/check/${c.topic.id}`} />
      </div>
    </Container>
  );
}
