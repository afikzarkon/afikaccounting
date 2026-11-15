import type { LessonVideo } from "../types";

/**
 * The IAS 19 course's recorded videos, hosted on Bunny Stream. Lessons 4–6 have two
 * videos each ("4a", "4b"), split where the lesson's part ב׳ starts; the others one.
 * Each chapter starts where its slide starts in the recording; a chapter that
 * names a screen is offered on that screen too.
 */
const BUNNY_LIBRARY = "808661";

/** Each video's id in the Bunny library; a video without one is not shown. */
const BUNNY_IDS: Record<string, string> = {
  "1": "47b2671e-4e2a-4cc8-bcef-2416e76fbd6b",
  "2": "ef473146-a376-4cd1-8f6c-bc531ec89352",
  "3": "6ccd7b34-fae4-40cf-b2a9-f3ce270c1af6",
  "4a": "f33eb84f-2adb-41a6-b33e-383494abfea6",
  "4b": "98455dc7-c4b1-4f07-af5f-d671cc473fd5",
  "5a": "c0750e84-2d7e-41a9-a1ff-e44e2e5ffe03",
  "5b": "a0f1c2c1-336b-48c8-8d8b-eb6ceeef9ac1",
  "6a": "2044347f-9dae-4f3a-8f15-1a4e695e1796",
  "6b": "b48b3765-0907-42a9-81e3-4aeaa303c5f8",
};

const RECORDINGS: Record<string, Omit<LessonVideo, "src" | "title" | "part">> = {
  "4a": {
    duration: 697,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 47, title: "כמה שווה היום הבטחה לפרישה?", screen: "emp-measure-hook" },
      { at: 91, title: "יחידת הזכאות הצפויה", screen: "emp-measure-puc" },
      { at: 183, title: "ההנחות האקטואריות: דמוגרפיות ופיננסיות", screen: "emp-measure-assume" },
      { at: 232, title: "באיזו ריבית מהוונים", screen: "emp-measure-rate" },
      { at: 330, title: "הכלל: מתכון חמשת הצעדים", screen: "emp-measure-recipe" },
      { at: 403, title: "תבנית פתרון: מדידת התחייבות", screen: "emp-measure-template" },
      { at: 451, title: "דוגמה פתורה: סמנכ״לית התפעול", screen: "emp-measure-solved" },
      { at: 555, title: "פותרים יחד: פרישה מאוחרת, וקבוצת עובדים", screen: "emp-measure-together" },
      { at: 646, title: "סיכום" },
    ],
  },
  "4b": {
    duration: 775,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 52, title: "מנוי חינם אחרי 100 אימונים", screen: "emp-attr-hook" },
      { at: 116, title: "נוסחת התוכנית, או קו ישר", screen: "emp-attr-formula" },
      { at: 197, title: "תקרה, וזכאות שמתחילה מאוחר", screen: "emp-attr-cap" },
      { at: 309, title: "שני מסלולים לזכאות: גיל וּותק, או גיל בלבד", screen: "emp-attr-dual" },
      { at: 367, title: "הכלל: שלוש שאלות לפני כל חישוב", screen: "emp-attr-rule" },
      { at: 408, title: "תבנית פתרון: שאלת ייחוס", screen: "emp-attr-template" },
      { at: 448, title: "דוגמה פתורה: מענק שנותן יותר בהתחלה", screen: "emp-attr-solved" },
      { at: 544, title: "פותרים יחד: מענק שקופץ, ושלושה עובדים בשני מסלולים", screen: "emp-attr-together" },
      { at: 733, title: "סיכום" },
    ],
  },
  "5a": {
    duration: 885,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 53, title: "חשבון החיסכון שהפתיע", screen: "emp-roll-hook" },
      { at: 140, title: "ארבע שורות שמסבירות, ואחת שמאזנת", screen: "emp-roll-lines" },
      { at: 244, title: "איזו ריבית ואיזה n בכל שורה", screen: "emp-roll-rates" },
      { at: 336, title: "ריבית כששולם מענק באמצע השנה", screen: "emp-roll-paid" },
      { at: 430, title: "הכלל: המעגל, ורישום כל שורה", screen: "emp-roll-rule" },
      { at: 498, title: "לאן הולכת כל שורה: רווח והפסד, OCI, ומה עם ההון", screen: "emp-roll-where" },
      { at: 552, title: "תבנית פתרון: תנועה בהתחייבות", screen: "emp-roll-template" },
      { at: 602, title: "דוגמה פתורה: סמנכ״ל כספים, שנתיים", screen: "emp-roll-solved" },
      { at: 838, title: "סיכום" },
    ],
  },
  "5b": {
    duration: 833,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 55, title: "המענק עולה מ-1 במאי", screen: "emp-amend-hook" },
      { at: 103, title: "מהי עלות שירות עבר: תיקון, צמצום, ומה לא", screen: "emp-amend-what" },
      { at: 162, title: "שינוי תנאים: שתי תקופות, ושירות עבר", screen: "emp-amend-split" },
      { at: 292, title: "סילוק מול פרישה בלתי צפויה", screen: "emp-amend-settle" },
      { at: 392, title: "הכלל: ארבעה צעדים בשנה מפוצלת", screen: "emp-amend-rule" },
      { at: 439, title: "דוגמה פתורה: מנהל הטכנולוגיה", screen: "emp-amend-solved" },
      { at: 683, title: "פותרים יחד: סילוק, פרישה, וביטול תוכנית", screen: "emp-amend-together" },
      { at: 780, title: "סיכום" },
    ],
  },
  "6a": {
    duration: 858,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 50, title: "חוב, וקופה בצד", screen: "emp-assets-hook" },
      { at: 93, title: "מתי קופה היא ״נכסי תכנית״", screen: "emp-assets-qualify" },
      { at: 184, title: "נכסי תכנית, ומעגל משלהם", screen: "emp-assets-what" },
      { at: 271, title: "תקרת הנכס", screen: "emp-assets-ceiling" },
      { at: 314, title: "פוליסה שאינה כשירה: נכס שיפוי", screen: "emp-assets-reimburse" },
      { at: 367, title: "עודף, והפקדה מינימלית: כמה ממנו נכס (IFRIC 14)", screen: "emp-assets-mfr" },
      { at: 466, title: "הכלל: שני מעגלים, נטו, ותקרה", screen: "emp-assets-rule" },
      { at: 505, title: "דוגמה פתורה: מענק עם קרן", screen: "emp-assets-solved" },
      { at: 684, title: "פותרים יחד: עודף שנתקל בתקרה", screen: "emp-assets-together" },
      { at: 811, title: "סיכום" },
    ],
  },
  "6b": {
    duration: 848,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 47, title: "כל שורה לקופסה שלה", screen: "emp-present-hook" },
      { at: 93, title: "שלוש כתובות", screen: "emp-present-three" },
      { at: 191, title: "הנדסה לאחור: מה הביאור מסתיר", screen: "emp-present-reverse" },
      { at: 287, title: "הכלל: ניתוב כל שורה", screen: "emp-present-rule" },
      { at: 320, title: "דוגמה פתורה: התיקון, והדוחות", screen: "emp-present-solved" },
      { at: 560, title: "פותרים יחד: מדיניות אחרת, וביאור של שנה קודמת", screen: "emp-present-together" },
      { at: 791, title: "סיכום" },
    ],
  },
  "3": {
    duration: 810,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 62, title: "דמי כיס, או ״אני משלם על הכול״", screen: "emp-dc-hook" },
      { at: 103, title: "מה נחשב הטבה לאחר סיום העסקה", screen: "emp-dc-what" },
      { at: 155, title: "שתי תוכניות: הפקדה מוגדרת והטבה מוגדרת", screen: "emp-dc-two" },
      { at: 252, title: "המבחן: מי נושא בסיכון", screen: "emp-dc-test" },
      { at: 387, title: "הכלל: איך רושמים הפקדה מוגדרת", screen: "emp-dc-record" },
      { at: 492, title: "תבנית פתרון: שאלת הפקדה מוגדרת", screen: "emp-dc-template" },
      { at: 591, title: "דוגמה פתורה: הפקדה שעוד לא הועברה", screen: "emp-dc-solved" },
      { at: 692, title: "פותרים יחד: שכר אחר, ומבטח שלקח את הסיכון", screen: "emp-dc-together" },
      { at: 751, title: "סיכום" },
    ],
  },
  "1": {
    duration: 1187,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 61, title: "IAS 19 על רגל אחת: מה זה ולמה צריך אותו", screen: "emp-map-why" },
      { at: 193, title: "איך התקן מחולק: ארבע קבוצות", screen: "emp-map-welcome" },
      { at: 241, title: "העיקרון: עבודה של היום, התחייבות של היום", screen: "emp-map-principle" },
      { at: 407, title: "איך מבדילים בין הסוגים, עם תאריכים", screen: "emp-map-types" },
      { at: 561, title: "הכלל: עץ החלטות של שלוש שאלות", screen: "emp-map-ladder" },
      { at: 607, title: "ממיינים: חמישה מקרים", screen: "emp-map-sort" },
      { at: 687, title: "למה צריך מימון בקורס על עובדים", screen: "emp-tool-hook" },
      { at: 748, title: "קדימה בזמן: ריבית שנתית וערך עתידי", screen: "emp-tool-fv" },
      { at: 817, title: "אחורה בזמן: ערך נוכחי", screen: "emp-tool-pv" },
      { at: 906, title: "ריבית לתקופה שאינה שנה", screen: "emp-tool-part" },
      { at: 1031, title: "המעגל: מה קרה ליתרה במשך השנה", screen: "emp-tool-roll" },
      { at: 1136, title: "סיכום" },
    ],
  },
  "2": {
    duration: 1290,
    chapters: [
      { at: 0, title: "פתיחה" },
      { at: 49, title: "מה זו הטבה לזמן קצר", screen: "emp-short-hook" },
      { at: 164, title: "היעדרויות בתשלום: נצברת או לא נצברת", screen: "emp-short-absence" },
      { at: 250, title: "מבשילה או לא מבשילה", screen: "emp-short-vest" },
      { at: 375, title: "עלות יום, ומה הן התוספות", screen: "emp-short-daycost" },
      { at: 476, title: "LIFO: קודם הימים של השנה", screen: "emp-short-lifo" },
      { at: 543, title: "FIFO: קודם הימים הצבורים", screen: "emp-short-fifo" },
      { at: 594, title: "איך פותרים: ששה שלבים", screen: "emp-short-map" },
      { at: 680, title: "שלבים 1–2: סיווג, ומה נכנס להפרשה", screen: "emp-short-classify" },
      { at: 797, title: "שלב 3: יתרת פתיחה, לפי הצפי", screen: "emp-short-opening" },
      { at: 883, title: "שלב 4: תשלומים, לפי מה שקרה", screen: "emp-short-payments" },
      { at: 935, title: "שלב 5: יתרת סגירה, אחרי ניצול ופקיעה", screen: "emp-short-closing" },
      { at: 983, title: "שלב 6: טבלת התנועה", screen: "emp-short-movement" },
      { at: 1059, title: "מלכודות, ותבנית פתרון", screen: "emp-short-traps" },
      { at: 1103, title: "בונוסים ושיתוף ברווחים", screen: "emp-short-bonus" },
      { at: 1239, title: "סיכום" },
    ],
  },
};

const PARTS: Record<number, [string, string][]> = {
  4: [["4a", "חלק א׳"], ["4b", "חלק ב׳"]],
  5: [["5a", "חלק א׳"], ["5b", "חלק ב׳"]],
  6: [["6a", "חלק א׳"], ["6b", "חלק ב׳"]],
};

/** Lesson `n`'s videos that are on Bunny, in order; none before. */
export function ias19Videos(n: number, title: string): LessonVideo[] {
  const parts = PARTS[n] ?? [[String(n), ""]];
  return parts.flatMap(([key, part]) => {
    const id = BUNNY_IDS[key];
    const rec = RECORDINGS[key];
    if (!id || !rec) return [];
    return [{ src: `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY}/${id}`, title, ...(part ? { part } : {}), ...rec }];
  });
}
