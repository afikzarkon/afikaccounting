import { Printer } from "lucide-react";
import { creditLoss, KESEM } from "@/lib/learn/basics";
import { Glossary } from "./glossary";
import { PrintButton } from "./print-button";
import { Practice } from "./practice";
import { Chapter, Rule, Term } from "./ui";
import { Worksheet } from "./worksheet";

const MISTAKES: [string, string][] = [
  ["רושמים משיכת בעלים כהוצאה", "משיכה מקטינה את ההון (ח' הון בעלים), ולא נכנסת לרווח והפסד."],
  ["רושמים קניית מחשב כהוצאה", "רכוש שישמש יותר משנה הוא נכס — ח' מחשב, לא ח' הוצאות."],
  ["רושמים מקדמה מלקוח כמכירה", "עד האספקה זו התחייבות — מקדמות מלקוחות בזכות."],
  ["רושמים פירעון הלוואה כהוצאה", "רק הריבית היא הוצאה. החזר הקרן מקטין את ההלוואה."],
  ["מבלבלים בין ספקים ללקוחות", "ספקים — אנחנו חייבים להם (זכות). לקוחות — הם חייבים לנו (חובה)."],
  ["שוכחים מלאי סגירה", "בלי מלאי סגירה כל הקניות נראות כהוצאה, והרווח יוצא נמוך מדי."],
  ["מעבירים חשבון תוצאתי לשנה הבאה", "הכנסות והוצאות מתחילות כל שנה מאפס; רק התוצאה עוברת לעודפים."],
  ["רושמים הוצאה של השנה רק כשמשלמים", "בסיס מצטבר: שכר דצמבר שייך לדצמבר גם אם ישולם בינואר."],
  ["מחשבים הפרשה כללית על כל הלקוחות", "קודם מוחקים חובות אבודים ומוציאים את מי שהופרש לו ספציפית."],
];

const FAQ: [string, string][] = [
  ["למה ימין הוא חובה? אצלי בראש זה הפוך", "זו מוסכמה של הרישום בעברית: בכרטיס T החובה מימין והזכות משמאל. מה שחשוב הוא העיקרון — מקבל בחובה, נותן בזכות — לא הצד הפיזי."],
  ["חובה זה דבר רע?", "לא. 'חובה' היא רק שם של צד. מזומן בחובה הוא דבר טוב — זה כסף שיש לעסק."],
  ["למה עודפים יכולים להיות בחובה?", "כשהעסק הפסיד יותר משהרוויח לאורך השנים, העודפים 'נגמרים' והיתרה עוברת לחובה. קוראים לזה הפסדים צבורים."],
  ["מה ההבדל בין מאזן למאזן בוחן?", "מאזן בוחן הוא כלי עבודה פנימי עם כל היתרות. המאזן הוא דוח ללקוחות, לבנק ולמשקיעים, עם החשבונות המאזניים בלבד."],
  ["אם המאזן הבוחן מאוזן — אין טעויות?", "לא בהכרח. אם רשמתם פקודה שלמה בחשבון הלא נכון, או שכחתם אותה לגמרי, המאזן עדיין יתאזן. האיזון תופס רק טעויות חד-צדדיות."],
  ["למה הוצאות שכירות מראש הן נכס?", "כי שילמתם על משהו שעוד תקבלו — חודשי שימוש במבנה. זה ערך שיש לעסק, בדיוק כמו מזומן."],
];

export function FinalChapters() {
  const kesem = creditLoss(KESEM);
  return (
    <>
      <Chapter n={15} id="worksheet" title="גיליון רב-טורי" lead="כל ההתאמות של סוף השנה — בטבלה אחת, צעד אחר צעד">
        <p>
          <Term he="גיליון רב-טורי" /> מרכז בטבלה אחת את כל הדרך: ממאזן הבוחן הראשוני, דרך פקודות ההתאמה, ועד הרווח ויתרת העודפים בסוף
          השנה. כל זוג עמודות — חובה וזכות — חייב להיות מאוזן. הנה הגיליון של רונן מפרק 12, שלב אחר שלב:
        </p>
        <Worksheet />
        <Rule>עודפי סגירה = עודפי פתיחה + רווח השנה (או פחות הפסד השנה).</Rule>
      </Chapter>

      <Chapter n={16} id="practice" title="תרגול" lead="15 שאלות חדשות בשלוש רמות — עם משוב מיידי ופתרון מלא">
        <p>התשובות נשמרות בדפדפן הזה, כך שאפשר לחזור ולהמשיך. ההתקדמות נספרת לפי תשובות נכונות.</p>
        <Practice />
      </Chapter>

      <Chapter n={17} id="summary" title="סיכום וכלי עזר" lead="מילון, גיליון עזר, טעויות נפוצות ושאלות שחוזרות">
        <Glossary />

        <section id="cheatsheet" className="card print-sheet p-5" aria-labelledby="cheatsheet-title">
          <div className="flex items-center gap-3">
            <h3 id="cheatsheet-title" className="me-auto text-lg font-semibold text-fg">
              גיליון עזר — עמוד אחד
            </h3>
            <PrintButton icon={<Printer className="h-4 w-4" />} />
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Sheet title="כלל הזהב">מקבל (נכנס) = חובה · נותן (יוצא) = זכות · סך החובה = סך הזכות.</Sheet>
            <Sheet title="חמשת הסוגים">נכסים והוצאות — גדלים בחובה. התחייבויות, הון והכנסות — גדלים בזכות.</Sheet>
            <Sheet title="הזהות">נכסים = התחייבויות + הון (הון = השקעה − משיכות + רווחים שנצברו).</Sheet>
            <Sheet title="ארבעת השלבים">פקודת יומן ← כרטיסי T ← מאזן בוחן ← דוחות כספיים.</Sheet>
            <Sheet title="יתרת סגירה">סך חובה מול סך זכות; היתרה בצד הגדול, בגובה ההפרש.</Sheet>
            <Sheet title="מאזני / תוצאתי">מאזני עובר לשנה הבאה. תוצאתי מתאפס, והתוצאה עוברת לעודפים.</Sheet>
            <Sheet title="חשבונות חתך">הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.</Sheet>
            <Sheet title="עלות המכר">מלאי פתיחה + קניות − מלאי סגירה. פקודה: ח&apos; מלאי סגירה מאזני / ז&apos; מלאי סגירה רווח או הפסד.</Sheet>
            <Sheet title="הפסדי אשראי">
              נדרשת = ספציפית + כללית (על השאר). הוצאה = נדרשת − קיימת אחרי מחיקות. בדוגמה: {kesem.required.toLocaleString("he-IL")} −{" "}
              {kesem.existingAfter.toLocaleString("he-IL")} = {kesem.expense.toLocaleString("he-IL")}.
            </Sheet>
            <Sheet title="גיליון רב-טורי">ראשוני ← התאמות ← סופי ← סיווג ← תוצאתי ומאזני ← רווח ← עודפי סגירה.</Sheet>
            <Sheet title="עודפים">פתיחה + רווח (− הפסד) = סגירה. יתרה בחובה = הפסדים צבורים.</Sheet>
            <Sheet title="הוצאה או השקעה?">יותר משנה ואפשר למכור — השקעה (נכס). אחרת — הוצאה.</Sheet>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-fg">טעויות נפוצות של מתחילים</h3>
            <ul className="mt-3 space-y-2.5">
              {MISTAKES.map(([wrong, right]) => (
                <li key={wrong} className="text-sm">
                  <span className="font-semibold text-danger">✗ {wrong}</span>
                  <span className="mt-0.5 block text-fg/85">✓ {right}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-fg">שאלות נפוצות</h3>
            <div className="mt-3 divide-y divide-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-2">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                    <span className="me-1 inline-block text-accent transition-transform group-open:rotate-90">‹</span> {q}
                  </summary>
                  <p className="mt-1.5 text-sm text-fg/85">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Chapter>
    </>
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
