import { balancingPN, expectedHeads, pv } from "@/lib/learn/ias19";
import { fmt, type Ias19Slug, LESSON_N } from "./shared";

/**
 * "Before we start": six small understandings the course leans on, on the
 * course page above lesson 1 — three a must, three recommended. Each says it
 * plainly, gives an example from life and asks one self-check, whose answer
 * comes from the solver. Each card lists the lessons that need it; who needs
 * what is derived from that list, never typed twice.
 */

export type PrimerId = "pv" | "roll" | "pl-oci" | "accrual" | "journal" | "percent";
export type PrimerCheck = { q: string; options: string[]; answer: number; why: string };
export type PrimerCard = {
  id: PrimerId;
  title: string;
  level: "must" | "recommended";
  /** The lessons that use it. */
  needed: Ias19Slug[];
  /** Where it is taught from scratch. */
  taught: string;
  plain: string;
  life: string;
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
export const LIFE_BANK = { opening: 1_000, deposit: 300, withdrawal: 200, closing: 1_150 };
export const LIFE_PL = { income: 1_000, expenses: 700, revaluation: 50 };
export const LIFE_HEADS = { staff: 40, leaving: 0.1 };

const pct = (r: number) => `${Math.round(r * 100)}%`;

export const PRIMER: PrimerCard[] = [
  {
    id: "pv",
    title: "ערך נוכחי (היוון)",
    level: "must",
    needed: ["ias19-toolkit", "ias19-measure", "ias19-attribute", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `מאפס בשיעור ${LESSON_N["ias19-toolkit"]}`,
    plain: "כסף שמקבלים מאוחר שווה פחות מכסף שמקבלים עכשיו. כסף שבידך עכשיו אפשר להשקיע ולהרוויח עליו ריבית.",
    life: `מציעים לך ${LIFE_PV.fv} ₪ היום, או ${LIFE_PV.fv} ₪ בעוד ${LIFE_PV.n} שנים. כולם בוחרים היום. בריבית ${pct(LIFE_PV.i)}, ה-${LIFE_PV.fv} של בעוד ${LIFE_PV.n} שנים שווים היום רק כ-${Math.round(pv(LIFE_PV.fv, LIFE_PV.i, LIFE_PV.n))}.`,
    rule: "ערך נוכחי = סכום עתידי ÷ (1 + ריבית) בחזקת מספר השנים.",
    checks: [
      {
        q: `${fmt(PRIMER_PV.fv)} ₪ ישולמו בעוד ${PRIMER_PV.n} שנים, בריבית ${pct(PRIMER_PV.i)}. כמה הם שווים היום?`,
        options: [`כ-${fmt(PRIMER_PV_ANSWER)}`, `כ-${fmt(PRIMER_PV_ONE_YEAR)}`, fmt(PRIMER_PV_TIMES), fmt(PRIMER_PV.fv)],
        answer: 0,
        why: `${fmt(PRIMER_PV.fv)} ÷ 1.05² = כ-${fmt(PRIMER_PV_ANSWER)}. מחלקים פעמיים, פעם לכל שנה. ${fmt(PRIMER_PV_ONE_YEAR)} הוא שנה אחת בלבד; ${fmt(PRIMER_PV_TIMES)} הוא כפל במקום חילוק.`,
      },
    ],
  },
  {
    id: "roll",
    title: "מעגל (Roll-forward)",
    level: "must",
    needed: ["ias19-toolkit", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `מאפס בשיעור ${LESSON_N["ias19-toolkit"]}, ומתרגלים בכל שיעור מ-${LESSON_N["ias19-rollforward"]} עד ${LESSON_N["ias19-other"]}`,
    plain: "כמו דף חשבון בנק: יתרת פתיחה, ועוד מה שנכנס, פחות מה שיצא, שווה יתרת סגירה. מה שנשאר בלי הסבר הוא המספר המאזן (בקורס: P.N.).",
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
    id: "pl-oci",
    title: "רווח והפסד ו-OCI",
    level: "must",
    needed: ["ias19-dc", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"],
    taught: `כאן, בכרטיס הזה; תזכורת בשיעורים ${LESSON_N["ias19-rollforward"]} ו-${LESSON_N["ias19-present"]}`,
    plain: "רווח והפסד הוא מה שהחברה עשתה השנה: הכנסות פחות הוצאות, כמו תלוש המשכורת. OCI (רווח כולל אחר) הוא שינוי בשווי שלא בא מהעבודה, כמו עליית מחיר הדירה שלך.",
    life: `לחברה הכנסות ${fmt(LIFE_PL.income)} והוצאות ${fmt(LIFE_PL.expenses)}: רווח והפסד ${fmt(LIFE_PL.income - LIFE_PL.expenses)}. הקרקע שלה עלתה בשווי ב-${LIFE_PL.revaluation}: זה OCI. הרווח הכולל ${fmt(LIFE_PL.income - LIFE_PL.expenses + LIFE_PL.revaluation)}.`,
    rule: "רווח כולל = רווח והפסד + OCI. ב-IAS 19: עלות העבודה והריבית לרווח והפסד; שינויי הערכה ל-OCI, ולעולם לא חוזרים.",
    checks: [
      { q: "עלות העובדים של השנה גדלה. לאן זה הולך?", options: ["רווח והפסד", "OCI", "ישר למאזן", "לא נרשם"], answer: 0, why: "זו עלות של עבודה שנעשתה השנה: מה שהחברה עשתה." },
      { q: "החוב לעובדים גדל כי ריבית ההיוון ירדה. לאן זה הולך?", options: ["OCI", "רווח והפסד", "לא נרשם", "ישר להון, בלי לעבור בשום דוח"], answer: 0, why: "זה שינוי בהערכה שאף אחד לא החליט עליו, ולכן OCI." },
    ],
  },
  {
    id: "accrual",
    title: "הוצאה נרשמת כשהשירות נצרך, לא כשמשלמים",
    level: "recommended",
    needed: ["ias19-map", "ias19-short"],
    taught: "בקורס ״חשבונאות מאפס״",
    plain: "ההוצאה שייכת לתקופה שבה קיבלת את השירות, גם אם הכסף יוצא אחר כך.",
    life: "צרכת חשמל בדצמבר ושילמת בינואר. ההוצאה היא של דצמבר.",
    checks: [{ q: "עובד עבד בדצמבר, ושכרו משולם ב-5 בינואר. באיזו שנה ההוצאה?", options: ["בשנה שבה עבד (דצמבר)", "בשנה שבה שולם (ינואר)", "חצי בכל שנה", "רק כשמגישים דוחות"], answer: 0, why: "העבודה נעשתה בדצמבר, ולכן ההוצאה שם." }],
  },
  {
    id: "journal",
    title: "פקודת יומן (חובה וזכות)",
    level: "recommended",
    needed: ["ias19-short", "ias19-dc", "ias19-present"],
    taught: "בקורס ״חשבונאות מאפס״",
    plain: "כל פעולה נרשמת בשני צדדים, בסכום זהה: חובה וזכות.",
    life: "שילמת שכר של 200 במזומן: ההוצאה גדלה (חובה), והמזומן קטן (זכות).",
    checks: [
      {
        q: "נרשמת הוצאת שכר של 100 שעוד לא שולמה. מה הפקודה?",
        options: ["ח׳ הוצאות שכר 100, ז׳ התחייבות לעובדים 100", "ח׳ התחייבות לעובדים 100, ז׳ הוצאות שכר 100", "ח׳ הוצאות שכר 100, ז׳ מזומן 100", "אין פקודה עד התשלום"],
        answer: 0,
        why: "ההוצאה בחובה; ועוד לא שולם, ולכן בזכות חוב לעובדים ולא מזומן.",
      },
    ],
  },
  {
    id: "percent",
    title: "אחוזים ועובדים צפויים",
    level: "recommended",
    needed: ["ias19-short", "ias19-measure", "ias19-attribute"],
    taught: "כאן, בכרטיס הזה",
    plain: `לא כולם נשארים, ולכן סופרים עובדים צפויים: ${LIFE_HEADS.staff} עובדים, ו-${pct(1 - LIFE_HEADS.leaving)} צפויים להישאר, הם ${expectedHeads(LIFE_HEADS.staff, LIFE_HEADS.leaving)} עובדים.`,
    life: `מתוך ${LIFE_HEADS.staff} עובדים, ${Math.round(LIFE_HEADS.staff * LIFE_HEADS.leaving)} צפויים לעזוב לפני שיקבלו. ההבטחה נספרת רק למי שיישאר.`,
    checks: [
      {
        q: `${PRIMER_PERCENT.staff} עובדים, ${pct(PRIMER_PERCENT.leaving)} צפויים לעזוב. כמה צפויים להישאר?`,
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
