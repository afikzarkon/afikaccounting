import { ArrowLeft, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { TrackEvent } from "@/components/layout/track-event";
import { HomeExams } from "@/components/pricing/exams-teaser";
import { Faq } from "@/components/pricing/faq";
import { PlanCards } from "@/components/pricing/plan-cards";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { FIRST_LESSON, PRICING_HUB, tasteLabel, TOPICS } from "@/lib/catalog";
import { studyHref } from "@/lib/study";
import { BASICS_LESSONS } from "@/lib/study/basics";
import type { StudyModule } from "@/lib/study/types";
import { BUTTONS } from "@/lib/visibility/items";
import { isHidden, isLinkHidden, labelOf } from "@/lib/visibility/rules";
import { getVisibility } from "@/lib/visibility/server";

/**
 * What students say, quoted with their permission. Empty on purpose: the
 * section shows only once there are real quotes. Never invent one, nor a
 * grade or a number of users.
 */
const TESTIMONIALS: { quote: string; name: string; detail?: string }[] = [];

const PAINS = [
  { title: "חובה וזכות מתבלבלים", body: "שיננתם שנכסים בחובה, ובשאלה הראשונה שוב לא בטוחים לאיזה צד הסכום הולך." },
  { title: "שעות על הרצאה, ודקה על תרגול", body: "מבינים בכיתה, נתקעים בבית, ואין מי שיגיד מיד איפה הטעות." },
  { title: "המבחן מלא במלכודות", body: "תשובה שנראית נכונה, ומחיר של נקודות על כל טעות קטנה שלא הכרתם מראש." },
];

const HOW = [
  { title: "מושג אחד, עם דוגמה חיה", body: "כל מסך מלמד רעיון אחד, וכל מספר בו זז כשמשנים נתון, כדי שתראו למה." },
  { title: "תרגול עם משוב ומלכודות", body: "פקודות יומן, שאלות חישוב ואמריקאיות. משוב מיד, והסבר למה התשובה השגויה מפתה." },
  { title: "סיכום וטיפים למבחן", body: "בסוף כל שיעור: כמה הצלחתם, מה כדאי לתרגל שוב, ומה לזכור למבחן." },
];

const FAQ = [
  { q: "זה באמת חינם?", a: "כן. כל 8 השיעורים של ״חשבונאות מאפס״, עם התרגול, השאלות המלאות והסיכומים, פתוחים בחינם ולתמיד. וגם השיעור הראשון בכל קורס מתקדם." },
  { q: "צריך כרטיס אשראי?", a: "לא. אפשר להתחיל את שיעור 1 עכשיו, בלי הרשמה ובלי כרטיס אשראי." },
  { q: "מה מקבלים במנוי?", a: "את הקורסים המתקדמים במלואם: מלאי, רכוש קבוע והטבות עובד, עד רמת מבחן. במסלול ״קורסים + מבחנים״ נוסף מתחם המבחנים, עם תרגילים ברמת מבחן ופתרון מלא מאפס." },
  { q: "אפשר לבטל?", a: "כן, בכל רגע. המנוי נשאר פעיל עד סוף התקופה ששילמתם עליה, והקורס החינמי נשאר פתוח לכם תמיד." },
  { q: "צריך רקע קודם?", a: "לא. הקורס מתחיל ממש מההתחלה: מה זה עסק, מה זה נכס ולמה יש חובה וזכות." },
];

const count = (m: StudyModule) => m.exercises.length + m.traps.length;
const minutes = (m: StudyModule) => Math.max(1, Math.round((m.videos ?? []).reduce((a, v) => a + v.duration, 0) / 60));

export default async function Home() {
  const trap = BASICS_LESSONS[0].traps.find((t) => t.id === "debit-bad") ?? BASICS_LESSONS[0].traps[0];
  const total = BASICS_LESSONS.reduce((a, m) => a + count(m), 0);
  // What the admin hid: a section, a button (or its text), a course or a lesson.
  const v = await getVisibility();
  const show = (key: string) => !isHidden(v, key);
  const linked = (href: string) => !isLinkHidden(v.links, href);
  const button = (id: keyof typeof BUTTONS, href: string) => show(BUTTONS[id].key) && linked(href);
  const text = (id: keyof typeof BUTTONS) => labelOf(v, BUTTONS[id].key, BUTTONS[id].label);
  const paid = TOPICS.filter((t) => t.tier !== "free" && linked(t.href));
  const freeLessons = BASICS_LESSONS.filter((m) => linked(studyHref(m.slug)));
  return (
    <>
      <TrackEvent event={{ kind: "landing_view" }} />
      <Hero trap={trap} lessons={BASICS_LESSONS.length} exercises={total} videos={BASICS_LESSONS.reduce((a, m) => a + (m.videos?.length ?? 0), 0)} />

      {show("home:pains") && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading title="חשבונאות לא קשה. היא פשוט מוסברת מהר מדי." />
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {PAINS.map((p) => (
              <li key={p.title} className="border-s-2 border-danger/70 ps-4">
                <p className="text-[17px] font-bold text-fg">{p.title}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {show("home:how") && (
        <section className="mt-16 border-y border-line bg-surface/50 sm:mt-20">
          <Container className="py-16">
            <SectionHeading title="כל שיעור בנוי משלושה חלקים, באותו סדר" />
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {HOW.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="num font-display text-[2.5rem] leading-none font-black text-accent" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold text-fg">{s.title}</span>
                    <span className="mt-1.5 block text-[15px] leading-relaxed text-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              <Shot name="lesson" alt="מסך מושג בשיעור: הכותרת, ההסבר, דוגמה חיה, והכפתורים להמשך" caption="מסך בשיעור: מושג אחד, דוגמה חיה, והתקדמות למעלה" />
              <Shot name="course" alt="דף הקורס: המסלול שלך, השיעור הבא פתוח עם המושגים שבו, והשיעורים שאחריו" caption="דף הקורס: מה עשיתם, כמה XP צברתם, ומה הצעד הבא" />
            </div>
          </Container>
        </section>
      )}

      {show("home:free-course") && linked("/basics") && (
        <Container id="free-course" className="scroll-mt-20 pt-16 sm:pt-20">
          <SectionHeading
            title="הקורס החינמי: חשבונאות מאפס"
            description={
              <>
                <span className="num">{BASICS_LESSONS.length}</span> שיעורים ו-<span className="num">{total}</span> שאלות תרגול, מהשאלה ״מה זה בכלל חשבונאות״ ועד גיליון רב-טורי. פתוח כולו, בלי הרשמה.
              </>
            }
            action={
              button("freeCourse", "/basics") && (
                <ButtonLink href="/basics" variant="outline">
                  {text("freeCourse")} <ArrowLeft className="h-4 w-4" aria-hidden />
                </ButtonLink>
              )
            }
          />
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeLessons.map((m) => (
              <li key={m.slug}>
                <Link href={studyHref(m.slug)} className="group card flex h-full gap-3.5 p-5 transition-colors hover:border-accent/60">
                  <span className="num w-7 shrink-0 font-display text-[1.75rem] leading-none font-black text-accent">{m.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg group-hover:text-accent">{m.title}</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-muted">{m.description}</span>
                    <span className="num mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {m.screens.length} מושגים, {count(m)} שאלות תרגול
                      {m.videos?.length ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden /> {m.videos.length > 1 ? `${m.videos.length} סרטונים` : "סרטון"} · {minutes(m)} דק׳
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {button("freeCourseStart", FIRST_LESSON) && (
            <div className="mt-6">
              <ButtonLink href={FIRST_LESSON} size="lg">
                {text("freeCourseStart")} <ArrowLeft className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
          )}
        </Container>
      )}

      {show("home:courses") && paid.length > 0 && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading title="הנושאים שחוזרים בכל מבחן" description="אותו מבנה כמו בקורס החינמי, עד רמת מבחן. בכל קורס השיעור הראשון עלינו." />
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {paid.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="group card flex h-full flex-col p-6 transition-colors hover:border-accent/60">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[17px] font-semibold text-fg">{t.title}</span>
                    {t.standard && (
                      <Badge tone="accent" className="num">
                        {t.standard}
                      </Badge>
                    )}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <TierBadge tier={t.tier} />
                    <TierBadge tier="free" label={tasteLabel(t)} />
                  </span>
                  <span className="mt-3 flex-1 text-[13.5px] leading-relaxed text-muted">{t.description}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {t.covers.slice(0, 5).map((c) => (
                      <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent">
                    {tasteLabel(t)}, להתחיל <ArrowLeft className="ms-auto h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {show("home:exams") && linked("/exams") && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading title="ואחרי הקורסים, מתרגלים כמו במבחן" />
          <HomeExams />
        </Container>
      )}

      {TESTIMONIALS.length > 0 && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading title="מה אומרים סטודנטים" />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.name} className="card p-5">
                <blockquote className="text-[15px] leading-relaxed text-fg/90">״{t.quote}״</blockquote>
                <p className="mt-3 text-sm font-semibold text-fg">{t.name}</p>
                {t.detail && <p className="text-xs text-muted">{t.detail}</p>}
              </li>
            ))}
          </ul>
        </Container>
      )}

      {show("home:pricing") && linked(PRICING_HUB.href) && (
        <Container className="pt-16 sm:pt-20">
          <SectionHeading
            title="מתחילים בחינם. משלמים רק כשממשיכים."
            action={
              button("pricingCompare", PRICING_HUB.href) && (
                <ButtonLink href={PRICING_HUB.href} variant="outline">
                  {text("pricingCompare")} <ArrowLeft className="h-4 w-4" aria-hidden />
                </ButtonLink>
              )
            }
          />
          <div className="mt-10">
            <PlanCards from="home" />
          </div>
        </Container>
      )}

      {show("home:faq") && (
        <Container className="pt-16 sm:pt-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">שאלות נפוצות</h2>
            <Faq items={FAQ} className="mt-6" />
          </div>
        </Container>
      )}

      {show("home:final") && (
        <Container className="pt-16 sm:pt-20">
          <div className="rounded-2xl bg-[#0f3d2e] p-8 text-[#eaf3ee] sm:p-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl font-bold sm:text-[2rem]">שיעור 1 לוקח כמה דקות.</p>
                <p className="mt-2 text-[15px] text-[#c9ddd1]">בלי הרשמה, בלי כרטיס אשראי.</p>
              </div>
              {button("finalStart", FIRST_LESSON) && (
                <ButtonLink href={FIRST_LESSON} size="lg" variant="secondary" className="border-transparent bg-[#eaf3ee] text-[#0f3d2e] hover:bg-white">
                  {text("finalStart")} <ArrowLeft className="h-4 w-4" aria-hidden />
                </ButtonLink>
              )}
            </div>
          </div>
        </Container>
      )}
    </>
  );
}

/** A real screenshot of the course, in the reader's theme. Taken from the site itself (public/landing). */
function Shot({ name, alt, caption }: { name: string; alt: string; caption: string }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-line-strong shadow-card">
        <Image src={`/landing/${name}-light.png`} alt={alt} width={1280} height={800} className="block h-auto w-full dark:hidden" sizes="(min-width: 1024px) 50vw, 100vw" />
        <Image src={`/landing/${name}-dark.png`} alt={alt} width={1280} height={800} className="hidden h-auto w-full dark:block" sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
      <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>
    </figure>
  );
}
