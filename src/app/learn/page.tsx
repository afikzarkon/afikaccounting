import { ArrowLeft, Calculator } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LearningPath } from "@/components/learn-map/learning-path";
import { Container } from "@/components/ui/primitives";
import { ENGINE_HUB, ENGINE_TOOLS, LEARNING_TOOLS } from "@/lib/catalog";
import { isLinkHidden } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";

export const metadata: Metadata = {
  title: "מפת הלימוד",
  description: "כל הקורסים באתר במקום אחד, לפי הסדר: חשבונאות מאפס בחינם, ואחריה הקורסים המתקדמים — מלאי, רכוש קבוע והטבות עובד — עם הכלים והמחשבונים של כל נושא.",
};

export default async function LearnPage() {
  const { links } = await getVisibility();
  const learning = LEARNING_TOOLS.filter((x) => !isLinkHidden(links, x.href));
  const engine = ENGINE_TOOLS.filter((x) => !isLinkHidden(links, x.href));
  return (
    <div className="relative">
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <p className="text-xs font-semibold text-accent">לימוד</p>
        <h1 className="mt-2 text-[2.2rem] leading-tight font-bold tracking-tight text-fg sm:text-5xl">
          מפת הלימוד
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          כל מה שאפשר ללמוד באתר, לפי הסדר שבו כדאי ללמוד אותו. מתחילים ב״חשבונאות מאפס״ — חינם, כל הקורס — וממשיכים לקורסים המתקדמים, שהשיעור הראשון בכל אחד מהם
          פתוח בחינם. בכל נושא — השיעורים, הכלים והמחשבונים שמראים את הדרך המלאה.
        </p>

        <div className="mt-10">
          <LearningPath />
        </div>

        <section className="mt-14" aria-label="עוד דרכים להתקדם">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-[17px] font-semibold text-fg">
              <Calculator className="h-5 w-5 text-accent" aria-hidden /> רק רוצים לחשב?
            </p>
            <p className="mt-1 text-sm text-muted">כל המחשבונים באתר, במקום אחד.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-accent">מחשבונים לימודיים — עם הדרך המלאה</p>
                <ul className="space-y-1 text-sm">
                  {learning.map((x) => (
                    <li key={x.href}>
                      <Link href={x.href} className="text-fg hover:text-accent hover:underline">
                        {x.label}
                      </Link>
                      <span className="text-xs text-muted"> · {x.topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-accent">מנוע הפתרונות — לתרחישים מקצועיים</p>
                <ul className="space-y-1 text-sm">
                  {engine.map((x) => (
                    <li key={x.href}>
                      <Link href={x.href} className="text-fg hover:text-accent hover:underline">
                        <span className="num">{x.standard}</span> · {x.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href={ENGINE_HUB.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                  למנוע הפתרונות <ArrowLeft className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
