import { gpFire, historyFire, settle } from "@/lib/learn/inventory";
import type { StudyModule } from "../types";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "./shared";

// Every figure below is computed by the engine, from the question's own numbers.
/** The road of a claim, on the opening screen: one warehouse, one fire, one rate. */
export const ROAD = { opening: 50_000, purchases: 80_000, sales: 120_000, rate: 0.3, saved: 6_000, deductible: 0.1 };
export const ROAD_FIRE = gpFire({ opening: ROAD.opening, purchases: ROAD.purchases, sales: ROAD.sales, rates: [ROAD.rate], saved: ROAD.saved, terms: { deductible: { kind: "pct", value: ROAD.deductible } } });
/** Two years' rates, averaged as the policy says. */
export const TWO_RATES = { years: [{ sales: 400_000, gp: 120_000 }, { sales: 500_000, gp: 170_000 }], opening: 60_000, purchases: 150_000, sales: 220_000 };
const rates = TWO_RATES.years.map((y) => y.gp / y.sales);
const twoFire = gpFire({ opening: TWO_RATES.opening, purchases: TWO_RATES.purchases, sales: TWO_RATES.sales, rates, saved: 0 });
const SAVED = { atPrice: 10_000, rate: 0.25 };
const PCT = { burned: 40_000, deductible: 0.15 };
const FIXED = { burned: 60_000, deductible: 5_000, cap: 50_000 };
const fixed = settle(FIXED.burned, { deductible: { kind: "fixed", value: FIXED.deductible }, cap: FIXED.cap });
/** The policy-method screen's shop: kept at average in the books, insured by FIFO. */
export const POLICY = {
  periods: [
    {
      label: "2025 עד השריפה",
      opening: { units: 100, cost: 1_000 },
      purchases: [
        { date: "2025-02-01", qty: 200, unitPrice: 12 },
        { date: "2025-04-01", qty: 100, unitPrice: 13 },
      ],
      sales: [{ date: "2025-03-01", qty: 250 }],
    },
  ],
  fireDate: "2025-05-01",
};
export const POLICY_FIFO = historyFire({ periods: POLICY.periods, method: "fifo", savedUnits: 0, fireDate: POLICY.fireDate });
export const POLICY_AVG = historyFire({ periods: POLICY.periods, method: "wa-periodic", savedUnits: 0, fireDate: POLICY.fireDate });

/** Lesson 10: fire, theft and insurance — the stock on the day, the gross profit method, what was saved, a policy with its own method, and the settlement. */
export const FIRE: StudyModule = {
  slug: "inventory-fire",
  course: COURSE,
  n: 10,
  title: "שריפה, גניבה וביטוח",
  description: "כמה מלאי היה במחסן ביום השריפה, ובכמה מפצה הביטוח: שיטת הרווח הגולמי, מה שניצל, פוליסה בשיטה אחרת מהספרים, השתתפות עצמית ותקרה.",
  goal: "לחשב כמה מלאי היה במחסן ביום השריפה, ובכמה הביטוח מפצה.",
  outcomes: [
    "לחשב מלאי בלי ספירה בשיטת הרווח הגולמי",
    "לנכות את מה שניצל",
    "לחשב לפי הפוליסה, גם כשהיא בשיטה אחרת מהספרים",
    "לחשב השתתפות עצמית ותקרה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "iv-fire-idea", title: "הדרך: מהמחסן שנשרף לשיפוי" },
    { id: "iv-fire-gp", title: "בלי ספירה: שיטת הרווח הגולמי" },
    { id: "iv-fire-saved", title: "מה לא נשרף" },
    { id: "iv-fire-policy", title: "הפוליסה קובעת את השיטה" },
    { id: "iv-fire-settle", title: "השתתפות עצמית ותקרה" },
  ],
  exercises: [
    calc(
      "roll",
      "המלאי ביום השריפה",
      `מלאי פתיחה ${fmt(ROAD.opening)} ₪; קניות עד השריפה ${fmt(ROAD.purchases)} ₪; מכירות עד השריפה ${fmt(ROAD.sales)} ₪; שיעור הרווח הגולמי ${ROAD.rate * 100}%. כמה מלאי (בעלות) היה במחסן ביום השריפה?`,
      ROAD_FIRE.atFire,
      [
        `עלות המכירות עד השריפה: ${fmt(ROAD.sales)} × ${100 - ROAD.rate * 100}% = ${fmt(ROAD_FIRE.cogs)} ₪.`,
        `במחסן: ${fmt(ROAD.opening)} + ${fmt(ROAD.purchases)} − ${fmt(ROAD_FIRE.cogs)} = ${fmt(ROAD_FIRE.atFire)} ₪.`,
      ],
    ),
    calc(
      "two-rates",
      "ממוצע של שני שיעורים",
      `הפוליסה: השיפוי לפי ממוצע שיעור הרווח הגולמי בשנתיים שקדמו. בשנה אחת מכירות ${fmt(TWO_RATES.years[0].sales)} ורווח גולמי ${fmt(TWO_RATES.years[0].gp)}; בשנייה מכירות ${fmt(TWO_RATES.years[1].sales)} ורווח גולמי ${fmt(TWO_RATES.years[1].gp)}. פתיחה ${fmt(TWO_RATES.opening)}, קניות עד השריפה ${fmt(TWO_RATES.purchases)}, מכירות עד השריפה ${fmt(TWO_RATES.sales)}. כמה מלאי נשרף, אם לא ניצל דבר?`,
      twoFire.burned,
      [
        `השיעורים: ${rates.map((r) => `${Math.round(r * 1000) / 10}%`).join(" ו-")}; הממוצע: ${Math.round(twoFire.rate * 1000) / 10}%.`,
        `עלות המכירות עד השריפה: ${fmt(TWO_RATES.sales)} × ${Math.round((1 - twoFire.rate) * 1000) / 10}% = ${fmt(twoFire.cogs)} ₪.`,
        `נשרף: ${fmt(TWO_RATES.opening)} + ${fmt(TWO_RATES.purchases)} − ${fmt(twoFire.cogs)} = ${fmt(twoFire.burned)} ₪.`,
      ],
    ),
    calc(
      "saved-price",
      "מה שניצל, במחיר מכירה",
      `אחרי השריפה נשאר מלאי שמחיר המכירה שלו ${fmt(SAVED.atPrice)} ₪. שיעור הרווח הגולמי ${SAVED.rate * 100}%. מה העלות שלו — הסכום שמורידים מהמלאי שהיה במחסן?`,
      SAVED.atPrice * (1 - SAVED.rate),
      [`מחיר מכירה כולל רווח. לעלות מגיעים כמו בעלות המכר: × (1 − ${SAVED.rate * 100}%).`, `${fmt(SAVED.atPrice)} × ${100 - SAVED.rate * 100}% = ${fmt(SAVED.atPrice * (1 - SAVED.rate))} ₪.`],
    ),
    calc(
      "pct-deductible",
      "השתתפות עצמית באחוזים",
      `נשרף מלאי בעלות ${fmt(PCT.burned)} ₪. השתתפות עצמית: ${PCT.deductible * 100}% מסכום התביעה. כמה ישלם הביטוח?`,
      settle(PCT.burned, { deductible: { kind: "pct", value: PCT.deductible } }).net,
      [`השתתפות: ${fmt(PCT.burned)} × ${PCT.deductible * 100}% = ${fmt(PCT.burned * PCT.deductible)} ₪.`, `שיפוי: ${fmt(PCT.burned)} − ${fmt(PCT.burned * PCT.deductible)} = ${fmt(PCT.burned * (1 - PCT.deductible))} ₪.`],
    ),
    calc(
      "fixed-cap",
      "השתתפות קבועה ותקרה",
      `נשרף מלאי בעלות ${fmt(FIXED.burned)} ₪. השתתפות עצמית קבועה ${fmt(FIXED.deductible)} ₪, והשיפוי נטו לא יעלה על ${fmt(FIXED.cap)} ₪. כמה ישלם הביטוח?`,
      fixed.net,
      [`אחרי השתתפות: ${fmt(FIXED.burned)} − ${fmt(FIXED.deductible)} = ${fmt(FIXED.burned - FIXED.deductible)} ₪.`, `זה מעל התקרה — משולמים ${fmt(fixed.net)} ₪. ${fmt(FIXED.burned - fixed.net)} ₪ לא שופו: הפסד של החברה.`],
    ),
    calc(
      "policy-fifo",
      "פוליסה לפי FIFO",
      `החברה מנהלת ממוצע תקופתי, אבל הפוליסה משפה לפי עלות ב-FIFO. מלאי פתיחה 100 יח׳ ב-10 ₪; 1.2 — קנייה 200 יח׳ ב-12 ₪; 1.3 — מכירה 250 יח׳; 1.4 — קנייה 100 יח׳ ב-13 ₪; 1.5 — שריפה, הכול נשרף. מה סכום התביעה?`,
      POLICY_FIFO.burned,
      [
        `ביום השריפה במחסן: 100 + 200 − 250 + 100 = ${POLICY_FIFO.unitsAtFire} יח׳.`,
        "ב-FIFO נשארות האחרונות: 100 יח׳ מ-1.4 ב-13 ₪, ו-50 מ-1.2 ב-12 ₪.",
        `100 × 13 + 50 × 12 = ${fmt(POLICY_FIFO.burned)} ₪ — לפי הפוליסה, לא לפי הספרים.`,
      ],
    ),
    choice(
      "after-fire",
      "אחרי השריפה",
      "המחסן נשרף ב-30.6. ב-15.8 נקנתה סחורה חדשה. האם היא נכנסת לחישוב המלאי שנשרף?",
      ["לא — היא לא הייתה במחסן כשנשרף", "כן — היא חלק מקניות השנה", "רק בשיטת FIFO", "רק בשיטת הרווח הגולמי"],
      0,
      "מגלגלים את המלאי עד רגע השריפה בלבד. מה שקרה אחריה לא נשרף.",
    ),
    choice(
      "consignment-fire",
      "משגור ביום השריפה",
      "ביום השריפה היה לחברה מלאי במשגור אצל רשת. מה עושים איתו?",
      ["מורידים אותו — הוא שלנו, אבל לא היה במחסן שנשרף", "מוסיפים אותו לתביעה", "מתעלמים — הוא לא שלנו", "מורידים אותו מהקניות"],
      0,
      "המשגור כלול במלאי של החברה ביום השריפה — אבל הוא לא נשרף. מורידים אותו כמו מלאי שניצל.",
    ),
    choice(
      "no-nrv",
      "שיפוי לפי עלות",
      "בחישוב תביעה ״לפי עלות המלאי שנשרף״, האם מורידים את המלאי לשווי מימוש נטו?",
      ["לא — השיפוי לפי עלות", "כן — הנמוך מבין, כמו בדוחות", "רק אם שווי המימוש נמוך", "רק בממוצע"],
      0,
      "הפוליסה מבטחת את העלות. שווי מימוש נטו שייך למדידה בדוחות, לא לחישוב התביעה.",
    ),
    calc(
      "theft",
      "גניבה",
      "פתיחה 40,000 ₪, קניות עד הגניבה 70,000 ₪, מכירות עד הגניבה 100,000 ₪, שיעור רווח גולמי 25%. אחרי הגניבה נשאר מלאי שמחיר המכירה שלו 12,000 ₪. מה עלות המלאי שנגנב?",
      26_000,
      [
        "עלות המכירות: 100,000 × 75% = 75,000; במחסן לפני הגניבה: 40,000 + 70,000 − 75,000 = 35,000 ₪.",
        "מה שנשאר, בעלות: 12,000 × 75% = 9,000 ₪.",
        "נגנב: 35,000 − 9,000 = 26,000 ₪.",
      ],
    ),
    choice(
      "deductible-then-cap",
      "הסדר: השתתפות ותקרה",
      "נשרף מלאי בעלות 90,000 ₪. השתתפות עצמית 10%; ״השיפוי נטו לא יעלה על 85,000 ₪״. כמה ישלם הביטוח?",
      ["81,000 ₪", "85,000 ₪", "76,500 ₪", "90,000 ₪"],
      0,
      "90,000 − 9,000 = 81,000 — מתחת לתקרה, ולכן היא לא משפיעה.",
    ),
  ],
  traps: [
    {
      id: "fire-year",
      prompt: "המחסן נשרף ב-30.6. כדי לחשב בשיטה הקמעונאית כמה מלאי נשרף, אילו קניות ומכירות לוקחים?",
      options: ["רק עד תאריך השריפה", "של כל השנה", "של השנה הקודמת", "רק אחרי השריפה"],
      answer: 0,
      why: "מגלגלים את המלאי עד הרגע של השריפה: פתיחה + קניות עד 30.6 − עלות המכירות עד 30.6. מורידים את מה שניצל.",
      traps: ["", "המלכודת: גלגול לכל השנה מכניס קניות ומכירות שקרו אחרי השריפה.", "השנה הקודמת נותנת רק את מלאי הפתיחה.", "אחרי השריפה המלאי כבר לא היה שם."],
    },
    {
      id: "saved-raw",
      prompt: "במחסן היה מלאי בעלות 30,000 ₪. ניצל מלאי שמחיר המכירה שלו 8,000 ₪; שיעור הרווח הגולמי 25%. כמה נשרף?",
      options: ["24,000 ₪", "22,000 ₪", "28,000 ₪", "30,000 ₪"],
      answer: 0,
      why: "מה שניצל, בעלות: 8,000 × 75% = 6,000. נשרף: 30,000 − 6,000 = 24,000 ₪.",
      traps: ["", "המלכודת: הורדתם 8,000 — מחיר מכירה. המלאי שבמחסן בעלות, אז גם מה שניצל צריך להיות בעלות.", "הורדתם רק את הרווח (2,000), לא את מה שניצל.", "שכחתם את מה שניצל."],
    },
  ],
  tips: [
    "הדרך: מלאי ביום השריפה (עד התאריך בלבד) − מה שניצל = נשרף = סכום התביעה; פחות השתתפות עצמית; עד התקרה.",
    "בלי ספירה: עלות המכירות = מכירות × (1 − שיעור גולמי). השיעור — כפי שהפוליסה קובעת: של שנה קודמת, או ממוצע.",
    "מה שניצל במחיר מכירה — ממירים לעלות: × (1 − שיעור גולמי). משגור ומלאי בדרך — לא נשרפו.",
    "הפוליסה קובעת את השיטה: מחשבים מחדש לפיה, בלי שווי מימוש נטו — גם אם הספרים בשיטה אחרת.",
    "השתתפות באחוזים — מסכום התביעה; קבועה — סכום אחד. התקרה חלה על השיפוי נטו, אלא אם כתוב אחרת.",
  ],
};
