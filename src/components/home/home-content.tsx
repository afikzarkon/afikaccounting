import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/hero";
import { Faq } from "@/components/pricing/faq";
import { TierBadge } from "@/components/pricing/tier-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { FIRST_LESSON, tasteLabel, TOPICS } from "@/lib/catalog";
import { featuredCheck, featuredQuestion } from "@/lib/check";
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

/**
 * The home page's content, shared by "/" and its A/B variants (/x/hero/<variant>, served at "/" by the proxy):
 * the same page, with the hero's variant passed through.
 */
export async function HomeContent({ heroVariant }: { heroVariant?: string }) {
  // The hero's question and the summary check it points to: chosen from the catalog (course contents still move), never pinned to a lesson.
  const hero = featuredQuestion();
  const check = featuredCheck();
  const total = BASICS_LESSONS.reduce((a, m) => a + count(m), 0);
  // What the admin hid: a section, a button (or its text), a course or a lesson.
  const v = await getVisibility();
  const show = (key: string) => !isHidden(v, key);
  const linked = (href: string) => !isLinkHidden(v.links, href);
  const button = (id: keyof typeof BUTTONS, href: string) => show(BUTTONS[id].key) && linked(href);
  const text = (id: keyof typeof BUTTONS) => labelOf(v, BUTTONS[id].key, BUTTONS[id].label);
  const free = TOPICS.find((t) => t.tier === "free" && linked(t.href));
  const paid = TOPICS.filter((t) => t.tier !== "free" && linked(t.href));
  return (
    <>
      <Hero variant={heroVariant} question={hero} check={check} lessons={BASICS_LESSONS.length} exercises={total} videos={BASICS_LESSONS.reduce((a, m) => a + (m.videos?.length ?? 0), 0)} />

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
            <div className="mt-10 hidden gap-6 sm:grid lg:grid-cols-[1.25fr_1fr]">
              <Shot name="lesson" alt="מסך מושג בשיעור: הכותרת, ההסבר, דוגמה חיה, והכפתורים להמשך" caption="מסך בשיעור: מושג אחד עם דוגמה חיה — כאן עסק שלם, פקודה אחר פקודה" />
              <Shot name="course" alt="דף הקורס: המסלול שלך, כפתור להמשך השיעור הבא, ושורה עם מוכנות למבחן, ספירה לאחור ורצף ימי למידה" caption="דף הקורס: הצעד הבא, מוכנות למבחן, ספירה לאחור ורצף" />
            </div>
          </Container>
        </section>
      )}

      {show("home:courses") && (free || paid.length > 0) && (
        <Container id="courses" className="scroll-mt-20 pt-16 sm:pt-20">
          <SectionHeading title="הקורסים" description="מתחילים מאפס בחינם, או קופצים ישר לנושא שיש בו מבחן. בכל קורס מתקדם השיעור הראשון עלינו." />
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {[...(free ? [free] : []), ...paid].map((t) => (
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
                    {t.tier === "free" ? <TierBadge tier="free" label="חינם, כל השיעורים" /> : (
                      <>
                        <TierBadge tier={t.tier} />
                        <TierBadge tier="free" label={tasteLabel(t)} />
                      </>
                    )}
                  </span>
                  <span className="mt-3 line-clamp-3 flex-1 text-[13.5px] leading-relaxed text-muted">{t.description}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {t.covers.slice(0, 5).map((c) => (
                      <span key={c} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent">
                    {t.tier === "free" ? "להתחיל משיעור 1" : `${tasteLabel(t)}, להתחיל`} <ArrowLeft className="ms-auto h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {show("home:check") && check && linked(check.href) && (
        <Container className="pt-16 sm:pt-20">
          <div className="card bg-grid flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">יש לכם סיכום? תבדקו אותו.</h2>
              <p className="mt-2 max-w-2xl text-[15.5px] leading-relaxed text-muted">
                5 שאלות ברמת מבחן, בכל אחת מלכודת שסטודנטים נופלים בה. פותחים את הסיכום, עונים, ורואים איפה הייתם מפסידים נקודות — בלי הרשמה.
              </p>
            </div>
            <ButtonLink href={check.href} size="lg">
              לבדיקה <ArrowLeft className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
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
