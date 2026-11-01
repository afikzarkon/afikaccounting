import type { Entry } from "@/lib/learn/basics";
import type { JournalExercise, StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt, practice } from "./shared";

/** A journal-entry question: the event, the answer's lines, why, and the accounts offered (the answer's and some that tempt). */
const journal = (id: string, skill: string, text: string, lines: Entry["lines"], why: string, accounts: string[]): JournalExercise => ({
  kind: "journal",
  id,
  skill,
  entry: { id: "1", text, lines, why },
  accounts,
});

// Every figure below is computed here, from the event's own numbers.
const RENT = { paid: 9_600, monthsUsed: 5 }; // storage paid 1.8 for a year, recorded as prepaid
const rentUsed = (RENT.paid * RENT.monthsUsed) / 12;
const SOFTWARE = { paid: 3_600, monthsUsed: 1 }; // paid 1.12 for a year, in one entry
const softwareUsed = (SOFTWARE.paid * SOFTWARE.monthsUsed) / 12;
const HOSTING = { paid: 14_400, monthsNext: 3 }; // paid 1.4 for a year, recorded as expense
const hostingNext = (HOSTING.paid * HOSTING.monthsNext) / 12;
const LIFT = 2_300; // December's lift maintenance, invoiced in February
const GARDEN = { december: 6_500, paid: 4_000 };
const LOAN = { amount: 150_000, rate: 0.04, months: 5 }; // taken 1.8, interest paid yearly
const loanInterest = (LOAN.amount * LOAN.rate * LOAN.months) / 12;
const TRAINING = { received: 6_000, monthsEarned: 2 }; // received 1.11 for a year, recorded as unearned
const trainingEarned = (TRAINING.received * TRAINING.monthsEarned) / 12;
const PARKING = { received: 4_800, months: 6, monthsEarned: 3 }; // received 1.10 for six months, in one entry
const parkingEarned = (PARKING.received * PARKING.monthsEarned) / PARKING.months;
const DEPOSIT = { amount: 80_000, rate: 0.05, months: 9 }; // from 1.4, interest paid 31.3
const depositInterest = (DEPOSIT.amount * DEPOSIT.rate * DEPOSIT.months) / 12;
const depositYear = DEPOSIT.amount * DEPOSIT.rate;
const STOCK = { cost: 64_000, nrv: 59_500 };
const stock = Math.min(STOCK.cost, STOCK.nrv);

/** Lesson 4: year-end adjustments — the accrual basis, the four cut-off accounts, a full example, and closing inventory. */
export const ADJUST: StudyModule = {
  slug: "basics-adjust",
  course: COURSE,
  n: 5,
  title: "התאמות סוף שנה",
  description: "בסיס מצטבר ועקרון ההקבלה, ארבעת חשבונות החתך, חודש אחרון שונה וריבית לפי תקופה, מלאי סגירה — ודוגמה מלאה של פקודות התאמה.",
  backHref: COURSE_HREF,
  screens: [
    { id: "accrual", title: "חשבונות חתך: שם של הוצאה, מקום במאזן" },
    { id: "prepaid", title: "הוצאות מראש — נכס" },
    { id: "accrued", title: "הוצאות לשלם — התחייבות" },
    { id: "unearned", title: "הכנסות מראש — התחייבות" },
    { id: "receivable", title: "הכנסות לקבל — נכס" },
    { id: "odd-month", title: "החודש שלא דומה לאחרים" },
    { id: "interest-period", title: "ריבית: לשנה או לחצי שנה?" },
    { id: "inventory", title: "מלאי סגירה" },
    { id: "adj-example", title: "דוגמה מלאה: שחר ייעוץ בע״מ" },
  ],
  exercises: [
    // Prepaid expenses.
    journal(
      "prepaid-used",
      "הוצאות מראש",
      `ב-1.8 שולמו ${fmt(RENT.paid)} ₪ על שכירות מחסן לשנה, ונרשמו כ״הוצאות שכירות מראש״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות שכירות", dr: rentUsed },
        { account: "הוצאות שכירות מראש", cr: rentUsed },
      ],
      `הכול נרשם כנכס, ועד 31.12 נוצלו ${RENT.monthsUsed} חודשים: ${fmt(RENT.paid)} × ${RENT.monthsUsed}/12 = ${fmt(rentUsed)}. החלק שנוצל עובר מההוצאה מראש להוצאה.`,
      ["הוצאות שכירות", "הוצאות שכירות מראש", "מזומן", "הוצאות שכירות לשלם"],
    ),
    journal(
      "prepaid-one",
      "הוצאות מראש — פקודה אחת",
      `ב-1.12 שילמנו ${fmt(SOFTWARE.paid)} ₪ על מנוי שנתי לתוכנת הנהלת חשבונות. רשמו בפקודה אחת את התשלום, כך שב-31.12 הוא כבר מחולק נכון בין השנה הזו לשנה הבאה.`,
      [
        { account: "הוצאות תוכנה", dr: softwareUsed },
        { account: "הוצאות תוכנה מראש", dr: SOFTWARE.paid - softwareUsed },
        { account: "מזומן", cr: SOFTWARE.paid },
      ],
      `חודש אחד נוצל השנה: ${fmt(softwareUsed)} — הוצאה. השאר, ${fmt(SOFTWARE.paid - softwareUsed)}, שייך לשנה הבאה — הוצאה מראש. בזכות: כל הכסף ששולם.`,
      ["הוצאות תוכנה", "הוצאות תוכנה מראש", "מזומן", "הוצאות תוכנה לשלם", "ספקים"],
    ),
    journal(
      "prepaid-from-expense",
      "הוצאות מראש — כשנרשם כהוצאה",
      `ב-1.4 שולמו ${fmt(HOSTING.paid)} ₪ על אחסון האתר לשנה, ונרשמו כולם כ״הוצאות אחסון״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות אחסון מראש", dr: hostingNext },
        { account: "הוצאות אחסון", cr: hostingNext },
      ],
      `הכול נרשם כהוצאה, אבל ${HOSTING.monthsNext} חודשים (ינואר–מרץ) שייכים לשנה הבאה: ${fmt(hostingNext)}. הם יוצאים מההוצאה ועוברים להוצאות מראש — נכס. בודקים תמיד קודם מה כבר נרשם.`,
      ["הוצאות אחסון מראש", "הוצאות אחסון", "מזומן", "הוצאות אחסון לשלם"],
    ),
    // Accrued expenses.
    journal(
      "accrued-lift",
      "הוצאות לשלם",
      `טכנאי המעליות טיפל במעלית של הבניין בדצמבר. החשבונית, ${fmt(LIFT)} ₪, תגיע רק בפברואר. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות אחזקה", dr: LIFT },
        { account: "הוצאות אחזקה לשלם", cr: LIFT },
      ],
      "הטיפול נעשה השנה — הוצאה של השנה. הכסף עוד לא יצא, ולכן נוצר חוב: הוצאות לשלם, התחייבות.",
      ["הוצאות אחזקה", "הוצאות אחזקה לשלם", "מזומן", "הוצאות אחזקה מראש"],
    ),
    journal(
      "accrued-paid",
      "הוצאות לשלם — התשלום",
      `ב-14.2 שולמה החשבונית של טכנאי המעליות, ${fmt(LIFT)} ₪, שנרשמה ב-31.12 כ״הוצאות אחזקה לשלם״.`,
      [
        { account: "הוצאות אחזקה לשלם", dr: LIFT },
        { account: "מזומן", cr: LIFT },
      ],
      "ההוצאה כבר נרשמה בשנה הקודמת. עכשיו רק נסגר החוב: הוצאות לשלם בחובה, ומזומן בזכות. אין הוצאה חדשה.",
      ["הוצאות אחזקה לשלם", "מזומן", "הוצאות אחזקה", "הוצאות אחזקה מראש"],
    ),
    journal(
      "accrued-one",
      "הוצאות לשלם — פקודה אחת",
      `עבודות הגינון של דצמבר עלו ${fmt(GARDEN.december)} ₪. ב-31.12 שולמו לגנן ${fmt(GARDEN.paid)} ₪, ואת השאר נשלם בינואר. רשמו בפקודה אחת.`,
      [
        { account: "הוצאות גינון", dr: GARDEN.december },
        { account: "מזומן", cr: GARDEN.paid },
        { account: "הוצאות גינון לשלם", cr: GARDEN.december - GARDEN.paid },
      ],
      `כל הגינון של דצמבר הוא הוצאה של השנה: ${fmt(GARDEN.december)}. בזכות — מה ששולם (${fmt(GARDEN.paid)}) ומה שעוד חייבים (הוצאות לשלם ${fmt(GARDEN.december - GARDEN.paid)}).`,
      ["הוצאות גינון", "מזומן", "הוצאות גינון לשלם", "הוצאות גינון מראש"],
    ),
    journal(
      "accrued-interest",
      "הוצאות לשלם — ריבית",
      `ב-1.8 נלקחה הלוואה של ${fmt(LOAN.amount)} ₪ בריבית שנתית של ${LOAN.rate * 100}%. הריבית משולמת פעם בשנה, ב-31.7. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הוצאות ריבית", dr: loanInterest },
        { account: "הוצאות ריבית לשלם", cr: loanInterest },
      ],
      `השתמשנו בכסף של הבנק ${LOAN.months} חודשים השנה: ${fmt(LOAN.amount)} × ${LOAN.rate * 100}% × ${LOAN.months}/12 = ${fmt(loanInterest)}. זו הוצאה של השנה, שעוד לא שולמה.`,
      ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה", "מזומן", "הוצאות ריבית מראש"],
    ),
    // Unearned income.
    journal(
      "unearned-earned",
      "הכנסות מראש",
      `ב-1.11 קיבל מאמן כושר ${fmt(TRAINING.received)} ₪ על חבילת אימונים לשנה, ורשם אותם כ״הכנסות אימונים מראש״. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הכנסות אימונים מראש", dr: trainingEarned },
        { account: "הכנסות אימונים", cr: trainingEarned },
      ],
      `הכול נרשם כהתחייבות, ועד 31.12 ניתנו ${TRAINING.monthsEarned} חודשי אימונים: ${fmt(TRAINING.received)} × ${TRAINING.monthsEarned}/12 = ${fmt(trainingEarned)}. החלק שהורווח עובר מההכנסה מראש להכנסה.`,
      ["הכנסות אימונים מראש", "הכנסות אימונים", "מזומן", "הכנסות אימונים לקבל"],
    ),
    journal(
      "unearned-one",
      "הכנסות מראש — פקודה אחת",
      `ב-1.10 קיבלנו ${fmt(PARKING.received)} ₪ על השכרת מקום חניה ל-${PARKING.months} חודשים. רשמו בפקודה אחת, כך שב-31.12 הסכום כבר מחולק נכון.`,
      [
        { account: "מזומן", dr: PARKING.received },
        { account: "הכנסות שכירות", cr: parkingEarned },
        { account: "הכנסות שכירות מראש", cr: PARKING.received - parkingEarned },
      ],
      `${PARKING.monthsEarned} חודשים הורווחו השנה: ${fmt(parkingEarned)} — הכנסה. ${PARKING.months - PARKING.monthsEarned} החודשים הבאים עוד חייבים לשוכר: ${fmt(PARKING.received - parkingEarned)} — הכנסות מראש. בחובה: כל הכסף שהתקבל.`,
      ["מזומן", "הכנסות שכירות", "הכנסות שכירות מראש", "הכנסות שכירות לקבל"],
    ),
    // Accrued income.
    journal(
      "receivable-interest",
      "הכנסות לקבל",
      `ב-1.4 הפקדנו ${fmt(DEPOSIT.amount)} ₪ בפיקדון בריבית שנתית של ${DEPOSIT.rate * 100}%. הריבית תתקבל ב-31.3 בשנה הבאה. רשמו את פקודת ההתאמה ב-31.12.`,
      [
        { account: "הכנסות ריבית לקבל", dr: depositInterest },
        { account: "הכנסות ריבית", cr: depositInterest },
      ],
      `הכסף שלנו עבד ${DEPOSIT.months} חודשים השנה: ${fmt(DEPOSIT.amount)} × ${DEPOSIT.rate * 100}% × ${DEPOSIT.months}/12 = ${fmt(depositInterest)}. ההכנסה הורווחה השנה, והכסף עוד לא הגיע — הכנסות לקבל, נכס.`,
      ["הכנסות ריבית לקבל", "הכנסות ריבית", "מזומן", "הכנסות ריבית מראש"],
    ),
    journal(
      "receivable-received",
      "הכנסות לקבל — התקבול",
      `ב-31.3 התקבלה ריבית של שנה שלמה על הפיקדון: ${fmt(depositYear)} ₪. ב-31.12 נרשמו ממנה ${fmt(depositInterest)} ₪ כ״הכנסות ריבית לקבל״.`,
      [
        { account: "מזומן", dr: depositYear },
        { account: "הכנסות ריבית לקבל", cr: depositInterest },
        { account: "הכנסות ריבית", cr: depositYear - depositInterest },
      ],
      `תשעת החודשים של השנה הקודמת כבר נרשמו כהכנסה — הם רק סוגרים את ההכנסות לקבל. שלושת החודשים של השנה הזו (${fmt(depositYear - depositInterest)}) הם הכנסה שלה. בחובה: כל הכסף שהתקבל.`,
      ["מזומן", "הכנסות ריבית לקבל", "הכנסות ריבית", "הכנסות ריבית מראש"],
    ),
    // Closing inventory.
    journal(
      "closing-stock",
      "מלאי סגירה",
      `ב-31.12 נספר מלאי שעלותו ${fmt(STOCK.cost)} ₪. חלק מהסחורה יצא מהאופנה, ושווי המימוש נטו של המלאי — ${fmt(STOCK.nrv)} ₪. רשמו את מלאי הסגירה.`,
      [
        { account: "מלאי סגירה מאזני", dr: stock },
        { account: "מלאי סגירה רווח או הפסד", cr: stock },
      ],
      `מלאי נמדד לפי הנמוך מבין העלות לשווי המימוש נטו: ${fmt(stock)}. הנכס במאזן בחובה, ובזכות — הקטנת העלות ברווח והפסד.`,
      ["מלאי סגירה מאזני", "מלאי סגירה רווח או הפסד", "קניות", "מזומן"],
    ),
    journal(
      "odd-raise",
      "העלאת שכר בדצמבר",
      "שכר ינואר עד נובמבר, 440,000 ₪, נרשם. מדצמבר השכר עלה ב-6%, ושכר דצמבר ישולם ב-9.1. רשמו את פקודת ההתאמה ב-31.12.",
      [
        { account: "הוצאות שכר", dr: 42_400 },
        { account: "הוצאות שכר לשלם", cr: 42_400 },
      ],
      "חודש רגיל: 440,000 ÷ 11 = 40,000. דצמבר: 40,000 × 1.06 = 42,400 — הוצאה של השנה שעוד לא שולמה.",
      ["הוצאות שכר", "הוצאות שכר לשלם", "מזומן", "הוצאות שכר מראש"],
    ),
    journal(
      "odd-tax",
      "חודש יקר יותר",
      "ארנונה של 2,800 ₪ לחודש נרשמה עד אוקטובר. החשבון של נובמבר–דצמבר יגיע בינואר, ובדצמבר התעריף עלה ב-10%. רשמו את פקודת ההתאמה ב-31.12.",
      [
        { account: "הוצאות ארנונה", dr: 5_880 },
        { account: "הוצאות ארנונה לשלם", cr: 5_880 },
      ],
      "נובמבר 2,800 + דצמבר 2,800 × 1.1 = 3,080. יחד: 5,880 — הוצאה של השנה, שעוד לא שולמה.",
      ["הוצאות ארנונה", "הוצאות ארנונה לשלם", "מזומן", "הוצאות ארנונה מראש"],
    ),
    journal(
      "odd-bimonthly",
      "חשבון דו-חודשי",
      "חשבון המים מגיע אחת לחודשיים. נרשמו ינואר עד אוקטובר: 51,000 ₪. החשבון של נובמבר–דצמבר ישולם ב-10.1. רשמו את פקודת ההתאמה ב-31.12.",
      [
        { account: "הוצאות מים", dr: 10_200 },
        { account: "הוצאות מים לשלם", cr: 10_200 },
      ],
      "חודש רגיל: 51,000 ÷ 10 = 5,100. חסרים שני חודשים: 10,200.",
      ["הוצאות מים", "הוצאות מים לשלם", "מזומן", "ספקים"],
    ),
    journal(
      "half-year-rate",
      "ריבית חצי שנתית",
      "ב-1.10 נלקחה הלוואה של 500,000 ₪ בריבית חצי שנתית של 3%, שתשולם עם הקרן. רשמו את פקודת ההתאמה ב-31.12.",
      [
        { account: "הוצאות ריבית", dr: 7_500 },
        { account: "הוצאות ריבית לשלם", cr: 7_500 },
      ],
      "השיעור הוא לחצי שנה, ועברו 3 חודשים: 500,000 × 3% × 3/6 = 7,500.",
      ["הוצאות ריבית", "הוצאות ריבית לשלם", "הלוואה", "מזומן"],
    ),
    journal(
      "lent-interest",
      "ריבית על הלוואה שנתנו",
      "ב-1.1 החברה הלוותה ללקוח 50,000 ₪. הריבית — 1,250 ₪ לכל חצי שנה — מתקבלת ב-30.6 וב-1.1. התקבול של 30.6 נרשם. רשמו את פקודת ההתאמה ב-31.12.",
      [
        { account: "הכנסות ריבית לקבל", dr: 1_250 },
        { account: "הכנסות ריבית", cr: 1_250 },
      ],
      "התקבול של 1.1 בשנה הבאה הוא על יולי–דצמבר של השנה הזו — הכנסה של השנה, שעוד לא התקבלה: הכנסות לקבל.",
      ["הכנסות ריבית לקבל", "הכנסות ריבית", "הלוואה שניתנה", "מזומן"],
    ),
    {
      kind: "number",
      id: "rate-period",
      skill: "ריבית לתקופה",
      prompt: "הלוואה של 180,000 ₪ מ-1.1, בריבית חצי שנתית של 2.5%. מה הוצאות הריבית של השנה כולה?",
      answer: 9_000,
      steps: ["השיעור הוא לחצי שנה, ובשנה יש שתי תקופות כאלה.", "180,000 × 2.5% × 12/6 = 9,000."],
    },
    practice("q14"),
  ],
  traps: [
    {
      id: "forgot-inventory",
      prompt: "שכחו לרשום מלאי סגירה של 37,000 ₪. מה קורה לרווח השנה?",
      options: ["נמוך מדי ב-37,000 ₪", "גבוה מדי ב-37,000 ₪", "לא משתנה", "נמוך מדי ב-74,000 ₪"],
      answer: 0,
      why: "עלות המכר = מלאי פתיחה + קניות − מלאי סגירה. בלי מלאי הסגירה עלות המכר גבוהה ב-37,000, והרווח נמוך באותו סכום.",
      traps: [
        "",
        "הפוך: מלאי סגירה מקטין את עלות המכר. בלעדיו העלות גבוהה מדי, והרווח נמוך מדי.",
        "המלכודת: מלאי סגירה הוא לא רק נכס במאזן — הוא גם מקטין את העלות ברווח והפסד.",
        "הטעות היא בסכום אחד: 37,000 בעלות המכר, ולכן 37,000 ברווח.",
      ],
    },
    {
      id: "preliminary-statements",
      prompt: "בשאלה קיבלתם מאזן בוחן ראשוני ליום 31.12. אפשר לבנות ממנו מיד את הדוחות?",
      options: ["לא — קודם פקודות התאמה", "כן", "רק את המאזן", "רק את רווח והפסד"],
      answer: 0,
      why: "מאזן הבוחן הראשוני כולל רק מה שנרשם במהלך השנה. קודם רושמים את ההתאמות (חתך ומלאי), ורק ממאזן הבוחן הסופי בונים דוחות.",
      traps: [
        "",
        "המלכודת: דוחות שנבנים ישר ממאזן הבוחן הראשוני — שגויים. חסרות בו ההתאמות של סוף השנה.",
        "ההתאמות משנות גם חשבונות מאזניים (מראש, לשלם, מלאי) — גם המאזן יהיה שגוי.",
        "ההתאמות משנות הכנסות והוצאות — גם רווח והפסד יהיה שגוי.",
      ],
    },
  ],
  tips: [
    "בסיס מצטבר: הכנסה והוצאה שייכות לתקופה שבה נהנו מהן, לא לתקופה שבה הכסף זז.",
    "הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.",
    "לפני התאמה בודקים מה כבר נרשם: כהוצאה או כנכס? הכיוון של הפקודה תלוי בזה.",
    "חודש רגיל = מה שנרשם ÷ החודשים שנרשמו. רק אחר כך מתקנים את החודש החריג.",
    "ריבית: קודם קוראים לאיזו תקופה השיעור — שנה או חצי שנה.",
    "עלות המכר = מלאי פתיחה + קניות − מלאי סגירה. המלאי — בנמוך מבין עלות לשווי מימוש נטו.",
  ],
};
