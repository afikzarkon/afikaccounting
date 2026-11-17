import { FUND, FUND_LARGE, FUND_SMALL } from "../lessons/returns";
import { A, type Worked } from "./types";

/**
 * Lesson 3's numeric demonstration as a full worked solution, by the owner's
 * word of 2026-11-12 (all 66 demonstrations of the course, the whole way).
 * The course's own numbers: one fund, a manager with 3% and with 25%.
 */

/** The figures the worked solution adds to the solver's, worked separately. */
export const RETURNS_W = {
  fee: FUND.nav * FUND.feeRate,
  aboveHurdle: FUND.profit - FUND.hurdle,
  performance: (FUND.profit - FUND.hurdle) * FUND.perfRate,
  left: FUND.profit - FUND.nav * FUND.feeRate - (FUND.profit - FUND.hurdle) * FUND.perfRate,
};

const W = RETURNS_W;
const pct = (v: number) => `${Math.round(v * 100) / 100}%`;
const n = (v: number) => v.toLocaleString("en-US");

export const W_FUND: Worked = {
  own: true,
  title: "דוגמה פתורה: כמה מתוצאות הקרן מגיע למנהל",
  givens: [
    "הנכסים נטו של הקרן **40,000,000** ש״ח. הרווח השנה, לפני העמלות, **5,000,000** ש״ח.",
    "המנהל מקבל עמלה קבועה של **1.5%** מהנכסים נטו.",
    "הוא מקבל גם עמלה על ביצועים: **15%** מהרווח שמעל **1,000,000** ש״ח.",
    "בודקים שני מצבים: המנהל מחזיק **3%** מהקרן, או **25%** ממנה.",
  ],
  required: ["1. כמה המנהל מקבל בסך הכול בכל מצב?", "2. איזה חלק זה מהרווח של הקרן?"],
  tryFirst: "מה לא משתנה בין שני המצבים? ומאיזה סכום מחשבים את החלק שלו לפי ההחזקה: מכל הרווח, או ממה שנשאר אחרי העמלות?",
  steps: [
    {
      h: "העמלה הקבועה",
      sheet: [
        { l: "נכסים נטו של הקרן", a: FUND.nav },
        { l: "× 1.5%", a: W.fee, k: "tot" },
      ],
      why: ["למה זהה בשני המצבים?", "העמלה נגזרת מגודל הקרן, לא מההחזקה של המנהל. הוא מקבל אותה גם בלי להחזיק אף יחידה."],
      result: `עמלה קבועה ${A(W.fee)}, ב־3% וב־25%.`,
      xl: "`=40000000*1.5%`",
    },
    {
      h: "העמלה על ביצועים",
      sheet: [
        { l: "רווח לפני עמלות", a: FUND.profit },
        { l: "פחות הרמה המוגדרת", a: -FUND.hurdle, k: "op" },
        { l: "רווח מעל הרמה", a: W.aboveHurdle, k: "sub" },
        { l: "× 15%", a: W.performance, k: "tot" },
      ],
      why: ["למה רק מעל 1,000,000?", "העמלה מתגמלת את המנהל על ביצועים טובים. על המיליון הראשון הוא לא מקבל ממנה כלום, ורק על מה שמעליו 15%."],
      result: `עמלה על ביצועים ${A(W.performance)}, גם היא זהה בשני המצבים.`,
      xl: "`=(5000000-1000000)*15%`",
    },
    {
      h: "מה שנשאר בקרן",
      sheet: [
        { l: "רווח לפני עמלות", a: FUND.profit },
        { l: "פחות עמלה קבועה", a: -W.fee, k: "op" },
        { l: "פחות עמלה על ביצועים", a: -W.performance, k: "op" },
        { l: "רווח שנשאר למחזיקים", a: W.left, k: "tot" },
      ],
      why: ["למה מורידים קודם את העמלות?", "העמלות יוצאות מהקרן לפני שהרווח מתחלק בין המחזיקים. המנהל, כמחזיק, מקבל חלק רק ממה שנשאר."],
      result: `נשארים ${A(W.left)} שמתחלקים לפי ההחזקות.`,
      xl: "`=5000000-600000-600000`",
    },
    ...[
      { h: "המנהל עם 3%", r: FUND_SMALL, hold: "3%" },
      { h: "המנהל עם 25%", r: FUND_LARGE, hold: "25%" },
    ].map(({ h, r, hold }) => ({
      h,
      sheet: [
        { l: "רווח שנשאר למחזיקים", a: W.left },
        { l: `× ${hold}: החלק לפי ההחזקה`, a: r.fromHolding, k: "sub" as const },
        { l: "ועוד עמלה קבועה", a: r.fee, k: "op" as const },
        { l: "ועוד עמלה על ביצועים", a: r.performance, k: "op" as const },
        { l: "סך הכול למנהל", a: r.total, k: "sub" as const },
        { l: `החלק שלו ברווח: \`${n(r.total)} / ${n(FUND.profit)}\``, a: pct(r.share), k: "tot" as const },
      ],
      result: `עם ${hold} המנהל מקבל ${A(r.total)}, שהם ${pct(r.share)} מהרווח של הקרן.`,
      xl: `\`=${W.left}*${hold}+${r.fee}+${r.performance}\``,
    })),
    {
      h: "שני המצבים זה מעל זה",
      tables: [
        {
          head: ["", "עמלות", "החלק לפי ההחזקה", "סך הכול למנהל", "מאיפה"],
          rows: [
            { c: ["החזקה 3%", FUND_SMALL.fee + FUND_SMALL.performance, FUND_SMALL.fromHolding, FUND_SMALL.total, "שלב 4"] },
            { c: ["החזקה 25%", FUND_LARGE.fee + FUND_LARGE.performance, FUND_LARGE.fromHolding, FUND_LARGE.total, "שלב 5"] },
            {
              c: ["ההפרש", FUND_LARGE.fee + FUND_LARGE.performance - FUND_SMALL.fee - FUND_SMALL.performance + 0, FUND_LARGE.fromHolding - FUND_SMALL.fromHolding, FUND_LARGE.total - FUND_SMALL.total, "25% פחות 3%"],
              res: true,
            },
          ],
        },
      ],
      why: ["מה עושים עם האחוז?", "האחוז מראה כמה המנהל חשוף לתוצאות הקרן. כאן ההחזקה לבדה מעלה את החלק שלו מכרבע מהרווח לכמעט חצי. אין בתקן סף של אחוזים, ולכן זה נתון לשיקול דעת ולא כלל."],
      result: `ב־3% הוא מקבל ${pct(FUND_SMALL.share)} מהרווח, וב־25% ${pct(FUND_LARGE.share)}. העמלות זהות, וכל ההפרש נובע מההחזקה.`,
    },
  ],
};
