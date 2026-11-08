import { CalendarCheck, Flame, Mail, Repeat, Share2, TrendingUp, UserPlus, Users, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import type { Funnel, FunnelSteps } from "@/lib/data/admin";
import { cn } from "@/lib/utils";
import { ColumnChart, type Point } from "./charts";
import { RANGES, Segmented } from "./dashboard-view";
import { AdminHeader, count, Kpi, Panel, pct } from "./ui";

/** Names for what the server sends as ids: lessons, traps and courses (built on the server from the catalog). */
export type FunnelLabels = { lessons: Record<string, string>; traps: Record<string, string>; courses: Record<string, string> };

const STEPS: { key: keyof FunnelSteps; label: string; hint: string }[] = [
  { key: "entered", label: "נכנסו לאתר", hint: "דפדפנים שנכנסו בטווח, בכל עמוד" },
  { key: "answered", label: "ענו על שאלה", hint: "לפחות תשובה אחת בתרגול, בחזרה, בבדיקה או בדף הבית" },
  { key: "activated", label: "Activation", hint: "5 תשובות ומעלה, ואחת מהן מלכודת" },
  { key: "signedUp", label: "נרשמו", hint: "פתחו חשבון" },
  { key: "returned", label: "חזרו ביום אחר", hint: "פעילות בשני ימים שונים לפחות" },
  { key: "paywall", label: "ראו פייוול", hint: "הגיעו לשיעור או מבחן נעול" },
  { key: "plan", label: "בחרו מסלול", hint: "לחצו על מסלול בעמוד המחירים או בפייוול" },
  { key: "checkout", label: "התחילו תשלום", hint: "נכנסו לעמוד התשלום" },
  { key: "paid", label: "שילמו", hint: "תשלום שעבר" },
];

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
export function FunnelView({ now, before, days, source, labels, asOf }: { now: Funnel; before: Funnel; days: number; source?: string; labels: FunnelLabels; asOf: number }) {
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
    ["entered", "answered"],
    ["answered", "activated"],
    ["activated", "signedUp"],
    ["paywall", "plan"],
    ["plan", "checkout"],
    ["checkout", "paid"],
  ];
  const prevOf = Object.fromEntries(CHAIN.map(([a, c]) => [c, a])) as Partial<Record<keyof FunnelSteps, keyof FunnelSteps>>;
  const worst = CHAIN.filter(([a, c]) => f[a] > 0 && f[c] <= f[a]).sort(([a1, c1], [a2, c2]) => f[c1] / f[a1] - f[c2] / f[a2])[0]?.[1];
  const lastWeek = now.weekly.at(-1)?.learners ?? 0;
  const prevWeek = before.weekly.at(-1)?.learners ?? 0;

  return (
    <div>
      <AdminHeader
        title="משפך וצמיחה"
        description="מכניסה ועד תשלום: איפה סטודנטים נושרים, מאיפה הם מגיעים, והאם הם חוזרים. נתונים מצרפיים בלבד — כל דפדפן נספר פעם אחת בכל שלב, ואין כאן מידע על משתמש בודד."
      />

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
        <Kpi icon={UserPlus} label="נרשמו" value={count(f.signedUp)} hint={[`${pct(f.signedUp, f.entered)} מהנכנסים`, delta(f.signedUp, b.signedUp)].filter(Boolean).join(" · ")} tone={tone(f.signedUp, b.signedUp)} />
        <Kpi icon={Wallet} label="שילמו" value={count(f.paid)} hint={`${pct(f.paid, f.entered)} מהנכנסים`} tone={tone(f.paid, b.paid)} />
        <Kpi icon={TrendingUp} label="לומדים שבועיים (10+)" value={count(lastWeek)} hint={delta(lastWeek, prevWeek) ?? "השבוע האחרון בטווח"} tone={tone(lastWeek, prevWeek)} />
        <Kpi icon={Repeat} label="חזרו ביום אחר" value={pct(f.returned, f.entered)} hint={`קודם ${pct(b.returned, b.entered)}`} />
      </div>

      <Panel className="mt-6" title="המשפך" description="כמה מהנכנסים הגיעו לכל שלב. השלב שבו נושר החלק הגדול ביותר מסומן.">
        {f.entered === 0 ? (
          <p className="text-sm text-muted">אין עדיין כניסות בטווח הזה.</p>
        ) : (
          <ol className="space-y-2.5">
            {STEPS.map((s) => {
              const v = f[s.key];
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
                    {from && f[from] > 0 && v <= f[from] && <span className="block text-[11px] text-subtle">{pct(v, f[from])} מהשלב הקודם</span>}
                    {bad && <span className="block text-[11px] text-amber-700 dark:text-amber-400">הנשירה הגדולה</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-xs text-subtle">האחוז הראשי: מתוך כל הנכנסים. מתחתיו, בשלבים שבאים זה אחר זה: מתוך מי שהגיע לשלב הקודם. ״חזרו ביום אחר״ ו״ראו פייוול״ לא תלויים בהרשמה, ולכן הם לא מושווים לשלב שלפניהם.</p>
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
              head={["מקור", "נכנסו", "ענו", "Activation", "נרשמו", "שילמו"]}
              rows={now.sources.map((s) => [
                <Link key="s" href={href({ source: s.source })} className="font-medium text-fg hover:text-accent hover:underline">
                  {sourceLabel(s.source)}
                </Link>,
                count(s.visitors),
                pct(s.answered, s.visitors),
                pct(s.activated, s.visitors),
                pct(s.signedUp, s.visitors),
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

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
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
                <td key={i} className={cn("px-2 py-2", i ? "text-end whitespace-nowrap" : "min-w-[8rem] text-start [overflow-wrap:anywhere]")}>
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
