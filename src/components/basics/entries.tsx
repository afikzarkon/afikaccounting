import { Laptop, Receipt } from "lucide-react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { SIMPLE } from "@/lib/study/basics/shared";
import { ActionFinder } from "./action-finder";
import { EquationWidget } from "./equation-widget";
import { ExpenseSorter } from "./expense-sorter";
import { MiniQuiz } from "./inventory-interactive";
import { EntryFlow } from "./entry-flow";
import { TIntro } from "./t-accounts";
import { Card, Money, Term } from "./ui";

// Expense or investment, row by row: what it is, where it is reported, what it does to profit on the day it is paid.
const EXPENSE_VS_ASSET: [string, string, string][] = [
  ["מה זה", "משהו שעבד בשבילנו עכשיו — ונגמר", "משהו שימשיך לעבוד בשבילנו גם בשנה הבאה"],
  ["איפה מופיע", "בדוח רווח והפסד", "במאזן, ברשימת הנכסים"],
  ["ביום התשלום", "מקטין את הרווח", "הרווח לא משתנה — הכסף החליף צורה"],
  ["דוגמאות", "שכירות, חשמל, שכר, פרסום", "מכונה, מחשב, רכב, ריהוט"],
];

// Who owes whom, by name: the four accounts for money that will move later.
const TERMS: [string, string][] = [
  ["לקוחות", "קנו מאיתנו סחורה או שירות, ועוד לא שילמו"],
  ["ספקים", "מכרו לנו סחורה למכירה, ועוד לא שילמנו להם"],
  ["חייבים", "חייבים לנו על משהו שאינו מכירה רגילה — למשל ריבית או שכירות"],
  ["זכאים", "אנחנו חייבים להם על משהו שאינו סחורה — ציוד, שיפוץ, שירות"],
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
        <MiniQuiz
          prefix="basics"
          chapter="equation"
          items={[
            {
              q: "לעסק נכסים של 90,000 ₪ והתחייבויות של 35,000 ₪. מה ההון?",
              options: ["55,000", "125,000", "35,000", "90,000"],
              answer: 0,
              why: "הון = נכסים − התחייבויות: 90,000 − 35,000 = 55,000.",
            },
            {
              q: "העסק לקח הלוואה של 20,000 ₪. מה קרה למשוואה?",
              options: ["נכסים +20,000 והתחייבויות +20,000", "נכסים +20,000 והון +20,000", "רק הנכסים גדלו", "שום דבר לא השתנה"],
              answer: 0,
              why: "נכנס כסף (נכס), ונוצר חוב לבנק (התחייבות). שני הצדדים גדלו באותו סכום, והמשוואה מאוזנת.",
            },
          ]}
        />
      </>
    ),
  },

  expense: {
    lead: "על כל תשלום שואלים שאלה אחת: האם מה שקנינו ימשיך לעבוד בשבילנו גם בשנה הבאה? כן — השקעה, כלומר נכס. לא — הוצאה.",
    body: (
      <>
        <p>
          כשהעסק משלם, הכסף יוצא — אבל הוא לא תמיד ״נעלם״. שכירות של החודש, חשמל, שכר: עבדו בשבילנו החודש, ונגמרו. מכונה, מחשב או רכב: הכסף רק החליף צורה,
          והם ימשיכו לעבוד בשבילנו עוד שנים. לכן השאלה לבדיקה: <strong>האם זה עוד יעבוד בשבילנו בשנה הבאה?</strong>
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
        <Card title="דוגמה: סדנת הנרות שילמה באפריל 12,500 ₪">
          <p>
            <Money v={3_500} /> שכירות לחודש, ו-<Money v={9_000} /> על מכונה להמסת שעווה. באותו חודש היא מכרה נרות ב-<Money v={8_000} />.
          </p>
          <ul className="list-disc space-y-1 ps-5 marker:text-subtle">
            <li>
              השכירות של אפריל נגמרה באפריל — הוצאה. הרווח: <Money v={8_000} /> − <Money v={3_500} /> = <strong><Money v={4_500} /></strong>.
            </li>
            <li>המכונה לא נכנסת לחישוב הרווח: <Money v={9_000} /> בחשבון הפכו למכונה ששווה <Money v={9_000} />. לעסק יש אותו שווי — רק בצורה אחרת.</li>
            <li>מי שהיה רושם גם את המכונה כהוצאה היה מראה הפסד של <Money v={4_500} /> — בחודש שבו הסדנה בכלל הרוויחה.</li>
          </ul>
        </Card>
        <ExpenseSorter />
      </>
    ),
  },

  double: {
    lead: (
          <>
            כל אירוע נרשם פעמיים: <span className="text-debit">מה שנכנס לעסק — חובה</span>, <span className="text-credit">מה שיצא ממנו — זכות</span>. סך החובה תמיד שווה
            לסך הזכות.
          </>
    ),
    body: (
      <>
        <p>
          הרישום של אירוע נקרא <Term he="פקודת יומן" />. כך קוראים אותה: למעלה — שורות החובה (<span className="font-semibold text-debit">ח׳</span>), מה שנכנס
          לעסק. מתחתן, מוזחות פנימה — שורות הזכות (<span className="font-semibold text-credit">ז׳</span>), מה שיצא ממנו. ליד כל שורה הסכום, וסך החובה תמיד שווה לסך
          הזכות.
        </p>
        <p>
          הנה <strong>פקודה פשוטה</strong> — חשבון אחד בכל צד. והחיצים מראים לאן עוברת כל שורה שלה:
        </p>
        <EntryFlow entry={SIMPLE} note="לסדנה נכנס חודש שימוש בחלל העבודה (חובה), ויצא ממנה כסף (זכות)." aside={<TIntro />} />
        <MiniQuiz
          prefix="basics"
          chapter="double"
          items={[
            {
              q: "הסדנה מכרה נרות ב-1,400 ₪, והלקוחה העבירה את הכסף. מה בחובה?",
              options: ["מזומן", "מכירות", "קניות", "לקוחות"],
              answer: 0,
              why: "כסף נכנס לסדנה — חובה. מה שיצא ממנה הוא הנרות: מכירות, בזכות.",
            },
          ]}
        />
      </>
    ),
  },
  actions: {
    lead: "כמעט כל פקודה מתחילה בשאלה אחת: מתי הכסף זז — היום, אחר כך, או לפני? התשובה כבר אומרת לכם את רוב הפקודה.",
    body: (
      <>
        <p>כשהכסף יזוז רק אחר כך, יש בינתיים חוב. לכל צד של חוב יש שם קבוע:</p>
        <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
