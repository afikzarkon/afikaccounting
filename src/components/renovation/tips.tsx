import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { Tex } from "@/components/study/math";

const TIPS: { title: string; wrong: ReactNode; right: ReactNode }[] = [
  {
    title: "לא שוכחים פחת יחסי עד יום השיפוץ",
    wrong: "מוסיפים את עלות השיפוץ לערך בספרים של 1 בינואר.",
    right: "שיפוץ ב-1.7: קודם רושמים פחת לינואר עד יוני לפי הנתונים הישנים, ורק אז מוסיפים את העלות לערך בספרים המעודכן.",
  },
  {
    title: "שנת שיפוץ באמצע השנה בנויה משני חלקים",
    wrong: "מחשבים את כל השנה לפי הפחת החדש.",
    right: "פחת השנה = החודשים שלפני השיפוץ לפי הנתונים הישנים, ועוד החודשים שאחריו לפי הערך המותאם.",
  },
  {
    title: "הבסיס החדש הוא הערך בספרים — לא העלות המקורית",
    wrong: (
      <>
        <Tex>{String.raw`\text{עלות מקורית} + \text{שיפוץ} - \text{גרט}`}</Tex>
      </>
    ),
    right: (
      <>
        <Tex>{String.raw`\text{ערך בספרים ליום השיפוץ} + \text{שיפוץ} - \text{גרט חדש}`}</Tex>
      </>
    ),
  },
  {
    title: "מחלקים ביתרת אורך החיים",
    wrong: "מחלקים באורך החיים המקורי, או באורך החיים הכולל.",
    right: "מחלקים במספר השנים שנותרו מיום השיפוץ — כפי שנקבע אחרי השיפוץ.",
  },
  {
    title: "שינוי אומדן — לא מתקנים אחורה",
    wrong: "מחשבים מחדש את הפחת של השנים שלפני השיפוץ.",
    right: "השנים הקודמות נשארות כמו שהן; החישוב החדש חל מיום השיפוץ והלאה (סעיפים 51, 61).",
  },
  {
    title: "רכיב שמוחלף — גורעים את הישן",
    wrong: "מוסיפים את הגג החדש ומשאירים בספרים גם את הישן.",
    right: "סוגרים את העלות והפחת הנצבר של הגג הישן, היתרה — הפסד מגריעה, ורק אז מוסיפים את החדש (סעיפים 13, 70).",
  },
  {
    title: "תחזוקה שוטפת — הוצאה, גם כשהסכום גדול",
    wrong: "צביעת כל המפעל ב-80,000 ₪ — מוסיפים לנכס כי זה הרבה כסף.",
    right: "הגודל לא קובע. השאלה היא אם ההוצאה משפרת את הנכס, או רק שומרת על מצבו.",
  },
  {
    title: "סכום ספרות השנים — מכנה חדש",
    wrong: "ממשיכים עם המכנה המקורי (למשל 15).",
    right: (
      <>
        מכנה לפי יתרת השנים אחרי השיפוץ: <Tex>{String.raw`\frac{4 \times 5}{2} = 10`}</Tex>, ושנת החיים הראשונה מתחילה מחדש ביום השיפוץ.
      </>
    ),
  },
  {
    title: "יתרה פוחתת — שיעור חדש",
    wrong: "ממשיכים עם השיעור שחושב בזמן הרכישה.",
    right: (
      <>
        <Tex>{String.raw`1 - \left(\frac{\text{גרט חדש}}{\text{ערך מותאם}}\right)^{\frac{1}{\text{יתרת שנים}}}`}</Tex>
      </>
    ),
  },
];

export function RenovationTipsSection() {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-xl font-semibold text-fg">דגשים למבחן — הטעויות שעולות הכי הרבה נקודות</h3>
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
    </>
  );
}
