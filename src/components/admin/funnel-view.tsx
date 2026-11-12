import { CalendarCheck, Clock, Flame, Mail, Repeat, Share2, TrendingUp, UserPlus, Users, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import type { Funnel, FunnelSteps, VariantResult } from "@/lib/data/admin";
import { compare, EXPERIMENTS } from "@/lib/experiments";
import { cn } from "@/lib/utils";
import { ColumnChart, type Point } from "./charts";
import { Glossary, WHO_TERMS } from "./glossary";
import { RANGES, Segmented } from "./dashboard-view";
import { AdminHeader, count, Kpi, Panel, pct } from "./ui";

/** Names for what the server sends as ids: lessons, traps and courses (built on the server from the catalog). */
export type FunnelLabels = { lessons: Record<string, string>; traps: Record<string, string>; courses: Record<string, string> };

/** The closed site's path: in, an account, approved, a lesson, an answer, activation, back another day. */
const STEPS: { key: keyof FunnelSteps; label: string; hint: string }[] = [
  { key: "entered", label: "נכנסו לאתר", hint: "אנשים שנכנסו בטווח (אדם אחד מכל המכשירים שלו)" },
  { key: "accounts", label: "יש להם חשבון", hint: "נכנסו עם חשבון, או שהדפדפן שלהם חובר פעם לחשבון" },
  { key: "approved", label: "מאושרים", hint: "החשבון אושר בניהול (מצב נוכחי)" },
  { key: "lessonStarted", label: "פתחו שיעור", hint: "התחילו לפחות שיעור אחד" },
  { key: "answered", label: "ענו על שאלה", hint: "לפחות תשובה אחת בתרגול, בחזרה או במבחן" },
  { key: "activated", label: "Activation", hint: "5 תשובות ומעלה, ואחת מהן מלכודת" },
  { key: "returned", label: "חזרו ביום אחר", hint: "פעילות בשני ימים שונים לפחות" },
];
/** Payment steps: shown only once there is something in them (pricing is hidden for now). */
const PAY_STEPS: { key: keyof FunnelSteps; label: string; hint: string }[] = [
  { key: "paywall", label: "ראו פייוול", hint: "הגיעו לשיעור או מבחן נעול" },
  { key: "plan", label: "בחרו מסלול", hint: "לחצו על מסלול בעמוד המחירים או בפייוול" },
  { key: "checkout", label: "התחילו תשלום", hint: "נכנסו לעמוד התשלום" },
  { key: "paid", label: "שילמו", hint: "תשלום שעבר" },
];
const val = (f: FunnelSteps, k: keyof FunnelSteps) => Number(f[k] ?? 0);

export function sourceLabel(s: string) {
  if (s === "direct") return "ישיר (בלי מקור)";
  if (s === "share") return "שיתוף מהאתר (וואטסאפ)";
  if (s === "email") return "תזכורת במייל";
  if (s.startsWith("ref:")) return `שגריר/ה: ${s.slice(4)}`;
  if (s.startsWith("site:")) return `הפניה מ־${s.slice(5)}`;
  return s;
}

/** Change against the period before, as "+12%" — or nothing when there is nothing to compare. */
function delta(now: number, before: number) {
  if (!before) return now ? "חדש בתקופה הזאת" : undefined;
  const d = ((now - before) / before) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}% מהתקופה הקודמת`;
}
const tone = (now: number, before: number) => (before && now > before ? "good" : before && now < before ? "warn" : undefined);

/**
 * The growth dashboard: the funnel from entry to payment, where visitors come
 * from, whether they come back, the habit features, and how each lesson and
 * trap performs. Pure: the page loads the data and checks access.
 */
export function FunnelView({ now, before, days, source, labels, asOf, experiments = {} }: { now: Funnel; before: Funnel; days: number; source?: string; labels: FunnelLabels; asOf: number; experiments?: Record<string, VariantResult[]> }) {
  const f = now.funnel;
  const b = before.funnel;
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { range: String(days), source, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/funnel?${p}`;
  };
  // The step that loses the largest share of those who reached the one before it — along the chain whose steps
  // follow each other (entry → answer → activation → sign-up; paywall → plan → checkout → payment). "Back on another
  // day" isn't a step after sign-up, so it isn't compared.
  const CHAIN: [keyof FunnelSteps, keyof FunnelSteps][] = [
    ["entered", "accounts"],
    ["accounts", "approved"],
    ["approved", "lessonStarted"],
    ["lessonStarted", "answered"],
    ["answered", "activated"],
    ["paywall", "plan"],
    ["plan", "checkout"],
    ["checkout", "paid"],
  ];
  const prevOf = Object.fromEntries(CHAIN.map(([a, c]) => [c, a])) as Partial<Record<keyof FunnelSteps, keyof FunnelSteps>>;
  const worst = CHAIN.filter(([a, c]) => val(f, a) > 0 && val(f, c) <= val(f, a)).sort(([a1, c1], [a2, c2]) => val(f, c1) / val(f, a1) - val(f, c2) / val(f, a2))[0]?.[1];
  const paying = PAY_STEPS.some((s) => val(f, s.key) > 0);
  const shown = f.accounts === undefined ? STEPS.filter((s) => s.key !== "accounts" && s.key !== "approved" && s.key !== "lessonStarted") : STEPS;
  const lastWeek = now.weekly.at(-1)?.learners ?? 0;
  const prevWeek = before.weekly.at(-1)?.learners ?? 0;

  return (
    <div>
      <AdminHeader
        title="משפך וצמיחה"
        description="מכניסה ועד לימוד קבוע: איפה סטודנטים נעצרים, מאיפה הם מגיעים, והאם הם חוזרים. כל אדם נספר פעם אחת בכל שלב, מכל המכשירים שלו."
      />
      <FunnelGlossary />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented label="טווח" options={RANGES.map((r) => ({ label: r.label, href: href({ range: String(r.days) }), on: r.days === days }))} />
        {source && (
          <span className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent">
            מקור: {sourceLabel(source)}
            <Link href={href({ source: undefined })} className="underline">
              הסרה
            </Link>
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi icon={Users} label="נכנסו לאתר" value={count(f.entered)} hint={delta(f.entered, b.entered) ?? `${count(now.newVisitors)} חדשים`} tone={tone(f.entered, b.entered)} />
        <Kpi icon={Zap} label="Activation" value={pct(f.activated, f.entered)} hint={`${count(f.activated)} דפדפנים · קודם ${pct(b.activated, b.entered)}`} />
        <Kpi icon={UserPlus} label="חשבונות חדשים" value={now.newAccounts === undefined ? count(f.signedUp) : count(now.newAccounts)} hint={delta(now.newAccounts ?? f.signedUp, before.newAccounts ?? b.signedUp) ?? "נרשמו לאתר בטווח"} tone={tone(now.newAccounts ?? f.signedUp, before.newAccounts ?? b.signedUp)} />
        {now.pendingApproval !== undefined ? (
          <Link href="/admin/users" className="block">
            <Kpi icon={Clock} label="ממתינים לאישור" value={count(now.pendingApproval)} hint={now.pendingApproval ? "לחצו לאישור בעמוד המשתמשים" : "אין ממתינים"} tone={now.pendingApproval ? "warn" : undefined} />
          </Link>
        ) : (
          <Kpi icon={Wallet} label="שילמו" value={count(f.paid)} hint={`${pct(f.paid, f.entered)} מהנכנסים`} tone={tone(f.paid, b.paid)} />
        )}
        <Kpi icon={TrendingUp} label="לומדים שבועיים (10+)" value={count(lastWeek)} hint={delta(lastWeek, prevWeek) ?? "השבוע האחרון בטווח"} tone={tone(lastWeek, prevWeek)} />
        <Kpi icon={Repeat} label="חזרו ביום אחר" value={pct(f.returned, f.entered)} hint={`קודם ${pct(b.returned, b.entered)}`} />
      </div>

      <Panel className="mt-6" title="המשפך" description="כמה מהנכנסים הגיעו לכל שלב. השלב שבו נושר החלק הגדול ביותר מסומן.">
        {f.entered === 0 ? (
          <p className="text-sm text-muted">אין עדיין כניסות בטווח הזה.</p>
        ) : (
          <ol className="space-y-2.5">
            {[...shown, ...(paying ? PAY_STEPS : [])].map((s) => {
              const v = val(f, s.key);
              const from = prevOf[s.key];
              const bad = s.key === worst;
              return (
                <li key={s.key} className="grid grid-cols-[9.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)_8rem]">
                  <span className="min-w-0" title={s.hint}>
                    <span className="block font-medium text-fg">{s.label}</span>
                    <span className="block truncate text-[11px] text-subtle">{s.hint}</span>
                  </span>
                  <span className="h-6 overflow-hidden rounded-lg bg-surface-2">
                    <span className={cn("block h-full rounded-lg", bad ? "bg-amber-500" : "bg-accent")} style={{ width: `${Math.max(1, (v / f.entered) * 100)}%` }} />
                  </span>
                  <span className="num text-end">
                    <span className="font-semibold text-fg">{count(v)}</span>{" "}
                    <span className="text-xs text-muted">{pct(v, f.entered)}</span>
                    {from && val(f, from) > 0 && v <= val(f, from) && <span className="block text-[11px] text-subtle">{pct(v, val(f, from))} מהשלב הקודם</span>}
                    {bad && <span className="block text-[11px] text-amber-700 dark:text-amber-400">הנשירה הגדולה</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-xs text-subtle">האחוז הראשי: מתוך כל הנכנסים. מתחתיו: מתוך מי שהגיע לשלב הקודם. ״מאושרים״ הוא מצב החשבון היום, לא ביום הכניסה. ״חזרו ביום אחר״ לא תלוי בשלב שלפניו, ולכן לא מושווה אליו. {paying ? "" : "שלבי התשלום מוסתרים כל עוד אין בהם נתונים (עמוד המחירים מוסתר)."}</p>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="לאורך זמן" description="נכנסים, לומדים (ענו על שאלה), נרשמים — לפי יום, או שבוע בטווח ארוך">
          <ColumnChart points={series(now.daily, days)} series={[{ name: "נכנסים" }, { name: "לומדים" }, { name: "נרשמים" }]} />
        </Panel>
        <Panel title="מקורות" description="מאיפה הגיעה הכניסה הראשונה, ומה קרה אחריה. לחיצה מסננת את כל הדאשבורד למקור.">
          {now.sources.length === 0 ? (
            <p className="text-sm text-muted">אין נתונים בטווח הזה.</p>
          ) : (
            <Table
              head={["מקור", "נכנסו", "עם חשבון", "ענו", "Activation", "שילמו"]}
              rows={now.sources.map((s) => [
                <Link key="s" href={href({ source: s.source })} className="font-medium text-fg hover:text-accent hover:underline">
                  {sourceLabel(s.source)}
                </Link>,
                count(s.visitors),
                s.accounts === undefined ? pct(s.signedUp, s.visitors) : pct(s.accounts, s.visitors),
                pct(s.answered, s.visitors),
                pct(s.activated, s.visitors),
                count(s.paid),
              ])}
            />
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="שימור לפי שבוע הכניסה הראשונה" description="מכל מי שנכנס לראשונה באותו שבוע: כמה חזרו למחרת, בשבוע השני, ובחודש השני">
          {now.retention.length === 0 ? (
            <p className="text-sm text-muted">אין נתונים בטווח הזה.</p>
          ) : (
            <Table
              head={["שבוע", "נכנסו", "למחרת", "שבוע 2", "חודש 2"]}
              rows={now.retention.map((r) => {
                const age = Math.floor((asOf - new Date(r.week).getTime()) / 86_400_000);
                const cell = (n: number, need: number) => (age >= need ? <Heat key={need} value={r.size ? n / r.size : 0} label={pct(n, r.size)} /> : <span key={need} className="text-subtle">—</span>);
                return [r.week.split("-").reverse().join("."), count(r.size), cell(r.d1, 2), cell(r.d7, 14), cell(r.d30, 60)];
              })}
            />
          )}
          <p className="mt-3 text-xs text-subtle">״—״: השבוע עוד צעיר מכדי למדוד.</p>
        </Panel>

        <Panel title="הרגל ומעורבות" description="הכלים שנועדו להחזיר סטודנטים">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat icon={Repeat} label="סשני חזרה" value={count(now.habits.reviewSessions)} hint={`${count(now.habits.reviewers)} לומדים`} />
            <Stat icon={Flame} label="למדו לפחות יום אחד" value={count(now.habits.studiers)} hint={`רצף 2–3: ${count(now.streaks.s2)} · 4–7: ${count(now.streaks.s4)} · 8+: ${count(now.streaks.s8)}`} />
            <Stat icon={CalendarCheck} label="קבעו תאריך מבחן" value={count(now.habits.examGoals)} hint={pct(now.habits.examGoals, f.entered) + " מהנכנסים"} />
            <Stat icon={Users} label="קבוצות לימוד (סה״כ)" value={count(now.habits.groups)} hint={`${count(now.habits.groupMembers)} חברים`} />
            <Stat icon={Mail} label="תזכורות במייל (פעילות)" value={count(now.habits.remindersOn)} hint={`${count(now.habits.emailVisits)} כניסות מהמייל בטווח`} />
            <Stat icon={Share2} label="שיתופים" value={count(now.shares.clicks)} hint={`${count(now.shares.visits)} כניסות משיתוף · ${count(now.shares.visitsSignedUp)} נרשמו`} />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="שיעורים" description="כמה התחילו, כמה ענו, דיוק בניסיון הראשון, וכמה נופלים במלכודות">
          {now.lessons.length === 0 ? (
            <p className="text-sm text-muted">אין נתונים בטווח הזה.</p>
          ) : (
            <Table
              head={["שיעור", "התחילו", "ענו", "דיוק ראשון", "נפילה במלכודות"]}
              rows={now.lessons.slice(0, 20).map((l) => [
                <span key="l" className="text-fg">
                  {labels.lessons[l.slug] ?? l.slug}
                </span>,
                count(l.starts),
                count(l.learners),
                pct(l.firstTryRight, l.firstTries),
                l.traps ? pct(l.trapFalls, l.traps) : "—",
              ])}
            />
          )}
        </Panel>
        <Panel title="המלכודות שהכי תופסות" description="שאלות עם 3 תשובות לפחות, לפי שיעור הנפילה. מלכודת שכמעט כולם נופלים בה — אולי ההסבר לפניה לא מספיק.">
          {now.traps.length === 0 ? (
            <p className="text-sm text-muted">אין עדיין מספיק תשובות.</p>
          ) : (
            <ol className="space-y-2">
              {now.traps.map((t) => (
                <li key={`${t.slug}:${t.id}`} className="flex items-start gap-3 text-sm">
                  <span className="num w-14 shrink-0 font-semibold text-amber-700 dark:text-amber-400">{pct(t.falls, t.answers)}</span>
                  <span className="min-w-0">
                    <span className="block [overflow-wrap:anywhere] text-fg">{labels.traps[`${t.slug}:${t.id}`] ?? t.id}</span>
                    <span className="num block text-xs text-muted">
                      {labels.lessons[t.slug] ?? t.slug} · {count(t.answers)} תשובות
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="פייוולים" description="איפה סטודנטים פוגשים נעילה, וכמה מהם בוחרים מסלול אחרי זה">
          {now.paywalls.length === 0 ? (
            <p className="text-sm text-muted">אין נתונים בטווח הזה.</p>
          ) : (
            <Table head={["נעילה", "ראו", "בחרו מסלול"]} rows={now.paywalls.map((p) => [<span key="g" className="text-fg" dir="ltr">{p.gate}</span>, count(p.views), pct(p.clicks, p.views)])} />
          )}
        </Panel>
        <Panel title="״בדקו את הסיכום שלכם״" description="הבדיקה הציבורית: התחילו, סיימו, וכמה ענו נכון בממוצע">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="התחילו" value={count(now.checks.started)} />
            <Stat label="סיימו" value={count(now.checks.completed)} hint={pct(now.checks.completed, now.checks.started)} />
            <Stat label="נכון בממוצע" value={now.checks.avgRight === null ? "—" : `${Number(now.checks.avgRight).toFixed(1)} מתוך 5`} />
          </div>
          {now.checks.byCourse.length > 0 && (
            <div className="mt-4">
              <Table head={["קורס", "התחילו", "סיימו"]} rows={now.checks.byCourse.map((c) => [labels.courses[c.course] ?? c.course, count(c.started), count(c.completed)])} />
            </div>
          )}
        </Panel>
      </div>

      {now.exams && (
        <Panel className="mt-6" title="מצב מבחן" description="10 שאלות בלי רמזים ובלי משוב עד הסוף. מכאן רואים אם סטודנטים מתרגלים כמו לפני מבחן, ועם שעון או בלי.">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="מבחנים שהתחילו" value={count(now.exams.started)} />
            <Stat label="הוגשו" value={count(now.exams.completed)} hint={pct(now.exams.completed, now.exams.started)} />
            <Stat label="עם שעון" value={pct(now.exams.timed, now.exams.started)} />
            <Stat label="נכון בממוצע" value={now.exams.avgShare === null ? "—" : `${Math.round(Number(now.exams.avgShare) * 100)}%`} />
          </div>
          {now.exams.byCourse.length > 0 && (
            <div className="mt-4">
              <Table head={["קורס", "התחילו", "הוגשו"]} rows={now.exams.byCourse.map((c) => [labels.courses[c.course] ?? c.course, count(c.started), count(c.completed)])} />
            </div>
          )}
        </Panel>
      )}

      <Panel className="mt-6" title="ניסויים (A/B)" description="כל מבקר מקבל גרסה אחת ונשאר בה. ההשוואה היא על Activation — 5 תשובות עם מלכודת — מול הגרסה הקיימת.">
        <div className="space-y-6">
          {EXPERIMENTS.map((e) => {
            const rows = experiments[e.id] ?? [];
            const control = rows.find((r) => r.variant === e.variants[0].id);
            return (
              <div key={e.id}>
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                  {e.title}
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", e.active ? "bg-success/15 text-success" : "bg-surface-2 text-muted")}>{e.active ? "פעיל" : "כבוי"}</span>
                </p>
                {rows.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">
                    {e.active ? "עוד אין חשיפות בטווח הזה." : "הניסוי כבוי: כולם רואים את הגרסה הקיימת."} תצוגה מקדימה של כל גרסה: {e.variants.map((v, i) => (
                      <a key={v.id} href={`${e.path}?ab=${e.id}:${v.id}`} className="text-accent hover:underline" dir="ltr">
                        {i ? " · " : ""}?ab={e.id}:{v.id}
                      </a>
                    ))}
                  </p>
                ) : (
                  <div className="mt-2">
                    <Table
                      head={["גרסה", "ראו", "ענו", "Activation", "נרשמו", "שילמו", "מול הקיימת"]}
                      rows={e.variants.map((v, i) => {
                        const r = rows.find((x) => x.variant === v.id) ?? { variant: v.id, visitors: 0, answered: 0, activated: 0, signedUp: 0, paid: 0 };
                        const c = i && control ? compare({ n: control.visitors, x: control.activated }, { n: r.visitors, x: r.activated }) : null;
                        return [
                          <span key="v" className="text-fg">{v.label}</span>,
                          count(r.visitors),
                          pct(r.answered, r.visitors),
                          pct(r.activated, r.visitors),
                          pct(r.signedUp, r.visitors),
                          count(r.paid),
                          i === 0 ? "—" : !c ? "צריך 30+ בכל גרסה" : `${c.lift === null ? "" : `${c.lift >= 0 ? "+" : ""}${(c.lift * 100).toFixed(0)}% · `}${c.p < 0.05 ? "מובהק" : "עוד לא מובהק"} (p=${c.p.toFixed(3)})`,
                        ];
                      })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-subtle">מפעילים ומכבים ניסוי ב־<span dir="ltr">src/lib/experiments.ts</span> (active). ״מובהק״: p קטן מ־0.05 במבחן לשני שיעורים — ובכל זאת כדאי להריץ עד הגודל שתכננתם מראש, ולא לעצור ברגע שזה נראה טוב.</p>
      </Panel>

      <details className="card mt-6 p-5 text-sm">
        <summary className="cursor-pointer font-semibold text-fg">איך כל מספר מחושב</summary>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            <strong className="text-fg">מבקר</strong> = דפדפן (מזהה אקראי שנשמר בדפדפן). מי שנכנס מטלפון וממחשב נספר פעמיים, עד שהוא מתחבר.
          </li>
          <li>
            <strong className="text-fg">נכנסו</strong> = הכניסה הראשונה בטווח, בכל עמוד באתר. <strong className="text-fg">המקור</strong> נלקח ממנה: קישור שגריר (ref), תגית קמפיין (utm_source), אתר מפנה, או ישיר.
          </li>
          <li>
            <strong className="text-fg">Activation</strong> = 5 תשובות לפחות, ואחת מהן מלכודת. <strong className="text-fg">חזרו ביום אחר</strong> = פעילות בשני ימים שונים לפחות בטווח.
          </li>
          <li>
            <strong className="text-fg">לומדים שבועיים</strong> = מי שענה על 10 שאלות ומעלה באותו שבוע. זה מדד הצפון: הוא סופר למידה אמיתית, לא תנועה.
          </li>
          <li>
            <strong className="text-fg">שימור</strong> = לפי שבוע הכניסה הראשונה אי־פעם: חזרו למחרת, בימים 7–13, ובימים 30–59.
          </li>
          <li>
            <strong className="text-fg">דיוק ראשון</strong> = תשובות נכונות בניסיון הראשון מתוך הניסיונות הראשונים. <strong className="text-fg">נפילה במלכודות</strong> = תשובות שגויות למלכודות מתוך כל התשובות להן.
          </li>
          <li>השינוי מוצג מול תקופה באותו אורך שקדמה לה. הנתונים נשמרים כפי שהתקבלו; האירועים החדשים נאספים מאז העדכון האחרון, ולכן תקופות מוקדמות יותר יראו פחות.</li>
        </ul>
      </details>
    </div>
  );
}

function series(daily: Funnel["daily"], days: number): Point[] {
  const fmt = (d: string) => d.split("-").reverse().slice(0, 2).join(".");
  if (days <= 90) return daily.map((d) => ({ label: d.day, tick: fmt(d.day), values: [d.entries, d.learners, d.signups] }));
  // A long range: by week (starting Sunday), so the chart stays readable.
  const weeks = new Map<string, number[]>();
  for (const d of daily) {
    const t = new Date(`${d.day}T12:00:00Z`);
    t.setUTCDate(t.getUTCDate() - t.getUTCDay());
    const k = t.toISOString().slice(0, 10);
    const v = weeks.get(k) ?? [0, 0, 0];
    weeks.set(k, [v[0] + d.entries, v[1] + d.learners, v[2] + d.signups]);
  }
  return [...weeks].map(([k, v]) => ({ label: `שבוע ${fmt(k)}`, tick: fmt(k), values: v }));
}

/** `compact`: the first column gives up its minimum width, for a short code that shares a phone's width with four numbers. */
export function Table({ head, rows, compact = false }: { head: string[]; rows: React.ReactNode[][]; compact?: boolean }) {
  return (
    <div className="scroll-x">
      <table className="num w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            {head.map((h, i) => (
              <th key={h} className={cn("px-2 py-1.5 font-medium whitespace-nowrap", i ? "text-end" : "text-start")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-line/70">
              {r.map((c, i) => (
                <td key={i} className={cn("px-2 py-2", i ? "text-end whitespace-nowrap" : cn("text-start [overflow-wrap:anywhere]", !compact && "min-w-[8rem]"))}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Heat({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-block min-w-[3.5rem] rounded-md px-1.5 py-0.5 text-fg" style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(Math.min(1, value) * 70)}%, transparent)` }}>
      {label}
    </span>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon?: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        {Icon && <Icon className="h-3.5 w-3.5 text-accent" aria-hidden />} {label}
      </p>
      <p className="num mt-1 text-xl font-semibold text-fg">{value}</p>
      {hint && <p className="num mt-0.5 text-[11px] text-subtle">{hint}</p>}
    </div>
  );
}

function FunnelGlossary() {
  return (
    <Glossary
      intro="המשפך עוקב אחרי אנשים, לא אחרי דפדפנים: סטודנט שנכנס מהמחשב ומהטלפון ומחובר לחשבון נספר פעם אחת. כל שלב סופר כמה מהנכנסים בטווח הגיעו אליו אי פעם בתוך הטווח."
      groups={[
        { title: "מי נכנס", terms: WHO_TERMS },
        {
          title: "שלבי המשפך",
          terms: [
            { term: "נכנסו לאתר", meaning: "אנשים שהייתה להם לפחות כניסה אחת בטווח. מקור הכניסה הוא המקור של הכניסה הראשונה שלהם בטווח." },
            { term: "יש להם חשבון", meaning: "נכנסו מחוברים, או מדפדפן שהתחברו ממנו פעם. האתר סגור, אז מי שאין לו חשבון רואה רק את דף ההתחברות וההרשמה." },
            { term: "מאושרים", meaning: "החשבון אושר בעמוד משתמשים והרשאות. זה המצב היום: מי שאושר אחרי סוף הטווח נספר גם הוא." },
            { term: "פתחו שיעור", meaning: "פתחו לפחות שיעור אחד בטווח." },
            { term: "ענו על שאלה", meaning: "לפחות תשובה אחת: תרגול בשיעור, מלכודת, חזרה מרווחת או מבחן." },
            { term: "Activation", meaning: "הרגע שבו סטודנט באמת התחיל ללמוד: 5 תשובות לפחות, ואחת מהן על מלכודת. מי שעבר אותו נוטה הרבה יותר לחזור." },
            { term: "חזרו ביום אחר", meaning: "היו פעילים בשני ימים שונים לפחות בתוך הטווח." },
            { term: "הנשירה הגדולה", meaning: "השלב שבו הולך לאיבוד החלק הגדול ביותר ממי שהגיע לשלב שלפניו. שם כדאי להתחיל לשפר." },
          ],
        },
        {
          title: "שאר המדדים",
          terms: [
            { term: "חשבונות חדשים", meaning: "חשבונות שנפתחו בטווח, לפי מסד הנתונים (לא לפי מעקב הדפדפן)." },
            { term: "ממתינים לאישור", meaning: "חשבונות שנרשמו ועדיין מחכים לאישור שלך. עד שתאשר, הם רואים רק מסך המתנה." },
            { term: "לומדים שבועיים (10+)", meaning: "אנשים שענו על 10 שאלות לפחות באותו שבוע. מדד הצפון: הוא מראה כמה לומדים באמת, שבוע אחרי שבוע." },
            { term: "שימור", meaning: "מכל מי שנכנס לראשונה בשבוע מסוים: כמה חזרו למחרת, בשבוע השני ובחודש השני. ״—״: השבוע צעיר מכדי למדוד." },
            { term: "דיוק ראשון", meaning: "אחוז התשובות הנכונות בניסיון הראשון בשיעור. נמוך מאוד: השאלה קשה מדי, או שההסבר לפניה לא מספיק." },
            { term: "נפילה במלכודות", meaning: "אחוז התשובות השגויות במלכודות של השיעור. המלכודות נועדו להפיל, אבל אחוז גבוה מאוד מרמז שהמושג לא הוסבר טוב." },
          ],
        },
      ]}
    />
  );
}
