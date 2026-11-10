import type { Worked, WStep } from "../worked";
import { tool, type Worked as Work } from "./formulas";
import { CASE, CASE_INTEREST, CASE_TODAY } from "./lessons/toolkit";
import { ltrFormulas } from "./ltr";

/**
 * The four questions of lesson 1's toolkit practice screen in the worked
 * layout, by the owner's approval of the before/after on 2026-11-10. The
 * formulas and the Excel lines are the course's own (tool.* in formulas.ts);
 * only the layout is new.
 */

const f = (v: number) => Math.round(v).toLocaleString("en-US");
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
const v = CASE.vacation;
const paid = v.opening + v.expense - v.closing;

/** A course result as a step's formula card and Excel card. */
const cards = (w: Work): Pick<WStep, "fx" | "excel"> => ({ fx: [w.formula, w.numbers], excel: w.excel });
const later = (k: number) => (k === 1 ? "בעוד שנה" : k === 2 ? "בעוד שנתיים" : `בעוד ${k} שנים`);
const givens = [`חברת ״אורן״ הבטיחה לעובד, יוסי, מענק של \`${f(CASE.grant)}\` שישולם ${later(CASE.years)}.`, `שיעור ההיוון \`${pct(CASE.rate)}\`.`];

export const TOOL_Q1: Worked = {
  neg: "minus",
  title: "1. כמה רושמים היום על המענק ליוסי?",
  givens,
  required: ["מה החוב ליוסי בדוח של היום?"],
  tryFirst: `ערך נוכחי של ${f(CASE.grant)} שישולמו ${later(CASE.years)}.`,
  steps: [
    {
      h: "ערך נוכחי",
      timeline: [{ d: "היום", n: "מודדים", key: true }, ...Array.from({ length: CASE.years - 1 }, (_, k) => ({ d: later(k + 1) })), { d: later(CASE.years), n: "המענק", cf: CASE.grant, key: true }],
      tables: [{ head: ["מועד", "תזרים", "מקדם היוון", "ערך נוכחי"], rows: [{ c: [later(CASE.years), CASE.grant, `1 ÷ ${1 + CASE.rate}^${CASE.years} = ${(1 / (1 + CASE.rate) ** CASE.years).toFixed(6)}`, CASE_TODAY], res: true }] }],
      why: ["איזה כלי?", `הסכום ישולם בעתיד, ושואלים כמה הוא שווה היום, ולכן ערך נוכחי. FV הוא המענק, RATE הוא ${pct(CASE.rate)}, ו־YEAR הוא מספר השנים עד התשלום, ${CASE.years}. מחלקים ב־${1 + CASE.rate} פעם לכל שנה.`],
      ...cards(tool.pv(CASE.grant, CASE.rate, CASE.years)),
      result: ltrFormulas(`בדיקה בכיוון ההפוך, בערך עתידי: ${f(CASE_TODAY)} × (${1 + CASE.rate})^${CASE.years} ≈ ${f(CASE.grant)} ₪. חזרנו בדיוק למענק.`),
    },
  ],
};

export const TOOL_Q2: Worked = {
  neg: "minus",
  title: "2. בכמה גדל החוב ליוסי ברבעון הראשון?",
  givens: [`החוב ליוסי היום \`${f(CASE_TODAY)}\` (שאלה 1).`, `שיעור שנתי \`${pct(CASE.rate)}\`, ריבית דריבית. החברה מפרסמת דוח רבעוני ב־31.3.`],
  required: ["בכמה יגדל החוב עד 31.3?"],
  tryFirst: "הריבית לשלושה חודשים: YEAR = 3/12, ריבית דריבית.",
  steps: [
    {
      h: "השיעור לרבעון",
      why: ["איזה כלי?", "צריך ריבית רק עד 31.3, ולכן ריבית לתקופה שאינה שנה. התקופה היא שלושה חודשים מתוך 12, ולכן YEAR = 3/12. השאלה לא אמרה באיזו ריבית, ולכן ריבית דריבית."],
      ...cards(tool.partRate(CASE.rate, 3)),
    },
    { h: "הריבית על החוב", p: ["ואז מכפילים בו את היתרה. אפשר גם בצעד אחד:"], ...cards(tool.part(CASE_TODAY, CASE.rate, 3)) },
    { h: "ואם השאלה מבקשת ריבית פשוטה", p: ["מכפילים את השיעור השנתי ברבע שנה:"], ...cards(tool.simpleOn(CASE_TODAY, CASE.rate, 3)) },
  ],
};

export const TOOL_Q3: Worked = {
  neg: "minus",
  title: "3. מה החוב ליוסי בסוף השנה?",
  givens: [`החוב ליוסי בתחילת השנה \`${f(CASE_TODAY)}\` (שאלה 1).`, `ריבית \`${pct(CASE.rate)}\`. ליוסי לא שולם כלום השנה.`],
  required: ["מה יתרת הסגירה של החוב ליוסי?"],
  tryFirst: "יתרת הסגירה במעגל. נוספה ריבית של שנה, ולא שולם כלום.",
  steps: [
    {
      h: "התחייבות למענק ליוסי",
      sheet: [
        { l: "יתרת פתיחה", a: -CASE_TODAY },
        { l: `ריבית ${pct(CASE.rate)}`, how: `\`${f(CASE_TODAY)} × ${pct(CASE.rate)}\``, a: -CASE_INTEREST, k: "op" },
        { l: "יתרת סגירה", a: -(CASE_TODAY + CASE_INTEREST), k: "tot" },
      ],
      why: ["איזה כלי?", "רוצים לדעת מה קרה לחוב במשך שנה, ולכן מעגל. נוספה ריבית על החוב, ולא שולם כלום, ולכן אין שורת תשלומים."],
    },
    { h: "אותו מספר בערך נוכחי", p: ["כשנשארה שנה אחת עד התשלום, המעגל והערך הנוכחי מסכימים:"], ...cards(tool.pv(CASE.grant, CASE.rate, CASE.years - 1)) },
  ],
};

export const TOOL_Q4: Worked = {
  neg: "minus",
  title: "4. כמה שילמה החברה לעובדים על חופשה?",
  givens: [`הפרשה לחופשה: בתחילת השנה \`${f(v.opening)}\`.`, `ההוצאה של השנה \`${f(v.expense)}\`.`, `בסוף השנה \`${f(v.closing)}\`.`],
  required: ["כמה שולם לעובדים השנה?"],
  tryFirst: "התשלומים, השורה היחידה שחסרה במעגל של ההפרשה לחופשה.",
  steps: [
    {
      h: "הפרשה לחופשה",
      sheet: [
        { l: "יתרת פתיחה", a: -v.opening },
        { l: "הוצאה", a: -v.expense, k: "op" },
        { l: "תשלומים: השורה החסרה", a: paid, k: "focal" },
        { l: "יתרת סגירה", a: -v.closing, k: "tot" },
      ],
      why: ["איזה כלי?", `ידועות שלוש שורות במעגל, וחסרה אחת, ולכן מחלצים אותה מהמעגל. מהפתיחה ועוד ההוצאה יוצא ${f(v.opening + v.expense)}; בסוף השנה נשארו רק ${f(v.closing)}, אז כל השאר יצא בתשלומים.`],
    },
    { h: "ואותו חישוב בנוסחה ובאקסל", ...cards(tool.paymentsST(v.opening, v.expense, v.closing)) },
  ],
};

export const TOOL_QUESTIONS = [TOOL_Q1, TOOL_Q2, TOOL_Q3, TOOL_Q4];
