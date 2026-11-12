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
    {
      h: "החלק של המנהל לפי ההחזקה",
      tables: [
        {
          head: ["", "החזקה 3%", "החזקה 25%"],
          rows: [
            { c: ["רווח שנשאר למחזיקים", W.left, W.left] },
            { c: ["× שיעור ההחזקה", "3%", "25%"] },
            { c: ["החלק של המנהל", FUND_SMALL.fromHolding, FUND_LARGE.fromHolding], res: true },
          ],
        },
      ],
      result: `ב־3% הוא מקבל ${A(FUND_SMALL.fromHolding)}, וב־25% ${A(FUND_LARGE.fromHolding)}.`,
      xl: "`=3800000*3%` ו־`=3800000*25%`",
    },
    {
      h: "סך הכול, וכמה זה מהרווח",
      tables: [
        {
          head: ["", "החזקה 3%", "החזקה 25%"],
          rows: [
            { c: ["עמלה קבועה", FUND_SMALL.fee, FUND_LARGE.fee] },
            { c: ["עמלה על ביצועים", FUND_SMALL.performance, FUND_LARGE.performance] },
            { c: ["החלק לפי ההחזקה", FUND_SMALL.fromHolding, FUND_LARGE.fromHolding] },
            { c: ["סך הכול למנהל", FUND_SMALL.total, FUND_LARGE.total], res: true },
            { c: ["÷ רווח לפני עמלות", FUND.profit, FUND.profit] },
            { c: ["החלק שלו ברווח", pct(FUND_SMALL.share), pct(FUND_LARGE.share)], res: true },
          ],
        },
      ],
      why: ["מה עושים עם האחוז?", "האחוז מראה כמה המנהל חשוף לתוצאות הקרן. כאן ההחזקה לבדה מעלה את החלק שלו מכרבע מהרווח לכמעט חצי. אין בתקן סף של אחוזים, ולכן זה נתון לשיקול דעת ולא כלל."],
      result: `ב־3% הוא מקבל ${pct(FUND_SMALL.share)} מהרווח, וב־25% ${pct(FUND_LARGE.share)}. העמלות זהות, וכל ההפרש נובע מההחזקה.`,
      xl: "`=1314000/5000000` ו־`=2150000/5000000`",
    },
  ],
};
