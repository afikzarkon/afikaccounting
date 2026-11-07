import type { Ias19Slug } from "./shared";

/**
 * The course's mind map: the four kinds of benefit and the tools, each leaf
 * with the lesson that teaches it. The course page shows it whole, lesson 1
 * opens with it, and every other lesson opens with its branch highlighted.
 */
export type MapLeaf = { text: string; lesson?: Ias19Slug };
export type MapBranch = { id: string; title: string; leaves: MapLeaf[]; lessons: Ias19Slug[]; core?: boolean };

export const MIND_MAP: MapBranch[] = [
  {
    id: "short",
    title: "הטבות לזמן קצר",
    lessons: ["ias19-short"],
    leaves: [{ text: "היעדרויות נצברות: מבשילות או לא", lesson: "ias19-short" }, { text: "בונוסים: לפי נוסחה ועזיבות צפויות", lesson: "ias19-short" }],
  },
  {
    id: "post",
    title: "הטבות לאחר סיום העסקה",
    core: true,
    lessons: ["ias19-dc", "ias19-measure", "ias19-rollforward", "ias19-assets"],
    leaves: [
      { text: "הפקדה מוגדרת מול הטבה מוגדרת", lesson: "ias19-dc" },
      { text: "מדידה בנקודת זמן: חמשת הצעדים", lesson: "ias19-measure" },
      { text: "שיוך לשנות שירות: קו ישר ותקרה", lesson: "ias19-measure" },
      { text: "מעגל ההתחייבות לאורך שנה", lesson: "ias19-rollforward" },
      { text: "שינוי תנאים, שירות עבר וסילוק", lesson: "ias19-rollforward" },
      { text: "נכסי תכנית, התחייבות נטו ותקרת נכס", lesson: "ias19-assets" },
      { text: "הצגה בדוחות ושחזור נתונים מביאור", lesson: "ias19-assets" },
    ],
  },
  {
    id: "other",
    title: "הטבות אחרות לזמן ארוך",
    lessons: ["ias19-other"],
    leaves: [{ text: "מענק יובל, שבתון ובונוס רב שנתי", lesson: "ias19-other" }, { text: "אותה מדידה, וכל התנועות לרווח והפסד", lesson: "ias19-other" }],
  },
  {
    id: "termination",
    title: "הטבות בגין פיטורין",
    lessons: ["ias19-other"],
    leaves: [{ text: "מועד ההכרה: המוקדם משני מועדים", lesson: "ias19-other" }, { text: "ללא שיוך לשנות שירות", lesson: "ias19-other" }],
  },
  {
    id: "tools",
    title: "כלים ומבחן",
    lessons: ["ias19-map", "ias19-exams"],
    leaves: [
      { text: "מיון ארבעת סוגי ההטבות", lesson: "ias19-map" },
      { text: "ארגז כלים: ערך נוכחי ומעגל", lesson: "ias19-map" },
      { text: "שאלות ברמת מבחן", lesson: "ias19-exams" },
    ],
  },
];

/** The branch a lesson sits on (lesson 11 sits on two: the first is named). */
export const branchOf = (slug: Ias19Slug) => MIND_MAP.filter((b) => b.lessons.includes(slug));
