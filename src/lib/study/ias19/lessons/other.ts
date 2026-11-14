import { amendedYear, balancingPN, grown, plainYear, pv, terminationBenefit } from "@/lib/learn/ias19";
import type { StudyModule, Trap } from "../../types";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal, lessonRef, pct } from "../shared";
import { CLOSING, CLOSING_EXTRA } from "./map";
import { RND, RND_2025 } from "./rollforward";

/** The worked example: a long-service award after twelve years, raised on 1.6 of its third year (for past years too) as the rate rises. `month` is the months before the raise. */
export const AWARD = { from: 2021, years: 12, oldTotal: 168_000, newTotal: 204_000, rateStart: 0.055, rateAmend: 0.065, month: 5 };
const servedAtStart = 2023 - AWARD.from;
const nEnd = AWARD.from + AWARD.years - 1 - 2023;
export const AWARD_OPENING = pv((AWARD.oldTotal / AWARD.years) * servedAtStart, AWARD.rateStart, nEnd + 1);
export const AWARD_YEAR = amendedYear({
  opening: AWARD_OPENING,
  iStart: AWARD.rateStart,
  iAmend: AWARD.rateAmend,
  iEnd: AWARD.rateAmend,
  months: AWARD.month,
  oldPerYear: AWARD.oldTotal / AWARD.years,
  newPerYear: AWARD.newTotal / AWARD.years,
  servedAtStart,
  nEnd,
});
/** One service cost, past included — and everything to profit or loss. */
export const AWARD_SERVICE = AWARD_YEAR.service + AWARD_YEAR.pastService;
export const AWARD_PL = AWARD_SERVICE + AWARD_YEAR.interest + AWARD_YEAR.pn;
/** Were it post-employment: the P.N. to OCI, and only service and interest in profit or loss. */
export const AWARD_IF_POST = AWARD_SERVICE + AWARD_YEAR.interest;
export const AWARD_META = { servedAtStart, nEnd };

/** "We solve": the service centre of lesson 1, now with the amounts — and if it were paid in two years. */
export const TERM = terminationBenefit({ perHead: CLOSING.leaveEarly, heads: CLOSING.staff });
export const TERM_LATE = { years: 2, rate: 0.06 };
export const TERM_DISCOUNTED = terminationBenefit({ perHead: CLOSING.leaveEarly, heads: CLOSING.staff, yearsToPay: TERM_LATE.years, i: TERM_LATE.rate });

/** The exercise: three plans of other long-term benefits, at 8%. Research (lesson 7), purchasing, and the managers' multi-year bonus. */
export const BUY = { staff: 80, stayBefore: 0.85, stayAfter: 0.8, years: 4, salary: 96_000, raise: 0.02, rate: RND.rate, from: 2024 };
export const BUY_PAYMENT = grown(BUY.salary, BUY.raise, BUY.years - 1) / 12;
const buyPer = (stay: number) => (BUY_PAYMENT * BUY.staff * stay) / BUY.years;
export const BUY_OPENING = pv(buyPer(BUY.stayBefore), BUY.rate, BUY.years - 1);
export const BUY_2025 = (() => {
  const interest = BUY_OPENING * BUY.rate;
  const service = pv(buyPer(BUY.stayBefore), BUY.rate, BUY.years - 2);
  const closing = pv(buyPer(BUY.stayAfter) * 2, BUY.rate, BUY.years - 2);
  return { interest, service, closing, pn: balancingPN({ opening: BUY_OPENING, interest, service, pastService: 0, payments: 0, settled: 0, closing }) };
})();
export const MGR = { managers: 4, share: 0.04, threshold: 40_000_000, profit: { 2024: 12_000_000, 2025: 16_000_000 }, rate: RND.rate, payYear: 2027 };
export const MGR_OPENING = pv(MGR.managers * MGR.share * MGR.profit[2024], MGR.rate, 2);
export const MGR_2025 = plainYear({ opening: MGR_OPENING, i: MGR.rate, perYear: MGR.managers * MGR.share * MGR.profit[2025], servedAtStart: 0, nEnd: 1, closing: pv(MGR.managers * MGR.share * (MGR.profit[2024] + MGR.profit[2025]), MGR.rate, 1) });

const KINDS = ["הטבה אחרת לזמן ארוך", "הטבה לאחר סיום העסקה", "הטבה לזמן קצר", "הטבה בגין פיטורין"];

const traps: Trap[] = [
  {
    id: "olt-oci",
    prompt: "מענק יובל: השנה P.N. של רווח 3,000 ₪. איפה הוא נרשם?",
    options: ["ברווח והפסד", "ב-OCI", "בקרן הון", "לא נרשם"],
    answer: 0,
    why: "בהטבה אחרת לזמן ארוך הכול — גם המדידה מחדש — ברווח והפסד (סעיף 156).",
    traps: ["", "המלכודת: להעתיק את הטיפול של הטבה מוגדרת. כאן אין OCI.", "אין קרן הון בהטבה אחרת לזמן ארוך.", "ההתחייבות השתנתה — חייבים לרשום."],
  },
  {
    id: "term-attribute",
    prompt: "החלטה סופית, שהודעה לעובדים כתוכנית מפורטת, לפטר 35 עובדים, 16,000 ₪ לכל אחד, תוך חצי שנה. איך מכירים?",
    options: ["560,000 מיד, בלי שיוך לשנים ובלי היוון", "פורסים על שנות השירות של כל עובד", "מהוונים לחצי שנה", "רק כשמשלמים"],
    answer: 0,
    why: "פיטורין: אין שיוך לשנות שירות (סעיף 170), וכשנפרע תוך 12 חודשים — אין היוון.",
    traps: ["", "המלכודת: לייחס לשנות שירות. ההטבה נובעת מההחלטה, לא מהעבודה.", "בתוך 12 חודשים לא מהוונים.", "ההכרה במועד ההחלטה הסופית, לא בתשלום."],
  },
  {
    id: "term-extra",
    prompt: "מי שנשאר עד סגירת הסניף מקבל 18,000 ₪, ומי שעוזב מוקדם 7,000 ₪. מה כלול בהטבת הפיטורין?",
    options: ["7,000 לכל עובד", "18,000 לכל מי שצפוי להישאר", "11,000 לכל עובד", "אין הטבת פיטורין"],
    answer: 0,
    why: "התוספת של 11,000 מותנית בהמשך עבודה — שכר על שירות (סעיף 162).",
    traps: ["", "המלכודת: לכלול את התוספת. היא תמורה לשירות שעוד יינתן.", "זו בדיוק התוספת — שאינה פיטורין.", "ההחלטה לסגור יצרה הטבת פיטורין."],
  },
  {
    id: "retire-not-olt",
    prompt: "מענק בפרישה, לפי שנות השירות — איזה סוג?",
    options: ["הטבה לאחר סיום העסקה", "הטבה אחרת לזמן ארוך", "פיטורין", "לזמן קצר"],
    answer: 0,
    why: "משולם אחרי שההעסקה נגמרת — הטבה לאחר סיום העסקה (הטבה מוגדרת).",
    traps: ["", "המלכודת: ״ארוך ורחוק — אז אחרת לזמן ארוך״. אחרת לזמן ארוך משולמת בזמן העבודה.", "הוא נצבר עם השירות, ולא נובע מהחלטה לפטר.", "הוא רחוק שנים."],
  },
  {
    id: "wording",
    prompt: "״מהשנה השישית — משכורת נוספת בכל שנה״, מול ״אחרי 5 שנים — מענק אחד בגובה משכורת״. מה הסוג של כל אחד?",
    options: ["הראשון לזמן קצר, השני אחרת לזמן ארוך", "שניהם אחרת לזמן ארוך", "שניהם לזמן קצר", "הראשון אחרת לזמן ארוך, השני לזמן קצר"],
    answer: 0,
    why: "משכורת נוספת בכל שנה משולמת על השירות של אותה שנה — קצר. מענק אחד על חמש שנים — רחוק מרוב שנות השירות.",
    traps: ["", "המלכודת: לא לקרוא את הניסוח עד הסוף. כל מילה משנה את מועד התשלום.", "המענק החד־פעמי רחוק מרוב שנות השירות.", "בדיוק הפוך."],
  },
  {
    id: "split-service",
    prompt: "בהטבה אחרת לזמן ארוך היו השנה שירות שוטף 8,000 ושירות עבר 3,000. איך מציגים?",
    options: ["עלות שירות אחת: 11,000", "שירות שוטף 8,000 ושירות עבר 3,000, בנפרד", "8,000 ברווח והפסד ו-3,000 ב-OCI", "רק 8,000"],
    answer: 0,
    why: "בהטבה אחרת לזמן ארוך — עלות שירות אחת, ביחד עם הריבית והמדידה מחדש (סעיף 156).",
    traps: ["", "המלכודת: להפריד כמו בהטבה מוגדרת. כאן התקן מבקש סכום אחד.", "אין OCI כאן בכלל.", "שירות העבר הוא חלק מעלות השירות."],
  },
  {
    id: "severance-law",
    prompt: "פיצויי פיטורין לפי חוק, לפי שנות הוותק, שמשולמים גם בפרישה לגמלאות. איזה סוג?",
    options: ["הטבה לאחר סיום העסקה", "הטבת פיטורין", "הטבה לזמן קצר", "הטבה אחרת לזמן ארוך"],
    answer: 0,
    why: "הזכאות נצברת עם השירות, ולא נולדת מהחלטה לפטר (סעיף 160).",
    traps: ["", "המלכודת: המילה ״פיטורין״ בשם. הסיווג לפי מה שיוצר את המחויבות, לא לפי השם.", "התשלום רחוק, בסוף ההעסקה.", "הוא משולם אחרי סיום ההעסקה."],
  },
  {
    id: "resign-gap",
    prompt: "לפי ההסכם, עובד מפוטר מקבל 54,000 ₪, ועובד שמתפטר 36,000 ₪. החברה החליטה לפטר. כמה מזה הטבת פיטורין?",
    options: ["18,000 — רק ההפרש", "54,000", "36,000", "0"],
    answer: 0,
    why: "36,000 נצברים בכל מקרה, כהטבה לאחר סיום העסקה. רק התוספת בגלל הפיטורין היא הטבת פיטורין (סעיף 160).",
    traps: ["", "המלכודת: לסווג את כל הסכום. החלק שמגיע גם בהתפטרות נצבר עם השירות.", "זה החלק שאינו פיטורין.", "ההחלטה לפטר יצרה תוספת."],
  },
  {
    id: "offer-expected",
    prompt: "החברה הציעה פרישה מרצון ורשאית לבטל את ההצעה עד שעובד מקבל אותה. עד סוף השנה קיבלו 12 עובדים, וצפויים עוד 20. לכמה מכירים?",
    options: ["ל-12 שקיבלו", "ל-32 הצפויים", "לאף אחד, עד סוף תקופת ההצעה", "ל-20 שעוד לא קיבלו"],
    answer: 0,
    why: "סעיף 166: כשהעובד מקבל את ההצעה, או קודם אם נוצרה מגבלה אפקטיבית על ביטולה.",
    traps: ["", "המלכודת: למדוד לפי הצפי. כל עוד אפשר לבטל, אין מחויבות.", "מי שקיבל כבר יצר מחויבות.", "הפוך."],
  },
  {
    id: "disability",
    prompt: "קצבת אובדן כושר עבודה לטווח ארוך, באותו סכום לכל עובד, בלי קשר לוותק. מתי מכירים בעלות?",
    options: ["כשקורה האירוע שגורם לאובדן הכושר", "לאורך שנות השירות", "בתחילת ההעסקה, לכל העובדים", "רק כשמשלמים"],
    answer: 0,
    why: "סעיף 157: כשההטבה לא תלויה בשירות, אין מה לצבור. מכירים במלוא העלות החזויה ביום האירוע.",
    traps: ["", "המלכודת: לצבור אוטומטית. צוברים רק כשהסכום גדל עם הוותק.", "אין מחויבות לפני האירוע.", "ביום האירוע כבר יש מחויבות, גם אם משלמים אחר כך."],
  },
];

/** Lesson 11: other long-term benefits (the same measurement, all of it in profit or loss) and termination benefits (when they are recognised, and at how much). */
export const OTHER: StudyModule = {
  slug: "ias19-other",
  course: COURSE,
  n: 11,
  title: "הטבות אחרות לזמן ארוך והטבות בגין פיטורין",
  description: "שני הענפים האחרונים במפה. הטבה אחרת לזמן ארוך: אותה מדידה כמו הטבה מוגדרת, והכול לרווח והפסד. הטבת פיטורין: מתי מכירים, בכמה, ולמה בלי שיוך לשנים.",
  goal: "למדוד הטבה אחרת לזמן ארוך, ולהכריע מתי נרשמת הטבת פיטורין ובאיזה סכום.",
  outcomes: [
    "למדוד הטבה אחרת לזמן ארוך באותה שיטה כמו הטבה מוגדרת",
    "להציג עלות שירות אחת, ריבית ו-P.N. — כולם ברווח והפסד",
    "לקבוע את מועד ההכרה בהטבת פיטורין ואת סכומה",
    "להבחין בין הטבת פיטורין, תוספת על שירות והטבה לאחר סיום העסקה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-other-hook", title: "מענק יובל, וסניף שנסגר" },
    { id: "emp-other-olt", title: "הטבה אחרת לזמן ארוך" },
    { id: "emp-other-kinds", title: "מה נכנס לקבוצה, ומה מציגים בביאור" },
    { id: "emp-other-disability", title: "אובדן כושר עבודה: לצבור, או לחכות לאירוע?" },
    { id: "emp-other-template", title: "תבנית פתרון: תנועה בהטבה אחרת לזמן ארוך" },
    { id: "emp-other-solved", title: "דוגמה פתורה: מענק יובל שעלה" },
    { id: "emp-other-drill", title: "תרגול: מענק יובל, במספרים חדשים" },
    { id: "emp-other-term", title: "הטבת פיטורין: נולדת מההחלטה" },
    { id: "emp-term-test", title: "פיטורין או לא? שלוש שאלות" },
    { id: "emp-term-when", title: "מתי מכירים: המוקדם מבין שני מועדים" },
    { id: "emp-other-rule", title: "כמה: שלושה מסלולי מדידה" },
    { id: "emp-term-template", title: "תבנית פתרון: הטבת פיטורין" },
    { id: "emp-other-together", title: "פותרים יחד: הסניף שנסגר, בסכומים" },
    { id: "emp-term-drill", title: "תרגול: פיטורין, במספרים חדשים" },
    { id: "emp-other-master", title: "בדיקת שליטה, וגשר לשיעור הבא" },
  ],
  exercises: [
    choice("cls-rnd", "סיווג", `מחלקת מחקר (${lessonRef("ias19-rollforward")}): תשלום שבתון בתחילת השנה השישית, לעובדים שממשיכים לעבוד. איזה סוג?`, KINDS, 0, "משולם בזמן העבודה, אבל רחוק משנות הצבירה — אחרת לזמן ארוך."),
    calc("rnd-pl", "מחקר: לרווח והפסד", `מחלקת מחקר, ${RND.from + 1}: עלות שירות ${fmt(Math.round(RND_2025.service))}, ריבית ${fmt(Math.round(RND_2025.interest))}, P.N. אפס. כמה נרשם ברווח והפסד?`, RND_2025.service + RND_2025.interest + RND_2025.pn, [`הכול ברווח והפסד: ${fmt(Math.round(RND_2025.service + RND_2025.interest))} ₪.`]),
    calc("buy-opening", "רכש: פתיחה", `מחלקת רכש: ${BUY.staff} עובדים; מי שמשלים ${BUY.years} שנות עבודה (מ-1.1.${BUY.from}) מקבל ב-1.1.${BUY.from + BUY.years} מענק בגובה משכורת חודשית — ${fmt(BUY_PAYMENT)} ₪. ${pct(BUY.stayBefore)} צפויים להישאר; שיעור ${pct(BUY.rate)}. מה ההתחייבות ב-31.12.${BUY.from}?`, BUY_OPENING, [
      `צבירה לשנה: ${fmt(BUY_PAYMENT)} × ${BUY.staff} × ${pct(BUY.stayBefore)} ÷ ${BUY.years}.`,
      `שנה אחת, n = ${BUY.years - 1}: ${fmt(Math.round(BUY_OPENING))} ₪.`,
    ]),
    calc("buy-pn", "רכש: P.N.", `מחלקת רכש, ${BUY.from + 1}: פתיחה ${fmt(Math.round(BUY_OPENING))}, ריבית ${fmt(Math.round(BUY_2025.interest))}, שירות ${fmt(Math.round(BUY_2025.service))}. בסוף השנה ירד שיעור הנשארים הצפוי ל-${pct(BUY.stayAfter)}, והסגירה ${fmt(Math.round(BUY_2025.closing))}. מה ה-P.N.? (רווח — בסכום חיובי)`, -BUY_2025.pn, [
      `${fmt(Math.round(BUY_2025.closing))} − ${fmt(Math.round(BUY_OPENING))} − ${fmt(Math.round(BUY_2025.interest))} − ${fmt(Math.round(BUY_2025.service))} = ${fmt(Math.round(BUY_2025.pn))} — רווח, ברווח והפסד.`,
    ]),
    calc("mgr-opening", "בונוס רב־שנתי: פתיחה", `${MGR.managers} מנהלים יקבלו כל אחד ${pct(MGR.share)} מהרווח התפעולי המצטבר של 2024–2026, בתנאי שיעלה על ${fmt(MGR.threshold)} ₪; התשלום ב-1.1.${MGR.payYear}. החברה צופה שהסף ייעבר, ולא צפויים שינויים בהנהלה; בכל שנה נצבר הבונוס על הרווח של אותה שנה. הרווח ב-2024: ${fmt(MGR.profit[2024])} ₪. שיעור ${pct(MGR.rate)}. מה ההתחייבות ב-31.12.2024?`, MGR_OPENING, [
      `${MGR.managers} × ${pct(MGR.share)} × ${fmt(MGR.profit[2024])} ÷ ${1 + MGR.rate}² = ${fmt(Math.round(MGR_OPENING))} ₪ — הצפי שהתנאי יתקיים.`,
    ]),
    calc("mgr-closing", "בונוס רב־שנתי: סגירה", `${MGR.managers} מנהלים, ${pct(MGR.share)} כל אחד מהרווח התפעולי המצטבר של 2024–2026, בתנאי שיעלה על ${fmt(MGR.threshold)} ₪; התשלום ב-1.1.${MGR.payYear}. החברה צופה שהסף ייעבר, ולא צפויים שינויים בהנהלה; בכל שנה נצבר הבונוס על הרווח של אותה שנה. רווח 2024: ${fmt(MGR.profit[2024])}; רווח 2025: ${fmt(MGR.profit[2025])}. שיעור ${pct(MGR.rate)}. מה ההתחייבות ב-31.12.2025?`, MGR_2025.closing, [
      `${MGR.managers} × ${pct(MGR.share)} × ${fmt(MGR.profit[2024] + MGR.profit[2025])} ÷ ${1 + MGR.rate} = ${fmt(Math.round(MGR_2025.closing))} ₪.`,
    ]),
    calc("term-amount", "פיטורין: הסכום", `ב-31.12 החליטה חברה, סופית, לסגור סניף בעוד שנה, ובאותו יום הודיעה לעובדים על תוכנית מפורטת. מי שעוזב לפני הסגירה מקבל ${fmt(CLOSING.leaveEarly)} ₪, ומי שנשאר עד הסגירה ${fmt(CLOSING.stayToEnd)} ₪. ${CLOSING.staff} עובדים; צפוי ש-45 יעזבו מוקדם. מה הטבת הפיטורין שמכירים עכשיו?`, TERM, [
      `${fmt(CLOSING.leaveEarly)} לכל עובד, בלי קשר לצפי העזיבה: ${fmt(CLOSING.leaveEarly)} × ${CLOSING.staff} = ${fmt(TERM)} ₪, בלי היוון.`,
      `התוספת של ${fmt(CLOSING_EXTRA)} — שכר על שירות בשנה הבאה.`,
    ]),
    journal(
      "term-entry",
      "פיטורין: הפקודה",
      `ההחלטה הסופית לסגור את הסניף, שהודעה לעובדים באותו יום כתוכנית מפורטת: הטבת פיטורין של ${fmt(TERM)} ₪, שתשולם תוך שנה. רשמו.`,
      [
        { account: "הוצאות שכר", dr: TERM },
        { account: "התחייבות בגין פיטורין", cr: TERM },
      ],
      "ההכרה מלאה כבר במועד ההחלטה הסופית, בלי שיוך לשנים ובלי היוון.",
      ["הוצאות שכר", "התחייבות בגין פיטורין", "מזומן", "קרן הון — מדידה מחדש"],
    ),
    calc("term-gap", "פיטורין: רק ההפרש", "לפי הסכם העבודה, עובד שמפוטר מקבל 48,000 ₪, ועובד שמתפטר 31,000 ₪. ב-31.12 החליטה החברה סופית לפטר את העובד והודיעה לו על כך, והתשלום בעוד חודש. מה הטבת הפיטורין?", 17_000, [
      "31,000 מגיעים גם בהתפטרות: נצברים עם השירות, הטבה לאחר סיום העסקה (סעיף 160).",
      "הטבת הפיטורין היא רק התוספת: 48,000 − 31,000 = 17,000 ₪, בלי היוון.",
    ]),
    calc("term-offer", "פרישה מרצון: למי מכירים", "ב-1.10 הציעה חברה 26,000 ₪ לכל עובד שיפרוש מרצון ויעזוב בתוך חודשיים, והיא רשאית לבטל את ההצעה עד שעובד מקבל אותה. עד 31.12 קיבלו 14 עובדים; צפויים להצטרף עוד 9. ההצעה אינה חלק מארגון מחדש. מה ההתחייבות ב-31.12?", 364_000, [
      "סעיף 166: מכירים כשהעובד מקבל את ההצעה.",
      "14 × 26,000 = 364,000 ₪. התשעה הנוספים — כשיקבלו.",
    ]),
    choice("cls-disability", "אובדן כושר עבודה", "קצבת אובדן כושר עבודה שגדלה עם הוותק: 2% מהשכר לכל שנת עבודה. איך מכירים?", ["צוברים לאורך השירות, ומודדים לפי ההסתברות לתשלום ומשך התשלום הצפוי", "רק ביום האירוע", "רק כשמשלמים", "ב-OCI"], 0, "סעיף 157: הסכום תלוי בשירות — המחויבות נוצרת כשהשירות ניתן."),
    choice("cls-retire", "סיווג", "מענק בפרישה בגיל 65, לפי שנות השירות. איזה סוג?", KINDS, 1, "משולם אחרי סיום ההעסקה — הטבה מוגדרת, לא אחרת לזמן ארוך."),
  ],
  traps,
  tips: [
    "אחרות לזמן ארוך: אותו מעגל, הכול לרווח והפסד. פיטורין: הכרה מלאה במועד המוקדם.",
    "אחרות לזמן ארוך: אותו מעגל כמו בהטבה מוגדרת, אבל עלות שירות (שוטף ועבר יחד), ריבית ו-P.N. — כולן ברווח והפסד. פיטורין: התחייבות מלאה במוקדם מבין שני המועדים; בלי שיוך לשנים; בלי היוון אם נפרעת תוך 12 חודשים מסוף השנה, ועם היוון אם לא (סעיף 169).",
    "מועד ההכרה בפיטורין (סעיף 165) הוא המוקדם משניים. הרגע שבו אי אפשר עוד לבטל את ההצעה. או הרגע שבו מכירים בהפרשה לארגון מחדש (IAS 37).",
    "תוספת המותנית בשירות עתידי אינה פיטורין (סעיף 162); הטבה שמשולמת בין אם העובד עוזב ובין אם לא — לאחר סיום העסקה (סעיף 164).",
  ],
};
