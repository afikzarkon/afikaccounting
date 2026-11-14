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
  "4a": "f33eb84f-2adb-41a6-b33e-383494abfea6",
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
