import { grown, partInterest, plainYear, pv, rollForward } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { FORMULA, said, work } from "../formulas";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, lessonRef, pct } from "../shared";

/**
 * The worked example: a CFO who started in 2023 and gets a share of the last
 * salary for each year; the rate falls at the end of the first year. The
 * second year twice: with no change, and with new assumptions at its end.
 */
export const CF = { from: 2023, share: 0.04, salary: 180_000, growth: 0.03, retire: 2028, rateStart: 0.07, rateEnd1: 0.06 };
const raises = CF.retire - CF.from;
export const CF_PER_YEAR = CF.share * grown(CF.salary, CF.growth, raises);
/** The first year: no opening, so no interest; service at the start rate, closing at the end rate. */
export const Y1 = { service: pv(CF_PER_YEAR, CF.rateStart, raises), closing: pv(CF_PER_YEAR, CF.rateEnd1, raises) };
export const Y1_PN = Y1.closing - Y1.service;
/** The second year, nothing changed. */
export const Y2 = plainYear({ opening: Y1.closing, i: CF.rateEnd1, perYear: CF_PER_YEAR, servedAtStart: 1, nEnd: raises - 1 });
/** The second year, with retirement a year later (one more raise) and the rate down to 4.5% at its end. */
export const CHANGED = { retire: 2029, rateEnd: 0.045 };
export const CHANGED_PER_YEAR = CF.share * grown(CF.salary, CF.growth, CHANGED.retire - CF.from);
export const CHANGED_CLOSING = pv(2 * CHANGED_PER_YEAR, CHANGED.rateEnd, CHANGED.retire - CF.from - 1);
export const CHANGED_PN = CHANGED_CLOSING - Y2.closing;
/** "We solve": only the rate falls, to 4.5%. */
export const RATE_ONLY_CLOSING = pv(2 * CF_PER_YEAR, CHANGED.rateEnd, raises - 1);
export const RATE_ONLY_PN = RATE_ONLY_CLOSING - Y2.closing;

/** Interest when a benefit is paid during the year (IAS 19.123): a grant paid on 1.6, so seven months without interest. */
export const PAID_YEAR = { opening: 240_000, rate: 0.065, paid: 30_000, month: 6 };
export const PAID_MONTHS = 13 - PAID_YEAR.month;
export const PAID_ON_OPENING = PAID_YEAR.opening * PAID_YEAR.rate;
export const PAID_SAVED = partInterest(PAID_YEAR.paid, PAID_YEAR.rate, PAID_MONTHS);
export const PAID_INTEREST = PAID_ON_OPENING - PAID_SAVED;

/** The exercise (a): a sales team's plan with given lines — the P.N. one year, the payments the next. Lesson 9 adds its assets. */
export const SALES = {
  y2023: { opening: 3_400_000, rate: 0.034, service: 610_000, payments: 310_000, closing: 3_950_000 },
  y2024: { rate: 0.03, service: 660_000, gain: 250_000, closing: 4_100_000 },
};
export const SALES_2023 = rollForward({ opening: SALES.y2023.opening, interest: SALES.y2023.opening * SALES.y2023.rate, service: SALES.y2023.service, payments: SALES.y2023.payments, closing: SALES.y2023.closing }, "pn");
export const SALES_2024 = rollForward(
  { opening: SALES.y2023.closing, interest: SALES.y2023.closing * SALES.y2024.rate, service: SALES.y2024.service, pn: -SALES.y2024.gain, closing: SALES.y2024.closing },
  "payments",
);

/** The exercise (b): research staff, a sabbatical payment in the sixth year, accrued over five; 8% at every date. Lesson 11 classifies it. */
export const RND = { staff: 15, stay: 0.9, years: 5, salary: 120_000, raise: 0.02, rate: 0.08, from: 2024 };
export const RND_PAYMENT = grown(RND.salary, RND.raise, RND.years - 1);
export const RND_PER_YEAR = (RND_PAYMENT * RND.staff * RND.stay) / RND.years;
export const RND_OPENING = pv(RND_PER_YEAR, RND.rate, RND.years - 1);
export const RND_2025 = plainYear({ opening: RND_OPENING, i: RND.rate, perYear: RND_PER_YEAR, servedAtStart: 1, nEnd: RND.years - 2 });

const traps: Trap[] = [
  {
    id: "interest-closing",
    prompt: "פתיחה 45,000, סגירה 75,000, שיעור תחילת השנה 6%. על איזו יתרה מחשבים את הריבית?",
    options: ["על 45,000 — הפתיחה", "על 75,000 — הסגירה", "על הממוצע, 60,000", "על השינוי, 30,000"],
    answer: 0,
    why: `הריבית היא ״ההתקרבות לתשלום״ של מה שהיה בתחילת השנה.
${said(work.interestCost(45_000, 0.06))}`,
    traps: ["", "המלכודת: ריבית על הסגירה. הסגירה כבר כוללת את הריבית ואת השירות של השנה.", "אין ממוצע; שירות השנה מתווסף בסופה.", "השינוי כולל את הריבית עצמה."],
  },
  {
    id: "end-rate",
    prompt: "בתחילת השנה השיעור 7%, ובסופה 6%. באיזה שיעור מחשבים ריבית ועלות שירות?",
    options: ["7% — תחילת השנה", "6% — סוף השנה", "6.5%", "7% לריבית ו-6% לשירות"],
    answer: 0,
    why: `ריבית ועלות שירות — לפי ההנחות של תחילת השנה. שיעור סוף השנה שייך רק לסגירה.
${FORMULA.interestCost}
${FORMULA.service}`,
    traps: ["", "המלכודת: להשתמש בשיעור סוף השנה. השינוי בשיעור ייתפס ב-P.N.", "אין ממוצע.", "שתיהן לפי תחילת השנה."],
  },
  {
    id: "n-service-cost",
    prompt: "סגירה ב-31.12.2024, הפרישה ב-31.12.2028. כמה שנים מהוונים את עלות השירות של 2024?",
    options: ["4 — מסוף 2024", "5 — מתחילת 2024", "3", "1"],
    answer: 0,
    why: `עלות השירות נמדדת לסוף השנה.
${said(work.nYear(2028, 2024))}`,
    traps: ["", "המלכודת: לספור מתחילת השנה. השירות של השנה ״נגמר״ בסופה.", "שלוש שנים זה מסוף 2025.", "שנה אחת זה רק עד סוף 2025."],
  },
  {
    id: "pn-to-pl",
    prompt: "ה-P.N. של ההתחייבות השנה הוא הפסד של 12,000 ₪. איפה הוא נרשם?",
    options: ["ב-OCI — רווח כולל אחר", "ברווח והפסד, בהוצאות השכר", "ברווח והפסד, בהוצאות המימון", "לא נרשם — הוא רק הפרש"],
    answer: 0,
    why: "מדידה מחדש של התחייבות להטבה מוגדרת נרשמת ב-OCI (סעיף 57(ד)).",
    traps: ["", "המלכודת: לרשום לרווח והפסד. שם נרשמים רק שירות וריבית.", "הריבית היא שורה אחרת.", "ההתחייבות גדלה — חייבים לרשום את ההפרש."],
  },
  {
    id: "assets-only-payments",
    prompt: "בשנה שולמו לעובדים 300,000 ₪: 60,000 מהקרן, והשאר מהחברה. כמה מורידים בתנועה בהתחייבות?",
    options: ["300,000", "60,000", "240,000", "0"],
    answer: 0,
    why: `ההתחייבות קטנה בכל מה ששולם לעובדים — לא משנה מאיזה כיס.
${said(work.paidTotal(60_000, 240_000))}`,
    traps: ["", "המלכודת: להוריד רק את מה ששולם מהקרן. זה נכון לנכסים, לא להתחייבות.", "גם החלק של הקרן מסלק חוב.", "התשלום מקטין את ההתחייבות."],
  },
  {
    id: "pn-recycle",
    prompt: "לפני שלוש שנים נרשם הפסד ממדידה מחדש של 40,000 ₪ ב-OCI. השנה העובדים פרשו. מה קורה לסכום?",
    options: ["נשאר בהון; מותר להעביר אותו לעודפים", "עובר לרווח והפסד בשנת הפרישה", "מבוטל מול ההתחייבות", "נפרס לרווח והפסד על שנים"],
    answer: 0,
    why: "מדידה מחדש לא ממוחזרת לרווח והפסד; אפשר להעביר אותה בתוך ההון, לעודפים (סעיף 122).",
    traps: ["", "המלכודת: למחזר כמו מכשירים פיננסיים. כאן אסור.", "ההתחייבות כבר שולמה; ההפסד נשאר בהון.", "אין פריסה של מדידה מחדש."],
  },
  {
    id: "pn-sign",
    prompt: "הריבית בשוק ירדה בסוף השנה. מה קורה להתחייבות, ואיזה P.N. נוצר?",
    options: ["ההתחייבות גדלה — P.N. הפסד", "ההתחייבות קטנה — P.N. רווח", "אין השפעה", "ההתחייבות גדלה — P.N. רווח"],
    answer: 0,
    why: "ריבית נמוכה = מחלקים בפחות = ערך נוכחי גבוה יותר. התחייבות שגדלה היא הפסד.",
    traps: ["", "המלכודת: לטעות בכיוון. ריבית יורדת מגדילה ערך נוכחי.", "הסגירה נמדדת בשיעור החדש — יש השפעה.", "התחייבות שגדלה היא הפסד, לא רווח."],
  },
];

/** Lesson 7: a year's roll-forward of the obligation — interest, current service, payments, the closing — and the P.N. that balances it. */
export const ROLLFORWARD: StudyModule = {
  slug: "ias19-rollforward",
  course: COURSE,
  n: 7,
  title: "הטבה מוגדרת 3: מעגל ההתחייבות לאורך שנה",
  description: `שתי מדידות — בפתיחה ובסגירה — וחמש שורות שמסבירות את מה שקרה ביניהן: ריבית, עלות שירות שוטף, תשלומים, והפער שמאזן: ה-P.N. לכל שורה — השיעור וה-n שלה. התשתית של ${lessonRef("ias19-amend")} ו${lessonRef("ias19-assets")}.`,
  goal: "לבנות מעגל התחייבות לשנה שלמה, למצוא את ה-P.N. כהפרש שמאזן אותו, ולבחור לכל שורה את הריבית ואת n הנכונים.",
  outcomes: [
    "לחשב ריבית על יתרת הפתיחה בשיעור של תחילת השנה",
    "לחשב עלות שירות שוטף, מהוונת לסוף השנה",
    "למדוד את הסגירה בהנחות סוף השנה, ולמצוא את ה-P.N.",
    "למצוא שורה חסרה אחרת במעגל כשה-P.N. נתון",
    "לרשום את התנועות: שכר, מימון, OCI ותשלום",
    "להוריד מהריבית את חלקה של הטבה ששולמה באמצע השנה",
    "לדעת מה הולך לרווח והפסד ומה ל-OCI, ושמדידה מחדש לא חוזרת לרווח והפסד",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-roll-hook", title: "חשבון החיסכון שהפתיע" },
    { id: "emp-roll-lines", title: "ארבע שורות שמסבירות, ואחת שמאזנת" },
    { id: "emp-roll-rates", title: "איזו ריבית ואיזה n בכל שורה" },
    { id: "emp-roll-paid", title: "ריבית כששולם מענק באמצע השנה" },
    { id: "emp-roll-rule", title: "הכלל: המעגל, ורישום כל שורה" },
    { id: "emp-roll-where", title: "לאן הולכת כל שורה: רווח והפסד, OCI, ומה עם ההון" },
    { id: "emp-roll-template", title: "תבנית פתרון: תנועה בהתחייבות" },
    { id: "emp-roll-solved", title: "דוגמה פתורה: סמנכ״ל כספים, שנתיים" },
    { id: "emp-roll-together", title: "פותרים יחד: רק הריבית יורדת" },
    { id: "emp-roll-drill", title: "מחולל שאלות: תנועה וריבית במספרים חדשים" },
    { id: "emp-roll-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("sales-interest", "צוות מכירות: ריבית", `צוות מכירות: יתרת ההתחייבות ב-1.1.2023 ${fmt(SALES.y2023.opening)} ₪; שיעור ההיוון ב-31.12.2022 ${pct(SALES.y2023.rate)}. מה הוצאות הריבית של 2023?`, SALES_2023.interest, [
      said(work.interestCost(SALES.y2023.opening, SALES.y2023.rate)),
      "על הפתיחה, בשיעור של תחילת השנה.",
    ]),
    calc("sales-pn", "צוות מכירות: P.N.", `צוות מכירות, 2023: פתיחה ${fmt(SALES.y2023.opening)}; ריבית ${fmt(SALES_2023.interest)}; עלות שירות ${fmt(SALES.y2023.service)}; כל ההטבות ששולמו לעובדים ${fmt(SALES.y2023.payments)} (ביום האחרון של השנה); סגירה ${fmt(SALES.y2023.closing)}. מה ה-P.N. (הפסד, בסכום חיובי)?`, SALES_2023.pn, [
      said(work.pnDB(SALES_2023)),
      "הפסד, ל-OCI.",
    ]),
    calc("sales-payments", "צוות מכירות: התשלומים", `צוות מכירות, 2024: פתיחה ${fmt(SALES.y2023.closing)}; שיעור ב-31.12.2023 ${pct(SALES.y2024.rate)}; עלות שירות ${fmt(SALES.y2024.service)}; רווח אקטוארי (P.N.) ${fmt(SALES.y2024.gain)}; סגירה ${fmt(SALES.y2024.closing)}. ההטבות שולמו ביום האחרון של השנה. כמה הטבות שולמו?`, SALES_2024.payments, [
      `ריבית:
${said(work.interestCost(SALES.y2023.closing, SALES.y2024.rate))}`,
      `כאן הנעלם הוא התשלומים, וה-P.N. רווח, ולכן בא עם מינוס:
${said(work.paymentsDB(SALES_2024))}`,
    ]),
    calc("rnd-opening", "שבתון: פתיחה", `מחלקת מחקר: ${RND.staff} עובדים, ${pct(RND.stay)} צפויים להישאר ${RND.years} שנים, ובתחילת השנה השישית יקבל כל אחד תשלום שבתון של ${fmt(RND_PAYMENT)} ₪. הצבירה על ${RND.years} שנים, מ-1.1.${RND.from}; שיעור ההיוון ${pct(RND.rate)}. מה ההתחייבות ב-31.12.${RND.from}?`, RND_OPENING, [
      said(work.perYearGroup(RND_PAYMENT, RND.staff, RND.stay, RND.years)),
      `נצברה שנה אחת:
${said(work.nYear(RND.from + RND.years - 1, RND.from))}`,
      said(work.measure({ perYear: RND_PER_YEAR, years: 1, heads: 1, n: RND.years - 1, i: RND.rate })),
    ]),
    calc("rnd-service", "שבתון: עלות שירות", `מחלקת מחקר: צבירה לשנה ${fmt(RND_PER_YEAR)} ₪ (כל העובדים יחד), התשלום ב-1.1.${RND.from + RND.years}, שיעור ${pct(RND.rate)}. מה עלות השירות השוטף של ${RND.from + 1}?`, RND_2025.service, [
      `מהוונים מסוף ${RND.from + 1} עד התשלום:
${said(work.nYear(RND.from + RND.years - 1, RND.from + 1))}`,
      said(work.service(RND_PER_YEAR, RND.rate, RND.years - 2)),
    ]),
    calc("rnd-closing", "שבתון: סגירה", `מחלקת מחקר: צבירה לשנה ${fmt(RND_PER_YEAR)} ₪, התשלום ב-1.1.${RND.from + RND.years}, שיעור ${pct(RND.rate)} בכל התאריכים, וההנחות לא השתנו. מה ההתחייבות ב-31.12.${RND.from + 1}?`, RND_2025.closing, [
      `נצברו שתי שנים:
${said(work.measure({ perYear: RND_PER_YEAR, years: 2, heads: 1, n: RND.years - 2, i: RND.rate }))}`,
      `בדיקה מהמעגל, כש-P.N. = 0 כי שום הנחה לא השתנתה. הריבית:
${said(work.interestCost(RND_OPENING, RND.rate))}`,
      said(work.rollDB({ opening: RND_OPENING, interest: RND_2025.interest, service: RND_2025.service })),
    ]),
    journal(
      "sales-entries",
      "רישום שורות המעגל",
      `צוות מכירות, 2023: רשמו בפקודה אחת את עלות השירות (${fmt(SALES.y2023.service)}), הריבית (${fmt(SALES_2023.interest)}), ההפסד האקטוארי (${fmt(SALES_2023.pn)}) והתשלום לעובדים (${fmt(SALES.y2023.payments)}).`,
      [
        { account: "הוצאות שכר", dr: SALES.y2023.service },
        { account: "הוצאות מימון", dr: SALES_2023.interest },
        { account: "קרן הון — מדידה מחדש", dr: SALES_2023.pn },
        { account: "מזומן", cr: SALES.y2023.payments },
        { account: "התחייבות בשל הטבה מוגדרת", cr: SALES.y2023.service + SALES_2023.interest + SALES_2023.pn - SALES.y2023.payments },
      ],
      `שירות — לשכר; ריבית — למימון; P.N. — ל-OCI; והתשלום מקטין את ההתחייבות. ההתחייבות בזכות:
${said(work.liabilityMove(SALES.y2023.service, SALES_2023.interest, SALES_2023.pn, SALES.y2023.payments))}`,
      ["הוצאות שכר", "הוצאות מימון", "קרן הון — מדידה מחדש", "מזומן", "התחייבות בשל הטבה מוגדרת", "נכסי תכנית"],
    ),
    choice("pn-zero", "P.N.", "בשנה שבה לא השתנתה שום הנחה, ולא היו תשלומים חריגים — כמה P.N.?", ["אפס", "שווה לריבית", "שווה לעלות השירות", "תמיד חיובי"], 0, `פתיחה, ריבית, שירות ותשלומים מסבירים הכול, ולא נשאר פער:
${FORMULA.pnDB}`),
  ],
  traps,
  tips: [
    "שירות שוטף, ריבית, שירות עבר וסילוק — לרווח והפסד (אלא אם מהוונים לנכס, כמו מלאי). מדידה מחדש — ל-OCI, ולא חוזרת לרווח והפסד; מותר להעביר אותה לעודפים (סעיף 122). הריבית — במימון או בשכר, עם גילוי נפרד.",
    "ריבית (סעיף 123): פתיחה × שיעור תחילת השנה, פחות הריבית על כל תשלום מיום ששולם: תשלום × ((1+i)^(חודשים/12) − 1).",
    "המעגל: פתיחה, ריבית, שירות, תשלומים, P.N. וסגירה — הריבית והשירות לפי תחילת השנה, הסגירה לפי סופה.",
    `${FORMULA.rollDB}; ${FORMULA.pnDB}; ${FORMULA.interestCost}; ${FORMULA.service} — n נספר מסוף השנה.`,
    "רישום: שירות — ח׳ הוצאות שכר; ריבית — ח׳ הוצאות מימון; הפסד P.N. — ח׳ קרן הון (OCI); תשלום — ז׳ מזומן. בכולן הצד השני: ההתחייבות.",
    "P.N. (סעיף 57(ד)): כל מה שנשאר — שינויי הנחות, והפער בין הצפוי למה שקרה. ריבית יורדת מגדילה את ההתחייבות: הפסד.",
  ],
};
