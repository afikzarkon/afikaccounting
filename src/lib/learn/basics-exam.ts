/**
 * The basics course's closing exam question: Almog Ltd's preliminary trial
 * balance for 31.12.2025, with three balances to find, and eleven items to
 * adjust or correct — every topic of the course in one question. The answers
 * are computed from the story.
 */
import { type Balances, type Entry, round2 } from "./basics";

const two = (id: string, text: string, dr: string, cr: string, amount: number, why: string): Entry => ({ id, date: "31.12.2025", text, lines: [{ account: dr, dr: amount }, { account: cr, cr: amount }], why });

const INS = { monthly: 4_500, cycleMonths: 24 }; // from 1.1.2020, renewed every two years; recorded as prepaid
const ADS = { paid: 84_000, months: 24, usedIn2024: 8 }; // 1.5.2024–30.4.2026
const RENT = { monthly: 3_000, leftAfter2024: 6 }; // two years from 1.7.2023, not renewed
const SALARY = { recorded: 440_000, months: 11, raise: 0.1 };
const CLEAN = { paid: 36_000, monthsNext: 9 }; // 1.10.2025 for a year, recorded as an expense
const SALE = { cheque: 50_000 }; // part of a sale recorded as cash
const ADVANCE = 60_000; // delivered 20.12.2025, not recorded
const LOAN = { amount: 400_000, halfYearRate: 0.03 }; // from 1.7.2025
const CREDIT = { writeOff: 25_000, specificDebt: 80_000, specificRate: 0.6, generalRate: 0.05 };
const STOCK = { cost: 210_000, nrv: 225_000 };

const insOpening = INS.monthly * 12; // the 2024–2025 cycle, its 2025 half left
const adsMonth = ADS.paid / ADS.months;
const adsOpening = ADS.paid - adsMonth * ADS.usedIn2024;

const given: Balances = {
  מזומן: 520_000,
  לקוחות: 980_000,
  "הפרשה להפסדי אשראי חזויים": -45_000,
  "מלאי פתיחה": 160_000,
  קניות: 1_450_000,
  ציוד: 300_000,
  "הוצאות שכירות מראש": RENT.monthly * RENT.leftAfter2024,
  "הוצאות שכירות": 21_000,
  "הוצאות שכר": SALARY.recorded,
  "הוצאות ניקיון": CLEAN.paid,
  מכירות: -2_600_000,
  "מקדמות מלקוחות": -ADVANCE,
  ספקים: -310_000,
  "הלוואה שהתקבלה": -LOAN.amount,
  "הון מניות": -500_000,
};
const withUnknowns: Balances = { ...given, "הוצאות ביטוח מראש": insOpening, "הוצאות פרסום מראש": adsOpening };
const retainedOpening = -Object.values(withUnknowns).reduce((s, v) => s + v, 0);

const customersAfter = given["לקוחות"] + SALE.cheque - CREDIT.writeOff;
const required = round2(CREDIT.specificDebt * CREDIT.specificRate + (customersAfter - CREDIT.specificDebt) * CREDIT.generalRate);
const allowanceAfterWriteOff = -given["הפרשה להפסדי אשראי חזויים"] - CREDIT.writeOff;

export const ALMOG = {
  name: "אלמוג בע״מ",
  date: "31.12.2025",
  /** The trial balance as the question gives it: three balances missing. */
  given,
  unknowns: ["הוצאות ביטוח מראש", "הוצאות פרסום מראש", "עודפים"] as const,
  /** The preliminary trial balance with the three found. */
  preliminary: { ...withUnknowns, עודפים: retainedOpening } as Balances,
  found: { insurance: insOpening, ads: adsOpening, retained: -retainedOpening },
  story: [
    `ביטוח: מיום ההקמה, 1.1.2020, החברה משלמת מראש על ביטוח לשנתיים — ${INS.monthly.toLocaleString("en-US")} ₪ לחודש — ורושמת את התשלום כ״מראש״. החוזה מתחדש בכל פעם שהוא נגמר.`,
    `פרסום: חוזה מ-1.5.2024 עד 30.4.2026, ששולמו עליו ${ADS.paid.toLocaleString("en-US")} ₪ ונרשמו כ״מראש״.`,
    "שכירות: חוזה לשנתיים מ-1.7.2023, ששולם מראש ולא חודש. מ-1.7.2025 המשרד החדש משולם כל חודש ונרשם כהוצאה.",
    `שכר: ינואר עד נובמבר נרשמו. מדצמבר השכר עלה ב-${SALARY.raise * 100}%, ושכר דצמבר ישולם ב-10.1.2026.`,
    `ניקיון: ב-1.10.2025 שולמו ${CLEAN.paid.toLocaleString("en-US")} ₪ על שנה, ונרשמו כהוצאה.`,
    `ב-1.12.2025 נמכרה סחורה ב-120,000 ₪: 70,000 במזומן ו-${SALE.cheque.toLocaleString("en-US")} בצ׳ק דחוי ל-1.3.2026. נרשם: ח׳ מזומן / ז׳ מכירות 120,000.`,
    `המקדמה (${ADVANCE.toLocaleString("en-US")} ₪) התקבלה ב-15.11.2025. הסחורה סופקה ב-20.12.2025, ולא נרשם דבר.`,
    `ההלוואה נלקחה ב-1.7.2025, בריבית חצי שנתית של ${LOAN.halfYearRate * 100}% שתשולם עם הקרן ב-30.6.2027.`,
    `ב-31.12.2025 התברר שחוב של ${CREDIT.writeOff.toLocaleString("en-US")} ₪ אבוד, וטרם נמחק.`,
    `ההפרשה: ${CREDIT.specificRate * 100}% על לקוח שחייב ${CREDIT.specificDebt.toLocaleString("en-US")} ₪, ו-${CREDIT.generalRate * 100}% על שאר הלקוחות.`,
    `מלאי הסגירה: עלות ${STOCK.cost.toLocaleString("en-US")} ₪, שווי מימוש נטו ${STOCK.nrv.toLocaleString("en-US")} ₪.`,
  ],
  /** The adjustments and corrections, in the order the story tells them — the correction to customers comes before the allowance. */
  entries: [
    two("1", "ביטוח: 12 החודשים של 2025", "הוצאות ביטוח", "הוצאות ביטוח מראש", insOpening, `המחזורים: 2020–21, 2022–23, 2024–25. ב-1.1.2024 שולמו ${(INS.monthly * INS.cycleMonths).toLocaleString("en-US")}; אחרי 2024 נשארו ${insOpening.toLocaleString("en-US")} — וכולם שייכים ל-2025. המחזור נגמר, והיתרה מתאפסת.`),
    two("2", "פרסום: 12 החודשים של 2025", "הוצאות פרסום", "הוצאות פרסום מראש", adsMonth * 12, `${adsMonth.toLocaleString("en-US")} לחודש × 12. נשארים ${(adsOpening - adsMonth * 12).toLocaleString("en-US")} — ינואר עד אפריל 2026.`),
    two("3", "שכירות: החוזה שנגמר ב-30.6.2025", "הוצאות שכירות", "הוצאות שכירות מראש", RENT.monthly * RENT.leftAfter2024, "החוזה נגמר ולא חודש: ששת החודשים שנשארו נוצלו ב-2025. היתרה מתאפסת."),
    two("4", "שכר דצמבר, אחרי ההעלאה", "הוצאות שכר", "הוצאות שכר לשלם", round2((SALARY.recorded / SALARY.months) * (1 + SALARY.raise)), "חודש רגיל: 440,000 ÷ 11 = 40,000. דצמבר: 40,000 × 1.1 = 44,000."),
    two("5", "ניקיון: החלק של 2026", "הוצאות ניקיון מראש", "הוצאות ניקיון", (CLEAN.paid * CLEAN.monthsNext) / 12, "חוזה חדש שנרשם כהוצאה: 9 החודשים של 2026 יוצאים מההוצאה ל״מראש״."),
    two("6", "תיקון: הצ׳ק הדחוי שנרשם כמזומן", "לקוחות", "מזומן", SALE.cheque, "המכירות נכונות. 50,000 עוד לא נכנסו — חוב של הלקוח."),
    two("7", "המקדמה שסופקה ולא נרשמה", "מקדמות מלקוחות", "מכירות", ADVANCE, "הסחורה סופקה ב-2025: המקדמה נסגרת והמכירה נרשמת."),
    two("8", "ריבית לחצי השנה", "הוצאות ריבית", "הוצאות ריבית לשלם", LOAN.amount * LOAN.halfYearRate, "השיעור חצי שנתי, ועברו 6 חודשים: 400,000 × 3%."),
    two("9", "מחיקת החוב האבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", CREDIT.writeOff, "המחיקה כנגד ההפרשה — בלי הוצאה."),
    two("10", "השלמת ההפרשה", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", round2(required - allowanceAfterWriteOff), `לקוחות אחרי התיקון והמחיקה: ${customersAfter.toLocaleString("en-US")}. נדרש: ${required.toLocaleString("en-US")}. בכרטיס: ${allowanceAfterWriteOff.toLocaleString("en-US")}.`),
    two("11", "מלאי הסגירה", "מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", Math.min(STOCK.cost, STOCK.nrv), "הנמוך מבין העלות לשווי המימוש נטו."),
  ] as Entry[],
  customersAfter,
  required,
};
