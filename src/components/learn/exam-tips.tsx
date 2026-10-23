import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { Tex } from "@/components/study/math";
import { type CheckItem, ExamChecklist } from "./widgets";

const TIPS: { title: string; wrong: ReactNode; right: ReactNode }[] = [
  {
    title: "פחת מיום הכניסה לשימוש, לא מיום התשלום",
    wrong: "שולם ב-1.2 → 11 חודשי פחת.",
    right: "זמין לשימוש ב-1.4 → 9 חודשים. התשלום, ההזמנה והייצור בפועל לא משנים דבר (סעיף 55).",
  },
  {
    title: "לא נסחפים מתחת לגרט",
    wrong: "ממשיכים להכפיל את היתרה בשיעור הקבוע עד סוף הלוח.",
    right: "בכל שנה בודקים שהיתרה בסוף ≥ גרט. בשנה שבה היא חוצה — הפחת הוא רק ההפרש, ואחריה אפס.",
  },
  {
    title: "ביתרה פוחתת — לא מנכים גרט מהבסיס",
    wrong: (
      <>
        <Tex>{String.raw`(\text{עלות} - \text{גרט}) \times \text{שיעור הפחת}`}</Tex> בשנה הראשונה.
      </>
    ),
    right: (
      <>
        <Tex>{String.raw`\text{עלות} \times \text{שיעור הפחת}`}</Tex>, ובכל שנה אחריה <Tex>{String.raw`\text{היתרה בספרים בתחילת השנה} \times \text{שיעור הפחת}`}</Tex>. הגרט כבר מגולם בשיעור — לא מנכים אותו.
      </>
    ),
  },
  {
    title: "סכום ספרות השנים באמצע שנה: השנה השנייה בנויה משני שברים",
    wrong: (
      <>
        השנה השנייה = <Tex>{String.raw`\text{סכום בר-פחת} \times \tfrac{4}{15}`}</Tex>.
      </>
    ),
    right: (
      <>
        <Tex>{String.raw`\text{סכום בר-פחת} \times \left(\tfrac{5}{15} \cdot \tfrac{3}{12} + \tfrac{4}{15} \cdot \tfrac{9}{12}\right)`}</Tex> — שארית שנת החיים הראשונה
        ועוד תחילת השנייה.
      </>
    ),
  },
  {
    title: "נכס ל-5 שנים שנכנס באמצע שנה — 6 שנות כספים",
    wrong: "הלוח נגמר אחרי 5 שורות, והגרט לא הושג.",
    right: "9 חודשים בשנה הראשונה, 4 שנים מלאות, ו-3 חודשים בשנה השישית.",
  },
  {
    title: "הדרכה, פרסום והפסדי הרצה — הוצאה",
    wrong: "מוסיפים לעלות כל מה שהופיע בחשבונית או בשאלה.",
    right: "רק עלויות ישירות להבאת הנכס למצב פעולה. גם מע״מ שניתן לקזז וריבית אשראי ספקים חריג אינם עלות (סעיפים 19–23).",
  },
  {
    title: "קרקע לא מופחתת",
    wrong: "מפחיתים את כל סכום הרכישה של \"מבנה וקרקע\".",
    right: "מפצלים: הקרקע נשארת בעלות, רק המבנה מופחת (סעיף 58).",
  },
  {
    title: "פחת לא נעצר כשהנכס עומד",
    wrong: "\"המכונה לא עבדה בחודשים 7–9, לכן אין פחת\".",
    right: "בשיטות מבוססות זמן הפחת ממשיך גם כשהנכס לא בשימוש — אלא אם השיטה היא יחידות תפוקה (סעיף 55).",
  },
  {
    title: "שינוי אומדן — מכאן ולהבא",
    wrong: "מתקנים את הפחת של השנים הקודמות.",
    right: "לוקחים את היתרה בספרים במועד השינוי, מנכים את הגרט החדש ומחלקים על יתרת החיים (סעיף 51).",
  },
];

const CHECKLIST: CheckItem[] = [
  { id: "start", text: "זיהיתי את מועד הכניסה לשימוש (ולא את מועד התשלום או הרכישה)", hint: "סימנתי בשאלה כל תאריך ושאלתי: האם הנכס כבר יכול לפעול?" },
  { id: "cost", text: "בניתי את העלות רק מעלויות ישירות", hint: "הדרכה, פרסום, הפסדי הרצה ומע״מ בר-קיזוז — נזקפו להוצאות." },
  { id: "land", text: "הפרדתי קרקע ממבנה ורכיבים משמעותיים זה מזה", hint: "קרקע לא מופחתת; כל רכיב לפי אורך החיים שלו." },
  { id: "base", text: "סכום בר-פחת = עלות − גרט (וביתרה פוחתת — השיעור מוחל על העלות המלאה)", hint: "בדקתי באיזו שיטה מדובר לפני שניכיתי." },
  { id: "months", text: "ספרתי את חודשי השימוש בשנה הראשונה: מחודש הכניסה (כולל) ועד דצמבר", hint: "ושמתי לב שהלוח מתארך לשנת כספים נוספת." },
  { id: "split", text: "בשנים שאחרי שנה א׳ פיצלתי נכון בין שנות חיים", hint: "סכום ספרות השנים: שני שברים בכל שנה; יתרה פוחתת: על היתרה בתחילת השנה." },
  { id: "floor", text: "היתרה בספרים לא ירדה מתחת לגרט בשום שנה", hint: "ובשנה האחרונה היא שווה לגרט בדיוק." },
  { id: "total", text: "סך הפחת בלוח = עלות − גרט", hint: "בדיקה של עשר שניות שתופסת כמעט כל טעות חשבון." },
  { id: "je", text: "רשמתי פקודה מאוזנת: ח׳ הוצאות פחת / ז׳ פחת נצבר", hint: "באותו סכום שבלוח, לשנה שנשאלה." },
];

export function ExamTipsSection() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-fg">טיפים מזהב — הטעויות שעולות הכי הרבה נקודות</h3>
          <p className="text-sm text-muted">בכל כרטיס: מה כותבים בטעות, ומה נכון.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TIPS.map((t, i) => (
          <article key={t.title} className="card flex flex-col overflow-hidden">
            <p className="flex items-start gap-2.5 px-4 pt-4 text-[15px] font-semibold text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-700 dark:text-amber-400">
                {i + 1}
              </span>
              {t.title}
            </p>
            <div className="mt-3 flex-1 space-y-2 px-4 pb-4 text-[13.5px] leading-relaxed">
              <p className="rounded-lg border border-danger/25 bg-danger/[0.05] px-3 py-2 text-fg/85">
                <span className="font-semibold text-danger">✗ טעות: </span>
                {t.wrong}
              </p>
              <p className="rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2 text-fg/85">
                <span className="font-semibold text-success">✓ נכון: </span>
                {t.right}
              </p>
            </div>
          </article>
        ))}
      </div>
      <ExamChecklist items={CHECKLIST} />
    </>
  );
}
