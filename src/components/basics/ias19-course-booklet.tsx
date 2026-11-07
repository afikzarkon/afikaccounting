import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import type { BkLine, BkNote, BkQuestion, BkStep } from "@/lib/learn/ias19-booklet";
import { BK_AMEND, BK_CASES, BK_DC, BK_GIFT, BK_NOTE, BK_OLT, BK_SHORT, BK_THREE, BK_TIER, BK_TIERED } from "@/lib/learn/ias19-booklet-cases";
import { BookletCheck } from "./ias19-booklet-client";
import { Ltr } from "./ias19-formula";
import { RollForward } from "./ias19-ui";
import { Stepper } from "./stepper";

/**
 * The booklet-level questions that close the lessons: the story and its data,
 * what is required, a check of the key amounts, and the solution one step at
 * a time — the movement table, then a note per line, each line saying what it
 * computes, the formula with the numbers, and the result.
 */

const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;

const nf = (x: number, d: number) => x.toLocaleString("en-US", { maximumFractionDigits: d });

function value(l: BkLine) {
  if (l.value === undefined) return null;
  switch (l.unit) {
    case "%":
      return `${nf(l.value, 3)}%`;
    case "ימים":
    case "שנים":
      return nf(l.value, 2);
    case "₪":
      return `${nf(Math.round(l.value), 0)} ₪`;
    default:
      return nf(l.value, 2);
  }
}

function Note({ n }: { n: BkNote }) {
  return (
    <div className="space-y-2 rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[15px] font-bold">{n.title}</p>
      {n.text && <p className="text-[14.5px] leading-relaxed text-fg/85">{n.text}</p>}
      <ul className="space-y-2">
        {n.lines.map((l, i) => (
          <li key={i} className="border-t border-line/60 pt-2 text-[14.5px] leading-relaxed first:border-t-0 first:pt-0">
            <span className="font-semibold">{l.label}</span>
            {l.how && <span className="block text-[13.5px] text-muted">{l.how}</span>}
            {l.text && <span className="block">{l.text}</span>}
            {(l.calc || l.value !== undefined) && (
              <span className="block">
                <bdi dir="ltr" className="num">
                  {l.calc && <Ltr>{l.calc}</Ltr>}
                  {l.value !== undefined && (
                    <>
                      {l.calc ? " = " : ""}
                      <strong className="whitespace-nowrap">{value(l)}</strong>
                    </>
                  )}
                </bdi>
                {l.value !== undefined && (l.unit === "ימים" || l.unit === "שנים") && <> {l.value === 1 ? (l.unit === "ימים" ? "יום" : "שנה") : l.unit}</>}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Step({ s }: { s: BkStep }) {
  return (
    <div className="space-y-3">
      {s.text?.map((t) => (
        <P key={t}>{t}</P>
      ))}
      {s.tables?.map((t, i) => (
        <DataTable key={i} caption={t.title} head={t.head} rows={t.rows} />
      ))}
      {s.notes?.map((n, i) => (
        <Note key={i} n={n} />
      ))}
      {s.rolls?.map((r) => (
        <RollForward key={r.title} title={r.title} unit={r.unit} side={r.side} pnTo={r.pnTo} rows={r.rows.map((row) => ({ label: row.label, value: row.value, how: row.note, kind: row.kind }))} />
      ))}
    </div>
  );
}

function SolutionBox({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-3.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">פתיחת הפתרון, צעד אחר צעד</span>
        <span className="hidden group-open:inline">הסתרת הפתרון</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/** A booklet question as a screen. */
function booklet(q: BkQuestion): ScreenContent {
  return {
    lead: "שאלה ברמת חוברת התרגילים. קראו את הנתונים, פתרו על דף או בגיליון, הזינו את הסכומים, ורק אז פתחו את הפתרון.",
    body: (
      <>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-relaxed">
            {q.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        {q.tables.map((t, i) => (
          <DataTable key={i} caption={t.title} head={t.head} rows={t.rows} />
        ))}
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
          <strong>נדרש:</strong>
          <ol className="mt-1 list-[hebrew] space-y-1 ps-6">
            {q.required.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
        <BookletCheck id={q.id} checks={q.checks} />
        <SolutionBox>
          <p className="mb-3 text-[14px] text-muted">
            כל היוון בפתרון אפשר לחשב גם בגיליון: <bdi dir="ltr" className="num font-semibold">=PV(ריבית;שנים;0;-סכום)</bdi>, וריבית לחלק משנה: <bdi dir="ltr" className="num font-semibold">=יתרה*((1+ריבית)^(חודשים/12)-1)</bdi>.
          </p>
          <Stepper label={q.title} steps={q.steps.map((s) => ({ title: s.title, body: <Step s={s} /> }))} />
        </SolutionBox>
        <Remember>{q.point}</Remember>
      </>
    ),
  };
}


/** How an answer is written, in the booklet's format: the movement table first, then a note for each line. */
const FORMAT: ScreenContent = {
  lead: "בחוברת ובמבחן כל תשובה נכתבת באותה צורה. מי שכותב בצורה הזו לא שוכח שורה, והבודק רואה מאיפה בא כל מספר.",
  body: (
    <>
      <P>
        <strong>העיקרון:</strong> קודם טבלת התנועה, עם הפניה לביאור ליד כל שורה. אחר כך ביאור לכל שורה, ובו שלושה דברים: מה מחשבים, הנוסחה עם המספרים, והתוצאה. השורה האחרונה שמחשבים היא תמיד המדידה מחדש, כי היא מה שנשאר.
      </P>
      <RollForward
        title="שלד התשובה"
        rows={[
          { label: "יתרת פתיחה", value: 100, kind: "balance", how: "ביאור 1: נתוני תחילת השנה" },
          { label: "עלות שירות שוטף", value: 20, how: "ביאור 2: לפי תחילת השנה, מפוצל אם יש שינוי" },
          { label: "עלות שירות עבר", value: 15, how: "ביאור 3: ביום השינוי, אחרי פחות לפני" },
          { label: "תשלומים", value: -10, how: "נתון" },
          { label: "עלות ריבית", value: 8, how: "ביאור 4: חלק לכל תקופה" },
          { label: "מדידה מחדש", value: 7, kind: "pn", how: "השורה המאזנת" },
          { label: "יתרת סגירה", value: 140, kind: "balance", how: "ביאור 5: נתוני סוף השנה" },
        ]}
      />
      <Note
        n={{
          title: "ביאור לדוגמה: יתרת פתיחה",
          text: "מה מחשבים, ואיזה נתון לוקחים מאיזה תאריך:",
          lines: [
            { label: "הטבה לשנה × שנים שעברו × עובדים צפויים ÷ (1+i)^שנים עד התשלום", how: "כל נתון מהעמודה של אותו תאריך בטבלת ההנחות" },
            { label: "המספרים", calc: "28,000 × 4.5% × 2 × 340 ÷ 1.08^16", value: 250_092, unit: "₪" },
          ],
        }}
      />
      <P>
        <strong>שלושה הרגלים:</strong> לכל שורה לרשום מאיזה תאריך הנתונים. לחשב את הסגירה ישירות, לא כסכום השורות. ולבדוק בסוף שהטבלה מתאזנת עם המדידה מחדש.
      </P>
      <Remember>טבלה קודם, ביאור לכל שורה, ומדידה מחדש אחרונה. כך כתובים כל הפתרונות בשאלות המסכמות.</Remember>
    </>
  ),
};

export const IAS19_BOOKLET_SCREENS: Record<string, ScreenContent> = {
  "emp-bk-format": { ...FORMAT },
  "emp-bk-short": { ...booklet(BK_SHORT) },
  "emp-bk-dc": { ...booklet(BK_DC) },
  "emp-bk-tier": { ...booklet(BK_TIER) },
  "emp-bk-amend": { ...booklet(BK_AMEND) },
  "emp-bk-tiered": { ...booklet(BK_TIERED) },
  "emp-bk-gift": { ...booklet(BK_GIFT) },
  "emp-bk-cases": { ...booklet(BK_CASES) },
  "emp-bk-three": { ...booklet(BK_THREE) },
  "emp-bk-olt": { ...booklet(BK_OLT) },
  "emp-bk-note": { ...booklet(BK_NOTE) },
};
