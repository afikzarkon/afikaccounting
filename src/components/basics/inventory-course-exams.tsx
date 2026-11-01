import { Bike, Flame, Gift, ShieldCheck } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { dateLabel, purchaseCost, valuatePeriod, type Period } from "@/lib/learn/inventory";
import { MISHAK, mishak, OFEK, OFEK_2026, OFEK_YEARS, ofek } from "@/lib/learn/inventory-exams";
import { m, pc } from "@/lib/learn/inventory-explain";
import { POLICY_AVG, POLICY_FIFO, ROAD, ROAD_FIRE, TWO_RATES } from "@/lib/study/inventory/fire";
import { OPER, OPER_PROFIT, OPER_SELLING } from "@/lib/study/inventory/worksheet";
import { AnswerCheck, MiniQuiz, TryInCalc } from "./inventory-interactive";
import { ChainChips, MoreDialog, Reveal, Sorted, Story } from "./inventory-teach";
import { TraceStepView } from "./inventory-trace";
import { Card, KeyCard, Money, Rule, type Step, Stepper, Wide } from "./ui";

/** Steps or items made on the server and handed to a client component: each needs a key. */
const keyed = (xs: ReactNode[]) => xs.map((x, i) => <Fragment key={i}>{x}</Fragment>);

/** The concept screens of lessons 10–12: fire and insurance, the answer sheet and operating profit, and the two exam-level questions. */

// ---------------------------------------------------------------------------
// Lesson 10.

const twoRates = TWO_RATES.years.map((y) => y.gp / y.sales);
const twoAvg = (twoRates[0] + twoRates[1]) / 2;

// ---------------------------------------------------------------------------
// Lesson 11: the answer sheet, on one small year.

const GAVIA: Period = {
  label: "2025",
  opening: { units: 100, cost: 2_000 },
  purchases: [
    { date: "2025-03-01", qty: 300, unitPrice: 22, label: "רכישה 1.3", extras: [{ category: "freight", label: "הובלה", amount: 300, basis: "per-shipment" }] },
    { date: "2025-08-01", qty: 200, unitPrice: 25, label: "רכישה 1.8", extras: [{ category: "freight", label: "הובלה", amount: 300, basis: "per-shipment" }] },
  ],
  sales: [{ date: "2025-10-01", qty: 450, unitPrice: 40 }],
  nrvPerUnit: 25,
};
const GV = valuatePeriod(GAVIA, "fifo");
const GV_COSTS = GAVIA.purchases.map(purchaseCost);
const lastBuy = GAVIA.purchases[1];

const sheetSteps: Step[] = [
  {
    title: "בלוק א · עלות לכל רכישה",
    body: (
      <>
        <DataTable
          head={["רכישה", "כמות", "מחיר", "הובלה", "עלות", "ליחידה"]}
          rows={GAVIA.purchases.map((p, i) => [p.label!, p.qty, p.unitPrice, 300, GV_COSTS[i].total, GV_COSTS[i].perUnit])}
        />
        <p className="text-[14.5px] text-muted">כאן נכנס כל מה שלמדנו על עלות: הנחות, מכס, הובלות. בסוף הבלוק — עלות ליחידה לכל רכישה.</p>
      </>
    ),
  },
  {
    title: "בלוק ב · כמויות",
    body: (
      <>
        <Rule>
          פתיחה {GV.openingUnits} + קניות {GV.purchasesUnits} − מכירות {GV.soldUnits} = סגירה {GV.closingUnits} יח׳
        </Rule>
        <p className="text-[14.5px] text-muted">כאן נכנסים משגור, מלאי בדרך, יחידות שבורות ונעלמי כמות. לפני שיש כמות סגירה — אין מה להעריך.</p>
      </>
    ),
  },
  {
    title: "בלוק ג · הערכה לפי השיטה (FIFO)",
    body: (
      <>
        <Rule>
          נשארות האחרונות: {GV.closingUnits} × <Money v={GV_COSTS[1].perUnit} plain /> = <Money v={GV.closingCostBasis} />
        </Rule>
        <p className="text-[14.5px] text-muted">
          כל {GV.closingUnits} היחידות מהרכישה של {dateLabel(lastBuy.date)}. בממוצע — ממוצע × כמות; בממוצע נע — היתרה בכרטיס.
        </p>
      </>
    ),
  },
  {
    title: "בלוק ד · שווי מימוש נטו והדוח",
    body: (
      <>
        <p>
          שווי מימוש נטו: {GV.closingUnits} × {GAVIA.nrvPerUnit} = <Money v={GV.nrvTotal!} /> — נמוך מהעלות, הורדה של <Money v={GV.writeDown} />. מלאי סגירה:{" "}
          <Money v={GV.closingCarrying} />.
        </p>
        <DataTable
          head={["", "₪"]}
          rows={[
            ["מכירות", GV.netSales],
            ["מלאי פתיחה", GV.openingCost],
            ["קניות", GV.purchasesCost],
            ["מלאי סגירה", -GV.closingCarrying],
            ["עלות המכר", GV.cogs],
            ["רווח גולמי", GV.grossProfit],
          ]}
        />
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Lesson 12: the two questions.

const O = ofek();
const [O24, O25] = O.years;
const X = mishak();
const d = (iso: string) => dateLabel(iso);
const n = (v: number) => v.toLocaleString("he-IL");

const ofekSteps: Step[] = [
  {
    title: "1. מלאי הפתיחה — מתקנים את הספירה",
    body: (
      <Reveal
        steps={keyed([
          <>
            בדוחות 2023: {OFEK.reported.units} אופניים. השבורות אינן נכס: −{OFEK.broken}. המשגור באילת שלנו: +{OFEK.consigned}.
          </>,
          <>
            {O.opening.units} × {n(OFEK.reported.unitCost)} = <Money v={O.opening.cost} /> — מלאי הפתיחה ל-1.1.2024.
          </>,
        ])}
      />
    ),
  },
  ...O.steps.y24.map((s) => ({ title: `2024 · ${s.title}`, body: <TraceStepView s={s} /> })),
  ...O.steps.y25.map((s) => ({ title: `2025 · ${s.title}`, body: <TraceStepView s={s} /> })),
  {
    title: "2025 · עד הרווח התפעולי",
    body: (
      <DataTable
        head={["", "₪"]}
        rows={[
          ["רווח גולמי", O25.grossProfit],
          [`אחסון (${n(OFEK.storageMonthly)} × 12)`, -OFEK.storageMonthly * 12],
          [`הובלה ללקוחות (${O.sold2025} × ${OFEK.delivery})`, -OFEK.delivery * O.sold2025],
          ["הוצאות מכירה ושיווק", -O.selling2025],
          ["הוצאות הנהלה וכלליות", -OFEK.admin2025],
          ["רווח תפעולי", O.operating2025],
        ]}
      />
    ),
  },
  ...O.steps.fire.map((s) => ({ title: `השריפה · ${s.title}`, body: <TraceStepView s={s} /> })),
];

const mishakSteps: Step[] = [
  {
    title: "1. מחיר ערכה מהתכולה",
    body: (
      <DataTable
        head={["רכישה", "ערכות", "משחק", "פאזל", "מחיר ערכה"]}
        rows={MISHAK.buys.map((b, i) => [d(b.date), b.boxes, b.game, b.puzzle, X.boxPrices[i]])}
        foot={["", "", "", "", `${MISHAK.box.games} × משחק + ${MISHAK.box.puzzles} × פאזל`]}
      />
    ),
  },
  ...X.steps.y25.map((s) => ({ title: `2025 · ${s.title}`, body: <TraceStepView s={s} /> })),
  {
    title: "השריפה · השיעור והנתונים של 2026",
    body: (
      <Reveal
        steps={keyed([
          <>
            שיעור הרווח הגולמי של 2025: {pc(X.year.gpPct)} — מעוגל לאחוז שלם: {pc(X.rate)}.
          </>,
          <>
            הרכישה של {d(MISHAK.buy2026.date)}: {MISHAK.buy2026.boxes} ערכות — לא מעל {MISHAK.supplierDiscount.threshold}, בלי הנחה. עלות: <Money v={X.buy2026.total} />.
          </>,
          <>
            מכירות עד השריפה: {MISHAK.sells2026.map((s) => `${s.boxes} ערכות`).join(" ו-")} ב-{MISHAK.price2026} ₪; רק השנייה מעל {MISHAK.customerDiscount.threshold}. נטו:{" "}
            <Money v={X.sales2026} />.
          </>,
        ])}
      />
    ),
  },
  ...X.steps.fire.map((s) => ({ title: `השריפה · ${s.title}`, body: <TraceStepView s={s} /> })),
];

export const COURSE_EXAM_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------- lesson 10
  "iv-fire-idea": {
    lead: "בשריפה, הביטוח משלם על עלות המלאי שנשרף. כדי לדעת כמה נשרף, מגלגלים את המלאי עד יום השריפה — ומורידים את מה שניצל.",
    body: (
      <>
        <Wide>
          <ChainChips items={["מלאי ביום השריפה", "פחות מה שניצל", "= נשרף (התביעה)", "פחות השתתפות עצמית", "עד התקרה = שיפוי"]} />
        </Wide>
        <Story icon={<Flame />} title="המחסן נשרף ב-30.6">
          <p>
            מלאי פתיחה <Money v={ROAD.opening} />, קניות עד השריפה <Money v={ROAD.purchases} />, מכירות עד השריפה <Money v={ROAD.sales} />, שיעור רווח גולמי {ROAD.rate * 100}%.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              עלות המכירות עד השריפה: <Money v={ROAD.sales} plain /> × {100 - ROAD.rate * 100}% = <Money v={ROAD_FIRE.cogs} />.
            </>,
            <>
              במחסן ביום השריפה: <Money v={ROAD.opening} plain /> + <Money v={ROAD.purchases} plain /> − <Money v={ROAD_FIRE.cogs} plain /> = <Money v={ROAD_FIRE.atFire} />.
            </>,
            <>
              ניצל מלאי בעלות <Money v={ROAD.saved} /> — נשרף <Money v={ROAD_FIRE.burned} />.
            </>,
            <>
              השתתפות עצמית {ROAD.deductible * 100}%: הביטוח משלם <Money v={ROAD_FIRE.settlement.net} />.
            </>,
          ])}
        />
        <KeyCard>זו אותה נוסחת עלות המכר — רק שהנעלם הוא מלאי ״הסגירה״ ביום השריפה.</KeyCard>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-fire-idea"
        items={[
          {
            q: "פתיחה 20,000, קניות עד השריפה 50,000, עלות המכירות עד השריפה 45,000. כמה מלאי היה במחסן?",
            options: ["25,000 ₪", "70,000 ₪", "15,000 ₪", "5,000 ₪"],
            answer: 0,
            why: "20,000 + 50,000 − 45,000 = 25,000 ₪.",
          },
          {
            q: "מה סכום התביעה?",
            options: ["עלות המלאי שנשרף", "מחיר המכירה של מה שנשרף", "המלאי ביום השריפה, כולל מה שניצל", "כל הקניות של השנה"],
            answer: 0,
            why: "הביטוח מכסה את עלות מה שנשרף — המלאי ביום השריפה פחות מה שניצל.",
          },
        ]}
      />
    ),
  },
  "iv-fire-gp": {
    lead: "אין ספירה של מה שנשרף — אז מחשבים את עלות המכירות מתוך שיעור הרווח הגולמי: מכירות × (1 − השיעור).",
    body: (
      <>
        <Story icon={<ShieldCheck />} title="״לפי ממוצע שיעור הרווח הגולמי בשנתיים שקדמו״">
          <DataTable
            head={["שנה", "מכירות", "רווח גולמי", "שיעור"]}
            rows={TWO_RATES.years.map((y, i) => [`שנה ${i + 1}`, y.sales, y.gp, pc(twoRates[i])])}
          />
        </Story>
        <Reveal
          steps={keyed([
            <>
              ממוצע: ({pc(twoRates[0])} + {pc(twoRates[1])}) ÷ 2 = {pc(twoAvg)}.
            </>,
            <>
              עלות המכירות עד השריפה: <Money v={TWO_RATES.sales} plain /> × {pc(1 - twoAvg)} = <Money v={TWO_RATES.sales * (1 - twoAvg)} />.
            </>,
            <>
              במחסן: <Money v={TWO_RATES.opening} plain /> + <Money v={TWO_RATES.purchases} plain /> − <Money v={TWO_RATES.sales * (1 - twoAvg)} plain /> ={" "}
              <Money v={TWO_RATES.opening + TWO_RATES.purchases - TWO_RATES.sales * (1 - twoAvg)} />.
            </>,
          ])}
        />
        <KeyCard>השיעור — כפי שהפוליסה קובעת: של השנה הקודמת, או ממוצע של כמה שנים. ממוצע פשוט, אלא אם כתוב אחרת.</KeyCard>
        <MoreDialog label="וגם בלי שריפה?">
          <p>
            אותו חישוב הוא ״השיטה הקמעונאית״ שבתקן: כשאין ספירה, מעריכים את מלאי הסגירה דרך שיעור הרווח הגולמי. הוא מופיע בעיקר בשאלות שריפה וגניבה.
          </p>
        </MoreDialog>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-fire-gp"
        items={[
          {
            q: "מכירות עד השריפה 100,000 ₪, שיעור רווח גולמי 20%. מהי עלות המכירות?",
            options: ["80,000 ₪", "120,000 ₪", "20,000 ₪", "83,333 ₪"],
            answer: 0,
            why: "100,000 × 80% = 80,000 ₪.",
          },
          {
            q: "שיעורי הרווח הגולמי בשנתיים: 30% ו-40%. הפוליסה: ״ממוצע השנתיים״. איזה שיעור?",
            options: ["35%", "40%", "30%", "70%"],
            answer: 0,
            why: "(30% + 40%) ÷ 2 = 35%.",
          },
        ]}
      />
    ),
  },
  "iv-fire-saved": {
    lead: "מה שלא נשרף יורד מהתביעה — בעלות. אם הוא נתון במחיר מכירה, ממירים: × (1 − שיעור הרווח הגולמי).",
    body: (
      <>
        <Wide>
          <Sorted
            columns={[
              {
                title: "יורד מהמלאי ביום השריפה",
                tone: "neutral",
                items: ["מלאי שנשאר בחנות, נתון בעלות — כמו שהוא", "מלאי שנשאר, נתון במחיר מכירה — × (1 − שיעור)", "יחידות שניצלו — × עלות ליחידה", "משגור אצל אחרים — שלנו, אבל לא נשרף"],
              },
              { title: "לא נכנס בכלל", tone: "bad", items: ["רכישות ומכירות אחרי יום השריפה", "שווי מימוש נטו — השיפוי לפי עלות"] },
            ]}
          />
        </Wide>
        <Rule>
          ניצל מלאי במחיר מכירה 10,000 ₪, ושיעור הרווח הגולמי 25%: בעלות — 10,000 × 75% = <Money v={7_500} />.
        </Rule>
        <KeyCard>המלאי במחסן בעלות — ולכן גם מה שמורידים ממנו חייב להיות בעלות. במחיר מכירה מסתתר רווח שלא שייך לחישוב.</KeyCard>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-fire-saved"
        items={[
          {
            q: "ניצלה סחורה שמחיר המכירה שלה 4,000 ₪; שיעור הרווח הגולמי 30%. כמה מורידים?",
            options: ["2,800 ₪", "4,000 ₪", "1,200 ₪", "5,200 ₪"],
            answer: 0,
            why: "4,000 × 70% = 2,800 ₪ — בעלות.",
          },
          {
            q: "ביום השריפה היו לחברה 30 יחידות במשגור אצל חנות. מה עושים?",
            options: ["מורידים אותן — הן לא נשרפו", "מוסיפים אותן לתביעה", "מתעלמים", "מורידים מהקניות"],
            answer: 0,
            why: "הן חלק מהמלאי של החברה ביום השריפה — אבל לא היו במחסן שנשרף.",
          },
        ]}
      />
    ),
  },
  "iv-fire-policy": {
    lead: "הפוליסה קובעת לפי איזו שיטה מחשבים את עלות מה שנשרף — גם אם הספרים בשיטה אחרת. מחשבים מחדש לפיה, עד יום השריפה, ובלי שווי מימוש נטו.",
    body: (
      <>
        <Story icon={<ShieldCheck />} title="ספרים בממוצע, פוליסה ב-FIFO">
          <p>פתיחה 100 יח׳ ב-10 ₪; 1.2 — נקנו 200 ב-12 ₪; 1.3 — נמכרו 250; 1.4 — נקנו 100 ב-13 ₪; 1.5 — הכול נשרף.</p>
        </Story>
        <Wide className="grid gap-3 sm:grid-cols-2">
          <Card title="לפי הפוליסה — FIFO" className="border-success/40">
            <p>
              {POLICY_FIFO.unitsAtFire} יח׳: 100 × 13 + 50 × 12 = <Money v={POLICY_FIFO.burned} />
            </p>
            <p className="text-sm text-muted">זה סכום התביעה.</p>
          </Card>
          <Card title="לפי שיטת הספרים — ממוצע" className="border-danger/40">
            <p>
              {POLICY_AVG.unitsAtFire} × {m(POLICY_AVG.avg ?? 0)} = <Money v={POLICY_AVG.burned} />
            </p>
            <p className="text-sm text-muted">לא רלוונטי לתביעה.</p>
          </Card>
        </Wide>
        <KeyCard>בשאלה שהספרים בה בשיטה אחת והפוליסה בשנייה — בונים את ההיסטוריה פעמיים: פעם לדוחות, ופעם לתביעה.</KeyCard>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="agam" label="שריפה לפי FIFO חוצה שנים — במחשבון" />
        </div>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-fire-policy"
        items={[
          {
            q: "החברה מעריכה מלאי בממוצע תקופתי; הפוליסה: ״לפי עלות בשיטת FIFO״. איך מחשבים את התביעה?",
            options: ["מחדש, ב-FIFO, עד יום השריפה", "לפי הממוצע של הספרים", "לפי שווי מימוש נטו", "ממוצע של שתי השיטות"],
            answer: 0,
            why: "הפוליסה היא חוזה — היא קובעת את בסיס השיפוי.",
          },
          {
            q: "בשנה שלפני השריפה הורד ערך המלאי לשווי מימוש נטו. האם מורידים אותו גם בחישוב התביעה?",
            options: ["לא — התביעה לפי עלות", "כן", "רק ב-FIFO", "רק אם הפוליסה בממוצע"],
            answer: 0,
            why: "שווי מימוש נטו שייך לדוחות. הפוליסה מבטחת עלות.",
          },
        ]}
      />
    ),
  },
  "iv-fire-settle": {
    lead: "מהתביעה יורדת ההשתתפות העצמית, והתוצאה לא עולה על התקרה. מה שלא שופה — הפסד של החברה.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["", "השתתפות באחוזים", "השתתפות קבועה ותקרה"]}
            rows={[
              ["נשרף (התביעה)", 40_000, 60_000],
              ["השתתפות עצמית", "15% — 6,000", "5,000"],
              ["אחרי השתתפות", 34_000, 55_000],
              ["תקרה", "—", 50_000],
              ["שיפוי", 34_000, 50_000],
              ["הפסד שלא שופה", 6_000, 10_000],
            ]}
          />
        </Wide>
        <KeyCard>סדר: קודם השתתפות, אחר כך תקרה — אלא אם השאלה אומרת שהתקרה חלה על התביעה עצמה.</KeyCard>
        <MoreDialog label="ומה עם הקריאה המדויקת?">
          <ul className="list-inside list-disc space-y-1">
            <li>״השתתפות עצמית X% מסכום התביעה״ — אחוז מהנשרף.</li>
            <li>״השתתפות עצמית בסך X ₪ ללא קשר לגובה הנזק״ — סכום קבוע.</li>
            <li>״סכום השיפוי נטו לא יעלה על X״ — התקרה על מה שנשאר אחרי ההשתתפות.</li>
          </ul>
        </MoreDialog>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-fire-settle"
        items={[
          {
            q: "נשרף מלאי בעלות 20,000. השתתפות 10%. מה השיפוי?",
            options: ["18,000 ₪", "20,000 ₪", "2,000 ₪", "22,000 ₪"],
            answer: 0,
            why: "20,000 − 2,000 = 18,000 ₪.",
          },
          {
            q: "נשרף 80,000. השתתפות קבועה 5,000; שיפוי נטו עד 70,000. מה השיפוי?",
            options: ["70,000 ₪", "75,000 ₪", "65,000 ₪", "80,000 ₪"],
            answer: 0,
            why: "80,000 − 5,000 = 75,000 — מעל התקרה, ולכן 70,000.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 11
  "iv-sheet": {
    lead: "כל שאלת מלאי נפתרת על אותו דף, בארבעה בלוקים קבועים: עלות לכל רכישה, כמויות, הערכה לפי השיטה, ושווי מימוש נטו והדוח.",
    body: (
      <>
        <Story icon={<Gift />} title="חנות ״גביע״, 2025 — FIFO">
          <p>
            פתיחה 100 יח׳ בעלות <Money v={2_000} plain /> ₪. 1.3 — נקנו 300 ב-22 ₪; 1.8 — נקנו 200 ב-25 ₪; הובלה 300 ₪ למשלוח. נמכרו 450 ב-40 ₪. שווי מימוש נטו 25 ₪
            ליחידה.
          </p>
        </Story>
        <Stepper label="דף הפתרון · ארבעה בלוקים" steps={sheetSteps} />
        <KeyCard>כל בלוק משתמש בקודם. כשהשאלה ארוכה — הבלוקים הם המפה: כל נתון נוסף שייך לאחד מהם.</KeyCard>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-sheet"
        items={[
          {
            q: "״20 יחידות היו במשגור ולא נספרו״ — לאיזה בלוק זה שייך?",
            options: ["כמויות", "עלות לכל רכישה", "הערכה", "שווי מימוש נטו"],
            answer: 0,
            why: "זה משנה כמה יחידות יש — בלוק הכמויות.",
          },
          {
            q: "״מכס 5% מהמחיר נטו״ — לאיזה בלוק?",
            options: ["עלות לכל רכישה", "כמויות", "הערכה", "הדוח"],
            answer: 0,
            why: "המכס הוא חלק מהעלות של הרכישה.",
          },
        ]}
      />
    ),
  },
  "iv-operating": {
    lead: "כשמבקשים דוח עד הרווח התפעולי, מה שלא נכנס לעלות המלאי לא נעלם — הוא יורד מתחת לרווח הגולמי, כהוצאה תפעולית.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["", "₪"]}
            rows={[
              ["רווח גולמי", OPER.grossProfit],
              ["אחסון במחסני החברה", -OPER.storage],
              ["הובלה ללקוחות", -OPER.delivery],
              ["פרסום", -OPER.advertising],
              ["הוצאות מכירה ושיווק", -OPER_SELLING],
              ["הוצאות הנהלה וכלליות", -OPER.admin],
              ["רווח תפעולי", OPER_PROFIT],
              ["הוצאות מימון (רכיב אשראי)", -OPER.finance],
              ["רווח לפני מס", OPER_PROFIT - OPER.finance],
            ]}
          />
        </Wide>
        <KeyCard>אחסון רגיל והובלה ללקוח — מכירה ושיווק. רכיב מימון מאשראי חריג — הוצאות מימון, מתחת לרווח התפעולי.</KeyCard>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-operating"
        items={[
          {
            q: "הובלה מהמחסן ללקוחות — איפה בדוח?",
            options: ["הוצאות מכירה ושיווק", "עלות המכר", "עלות המלאי", "הוצאות מימון"],
            answer: 0,
            why: "עלות מכירה — הוצאה תפעולית.",
          },
          {
            q: "הפרש בין מחיר באשראי חריג למחיר במזומן — איפה?",
            options: ["הוצאות מימון", "עלות המכר", "הוצאות הנהלה", "מנוכה מהמכירות"],
            answer: 0,
            why: "זה מחיר הכסף — מימון, מתחת לרווח התפעולי.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 12
  "iv-ofek": {
    lead: "שאלה ברמת מבחן. קראו את הנדרש, סמנו ליד כל נתון לאיזה בלוק הוא שייך, ופתרו על דף — לפני שאתם פותחים את הפתרון.",
    body: (
      <>
        <Card title={<span className="flex items-center gap-2"><Bike className="h-5 w-5 text-accent" aria-hidden /> חברת ״אופק״ בע״מ</span>}>
          <div className="space-y-2 text-[14.5px]">
            <p>החברה מייבאת אופניים חשמליים ומעריכה את המלאי לפי ממוצע משוקלל תקופתי. היא מיישמת את IAS 2.</p>
            <p>
              <strong>1.</strong> בדוחות 2023 הוצג מלאי סגירה של {OFEK.reported.units} אופניים × {n(OFEK.reported.unitCost)} ₪. בהכנת הדוחות התברר ש-{OFEK.broken} מהן שבורות ואינן
              ניתנות למכירה, ו-{OFEK.consigned} אופניים שהיו במשגור בחנות באילת לא נספרו (בעלות זהה).
            </p>
            <p>
              <strong>2.</strong> רכישות (מחיר לאופניים):{" "}
              {[...OFEK_YEARS[0].purchases, ...OFEK_YEARS[1].purchases].map((p) => `${d(p.date!)} — ${p.qty} ב-${n(p.unitPrice)}`).join("; ")}.
            </p>
            <p>
              <strong>3.</strong> עד 30.6.2025: הנחה {OFEK.discountOld.pct * 100}% על רכישה של מעל {OFEK.discountOld.threshold} אופניים. מ-1.7.2025 הסכם חדש: הנחה{" "}
              {OFEK.discountNew.pct * 100}% על רכישה של מעל {OFEK.discountNew.threshold}.
            </p>
            <p>
              <strong>4.</strong> מכס {OFEK.duty * 100}% מהמחיר נטו (לא מוחזר); הובלה ימית {n(OFEK.seaFreight)} ₪ למשלוח; הובלה למחסן {OFEK.inland} ₪ לאופניים; מע״מ בר-קיזוז.
              אחסון במחסן {n(OFEK.storageMonthly)} ₪ לחודש; משלוח ללקוח {OFEK.delivery} ₪ לאופניים שנמכרו.
            </p>
            <p>
              <strong>5.</strong> מכירות: {OFEK_YEARS[0].sales.map((s) => `${d(s.date!)} — ${s.qty}`).join("; ")} (2024, ב-{n(OFEK.listPrice[2024])} ₪);{" "}
              {OFEK_YEARS[1].sales.map((s) => `${d(s.date!)} — ${s.qty}`).join("; ")} (2025, ב-{n(OFEK.listPrice[2025])} ₪). לקוח שקונה מעל {OFEK.saleDiscount.threshold} אופניים
              במכירה אחת מקבל {OFEK.saleDiscount.pct * 100}% על כל המכירה.
            </p>
            <p>
              <strong>6.</strong> ההזמנה של 20.12.2025 נשלחה באותו יום והגיעה ב-8.1.2026; לפי ההסכם, הסיכון עובר לחברה כשהסחורה יוצאת ממחסן הספק. בספירה ב-31.12.2025
              נמצאו {OFEK.counted2025} אופניים במחסן.
            </p>
            <p>
              <strong>7.</strong> שווי מימוש נטו לאופניים: {n(OFEK.nrv[2024])} ₪ ב-31.12.2024, {n(OFEK.nrv[2025])} ₪ ב-31.12.2025. הוצאות הנהלה וכלליות ב-2025: {n(OFEK.admin2025)} ₪.
            </p>
            <p>
              <strong>8.</strong> ב-{d(OFEK.fireDate)} נשרף המחסן. מתחילת 2026: {d(OFEK_2026.purchases[0].date!)} — נקנו {OFEK_2026.purchases[0].qty} ב-{n(OFEK_2026.purchases[0].unitPrice)}{" "}
              ₪; {d(OFEK_2026.sales[0].date!)} — נמכרו {OFEK_2026.sales[0].qty}; {d(OFEK_2026.sales[1].date!)} — נמכרו {OFEK_2026.sales[1].qty}. ביום השריפה היו{" "}
              {OFEK.consignedAtFire} אופניים מההזמנה של 20.12.2025 במשגור באילת. הפוליסה: שיפוי לפי עלות בשיטת FIFO, השתתפות עצמית {OFEK.deductible * 100}% מסכום התביעה,
              ושיפוי נטו של עד {n(OFEK.cap)} ₪.
            </p>
            <p className="font-semibold">
              נדרש: (א) מלאי הפתיחה הנכון. (ב) דוח רווח או הפסד עד הרווח הגולמי ל-2024 ו-2025, ועד הרווח התפעולי ל-2025. (ג) המלאי בדוח על המצב הכספי ב-31.12.2024 וב-31.12.2025.
              (ד) סכום השיפוי.
            </p>
          </div>
        </Card>
        <p className="text-[14.5px] text-muted">פתרתם? הזינו תשובות לבדיקה (סטייה של עד חצי שקל נחשבת נכונה):</p>
        <AnswerCheck
          answers={[
            { label: "מלאי פתיחה 2024", value: O.opening.cost, kind: "amount" },
            { label: "רווח גולמי 2024", value: O24.grossProfit, kind: "amount" },
            { label: "מלאי 31.12.2024", value: O24.closingCarrying, kind: "amount" },
            { label: "רווח גולמי 2025", value: O25.grossProfit, kind: "amount" },
            { label: "מלאי 31.12.2025", value: O25.closingCarrying, kind: "amount" },
            { label: "רווח תפעולי 2025", value: O.operating2025, kind: "amount" },
            { label: "שיפוי", value: O.fire.settlement.net, kind: "amount" },
          ]}
        />
      </>
    ),
  },
  "iv-ofek-solve": {
    lead: "הפתרון לפי הבלוקים: הפתיחה, כל שנה (עלות, כמויות, הערכה, שווי מימוש נטו, דוח), הרווח התפעולי — ובסוף השריפה, לפי שיטת הפוליסה.",
    body: (
      <>
        <Stepper label="אופק · הפתרון" steps={ofekSteps} />
        <Rule>
          מלאי 2024: <Money v={O24.closingCarrying} /> · מלאי 2025: <Money v={O25.closingCarrying} /> · רווח תפעולי 2025: <Money v={O.operating2025} /> · שיפוי:{" "}
          <Money v={O.fire.settlement.net} />
        </Rule>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="ofek" label="פתחו את אופק במחשבון" />
        </div>
      </>
    ),
  },
  "iv-mishak": {
    lead: "שאלה שנייה, בשיטה אחרת: ערכות, FIFO, הנחות לספק וללקוח, ושריפה לפי שיעור הרווח הגולמי. נסו לבד לפני הפתרון.",
    body: (
      <>
        <Card title={<span className="flex items-center gap-2"><Gift className="h-5 w-5 text-accent" aria-hidden /> חברת ״משחק״ בע״מ</span>}>
          <div className="space-y-2 text-[14.5px]">
            <p>החברה הוקמה ב-1.1.2025. היא מייבאת ערכות משחק ומוכרת ערכות שלמות בלבד; בכל ערכה {MISHAK.box.games} משחקי קופסה ו-{MISHAK.box.puzzles} פאזלים. המלאי לפי FIFO.</p>
            <DataTable head={["רכישה", "ערכות", "מחיר משחק", "מחיר פאזל"]} rows={MISHAK.buys.map((b) => [d(b.date), b.boxes, b.game, b.puzzle])} />
            <p>
              <strong>1.</strong> הספק נותן {MISHAK.supplierDiscount.pct * 100}% הנחה על רכישה של מעל {MISHAK.supplierDiscount.threshold} ערכות. הובלה ימית {n(MISHAK.seaFreight)} ₪
              למשלוח; הובלה מהנמל למחסן {MISHAK.inlandPerBox} ₪ לערכה.
            </p>
            <p>
              <strong>2.</strong> חברת אחסון גובה {n(MISHAK.storageMonthly)} ₪ לחודש, וכוללת בזה את המשלוח ללקוחות.
            </p>
            <p>
              <strong>3.</strong> מכירות 2025, ב-{MISHAK.price2025} ₪ לערכה: {MISHAK.sells.map((s) => `${d(s.date)} — ${s.boxes}`).join("; ")}. לקוח שקונה מעל{" "}
              {MISHAK.customerDiscount.threshold} ערכות מקבל {MISHAK.customerDiscount.pct * 100}% על כל המכירה.
            </p>
            <p>
              <strong>4.</strong> שווי מימוש נטו לערכה ב-31.12.2025: {MISHAK.nrvPerBox} ₪.
            </p>
            <p>
              <strong>5.</strong> ב-{d(MISHAK.fireDate)} נשרף המחסן. ב-2026: {d(MISHAK.buy2026.date)} — נקנו {MISHAK.buy2026.boxes} ערכות (משחק {MISHAK.buy2026.game}, פאזל{" "}
              {MISHAK.buy2026.puzzle}); מכירות ב-{MISHAK.price2026} ₪: {MISHAK.sells2026.map((s) => `${d(s.date)} — ${s.boxes}`).join("; ")}. בחנות נשארו ערכות שמחיר המכירה שלהן{" "}
              {n(MISHAK.savedAtPrice)} ₪. הפוליסה: לפי שיעור הרווח הגולמי של השנה שקדמה (לעגל לאחוז שלם), השתתפות עצמית {n(MISHAK.deductible)} ₪ ללא קשר לגובה הנזק, ושיפוי נטו
              של עד {n(MISHAK.cap)} ₪.
            </p>
            <p className="font-semibold">
              נדרש: (א) העלות של ערכה בכל רכישה. (ב) שיעור הרווח הגולמי של 2025. (ג) המלאי בדוח על המצב הכספי ב-31.12.2025. (ד) סכום השיפוי.
            </p>
          </div>
        </Card>
        <AnswerCheck
          answers={[
            ...X.costs.map((c, i) => ({ label: `עלות ערכה — ${d(MISHAK.buys[i].date)}`, value: c.perUnit, kind: "amount" as const })),
            { label: "שיעור רווח גולמי 2025", value: X.year.gpPct, kind: "pct" },
            { label: "מלאי 31.12.2025", value: X.year.closingCarrying, kind: "amount" },
            { label: "שיפוי", value: X.fire.settlement.net, kind: "amount" },
          ]}
        />
      </>
    ),
  },
  "iv-mishak-solve": {
    lead: "הפתרון: מחיר ערכה מהתכולה, אחר כך הבלוקים של 2025 — ובסוף השריפה בשיטת הרווח הגולמי, עם ההשתתפות הקבועה.",
    body: (
      <>
        <Stepper label="משחק · הפתרון" steps={mishakSteps} />
        <Rule>
          שיעור רווח גולמי 2025: {pc(X.year.gpPct)} · מלאי 31.12.2025: <Money v={X.year.closingCarrying} /> · שיפוי: <Money v={X.fire.settlement.net} />
        </Rule>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="mishak" label="פתחו את 2025 של משחק במחשבון" />
        </div>
      </>
    ),
  },
};
