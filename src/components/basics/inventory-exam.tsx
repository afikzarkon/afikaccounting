import { Printer } from "lucide-react";
import { Callout, DataTable } from "@/components/study/blocks";
import { explainPeriod, explainSolve, m, pc } from "@/lib/learn/inventory-explain";
import { GALYAM_GP, galyam, PRACTICE } from "@/lib/learn/inventory-examples";
import { InventoryCalculator } from "./inventory-calculator";
import { AnswerCheck, MiniQuiz, SortQuiz, TryInCalc } from "./inventory-interactive";
import { TraceStepView, TraceView } from "./inventory-trace";
import { PrintButton } from "./print-button";
import { Card, Chapter, Rule } from "./ui";

// Chapter 14's question also supplies the examples for the routine.
const G = galyam();
const GR = G.result;
const q = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });

const STEPS: { title: string; what: string; ex: string; trap: string }[] = [
  { title: "מה מבקשים?", what: "קוראים את ה״נדרש״ ראשון ומסמנים: מלאי סגירה, עלות מכר, רווח גולמי, שיעור, שיפוי, ערך נעלם.", ex: "״חשבו את מחיר המכירה ב-10.3״ — הנעלם הוא מחיר, והכלי כנראה שיעור גולמי.", trap: "לחשב דוח שלם כשביקשו רק מלאי סגירה." },
  { title: "נתונים נוספים — לפני הטבלה", what: "לכל סעיף רושמים: משפיע על עלות רכישה / כמויות / שיטה / שמ״נ / נעלם / עיגול.", ex: "״מכס 6% מהמחיר נטו״ ← עלות רכישה. ״שמ״נ 65 ליחידה״ ← שמ״נ.", trap: "להתחיל לחשב ולגלות באמצע שיש הנחה שמשנה הכול." },
  { title: "שיטה ומערכת רישום", what: "FIFO / ממוצע תקופתי / ממוצע נע — זה קובע את הכלי: שכבות, ממוצע אחד, או טבלת יתרות.", ex: "״ממוצע משוקלל נע״ ← טבלת יתרות עם שורה אחרי כל אירוע.", trap: "לחשב ממוצע תקופתי כשהשאלה אומרת תמידי." },
  { title: "עלות לכל רכישה", what: "טבלת בניית עלות: מחיר · הנחה · מכס · הובלה · טיפול · מימון — ומה נשאר בחוץ.", ex: "אחסון במחסן החברה ומע״מ בר-קיזוז — בחוץ.", trap: "לחשב מכס על המחיר כולל ההובלה." },
  { title: "גלגול כמויות", what: "פתיחה + קניות − מכירות = סגירה, ומתאימים לסיווג: בדרך, משגור, מכור והחזק.", ex: `${q(GR.openingUnits)} + ${q(GR.purchasesUnits)} − ${q(GR.soldUnits)} = ${q(GR.closingUnits)} יחידות.`, trap: "לשכוח שחברה שהוקמה השנה — אין לה מלאי פתיחה." },
  { title: "הערכת סגירה, ואז שמ״נ", what: "מעריכים לפי השיטה, משווים לשמ״נ, ומורידים ערך אם צריך — ההורדה לעלות המכר.", ex: `${q(GR.closingUnits)} × ${q(G.period.nrvPerUnit!)} = ${m(GR.nrvTotal!)} מול עלות ${m(GR.closingCostBasis)} ← הורדה ${m(GR.writeDown)}.`, trap: "להציג את ההורדה כהוצאה אחרת, מחוץ לעלות המכר." },
  { title: "הדוח והתשובה לנדרש", what: "תבנית הדוח עד הגולמי, ואז הנעלמים: משוואה אחת עם נעלם אחד.", ex: `מכירות = ${m(GR.cogs)} ÷ (1 − ${pc(GALYAM_GP)}) = ${m(GR.netSales)}, ומשם המחיר.`, trap: "לחשב שיעור גולמי על העלות." },
  { title: "בדיקות סבירות", what: "פתיחה + קניות = עלות מכר + סגירה (לפני הורדה); ממוצע בין המחיר הנמוך לגבוה; אין יתרה שלילית; שיעור גולמי הגיוני; עיגול כמבוקש.", ex: "רושמים נוסחה לפני המספרים — מקבלים ניקוד על הדרך.", trap: "לעגל באמצע ולצבור טעות." },
];

const PHRASES: [string, string, string][] = [
  ["״הנחה של X% על רכישות מעל N יחידות״", "הנחת כמות באותה רכישה", "״על כל הרכישה״ ← הכול; ״על הכמות שמעל N״ ← רק העודף"],
  ["״אם תמכור מעל N יחידות — הנחה של X% על כל הרכישות״", "יעד מכירות — לא בשליטת החברה", "לא מכירים עד שהושג, גם אם ״צופה לעמוד״"],
  ["״במזומן העלות הייתה נמוכה ב-3%; תנאי אשראי חריגים״", "רכיב מימון", "עלות = מחיר × 0.97; ההפרש — הוצאות מימון"],
  ["״הובלה לכל משלוח / ליחידה / לק״ג״", "רכיב הובלה", "למשלוח = סכום קבוע; ליחידה = × כמות; לק״ג = × משקל × כמות"],
  ["״ארגז של 100 יחידות, הובלה 20 ₪ לארגז״", "הובלה לפי ארגזים", "כמות ÷ 100 × 20"],
  ["״מכס X% מעלות הרכישה נטו״", "מס יבוא שאינו מוחזר", "נכלל; הבסיס — המחיר אחרי הנחה, בלי נלוות"],
  ["״מע״מ ניתן להחזר״", "מס בר-קיזוז", "לא נכלל"],
  ["״אחסון בנמל לפני ההובלה, כי ההובלה בלוח זמנים קבוע״", "אחסון הכרחי", "נכלל (16ב)"],
  ["״אחסון במחסני החברה / חברת האחסון״", "אחסון רגיל", "לא נכלל"],
  ["״שמ״נ ליחידה X״", "בדיקת הנמוך", "יחידות × X מול העלות; ההפרש לעלות המכר"],
  ["״שיעור הרווח הגולמי Y״", "נתון לחילוץ", "עלות המכר = מכירות × (1 − Y)"],
  ["״מכרה 65% מערך הרכישות״", "קשר בין עלות מכר לקניות", "קניות = עלות המכר ÷ 65%"],
  ["״מבוטחת לפי עלות בשיטת X; השתתפות עצמית p%״", "בסיס שיפוי נפרד", "מחשבים מחדש בשיטת הפוליסה, בלי שמ״נ"],
  ["״החברה הוקמה ב-…״", "אין מלאי פתיחה", "לא מחפשים פתיחה"],
  ["״יש לעגל ל… ספרות״", "הוראת עיגול", "מעגלים בסוף, או כפי שנאמר"],
  ["״במשגור אצל…״ / ״הלקוח יאסוף; האחריות עברה״", "משגור / מכור והחזק", "משגור — עדיין שלנו; מכור והחזק — כבר לא"],
];

const TRAPS: [string, string, string][] = [
  ["קניות ≠ עלות המכר", "עלות המכר = פתיחה + קניות − סגירה", "R5"],
  ["שיעור גולמי על העלות", "רווח גולמי ÷ מכירות נטו", "R7"],
  ["הנחות ללקוחות בקניות (או להפך)", "ללקוחות ← מכירות נטו; מספקים ← קניות נטו", "R6"],
  ["מלאי פתיחה לפי העלות המקורית", "הסגירה הקודמת בערך בספרים (אחרי הורדה)", "D4"],
  ["לחפש מלאי פתיחה בחברה חדשה", "הוקמה השנה ← פתיחה אפס", "R9"],
  ["מע״מ בר-קיזוז בעלות", "לא נכלל", "11"],
  ["מכס על המחיר ועל ההובלה", "על המחיר נטו אחרי הנחה בלבד", "11"],
  ["הובלה למשלוח כאילו ליחידה", "למשלוח — סכום אחד לרכישה", "11"],
  ["כל אחסון בעלות", "רק הכרחי לפני שלב נוסף; רגיל — הוצאה", "16(ב)"],
  ["הובלה ללקוח בעלות", "עלות מכירה — הוצאה", "16(ד)"],
  ["הנחת כמות תמיד על כל הרכישה", "לפי הניסוח: כל הרכישה או רק העודף", "11"],
  ["הנחת יעד מכירות נרשמת מראש", "לא בשליטת החברה ← רק כשהושג", "11"],
  ["רכיב מימון בכל אשראי", "רק בתנאי אשראי חריגים לענף", "18"],
  ["ממוצע תקופתי = ממוצע נע", "רק FIFO זהה בשתי המערכות", "25"],
  ["מכירה משנה את הממוצע הנע", "רק קנייה משנה אותו", "25"],
  ["ממוצע תקופתי בלי מלאי הפתיחה", "הפתיחה בסכום וגם בכמות", "25"],
  ["שמ״נ = שווי הוגן; מנכים פרסום", "מחיר − השלמה − מכירה; לא שיווק ופרסום", "6, 28"],
  ["הורדת ערך כ״הוצאה אחרת״", "לעלות המכר", "34"],
  ["ביטול מעל העלות", "עד גובה ההורדה המקורית", "33"],
  ["מלאי בדרך — תמיד של הקונה", "לפי מעבר הסיכון", "—"],
  ["משגור שמסרנו — לא שלנו", "שלנו עד המכירה ללקוח הסופי", "—"],
  ["מכור והחזק — במלאי", "כבר של הלקוח", "—"],
  ["דוגמיות לחלוקה — במלאי", "לא מוחזקות למכירה — הוצאה", "6"],
  ["שיפוי לפי שיטת החברה ועם שמ״נ", "לפי שיטת הפוליסה, בלי שמ״נ, פחות מה שניצל", "R28"],
  ["שריפה באמצע שנה — גלגול לכל השנה", "גלגול רק עד תאריך השריפה", "R27"],
  ["עיגול בכל שלב", "מעגלים בסוף, או לפי ההוראה", "D1"],
  ["״בהכרח״, ״תמיד״ — לקבל כמו שזה", "מחפשים דוגמת נגד", "R33"],
  ["כמות שבורה — טעות", "בשחזור כמויות שבר מותר", "D2"],
];

const TF = [
  { text: "שמ״נ שווה תמיד לשווי הוגן בניכוי עלויות מכירה.", answer: "f", why: "שמ״נ ספציפי לחברה; שווי הוגן הוא מחיר שוק.", ref: "IAS 2.7" },
  { text: "מותר למדוד מלאי בשיטת LIFO.", answer: "f", why: "התקן מתיר רק FIFO או ממוצע משוקלל (וזיהוי ספציפי).", ref: "IAS 2.25" },
  { text: "דוגמיות שמחולקות חינם נכללות במלאי.", answer: "f", why: "לא מוחזקות למכירה.", ref: "IAS 2.6" },
  { text: "עלויות אחסון נכללות בעלות רק אם הן נחוצות לתהליך לפני שלב נוסף.", answer: "t", why: "זה החריג בסעיף 16(ב).", ref: "IAS 2.16(ב)" },
  { text: "מלאי נמדד לפי הגבוה מבין העלות לשמ״נ.", answer: "f", why: "לפי הנמוך.", ref: "IAS 2.9" },
  { text: "אחרי הורדת ערך, בוחנים בכל תקופה אם אפשר לבטל אותה.", answer: "t", why: "בכל תאריך דוח מעריכים מחדש את השמ״נ.", ref: "IAS 2.33" },
  { text: "ביטול הורדת ערך יכול להעלות את המלאי מעל העלות המקורית.", answer: "f", why: "הביטול חסום בגובה ההורדה המקורית.", ref: "IAS 2.33" },
  { text: "בכל רכישה באשראי יש לזהות רכיב מימון.", answer: "f", why: "רק בתנאי אשראי חריגים.", ref: "IAS 2.18" },
  { text: "בעת קניית מלאי, עלותו נזקפת מיד כהוצאה.", answer: "f", why: "היא נכס עד שהמלאי נמכר.", ref: "IAS 2.34" },
  { text: "FIFO תקופתי ו-FIFO תמידי מניבים אותו מלאי סגירה.", answer: "t", why: "בשתיהן נשארות הרכישות האחרונות.", ref: "IAS 2.25" },
  { text: "ממוצע תקופתי וממוצע נע מניבים תמיד אותה עלות מכר.", answer: "f", why: "רק במחיר אחיד; בדרך כלל הן שונות.", ref: "IAS 2.25" },
  { text: "בקביעת שמ״נ מנכים גם עלויות פרסום ושיווק.", answer: "f", why: "בפתרונות הקורס לא מנכים אותן.", ref: "IAS 2.6" },
  { text: "הנחה המותנית ביעד מכירות נרשמת כבר ברכישה אם החברה צופה לעמוד ביעד.", answer: "f", why: "יעד מכירות אינו בשליטה הבלעדית של החברה.", ref: "IAS 2.11" },
  { text: "בממוצע נע, מכירה משנה את העלות הממוצעת ליחידה.", answer: "f", why: "רק קנייה משנה את הממוצע.", ref: "IAS 2.27" },
  { text: "FIFO תקופתי מניב בהכרח רווח גולמי גבוה יותר מממוצע תקופתי.", answer: "f", why: "תלוי במגמת המחירים — ראו פרק 6.", ref: "R33" },
  { text: "מלאי שנמסר בקונסיגנציה אינו מלאי של החברה.", answer: "f", why: "הוא שלה עד המכירה ללקוח הסופי.", ref: "—" },
  { text: "שמ״נ נבחן בכל תאריך דוח כספי.", answer: "t", why: "כך קובע התקן.", ref: "IAS 2.33" },
  { text: "הורדת ערך מלאי מוכרת ברווח או הפסד רק כשהמלאי נמכר.", answer: "f", why: "היא מוכרת מיד, בתקופה שבה התרחשה.", ref: "IAS 2.34" },
  { text: "חברה יכולה להשתמש בנוסחאות עלות שונות לשני סוגי מלאי דומים באופיים ובשימוש.", answer: "f", why: "לאותו סוג מלאי — אותה נוסחה.", ref: "IAS 2.25" },
];

// Chapter 14: the full question, solved by the same code as the calculator.
const G_STEPS = [...explainPeriod(G.period, G.result).filter((s) => s.id !== "statement"), ...explainSolve(G.solved), ...explainPeriod(G.period, G.result).filter((s) => s.id === "statement")];
const ROUTINE: Record<string, string> = { cost: "צעד 4", qty: "צעד 5", value: "צעדים 3 ו-6", nrv: "צעד 6", statement: "צעדים 7–8" };

export function InventoryExamChapters() {
  return (
    <>
      <Chapter n={13} id="inv-exam" title="מדריך פתרון שאלת מבחן" lead="אנטומיה של שאלה, שגרה של שמונה צעדים, ומה כל ביטוי אומר">
        <h3 className="text-lg font-semibold text-fg">אנטומיה של שאלת מלאי</h3>
        <DataTable
          head={["חלק בשאלה", "מה מחפשים", "למה זה חשוב"]}
          rows={[
            ["כותרת", "שם החברה, תאריך הקמה, תחום (יבוא, קמעונאות, ייצור)", "הוקמה השנה ← אין מלאי פתיחה; יבוא ← מכס, הובלה, נמל"],
            ["טבלת נתונים", "רכישות ומכירות לפי תאריך, כמויות, מחירים, סימני ?", "הסדר הכרונולוגי קובע בשיטות תמידיות; ? = נעלם שצריך משוואה"],
            ["נתונים נוספים (ממוספרים)", "הנחות, הובלה, אחסון, מימון, שמ״נ, שיעור גולמי, שיטה, עיגול, ביטוח", "כאן מתחבאות רוב הנקודות — קוראים לפני שמחשבים"],
            ["נדרש", "מה בדיוק לחשב", "קובע איפה עוצרים"],
          ]}
        />
        <p>
          סוגי השאלות שחוזרים: (א) שאלה פתוחה בשני חלקים — הערכת מלאי, ואחר כך נעלם או ביטוח; (ב) סעיף מלאי בתוך גיליון רב-טורי — למשל &quot;עלות מלאי הסגירה 700,000, שמ״נ
          660,000&quot; ← מלאי הסגירה 660,000, וההפרש מוסף לעלות המכר; (ג) שאלות אמריקאיות עם חישוב מאחורי כל היגד; (ד) שאלות תיאורטיות קצרות.
        </p>
        <h3 className="text-lg font-semibold text-fg">שגרת שמונה הצעדים</h3>
        <Rule>מה מבקשים ← נתונים נוספים ← שיטה ← עלות לכל רכישה ← גלגול כמויות ← הערכה ושמ״נ ← דוח ונעלמים ← בדיקות סבירות</Rule>
        <ol className="grid gap-3 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card min-w-0 p-4">
              <p className="font-semibold text-fg">
                <span className="num me-1.5 inline-grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                  {i + 1}
                </span>
                {s.title}
              </p>
              <p className="mt-1.5 text-sm text-fg/90">{s.what}</p>
              <p className="mt-1.5 text-[13px] text-muted">
                <strong className="text-fg/80">דוגמה:</strong> {s.ex}
              </p>
              <p className="mt-1 text-[13px] text-danger">
                <strong>טעות נפוצה:</strong> <span className="text-fg/85">{s.trap}</span>
              </p>
            </li>
          ))}
        </ol>
        <h3 className="text-lg font-semibold text-fg">איך קוראים &quot;נתונים נוספים&quot;</h3>
        <DataTable head={["הביטוי בשאלה", "המשמעות", "הפעולה"]} rows={PHRASES} />
        <Callout kind="tip" title="ניהול זמן וניקוד">
          <ul className="list-inside list-disc space-y-1">
            <li>שאלת מלאי פתוחה שווה בדרך כלל רבע מהמבחן או קצת יותר — אל תיתקעו על סעיף אחד.</li>
            <li>כתבו את הנוסחה לפני המספרים, ורשמו כל הנחה שהנחתם (עיגול, סיווג) — מקבלים ניקוד על היגיון.</li>
            <li>נעלם תוקע? המשיכו בדוח עם תא ריק וחזרו אליו — משוואה אחרת תפתור אותו.</li>
          </ul>
        </Callout>
        <MiniQuiz
          chapter="exam"
          items={[
            { q: "מה קוראים ראשון בשאלת מלאי?", options: ["את טבלת הרכישות", "את ה״נדרש״", "את שם החברה", "את הנתון האחרון"], answer: 1, why: "קודם יודעים מה מחפשים — ואז אוספים רק מה שצריך." },
            { q: "״אם החברה תמכור מעל 5,000 יח' תקבל 15% הנחה״. מה עושים בעת הרכישה?", options: ["מנכים 15%", "לא מנכים", "מנכים חצי", "רושמים הכנסה"], answer: 1, why: "יעד מכירות אינו בשליטת החברה." },
          ]}
        />
      </Chapter>

      <Chapter n={14} id="inv-fullexam" title="שאלה מלאה ברמת בחינה, צעד אחר צעד" lead='חברת "גל-ים" — כל הנושאים בשאלה אחת'>
        <Card title="השאלה">
          <p>חברת &quot;גל-ים&quot; הוקמה ב-1.1.2025 ומנהלת מלאי לפי ממוצע משוקלל נע. שמ״נ ליחידה ב-31.12.2025: 65 ₪. שיעור הרווח הגולמי השנתי: {pc(GALYAM_GP)}.</p>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>ספק א&apos; (חו״ל): 20.1 — 800 יח&apos; ב-60 ₪; 15.4 — 600 יח&apos; ב-64 ₪. הנחה 10% על הכמות שמעל 500 ברכישה — בתוקף עד 30.6.2025. מכס 6% מהמחיר נטו. הובלה ימית 4 ₪ ליחידה. אחסון במחסן החברה 1.5 ₪ ליחידה. מע״מ בר-קיזוז.</li>
            <li>ספק ב&apos; (מקומי), מ-1.7: 10.8 — 500 יח&apos; ב-70 ₪; 5.11 — 300 יח&apos; ב-72 ₪. אשראי &quot;שוטף + 150&quot;, חריג בענף — במזומן המחיר היה נמוך ב-4%. הובלה 2 ₪ ליחידה. הספק מבטיח 12% הנחה אם החברה תמכור השנה מעל 2,500 יח&apos;.</li>
            <li>מכירות: 10.3 — 500 יח&apos; במחיר ?; 20.6 — 700 יח&apos; ב-100 ₪; 30.9 — 600 יח&apos; ב-105 ₪.</li>
          </ul>
          <p className="font-semibold">נדרש: מלאי הסגירה בספרים, עלות המכר, ומחיר המכירה ב-10.3.</p>
        </Card>
        <p>הפתרון שלמטה מופק מאותו קוד שמפעיל את המחשבון. ליד כל צעד — לאיזה צעד בשגרה הוא שייך, ואיזה כלל הוא מפעיל.</p>
        <ol className="space-y-5">
          {G_STEPS.map((s, i) => (
            <li key={s.id + i} className="rounded-xl border border-line bg-surface p-4">
              {ROUTINE[s.id] && <p className="mb-1 text-xs font-semibold text-accent">שגרה: {ROUTINE[s.id]}</p>}
              {s.id.startsWith("solve") && <p className="mb-1 text-xs font-semibold text-accent">שגרה: צעד 7 — הנעלם</p>}
              <TraceStepView s={s} n={i + 1} />
            </li>
          ))}
        </ol>
        <Rule>
          מלאי סגירה בספרים: {m(G.result.closingCarrying)} ₪ · עלות המכר: {m(G.result.cogs)} ₪ · מחיר המכירה ב-10.3: {m(G.solved.values.price)} ₪.
        </Rule>
        <div className="flex flex-wrap gap-2">
          <TryInCalc id="galyam" label="פתחו את השאלה הזו במחשבון" />
        </div>
        <MiniQuiz
          chapter="fullexam"
          items={[
            { q: `למה ההנחה של ספק ב' לא נוכתה מהעלות?`, options: ["כי הרכישה קטנה", "כי היעד הוא יעד מכירות — לא בשליטת החברה", "כי שולם באשראי", "כי זה ספק מקומי"], answer: 1, why: "גם אם החברה צופה לעמוד ביעד — לא מכירים עד שהושג." },
            { q: `למה העלות של ספק ב' היא 96% מהמחיר?`, options: ["הנחת כמות", "רכיב מימון בתנאי אשראי חריגים", "מכס", "שמ״נ"], answer: 1, why: "ההפרש מהמחיר במזומן הוא הוצאות מימון." },
          ]}
        />
      </Chapter>

      <Chapter n={15} id="inv-tools" title="מחשבון, מלכודות ותרגול" lead="פתרו כל שאלה — וראו את הדרך המלאה">
        <section id="inv-calc" className="scroll-mt-32 lg:scroll-mt-24" aria-label="מחשבון מלאי">
          <InventoryCalculator />
        </section>

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">ארגז המלכודות</h3>
          <DataTable head={["מלכודת", "מה עושים", "סעיף"]} rows={TRAPS.map(([a, b, c]) => [`✗ ${a}`, `✓ ${b}`, c])} />
        </div>

        <SortQuiz
          id="tf"
          title="בנק נכון / לא נכון"
          options={[
            ["t", "נכון"],
            ["f", "לא נכון"],
          ]}
          items={TF}
        />

        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">תרגול עצמי</h3>
          <p className="mt-1 text-sm text-muted">פתרו, הזינו את התשובה לבדיקה, ורק אז פתחו את הפתרון. התשובות והפתרונות מחושבים על ידי המנוע.</p>
          <div className="mt-3 divide-y divide-line">
            {PRACTICE.map((x, i) => (
              <details key={x.id} className="group py-3">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                  <span className="num text-accent">{i + 1}.</span>
                  <span className="flex-1">{x.title}</span>
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{x.level}</span>
                </summary>
                <div className="mt-2 space-y-3">
                  {x.prompt.map((p, j) => (
                    <p key={j} className="text-[14.5px] text-fg/90">
                      {p}
                    </p>
                  ))}
                  <p className="text-[13px] text-muted">רמז: {x.hint}</p>
                  {x.answers && <AnswerCheck answers={x.answers()} />}
                  {x.statements && (
                    <SortQuiz
                      id={`pr:${x.id}`}
                      options={[
                        ["t", x.labels![0]],
                        ["f", x.labels![1]],
                      ]}
                      items={x.statements.map((s) => ({ text: s.text, answer: s.answer ? "t" : "f", why: s.why }))}
                    />
                  )}
                  {x.calc && <TryInCalc id={x.calc} label="פתחו במחשבון" />}
                  {x.solution && (
                    <details className="rounded-xl border border-line bg-surface-2/40 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-accent">הציגו פתרון</summary>
                      <div className="mt-3">
                        <TraceView steps={x.solution()} />
                      </div>
                    </details>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>

        <section className="card print-sheet p-5" aria-labelledby="inv-sheet-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="inv-sheet-title" className="text-lg font-semibold text-fg">
              דף סיכום — מלאי
            </h3>
            <PrintButton icon={<Printer className="h-4 w-4" />} />
          </div>
          <div className="mt-3 grid gap-4 text-[13.5px] md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="font-semibold text-fg">נוסחאות</p>
              <p>עלות המכר = מלאי פתיחה + קניות נטו − מלאי סגירה</p>
              <p>רווח גולמי = מכירות נטו − עלות המכר · שיעור = רווח ÷ מכירות נטו</p>
              <p>ממוצע תקופתי = (עלות פתיחה + קניות) ÷ (יח׳ פתיחה + יח׳ שנקנו)</p>
              <p>ממוצע נע = עלות המלאי ÷ יחידות — מתעדכן רק בקנייה</p>
              <p>שמ״נ = מחיר מכירה − עלויות השלמה − עלויות מכירה; מלאי = הנמוך</p>
              <p>קמעונאית: סגירה = פתיחה + קניות − מכירות × (1 − שיעור גולמי)</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-fg">שלוש שיטות במבט אחד</p>
              <p>FIFO — נשארות הרכישות האחרונות; זהה בתקופתי ובתמידי.</p>
              <p>ממוצע תקופתי — ממוצע אחד לשנה; תאריכי המכירות לא משנים.</p>
              <p>ממוצע נע — טבלת יתרות; המכירה לא משנה את הממוצע.</p>
              <p className="pt-1 font-semibold text-fg">שמונה הצעדים</p>
              <p>נדרש · נתונים נוספים · שיטה · עלות לרכישה · כמויות · הערכה ושמ״נ · דוח ונעלמים · בדיקות</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="font-semibold text-fg">עשר המלכודות המובילות</p>
              <ol className="list-inside list-decimal columns-1 gap-6 sm:columns-2">
                {TRAPS.slice(0, 10).map(([a, b]) => (
                  <li key={a}>
                    {a} — {b}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </Chapter>
    </>
  );
}

