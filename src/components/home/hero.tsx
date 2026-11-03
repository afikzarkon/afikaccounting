import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { FIRST_LESSON } from "@/lib/catalog";
import type { Trap } from "@/lib/study/types";
import { BUTTONS } from "@/lib/visibility/items";
import { isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";
import { HeroExercise } from "./hero-exercise";

/**
 * The home page's opening: the free course, and the way straight into lesson 1
 * (no account) — above the fold on a phone. What the course holds is set out
 * like a ledger, down to its total. Beside it, one live question from the
 * course, in the course's own components.
 */
export async function Hero({ trap, lessons, exercises, videos }: { trap: Trap; lessons: number; exercises: number; videos: number }) {
  const v = await getVisibility();
  const { heroStart: start, heroTour: tour } = BUTTONS;
  // "What's in the course" scrolls to the free course's section: it goes with it.
  const showStart = !isHidden(v, start.key) && !isLinkHidden(v.links, FIRST_LESSON);
  const showTour = !isHidden(v, tour.key) && !isHidden(v, "home:free-course") && !isLinkHidden(v.links, "/basics");
  const rows: [string, number][] = [
    ["שיעורים", lessons],
    ["שאלות תרגול עם משוב", exercises],
    ...(videos ? ([["סרטוני הסבר", videos]] as [string, number][]) : []),
  ];
  return (
    <section>
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:pb-24">
        <div>
          <p className="text-[15px] font-semibold text-accent">קורס מלא בחינם, בלי הרשמה</p>
          <h1 className="mt-3 text-[2.75rem] leading-[1.02] font-black text-fg sm:text-[4.5rem]">
            חשבונאות מאפס.
            <br />
            עד שזה מתאזן.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted sm:mt-6">
            שיעורים קצרים, מ״מה זה חובה וזכות״ ועד דוחות כספיים. בכל שיעור מושג עם דוגמה שזזה כשמשנים מספר, תרגול שבודק אתכם מיד, וטיפים למבחן.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {showStart && (
              <ButtonLink href={FIRST_LESSON} size="lg">
                {labelOf(v, start.key, start.label)} <ArrowLeft className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            {showTour && (
              <ButtonLink href="#free-course" variant="secondary" size="lg" className="max-sm:hidden">
                {labelOf(v, tour.key, tour.label)}
              </ButtonLink>
            )}
          </div>

          <table className="num mt-10 w-full max-w-sm text-[15px]">
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
            בלי כרטיס אשראי. עם חשבון, ההתקדמות נשמרת בכל מכשיר. ומשם ממשיכים למלאי, לרכוש קבוע ולהטבות עובד, עד רמת מבחן.
          </p>
        </div>

        <div className="lg:pt-8">
          <HeroExercise trap={trap} />
        </div>
      </div>
    </section>
  );
}
