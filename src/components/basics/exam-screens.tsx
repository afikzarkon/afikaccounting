import { Clock } from "lucide-react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { EXAM1, EXAM2, EXAM3, EXAM4, EXAM5, EXAM6, EXAM7, EXAM8, type WorksheetExam } from "@/lib/learn/basics-exams";
import { W_EXAM1, W_EXAM2, W_EXAM3, W_EXAM4, W_EXAM5, W_EXAM6, W_EXAM7, W_EXAM8 } from "@/lib/study/basics/exam-worked";
import type { WorkedBody } from "@/lib/study/worked";
import { WorkedReveal } from "@/components/study/worked";
import { BasicsDrill } from "./basics-drill";
import { Remember } from "@/components/study-mode/screen-parts";
import { Given } from "./credit";
import { Money } from "./ui";

/** How long the exam is meant to take: a suggestion, not a clock. */
function Time({ minutes }: { minutes: number }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2/70 px-3 py-1.5 text-[13.5px] text-muted">
      <Clock className="h-4 w-4" aria-hidden /> זמן מומלץ: {minutes} דקות. פתרו על דף, ורק אז פתחו את הפתרון.
    </p>
  );
}

function Facts({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-1.5 ps-5">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ol>
  );
}

/** A whole worksheet question: the trial balance with its "?" balances, the facts, and the whole solution behind one button. */
function WorksheetExamScreen({ x, w }: { x: WorksheetExam; w: WorkedBody }) {
  const unknowns = [...x.computed.map((c) => c.account), "עודפים"];
  return (
    <>
      <Time minutes={x.time} />
      <Given title={`נתון: ${x.name}, מאזן בוחן ראשוני ליום 31.12.2025`} asks="השלמת היתרות החסרות, פקודות התאמה ותיקון, מאזן בוחן מתוקן (גיליון עבודה מלא), רווח 2025 ועודפי הסגירה.">
        <ul className="divide-y divide-amber-500/20 text-[14.5px]">
          {[...Object.entries(x.given), ...unknowns.map((u) => [u, null] as [string, null])].map(([a, v]) => (
            <li key={a} className="flex justify-between gap-3 py-1">
              <span>{a}</span>
              {v === null ? <strong className="text-accent">?</strong> : <Money v={Math.abs(v)} plain />}
            </li>
          ))}
        </ul>
        <p className="pt-1 font-semibold">נתונים נוספים:</p>
        <Facts items={x.facts} />
      </Given>
      <WorkedReveal w={w} tryFirst="פתרו את כל הגיליון: היתרות החסרות, הפקודות, הגיליון הרב־טורי, הרווח והעודפים." />
    </>
  );
}

const ORDER = [
  "קוראים את כל השאלה, ומסמנים ליד כל נתון את החשבון במאזן הבוחן שהוא נוגע בו.",
  "יתרות ״?״ שמחשבים מהסיפור (מראש של חוזה ישן, פחת נצבר): קודם.",
  "העודפים אחרונים: הם ההפרש שמאזן את מאזן הבוחן הראשוני.",
  "פקודות לפי סדר הנתונים. לכל נתון: מה נרשם, מה צריך, והתיקון הוא ההפרש.",
  "תיקונים שמשנים את הלקוחות לפני ההפרשה. פחת עד יום המכירה לפני המכירה.",
  "מאזן בוחן מתוקן (נקרא גם סופי): לכל שורה, יתרה ראשונית ועוד ההתאמות. חשבון חדש מקבל שורה משלו.",
  "מסווגים למאזני ותוצאתי, מחשבים רווח, ומוסיפים אותו לעודפי הפתיחה.",
];
const CHECKS = [
  "עמודת ההתאמות מאוזנת: סך החובה שווה לסך הזכות.",
  "אין ״מראש״ במינוס, ואין חוזה שנגמר עם יתרה.",
  "ההפרש בעמודות המאזני שווה לרווח שחישבתם.",
  "המלאי נרשם לפי הנמוך מבין עלות לשווי מימוש נטו.",
];

/** Lesson 9: the summary exams, each a whole question with a neutral title, its whole solution behind one button. */
export const EXAM_LESSON_SCREENS: Record<string, ScreenContent> = {
  "ex-approach": {
    lead: "בבחינה אין רמז מאיזה שיעור השאלה. מה שעוזר הוא סדר עבודה קבוע, אותו סדר בכל שאלה.",
    body: (
      <>
        <p className="font-semibold text-fg">סדר העבודה בשאלת גיליון:</p>
        <ol className="space-y-1.5">
          {ORDER.map((x, i) => (
            <li key={x} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span>{x}</span>
            </li>
          ))}
        </ol>
        <p className="font-semibold text-fg">ולפני שמגישים, ארבע בדיקות:</p>
        <ul className="list-disc space-y-1 ps-5 marker:text-subtle">
          {CHECKS.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <Remember>שמונה המבחנים בשיעור הזה עולים בקושי. הארבעה הראשונים קצרים, והארבעה האחרונים הם גיליון מלא ברמת בוחן.</Remember>
      </>
    ),
  },

  "ex-1": {
    lead: "שנה ראשונה של חברה, מהפקודה הראשונה ועד מאזן הבוחן.",
    body: (
      <>
        <Time minutes={EXAM1.time} />
        <Given title={`נתון: ${EXAM1.name}`} asks={EXAM1.asks}>
          <Facts items={EXAM1.facts} />
        </Given>
        <WorkedReveal w={W_EXAM1} tryFirst="רשמו את כל הפקודות, העבירו לכרטיסי T, ובנו את מאזן הבוחן." />
      </>
    ),
  },

  "ex-2": {
    lead: "שנה שנגמרה, ושנה שמתחילה ממנה.",
    body: (
      <>
        <Time minutes={EXAM2.time} />
        <Given title={`נתון: ${EXAM2.name}, יתרות ליום 31.12.2024`} asks={EXAM2.asks}>
          <p>החברה הוקמה ב-1.1.2024. היתרות בספרים בסוף השנה הראשונה:</p>
          <ul className="divide-y divide-amber-500/20 text-[14.5px]">
            {Object.entries(EXAM2.tb2024).map(([a, v]) => (
              <li key={a} className="flex justify-between gap-3 py-1">
                <span>{a}</span>
                <Money v={Math.abs(v)} plain />
              </li>
            ))}
          </ul>
          <p className="pt-1 font-semibold">אירועי 2025:</p>
          <Facts items={EXAM2.facts2025} />
        </Given>
        <WorkedReveal w={W_EXAM2} tryFirst="מיינו את 2024, חשבו רווח ועודפים, ואז רשמו את 2025 עד מאזן הבוחן והעודפים." />
      </>
    ),
  },

  "ex-3": {
    lead: "שמונה נתונים לסוף השנה. חלקם התאמה, חלקם תיקון, ושניים מהם דורשים שתי פקודות כל אחד.",
    body: (
      <>
        <Time minutes={EXAM3.time} />
        <Given title={`נתון: ${EXAM3.name}, 31.12.2025`} asks={EXAM3.asks}>
          <Facts items={EXAM3.facts} />
        </Given>
        <WorkedReveal w={W_EXAM3} tryFirst="רשמו את כל הפקודות. שימו לב לשני הנתונים שדורשים שתי פקודות." />
      </>
    ),
  },

  "ex-5": {
    lead: "גיליון רב-טורי מלא, ברמת הבוחן. שתי יתרות חסרות, אחת מהן מהסיפור.",
    body: <WorksheetExamScreen x={EXAM5} w={W_EXAM5} />,
  },

  "ex-6": {
    lead: "גיליון רב-טורי מלא. יתרה אחת חסרה מסתתרת במשוואה.",
    body: <WorksheetExamScreen x={EXAM6} w={W_EXAM6} />,
  },

  "ex-7": {
    lead: "גיליון רב-טורי מלא. היתרה החסרה הפעם היא של ההפרשה, ומוצאים אותה מהלקוחות נטו.",
    body: <WorksheetExamScreen x={EXAM7} w={W_EXAM7} />,
  },

  "ex-8": {
    lead: "הגיליון הקשה בקורס: שלוש יתרות חסרות, שתי מכונות מאותה קנייה שנמכרו בשנים שונות, ותיקונים שמשנים את ההפרשה.",
    body: <WorksheetExamScreen x={EXAM8} w={W_EXAM8} />,
  },

  "ex-mixed": {
    lead: "תרגול מעורב מכל הקורס: 26 סוגי שאלות, בלי שם של נושא. כל לחיצה מביאה שאלה חדשה, וקודם מזהים מה היא דורשת.",
    body: <BasicsDrill lesson="all" />,
  },

  "ex-4": {
    lead: "לקוחות והפרשה, וחמישה נעלמים. כל נעלם מוביל לבא אחריו.",
    body: (
      <>
        <Time minutes={EXAM4.time} />
        <Given title={`נתון: ${EXAM4.name}`} asks={EXAM4.asks}>
          <Facts items={EXAM4.facts} />
        </Given>
        <WorkedReveal w={W_EXAM4} tryFirst="פתרו לפי הסדר: כל סעיף משתמש בתשובה של הקודם." />
      </>
    ),
  },
};
