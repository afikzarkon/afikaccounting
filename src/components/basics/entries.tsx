import { Laptop, Receipt } from "lucide-react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { SIMPLE } from "@/lib/study/basics/shared";
import { ActionFinder } from "./action-finder";
import { EquationWidget } from "./equation-widget";
import { ExpenseSorter } from "./expense-sorter";
import { EntryFlow } from "./entry-flow";
import { TIntro } from "./t-accounts";
import { Card, Money, Term } from "./ui";

// Expense or investment, row by row: what it is, where it is reported, what it does to profit on the day it is paid.
const EXPENSE_VS_ASSET: [string, string, string][] = [
  ["מה זה", "משהו שנוצל ונגמר", "משהו שנשאר בעסק ושווה כסף"],
  ["איפה מופיע", "בדוח רווח והפסד", "במאזן, ברשימת הנכסים"],
  ["ביום התשלום", "מקטין את הרווח", "הרווח לא משתנה — מזומן הפך לנכס"],
  ["דוגמאות", "שכירות, חשמל, משכורות, פרסום", "תנור, מחשב, רכב, ריהוט"],
];

const TERMS: [string, string][] = [
  ["ספקים", "מי שהעסק חייב לו על סחורה"],
  ["לקוחות", "מי שחייב לעסק על סחורה שקנה"],
  ["זכאים", "מי שהעסק חייב לו — לא על סחורה"],
  ["חייבים", "מי שחייב לעסק — לא על סחורה"],
  ["צ'ק דחוי", "ייפרע בתאריך מאוחר; עד אז — חוב"],
];

export const ENTRIES_SCREENS: Record<string, ScreenContent> = {
  equation: {
    lead: "נכסים = התחייבויות + הון. כל מה שיש לעסק הגיע ממישהו: מאחרים (התחייבויות) או מהבעלים (הון).",
    body: (
      <>
        <div className="flex flex-wrap items-stretch justify-center gap-2 rounded-2xl bg-surface-2/70 p-4 text-center sm:gap-3" role="math" aria-label="נכסים שווה התחייבויות ועוד הון">
          <IdentityPart name="נכסים" hint="מה יש לעסק" />
          <span className="self-center text-2xl font-bold text-muted" aria-hidden>
            =
          </span>
          <IdentityPart name="התחייבויות" hint="מה העסק חייב לאחרים" />
          <span className="self-center text-2xl font-bold text-muted" aria-hidden>
            +
          </span>
          <IdentityPart name="הון" hint="מה ששייך לבעלים" />
        </div>
        <p>
          כל פעולה משנה את המשוואה בשני מקומות לפחות, והיא תמיד נשארת מאוזנת. נסו כאן על ארבע הפעולות הראשונות של עסק קטן. את העסק כולו, עם כרטיסי ה-T, תראו בהמשך השיעור — ב<ScreenLink id="lab" />.
        </p>
        <EquationWidget count={4} />
      </>
    ),
  },

  expense: {
    lead: "כל תשלום של העסק הוא אחד משניים: הוצאה — משהו שנוצל ונגמר, או השקעה — משהו שימשיך לשרת את העסק גם בעתיד, ולכן הוא נכס.",
    body: (
      <>
        <p>
          כשהעסק משלם, הכסף יוצא — אבל לא תמיד הוא &quot;נעלם&quot;. לפעמים הוא נוצל וזהו (שכירות, חשמל, משכורות), ולפעמים הוא רק החליף צורה: מזומן הפך לתנור, למחשב או לרכב
          — דברים שעדיין שייכים לעסק ושווים כסף. השאלה לבדיקה: <strong>האם זה ימשיך לשרת את העסק אחרי היום, ואפשר למכור את זה?</strong> כן — השקעה. לא — הוצאה.
        </p>
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] bg-surface-2 px-3 py-2 text-[12.5px] font-bold text-muted">
            <span />
            <span className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-danger" aria-hidden /> הוצאה
            </span>
            <span className="flex items-center gap-1.5">
              <Laptop className="h-4 w-4 text-success" aria-hidden /> השקעה (נכס)
            </span>
          </div>
          {EXPENSE_VS_ASSET.map(([row, expense, asset]) => (
            <div key={row} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 border-t border-line px-3 py-2.5 text-[14px]">
              <span className="font-semibold text-muted">{row}</span>
              <span className="text-fg">{expense}</span>
              <span className="text-fg">{asset}</span>
            </div>
          ))}
        </div>
        <Card title="דוגמה: המאפייה שילמה החודש 35,000 ₪">
          <p>
            <Money v={5_000} /> שכירות לחודש, ו-<Money v={30_000} /> על תנור חדש. מכרה באותו חודש ב-<Money v={12_000} />.
          </p>
          <ul className="list-disc space-y-1 ps-5 marker:text-subtle">
            <li>
              השכירות נוצלה החודש — הוצאה. הרווח: <Money v={12_000} /> − <Money v={5_000} /> = <strong><Money v={7_000} /></strong>.
            </li>
            <li>התנור לא נכנס לחישוב הרווח: <Money v={30_000} /> מזומן הפכו לתנור ששווה <Money v={30_000} />. לעסק יש בדיוק אותו שווי — רק בצורה אחרת.</li>
            <li>מי שהיה רושם גם את התנור כהוצאה היה מראה הפסד של <Money v={23_000} /> — בחודש שבו העסק בכלל הרוויח.</li>
          </ul>
        </Card>
        <ExpenseSorter />
      </>
    ),
  },

  double: {
    lead: (
          <>
            כל אירוע נרשם פעמיים: <span className="text-debit">ערך שנכנס (מקבל) — חובה</span>, <span className="text-credit">ערך שיוצא (נותן) — זכות</span>. סך החובה תמיד שווה
            לסך הזכות.
          </>
    ),
    body: (
      <>
        <p>
          הרישום של אירוע נקרא <Term he="פקודת יומן" />. כך קוראים אותה: למעלה — שורות החובה (<span className="font-semibold text-debit">ח׳</span>), מה שהעסק
          קיבל. מתחתן, מוזחות פנימה — שורות הזכות (<span className="font-semibold text-credit">ז׳</span>), מה שהעסק נתן. ליד כל שורה הסכום, וסך החובה תמיד שווה לסך
          הזכות.
        </p>
        <p>
          הנה <strong>פקודה פשוטה</strong> — חשבון אחד בכל צד. והחיצים מראים לאן עוברת כל שורה שלה:
        </p>
        <EntryFlow entry={SIMPLE} note="העסק קיבל חודש שימוש במבנה (חובה) ונתן מזומן (זכות)." aside={<TIntro />} />
      </>
    ),
  },
  actions: {
    lead: "רוב הפעולות בעסק חוזרות על עצמן — ולכל אחת יש פקודה קבועה. מכירים אותן, ורוב פקודות היומן כבר כתובות.",
    body: (
      <>
        <p>מי שהעסק חייב לו, ומי שחייב לעסק, מקבלים בחשבונאות שמות קבועים:</p>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TERMS.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface px-3 py-2">
              <dt className="text-[14px] font-bold text-fg">{t}</dt>
              <dd className="text-[12.5px] leading-snug text-muted">{d}</dd>
            </div>
          ))}
        </dl>
        <ActionFinder />
      </>
    ),
  },
};

function IdentityPart({ name, hint }: { name: string; hint: string }) {
  return (
    <span className="min-w-[6.5rem] rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="block text-xl font-bold text-fg">{name}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </span>
  );
}
