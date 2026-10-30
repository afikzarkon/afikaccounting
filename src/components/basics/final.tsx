import { Layers, Printer } from "lucide-react";
import { creditLoss, TZAAD } from "@/lib/learn/basics";
import { Glossary } from "./glossary";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { PrintButton } from "./print-button";
import { Tabs } from "./tabs";
import { KeyCard, Rule } from "./ui";
import { Worksheet } from "./worksheet";

const MISTAKES: [string, string][] = [
  ["רושמים משיכת בעלים כהוצאה", "משיכה מקטינה את ההון (ח׳ הון בעלים), ולא נכנסת לרווח והפסד."],
  ["רושמים קניית מחשב כהוצאה", "רכוש שישמש יותר משנה הוא נכס — ח׳ מחשב, לא ח׳ הוצאות."],
  ["רושמים מקדמה מלקוח כמכירה", "עד האספקה זו התחייבות — מקדמות מלקוחות בזכות."],
  ["רושמים פירעון הלוואה כהוצאה", "רק הריבית היא הוצאה. החזר הקרן מקטין את ההלוואה."],
  ["מבלבלים בין ספקים ללקוחות", "ספקים — אנחנו חייבים להם (זכות). לקוחות — הם חייבים לנו (חובה)."],
  ["שוכחים מלאי סגירה", "בלי מלאי סגירה כל הקניות נראות כהוצאה, והרווח יוצא נמוך מדי."],
  ["מעבירים חשבון תוצאתי לשנה הבאה", "הכנסות והוצאות מתחילות כל שנה מאפס; רק התוצאה עוברת לעודפים."],
  ["רושמים הוצאה של השנה רק כשמשלמים", "בסיס מצטבר: שכר דצמבר שייך לדצמבר גם אם ישולם בינואר."],
  ["רושמים חוב אבוד כהוצאה", "החוב נמחק כנגד ההפרשה (ח׳ הפרשה / ז׳ לקוחות). ההוצאה נקבעת רק בהשלמת ההפרשה."],
];

const FAQ: [string, string][] = [
  ["למה ימין הוא חובה?", "זו מוסכמה של הרישום: בכרטיס T החובה מימין והזכות משמאל. מה שחשוב הוא העיקרון — מקבל בחובה, נותן בזכות."],
  ["חובה זה דבר רע?", "לא. 'חובה' היא רק שם של צד. מזומן בחובה הוא דבר טוב — זה כסף שיש לעסק."],
  ["למה עודפים יכולים להיות בחובה?", "כשהעסק הפסיד לאורך השנים יותר משהרוויח, היתרה עוברת לחובה. קוראים לזה הפסדים צבורים."],
  ["מה ההבדל בין מאזן למאזן בוחן?", "מאזן בוחן הוא כלי עבודה פנימי עם כל היתרות. המאזן הוא דוח, עם החשבונות המאזניים בלבד."],
  ["אם מאזן הבוחן מאוזן — אין טעויות?", "לא בהכרח. פקודה שלמה בחשבון הלא נכון, או פקודה שנשכחה, לא יפריעו לאיזון. האיזון תופס רק טעויות חד-צדדיות."],
  ["למה הוצאות מראש הן נכס?", "כי שילמתם על משהו שעוד תקבלו — חודשי ביטוח או שימוש. זה ערך שיש לעסק."],
];

const tzaad = creditLoss(TZAAD);

export const FINAL_SCREENS: Record<string, ScreenContent> = {
  worksheet: {
    lead: "גיליון רב-טורי מוביל, בטבלה אחת, ממאזן הבוחן לפני ההתאמות ועד הרווח ויתרת העודפים בסוף השנה.",
    body: (
      <>
        <KeyCard icon={<Layers className="h-5 w-5" />}>כל מה שלמדנו עד עכשיו נועד להגיע לרגע הזה: מרכזים הכול בגיליון אחד.</KeyCard>
        <p>
          <strong>העמודה הראשונה היא נקודת הפתיחה:</strong> מאזן הבוחן לפני ההתאמות, כפי שמקבלים אותו בשאלה. כל עמודה אחריה נבנית על הקודמת. הנה הגיליון של רונן, מ<ScreenLink id="ronen">הדוגמה המלאה בשיעור ההתאמות</ScreenLink>:
        </p>
        <Worksheet />
        <Rule>עודפי סגירה = עודפי פתיחה + רווח השנה (או פחות הפסד השנה).</Rule>
      </>
    ),
  },
};

/** The course's reference: a one-page cheat sheet (printable), the glossary, common mistakes and questions. */
export function BasicsReference() {
  return (
        <Tabs
          label="כלי עזר"
          tabs={[
            {
              id: "sheet",
              label: "גיליון עזר",
              content: (
                <section id="cheatsheet" className="card print-sheet p-4" aria-labelledby="cheatsheet-title">
                  <div className="flex items-center gap-3">
                    <h3 id="cheatsheet-title" className="me-auto text-base font-semibold text-fg">
                      גיליון עזר — עמוד אחד
                    </h3>
                    <PrintButton icon={<Printer className="h-4 w-4" />} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Sheet title="מהי חשבונאות">זיהוי (מה קרה) ← מדידה (כמה) ← דיווח (רישום ודוחות).</Sheet>
                    <Sheet title="ארבעת השלבים">פקודת יומן ← כרטיסי T ← מאזן בוחן ← דוחות כספיים.</Sheet>
                    <Sheet title="כלל הזהב">מקבל (נכנס) = חובה · נותן (יוצא) = זכות · סך החובה = סך הזכות.</Sheet>
                    <Sheet title="חמשת הסוגים">נכסים והוצאות — גדלים בחובה. התחייבויות, הון והכנסות — גדלים בזכות.</Sheet>
                    <Sheet title="הזהות">נכסים = התחייבויות + הון.</Sheet>
                    <Sheet title="יתרת סגירה">סך חובה מול סך זכות; היתרה בצד הגדול, בגובה ההפרש.</Sheet>
                    <Sheet title="מאזני / תוצאתי">מאזני ממשיך לשנה הבאה. תוצאתי מתאפס בכל 1.1, והרווח עובר לעודפים.</Sheet>
                    <Sheet title="עודפים">פתיחה + רווח (− הפסד) = סגירה. חברה חדשה: פתיחה 0. יתרה בחובה = הפסדים צבורים.</Sheet>
                    <Sheet title="חשבונות חתך">הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.</Sheet>
                    <Sheet title="עלות המכר">מלאי פתיחה + קניות − מלאי סגירה. המלאי — בנמוך מבין עלות לשווי מימוש נטו.</Sheet>
                    <Sheet title="הפסדי אשראי">
                      הוצאה = הפרשה נדרשת − מה שיש בה. בדוגמה: {tzaad.required.toLocaleString("he-IL")} − {tzaad.before.toLocaleString("he-IL")} ={" "}
                      {tzaad.expense.toLocaleString("he-IL")}.
                    </Sheet>
                  </div>
                </section>
              ),
            },
            { id: "glossary", label: "מילון", content: <Glossary /> },
            {
              id: "mistakes",
              label: "טעויות נפוצות",
              content: (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {MISTAKES.map(([wrong, right]) => (
                    <li key={wrong} className="rounded-xl border border-line bg-surface p-3 text-sm">
                      <span className="font-semibold text-danger">✗ {wrong}</span>
                      <span className="mt-0.5 block text-fg/85">✓ {right}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              id: "faq",
              label: "שאלות נפוצות",
              content: (
                <div className="card divide-y divide-line px-4">
                  {FAQ.map(([q, a]) => (
                    <details key={q} className="group py-2.5">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                        <span className="me-1 inline-block text-accent transition-transform group-open:-rotate-90">‹</span> {q}
                      </summary>
                      <p className="mt-1.5 text-sm text-fg/85">{a}</p>
                    </details>
                  ))}
                </div>
              ),
            },
          ]}
        />
  );
}

function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-xs font-semibold text-accent">{title}</p>
      <p className="mt-1 text-fg">{children}</p>
    </div>
  );
}
