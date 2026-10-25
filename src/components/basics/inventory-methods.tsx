import type { ReactNode } from "react";
import { Callout, DataTable } from "@/components/study/blocks";
import { dateLabel, fifoSnapshots, gpFire, grossProfitMethod, valuateChain, valuatePeriod } from "@/lib/learn/inventory";
import { explainNrv, explainQuantities, explainValuation, u } from "@/lib/learn/inventory-explain";
import {
  COUNT_BRIDGE,
  DAF,
  GP_FIRE,
  KOL,
  kolNextYear,
  NEYAR,
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
import { CountBridge, FifoShelf, MiniQuiz, type ShelfFrame, type SortItem, SortQuiz, TryInCalc } from "./inventory-interactive";
import { FlowStrip, TraceStepView, TraceTableView } from "./inventory-trace";
import { Card, Chapter, Money, Rule, Term } from "./ui";

const FIFO = valuatePeriod(NEYAR, "fifo");
const FIFO_T = valuatePeriod(NEYAR, "fifo", { system: "perpetual" });
const WA = valuatePeriod(NEYAR, "wa-periodic");
const MA = valuatePeriod(NEYAR, "moving-avg");
const WAO = valuatePeriod(WA_OPEN, "wa-periodic");
const colorOf = new Map(NEYAR.purchases.map((p, i) => [p.label!, i]));
const FRAMES: ShelfFrame[] = fifoSnapshots(NEYAR).map((s) => ({
  title: s.kind === "open" ? "תחילת השנה — המדף ריק" : `${dateLabel(s.date)}: ${s.kind === "buy" ? `נכנסות ${s.qty} יח'` : `נמכרות ${s.qty} יח'`}`,
  note:
    s.kind === "sell"
      ? `לקחו ${s.slices.map((x) => `${x.units} מ${x.source}`).join(" ועוד ")} — עלות המכירה ${s.slices.reduce((a, x) => a + x.cost, 0).toLocaleString("he-IL", { maximumFractionDigits: 2 })} ₪.`
      : s.kind === "buy"
        ? "שכבה חדשה נכנסת לסוף המדף."
        : "",
  layers: s.layers.map((l) => ({ source: l.source, units: l.units, unitCost: l.cost / l.units, color: colorOf.get(l.source) ?? 0 })),
  total: s.layers.reduce((a, l) => a + l.cost, 0),
  units: s.layers.reduce((a, l) => a + l.units, 0),
}));

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

// Chapter 12's small examples, each computed.
const QTY = solveUnknowns([P_QTY_MA], "moving-avg", [{ id: "q", label: "כמות", ref: { t: "sale", year: 0, index: 0, field: "qty" } }], [{ year: 0, metric: "saleCost", index: 0, value: P_QTY_MA_COST }]);
const QTY_AVG = valuatePeriod(P_QTY_MA, "moving-avg").ledger[1].avg;
const PRICE_SALES = salesFromGp(P_PRICE.cogs, P_PRICE.gp);
const RETAIL = grossProfitMethod(P_RETAIL);
const AVG_X = solveUnknowns([P_AVG], "wa-periodic", [{ id: "x", label: "X", ref: { t: "purchase", year: 0, index: 0, field: "unitPrice" } }], [{ year: 0, metric: "avgCost", value: P_AVG_KNOWN }]);
const FIRE = gpFire({ ...(GP_FIRE as Extract<typeof GP_FIRE, { basis: "gp" }>).input, rates: (GP_FIRE as Extract<typeof GP_FIRE, { basis: "gp" }>).years.map((y) => (y.netSales - y.cogs) / y.netSales) });

/** A fraction drawn as one, for formulas with Hebrew words in them. */
function FracBox({ label, top, bottom, after }: { label: string; top: ReactNode; bottom: ReactNode; after?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-[15px] font-medium text-fg">
      <span className="text-sm text-muted">{label} =</span>
      <span className="inline-flex flex-col items-center text-center leading-tight">
        <span className="px-1.5 pb-1">{top}</span>
        <span className="w-full border-t-2 border-fg/80 px-1.5 pt-1">{bottom}</span>
      </span>
      {after && <span>{after}</span>}
    </div>
  );
}

function Pattern({ n, unknown, given, tool, story, steps, calc }: { n: number; unknown: string; given: string; tool: string; story: ReactNode; steps: ReactNode[]; calc?: string }) {
  return (
    <div className="card flex min-w-0 flex-col p-4">
      <p className="font-semibold text-fg">
        <span className="num me-1.5 text-accent">{n}.</span>
        {unknown}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13.5px]">
        <dt className="text-muted">מה נתון:</dt>
        <dd className="text-fg">{given}</dd>
        <dt className="text-muted">הכלי:</dt>
        <dd className="text-fg">{tool}</dd>
      </dl>
      <p className="mt-3 rounded-lg bg-surface-2/70 px-3 py-2 text-[14px] text-fg">
        <strong>דוגמה: </strong>
        {story}
      </p>
      <ol className="mt-2 flex-1 space-y-1.5 rounded-lg bg-accent-soft px-3 py-2 text-[14px] text-fg">
        {steps.map((x, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="num mt-0.5 shrink-0 text-xs font-bold text-accent">{i + 1}.</span>
            <span className="min-w-0">{x}</span>
          </li>
        ))}
      </ol>
      {calc && (
        <div className="mt-2">
          <TryInCalc id={calc} />
        </div>
      )}
    </div>
  );
}

const DAF_CLOSE = DAF.years[0].cells.closing as number;
const qn = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 4 });

export function InventoryMethodChapters() {
  return (
    <>
      <Chapter n={7} id="inv-fifo" title="FIFO (פיפ״ו / נרי״ר)" lead="נכנס ראשון, יוצא ראשון — ולכן נשארות הרכישות האחרונות">
        <p>
          תחשבו על מדף חלב בסופר: מוכרים קודם את הקרטונים הוותיקים. לכן מה שנשאר במלאי בסוף השנה הוא <strong>הרכישות האחרונות</strong>.
        </p>
        <p>
          סיטונאי הנייר &quot;נייר&quot; קונה ומוכר חבילות נייר. כל הנתונים שלו — ארבע רכישות וארבע מכירות — מרוכזים בטבלה אחת, לפי סדר התאריכים. זו הטבלה הראשונה שבונים
          בכל שאלה, וממנה נעבוד בשלושת הפרקים הבאים: FIFO, ממוצע תקופתי וממוצע נע.
        </p>
        <TraceStepView s={explainQuantities(FIFO, NEYAR)} />
        <h3 className="text-lg font-semibold text-fg">הדרך התקופתית — מתחילים מהסוף</h3>
        <p>
          ב-FIFO היחידות הוותיקות יוצאות ראשונות. לכן כדי לדעת מה <strong>נשאר</strong>, הולכים מהרכישה האחרונה אחורה עד שמשלימים את כמות הסגירה — ולא צריך לעקוב אחרי כל מכירה.
        </p>
        <TraceStepView s={explainValuation(FIFO)} />
        <h3 className="text-lg font-semibold text-fg">הדרך התמידית — בכל מכירה, מאיפה לוקחים</h3>
        <p>עברו בין האירועים (גם עם החצים במקלדת). כל צבע הוא רכישה אחרת:</p>
        <FifoShelf frames={FRAMES} />
        <TraceTableView t={explainValuation(FIFO_T).tables![1]} />
        <Rule>
          FIFO: מלאי סגירה <Money v={FIFO.closingCarrying} /> · עלות המכר <Money v={FIFO.cogs} /> · רווח גולמי <Money v={FIFO.grossProfit} /> — זהה בתקופתי ובתמידי.
        </Rule>
        <Callout kind="warn" title="רק FIFO זהה בשתי השיטות">
          <p>בממוצע משוקלל, השיטה התקופתית והתמידית נותנות מספרים שונים — שני הפרקים הבאים.</p>
        </Callout>
        <MiniQuiz
          chapter="fifo"
          items={[
            { q: "ב-FIFO, מאיזו רכישה מוערך מלאי הסגירה?", options: ["מהראשונות", "מהאחרונות", "ממוצע של כולן", "מהזולה ביותר"], answer: 1, why: "הוותיקות נמכרו קודם — נשארות האחרונות." },
            { q: "רכישות: 100 ב-5 ₪, אחר כך 100 ב-7 ₪. נשארו 130 יח'. מה מלאי הסגירה ב-FIFO?", options: ["650", "850", "910", "780"], answer: 1, why: "100 × 7 + 30 × 5 = 850." },
          ]}
        />
      </Chapter>

      <Chapter n={8} id="inv-wa" title="ממוצע משוקלל תקופתי" lead="ממוצע אחד לכל השנה">
        <FracBox label="עלות ממוצעת ליחידה" top="עלות מלאי הפתיחה (₪) + עלות הקניות (₪)" bottom="יחידות בפתיחה + יחידות שנקנו" />
        <ol className="list-inside list-decimal space-y-1">
          <li>גלגול כמויות — כמה יחידות במלאי הסגירה.</li>
          <li>ממוצע אחד לכל השנה.</li>
          <li>מלאי סגירה = ממוצע × כמות.</li>
        </ol>
        <p>אותו &quot;נייר&quot;, מאותה טבלת תנועות. הפעם לא משנה מתי נמכר מה — רק כמה היה זמין בכל השנה, ובכמה:</p>
        <TraceStepView s={explainValuation(WA)} />
        <Rule>
          ממוצע תקופתי: מלאי סגירה <Money v={WA.closingCarrying} /> · עלות המכר <Money v={WA.cogs} /> · רווח גולמי <Money v={WA.grossProfit} />.
        </Rule>
        <Card title="ועם מלאי פתיחה?">
          <p>
            מלאי פתיחה 100 יח׳ בעלות <Money v={WA_OPEN.opening!.cost} />; רכישות 300 יח׳ ב-11 ₪ ו-200 יח׳ ב-12 ₪; נמכרו 400. מלאי הפתיחה נכנס <strong>גם לסכום וגם לכמות</strong>:
          </p>
          <p className="num">
            ({WAO.openingCost.toLocaleString("he-IL")} + {WAO.purchasesCost.toLocaleString("he-IL")}) ÷ ({WAO.openingUnits} + {WAO.purchasesUnits}) = {u(WAO.avgCost!)} · סגירה: {WAO.closingUnits} × {u(WAO.avgCost!)} ={" "}
            <Money v={WAO.closingCarrying} />
          </p>
        </Card>
        <Callout kind="warn" title="שלוש מלכודות">
          <ul className="list-inside list-disc space-y-1">
            <li>תאריכי המכירות לא משנים כלום בממוצע התקופתי.</li>
            <li>לא מעגלים את הממוצע בדרך — רק בסוף, או לפי הוראת השאלה.</li>
            <li>ממוצע פשוט של המחירים (10, 12, 15, 18) אינו ממוצע משוקלל — הכמויות שונות.</li>
          </ul>
        </Callout>
        <MiniQuiz
          chapter="wa"
          items={[
            { q: "רכישות: 100 יח' ב-10 ₪ ו-300 יח' ב-14 ₪. מה הממוצע המשוקלל?", options: ["12", "13", "11", "14"], answer: 1, why: "(1,000 + 4,200) ÷ 400 = 13." },
            { q: "האם מכירה באמצע השנה משנה את הממוצע התקופתי?", options: ["כן", "לא"], answer: 1, why: "יש ממוצע אחד לכל השנה; הכמות שנמכרה משפיעה רק על כמות הסגירה." },
          ]}
        />
      </Chapter>

      <Chapter n={9} id="inv-ma" title="ממוצע משוקלל נע (תמידי)" lead="ממוצע חדש אחרי כל קנייה — ורק אחרי קנייה">
        <Rule>לפני כל מכירה — ממוצע עדכני. אם נכנסה רכישה מאז המכירה הקודמת, מחשבים ממוצע חדש; המכירה עצמה יוצאת בממוצע הזה ולא משנה אותו.</Rule>
        <FracBox label="ממוצע חדש אחרי רכישה" top="עלות היתרה לפני הרכישה + עלות הרכישה" bottom="יחידות ביתרה לפני הרכישה + יחידות שנקנו" />
        <p>
          אותו &quot;נייר&quot;. כך נראה כרטיס המלאי של הקורס: לכל תנועה שורה אחת — מה נכנס, מה יצא, ומה היתרה אחריה. עמודות <strong>היתרה</strong> צבועות, כי מהן לוקחים את
          הממוצע למכירה הבאה. מתחת לכרטיס — כל חישוב, לפי הסדר:
        </p>
        <TraceStepView s={explainValuation(MA)} />
        <Rule>
          ממוצע נע: מלאי סגירה <Money v={MA.closingCarrying} /> · עלות המכר <Money v={MA.cogs} /> · רווח גולמי <Money v={MA.grossProfit} />.
        </Rule>
        <DataTable
          caption="אותם נתונים — שלוש שיטות, שלוש תוצאות"
          head={["שיטה", "מלאי סגירה", "עלות המכר", "רווח גולמי"]}
          rows={[
            ["FIFO", FIFO.closingCarrying, FIFO.cogs, FIFO.grossProfit],
            ["ממוצע משוקלל תקופתי", WA.closingCarrying, WA.cogs, WA.grossProfit],
            ["ממוצע משוקלל נע", MA.closingCarrying, MA.cogs, MA.grossProfit],
          ]}
        />
        <p className="text-sm text-muted">
          המחירים של &quot;נייר&quot; עלו לאורך השנה (10 ← 18), ולכן ב-FIFO נשארו במלאי היחידות היקרות: מלאי הסגירה הגבוה ביותר ועלות המכר הנמוכה ביותר. הממוצעים
          &quot;מערבבים&quot; מחירים ישנים וחדשים, ונופלים באמצע. בכל השיטות סכום הסגירה ועלות המכר שווה לאותו סך — <Money v={FIFO.availableCost} /> שהיו זמינים.
        </p>
        <Card title="למה שתי מכירות ברצף — באותו מחיר?">
          <p>כי בין שתיהן לא הייתה קנייה. מכירה מקטינה את הכמות ואת העלות באותו יחס, ולכן העלות ליחידה נשארת.</p>
        </Card>
        <Card title="תבנית נעלם: כמות המכירה חסרה, העלות שלה ידועה">
          <p>
            כמות = עלות המכירה ÷ הממוצע שלפני המכירה. למשל: ממוצע <Money v={QTY_AVG} plain /> ועלות מכירה <Money v={P_QTY_MA_COST} /> ← <strong>{QTY.values.q}</strong> יחידות.
          </p>
        </Card>
        <Callout kind="warn" title="נע ≠ תקופתי">
          <p>
            ב&quot;נייר&quot;: רווח גולמי <Money v={MA.grossProfit} /> בממוצע נע, מול <Money v={WA.grossProfit} /> בממוצע תקופתי. שתי שיטות, שני מספרים.
          </p>
        </Callout>
        <MiniQuiz
          chapter="ma"
          items={[
            { q: "ממוצע נע: 200 יח' בעלות 2,000. נמכרו 50. מה הממוצע אחרי המכירה?", options: ["10", "13.33", "8", "תלוי במחיר המכירה"], answer: 0, why: "מכירה לא משנה את הממוצע: 1,500 ÷ 150 = 10." },
            { q: "מתי מחשבים ממוצע חדש בשיטה הנעה?", options: ["אחרי כל מכירה", "אחרי כל קנייה", "בסוף השנה", "בכל חודש"], answer: 1, why: "רק קנייה מוסיפה יחידות בעלות אחרת." },
          ]}
        />
      </Chapter>

      <Chapter n={10} id="inv-nrv" title="הנמוך מבין העלות לשווי מימוש נטו" lead="הפסד צפוי — מיד; רווח צפוי — רק כשמוכרים">
        <p>
          מלאי נמדד לפי <strong>הנמוך מבין העלות לבין <Term he="שווי מימוש נטו" /></strong> — הסכום שהחברה צפויה לקבל על המלאי, נטו. בשאלות הוא ניתן בדרך כלל כנתון מוכן
          ליחידה, ואז הבדיקה פשוטה: משווים שני מספרים ולוקחים את הנמוך. אם שווי המימוש נטו נמוך מהעלות — מורידים ערך מיד. אם הוא גבוה — לא עושים כלום; הרווח יוכר במכירה.
        </p>
        <Card title='דוגמה: 120 רמקולים של "קול"'>
          <p>
            במלאי הסגירה 120 רמקולים, בעלות <Money v={KOL.opening!.cost} /> (<Money v={KOL_UNIT} /> ליחידה). <strong>שווי מימוש נטו ליחידה: <Money v={KOL.nrvPerUnit!} /></strong> (נתון).
          </p>
          <TraceStepView s={explainNrv(KOL, KOL1)!} />
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>ההפחתה מגדילה את עלות המכר (ולכן מקטינה את הרווח הגולמי).</li>
            <li>בשיטה תקופתית — היא &quot;מגולמת&quot;: מלאי הסגירה פשוט נרשם ב-<Money v={KOL1.closingCarrying} />.</li>
            <li>
              בשיטה תמידית — פקודה: ח&apos; עלות המכר <Money v={KOL1.writeDown} plain /> / ז&apos; מלאי <Money v={KOL1.writeDown} plain />.
            </li>
          </ul>
        </Card>
        <Card title="שנה אחרי: ביטול הורדת הערך">
          <p>
            הרמקולים עדיין במלאי. אם שווי המימוש נטו עלה ל-155 ₪: הערך בספרים = הנמוך בין העלות ({KOL_UNIT}) לשווי מימוש נטו (155) ← <Money v={KOL155.closingCarrying} />. מבטלים{" "}
            <Money v={KOL155.reversal} /> — עד גובה ההורדה המקורית, ולא יותר. הביטול מקטין את עלות המכר.
          </p>
          <p>
            ואם שווי המימוש נטו עלה ל-170 ₪? עדיין <Money v={KOL170.closingCarrying} /> — לא עולים מעל העלות. רווח צפוי לא נרשם.
          </p>
        </Card>
        <Callout kind="tip" title="שווי מימוש נטו ≠ שווי הוגן">
          <p>אם השאלה נותנת גם &quot;שווי הוגן&quot; (מחיר בשוק) — זה מסיח. משווים לעלות רק את שווי המימוש נטו של החברה.</p>
        </Callout>
        <p>
          את הבדיקה עושים לכל קבוצת פריטים דומים יחד (יחידות × שווי מימוש נטו ליחידה מול העלות הכוללת), בכל תאריך דוח. חריג: <Term he="חומרי גלם" /> לא יורדים מתחת לעלות אם
          המוצרים הגמורים שבהם ייכללו צפויים להימכר בעלות או מעליה.
        </p>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="kol" label="פתחו את קול במחשבון" />
        </div>
        <Callout kind="warn" title="הורדת הערך — לעלות המכר">
          <p>לא &quot;הוצאה אחרת&quot;. ההורדה מגדילה את עלות המכר ומקטינה את הרווח הגולמי — ובודקים שווי מימוש נטו בכל תאריך דוח.</p>
        </Callout>
        <MiniQuiz
          chapter="nrv"
          items={[
            { q: "עלות 5,000, שווי מימוש נטו 5,600. כמה מלאי בספרים?", options: ["5,000", "5,600", "600", "5,300"], answer: 0, why: "הנמוך מביניהם. רווח צפוי לא נרשם." },
            { q: "הורדת ערך של 300 בוטלה בשנה הבאה, ושווי המימוש נטו עלה ב-500 מעל הערך בספרים. כמה מבטלים?", options: ["500", "300", "0", "200"], answer: 1, why: "הביטול חסום בגובה ההורדה המקורית — עד העלות." },
          ]}
        />
      </Chapter>

      <Chapter n={11} id="inv-count" title="מה נספר כמלאי?" lead="לא כל מה שבמחסן שלנו — ולא כל מה שלנו נמצא במחסן">
        <DataTable
          head={["מצב", "מלאי שלנו?"]}
          rows={[
            ["במחסני החברה", "כן — אלא אם כבר נמכר (מכור והחזק)"],
            ["מלאי בדרך, כשהסיכון כבר עבר אלינו", "כן"],
            ["מלאי בדרך, כשהסיכון עדיין אצל הספק", "לא (אם שולם — מקדמה לספקים)"],
            ["משגור (קונסיגנציה) שמסרנו לסוכן או לרשת", "כן — עד המכירה ללקוח הסופי"],
            ["מכור והחזק — נמכר, ארוז בנפרד, האחריות עברה ללקוח", "לא — המכירה הוכרה"],
            ["דוגמיות וקטלוגים לחלוקה חינם", "לא — הוצאה"],
            ["מלאי איטי או מת", "כן — זו שאלה של שווי מימוש נטו, לא של סיווג"],
          ]}
        />
        <SortQuiz
          id="count-sort"
          title="בוחן סיווג: שלנו או לא?"
          options={[
            ["ours", "מלאי שלנו"],
            ["not", "לא מלאי שלנו"],
          ]}
          items={COUNT_ITEMS}
        />
        <CountBridge rows={COUNT_BRIDGE} />
        <Callout kind="tip" title="השאלה שפותרת הכול">
          <p>של מי הסיכון, ומי יספוג את ההפסד אם הסחורה תיהרס? מי שהסיכון עליו — המלאי שלו.</p>
        </Callout>
        <MiniQuiz
          chapter="count"
          items={[
            { q: "מלאי במשגור אצל סוכן, שטרם נמכר. מלאי של מי?", options: ["של הסוכן", "שלנו", "של הלקוח", "של אף אחד"], answer: 1, why: "הבעלות עוברת רק במכירה ללקוח הסופי." },
            { q: "מכור והחזק — האם נכלל במלאי שלנו?", options: ["כן, הוא במחסן", "לא, הוא כבר של הלקוח"], answer: 1, why: "המכירה הוכרה והעלות עברה לעלות המכר." },
          ]}
        />
      </Chapter>

      <Chapter n={12} id="inv-unknowns" title="חילוץ נעלמים: שמונה תבניות" lead="מחפשים משוואה אחת עם נעלם אחד">
        <p>
          כל שאלת נעלמים נשענת על אותו רעיון: יש משוואה שכל המספרים בה ידועים חוץ מאחד — ואז אפשר לחלץ אותו. העבודה היא לזהות איזו משוואה מתאימה. לשם כך יש שמונה
          תבניות שחוזרות בבחינות.
        </p>
        <Card title="עץ זיהוי: מה נתון, ומה חסר?">
          <p className="text-sm text-fg/90">
            קוראים את הרשימה מלמעלה למטה ועוצרים ב<strong>התאמה הראשונה</strong> — השורה הראשונה שמתארת את השאלה שלכם. היא אומרת באיזו תבנית להשתמש. אם אף שורה לא
            מתאימה עד הסוף, כנראה שיש בשאלה כמה נעלמים — פותרים קודם את זה שמתאים, ואז חוזרים לרשימה.
          </p>
          <ul className="space-y-1.5 text-sm">
            <li>דוח עם סימני שאלה, כמה שנים ← תבנית 1.</li>
            <li>חסרה כמות מכירה ← עלותה ידועה (ממוצע נע): תבנית 2 · כמות הסגירה ידועה: תבנית 3.</li>
            <li>חסר מחיר מכירה, ונתון שיעור גולמי ← תבנית 4.</li>
            <li>חסר מלאי סגירה (או נשרף) ונתון שיעור גולמי ← תבנית 5.</li>
            <li>חסר מחיר רכישה, ונתונה עלות ממוצעת ← תבנית 6.</li>
            <li>חסר שיעור הנחה, ונתונה הנחה בשקלים ← תבנית 7.</li>
            <li>&quot;נמכר p% מהקניות&quot;, &quot;הכפילה&quot;, &quot;גדל ב-X%&quot; ← תבנית 8.</li>
          </ul>
        </Card>
        <Card title="תבנית 1 במילים פשוטות: שרשרת המשוואות">
          <p>
            דוח הרווח הגולמי בנוי מארבע משוואות שמחוברות זו לזו כמו חוליות בשרשרת: מכירות נטו, קניות נטו, עלות המכר ורווח גולמי. כל חוליה משתמשת במספרים של חוליה אחרת.
            כשבחוליה אחת חסר רק מספר אחד — מחלצים אותו, והוא &quot;פותח&quot; את החוליה הבאה. ממשיכים כך עד שהטבלה מלאה. זו &quot;שרשרת המשוואות&quot;.
          </p>
          <p>
            והחוליה שמחברת בין השנים: <strong>פתיחה(t) = סגירה(t−1)</strong>. האות t היא השנה שאנחנו פותרים עכשיו, ו-t−1 היא השנה שלפניה. במילים: מלאי הפתיחה של השנה הזו
            הוא בדיוק מלאי הסגירה של השנה הקודמת — מה שעמד במחסן ב-31.12 הוא מה שעומד בו ב-1.1.
          </p>
          <FlowStrip
            boxes={[
              { label: `מלאי סגירה 31.12.${DAF.years[0].label} (t−1)`, value: `${DAF_CLOSE.toLocaleString("he-IL")} ₪` },
              { label: "עובר שנה", value: "" },
              { label: `מלאי פתיחה 1.1.${DAF.years[1].label} (t)`, value: `${DAF_CLOSE.toLocaleString("he-IL")} ₪`, tone: "accent" },
            ]}
          />
          <p className="text-sm text-muted">את השרשרת המלאה, צעד אחר צעד, ראו בטבלה של &quot;דף&quot; בפרק 4.</p>
        </Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Pattern
            n={2}
            unknown="כמות מכירה (ממוצע נע)"
            given="עלות המכירה הזו בשקלים"
            tool="כמות = עלות המכירה ÷ הממוצע שלפני המכירה"
            calc="or"
            story={<>מלאי נע. ב-10.1 נקנו 600 יח׳ ב-20 ₪ וב-10.2 עוד 400 יח׳ ב-25 ₪. ב-1.3 נמכרה כמות לא ידועה, ועלות המכירה הייתה <Money v={P_QTY_MA_COST} />. כמה יחידות נמכרו?</>}
            steps={[
              <>הממוצע לפני המכירה: (600 × 20 + 400 × 25) ÷ (600 + 400) = <strong>{qn(QTY_AVG)}</strong> ₪ ליחידה.</>,
              <>בממוצע נע כל יחידה יוצאת בממוצע הזה. אז עלות המכירה = כמות × {qn(QTY_AVG)}.</>,
              <>
                כמות = <Money v={P_QTY_MA_COST} plain /> ÷ {qn(QTY_AVG)} = <strong>{QTY.values.q}</strong> יחידות.
              </>,
            ]}
          />
          <Pattern
            n={3}
            unknown="כמות המכירה האחרונה"
            given="כמות במלאי הסגירה (מספירה)"
            tool="מה שהיה = מה שיצא + מה שנשאר"
            story={<>במהלך השנה היו זמינות {P_LAST.available.toLocaleString("he-IL")} יח׳ (פתיחה + רכישות). כל המכירות ידועות חוץ מהאחרונה — יחד {P_LAST.otherSales.toLocaleString("he-IL")} יח׳. בספירה בסוף השנה נמצאו {P_LAST.closing} יח׳.</>}
            steps={[
              <>כל יחידה שהייתה זמינה — או שנמכרה, או שעדיין במחסן. אין אפשרות שלישית.</>,
              <>
                <span className="num">
                  {P_LAST.available.toLocaleString("he-IL")} = {P_LAST.otherSales.toLocaleString("he-IL")} + x + {P_LAST.closing}
                </span>
              </>,
              <>
                x = {P_LAST.available.toLocaleString("he-IL")} − {P_LAST.otherSales.toLocaleString("he-IL")} − {P_LAST.closing} = <strong>{lastSaleQty(P_LAST.available, P_LAST.closing, P_LAST.otherSales)}</strong> יח׳ במכירה האחרונה.
              </>,
            ]}
          />
          <Pattern
            n={4}
            unknown="מחיר מכירה"
            given="שיעור רווח גולמי ועלות המכר"
            tool="מכירות = עלות המכר ÷ (1 − שיעור); מחיר = (מכירות − מכירות אחרות) ÷ כמות"
            calc="rimon"
            story={<>עלות המכר {P_PRICE.cogs.toLocaleString("he-IL")} ₪, שיעור הרווח הגולמי {P_PRICE.gp * 100}%. שאר המכירות בשנה הסתכמו ב-{P_PRICE.otherSales.toLocaleString("he-IL")} ₪, ובמכירה אחת של {P_PRICE.qty} יח׳ המחיר חסר.</>}
            steps={[
              <>שיעור גולמי של {P_PRICE.gp * 100}% אומר: מכל שקל של מכירות, {P_PRICE.gp * 100} אגורות רווח ו-{(1 - P_PRICE.gp) * 100} אגורות עלות.</>,
              <>
                לכן המכירות = עלות המכר ÷ {1 - P_PRICE.gp} = {P_PRICE.cogs.toLocaleString("he-IL")} ÷ {1 - P_PRICE.gp} = <strong>{PRICE_SALES.toLocaleString("he-IL")}</strong> ₪.
              </>,
              <>
                מורידים את המכירות הידועות: {PRICE_SALES.toLocaleString("he-IL")} − {P_PRICE.otherSales.toLocaleString("he-IL")} = {(PRICE_SALES - P_PRICE.otherSales).toLocaleString("he-IL")} ₪ — זו המכירה החסרה.
              </>,
              <>
                מחיר ליחידה = {(PRICE_SALES - P_PRICE.otherSales).toLocaleString("he-IL")} ÷ {P_PRICE.qty} = <strong>{(PRICE_SALES - P_PRICE.otherSales) / P_PRICE.qty}</strong> ₪.
              </>,
            ]}
          />
          <Pattern
            n={5}
            unknown="מלאי סגירה / מלאי שנשרף"
            given="שיעור רווח גולמי (שיטה קמעונאית)"
            tool="סגירה = פתיחה + קניות − מכירות × (1 − שיעור)"
            calc="gpfire"
            story={<>אין ספירה (למשל המחסן נשרף). ידוע: מלאי פתיחה {P_RETAIL.opening.toLocaleString("he-IL")} ₪, קניות {P_RETAIL.purchases.toLocaleString("he-IL")} ₪, מכירות {P_RETAIL.netSales.toLocaleString("he-IL")} ₪, ושיעור הרווח הגולמי הרגיל של החברה {P_RETAIL.rate * 100}%.</>}
            steps={[
              <>
                קודם עלות המכר מתוך המכירות: {P_RETAIL.netSales.toLocaleString("he-IL")} × (1 − {P_RETAIL.rate * 100}%) = {(P_RETAIL.netSales * (1 - P_RETAIL.rate)).toLocaleString("he-IL")} ₪.
              </>,
              <>
                מה שהיה זמין: {P_RETAIL.opening.toLocaleString("he-IL")} + {P_RETAIL.purchases.toLocaleString("he-IL")} = {(P_RETAIL.opening + P_RETAIL.purchases).toLocaleString("he-IL")} ₪.
              </>,
              <>
                מה שלא נמכר — נשאר: {(P_RETAIL.opening + P_RETAIL.purchases).toLocaleString("he-IL")} − {(P_RETAIL.netSales * (1 - P_RETAIL.rate)).toLocaleString("he-IL")} = <strong>{RETAIL.closing.toLocaleString("he-IL")}</strong> ₪ מלאי סגירה.
              </>,
              <>בשריפה: אותו חישוב עד תאריך השריפה, ומורידים את מה שניצל. בדוגמת המחשבון יוצא שיפוי נטו של <Money v={FIRE.settlement.net} />.</>,
            ]}
          />
          <Pattern
            n={6}
            unknown="מחיר רכישה"
            given="עלות ממוצעת (ממוצע תקופתי)"
            tool="(עלות ידועה + כמות × x) ÷ כל היחידות = הממוצע"
            calc="aron"
            story={<>מלאי פתיחה {P_AVG.opening!.units} יח׳ בעלות {P_AVG.opening!.cost.toLocaleString("he-IL")} ₪. נקנו {P_AVG.purchases[0].qty} יח׳ במחיר לא ידוע. העלות הממוצעת לשנה: {P_AVG_KNOWN} ₪.</>}
            steps={[
              <>
                סך היחידות: {P_AVG.opening!.units} + {P_AVG.purchases[0].qty} = {P_AVG.opening!.units + P_AVG.purchases[0].qty}. סך העלות = הממוצע × היחידות = {P_AVG_KNOWN} × {P_AVG.opening!.units + P_AVG.purchases[0].qty} ={" "}
                {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty)).toLocaleString("he-IL")} ₪.
              </>,
              <>
                מזה {P_AVG.opening!.cost.toLocaleString("he-IL")} ₪ של הפתיחה. נשאר לרכישה: {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty) - P_AVG.opening!.cost).toLocaleString("he-IL")} ₪.
              </>,
              <>
                מחיר ליחידה = {(P_AVG_KNOWN * (P_AVG.opening!.units + P_AVG.purchases[0].qty) - P_AVG.opening!.cost).toLocaleString("he-IL")} ÷ {P_AVG.purchases[0].qty} = <strong>{Math.round(AVG_X.values.x * 1e6) / 1e6}</strong> ₪.
              </>,
            ]}
          />
          <Pattern
            n={7}
            unknown="שיעור הנחה"
            given="הנחה בשקלים ברכישה אחת"
            tool="שיעור = הנחה ÷ (כמות × מחיר), ואז אותו שיעור לכל הרכישות שבהסכם"
            calc="galim"
            story={<>הספק נותן אחוז הנחה קבוע שלא נמסר. ידוע רק שברכישה של {P_DISC.qty} יח׳ ב-{P_DISC.unitPrice} ₪ התקבלה הנחה של {P_DISC.amount.toLocaleString("he-IL")} ₪.</>}
            steps={[
              <>מחיר הרכישה לפני הנחה: {P_DISC.qty} × {P_DISC.unitPrice} = {(P_DISC.qty * P_DISC.unitPrice).toLocaleString("he-IL")} ₪.</>,
              <>
                שיעור ההנחה = {P_DISC.amount.toLocaleString("he-IL")} ÷ {(P_DISC.qty * P_DISC.unitPrice).toLocaleString("he-IL")} = <strong>{discountPctFromAmount(P_DISC.amount, P_DISC.qty, P_DISC.unitPrice) * 100}%</strong>.
              </>,
              <>עכשיו מחילים את אותו שיעור על כל שאר הרכישות שההסכם חל עליהן — ובונים להן עלות כרגיל.</>,
            ]}
          />
          <Pattern
            n={8}
            unknown="קניות ומלאי סגירה של שנה קודמת"
            given="נמכר p% מערך הקניות; אין מלאי פתיחה"
            tool="קניות = עלות המכר ÷ p; סגירה = קניות × (1 − p)"
            story={<>חברה שהוקמה השנה מכרה {P_SOLD.p * 100}% מערך מה שקנתה. עלות המכר: {P_SOLD.cogs.toLocaleString("he-IL")} ₪. כמה קנתה, וכמה נשאר?</>}
            steps={[
              <>בלי מלאי פתיחה, כל עלות המכר באה מהקניות: עלות המכר = {P_SOLD.p * 100}% × הקניות.</>,
              <>
                קניות = {P_SOLD.cogs.toLocaleString("he-IL")} ÷ {P_SOLD.p * 100}% = <strong>{purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p).toLocaleString("he-IL")}</strong> ₪.
              </>,
              <>
                מה שלא נמכר נשאר: {purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p).toLocaleString("he-IL")} × {(1 - P_SOLD.p) * 100}% = <strong>{closingFromSoldPct(purchasesFromSoldPct(P_SOLD.cogs, P_SOLD.p), P_SOLD.p).toLocaleString("he-IL")}</strong> ₪ מלאי סגירה.
              </>,
              <>ובאותה משפחה: &quot;הכפילה את הכמות&quot; — כמות השנה הקודמת × 2; &quot;גדל ב-75%&quot; — × 1.75.</>,
            ]}
          />
        </div>
        <Rule>כלל אצבע: מחפשים משוואה אחת עם נעלם אחד. פותרים, מציבים, וממשיכים — עד שאין יותר נעלמים.</Rule>
        <MiniQuiz
          chapter="unknowns"
          items={[
            { q: "עלות המכר 84,000 ושיעור הגולמי 30%. מה המכירות?", options: ["109,200", "120,000", "58,800", "280,000"], answer: 1, why: "84,000 ÷ (1 − 30%) = 120,000." },
            { q: "בממוצע נע: לפני מכירה הממוצע 8 ₪, ועלות המכירה 4,000 ₪. כמה יחידות נמכרו?", options: ["500", "32,000", "400", "אי אפשר לדעת"], answer: 0, why: "4,000 ÷ 8 = 500." },
          ]}
        />
      </Chapter>
    </>
  );
}
