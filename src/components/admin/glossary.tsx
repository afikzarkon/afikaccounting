import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

export type Term = { term: string; meaning: ReactNode };

/** A folded "what each term means" list at the top of an admin page. */
export function Glossary({ title = "מה כל מושג אומר", intro, groups }: { title?: string; intro?: ReactNode; groups: { title: string; terms: Term[] }[] }) {
  return (
    <details className="card group mb-6 overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-fg">
        <BookOpen className="h-4 w-4 text-accent" aria-hidden />
        {title}
        <span className="ms-auto text-xs font-normal text-muted group-open:hidden">לחצו לפתיחה</span>
      </summary>
      <div className="border-t border-line px-5 py-5">
        {intro && <div className="mb-5 max-w-3xl text-sm leading-relaxed text-muted">{intro}</div>}
        <div className="grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <section key={g.title}>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-accent">{g.title}</h3>
              <dl className="space-y-3">
                {g.terms.map((t) => (
                  <div key={t.term}>
                    <dt className="text-sm font-semibold text-fg">{t.term}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-muted">{t.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}

/** What counts as a visit, a visitor and a person: shared by the dashboard and the funnel. */
export const WHO_TERMS: Term[] = [
  {
    term: "כניסה",
    meaning:
      "פתיחה של האתר בלשונית חדשה: הדף הראשון שהלשונית מראה, ומאיפה הגיעו אליו. מעבר בין דפים או ריענון באותה לשונית אינם כניסה חדשה. מי שפותח את האתר בשלוש לשוניות נספר שלוש פעמים.",
  },
  {
    term: "מבקר ייחודי",
    meaning:
      "דפדפן אחד, לפי מזהה אקראי שנשמר בו. אותו דפדפן ביום אחר הוא אותו מבקר. אותו אדם בטלפון ובמחשב הוא שני מבקרים, וגלישה בסתר או מחיקת נתוני האתר יוצרות מבקר חדש. נמדד מ-8.11.2026; פעילות מלפני כן נספרת לפי לשונית.",
  },
  {
    term: "אנשים (הערכה)",
    meaning:
      "כשמישהו מחובר, כל הדפדפנים שבהם התחבר אי פעם נספרים כאדם אחד, גם בביקורים שבהם לא היה מחובר. מי שמעולם לא התחבר נספר לפי דפדפן. האתר סגור, אז כמעט כל שימוש אמיתי הוא של משתמש מחובר: זה המספר הקרוב ביותר למספר האנשים.",
  },
  { term: "משתמשים מחוברים", meaning: "חשבונות שהיו מחוברים בזמן שנרשמה פעילות. כל חשבון נספר פעם אחת, מכל מכשיר." },
  {
    term: "סשן",
    meaning: "לשונית דפדפן אחת, מהפתיחה ועד הסגירה. זה המזהה הוותיק ביותר בנתונים, ולכן הוא עדיין מופיע, אבל הוא סופר לשוניות ולא אנשים.",
  },
  {
    term: "מה לא נספר",
    meaning:
      "שרתי פיתוח ותצוגות מקדימות (רק האתר החי נרשם); מנהלים, וכל דפדפן שנפתח בו האדמין, גם כשאינו מחובר; דפי האדמין עצמם; ואותו דף שנפתח שוב באותה לשונית בתוך 30 שניות (ריענון). כלל זה חל מאז שהתיקון עלה; נתונים מלפני כן כוללים גם את אלה.",
  },
];
