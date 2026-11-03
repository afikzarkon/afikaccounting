import { Briefcase, CalendarClock, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { partRate, pv } from "@/lib/learn/ias19";
import { FORMULA, said, tool, TOOL } from "@/lib/study/ias19/formulas";
import { HOOK, SOLVED, TOGETHER } from "@/lib/study/ias19/lessons/toolkit";
import { ltrQuiz } from "@/lib/study/ias19/ltr";
import { FormulaFill, Ltr, Work } from "./ias19-formula";
import { MapBranch, RollForward, T19 } from "./ias19-ui";
import { BankStatement, PvSlide, SplitBar, Timeline } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money } from "./ui";

/**
 * The employee-benefits course, lesson 2: the toolkit — present value,
 * interest for part of a year, and the roll-forward. Each tool comes with why
 * the course needs it, and every result is worked both ways: by the formula of
 * the course's main page, and in Excel. Nothing opens step by step.
 */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={ltrQuiz(items)} />;
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

/** A question set out the same way everywhere in the lesson: what we look for, the task, a moment to try, and the full solution below it. */
function Solve({ seek, task, children }: { seek: ReactNode; task: ReactNode; children: ReactNode }) {
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
        {task} <span className="text-muted">נסו לפתור לבד, ורק אז השוו לפתרון.</span>
      </p>
      <div className="space-y-1.5 border-t border-line pt-2.5">
        <p className="text-[12.5px] font-bold text-muted">הפתרון, בשתי דרכים</p>
        {children}
      </div>
    </div>
  );
}

export const IAS19_TOOLS_SCREENS: Record<string, ScreenContent> = {
  "emp-tool-hook": {
    lead: "החוב לעובדים משולם בעתיד וגדל במשך השנה. כדי למדוד אותו צריך שלושה כלים, וזה השיעור.",
    body: (
      <>
        <Story icon={<Briefcase />} title="הבטחה לעובדת, שתשולם בעוד ארבע שנים">
          <p>
            חברה מבטיחה לעובדת מענק של <Money v={HOOK.amount} /> ביום הפרישה, בעוד {HOOK.years} שנים. בסוף השנה החברה צריכה לרשום בדוחות כמה היא חייבת לעובדת.
          </p>
          <p>
            לרשום <Money v={HOOK.amount} />? לא. שקל שמקבלים היום שווה יותר משקל שמקבלים בעוד ארבע שנים: את השקל של היום אפשר להפקיד ולקבל עליו ריבית. אם תציעו לכם{" "}
            <Money v={HOOK.amount} /> היום או בעוד {HOOK.years} שנים, תבחרו היום.
          </p>
          <Timeline
            label={`${HOOK.amount} שישולמו בעוד ${HOOK.years} שנים: כמה הם שווים היום, ביום הדוח?`}
            from={0}
            to={HOOK.years}
            ticks={[
              { at: 0, label: "היום: הדוח" },
              { at: HOOK.years, label: `בעוד ${HOOK.years} שנים: התשלום` },
            ]}
            spans={[{ from: 0, to: HOOK.years, label: "מחכים", tone: 4 }]}
            marks={[
              { at: 0, label: "? שווה היום", tone: "accent" },
              { at: HOOK.years, label: `${HOOK.amount.toLocaleString("he-IL")} ₪`, tone: 1 },
            ]}
          />
          <p>
            לכן בדוחות רושמים את מה שההבטחה <strong>שווה היום</strong>. את זה מחשב הכלי הראשון, <strong>ערך נוכחי</strong>. כמעט כל חוב בקורס הזה משולם בעוד שנים, ולכן נשתמש בו בכל שיעור.
          </p>
        </Story>
        <Story icon={<CalendarClock />} title="החוב גדל במשך השנה, ודברים קורים באמצע">
          <p>
            החוב לעובדים מתנהג כמו פיקדון בבנק: עם הזמן נוספת עליו ריבית, כי מועד התשלום מתקרב. <L>{FORMULA.growth}</L>.
          </p>
          <p>
            על שנה שלמה זה פשוט. אבל בשאלות קורים דברים באמצע השנה: משלמים לעובד ב-1 באפריל, או משנים את התוכנית ב-30 ביוני. אז צריך לדעת בכמה גדל החוב <strong>רק עד אותו יום</strong>. את זה מחשב הכלי השני, <strong>ריבית על חלק משנה</strong>.
          </p>
        </Story>
        <P>
          והכלי השלישי, <strong>המעגל</strong>, מסדר את כל מה שקרה לחוב בשנה, מהפתיחה עד הסגירה, ומוצא את המספר שחסר.
        </P>
        <MapBranch lesson="ias19-toolkit">ענף ״ארגז הכלים״: שלושה כלים שחוזרים בכל שאלה. ערך נוכחי, ריבית על חלק משנה, ומעגל.</MapBranch>
      </>
    ),
  },
  "emp-tool-pv": {
    lead: "ערך נוכחי מחזיר סכום מהעתיד להיום: מחלקים ב-(1 + RATE), פעם לכל שנה עד התשלום.",
    body: (
      <>
        <P>
          <T19 he="ערך נוכחי" /> הוא כמה שווה היום סכום שישולם בעתיד. זה ההפך מחיסכון בבנק: בבנק כל שנה מכפילים ב-(1 + RATE). כאן הולכים אחורה, וכל שנה מחלקים.
        </P>
        <PvSlide fv={HOOK.amount} i={HOOK.rate} n={HOOK.years} title="המענק מהסיפור, שנה אחר שנה, חוזר להיום" />
        <FormulaFill
          label={`ערך נוכחי: ${HOOK.amount} חלקי ${1 + HOOK.rate} בחזקת ${HOOK.years}`}
          lhs="PV"
          terms={{
            fv: { c: 0, sym: "FV", value: <Money v={HOOK.amount} plain />, from: <>המענק: <Money v={HOOK.amount} /></> },
            i: { c: 5, sym: "RATE", value: pct(HOOK.rate), from: <>ריבית {pct(HOOK.rate)}</> },
            n: { c: 4, sym: "YEAR", value: HOOK.years, from: <>בעוד {HOOK.years} שנים</> },
          }}
          top={[{ t: "fv" }]}
          bottom={["(1 + ", { t: "i" }, ")", { sup: "n" }]}
          result={<Money v={Math.round(pv(HOOK.amount, HOOK.rate, HOOK.years))} />}
          stepwise={false}
        />
        <P>אותו חישוב בשתי הדרכים, כמו בעמוד הראשי של הקורס:</P>
        <Work w={tool.pv(HOOK.amount, HOOK.rate, HOOK.years)} />
        <Remember>
          באקסל: rate היא הריבית, nper מספר השנים, pmt תשלומים בדרך (אצלנו 0), ו-fv הסכום העתידי, עם מינוס. בלי המינוס אקסל מחזיר מספר שלילי. ו-YEAR הוא תמיד מספר השנים מהיום ועד התשלום: נשארה חצי שנה? <L>YEAR = 0.5</L>.
        </Remember>
      </>
    ),
    check: quiz("emp-tool-pv", [
      { q: "כמה שווים היום 5,000 ₪ שישולמו בעוד שנתיים, בריבית 10%?", options: ["4,132 ₪", "4,000 ₪", "4,545 ₪", "6,050 ₪"], answer: 0, why: `${said(tool.pv(5_000, 0.1, 2))}\n4,545 הוא שנה אחת בלבד; 6,050 הוא כפל במקום חילוק.` },
      { q: "ככל שהתשלום רחוק יותר (YEAR גדול), הערך הנוכחי...", options: ["קטן", "גדל", "לא משתנה", "תלוי בסכום"], answer: 0, why: `מחלקים ביותר פעמים ב-(1 + RATE):\n${TOOL.pv}` },
    ]),
  },
  "emp-tool-part": {
    lead: "ריבית על חלק משנה היא הגידול ביתרה בתקופה הזו. כדי למצוא אותה, קודם הופכים את השיעור השנתי לשיעור של התקופה.",
    body: (
      <>
        <P>
          בתחילת התקופה יש יתרה, ובסופה היא גדולה יותר. הגידול הזה הוא הריבית:
        </P>
        <F>{FORMULA.growth}</F>
        <P>
          על שנה שלמה מכפילים את היתרה בשיעור השנתי. אבל השאלה שואלת לפעמים על רבעון, על כמה חודשים, או על שנתיים. אז צריך קודם את <strong>שיעור הריבית לתקופה</strong>, ויש לזה שתי דרכים.
        </P>
        <Part title="ריבית דריבית: הופכים שיעור שנתי לשיעור של תקופה אחרת">
          <F>{TOOL.partRate}</F>
          <P>
            YEAR הוא אורך התקופה בשנים: רבעון הוא <L>3/12 = 1/4</L>, חודש הוא <L>1/12</L>, ושנתיים הן <L>2</L> (חזקה גדולה מ-1). שימו לב לסוגריים: קודם <L>1 + RATE</L>, אחר כך החזקה, ורק בסוף מחסירים 1.
          </P>
          <p className="text-[13px] font-bold text-muted">רבעון, בריבית שנתית 8%:</p>
          <Work w={tool.partRate(0.08, 3)} />
          <p className="text-[13px] font-bold text-muted">חודש אחד:</p>
          <Work w={tool.partRate(0.08, 1)} />
          <p className="text-[13px] font-bold text-muted">ושנתיים, חזקה גדולה מ-1:</p>
          <Work w={tool.partRate(0.08, 24)} />
          <SplitBar
            title="רבעון אחד מתוך שנה, בריבית שנתית 8%"
            periods={[
              { months: 3, label: "הרבעון", rate: `${pct(partRate(0.08, 3), 4)} לרבעון`, tone: 5 },
              { months: 9, label: "שאר השנה", tone: 0 },
            ]}
            cuts={["1.1", "1.4", "31.12"]}
          />
          <P>ואת הריבית עצמה, בכמה גדלה יתרה של 100,000 ₪ ברבעון, אפשר לחשב בצעד אחד:</P>
          <Work w={tool.part(100_000, 0.08, 3)} />
          <P>
            למה שיעור הרבעון קטן מרבע מהשיעור השנתי? בריבית דריבית, הריבית של כל רבעון מצטרפת ליתרה ומרוויחה ריבית ברבעונים הבאים. ארבעה רבעונים כאלה, יחד, צריכים לתת בדיוק 8%.
          </P>
        </Part>
        <Part title="ריבית פשוטה: דרך נוספת, כשהשאלה מבקשת אותה">
          <P>בריבית פשוטה לא מצרפים ריבית לריבית: מכפילים את השיעור השנתי בחלק מהשנה. חלק מהשאלות מבקשות אותה במפורש, ואז זו הדרך.</P>
          <F>{TOOL.simple}</F>
          <Work w={tool.simple(0.08, 3)} />
          <F>{TOOL.simpleOn}</F>
          <Work w={tool.simpleOn(100_000, 0.08, 3)} />
          <P>כשהשאלה לא אומרת באיזו ריבית, משתמשים בריבית דריבית.</P>
        </Part>
        <Part title="ותשלום באמצע השנה?">
          <P>מיום התשלום החוב קטן, ולכן אין עליו ריבית עד סוף התקופה. מחשבים ריבית על כל היתרה, ומורידים את הריבית על התשלום מיום ששולם:</P>
          <F>{TOOL.partPaid}</F>
        </Part>
      </>
    ),
    check: quiz("emp-tool-part", [
      {
        q: "ריבית שנתית 6%. מה השיעור לחצי שנה, בריבית דריבית?",
        options: ["2.956%", "3%", "6%", "1.5%"],
        answer: 0,
        why: `${said(tool.partRate(0.06, 6, 3))}\n3% הוא התשובה בריבית פשוטה:\n${said(tool.simple(0.06, 6))}`,
      },
      {
        q: "יתרה 100,000 ₪ ב-1.1, ובאמצע השנה שולמו 20,000 ₪. על מה מחשבים ריבית?",
        options: ["על 100,000 לשנה, פחות ריבית על 20,000 לחצי שנה", "על 80,000 לשנה שלמה", "על 100,000 לשנה, בלי קשר לתשלום", "על 120,000"],
        answer: 0,
        why: `עד התשלום החוב היה 100,000; ממנו והלאה, 80,000.\n${TOOL.partPaid}`,
      },
    ]),
  },
  "emp-tool-roll": {
    lead: "מעגל: פתיחה, ועוד מה שנוסף, פחות מה ששולם, שווה סגירה. כשחסרה שורה אחת, כל השאר מגלות אותה.",
    body: (
      <>
        <P>
          <T19 he="מעגל" /> מספר מה קרה ליתרה בשנה, בדיוק כמו דף חשבון בנק:
        </P>
        <F>{FORMULA.roll}</F>
        <P>
          המעגל עובד בשני כיוונים. כשכל השורות ידועות, הוא נותן את הסגירה. וכשחסרה <strong>שורה אחת</strong>, מחשבים את כל השאר מהנתונים, והשורה החסרה היא מה שמאזן את המעגל.
        </P>
        <P>
          בהטבה מוגדרת (משיעור 7) השורה החסרה היא תמיד ה-<strong>P.N.</strong>: את הפתיחה, הריבית, השירות, התשלומים והסגירה מחשבים מהנתונים, וה-P.N. הוא מה שנשאר כדי שהמעגל יתאזן.
        </P>
        <Part title="דוגמה: כשחסרה ההוצאה">
          <P>בהפרשה לחופשה (שיעור 3) אין P.N. ידועות הפתיחה, הסגירה והתשלומים, ולכן ההוצאה היא השורה שחסרה:</P>
          <BankStatement
            opening={SOLVED.roll.opening}
            moves={[{ label: "תשלומים שיצאו", v: -SOLVED.roll.payments }]}
            closing={SOLVED.roll.closing}
            unexplained="ההוצאה: מה שחסר כדי שיתאזן"
          />
          <Work w={tool.expense(SOLVED.roll.opening, SOLVED.roll.payments, SOLVED.roll.closing)} />
        </Part>
        <Part title="דוגמה: כשחסר ה-P.N.">
          <P>פתיחה 2,000, ריבית 120, תשלום 500, וסגירה 1,900. כל השורות ידועות חוץ מה-P.N.:</P>
          <Work w={tool.pnInterest({ opening: 2_000, interest: 120, payments: 500, closing: 1_900 })} />
          <P>ה-P.N. חיובי: החוב גדל יותר ממה שהשורות האחרות מסבירות, ולכן זה הפסד.</P>
        </Part>
      </>
    ),
    check: quiz("emp-tool-roll", [
      { q: "פתיחה 4,000, הוצאה ?, תשלומים 9,000, סגירה 3,500. מה ההוצאה?", options: ["8,500", "9,500", "500", "16,500"], answer: 0, why: said(tool.expense(4_000, 9_000, 3_500)) },
      {
        q: "במעגל של הטבה מוגדרת ידועות הפתיחה, הריבית, עלות השירות, התשלומים והסגירה. מה יוצא מהן?",
        options: ["ה-P.N., השורה שמאזנת את המעגל", "שום דבר, המעגל כבר מלא", "שיעור הריבית", "עלות השירות של השנה הבאה"],
        answer: 0,
        why: `השורה היחידה שחסרה היא ה-P.N., והיא יוצאת מכל השאר:\n${FORMULA.roll}`,
      },
    ]),
  },
  "emp-tool-solved": {
    lead: "שלוש שאלות מאותה חברה, כל אחת עם הכלי שלה: מה מחפשים, ואיך מוצאים, בנוסחה ובאקסל.",
    body: (
      <>
        <P>
          חברת שירותים סוגרת את השנה, ורואת החשבון צריכה שלושה מספרים לדוחות. לכל מספר שאלה אחרת, וכלי אחר.
        </P>
        <Solve
          seek="כמה שווה היום מענק שהובטח לעובד ויגיע רק בעתיד. זה הסכום שנרשם בדוחות, לא הסכום המלא."
          task={
            <>
              עובד צבר מענק של <Money v={SOLVED.pv.fv} />, שישולם בעוד {SOLVED.pv.years} שנים. הריבית {pct(SOLVED.pv.rate)}. כמה הוא שווה היום?
            </>
          }
        >
          <P>הכלי: ערך נוכחי. FV הוא המענק, RATE הריבית, ו-YEAR השנים עד התשלום.</P>
          <Work w={tool.pv(SOLVED.pv.fv, SOLVED.pv.rate, SOLVED.pv.years)} />
          <PvSlide fv={SOLVED.pv.fv} i={SOLVED.pv.rate} n={SOLVED.pv.years} />
        </Solve>
        <Solve
          seek="בכמה גדלה יתרה בחלק מהשנה. הגידול הזה הוא הריבית של התקופה."
          task={
            <>
              יתרה של <Money v={SOLVED.part.balance} /> ב-1.1, ריבית שנתית {pct(SOLVED.part.rate)}. בכמה היא גדלה עד 31.8, אחרי {SOLVED.part.months} חודשים, בריבית דריבית?
            </>
          }
        >
          <P>
            הכלי: ריבית על חלק משנה. התקופה היא {SOLVED.part.months} חודשים, ולכן <L>{`YEAR = ${SOLVED.part.months}/12`}</L>.
          </P>
          <Work w={tool.part(SOLVED.part.balance, SOLVED.part.rate, SOLVED.part.months)} />
          <P>ואם השאלה הייתה מבקשת ריבית פשוטה:</P>
          <Work w={tool.simpleOn(SOLVED.part.balance, SOLVED.part.rate, SOLVED.part.months)} />
        </Solve>
        <Solve
          seek="ההוצאה של השנה על ימי חופשה. היא לא נתונה, אבל כל שאר השורות במעגל ידועות."
          task={
            <>
              הפרשה לחופשה: יתרת פתיחה <Money v={SOLVED.roll.opening} />, שולמו לעובדים <Money v={SOLVED.roll.payments} />, יתרת סגירה <Money v={SOLVED.roll.closing} />. מה ההוצאה של השנה?
            </>
          }
        >
          <P>הכלי: המעגל. ההוצאה היא השורה היחידה שחסרה, ולכן היא מה שמאזן אותו.</P>
          <Work w={tool.expense(SOLVED.roll.opening, SOLVED.roll.payments, SOLVED.roll.closing)} />
          <RollForward
            pnTo="רווח והפסד"
            title="הפרשה לחופשה"
            rows={[
              { label: "יתרת פתיחה", value: SOLVED.roll.opening, kind: "balance" },
              { label: "תשלומים", value: -SOLVED.roll.payments },
              { label: "הוצאה (המספר המאזן)", value: SOLVED.roll.closing - SOLVED.roll.opening + SOLVED.roll.payments, kind: "pn" },
              { label: "יתרת סגירה", value: SOLVED.roll.closing, kind: "balance" },
            ]}
          />
        </Solve>
      </>
    ),
  },
  "emp-tool-together": {
    lead: "אותם שלושה כלים, במספרים חדשים. נסו כל שאלה לבד, ורק אז השוו לפתרון.",
    body: (
      <>
        <Part title="א. ערך נוכחי">
          <Solve
            seek="כמה שווה היום סכום שישולם בעוד כמה שנים."
            task={
              <>
                <Money v={TOGETHER.pv.fv} /> ישולמו בעוד {TOGETHER.pv.years} שנים, בריבית {pct(TOGETHER.pv.rate)}. כמה הם שווים היום?
              </>
            }
          >
            <P>מחזירים מהעתיד להיום, ולכן מחלקים, פעם לכל שנה:</P>
            <Work w={tool.pv(TOGETHER.pv.fv, TOGETHER.pv.rate, TOGETHER.pv.years)} />
          </Solve>
        </Part>
        <Part title="ב. ריבית עם תשלום באמצע השנה">
          <SplitBar
            title="השנה, חתוכה ביום התשלום"
            periods={[
              { months: TOGETHER.part.paidMonth, label: `על ${TOGETHER.part.balance.toLocaleString("he-IL")}`, rate: pct(TOGETHER.part.rate), tone: 1 },
              { months: 12 - TOGETHER.part.paidMonth, label: `על ${(TOGETHER.part.balance - TOGETHER.part.paid).toLocaleString("he-IL")}: התשלום כבר יצא`, rate: pct(TOGETHER.part.rate), tone: 4 },
            ]}
            cuts={["1.1", `1.5: שולמו ${TOGETHER.part.paid.toLocaleString("he-IL")}`, "31.12"]}
          />
          <Solve
            seek="בכמה גדל החוב השנה, כשחלק ממנו שולם באמצע."
            task={
              <>
                יתרה של <Money v={TOGETHER.part.balance} /> ב-1.1, ריבית {pct(TOGETHER.part.rate)}. ב-1.5 שולמו <Money v={TOGETHER.part.paid} />. מה הריבית של השנה?
              </>
            }
          >
            <P>
              על כל היתרה, שנה שלמה; ומורידים את הריבית על התשלום מ-1.5 ועד סוף השנה, {12 - TOGETHER.part.paidMonth} חודשים:
            </P>
            <Work w={tool.partPaid(TOGETHER.part.balance, TOGETHER.part.rate, TOGETHER.part.paid, 12 - TOGETHER.part.paidMonth)} />
          </Solve>
        </Part>
        <Part title="ג. מעגל">
          <Solve
            seek="השורה שחסרה במעגל, כשכל השאר ידועות."
            task={
              <>
                פתיחה <Money v={TOGETHER.roll.opening} />, תשלומים <Money v={TOGETHER.roll.payments} />, סגירה <Money v={TOGETHER.roll.closing} />. מה ההוצאה?
              </>
            }
          >
            <P>ההוצאה היא השורה היחידה שחסרה, ולכן היא יוצאת מהמעגל:</P>
            <Work w={tool.expense(TOGETHER.roll.opening, TOGETHER.roll.payments, TOGETHER.roll.closing)} />
          </Solve>
        </Part>
      </>
    ),
  },
};
