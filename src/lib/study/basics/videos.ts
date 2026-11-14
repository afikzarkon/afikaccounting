import type { LessonVideo } from "../types";

/**
 * The basics course's recorded lessons, hosted on Bunny Stream (lesson 9 has none).
 * Each chapter starts where its slide starts in the recording; a chapter that
 * names a screen is offered on that screen too.
 */
const BUNNY_LIBRARY = "808661";

/** Each lesson's video id in the Bunny library, by lesson number; a lesson without one shows no video. */
const BUNNY_IDS: Record<number, string> = {
  1: "001b3aa7-9185-4214-847e-78fb2444db25",
  2: "8bd2e684-016c-40fa-8354-15c733c227d8",
  3: "26da98c9-e9cd-44d1-a2aa-7cc9b45bc383",
  4: "1967f129-5b61-4ccf-b379-54c43a2c87c4",
  5: "ef914275-8d31-463b-88cc-1dbe8f74d1b6",
  6: "b362682a-7b6a-4e04-87cc-6f08e76c0589",
  7: "0117937d-4f00-49fa-a93f-650d34476119",
  8: "c5a1272c-382c-4876-b8ca-0f7dcb6a7c62",
};

const RECORDINGS: Record<number, Omit<LessonVideo, "src" | "title">> = {
  1: {
    duration: 778,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 51, title: "שפת העסקים", screen: "language" },
      { at: 135, title: "הדקדוק: תקני חשבונאות", screen: "grammar" },
      { at: 286, title: "מה עושים בחשבונאות", screen: "landscape" },
      { at: 386, title: "הדוחות: שניים שבונים, וארבעה של חברה", screen: "what" },
      { at: 535, title: "מי מדבר? העסק — וחברה בע״מ", screen: "entity" },
      { at: 614, title: "אוצר המילים: חמישה סוגים", screen: "types" },
      { at: 725, title: "סיכום" },
    ],
  },
  2: {
    duration: 1232,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 53, title: "הזהות החשבונאית", screen: "equation" },
      { at: 138, title: "הוצאה מול השקעה", screen: "expense" },
      { at: 274, title: "רישום כפול ופקודה פשוטה", screen: "double" },
      { at: 400, title: "עסק שלם, פקודה אחר פקודה", screen: "lab" },
      { at: 569, title: "עסקאות באשראי ופקודה מורכבת", screen: "credit" },
      { at: 697, title: "מקדמות: הכסף לפני העסקה", screen: "advances" },
      { at: 748, title: "מקדמה שמכסה רק חלק מהעסקה", screen: "advance-split" },
      { at: 849, title: "צ׳קים: מזומן, דחוי, וצ׳ק שחזר", screen: "checks" },
      { at: 1023, title: "הלוואה: קבלה, ריבית ותשלומים", screen: "loan" },
      { at: 1116, title: "מתי הכסף זז? הפעולות הנפוצות", screen: "actions" },
      { at: 1185, title: "סיכום" },
    ],
  },
  3: {
    duration: 1003,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 74, title: "כרטיסי T: כל חשבון בכרטיס משלו", screen: "taccounts" },
      { at: 278, title: "מאזן בוחן: כל היתרות בטבלה אחת", screen: "trial" },
      { at: 457, title: "עודפים", screen: "retained" },
      { at: 649, title: "מהיתרות לדוחות", screen: "reports" },
      { at: 757, title: "מעבר משנה לשנה", screen: "carry" },
      { at: 936, title: "סיכום" },
    ],
  },
  4: {
    duration: 1082,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 44, title: "שיטת העבודה: חמישה צעדים", screen: "year-method" },
      { at: 235, title: "דוגמה פתורה: נגה הפקות בע״מ", screen: "year-example" },
      { at: 457, title: "תורכם: אופק ציוד משרדי, 21 אירועים", screen: "year-case" },
      { at: 726, title: "מהכרטיסים למאזן הבוחן", screen: "year-tb" },
      { at: 848, title: "השנה השנייה של אופק", screen: "year-next" },
      { at: 1029, title: "סיכום" },
    ],
  },
  5: {
    duration: 1574,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 61, title: "חשבונות חתך: שם של הוצאה, מקום במאזן", screen: "accrual" },
      { at: 217, title: "הוצאות מראש — נכס", screen: "prepaid" },
      { at: 307, title: "הוצאות לשלם — התחייבות", screen: "accrued" },
      { at: 376, title: "הכנסות מראש — התחייבות", screen: "unearned" },
      { at: 437, title: "הכנסות לקבל — נכס", screen: "receivable" },
      { at: 526, title: "החודש שלא דומה לאחרים", screen: "odd-month" },
      { at: 599, title: "ריבית: לשנה או לחצי שנה?", screen: "interest-period" },
      { at: 648, title: "מלאי סגירה", screen: "inventory" },
      { at: 744, title: "פחת: ההשקעה מתבלה", screen: "ppe-idea" },
      { at: 806, title: "קו ישר: לפי שנים או לפי אחוז", screen: "ppe-straight" },
      { at: 909, title: "פחת נצבר ועלות מופחתת", screen: "ppe-accum" },
      { at: 977, title: "מכירת רכוש קבוע", screen: "ppe-sell" },
      { at: 1134, title: "דוגמה מלאה: שחר ייעוץ בע״מ", screen: "adj-example" },
      { at: 1522, title: "סיכום" },
    ],
  },
  6: {
    duration: 1141,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 51, title: "שלוש שאלות לכל סעיף", screen: "rev-method" },
      { at: 141, title: "חוזה ישן או חדש?", screen: "rev-contract" },
      { at: 283, title: "חוזים לאורך שנים, ויתרה ״?״", screen: "rev-multiyear" },
      { at: 461, title: "יתרות ״?״ ברכוש קבוע", screen: "rev-ppe" },
      { at: 568, title: "פקודות תיקון: חשבון שגוי, צד הפוך, או שניהם", screen: "rev-fix" },
      { at: 710, title: "מה כל טעות עשתה לרווח", screen: "rev-profit" },
      { at: 754, title: "שאלה ברמת החוברת: גלעד ציוד בע״מ", screen: "rev-booklet" },
      { at: 1085, title: "סיכום" },
    ],
  },
  7: {
    duration: 1391,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 38, title: "הרעיון: לא כל לקוח ישלם", screen: "cl-idea" },
      { at: 150, title: "ברוטו, הפרשה ונטו", screen: "cl-net" },
      { at: 204, title: "ההפרשה של עינב: הוצאה מול כרית", screen: "cl-allowance" },
      { at: 240, title: "חוב אבוד, חוב ספציפי — והנוסחה", screen: "cl-terms" },
      { at: 396, title: "הפקודות של השנה", screen: "cl-entries" },
      { at: 564, title: "מתווה 3 הכללים", screen: "cl-method" },
      { at: 627, title: "חילוץ נעלמים: ארבע נוסחאות", screen: "cl-extract" },
      { at: 694, title: "דוגמה ראשונה: ארז בע״מ", screen: "cl-first" },
      { at: 856, title: "שלושה תרחישים, שלושה נעלמים", screen: "cl-scenarios" },
      { at: 912, title: "הפרשה ספציפית וכללית", screen: "cl-specific" },
      { at: 1053, title: "שאלה ברמת החוברת: נווה, שלוש שנים", screen: "cl-booklet" },
      { at: 1152, title: "שאלה ברמת בחינה: כרמל בע״מ", screen: "cl-exam" },
      { at: 1342, title: "סיכום" },
    ],
  },
  8: {
    duration: 1068,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 45, title: "גיליון רב-טורי: העמודות", screen: "worksheet" },
      { at: 96, title: "שאלה מלאה: רימון בע״מ", screen: "ws-question" },
      { at: 202, title: "הפתרון, עמודה אחר עמודה", screen: "ws-solve" },
      { at: 525, title: "שאלת הבחינה המסכמת: אלמוג בע״מ", screen: "ws-exam" },
      { at: 1026, title: "סיכום" },
    ],
  },
};

/** Lesson `n`'s video, once it is on Bunny; none before. */
export function basicsVideos(n: number, title: string): LessonVideo[] {
  const id = BUNNY_IDS[n];
  const rec = RECORDINGS[n];
  if (!BUNNY_LIBRARY || !id || !rec) return [];
  return [{ src: `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY}/${id}`, title, ...rec }];
}
