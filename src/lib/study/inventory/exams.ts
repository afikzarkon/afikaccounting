import { MISHAK, mishak, OFEK, ofek } from "@/lib/learn/inventory-exams";
import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "./shared";

const O = ofek();
const [O24, O25] = O.years;
const X = mishak();
const r2 = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number) => Math.round(v * 10000) / 100;

/** Lesson 12: two exam-level questions — each asked, then solved step by step — and their answers to check one by one. */
export const EXAMS: StudyModule = {
  slug: "inventory-exams",
  course: COURSE,
  n: 12,
  title: "שתי שאלות ברמת מבחן",
  description: "שתי שאלות מלאות, כמו במבחן: ״אופק״ — שנתיים בממוצע תקופתי, תיקון פתיחה ושריפה לפי FIFO; ״משחק״ — ערכות ב-FIFO, הנחות לספק וללקוח ושריפה לפי הרווח הגולמי.",
  backHref: COURSE_HREF,
  screens: [
    { id: "iv-ofek", title: "שאלה 1: אופק בע״מ" },
    { id: "iv-ofek-solve", title: "שאלה 1: הפתרון" },
    { id: "iv-mishak", title: "שאלה 2: משחק בע״מ" },
    { id: "iv-mishak-solve", title: "שאלה 2: הפתרון" },
  ],
  exercises: [
    calc("ofek-opening", "אופק: מלאי הפתיחה", "שאלה 1 (אופק): מהו מלאי הפתיחה הנכון ל-1.1.2024?", O.opening.cost, [
      `${OFEK.reported.units} שנספרו − ${OFEK.broken} שבורות + ${OFEK.consigned} במשגור = ${O.opening.units} אופניים.`,
      `× ${fmt(OFEK.reported.unitCost)} = ${fmt(O.opening.cost)} ₪.`,
    ]),
    calc("ofek-avg24", "אופק: ממוצע 2024", "שאלה 1 (אופק): מהי העלות הממוצעת לאופניים ב-2024?", r2(O24.avgCost!), [
      `כל העלות שהייתה זמינה: ${fmt(O24.openingCost)} + ${fmt(O24.purchasesCost)} = ${fmt(O24.availableCost)} ₪.`,
      `חלקי ${fmt(O24.availableUnits)} אופניים = ${fmt(O24.avgCost!)} ₪.`,
    ]),
    calc("ofek-gp24", "אופק: רווח גולמי 2024", "שאלה 1 (אופק): מהו הרווח הגולמי של 2024?", r2(O24.grossProfit), [
      `מכירות נטו: ${fmt(O24.grossSales)} − ${fmt(O24.saleQtyDiscounts)} (הנחות ללקוח) = ${fmt(O24.netSales)} ₪.`,
      `עלות המכר: ${fmt(O24.openingCost)} + ${fmt(O24.purchasesCost)} − ${fmt(O24.closingCarrying)} = ${fmt(O24.cogs)} ₪.`,
      `רווח גולמי: ${fmt(O24.grossProfit)} ₪.`,
    ]),
    calc("ofek-closing25", "אופק: מלאי 31.12.2025", "שאלה 1 (אופק): באיזה סכום יוצג המלאי בדוח על המצב הכספי ליום 31.12.2025?", r2(O25.closingCarrying), [
      `${OFEK.counted2025} במחסן + 100 בדרך (הסיכון כבר על החברה) = ${O25.closingUnits} אופניים.`,
      `בעלות: ${O25.closingUnits} × ${fmt(O25.avgCost!)} = ${fmt(O25.closingCostBasis)}; שווי מימוש נטו: ${O25.closingUnits} × ${fmt(OFEK.nrv[2025])} = ${fmt(O25.nrvTotal!)}.`,
      `הנמוך: ${fmt(O25.closingCarrying)} ₪.`,
    ]),
    calc("ofek-operating", "אופק: רווח תפעולי 2025", "שאלה 1 (אופק): מהו הרווח התפעולי של 2025?", r2(O.operating2025), [
      `רווח גולמי 2025: ${fmt(O25.grossProfit)} ₪.`,
      `מכירה ושיווק: אחסון ${fmt(OFEK.storageMonthly * 12)} + הובלה ללקוחות ${fmt(OFEK.delivery * O.sold2025)} = ${fmt(O.selling2025)} ₪; הנהלה וכלליות ${fmt(OFEK.admin2025)} ₪.`,
      `רווח תפעולי: ${fmt(O.operating2025)} ₪.`,
    ]),
    calc("ofek-claim", "אופק: השיפוי", "שאלה 1 (אופק): כמה ישלם הביטוח בגין השריפה?", r2(O.fire.settlement.net), [
      `לפי FIFO ביום השריפה: ${O.fire.unitsAtFire} אופניים; ${OFEK.consignedAtFire} במשגור לא נשרפו — נשרפו ${O.fire.burnedUnits}, בעלות ${fmt(O.fire.burned)} ₪.`,
      `פחות השתתפות ${OFEK.deductible * 100}%: ${fmt(O.fire.burned - O.fire.settlement.deductible)} ₪ — מעל התקרה.`,
      `שיפוי: ${fmt(O.fire.settlement.net)} ₪.`,
    ]),
    calc("mishak-box", "משחק: עלות ערכה", "שאלה 2 (משחק): מהי העלות של ערכה מהרכישה של 20.7.2025?", X.costs[2].perUnit, [
      `מחיר ערכה: ${MISHAK.box.games} × ${MISHAK.buys[2].game} + ${MISHAK.box.puzzles} × ${MISHAK.buys[2].puzzle} = ${X.boxPrices[2]} ₪.`,
      `${MISHAK.buys[2].boxes} ערכות > ${MISHAK.supplierDiscount.threshold}: הנחה ${MISHAK.supplierDiscount.pct * 100}% — ${fmt(X.boxPrices[2] * (1 - MISHAK.supplierDiscount.pct))} ₪.`,
      `הובלה ימית ${fmt(MISHAK.seaFreight)} ÷ ${MISHAK.buys[2].boxes} = ${MISHAK.seaFreight / MISHAK.buys[2].boxes}; למחסן ${MISHAK.inlandPerBox}. עלות: ${fmt(X.costs[2].perUnit)} ₪.`,
    ]),
    calc("mishak-pct", "משחק: שיעור רווח גולמי", "שאלה 2 (משחק): מהו שיעור הרווח הגולמי של 2025, באחוזים (שתי ספרות אחרי הנקודה)?", pct(X.year.gpPct), [
      `מכירות נטו: ${fmt(X.year.grossSales)} − ${fmt(X.year.saleQtyDiscounts)} = ${fmt(X.year.netSales)} ₪.`,
      `עלות המכר: ${fmt(X.year.purchasesCost)} − ${fmt(X.year.closingCarrying)} = ${fmt(X.year.cogs)} ₪ (כולל הורדת ערך ${fmt(X.year.writeDown)}).`,
      `${fmt(X.year.grossProfit)} ÷ ${fmt(X.year.netSales)} = ${pct(X.year.gpPct)}%.`,
    ]),
    calc("mishak-closing", "משחק: מלאי 31.12.2025", "שאלה 2 (משחק): באיזה סכום יוצג המלאי ליום 31.12.2025?", X.year.closingCarrying, [
      `FIFO: ${X.year.closingUnits} ערכות — 50 מ-1.11 (${fmt(X.costs[3].perUnit)}) ו-40 מ-20.7 (${fmt(X.costs[2].perUnit)}) = ${fmt(X.year.closingCostBasis)} ₪.`,
      `שווי מימוש נטו: ${X.year.closingUnits} × ${MISHAK.nrvPerBox} = ${fmt(X.year.nrvTotal!)} ₪ — הנמוך.`,
    ]),
    calc("mishak-claim", "משחק: השיפוי", "שאלה 2 (משחק): כמה ישלם הביטוח בגין השריפה?", r2(X.fire.settlement.net), [
      `מלאי ביום השריפה: ${fmt(X.year.closingCarrying)} + ${fmt(X.buy2026.total)} − ${fmt(X.sales2026)} × ${100 - X.rate * 100}% = ${fmt(X.fire.atFire)} ₪.`,
      `ניצל: ${fmt(MISHAK.savedAtPrice)} × ${100 - X.rate * 100}% = ${fmt(X.fire.savedCost)} ₪. נשרף: ${fmt(X.fire.burned)} ₪.`,
      `פחות השתתפות קבועה ${fmt(MISHAK.deductible)}: ${fmt(X.fire.settlement.net)} ₪ (מתחת לתקרה).`,
    ]),
    choice(
      "mishak-storage",
      "משחק: אחסון",
      "בשאלה 2, דמי האחסון החודשיים (שכוללים גם משלוח ללקוחות) — איפה הם?",
      ["הוצאות מכירה ושיווק — לא בעלות המלאי", "בעלות כל ערכה", "בעלות המכר", "מנוכים מהמכירות"],
      0,
      "אחסון רגיל ומשלוח ללקוח אינם מביאים את הערכה למקומה ולמצבה — הוצאות התקופה.",
    ),
  ],
  traps: [
    {
      id: "ofek-new-terms",
      prompt: "באופק, ההזמנה של 20.12.2025 (100 אופניים) — איזו הנחה חלה עליה?",
      options: ["אף אחת — ההסכם החדש דורש מעל 250", "5% — ההסכם הישן", "8% — ההסכם החדש", "13% — שתיהן"],
      answer: 0,
      why: "מ-1.7.2025 בתוקף רק ההסכם החדש: 8% ברכישה של מעל 250. 100 אופניים אינן מגיעות לסף.",
      traps: ["", "ההסכם הישן הסתיים ב-30.6.2025.", "המלכודת: 8% רק ברכישה של מעל 250 — כאן 100.", "ההסכמים אינם מצטברים — החדש החליף את הישן."],
    },
    {
      id: "mishak-rate",
      prompt: "במשחק, לפי איזה שיעור רווח גולמי מחשבים את השיפוי?",
      options: ["השיעור של 2025, מעוגל לאחוז שלם", "שיעור של 2026 עד השריפה", "ממוצע של 2025 ו-2026", "שיעור הסימון על העלות"],
      answer: 0,
      why: "הפוליסה: לפי שיעור הרווח הגולמי בשנה שקדמה לשריפה — 2025, מעוגל כפי שהשאלה מורה.",
      traps: ["", "את 2026 עוד אי אפשר לדעת — בגלל זה משתמשים בשנה הקודמת.", "הפוליסה מדברת על שנה אחת.", "שיעור גולמי הוא על המכירות, לא תוספת על העלות."],
    },
  ],
  tips: [
    "מתחילים מה״נדרש״, ומסמנים ליד כל נתון נוסף על מה הוא משפיע.",
    "בונים את דף הפתרון בבלוקים: עלות לכל רכישה, כמויות, הערכה, שווי מימוש נטו, דוח — ורק אז השריפה.",
    "שריפה: עד התאריך בלבד, לפי שיטת הפוליסה, בלי שווי מימוש נטו; מורידים מה שלא נשרף; השתתפות ואז תקרה.",
  ],
};
