import type { ScreenContent } from "@/components/study-mode/shell";
import { BasicsDrill } from "./basics-drill";

/** The practice-without-end screen at the end of lessons 5, 6 and 7: only what the lesson taught, in three levels and mixed. */
export const DRILL_SCREENS: Record<string, ScreenContent> = {
  "adj-drill": {
    lead: "כל לחיצה נותנת חברה חדשה ומספרים חדשים. מתחילים ברמה 1, עולים כשזה כבר קל, ובסוף עוברים למעורב.",
    body: <BasicsDrill lesson={5} />,
  },
  "rev-drill": {
    lead: "מאזן בוחן ראשוני בלי סוף: חוזים ישנים, יתרות ״?״, תיקונים ורכוש קבוע. כל תרגיל עם פתרון מלא.",
    body: <BasicsDrill lesson={6} />,
  },
  "cl-drill": {
    lead: "הפסדי אשראי בכל השילובים: השלמה, מחיקה, ספציפית וכללית, חוב שחזר, ונעלמים. כל לחיצה מביאה מספרים חדשים.",
    body: <BasicsDrill lesson={7} />,
  },
};
