import { amendedYear, balancingPN, partInterest, plainYear, pv, retirementPN, settlementGain } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, lessonRef, pct } from "../shared";
import { oneoffAt, ONEOFF, ONEOFF_PER_YEAR } from "./attribute";
import { CFO, CFO_2022, CFO_PER_YEAR, GROUP, GROUP_CLOSING, GROUP_OPENING } from "./measure";

/** The worked example: a CTO's grant raised mid-year, for the past years too, as the rate falls. */
export const CTO = { from: 2023, retire: 2028, oldPerYear: 70_000, newPerYear: 90_000, rateEnd2023: 0.085, rateAmend: 0.075, month: 6 };
export const CTO_OPENING = pv(CTO.oldPerYear, CTO.rateEnd2023, CTO.retire - CTO.from);
export const CTO_YEAR = amendedYear({
  opening: CTO_OPENING,
  iStart: CTO.rateEnd2023,
  iAmend: CTO.rateAmend,
  iEnd: CTO.rateAmend,
  months: CTO.month,
  oldPerYear: CTO.oldPerYear,
  newPerYear: CTO.newPerYear,
  servedAtStart: 1,
  nEnd: CTO.retire - CTO.from - 1,
});

/** "We solve": (a) a settlement for less than the books carry; (b) an unexpected retirement on the plan's terms; (c) a small settlement at a loss. */
export const SETTLE = { paid: 130_000 };
export const SETTLE_GAIN = settlementGain(CTO_YEAR.closing, SETTLE.paid);
export const RETIRE = { date: "1.1.2025", years: 2 };
export const RETIRE_PAID = RETIRE.years * CTO.newPerYear;
export const RETIRE_PN = retirementPN(CTO_YEAR.closing, RETIRE_PAID);
export const SMALL = { books: 487.3, paid: 520 };
export const SMALL_LOSS = -settlementGain(SMALL.books, SMALL.paid);

/**
 * The exercise: the logistics company's year between its two measurements
 * (lesson 5) — a payment on 31.3, the grant improved on 30.9 for every year,
 * and the rate changing on the amendment date.
 */
export const LOG = { paid: 45_000, paidMonth: 3, month: 9, rateBefore: GROUP.opening.corporate, rateAfter: GROUP.closing.corporate, finalAtAmend: GROUP.closing.finalSalary, headsAtAmend: GROUP.closing.staff * GROUP.closing.stay };
const served = GROUP.opening.years + LOG.month / 12;
const nAmend = GROUP.closing.n + (12 - LOG.month) / 12;
const oldPer = GROUP.opening.share * GROUP.opening.finalSalary * GROUP.opening.staff * GROUP.opening.stay;
const newPer = GROUP.closing.share * LOG.finalAtAmend * LOG.headsAtAmend;
export const LOG_YEAR = (() => {
  const serviceBefore = pv((oldPer * LOG.month) / 12, LOG.rateBefore, nAmend);
  const serviceAfter = pv((newPer * (12 - LOG.month)) / 12, LOG.rateAfter, GROUP.closing.n);
  const before = pv(GROUP.opening.share * LOG.finalAtAmend * LOG.headsAtAmend * served, LOG.rateAfter, nAmend);
  const after = pv(newPer * served, LOG.rateAfter, nAmend);
  const interestOpening = partInterest(GROUP_OPENING, LOG.rateBefore, LOG.month);
  const interestPaid = partInterest(LOG.paid, LOG.rateBefore, LOG.month - LOG.paidMonth);
  const interestAfter = partInterest(after, LOG.rateAfter, 12 - LOG.month);
  const interest = interestOpening - interestPaid + interestAfter;
  const pastService = after - before;
  const service = serviceBefore + serviceAfter;
  const pn = balancingPN({ opening: GROUP_OPENING, interest, service, pastService, payments: LOG.paid, settled: 0, closing: GROUP_CLOSING });
  return { served, nAmend, serviceBefore, serviceAfter, service, before, after, pastService, interestOpening, interestPaid, interestAfter, interest, pn };
})();

/** Continued practice: the CFO of lesson 5 — a plain year, then a year with an amendment on 30.9. */
export const CFO_RATES = { end2023: 0.031, amend: 0.03, end2024: 0.029 };
export const CFO_NEW_SHARE = 1.5;
export const CFO_2023 = plainYear({ opening: CFO_2022, i: CFO.rate2022, perYear: CFO_PER_YEAR, servedAtStart: 1, nEnd: CFO.years - 2, iEnd: CFO_RATES.end2023 });
export const CFO_2024 = amendedYear({
  opening: CFO_2023.closing,
  iStart: CFO_RATES.end2023,
  iAmend: CFO_RATES.amend,
  iEnd: CFO_RATES.end2024,
  months: 9,
  oldPerYear: CFO_PER_YEAR,
  newPerYear: (CFO_PER_YEAR / CFO.share) * CFO_NEW_SHARE,
  servedAtStart: 2,
  nEnd: CFO.years - 3,
});

/** Continued practice: the one-off grant of lesson 6, raised on 1.7.2023 as the rate falls. */
export const ONEOFF_AMEND = { grant: 108_000, rateStart: ONEOFF.rates[2022], rateAmend: 0.05 };
export const ONEOFF_2023 = amendedYear({
  opening: oneoffAt(2022).obligation,
  iStart: ONEOFF_AMEND.rateStart,
  iAmend: ONEOFF_AMEND.rateAmend,
  iEnd: ONEOFF_AMEND.rateAmend,
  months: 6,
  oldPerYear: ONEOFF_PER_YEAR,
  newPerYear: ONEOFF_AMEND.grant / ONEOFF.minYears,
  servedAtStart: 2,
  nEnd: oneoffAt(2022).n - 1,
});

const traps: Trap[] = [
  {
    id: "one-period",
    prompt: "המענק עלה ב-1.7. איך מחשבים את עלות השירות השוטף של השנה?",
    options: ["חצי שנה בתנאים הישנים וחצי בחדשים, כל חלק מהוון מסוף התקופה שלו", "כל השנה בתנאים החדשים", "כל השנה בתנאים הישנים", "ממוצע של שני הסכומים, מהוון מסוף השנה"],
    answer: 0,
    why: "שינוי תנאים מפצל את השנה לשתי תקופות; לכל אחת התנאים, השיעור וה-n שלה.",
    traps: ["", "המלכודת: כל השירות בתנאים אחד. חצי השנה הראשונה עבדה עוד בתנאים הישנים.", "גם כך מתעלמים מהפיצול.", "אין ממוצע; יש שתי תקופות."],
  },
  {
    id: "past-rate",
    prompt: "שיעור תחילת השנה 8.5%; ביום התיקון 7.5%. באיזה שיעור מודדים את שני צדי שירות העבר?",
    options: ["7.5% — שתי היתרות ביום התיקון", "8.5% — תחילת השנה", "8.5% ל״לפני״ ו-7.5% ל״אחרי״", "7.5% ל״לפני״ ו-8.5% ל״אחרי״"],
    answer: 0,
    why: "שירות עבר = ההתחייבות אחרי השינוי פחות ההתחייבות לפניו — שתיהן ביום השינוי, באותו שיעור ובאותו n.",
    traps: ["", "המלכודת: לחשב בשיעור תחילת השנה. ההשוואה היא ביום התיקון.", "אם השיעור שונה, ההפרש יערבב תיקון עם שינוי ריבית.", "אותה בעיה, בכיוון ההפוך."],
  },
  {
    id: "interest-after",
    prompt: "אחרי התיקון ב-1.7 — על איזו יתרה מחשבים ריבית עד סוף השנה?",
    options: ["על ההתחייבות אחרי התיקון (אחרי שירות העבר)", "על יתרת הפתיחה", "על יתרת הסגירה", "על ההתחייבות לפני התיקון"],
    answer: 0,
    why: "מיום התיקון ההתחייבות היא היתרה המעודכנת — עליה הריבית לתקופה שנשארה.",
    traps: ["", "המלכודת: להמשיך עם הפתיחה. היא כבר לא היתרה מאז התיקון.", "הסגירה כוללת את הריבית עצמה.", "זו היתרה רגע לפני — כבר לא רלוונטית."],
  },
  {
    id: "retire-is-settlement",
    prompt: "עובד פרש מוקדם מהצפוי, וקיבל בדיוק מה שמגיע לו לפי התוכנית. מה הרישום של ההפרש מול ההתחייבות?",
    options: ["P.N. ב-OCI", "רווח או הפסד מסילוק, ברווח והפסד", "שירות עבר", "אין הפרש — זה תשלום"],
    answer: 0,
    why: "תשלום לפי תנאי התוכנית אינו סילוק; ההפרש הוא שינוי אומדן — P.N.",
    traps: ["", "המלכודת: ״הוא עזב, אז זה סילוק״. סילוק הוא רק עסקה מחוץ לתנאים (סעיף 109–111).", "שירות עבר נובע משינוי תנאים, לא מעזיבה.", "התשלום שונה מהיתרה בספרים — וההפרש נרשם."],
  },
  {
    id: "past-to-oci",
    prompt: "עלות שירות עבר של 25,000 ₪ — איפה היא נרשמת?",
    options: ["ברווח והפסד, מיד", "ב-OCI", "נפרסת על שנות השירות שנותרו", "ישירות לעודפים"],
    answer: 0,
    why: "שירות עבר מוכר מיד ברווח והפסד (סעיף 103).",
    traps: ["", "המלכודת: לחשוב שכל תיקון הוא מדידה מחדש. שירות עבר נובע מהחלטת החברה, לא מהנחות.", "פריסה הייתה פעם — כבר לא.", "לא עוקפים את רווח והפסד."],
  },
  {
    id: "leavers-oci",
    prompt: "השנה עזבו במפתיע הרבה יותר עובדים מהצפוי, וההתחייבות ירדה ב-60,000 ₪. איך נרשמת הירידה?",
    options: ["רווח ממדידה מחדש, ב-OCI", "עלות שירות עבר שלילית, ברווח והפסד", "רווח מסילוק", "לא נרשמת"],
    answer: 0,
    why: "שינוי שנובע מאירוע שאינו בשליטת החברה — כמו עזיבות בלתי צפויות — הוא שינוי בהנחות: מדידה מחדש, ב-OCI. שירות עבר נולד מהחלטה של החברה (תיקון או צמצום).",
    traps: ["", "המלכודת: ״ההתחייבות ירדה בגלל פחות עובדים — זה צמצום״. צמצום הוא החלטה של החברה, כמו סגירת מפעל.", "לא שולם כלום — אין סילוק.", "ההתחייבות השתנתה — חייבים לרשום."],
  },
  {
    id: "net-changes",
    prompt: "ב-1.3 החברה הגדילה את המענק (+90,000), ובו ביום גם סגרה סניף וצמצמה את התוכנית (−35,000). איך מציגים?",
    options: ["שינוי אחד נטו: עלות שירות עבר של 55,000", "שני רישומים: 90,000 שירות עבר ו-35,000 רווח מסילוק", "רק את הגדלת המענק", "את הנטו ב-OCI"],
    answer: 0,
    why: "כמה שינויים בו־זמניים בעלי השפעות מנוגדות נבחנים יחד, כשינוי אחד נטו (סעיף 107).",
    traps: ["", "המלכודת: לפצל. צמצום אינו סילוק, והשינויים נבחנים יחד.", "גם הצמצום הוא שירות עבר.", "שירות עבר — לרווח והפסד."],
  },
  {
    id: "payment-interest",
    prompt: "ב-31.5 שולמו 36,000 ₪ לעובדים. משפיע על הריבית של השנה?",
    options: ["כן — מקטין אותה מיום התשלום", "לא — תשלום לא קשור לריבית", "כן — מגדיל אותה", "רק אם שולם מהקרן"],
    answer: 0,
    why: "מיום התשלום החוב קטן; מורידים את הריבית על התשלום עד סוף התקופה.",
    traps: ["", "המלכודת: לשכוח את התשלום. בלי ההפחתה, הריבית גבוהה מדי.", "תשלום מקטין חוב — ולכן גם ריבית.", "מאיזה כיס — לא משנה להתחייבות."],
  },
];

/** Lesson 8: a year split by an amendment — current service in two periods, past service, interest for each part — and settlement against an unexpected retirement. */
export const AMEND: StudyModule = {
  slug: "ias19-amend",
  course: COURSE,
  n: 8,
  title: "הטבה מוגדרת 4: שינוי תנאים באמצע שנה, שירות עבר, סילוק ופרישה בלתי צפויה",
  description: "כשהחברה משנה תנאים באמצע השנה: מפצלים את השנה, מודדים שירות עבר ביום השינוי, ומחשבים ריבית לכל חלק. ובסוף — שלושה אירועים שנשמעים דומים: סילוק, פרישה לפי התנאים, ושינוי תנאים.",
  goal: "לפצל שנה לתקופות כשהחברה משנה תנאים, לחשב עלות שירות עבר, ולהבחין בין סילוק לבין פרישה בלתי צפויה.",
  outcomes: [
    "לחשב עלות שירות שוטף בשתי תקופות, כל אחת בתנאים, בשיעור וב-n שלה",
    "לחשב שירות עבר ביום התיקון",
    "לחשב ריבית לחלק משנה, כולל השפעת תשלום באמצע השנה",
    "להבחין בין סילוק (רווח והפסד) לבין פרישה לפי התנאים (P.N.)",
    "להבחין בין תיקון וצמצום (שירות עבר, רווח והפסד) לבין שינוי שאינו בשליטת החברה (מדידה מחדש, OCI)",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-amend-hook", title: "המענק עולה מ-1 במאי" },
    { id: "emp-amend-what", title: "מהי עלות שירות עבר: תיקון, צמצום, ומה לא" },
    { id: "emp-amend-split", title: "שינוי תנאים: שתי תקופות, ושירות עבר" },
    { id: "emp-amend-settle", title: "סילוק מול פרישה בלתי צפויה" },
    { id: "emp-amend-rule", title: "הכלל: ארבעה צעדים בשנה מפוצלת" },
    { id: "emp-amend-template", title: "תבנית פתרון: שינוי תנאים, סילוק ופרישה" },
    { id: "emp-amend-solved", title: "דוגמה פתורה: מנהל הטכנולוגיה" },
    { id: "emp-amend-together", title: "פותרים יחד: סילוק, פרישה, וביטול תוכנית" },
    { id: "emp-amend-drill", title: "מחולל שאלות: שינוי תנאים וסילוק במספרים חדשים" },
    { id: "emp-amend-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    calc("log-service", "חברת לוגיסטיקה: שירות שוטף", `חברת הלוגיסטיקה, 2024 (נתוני ${lessonRef("ias19-measure")}): עד 30.9 — תנאים ישנים, ${fmt(oldPer)} ₪ לשנת שירות לכל הקבוצה, בשיעור ${pct(LOG.rateBefore)}; מ-1.10 — תנאים חדשים, ${fmt(newPer)} ₪ לשנה, בשיעור ${pct(LOG.rateAfter)}. התשלום בעוד ${GROUP.closing.n} שנים מסוף 2024. מה עלות השירות השוטף של 2024?`, LOG_YEAR.service, [
      `תשעה חודשים ישנים: ${fmt(oldPer)} × 9/12 ÷ ${1 + LOG.rateBefore}^${LOG_YEAR.nAmend} = ${fmt(Math.round(LOG_YEAR.serviceBefore))} — מהוונים מסוף התקופה, 30.9.`,
      `שלושה חודשים חדשים: ${fmt(newPer)} × 3/12 ÷ ${1 + LOG.rateAfter}^${GROUP.closing.n} = ${fmt(Math.round(LOG_YEAR.serviceAfter))}. סה״כ ${fmt(Math.round(LOG_YEAR.service))} ₪.`,
    ]),
    calc("log-past", "חברת לוגיסטיקה: שירות עבר", `חברת הלוגיסטיקה, 30.9.2024: המענק עולה מ-${pct(GROUP.opening.share)} ל-${pct(GROUP.closing.share)} מהשכר האחרון, לכל שנות השירות. ביום התיקון: ${served} שנות שירות, שכר צפוי ${fmt(LOG.finalAtAmend)} ₪, ${fmt(LOG.headsAtAmend)} עובדים צפויים, שיעור ${pct(LOG.rateAfter)}, ${LOG_YEAR.nAmend} שנים עד התשלום. מה עלות שירות העבר?`, LOG_YEAR.pastService, [
      `לפני: ${pct(GROUP.opening.share)} × ${fmt(LOG.finalAtAmend)} × ${served} × ${fmt(LOG.headsAtAmend)} ÷ ${1 + LOG.rateAfter}^${LOG_YEAR.nAmend} = ${fmt(Math.round(LOG_YEAR.before))}.`,
      `אחרי: ${pct(GROUP.closing.share)} × ${fmt(LOG.finalAtAmend)} × ${served} × ${fmt(LOG.headsAtAmend)} ÷ ${1 + LOG.rateAfter}^${LOG_YEAR.nAmend} = ${fmt(Math.round(LOG_YEAR.after))}. ההפרש: ${fmt(Math.round(LOG_YEAR.pastService))} ₪ — לרווח והפסד.`,
    ]),
    calc("log-interest", "חברת לוגיסטיקה: ריבית", `חברת הלוגיסטיקה, 2024: פתיחה ${fmt(Math.round(GROUP_OPENING))} ₪ בשיעור ${pct(LOG.rateBefore)} עד 30.9; ב-31.3 שולמו ${fmt(LOG.paid)} ₪; ההתחייבות אחרי התיקון ב-30.9 — ${fmt(Math.round(LOG_YEAR.after))} ₪, בשיעור ${pct(LOG.rateAfter)} עד סוף השנה. מה הריבית של 2024 (בלי עיגולי ביניים)?`, LOG_YEAR.interest, [
      `על הפתיחה, 9 חודשים: ${fmt(Math.round(LOG_YEAR.interestOpening))}; פחות על התשלום, 6 חודשים: ${fmt(Math.round(LOG_YEAR.interestPaid))}.`,
      `ועוד על היתרה אחרי התיקון, 3 חודשים: ${fmt(Math.round(LOG_YEAR.interestAfter))}. סה״כ ${fmt(Math.round(LOG_YEAR.interest))} ₪.`,
    ]),
    calc("log-pn", "חברת לוגיסטיקה: P.N.", `חברת הלוגיסטיקה, 2024: פתיחה ${fmt(Math.round(GROUP_OPENING))}; ריבית ${fmt(Math.round(LOG_YEAR.interest))}; שירות שוטף ${fmt(Math.round(LOG_YEAR.service))}; שירות עבר ${fmt(Math.round(LOG_YEAR.pastService))}; תשלומים ${fmt(LOG.paid)}; סגירה ${fmt(Math.round(GROUP_CLOSING))}. מה ה-P.N. (הפסד, בסכום חיובי; בלי עיגולי ביניים)?`, LOG_YEAR.pn, [
      `P.N. = סגירה − פתיחה − ריבית − שירות − שירות עבר + תשלומים = ${fmt(Math.round(LOG_YEAR.pn))} ₪ הפסד.`,
    ]),
    calc("cfo-2023-pn", "סמנכ״ל הכספים: 2023", `סמנכ״ל הכספים, 2023: התחיל לעבוד ב-1.1.2022, ובסוף 2023 השלים 2 שנות שירות. פתיחה ${fmt(Math.round(CFO_2022))} ₪; שיעור תחילת השנה ${pct(CFO.rate2022)}; הטבה לשנת שירות ${fmt(Math.round(CFO_PER_YEAR))} ₪; התשלום בעוד ${CFO.years - 2} שנים מסוף 2023; השיעור בסוף 2023 ${pct(CFO_RATES.end2023)}. מה ה-P.N. של 2023 (הפסד, בסכום חיובי)?`, CFO_2023.pn, [
      `ריבית ${fmt(Math.round(CFO_2023.interest))}; שירות ${fmt(Math.round(CFO_2023.service))}; סגירה: 2 × ${fmt(Math.round(CFO_PER_YEAR))} ÷ ${1 + CFO_RATES.end2023}^${CFO.years - 2} = ${fmt(Math.round(CFO_2023.closing))}.`,
      `P.N. = ${fmt(Math.round(CFO_2023.pn))} ₪ הפסד — הריבית ירדה.`,
    ]),
    calc("cfo-2024-past", "סמנכ״ל הכספים: שירות עבר", `סמנכ״ל הכספים, 30.9.2024: המענק עולה מ-${pct(CFO.share)} ל-${pct(CFO_NEW_SHARE)} מהמשכורת האחרונה לכל שנה, גם על העבר. משכורת צפויה בפרישה ${fmt(Math.round(CFO_PER_YEAR / CFO.share))} ₪; ביום התיקון 2.75 שנות שירות ו-${CFO.years - 3 + 0.25} שנים עד התשלום; השיעור ${pct(CFO_RATES.amend)}. מה עלות שירות העבר?`, CFO_2024.pastService, [
      `לפני: ${pct(CFO.share)} × המשכורת × 2.75 ÷ ${1 + CFO_RATES.amend}^${CFO.years - 3 + 0.25} = ${fmt(Math.round(CFO_2024.pastBefore))}.`,
      `אחרי: ${pct(CFO_NEW_SHARE)} × המשכורת × 2.75, באותו היוון = ${fmt(Math.round(CFO_2024.pastAfter))}. שירות עבר ${fmt(Math.round(CFO_2024.pastService))} ₪.`,
    ]),
    calc("oneoff-2023-pn", "המענק החד־פעמי: 2023", `מענק חד־פעמי של ${fmt(ONEOFF.grant)} ₪ לעובד שישלים לפחות ${ONEOFF.minYears} שנות שירות, משויך בקו ישר על ${ONEOFF.minYears} שנים. העובד התחיל ב-1.1.${ONEOFF.from}: ב-1.1.2023 השלים ${oneoffAt(2022).served} שנות שירות, וביום השינוי ${oneoffAt(2022).served + 0.5}. ב-1.7.2023 עלה מ-${fmt(ONEOFF.grant)} ל-${fmt(ONEOFF_AMEND.grant)} ₪, גם על העבר, והשיעור ירד מ-${pct(ONEOFF_AMEND.rateStart)} ל-${pct(ONEOFF_AMEND.rateAmend)} (ונשאר כך עד סוף השנה). פתיחה ${fmt(Math.round(oneoffAt(2022).obligation))}, ${oneoffAt(2022).n - 1} שנים עד התשלום מסוף 2023, צבירה על ${ONEOFF.minYears} שנים. מה ה-P.N. של 2023 (הפסד, בסכום חיובי; בלי עיגולי ביניים)?`, ONEOFF_2023.pn, [
      `שירות שוטף ${fmt(Math.round(ONEOFF_2023.service))}; שירות עבר ${fmt(Math.round(ONEOFF_2023.pastService))}; ריבית ${fmt(Math.round(ONEOFF_2023.interest))}; סגירה ${fmt(Math.round(ONEOFF_2023.closing))}.`,
      `P.N. = סגירה − פתיחה − שירות − שירות עבר − ריבית = ${fmt(Math.round(ONEOFF_2023.pn))} ₪ הפסד. רובו בא מירידת הריבית: הפתיחה והשירות של החצי הראשון נמדדו ב-${pct(ONEOFF_AMEND.rateStart)}, והסגירה ב-${pct(ONEOFF_AMEND.rateAmend)}.`,
    ]),
    journal(
      "settle-entry",
      "רישום סילוק",
      `החברה משלמת למנהל הטכנולוגיה ${fmt(SETTLE.paid)} ₪ תמורת ביטול ההתחייבות, שבספרים ${fmt(Math.round(CTO_YEAR.closing))} ₪. רשמו.`,
      [
        { account: "התחייבות בשל הטבה מוגדרת", dr: Math.round(CTO_YEAR.closing) },
        { account: "מזומן", cr: SETTLE.paid },
        { account: "רווח מסילוק", cr: Math.round(CTO_YEAR.closing) - SETTLE.paid },
      ],
      "סילוק מחוץ לתנאי התוכנית: ההתחייבות נגרעת, וההפרש מול התשלום — לרווח והפסד.",
      ["התחייבות בשל הטבה מוגדרת", "מזומן", "רווח מסילוק", "קרן הון — מדידה מחדש", "הוצאות שכר"],
    ),
    choice("settle-or-pn", "סילוק או P.N.", "עובדת התפטרה מיוזמתה וקיבלה את המענק לפי תנאי התוכנית — פחות מהיתרה בספרים. איך נרשם ההפרש?", ["P.N. ב-OCI", "רווח מסילוק", "שירות עבר", "הקטנת הוצאות שכר"], 0, "זו פרישה לפי התנאים, לא סילוק."),
  ],
  traps,
  tips: [
    "עלות שירות עבר (סעיפים 102–107): השינוי בהתחייבות מתיקון התוכנית או מצמצום שלה (למשל סגירת מפעל) — לרווח והפסד, בהוצאות השכר. שינוי שאינו בשליטת החברה, כמו עזיבות בלתי צפויות — מדידה מחדש ב-OCI. כמה שינויים בו־זמניים — שינוי אחד נטו.",
    "סילוק (סעיפים 109–111): עסקה מחוץ לתנאים שמבטלת את המחויבות, למשל תשלום חד־פעמי למבטח שלוקח את כל החוב. רווח או הפסד = ההתחייבות ביום הסילוק פחות המחיר, ברווח והפסד, ביום שהסילוק קורה.",
    "שינוי תנאים מפצל את השנה ויוצר שירות עבר; תשלום מחוץ לתנאים הוא סילוק; תשלום לפי התנאים הוא P.N.",
    "(א) לכל תקופה: ריבית של תחילתה, n מסופה, וצבירה של החודשים שלה. (ב) שירות עבר = אחרי פחות לפני, באותו שיעור ובאותו n של יום השינוי. (ג) ריבית: עד השינוי על הפתיחה, אחריו על היתרה שאחרי שירות העבר. (ד) סילוק: יתרה פחות תשלום לרווח והפסד; תשלום לפי התנאים: P.N. ב-OCI.",
    "שירות עבר (סעיפים 102–103) — לרווח והפסד, מיד. סילוק (סעיפים 109–111) — רק עסקה מחוץ לתנאי התוכנית.",
    "ריבית לחלק משנה (סעיף 123): יתרה × ((1+i)^(m/12) − 1); תשלום באמצע השנה מפחית ריבית מיומו.",
  ],
};
