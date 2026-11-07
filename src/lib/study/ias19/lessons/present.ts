import { amendedYear, assetsInterest, assetsYear, impliedRate, impliedShare, presentation } from "@/lib/learn/ias19";
import { EXAM_B, examB } from "@/lib/learn/ias19-exams";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, lessonRef, pct } from "../shared";
import { CFO_2023, CFO_2024 } from "./amend";
import { PLAN, PLAN_OPENING, PLAN_PER_YEAR, SALES_A_2023, SALES_A_2024, SALES_ASSETS } from "./assets";
import { s14 } from "./dc";
import { CFO_2022 } from "./measure";
import { SALES, SALES_2023, SALES_2024 } from "./rollforward";

/** The worked example: lesson 9's plan, with the grant raised on 1.8 (for past years too) as the rate falls — and the year in the statements. */
export const AMENDED = { newPerYear: 32_000, rateAfter: 0.04, rateEnd: 0.05, month: 7 };
export const AM_YEAR = amendedYear({
  opening: PLAN_OPENING,
  iStart: PLAN.rate,
  iAmend: AMENDED.rateAfter,
  iEnd: AMENDED.rateEnd,
  months: AMENDED.month,
  oldPerYear: PLAN_PER_YEAR,
  newPerYear: AMENDED.newPerYear,
  servedAtStart: 1,
  nEnd: PLAN.n - 1,
});
const periods = [
  { months: AMENDED.month, i: PLAN.rate },
  { months: 12 - AMENDED.month, i: AMENDED.rateAfter },
];
export const AM_ASSETS_PARTS = assetsInterest({ opening: PLAN.assets.opening, periods, contributions: [{ amount: PLAN.assets.contribution, month: PLAN.assets.month }] });
export const AM_ASSETS = assetsYear({ opening: PLAN.assets.opening, periods, contributions: [{ amount: PLAN.assets.contribution, month: PLAN.assets.month }], closing: PLAN.assets.closing });
export const AM_EFFECT = presentation({
  service: AM_YEAR.service,
  pastService: AM_YEAR.pastService,
  interestCost: AM_YEAR.interest,
  interestIncome: AM_ASSETS.interest,
  pnObligation: AM_YEAR.pn,
  pnAssets: AM_ASSETS.pn,
  closing: AM_YEAR.closing,
  assets: PLAN.assets.closing,
});

/** "We solve" (b): last year's note of the second exam question, and what it hides. */
export const NOTE = EXAM_B.note;
export const NOTE_X = examB();
export const NOTE_RATE = impliedRate(NOTE.interestLast, NOTE.openingLast);
export const NOTE_FROM_ASSETS = impliedShare(NOTE.paidFromAssetsLast, NOTE.paidLast);
export const NOTE_PAYROLL = EXAM_B.grades.map((g) => ({ id: g.id, heads: g.headsLastMid, salary: g.salaryLast }));
export const NOTE_CONTRIBUTION = impliedShare(NOTE.contributionLast, NOTE_X.payrollLast);
export const NOTE_ADDED = impliedShare(NOTE.pastServiceLast, NOTE_X.beforeLast);

/** The exercise: one company's three plans — the sales team (defined benefit with a fund), production workers (section 14) and the CFO — in its statements for two years. */
export const STATEMENTS = (() => {
  const year = (y: 2023 | 2024) => {
    const sales = y === 2023 ? SALES_2023 : SALES_2024;
    const fund = y === 2023 ? SALES_A_2023 : SALES_A_2024;
    const cfo = y === 2023 ? { ...CFO_2023, pastService: 0 } : CFO_2024;
    const cfoOpening = y === 2023 ? CFO_2022 : CFO_2023.closing;
    const fundClosing = y === 2023 ? SALES_ASSETS.y2023.closing : SALES_ASSETS.y2024.closing;
    return {
      production: s14(y),
      selling: sales.service,
      admin: cfo.service + cfo.pastService,
      finance: sales.interest - fund.interest + cfo.interest,
      oci: -sales.pn + fund.pn - cfo.pn,
      obligation: sales.closing + cfo.closing,
      salesClosing: sales.closing,
      cfoClosing: cfo.closing,
      cfoOpening,
      assets: fundClosing,
      net: sales.closing + cfo.closing - fundClosing,
    };
  };
  return { 2023: year(2023), 2024: year(2024) };
})();

const traps: Trap[] = [
  {
    id: "pn-pl",
    prompt: "P.N. של ההתחייבות — הפסד של 9,000 ₪. איפה בדוחות?",
    options: ["OCI", "רווח והפסד, בשכר", "רווח והפסד, במימון", "רק בביאור"],
    answer: 0,
    why: "מדידה מחדש — ב-OCI (סעיף 120), ולא חוזרת לרווח והפסד (סעיף 122).",
    traps: ["", "המלכודת: לרשום P.N. לרווח והפסד.", "במימון — רק הריבית הנטו.", "זו תנועה בהון, לא רק גילוי."],
  },
  {
    id: "gross-interest",
    prompt: "עלות ריבית 4,000 והכנסות ריבית על הנכסים 3,600. מה מציגים ברווח והפסד?",
    options: ["ריבית נטו: הוצאה 400", "הוצאת ריבית 4,000 והכנסת ריבית 3,600, בנפרד", "הכנסה 3,600", "הוצאה 7,600"],
    answer: 0,
    why: "מציגים ריבית נטו (סעיף 123) — בשורה שהמדיניות קובעת.",
    traps: ["", "המלכודת: להציג ברוטו. התקן מבקש נטו.", "אי אפשר להתעלם מעלות הריבית.", "מחברים במקום לקזז."],
  },
  {
    id: "reserve",
    prompt: "נתוני שנה אחת בלבד. אפשר לחשב את יתרת קרן ההון (OCI מצטבר) בסוף השנה?",
    options: ["לא — חסרות השנים הקודמות", "כן — זה ה-OCI של השנה", "כן — זה ה-P.N. של ההתחייבות", "כן — זו ההתחייבות נטו"],
    answer: 0,
    why: "קרן ההון מצטברת מכל השנים; אפשר לחשב רק את התנועה של השנה.",
    traps: ["", "המלכודת: לבלבל בין תנועה ליתרה.", "זה רק חלק מהתנועה.", "זו שורה במאזן, לא קרן הון."],
  },
  {
    id: "rate-with-payments",
    prompt: "בשנה הקודמת שולמו לעובדים 5,000 ₪ ביוני. מותר לחלץ את שיעור ההיוון כעלות ריבית ÷ יתרת פתיחה?",
    options: ["לא — התשלום באמצע השנה שינה את הריבית", "כן, תמיד", "כן, אם התשלום קטן", "רק אם שולם מהקרן"],
    answer: 0,
    why: "החילוץ הפשוט נכון רק כשלא היו תשלומים או שינויים באמצע השנה.",
    traps: ["", "המלכודת: לחלץ בלי לבדוק. התשלום הקטין את הריבית, והשיעור ייצא נמוך מדי.", "גם תשלום קטן משנה את החישוב.", "להתחייבות לא משנה מאיזה כיס."],
  },
  {
    id: "contribution-staff",
    prompt: "ההפקדה של השנה שעברה נעשתה ב-30.6, ובדצמבר פרשו 15 עובדים. על כמה עובדים מחשבים את שיעור ההפקדה?",
    options: ["על כל מי שהועסק ב-30.6 — כולל מי שפרש בדצמבר", "רק על מי שנשאר בסוף השנה", "רק על מי שפרש", "על כל העובדים של השנה הנוכחית"],
    answer: 0,
    why: "ההפקדה חושבה ביום ההפקדה — על כל מי שהועסק אז.",
    traps: ["", "המלכודת: לשכוח את מי שפרש אחרי ההפקדה. השיעור ייצא גבוה מדי.", "הם לא הועסקו ביום ההפקדה של השנה הנוכחית — אבל כן ב-30.6 של השנה שעברה.", "השאלה היא על השנה שעברה."],
  },
  {
    id: "gross-bs",
    prompt: "התחייבות 35,000 ונכסי תכנית 34,500. איך מוצג במאזן?",
    options: ["התחייבות נטו 500", "התחייבות 35,000 ונכס 34,500", "נכס 34,500", "התחייבות 35,000"],
    answer: 0,
    why: "במאזן — שורה אחת, נטו.",
    traps: ["", "המלכודת: להציג ברוטו.", "מתעלמים מההתחייבות.", "מתעלמים מהנכסים."],
  },
];

/** Lesson 10: presentation — each line to profit or loss, OCI or the balance sheet — and reverse engineering last year's note. */
export const PRESENT: StudyModule = {
  slug: "ias19-present",
  course: COURSE,
  n: 10,
  title: "הטבה מוגדרת 6: הצגה בדוחות והנדסה לאחור",
  description: "לכל שורה במעגלים יש כתובת: רווח והפסד, OCI או מאזן. ואז הכיוון ההפוך. מביאור של שנה קודמת מגלים את מה שלא נתנו: שיעור ההיוון, שיעור ההפקדה, חלק הקרן בתשלום והתוספת שניתנה.",
  goal: "לנתב כל שורה במעגלים לרווח והפסד, ל-OCI או למאזן, ולחלץ שיעורים נסתרים מביאור של שנה קודמת.",
  outcomes: [
    "לנתב שירות, שירות עבר וסילוק לשכר, והריבית הנטו לשורה שהמדיניות קובעת",
    "לרכז את ה-P.N. של ההתחייבות ושל הנכסים ב-OCI אחד",
    "להציג התחייבות נטו במאזן",
    "לחלץ שיעור היוון, שיעור הפקדה, חלק הקרן בתשלומים ותוספת להטבה מביאור",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-present-hook", title: "כל שורה לקופסה שלה" },
    { id: "emp-present-three", title: "שלוש כתובות" },
    { id: "emp-present-reverse", title: "הנדסה לאחור: מה הביאור מסתיר" },
    { id: "emp-present-rule", title: "הכלל: ניתוב כל שורה" },
    { id: "emp-present-solved", title: "דוגמה פתורה: התיקון, והדוחות" },
    { id: "emp-present-together", title: "פותרים יחד: מדיניות אחרת, וביאור של שנה קודמת" },
    { id: "emp-present-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("st-production-2023", "דוחות 2023: עלות המכר", `עובדי הייצור (סעיף 14, ${lessonRef("ias19-dc")}) — מה ההוצאה ב-2023, שתוצג בעלות המכר?`, STATEMENTS[2023].production, [`הפקדה מוגדרת: ההוצאה היא ההפקדה — ${fmt(Math.round(STATEMENTS[2023].production))} ₪.`]),
    calc("st-admin-2024", "דוחות 2024: הנהלה וכלליות", `סמנכ״ל הכספים, 2024 (${lessonRef("ias19-amend")}): עלות שירות שוטף ${fmt(Math.round(CFO_2024.service))} ₪, ועלות שירות עבר ${fmt(Math.round(CFO_2024.pastService))} ₪. כמה יוצג בהנהלה וכלליות?`, STATEMENTS[2024].admin, [`שירות שוטף + שירות עבר = ${fmt(Math.round(STATEMENTS[2024].admin))} ₪ — שניהם שכר של המנהל.`]),
    calc("st-finance-2023", "דוחות 2023: מימון נטו", `2023: עלות ריבית של צוות המכירות ${fmt(SALES_2023.interest)}; הכנסות ריבית של הקרן ${fmt(SALES_A_2023.interest)}; עלות ריבית של סמנכ״ל הכספים ${fmt(Math.round(CFO_2023.interest))}. מה הוצאות המימון נטו?`, STATEMENTS[2023].finance, [
      `${fmt(SALES_2023.interest)} − ${fmt(SALES_A_2023.interest)} + ${fmt(Math.round(CFO_2023.interest))} = ${fmt(Math.round(STATEMENTS[2023].finance))} ₪.`,
    ]),
    calc("st-oci-2023", "דוחות 2023: OCI", `2023: P.N. של התחייבות המכירות — הפסד ${fmt(SALES_2023.pn)}; P.N. של הקרן — רווח ${fmt(SALES_A_2023.pn)}; P.N. של סמנכ״ל הכספים — הפסד ${fmt(Math.round(CFO_2023.pn))}. מה ה-OCI נטו? (הפסד — בסכום חיובי)`, -STATEMENTS[2023].oci, [
      `${fmt(SALES_2023.pn)} − ${fmt(SALES_A_2023.pn)} + ${fmt(Math.round(CFO_2023.pn))} = ${fmt(Math.round(-STATEMENTS[2023].oci))} ₪ הפסד.`,
    ]),
    calc("st-oci-2024", "דוחות 2024: OCI", `2024: P.N. של התחייבות המכירות — רווח ${fmt(SALES.y2024.gain)}; P.N. של הקרן — רווח ${fmt(SALES_A_2024.pn)}; P.N. של סמנכ״ל הכספים — הפסד ${fmt(Math.round(CFO_2024.pn))}. מה ה-OCI נטו? (רווח — בסכום חיובי)`, STATEMENTS[2024].oci, [
      `${fmt(SALES.y2024.gain)} + ${fmt(SALES_A_2024.pn)} − ${fmt(Math.round(CFO_2024.pn))} = ${fmt(Math.round(STATEMENTS[2024].oci))} ₪ רווח.`,
    ]),
    calc("st-net-2024", "מאזן 31.12.2024", `31.12.2024: התחייבות צוות המכירות ${fmt(SALES.y2024.closing)}; התחייבות סמנכ״ל הכספים ${fmt(Math.round(CFO_2024.closing))}; נכסי הקרן ${fmt(SALES_ASSETS.y2024.closing)}. מה ההתחייבות נטו במאזן?`, STATEMENTS[2024].net, [
      `${fmt(SALES.y2024.closing)} + ${fmt(Math.round(CFO_2024.closing))} − ${fmt(SALES_ASSETS.y2024.closing)} = ${fmt(Math.round(STATEMENTS[2024].net))} ₪.`,
    ]),
    calc("note-from-assets", "ביאור: חלק הקרן", `בביאור של השנה שעברה (אלפי ₪): הטבות ששולמו ${fmt(NOTE.paidLast)}, מהן מהקרן ${fmt(NOTE.paidFromAssetsLast)}. איזה אחוז מהתשלומים שילמה הקרן? (במספר, למשל 75)`, NOTE_FROM_ASSETS * 100, [`${fmt(NOTE.paidFromAssetsLast)} ÷ ${fmt(NOTE.paidLast)} = ${pct(NOTE_FROM_ASSETS)}.`]),
    choice("where-past", "ניתוב", "לאן הולכת עלות שירות עבר?", ["רווח והפסד, עם עלות השכר", "OCI", "מאזן בלבד", "נפרסת על שנים"], 0, "שירות עבר — לרווח והפסד, בשורת השכר של העובדים."),
    choice("where-cost-of-sales", "ניתוב", "עלות שירות של עובדי ייצור — באיזו שורה?", ["עלות המכר", "הוצאות מכירה ושיווק", "הנהלה וכלליות", "הוצאות מימון"], 0, "שירות — בסעיף השכר של המחלקה: ייצור בעלות המכר."),
  ],
  traps,
  tips: [
    "כל שורה במעגל מגיעה לכתובת אחת: רווח והפסד, OCI או מאזן.",
    "ניתוב: שירות שוטף, שירות עבר וסילוק — לרווח והפסד, בסעיף השכר של המחלקה; ריבית נטו (עלות פחות הכנסה) — לרווח והפסד, מימון או שכר לפי מדיניות; P.N. של התחייבות, של נכסים והשפעת התקרה — OCI, בשורה נטו אחת; היתרות — מאזן, נטו.",
    "הנדסה לאחור: שיעור ההיוון = עלות ריבית ÷ יתרת פתיחה — רק כשלא היו תשלומים או שינוי באמצע השנה, ובלי לעגל.",
    "קרן ההון (OCI מצטבר) אינה ניתנת לחישוב מנתוני שנה אחת; P.N. לא עובר לרווח והפסד בשנים הבאות (סעיף 122).",
  ],
};
