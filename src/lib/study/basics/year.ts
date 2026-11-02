import { balancesOf, carryForward, ledger, statements } from "@/lib/learn/basics";
import { OFEK } from "@/lib/learn/basics-year";
import type { JournalExercise, StudyModule } from "../types";
import { COURSE, COURSE_HREF, fmt } from "./shared";

const B = balancesOf(ledger(OFEK.entries));
const S = statements(B);
const NEXT = statements(balancesOf(ledger(OFEK.next, carryForward(B))));
const { מזומן: cash, ...withoutCash } = B;
const retainedNext = NEXT.equity.find(([a]) => a === "עודפים")![1];

/** One of Ofek's entries as a journal exercise: the event, its answer, and the accounts offered. */
function ofek(id: string, n: string, skill: string, accounts: string[]): JournalExercise {
  const entry = OFEK.entries.find((x) => x.id === n)!;
  return { kind: "journal", id, skill, entry: { ...entry, id: "1", text: `${OFEK.name}, ${entry.date}: ${entry.text}.` }, accounts };
}

/** Lesson 4: a whole year — the method, a worked company, the learner's company from its first entry to the trial balance, and its second year. */
export const YEAR: StudyModule = {
  slug: "basics-year",
  course: COURSE,
  n: 4,
  title: "שנה שלמה: מפקודה ראשונה ועד מאזן בוחן",
  description: "שאלה של שנה שלמה, כמו בבחינה: עשרים אירועים עם תאריכים, צ׳קים ומקדמות — שיטת עבודה, דוגמה פתורה, שנה שאתם פותרים בעצמכם, ומעבר לשנה הבאה.",
  goal: "לפתור שאלה של שנה שלמה מקצה לקצה, בשיטה קבועה של חמישה צעדים.",
  outcomes: [
    "לעבוד בשיטה של חמישה צעדים על עשרים אירועים ויותר",
    "לרשום כל אירוע בתאריך הנכון, כולל צ׳קים ומקדמות",
    "להעביר את הכרטיסים למאזן בוחן מאוזן",
    "להעביר את השנה לשנה הבאה ולהמשיך ממנה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "year-method", title: "שיטת העבודה: חמישה צעדים" },
    { id: "year-example", title: "דוגמה פתורה: נגה הפקות בע״מ" },
    { id: "year-case", title: "תורכם: אופק ציוד משרדי, 21 אירועים" },
    { id: "year-tb", title: "מהכרטיסים למאזן הבוחן" },
    { id: "year-next", title: "השנה השנייה של אופק" },
  ],
  exercises: [
    ofek("ofek-equipment", "2", "ציוד בתשלומים", ["ציוד", "מזומן", "זכאים", "ספקים", "קניות"]),
    ofek("ofek-two-cheques", "3", "צ׳ק מזומן וצ׳ק דחוי", ["קניות", "מזומן", "ספקים", "זכאים", "לקוחות"]),
    ofek("ofek-sale", "5", "מכירה בצ׳ק דחוי", ["מזומן", "לקוחות", "מכירות", "ספקים", "מקדמות מלקוחות"]),
    ofek("ofek-bounced", "10", "צ׳ק שחזר", ["לקוחות", "מזומן", "מכירות", "הוצאות עמלות בנק"]),
    ofek("ofek-advance-goods", "13", "מקדמה, צ׳ק ואשראי", ["קניות", "מקדמות לספקים", "ספקים", "מזומן", "מקדמות מלקוחות"]),
    ofek("ofek-advance-sale", "17", "מכירה על חשבון מקדמה", ["מקדמות מלקוחות", "לקוחות", "מכירות", "מזומן", "מקדמות לספקים"]),
    ofek("ofek-interest", "21", "ריבית לחלק מהשנה", ["הוצאות ריבית", "מזומן", "הלוואה", "הכנסות ריבית"]),
    {
      kind: "number",
      id: "ofek-cash",
      skill: "מאזן בוחן של שנה שלמה",
      prompt: `בנו את מאזן הבוחן של ${OFEK.name} ליום 31.12.${OFEK.year}: גררו כל חשבון לצד שלו, ומצאו את יתרת המזומן החסרה.`,
      answer: cash,
      steps: [
        "בחובה: ציוד, לקוחות, קניות, ושלוש ההוצאות — שכר, שכירות, ריבית ועמלות בנק.",
        "בזכות: הון מניות, ספקים, הלוואה ומכירות.",
        `המזומן הוא ההפרש שמאזן את הטבלה: ${fmt(cash)}.`,
      ],
      table: { kind: "trial", balances: withoutCash, missing: "מזומן" },
    },
    {
      kind: "number",
      id: "ofek-profit",
      skill: "רווח השנה",
      prompt: `מהו הרווח של ${OFEK.name} בשנת ${OFEK.year}? (אין עדיין מלאי סגירה — כל הקניות הן הוצאה.)`,
      answer: S.profit,
      steps: [`הכנסות: מכירות ${fmt(S.totalIncome)}.`, `הוצאות: קניות 140,000 + שכר 48,000 + שכירות 36,000 + ריבית 5,500 + עמלות 80 = ${fmt(S.totalExpenses)}.`, `רווח: ${fmt(S.totalIncome)} − ${fmt(S.totalExpenses)} = ${fmt(S.profit)}.`],
    },
    {
      kind: "number",
      id: "ofek-retained-2026",
      skill: "עודפים בשנה השנייה",
      prompt: `ב-2026 הרוויחה ${OFEK.name} ${fmt(NEXT.profit)} ₪. מהם עודפי הסגירה שלה ב-31.12.2026?`,
      answer: retainedNext,
      steps: [`עודפי הפתיחה ב-1.1.2026 הם רווח 2025: ${fmt(S.profit)} (החברה חדשה).`, `${fmt(S.profit)} + ${fmt(NEXT.profit)} = ${fmt(retainedNext)}.`],
    },
  ],
  traps: [
    {
      id: "cheque-cleared-income",
      prompt: "לקוח נתן צ׳ק דחוי ב-15.2, והצ׳ק נפרע ב-15.5. מתי נרשמת ההכנסה?",
      options: ["ב-15.2, ביום המכירה", "ב-15.5, ביום הפירעון", "חצי בכל תאריך", "רק אחרי שהצ׳ק לא חזר"],
      answer: 0,
      why: "ההכנסה שייכת ליום שבו הסחורה נמסרה. ביום הפירעון רק החוב של הלקוח הופך למזומן.",
      traps: [
        "",
        "המלכודת: מחכים לכסף. אבל בבסיס מצטבר רושמים כשהעסקה קורית, לא כשהכסף זז.",
        "אין חלוקה: המכירה קרתה ביום אחד.",
        "גם אם הצ׳ק יחזור, המכירה עצמה קרתה. רק הגבייה תיכשל.",
      ],
    },
    {
      id: "advance-sale-amount",
      prompt: "לקוח שילם מקדמה של 15,000 ₪, ובנובמבר קיבל סחורה ב-40,000 ₪. כמה מכירות נרשמות בנובמבר?",
      options: ["40,000", "25,000", "15,000", "55,000"],
      answer: 0,
      why: "בנובמבר נמסרה סחורה ב-40,000 — זו המכירה. המקדמה רק אומרת איך שולם חלק מהמחיר.",
      traps: [
        "",
        "המלכודת: מורידים את המקדמה מהמכירה. אבל המקדמה לא נרשמה כהכנסה ביוני — היא הייתה התחייבות. עכשיו כל ה-40,000 הם הכנסה.",
        "המקדמה היא חלק מהתשלום, לא המכירה.",
        "המקדמה כבר בתוך ה-40,000. לא מחברים אותה שוב.",
      ],
    },
  ],
  tips: [
    "קוראים את כל השאלה לפני הפקודה הראשונה, ומחברים כל ״ראה נתון״.",
    "לכל אירוע: מה קיבלנו, מה נתנו, ובמה שולם. צ׳ק דחוי = אשראי.",
    "מאזן בוחן לא מתאזן? הפרש של סכום — חסרה יתרה. הפרש כפול — יתרה התהפכה.",
    "בשנה השנייה: המאזני ממשיך, התוצאתי מאפס, והרווח של השנה הקודמת כבר בעודפים.",
  ],
};
