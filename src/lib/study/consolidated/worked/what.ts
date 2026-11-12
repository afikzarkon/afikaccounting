import { STORY, STORY_POSITION, STORY_PROFIT, STORY_SEPARATE } from "../lessons/what";
import { A, type Worked } from "./types";

/**
 * Lesson 1's numeric demonstrations as full worked solutions, by the owner's
 * word of 2026-11-12 (all 66 demonstrations of the course, the whole way).
 * The course's own numbers: the story of the bakery chain and the flour mill.
 */

const pct = (v: number) => `${Math.round(v * 100)}%`;
const H = pct(STORY.holding);
const NCI = pct(1 - STORY.holding);
const subNet = STORY.subAssets - STORY.subLiabilities;
const parentNet = STORY.parentAssets - STORY.parentLiabilities;
const share = subNet * STORY.holding;

/** The figures the worked solutions add to the solver's, worked separately. */
export const WHAT_W = {
  subNet,
  parentNet,
  share,
  goodwill: STORY.paid - share,
  parentEquity: STORY.parentAssets + STORY.paid - STORY.parentLiabilities,
  profitShare: STORY.subProfit * STORY.holding,
  dividendShare: STORY.subDividend * STORY.holding,
};

export const W_STORY_POSITION: Worked = {
  own: true,
  title: "דוגמה פתורה: הדוחות המאוחדים מיד אחרי הקנייה",
  givens: [
    `רשת המאפיות שיבולת קנתה **${H}** מהמניות של טחנת הגליל ושילמה **330,000** ש״ח, בדיוק לפי חלקה בנכסים נטו של הטחנה.`,
    "לשיבולת נכסים של **1,240,000** ש״ח, בלי ההשקעה בטחנה, והתחייבויות של **470,000** ש״ח.",
    "לטחנה נכסים של **860,000** ש״ח והתחייבויות של **420,000** ש״ח.",
    "השנה שיבולת הרוויחה **176,000** ש״ח, בלי מה שקיבלה מהטחנה, והטחנה הרוויחה **64,000** ש״ח.",
  ],
  required: ["1. חשבו את הנכסים, ההתחייבויות והנכסים נטו בדוח המאוחד.", "2. חלקו את ההון המאוחד בין הבעלים של שיבולת לזשמ״ש.", "3. חלקו את הרווח המאוחד באותה דרך."],
  tryFirst: "איזה חלק מהנכסים של הטחנה נכנס לדוח המאוחד? ואיפה בכל זאת משתמשים ב־75%?",
  steps: [
    {
      h: "מה קורה להשקעה של 330,000",
      sheet: [
        { l: "נכסי הטחנה", a: STORY.subAssets },
        { l: "פחות התחייבויות הטחנה", a: -STORY.subLiabilities, k: "op" },
        { l: "נכסים נטו של הטחנה", a: subNet, k: "sub" },
        { l: `× ${H}, החלק של שיבולת`, a: share, k: "sub" },
        { l: "פחות מה ששיבולת שילמה", a: -STORY.paid, k: "op" },
        { l: "מוניטין", a: WHAT_W.goodwill, k: "tot" },
      ],
      why: ["למה ההשקעה יוצאת?", "ההשקעה היא בעצם החלק של שיבולת בנכסים נטו של הטחנה. בדוח המאוחד מציגים במקומה את הנכסים וההתחייבויות עצמם. אם נשאיר גם אותה, נספור את הטחנה פעמיים."],
      result: `שיבולת שילמה בדיוק ${A(share)}, ולכן אין מוניטין. ההשקעה יוצאת מהדוח המאוחד, ובמקומה נכנסת הטחנה.`,
      xl: "`=(860000-420000)*75%-330000`",
    },
    {
      h: "נכסים, התחייבויות ונכסים נטו",
      why: ["למה 100% ולא 75%?", "שיבולת שולטת בכל הטחנה, לא ב־75% ממנה. כל מכונה וכל חוב של הטחנה נמצאים בשליטת הקבוצה, ולכן נכנסים במלואם."],
      tables: [
        {
          head: ["", "שיבולת, בלי ההשקעה", "הטחנה", "מאוחד"],
          rows: [
            { c: ["נכסים", STORY.parentAssets, STORY.subAssets, STORY_POSITION.assets] },
            { c: ["פחות התחייבויות", -STORY.parentLiabilities, -STORY.subLiabilities, -STORY_POSITION.liabilities] },
            { c: ["נכסים נטו", parentNet, subNet, STORY_POSITION.net], res: true },
          ],
        },
      ],
      result: `נכסים ${A(STORY_POSITION.assets)}, התחייבויות ${A(STORY_POSITION.liabilities)}, נכסים נטו ${A(STORY_POSITION.net)}. שיעור ההחזקה לא נכנס לחישוב.`,
      xl: "`=1240000+860000` ו־`=470000+420000`",
    },
    {
      h: "חלוקת ההון המאוחד",
      sheet: [
        { l: "נכסים נטו של שיבולת, בלי ההשקעה", a: parentNet },
        { l: `ועוד \`440,000 × ${H}\``, a: share, k: "op" },
        { l: "הבעלים של שיבולת", a: STORY_POSITION.owners, k: "sub" },
        { l: `ועוד הזשמ״ש: \`440,000 × ${NCI}\``, a: STORY_POSITION.nci, k: "op" },
        { l: "סך ההון המאוחד", a: STORY_POSITION.net, k: "tot" },
      ],
      why: ["כאן נכנס שיעור ההחזקה", `ההון של הטחנה, ${A(subNet)}, מתחלק בין שני בעלים: ${H} לשיבולת ו־${NCI} לבעלי המניות האחרים, שהם הזשמ״ש. ההון של שיבולת עצמה כולו של הבעלים שלה.`],
      p: [`בדיקה: בלי מוניטין, ההון של הבעלים שווה להון של שיבולת בספרים שלה: \`1,240,000 + 330,000 − 470,000 = ${WHAT_W.parentEquity.toLocaleString("en-US")}\``],
      result: `הבעלים של שיבולת ${A(STORY_POSITION.owners)}, זשמ״ש ${A(STORY_POSITION.nci)}. יחד ${A(STORY_POSITION.net)}, כמו הנכסים נטו בשלב 2.`,
      xl: "`=1240000-470000+(860000-420000)*75%`",
    },
    {
      h: "חלוקת הרווח המאוחד",
      sheet: [
        { l: "הרווח של שיבולת, בלי מה שמהטחנה", a: STORY.parentProfit },
        { l: `ועוד \`64,000 × ${H}\``, a: WHAT_W.profitShare, k: "op" },
        { l: "הבעלים של שיבולת", a: STORY_PROFIT.owners, k: "sub" },
        { l: `ועוד הזשמ״ש: \`64,000 × ${NCI}\``, a: STORY_PROFIT.nci, k: "op" },
        { l: "סך הרווח המאוחד", a: STORY_PROFIT.total, k: "tot" },
      ],
      why: ["למה בלי מה שמהטחנה?", "אם שיבולת רשמה הכנסה מהטחנה, למשל דיבידנד, הכסף הזה הוא חלק מ־64,000 של הטחנה. בקבוצה הוא נספר פעם אחת בלבד."],
      result: `סך הרווח ${A(STORY_PROFIT.total)}: לבעלים של שיבולת ${A(STORY_PROFIT.owners)} ולזשמ״ש ${A(STORY_PROFIT.nci)}.`,
      xl: "`=176000+64000*75%`",
    },
  ],
};

const eq = STORY_SEPARATE.atEquity;

export const W_STORY_SEPARATE: Worked = {
  own: true,
  title: "דוגמה פתורה: ההשקעה בדוח הנפרד, לפי עלות ובשווי מאזני",
  givens: [
    `ב־1.1 שיבולת קנתה **${H}** מהמניות של טחנת הגליל ושילמה **330,000** ש״ח.`,
    "השנה הטחנה הרוויחה **64,000** ש״ח.",
    "הטחנה הכריזה ושילמה דיבידנד של **24,000** ש״ח.",
  ],
  required: ["1. מה ההכנסה מהטחנה ומה יתרת ההשקעה ב־31.12, לפי עלות?", "2. אותו דבר בשיטת השווי המאזני.", "3. רשמו את הפקודות של שתי השיטות."],
  tryFirst: "באיזו שיטה הדיבידנד הוא הכנסה, ובאיזו הוא רק מקטין את ההשקעה?",
  steps: [
    {
      h: "החלק של שיבולת ברווח ובדיבידנד",
      why: ["למה רק 75%?", "בדוח הנפרד שיבולת מציגה רק את מה ששייך לה. 25% מהרווח ומהדיבידנד שייכים לבעלי המניות האחרים של הטחנה."],
      tables: [
        {
          head: ["", "בטחנה", `× ${H}`, "החלק של שיבולת"],
          rows: [
            { c: ["רווח השנה", STORY.subProfit, H, STORY_SEPARATE.profitShare] },
            { c: ["דיבידנד", STORY.subDividend, H, STORY_SEPARATE.dividendShare] },
          ],
        },
      ],
      result: `החלק ברווח ${A(STORY_SEPARATE.profitShare)}, החלק בדיבידנד ${A(STORY_SEPARATE.dividendShare)}.`,
      xl: "`=64000*75%` ו־`=24000*75%`",
    },
    {
      h: "לפי עלות",
      why: ["למה הרווח לא נרשם?", "לפי עלות ההשקעה נשארת במחיר ששולם. שיבולת רושמת הכנסה רק כשהטחנה מחלקת לה כסף, כלומר בדיבידנד."],
      tables: [
        {
          cap: "הדיבידנד",
          head: ["חשבון", "חובה", "זכות"],
          rows: [{ c: ["ח׳ מזומן", STORY_SEPARATE.dividendShare, ""] }, { c: ["ז׳ הכנסות מדיבידנד", "", STORY_SEPARATE.dividendShare] }],
        },
      ],
      result: `הכנסה ${A(STORY_SEPARATE.atCost.income)}. ההשקעה נשארת ${A(STORY_SEPARATE.atCost.balance)}.`,
    },
    {
      h: "בשיטת השווי המאזני",
      sheet: [
        { l: "השקעה ב־1.1", a: STORY.paid },
        { l: "ועוד החלק ברווח", a: STORY_SEPARATE.profitShare, k: "op" },
        { l: "פחות החלק בדיבידנד", a: -STORY_SEPARATE.dividendShare, k: "op" },
        { l: "השקעה ב־31.12", a: eq.balance, k: "tot" },
      ],
      why: ["למה הדיבידנד מקטין את ההשקעה?", "ההכנסה כבר נרשמה כשהוכר החלק ברווח. הדיבידנד רק מעביר כסף מההשקעה למזומן. אם נרשום אותו שוב כהכנסה, נספור את אותו רווח פעמיים."],
      tables: [
        {
          cap: "החלק ברווח",
          head: ["חשבון", "חובה", "זכות"],
          rows: [{ c: ["ח׳ השקעה בחברה בת", STORY_SEPARATE.profitShare, ""] }, { c: ["ז׳ חלק ברווחי חברה בת", "", STORY_SEPARATE.profitShare] }],
        },
        {
          cap: "הדיבידנד",
          head: ["חשבון", "חובה", "זכות"],
          rows: [{ c: ["ח׳ מזומן", STORY_SEPARATE.dividendShare, ""] }, { c: ["ז׳ השקעה בחברה בת", "", STORY_SEPARATE.dividendShare] }],
        },
      ],
      result: `הכנסה ${A(eq.income)}. ההשקעה ב־31.12 ${A(eq.balance)}.`,
      xl: "`=330000+64000*75%-24000*75%`",
    },
    {
      h: "שתי השיטות זו לצד זו",
      tables: [
        {
          head: ["", "לפי עלות", "שווי מאזני"],
          rows: [
            { c: ["השקעה ב־1.1", STORY.paid, STORY.paid] },
            { c: ["ועוד החלק ברווח", 0, STORY_SEPARATE.profitShare] },
            { c: ["פחות החלק בדיבידנד", 0, -STORY_SEPARATE.dividendShare] },
            { c: ["השקעה ב־31.12", STORY_SEPARATE.atCost.balance, eq.balance], res: true },
            { c: ["הכנסה השנה", STORY_SEPARATE.atCost.income, eq.income], res: true },
          ],
        },
      ],
      result: `ההפרש ביתרה, ${A(eq.balance - STORY_SEPARATE.atCost.balance)}, הוא החלק של שיבולת ברווח שהטחנה השאירה אצלה: \`(64,000 − 24,000) × 75% = ${((STORY.subProfit - STORY.subDividend) * STORY.holding).toLocaleString("en-US")}\``,
    },
  ],
};
