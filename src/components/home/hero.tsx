import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { FIRST_LESSON, LEARN_HUB } from "@/lib/catalog";
import type { FeaturedQuestion } from "@/lib/check";
import { BUTTONS } from "@/lib/visibility/items";
import { isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";
import { HeroExercise } from "./hero-exercise";


/**
 * The home page's opening. It answers the free summary first — a summary says
 * what the standard says; here you see where you'd lose points — and puts one
 * live exam question right under the headline, above the fold on a phone. Then
 * two doors: from zero (the free course) or "I have an exam" (the courses).
 * What the free course holds is set out like a ledger, down to its total.
 */
export async function Hero({
  question,
  check,
  lessons,
  exercises,
  videos,
}: {
  question?: FeaturedQuestion;
  check?: { href: string; label: string };
  lessons: number;
  exercises: number;
  videos: number;
}) {
  const v = await getVisibility();
  const { heroStart: start, heroTour: tour } = BUTTONS;
  const showStart = !isHidden(v, start.key) && !isLinkHidden(v.links, FIRST_LESSON);
  const showTour = !isHidden(v, tour.key) && !isLinkHidden(v.links, LEARN_HUB.href);
  const rows: [string, number][] = [
    ["שיעורים", lessons],
    ["שאלות תרגול עם משוב", exercises],
    ...(videos ? ([["סרטוני הסבר", videos]] as [string, number][]) : []),
  ];
  return (
    <section>
      {/* A phone reads top to bottom: headline, the question, the doors, the ledger. A wide screen: the text beside the question. */}
      <div className="mx-auto grid max-w-7xl items-start gap-x-16 gap-y-7 px-4 pt-8 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-24">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-[15px] font-semibold text-accent">שאלות ברמת מבחן · בלי הרשמה</p>
          <h1 className="mt-3 text-[2.15rem] leading-[1.08] font-black text-balance text-fg sm:text-[3.6rem]">
            הסיכום אומר מה כתוב בתקן.{" "}
            <span className="text-accent">כאן רואים איפה מפסידים נקודות.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted sm:mt-5">
            פותרים שאלות במלאי, ברכוש קבוע ובהטבות עובד, נופלים במלכודות עכשיו ולא במבחן, ורואים בדיוק למה. מתחילים מאפס? הקורס הבסיסי חינם כולו.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-8">
          {question && <HeroExercise trap={question.trap} source={question.source} href={question.href} more={question.more} />}
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <div className="flex flex-wrap gap-3">
            {showStart && (
              <ButtonLink href={FIRST_LESSON} size="lg">
                {labelOf(v, start.key, start.label)} <ArrowLeft className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            {showTour && (
              <ButtonLink href={LEARN_HUB.href} variant="secondary" size="lg">
                {labelOf(v, tour.key, tour.label)}
              </ButtonLink>
            )}
          </div>

          <table className="num mt-9 w-full max-w-sm text-[15px]">
            <caption className="mb-2 text-start text-sm text-muted">הקורס החינמי, בחשבון סופי</caption>
            <tbody>
              {rows.map(([label, n]) => (
                <tr key={label}>
                  <th scope="row" className="py-1.5 text-start font-normal text-fg">{label}</th>
                  <td className="py-1.5 text-end font-semibold text-fg">{n}</td>
                </tr>
              ))}
              <tr className="ledger-total">
                <th scope="row" className="py-2 text-start font-semibold text-fg">מחיר</th>
                <td className="py-2 text-end font-display text-[22px] font-black text-accent">
                  <bdi dir="ltr">₪0</bdi>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 max-w-sm text-sm text-muted">
            בלי כרטיס אשראי. הסיכום שלכם טוב לקריאה — כאן בודקים אם יודעים לפתור. עם חשבון, ההתקדמות נשמרת בכל מכשיר.
          </p>
          {check && !isLinkHidden(v.links, check.href) && (
            <p className="mt-3 max-w-sm text-sm">
              <Link href={check.href} className="font-semibold text-accent hover:underline">
                {check.label}
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
