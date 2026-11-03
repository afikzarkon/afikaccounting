import { grown, measure, raised } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, lessonRef, pct } from "../shared";

/** The worked example: an operations VP, a share of the last salary for every year of service. */
export const VP = { share: 0.04, salary: 180_000, growth: 0.03, yearsToRetire: 6, served: 2.5, rate: 0.07, date: "31.12.2024" };
export const VP_PER_YEAR = VP.share * grown(VP.salary, VP.growth, VP.yearsToRetire);
export const VP_ACCRUED = VP_PER_YEAR * VP.served;
export const VP_OBLIGATION = measure({ perYear: VP_PER_YEAR, years: VP.served, heads: 1, n: VP.yearsToRetire, i: VP.rate });

/** "We solve" (a): the same VP, retiring two years later, at a lower rate. */
export const VP_LATER = { yearsToRetire: 8, rate: 0.05 };
export const VP_LATER_PER_YEAR = VP.share * grown(VP.salary, VP.growth, VP_LATER.yearsToRetire);
export const VP_LATER_OBLIGATION = measure({ perYear: VP_LATER_PER_YEAR, years: VP.served, heads: 1, n: VP_LATER.yearsToRetire, i: VP_LATER.rate });

/**
 * "We solve" (b) and the exercise: a logistics company's retirement grant —
 * a share of the final salary for each year of service — measured at two
 * year ends (the second after the grant was improved for every year).
 * Lesson 8 rolls the year between them forward.
 */
export const GROUP = {
  start: 2022,
  opening: { date: "31.12.2023", share: 0.06, finalSalary: 25_000, years: 2, staff: 400, stay: 0.85, n: 12, corporate: 0.065, government: 0.05 },
  closing: { date: "31.12.2024", share: 0.075, finalSalary: 26_000, years: 3, staff: 400, stay: 0.8, n: 11, corporate: 0.06, government: 0.045 },
};
export const groupStep = (g: typeof GROUP.opening) => ({ perYear: g.share * g.finalSalary, years: g.years, heads: g.staff * g.stay, n: g.n, i: g.corporate });
export const GROUP_OPENING = measure(groupStep(GROUP.opening));
export const GROUP_CLOSING = measure(groupStep(GROUP.closing));

/** The exercise (b): a CFO's lump sum — a share of the last monthly salary for every year — with an uneven path of raises. */
export const CFO = { from: 2022, share: 1.2, salary: 38_000, firstRaise: 0.02, raise: 0.035, years: 14, rate2022: 0.034 };
/** The raises from the first year to retirement: one of `firstRaise`, then `raise` every January. */
export const CFO_FINAL = raised(CFO.salary, [CFO.firstRaise, ...Array(CFO.years - 2).fill(CFO.raise)]);
export const CFO_PER_YEAR = CFO.share * CFO_FINAL;
export const CFO_TOTAL = CFO_PER_YEAR * CFO.years;
export const CFO_2022 = measure({ perYear: CFO_PER_YEAR, years: 1, heads: 1, n: CFO.years - 1, i: CFO.rate2022 });

const traps: Trap[] = [
  {
    id: "salary-today",
    prompt: "עובדת מקבלת 5% מהשכר האחרון לכל שנת שירות. שכרה היום 200,000 ₪, ויעלה 3% בשנה עד הפרישה בעוד 10 שנים. מה ① — ההטבה לשנת שירות?",
    options: ["5% × 200,000 × 1.03^10", "5% × 200,000", "5% × 200,000 × 10", "5% × 200,000 ÷ 1.03^10"],
    answer: 0,
    why: "ההטבה מחושבת לפי השכר הצפוי בפרישה — לא לפי השכר של היום (IAS 19.68).",
    traps: ["", "המלכודת: השכר של היום. ההבטחה היא על השכר האחרון, והוא יהיה גבוה יותר.", "זה מכפיל בשנות השירות העתידיות — ② סופר רק את מה שנצבר עד היום.", "מהוונים בריבית ההיוון, לא בקצב עליית השכר."],
  },
  {
    id: "n-service",
    prompt: "עובד עבד 7 שנים, וצפוי לפרוש בעוד 13. בכמה שנים מהוונים את ההתחייבות היום?",
    options: ["13", "7", "20", "6"],
    answer: 0,
    why: "④ n = השנים מתאריך המדידה ועד התשלום.",
    traps: ["", "המלכודת: להוון על שנות השירות. הן נכנסות ב-②, לא ב-④.", "זה כל הוותק בפרישה — לא המרחק מהיום.", "אין שום הפרש לחשב כאן."],
  },
  {
    id: "government",
    prompt: "בתאריך המדידה: תשואת אג״ח ממשלתיות 5%, תשואת אג״ח קונצרניות איכותיות 6.5%, ובתאריך הקודם 7%. באיזה שיעור מהוונים?",
    options: ["6.5%", "5%", "7%", "ממוצע של שלושתם"],
    answer: 0,
    why: "הקונצרנית האיכותית, בתאריך המדידה (IAS 19.83); בישראל השוק עמוק.",
    traps: ["", "המלכודת: הממשלתית. היא נכנסת רק כשאין שוק עמוק לאג״ח קונצרניות.", "זה שיעור של תאריך אחר.", "אין ממוצע — שיעור אחד, של התאריך."],
  },
  {
    id: "heads",
    prompt: "400 עובדים, ו-85% מהם צפויים להישאר עד הפרישה. מה ③?",
    options: ["340", "400", "85", "60"],
    answer: 0,
    why: "③ = מספר העובדים × ההסתברות לקבל: 400 × 85%.",
    traps: ["", "המלכודת: לשכוח את ההסתברות. רק מי שיגיע לפרישה יקבל.", "זו ההסתברות בלבד, בלי העובדים.", "אלה העוזבים הצפויים — הם לא יקבלו."],
  },
  {
    id: "improved",
    prompt: "בסוף השנה שופר המענק מ-6% ל-7.5% מהשכר, לכל שנות השירות. איך מודדים את יתרת הסגירה?",
    options: ["לפי 7.5% על כל השנים", "לפי 6% על השנים הקודמות ו-7.5% על השנה האחרונה", "לפי 6% — השיפור נרשם בשנה הבאה", "לפי ממוצע של שני השיעורים"],
    answer: 0,
    why: "השיפור חל על כל שנות השירות, ולכן הסגירה נמדדת כולה בתנאים החדשים. איך מפרידים בין שירות שוטף לשירות עבר — " + lessonRef("ias19-amend") + ".",
    traps: ["", "המלכודת: להחיל את השיפור רק על העתיד. כאן הוא חל גם על העבר.", "השיפור כבר בתוקף בתאריך הסגירה.", "אין ממוצע; יש תנאים של תאריך הסגירה."],
  },
];

/** Lesson 5: measuring a defined benefit obligation at one date — the projected unit credit method, in five fixed steps. */
export const MEASURE: StudyModule = {
  slug: "ias19-measure",
  course: COURSE,
  n: 5,
  title: "הטבה מוגדרת 1: מדידת ההתחייבות בנקודת זמן",
  description: "שיטת יחידת הזכאות הצפויה בחמישה צעדים קבועים. ההטבה לשנה, שנות השירות, העובדים הצפויים, השנים עד התשלום ושיעור ההיוון. ובכל צעד: איזה נתון מסיח את הדעת.",
  goal: "למדוד התחייבות להטבה מוגדרת בתאריך אחד, בחמישה צעדים קבועים.",
  outcomes: [
    "לחשב את ההטבה לשנת שירות לפי השכר הצפוי בפרישה",
    "לספור שנות שירות ועובדים צפויים",
    "לקבוע n — השנים עד התשלום — ואת שיעור ההיוון הנכון",
    "למדוד התחייבות של עובד אחד ושל קבוצה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-measure-hook", title: "כמה שווה היום הבטחה לפרישה?" },
    { id: "emp-measure-puc", title: "יחידת הזכאות הצפויה" },
    { id: "emp-measure-rate", title: "באיזו ריבית מהוונים" },
    { id: "emp-measure-recipe", title: "הכלל: מתכון חמשת הצעדים" },
    { id: "emp-measure-solved", title: "דוגמה פתורה: סמנכ״לית התפעול" },
    { id: "emp-measure-together", title: "פותרים יחד: פרישה מאוחרת, וקבוצת עובדים" },
    { id: "emp-measure-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("grp-close-per", "① בסגירה", `מענק פרישה: ${pct(GROUP.closing.share)} מהשכר האחרון לכל שנת שירות (אחרי שיפור שחל על כל השנים). השכר הממוצע הצפוי בפרישה ${fmt(GROUP.closing.finalSalary)} ₪. מה ① — ההטבה לשנת שירות לעובד?`, GROUP.closing.share * GROUP.closing.finalSalary, [
      `${pct(GROUP.closing.share)} × ${fmt(GROUP.closing.finalSalary)} = ${fmt(GROUP.closing.share * GROUP.closing.finalSalary)} ₪.`,
    ]),
    calc("grp-close-heads", "③ בסגירה", `${GROUP.closing.staff} עובדים, ו-${pct(GROUP.closing.stay)} מהם צפויים להגיע לפרישה. מה ③?`, GROUP.closing.staff * GROUP.closing.stay, [`${GROUP.closing.staff} × ${pct(GROUP.closing.stay)} = ${fmt(GROUP.closing.staff * GROUP.closing.stay)}.`]),
    calc(
      "grp-close",
      "התחייבות של קבוצה",
      `חברת לוגיסטיקה, ${GROUP.closing.date}: מענק ${pct(GROUP.closing.share)} מהשכר האחרון לכל שנת שירות; שכר ממוצע צפוי בפרישה ${fmt(GROUP.closing.finalSalary)} ₪; כל העובדים התחילו ב-1.1.${GROUP.start} (${GROUP.closing.years} שנות שירות); ${GROUP.closing.staff} עובדים, ${pct(GROUP.closing.stay)} צפויים לקבל; התשלום בעוד ${GROUP.closing.n} שנים. תשואת אג״ח ממשלתיות ${pct(GROUP.closing.government)}, קונצרניות איכותיות ${pct(GROUP.closing.corporate)}. מה ההתחייבות?`,
      GROUP_CLOSING,
      [
        `① ${fmt(GROUP.closing.share * GROUP.closing.finalSalary)}; ② ${GROUP.closing.years}; ③ ${fmt(GROUP.closing.staff * GROUP.closing.stay)}; ④ n = ${GROUP.closing.n}; ⑤ i = ${pct(GROUP.closing.corporate)} (הקונצרנית).`,
        `${fmt(GROUP.closing.share * GROUP.closing.finalSalary)} × ${GROUP.closing.years} × ${fmt(GROUP.closing.staff * GROUP.closing.stay)} ÷ ${1 + GROUP.closing.corporate}^${GROUP.closing.n} = ${fmt(Math.round(GROUP_CLOSING))} ₪.`,
      ],
    ),
    calc("cfo-final", "שכר בפרישה", `סמנכ״ל כספים התחיל לעבוד ב-1.1.${CFO.from} בשכר חודשי ${fmt(CFO.salary)} ₪. השכר עולה ב-${pct(CFO.firstRaise)} ב-${CFO.from + 1}, ומאז ב-${pct(CFO.raise)} בכל ינואר, עד הפרישה ב-31.12.${CFO.from + CFO.years - 1}. מה השכר החודשי בפרישה?`, CFO_FINAL, [
      `עלייה אחת של ${pct(CFO.firstRaise)} ועוד ${CFO.years - 2} עליות של ${pct(CFO.raise)} (מ-${CFO.from + 2} עד ${CFO.from + CFO.years - 1}).`,
      `${fmt(CFO.salary)} × ${1 + CFO.firstRaise} × ${1 + CFO.raise}^${CFO.years - 2} = ${fmt(CFO_FINAL)} ₪.`,
    ]),
    calc("cfo-per-year", "① לסמנכ״ל", `סמנכ״ל כספים יקבל בפרישה ${pct(CFO.share)} מהמשכורת החודשית האחרונה כפול שנות העבודה. המשכורת הצפויה בפרישה ${fmt(CFO_FINAL)} ₪. מה ההטבה לשנת שירות?`, CFO_PER_YEAR, [
      `${pct(CFO.share)} × ${fmt(CFO_FINAL)} = ${fmt(CFO_PER_YEAR)} ₪ לכל שנה — ובסך הכול, על ${CFO.years} שנים, ${fmt(CFO_TOTAL)} ₪.`,
    ]),
    calc("cfo-2022", "התחייבות לסמנכ״ל", `סמנכ״ל כספים, שנה ראשונה: הטבה לשנת שירות ${fmt(CFO_PER_YEAR)} ₪; ב-31.12.${CFO.from} עבד שנה אחת, ויפרוש בעוד ${CFO.years - 1} שנים; התשואה הקונצרנית ${pct(CFO.rate2022)}. מה ההתחייבות?`, CFO_2022, [
      `${fmt(CFO_PER_YEAR)} × 1 × 1 ÷ ${1 + CFO.rate2022}^${CFO.years - 1} = ${fmt(Math.round(CFO_2022))} ₪.`,
    ]),
    choice("pick-rate", "⑤ שיעור ההיוון", "בתאריך המדידה: אג״ח ממשלתיות 4.5%, קונצרניות איכותיות 6%; בתחילת השנה הקונצרנית הייתה 6.5%. מה ⑤?", ["6%", "4.5%", "6.5%", "5.25%"], 0, "הקונצרנית האיכותית בתאריך המדידה (IAS 19.83)."),
    choice("pick-n", "④ n", "עובד עבד 3 שנים, וצפוי לעבוד עוד 12 שנים עד הפרישה. מה n?", ["12", "3", "15", "9"], 0, "השנים מתאריך המדידה ועד התשלום."),
  ],
  traps,
  tips: [
    "התחייבות = הטבה לשנה × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ.",
    "מתכון 5 הצעדים: ① הטבה לשנת שירות בשכר הצפוי בפרישה; ② שנות שירות עד תאריך המדידה; ③ עובדים × הסתברות; ④ n = שנים עד התשלום; ⑤ i = תשואה קונצרנית איכותית בתאריך המדידה.",
    "שיטת יחידת הזכאות הצפויה (סעיף 68): כל שנת שירות מקנה ״יחידה״ של הטבה, וכל התשלומים מהוונים (סעיף 69).",
    "שיעור ההיוון (סעיף 83): תשואת אג״ח קונצרניות איכותיות בסוף התקופה; בישראל השוק עמוק — הממשלתית היא פיתיון.",
  ],
};
