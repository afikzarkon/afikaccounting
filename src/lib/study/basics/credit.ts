import { type Entry, round2 } from "@/lib/learn/basics";
import { ALLOW, AR, EXPENSE, SELF, year } from "@/lib/learn/credit-losses";
import type { JournalExercise, StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt } from "./shared";

/** A journal-entry question: the event, the answer's lines, why, and the accounts offered (the answer's and some that tempt). */
const journal = (id: string, skill: string, text: string, lines: Entry["lines"], why: string, accounts: string[]): JournalExercise => ({
  kind: "journal",
  id,
  skill,
  entry: { id: "1", text, lines, why },
  accounts,
});

// Every figure below is computed here, or by the credit-loss model, from the question's own numbers.
const FIRST = { gross: 260_000, rate: 0.05 }; // a new business's first year end
const firstAllowance = round2(FIRST.gross * FIRST.rate);
const BANKRUPT = 5_500;
const RECOVERED = 2_400;
const [TOPUP, OPENING, REVERSAL] = SELF;
// A troubled customer beside the general rate.
const SPECIFIC = { debt: 35_000, rate: 0.6, general: 0.04 };
const SPEC = year({
  openingAR: 540_000,
  openingAllowance: 18_000,
  creditSales: 1_350_000,
  collections: 1_260_000,
  required: (g) => SPECIFIC.debt * SPECIFIC.rate + (g - SPECIFIC.debt) * SPECIFIC.general,
});
// A recovered debt, and a credit purchase that has nothing to do with customers.
const BACK = { openingAR: 350_000, openingAllowance: 14_000, creditSales: 820_000, collections: 790_000, writeOffs: 8_000, recovered: 1_500, rate: 0.05, purchases: 260_000 };
const RECOVERY = year({ ...BACK, required: (g) => g * BACK.rate });
const NET = { gross: 280_000, rate: 0.04 };
const FROM_NET = { net: 456_000, rate: 0.04 };
const GAP = { opening: 280_000, closing: 310_000, sales: 940_000, writeOffs: 5_000 };
const CARD = { opening: 450_000, sales: 1_100_000, collections: 815_000, writeOffs: 27_000 };

const pct = (r: number) => `${round2(r * 100)}%`;
const adjLines = (x: { adj: Entry }) => x.adj.lines;
const amountOf = (x: { adj: Entry }) => x.adj.lines[0].dr!;

/** Lesson 5: credit losses — the allowance against customers, its entries, the three-rule method, and unknowns up to an exam question. */
export const CREDIT: StudyModule = {
  slug: "basics-credit",
  course: COURSE,
  n: 7,
  title: "הפסדי אשראי",
  description: "לקוחות ברוטו, הפרשה ונטו; מחיקה וגבייה של חוב אבוד; מתווה 3 הכללים עם שני כרטיסי T — ועד שאלה ברמת בחינה.",
  goal: "לטפל בלקוחות שאולי לא ישלמו — הפרשה, מחיקה וגבייה — עד שאלה ברמת בחינה.",
  outcomes: [
    "להציג לקוחות ברוטו, הפרשה ונטו",
    "לחשב הפרשה ספציפית וכללית ואת הוצאות הפסדי האשראי של השנה",
    "לרשום מחיקה של חוב אבוד וגבייה של חוב שכבר נמחק",
    "לחלץ נעלם בעזרת מתווה שלושת הכללים ושני כרטיסי T",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "cl-idea", title: "הרעיון: לא כל לקוח ישלם" },
    { id: "cl-net", title: "ברוטו, הפרשה ונטו" },
    { id: "cl-allowance", title: "ההפרשה של עינב: הוצאה מול כרית" },
    { id: "cl-terms", title: "חוב אבוד, חוב ספציפי — והנוסחה" },
    { id: "cl-entries", title: "הפקודות של השנה" },
    { id: "cl-method", title: "מתווה 3 הכללים" },
    { id: "cl-extract", title: "חילוץ נעלמים: ארבע נוסחאות" },
    { id: "cl-first", title: "דוגמה ראשונה: ארז בע״מ" },
    { id: "cl-scenarios", title: "שלושה תרחישים, שלושה נעלמים" },
    { id: "cl-specific", title: "הפרשה ספציפית וכללית" },
    { id: "cl-recovery", title: "מסיחים וחוב שחזר" },
    { id: "cl-exam", title: "שאלה ברמת בחינה: כרמל בע״מ" },
    { id: "cl-booklet", title: "שאלה ברמת החוברת: נווה, שלוש שנים" },
    { id: "cl-calc", title: "מחשבון: בדקו את התשובה שלכם" },
    { id: "cl-drill", title: "תרגול בלי סוף: הפסדי אשראי" },
  ],
  tools: [
    { screen: "cl-calc", label: "מחשבון הפסדי אשראי" },
    { screen: "cl-drill", label: "מחולל תרגילים: הפסדי אשראי" },
  ],
  exercises: [
    journal(
      "same-day",
      "מחיקה, ספציפית וכללית יחד",
      "לפני ההתאמות: לקוחות 900,000 ₪, הפרשה 50,000 ₪. ב-31.12 התברר שחוב של 30,000 ₪ אבוד, והוא נמחק כנגד ההפרשה. אחרי המחיקה: על לקוח שחייב 100,000 ₪ מפרישים 70%, ועל שאר הלקוחות 4%. רשמו את פקודת השלמת ההפרשה.",
      [
        { account: EXPENSE, dr: 80_800 },
        { account: ALLOW, cr: 80_800 },
      ],
      "אחרי המחיקה: לקוחות 870,000, הפרשה 20,000. נדרש: 70% × 100,000 = 70,000, ועוד 4% × 770,000 = 30,800 — סך 100,800. חסרים 80,800.",
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "first-allowance",
      "הפרשה ראשונה",
      `עסק חדש. ב-31.12, בסוף השנה הראשונה, יתרת הלקוחות ${fmt(FIRST.gross)} ₪, וההנהלה מעריכה ש-${pct(FIRST.rate)} מהם לא ייגבו. רשמו את פקודת ההפרשה.`,
      [
        { account: EXPENSE, dr: firstAllowance },
        { account: ALLOW, cr: firstAllowance },
      ],
      `${fmt(FIRST.gross)} × ${pct(FIRST.rate)} = ${fmt(firstAllowance)}. ההפרשה נפתחה ב-0, ולכן כל הסכום הוא הוצאה של השנה — השנה שבה נעשו המכירות. בזכות: ההפרשה, שמקטינה את הלקוחות.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "write-off",
      "מחיקת חוב אבוד",
      `לקוח שחייב ${fmt(BANKRUPT)} ₪ פשט רגל, והחוב לא ייגבה. רשמו את מחיקת החוב.`,
      [
        { account: ALLOW, dr: BANKRUPT },
        { account: AR, cr: BANKRUPT },
      ],
      "החוב יוצא מהלקוחות (זכות) ומהכרית שהכנו מראש (חובה). אין כאן הוצאה: ההפסד כבר נרשם כשהפרשנו, והלקוחות נטו לא משתנים.",
      [ALLOW, AR, EXPENSE, "מזומן"],
    ),
    journal(
      "recovery-back",
      "חוב שחזר",
      `חוב של ${fmt(RECOVERED)} ₪ שנמחק לפני שנתיים נגבה היום במזומן. רשמו את השלב הראשון — החזרת החוב לספרים.`,
      [
        { account: AR, dr: RECOVERED },
        { account: ALLOW, cr: RECOVERED },
      ],
      "מבטלים את המחיקה: החוב חוזר ללקוחות (חובה) ולהפרשה (זכות). בשלב השני הוא נגבה כרגיל — ח׳ מזומן / ז׳ לקוחות.",
      [AR, ALLOW, "מזומן", EXPENSE],
    ),
    journal(
      "top-up",
      "השלמת ההפרשה",
      `לקוחות ב-1.1: ${fmt(TOPUP.openingAR)} ₪, הפרשה ${fmt(TOPUP.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(TOPUP.creditSales!)} ₪, גבייה ${fmt(TOPUP.collections!)} ₪, מחיקת חובות אבודים ${fmt(TOPUP.writeOffs!)} ₪. ההפרשה הנדרשת: 5% מהלקוחות. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(TOPUP),
      `לקוחות בסוף השנה: ${fmt(TOPUP.mid.gross)}, ולכן נדרשת ${fmt(TOPUP.required)}. בכרטיס ההפרשה המחיקה (${fmt(TOPUP.writeOffs!)}) גדולה מהפתיחה (${fmt(TOPUP.openingAllowance)}) — לפני ההתאמה יש ${fmt(-TOPUP.mid.allowance)} בחובה. כדי להגיע ל-${fmt(TOPUP.required)} בזכות: ${fmt(amountOf(TOPUP))}.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "specific",
      "הפרשה ספציפית וכללית",
      `לקוחות ב-1.1: ${fmt(SPEC.openingAR)} ₪, הפרשה ${fmt(SPEC.openingAllowance)} ₪. מכירות באשראי ${fmt(SPEC.creditSales!)} ₪, גבייה ${fmt(SPEC.collections!)} ₪. ב-31.12 לקוח בקשיים חייב ${fmt(SPECIFIC.debt)} ₪ — הפרשה ספציפית ${pct(SPECIFIC.rate)}; על שאר הלקוחות ${pct(SPECIFIC.general)}. רשמו את פקודת ההתאמה.`,
      adjLines(SPEC),
      `לקוחות בסוף השנה: ${fmt(SPEC.mid.gross)}. ספציפית: ${fmt(SPECIFIC.debt)} × ${pct(SPECIFIC.rate)} = ${fmt(SPECIFIC.debt * SPECIFIC.rate)}. כללית — בלי הלקוח הספציפי: (${fmt(SPEC.mid.gross)} − ${fmt(SPECIFIC.debt)}) × ${pct(SPECIFIC.general)} = ${fmt(round2((SPEC.mid.gross - SPECIFIC.debt) * SPECIFIC.general))}. נדרשת ${fmt(SPEC.required)}, יש ${fmt(SPEC.mid.allowance)}: ההוצאה ${fmt(amountOf(SPEC))}.`,
      [EXPENSE, ALLOW, AR, "מזומן"],
    ),
    journal(
      "reversal",
      "ביטול הפרשה עודפת",
      `לקוחות ב-1.1: ${fmt(REVERSAL.openingAR)} ₪, הפרשה ${fmt(REVERSAL.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(REVERSAL.creditSales!)} ₪, גבייה ${fmt(REVERSAL.collections!)} ₪. בסוף השנה לקוח בקשיים חייב 40,000 ₪ (הפרשה ספציפית 75%), ועל השאר 3%. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(REVERSAL),
      `לקוחות בסוף השנה: ${fmt(REVERSAL.mid.gross)}. ספציפית 30,000 + כללית 3% × ${fmt(REVERSAL.mid.gross - 40_000)} = ${fmt(REVERSAL.required - 30_000)} → נדרשת ${fmt(REVERSAL.required)}. בכרטיס כבר ${fmt(REVERSAL.mid.allowance)} — יותר מדי. מבטלים ${fmt(amountOf(REVERSAL))}: ההפרשה קטנה (חובה), וההוצאה קטנה (זכות).`,
      [ALLOW, EXPENSE, AR, "מזומן"],
    ),
    journal(
      "with-recovery",
      "התאמה עם חוב שחזר",
      `לקוחות ב-1.1: ${fmt(BACK.openingAR)} ₪, הפרשה ${fmt(BACK.openingAllowance)} ₪. במהלך השנה: מכירות באשראי ${fmt(BACK.creditSales)} ₪, גבייה ${fmt(BACK.collections)} ₪, קניות באשראי ${fmt(BACK.purchases)} ₪, מחיקת חוב אבוד ${fmt(BACK.writeOffs)} ₪, וגבייה של חוב שנמחק בשנה שעברה ${fmt(BACK.recovered)} ₪. ההפרשה הנדרשת: ${pct(BACK.rate)} מהלקוחות. רשמו את פקודת ההתאמה ב-31.12.`,
      adjLines(RECOVERY),
      `הקניות באשראי שייכות לספקים — לא נוגעות בלקוחות. לקוחות בסוף השנה: ${fmt(RECOVERY.mid.gross)} (החוב שחזר נכנס ויצא), ולכן נדרשת ${fmt(RECOVERY.required)}. בהפרשה לפני ההתאמה: ${fmt(BACK.openingAllowance)} − ${fmt(BACK.writeOffs)} + ${fmt(BACK.recovered)} = ${fmt(RECOVERY.mid.allowance)}. ההוצאה: ${fmt(amountOf(RECOVERY))}.`,
      [EXPENSE, ALLOW, AR, "ספקים", "קניות"],
    ),
    {
      kind: "number",
      id: "closing-gross",
      skill: "כרטיס הלקוחות",
      prompt: "סדרו את התנועות בכרטיס הלקוחות לשנה. מה יתרת הסגירה — הלקוחות ברוטו ב-31.12?",
      answer: CARD.opening + CARD.sales - CARD.collections - CARD.writeOffs,
      table: {
        kind: "card",
        account: AR,
        items: [
          { label: "יתרת פתיחה ב-1.1", amount: CARD.opening, side: "dr" },
          { label: "מכירות באשראי", amount: CARD.sales, side: "dr" },
          { label: "גבייה מלקוחות", amount: CARD.collections, side: "cr" },
          { label: "מחיקת חובות אבודים", amount: CARD.writeOffs, side: "cr" },
        ],
      },
      steps: [
        "לקוחות הם נכס: היתרה והמכירות בחובה; הגבייה והמחיקות מקטינות אותם — בזכות.",
        `${fmt(CARD.opening)} + ${fmt(CARD.sales)} − ${fmt(CARD.collections)} − ${fmt(CARD.writeOffs)} = ${fmt(CARD.opening + CARD.sales - CARD.collections - CARD.writeOffs)}.`,
      ],
      worked: {
        steps: [
          {
            h: "כרטיס הלקוחות",
            sheet: [
              { l: "יתרת פתיחה", a: CARD.opening },
              { l: "מכירות באשראי", a: CARD.sales },
              { l: "פחות: גבייה מלקוחות", a: -CARD.collections, k: "op" },
              { l: "פחות: מחיקת חובות אבודים", a: -CARD.writeOffs, k: "op" },
              { l: "לקוחות ברוטו, 31.12", a: CARD.opening + CARD.sales - CARD.collections - CARD.writeOffs, k: "tot" },
            ],
            why: ["מה בחובה ומה בזכות?", "לקוחות הם נכס: היתרה והמכירות בחובה. הגבייה והמחיקות מקטינות אותם, ולכן הן בזכות."],
          },
        ],
      },
    },
    {
      kind: "number",
      id: "net-customers",
      skill: "לקוחות נטו",
      prompt: `לקוחות ברוטו ב-31.12: ${fmt(NET.gross)} ₪, וההפרשה להפסדי אשראי היא ${pct(NET.rate)} מהם. באיזה סכום יוצגו הלקוחות בסך הנכסים במאזן?`,
      answer: round2(NET.gross * (1 - NET.rate)),
      steps: [
        `ההפרשה: ${fmt(NET.gross)} × ${pct(NET.rate)} = ${fmt(round2(NET.gross * NET.rate))}.`,
        `לקוחות נטו = ברוטו − הפרשה = ${fmt(NET.gross)} − ${fmt(round2(NET.gross * NET.rate))} = ${fmt(round2(NET.gross * (1 - NET.rate)))}.`,
      ],
      worked: {
        givens: [`לקוחות ברוטו \`${fmt(NET.gross)}\`.`, `הפרשה של \`${pct(NET.rate)}\` מהם.`],
        required: ["באיזה סכום יוצגו הלקוחות במאזן?"],
        steps: [
          {
            h: "ברוטו פחות ההפרשה",
            sheet: [
              { l: "לקוחות ברוטו", a: NET.gross },
              { l: `פחות: הפרשה, \`${pct(NET.rate)}\``, a: -round2(NET.gross * NET.rate), k: "op" },
              { l: "לקוחות נטו", a: round2(NET.gross * (1 - NET.rate)), k: "tot" },
            ],
            why: ["למה נטו?", "במאזן מציגים את מה שהחברה צופה לגבות באמת: הלקוחות פחות ההפרשה להפסדי אשראי."],
          },
        ],
      },
    },
    {
      kind: "number",
      id: "gross-from-net",
      skill: "מנטו לברוטו",
      prompt: `במאזן ליום 31.12 הוצגו לקוחות נטו ${fmt(FROM_NET.net)} ₪. ההפרשה היא ${pct(FROM_NET.rate)} מהלקוחות ברוטו. מה הלקוחות ברוטו?`,
      answer: round2(FROM_NET.net / (1 - FROM_NET.rate)),
      steps: [
        `הנטו הוא ${pct(1 - FROM_NET.rate)} מהברוטו — לכן מחלקים, לא מכפילים ב-${pct(FROM_NET.rate)}.`,
        `${fmt(FROM_NET.net)} ÷ ${pct(1 - FROM_NET.rate)} = ${fmt(round2(FROM_NET.net / (1 - FROM_NET.rate)))}.`,
      ],
      worked: {
        givens: [`לקוחות נטו \`${fmt(FROM_NET.net)}\`.`, `ההפרשה \`${pct(FROM_NET.rate)}\` מהברוטו.`],
        required: ["מה הלקוחות ברוטו?"],
        steps: [
          {
            h: "מחלקים בחלק שנשאר",
            sheet: [
              { l: "לקוחות נטו", a: FROM_NET.net },
              { l: `÷ \`${pct(1 - FROM_NET.rate)}\``, a: "", k: "op" },
              { l: "לקוחות ברוטו", a: round2(FROM_NET.net / (1 - FROM_NET.rate)), k: "tot" },
            ],
            why: ["למה מחלקים?", `הנטו הוא ${pct(1 - FROM_NET.rate)} מהברוטו. כדי לחזור לברוטו מחלקים בו, לא מוסיפים ${pct(FROM_NET.rate)} לנטו.`],
          },
        ],
      },
    },
    {
      kind: "number",
      id: "collections",
      skill: "נעלם בגבייה",
      prompt: `לקוחות ב-1.1: ${fmt(GAP.opening)} ₪, וב-31.12: ${fmt(GAP.closing)} ₪. במהלך השנה: מכירות באשראי ${fmt(GAP.sales)} ₪, מחיקת חובות ${fmt(GAP.writeOffs)} ₪. כמה נגבה מהלקוחות?`,
      answer: GAP.opening + GAP.sales - GAP.writeOffs - GAP.closing,
      steps: [
        "בכרטיס הלקוחות: סגירה = פתיחה + מכירות − גבייה − מחיקות. הגבייה היא הנעלם.",
        `${fmt(GAP.closing)} = ${fmt(GAP.opening)} + ${fmt(GAP.sales)} − X − ${fmt(GAP.writeOffs)}, ולכן X = ${fmt(GAP.opening + GAP.sales - GAP.writeOffs - GAP.closing)}.`,
      ],
      worked: {
        givens: [`לקוחות ב־1.1 \`${fmt(GAP.opening)}\`, וב־31.12 \`${fmt(GAP.closing)}\`.`, `מכירות באשראי \`${fmt(GAP.sales)}\`.`, `מחיקת חובות \`${fmt(GAP.writeOffs)}\`.`],
        required: ["כמה נגבה מהלקוחות?"],
        steps: [
          {
            h: "הגבייה משלימה את הכרטיס",
            sheet: [
              { l: "יתרת פתיחה", a: GAP.opening },
              { l: "מכירות באשראי", a: GAP.sales },
              { l: "פחות: מחיקת חובות", a: -GAP.writeOffs, k: "op" },
              { l: "פחות: יתרת סגירה", a: -GAP.closing, k: "op" },
              { l: "גבייה מלקוחות", a: GAP.opening + GAP.sales - GAP.writeOffs - GAP.closing, k: "tot" },
            ],
            why: ["למה זה עובד?", "בכרטיס הלקוחות: פתיחה + מכירות − גבייה − מחיקות = סגירה. כל השאר ידוע, והגבייה היא מה שחסר כדי שהכרטיס ייסגר."],
          },
        ],
      },
    },
    {
      kind: "number",
      id: "opening-allowance",
      skill: "נעלם בפתיחה",
      prompt: `לקוחות ב-1.1: ${fmt(OPENING.openingAR)} ₪. במהלך השנה: מכירות באשראי ${fmt(OPENING.creditSales!)} ₪, גבייה ${fmt(OPENING.collections!)} ₪, מחיקות ${fmt(OPENING.writeOffs!)} ₪, ונגבה חוב שנמחק בעבר ${fmt(OPENING.recovered!)} ₪. ב-31.12 ההפרשה היא 6% מהלקוחות, והוצאות הפסדי האשראי השנה ${fmt(OPENING.result.expense)} ₪. מה הייתה יתרת הפתיחה של ההפרשה?`,
      answer: OPENING.openingAllowance,
      steps: [
        `לקוחות בסוף השנה: ${fmt(OPENING.result.gross)}, ולכן ההפרשה בסגירה ${fmt(OPENING.required)}.`,
        `בכרטיס ההפרשה: סגירה = X − מחיקה + חוב שחזר + הוצאה, כלומר ${fmt(OPENING.required)} = X − ${fmt(OPENING.writeOffs!)} + ${fmt(OPENING.recovered!)} + ${fmt(OPENING.result.expense)}.`,
        `X = ${fmt(OPENING.openingAllowance)}.`,
      ],
      worked: {
        givens: [`לקוחות ב־1.1 \`${fmt(OPENING.openingAR)}\`.`, `מכירות באשראי \`${fmt(OPENING.creditSales!)}\`, גבייה \`${fmt(OPENING.collections!)}\`, מחיקות \`${fmt(OPENING.writeOffs!)}\`.`, `נגבה חוב שנמחק בעבר \`${fmt(OPENING.recovered!)}\`.`, `ההפרשה בסוף השנה 6% מהלקוחות, והוצאות הפסדי האשראי \`${fmt(OPENING.result.expense)}\`.`],
        required: ["מה הייתה יתרת הפתיחה של ההפרשה?"],
        steps: [
          {
            h: "ההפרשה בסוף השנה",
            sheet: [
              { l: "לקוחות ב־1.1", a: OPENING.openingAR },
              { l: "מכירות באשראי", a: OPENING.creditSales! },
              { l: "פחות: גבייה", a: -OPENING.collections!, k: "op" },
              { l: "פחות: מחיקות", a: -OPENING.writeOffs!, k: "op" },
              { l: "לקוחות ב־31.12", a: OPENING.result.gross, k: "sub" },
              { l: "× `6%`", a: "", k: "op" },
              { l: "ההפרשה הנדרשת", a: OPENING.required, k: "tot" },
            ],
            why: ["ומה עם החוב שחזר?", "חוב שנמחק ונגבה נכנס לכרטיס הלקוחות ויוצא ממנו מיד. הוא לא משנה את יתרת הלקוחות."],
          },
          {
            h: "חוזרים אחורה בכרטיס ההפרשה",
            sheet: [
              { l: "ההפרשה בסגירה", a: OPENING.required },
              { l: "ועוד: מה שנמחק כנגדה", a: OPENING.writeOffs!, k: "op" },
              { l: "פחות: החוב שחזר", a: -OPENING.recovered!, k: "op" },
              { l: "פחות: הוצאות השנה", a: -OPENING.result.expense, k: "op" },
              { l: "ההפרשה בפתיחה", a: OPENING.openingAllowance, k: "tot" },
            ],
            why: ["למה בכיוון הזה?", "בכרטיס ההפרשה: פתיחה − מחיקות + חוב שחזר + הוצאה = סגירה. הולכים מהסגירה אחורה, וכל תנועה מתהפכת."],
          },
        ],
      },
    },
  ],
  traps: [
    {
      id: "write-off-expense",
      prompt: "לקוח פשט רגל, וחובו נמחק כנגד ההפרשה. מה קורה ביום המחיקה להוצאות הפסדי האשראי?",
      options: ["לא משתנות", "גדלות בסכום החוב", "קטנות בסכום החוב", "גדלות רק אם אין הפרשה ספציפית"],
      answer: 0,
      why: "המחיקה היא ח׳ הפרשה / ז׳ לקוחות — שני חשבונות מאזניים. ההוצאה נרשמה כבר כשהפרשנו, וההתאמה של סוף השנה תשלים אם צריך.",
      traps: [
        "",
        "המלכודת: לרשום את החוב האבוד כהוצאה. כך ההפסד נספר פעמיים — פעם בהפרשה ופעם במחיקה.",
        "מחיקה לא מקטינה הוצאה. היא רק מורידה את הלקוח מהלקוחות ומהכרית יחד.",
        "גם עם הפרשה ספציפית וגם בלעדיה — המחיקה כנגד ההפרשה. אם הכרית לא הספיקה, ההשלמה תבוא בסוף השנה.",
      ],
    },
    {
      id: "expense-is-required",
      prompt: "ההפרשה הנדרשת ב-31.12 היא 44,000 ₪. בכרטיס ההפרשה, לפני ההתאמה, יש 27,000 ₪ בזכות. מה הוצאות הפסדי האשראי השנה?",
      options: ["17,000 ₪", "44,000 ₪", "71,000 ₪", "27,000 ₪"],
      answer: 0,
      why: "ההוצאה היא רק מה שחסר בכרטיס כדי להגיע לנדרשת: 44,000 − 27,000 = 17,000.",
      traps: [
        "",
        "המלכודת: 44,000 היא יתרת הסגירה של ההפרשה, לא ההוצאה. 27,000 מתוכה כבר בכרטיס.",
        "מחברים במקום להחסיר: היתרה שבכרטיס כבר נספרה — משלימים עד הנדרשת.",
        "27,000 הם מה שיש, לא מה שחסר.",
      ],
    },
  ],
  tips: [
    "לקוחות נטו = לקוחות ברוטו − הפרשה. בכרטיס הלקוחות יש רק ברוטו — נטו מפרקים לפני שמציבים.",
    "מחיקת חוב אבוד: ח׳ הפרשה / ז׳ לקוחות — בלי הוצאה. חוב שחזר: מחזירים לספרים, ואז גובים.",
    "ההוצאה היא ההפרש בכרטיס ההפרשה: הנדרשת בסוף השנה, פחות מה שכבר יש בו אחרי מחיקות וגביות.",
    "הפרשה כללית — רק על הלקוחות שאין להם הפרשה ספציפית. אחרת אותו הפסד נספר פעמיים.",
  ],
};
