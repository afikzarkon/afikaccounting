import { EXAM_A, EXAM_B, examA, examB } from "@/lib/learn/ias19-exams";
import type { StudyModule, Trap } from "../../types";
import { calc, COURSE, COURSE_HREF, fmt, pct } from "../shared";

const A = examA();
const B = examB();
const R = examB(0.005);
const k = (v: number) => Math.round(v * 10) / 10;

export { A as EXAM_A_SOLVED, B as EXAM_B_SOLVED, R as EXAM_B_ROUNDED };

const asm = A.assembly;
const fld = A.field;
const y1 = EXAM_A.firstYear;
const y2 = y1 + 1;

const traps: Trap[] = [
  {
    id: "cap-window",
    prompt: `בשאלה 1, קבוצת ${asm.groups[0].id} צפויה לעבוד 15 שנים, והתקרה ${fmt(EXAM_A.assembly.cap)} ₪ מושגת אחרי ${asm.groups[0].grants[0].window}. על כמה שנים נפרסת הצבירה?`,
    options: [`${asm.groups[0].grants[0].window}`, "15", "5", "20"],
    answer: 0,
    why: "התקרה מקצרת את חלון הצבירה; אחרי שהגיעו אליה, שנים נוספות לא מוסיפות דבר.",
    traps: ["", "המלכודת: לפרוס על כל שנות העבודה — כך הסכום לשנה קטן מדי.", "חמש השנים הראשונות הן רק המדרגה הראשונה.", "אין 20 שנה בשאלה."],
  },
  {
    id: "window-not-n",
    prompt: `בשאלה 1, הקבוצה הוותיקה במחלקת השטח צוברת על ${fld.groups[0].grants[0].window} שנים. מה n בפתיחה של ${y1} (1.1.${y1})?`,
    options: [`${fld.groups[0].nEnd + 1}`, `${fld.groups[0].grants[0].window}`, `${fld.groups[0].grants[0].window - fld.groups[0].served}`, "10"],
    answer: 0,
    why: "מחלקים בחלון הצבירה, אבל מהוונים לפי השנים עד התשלום — ביום סיום ההעסקה.",
    traps: ["", "המלכודת: להוון על חלון הצבירה.", "אלה השנים שנותרו בחלון — לא עד התשלום.", "זה כל הוותק הצפוי, לא המרחק מהיום."],
  },
  {
    id: "sub-period",
    prompt: "תיקון ב-1.7: על איזו יתרה מחשבים את הריבית לחצי השנה השני, ומאיזה תאריך מהוונים את השירות של החצי הראשון?",
    options: ["על היתרה אחרי התיקון; מ-30.6", "על הפתיחה; מ-31.12", "על הפתיחה; מ-30.6", "על היתרה אחרי התיקון; מ-31.12"],
    answer: 0,
    why: "בכל תת־תקופה מהוונים מסוף התת־תקופה, והריבית אחרי התיקון — על היתרה המעודכנת.",
    traps: ["", "המלכודת הכפולה: ריבית על הפתיחה והיוון מסוף השנה.", "הריבית אחרי התיקון — על היתרה המעודכנת.", "השירות של החצי הראשון ״נגמר״ ב-30.6."],
  },
  {
    id: "year-end-amendment",
    prompt: "בשאלה 2, התיקון לדרג ב׳ נעשה ב-31.12. על כמה שנות שירות מחשבים את שירות העבר?",
    options: [`על כל ${B.servedEnd} שנות השירות`, "על שנה אחת", "על אפס — אין תקופה אחרי התיקון", "על השנים שנותרו עד הפרישה"],
    answer: 0,
    why: "תיקון בסוף השנה לא מפצל את השנה — אבל הוא חל על כל השירות שכבר ניתן.",
    traps: ["", "המלכודת: לחשוב שתיקון בסוף שנה נוגע רק לשנה האחרונה.", "אין פיצול — אבל יש שירות עבר.", "השנים העתידיות עוד לא עבדו."],
  },
  {
    id: "surprise-retirement",
    prompt: `בשאלה 2, ${EXAM_B.leavers.heads} עובדי דרג ג׳ פרשו במפתיע בסוף השנה, לפי התנאים. סילוק או P.N.?`,
    options: ["P.N. — אין עסקה שמבטלת את ההתחייבות", "סילוק — הם עזבו", "שירות עבר", "פיטורין"],
    answer: 0,
    why: "פרישה לפי התנאים, גם מוקדמת, היא שינוי הנחות — P.N.",
    traps: ["", "המלכודת: עזיבה = סילוק. סילוק הוא רק עסקה מחוץ לתנאים.", "שירות עבר נובע משינוי תנאים.", "החברה לא החליטה לסיים את העסקתם."],
  },
  {
    id: "paid-split",
    prompt: `בשאלה 2, ההטבות לפורשים — ${fmt(k(B.obligation.payments))} אלפי ₪ — שולמו ${pct(B.fromAssets)} מהקרן. כמה יורד מההתחייבות, וכמה מהנכסים?`,
    options: [`${fmt(k(B.obligation.payments))} מההתחייבות, ${fmt(k(B.assets.paid))} מהנכסים`, `${fmt(k(B.assets.paid))} משניהם`, `${fmt(k(B.obligation.payments))} משניהם`, `${fmt(k(B.assets.paid))} מההתחייבות, ${fmt(k(B.obligation.payments))} מהנכסים`],
    answer: 0,
    why: "מההתחייבות יורד כל ההטבה; מהנכסים — רק מה שיצא מהם.",
    traps: ["", "המלכודת: להוריד מההתחייבות רק את חלק הקרן.", "הנכסים שילמו רק חלק.", "בדיוק הפוך."],
  },
  {
    id: "half-year-contribution",
    prompt: "בשאלה 2, ההפקדה לקרן נעשתה ב-30.6. כמה זמן היא מרוויחה ריבית בשנה?",
    options: ["חצי שנה — (1+i)^0.5 − 1", "שנה שלמה", "אפס", "רבעון"],
    answer: 0,
    why: "הפקדה מרוויחה ריבית רק מיום ההפקדה.",
    traps: ["", "המלכודת: שנה שלמה — הכסף לא היה בקרן לפני 30.6.", "הכסף היה בקרן חצי שנה.", "מ-30.6 עד 31.12 — חצי שנה."],
  },
  {
    id: "contribution-heads",
    prompt: "בשאלה 2, ההפקדה השנה מחושבת על השכר של מי?",
    options: ["של כל העובדים שעבדו ב-30.6 — לפני הפרישה של דצמבר", "רק של מי שנשאר בסוף השנה", "רק של הפורשים", "של העובדים בשנה שעברה"],
    answer: 0,
    why: "ביום ההפקדה כולם עוד עבדו — הפורשים פרשו רק בסוף השנה.",
    traps: ["", "המלכודת: להוריד את הפורשים מוקדם מדי.", "הם עוד עבדו ב-30.6.", "ההפקדה של השנה — לפי השכר של השנה."],
  },
];

/** Lesson 12: integration — two exam-level questions, each asked, then solved in steps, and their answers checked one by one; then the cheat sheet. */
export const EXAMS: StudyModule = {
  slug: "ias19-exams",
  course: COURSE,
  n: 12,
  title: "אינטגרציה: שתי שאלות ברמת מבחן",
  description: "שיעור כפול, בלי חומר חדש: חמש שאלות סריקה וסדר עבודה קבוע, שאלה של שתי מחלקות ושני מענקים על שנתיים — אחת פתורה ואחת ביחד — ושאלה במתכונת מבחן של 60 דקות, עם מעגל התחייבות, מעגל נכסים ונתונים שמשחזרים מביאור. ובסוף — דף סיכום למבחן.",
  goal: "לקבל סיפור ארוך שלא ראית ולפרק אותו לבד, בלי שמישהו יגיד באיזה שיעור אנחנו.",
  outcomes: [
    "לסרוק שאלה בחמש שאלות לפני שמחשבים",
    "לבנות טבלת קבוצות: כמות, שנות שירות, הטבה אחרי תקרה, צבירה לשנה ו-n",
    "לפתור שנה עם תיקון באמצע ושנה עם ירידת ריבית",
    "לשחזר נתונים מוסתרים מביאור, ולבנות מעגל התחייבות ומעגל נכסים",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "emp-exam-hook", title: "יום המבחן" },
    { id: "emp-exam-scan", title: "חמש שאלות סריקה" },
    { id: "emp-exam-order", title: "הכלל: סדר עבודה קבוע" },
    { id: "emp-exam-a", title: "שאלה 1: שתי מחלקות, שני מענקים" },
    { id: "emp-exam-a-solve", title: "שאלה 1, מחלקת ההרכבה: אני פותר" },
    { id: "emp-exam-a-field", title: "שאלה 1, מחלקת השטח: פותרים יחד" },
    { id: "emp-exam-b", title: "שאלה 2: רשת מלונות — במתכונת מבחן" },
    { id: "emp-exam-b-solve", title: "שאלה 2: הפתרון" },
    { id: "emp-exam-master", title: "בדיקת שליטה, וסיכום" },
    { id: "emp-cheatsheet", title: "דף סיכום למבחן" },
  ],
  exercises: [
    calc("a-asm-open", "שאלה 1: הרכבה, פתיחה", `שאלה 1, מחלקת ההרכבה: מה יתרת ההתחייבות ב-1.1.${y1}?`, asm.year1.opening, [
      ...asm.groups.map((g, i) => `קבוצת ${g.id}: ${g.heads} × ${fmt(k(g.grants[0].perYear))} × ${Math.min(g.served, g.grants[0].window)} ÷ ${1 + EXAM_A.assembly.rate}^${g.nEnd + 1} = ${fmt(Math.round(asm.year1.rows[i].opening))}.`),
      `סה״כ ${fmt(Math.round(asm.year1.opening))} ₪.`,
    ]),
    calc("a-asm-close1", `שאלה 1: הרכבה, סגירת ${y1}`, `שאלה 1, מחלקת ההרכבה: מה יתרת ההתחייבות ב-31.12.${y1}?`, asm.year1.closing, [`כל קבוצה צוברת עוד שנה, ו-n קטן באחת: ${fmt(Math.round(asm.year1.closing))} ₪.`]),
    calc("a-asm-service1", `שאלה 1: הרכבה, שירות ${y1}`, `שאלה 1, מחלקת ההרכבה: מה עלות השירות של ${y1}? (אין מידע על שינויים בשנה — היא השורה המאזנת.)`, asm.year1.service, [
      `ריבית: ${fmt(Math.round(asm.year1.opening))} × ${pct(EXAM_A.assembly.rate)} = ${fmt(Math.round(asm.year1.interest))}.`,
      `שירות = סגירה − פתיחה − ריבית = ${fmt(Math.round(asm.year1.service))} ₪.`,
    ]),
    calc("a-asm-service2", `שאלה 1: הרכבה, שירות ${y2}`, `שאלה 1, מחלקת ההרכבה: מה עלות השירות השוטף של ${y2} (שתי התקופות)?`, asm.year2.service, [
      `עד 30.6 — תנאים ישנים, מהוון מ-30.6: ${fmt(Math.round(asm.year2.serviceBefore))}.`,
      `מ-1.7 — עם המענק הנוסף, מהוון מסוף השנה: ${fmt(Math.round(asm.year2.serviceAfter))}. סה״כ ${fmt(Math.round(asm.year2.service))} ₪.`,
    ]),
    calc("a-asm-past", `שאלה 1: הרכבה, שירות עבר`, `שאלה 1, מחלקת ההרכבה: מה עלות שירות העבר ב-1.7.${y2}?`, asm.year2.pastService, [
      `אחרי: ${fmt(Math.round(asm.year2.after))}; לפני: ${fmt(Math.round(asm.year2.before))} — שתיהן ב-1.7, ב-${pct(EXAM_A.assembly.rate)}.`,
      `שירות עבר ${fmt(Math.round(asm.year2.pastService))} ₪ — רק לקבוצות ${asm.addedTo.join(" ו-")}.`,
    ]),
    calc("a-asm-interest2", `שאלה 1: הרכבה, ריבית ${y2}`, `שאלה 1, מחלקת ההרכבה: מה עלות הריבית של ${y2}?`, asm.year2.interest, [
      `על הפתיחה לחצי שנה ${fmt(Math.round(asm.year2.interestBefore))}, ועל היתרה אחרי התיקון לחצי שנה ${fmt(Math.round(asm.year2.interestAfter))}.`,
    ]),
    calc("a-asm-close2", `שאלה 1: הרכבה, סגירת ${y2}`, `שאלה 1, מחלקת ההרכבה: מה יתרת ההתחייבות ב-31.12.${y2}, בשיעור של סוף השנה?`, asm.year2.closing, [`כל הקבוצות, עם המענק הנוסף לזכאים, ב-${pct(EXAM_A.assembly.endRate)}: ${fmt(Math.round(asm.year2.closing))} ₪.`]),
    calc("a-asm-pn2", `שאלה 1: הרכבה, P.N. ${y2}`, `שאלה 1, מחלקת ההרכבה: מה ה-P.N. של ${y2}? (הפסד — בסכום חיובי)`, asm.year2.pn, [`סגירה − פתיחה − ריבית − שירות − שירות עבר = ${fmt(Math.round(asm.year2.pn))} ₪ הפסד — הריבית ירדה.`]),
    calc("a-fld-open", "שאלה 1: שטח, פתיחה", `שאלה 1, מחלקת השטח: מה יתרת ההתחייבות ב-1.1.${y1}?`, fld.year1.opening, [
      ...fld.groups.map((g, i) => (g.heads ? `${g.id}: ${g.heads} × ${fmt(k(g.grants[0].perYear))} × ${g.served} ÷ ${1 + EXAM_A.field.rate}^${g.nEnd + 1} = ${fmt(Math.round(fld.year1.rows[i].opening))}.` : `${g.id}: לא זכאים — אפס.`)),
      `סה״כ ${fmt(Math.round(fld.year1.opening))} ₪.`,
    ]),
    calc("a-fld-service1", `שאלה 1: שטח, שירות ${y1}`, `שאלה 1, מחלקת השטח: מה עלות השירות של ${y1} (השורה המאזנת)?`, fld.year1.service, [`סגירה ${fmt(Math.round(fld.year1.closing))} − פתיחה − ריבית ${fmt(Math.round(fld.year1.interest))} = ${fmt(Math.round(fld.year1.service))} ₪.`]),
    calc("a-fld-close2", `שאלה 1: שטח, סגירת ${y2}`, `שאלה 1, מחלקת השטח: מה יתרת ההתחייבות ב-31.12.${y2}?`, fld.year2.closing, [`אחרי העזיבה ובשיעור החדש: ${fmt(Math.round(fld.year2.closing))} ₪.`]),
    calc("a-fld-pn2", `שאלה 1: שטח, P.N. ${y2}`, `שאלה 1, מחלקת השטח: מה ה-P.N. של ${y2}? (הפסד — בסכום חיובי)`, fld.year2.pn, [`${fmt(Math.round(fld.year2.closing))} − ${fmt(Math.round(fld.year2.opening))} − ${fmt(Math.round(fld.year2.interest))} − ${fmt(Math.round(fld.year2.service))} = ${fmt(Math.round(fld.year2.pn))} ₪ — עזיבה וירידת ריבית, שתיהן P.N.`]),
    calc("b-interest", "שאלה 2: ריבית", "שאלה 2 (אלפי ₪): מה עלות הריבית של השנה?", B.obligation.interest, [`שיעור: ${EXAM_B.note.interestLast} ÷ ${fmt(EXAM_B.note.openingLast)} = ${pct(B.exactRate, 4)} (בלי לעגל).`, `${fmt(EXAM_B.note.obligation)} × השיעור = ${fmt(k(B.obligation.interest))}.`]),
    calc("b-service", "שאלה 2: שירות", "שאלה 2 (אלפי ₪): מה עלות השירות השוטף?", B.obligation.service, [`לכל דרג: עובדים × המשכורת הצפויה בפרישה × (1 + התוספת) ÷ (1+i)^${B.nEnd}. סה״כ ${fmt(k(B.obligation.service))}.`]),
    calc("b-past", "שאלה 2: שירות עבר", "שאלה 2 (אלפי ₪): מה עלות שירות העבר?", B.obligation.pastService, [`דרג ב׳ מקבל חצי מהתוספת של דרג א׳: ${pct(B.addedNow)}, על כל ${B.servedEnd} שנות השירות: ${fmt(k(B.obligation.pastService))}.`]),
    calc("b-payments", "שאלה 2: תשלומים", "שאלה 2 (אלפי ₪): כמה הטבות שולמו לפורשים?", B.obligation.payments, [`${EXAM_B.leavers.heads} × ${fmt(B.salaries[2])} × ${B.servedEnd} = ${fmt(k(B.obligation.payments))}.`]),
    calc("b-closing", "שאלה 2: סגירה", "שאלה 2 (אלפי ₪): מה יתרת ההתחייבות בסוף השנה?", B.obligation.closing, [`כל הדרגים, ${B.servedEnd} שנות שירות, בלי הפורשים ועם התוספות: ${fmt(k(B.obligation.closing))}.`]),
    calc("b-pn", "שאלה 2: P.N.", "שאלה 2 (אלפי ₪): מה ה-P.N. של ההתחייבות? (הפסד — בסכום חיובי)", B.obligation.pn, [`השורה המאזנת: ${fmt(k(B.obligation.pn))} הפסד.`]),
    calc("b-contribution", "שאלה 2: הפקדה", "שאלה 2 (אלפי ₪): כמה הופקד בקרן ב-30.6?", B.assets.contribution, [`${pct(B.contributionRate)} × השכר החודשי של כל ${EXAM_B.grades.reduce((s, g) => s + g.heads, 0)} העובדים (${fmt(k(B.assets.payroll))}) = ${fmt(k(B.assets.contribution))}.`]),
    calc("b-assets-interest", "שאלה 2: הכנסות ריבית", "שאלה 2 (אלפי ₪): מה הכנסות הריבית על נכסי התכנית?", B.assets.interest, [`על הפתיחה ${fmt(k(B.assets.interestOnOpening))}, ועל ההפקדה לחצי שנה ${fmt(k(B.assets.interestOnContribution))}.`]),
    calc("b-assets-closing", "שאלה 2: נכסים בסגירה", "שאלה 2 (אלפי ₪): מה שווי נכסי התכנית בסוף השנה?", B.assets.closing, [`פתיחה + ריבית + הפקדה − ${pct(B.fromAssets)} מהתשלומים + התשואה העודפת = ${fmt(k(B.assets.closing))}.`]),
    calc("b-net", "שאלה 2: נטו", "שאלה 2 (אלפי ₪): מה ההתחייבות נטו בסוף השנה?", B.net, [`${fmt(k(B.obligation.closing))} − ${fmt(k(B.assets.closing))} = ${fmt(k(B.net))}.`]),
  ],
  traps,
  tips: [
    "מבחן הוא סדר עבודה: סריקה, טבלת קבוצות, פתיחה, ריבית, שירות, שירות עבר, סגירה — ו-P.N. מאזנת.",
    "חמש שאלות סריקה: מה סוג ההטבה? מה הנוסחה, יש תקרה, ולמה היא מתייחסת? מה ציר הזמן? איזה מעגל מבקשים ואיזו שורה מאזנת? איזה נתון מוסתר ואפשר לשחזר?",
    "כלל זהב: מה שנתון בשאלה לא מחשבים, ומה שלא נתון — מחלצים.",
    "שיעור שמשוחזר מביאור — בלי לעגל. פתרון שעיגל את השיעור ייבדל ביחידות בודדות; בדקו מה המרצה מבקש.",
  ],
};

