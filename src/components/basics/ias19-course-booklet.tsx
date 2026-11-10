import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import type { BkQuestion } from "@/lib/learn/ias19-booklet";
import { BK_AMEND, BK_CASES, BK_DC, BK_GIFT, BK_NOTE, BK_OLT, BK_SHORT, BK_THREE, BK_TIER, BK_TIERED } from "@/lib/learn/ias19-booklet-cases";
import { FINAL_EXAMS } from "@/lib/learn/ias19-finals";
import { BookletCheck } from "./ias19-booklet-client";
import { cell, Note, Step } from "./ias19-step";
import { rich } from "./ias19-rich";
import { FullSteps, RollForward } from "./ias19-ui";
import { TaskFrame, TaskText } from "./ias19-question";
import { WorkedReveal } from "@/components/study/worked";
import { bookletWorked } from "@/lib/study/ias19/booklet-worked";

/**
 * The booklet-level questions that close the lessons: the story and its data,
 * what is required, a check of the key amounts, and the solution one step at
 * a time — the movement table, then a note per line, each line saying what it
 * computes, the formula with the numbers, and the result.
 */

const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;

function SolutionBox({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-3.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">הצגת הפתרון המלא</span>
        <span className="hidden group-open:inline">הסתרת הפתרון</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/**
 * A booklet question in the site's worked layout (owner's approval,
 * 2026-11-10): the same story, data, required list and check; the solution
 * opens with one button, each movement table a worksheet column.
 */
function bookletQuestion(q: BkQuestion): ScreenContent {
  return {
    lead: "שאלה ברמת חוברת התרגילים. קראו את הנתונים, פתרו על דף או בגיליון, הזינו את הסכומים, ורק אז פתחו את הפתרון.",
    body: (
      <>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-relaxed">
            {q.facts.map((f) => (
              <li key={f}>{rich(f)}</li>
            ))}
          </ul>
        </div>
        {q.tables.map((t, i) => (
          <DataTable key={i} caption={t.title} head={t.head} rows={t.rows.map((row) => row.map(cell))} foot={t.foot?.map(cell)} />
        ))}
        <TaskFrame label="נדרש">
          <TaskText>
            <ol className="list-[hebrew] space-y-1.5 ps-6">
              {q.required.map((r) => (
                <li key={r}>{rich(r)}</li>
              ))}
            </ol>
          </TaskText>
        </TaskFrame>
        <BookletCheck id={q.id} checks={q.checks} />
        <WorkedReveal w={bookletWorked(q)} />
        <Remember>{rich(q.point)}</Remember>
      </>
    ),
  };
}

/** A final-exam question in the booklet's own layout (not part of the worked-layout change). */
function booklet(q: BkQuestion): ScreenContent {
  return {
    lead: "שאלה ברמת חוברת התרגילים. קראו את הנתונים, פתרו על דף או בגיליון, הזינו את הסכומים, ורק אז פתחו את הפתרון.",
    body: (
      <>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-relaxed">
            {q.facts.map((f) => (
              <li key={f}>{rich(f)}</li>
            ))}
          </ul>
        </div>
        {q.tables.map((t, i) => (
          <DataTable key={i} caption={t.title} head={t.head} rows={t.rows.map((row) => row.map(cell))} foot={t.foot?.map(cell)} />
        ))}
        <TaskFrame label="נדרש">
          <TaskText>
            <ol className="list-[hebrew] space-y-1.5 ps-6">
              {q.required.map((r) => (
                <li key={r}>{rich(r)}</li>
              ))}
            </ol>
          </TaskText>
        </TaskFrame>
        <BookletCheck id={q.id} checks={q.checks} />
        <SolutionBox>
          <p className="mb-3 text-[14px] text-muted">
            כל היוון בפתרון אפשר לחשב גם בגיליון: <bdi dir="ltr" className="num font-semibold">=PV(ריבית;שנים;0;-סכום)</bdi>, וריבית לחלק משנה: <bdi dir="ltr" className="num font-semibold">=יתרה*((1+ריבית)^(חודשים/12)-1)</bdi>.
          </p>
          <FullSteps label={q.title} steps={q.steps.map((s) => ({ title: s.title, body: <Step s={s} /> }))} />
        </SolutionBox>
        <Remember>{rich(q.point)}</Remember>
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

/** Lesson 6: a surplus when the company must keep contributing — how much of it is an asset (IFRIC 14). */
const MFR: ScreenContent = {
  lead: "עודף בתוכנית הוא נכס רק אם יש ממנו הטבה לחברה. כשאין החזרים, ההטבה היא הפקדות קטנות יותר בעתיד. וחובת הפקדה מינימלית מקטינה גם אותה.",
  body: (
    <>
      <P>
        <strong>העיקרון:</strong> הנכס נטו הוא הנמוך מבין העודף לבין התקרה (סעיף 64). התקרה היא הערך הנוכחי של ההטבה הכלכלית: החזרים מהקרן, או הקטנת הפקדות עתידיות (סעיף 8).
      </P>
      <DataTable
        caption="מה ההטבה הכלכלית, לפי מה שהתקנון מאפשר (IFRIC 14)"
        head={["התקנון", "ההטבה מהקטנת הפקדות", "סעיף"]}
        rows={[
          ["אין חובת הפקדה מינימלית", "עלות השירות העתידית", "16–17"],
          ["יש חובת הפקדה מינימלית לשירות עתידי", "עלות השירות העתידית פחות ההפקדות המינימליות בגינה, ולא פחות מ-0", "20–22"],
          ["אין החזרים ואין הקטנת הפקדות בכלל", "0: אין נכס", "11–12"],
        ]}
      />
      <Note
        n={{
          title: "דוגמה: נשארו שלוש שנות שירות, ריבית 5%",
          text: "ההטבה שתיצבר בכל שנה: 200,000, משולמת בסוף השנה השלישית. ההפקדה המינימלית: 120,000 בסוף כל שנה.",
          lines: [
            { label: "ערך נוכחי של עלות השירות העתידית", calc: "200,000 × 3 ÷ 1.05^3", value: 518_303, unit: "₪" },
            { label: "ערך נוכחי של ההפקדות המינימליות", calc: "120,000 ÷ 1.05 + 120,000 ÷ 1.05^2 + 120,000 ÷ 1.05^3", value: 326_790, unit: "₪" },
            { label: "התקרה", calc: "518,303 − 326,790", value: 191_513, unit: "₪" },
            { label: "אם העודף 241,697: הנכס נטו", calc: "MIN(241,697, 191,513)", value: 191_513, unit: "₪" },
          ],
        }}
      />
      <P>
        ההפרש בין העודף לנכס הוא <strong>השפעת התקרה</strong>. השינוי בה הולך ל-OCI. אם הייתה השפעה כבר בתחילת השנה, גם עליה מחשבים ריבית, והיא נכנסת לריבית נטו (סעיף 124).
      </P>
      <Remember>אין החזרים? בודקים הקטנת הפקדות. יש הפקדה מינימלית? מפחיתים אותה מעלות השירות העתידית. הנכס: הנמוך מבין העודף לתקרה.</Remember>
    </>
  ),
};

export const IAS19_BOOKLET_SCREENS: Record<string, ScreenContent> = {
  "emp-assets-mfr": { ...MFR },
  "emp-bk-format": { ...FORMAT },
  "emp-bk-short": { ...bookletQuestion(BK_SHORT) },
  "emp-bk-dc": { ...bookletQuestion(BK_DC) },
  "emp-bk-tier": { ...bookletQuestion(BK_TIER) },
  "emp-bk-amend": { ...bookletQuestion(BK_AMEND) },
  "emp-bk-tiered": { ...bookletQuestion(BK_TIERED) },
  "emp-bk-gift": { ...bookletQuestion(BK_GIFT) },
  "emp-bk-cases": { ...bookletQuestion(BK_CASES) },
  "emp-bk-three": { ...bookletQuestion(BK_THREE) },
  "emp-bk-olt": { ...bookletQuestion(BK_OLT) },
  "emp-bk-note": { ...bookletQuestion(BK_NOTE) },
  "emp-mx-cancel": { ...booklet(FINAL_EXAMS[0]) },
  "emp-mx-mgmt": { ...booklet(FINAL_EXAMS[1]) },
  "emp-mx-short": { ...booklet(FINAL_EXAMS[2]) },
  "emp-mx-three": { ...booklet(FINAL_EXAMS[3]) },
  "emp-mx-sales": { ...booklet(FINAL_EXAMS[4]) },
  "emp-mx-trust": { ...booklet(FINAL_EXAMS[5]) },
  "emp-mx-mfr": { ...booklet(FINAL_EXAMS[6]) },
  "emp-mx-integrated": { ...booklet(FINAL_EXAMS[7]) },
};
