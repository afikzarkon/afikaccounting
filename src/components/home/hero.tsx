import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { FIRST_LESSON, LEARN_HUB } from "@/lib/catalog";
import type { FeaturedQuestion } from "@/lib/check";
import { BUTTONS } from "@/lib/visibility/items";
import { isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";
import { HeroExercise } from "./hero-exercise";

/** An advanced course's way in from the hero: straight to its free first lesson. */
export type HeroDoor = { title: string; standard?: string; href: string };

/**
 * The home page's opening. It answers the free summary first — a summary says
 * what the standard says; here you see where you'd lose points. The headline
 * speaks to a student with an exam coming, so the main button is theirs: pick
 * a topic, each one straight to its free first lesson. The free course from
 * zero is the second door. On a phone the buttons come right after the
 * headline, before the live question, so the first screen always has a way in.
 * What the free course holds is set out like a ledger, down to its total.
 */
export async function Hero({
  variant,
  question,
  doors,
  lessons,
  exercises,
  videos,
}: {
  /** The headline's A/B variant (lib/experiments.ts, "hero"); none is the control. */
  variant?: string;
  question?: FeaturedQuestion;
  doors: HeroDoor[];
  lessons: number;
  exercises: number;
  videos: number;
}) {
  const v = await getVisibility();
  const { heroStart: start, heroTour: tour } = BUTTONS;
  const showStart = !isHidden(v, start.key) && !isLinkHidden(v.links, FIRST_LESSON);
  const showTour = !isHidden(v, tour.key) && !isLinkHidden(v.links, LEARN_HUB.href);
  const shownDoors = doors.filter((d) => !isLinkHidden(v.links, d.href));
  const rows: [string, number][] = [
    ["שיעורים", lessons],
    ["שאלות תרגול עם משוב", exercises],
    ...(videos ? ([["סרטוני הסבר", videos]] as [string, number][]) : []),
  ];
  return (
    <section>
      {/* A phone reads top to bottom: headline and buttons, the question, the ledger. A wide screen: the text beside the question. */}
      <div className="mx-auto grid max-w-7xl items-start gap-x-16 gap-y-7 px-4 pt-8 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-24">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-[15px] font-semibold text-accent">שאלות ברמת מבחן · בלי הרשמה</p>
          {variant === "doors" ? (
            <>
              <h1 className="mt-3 text-[2.15rem] leading-[1.08] font-black text-balance text-fg sm:text-[3.6rem]">
                מתחילים חשבונאות — <span className="text-accent">או שהמבחן כבר קרוב?</span>
              </h1>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted sm:mt-5">
                קורס מאפס, חינם כולו. וקורסים לנושאים שחוזרים בכל מבחן: מלאי, רכוש קבוע, הטבות עובד וחכירות — שאלות ברמת מבחן, מלכודות עם הסבר, וחזרה על הטעויות שלכם.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-[2.15rem] leading-[1.08] font-black text-balance text-fg sm:text-[3.6rem]">
                הסיכום אומר מה כתוב בתקן.{" "}
                <span className="text-accent">כאן רואים איפה מפסידים נקודות.</span>
              </h1>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted sm:mt-5">
                פותרים שאלות במלאי, ברכוש קבוע, בהטבות עובד ובחכירות, נופלים במלכודות עכשיו ולא במבחן, ורואים בדיוק למה. מתחילים מאפס? הקורס הבסיסי חינם כולו.
              </p>
            </>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {showTour && (
              <ButtonLink href={LEARN_HUB.href} size="lg" className="w-full sm:w-auto">
                {labelOf(v, tour.key, tour.label)} <ArrowLeft className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            {showStart && (
              <ButtonLink href={FIRST_LESSON} variant="secondary" size="lg" className="w-full sm:w-auto">
                {labelOf(v, start.key, start.label)}
              </ButtonLink>
            )}
          </div>
          {shownDoors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted">או ישר לשיעור 1 בחינם:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {shownDoors.map((d) => (
                  <li key={d.href}>
                    <Link
                      href={d.href}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-sm font-semibold text-fg transition-colors hover:border-accent/60 hover:text-accent"
                    >
                      {d.title}
                      {d.standard && (
                        <bdi dir="ltr" className="num text-xs font-medium text-muted">
                          {d.standard}
                        </bdi>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-sm text-muted">בלי כרטיס אשראי · שיעור 1 בכל קורס חינם</p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-8">
          {question && <HeroExercise trap={question.trap} source={question.source} href={question.href} more={question.more} />}
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <table className="num w-full max-w-sm text-[15px]">
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
            הסיכום שלכם טוב לקריאה — כאן בודקים אם יודעים לפתור. עם חשבון, ההתקדמות נשמרת בכל מכשיר.
          </p>
        </div>
      </div>
    </section>
  );
}
