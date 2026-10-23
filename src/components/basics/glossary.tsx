"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";

const TERMS: [string, string, string][] = [
  ["חשבונאות", "Accounting", "שפה שמתרגמת את פעילות העסק למספרים לפי כללים אחידים."],
  ["ישות נפרדת", "Separate Entity", "העסק נמדד בנפרד מבעליו; רק העסקאות של העסק נרשמות בספריו."],
  ['חברה בע"מ', "Limited Company", "חברה שבעליה מסתכנים לכל היותר בסכום שהשקיעו."],
  ["חשבון", "Account", "דף בספרים שבו נרשם כל מה שקשור לנושא אחד."],
  ["חובה (ח')", "Debit", "הצד הימני של חשבון; שם נרשם ערך שהעסק מקבל."],
  ["זכות (ז')", "Credit", "הצד השמאלי של חשבון; שם נרשם ערך שהעסק נותן."],
  ["נכסים", "Assets", "מה שהעסק מחזיק ויפיק ממנו תועלת בעתיד. יתרה בחובה."],
  ["התחייבויות", "Liabilities", "מה שהעסק חייב לאחרים. יתרה בזכות."],
  ["הון", "Equity", "מה ששייך לבעלים: השקעה ועוד רווחים שנצברו. יתרה בזכות."],
  ["הון בעלים / הון מניות", "Owner's Equity / Share Capital", "ההשקעה של הבעלים בעסק."],
  ["הכנסות", "Income / Revenue", "מה שהעסק הרוויח בתקופה. יתרה בזכות."],
  ["הוצאות", "Expenses", "מה שהעסק צרך בתקופה כדי לפעול. יתרה בחובה."],
  ["הזהות החשבונאית", "Accounting Equation", "נכסים = התחייבויות + הון — תמיד."],
  ["השקעה", "Capital Expenditure", "קנייה שתשמש יותר משנה ואפשר למכור אותה — נרשמת כנכס."],
  ["רישום כפול", "Double-Entry Bookkeeping", "כל אירוע נרשם לפחות בשני חשבונות, וסך החובה = סך הזכות."],
  ["פקודת יומן", "Journal Entry", "רישום של אירוע אחד: החשבונות בחובה ובזכות והסכומים."],
  ["קניות", "Purchases", "חשבון שבו נרשמת קניית סחורה למכירה."],
  ["מכירות", "Sales", "חשבון ההכנסה ממכירת סחורה."],
  ["ספקים", "Accounts Payable", "מי שהעסק חייב לו על סחורה שקיבל."],
  ["לקוחות", "Accounts Receivable", "מי שחייב לעסק על סחורה שקנה."],
  ["זכאים", "Other Payables", "מי שהעסק חייב לו, שאינו ספק סחורה."],
  ["חייבים", "Other Receivables", "מי שחייב לעסק, שאינו לקוח שקנה סחורה."],
  ["מקדמות מלקוחות", "Customer Advances", "כסף שהתקבל לפני האספקה — התחייבות."],
  ["מקדמות לספקים", "Advances to Suppliers", "כסף ששולם לספק לפני האספקה — נכס."],
  ["צ'ק דחוי", "Post-Dated Check", "צ'ק שייפרע בתאריך מאוחר; עד אז נחשב חוב."],
  ["בסיס מצטבר", "Accrual Basis", "רושמים עסקה כשהיא קורית, לא כשהכסף עובר."],
  ["כרטיס T", "T-Account", "חשבון בצורת T: חובה מימין, זכות משמאל."],
  ["כרטסת / ספר ראשי", "General Ledger", "כל כרטיסי החשבונות של העסק."],
  ["יתרת פתיחה", "Opening Balance", "היתרה בחשבון בתחילת התקופה."],
  ["יתרת סגירה", "Closing Balance", "ההפרש בין סך החובה לסך הזכות בסוף התקופה."],
  ["מאזן בוחן", "Trial Balance", "טבלה של כל היתרות ליום מסוים; סך החובה = סך הזכות."],
  ["חשבון מאזני", "Balance Sheet Account", "נכס, התחייבות או הון; עובר משנה לשנה."],
  ["חשבון תוצאתי", "Income Statement Account", "הכנסה או הוצאה; מתאפס בסוף כל שנה."],
  ["דוח רווח והפסד", "Income Statement", "הכנסות פחות הוצאות לתקופה."],
  ["מאזן", "Balance Sheet", "נכסים מול התחייבויות והון ליום מסוים."],
  ["עודפים", "Retained Earnings", "הרווחים שנצברו בעסק לאורך השנים."],
  ["הפסדים צבורים", "Accumulated Deficit", "עודפים עם יתרה בחובה — ההפסדים גדולים מהרווחים."],
  ["עיקרון ההקבלה", "Matching Principle", "ההוצאות נרשמות באותה תקופה כמו ההכנסות שבגללן הוצאו."],
  ["חשבונות חתך", "Accruals and Deferrals", "ארבעה חשבונות מאזניים שמשייכים הכנסות והוצאות לשנה הנכונה."],
  ["הוצאות מראש", "Prepaid Expenses", "שולם עכשיו על הטבה עתידית — נכס."],
  ["הוצאות לשלם", "Accrued Expenses", "נוצלו השנה ועוד לא שולמו — התחייבות."],
  ["הכנסות מראש", "Unearned Revenue", "התקבלו עכשיו על משהו שעוד יינתן — התחייבות."],
  ["הכנסות לקבל", "Accrued Revenue", "הורווחו השנה ועוד לא התקבלו — נכס."],
  ["פקודת התאמה", "Adjusting Entry", "פקודה בסוף השנה שמשייכת הכנסה או הוצאה לשנה הנכונה."],
  ["פקודת תיקון", "Correcting Entry", "פקודה שמגשרת בין מה שנרשם בטעות למה שצריך."],
  ["גיליון רב-טורי", "Worksheet", "טבלה שמובילה ממאזן בוחן ראשוני לרווח ולעודפים בכמה עמודות."],
  ["מלאי סגירה", "Closing Inventory", "סחורה שלא נמכרה עד סוף השנה — נכס."],
  ["עלות המכר", "Cost of Sales", "מלאי פתיחה + קניות − מלאי סגירה."],
  ["הפרשה להפסדי אשראי חזויים", "Allowance for Expected Credit Losses", "אומדן החובות שלא ייגבו; מקטין את הלקוחות במאזן."],
  ["חוב אבוד", "Bad Debt Write-Off", "חוב שברור שלא ייגבה; נמחק מהלקוחות כנגד ההפרשה."],
];

export function Glossary() {
  const id = useId();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const rows = TERMS.filter(([he, en, d]) => !query || he.includes(query) || en.toLowerCase().includes(query) || d.includes(query));
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-surface-2/50 p-4">
        <label htmlFor={id} className="block text-sm font-semibold text-fg">
          חיפוש במילון — בעברית או באנגלית
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-subtle" aria-hidden />
          <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="למשל: מאזן, Accrual" className={cn(inputClass, "ps-9")} />
        </div>
        <p className="mt-1 text-xs text-muted" aria-live="polite">
          {rows.length} מונחים
        </p>
      </div>
      <dl className="max-h-[32rem] divide-y divide-line overflow-y-auto">
        {rows.map(([he, en, d]) => (
          <div key={he} className="grid gap-x-4 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <dt>
              <span className="font-semibold text-fg">{he}</span>
              <bdi dir="ltr" className="ms-2 text-xs text-muted">
                {en}
              </bdi>
            </dt>
            <dd className="text-sm text-fg/85">{d}</dd>
          </div>
        ))}
        {rows.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">לא נמצא מונח. נסו מילה אחרת.</p>}
      </dl>
    </div>
  );
}
