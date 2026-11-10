import { ArrowLeft, BookOpen, ChartPie, CheckCheck, CloudUpload, Repeat, Sprout, Timer } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GuestOnly } from "@/components/home/guest-only";
import { Hero } from "@/components/home/hero";
import { Faq } from "@/components/pricing/faq";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { FIRST_LESSON, TOPICS } from "@/lib/catalog";
import { BASICS_LESSONS } from "@/lib/study/basics";
import { firstLessonHref } from "@/lib/study/first-lesson";
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

/** A week on the site, in the order it happens. Each step is something the site really does. */
const WEEK: { title: string; body: string; art: ReactNode }[] = [
  { title: "לומדים מושג אחד", body: "כל מסך מסביר רעיון אחד, עם דוגמה שהמספרים בה זזים כשמשנים נתון.", art: <ArtConcept /> },
  { title: "פותרים, ורואים מיד אם צדקתם", body: "פקודות יומן, חישובים ואמריקאיות. טעיתם? רואים מיד למה התשובה השגויה נראתה נכונה.", art: <ArtCheck /> },
  { title: "הטעויות חוזרות אליכם", body: "שאלה שטעיתם בה חוזרת אחרי יום, אחרי שלושה ימים ואחרי שבוע, עד שהיא יושבת.", art: <ArtReview /> },
  { title: "רואים כמה אתם מוכנים", body: "מוכנות לכל נושא, וספירה לאחור לתאריך המבחן שאתם מזינים.", art: <ArtReady /> },
];

/** Why make an account, said plainly: what it keeps. Learning without one works too. */
const SIGNUP: { icon: ReactNode; title: string; body: string }[] = [
  { icon: <CloudUpload className="h-5 w-5" aria-hidden />, title: "ההתקדמות נשמרת", body: "בטלפון, במחשב או בספרייה. ממשיכים בדיוק מאיפה שעצרתם." },
  { icon: <Repeat className="h-5 w-5" aria-hidden />, title: "תור חזרה אישי", body: "רק השאלות שאתם טעיתם בהן, כל אחת ביום שלה." },
  { icon: <Timer className="h-5 w-5" aria-hidden />, title: "ספירה לאחור למבחן", body: "מזינים תאריך, ורואים מה עוד נשאר ללמוד עד אז." },
  { icon: <ChartPie className="h-5 w-5" aria-hidden />, title: "מוכנות לכל נושא", body: "מספר אחד שאומר כמה אתם מוכנים, ומה יעלה אותו." },
];

const FAQ = [
  { q: "זה באמת חינם?", a: `כן. כל ${BASICS_LESSONS.length} השיעורים של ״חשבונאות מאפס״, עם התרגול, השאלות המלאות והסיכומים, פתוחים בחינם. וגם השיעור הראשון בכל קורס מתקדם.` },
  { q: "צריך כרטיס אשראי או הרשמה?", a: "לא. אפשר להתחיל את שיעור 1 עכשיו, בלי הרשמה ובלי כרטיס אשראי. חשבון צריך רק כדי לשמור את ההתקדמות ואת החזרה בין מכשירים." },
  { q: "מה ההבדל בין זה לחיפוש תשובה ברשת?", a: "תשובה מהרשת, או מצ׳אטבוט, לא יודעת מה למדתם ובאיזו רמה, ולפעמים היא פשוט לא נכונה לפי התקן. כאן כל שאלה בנויה על החומר של השיעור, והמשוב מסביר בדיוק איפה טעיתם." },
  { q: "זה מתאים לחומר שלומדים אצלנו?", a: "הקורסים בנויים לפי תקני ה־IFRS שמלמדים בכל המוסדות. הסדר של הנושאים יכול להיות שונה אצל המרצה שלכם, אז הכי פשוט לעשות את שיעור 1 בנושא שלכם, בחינם, ולראות." },
  { q: "מה קורה עם הטעויות שלי?", a: "כל שאלה שטעיתם בה נכנסת לחזרה, וחוזרת אליכם אחרי יום, אחרי שלושה ימים ואחרי שבוע. שלוש פעמים נכון ברצף, והיא יוצאת מהחזרה." },
  { q: "צריך רקע קודם?", a: "לא. הקורס מאפס מתחיל ממש מההתחלה: מה זה עסק, מה זה נכס ולמה יש חובה וזכות." },
];

const count = (m: StudyModule) => m.exercises.length + m.traps.length;

/**
 * The home page's content, shared by "/" and its A/B variants (/x/hero/<variant>, served at "/" by the proxy):
 * the same page, with the hero's variant passed through. It shows how the site works rather than describing it:
 * a one-minute lesson in the hero, a week on the site, what an account keeps, then the two ways in.
 */
export async function HomeContent({ heroVariant }: { heroVariant?: string }) {
  const total = BASICS_LESSONS.reduce((a, m) => a + count(m), 0);
  // What the admin hid: a section, a button (or its text), a course or a lesson.
  const v = await getVisibility();
  const show = (key: string) => !isHidden(v, key);
  const linked = (href: string) => !isLinkHidden(v.links, href);
  const button = (id: keyof typeof BUTTONS, href: string) => show(BUTTONS[id].key) && linked(href);
  const text = (id: keyof typeof BUTTONS) => labelOf(v, BUTTONS[id].key, BUTTONS[id].label);
  const free = TOPICS.find((t) => t.tier === "free" && linked(t.href));
  const paid = TOPICS.filter((t) => t.tier !== "free" && linked(t.href));
  const half = Math.ceil(FAQ.length / 2);
  return (
    <>
      <Hero variant={heroVariant} doors={paid.map((t) => ({ title: t.title, standard: t.standard, href: firstLessonHref(t) }))} lessons={BASICS_LESSONS.length} exercises={total} videos={BASICS_LESSONS.reduce((a, m) => a + (m.videos?.length ?? 0), 0)} />

      {show("home:how") && (
        <section className="border-y border-line bg-surface/50">
          <Container className="py-16 sm:py-20">
            <SectionHeading eyebrow="ככה עובר עליכם שבוע" title="מהשיעור הראשון ועד שאתם מוכנים למבחן" />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WEEK.map((s, i) => (
                <li key={s.title} className="card flex flex-col gap-2 p-5">
                  <span className="num grid h-8 w-8 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="text-[17px] font-bold text-fg">{s.title}</span>
                  <span className="text-[15px] leading-relaxed text-muted">{s.body}</span>
                  <span className="mt-auto pt-3" aria-hidden>
                    {s.art}
                  </span>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {show("home:signup") && (
        <GuestOnly>
          <Container className="pt-16 sm:pt-20">
            <div className="grid gap-8 rounded-3xl bg-[#0f3d2e] p-7 text-[#eaf3ee] sm:p-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="text-[15px] font-semibold text-[#7fd3a6]">הרשמה חינם</p>
                <h2 className="mt-2 font-display text-[1.9rem] leading-tight font-black sm:text-[2.4rem]">מה מקבלים כשנרשמים</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#c9ddd1]">אפשר ללמוד גם בלי חשבון. עם חשבון, שום דבר לא הולך לאיבוד.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/register" size="lg" className="border-transparent bg-[#7fd3a6] text-[#062016] hover:brightness-110">
                    להירשם בחינם <ArrowLeft className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                  <ButtonLink href={FIRST_LESSON} size="lg" variant="secondary" className="border-white/30 bg-transparent text-[#eaf3ee] hover:bg-white/10">
                    להתחיל בלי הרשמה
                  </ButtonLink>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {SIGNUP.map((b) => (
                  <li key={b.title} className="flex gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                    <span className="mt-0.5 text-[#e8b54a]">{b.icon}</span>
                    <span>
                      <span className="block text-[16px] font-bold">{b.title}</span>
                      <span className="mt-1 block text-[14.5px] leading-relaxed text-[#c9ddd1]">{b.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </GuestOnly>
      )}

      {show("home:courses") && (free || paid.length > 0) && (
        <Container id="courses" className="scroll-mt-20 pt-16 sm:pt-20">
          <SectionHeading title="מאיפה מתחילים?" description="מתחילים מאפס בחינם, או קופצים ישר לנושא שאתם לומדים עכשיו. בכל קורס, שיעור 1 חינם." />
          <div className="mt-8 grid gap-4 lg:grid-cols-[5fr_7fr]">
            {free && (
              <div className="flex flex-col gap-3 rounded-2xl bg-accent-soft p-6 sm:p-7">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                  <Sprout className="h-3.5 w-3.5" aria-hidden /> חינם כולו
                </span>
                <h3 className="text-[24px] font-bold text-fg">{free.title}</h3>
                <p className="text-[15.5px] leading-relaxed text-muted">{free.covers.slice(0, 5).join(", ")}.</p>
                <p className="num text-sm text-muted">
                  {free.lessons} שיעורים · {total} שאלות תרגול
                </p>
                <ButtonLink href={FIRST_LESSON} size="lg" className="mt-auto w-full sm:w-fit">
                  להתחיל משיעור 1 <ArrowLeft className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </div>
            )}
            {paid.length > 0 && (
              <div className="card overflow-hidden">
                <p className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[15px] font-bold text-fg">
                  <BookOpen className="h-4 w-4 text-accent" aria-hidden /> לפי נושא
                </p>
                <ul>
                  {paid.map((t) => (
                    <li key={t.id} className="border-b border-line last:border-b-0">
                      <Link href={t.href} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60">
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-fg">
                            {t.title}
                            {t.standard && (
                              <bdi dir="ltr" className="num rounded-md bg-surface-2 px-1.5 py-px text-xs font-medium text-muted">
                                {t.standard}
                              </bdi>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                              <Sprout className="h-3 w-3" aria-hidden /> שיעור 1 חינם
                            </span>
                          </span>
                          <span className="num mt-1 block text-[13.5px] text-muted">{[`${t.lessons} שיעורים`, ...t.covers.slice(0, 3)].join(" · ")}</span>
                        </span>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line-strong text-accent transition group-hover:border-accent/60">
                          <ArrowLeft className="h-4 w-4" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/learn" className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-sm font-semibold text-accent hover:underline">
                  כל השיעורים בשמם, במפת הלימוד <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            )}
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
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">שאלות שסטודנטים שואלים לפני שמתחילים</h2>
          <div className="mt-6 grid gap-x-8 md:grid-cols-2">
            <Faq items={FAQ.slice(0, half)} />
            <Faq items={FAQ.slice(half)} />
          </div>
        </Container>
      )}

      {show("home:final") && (
        <Container className="pt-16 sm:pt-20">
          <div className="rounded-2xl bg-[#0f3d2e] p-8 text-[#eaf3ee] sm:p-12">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl font-bold sm:text-[2rem]">שיעור 1 לוקח כמה דקות.</p>
                <p className="mt-2 text-[15px] text-[#c9ddd1]">בלי הרשמה, בלי כרטיס אשראי. ואם נתקעתם, רואים מיד למה.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {button("finalStart", FIRST_LESSON) && (
                  <ButtonLink href={FIRST_LESSON} size="lg" variant="secondary" className="border-transparent bg-[#eaf3ee] text-[#0f3d2e] hover:bg-white">
                    {text("finalStart")} <ArrowLeft className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                )}
                <ButtonLink href="/learn" size="lg" variant="secondary" className="border-white/30 bg-transparent text-[#eaf3ee] hover:bg-white/10">
                  לבחור נושא
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      )}
    </>
  );
}

/* The week's small pictures: drawn from the site's own pieces (a journal line, an answer, the review count, the readiness ring), not screenshots. */

function ArtConcept() {
  return (
    <span className="num block rounded-xl border border-line bg-canvas p-3 text-[12.5px]">
      <span className="flex justify-between border-b border-line pb-1.5">
        <span>
          <b className="me-1 text-debit">ח׳</b>ציוד
        </span>
        <span>12,000</span>
      </span>
      <span className="flex justify-between pt-1.5 ps-4">
        <span>
          <b className="me-1 text-credit">ז׳</b>מזומנים
        </span>
        <span>12,000</span>
      </span>
    </span>
  );
}

function ArtCheck() {
  return (
    <span className="block space-y-1.5 rounded-xl border border-line bg-canvas p-3 text-[12.5px]">
      <span className="flex items-center gap-1.5 rounded-md border border-success/50 bg-success/10 px-2 py-1 font-semibold text-success">
        <CheckCheck className="h-3.5 w-3.5" /> נכון
      </span>
      <span className="block rounded-md border border-trap/40 bg-trap-soft px-2 py-1 font-semibold text-trap">⚠ המלכודת: למה זה מפתה</span>
    </span>
  );
}

function ArtReview() {
  return (
    <span className="block rounded-xl border border-line bg-canvas p-3 text-[12.5px]">
      <span className="flex items-center gap-1.5 font-semibold text-accent">
        <Repeat className="h-3.5 w-3.5" /> שאלות שמחכות היום
      </span>
      <span className="mt-2 flex gap-1">
        {["היום", "+1", "+3", "+7"].map((d, i) => (
          <span key={d} className={`num flex-1 rounded-md py-1 text-center ${i === 0 ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted"}`}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function ArtReady() {
  return (
    <span className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-3 text-[12.5px]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "conic-gradient(var(--gold-strong) 62%, var(--surface-2) 0)" }}>
        <span className="h-6 w-6 rounded-full bg-canvas" />
      </span>
      <span>
        <span className="block font-semibold text-fg">מוכנות לנושא</span>
        <span className="block text-muted">וספירה לאחור למבחן</span>
      </span>
    </span>
  );
}
