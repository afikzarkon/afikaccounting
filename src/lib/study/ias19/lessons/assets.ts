import { assetsInterest, assetsYear, balancingPN, cappedSurplus, impliedRate, partInterest, plainYear, presentation, pv, recognisedAssets } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, lessonRef, pct } from "../shared";
import { SALES, SALES_2024 } from "./rollforward";

/** The worked example: a grant accrued evenly over eight years, and a fund beside it with a contribution on 1.4. */
export const PLAN = { grant: 200_000, years: 8, n: 20, rate: 0.06, assets: { opening: 4_000, contribution: 800, month: 3, closing: 5_600 } };
export const PLAN_PER_YEAR = PLAN.grant / PLAN.years;
export const PLAN_OPENING = pv(PLAN_PER_YEAR, PLAN.rate, PLAN.n);
export const PLAN_YEAR = plainYear({ opening: PLAN_OPENING, i: PLAN.rate, perYear: PLAN_PER_YEAR, servedAtStart: 1, nEnd: PLAN.n - 1 });
export const PLAN_ASSETS = assetsYear({ opening: PLAN.assets.opening, periods: [{ months: 12, i: PLAN.rate }], contributions: [{ amount: PLAN.assets.contribution, month: PLAN.assets.month }], closing: PLAN.assets.closing });
export const PLAN_EFFECT = presentation({ service: PLAN_YEAR.service, interestCost: PLAN_YEAR.interest, interestIncome: PLAN_ASSETS.interest, pnObligation: PLAN_YEAR.pn, pnAssets: PLAN_ASSETS.pn, closing: PLAN_YEAR.closing, assets: PLAN.assets.closing });

/** "We solve": a surplus, and the ceiling (5% of the obligation). */
export const SURPLUS = { assets: 52_000, obligation: 46_000, ceilingShare: 0.05, interestCost: 3_680, service: 18_000, closingObligation: 76_000, closingAssets: 79_000 };
export const SURPLUS_CEILING = SURPLUS.ceilingShare * SURPLUS.obligation;
export const SURPLUS_NET = cappedSurplus(SURPLUS.assets, SURPLUS.obligation, SURPLUS_CEILING);
export const SURPLUS_OPEN_ASSETS = recognisedAssets(SURPLUS.assets, SURPLUS.obligation, SURPLUS_CEILING);
export const SURPLUS_RATE = impliedRate(SURPLUS.interestCost, SURPLUS.obligation);
export const SURPLUS_A = assetsYear({ opening: SURPLUS_OPEN_ASSETS, periods: [{ months: 12, i: SURPLUS_RATE }], closing: SURPLUS.closingAssets });
export const SURPLUS_PN_OBLIGATION = balancingPN({ opening: SURPLUS.obligation, interest: SURPLUS.interestCost, service: SURPLUS.service, pastService: 0, payments: 0, settled: 0, closing: SURPLUS.closingObligation });
export const SURPLUS_END_CEILING = SURPLUS.ceilingShare * SURPLUS.closingObligation;
export const SURPLUS_END = cappedSurplus(SURPLUS.closingAssets, SURPLUS.closingObligation, SURPLUS_END_CEILING);
export const SURPLUS_EFFECT = presentation({ service: SURPLUS.service, interestCost: SURPLUS.interestCost, interestIncome: SURPLUS_A.interest, pnObligation: SURPLUS_PN_OBLIGATION, pnAssets: SURPLUS_A.pn, closing: SURPLUS.closingObligation, assets: SURPLUS.closingAssets });

/** The exercise: retirement gifts, a trust account that can buy gifts or — at the trustee's discretion — refund the company: no surplus may be recognised. */
export const GIFTS = { opening: 150_000, service: 80_000, rate: 0.075, closing: 236_000, deposit: 350_000, depositMonth: 3, fairValue: 260_000, investmentLoss: 90_000 };
export const GIFTS_INTEREST = GIFTS.opening * GIFTS.rate;
export const GIFTS_PN = balancingPN({ opening: GIFTS.opening, interest: GIFTS_INTEREST, service: GIFTS.service, pastService: 0, payments: 0, settled: 0, closing: GIFTS.closing });
export const GIFTS_RECOGNISED = recognisedAssets(GIFTS.fairValue, GIFTS.closing, 0);
export const GIFTS_ASSETS = assetsYear({ opening: 0, periods: [{ months: 12, i: GIFTS.rate }], contributions: [{ amount: GIFTS.deposit, month: GIFTS.depositMonth }], closing: GIFTS_RECOGNISED });
export const GIFTS_CEILING_EFFECT = GIFTS.fairValue - GIFTS_RECOGNISED;
export const GIFTS_EFFECT = presentation({ service: GIFTS.service, interestCost: GIFTS_INTEREST, interestIncome: GIFTS_ASSETS.interest, pnObligation: GIFTS_PN, pnAssets: GIFTS_ASSETS.pn, closing: GIFTS.closing, assets: GIFTS_RECOGNISED });

/** Continued practice: the sales team's fund (lesson 7), two years — only what the fund paid reduces it. */
export const SALES_ASSETS = {
  y2023: { opening: 2_300_000, contributions: 190_000, paidFromFund: 62_000, closing: 2_520_000 },
  y2024: { contributions: 225_000, paidFromFund: 70_000, closing: 2_800_000 },
};
export const SALES_A_2023 = assetsYear({ opening: SALES_ASSETS.y2023.opening, periods: [{ months: 12, i: SALES.y2023.rate }], contributions: [{ amount: SALES_ASSETS.y2023.contributions, month: 12 }], paidFromAssets: SALES_ASSETS.y2023.paidFromFund, closing: SALES_ASSETS.y2023.closing });
export const SALES_A_2024 = assetsYear({ opening: SALES_ASSETS.y2023.closing, periods: [{ months: 12, i: SALES.y2024.rate }], contributions: [{ amount: SALES_ASSETS.y2024.contributions, month: 12 }], paidFromAssets: SALES_ASSETS.y2024.paidFromFund, closing: SALES_ASSETS.y2024.closing });

/** Continued practice: a fund with a contribution in the middle of a year whose rate changed — interest income on the obligation's periods (IAS 19.125). */
export const SPLIT = { opening: 2_500, periods: [{ months: 6, i: 0.04 }, { months: 6, i: 0.06 }], contribution: 2_000, month: 6, closing: 4_300 };
export const SPLIT_INTEREST = assetsInterest({ opening: SPLIT.opening, periods: SPLIT.periods, contributions: [{ amount: SPLIT.contribution, month: SPLIT.month }] });
export const SPLIT_A = assetsYear({ opening: SPLIT.opening, periods: SPLIT.periods, contributions: [{ amount: SPLIT.contribution, month: SPLIT.month }], closing: SPLIT.closing });
/** The other way some compute it — the opening at a full year's first rate — which the rule does not allow. */
export const SPLIT_OTHER = SPLIT.opening * SPLIT.periods[0].i + partInterest(SPLIT.contribution, SPLIT.periods[1].i, 6);

const traps: Trap[] = [
  {
    id: "all-payments",
    prompt: "שולמו לעובדים 300,000 ₪: 75,000 מהקרן והשאר מהחברה. כמה מורידים בתנועה בנכסי התכנית?",
    options: ["75,000", "300,000", "225,000", "0"],
    answer: 0,
    why: "מהנכסים יורד רק מה שיצא מהם. ההתחייבות, לעומת זאת, קטנה בכל 300,000.",
    traps: ["", "המלכודת: להוריד מהנכסים את כל התשלום. החלק של החברה לא יצא מהקרן.", "זה החלק שהחברה שילמה — הוא לא נגע בקרן.", "הקרן כן שילמה חלק."],
  },
  {
    id: "other-rate",
    prompt: "הקרן הרוויחה בפועל 9%; שיעור ההיוון של ההתחייבות 5%. באיזה שיעור מחשבים הכנסות ריבית על הנכסים?",
    options: ["5% — כמו ההתחייבות", "9% — התשואה בפועל", "7%", "לא מחשבים ריבית על נכסים"],
    answer: 0,
    why: "הכנסות ריבית — באותו שיעור היוון כמו של ההתחייבות (IAS 19.125). כל השאר — P.N. ב-OCI.",
    traps: ["", "המלכודת: התשואה בפועל. ההפרש בינה לבין 5% הוא P.N.", "אין ממוצע.", "ריבית נטו כוללת גם את הנכסים."],
  },
  {
    id: "mid-contribution",
    prompt: "הפקדה של 1,600 ₪ ב-1.7, שיעור 3%. מה הכנסות הריבית על ההפקדה עד סוף השנה?",
    options: ["1,600 × (1.03^0.5 − 1) ≈ 23.8", "1,600 × 3% = 48", "0 — הופקדה באמצע השנה", "1,600 × 1.5% = 24, ריבית פשוטה"],
    answer: 0,
    why: "הפקדה באמצע שנה מרוויחה ריבית רק מיום ההפקדה — ובריבית דריבית.",
    traps: ["", "המלכודת: שנה שלמה. הכסף היה בקרן רק חצי שנה.", "חצי שנה בקרן — יש ריבית.", "הסכום קרוב, אבל השיטה שגויה: ריבית דריבית."],
  },
  {
    id: "assets-pn-pl",
    prompt: "הקרן הרוויחה 8,000 ₪ מעבר להכנסות הריבית. איפה נרשם העודף?",
    options: ["ב-OCI", "ברווח והפסד, בהכנסות מימון", "מקטין את הוצאות השכר", "לא נרשם"],
    answer: 0,
    why: "התשואה מעבר להכנסות הריבית היא מדידה מחדש — ב-OCI (IAS 19.127).",
    traps: ["", "המלכודת: לרשום לרווח והפסד. שם רק הכנסות הריבית.", "זה לא קשור לשירות.", "הנכסים גדלו — חייבים לרשום."],
  },
  {
    id: "full-surplus",
    prompt: "נכסים 60,000, התחייבות 54,000, ותקרת הנכס 2,700. איזה נכס נטו מציגים?",
    options: ["2,700", "6,000", "0", "60,000"],
    answer: 0,
    why: "הנמוך מבין העודף (6,000) והתקרה (2,700) (IAS 19.64).",
    traps: ["", "המלכודת: להציג את כל העודף. החברה יכולה להשתמש רק ב-2,700.", "יש תקרה חיובית — משהו מוכר.", "במאזן — נטו, לא ברוטו."],
  },
  {
    id: "ceiling-liability",
    prompt: "התקרה הגבילה את הנכס. מה היא עושה להתחייבות?",
    options: ["כלום — היא מגבילה רק את הנכס", "מקטינה אותה", "מגדילה אותה", "מאפסת אותה"],
    answer: 0,
    why: "ההתחייבות נמדדת בנפרד; התקרה חוסמת רק את העודף של הנכסים.",
    traps: ["", "המלכודת: לחשוב שהתקרה ״מקזזת״ את ההתחייבות. היא פועלת רק בצד הנכסים.", "ההתחייבות לא משתנה בגללה.", "ההתחייבות נשארת כמו שהיא."],
  },
  {
    id: "locked",
    prompt: "בקרן נעולה בידי נאמן 180,000 ₪, וההתחייבות 150,000. החזר לחברה רק לפי שיקול דעת הנאמן, ואין הפחתת הפקדות. מה מוכר כנכס נטו?",
    options: ["0", "30,000", "180,000", "15,000"],
    answer: 0,
    why: "החברה לא יכולה להשתמש בעודף בפועל — התקרה אפס (IFRIC 14).",
    traps: ["", "המלכודת: להתעלם מכך שהכסף נעול. עודף שאי אפשר להשתמש בו אינו נכס.", "בנכס נטו מציגים רק את העודף, והוא חסום.", "אין בסיס לחצי."],
  },
];

/** Lesson 9: plan assets — their own roll-forward, the net liability, and the ceiling on a surplus. */
export const ASSETS: StudyModule = {
  slug: "ias19-assets",
  course: COURSE,
  n: 9,
  title: "הטבה מוגדרת 5: נכסי תכנית, התחייבות נטו ותקרת נכס",
  description: "הצד השני של ההטבה המוגדרת: קרן נפרדת עם מעגל משלה — הכנסות ריבית באותו שיעור, הפקדות, הטבות ששולמו ממנה ו-P.N. — ההתחייבות נטו, ותקרה שחוסמת עודף שאי אפשר להשתמש בו.",
  goal: "לבנות מעגל נפרד לנכסי התכנית, להציג התחייבות נטו, ולהגביל נכס נטו בתקרה.",
  outcomes: [
    "לבנות מעגל של נכסי תכנית: ריבית, הפקדות, תשלומים מהקרן ו-P.N.",
    "לחשב הכנסות ריבית על הפקדה באמצע שנה, באותו שיעור ובאותו פיצול תקופות כמו ההתחייבות",
    "להציג התחייבות נטו",
    "להגביל נכס נטו בתקרה, ולראות את השפעתה ב-OCI",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-assets-hook", title: "חוב, וקופה בצד" },
    { id: "emp-assets-what", title: "נכסי תכנית, ומעגל משלהם" },
    { id: "emp-assets-ceiling", title: "תקרת הנכס" },
    { id: "emp-assets-rule", title: "הכלל: שני מעגלים, נטו, ותקרה" },
    { id: "emp-assets-solved", title: "דוגמה פתורה: מענק עם קרן" },
    { id: "emp-assets-together", title: "פותרים יחד: עודף שנתקל בתקרה" },
    { id: "emp-assets-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("gifts-pn", "מתנות פרישה: P.N. התחייבות", `מתנות פרישה: פתיחה ${fmt(GIFTS.opening)} ₪; עלות שירות ${fmt(GIFTS.service)}; שיעור ${pct(GIFTS.rate)}; סגירה ${fmt(GIFTS.closing)}. מה ה-P.N. של ההתחייבות? (רווח — בסכום חיובי)`, -GIFTS_PN, [
      `ריבית: ${fmt(GIFTS.opening)} × ${pct(GIFTS.rate)} = ${fmt(GIFTS_INTEREST)}.`,
      `P.N. = ${fmt(GIFTS.closing)} − ${fmt(GIFTS.opening)} − ${fmt(GIFTS_INTEREST)} − ${fmt(GIFTS.service)} = ${fmt(GIFTS_PN)}: רווח של ${fmt(-GIFTS_PN)} ₪.`,
    ]),
    calc("gifts-interest", "מתנות פרישה: הכנסות ריבית", `חשבון נאמנות נפתח ב-1.1; ב-31.3 הופקדו בו ${fmt(GIFTS.deposit)} ₪. שיעור ההיוון ${pct(GIFTS.rate)}. מה הכנסות הריבית על הנכסים בשנה?`, GIFTS_ASSETS.interest, [
      `תשעה חודשים: ${fmt(GIFTS.deposit)} × (${1 + GIFTS.rate}^(9/12) − 1) = ${fmt(Math.round(GIFTS_ASSETS.interest))} ₪.`,
    ]),
    calc("gifts-recognised", "מתנות פרישה: הנכסים המוכרים", `חשבון הנאמנות שווה בסוף השנה ${fmt(GIFTS.fairValue)} ₪, וההתחייבות ${fmt(GIFTS.closing)}. הנאמן יכול להשתמש בכסף רק לקניית מתנות, והחזר לחברה — לפי שיקול דעתו בלבד. באיזה סכום מוכרים את הנכסים?`, GIFTS_RECOGNISED, [
      `החברה לא יכולה להשתמש בעודף — התקרה אפס. הנכסים מוכרים בגובה ההתחייבות: ${fmt(GIFTS_RECOGNISED)} ₪.`,
    ]),
    calc("gifts-assets-pn", "מתנות פרישה: P.N. נכסים", `חשבון נאמנות: הפקדה ${fmt(GIFTS.deposit)}; הכנסות ריבית ${fmt(Math.round(GIFTS_ASSETS.interest))}; הנכסים מוכרים בסוף השנה ב-${fmt(GIFTS_RECOGNISED)} (אחרי התקרה). מה ה-P.N. של הנכסים? (הפסד — בסכום חיובי)`, -GIFTS_ASSETS.pn, [
      `${fmt(GIFTS_RECOGNISED)} − 0 − ${fmt(Math.round(GIFTS_ASSETS.interest))} − ${fmt(GIFTS.deposit)} = ${fmt(Math.round(GIFTS_ASSETS.pn))}.`,
      `מורכב מ: הפסד השקעות ${fmt(GIFTS.investmentLoss)} + ריבית שלא הושגה ${fmt(Math.round(GIFTS_ASSETS.interest))} + השפעת התקרה ${fmt(GIFTS_CEILING_EFFECT)}.`,
    ]),
    calc("gifts-oci", "מתנות פרישה: OCI", `מתנות פרישה, השנה: P.N. של ההתחייבות — רווח ${fmt(-GIFTS_PN)}; P.N. של הנכסים — הפסד ${fmt(Math.round(-GIFTS_ASSETS.pn))}. מה ה-OCI נטו? (הפסד — בסכום חיובי)`, -GIFTS_EFFECT.oci, [`${fmt(Math.round(-GIFTS_ASSETS.pn))} − ${fmt(-GIFTS_PN)} = ${fmt(Math.round(-GIFTS_EFFECT.oci))} ₪ הפסד ב-OCI.`]),
    calc("sales-a-2023", "צוות מכירות: נכסים 2023", `קרן של צוות המכירות (${lessonRef("ias19-rollforward")}): פתיחה ${fmt(SALES_ASSETS.y2023.opening)}; שיעור ${pct(SALES.y2023.rate)}; הפקדות ${fmt(SALES_ASSETS.y2023.contributions)} וכל התשלומים בסוף השנה — מתוך ${fmt(SALES.y2023.payments)} שקיבלו העובדים, ${fmt(SALES_ASSETS.y2023.paidFromFund)} שולמו מהקרן; שווי הוגן בסוף השנה ${fmt(SALES_ASSETS.y2023.closing)}. מה ה-P.N. של הנכסים (רווח — בסכום חיובי)?`, SALES_A_2023.pn, [
      `ריבית: ${fmt(SALES_ASSETS.y2023.opening)} × ${pct(SALES.y2023.rate)} = ${fmt(SALES_A_2023.interest)}.`,
      `P.N. = ${fmt(SALES_ASSETS.y2023.closing)} − ${fmt(SALES_ASSETS.y2023.opening)} − ${fmt(SALES_A_2023.interest)} − ${fmt(SALES_ASSETS.y2023.contributions)} + ${fmt(SALES_ASSETS.y2023.paidFromFund)} = ${fmt(SALES_A_2023.pn)} — רק מה ששולם מהקרן.`,
    ]),
    calc("sales-a-2024", "צוות מכירות: נכסים 2024", `קרן של צוות המכירות, 2024: פתיחה ${fmt(SALES_ASSETS.y2023.closing)}; שיעור ${pct(SALES.y2024.rate)}; הפקדות ${fmt(SALES_ASSETS.y2024.contributions)}; שולמו מהקרן ${fmt(SALES_ASSETS.y2024.paidFromFund)} (מתוך ${fmt(SALES_2024.payments)} ששולמו לעובדים); שווי הוגן בסוף ${fmt(SALES_ASSETS.y2024.closing)}. מה ה-P.N. של הנכסים (רווח — בסכום חיובי)?`, SALES_A_2024.pn, [
      `ריבית ${fmt(SALES_A_2024.interest)}; P.N. = ${fmt(SALES_A_2024.pn)} ₪ רווח.`,
    ]),
    calc("split-interest", "ריבית על הפקדה בשנה מפוצלת", `קרן: פתיחה ${fmt(SPLIT.opening)}; שיעור ההתחייבות ${pct(SPLIT.periods[0].i)} עד 30.6 ו-${pct(SPLIT.periods[1].i)} מ-1.7; ב-1.7 הופקדו ${fmt(SPLIT.contribution)}. לפי IAS 19.125, מה הכנסות הריבית של השנה (בלי עיגולי ביניים)?`, SPLIT_INTEREST.total, [
      `חצי ראשון: ${fmt(SPLIT.opening)} × (${1 + SPLIT.periods[0].i}^0.5 − 1) = ${fmt(SPLIT_INTEREST.parts[0])}.`,
      `חצי שני: (${fmt(SPLIT.opening)} + ${fmt(SPLIT.contribution)}) × (${1 + SPLIT.periods[1].i}^0.5 − 1) = ${fmt(SPLIT_INTEREST.parts[1])}. סה״כ ${fmt(Math.round(SPLIT_INTEREST.total * 100) / 100)} — באותו פיצול כמו ההתחייבות.`,
    ]),
    choice("net", "התחייבות נטו", "התחייבות 31,000 ונכסי תכנית 12,400. מה מוצג במאזן?", ["התחייבות נטו 18,600", "התחייבות 31,000 ונכס 12,400, בנפרד", "נכס 12,400", "התחייבות 43,400"], 0, "התחייבות נטו = התחייבות פחות נכסים (IAS 19.113)."),
  ],
  traps,
  tips: [
    "שני מעגלים — התחייבות ונכסים — הפער ביניהם הוא נטו, ותקרה חוסמת עודף.",
    "(א) התחייבות נטו = התחייבות פחות נכסים. (ב) מעגל נכסים: פתיחה + ריבית + הפקדות − תשלומים מהנכסים + P.N. = סגירה; הריבית בשיעור של ההתחייבות ובאותו פיצול תקופות, והפקדה באמצע שנה מקבלת ריבית חלקית. (ג) מההתחייבות יורדים כל התשלומים; מהנכסים — רק מה שיצא מהם. (ד) נכס נטו = הנמוך מבין העודף והתקרה.",
    "נכסי תכנית (סעיפים 8 ו-113): בקרן נפרדת, רק לתשלום הטבות, לא זמינים לנושים. P.N. של הנכסים (סעיף 127) — ל-OCI.",
    "תקרת נכס (סעיף 64, IFRIC 14): הערך הנוכחי של מה שהחברה יכולה להשתמש בו — החזר או הקטנת הפקדות. עודף שאי אפשר להשתמש בו נשרף ב-OCI.",
  ],
};
