import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { FIRST_LESSON } from "@/lib/catalog";
import type { Trap } from "@/lib/study/types";
import { BUTTONS } from "@/lib/visibility/items";
import { isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";
import { HeroExercise } from "./hero-exercise";

/**
 * The home page's opening: the free course, and the way straight into lesson 1
 * (no account) — above the fold on a phone. Beside it, one live question
 * from the course, in the course's own components.
 */
export async function Hero({ trap, lessons, exercises, videos }: { trap: Trap; lessons: number; exercises: number; videos: number }) {
  const v = await getVisibility();
  const { heroStart: start, heroTour: tour } = BUTTONS;
  // "What's in the course" scrolls to the free course's section: it goes with it.
  const showStart = !isHidden(v, start.key) && !isLinkHidden(v.links, FIRST_LESSON);
  const showTour = !isHidden(v, tour.key) && !isHidden(v, "home:free-course") && !isLinkHidden(v.links, "/basics");
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[min(920px,100vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(79_139_255_/_0.28),transparent)] blur-2xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1fr] lg:gap-14 lg:px-8 lg:pb-24">
        <div>
          <TierBadge tier="free" label="קורס מלא · חינם · בלי הרשמה" />
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] font-bold tracking-tight text-fg sm:text-6xl lg:text-[4.25rem]">
            חשבונאות <span className="text-gradient">מאפס</span>
            <br />
            קורס מלא, בחינם
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted sm:mt-6 sm:text-[17px]">
            <span className="num">{lessons}</span> שיעורים קצרים, מ״מה זה חובה וזכות״ ועד דוחות כספיים. בכל שיעור: מושג עם דוגמה חיה, תרגול עם משוב מיידי, וטיפים למבחן.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
            {showStart && (
              <ButtonLink href={FIRST_LESSON} size="lg">
                {labelOf(v, start.key, start.label)} <ArrowLeft className="h-4 w-4" aria-hidden />
              </ButtonLink>
            )}
            {showTour && (
              <ButtonLink href="#free-course" variant="secondary" size="lg" className="max-sm:hidden">
                <PlayCircle className="h-4 w-4" aria-hidden /> {labelOf(v, tour.key, tour.label)}
              </ButtonLink>
            )}
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted sm:mt-7">
            {[`${exercises} שאלות תרגול עם משוב`, "בלי כרטיס אשראי", "עם חשבון — ההתקדמות בכל מכשיר"].map((t) => (
              <li key={t} className="num flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-xl text-sm text-muted">
            ומשם ממשיכים: <strong className="font-semibold text-fg">מלאי, רכוש קבוע והטבות עובד</strong> — עד רמת מבחן.
          </p>
        </div>

        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-accent/30 via-cyan-400/10 to-transparent blur-2xl" />
          <div className="relative">
            <HeroExercise trap={trap} />
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 overflow-hidden rounded-3xl bg-surface/70 ring-1 ring-line backdrop-blur sm:grid-cols-4">
          {[
            [String(lessons), "שיעורים בקורס החינמי"],
            [String(exercises), "שאלות תרגול עם משוב"],
            [String(videos), "סרטוני הסבר"],
            ["חינם", "בלי הרשמה ובלי כרטיס אשראי"],
          ].map(([n, label], i) => (
            <div key={label} className={i % 2 ? "border-s border-line px-5 py-5 sm:px-6" : "px-5 py-5 sm:border-s sm:border-line sm:px-6 sm:first:border-s-0"}>
              <dt className="text-[13px] text-muted">{label}</dt>
              <dd className="num mt-1 text-[28px] leading-none font-bold text-fg">
                <bdi dir="ltr">{n}</bdi>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
