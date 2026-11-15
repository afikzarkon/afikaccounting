import { AlertTriangle, ClipboardList, Gauge, GraduationCap, MessageSquareQuote, Timer, Users, Wrench } from "lucide-react";
import { type Analysis, kindLabel, type PageStat, type Quote, severityLabel } from "@/lib/tester/analysis";
import { tagLabel } from "@/lib/tester/form";
import { cn } from "@/lib/utils";
import { RankedBars, ShareBar } from "./charts";
import { CopyForClaude } from "./copy-for-claude";
import { count, Kpi, Panel } from "./ui";

const LEVEL: Record<string, { label: string; className: string }> = {
  high: { label: "קודם", className: "bg-danger/10 text-danger" },
  medium: { label: "אחר כך", className: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  low: { label: "כשיהיה זמן", className: "bg-surface-2 text-muted" },
};

/** Every tester's feedback read together, ending in what to fix first. Pure: the page computes it. */
export function FeedbackAnalysis({ a, claudeText }: { a: Analysis; claudeText: string }) {
  const parts = (m: Record<string, number>, name: (k: string) => string = (k) => k) =>
    Object.entries(m)
      .filter(([k]) => k)
      .map(([k, v]) => ({ name: name(k), value: v }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">ניתוח המשוב</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">כל מה שהניסיינים כתבו, מקובץ: איפה נתקעו ועד כמה, מה דורג נמוך, איפה הבחינה דרשה יותר מהקורס, ומה לתקן קודם.</p>
        </div>
        <CopyForClaude text={claudeText} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="ניסיינים שכתבו" value={count(a.testers)} hint={`${count(a.modules)} מודולים תועדו`} />
        <Kpi icon={AlertTriangle} label="נקודות היתקעות" value={count(a.points)} hint={`${count(a.bySeverity.blocker ?? 0)} חוסמות`} tone={(a.bySeverity.blocker ?? 0) > 0 ? "warn" : undefined} />
        <Kpi icon={Timer} label="זמן שאבד" value={`${count(a.minutesLost)} דק׳`} hint="לפי מה שהניסיינים דיווחו" />
        <Kpi icon={Gauge} label="NPS" value={a.nps.score === null ? "—" : String(a.nps.score)} hint={a.nps.n ? `${a.nps.promoters} ממליצים · ${a.nps.detractors} לא ממליצים · ${a.nps.n} תשובות` : "עוד אין סיכומים"} />
      </div>

      <Panel title="מה לתקן קודם" description="נגזר מהנתונים: חוסמים, מה שחזר אצל כמה ניסיינים, פער הבחינה, ודירוגים נמוכים. לניתוח עמוק של התמות והסיבות, העתיקו את הכל ל-Claude.">
        {a.actions.length === 0 ? (
          <p className="text-sm text-muted">עוד אין מספיק משוב כדי להמליץ על פעולות.</p>
        ) : (
          <ol className="space-y-3">
            {a.actions.map((x, i) => (
              <li key={i} className="flex gap-3">
                <span className={cn("h-fit shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", LEVEL[x.level].className)}>{LEVEL[x.level].label}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{x.text}</span>
                  <span className="block text-xs text-muted">{x.why}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel title="מוקדי היתקעות" description="נקודות שבהן ניסיינים נתקעו, מקובצות לפי הדף. הדירוג: חוסם שוקל יותר ממאט, ומקום שכמה ניסיינים נתקעו בו שוקל יותר מניסיין אחד.">
        {a.hotspots.length === 0 ? (
          <p className="text-sm text-muted">עוד לא דווחו נקודות היתקעות.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="py-2 text-start font-medium">איפה</th>
                  <th className="py-2 text-start font-medium">דיווחים</th>
                  <th className="py-2 text-start font-medium">ניסיינים</th>
                  <th className="py-2 text-start font-medium">חומרה</th>
                  <th className="py-2 text-start font-medium">סוג עיקרי</th>
                  <th className="py-2 text-start font-medium">מה כתבו</th>
                </tr>
              </thead>
              <tbody>
                {a.hotspots.slice(0, 15).map((h) => (
                  <tr key={h.where} className="border-b border-line align-top last:border-0">
                    <td className="py-2.5 pe-3 font-medium text-fg">{h.where}</td>
                    <td className="num py-2.5">{h.points}</td>
                    <td className="num py-2.5">{h.testers}</td>
                    <td className="py-2.5 text-xs whitespace-nowrap">
                      {h.blockers > 0 && <span className="me-2 text-danger">חוסם {h.blockers}</span>}
                      {h.slows > 0 && <span className="me-2 text-amber-700 dark:text-amber-400">מאט {h.slows}</span>}
                      {h.cosmetic > 0 && <span className="text-muted">קוסמטי {h.cosmetic}</span>}
                    </td>
                    <td className="py-2.5 text-xs text-muted">{kindLabel(Object.entries(h.kinds).sort((x, y) => y[1] - x[1])[0]?.[0] ?? "unknown")}</td>
                    <td className="py-2.5 text-xs text-muted">{h.notes.slice(0, 2).map((n) => `״${n.text}״`).join(" · ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <ScreenRatings a={a} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="חומרה וסוג הקושי" description="כל נקודות ההיתקעות יחד">
          <div className="space-y-4">
            <ShareBar parts={parts(a.bySeverity, severityLabel)} empty="אין דיווחים." />
            <ShareBar parts={parts(a.byKind, kindLabel)} empty="אין דיווחים." />
          </div>
        </Panel>
        <Panel title="סוף השיעור" description="בסיכום של כל שיעור: ״אוכל לפתור שאלת בחינה בנושא?״ (ממוצע מתוך 5; מתחת ל-3.5 כדאי לבדוק), וכמה מהמסכים סומנו לא ברור.">
          <RankedBars
            rows={a.lessons.filter((l) => l.exam !== null).map((l) => ({ label: `${l.lesson} (${l.examN})`, values: [l.exam ?? 0] }))}
            empty="עוד אין תשובות בסוף שיעור."
          />
          {a.lessons.some((l) => l.rated > 0) && (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {a.lessons
                .filter((l) => l.rated > 0)
                .map((l) => (
                  <li key={l.slug}>
                    {l.lesson}: {l.rated} דירוגי מסכים, <span className={l.unclear ? "font-medium text-danger" : undefined}>{l.unclear} לא ברור</span>, {l.ok} בסדר
                  </li>
                ))}
            </ul>
          )}
          <Quotes title="הדבר האחד שהיו משנים" icon={MessageSquareQuote} items={a.lessons.flatMap((l) => l.changes)} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="הקורס מול רמת הבחינה" description="אחרי שאלת בחינה: עד כמה הצליחו לבד, ומה חסר">
          <ShareBar parts={parts(a.exam.independence)} empty="עוד לא נפתרו שאלות בחינה." />
          <Quotes title="מה הבחינה דרשה שהקורס לא לימד" icon={GraduationCap} items={a.exam.notTaught} />
          <Quotes title="מה הקורס לימד, אבל ברמה פשוטה מהבחינה" icon={GraduationCap} items={a.exam.taughtSimpler} />
        </Panel>
        <Panel title="מחשבונים וכלים" description="באילו כלים השתמשו, והאם עזרו להבין">
          <RankedBars rows={Object.entries(a.tools.used).sort((x, y) => y[1] - x[1]).map(([k, v]) => ({ label: k, values: [v] }))} empty="עוד לא דווח על שימוש בכלים." />
          <div className="mt-4">
            <ShareBar parts={parts(a.tools.helped)} empty="" />
          </div>
          <Quotes title="מה לא עבד או לא היה ברור" icon={Wrench} items={a.tools.problems} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="מה חסר, מה עמוס, מה לשפר" description="מהמחוון המהיר של כל מודול">
          <Quotes title="חסר / מעט מדי" icon={MessageSquareQuote} items={a.rubric.missing} />
          <Quotes title="עמוס מדי / מוגזם" icon={MessageSquareQuote} items={a.rubric.tooMuch} />
          <Quotes title="טעון שיפור" icon={MessageSquareQuote} items={a.rubric.improve} />
        </Panel>
        <Panel title="השורה התחתונה" description="מהסיכום שאחרי בחינת הסיום">
          <ShareBar parts={parts(a.verdict)} empty="עוד אין סיכומים." />
          <Quotes title="מה חסר כדי שיהיה אפשר ללמוד רק מהאתר" icon={ClipboardList} items={a.verdictGaps} />
          <Quotes title="יצאו מהאתר כדי להבין" icon={ClipboardList} items={a.leftSite} />
          <Quotes title="מה עבד טוב (לא לשבור)" icon={ClipboardList} items={a.rubric.excellent} />
        </Panel>
      </div>
    </section>
  );
}

/** Every rated lesson page, the least clear first, with why and what the testers wrote. */
function ScreenRatings({ a }: { a: Analysis }) {
  const shown = a.pages.slice(0, 40);
  return (
    <Panel
      title="דירוג המסכים"
      description={`כל מסך בשיעור, כפי שהניסיינים דירגו אותו מתחתיו (${count(a.pageRatings)} דירוגים). הכי פחות ברור למעלה. זמן: חציון השניות על המסך עד הדירוג.`}
    >
      {shown.length === 0 ? (
        <p className="text-sm text-muted">עוד לא דורגו מסכים.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="py-2 text-start font-medium">מסך</th>
                <th className="py-2 text-start font-medium">דירוגים</th>
                <th className="py-2 text-start font-medium">למה</th>
                <th className="py-2 text-start font-medium">מה כתבו</th>
                <th className="py-2 text-start font-medium">זמן</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.key} className="border-b border-line align-top last:border-0">
                  <td className="py-2.5 pe-3">
                    <span className="block font-medium text-fg">{p.title}</span>
                    <span className="block text-xs text-muted">
                      {p.lesson}
                      {p.where ? ` · ${p.where}` : ""}
                    </span>
                  </td>
                  <td className="py-2.5 pe-3">
                    <RatingBar p={p} />
                  </td>
                  <td className="py-2.5 pe-3 text-xs text-muted">
                    {Object.entries(p.tags)
                      .sort((x, y) => y[1] - x[1])
                      .map(([k, v]) => `${tagLabel(k)}${v > 1 ? ` ×${v}` : ""}`)
                      .join(" · ") || "—"}
                  </td>
                  <td className="py-2.5 pe-3 text-xs text-muted">{p.notes.slice(0, 3).map((n) => `״${n.text}״ (${n.tester})`).join(" · ") || "—"}</td>
                  <td className="num py-2.5 text-xs text-muted">{p.secs === null ? "—" : `${p.secs} שנ׳`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {a.pages.length > shown.length && <p className="mt-2 text-xs text-muted">מוצגים 40 המסכים הכי פחות ברורים מתוך {a.pages.length}. הכל מופיע בהעתקה ל-Claude ובמשוב של כל ניסיין.</p>}
        </div>
      )}
    </Panel>
  );
}

function RatingBar({ p }: { p: PageStat }) {
  const part = (n: number, cls: string, label: string) => (n ? <span className={cn("block h-full", cls)} style={{ width: `${(n / p.n) * 100}%` }} title={`${label}: ${n}`} /> : null);
  return (
    <div className="min-w-32">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
        {part(p.unclear, "bg-danger", "לא ברור")}
        {part(p.ok, "bg-amber-400", "בסדר")}
        {part(p.clear, "bg-success", "ברור")}
      </div>
      <p className="num mt-1 text-[11px] whitespace-nowrap text-muted">
        😕 {p.unclear} · 😐 {p.ok} · 🙂 {p.clear}
      </p>
    </div>
  );
}

function Quotes({ title, icon: Icon, items }: { title: string; icon: typeof ClipboardList; items: Quote[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-fg">
        <Icon className="h-3.5 w-3.5 text-accent" aria-hidden /> {title} <span className="font-normal text-muted">({items.length})</span>
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 8).map((q, i) => (
          <li key={i} className="text-sm leading-relaxed text-fg">
            ״{q.text}״ <span className="text-xs text-subtle">— {q.tester}{q.module ? `, ${q.module}` : ""}</span>
          </li>
        ))}
        {items.length > 8 && <li className="text-xs text-muted">ועוד {items.length - 8}. הכל מופיע בהעתקה ל-Claude.</li>}
      </ul>
    </div>
  );
}
