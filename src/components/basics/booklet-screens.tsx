import type { ScreenContent } from "@/components/study-mode/shell";
import { AGAM, GILAD, NEVEH } from "@/lib/learn/basics-booklet";
import { Remember } from "@/components/study-mode/screen-parts";
import { Given } from "./credit";
import { Money } from "./ui";
import { W_AGAM, W_GILAD, W_NEVEH } from "@/lib/study/basics/exam-worked";
import { WorkedReveal } from "@/components/study/worked";

const n = (v: number) => Math.round(v).toLocaleString("en-US");

/** Booklet-level questions: one at the end of each of lessons 5, 6 and 7, the whole solution behind one button. */
export const BOOKLET_SCREENS: Record<string, ScreenContent> = {
  "adj-booklet": {
    lead: "שאלה ברמת החוברת: שמונה נתונים של חברה אחת, וכל אחד דורש פקודת התאמה. פתרו את כולם, ורק אז פתחו את הפתרון.",
    body: (
      <>
        <Given title={`נתון: ${AGAM.name}, 31.12.2025`} asks="פקודות יומן להתאמת החשבונות ליום 31.12.2025.">
          <ol className="list-decimal space-y-1.5 ps-5">
            {AGAM.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Given>
        <WorkedReveal w={W_AGAM} tryFirst="כתבו את שמונה הפקודות. לכל נתון: מה נרשם, מה צריך, ומה חסר." />
        <Remember>לפני כל פקודה שואלים: נרשם כהוצאה או כנכס? כמה חודשים נרשמו? והשיעור לשנה או לחצי שנה?</Remember>
      </>
    ),
  },

  "rev-booklet": {
    lead: "שאלה ברמת החוברת: מאזן בוחן ראשוני עם שתי יתרות חסרות, תיקונים וחוזים. מגיעים עד הרווח ועודפי הסגירה.",
    body: (
      <>
        <Given title={`נתון: ${GILAD.name}, מאזן בוחן ראשוני ליום 31.12.2025`} asks="השלמת היתרות החסרות, פקודות התאמה ותיקון, מאזן בוחן מתוקן (סופי), רווח השנה ועודפי הסגירה.">
          <ul className="divide-y divide-amber-500/20 text-[14.5px]">
            {[...Object.entries(GILAD.given), ...GILAD.unknowns.map((u) => [u, null] as [string, null])].map(([a, v]) => (
              <li key={a} className="flex justify-between gap-3 py-1">
                <span>{a}</span>
                {v === null ? <strong className="text-accent">?</strong> : <Money v={Math.abs(v)} plain />}
              </li>
            ))}
          </ul>
          <p className="pt-1 font-semibold">נתונים נוספים:</p>
          <ol className="list-decimal space-y-1.5 ps-5">
            {GILAD.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Given>
        <WorkedReveal w={W_GILAD} tryFirst="השלימו את שתי היתרות, רשמו את כל הפקודות, ובנו את הגיליון הרב־טורי עד הרווח והעודפים." />
        <Remember>סדר העבודה: יתרות ״?״ מהסיפור, אחר כך העודפים כהפרש, פקודות, מאזן בוחן מתוקן, ורק בסוף הרווח והעודפים.</Remember>
      </>
    ),
  },

  "cl-booklet": {
    lead: "שאלה ברמת החוברת: שלוש שנים של לקוחות והפרשה. בכל שנה בונים את כרטיס הלקוחות ואת כרטיס ההפרשה מחדש.",
    body: (
      <>
        <Given title={`נתון: ${NEVEH.name}, 2023 עד 2025`} asks="לכל שנה: יתרת ההפרשה בסוף השנה, הוצאות הפסדי האשראי, והלקוחות נטו במאזן.">
          <ul className="space-y-1 text-[14.5px]">
            {NEVEH.data.map((y) => (
              <li key={y.year} className="rounded-lg bg-surface/60 px-3 py-1.5">
                <strong>{y.year}:</strong> מכירות באשראי {n(y.sales)}, גבייה {n(y.collected)}, {y.written ? `חובות אבודים ${n(y.written)}` : "בלי חובות אבודים"}
              </li>
            ))}
          </ul>
          <ul className="list-disc space-y-1 ps-5">
            {NEVEH.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Given>
        <WorkedReveal w={W_NEVEH} tryFirst="לכל שנה: לקוחות בסוף השנה, ההפרשה לפני ההתאמה, ההפרשה הנדרשת, וההוצאה כהפרש ביניהן." />
        <Remember>בכל שנה: לקוחות סוף ← הפרשה נדרשת ← מה שיש אחרי המחיקות ← ההוצאה היא ההפרש. יתרת הסגירה של שנה היא הפתיחה של הבאה.</Remember>
      </>
    ),
  },
};
