import { ArrowRight, ChevronDown, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { partRate } from "@/lib/learn/ias19";
import { said, tool, TOOL } from "@/lib/study/ias19/formulas";
import { CASE, CASE_INTEREST, CASE_TODAY, DANA_NEXT, DANA_NOW, DEPOSIT, DEPOSIT_FV, HOOK, PART_BALANCE, PERIODS, VACATION, VACATION_EXPENSE } from "@/lib/study/ias19/lessons/toolkit";
import { fmt } from "@/lib/study/ias19/shared";
import { ltrQuiz } from "@/lib/study/ias19/ltr";
import { Ltr, Work } from "./ias19-formula";
import { RollForward, T19 } from "./ias19-ui";
import { Diff, Timeline } from "./ias19-visuals";
import type { QuizItem } from "./inventory-interactive";
import { Money } from "./ui";
import { IasQuiz } from "./ias19-quiz";

/**
 * The employee-benefits course, lesson 2: the toolkit — present value,
 * interest for part of a year, and the roll-forward. Each tool comes with why
 * the course needs it, and every result is worked both ways: by the formula of
 * the course's main page, and in Excel. Nothing opens step by step.
 */

/** Questions inside the reading of a page, after a "stop and check" heading. */
const inlineQuiz = (chapter: string, items: QuizItem[]) => <IasQuiz inline chapter={chapter} items={ltrQuiz(items)} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const pct = (r: number, d = 2) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: d })}%`;
/** A formula inside a sentence, read left to right. */
const L = Ltr;
/** A formula on a line of its own. */
const F = ({ children }: { children: string }) => (
  <span className="block py-0.5 font-semibold">
    <L>{children}</L>
  </span>
);

/** A question set out the same way everywhere in the lesson: what we look for, the task, a moment to try, and the full solution behind one button. */
export function Solve({ seek, task, children }: { seek: ReactNode; task: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-3.5">
      <p className="flex items-start gap-2 text-[14.5px]">
        <Search className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <span>
          <strong>מה מחפשים: </strong>
          {seek}
        </span>
      </p>
      <p className="text-[15px] leading-relaxed">
        <strong>השאלה: </strong>
        {task} <span className="text-muted">נסו לפתור לבד, ורק אז פתחו את הפתרון.</span>
      </p>
      <details className="group border-t border-line pt-2.5">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-[14px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
          <span className="group-open:hidden">הצגת הפתרון</span>
          <span className="hidden group-open:inline">הסתרת הפתרון</span>
        </summary>
        <div className="mt-2.5 space-y-1.5">{children}</div>
      </details>
    </div>
  );
}

export const IAS19_TOOLS_SCREENS: Record<string, ScreenContent> = {
  "emp-tool-hook": {
    lead: "הרבה מהחובות לעובדים ישולמו רק בעוד כמה שנים. לפני שמודדים אותם, צריך להבין איך כסף זז בזמן.",
    body: (
      <>
        <P>
          לדנה יש חוזה שבו כתוב שכשתפרוש, בעוד {HOOK.years} שנים, היא תקבל מענק של <Money v={HOOK.amount} />. עכשיו סוף השנה, והחברה מכינה דוחות כספיים. היא צריכה לכתוב בהם כמה היא חייבת לדנה.
        </P>
        <Timeline
          label={`${HOOK.amount.toLocaleString("he-IL")} ₪ שישולמו בעוד ${HOOK.years} שנים: מה כותבים בדוח היום?`}
          from={0}
          to={HOOK.years}
          ticks={[
            { at: 0, label: "היום: יום הדוח" },
            ...Array.from({ length: HOOK.years - 1 }, (_, k) => ({ at: k + 1, label: `שנה ${k + 1}` })),
            { at: HOOK.years, label: `שנה ${HOOK.years}: התשלום` },
          ]}
          marks={[
            { at: 0, label: "? ₪", tone: "accent" },
            { at: HOOK.years, label: `${HOOK.amount.toLocaleString("he-IL")} ₪`, tone: 1 },
          ]}
        />
        {inlineQuiz("emp-tool-hook", [
          {
            q: "מה תכתוב החברה בדוח?",
            options: [`פחות מ-${fmt(HOOK.amount)} ₪`, `בדיוק ${fmt(HOOK.amount)} ₪, כי זה מה שכתוב בחוזה`, `יותר מ-${fmt(HOOK.amount)} ₪`],
            answer: 0,
            why: `אם היו מציעים לך ${fmt(HOOK.amount)} ₪ היום או בעוד ${HOOK.years} שנים, היית לוקח היום. את הכסף אפשר להפקיד בבנק, ובעוד ${HOOK.years} שנים יהיה לך יותר מ-${fmt(HOOK.amount)}. כלומר ${fmt(HOOK.amount)} ₪ שמקבלים בעוד ${HOOK.years} שנים שווים היום פחות.`,
          },
        ])}
        <P>
          אז כמה פחות? זה תלוי בשני דברים: כמה ריבית הכסף יכול להרוויח, וכמה זמן מחכים. כדי לחשב את זה נלמד קודם איך כסף גדל קדימה בזמן, ואחר כך איך מחזירים אותו להיום. בסוף המסך ״אחורה בזמן״ נחזור לדנה ונמצא את המספר.
        </P>
        <P>ועוד דבר: בשנה הבאה התשלום יהיה קרוב יותר, ולכן החוב לדנה יגדל. כדי לעקוב אחרי מה שקורה לחוב משנה לשנה נשתמש במעגל, בהמשך החלק הזה.</P>
        <Remember>סכום שישולם בעתיד שווה היום פחות. בדוחות רושמים כמה הוא שווה היום.</Remember>
      </>
    ),
  },
  "emp-tool-fv": {
    lead: "כסף בבנק גדל כל שנה בריבית. ככה מגיעים מסכום של היום לסכום שיהיה בעתיד.",
    body: (
      <>
        <P>
          מפקידים היום <Money v={DEPOSIT.amount} /> בבנק, בריבית שנתית של {pct(DEPOSIT.rate)}. בסוף השנה הראשונה הבנק מוסיף {pct(DEPOSIT.rate)} מ-{fmt(DEPOSIT.amount)}, כלומר{" "}
          {fmt(DEPOSIT.amount * DEPOSIT.rate)}, ויש בחשבון {fmt(DEPOSIT.amount * (1 + DEPOSIT.rate))}. בשנה השנייה הריבית היא {pct(DEPOSIT.rate)} מ-{fmt(DEPOSIT.amount * (1 + DEPOSIT.rate))}, כלומר{" "}
          {fmt(DEPOSIT.amount * (1 + DEPOSIT.rate) * DEPOSIT.rate)}. וכך הלאה:
        </P>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface px-3 py-2">
          <table className="num w-full text-center text-[14.5px]">
            <thead>
              <tr className="text-[13px] text-muted">
                <th className="py-1.5 font-medium">שנה</th>
                <th className="font-medium">יתרת פתיחה</th>
                <th className="font-medium">ריבית {pct(DEPOSIT.rate)}</th>
                <th className="font-medium">יתרת סגירה</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: DEPOSIT.years }, (_, k) => {
                const opening = DEPOSIT.amount * (1 + DEPOSIT.rate) ** k;
                return (
                  <tr key={k} className="border-t border-line">
                    <td className="py-1.5">{k + 1}</td>
                    <td>{fmt(opening)}</td>
                    <td>{fmt(opening * DEPOSIT.rate)}</td>
                    <td className={k === DEPOSIT.years - 1 ? "font-bold" : undefined}>{fmt(opening * (1 + DEPOSIT.rate))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <P>
          יתרת הסגירה של כל שנה היא הפתיחה של השנה הבאה. והריבית גדלה כל שנה, כי היא מחושבת גם על הריבית של השנים הקודמות. לזה קוראים <T19 he="ריבית דריבית" />.
        </P>
        <P>
          אין צורך בטבלה כל פעם. להוסיף {pct(DEPOSIT.rate)} זה לכפול ב-{1 + DEPOSIT.rate}, ולכן {DEPOSIT.years} שנים הן {DEPOSIT.years} הכפלות:
        </P>
        <F>{`${fmt(DEPOSIT.amount)} × ${Array(DEPOSIT.years).fill(1 + DEPOSIT.rate).join(" × ")} = ${fmt(DEPOSIT.amount)} × ${1 + DEPOSIT.rate}^${DEPOSIT.years} = ${fmt(DEPOSIT.amount * (1 + DEPOSIT.rate) ** DEPOSIT.years)}`}</F>
        <P>
          זו הנוסחה של <T19 he="ערך עתידי" />. PV הוא הסכום היום, RATE הריבית השנתית, YEAR מספר השנים, ו-FV מה שיהיה בסוף:
        </P>
        <Work w={tool.fv(DEPOSIT.amount, DEPOSIT.rate, DEPOSIT.years)} />
        <P>באקסל pmt הוא תשלומים בדרך (אצלנו 0), ואת pv כותבים עם מינוס: מה שמפקידים יוצא מהכיס, ומה שמקבלים בסוף נכנס.</P>
        <P>
          ומה הקשר לדנה? החוב אליה מתנהג בדיוק כמו פיקדון כזה. כל שנה הוא גדל בריבית, עד שביום הפרישה הוא מגיע ל-<Money v={HOOK.amount} />.
        </P>
        {inlineQuiz("emp-tool-fv", [
          {
            q: "מפקידים 2,000 ₪ לשנתיים בריבית 5%. כמה יהיה בסוף?",
            options: ["2,205 ₪", "2,200 ₪", "2,100 ₪", "2,000 ₪"],
            answer: 0,
            why: `${said(tool.fv(2_000, 0.05, 2))}\n2,200 מתקבל אם מוסיפים 100 כל שנה, בלי ריבית על הריבית של השנה הראשונה. 2,100 הוא שנה אחת בלבד.`,
          },
        ])}
        <Remember>
          כל שנה כופלים ב-<L>(1 + RATE)</L>. ערך עתידי: <L>{TOOL.fv}</L>.
        </Remember>
      </>
    ),
  },
  "emp-tool-pv": {
    lead: "ערך נוכחי הוא אותה דרך בכיוון ההפוך: מהסכום שבעתיד חוזרים להיום.",
    body: (
      <>
        <P>
          במסך הקודם <Money v={DEPOSIT.amount} /> של היום הפכו ל-<Money v={DEPOSIT_FV} /> בעוד {DEPOSIT.years} שנים. אפשר לקרוא את זה גם הפוך: <Money v={DEPOSIT_FV} /> שיתקבלו בעוד {DEPOSIT.years} שנים שווים היום{" "}
          <Money v={DEPOSIT.amount} />. קדימה כפלנו ב-{1 + DEPOSIT.rate} כל שנה, ולכן אחורה מחלקים ב-{1 + DEPOSIT.rate} כל שנה.
        </P>
        <div className="rounded-xl border border-line bg-surface px-3 py-3">
          <div className="num grid text-center" style={{ gridTemplateColumns: `repeat(${DEPOSIT.years + 1}, minmax(0, 1fr))` }}>
            {Array.from({ length: DEPOSIT.years + 1 }, (_, k) => (
              <div key={k}>
                <div className="text-[12.5px] text-muted">{k === 0 ? "היום" : `שנה ${k}`}</div>
                <div className={k === 0 ? "text-[17px] font-bold text-accent" : k === DEPOSIT.years ? "text-[17px] font-bold" : "text-[17px]"}>{fmt(DEPOSIT.amount * (1 + DEPOSIT.rate) ** k)}</div>
              </div>
            ))}
          </div>
          <div className="mt-1 grid text-center text-[13px] text-muted" style={{ gridTemplateColumns: `repeat(${DEPOSIT.years}, minmax(0, 1fr))`, marginInline: `${50 / (DEPOSIT.years + 1)}%` }}>
            {Array.from({ length: DEPOSIT.years }, (_, k) => (
              <span key={k} className="inline-flex items-center justify-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                <L>{`÷ ${1 + DEPOSIT.rate}`}</L>
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-center text-[12.5px] text-muted">מהתשלום בעתיד חוזרים להיום</p>
        </div>
        <P>
          {DEPOSIT.years} חלוקות ב-{1 + DEPOSIT.rate} הן חלוקה אחת ב-<L>{`${1 + DEPOSIT.rate}^${DEPOSIT.years}`}</L>. זו הנוסחה של <T19 he="ערך נוכחי" />:
        </P>
        <Work w={tool.pv(DEPOSIT_FV, DEPOSIT.rate, DEPOSIT.years)} />
        <P>
          YEAR הוא מספר השנים <strong>מהיום ועד התשלום</strong>. לא כמה שנים העובד כבר עבד, ולא כמה הוא יעבוד בסך הכול.
        </P>
        <Part title="חוזרים לדנה">
          <P>
            דנה תקבל <Money v={HOOK.amount} /> בעוד {HOOK.years} שנים. בקורס הריבית שבה מחזירים חוב לעובדים להיום נקראת <T19 he="שיעור היוון" par="83" />. נניח שהוא {pct(HOOK.rate)}:
          </P>
          <Work w={tool.pv(HOOK.amount, HOOK.rate, HOOK.years)} />
          <P>
            זה המספר שהחברה כותבת בדוח היום. בשנה הבאה יישארו {HOOK.years - 1 === 2 ? "שנתיים" : `${HOOK.years - 1} שנים`}, ואותו חשבון ייתן{" "}
            <L>{`${fmt(HOOK.amount)} ÷ ${1 + HOOK.rate}^${HOOK.years - 1} = ${fmt(Math.round(DANA_NEXT))}`}</L> ₪. החוב גדל ב-<Money v={Math.round(DANA_NEXT - DANA_NOW)} /> בלי שקרה שום דבר, רק כי התשלום התקרב. את הגידול הזה נראה במעגל, בהמשך החלק הזה.
          </P>
        </Part>
        {inlineQuiz("emp-tool-pv", [
          {
            q: "כמה שווים היום 5,000 ₪ שישולמו בעוד שנתיים, בריבית 10%?",
            options: ["4,132 ₪", "4,545 ₪", "4,000 ₪", "6,050 ₪"],
            answer: 0,
            why: `${said(tool.pv(5_000, 0.1, 2))}\n4,545 הוא חלוקה אחת בלבד, כאילו נשארה שנה. 4,000 הוא הורדה של 500 פעמיים, בלי ריבית דריבית. 6,050 הוא הכפלה במקום חלוקה: זה הערך העתידי, לא הנוכחי.`,
          },
        ])}
        <Remember>
          קדימה בזמן כופלים, אחורה מחלקים. ערך נוכחי: <L>{TOOL.pv}</L>.
        </Remember>
      </>
    ),
  },
  "emp-tool-part": {
    lead: "בשאלות קורים דברים באמצע השנה, ואז צריך לדעת כמה ריבית יש ברבעון, בחודש או בחצי שנה.",
    body: (
      <>
        <P>
          החברה משלמת לעובד ב-31.3, או משנה את התוכנית ב-30.9. מאותו יום החוב שונה, ולכן צריך לחשב ריבית רק עד שם. החדשות הטובות: אין נוסחה חדשה. בנוסחה מהמסך ״קדימה בזמן״, YEAR <strong>לא חייב להיות מספר שלם</strong>. רבעון הוא 3 חודשים מתוך 12, כלומר <L>YEAR = 3/12</L>.
        </P>
        <p className="text-[13px] font-bold text-muted">
          אותו פיקדון, <Money v={DEPOSIT.amount} /> ב-{pct(DEPOSIT.rate)}, לרבעון אחד:
        </p>
        <F>{`${fmt(DEPOSIT.amount)} × (${1 + DEPOSIT.rate})^(3/12) = ${fmt(Math.round(DEPOSIT.amount * (1 + DEPOSIT.rate) ** 0.25 * 100) / 100)} ₪`}</F>
        <P>
          אז הריבית לרבעון היא {pct(partRate(DEPOSIT.rate, 3), 3)}. למה לא רבע מ-{pct(DEPOSIT.rate)}, כלומר {pct(DEPOSIT.rate / 4)}? נבדוק: ארבעה רבעונים של {pct(DEPOSIT.rate / 4)} נותנים{" "}
          <L>{`${1 + DEPOSIT.rate / 4}^4 = ${((1 + DEPOSIT.rate / 4) ** 4).toFixed(4)}`}</L>, כלומר {pct((1 + DEPOSIT.rate / 4) ** 4 - 1)} בשנה, יותר מ-{pct(DEPOSIT.rate)}. הסיבה היא שהריבית של כל רבעון מרוויחה ריבית ברבעונים הבאים. לכן הריבית לרבעון צריכה להיות <strong>קצת פחות מרבע</strong>.
        </P>
        <P>הנוסחה לשיעור של תקופה, בריבית דריבית:</P>
        <Work w={tool.partRate(DEPOSIT.rate, 3)} />
        <div className="overflow-x-auto rounded-xl border border-line bg-surface px-3 py-2">
          <table className="num w-full text-center text-[14.5px]">
            <thead>
              <tr className="text-[13px] text-muted">
                <th className="py-1.5 font-medium">תקופה</th>
                <th className="font-medium">YEAR</th>
                <th className="font-medium">שיעור, כשהשנתי {pct(DEPOSIT.rate)}</th>
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p.months} className="border-t border-line">
                  <td className="py-1.5">{p.label}</td>
                  <td>
                    <L>{p.months % 12 === 0 ? String(p.months / 12) : `${p.months}/12`}</L>
                  </td>
                  <td>{pct(partRate(DEPOSIT.rate, p.months), 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>
          וכמה ריבית בשקלים? מכפילים את היתרה בשיעור של התקופה. על יתרה של <Money v={PART_BALANCE} />, לרבעון:
        </P>
        <Work w={tool.part(PART_BALANCE, DEPOSIT.rate, 3)} />
        <Part title="ריבית פשוטה, כשהשאלה מבקשת אותה">
          <P>
            יש שאלות שמבקשות <strong>במפורש</strong> ריבית פשוטה. בה לא מחשבים ריבית על ריבית, אלא מכפילים את השיעור השנתי בחלק מהשנה:
          </P>
          <Work w={tool.simpleOn(PART_BALANCE, DEPOSIT.rate, 3)} />
          <P>
            כשהשאלה <strong>לא אומרת</strong> באיזו ריבית, משתמשים <strong>בריבית דריבית</strong>.
          </P>
        </Part>
        <Part title="ובערך נוכחי?">
          <P>
            אותו דבר. אם דנה הייתה מקבלת את המענק בעוד שנתיים וחצי, <L>YEAR = 2.5</L>:
          </P>
          <Work w={tool.pv(HOOK.amount, HOOK.rate, 2.5)} />
        </Part>
        {inlineQuiz("emp-tool-part", [
          {
            q: "ריבית שנתית 6%. מה השיעור לחצי שנה, בריבית דריבית?",
            options: ["2.956%", "3%", "6%", "1.5%"],
            answer: 0,
            why: `${said(tool.partRate(0.06, 6, 3))}\n3% הוא התשובה בריבית פשוטה:\n${said(tool.simple(0.06, 6))}\n6% הוא שנה שלמה, ו-1.5% הוא רבעון בריבית פשוטה.`,
          },
        ])}
        <Remember>
          YEAR יכול להיות חלק משנה: רבעון <L>3/12</L>, חודש <L>1/12</L>. שיעור לתקופה: <L>(1 + RATE)^YEAR − 1</L>. ריבית פשוטה, רק כשמבקשים: <L>RATE × YEAR</L>.
        </Remember>
      </>
    ),
  },
  "emp-tool-roll": {
    lead: "המעגל מראה מאיפה היתרה התחילה, מה קרה לה במשך השנה ואיפה היא נגמרה.",
    body: (
      <>
        <P>
          כבר ראיתם מעגל, בטבלת הפיקדון במסך ״קדימה בזמן״: יתרת פתיחה, ועוד ריבית, שווה יתרת סגירה. במעגל של חוב לעובדים יש עוד שורה, התשלומים. כשהחברה משלמת לעובדים, החוב קטן:
        </P>
        <F>{TOOL.roll}</F>
        <Part title="החוב לדנה, כמעגל">
          <P>
            במסך ״אחורה בזמן״ החוב לדנה היה <Money v={Math.round(DANA_NOW)} /> היום ו-<Money v={Math.round(DANA_NEXT)} /> בעוד שנה. מה נוסף באמצע? ריבית של {pct(HOOK.rate)} על החוב:{" "}
            <L>{`${fmt(Math.round(DANA_NOW))} × ${pct(HOOK.rate)} = ${fmt(Math.round(DANA_NEXT - DANA_NOW))}`}</L> ₪. בגיליון עבודה זה נראה כך:
          </P>
          <RollForward
            title="התחייבות למענק לדנה"
            rows={[
              { label: "יתרת פתיחה", value: Math.round(DANA_NOW), kind: "balance" },
              { label: `ריבית ${pct(HOOK.rate)}`, value: Math.round(DANA_NEXT - DANA_NOW) },
              { label: "יתרת סגירה", value: Math.round(DANA_NEXT), kind: "balance" },
            ]}
          />
          <P>
            התחייבות היא יתרת זכות, ולכן בגיליון היא כתובה <Diff>במינוס</Diff>. מה שמגדיל אותה גם במינוס, ותשלום, שמקטין אותה, כתוב <Diff>בפלוס</Diff>.
          </P>
        </Part>
        <Part title="כשחסרה שורה אחת">
          <P>
            ככה משתמשים במעגל בשאלות: נותנים את כל השורות חוץ מאחת, והיא יוצאת מכל השאר. למשל הפרשה לחופשה. בתחילת השנה החוב לעובדים על ימי חופשה היה <Money v={VACATION.opening} />. במשך השנה שולמו להם{" "}
            <Money v={VACATION.payments} />, ובסוף השנה החוב <Money v={VACATION.closing} />. מה ההוצאה של השנה?
          </P>
          <RollForward
            title="הפרשה לחופשה"
            pnTo="רווח והפסד"
            rows={[
              { label: "יתרת פתיחה", value: VACATION.opening, kind: "balance" },
              { label: "הוצאה, השורה החסרה", value: VACATION_EXPENSE, kind: "pn" },
              { label: "תשלומים", value: -VACATION.payments },
              { label: "יתרת סגירה", value: VACATION.closing, kind: "balance" },
            ]}
          />
          <P>
            ההיגיון: החוב עלה ב-<Money v={VACATION.closing - VACATION.opening} /> אף שיצאו <Money v={VACATION.payments} />. אז נוספו <Money v={VACATION_EXPENSE} />. בנוסחה ובאקסל:
          </P>
          <Work w={tool.expense(VACATION.opening, VACATION.payments, VACATION.closing)} />
          <P>
            בהמשך הקורס המעגלים יהיו ארוכים יותר, עם עוד שורות. אבל השיטה לא משתנה: מחשבים כל שורה שאפשר מהנתונים, והשורה שנשארה היא <strong>מה שמאזן את המעגל</strong>.
          </P>
        </Part>
        {inlineQuiz("emp-tool-roll", [
          {
            q: "פתיחה 4,000, תשלומים 9,000, סגירה 3,500. מה ההוצאה?",
            options: ["8,500", "9,500", "500", "16,500"],
            answer: 0,
            why: `${said(tool.expense(4_000, 9_000, 3_500))}\n9,500 מתקבל כשמחליפים בין הפתיחה לסגירה. 500 הוא רק השינוי ביתרה, בלי התשלומים. 16,500 הוא חיבור של כל המספרים.`,
          },
        ])}
        <Remember>
          <L>{TOOL.roll}</L>. כשחסרה שורה אחת, היא יוצאת מכל השאר.
        </Remember>
      </>
    ),
  },
  "emp-tool-practice": {
    lead: "ארבע שאלות על אותה חברה. כל אחת משתמשת בכלי אחר מהשיעור.",
    body: (
      <>
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <p className="text-[13px] font-bold text-muted">המקרה</p>
          <P>
            חברת ״אורן״ הבטיחה לעובד, יוסי, מענק של <Money v={CASE.grant} /> שישולם בעוד {CASE.years === 2 ? "שנתיים" : `${CASE.years} שנים`}. שיעור ההיוון {pct(CASE.rate)}. לחברה יש גם הפרשה לחופשה: בתחילת השנה
            היא הייתה <Money v={CASE.vacation.opening} />, ההוצאה של השנה <Money v={CASE.vacation.expense} />, ובסוף השנה <Money v={CASE.vacation.closing} />.
          </P>
        </div>
        <Part title="1. כמה רושמים היום על המענק ליוסי?">
          <Solve seek={<>ערך נוכחי של <Money v={CASE.grant} /> שישולמו בעוד {CASE.years} שנים.</>} task="מה החוב ליוסי בדוח של היום?">
            <P>
              <strong>איזה כלי?</strong> הסכום ישולם בעתיד, ואנחנו רוצים לדעת כמה הוא שווה היום, ולכן ערך נוכחי. FV הוא המענק, <Money v={CASE.grant} />. RATE הוא שיעור ההיוון, {pct(CASE.rate)}. YEAR הוא מספר השנים מהיום ועד
              התשלום, {CASE.years}. מחלקים ב-{1 + CASE.rate} פעם לכל שנה:
            </P>
            <Work w={tool.pv(CASE.grant, CASE.rate, CASE.years)} />
            <P>
              בדיקה בכיוון ההפוך, בערך עתידי: <L>{`${fmt(CASE_TODAY)} × (${1 + CASE.rate})^${CASE.years} ≈ ${fmt(CASE.grant)}`}</L> ₪. חזרנו בדיוק למענק.
            </P>
          </Solve>
        </Part>
        <Part title="2. בכמה גדל החוב ליוסי ברבעון הראשון?">
          <Solve seek={<>הריבית לשלושה חודשים, כי החברה מפרסמת דוח רבעוני ב-31.3. <L>YEAR = 3/12</L>, ריבית דריבית.</>} task={<>החוב היום <Money v={CASE_TODAY} />. בכמה הוא יגדל עד 31.3?</>}>
            <P>
              <strong>איזה כלי?</strong> צריך ריבית רק עד 31.3, ולכן ריבית לתקופה שאינה שנה. היתרה היא החוב שמצאנו בשאלה 1, <Money v={CASE_TODAY} />. התקופה היא שלושה חודשים מתוך 12, ולכן <L>YEAR = 3/12</L>. השאלה לא
              אמרה באיזו ריבית, ולכן ריבית דריבית. קודם השיעור לרבעון:
            </P>
            <Work w={tool.partRate(CASE.rate, 3)} />
            <P>ואז מכפילים בו את היתרה. אפשר גם בצעד אחד:</P>
            <Work w={tool.part(CASE_TODAY, CASE.rate, 3)} />
            <P>אם השאלה הייתה מבקשת ריבית פשוטה, מכפילים את השיעור השנתי ברבע שנה:</P>
            <Work w={tool.simpleOn(CASE_TODAY, CASE.rate, 3)} />
          </Solve>
        </Part>
        <Part title="3. מה החוב ליוסי בסוף השנה?">
          <Solve seek="יתרת הסגירה במעגל. נוספה ריבית של שנה, ולא שולם כלום." task="מה יתרת הסגירה של החוב ליוסי?">
            <P>
              <strong>איזה כלי?</strong> רוצים לדעת מה קרה לחוב במשך שנה, ולכן מעגל. הפתיחה היא החוב מתחילת השנה, <Money v={CASE_TODAY} />. במשך השנה נוספה ריבית של שנה שלמה:{" "}
              <L>{`${fmt(CASE_TODAY)} × ${pct(CASE.rate)} = ${fmt(CASE_INTEREST)}`}</L> ₪. ליוסי לא שולם כלום, ולכן אין שורת תשלומים. הסגירה היא הפתיחה ועוד הריבית:
            </P>
            <RollForward
              title="התחייבות למענק ליוסי"
              rows={[
                { label: "יתרת פתיחה", value: CASE_TODAY, kind: "balance" },
                { label: `ריבית ${pct(CASE.rate)}`, value: CASE_INTEREST, how: <L>{`${fmt(CASE_TODAY)} × ${pct(CASE.rate)}`}</L> },
                { label: "יתרת סגירה", value: CASE_TODAY + CASE_INTEREST, kind: "balance" },
              ]}
            />
            <P>ואותו מספר יוצא בערך נוכחי, כשנשארה שנה אחת. המעגל והערך הנוכחי מסכימים:</P>
            <Work w={tool.pv(CASE.grant, CASE.rate, CASE.years - 1)} />
          </Solve>
        </Part>
        <Part title="4. כמה שילמה החברה לעובדים על חופשה?">
          <Solve seek="התשלומים, השורה היחידה שחסרה במעגל של ההפרשה לחופשה." task="כמה שולם לעובדים השנה?">
            <P>
              <strong>איזה כלי?</strong> ידועות שלוש שורות במעגל, הפתיחה, ההוצאה והסגירה, וחסרה רק אחת. לכן מחלצים אותה מהמעגל. מתחילים מ-<Money v={CASE.vacation.opening} /> ומוסיפים את ההוצאה,{" "}
              <Money v={CASE.vacation.expense} />. יוצא <Money v={CASE.vacation.opening + CASE.vacation.expense} />. בסוף השנה נשארו רק <Money v={CASE.vacation.closing} />, אז כל השאר יצא בתשלומים:
            </P>
            <RollForward
              title="הפרשה לחופשה"
              pnTo="השורה החסרה"
              rows={[
                { label: "יתרת פתיחה", value: CASE.vacation.opening, kind: "balance" },
                { label: "הוצאה", value: CASE.vacation.expense },
                { label: "תשלומים", value: -(CASE.vacation.opening + CASE.vacation.expense - CASE.vacation.closing), kind: "pn" },
                { label: "יתרת סגירה", value: CASE.vacation.closing, kind: "balance" },
              ]}
            />
            <P>ואותו חישוב בנוסחה ובאקסל:</P>
            <Work w={tool.paymentsST(CASE.vacation.opening, CASE.vacation.expense, CASE.vacation.closing)} />
          </Solve>
        </Part>
        <Remember>ערך נוכחי למה שישולם בעתיד, שיעור לתקופה כשקורה משהו באמצע השנה, ומעגל כדי לעקוב אחרי היתרה ולמצוא את מה שחסר.</Remember>
      </>
    ),
  },
};
