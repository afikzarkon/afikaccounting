import { balancingPN, expectedHeads, grown, pv } from "@/lib/learn/ias19";
import { fmt, type Ias19Slug, LESSON_N } from "./shared";

/**
 * "Before we start": what a student has to bring to the course, on the course
 * page above lesson 1. Every card is needed, none optional. Each says it
 * plainly, says why the course can't do without it, gives an example from life
 * and asks a self-check whose answer comes from the solver. Each card lists the
 * lessons that need it; who needs what is derived from that list, never typed
 * twice.
 */

export type PrimerId = "accrual" | "journal" | "obligation" | "pl-oci" | "pv" | "roll" | "percent";
export type PrimerCheck = { q: string; options: string[]; answer: number; why: string };
export type PrimerCard = {
  id: PrimerId;
  title: string;
  /** The lessons that use it. */
  needed: Ias19Slug[];
  /** Where it is taught from scratch. */
  taught: string;
  plain: string;
  /** Why the course can't do without it. */
  need: string;
  life: string;
  /** More places it turns up in the course, one line each. */
  examples?: string[];
  rule?: string;
  checks: PrimerCheck[];
};

/** The self-checks' figures, from the solver. */
export const PRIMER_PV = { fv: 10_000, i: 0.05, n: 2 };
export const PRIMER_PV_ANSWER = Math.round(pv(PRIMER_PV.fv, PRIMER_PV.i, PRIMER_PV.n));
/** Distractors that are real mistakes: one year only, and multiplying instead of dividing. */
export const PRIMER_PV_ONE_YEAR = Math.round(pv(PRIMER_PV.fv, PRIMER_PV.i, 1));
export const PRIMER_PV_TIMES = Math.round(PRIMER_PV.fv * (1 + PRIMER_PV.i) ** PRIMER_PV.n);

export const PRIMER_ROLL = { opening: 500, interest: 40, service: 100, payments: 80, closing: 590 };
export const PRIMER_ROLL_ANSWER = balancingPN({ ...PRIMER_ROLL, pastService: 0, settled: 0 });
export const PRIMER_ROLL_EXPECTED = PRIMER_ROLL.opening + PRIMER_ROLL.interest + PRIMER_ROLL.service - PRIMER_ROLL.payments;

export const PRIMER_PERCENT = { staff: 250, leaving: 0.08 };
export const PRIMER_PERCENT_ANSWER = expectedHeads(PRIMER_PERCENT.staff, PRIMER_PERCENT.leaving);

/** The examples from life the cards draw: 100 ₪ in five years at 8%; a bank page; a company's year; 40 employees, 90% staying. */
export const LIFE_PV = { fv: 100, i: 0.08, n: 5 };
export const LIFE_PV_TODAY = Math.round(pv(LIFE_PV.fv, LIFE_PV.i, LIFE_PV.n));
/** The same 100 ₪, half a year away: the power is 0.5. */
export const LIFE_PV_HALF = Math.round(pv(LIFE_PV.fv, LIFE_PV.i, 0.5));
export const LIFE_BANK = { opening: 1_000, deposit: 300, withdrawal: 200, closing: 1_150 };
export const LIFE_PL = { income: 1_000, expenses: 700, revaluation: 50 };
export const LIFE_HEADS = { staff: 40, leaving: 0.1 };

/** Where percentages turn up in the course: staff who leave, a yearly raise, a bonus on profit. */
export const PCT_LEAVE = { staff: 200, leaving: 0.15 };
export const PCT_RAISE = { salary: 10_000, growth: 0.03 };
export const PCT_BONUS = { share: 0.05, profit: 400_000 };

const pct = (r: number) => `${Math.round(r * 100)}%`;

export const PRIMER: PrimerCard[] = [
  {
    id: "accrual",
    title: "מתי רושמים הוצאה",
    needed: ["ias19-map", "ias19-short"],
    taught: "בקורס ״חשבונאות מאפס״",
    plain: "הוצאה נרשמת בתקופה שבה החברה קיבלה את העבודה או את השירות. מתי הכסף יצא מהחשבון לא משנה לעניין הזה.",
    need: "כל הקורס עומד על הרעיון הזה. עובד עובד היום, ולפעמים מקבל את הכסף רק בעוד שלושים שנה. ההוצאה בכל זאת שייכת להיום.",
    life: "החשמל של דצמבר מגיע בחשבון של ינואר. ההוצאה היא של דצמבר, כי בדצמבר השתמשו בחשמל.",
    checks: [{ q: "עובד עבד בדצמבר, ושכרו משולם ב-5 בינואר. באיזו שנה ההוצאה?", options: ["בשנה שבה עבד (דצמבר)", "בשנה שבה שולם (ינואר)", "חצי בכל שנה", "רק כשמגישים דוחות"], answer: 0, why: "העבודה נעשתה בדצמבר, ולכן ההוצאה שם." }],
  },
  {
    id: "journal",
    title: "פקודת יומן (חובה וזכות)",
    needed: ["ias19-short", "ias19-dc", "ias19-present"],
    taught: "בקורס ״חשבונאות מאפס״",
    plain: "כל פעולה נרשמת בשני צדדים, באותו סכום: חובה וזכות.",
    need: "זה בסיס בחשבונאות, ובלעדיו אי אפשר לפתור כאן שאלה. כמעט כל שאלה במבחן מבקשת בסוף לרשום את הפקודות.",
    life: "שילמת שכר של 200 במזומן: ההוצאה גדלה (חובה), והמזומן קטן (זכות).",
    checks: [
      {
        q: "נרשמת הוצאת שכר של 100 שעוד לא שולמה. מה הפקודה?",
        options: ["ח׳ הוצאות שכר 100, ז׳ התחייבות לעובדים 100", "ח׳ התחייבות לעובדים 100, ז׳ הוצאות שכר 100", "ח׳ הוצאות שכר 100, ז׳ מזומן 100", "אין פקודה עד התשלום"],
        answer: 0,
        why: "ההוצאה בחובה. הכסף עוד לא יצא, ולכן בזכות רושמים חוב לעובדים ולא מזומן.",
      },
    ],
  },
  {
    id: "obligation",
    title: "מחויבות משפטית ומשתמעת (IAS 37)",
    needed: ["ias19-map", "ias19-short", "ias19-other"],
    taught: `כאן, בכרטיס הזה; חוזר בשיעור ${LESSON_N["ias19-map"]}`,
    plain: "IAS 37 הוא התקן של הפרשות. משם מגיעים שני סוגי חוב. מחויבות משפטית כתובה בחוזה או בחוק, ואפשר לתבוע עליה. מחויבות משתמעת לא כתובה בשום מקום, אבל החברה התנהגה כך שנים, והעובדים סומכים על זה.",
    need: "חוב לעובדים נרשם גם כשאין עליו חוזה. בונוס שניתן כל שנה מתוך הרגל הוא דוגמה טובה, וגם פיטורים שכבר הודיעו עליהם.",
    life: "כבר עשר שנים החברה נותנת שי לחג לכל עובד, בלי שום חוזה. העובדים מחכים לשי גם השנה. זו מחויבות משתמעת, ורושמים אותה כמו חוב בחוזה.",
    checks: [
      {
        q: "אין סעיף בחוזה, אבל כבר שבע שנים החברה משלמת בונוס בסוף שנה, וכולם מצפים לו. צריך לרשום חוב?",
        options: ["כן, יש כאן מחויבות משתמעת", "לא, בלי חוזה אין חוב", "רק אם עובד יתבע", "רק אם הבונוס נקבע בחוק"],
        answer: 0,
        why: "נוהג קבוע שהעובדים סומכים עליו יוצר מחויבות, גם בלי מסמך.",
      },
    ],
  },
  {
    id: "pl-oci",
    title: "רווח והפסד מול רווח כולל אחר (OCI)",
    needed: ["ias19-dc", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `כאן, בכרטיס הזה; תזכורת בשיעורים ${LESSON_N["ias19-rollforward"]} ו-${LESSON_N["ias19-present"]}`,
    plain: "רווח והפסד הוא הדוח של השנה: הכנסות פחות הוצאות. OCI, רווח כולל אחר, הוא שינוי בשווי שלא נכנס לרווח של השנה. הוא נצבר בהון העצמי, בקרן הון, ולא עובר דרך הרווח.",
    need: "בשאלות של הטבות עובד כל שורה הולכת לאחד משני המקומות. מי שמבלבל ביניהם מקבל רווח שגוי, גם כשכל החישובים נכונים.",
    life: `לחברה הכנסות ${fmt(LIFE_PL.income)} והוצאות ${fmt(LIFE_PL.expenses)}, אז הרווח ${fmt(LIFE_PL.income - LIFE_PL.expenses)}. בנוסף הקרקע שלה עלתה בשווי ב-${LIFE_PL.revaluation}. העלייה הזו היא OCI: היא מגדילה את ההון, אבל הרווח נשאר ${fmt(LIFE_PL.income - LIFE_PL.expenses)}.`,
    rule: "רווח כולל = רווח והפסד + OCI. אצלנו: עלות העבודה והריבית לרווח והפסד. שינויים בהערכות ל-OCI, ומשם לא חוזרים לרווח.",
    checks: [
      { q: "עלות העובדים של השנה גדלה. לאן זה הולך?", options: ["רווח והפסד", "OCI", "ישר למאזן", "לא נרשם"], answer: 0, why: "זו עלות של עבודה שנעשתה השנה, ולכן היא חלק מהרווח של השנה." },
      { q: "החוב לעובדים גדל כי ריבית ההיוון ירדה. לאן זה הולך?", options: ["OCI", "רווח והפסד", "לא נרשם", "ישר להון, בלי לעבור בשום דוח"], answer: 0, why: "זה שינוי בהערכה, לא עבודה של השנה. לכן הוא ב-OCI ונצבר בקרן הון." },
    ],
  },
  {
    id: "pv",
    title: "ערך נוכחי (היוון)",
    needed: ["ias19-toolkit", "ias19-measure", "ias19-attribute", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `מאפס בשיעור ${LESSON_N["ias19-toolkit"]}`,
    plain: "כסף שמקבלים מאוחר שווה פחות מכסף שמקבלים עכשיו. כסף שבידך אפשר להשקיע ולהרוויח עליו ריבית.",
    need: "חוב לעובדים משולם לרוב בעוד שנים רבות. בדוחות רושמים כמה הוא שווה היום, ולכן כמעט כל חישוב בקורס עובר דרך היוון.",
    life: `מציעים לך ${LIFE_PV.fv} ₪ היום, או ${LIFE_PV.fv} ₪ בעוד ${LIFE_PV.n} שנים. כולם בוחרים היום. בריבית ${pct(LIFE_PV.i)}, ה-${LIFE_PV.fv} של בעוד ${LIFE_PV.n} שנים שווים היום בערך ${LIFE_PV_TODAY}.`,
    rule: "מחלקים ב-(1 + ריבית) פעם אחת לכל שנה עד התשלום. חצי שנה היא חזקה של 0.5.",
    checks: [
      {
        q: `סכום של ${fmt(PRIMER_PV.fv)} ₪ ישולם בעוד ${PRIMER_PV.n} שנים, בריבית ${pct(PRIMER_PV.i)}. כמה הוא שווה היום?`,
        options: [`כ-${fmt(PRIMER_PV_ANSWER)}`, `כ-${fmt(PRIMER_PV_ONE_YEAR)}`, fmt(PRIMER_PV_TIMES), fmt(PRIMER_PV.fv)],
        answer: 0,
        why: `${fmt(PRIMER_PV.fv)} ÷ 1.05² = כ-${fmt(PRIMER_PV_ANSWER)}. מחלקים פעמיים, פעם לכל שנה. ${fmt(PRIMER_PV_ONE_YEAR)} הוא שנה אחת בלבד; ${fmt(PRIMER_PV_TIMES)} הוא כפל במקום חילוק.`,
      },
    ],
  },
  {
    id: "roll",
    title: "מעגל: מיתרת פתיחה ליתרת סגירה",
    needed: ["ias19-toolkit", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `מאפס בשיעור ${LESSON_N["ias19-toolkit"]}, ומתרגלים בכל שיעור מ-${LESSON_N["ias19-rollforward"]} עד ${LESSON_N["ias19-other"]}`,
    plain: "כמו דף חשבון בנק: יתרת פתיחה, ועוד מה שנכנס, פחות מה שיצא, שווה יתרת סגירה. מה שנשאר בלי הסבר הוא המספר המאזן. בקורס קוראים לו P.N.",
    need: "בלי מעגל אי אפשר לפתור כאן תרגילים. החוב לעובדים והקופה מנוהלים כל אחד במעגל משלו, וכמעט כל שאלה מתחילה בבניית מעגל.",
    life: `בחשבון היו ${fmt(LIFE_BANK.opening)}, הפקדת ${fmt(LIFE_BANK.deposit)}, משכת ${fmt(LIFE_BANK.withdrawal)}, ובדף כתוב ${fmt(LIFE_BANK.closing)}. ${fmt(LIFE_BANK.opening)} + ${fmt(LIFE_BANK.deposit)} − ${fmt(LIFE_BANK.withdrawal)} = ${fmt(LIFE_BANK.opening + LIFE_BANK.deposit - LIFE_BANK.withdrawal)}, ולכן ${fmt(LIFE_BANK.closing - LIFE_BANK.opening - LIFE_BANK.deposit + LIFE_BANK.withdrawal)} עוד לא הוסברו. הם המספר המאזן.`,
    rule: "פתיחה + מה שנוסף − מה ששולם ± המספר המאזן = סגירה.",
    checks: [
      {
        q: `חוב לעובדים: פתיחה ${PRIMER_ROLL.opening}, ריבית ${PRIMER_ROLL.interest}, עלות שירות ${PRIMER_ROLL.service}, תשלום ${PRIMER_ROLL.payments}, סגירה ${PRIMER_ROLL.closing}. מהו המספר המאזן?`,
        options: [`${PRIMER_ROLL_ANSWER}: החוב גדל ב-${PRIMER_ROLL_ANSWER} יותר מהמצופה`, `${PRIMER_ROLL_ANSWER}: החוב קטן ב-${PRIMER_ROLL_ANSWER}`, String(PRIMER_ROLL_EXPECTED), String(PRIMER_ROLL.closing - PRIMER_ROLL.opening)],
        answer: 0,
        why: `${PRIMER_ROLL.opening} + ${PRIMER_ROLL.interest} + ${PRIMER_ROLL.service} − ${PRIMER_ROLL.payments} = ${PRIMER_ROLL_EXPECTED}. בסגירה יש ${PRIMER_ROLL.closing}, ולכן ${PRIMER_ROLL_ANSWER} לא הוסברו: החוב גדל יותר מהמצופה.`,
      },
    ],
  },
  {
    id: "percent",
    title: "אחוזים ועובדים צפויים",
    needed: ["ias19-short", "ias19-measure", "ias19-attribute"],
    taught: "כאן, בכרטיס הזה",
    plain: `לא כל העובדים יישארו עד שיגיע להם הכסף. לכן סופרים רק את מי שצפוי להישאר: ${LIFE_HEADS.staff} עובדים, ו-${pct(1 - LIFE_HEADS.leaving)} מהם צפויים להישאר, הם ${expectedHeads(LIFE_HEADS.staff, LIFE_HEADS.leaving)} עובדים.`,
    need: "בשאלות הנתונים מגיעים כמעט תמיד באחוזים: כמה יעזבו, בכמה יעלה השכר, איזה חלק מהרווח הולך לבונוס. צריך לתרגם כל אחוז למספר לפני שמתחילים.",
    life: `מתוך ${LIFE_HEADS.staff} עובדים, ${Math.round(LIFE_HEADS.staff * LIFE_HEADS.leaving)} צפויים לעזוב לפני שיקבלו. ההבטחה נספרת רק למי שיישאר.`,
    examples: [
      `${PCT_LEAVE.staff} עובדים, ו-${pct(PCT_LEAVE.leaving)} יעזבו לפני הפרישה: המענק נמדד ל-${expectedHeads(PCT_LEAVE.staff, PCT_LEAVE.leaving)} עובדים בלבד.`,
      `שכר של ${fmt(PCT_RAISE.salary)} ₪ שעולה ${pct(PCT_RAISE.growth)} בשנה: בשנה הבאה הוא ${fmt(grown(PCT_RAISE.salary, PCT_RAISE.growth, 1))} ₪.`,
      `בונוס של ${pct(PCT_BONUS.share)} מרווח של ${fmt(PCT_BONUS.profit)} ₪: ${fmt(PCT_BONUS.share * PCT_BONUS.profit)} ₪ לחלוקה.`,
    ],
    checks: [
      {
        q: `בחברה ${PRIMER_PERCENT.staff} עובדים, ו-${pct(PRIMER_PERCENT.leaving)} צפויים לעזוב. כמה צפויים להישאר?`,
        options: [String(PRIMER_PERCENT_ANSWER), String(PRIMER_PERCENT.staff * PRIMER_PERCENT.leaving), String(PRIMER_PERCENT.staff), String(PRIMER_PERCENT.staff - 8)],
        answer: 0,
        why: `${PRIMER_PERCENT.staff} × ${pct(1 - PRIMER_PERCENT.leaving)} = ${PRIMER_PERCENT_ANSWER}.`,
      },
    ],
  },
];

/**
 * What each lesson leans on, from the cards' own lists. Lesson 1 is where the
 * course starts, right under the cards on the course page, so its line stays
 * empty even where a card names it.
 */
export const PRIMER_NEEDS = Object.fromEntries(
  (Object.keys(LESSON_N) as Ias19Slug[]).map((slug) => [slug, slug === "ias19-map" ? [] : PRIMER.filter((c) => c.needed.includes(slug)).map((c) => c.id)]),
) as Record<Ias19Slug, PrimerId[]>;

export const primerTitle = (id: PrimerId) => PRIMER.find((c) => c.id === id)!.title;
