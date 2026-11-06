import { definedContribution, grown, raised } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { FORMULA, said, work } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, lessonsRef, pct } from "../shared";

const KINDS = ["הפקדה מוגדרת", "הטבה מוגדרת"];

/** The worked example: a salary, a contribution rate, and December's contribution still unpaid at year end. */
export const DC = { payroll: 300_000, rate: 0.065 };
const dcPaid = (DC.payroll * DC.rate * 11) / 12;
export const DC_YEAR = definedContribution(DC.payroll, DC.rate, dcPaid);
export const DC_PAID = dcPaid;

/** "We solve" (a): new numbers; (b) a plan whose insurer took on every risk, the company paying a fixed premium. */
export const DC_VAR = { payroll: 420_000, rate: 0.07 };
export const DC_VAR_YEAR = definedContribution(DC_VAR.payroll, DC_VAR.rate, (DC_VAR.payroll * DC_VAR.rate * 11) / 12);
export const INSURED = { payroll: 15_000_000, premium: 0.006 };
export const INSURED_EXPENSE = INSURED.payroll * INSURED.premium;

/** The exercise: production workers under section 14 — at each year end, one month's salary per worker, raised every January. */
export const SECTION14 = { workers: 25, salary: 10_200, from: 2021, raise: 0.025 };
export const s14 = (year: number) => SECTION14.workers * raised(SECTION14.salary, Array(year - SECTION14.from).fill(SECTION14.raise));

const traps: Trap[] = [
  {
    id: "who-pays",
    prompt: "קרן חיצונית משלמת לעובדים את המענק כשהם פורשים, אבל אם בקרן חסר כסף — החברה חייבת להשלים. מה סוג התוכנית?",
    options: ["הטבה מוגדרת", "הפקדה מוגדרת — הקרן משלמת", "הטבה לזמן קצר", "אין התחייבות"],
    answer: 0,
    why: "המבחן הוא מי נושא בסיכון. החובה להשלים חוסר משאירה את הסיכון אצל החברה.",
    traps: ["", "המלכודת: לסווג לפי מי משלם בפועל. מי שמשלם הוא הקרן — אבל הסיכון של החברה.", "התשלום הוא אחרי סיום ההעסקה.", "ההבטחה להשלים היא בדיוק ההתחייבות."],
  },
  {
    id: "fund-trap",
    prompt: "החברה מפקידה בקרן נפרדת, וגם ערבה לתשואה מינימלית של 3% על ההפקדות. מה הסוג?",
    options: ["הטבה מוגדרת", "הפקדה מוגדרת — יש קרן", "הפקדה מוגדרת, כל עוד התשואה מעל 3%", "תלוי בגודל הקרן"],
    answer: 0,
    why: "ערבות לתשואה מעבירה סיכון לחברה, ולכן התוכנית היא הטבה מוגדרת (סעיף 29).",
    traps: ["", "המלכודת: ״יש קרן ולכן הפקדה מוגדרת״. הקרן לא מעבירה את הסיכון כשיש ערבות.", "הסיכון קיים גם בשנה טובה — הסיווג לא משתנה כל שנה.", "הגודל לא קובע; הערבות קובעת."],
  },
  {
    id: "section14-part",
    prompt: "עובד חתום על סעיף 14 לחוק פיצויי פיטורין. על איזה חלק בתוכנית הסעיף חל?",
    options: ["על רכיב הפיצויים בלבד", "על כל זכויות הפרישה שלו", "על הפיצויים ועל שאר ההפקדות לעובד", "על שום רכיב — זה רק טופס"],
    answer: 0,
    why: "סעיף 14 הופך את רכיב הפיצויים להפקדה מוגדרת. רכיבים אחרים נבחנים בנפרד.",
    traps: ["", "המלכודת: להחיל את הסעיף על הכול. יש רכיבים שהוא לא נוגע בהם.", "שאר ההפקדות נבחנות לפי התנאים שלהן, לא לפי סעיף 14.", "סעיף 14 משנה את הסיווג של רכיב הפיצויים."],
  },
  {
    id: "discount-dc",
    prompt: "הפקדה מוגדרת של דצמבר, 2,400 ₪, תועבר ב-10 בינואר. כמה התחייבות רושמים ב-31.12?",
    options: ["2,400 ₪", "הערך הנוכחי של 2,400 ₪", "0 — היא תשולם בקרוב", "28,800 ₪"],
    answer: 0,
    why: "בהפקדה מוגדרת לא מהוונים, אלא אם ההפקדה תשולם יותר מ-12 חודשים אחרי סוף השנה (סעיף 52).",
    traps: ["", "המלכודת: להוון הפקדה שוטפת. היא תשולם בעוד שבועיים.", "השירות של דצמבר כבר ניתן — ההפקדה מגיעה.", "רק ההפקדה של דצמבר טרם שולמה."],
  },
  {
    id: "full-severance",
    prompt: "החברה מתחייבת לשלם לכל עובד בסיום ההעסקה משכורת אחרונה כפול שנות העבודה, בלי סעיף 14. מה הסוג?",
    options: ["הטבה מוגדרת", "הפקדה מוגדרת", "הטבה לזמן קצר", "הטבה בגין פיטורין"],
    answer: 0,
    why: "החברה הבטיחה סכום לפי נוסחה — ועליה הסיכון שהשכר יעלה או שהעובד יעבוד יותר שנים.",
    traps: ["", "המלכודת: לבלבל בין פיצויים לפי סעיף 14 (הפקדה מוגדרת) לבין פיצויים מלאים לפי משכורת אחרונה.", "התשלום הוא בסיום ההעסקה, לא בתוך שנה מהשירות.", "הוא נצבר עם השירות ומשולם בכל סיום — לא בגלל החלטה לפטר."],
  },
];

/** Lesson 4: defined contribution against defined benefit — who carries the risk, and how a defined contribution is booked. */
export const DC_LESSON: StudyModule = {
  slug: "ias19-dc",
  course: COURSE,
  n: 4,
  title: "הפקדה מוגדרת מול הטבה מוגדרת: סיווג ורישום",
  description: `הענף של ההטבות לאחר סיום העסקה מתפצל לשניים: הפקדה מוגדרת — פשוטה, והיא כולה בשיעור הזה — והטבה מוגדרת, שתמלא את ${lessonsRef("ias19-measure", "ias19-present")}. המבחן: מי נושא בסיכון.`,
  goal: "להכריע אם תוכנית פרישה היא הפקדה מוגדרת או הטבה מוגדרת, ולרשום הפקדה מוגדרת.",
  outcomes: ["לזהות הטבה לאחר סיום העסקה — בפרישה ולגמלאים", "להכריע בין הפקדה מוגדרת להטבה מוגדרת לפי מי נושא בסיכון", "לזהות ערבות או חובת השלמה שהופכות תוכנית להטבה מוגדרת", "לרשום הוצאה והתחייבות בהפקדה מוגדרת", "להבחין בין פיצויים לפי סעיף 14 לבין פיצויים מלאים"],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-dc-hook", title: "דמי כיס, או ״אני משלם על הכול״" },
    { id: "emp-dc-what", title: "מה נחשב הטבה לאחר סיום העסקה" },
    { id: "emp-dc-two", title: "שתי תוכניות: הפקדה מוגדרת והטבה מוגדרת" },
    { id: "emp-dc-test", title: "המבחן: מי נושא בסיכון" },
    { id: "emp-dc-record", title: "הכלל: איך רושמים הפקדה מוגדרת" },
    { id: "emp-dc-template", title: "תבנית פתרון: שאלת הפקדה מוגדרת" },
    { id: "emp-dc-solved", title: "דוגמה פתורה: הפקדה שעוד לא הועברה" },
    { id: "emp-dc-together", title: "פותרים יחד: שכר אחר, ומבטח שלקח את הסיכון" },
    { id: "emp-dc-drill", title: "מחולל שאלות: סיווג ורישום, במספרים חדשים" },
    { id: "emp-dc-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("s14-2023", "סעיף 14: הוצאה", `${SECTION14.workers} עובדי ייצור חתומים על סעיף 14. בסוף כל שנה מפקידה החברה לכל עובד את משכורתו החודשית האחרונה. השכר ב-${SECTION14.from} היה ${fmt(SECTION14.salary)} ₪, ועולה ב-${pct(SECTION14.raise)} בכל ינואר. מה ההוצאה של 2023?`, s14(2023), [
      `שכר 2023, אחרי שתי העלאות:\n${said(work.grown(SECTION14.salary, SECTION14.raise, 2023 - SECTION14.from))}`,
      said(work.perHead(grown(SECTION14.salary, SECTION14.raise, 2023 - SECTION14.from), SECTION14.workers, true)),
      "כולו שולם, ולכן אין יתרה במאזן.",
    ]),
    calc("s14-2024", "סעיף 14: השנה הבאה", `${SECTION14.workers} עובדי ייצור חתומים על סעיף 14; בסוף כל שנה מופקדת לכל אחד משכורתו החודשית האחרונה. השכר ב-${SECTION14.from} היה ${fmt(SECTION14.salary)} ₪ ועולה ב-${pct(SECTION14.raise)} בכל ינואר. מה ההוצאה של 2024?`, s14(2024), [
      `שכר 2024, אחרי שלוש העלאות:\n${said(work.grown(SECTION14.salary, SECTION14.raise, 2024 - SECTION14.from))}`,
      said(work.perHead(grown(SECTION14.salary, SECTION14.raise, 2024 - SECTION14.from), SECTION14.workers, true)),
    ]),
    calc("dc-payable", "הפקדה שטרם הועברה", `שכר שנתי ${fmt(DC_VAR.payroll)} ₪, הפקדת מעסיק ${pct(DC_VAR.rate)}, והכסף עובר ב-10 לחודש שאחרי. מה ההתחייבות ב-31.12?`, DC_VAR_YEAR.liability, [
      said(work.dcExpense(DC_VAR.payroll, DC_VAR.rate)),
      `שולמו 11 חודשים:\n${said(work.dcPaid(DC_VAR_YEAR.expense, 11))}`,
      `מה שנשאר הוא ההפקדה של דצמבר:\n${said(work.dcPayable(DC_VAR_YEAR.expense, DC_VAR_YEAR.expense - DC_VAR_YEAR.liability))}`,
    ]),
    choice("cls-lump", "סיווג", "מענק חד־פעמי בפרישה או בפיטורין לפי שנות ותק, בלי קרן נפרדת.", KINDS, 1, "החברה הבטיחה סכום — הסיכון עליה."),
    choice("cls-trust", "סיווג", "החברה מעבירה כסף לחשבון נאמנות שממנו יקנו מתנות פרישה; אם לא יספיק, החברה תשלים.", KINDS, 1, "חשבון הנאמנות לא מעביר את הסיכון — החברה משלימה."),
    choice("cls-topup", "סיווג", "לעובדי המכירות פוליסת ביטוח, והחברה מחויבת להשלים את ההפרש אם הפוליסה לא תכסה את המענק המובטח.", KINDS, 1, "חובת השלמה = הסיכון אצל החברה."),
    choice("cls-exec", "סיווג", "למנכ״ל מובטח מענק בסיום ההעסקה, ואין עבורו שום הפקדות.", KINDS, 1, "אין הפקדות כלל — כל הסיכון על החברה."),
    choice("cls-gift", "סיווג", "לכל גמלאי נשלח שי לחג פעמיים בשנה, כל עוד הוא בחיים; אין קרן.", KINDS, 1, "הטבה לגמלאים (סעיף 26): כמה שנים ישולם השי תלוי בתוחלת החיים — הסיכון על החברה."),
    choice("cls-insurer", "סיווג", "מבטח קיבל על עצמו את כל הסיכון, והחברה משלמת רק פרמיה קבועה של 0.6% מהשכר.", KINDS, 0, "החברה פטורה מכל מחויבות מעבר לפרמיה."),
    journal(
      "dc-entry",
      "רישום הפקדה מוגדרת",
      `שכר שנתי ${fmt(DC.payroll)} ₪, הפקדת מעסיק ${pct(DC.rate)}. 11 חודשים הועברו, ודצמבר יועבר בינואר. רשמו את הוצאות השנה.`,
      [
        { account: "הוצאות שכר", dr: DC_YEAR.expense },
        { account: "מזומן", cr: DC_PAID },
        { account: "זכאים", cr: DC_YEAR.liability },
      ],
      `ההוצאה היא ההפקדה המגיעה בגין השנה; מה שעוד לא הועבר הוא התחייבות.\n${said(work.dcExpense(DC.payroll, DC.rate))}\n${said(work.dcPaid(DC_YEAR.expense, 11))}\n${said(work.dcPayable(DC_YEAR.expense, DC_PAID))}`,
      ["הוצאות שכר", "מזומן", "זכאים", "התחייבות בשל הטבה מוגדרת", "הוצאות מימון"],
    ),
  ],
  traps,
  tips: [
    "הטבה לאחר סיום העסקה (סעיף 26): כל הטבה שמשולמת אחרי סיום ההעסקה — פנסיה, מענק פרישה, שי לגמלאים, השתתפות בהוצאות רפואיות — חוץ מפיטורין ומהטבות לזמן קצר.",
    "הפקדה מוגדרת: ההוצאה שווה להפקדה. הטבה מוגדרת: מדידה אקטוארית.",
    `רישום הפקדה מוגדרת (סעיפים 51–52): ${FORMULA.dcExpense}; ${FORMULA.dcPayable} (ואם שילמו יותר, נכס); בלי היוון, אלא אם ההפקדה תשולם יותר מ-12 חודשים אחרי סוף השנה.`,
    "המבחן הוא מי נושא בסיכון, לא מי משלם. ערבות לתשואה או חובה להשלים פער הופכות תוכנית להטבה מוגדרת (סעיף 29).",
    "בישראל: רכיב הפיצויים לפי סעיף 14 — הפקדה מוגדרת; פיצויים מלאים לפי משכורת אחרונה — הטבה מוגדרת.",
  ],
};
