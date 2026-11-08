import { Car, Handshake, Landmark, ListChecks, PiggyBank, Search, Truck, Wrench } from "lucide-react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import * as L from "@/lib/study/ifrs16/lessons/lessor";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { Fork, TwoPanel, WrongRight } from "./ias19-visuals";
import { DecisionWalk, LeaseDrill } from "./ifrs16-interactive";
import { FullSolution, P, quiz, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 6: the lessor. Every figure comes from
 * lib/study/ifrs16/lessons/lessor.ts, in whole shekels, and every table adds up.
 */

const M = ({ v, plain }: { v: number; plain?: boolean }) => <Money v={Math.round(v)} plain={plain} />;
const pct = (r: number, d = 2) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");

/** A net investment's movement, a column a year. */
function Invest({ rows }: { rows: L.InvestRow[] }) {
  const head = rows.map((y) => `שנה ${y.year}`);
  return (
    <Tbl
      dense
      head={["השקעה נטו", ...head]}
      rows={[
        ["יתרה ב-1.1", ...rows.map((y) => y.opening)],
        ["הכנסות מימון", ...rows.map((y) => y.income)],
        ["תקבול", ...rows.map((y) => -y.receipt)],
      ]}
      foot={["יתרה ב-31.12", ...rows.map((y) => y.closing)]}
    />
  );
}

/** Where the balance sits on 31.12: current and non-current. */
function Split({ rows }: { rows: L.InvestRow[] }) {
  return (
    <Tbl
      dense
      head={["מצב כספי, 31.12", ...rows.map((y) => `שנה ${y.year}`)]}
      rows={[
        ["השקעה נטו, שוטפת", ...rows.map((y) => y.current)],
        ["השקעה נטו, לא שוטפת", ...rows.map((y) => y.nonCurrent)],
      ]}
    />
  );
}

export const IFRS16_LESSOR_SCREENS: Record<string, ScreenContent> = {
  "ls-lsr-hook": {
    lead: "אותו חוזה, מהצד השני. החוכר עובד במודל אחד. המחכיר צריך לשאול קודם: האם בפועל מכרתי?",
    body: (
      <>
        <Story icon={<Handshake />} title="שני בעלי משאיות">
          <p>בעל משאית אחד מחכיר אותה לשנתיים, ומקבל אותה בחזרה. הוא נשאר בעל הנכס, והוא זה שסופג אם ערכה יורד.</p>
          <p>השני מחכיר את המשאית לכל חייה, ובסוף היא של החוכר. בפועל הוא מכר אותה, ומימן את הקונה.</p>
        </Story>
        <TwoPanel
          label="שני מודלים. תפעולית: הנכס נשאר בספרים, עם הכנסה בקו ישר ופחת. מימונית: הנכס יוצא, ובמקומו השקעה נטו עם הכנסות מימון"
          panels={[
            { title: "תפעולית", icon: <Truck />, steps: ["הנכס נשאר בספרים", "הכנסה בקו ישר, ופחת"], verdict: "כמו שכירות", tone: 1 },
            { title: "מימונית", icon: <Landmark />, steps: ["הנכס יוצא מהספרים", "השקעה נטו, והכנסות מימון"], verdict: "כמו מכירה ומימון", tone: 3 },
          ]}
        />
        <Rule>רק המחכיר מסווג (סעיף 61). הקריטריון: מי נושא למעשה בכל הסיכונים וההטבות של הנכס (סעיף 62).</Rule>
      </>
    ),
  },
  "ls-lsr-class": {
    lead: "הסיווג לפי מהות. יש רשימת סימנים, וכל אחד מהם בדרך כלל מספיק. ענו על השאלות ותראו.",
    body: (
      <>
        <DecisionWalk nodes={L.CLASS_WALK} start={L.CLASS_WALK_START} label="מסווגים חכירה" again="מסווגים חכירה אחרת" />
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-lsr-class" items={L.CLASS_ITEMS} options={L.CLASS_OPTIONS} />
        </TaskFrame>
        <WrongRight
          label="טעות: 75% ו-90% הם כללים בתקן. נכון: הם כללי אצבע, והתקן מדבר על חלק עיקרי ועל למעשה כל השווי"
          wrong={<p>״72% מהחיים? התקן אומר שזו תפעולית.״</p>}
          right={<p>בתקן כתוב ״החלק העיקרי״ ו״למעשה כל השווי ההוגן״. 75% ו-90% הם נוהג מקובל, שעוזר בשאלות כשאין נתון נוסף.</p>}
        />
        <Remember>הסימנים לא תמיד חד משמעיים. אם ברור ממאפיינים אחרים שהסיכונים לא עברו, החכירה תפעולית (סעיף 65).</Remember>
      </>
    ),
  },
  "ls-lsr-when": {
    lead: "מסווגים פעם אחת, במועד ההתקשרות. אחר כך משנים רק אם יש תיקון בחוזה.",
    body: (
      <>
        <Tbl
          head={["מה קרה", "מסווגים מחדש?"]}
          rows={[
            ["תיקון חכירה", "כן (סעיף 66). בשיעור הבא"],
            ["שינוי באומדן החיים הכלכליים או השייר", "לא"],
            ["שינוי בנסיבות, כמו כשל של החוכר", "לא"],
          ]}
        />
        <Rule>שימו לב להבדל: מועד ההתקשרות קובע את הסיווג. מועד התחילה הוא היום שבו מכירים בפועל.</Rule>
      </>
    ),
    check: quiz("ls-lsr-when", [
      {
        q: "חכירה סווגה כמימונית. אחר כך החוכר נקלע לקשיים. מה עושים?",
        options: ["לא מסווגים מחדש. בוחנים ירידת ערך לפי IFRS 9", "מסווגים כתפעולית", "מחזירים את הנכס לספרים", "מבטלים את הרווח"],
        answer: 0,
        why: "סעיף 66 וסעיף 77.",
      },
    ]),
  },
  "ls-lsr-op": {
    lead: "בתפעולית הנכס נשאר אצל המחכיר. ההכנסה בדרך כלל בקו ישר, גם כשהתשלומים עולים, וההפרש נרשם כנכס.",
    body: (
      <>
        <Story icon={<Wrench />} title="מכונה לשלוש שנים">
          <p>
            מכונה שנקנתה לפני {L.OP.age} שנים ב-<M v={L.OP.cost} />, {L.OP.life} שנות חיים, פחת בקו ישר. עכשיו היא מוחכרת ל-{L.OP.years} שנים: <M v={L.OP.rents[0]} />, <M v={L.OP.rents[1]} /> ו-<M v={L.OP.rents[2]} />, בסוף כל שנה. שכר עורך הדין <M v={L.OP.lawyer} />. שוויה ההוגן גבוה בהרבה מהערך הנוכחי של התשלומים.
          </p>
        </Story>
        <P>
          סיווג: 3 מתוך 10 השנים שנשארו, ואין אף סימן אחר. <T16 he="תפעולית" />.
        </P>
        <Tbl
          dense
          head={["", "שנה 1", "שנה 2", "שנה 3"]}
          rows={[
            ["תקבול", ...L.OP_ROWS.map((y) => y.rent)],
            ["הכנסה: סכום ÷ 3", ...L.OP_ROWS.map((y) => y.income)],
            ["פחת ועלות ישירה", ...L.OP_ROWS.map((y) => -y.expense)],
            ["הכנסות לקבל, 31.12", ...L.OP_ROWS.map((y) => y.accrued)],
            ["המכונה, נטו, 31.12", ...L.OP_ROWS.map((y) => y.asset)],
          ]}
        />
        <P>
          הפחת: <Ltr>{`${n(L.OP.cost)} ÷ ${L.OP.life} + ${n(L.OP.lawyer)} ÷ ${L.OP.years} = ${n(L.OP_EXPENSE)}`}</Ltr>. העלות הישירה נוספת לערך בספרים, ונפרסת על פני החכירה (סעיף 83).
        </P>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "מזומן", dr: L.OP.rents[0] },
            { account: "הכנסות לקבל", dr: L.OP_ROWS[0].accrued },
            { account: "הכנסות מהשכרה", cr: L.OP_INCOME },
          ]}
        />
        <Part title="עוד ארבעה כללים">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>בסיס שיטתי אחר במקום קו ישר, אם הוא מייצג טוב יותר את התמעטות ההטבה מהנכס (סעיף 81).</li>
            <li>בלי רווח ממכירה, גם אצל סוחר (סעיף 86).</li>
            <li>הנכס מוצג לפי מהותו, למשל רכוש קבוע (סעיף 88).</li>
            <li>פחת וירידת ערך, לפי המדיניות הרגילה ו-IAS 36 (סעיפים 84, 85).</li>
          </ul>
        </Part>
      </>
    ),
    check: quiz("ls-lsr-op", [
      {
        q: "חכירה תפעולית: 10,000 בשנה הראשונה, 20,000 בשנייה. מה ההכנסה בשנה הראשונה?",
        options: ["15,000 ש״ח", "10,000 ש״ח", "20,000 ש״ח", "30,000 ש״ח"],
        answer: 0,
        why: "(10,000 + 20,000) ÷ 2 = 15,000.",
      },
    ]),
  },
  "ls-lsr-nondealer": {
    lead: "במימונית, מי שאינו סוחר מחליף נכס בחוב של החוכר. הרווח שלו מגיע בעיקר מריבית.",
    body: (
      <>
        <Part title="השקעה נטו">
          <p className="text-[15.5px] font-semibold">
            שווי הוגן + עלויות ישירות = השקעה נטו
          </p>
          <p className="mt-1.5 text-[15px]">זו ההגדרה של הריבית הגלומה מהשיעור השלישי, מהצד של המחכיר. לכן העלויות נכנסות מאליהן, ולא נוספות בנפרד (סעיף 69).</p>
        </Part>
        <Story icon={<Truck />} title="המשאית, אצל חברת מימון">
          <p>
            הבעלות עוברת בסוף, ולכן מימונית. <M v={L.TRUCK.payment} /> בסוף כל שנה, {L.TRUCK.years} שנים. שווי הוגן <M v={L.TRUCK.fairValue} />, ועלויות ישירות <M v={L.TRUCK.costs} />.
          </p>
          <p>
            הריבית: <Ltr>{`=RATE(3;40000;-${L.ND_START}) → ${pct(L.ND_RATE)}`}</Ltr>
          </p>
        </Story>
        <JournalEntry
          title="מועד התחילה, כשהמשאית נקנתה בשווי הוגן"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.ND_START },
            { account: "כלי רכב", cr: L.TRUCK.fairValue },
            { account: "מזומן", cr: L.TRUCK.costs },
          ]}
        />
        <Invest rows={L.ND_ROWS} />
        <Split rows={L.ND_ROWS} />
        <P>הכנסות מימון על יתרה יורדת, בשיעור קבוע (סעיף 75). הלא שוטף הוא היתרה של סוף השנה הבאה, בדיוק כמו אצל החוכר.</P>
        <Fork
          label="אם הנכס היה רכוש קבוע, עם ערך בספרים שונה מהשווי ההוגן, נוצר רווח הון ביום הראשון"
          question={`ואם המשאית הייתה רכוש קבוע, בערך של ${n(L.TRUCK.bookValue)}?`}
          branches={[
            { when: "ההשקעה נטו", then: "לא משתנה" },
            { when: "יום ראשון", then: `רווח הון של ${n(L.ND_GAIN)}` },
          ]}
        />
      </>
    ),
    check: quiz("ls-lsr-nondealer", [
      {
        q: "שווי הוגן 60,000, עלויות ישירות 2,000. ערך בספרים 50,000. מהו רווח ההון?",
        options: ["10,000 ש״ח", "12,000 ש״ח", "8,000 ש״ח", "אפס"],
        answer: 0,
        why: "60,000 − 50,000 = 10,000. העלויות ישירות נכנסות להשקעה נטו.",
      },
    ]),
  },
  "ls-lsr-dealer": {
    lead: "יצרן או סוחר מרוויח פעמיים: קודם רווח מכירה, כמו מכירה רגילה, ואחר כך ריבית.",
    body: (
      <>
        <Tbl
          head={["שורה", "סכום", "סעיף"]}
          rows={[
            ["הכנסות ממכירות", "הנמוך מבין שווי הוגן, וערך נוכחי בריבית שוק", "71(א)"],
            ["עלות המכר", "עלות, פחות ערך נוכחי של שייר לא מובטח", "71(ב)"],
            ["עלויות השגת החכירה", "הוצאה מיידית", "74"],
          ]}
        />
        <P>
          עלויות של סוחר לא נכללות בריבית הגלומה, ולכן הריבית גבוהה יותר: <Ltr>{`=RATE(3;40000;-100000) → ${pct(L.D_RATE)}`}</Ltr>.
        </P>
        <Story icon={<Truck />} title="אותה משאית, אצל סוחר">
          <p>
            עלות <M v={L.TRUCK.dealerCost} />, שווי הוגן <M v={L.TRUCK.fairValue} />, ועלויות השגה <M v={L.TRUCK.costs} />.
          </p>
        </Story>
        <JournalEntry
          title="מועד התחילה"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.TRUCK.fairValue },
            { account: "עלות המכר", dr: L.TRUCK.dealerCost },
            { account: "הוצאות השגת חכירה", dr: L.TRUCK.costs },
            { account: "מכירות", cr: L.TRUCK.fairValue },
            { account: "מלאי", cr: L.TRUCK.dealerCost },
            { account: "מזומן", cr: L.TRUCK.costs },
          ]}
        />
        <Invest rows={L.D_ROWS} />
        <Tbl
          dense
          head={["רווח או הפסד", "שנה 1", "שנה 2", "שנה 3"]}
          rows={[
            ["מכירות", L.TRUCK.fairValue, 0, 0],
            ["עלות המכר", -L.TRUCK.dealerCost, 0, 0],
            ["הוצאות השגה", -L.TRUCK.costs, 0, 0],
            ["הכנסות מימון", ...L.D_ROWS.map((y) => y.income)],
          ]}
        />
        <Remember>הסיבה: סוחר מציע ללקוח לבחור בין קנייה לחכירה, ולכן יום החכירה הוא יום מכירה (סעיף 72).</Remember>
      </>
    ),
  },
  "ls-lsr-low": {
    lead: "סוחר שמפרסם ריבית נמוכה מנפח את רווח המכירה. לכן מהוונים בריבית השוק, ולא בריבית שפרסם.",
    body: (
      <>
        <Story icon={<Truck />} title="״ריבית של 4% בלבד״">
          <p>
            הסוחר מפרסם {pct(L.TRUCK.lowRate, 0)}, והלקוח ישלם <M v={L.TRUCK.lowPayment} /> בסוף כל שנה, {L.TRUCK.years} שנים. ריבית השוק {pct(L.D_RATE)}. שווי הוגן <M v={L.TRUCK.fairValue} />, עלות <M v={L.TRUCK.dealerCost} />.
          </p>
        </Story>
        <WrongRight
          label="טעות: להוון בריבית שפרסם, ולקבל מכירות גבוהות. נכון: ריבית השוק, ומכירות נמוכות יותר"
          wrong={<p>בריבית שפורסמה: מכירות {n(L.LOW_NAIVE)}, ורווח גולמי {n(L.LOW_NAIVE - L.TRUCK.dealerCost)}.</p>}
          right={<p>בריבית השוק: מכירות {n(L.LOW_SALES)}, ורווח גולמי {n(L.LOW_GROSS)} (סעיף 73).</p>}
        />
        <P>אחר כך הכנסות המימון בריבית השוק, על יתרת המכירות הנמוכה:</P>
        <Invest rows={L.LOW_ROWS} />
        <Rule>הרווח ביום המכירה מוגבל למה שהיה מתקבל בריבית שוק. את ההפרש מרוויחים לאורך זמן, אם בכלל.</Rule>
      </>
    ),
    check: quiz("ls-lsr-low", [
      {
        q: "שווי הוגן 50,000. בריבית שוק הערך הנוכחי 42,000, ובריבית שפורסמה 49,000. אילו הכנסות ממכירות?",
        options: ["42,000 ש״ח", "49,000 ש״ח", "50,000 ש״ח", "45,500 ש״ח"],
        answer: 0,
        why: "הנמוך מבין 50,000 ו-42,000 בריבית שוק.",
      },
    ]),
  },
  "ls-lsr-resid": {
    lead: "כשהנכס חוזר למחכיר, החלק שלא מובטח נשאר שלו. לא נמכר, ולכן הוא יורד גם ממכירות וגם מעלות המכר.",
    body: (
      <>
        <Part title="ברוטו ונטו">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>
              <strong>השקעה ברוטו:</strong> תשלומי החכירה, והשייר שלא מובטח, בלי היוון.
            </li>
            <li>
              <strong>השקעה נטו:</strong> הערך הנוכחי שלה, בריבית הגלומה.
            </li>
          </ul>
        </Part>
        <Story icon={<Car />} title="רכב שחוזר לסוחר">
          <p>
            {L.RES.years} שנים מתוך {L.RES.life} שנות חיים, ולכן מימונית. <M v={L.RES.payment} /> בסוף כל שנה. שווי הוגן <M v={L.RES.fairValue} />, עלות <M v={L.RES.cost} />. בסוף הרכב צפוי להיות שווה <M v={L.RES.estimate} />, והחוכר ערב ל-<M v={L.RES.guaranteed} /> מזה.
          </p>
          <p>
            בסוף שנה 1 האומדן יורד ל-<M v={L.RES.newEstimate} />.
          </p>
        </Story>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "ריבית גלומה ושייר",
              body: (
                <p>
                  <Ltr>{`=RATE(4;28000;-100000;12000) → ${pct(L.RES_RATE)}`}</Ltr>. לא מובטח: <Ltr>{`12,000 − 4,000 = ${n(L.RES_UN)}`}</Ltr>, ובערך נוכחי {n(L.RES_PV_UN)}.
                </p>
              ),
            },
            {
              title: "יום ראשון",
              body: (
                <>
                  <Tbl
                    dense
                    head={["", "סכום"]}
                    rows={[
                      ["מכירות: בלי השייר הלא מובטח", L.RES_SALES],
                      ["עלות המכר: בלי השייר הלא מובטח", -L.RES_COGS],
                    ]}
                    foot={["רווח גולמי", L.RES_GROSS]}
                  />
                  <JournalEntry
                    title="מועד התחילה"
                    lines={[
                      { account: "השקעה נטו בחכירה", dr: L.RES.fairValue },
                      { account: "עלות המכר", dr: L.RES_COGS },
                      { account: "מכירות", cr: L.RES_SALES },
                      { account: "מלאי", cr: L.RES.cost },
                    ]}
                  />
                  <p>הרווח זהה למכירה מוחלטת: השווי ההוגן פחות העלות (סעיף 72).</p>
                </>
              ),
            },
            {
              title: "ירידה באומדן, 31.12 של שנה 1",
              body: (
                <>
                  <Tbl
                    dense
                    head={["השקעה נטו", "סכום"]}
                    rows={[
                      ["1.1", L.RES.fairValue],
                      ["הכנסות מימון", L.RES_INT1],
                      ["תקבול", -L.RES.payment],
                      ["הפסד מירידת אומדן", -L.RES_LOSS],
                    ]}
                    foot={["31.12", L.RES_AFTER]}
                  />
                  <p>
                    היתרה אחרי: <Ltr>{`=PV(i;3;-28000;-9000) → ${n(L.RES_AFTER)}`}</Ltr>, באותה ריבית. ההפסד נרשם מיד (סעיף 77), והריבית לא משתנה.
                  </p>
                </>
              ),
            },
            {
              title: "שתי השנים בדוחות",
              body: (
                <Tbl
                  dense
                  head={["", "שנה 1", "שנה 2"]}
                  rows={[
                    ["רווח גולמי", L.RES_GROSS, 0],
                    ["הכנסות מימון", L.RES_INT1, L.RES_INT2],
                    ["הפסד מירידת אומדן", -L.RES_LOSS, 0],
                    ["השקעה נטו, שוטפת", L.RES_AFTER - L.RES_CLOSE2, L.RES_CLOSE2 - L.RES_NC2],
                    ["השקעה נטו, לא שוטפת", L.RES_CLOSE2, L.RES_NC2],
                  ]}
                />
              ),
            },
            {
              title: "מלכודת נפוצה",
              body: <p>להוריד את כל השייר ממכירות. רק החלק שלא מובטח יוצא. הערבות היא תשלום חכירה.</p>,
            },
          ]}
        />
        <Remember>החוכר רואה רק את מה שהוא צופה לשלם. המחכיר רואה את כל הערבות, גם של צד שלישי בעל יכולת, שאינו קשור אליו (סעיף 70(ג)).</Remember>
        <Deeper title="ואם האומדן עולה?">
          <P>סעיף 77 מדבר רק על ירידה. עלייה לא נרשמת.</P>
        </Deeper>
      </>
    ),
  },
  "ls-lsr-index": {
    lead: "כאן המחכיר שונה מהחוכר: במדד הוא לא מודד מחדש. התוספת היא פשוט הכנסה.",
    body: (
      <>
        <Tbl
          dense
          head={["שינוי במדד", "חוכר", "מחכיר"]}
          rows={[
            ["היתרה", "מודד מחדש (42(ב))", "לא משתנה (70(ב))"],
            ["התוספת", "נכנסת לנכס", "הכנסה (90(א)(iii))"],
          ]}
        />
        <P>ההשקעה נטו נמדדת לפי המדד של מועד התחילה. מדד שעלה אחר כך הוא תשלום משתנה שלא נכלל בה, ולכן הוא הכנסה נפרדת. כך גם תשלום לפי מכירות.</P>
        <Story icon={<PiggyBank />} title="תקבול של 52,000">
          <p>
            הבסיס 50,000, והמדד עלה ב-4%. מתוך 52,000 שהתקבלו: 50,000 נכנסים לתנועה של ההשקעה נטו, ו-2,000 הם הכנסה.
          </p>
        </Story>
        <Deeper title="אם ראיתם פתרון שמודד מחדש אצל המחכיר">
          <P>יש פתרונות שמעדכנים גם את ההשקעה נטו לפי המדד, ומכניסים את ההפרש להכנסות מימון. התקן לא קובע מדידה מחדש אצל המחכיר: אין סעיף מקביל ל-42(ב), סעיף 70(ב) מתייחס למדד של מועד התחילה, וסעיף 90(א)(iii) מדבר על הכנסה ממשתנים שלא נכללו. לכן בקורס התוספת היא הכנסה.</P>
        </Deeper>
      </>
    ),
  },
  "ls-lsr-credit": {
    lead: "השקעה נטו היא כסף שהחוכר חייב. לכן גם עליה חלים כללי ירידת הערך של IFRS 9.",
    body: (
      <>
        <P>המחכיר מכיר בהפסדי אשראי חזויים על ההשקעה נטו (סעיף 77).</P>
        <Remember>לחייבים בחכירה אפשר לבחור כמדיניות חשבונאית בין המודל הכללי לבין הכרה בהפסדי אשראי חזויים לכל אורך החיים. הבחירה נפרדת בין חייבים בחכירה מימונית לחייבים בחכירה תפעולית.</Remember>
      </>
    ),
  },
  "ls-lsr-map": {
    lead: "כל מה שלמדנו, בטבלה אחת.",
    body: (
      <>
        <Tbl
          dense
          head={["", "תפעולית", "מימונית, לא סוחר", "מימונית, סוחר"]}
          rows={[
            ["הנכס", "נשאר", "יוצא", "יוצא"],
            ["יום ראשון", "כלום", "רווח הון, אם יש", "מכירות ועלות מכר"],
            ["עלויות ישירות", "על הנכס, ונפרסות", "בהשקעה נטו", "הוצאה"],
            ["כל שנה", "הכנסה בקו ישר, ופחת", "הכנסות מימון", "הכנסות מימון"],
            ["במאזן", "הנכס, הכנסות לקבל", "השקעה נטו", "השקעה נטו"],
          ]}
        />
      </>
    ),
  },
  "ls-lsr-drill": {
    lead: "כל לחיצה נותנת עסקה חדשה. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["opIncome", "financeYear", "dealerProfit", "residualCogs"]} />,
  },
  "ls-lsr-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנט">
        <p>העסקה: סוחר מחכיר מכונה בחכירה מימונית. שווי הוגן 100,000 ש״ח, עלות 70,000 ש״ח, ועלויות השגה 4,000 ש״ח. המכונה חוזרת בסוף, עם שייר שלא מובטח בערך נוכחי של 5,000 ש״ח. התשלומים צמודים למדד.</p>
        <p>הפתרון: ״השקעה נטו 104,000 ש״ח. מכירות 100,000 ש״ח ועלות מכר 70,000 ש״ח. כשהמדד עלה, עדכנתי את ההשקעה נטו.״</p>
      </Story>
    ),
    check: quiz("ls-lsr-mistake", [
      {
        q: "מה הטעות בהשקעה נטו?",
        options: ["אצל סוחר העלויות הן הוצאה, ולכן 100,000", "צריך 110,000", "צריך 96,000", "אין טעות"],
        answer: 0,
        why: "סעיף 74.",
      },
      {
        q: "מה הטעות במכירות ובעלות המכר?",
        options: ["השייר יורד משתיהן: 95,000 ו-65,000", "השייר יורד רק ממכירות", "השייר מתווסף לשתיהן", "אין טעות"],
        answer: 0,
        why: "סעיף 71.",
      },
      {
        q: "מה הטעות במדד?",
        options: ["המחכיר לא מודד מחדש. התוספת היא הכנסה", "צריך לעדכן גם את המכירות", "צריך לעדכן גם את עלות המכר", "אין טעות"],
        answer: 0,
        why: "סעיפים 70(ב), 90(א)(iii).",
      },
    ]),
  },
  "ls-lsr-master": {
    lead: "כמו במבחן: אותה חנות שראינו מצד החוכר, עכשיו בספרי המחכיר. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״מגדל״, יצרנית מבנים, החכירה חנות ל-{L.STORE.years} שנים, כולל הארכה ודאית. התשלום <Money v={L.STORE.payment} /> בסוף כל שנה, צמוד למדד, ועוד 2% מהכנסות החנות. בסוף התקופה ודאי באופן סביר שהחוכר יקנה את החנות ב-<Money v={L.STORE.option} />, מחיר נמוך בהרבה מהשווי הצפוי, שאינו צמוד.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                שווי הוגן <Money v={L.STORE.fairValue} />, עלות <Money v={L.STORE.cost} />, ועלויות השגת החכירה <Money v={L.STORE.costs} />.
              </li>
              <li>אורך החיים של החנות {L.STORE.life} שנים.</li>
              <li>
                בסוף שנה 1 המדד עלה מ-{L.STORE.base} ל-{L.STORE.index}, והכנסות החנות היו <Money v={L.STORE.sales} />.
              </li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: סווגו, והציגו את הסעיפים בספרי המחכיר לשנה 1.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                { title: "סיווג", body: <p>מימונית: אופציית רכישה ודאית (סעיף 63(ב)), וגם 8 מתוך 10 שנות חיים (סעיף 63(ג)).</p> },
                {
                  title: "ריבית גלומה",
                  body: (
                    <p>
                      <Ltr>{`=RATE(8;100000;-700000;8000) → ${pct(L.STORE_RATE)}`}</Ltr>. העלויות בחוץ, כי המחכיר יצרן. המדד לפי מועד התחילה (סעיף 70(ב)).
                    </p>
                  ),
                },
                {
                  title: "השקעה נטו",
                  body: (
                    <Tbl
                      dense
                      head={["", "סכום"]}
                      rows={[
                        ["1.1", L.STORE.fairValue],
                        ["הכנסות מימון", L.STORE_INT],
                        ["תקבול שנכלל במדידה", -L.STORE.payment],
                      ]}
                      foot={["31.12", L.STORE_CLOSE]}
                    />
                  ),
                },
                {
                  title: "התקבולים בפועל",
                  body: (
                    <Tbl
                      dense
                      head={["", "סכום"]}
                      rows={[
                        ["התשלום הבסיסי", L.STORE.payment],
                        ["תוספת מדד: הכנסה", L.STORE_INDEX],
                        ["2% מההכנסות: הכנסה", L.STORE_VAR],
                      ]}
                      foot={["סך הכול במזומן", L.STORE_CASH]}
                    />
                  ),
                },
                {
                  title: "הדוחות",
                  body: (
                    <>
                      <Tbl
                        dense
                        head={["רווח או הפסד", "שנה 1"]}
                        rows={[
                          ["מכירות", L.STORE.fairValue],
                          ["עלות המכר", -L.STORE.cost],
                          ["הוצאות השגה", -L.STORE.costs],
                          ["הכנסות מימון", L.STORE_INT],
                          ["הכנסה מהצמדה", L.STORE_INDEX],
                          ["הכנסה לפי מכירות", L.STORE_VAR],
                        ]}
                        foot={["סך הכול", L.STORE_TOTAL]}
                      />
                      <Tbl
                        dense
                        head={["מצב כספי, 31.12", "שנה 1"]}
                        rows={[
                          ["השקעה נטו, שוטפת", L.STORE_CLOSE - L.STORE_NC],
                          ["השקעה נטו, לא שוטפת", L.STORE_NC],
                        ]}
                      />
                    </>
                  ),
                },
                { title: "מלכודת נפוצה", body: <p>למדוד מחדש את ההשקעה נטו בגלל המדד, כמו אצל החוכר. אצל המחכיר התוספת היא הכנסה נפרדת.</p> },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אתם מכירים את שני המודלים. ומה קורה כשמשנים חוזה אצל המחכיר?">בשיעור הבא: תיקוני חכירה בספרי המחכיר, לפי הסיווג המקורי.</Bridge>
      </>
    ),
  },
};
