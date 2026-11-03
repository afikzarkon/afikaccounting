import { Milk, Speaker } from "lucide-react";
import type { ReactNode } from "react";
import { Deeper, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { DataTable } from "@/components/study/blocks";
import { gpFire, grossProfitMethod, valuateChain, valuatePeriod } from "@/lib/learn/inventory";
import { explainNrv, u } from "@/lib/learn/inventory-explain";
import {
  COUNT_BRIDGE,
  DAF,
  GP_FIRE,
  KOL,
  kolNextYear,
  P_AVG,
  P_AVG_KNOWN,
  P_DISC,
  P_LAST,
  P_PRICE,
  P_QTY_MA,
  P_QTY_MA_COST,
  P_RETAIL,
  P_SOLD,
  WA_OPEN,
} from "@/lib/learn/inventory-examples";
import { closingFromSoldPct, discountPctFromAmount, lastSaleQty, purchasesFromSoldPct, salesFromGp, solveUnknowns } from "@/lib/learn/inventory-solver";
import { CountBridge, FillGrid, type SortItem, SortQuiz, TryInCalc } from "./inventory-interactive";
import { FIFO_DRILL, FIFO_DRILL_ANSWERS as FA, FIFO_DRILL_COGS, MA_DRILL, MA_DRILL_ANSWERS as MD, SHELF_DRILL, SHELF_DRILL_ANSWERS as SA, SHELF_DRILL_COGS, WA_DRILL, WA_DRILL_ANSWERS as WD } from "@/lib/study/inventory/drills";
import { FIFO, FIFO_PERIODIC_STEPS, FIFO_PERPETUAL_STEPS, FIFO_T, MA, MA_STEPS, WA, WA_STEPS } from "./inventory-stages";
import { PatternPicker, Reveal, Sorted, Story } from "./inventory-teach";
import { FlowStrip, TraceStepView } from "./inventory-trace";
import { Money, Rule, type Step, Stepper, Term } from "./ui";

const WAO = valuatePeriod(WA_OPEN, "wa-periodic");
const [KOL1, KOL155] = valuateChain(kolNextYear(155), "fifo", { carryWriteDown: true });
const [, KOL170] = valuateChain(kolNextYear(170), "fifo", { carryWriteDown: true });
const KOL_UNIT = KOL.opening!.cost / KOL.opening!.units;

const COUNT_ITEMS: SortItem[] = [
  { text: "סחורה בדרך מהספק; הסיכון עבר אלינו כשיצאה ממחסן הספק.", answer: "ours", why: "הסיכון כבר שלנו — מלאי שלנו, למרות שלא הגיע." },
  { text: "סחורה בדרך; לפי ההסכם הסיכון עובר אלינו רק כשהיא מגיעה למחסן שלנו.", answer: "not", why: "עדיין של הספק. אם כבר שילמנו — זו מקדמה לספקים." },
  { text: "מלאי שמסרנו לרשת במשגור (קונסיגנציה), ועוד לא נמכר ללקוח הסופי.", answer: "ours", why: "הבעלות שלנו עד המכירה ללקוח הסופי." },
  { text: "מלאי שספק אחר מסר לנו במשגור, ונמצא במחסן שלנו.", answer: "not", why: "אנחנו רק מחזיקים אותו — הוא של הספק." },
  { text: "סחורה שמכרנו, ארוזה בנפרד אצלנו; הלקוח יאסוף בחודש הבא והאחריות כבר עברה אליו.", answer: "not", why: "מכור והחזק: המכירה הוכרה, והעלות בעלות המכר." },
  { text: "דוגמיות וקטלוגים לחלוקה חינם.", answer: "not", why: "לא מוחזקים למכירה — הוצאה." },
  { text: "מלאי איטי שלא נמכר כבר שנה.", answer: "ours", why: "מלאי שלנו — אבל בודקים שווי מימוש נטו ומורידים ערך אם צריך." },
  { text: "כסף ששילמנו לספק על הזמנה שעוד לא נשלחה.", answer: "not", why: "מקדמה לספקים — נכס, אבל לא מלאי." },
];

// The unknowns' small examples, each computed.
const QTY = solveUnknowns([P_QTY_MA], "moving-avg", [{ id: "q", label: "כמות", ref: { t: "sale", year: 0, index: 0, field: "qty" } }], [{ year: 0, metric: "saleCost", index: 0, value: P_QTY_MA_COST }]);
const QTY_AVG = valuatePeriod(P_QTY_MA, "moving-avg").ledger[1].avg;
const PRICE_SALES = salesFromGp(P_PRICE.cogs, P_PRICE.gp);
const RETAIL = grossProfitMethod(P_RETAIL);
const AVG_X = solveUnknowns([P_AVG], "wa-periodic", [{ id: "x", label: "X", ref: { t: "purchase", year: 0, index: 0, field: "unitPrice" } }], [{ year: 0, metric: "avgCost", value: P_AVG_KNOWN }]);
const FIRE = gpFire({ ...(GP_FIRE as Extract<typeof GP_FIRE, { basis: "gp" }>).input, rates: (GP_FIRE as Extract<typeof GP_FIRE, { basis: "gp" }>).years.map((y) => (y.netSales - y.cogs) / y.netSales) });

/**
 * One pattern for an unknown: what is missing, what is given and the tool —
 * then an example, solved a step at a time as the reader asks for the next.
 */
function Pattern({ n, unknown, given, tool, story, steps, calc }: { n: number; unknown: string; given: string; tool: string; story: ReactNode; steps: ReactNode[]; calc?: string }) {
  return (
    <div className="card flex min-w-0 flex-col gap-3 p-4">
      <p className="flex items-center gap-2 text-[16px] font-bold text-fg">
        <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-fg">{n}</span>
        חסר: {unknown}
      </p>
      <p className="text-[14px] text-muted">נתון: {given}</p>
      <p className="rounded-lg border-s-4 border-accent bg-accent-soft px-3 py-2 text-[15px] font-semibold text-fg">{tool}</p>
      <p className="rounded-lg bg-surface-2/70 px-3 py-2 text-[14.5px] text-fg">
        <strong>דוגמה: </strong>
        {story}
      </p>
      <Reveal steps={steps} />
      {calc && (
        <div>
          <TryInCalc id={calc} />
        </div>
      )}
    </div>
  );
}

const DAF_CLOSE = DAF.years[0].cells.closing as number;
const qn = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 4 });

const reverseSteps: Step[] = [
  {
    title: "31.12.2025 — השווי ירד מתחת לעלות",
    body: (
      <p>
        עלות <Money v={KOL_UNIT} /> ליחידה, שווי מימוש נטו <Money v={KOL.nrvPerUnit!} />. מורידים ל-<Money v={KOL1.closingCarrying} /> — הורדה של <Money v={KOL1.writeDown} />.
      </p>
    ),
  },
  {
    title: "31.12.2026 — השווי עלה ל-155 ₪",
    body: (
      <>
        <p>
          הנמוך מבין העלות ({KOL_UNIT}) לשווי (155): הרמקולים שווים עכשיו <Money v={KOL155.closingCarrying} />. מבטלים <Money v={KOL155.reversal} /> — והביטול מקטין את עלות המכר.
        </p>
      </>
    ),
  },
  {
    title: "ואם השווי עלה ל-170 ₪? — עוצרים בעלות",
    body: (
      <p>
        עדיין <Money v={KOL170.closingCarrying} />: מבטלים את כל ההורדה, אבל לא עולים מעל העלות. רווח צפוי לא נרשם.
      </p>
    ),
  },
];

// ---------------------------------------------------------------------------
// Each method's first drill: a small year, solved by building the table by hand.

const f = (n: number) => ({ find: n });

const FIFO_DRILL_PAGE = (
  <>
    <FillGrid
      caption="שלב א · טבלת הרכישות: סכום לכל שורה, ואז הסיכום"
      hint="כמות × מחיר בכל שורה; בשורה האחרונה — סך היחידות וסך העלות."
      head={["תאריך", "יחידות", "מחיר", "סכום"]}
      rows={[
        ...FIFO_DRILL.buys.map((b) => [b.date, b.qty, b.price, f(b.qty * b.price)]),
        ["סה״כ", f(FA.units), "", f(FA.cost)],
      ]}
    />
    <FillGrid
      caption={`שלב ב · כמה נשאר, ומאיזו רכישה (נמכרו ${FIFO_DRILL.sold} יח׳)`}
      hint="נשאר = כל היחידות − מה שנמכר. ב-FIFO נשארות האחרונות: הולכים מהרכישה האחרונה אחורה."
      head={["", "יחידות", "סכום"]}
      rows={[
        ["נשארו במלאי", f(FA.left), ""],
        [`מהרכישה של ${FIFO_DRILL.buys[2].date}`, FIFO_DRILL.buys[2].qty, f(FA.fromLast)],
        [`ועוד מהרכישה של ${FIFO_DRILL.buys[1].date}`, FA.left - FIFO_DRILL.buys[2].qty, f(FA.fromBefore)],
        ["מלאי סגירה", "", f(FA.closing)],
        ["עלות המכר (כל העלות − הסגירה)", "", f(FIFO_DRILL_COGS)],
      ]}
    />
  </>
);

const SHELF_DRILL_PAGE = (
  <FillGrid
    caption="כרטיס FIFO תמידי: עלות כל מכירה, מהשכבה הוותיקה"
    hint="במכירה לוקחים קודם מהשכבה הוותיקה שעוד נשארה; כשהיא נגמרת — עוברים לבאה."
    head={["תאריך", "תנועה", "יחידות", "עלות המכירה", "נשאר במלאי"]}
    rows={[
      ["1.2", "קנייה", `${SHELF_DRILL.buy1.qty} × ${SHELF_DRILL.buy1.price}`, "", `${SHELF_DRILL.buy1.qty} × ${SHELF_DRILL.buy1.price}`],
      ["1.4", "מכירה", SHELF_DRILL.sell1, f(SA.sale1), `${SHELF_DRILL.buy1.qty - SHELF_DRILL.sell1} × ${SHELF_DRILL.buy1.price}`],
      ["1.6", "קנייה", `${SHELF_DRILL.buy2.qty} × ${SHELF_DRILL.buy2.price}`, "", `${SHELF_DRILL.buy1.qty - SHELF_DRILL.sell1} × ${SHELF_DRILL.buy1.price} + ${SHELF_DRILL.buy2.qty} × ${SHELF_DRILL.buy2.price}`],
      ["1.8", "מכירה", SHELF_DRILL.sell2, f(SA.sale2), "?"],
      ["סוף השנה", "", "", "", ""],
      ["", "עלות המכר", "", f(SHELF_DRILL_COGS), ""],
      ["", "מלאי סגירה", "", "", f(SA.closing)],
    ]}
  />
);

const WA_DRILL_PAGE = (
  <FillGrid
    caption={`ממוצע תקופתי: כל מה שהיה זמין, וממוצע אחד (נמכרו ${WA_DRILL.sold} יח׳)`}
    hint="מלאי הפתיחה נכנס גם לסכום וגם לכמות. ממוצע = סך העלות ÷ סך היחידות."
    head={["", "יחידות", "מחיר", "סכום"]}
    rows={[
      ["מלאי פתיחה", WA_DRILL.opening.qty, "", WA_DRILL.opening.cost],
      ...WA_DRILL.buys.map((b, i) => [`רכישה ${i + 1}`, b.qty, b.price, f(WD.buyCosts[i])]),
      ["סה״כ זמין", f(WD.units), "", f(WD.cost)],
      ["ממוצע ליחידה", "", f(WD.avg), ""],
      ["מלאי סגירה", f(WD.left), "", f(WD.closing)],
      ["עלות המכר", WA_DRILL.sold, "", f(WD.cogs)],
    ]}
  />
);

const MA_DRILL_PAGE = (
  <FillGrid
    caption="כרטיס מלאי בממוצע נע — טבלה אחת, שורה לכל תנועה"
    hint="קנייה: מוסיפים יחידות ועלות, ומחשבים ממוצע חדש. מכירה: יחידות × הממוצע הקיים — והממוצע לא משתנה."
    head={["תאריך", "תנועה", "יחידות", "עלות התנועה", "יתרה — יח׳", "יתרה — ₪", "ממוצע"]}
    rows={[
      ["1.1", `קנייה ב-${MA_DRILL.buy1.price} ₪`, MA_DRILL.buy1.qty, MA_DRILL.buy1.qty * MA_DRILL.buy1.price, f(MD.rows[0].units), f(MD.rows[0].cost), f(MD.rows[0].avg)],
      ["1.3", "מכירה", MA_DRILL.sell1, f(MD.rows[1].sale!), f(MD.rows[1].units), f(MD.rows[1].cost), MD.avg1],
      ["1.5", `קנייה ב-${MA_DRILL.buy2.price} ₪`, MA_DRILL.buy2.qty, MA_DRILL.buy2.qty * MA_DRILL.buy2.price, f(MD.rows[2].units), f(MD.rows[2].cost), f(MD.rows[2].avg)],
      ["1.8", "מכירה", MA_DRILL.sell2, f(MD.rows[3].sale!), f(MD.rows[3].units), f(MD.rows[3].cost), MD.avg3],
      ["", "עלות המכר", "", f(MD.cogs), "", "", ""],
    ]}
  />
);

/** The concept screens of lessons 3 to 5: the cost formulas, net realisable value and what is counted, and the unknowns. */
export const METHOD_SCREENS: Record<string, ScreenContent> = {
  "inv-fifo": {
    lead: "FIFO: נכנס ראשון, יוצא ראשון — ולכן מה שנשאר בסוף השנה הוא הרכישות האחרונות.",
    body: (
      <>
        <Story icon={<Milk />} title="כמו מדף חלב בסופר">
          <p>מוכרים קודם את הקרטונים הוותיקים. בסוף היום, על המדף נשארו החדשים.</p>
        </Story>
        <p>חנות הכתיבה &quot;מחברת&quot;: ארבע קניות במחירים עולים וארבע מכירות — ולא לסירוגין: פעמיים קנתה ברצף, ופעמיים מכרה ברצף. פותרים כמו בשאלת מבחן, שלב אחר שלב:</p>
        <Stepper label="מחברת · FIFO תקופתי" steps={FIFO_PERIODIC_STEPS} />
        <Remember>כדי לדעת מה נשאר ב-FIFO, לא צריך לעקוב אחרי כל מכירה: הולכים מהרכישה האחרונה אחורה, עד שמשלימים את כמות הסגירה.</Remember>
      </>
    ),
    check: FIFO_DRILL_PAGE,
  },
  "inv-fifo-shelf": {
    lead: "FIFO תמידי: בכל מכירה שואלים מה יש במלאי באותו יום, ולוקחים קודם מהשכבה הוותיקה. בסוף מגיעים לאותו מלאי סגירה כמו בדרך התקופתית.",
    body: (
      <>
        <p>
          <strong>ההבדל מהתקופתי:</strong> את עלות המכר בונים מכירה אחר מכירה — וסופרים רק מה שכבר נכנס עד אותו יום.
        </p>
        <p>אותה &quot;מחברת&quot;, הפעם בשיטה תמידית:</p>
        <Stepper label="מחברת · FIFO תמידי" steps={FIFO_PERPETUAL_STEPS} />
        <Remember>
          FIFO תמידי: מלאי סגירה <Money v={FIFO_T.closingCarrying} /> · עלות המכר <Money v={FIFO_T.cogs} /> — זהה לתקופתי. רק ב-FIFO.
        </Remember>
      </>
    ),
    check: SHELF_DRILL_PAGE,
  },
  "inv-wa": {
    lead: "ממוצע משוקלל תקופתי: ממוצע אחד לכל השנה — כל העלות שהייתה זמינה, חלקי כל היחידות.",
    body: (
      <>
        <p>אותה &quot;מחברת&quot;, הפעם בממוצע משוקלל תקופתי:</p>
        <Stepper label="מחברת · ממוצע משוקלל תקופתי" steps={WA_STEPS} />
        <Deeper title="ועם מלאי פתיחה?">
          <p>
            מלאי פתיחה 100 יח׳ בעלות <Money v={WA_OPEN.opening!.cost} />; רכישות 300 יח׳ ב-11 ₪ ו-200 יח׳ ב-12 ₪; נמכרו 400. הפתיחה נכנסת גם לסכום וגם לכמות:
          </p>
          <Rule>
            ({WAO.openingCost.toLocaleString("he-IL")} + {WAO.purchasesCost.toLocaleString("he-IL")}) ÷ ({WAO.openingUnits} + {WAO.purchasesUnits}) = {u(WAO.avgCost!)} · סגירה:{" "}
            {WAO.closingUnits} × {u(WAO.avgCost!)} = <Money v={WAO.closingCarrying} />
          </Rule>
        </Deeper>
        <Remember>לא משנה מתי נמכר מה — רק כמה היה זמין בכל השנה, ובכמה.</Remember>
      </>
    ),
    check: WA_DRILL_PAGE,
  },
  "inv-ma": {
    lead: "ממוצע נע: ממוצע חדש אחרי כל קנייה — ורק אחרי קנייה. מכירה יוצאת בממוצע הקיים ולא משנה אותו.",
    body: (
      <>
        <p>
          <strong>כרטיס מלאי, שורה לכל תנועה:</strong> קנייה ← ממוצע חדש; מכירה ← יוצאת בממוצע שעל הכרטיס.
        </p>
        <p>אותה &quot;מחברת&quot;, הפעם בממוצע נע — הכרטיס נבנה שורה אחר שורה:</p>
        <Stepper label="מחברת · ממוצע נע" steps={MA_STEPS} />
        <Remember>
          ממוצע נע: מלאי סגירה <Money v={MA.closingCarrying} /> · עלות המכר <Money v={MA.cogs} /> — שונה מהממוצע התקופתי.
        </Remember>
      </>
    ),
    check: MA_DRILL_PAGE,
  },
  "inv-compare": {
    lead: "אותם נתונים, שלוש שיטות, שלוש תוצאות — אבל בכל שיטה מלאי הסגירה ועלות המכר יחד שווים לכל מה שהיה זמין.",
    body: (
      <>
        <DataTable
          caption="מחברת: אותם נתונים — שלוש שיטות"
          head={["שיטה", "מלאי סגירה", "עלות המכר", "רווח גולמי"]}
          rows={[
            ["FIFO", FIFO.closingCarrying, FIFO.cogs, FIFO.grossProfit],
            ["ממוצע משוקלל תקופתי", WA.closingCarrying, WA.cogs, WA.grossProfit],
            ["ממוצע משוקלל נע", MA.closingCarrying, MA.cogs, MA.grossProfit],
          ]}
        />
        <Remember>המחירים עלו — ולכן ב-FIFO נשארו על המדף היחידות היקרות: הסגירה הגבוהה ביותר, והרווח הגבוה ביותר. הממוצעים נופלים באמצע.</Remember>
      </>
    ),
  },

  "inv-nrv": {
    lead: "מלאי נמדד לפי הנמוך מבין העלות לשווי מימוש נטו: הפסד צפוי נרשם מיד; רווח צפוי — רק כשמוכרים.",
    body: (
      <>
        <Story icon={<Speaker />} title="120 רמקולים של ״קול״">
          <div className="grid grid-cols-2 gap-2 sm:max-w-md">
            <div className="rounded-xl border-2 border-line-strong bg-surface p-3 text-center">
              <p className="text-[13px] text-muted">עלות ליחידה</p>
              <p className="text-xl font-bold text-fg">
                <Money v={KOL_UNIT} />
              </p>
            </div>
            <div className="rounded-xl border-2 border-success/50 bg-success/5 p-3 text-center">
              <p className="text-[13px] text-muted">שווי מימוש נטו ליחידה</p>
              <p className="text-xl font-bold text-success">
                <Money v={KOL.nrvPerUnit!} />
              </p>
            </div>
          </div>
          <p>
            הנמוך: <Money v={KOL.nrvPerUnit!} />. מורידים ערך ב-<Money v={KOL1.writeDown} /> — וההורדה נכנסת ל<strong>עלות המכר</strong>.
          </p>
        </Story>
        <Sorted
          columns={[
            { title: "בשיטה תקופתית", tone: "neutral", items: [<>ההורדה ״מגולמת״: מלאי הסגירה נרשם ישר ב-<Money key="c" v={KOL1.closingCarrying} /></>] },
            { title: "בשיטה תמידית", tone: "neutral", items: [<>פקודה: ח׳ עלות המכר / ז׳ מלאי <Money key="w" v={KOL1.writeDown} plain /></>] },
          ]}
        />
        <Deeper title="החישוב המלא">
          <TraceStepView s={explainNrv(KOL, KOL1)!} />
        </Deeper>
        <Remember>
          <Term he="שווי מימוש נטו" /> = מה שנקבל על המלאי, נטו: מחיר מכירה צפוי − עלויות השלמה − עלויות מכירה.
        </Remember>
      </>
    ),
  },
  "inv-nrv-reverse": {
    lead: "שווי המימוש נטו עלה? מבטלים את הורדת הערך — אבל רק עד העלות המקורית, ולא שקל מעליה.",
    body: (
      <>
        <Stepper label="קול · שנה אחרי שנה" steps={reverseSteps} />
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="kol" label="פתחו את קול במחשבון" />
        </div>
        <Deeper title="מתי ואיך בודקים">
          <ul className="list-inside list-disc space-y-1">
            <li>בכל תאריך דוח מחדש.</li>
            <li>לכל קבוצת פריטים דומים יחד: יחידות × שווי מימוש נטו ליחידה, מול העלות הכוללת.</li>
            <li>
              חריג: <Term he="חומרי גלם" /> לא יורדים מתחת לעלות, אם המוצרים הגמורים שבהם ייכללו צפויים להימכר בעלות או מעליה.
            </li>
          </ul>
        </Deeper>
        <Remember>שווי מימוש נטו ≠ שווי הוגן: &quot;שווי הוגן&quot; (מחיר בשוק) בשאלה הוא מסיח. משווים לעלות רק את שווי המימוש נטו של החברה.</Remember>
      </>
    ),
  },
  "inv-count": {
    lead: "מלאי שייך למי שהסיכון עליו: לא כל מה שבמחסן שלנו — ולא כל מה שלנו נמצא במחסן.",
    body: (
      <>
        <Sorted
          columns={[
            {
              title: "שלנו",
              tone: "good",
              items: ["במחסן — אם עוד לא נמכר", "בדרך, כשהסיכון כבר עבר אלינו", "משגור שמסרנו — עד המכירה ללקוח הסופי", "מלאי איטי או מת (ובודקים שווי מימוש נטו)"],
            },
            {
              title: "לא שלנו",
              tone: "bad",
              items: ["בדרך, כשהסיכון עדיין אצל הספק (שולם? מקדמה)", "מכור והחזק — כבר של הלקוח", "משגור שספק מסר לנו", "דוגמיות לחלוקה חינם — הוצאה"],
            },
          ]}
        />
        <Remember>השאלה שפותרת הכול: אם הסחורה תיהרס עכשיו — מי יספוג את ההפסד?</Remember>
      </>
    ),
  },
  "inv-count-sort": {
    lead: "לפני שממשיכים — בודקים שההבנה יושבת: לכל פריט, האם הוא מלאי של החברה?",
    body: (
      <SortQuiz
        id="count-sort"
        title="שלנו או לא?"
        options={[
          ["ours", "מלאי שלנו"],
          ["not", "לא מלאי שלנו"],
        ]}
        items={COUNT_ITEMS}
      />
    ),
  },
  "inv-bridge": {
    lead: "מהספירה במחסן למלאי בספרים: מוסיפים את מה ששלנו ונמצא בחוץ, ומורידים את מה שבמחסן ואינו שלנו.",
    body: <CountBridge rows={COUNT_BRIDGE} />,
  },

  "inv-unknowns": {
    lead: "כל שאלת נעלמים נשענת על רעיון אחד: משוואה שכל המספרים בה ידועים חוץ מאחד.",
    body: (
      <>
        <p>יש שמונה תבניות שחוזרות בבחינות. אין צורך לזכור את כולן עכשיו — רק לדעת לזהות איזו מתאימה:</p>
        <PatternPicker
          items={[
            { missing: "דוח עם סימני שאלה", given: "כמה שנים", pattern: 1, screen: "inv-chain" },
            { missing: "כמות מכירה", given: "העלות שלה ידועה (ממוצע נע)", pattern: 2, screen: "inv-qty" },
            { missing: "כמות המכירה האחרונה", given: "כמות הסגירה ידועה", pattern: 3, screen: "inv-qty" },
            { missing: "מחיר מכירה", given: "שיעור רווח גולמי", pattern: 4, screen: "inv-gp" },
            { missing: "מלאי סגירה / מלאי שנשרף", given: "שיעור רווח גולמי, בלי ספירה", pattern: 5, screen: "inv-gp" },
            { missing: "מחיר רכישה", given: "עלות ממוצעת", pattern: 6, screen: "inv-avg-price" },
            { missing: "שיעור הנחה", given: "הנחה בשקלים", pattern: 7, screen: "inv-pct" },
            { missing: "קניות ומלאי סגירה", given: "״נמכר p% מהקניות״", pattern: 8, screen: "inv-pct" },
          ]}
        />
        <Remember>מחפשים משוואה אחת עם נעלם אחד. פותרים, מציבים — וממשיכים, עד שאין יותר נעלמים.</Remember>
      </>
    ),
  },
  "inv-chain": {
    lead: "תבנית 1: ארבע המשוואות של הדוח מחוברות כמו חוליות בשרשרת — וסגירה של שנה היא הפתיחה של הבאה.",
    body: (
      <>
        <p>
          מכירות נטו, קניות נטו, עלות המכר ורווח גולמי — כל חוליה משתמשת במספרים של אחרת. כשבחוליה חסר מספר אחד בלבד, מחלצים אותו — והוא &quot;פותח&quot; את החוליה הבאה.
        </p>
        <FlowStrip
          boxes={[
            { label: `מלאי סגירה 31.12.${DAF.years[0].label}`, value: `${DAF_CLOSE.toLocaleString("he-IL")} ₪` },
            { label: "עובר שנה", value: "" },
            { label: `מלאי פתיחה 1.1.${DAF.years[1].label}`, value: `${DAF_CLOSE.toLocaleString("he-IL")} ₪`, tone: "accent" },
          ]}
        />
        <p className="text-[14.5px] text-muted">
          את השרשרת המלאה, צעד אחר צעד, ראו במסך <ScreenLink id="inv-daf" />.
        </p>
        <Remember>החוליה שבין השנים: פתיחה(t) = סגירה(t−1). מה שעמד במחסן ב-31.12 עומד בו גם ב-1.1.</Remember>
      </>
    ),
  },
  "inv-qty": {
    lead: "כמות חסרה: בממוצע נע — עלות המכירה חלקי הממוצע שלפניה; ובכל שיטה — מה שהיה = מה שיצא + מה שנשאר.",
    body: (
      <>
        <Pattern
          n={2}
          unknown="כמות מכירה"
          given="עלות המכירה בשקלים (ממוצע נע)"
          tool="כמות = עלות המכירה ÷ הממוצע שלפני המכירה"
          calc="or"
          story={<>ב-10.1 נקנו 600 יח׳ ב-20 ₪, וב-10.2 עוד 400 ב-25 ₪. ב-1.3 נמכרה כמות לא ידועה בעלות <Money v={P_QTY_MA_COST} />.</>}
          steps={[
            <>הממוצע לפני המכירה: (600 × 20 + 400 × 25) ÷ 1,000 = <strong>{qn(QTY_AVG)}</strong> ₪.</>,
            <>כל יחידה יוצאת בממוצע הזה: עלות המכירה = כמות × {qn(QTY_AVG)}.</>,
            <>
              כמות = <Money v={P_QTY_MA_COST} plain /> ÷ {qn(QTY_AVG)} = <strong>{QTY.values.q}</strong> יח׳.
            </>,
          ]}
        />
        <Pattern
          n={3}
          unknown="כמות המכירה האחרונה"
          given="כמות הסגירה, מספירה"
          tool="מה שהיה = מה שיצא + מה שנשאר"
          story={<>היו זמינות {P_LAST.available.toLocaleString("he-IL")} יח׳. המכירות הידועות: {P_LAST.otherSales.toLocaleString("he-IL")}. בספירה: {P_LAST.closing}.</>}
          steps={[
            <>כל יחידה זמינה — או שנמכרה, או שעדיין במחסן.</>,
            <>
              <span className="num">
                {P_LAST.available.toLocaleString("he-IL")} = {P_LAST.otherSales.toLocaleString("he-IL")} + x + {P_LAST.closing}
              </span>
            </>,
            <>
              x = <strong>{lastSaleQty(P_LAST.available, P_LAST.closing, P_LAST.otherSales)}</strong> יח׳.
            </>,
          ]}
        />
      </>
    ),
  },
  "inv-gp": {
    lead: "שיעור הרווח הגולמי מתרגם מכירות לעלות המכר, ולהפך — ומשם מוצאים מחיר חסר, או מלאי שאין לו ספירה.",
    body: (
      <>
        <p>
          <strong>שיעור גולמי של 25%:</strong> מכל שקל מכירות — 25 אגורות רווח, ו-75 אגורות עלות. לכן מכירות = עלות המכר ÷ 0.75.
        </p>
        <Pattern
          n={4}
          unknown="מחיר מכירה"
          given="שיעור רווח גולמי ועלות המכר"
          tool="מכירות = עלות המכר ÷ (1 − שיעור)"
          calc="rimon"
          story={<>עלות המכר {P_PRICE.cogs.toLocaleString("he-IL")} ₪, שיעור גולמי {P_PRICE.gp * 100}%. שאר המכירות: {P_PRICE.otherSales.toLocaleString("he-IL")} ₪. במכירה של {P_PRICE.qty} יח׳ המחיר חסר.</>}
          steps={[
            <>
              מכירות = {P_PRICE.cogs.toLocaleString("he-IL")} ÷ {1 - P_PRICE.gp} = <strong>{PRICE_SALES.toLocaleString("he-IL")}</strong> ₪.
            </>,
            <>
              המכירה החסרה: {PRICE_SALES.toLocaleString("he-IL")} − {P_PRICE.otherSales.toLocaleString("he-IL")} = {(PRICE_SALES - P_PRICE.otherSales).toLocaleString("he-IL")} ₪.
            </>,
            <>
              מחיר = {(PRICE_SALES - P_PRICE.otherSales).toLocaleString("he-IL")} ÷ {P_PRICE.qty} = <strong>{(PRICE_SALES - P_PRICE.otherSales) / P_PRICE.qty}</strong> ₪.
            </>,
          ]}
        />
        <Pattern
          n={5}
          unknown="מלאי סגירה / מלאי שנשרף"
          given="שיעור רווח גולמי, בלי ספירה"
          tool="סגירה = פתיחה + קניות − מכירות × (1 − שיעור)"
          calc="gpfire"
          story={<>מלאי פתיחה {P_RETAIL.opening.toLocaleString("he-IL")} ₪, קניות {P_RETAIL.purchases.toLocaleString("he-IL")} ₪, מכירות {P_RETAIL.netSales.toLocaleString("he-IL")} ₪, שיעור גולמי רגיל {P_RETAIL.rate * 100}%.</>}
          steps={[
            <>עלות המכר: {P_RETAIL.netSales.toLocaleString("he-IL")} × {(1 - P_RETAIL.rate) * 100}% = {(P_RETAIL.netSales * (1 - P_RETAIL.rate)).toLocaleString("he-IL")} ₪.</>,
            <>היה זמין: {(P_RETAIL.opening + P_RETAIL.purchases).toLocaleString("he-IL")} ₪.</>,
            <>
              נשאר: <strong>{RETAIL.closing.toLocaleString("he-IL")}</strong> ₪.
            </>,
            <>בשריפה: אותו חישוב רק עד תאריך השריפה, ומורידים את מה שניצל. בדוגמת המחשבון: שיפוי נטו <Money v={FIRE.settlement.net} />.</>,
          ]}
        />
      </>
    ),
  },
  "inv-avg-price": {
    lead: "מחיר רכישה חסר בממוצע: הממוצע כפול כל היחידות הוא סך העלות — ומה שאינו של הפתיחה, שייך לרכישה.",
    body: (
      <Pattern
        n={6}
        unknown="מחיר רכישה"
        given="עלות ממוצעת (ממוצע תקופתי)"
        tool="סך העלות = הממוצע × כל היחידות"
        calc="aron"
        story={<>מלאי פתיחה {P_AVG.opening!.units} יח׳ בעלות {P_AVG.opening!.cost.toLocaleString("he-IL")} ₪. נקנו {P_AVG.purchases[0].qty} יח׳ במחיר לא ידוע. הממוצע לשנה: {P_AVG_KNOWN} ₪.</>}
        steps={[
          <>
            סך העלות: {P_AVG_KNOWN} × {P_AVG.opening!.units + P_AVG.purchases[0].qty} = {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty)).toLocaleString("he-IL")} ₪.
          </>,
          <>
            פחות הפתיחה: {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty) - P_AVG.opening!.cost).toLocaleString("he-IL")} ₪ — זו עלות הרכישה.
          </>,
          <>
            מחיר = {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty) - P_AVG.opening!.cost).toLocaleString("he-IL")} ÷ {P_AVG.purchases[0].qty} = <strong>{Math.round(AVG_X.values.x * 1e6) / 1e6}</strong> ₪.
          </>,
        ]}
      />
    ),
  },
  "inv-pct": {
    lead: "אחוז שנתון במילים מתרגמים לשקלים: שיעור הנחה = הנחה ÷ מחיר; קניות = עלות המכר ÷ האחוז שנמכר.",
    body: (
      <>
        <Pattern
          n={7}
          unknown="שיעור הנחה"
          given="הנחה בשקלים ברכישה אחת"
          tool="שיעור = הנחה ÷ (כמות × מחיר)"
          calc="galim"
          story={<>ברכישה של {P_DISC.qty} יח׳ ב-{P_DISC.unitPrice} ₪ התקבלה הנחה של {P_DISC.amount.toLocaleString("he-IL")} ₪. האחוז לא נמסר.</>}
          steps={[
            <>מחיר לפני הנחה: {(P_DISC.qty * P_DISC.unitPrice).toLocaleString("he-IL")} ₪.</>,
            <>
              שיעור = {P_DISC.amount.toLocaleString("he-IL")} ÷ {(P_DISC.qty * P_DISC.unitPrice).toLocaleString("he-IL")} = <strong>{discountPctFromAmount(P_DISC.amount, P_DISC.qty, P_DISC.unitPrice) * 100}%</strong>.
            </>,
            <>את אותו שיעור מחילים על שאר הרכישות שבהסכם.</>,
          ]}
        />
        <Pattern
          n={8}
          unknown="קניות ומלאי סגירה"
          given="״נמכר p% מערך הקניות״; אין פתיחה"
          tool="קניות = עלות המכר ÷ p"
          story={<>חברה חדשה מכרה {P_SOLD.p * 100}% ממה שקנתה. עלות המכר: {P_SOLD.cogs.toLocaleString("he-IL")} ₪.</>}
          steps={[
            <>
              קניות = {P_SOLD.cogs.toLocaleString("he-IL")} ÷ {P_SOLD.p * 100}% = <strong>{purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p).toLocaleString("he-IL")}</strong> ₪.
            </>,
            <>
              נשאר: {(1 - P_SOLD.p) * 100}% = <strong>{closingFromSoldPct(purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p), P_SOLD.p).toLocaleString("he-IL")}</strong> ₪.
            </>,
            <>ובאותה משפחה: &quot;הכפילה את הכמות&quot; — × 2; &quot;גדל ב-75%&quot; — × 1.75.</>,
          ]}
        />
      </>
    ),
  },
};
