import type { ReactNode } from "react";
import { Callout, DataTable } from "@/components/study/blocks";
import { type Entry } from "@/lib/learn/basics";
import { entriesFor, purchaseCost, statement, valuatePeriod } from "@/lib/learn/inventory";
import { explainCosts } from "@/lib/learn/inventory-explain";
import { DAF, DISCOUNT_EXCESS, DISCOUNT_WHOLE, FINANCING, LEHAVA, SHEMESH } from "@/lib/learn/inventory-examples";
import { ROW_LABEL, solveTable, TABLE_ROWS } from "@/lib/learn/inventory-solver";
import { InventoryExamChapters } from "./inventory-exam";
import { type FillData, FormulaLab, MiniQuiz, SoldSlider, SortQuiz, SystemSwitch, TableFill, TryInCalc } from "./inventory-interactive";
import { InventoryMethodChapters } from "./inventory-methods";
import { GrossProfitStatementView, TraceStepView } from "./inventory-trace";
import { Card, Chapter, Money, Rule, Term } from "./ui";

const LEH = valuatePeriod(LEHAVA, "fifo");
const LEH_P = valuatePeriod(LEHAVA, "fifo", { system: "periodic" });
const LEH_T = valuatePeriod(LEHAVA, "fifo", { system: "perpetual" });
const cash = { payable: "מזומן", receivable: "מזומן" } as const;
const SYSTEMS: Record<"periodic" | "perpetual", { entries: Entry[]; groups: number[][] }> = {
  periodic: { entries: entriesFor(LEHAVA, LEH_P, "periodic", cash), groups: [[0], [1], [2]] },
  perpetual: { entries: entriesFor(LEHAVA, LEH_T, "perpetual", cash), groups: [[0], [1, 2], []] },
};

const DAF_R = solveTable(DAF);
const DAF_ROWS = TABLE_ROWS.filter((r) => r !== "gpPct" || DAF.years.some((y) => y.cells.gpPct !== undefined));
const DAF_FILL: FillData = {
  years: DAF.years.map((y) => y.label),
  rows: DAF_ROWS.map((r) => ({ key: r, label: ROW_LABEL[r], pct: r === "gpPct" })),
  // Everything that wasn't asked for and isn't reached by a step is given (a blank discount is a zero).
  given: DAF.years.map((y, t) => DAF_ROWS.map((r) => y.cells[r] !== "?" && !DAF_R.steps.some((s) => s.year === t && s.row === r))),
  values: DAF.years.map((_, t) => DAF_ROWS.map((r) => DAF_R.values[t][r] ?? null)),
  steps: DAF_R.steps.map((s) => ({ year: s.year, row: s.row, equation: s.equation, substitution: s.substitution })),
};

const SHEMESH_R = valuatePeriod(SHEMESH, "fifo");
const WHOLE = purchaseCost(DISCOUNT_WHOLE);
const EXCESS = purchaseCost(DISCOUNT_EXCESS);
const FIN = purchaseCost(FINANCING);

const TERMS: { term: string; def: string; ex: ReactNode; home: "מאזן" | "רווח או הפסד" | "—" }[] = [
  { term: "מלאי", def: "נכס שמוחזק למכירה, בתהליך ייצור למכירה, או חומרים שייצרכו בייצור.", ex: "הערכות שעל המדף בחנות להבה.", home: "מאזן" },
  { term: "מלאי פתיחה", def: "המלאי בתחילת השנה — הסגירה של השנה הקודמת.", ex: "בחברה שהוקמה השנה: אפס.", home: "רווח או הפסד" },
  { term: "קניות", def: "עלות הסחורה שנקנתה השנה (בשיטה תקופתית).", ex: <>10 ערכות × 50 = <Money v={LEH.purchasesCost} /></>, home: "רווח או הפסד" },
  { term: "מלאי סגירה", def: "מה שנשאר בסוף השנה, לפי ספירה והערכה כספית.", ex: <>4 ערכות × 50 = <Money v={LEH.closingCarrying} /></>, home: "מאזן" },
  { term: "עלות המכר", def: "העלות של מה שנמכר בלבד: פתיחה + קניות − סגירה.", ex: <><Money v={LEH.cogs} /> — 6 ערכות</>, home: "רווח או הפסד" },
  { term: "מכירות נטו", def: "מכירות פחות הנחות והחזרות ללקוחות.", ex: <>6 × 150 = <Money v={LEH.netSales} /></>, home: "רווח או הפסד" },
  { term: "רווח גולמי", def: "מכירות נטו פחות עלות המכר.", ex: <Money v={LEH.grossProfit} />, home: "רווח או הפסד" },
  { term: "שיעור רווח גולמי", def: "רווח גולמי ÷ מכירות נטו — מחושב על המכירות, לא על העלות.", ex: <><Money v={LEH.grossProfit} plain /> ÷ <Money v={LEH.netSales} plain /> = {Math.round(LEH.gpPct * 10000) / 100}%</>, home: "—" },
  { term: "עלות", def: "מחיר רכישה, ועוד מה שהביא את המלאי למיקומו ולמצבו, פחות הנחות.", ex: "מחיר + מכס + הובלה פנימה − הנחה.", home: "—" },
  { term: 'שווי מימוש נטו (שמ"נ)', def: "מחיר המכירה הצפוי, פחות עלויות השלמה ועלויות המכירה.", ex: "160 − 10 − 8 = 142 ליחידה.", home: "—" },
  { term: "שווי הוגן", def: "המחיר בעסקה רגילה בין משתתפי שוק — מושג אחר, לא שמ״נ.", ex: "מופיע לפעמים בשאלה כמסיח.", home: "—" },
];

const COST_ITEMS = [
  { text: "מחיר הרכישה מהספק", answer: "in", why: "הבסיס של עלות הרכישה.", ref: "IAS 2.11" },
  { text: "מכס על יבוא, שלא ניתן לקבל בחזרה", answer: "in", why: "מס שאינו ניתן להחזר — חלק מהעלות.", ref: "IAS 2.11" },
  { text: 'מע"מ ששולם לספק וניתן לקיזוז', answer: "out", why: "מס שמוחזר — לא עלות.", ref: "IAS 2.11" },
  { text: "הובלה מהנמל למחסן החברה", answer: "in", why: "הובלה פנימה — מביאה את המלאי למיקומו.", ref: "IAS 2.11" },
  { text: "הובלה מהמחסן ללקוח שקנה", answer: "out", why: "עלות מכירה — הוצאה בתקופה.", ref: "IAS 2.16(ד)" },
  { text: "הנחת כמות שקיבלנו באותה רכישה", answer: "less", why: "הנחות מסחריות מנוכות מהעלות.", ref: "IAS 2.11" },
  { text: "אחסון רגיל של מוצרים גמורים במחסן", answer: "out", why: "אחסון שאינו נחוץ לשלב נוסף — הוצאה.", ref: "IAS 2.16(ב)" },
  { text: "אחסון בנמל המוצא, שחובה בגלל לוח משלוחים", answer: "in", why: "נחוץ בתהליך לפני השלב הבא.", ref: "IAS 2.16(ב)" },
  { text: "בזבוז חריג של חומרים בייצור", answer: "out", why: "בזבוז חריג — הוצאה בתקופה.", ref: "IAS 2.16(א)" },
  { text: "שכר הנהלת החשבונות של החברה", answer: "out", why: "תקורה מנהלתית שלא מביאה את המלאי למצבו.", ref: "IAS 2.16(ג)" },
  { text: "פרסום של המוצר בעיתון", answer: "out", why: "עלות מכירה ושיווק — הוצאה.", ref: "IAS 2.16(ד)" },
  { text: "תוספת המחיר על תשלום דחוי בתנאי אשראי חריגים", answer: "out", why: "רכיב מימון — הוצאות מימון, לא עלות מלאי.", ref: "IAS 2.18" },
];

export function InventoryChapters() {
  return (
    <>
      <Chapter n={1} id="inv-idea" title="הרעיון: מה שלא נמכר — לא הוצאה של השנה" lead="עיקרון ההקבלה, במספרים של חנות קטנה">
        <p>
          חנות הנרות &quot;להבה&quot; קנתה 10 ערכות נרות ב-50 ₪ ליחידה ומכרה 6 מהן ב-150 ₪ ליחידה, הכול במזומן. כמה הרוויחה? יש שתי דרכים לענות — ורק אחת נכונה.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card title="✗ הדרך השגויה" className="border-danger/40">
            <p>
              כל הקניות כהוצאה: מכירות <Money v={LEH.netSales} /> פחות קניות <Money v={LEH.purchasesCost} /> ={" "}
              <strong className="text-danger">
                <Money v={LEH.netSales - LEH.purchasesCost} />
              </strong>
              .
            </p>
            <p className="text-sm text-muted">ארבע ערכות עדיין על המדף, אבל העלות שלהן &quot;נשרפה&quot; השנה. בשנה הבאה, כשיימכרו, ההכנסה תגיע בלי העלות — והרווח שם ינופח.</p>
          </Card>
          <Card title="✓ הדרך הנכונה" className="border-success/40">
            <p>
              רק העלות של מה שנמכר היא הוצאה: 6 × 50 = <Money v={LEH.cogs} />. רווח גולמי: <Money v={LEH.netSales} /> − <Money v={LEH.cogs} /> ={" "}
              <strong className="text-success">
                <Money v={LEH.grossProfit} />
              </strong>
              .
            </p>
            <p className="text-sm text-muted">
              ארבע הערכות שעל המדף (<Money v={LEH.closingCarrying} />) הן <Term he="נכס" /> — מלאי. ההוצאה שלהן תירשם בשנה שבה יימכרו.
            </p>
          </Card>
        </div>
        <p>
          זה <Term he="עיקרון ההקבלה" />: הוצאה נרשמת באותה תקופה שבה נרשמת ההכנסה שהיא שייכת לה. הזיזו את הסליידר וראו איך אותן קניות מתחלקות בין הוצאה לנכס:
        </p>
        <SoldSlider />
        <Rule>עלות המכר = מלאי פתיחה + קניות − מלאי סגירה</Rule>
        <Callout kind="warn" title="קניות ≠ עלות המכר">
          <p>קניות הן מה שנכנס השנה; עלות המכר היא מה שיצא (נמכר). הן שוות רק כשאין מלאי בתחילת השנה ובסופה.</p>
        </Callout>
        <MiniQuiz
          chapter="idea"
          items={[
            { q: "חנות קנתה 20 יחידות ב-10 ₪ ומכרה 15. מה עלות המכר?", options: ["200 ₪", "150 ₪", "50 ₪", "תלוי במחיר המכירה"], answer: 1, why: "רק 15 היחידות שנמכרו: 15 × 10 = 150. חמש היחידות שנשארו הן מלאי (נכס)." },
            { q: "למה סחורה שלא נמכרה נרשמת כנכס ולא כהוצאה?", options: ["כי היא שווה כסף בבנק", "עיקרון ההקבלה: ההוצאה שייכת לשנה שבה תימכר", "כי כך קובעת רשות המסים", "כי היא שולמה במזומן"], answer: 1, why: "ההוצאה נרשמת יחד עם ההכנסה שהיא יוצרת — בשנה שבה הסחורה תימכר." },
          ]}
        />
      </Chapter>

      <Chapter n={2} id="inv-terms" title="אוצר מילים בעשר דקות" lead="כל מונח — הגדרה, מספר, ואיפה הוא גר">
        <p>לפני החישובים — המילים. ליד כל מונח: הגדרה במשפט, דוגמה מחנות להבה, והדוח שבו הוא מופיע.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TERMS.map((t) => (
            <div key={t.term} className="card min-w-0 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-fg">{t.term}</p>
                {t.home !== "—" && <span className={t.home === "מאזן" ? "shrink-0 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg" : "shrink-0 rounded-md bg-fg px-2 py-0.5 text-[11px] font-bold text-surface"}>{t.home}</span>}
              </div>
              <p className="mt-1 text-sm text-fg/85">{t.def}</p>
              <p className="mt-1.5 text-[13px] text-muted">דוגמה: {t.ex}</p>
            </div>
          ))}
        </div>
        <figure className="card p-5" aria-labelledby="two-homes">
          <figcaption id="two-homes" className="mb-3 font-semibold text-fg">
            שני בתים למלאי הסגירה (שיטה תקופתית)
          </figcaption>
          <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border-2 border-accent/50 bg-accent-soft p-4">
              <p className="text-xs font-bold text-accent">מאזן — נכס</p>
              <p className="mt-2 font-semibold text-fg">מלאי סגירה מאזני</p>
              <p className="mt-1 text-sm text-fg/85">מה שבמחסן ב-31.12 — עובר לשנה הבאה.</p>
            </div>
            <div className="grid place-items-center text-center text-sm text-muted">
              <span aria-hidden className="text-2xl">⇄</span>
              <span>אותו סכום, שני חשבונות</span>
            </div>
            <div className="rounded-xl border-2 border-fg/30 bg-surface-2 p-4">
              <p className="text-xs font-bold text-fg">רווח או הפסד — עלות המכר</p>
              <ul className="mt-2 space-y-1 text-sm text-fg">
                <li>+ מלאי פתיחה (חובה)</li>
                <li>+ קניות (חובה)</li>
                <li>− מלאי סגירה רווח או הפסד (זכות — מקטין את ההוצאה)</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">
            <strong>בשנה הבאה:</strong> &quot;מלאי סגירה רווח או הפסד&quot; מתאפס כמו כל חשבון תוצאתי. &quot;מלאי סגירה מאזני&quot; עובר לשנה הבאה, ומשנה שם וסיווג ל&quot;מלאי
            פתיחה&quot; — חשבון תוצאתי בחובה, כמו הקניות.
          </p>
        </figure>
        <Callout kind="warn" title="איזה מהם תוצאתי?">
          <p>&quot;מלאי סגירה רווח או הפסד&quot; ו&quot;מלאי פתיחה&quot; — תוצאתיים. רק &quot;מלאי סגירה מאזני&quot; הוא נכס.</p>
        </Callout>
        <MiniQuiz
          chapter="terms"
          items={[
            { q: "שיעור הרווח הגולמי מחושב כ...", options: ["רווח גולמי ÷ עלות המכר", "רווח גולמי ÷ מכירות נטו", "עלות המכר ÷ מכירות", "מכירות ÷ קניות"], answer: 1, why: "על המכירות (נטו), לא על העלות." },
            { q: "באיזה דוח מופיע 'מלאי פתיחה'?", options: ["במאזן, כנכס", "ברווח או הפסד, בעלות המכר", "בשניהם", "באף אחד"], answer: 1, why: "בשיטה תקופתית מלאי הפתיחה הוא חלק מעלות המכר — חשבון תוצאתי בחובה." },
          ]}
        />
      </Chapter>

      <Chapter n={3} id="inv-systems" title="שתי שיטות רישום: תקופתי ותמידי" lead="מתי מעדכנים את המלאי — ומה נרשם בכל אירוע">
        <p>
          יש שתי דרכים לנהל את המלאי בספרים. ב<Term he="מלאי תקופתי" /> מעדכנים אותו פעם בשנה, לפי ספירה. ב<Term he="מלאי תמידי" /> מעדכנים אותו בכל קנייה ובכל מכירה.
        </p>
        <DataTable
          head={["", "מלאי תקופתי", "מלאי תמידי"]}
          rows={[
            ["מתי מתעדכן המלאי", "בסוף השנה, אחרי ספירה", "בכל קנייה ומכירה"],
            ["בקנייה", "ח' קניות / ז' ספקים (או מזומן)", "ח' מלאי / ז' ספקים (או מזומן)"],
            ["במכירה", "ח' לקוחות / ז' מכירות", "ח' לקוחות / ז' מכירות, ובמקביל ח' עלות המכר / ז' מלאי"],
            ["בסוף השנה", "ח' מלאי סגירה מאזני / ז' מלאי סגירה רווח או הפסד", "אין פקודת התאמה (מלבד הורדת ערך לשמ״נ)"],
            ["יתרון", "פשוט לרישום", "ערך המלאי ידוע בכל רגע"],
            ["חיסרון", "אין מעקב שוטף; עלות המכר ידועה רק בסוף השנה", "צריך לחשב עלות בכל מכירה"],
          ]}
        />
        <p>אותה חנות להבה, באותם שלושה אירועים. החליפו שיטה ועברו בין האירועים:</p>
        <SystemSwitch data={SYSTEMS} />
        <Rule>שיטת הרישום משפיעה על הפקודות. שיטת הערכת העלות (FIFO או ממוצע) משפיעה על המספרים — ב-FIFO הם זהים בשתי השיטות, בממוצע לא.</Rule>
        <Callout kind="tip" title="בשנה הבאה (תקופתי)">
          <p>
            מלאי הסגירה המאזני של להבה (<Money v={LEH.closingCarrying} />) הופך למלאי הפתיחה של השנה הבאה — חשבון תוצאתי בחובה. בסוף השנה הבאה סופרים שוב, ופקודת
            ההתאמה רושמת את הסגירה החדשה.
          </p>
        </Callout>
        <MiniQuiz
          chapter="systems"
          items={[
            { q: "בשיטה תמידית, מה רושמים במכירה בנוסף ל'ח' לקוחות / ז' מכירות'?", options: ["ח' קניות / ז' מלאי", "ח' עלות המכר / ז' מלאי", "ח' מלאי / ז' עלות המכר", "כלום"], answer: 1, why: "בכל מכירה מוציאים את העלות מהמלאי לעלות המכר." },
            { q: "באיזו שיטה יש פקודת 'מלאי סגירה' בסוף השנה?", options: ["תקופתית", "תמידית", "בשתיהן", "באף אחת"], answer: 0, why: "בתקופתית המלאי מתעדכן רק בסוף השנה, דרך פקודת ההתאמה." },
          ]}
        />
      </Chapter>

      <Chapter n={4} id="inv-cogs" title="עלות המכר והדוח עד הרווח הגולמי" lead="התבנית שמופיעה בכל שאלה — וטבלה עם סימני שאלה">
        <p>כך מציגים בקורס את הדוח עד הרווח הגולמי. הנחות והחזרות מלקוחות מקטינות את המכירות; הנחות והחזרות לספקים מקטינות את הקניות.</p>
        <GrossProfitStatementView s={statement(LEH)} caption="חנות להבה — הדוח עד הרווח הגולמי" />
        <Rule>מכירות נטו = מכירות − הנחות והחזרות ללקוחות · קניות נטו = קניות − הנחות והחזרות מספקים · רווח גולמי = מכירות נטו − עלות המכר</Rule>
        <h3 className="text-lg font-semibold text-fg">דוגמה: דוח עם סימני שאלה, שתי שנים</h3>
        <p>
          חברת &quot;דף&quot; הוקמה ב-2024, ולכן מלאי הפתיחה של 2024 הוא אפס. חלק מהתאים חסרים. הכלל: בכל צעד מחפשים משוואה אחת שיש בה נעלם אחד, פותרים — וממשיכים. מלאי
          הסגירה של 2024 הוא מלאי הפתיחה של 2025.
        </p>
        <TableFill data={DAF_FILL} />
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="daf" label="פתחו את הטבלה במחשבון" />
        </div>
        <Callout kind="warn" title="שיעור גולמי — מהמכירות">
          <p>
            ב-2024: רווח גולמי <Money v={DAF_R.values[0].grossProfit!} /> ÷ מכירות נטו <Money v={DAF_R.values[0].netSales!} /> = {Math.round(DAF_R.values[0].gpPct! * 10000) / 100}%. לא
            מחלקים בעלות המכר.
          </p>
        </Callout>
        <MiniQuiz
          chapter="cogs"
          items={[
            { q: "מלאי פתיחה 50, קניות נטו 300, עלות המכר 280. מה מלאי הסגירה?", options: ["30", "70", "230", "630"], answer: 1, why: "סגירה = פתיחה + קניות − עלות המכר = 50 + 300 − 280 = 70." },
            { q: "החזרות לספקים משפיעות על...", options: ["מכירות נטו", "קניות נטו", "מלאי הפתיחה", "שום דבר"], answer: 1, why: "הן מקטינות את הקניות — ודרכן את עלות המכר." },
          ]}
        />
      </Chapter>

      <Chapter n={5} id="inv-cost" title="כמה עולה יחידה? עלות המלאי לפי IAS 2" lead="מה נכנס לעלות, מה נשאר בחוץ, ומה מנוכה">
        <p>
          עלות המלאי = עלויות הרכישה, ועוד עלויות ההמרה (בייצור), ועוד עלויות אחרות <strong>שהתהוו בהבאת המלאי למיקומו ולמצבו הנוכחיים</strong>. המבחן לכל עלות: האם
          היא הביאה את הסחורה לכאן ולמצב הזה?
        </p>
        <DataTable
          head={["פריט", "בעלות?", "סעיף"]}
          rows={[
            ["מחיר רכישה", "✓ נכלל", "11"],
            ["מכס ומסים שאינם ניתנים להחזר", "✓ נכלל", "11"],
            ["הובלה פנימה וטיפול", "✓ נכלל", "11"],
            ['מע"מ בר-קיזוז', "✗ לא", "11"],
            ["הנחות מסחריות, הנחות כמות, החזרים", "✂ מנוכה", "11"],
            ["אחסון הכרחי לפני שלב נוסף", "✓ נכלל", "16(ב)"],
            ["אחסון רגיל", "✗ הוצאה", "16(ב)"],
            ["בזבוז חריג", "✗ הוצאה", "16(א)"],
            ["תקורה מנהלתית", "✗ הוצאה", "16(ג)"],
            ["עלויות מכירה, הובלה ללקוח, פרסום", "✗ הוצאה", "16(ד)"],
            ["רכיב מימון באשראי חריג", "✗ הוצאות מימון", "18"],
          ]}
        />
        <h3 className="text-lg font-semibold text-fg">דוגמה: בניית עלות רכישה מיובאת</h3>
        <p>
          חברת &quot;שמש&quot; מייבאת 2,000 מאווררים ב-80 ₪ ליחידה. הנחת כמות של 10% על כל הרכישה אם הכמות מעל 1,500. מכס 5% מהמחיר נטו (לא ניתן להחזר). הובלה ימית
          3,000 ₪ למשלוח, הובלה מהנמל 2 ₪ ליחידה, אחסון בחנות 1 ₪ ליחידה לחודש, ומע״מ 18% בר-קיזוז.
        </p>
        <TraceStepView s={explainCosts(SHEMESH, SHEMESH_R)} />
        <Rule>
          עלות המאווררים: <Money v={SHEMESH_R.purchasesCost} /> — <Money v={SHEMESH_R.costs[0].perUnit} /> ליחידה. האחסון והמע״מ נשארים מחוץ לעלות.
        </Rule>
        <h3 className="text-lg font-semibold text-fg">שלושה סוגי הנחה</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card title="א. על כל הרכישה">
            <p>&quot;5% הנחה ברכישה של מעל 800 יחידות&quot; — 1,000 יח׳ ב-20 ₪:</p>
            <p>
              הנחה: <Money v={WHOLE.discount} /> · עלות: <Money v={WHOLE.total} />
            </p>
          </Card>
          <Card title="ב. רק על העודף">
            <p>&quot;5% על כל יחידה מעבר ל-800&quot; — אותה רכישה:</p>
            <p>
              הנחה: <Money v={EXCESS.discount} /> · עלות: <Money v={EXCESS.total} />
            </p>
          </Card>
          <Card title="ג. הנחת יעד מצטברת">
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>היעד הושג בפועל? ← מכירים בהנחה.</li>
              <li>אם לא: היעד בשליטה הבלעדית של החברה (למשל יעד רכישות) וגם החברה צופה לעמוד בו? ← מכירים.</li>
              <li>אחרת (למשל יעד מכירות — תלוי בלקוחות) ← לא מכירים עד שהיעד הושג.</li>
            </ol>
          </Card>
        </div>
        <Card title="רכיב מימון (סעיף 18)">
          <p>
            מחיר 100 ₪ בתנאי &quot;שוטף + 150&quot;, כשבענף מקובל לשלם מהר יותר; במזומן המחיר היה 96 ₪. עלות המלאי: <Money v={FIN.total} />. ההפרש — <Money v={FIN.financing} /> —
            הוא הוצאות מימון על פני תקופת האשראי. אם תנאי האשראי רגילים בענף — אין פיצול, והעלות היא 100 ₪.
          </p>
        </Card>
        <SortQuiz
          id="cost-sort"
          title="בוחן: נכלל בעלות, הוצאה, או מנוכה?"
          options={[
            ["in", "נכלל בעלות"],
            ["out", "הוצאה / לא עלות"],
            ["less", "מנוכה מהעלות"],
          ]}
          items={COST_ITEMS}
        />
        <Callout kind="warn" title="מכס — על המחיר נטו">
          <p>כשכתוב &quot;מכס X% מהמחיר נטו&quot; — מחשבים אותו על המחיר אחרי ההנחה, בלי ההובלה ובלי עלויות נלוות.</p>
        </Callout>
        <MiniQuiz
          chapter="cost"
          items={[
            { q: "הספק מבטיח 10% הנחה אם החברה תמכור השנה מעל 5,000 יח', והחברה צופה שתעמוד ביעד. מה עושים בעת הרכישה?", options: ["מנכים 10% מהעלות", "לא מנכים — יעד מכירות אינו בשליטת החברה", "מנכים 5%", "רושמים הכנסה"], answer: 1, why: "יעד שתלוי בגורמים חיצוניים לא מוכר עד שהושג בפועל." },
            { q: "האם מע״מ בר-קיזוז נכלל בעלות המלאי?", options: ["כן", "לא"], answer: 1, why: "מס שניתן להחזר אינו עלות." },
          ]}
        />
      </Chapter>

      <Chapter n={6} id="inv-formulas" title="שלוש נוסחאות עלות: התמונה הגדולה" lead="כשהמחירים משתנים, צריך להחליט איזו יחידה נמכרה">
        <p>
          אם כל היחידות נקנו באותו מחיר — אין שאלה. אבל המחירים משתנים, ואז צריך כלל שאומר מה נמכר ומה נשאר על המדף. התקן מאפשר שלוש דרכים:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <Term he="זיהוי ספציפי" /> — לפריטים ייחודיים שאינם ניתנים להחלפה (למשל רכב מסוים, תכשיט, פרויקט).
          </li>
          <li>
            <Term he="FIFO (נרי״ר)" /> — נכנס ראשון, יוצא ראשון.
          </li>
          <li>
            <Term he="ממוצע משוקלל" /> — תקופתי (ממוצע אחד לשנה) או נע (ממוצע חדש אחרי כל קנייה).
          </li>
        </ul>
        <Rule>LIFO (נכנס אחרון, יוצא ראשון) אסור. ולמלאי בעל אופי ושימוש דומים — אותה נוסחה.</Rule>
        <p>
          חנות האוזניות &quot;צליל&quot;: 1.2 — קנתה 10 יח׳ ב-20 ₪ · 12.3 — מכרה 5 ב-60 ₪ · 10.4 — קנתה 5 ב-30 ₪ · 17.8 — קנתה 6 ב-40 ₪ · 15.9 — מכרה 7 ב-100 ₪. אותם
          נתונים, ארבע דרכי חישוב. שנו את מחירי הרכישה, או הפכו את המגמה:
        </p>
        <FormulaLab />
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="tzlil" label="פתחו את צליל במחשבון" />
        </div>
        <Callout kind="warn" title="אין שיטה ש״תמיד״ נותנת רווח גבוה יותר">
          <p>כשהמחירים עולים, FIFO נותן את הרווח הגולמי הגבוה ביותר; כשהם יורדים — את הנמוך ביותר. טענה עם &quot;בהכרח&quot; על סדר השיטות — לא נכונה.</p>
        </Callout>
        <MiniQuiz
          chapter="formulas"
          items={[
            { q: "איזו נוסחת עלות אסורה לפי IAS 2?", options: ["FIFO", "ממוצע משוקלל", "LIFO", "זיהוי ספציפי"], answer: 2, why: "התקן אינו מתיר LIFO." },
            { q: "המחירים ירדו לאורך השנה. באיזו שיטה הרווח הגולמי הנמוך ביותר?", options: ["FIFO", "ממוצע תקופתי", "ממוצע נע", "בכולן זהה"], answer: 0, why: "ב-FIFO נמכרות קודם היחידות הוותיקות — היקרות — ולכן עלות המכר הגבוהה ביותר." },
          ]}
        />
      </Chapter>

      <InventoryMethodChapters />
      <InventoryExamChapters />
    </>
  );
}
