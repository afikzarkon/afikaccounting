import { CircleSlash, Equal, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { CLEANING, type FixCase, FIXES, MULTI, MULTI_RESULTS, OLD_CONTRACT, OLD_RESULTS, RENEWED, RENEWED_RESULTS } from "@/lib/learn/basics-review";
import type { Entry } from "@/lib/learn/basics";
import { Remember } from "@/components/study-mode/screen-parts";
import { cn } from "@/lib/utils";
import { MiniQuiz } from "./inventory-interactive";
import { Calc, JE, Money, Stepper } from "./ui";

const two = (id: string, text: string, dr: string, cr: string, amount: number): Entry => ({ id, text, lines: [{ account: dr, dr: amount }, { account: cr, cr: amount }] });

/** What was recorded, what should have been, and the correction between them — side by side. */
function ThreeWay({ c }: { c: FixCase }) {
  const col = (label: string, tone: string, body: ReactNode) => (
    <div className="min-w-0 space-y-1.5">
      <p className={cn("text-[12px] font-bold", tone)}>{label}</p>
      {body}
    </div>
  );
  return (
    <div className="space-y-3">
      <p className="text-[15px]">{c.story}</p>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        {col(
          "1 · מה נרשם",
          "text-danger",
          c.recorded ? (
            <JE entry={c.recorded} note={null} />
          ) : (
            <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line-strong px-3 py-6 text-[14px] text-muted">
              <CircleSlash className="h-4 w-4" aria-hidden /> לא נרשם כלום
            </p>
          ),
        )}
        <Minus className="mx-auto hidden h-5 w-5 self-center text-subtle lg:block" aria-hidden />
        {col("2 · מה היה צריך", "text-accent", <JE entry={c.should} note={null} />)}
        <Equal className="mx-auto hidden h-5 w-5 self-center text-subtle lg:block" aria-hidden />
        {col("3 · התיקון = צריך פחות נרשם", "text-success", <JE entry={c.fix} note={null} />)}
      </div>
      <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[14.5px]">{c.why}</p>
    </div>
  );
}

// The four ways a cut-off item can stand on a preliminary trial balance, and what to do about each.
const CONTRACTS: { state: string; clue: string; means: string; act: string }[] = [
  { state: "חוזה ישן — נחתם לפני השנה", clue: "יש ״מראש״, ואין שורת הוצאה או הכנסה של אותו נושא", means: "השנה עוד לא נרשם כלום. היתרה נכונה ל-31.12 של השנה הקודמת", act: "מעבירים את החלק של השנה מה״מראש״ לרווח והפסד" },
  { state: "חוזה חדש, נרשם כנכס או כהתחייבות", clue: "כל הסכום יושב ב״מראש״", means: "שום חלק לא עבר לרווח והפסד", act: "מעבירים את החלק של השנה לרווח והפסד" },
  { state: "חוזה חדש, נרשם כהוצאה או כהכנסה", clue: "כל הסכום יושב בשורה התוצאתית", means: "גם החלק של השנה הבאה בפנים", act: "מוציאים את החלק של השנה הבאה ל״מראש״" },
  { state: "לא נרשם כלום", clue: "אין שום יתרה לנושא", means: "חסרה הוצאה או הכנסה של השנה", act: "רושמים ״לשלם״ או ״לקבל״" },
];

const R = MULTI_RESULTS;

export const REVIEW_SCREENS: Record<string, ScreenContent> = {
  "rev-method": {
    lead: "מאזן בוחן ראשוני הוא מה שנרשם במהלך השנה: חלק נכון, חלק שגוי, וחלק חסר. לכל נתון בשאלה שואלים שלוש שאלות — תמיד באותו סדר.",
    body: (
      <>
        <ol className="max-w-[70ch] space-y-1.5">
          {[
            ["מה נרשם?", "מחפשים בסיפור ובמאזן הבוחן מה כבר בספרים."],
            ["מה היה צריך?", "מחשבים לפי מה שקרה באמת עד 31.12."],
            ["התיקון = צריך פחות נרשם", "מה שחסר — מוסיפים. מה שעודף — מוציאים."],
          ].map(([t, d], i) => (
            <li key={t} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span>
                <strong className="text-fg">{t}</strong> — {d}
              </span>
            </li>
          ))}
        </ol>
        <ThreeWay c={CLEANING} />
        <Remember>שני מקרי קצה: לא נרשם כלום — התיקון הוא כל מה שצריך. הכול נרשם נכון — אין תיקון.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-method"
        items={[
          {
            q: "ב-1.10 התקבלו 24,000 ₪ על שירות לשנה, ונרשמו כולם כהכנסה. מה התיקון ב-31.12?",
            options: ["ח׳ הכנסות 18,000 / ז׳ הכנסות מראש 18,000", "ח׳ הכנסות מראש 6,000 / ז׳ הכנסות 6,000", "ח׳ מזומן 18,000 / ז׳ הכנסות מראש 18,000", "אין צורך בתיקון"],
            answer: 0,
            why: "נרשם: הכנסה 24,000. צריך: הכנסה 6,000 (3 חודשים) והכנסה מראש 18,000. ההפרש — 18,000 יוצאים מההכנסה ועוברים להתחייבות.",
          },
        ]}
      />
    ),
  },

  "rev-contract": {
    lead: "השאלה הראשונה על כל סעיף חתך: מתי נחתם החוזה, ומה כבר נרשם? מאזן הבוחן עצמו נותן את הרמז.",
    body: (
      <>
        <div className="scroll-x rounded-2xl border border-line">
          <table className="w-full min-w-[40rem] text-[14px]">
            <thead className="bg-surface-2/70 text-[12.5px] text-muted">
              <tr>
                {["המצב", "איך מזהים במאזן הבוחן", "מה זה אומר", "מה עושים"].map((h) => (
                  <th key={h} className="px-3 py-2 text-start font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTRACTS.map((c) => (
                <tr key={c.state} className="border-t border-line align-top">
                  <td className="px-3 py-2.5 font-bold text-fg">{c.state}</td>
                  <td className="px-3 py-2.5">{c.clue}</td>
                  <td className="px-3 py-2.5 text-fg/85">{c.means}</td>
                  <td className="px-3 py-2.5 font-medium text-accent">{c.act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>דוגמה: חוזה ישן.</strong> ב-{OLD_CONTRACT.start} שולמו <Money v={OLD_CONTRACT.paid} /> על ביטוח ל-{OLD_CONTRACT.months} חודשים. במאזן הבוחן הראשוני של 31.12.2025 מופיע ״הוצאות ביטוח מראש{" "}
            <Money v={OLD_RESULTS.balance2024} />״ — ואין הוצאות ביטוח בכלל.
      </p>
        <Calc>
          ביטוח לחודש: <Money v={OLD_CONTRACT.paid} /> ÷ {OLD_CONTRACT.months} = <Money v={OLD_RESULTS.month} />. ב-2024 נוצלו {OLD_CONTRACT.monthsIn2024} חודשים, ונשארו{" "}
          <Money v={OLD_RESULTS.balance2024} /> — בדיוק היתרה במאזן. סימן שב-2025 עוד לא נרשם כלום.
        </Calc>
        <JE
          entry={two("31.12", "ההתאמה: 12 החודשים של 2025", "הוצאות ביטוח", "הוצאות ביטוח מראש", OLD_RESULTS.expense2025)}
          note={<>נשארים <Money v={OLD_RESULTS.left} /> — ינואר עד מרץ 2026.</>}
        />
        <Remember>יש ״מראש״ ואין שורה תוצאתית? חוזה ישן: היתרה של סוף השנה הקודמת.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-contract"
        items={[
          {
            q: "במאזן בוחן ראשוני יש ״הכנסות שכירות מראש 30,000״, ואין ״הכנסות שכירות״. מה זה אומר?",
            options: ["חוזה ישן: השנה עוד לא הוכר שום חלק כהכנסה", "השוכר לא שילם השנה", "ההכנסה כבר נרשמה כולה", "טעות — צריך למחוק את היתרה"],
            answer: 0,
            why: "אין שורה תוצאתית — כלום עוד לא עבר לרווח והפסד. היתרה נכונה לסוף השנה הקודמת, ועכשיו מעבירים ממנה את החלק של השנה.",
          },
        ]}
      />
    ),
  },

  "rev-multiyear": {
    lead: "חוזה שמתחדש, חוזה שנגמר, ויתרה שלא נתונה — כולם נפתרים בשתי נוסחאות: כמה עולה חודש, וכמה חודשים נשארו.",
    body: (
      <>
        <ul className="list-disc space-y-1 ps-5 marker:text-subtle">
          <li>
            <strong>תשלום לחודש</strong> = הסכום ששולם ÷ חודשי החוזה
          </li>
          <li>
            <strong>יתרת ״מראש״</strong> = תשלום לחודש × החודשים שנשארו
          </li>
        </ul>
        <Stepper
          label="ארבעה חוזים לאורך שנים"
          steps={[
            {
              title: "1 · חוזה שמתחדש",
              body: (
                <>
                  <p>
                    מאז {MULTI.renewal.firstYear} החברה משלמת מראש על ביטוח לשלוש שנים, <Money v={MULTI.renewal.monthly} /> לחודש, ורושמת את התשלום כ״מראש״. החוזה מתחדש
                    בכל פעם שהוא נגמר. מה ההתאמה ל-31.12.{MULTI.renewal.year}?
                  </p>
                  <Calc>
                    המחזורים: 2017–2019, 2020–2022, <strong>2023–2025</strong>. ב-1.1.{R.renewal.start} שולמו <Money v={R.renewal.paid} />. אחרי 2023 ו-2024 נשארו{" "}
                    <Money v={R.renewal.opening} /> — זו היתרה במאזן הבוחן.
                  </Calc>
                  <JE entry={two("31.12", `ההתאמה: 12 החודשים של ${MULTI.renewal.year}`, "הוצאות ביטוח", "הוצאות ביטוח מראש", R.renewal.expense)} note="המחזור נגמר: היתרה מתאפסת, וב-1.1.2026 יתחדש החוזה." />
                </>
              ),
            },
            {
              title: "2 · חוזה שנגמר ולא חודש",
              body: (
                <>
                  <p>
                    ב-{MULTI.expired.start} שולמו <Money v={MULTI.expired.paid} /> על שכירות לשנתיים. החוזה נגמר ב-{MULTI.expired.end} ולא חודש. במאזן הבוחן: ״הוצאות שכירות
                    מראש <Money v={R.expired.opening} />״.
                  </p>
                  <Calc>
                    <Money v={R.expired.month} /> לחודש × {MULTI.expired.leftAfter2024} החודשים שנשארו אחרי 2024 = <Money v={R.expired.opening} />. כולם עברו ב-2025.
                  </Calc>
                  <JE entry={two("31.12", "ההתאמה: כל היתרה עוברת להוצאה", "הוצאות שכירות", "הוצאות שכירות מראש", R.expired.opening)} note="אחרי שהחוזה נגמר לא נשאר כלום ״מראש״. היתרה מתאפסת." />
                </>
              ),
            },
            {
              title: "3 · היתרה במאזן הבוחן: ״?״",
              body: (
                <>
                  <p>
                    חוזה פרסום מ-{MULTI.unknown.start} עד {MULTI.unknown.end}, ששולמו עליו <Money v={MULTI.unknown.paid} /> ונרשמו כ״מראש״. במאזן הבוחן של 31.12.2025 היתרה מופיעה
                    כ-״?״.
                  </p>
                  <Calc result={<Money v={R.unknown.opening} />}>
                    <Money v={R.unknown.month} /> לחודש. ב-2024 נוצלו {MULTI.unknown.usedIn2024} חודשים (יוני–דצמבר), ונשארו {MULTI.unknown.months - MULTI.unknown.usedIn2024} חודשים: ״?״
                  </Calc>
                  <JE entry={two("31.12", "ההתאמה: 12 החודשים של 2025", "הוצאות פרסום", "הוצאות פרסום מראש", R.unknown.expense)} note={<>נשארים <Money v={R.unknown.closing} /> — ינואר עד מאי 2026.</>} />
                </>
              ),
            },
            {
              title: "4 · חוזה שחודש במחיר אחר",
              body: (
                <>
                  <p>
                    ב-1.4.2023 שולם מראש חוזה שמירה ל-24 חודשים, ונרשם כ״מראש״. במאזן הבוחן הראשוני של 31.12.2025: ״הוצאות שמירה מראש <Money v={RENEWED.balance2024} />״, ואין הוצאות שמירה. ב-1.4.2025 החוזה חודש לשנה, במחיר גבוה ב-{Math.round(RENEWED.raise * 100)}%, ושולם מראש. התשלום לא נרשם.
                  </p>
                  <Calc result={<Money v={RENEWED_RESULTS.month} />}>
                    החוזה הישן: היתרה היא של סוף 2024 ומכסה {RENEWED.monthsLeft} חודשים, ינואר עד מרץ. לחודש: <Money v={RENEWED.balance2024} /> ÷ {RENEWED.monthsLeft}
                  </Calc>
                  <Calc result={<Money v={RENEWED_RESULTS.paid} />}>
                    החוזה החדש: <Money v={RENEWED_RESULTS.month} /> × {1 + RENEWED.raise} = <Money v={RENEWED_RESULTS.newMonth} /> לחודש, × {RENEWED.newMonths} חודשים
                  </Calc>
                  <JE entry={two("1", "החוזה הישן: ינואר עד מרץ 2025", "הוצאות שמירה", "הוצאות שמירה מראש", RENEWED.balance2024)} note="החוזה הישן נגמר ב-31.3.2025. כל היתרה עוברת להוצאה." />
                  <JE
                    entry={{
                      id: "2",
                      text: "החוזה החדש: התשלום, מחולק בין 2025 ל-2026",
                      lines: [
                        { account: "הוצאות שמירה", dr: RENEWED_RESULTS.expense },
                        { account: "הוצאות שמירה מראש", dr: RENEWED_RESULTS.prepaid },
                        { account: "מזומן", cr: RENEWED_RESULTS.paid },
                      ],
                    }}
                    note={<>אפריל עד דצמבר, {RENEWED.monthsIn2025} חודשים, הם הוצאה של 2025. ינואר עד מרץ 2026 נשארים ״מראש״.</>}
                  />
                </>
              ),
            },
          ]}
        />
        <Remember>יתרת ״מראש״ = תשלום לחודש × החודשים שנשארו. חוזה שנגמר מתאפס. חוזה שחודש במחיר אחר: קודם מוצאים את התשלום הישן לחודש, ורק אז מוסיפים את ההעלאה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-multiyear"
        items={[
          {
            q: "חוזה אחזקה מ-1.7.2024 ל-30 חודשים, 60,000 ₪ ששולמו מראש. מה היתרה ״מראש״ במאזן הבוחן הראשוני של 31.12.2025?",
            options: ["48,000", "36,000", "60,000", "24,000"],
            answer: 0,
            why: "2,000 לחודש. ב-2024 נוצלו 6 חודשים: 60,000 − 12,000 = 48,000. ב-2025 עוד לא נרשם כלום — זו היתרה.",
          },
        ]}
      />
    ),
  },

  "rev-fix": {
    lead: "לפעמים רק חשבון אחד שגוי, ואז התיקון מזיז את הסכום ממנו לחשבון הנכון. ולפעמים הפקודה שגויה כולה, נרשמה הפוך או בחשבונות אחרים, ואז התיקון מבטל אותה ורושם את הנכונה.",
    body: (
      <>
        <Stepper label="שבע טעויות שחוזרות בשאלות" steps={FIXES.map((c, i) => ({ title: `${i + 1} · ${c.title}`, body: <ThreeWay c={c} /> }))} />
        <Remember>חשבון שמופיע גם במה שנרשם וגם במה שצריך, באותו צד ובאותו סכום, לא משתתף בתיקון. פקודה שנרשמה הפוך מתוקנת בסכום כפול.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-fix"
        items={[
          {
            q: "שכר של 8,000 ₪ ששולם במזומן נרשם: ח׳ הוצאות שכר / ז׳ ספקים. מה התיקון?",
            options: ["ח׳ ספקים / ז׳ מזומן", "ח׳ הוצאות שכר / ז׳ מזומן", "ח׳ מזומן / ז׳ ספקים", "ח׳ ספקים / ז׳ הוצאות שכר"],
            answer: 0,
            why: "ההוצאה נכונה. החוב לספק שנרשם בטעות נסגר, והמזומן שבאמת יצא — יוצא.",
          },
        ]}
      />
    ),
  },

  "rev-profit": {
    lead: "שאלה שחוזרת בבחינות: מה הטעות עשתה לרווח? התשובה פשוטה — רק טעות שנוגעת בחשבון תוצאתי משנה את הרווח.",
    body: (
      <>
        <ul className="divide-y divide-line">
          {FIXES.map((c) => (
            <li key={c.id} className="grid items-center gap-2 py-2.5 sm:grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1.6fr)]">
              <span className="text-[15px] font-semibold text-fg">{c.title}</span>
              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-bold",
                  c.profit === "right" ? "bg-surface-2 text-muted" : c.profit === "low" ? "bg-debit/10 text-debit" : "bg-credit/10 text-credit",
                )}
              >
                {c.profit === "right" ? <Equal className="h-3.5 w-3.5" aria-hidden /> : c.profit === "low" ? <TrendingDown className="h-3.5 w-3.5" aria-hidden /> : <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
                {c.profit === "right" ? "הרווח היה נכון" : c.profit === "low" ? `הרווח היה נמוך ב-${c.fix.lines[0].dr!.toLocaleString("he-IL")}` : `הרווח היה גבוה ב-${c.fix.lines[0].dr!.toLocaleString("he-IL")}`}
              </span>
              <span className="text-[14px] text-fg/85">
                {c.profit === "right" ? "התיקון מזיז בין שני חשבונות מאזניים." : `התיקון נוגע ב${[...c.fix.lines].find((l) => /^(קניות|מכירות|הכנסות|הוצאות)/.test(l.account))?.account ?? "חשבון תוצאתי"}.`}
              </span>
            </li>
          ))}
        </ul>
        <Remember>השאלה לבדיקה: האם התיקון נוגע בהכנסה או בהוצאה? לא — הרווח לא זז.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-profit"
        items={[
          {
            q: "מכונה של 30,000 ₪, שנקנתה ב-31.12, נרשמה בטעות כהוצאות אחזקה. מה זה עשה לרווח?",
            options: ["הרווח נמוך ב-30,000", "הרווח גבוה ב-30,000", "הרווח לא השתנה", "הרווח נמוך ב-60,000"],
            answer: 0,
            why: "נכס נרשם כהוצאה — ההוצאות גבוהות ב-30,000, והרווח נמוך באותו סכום.",
          },
          {
            q: "תשלום לספק של 12,000 ₪ נרשם: ח׳ ספקים / ז׳ לקוחות. מה זה עשה לרווח?",
            options: ["לא השתנה", "נמוך ב-12,000", "גבוה ב-12,000", "נמוך ב-24,000"],
            answer: 0,
            why: "שני החשבונות מאזניים. הלקוחות והמזומן שגויים — אבל הרווח לא זז.",
          },
        ]}
      />
    ),
  },
};
