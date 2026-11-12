import { Activity, Calculator, Download, Eye, LogIn, MonitorSmartphone, Timer, UserRound } from "lucide-react";
import Link from "next/link";
import type { Analytics, DailyPoint, StorageUse, VisitAnalysis } from "@/lib/data/admin";
import { CALCULATORS } from "@/lib/engine/registry";
import { cn } from "@/lib/utils";
import { ColumnChart, type Point, RankedBars, ShareBar } from "./charts";
import { Glossary, WHO_TERMS } from "./glossary";
import { AdminHeader, bytes, count, Kpi, Panel, pct } from "./ui";

export const RANGES = [
  { days: 7, label: "7 ימים" },
  { days: 30, label: "30 ימים" },
  { days: 90, label: "90 ימים" },
  { days: 365, label: "שנה" },
];
export const GRAINS = [
  { value: "day", label: "יומי" },
  { value: "week", label: "שבועי" },
  { value: "month", label: "חודשי" },
] as const;
export type Grain = (typeof GRAINS)[number]["value"];

const MODULES: Record<string, string> = {
  home: "דף הבית",
  engine: "מחשבונים",
  content: "מרכז התוכן",
  // The guide page was removed; the label stays for its past page views.
  "ias16-guide": "מדריך IAS 16 (הוסר)",
  // IAS 16 moved to /basics/ias16; the label stays for its past page views.
  "ias16-lab": "IAS 16 (כתובת קודמת)",
  dashboard: "לוח אישי",
  about: "אודות",
  profile: "פרופיל",
  login: "התחברות",
  register: "הרשמה",
};
const SOURCES: Record<string, string> = { upload: "הועלה לשרת", youtube: "YouTube", vimeo: "Vimeo", demo: "תצוגה מדומה", external: "קישור חיצוני" };
const KINDS: Record<string, string> = { excel: "Excel", pdf: "PDF", video: "וידאו", image: "תמונות", other: "אחר" };


/** The analytics dashboard for one time window. Pure: the page loads the data and checks access. */
export function DashboardView({ data, storage, days, grain }: { data: Analytics; storage: StorageUse; days: number; grain: Grain }) {
  const t = data.totals;
  const s = data.solver;
  const solveAttempts = s.solveOk + s.solveFailed + s.solveInvalid;
  const regularAttempts = s.regularOk + s.regularFailed + s.regularInvalid;
  const series = bucket(data.daily, days, grain);
  const calcTitle = (slug: string) => {
    const c = CALCULATORS.find((x) => x.slug === slug);
    return c ? `${c.standard} — ${c.title}` : slug;
  };
  const storedBytes = storage.reduce((a, r) => a + Number(r.bytes), 0);
  const href = (patch: Record<string, string>) => `/admin?${new URLSearchParams({ range: String(days), by: grain, ...patch })}`;

  return (
    <div>
      <AdminHeader title="דאשבורד ואנליטיקה" description="מי נכנס לאתר, מאיפה, ומה עשה בו. משתמש מחובר נרשם עם החשבון שלו; מבקר שלא התחבר נרשם לפי מזהה אקראי של הדפדפן." />
      <DashboardGlossary />

      {/* One filter row scopes everything below it. */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented label="טווח" options={RANGES.map((r) => ({ label: r.label, href: href({ range: String(r.days) }), on: r.days === days }))} />
        <Segmented label="תצוגה" options={GRAINS.map((g) => ({ label: g.label, href: href({ by: g.value }), on: g.value === grain }))} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi icon={LogIn} label="כניסות" value={t.entries === undefined ? "—" : count(t.entries)} hint={`${count(t.sessions)} לשוניות · ${count(t.events)} אירועים`} />
        <Kpi icon={MonitorSmartphone} label="מבקרים ייחודיים" value={t.visitors === undefined ? "—" : count(t.visitors)} hint="דפדפנים שונים" />
        <Kpi icon={UserRound} label="אנשים (הערכה)" value={t.people === undefined ? "—" : count(t.people)} hint={t.accounts === undefined ? undefined : `${count(t.accounts)} מהם משתמשים מחוברים`} />
        <Kpi icon={Eye} label="צפיות בדפים" value={count(t.pageViews)} hint={data.visits?.pagesPerVisit ? `${data.visits.pagesPerVisit} דפים לכניסה` : undefined} />
        <Kpi icon={Calculator} label="חישובים" value={count(t.calcRuns)} hint={`${pct(s.solveOk + s.solveFailed, t.calcRuns)} עם נעלם`} />
        <Kpi icon={Download} label="הורדות וסרטונים" value={count(t.downloads + t.videoPlays)} hint={`${count(t.downloads)} הורדות · ${count(t.videoPlays)} סרטונים`} />
        <Kpi
          icon={Timer}
          label="זמן חישוב ממוצע"
          value={data.timing.avgMs === null ? "—" : `${data.timing.avgMs} ms`}
          hint={data.timing.p95Ms === null ? "אין דגימות" : `P95: ${Math.round(data.timing.p95Ms)} ms`}
          tone={data.timing.p95Ms !== null && data.timing.p95Ms > 500 ? "warn" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="כניסות ומבקרים לאורך זמן" description="כניסות, ומבקרים ייחודיים בכל יום. בתצוגה שבועית או חודשית: סכום הימים, כך שמבקר שחזר בכמה ימים נספר בכל אחד מהם.">
          <ColumnChart points={series.map((p) => ({ ...p, values: [p.raw.entries, p.raw.visitors] }))} series={[{ name: "כניסות" }, { name: "מבקרים" }]} />
        </Panel>
        <Panel title="צפיות בדפים" description="כל מעבר לדף, בלי ריענונים מהירים של אותו דף">
          <ColumnChart points={series.map((p) => ({ ...p, values: [p.raw.pageViews] }))} series={[{ name: "צפיות" }]} />
        </Panel>
        <Panel title="חישובים: רגיל מול שחזור נעלם" description="כל פתרון שהופק במחשבונים">
          <ColumnChart points={series.map((p) => ({ ...p, values: [p.raw.calcRegular, p.raw.calcSolve] }))} series={[{ name: "חישוב רגיל" }, { name: "שחזור נעלם (X)" }]} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="פעילות לפי אזור באתר" description="צפיות בדפים, לפי מודול">
          <RankedBars rows={data.modules.map((m) => ({ label: MODULES[m.module] ?? `/${m.module}`, values: [m.count], note: `${count(m.sessions)} סשנים` }))} />
        </Panel>
        <Panel title="שימוש לפי מחשבון" description="חישוב רגיל / שחזור נעלם">
          <RankedBars
            series={[{ name: "רגיל" }, { name: "נעלם" }]}
            rows={data.calculators.map((c) => ({ label: calcTitle(c.slug), values: [c.regular, c.solve] }))}
          />
        </Panel>
        <Panel title="הצלחת חישובים" description="פתרון שהופק, מול שגיאת קלט או כשל בפתרון">
          <div className="space-y-5">
            <SuccessRow label="שחזור נעלם (X)" ok={s.solveOk} failed={s.solveFailed} invalid={s.solveInvalid} attempts={solveAttempts} />
            <SuccessRow label="חישוב רגיל" ok={s.regularOk} failed={s.regularFailed} invalid={s.regularInvalid} attempts={regularAttempts} />
            <p className="text-xs leading-relaxed text-subtle">
              שגיאת קלט: המשתמש ניסה להתקדם והאשף עצר אותו (למשל, נעלם שלא ניתן לשחזר מהנתונים). כשל: הנתונים עברו בדיקה אבל המנוע לא הצליח לפתור.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="קבצים מובילים להורדה" description="Excel, PDF וקבצים אחרים מעמודי התוכן">
          <RankedBars rows={data.downloads.map((d) => ({ label: d.title ?? d.url, values: [d.count], href: d.url, note: d.kind?.toUpperCase() }))} />
        </Panel>
        <Panel title="צפיות בסרטונים" description="הפעלה ראשונה של סרטון בכל צפייה בעמוד">
          <ShareBar parts={data.videoSources.map((v) => ({ name: SOURCES[v.source] ?? v.source, value: v.count }))} />
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-semibold text-muted">הסרטונים המובילים</p>
            <RankedBars rows={data.videos.map((v) => ({ label: v.title ?? v.slug, values: [v.count], note: v.source ? SOURCES[v.source] : undefined }))} />
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="הורדות וסרטונים לאורך זמן">
          <ColumnChart height={160} points={series.map((p) => ({ ...p, values: [p.raw.downloads, p.raw.videoPlays] }))} series={[{ name: "הורדות" }, { name: "סרטונים" }]} />
        </Panel>
        <Panel title="תרחישים מוכנים" description="טעינות, ואחוז החישובים שהתחילו מתרחיש מוכן">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="טעינות תרחיש" value={count(data.presets.loads)} />
            <Stat label="חישובים מתרחיש מוכן" value={pct(data.presets.runsFromPreset, data.presets.runs)} />
          </div>
          <div className="mt-5">
            <RankedBars rows={data.topPresets.map((p) => ({ label: p.title ?? "תרחיש שנמחק", values: [p.count] }))} empty="עוד לא נטענו תרחישים מוכנים." />
          </div>
        </Panel>
        <Panel title="בריאות המערכת" description="ביצועי המנוע וניצול האחסון">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="ממוצע" value={data.timing.avgMs === null ? "—" : `${data.timing.avgMs}ms`} />
            <Stat label="P95" value={data.timing.p95Ms === null ? "—" : `${Math.round(data.timing.p95Ms)}ms`} />
            <Stat label="דגימות" value={count(data.timing.samples)} />
          </div>
          <p className="mt-2 text-xs text-subtle">זמן ההרצה של המנוע החשבונאי בדפדפן של המשתמש, לכל פתרון.</p>
          <div className="mt-5 border-t border-line pt-4">
            <p className="flex items-baseline justify-between text-xs font-semibold text-muted">
              אחסון מדיה <span className="num font-mono text-sm text-fg">{bytes(storedBytes)}</span>
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {storage.length === 0 && <li className="text-muted">אין עדיין קבצים בספרייה.</li>}
              {storage.map((r) => (
                <li key={`${r.kind}-${r.source}`} className="flex justify-between gap-3 text-muted">
                  <span>
                    {KINDS[r.kind] ?? r.kind}
                    {r.source !== "upload" && <span className="text-subtle"> · {SOURCES[r.source]}</span>}
                  </span>
                  <span className="num font-mono text-fg">
                    {count(r.files)}
                    {r.source === "upload" && ` · ${bytes(Number(r.bytes))}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {data.visits ? <VisitsSection v={data.visits} /> : null}

      <Panel title="עמודים מובילים" description="צפיות בכל דף, ובכמה אנשים שונים צפו בו" className="mt-6">
        <RankedBars
          rows={data.pages.map((p) => ({ label: p.path, values: p.people === undefined ? [p.count] : [p.count, p.people] }))}
          series={data.pages[0]?.people === undefined ? undefined : [{ name: "צפיות" }, { name: "אנשים" }]}
        />
      </Panel>
    </div>
  );
}

export function Segmented({ label, options }: { label: string; options: { label: string; href: string; on: boolean }[] }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex rounded-xl border border-line bg-surface-2/60 p-0.5">
        {options.map((o) => (
          <Link
            key={o.label}
            href={o.href}
            aria-current={o.on ? "true" : undefined}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", o.on ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg")}
          >
            {o.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="num mt-0.5 text-lg font-semibold text-fg">{value}</p>
    </div>
  );
}

function SuccessRow({ label, ok, failed, invalid, attempts }: { label: string; ok: number; failed: number; invalid: number; attempts: number }) {
  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="num text-xs text-muted">
          <Activity className="me-1 inline h-3 w-3" />
          {pct(ok, attempts)} הצלחה · {count(attempts)} ניסיונות
        </span>
      </p>
      <ShareBar
        parts={[
          { name: "נפתר", value: ok },
          { name: "שגיאת קלט", value: invalid },
          { name: "כשל בפתרון", value: failed },
        ]}
        empty="אין ניסיונות בטווח הזה."
      />
    </div>
  );
}

type Bucket = Point & { raw: Required<Omit<DailyPoint, "day">> };

/**
 * Daily rows from the database, with empty days filled in, rolled up by day,
 * week (starting Sunday) or month.
 */
function bucket(daily: DailyPoint[], days: number, grain: Grain): Bucket[] {
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const out = new Map<string, Bucket>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - i));
    const iso = d.toISOString().slice(0, 10);
    const start = grain === "week" ? new Date(d.getTime() - d.getUTCDay() * 86_400_000) : d;
    const key = grain === "month" ? iso.slice(0, 7) : start.toISOString().slice(0, 10);
    const [y, m, dd] = key.split("-");
    const label = grain === "month" ? `${m}/${y}` : grain === "week" ? `שבוע מ-${dd}/${m}/${y}` : `${dd}/${m}/${y}`;
    const tick = grain === "month" ? `${m}/${y.slice(2)}` : `${dd}/${m}`;
    const b = out.get(key) ?? { label, tick, values: [], raw: { pageViews: 0, calcRegular: 0, calcSolve: 0, downloads: 0, videoPlays: 0, sessions: 0, entries: 0, visitors: 0, people: 0 } };
    const row = byDay.get(iso);
    if (row) {
      for (const k of Object.keys(b.raw) as (keyof Bucket["raw"])[]) b.raw[k] += Number(row[k] ?? 0);
    }
    out.set(key, b);
  }
  return [...out.values()];
}

const SOURCE_NAMES: Record<string, string> = { direct: "ישיר (בלי מקור)", whatsapp: "וואטסאפ", email: "מייל", share: "שיתוף מהאתר" };
const sourceName = (s: string) => SOURCE_NAMES[s] ?? (s.startsWith("ref:") ? `שגריר: ${s.slice(4)}` : s.startsWith("site:") ? `אתר: ${s.slice(5)}` : s);
const DEVICES: Record<string, string> = { mobile: "טלפון", tablet: "טאבלט", desktop: "מחשב", unknown: "לא ידוע (לפני המדידה)" };
const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

/** Where visits came from, where they landed, on what, and whether they stayed: one section. */
function VisitsSection({ v }: { v: VisitAnalysis }) {
  const hours = Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, tick: h % 3 === 0 ? String(h) : "", values: [Number(v.byHour.find((x) => x.hour === h)?.entries ?? 0)] }));
  const days = WEEKDAYS.map((name, d) => ({ label: name, tick: name.slice(0, 2), values: [Number(v.byWeekday.find((x) => x.dow === d)?.entries ?? 0)] }));
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-lg font-semibold text-fg">ניתוח כניסות</h2>
      <p className="mb-4 max-w-3xl text-sm text-muted">כל כניסה היא פתיחה של האתר בלשונית חדשה. כאן: מאיפה הגיעו, לאיזה דף, מאיזה מכשיר, אם חזרו, ואם המשיכו מעבר לדף הראשון.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={UserRound} label="מבקרים חדשים" value={count(v.newVisitors)} hint="דפדפן שנראה לראשונה בטווח הזה" />
        <Kpi icon={UserRound} label="מבקרים חוזרים" value={count(v.returningVisitors)} hint="דפדפן שכבר ביקר לפני הטווח" />
        <Kpi icon={LogIn} label="כניסות של משתמשים מחוברים" value={pct(v.signedInEntries, v.visitsCounted)} hint={`${count(v.signedInEntries)} מתוך ${count(v.visitsCounted)} כניסות`} />
        <Kpi
          icon={Eye}
          label="כניסות של דף אחד"
          value={pct(v.onePageVisits, v.visitsCounted)}
          hint="נכנסו וראו רק את הדף הראשון"
          tone={v.visitsCounted >= 20 && v.onePageVisits / v.visitsCounted > 0.6 ? "warn" : undefined}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="מקורות" description="מאיפה הגיעו הכניסות. ישיר: הקלדה, סימנייה, או אפליקציה שלא מעבירה מאיפה הגיעו (וואטסאפ, למשל, לרוב).">
          <RankedBars rows={v.sources.map((s) => ({ label: sourceName(s.source), values: [s.entries, s.visitors] }))} series={[{ name: "כניסות" }, { name: "מבקרים" }]} />
        </Panel>
        <Panel title="דפי נחיתה" description="הדף הראשון שנפתח בכל כניסה">
          <RankedBars rows={v.landings.map((l) => ({ label: l.path, values: [l.entries, l.visitors] }))} series={[{ name: "כניסות" }, { name: "מבקרים" }]} />
        </Panel>
        <Panel title="מכשירים" description="לפי גודל המסך וסוג המגע. נמדד מאז שהתיקון עלה; כניסות קודמות מסומנות לא ידוע.">
          <ShareBar parts={v.devices.map((d) => ({ name: DEVICES[d.device] ?? d.device, value: Number(d.entries) }))} />
        </Panel>
        <Panel title="חדשים מול חוזרים" description="מבקרים שבאו בטווח הזה: כמה מהם כאן בפעם הראשונה">
          <ShareBar parts={[{ name: "חדשים", value: v.newVisitors }, { name: "חוזרים", value: v.returningVisitors }]} />
        </Panel>
        <Panel title="שעות ביום" description="כניסות לפי שעה (שעון ישראל)">
          <ColumnChart height={160} points={hours} series={[{ name: "כניסות" }]} />
        </Panel>
        <Panel title="ימים בשבוע" description="כניסות לפי יום">
          <ColumnChart height={160} points={days} series={[{ name: "כניסות" }]} />
        </Panel>
      </div>
    </section>
  );
}

function DashboardGlossary() {
  return (
    <Glossary
      title="מה כל מושג אומר, ומה נחשב כניסה"
      intro="שלושה מזהים נרשמים עם כל פעולה: לשונית, דפדפן, וחשבון (כשמחוברים). כל אחד סופר דבר אחר, ולכן אותו ביקור יכול להיות כניסה אחת, מבקר אחד ואדם אחד, או שלוש כניסות של אותו אדם."
      groups={[
        { title: "מי נכנס", terms: WHO_TERMS },
        {
          title: "מה עשו",
          terms: [
            { term: "צפייה בדף", meaning: "כל מעבר לדף. אותו דף שנפתח שוב באותה לשונית בתוך 30 שניות נחשב ריענון ואינו נספר." },
            { term: "דפים לכניסה", meaning: "כמה דפים ראו בממוצע בכל כניסה, מהדף הראשון ועד שעזבו." },
            { term: "כניסה של דף אחד", meaning: "נכנסו, ראו את הדף הראשון ולא המשיכו. אחוז גבוה בדף נחיתה מסוים מרמז שהדף לא מוביל הלאה." },
            { term: "מקור", meaning: "שגריר: קישור אישי עם ?ref=. קמפיין: קישור עם utm_source. אתר: אתר אחר שהפנה. ישיר: בלי מקור ידוע." },
            { term: "מבקר חדש / חוזר", meaning: "חדש: הדפדפן נראה לראשונה בטווח הזמן שנבחר. חוזר: הוא כבר ביקר לפני הטווח." },
            { term: "אירוע", meaning: "כל פעולה שנרשמה: צפייה, כניסה, חישוב, תשובה בתרגול, הורדה ועוד. נפח גולמי, לא מדד בפני עצמו." },
          ],
        },
        {
          title: "מחשבונים",
          terms: [
            { term: "חישוב רגיל", meaning: "המשתמש הזין את כל הנתונים וקיבל פתרון." },
            { term: "שחזור נעלם (X)", meaning: "המשתמש סימן נתון אחד כלא ידוע, והמחשבון חישב אותו לאחור מהשאר." },
            { term: "שגיאת קלט", meaning: "החישוב לא רץ כי נתון חסר או לא תקין." },
            { term: "כשל בפתרון", meaning: "החישוב רץ, אבל המחשבון לא מצא פתרון." },
            { term: "זמן חישוב, P95", meaning: "כמה זמן לקח לחשב. P95: 95% מהחישובים מהירים מהמספר הזה, ורק 5% איטיים ממנו." },
            { term: "תרחיש מוכן", meaning: "דוגמה שמורה שטוענת נתונים מוכנים למחשבון." },
          ],
        },
      ]}
    />
  );
}
