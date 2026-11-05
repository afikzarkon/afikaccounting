import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { type AbsenceCase, type AbsenceMode, type AbsenceSolution, headcount, solveAbsence } from "@/lib/learn/ias19-absence";
import { ABSENCE_EXAMS, ALON, type AbsenceExam } from "@/lib/learn/ias19-absence-cases";
import { EXPECT, EXPECT_DAYS, fromCarried } from "@/lib/study/ias19/lessons/short";
import { fmt } from "@/lib/study/ias19/shared";
import { FORMULA, tool, work } from "@/lib/study/ias19/formulas";
import { ByMode, ClassifyAbsence, DayStrip, ExamCheck, ModeMark } from "./ias19-absence-client";
import { Ltr, Work } from "./ias19-formula";
import { RollForward } from "./ias19-ui";
import { JE, Money } from "./ui";

/**
 * Lesson 3, how to solve an absence question: the guide's six steps, worked
 * on one company ("Alon") in both assumptions, with the switch between them;
 * then the traps, a template, and four summary exams, each on a trap of its own.
 */

const L = Ltr;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const n = (x: number) => fmt(Math.round(x * 100) / 100);

const A = solveAbsence(ALON, "A");
const B = solveAbsence(ALON, "B");
const solved = (m: AbsenceMode) => (m === "A" ? A : B);
const ALON_STAFF = headcount(ALON.opening);
const balanceOf = (c: AbsenceCase) => c.carried.slice(0, c.years).reduce((s, d) => s + d, 0);

/** A note under a step's table: which assumption it is, and what changed. */
function Note({ mode, children }: { mode: AbsenceMode | "both"; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
      <span className="block text-[13px] font-bold text-muted">{mode === "both" ? "אותה תוצאה בשתי ההנחות" : mode === "A" ? "הנחה א׳" : "הנחה ב׳"}</span>
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// The tables of steps 3–6, for any case and assumption.

function OpeningTable({ c, r }: { c: AbsenceCase; r: AbsenceSolution }) {
  const vest = r.mode === "B";
  return (
    <>
      <DataTable
        head={["קבוצה", "עובדים", "צפי היעדרות בשנה", "חישוב ימי יתרה לעובד", "ימים לעובד", "סה״כ ימים"]}
        rows={r.opening.map((g) => [
          g.name,
          String(g.staff),
          n(g.use),
          vest && g.leaves ? (
            `עוזב ומקבל פדיון: כל היתרה, ${n(g.balance)}`
          ) : (
            <span key="c" className="whitespace-nowrap">
              <L>{work.fromBalance(g.balance, g.use, c.entitlement).numbers}</L>
              {g.leaves ? " · עוזב בלי פדיון" : ""}
            </span>
          ),
          n(g.perHead),
          n(g.days),
        ])}
        foot={[<strong key="t">סה״כ</strong>, String(headcount(r.opening)), "", "", "", <strong key="d">{n(r.openingDays)}</strong>]}
      />
      <Work w={work.dayTotal(r.opening.map((g) => ({ staff: g.staff, days: g.perHead })), c.dayCost)} />
    </>
  );
}

function PaymentsTable({ c, r }: { c: AbsenceCase; r: AbsenceSolution }) {
  const vest = r.mode === "B";
  return (
    <>
      <DataTable
        head={["קבוצה", "עובדים", "ימי היעדרות", "מהם מהיתרה", "פדיון יתרה", "ימים ששולמו לעובד", "סה״כ ימים", "יתרה שפקעה או אבדה"]}
        rows={r.actual.map((g) => [
          g.name,
          String(g.staff),
          n(g.use),
          n(g.fromCarried),
          n(g.payout),
          vest && g.leaves ? <span key="p" className="whitespace-nowrap"><L>{work.paidDays(g.use, g.payout).numbers}</L></span> : n(g.paidPerHead),
          n(g.paidDays),
          n(g.lapsed),
        ])}
        foot={[<strong key="t">סה״כ</strong>, String(headcount(r.actual)), "", "", "", "", <strong key="d">{n(r.paidDays)}</strong>, ""]}
      />
      <Work w={work.dayTotal(r.actual.map((g) => ({ staff: g.staff, days: g.paidPerHead })), c.dayCost)} />
    </>
  );
}

function ClosingTable({ c, r }: { c: AbsenceCase; r: AbsenceSolution }) {
  const byExpectation = r.closing.some((g) => g.nextUse !== null);
  return (
    <>
      <DataTable
        head={["קבוצה (נשארים בלבד)", "עובדים", "יתרה חדשה מהשנה", "יתרה ישנה שנשארה", ...(byExpectation ? ["חישוב לפי הצפי"] : []), "ימי יתרה לעובד", "סה״כ ימים"]}
        rows={r.closing.map((g) => [
          g.from === g.name ? g.name : `${g.from}: ${g.name}`,
          String(g.staff),
          n(g.ownLeft),
          n(g.oldLeft),
          ...(byExpectation ? [g.nextUse === null ? "ינצלו את המקסימום" : <span key="e" className="whitespace-nowrap"><L>{work.fromBalance(g.carryOut, g.nextUse, c.entitlement).numbers}</L></span>] : []),
          n(g.perHead),
          n(g.days),
        ])}
        foot={[<strong key="t">סה״כ</strong>, String(headcount(r.closing)), "", "", ...(byExpectation ? [""] : []), "", <strong key="d">{n(r.closingDays)}</strong>]}
      />
      <Work w={work.dayTotal(r.closing.map((g) => ({ staff: g.staff, days: g.perHead })), c.dayCost)} />
    </>
  );
}

function Movement({ r, title = "הפרשה לימי היעדרות" }: { r: AbsenceSolution; title?: string }) {
  return (
    <>
      <RollForward
        title={title}
        pnTo="רווח והפסד"
        rows={[
          { label: "יתרת פתיחה", value: r.opening$, kind: "balance", how: "שלב 3" },
          { label: "הוצאות שכר עבודה, הנעלם", value: r.expense, kind: "pn", how: "סגירה − פתיחה + תשלומים" },
          { label: "תשלומים", value: -r.paid, how: "שלב 4" },
          { label: "יתרת סגירה", value: r.closing$, kind: "balance", how: "שלב 5" },
        ]}
      />
      <Work w={tool.expense(r.opening$, r.paid, r.closing$)} />
    </>
  );
}

function Journal({ r }: { r: AbsenceSolution }) {
  return (
    <>
      <JE
        note={null}
        entry={{
          id: "1",
          date: "31.12",
          text: "הכרה בהוצאה",
          lines: [
            { account: "הוצאות שכר עבודה", dr: r.expense },
            { account: "הפרשה לימי מחלה", cr: r.expense },
          ],
        }}
      />
      <JE
        note={null}
        entry={{
          id: "2",
          date: "במהלך השנה",
          text: "התשלומים",
          lines: [
            { account: "הפרשה לימי מחלה", dr: r.paid },
            { account: "מזומן", cr: r.paid },
          ],
        }}
      />
    </>
  );
}

/** One hidden solution, opened by one button. */
function SolutionBox({ children }: { children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-3.5">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">הצגת הפתרון המלא</span>
        <span className="hidden group-open:inline">הסתרת הפתרון</span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

const STEPS = [
  "לסווג את ההיעדרות: נצברת? מבשילה?",
  "להבין מה נכנס להפרשה: רק העלות הנוספת",
  "לחשב פתיחה, לפי הצפי",
  "לחשב תשלומים, לפי מה שקרה",
  "לחשב סגירה, אחרי ניצול ופקיעה",
  "להשלים טבלת תנועה: ההוצאה היא הנעלם",
];

function StepList() {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] leading-snug">
          <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-fg">{i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

const ALON_FACTS = [
  `בחברת ״אלון״ ${ALON_STAFF} עובדים. כל עובד זכאי ל-${ALON.entitlement} ימי מחלה בשנה, ואפשר להעביר ימים שלא נוצלו לשנה אחת בלבד.`,
  `הניצול הוא קודם מהזכאות של השנה השוטפת, ורק אחר כך מהיתרה (LIFO). עלות יום: ${fmt(ALON.dayCost)} ש״ח.`,
  `ב-31.12.2025 היתרה הממוצעת היא ${ALON.carried[0]} ימים לעובד.`,
  `צפי ל-2026: ${ALON.opening[0].staff} עובדים יעזבו בתחילת השנה. ${ALON.opening[1].staff + ALON.opening[2].staff} ינצלו ${ALON.opening[2].use} ימים (${ALON.opening[1].staff} מהם יעזבו בסוף השנה). ${ALON.opening[3].staff} ינצלו ${n(ALON.opening[3].use)} ימים בממוצע.`,
  `בפועל ב-2026: ${ALON.actual[0].staff} עזבו בתחילת השנה. ${ALON.actual[1].staff + ALON.actual[2].staff} ניצלו ${ALON.actual[2].use} ימים (${ALON.actual[1].staff} מהם עזבו בסוף השנה). שאר העובדים ניצלו ${ALON.actual[3].use} ימים.`,
  "ב-31.12.2026 צפוי שלא יהיו עזיבות ב-2027, והעובדים הנותרים ינצלו את המקסימום.",
  "נדרש: טבלת תנועה בהפרשה לשנת 2026, בהנחה א׳ (לא מבשילה) ובהנחה ב׳ (מבשילה).",
];

function Facts({ lines }: { lines: string[] }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <ul className="list-disc space-y-1 ps-5 text-[15px] leading-relaxed">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// The four summary exams.

const HINTS: Record<AbsenceMode, Record<"opening" | "expense" | "payments" | "closing", string>> = {
  A: {
    opening: "רק מי שצפוי לעבור את הזכאות השוטפת תורם, ולא יותר מהיתרה. עוזבים לא מקבלים פדיון.",
    payments: "כל ימי ההיעדרות ששולמו, כולל הימים השוטפים. בלי פדיון.",
    closing: "רק הנשארים: יתרה חדשה (זכאות פחות ניצול), היתרה הישנה פוקעת, והעוזבים לא נספרים. בדקו מה הצפי לשנה הבאה.",
    expense: "הוצאה = סגירה − פתיחה + תשלומים.",
  },
  B: {
    opening: "עוזבים צפויים, גם בסוף השנה, נכנסים על כל היתרה. שאר הקבוצות לפי MIN(יתרה, MAX(0, צפי − זכאות)).",
    payments: "כל ימי ההיעדרות ששולמו, ועוד פדיון על היתרה שנשארה לעוזבים, גם לעוזבים בסוף השנה.",
    closing: "רק הנשארים: יתרה חדשה (זכאות פחות ניצול), היתרה הישנה פוקעת, והעוזבים לא נספרים. בדקו מה הצפי לשנה הבאה.",
    expense: "הוצאה = סגירה − פתיחה + תשלומים.",
  },
};

function examScreen(e: AbsenceExam): ScreenContent {
  const runs = e.modes.map((m) => ({ mode: m, r: solveAbsence(e.data, m) }));
  return {
    lead: "מבחן מסכם: תרגיל מלא לפי ששת השלבים. פתרו לבד, הזינו את ארבעת הסכומים של טבלת התנועה, ורק אחר כך פתחו את הפתרון.",
    body: (
      <>
        <Facts lines={e.story} />
        <P>
          <strong>נדרש:</strong> יתרת הפתיחה, הוצאות השכר, התשלומים ויתרת הסגירה של ההפרשה לשנת 2026{e.modes.length > 1 ? ", בשתי ההנחות" : ""}.
        </P>
        <ExamCheck id={e.id} sets={runs.map(({ mode, r }) => ({ mode, answers: { opening: r.opening$, expense: r.expense, payments: r.paid, closing: r.closing$ } }))} hints={HINTS} />
        <SolutionBox>
          <div className="rounded-xl bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
            <span className="block text-[13px] font-bold text-muted">המלכודת במבחן הזה</span>
            {e.trap}
          </div>
          <P>
            <strong>שלבים 1–2, סיווג:</strong> ימים שלא נוצלו עוברים לשנה אחת, ולכן ההיעדרות נצברת.{" "}
            {e.modes.length > 1 ? "פותרים פעמיים: בלי פדיון (הנחה א׳) ועם פדיון (הנחה ב׳)." : e.modes[0] === "B" ? "עוזב מקבל פדיון, ולכן היא מבשילה (הנחה ב׳)." : "אין פדיון, ולכן היא לא מבשילה (הנחה א׳)."} רק הימים שמעבר ל-
            {e.data.entitlement} ימי הזכאות של השנה נלקחים מהיתרה. היתרה לעובד: {n(balanceOf(e.data))} ימים.
          </P>
          {runs.map(({ mode, r }) => (
            <div key={mode} className="space-y-2">
              {runs.length > 1 && <p className="text-[16px] font-bold">הנחה {mode === "A" ? "א׳: לא מבשילה" : "ב׳: מבשילה"}</p>}
              <p className="text-[14px] font-bold text-muted">שלב 3: פתיחה, לפי הצפי</p>
              <OpeningTable c={e.data} r={r} />
              <p className="text-[14px] font-bold text-muted">שלב 4: תשלומים, לפי מה שקרה</p>
              <PaymentsTable c={e.data} r={r} />
              <p className="text-[14px] font-bold text-muted">שלב 5: סגירה, רק הנשארים</p>
              <ClosingTable c={e.data} r={r} />
              <p className="text-[14px] font-bold text-muted">שלב 6: טבלת התנועה</p>
              <Movement r={r} />
            </div>
          ))}
        </SolutionBox>
        <Remember>{e.trap}</Remember>
      </>
    ),
  };
}

const exam = (id: string) => examScreen(ABSENCE_EXAMS.find((e) => e.id === id)!);

// -----------------------------------------------------------------------------

export const IAS19_SHORT_SCREENS: Record<string, ScreenContent> = {
  "emp-short-map": {
    lead: "שאלה על ימי מחלה או חופשה נפתרת תמיד באותו סדר. הנה הסדר, ומכאן נפתור לפיו תרגיל אחד, בשתי ההנחות.",
    body: (
      <>
        <StepList />
        <P>
          לכל שלב יש מסך משלו. בכל טבלה תמצאו מתג בין הנחה א׳ (לא מבשילה) להנחה ב׳ (מבשילה). המתג זוכר את הבחירה בין המסכים, כך שאפשר לעבור את כל ששת השלבים בהנחה אחת, ואז לחזור ולעבור אותם בשנייה.
        </P>
        <Part title="התרגיל שנפתור">
          <Facts lines={ALON_FACTS} />
        </Part>
        <Remember>סיווג, מה נכנס, פתיחה לפי הצפי, תשלומים לפי מה שקרה, סגירה אחרי ניצול ופקיעה, ובסוף טבלת תנועה שבה ההוצאה היא הנעלם.</Remember>
      </>
    ),
  },
  "emp-short-classify": {
    lead: "לפני כל חישוב עונים על שתי שאלות, ואז מבינים איזה חלק מהימים בכלל עולה כסף.",
    body: (
      <>
        <Part title="שלב 1: לסווג את ההיעדרות">
          <P>התשובות לשתי השאלות קובעות אם יש הפרשה בכלל, ואיך מחשבים אותה.</P>
          <ClassifyAbsence />
          <P>
            <strong>איך מזהים בנוסח השאלה:</strong> ״ימי מחלה נצברים לשנה אחת קדימה״ אומר שהם נצברים. ״אין פדיון ימי מחלה במזומן״ אומר שהם לא מבשילים (הנחה א׳). ״עובד שעוזב זכאי לקבל את הימים שצבר״ אומר שהם
            מבשילים (הנחה ב׳).
          </P>
        </Part>
        <Part title="שלב 2: מה נכנס להפרשה">
          <P>
            הפרשה מודדת רק כסף שהחברה תשלם בגלל היתרה, מעבר למה שהייתה משלמת בכל מקרה. הניצול לפי LIFO: קודם {ALON.entitlement} ימי הזכאות של השנה, ורק אחריהם היתרה מהשנה הקודמת. לכן{" "}
            {ALON.entitlement} הימים הראשונים הם שכר רגיל, ורק מהיום ה-{ALON.entitlement + 1} נוצרת עלות נוספת. הזיזו את הסרגל:
          </P>
          <DayStrip entitlement={ALON.entitlement} balance={ALON.carried[0]} dayCost={ALON.dayCost} initial={7.5} />
          <Work w={work.fromBalance(ALON.carried[0], 7.5, ALON.entitlement)} />
        </Part>
        <Part title="למה מחלקים לקבוצות ולא מכפילים ממוצע">
          <P>
            ההפרשה לא עולה בקו ישר עם הניצול: מי שלא עובר את {ALON.entitlement} הימים תורם 0. שני עובדים שמנצלים {ALON.entitlement} ו-{ALON.entitlement + 3} ימים מנצלים בממוצע{" "}
            {n(ALON.entitlement + 1.5)} ימים. לפי הממוצע יוצא <L>{`2 × MIN(${ALON.carried[0]}, ${n(1.5)}) = 3`}</L> ימי יתרה. לפי כל עובד לחוד יוצא{" "}
            <L>{`0 + MIN(${ALON.carried[0]}, ${ALON.entitlement + 3} − ${ALON.entitlement}) = ${ALON.carried[0]}`}</L> ימים. לכן מחלקים את העובדים לקבוצות לפי הניצול הצפוי, וכל קבוצה מקבלת חישוב משלה.
          </P>
        </Part>
        <Remember>נצברת? מבשילה? ואז: רק הימים שמעבר לזכאות של השנה נלקחים מהיתרה, ורק הם נכנסים להפרשה. מחלקים לקבוצות, לא עובדים עם ממוצע.</Remember>
      </>
    ),
  },
  "emp-short-opening": {
    lead: "ב-31.12.2025 השנה הבאה עוד לא קרתה, ולכן מודדים לפי הצפי.",
    body: (
      <>
        <ol className="list-decimal space-y-1.5 ps-6 text-[15.5px] leading-relaxed">
          <li>מחלקים את העובדים לקבוצות לפי ניצול צפוי, ומפצלים עוזבים מנשארים.</li>
          <li>
            לכל קבוצה: <L>{FORMULA.fromBalance}</L>. כלומר הימים שמעבר לזכאות השוטפת, ולא יותר מהיתרה.
          </li>
          <li>בהנחה ב׳ עוזב מקבל את כל היתרה, ולכן לעוזבים לוקחים את מלוא היתרה.</li>
          <li>מסכמים ימים (עובדים × ימים לעובד) ומכפילים בעלות היום.</li>
        </ol>
        <ByMode
          a={
            <>
              <OpeningTable c={ALON} r={A} />
              <Note mode="A">
                מי שעוזב מפסיד את היתרה, ולכן רק קבוצת ה-{ALON.opening[3].staff} תורמת להפרשה: <L>{`${ALON.opening[3].staff} × ${n(A.opening[3].perHead)} = ${n(A.openingDays)}`}</L> ימים.{" "}
                {ALON.opening[1].staff + ALON.opening[2].staff} העובדים שמנצלים {ALON.entitlement} ימים לא נוגעים ביתרה.
              </Note>
            </>
          }
          b={
            <>
              <OpeningTable c={ALON} r={B} />
              <Note mode="B">
                {ALON.opening[0].staff + ALON.opening[1].staff} עוזבים צפויים ({ALON.opening[0].staff} בתחילת השנה ו-{ALON.opening[1].staff} בסופה) מקבלים {ALON.carried[0]} ימים כל אחד, גם אם לא ינצלו אותם:{" "}
                <L>{`${ALON.opening[0].staff + ALON.opening[1].staff} × ${ALON.carried[0]} = ${(ALON.opening[0].staff + ALON.opening[1].staff) * ALON.carried[0]}`}</L> ימים. {ALON.opening[2].staff} הנשארים מהקבוצה הגדולה
                ממשיכים לתרום 0, וקבוצת ה-{ALON.opening[3].staff} תורמת {n(A.openingDays)}.
              </Note>
            </>
          }
        />
        <Deeper title="הדוגמה של התקן (סעיף 17)">
          <P>
            {EXPECT.staff} עובדים, {EXPECT.entitlement} ימי מחלה בשנה, LIFO, ולכל עובד בממוצע {EXPECT.carried} ימים צבורים. לפי הניסיון, בשנה הבאה {EXPECT.groups[0].staff} עובדים ינצלו עד{" "}
            {EXPECT.entitlement} ימים, ו-{EXPECT.groups[1].staff} ינצלו {EXPECT.groups[1].use} ימים. רק השמונה יגיעו ליתרה, ולכן ההפרשה היא על{" "}
            <L>{`${EXPECT.groups[1].staff} × ${fromCarried(EXPECT.groups[1].use)} = ${EXPECT_DAYS}`}</L> ימים, ולא על {EXPECT.staff * EXPECT.carried}. אותו שלב 3, באותה נוסחה.
          </P>
        </Deeper>
        <Remember>פתיחה לפי הצפי: לכל קבוצה MIN(יתרה, MAX(0, צפי − זכאות)). בהנחה ב׳ העוזבים הצפויים, גם אלה שיעזבו בסוף השנה, נכנסים על כל היתרה.</Remember>
      </>
    ),
  },
  "emp-short-payments": {
    lead: "כאן משתמשים בנתונים בפועל, והספירה שונה משלב 3: סופרים את כל ימי ההיעדרות ששולמו.",
    body: (
      <>
        <P>
          התשלומים הם כל ימי ההיעדרות ששולמו, כולל {ALON.entitlement} הימים השוטפים של כל עובד, ולא רק ימי היתרה. בהנחה ב׳ מוסיפים פדיון: עוזב מקבל את היתרה שנשארה לו אחרי הניצול.
        </P>
        <ol className="list-decimal space-y-1.5 ps-6 text-[15.5px] leading-relaxed">
          <li>
            מפצלים את העובדים לפי עזיבה. את מספר העובדים בקבוצה האחרונה מחשבים לבד: <L>{`${ALON_STAFF} − ${ALON.actual[0].staff} − ${ALON.actual[1].staff + ALON.actual[2].staff} = ${ALON.actual[3].staff}`}</L>.
          </li>
          <li>
            לכל קבוצה: <L>{FORMULA.paidDays}</L>.
          </li>
          <li>מכפילים עובדים, ימים ועלות יום.</li>
        </ol>
        <ByMode
          a={
            <>
              <PaymentsTable c={ALON} r={A} />
              <Note mode="A">
                עוזב לא מקבל פדיון. לכן {ALON.actual[0].staff} העוזבים בתחילת השנה מקבלים 0, והעוזבים בסוף השנה מקבלים רק את {ALON.actual[1].use} הימים שניצלו. סה״כ{" "}
                <L>{`${ALON.actual[1].staff + ALON.actual[2].staff} × ${ALON.actual[2].use} + ${ALON.actual[3].staff} × ${ALON.actual[3].use} = ${n(A.paidDays)}`}</L> ימים.
              </Note>
            </>
          }
          b={
            <>
              <PaymentsTable c={ALON} r={B} />
              <Note mode="B">
                {ALON.actual[0].staff} העוזבים בתחילת השנה מקבלים את {ALON.carried[0]} ימי היתרה כל אחד. {ALON.actual[1].staff} העוזבים בסוף השנה ניצלו {ALON.actual[1].use} ימים, מהם{" "}
                {B.actual[1].fromCarried === 1 ? "יום אחד" : `${B.actual[1].fromCarried} ימים`} מהיתרה. נשארו להם {B.actual[1].payout} ימי יתרה, והם משולמים בפדיון:{" "}
                <L>{work.paidDays(ALON.actual[1].use, B.actual[1].payout).numbers}</L> ימים. סה״כ {n(B.paidDays)} ימים.
              </Note>
            </>
          }
        />
        <Remember>תשלומים לפי מה שקרה: כל הימים ששולמו, כולל הימים השוטפים. בהנחה ב׳ גם פדיון לעוזבים, ובהם העוזבים בסוף השנה.</Remember>
      </>
    ),
  },
  "emp-short-closing": {
    lead: "בסוף השנה סופרים רק את מי שנשאר, אחרי שהשנה ניצלה ימים והיתרה הישנה פקעה.",
    body: (
      <>
        <P>
          לכל עובד שנשאר יש יתרה חדשה: הימים שלא נוצלו מהזכאות של השנה, <L>{FORMULA.carryOut}</L> (אם חיובי). יתרה ישנה שלא נוצלה פוקעת, כי הימים נצברים לשנה אחת בלבד. אחר כך מניחים שבשנה הבאה אין עזיבות
          והעובדים ינצלו את המקסימום, ולכן כל יום יתרה יעלה כסף.
        </P>
        <ByMode a={<ClosingTable c={ALON} r={A} />} b={<ClosingTable c={ALON} r={B} />} />
        <Note mode="both">
          {ALON.actual[2].staff} העובדים שניצלו {ALON.actual[2].use} ימים גמרו את כל {ALON.entitlement} ימי 2026 ולא מעבירים כלום. {ALON.actual[3].staff} העובדים שניצלו {ALON.actual[3].use} ימים מעבירים{" "}
          <L>{work.carryOut(ALON.entitlement, ALON.actual[3].use).numbers}</L> ימים כל אחד. יתרת 2025 שלא נוצלה פקעה. {ALON.actual[0].staff + ALON.actual[1].staff} העוזבים לא נספרים. אין עזיבות צפויות ב-2027,
          ולכן הסגירה זהה בשתי ההנחות.
        </Note>
        <Part title="פקיעה: מה קרה ליתרה של 2025">
          <P>
            הימים עוברים לשנה אחת בלבד, ולכן כל מה שלא נוצל מיתרת 2025 עד 31.12.2026 פקע. {ALON.actual[3].staff} העובדים שניצלו {ALON.actual[3].use} ימים לא הגיעו ליתרה בכלל, וכל{" "}
            {ALON.carried[0]} הימים שלהם פקעו. {ALON.actual[2].staff} העובדים שניצלו {ALON.actual[2].use} ימים לקחו מהיתרה {A.actual[2].fromCarried === 1 ? "יום אחד" : `${A.actual[2].fromCarried} ימים`}, ו-
            {A.actual[2].lapsed} פקעו. את זה רואים בעמודה ״יתרה שפקעה או אבדה״ בטבלת התשלומים.
          </P>
          <P>
            הטעות הנפוצה היא להעביר גם את היתרה הישנה לסגירה:{" "}
            <L>{`(${ALON.actual[3].staff} × (${work.carryOut(ALON.entitlement, ALON.actual[3].use).numbers.split(" = ")[1]} + ${ALON.carried[0]})) × ${ALON.dayCost} = ${fmt(ALON.actual[3].staff * (A.actual[3].ownLeft + ALON.carried[0]) * ALON.dayCost)}`}</L>{" "}
            במקום <Money v={A.closing$} />.
          </P>
        </Part>
        <Remember>סגירה: רק הנשארים. יתרה חדשה = זכאות − ניצול. היתרה הישנה פוקעת. אם השאלה נותנת צפי לשנה הבאה, מודדים לפיו.</Remember>
      </>
    ),
  },
  "emp-short-movement": {
    lead: "הטבלה מחברת את שלושת החישובים. את ההוצאה לא מחשבים לבד: היא הסכום שמשלים את הטבלה.",
    body: (
      <>
        <ByMode
          a={
            <>
              <Movement r={A} title="הפרשה לימי מחלה, הנחה א׳" />
              <Journal r={A} />
            </>
          }
          b={
            <>
              <Movement r={B} title="הפרשה לימי מחלה, הנחה ב׳" />
              <Journal r={B} />
            </>
          }
        />
        <P>
          <strong>למה ההוצאה קרובה לתשלומים:</strong> ההוצאה כוללת את כל שכר ימי המחלה של השנה, כי כל תשלום הוא עלות של השנה. ההפרשה רק מתקנת את ההפרש: כשהיא יורדת, ההוצאה נמוכה מהתשלומים באותו סכום, וכשהיא עולה,
          ההוצאה גבוהה מהם.
        </P>
        <Part title="הפתרון המלא, בשתי ההנחות">
          <DataTable
            head={["שורה", "הנחה א׳: לא מבשילה", "הנחה ב׳: מבשילה"]}
            rows={(
              [
                ["יתרת פתיחה 31.12.2025", (r: AbsenceSolution) => work.dayTotal(r.opening.map((g) => ({ staff: g.staff, days: g.perHead })), ALON.dayCost).numbers],
                ["תשלומים ב-2026", (r: AbsenceSolution) => work.dayTotal(r.actual.map((g) => ({ staff: g.staff, days: g.paidPerHead })), ALON.dayCost).numbers],
                ["יתרת סגירה 31.12.2026", (r: AbsenceSolution) => work.dayTotal(r.closing.map((g) => ({ staff: g.staff, days: g.perHead })), ALON.dayCost).numbers],
                ["הוצאות שכר עבודה (נעלם)", (r: AbsenceSolution) => tool.expense(r.opening$, r.paid, r.closing$).numbers],
              ] as const
            ).map(([label, line]) => [
              label,
              <ModeMark key="a" of="A">
                <L>{line(A)}</L>
              </ModeMark>,
              <ModeMark key="b" of="B">
                <L>{line(B)}</L>
              </ModeMark>,
            ])}
          />
          <P>
            ההנחה שבחרתם במתג מסומנת בטבלה. ההבדל כולו בעוזבים: בהנחה ב׳ הם מגדילים את הפתיחה ב-<Money v={solved("B").opening$ - solved("A").opening$} /> ואת התשלומים ב-
            <Money v={solved("B").paid - solved("A").paid} />, והסגירה זהה.
          </P>
        </Part>
        <Remember>
          <L>{FORMULA.expense}</L>. רישום: חובה הוצאות שכר עבודה, זכות הפרשה. תשלום: חובה הפרשה, זכות מזומן.
        </Remember>
      </>
    ),
  },
  "emp-short-traps": {
    lead: "שמונה טעויות שחוזרות בשאלות האלה, ותבנית פתרון להעתיק למבחן.",
    body: (
      <>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["סופרים את הימים השוטפים כהפרשה", "בפתיחה ובסגירה הם שכר רגיל ולא נכנסים. בתשלומים הם כן נכנסים."],
              ["מכפילים ממוצע בכל העובדים", `מי שלא עובר את הזכאות תורם 0. מחלקים לקבוצות.`],
              ["מעבירים יתרה ישנה גם לסוף השנה", "בצבירה לשנה אחת, יתרת השנה הקודמת פוקעת בסוף השנה. בסגירה סופרים רק מה שנשאר מהשנה."],
              ["בהנחה ב׳ שוכחים את העוזבים בסוף השנה", `אצל ״אלון״ הם ${ALON.opening[0].staff + ALON.opening[1].staff} עוזבים בפתיחה ולא ${ALON.opening[0].staff}. בתשלומים הם מקבלים ${B.actual[1].paidPerHead} ימים: ${ALON.actual[1].use} שניצלו ועוד ${B.actual[1].payout} בפדיון.`],
              ["לא מפצלים קבוצה לעוזבים ונשארים", "העוזבים מקבלים טיפול אחר בהנחה ב׳, והם לא נכללים בסגירה."],
              ["מחשבים הוצאה במקום להשלים אותה", "ההוצאה היא סגירה פחות פתיחה ועוד תשלומים. אין לה חישוב עצמאי."],
              ["שוכחים את ״שאר העובדים״", `${ALON_STAFF} − ${ALON.actual[0].staff} − ${ALON.actual[1].staff + ALON.actual[2].staff} = ${ALON.actual[3].staff}. בדקו שסך העובדים בכל טבלה שווה למספר העובדים בחברה.`],
              ["כוללים עוזבים בסגירה", "עובד שעזב כבר קיבל את היתרה או הפסיד אותה, ולכן אין לו יתרה בסוף השנה."],
            ] as const
          ).map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] leading-relaxed">
              <strong className="block">{t}</strong>
              {d}
            </div>
          ))}
        </div>
        <Part title="תבנית פתרון למבחן">
          <pre className="overflow-x-auto rounded-xl bg-surface-2 px-4 py-3 font-[inherit] text-[15px] leading-[1.8] whitespace-pre-wrap">
            {`1. סיווג: נצברת? מבשילה? (הנחה א׳ או ב׳)
2. נתונים: עלות יום, זכאות שוטפת, יתרה לעובד, שנות צבירה
3. פתיחה (צפי): חלקו לקבוצות ופצלו עוזבים
   לכל קבוצה: ימי יתרה = MIN(יתרה, MAX(0, צפי ניצול − זכאות))
   הנחה ב׳: לעוזב, כל היתרה
   הפרשה = סה״כ ימים × עלות יום
4. תשלומים (בפועל): לכל קבוצה ימי היעדרות, ובהנחה ב׳ גם פדיון היתרה לעוזבים
   סה״כ ימים × עלות יום
5. סגירה: רק הנשארים
   יתרה חדשה = זכאות − ניצול (אם חיובי), יתרה ישנה פוקעת
   ניצול מקסימלי בשנה הבאה: כל היתרה × עלות יום (או לפי הצפי, אם נתון)
6. תנועה: פתיחה + הוצאה − תשלומים = סגירה
   הוצאה = סגירה − פתיחה + תשלומים
   רישום: חובה הוצאות שכר עבודה / זכות הפרשה
7. בדיקות: סך העובדים בכל טבלה, איזון הטבלה, רישום תשלומים (חובה הפרשה / זכות מזומן)`}
          </pre>
        </Part>
        <Remember>אחרי התבנית מחכים ארבעה מבחנים מסכמים. כל אחד בודק מלכודת אחרת מהרשימה הזו.</Remember>
      </>
    ),
  },
  "emp-short-exam-cap": { ...exam("cap") },
  "emp-short-exam-leavers": { ...exam("leavers") },
  "emp-short-exam-lapse": { ...exam("lapse") },
  "emp-short-exam-average": { ...exam("average") },
};
