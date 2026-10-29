import { Laptop, Receipt } from "lucide-react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { COMPOUND, SIMPLE } from "@/lib/study/basics/shared";
import { ActionFinder } from "./action-finder";
import { EquationWidget } from "./equation-widget";
import { Posted } from "./t-accounts";
import { Card, Money, Stepper, Term } from "./ui";

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
          כל פעולה משנה את המשוואה בשני מקומות לפחות, והיא תמיד נשארת מאוזנת. נסו כאן, ותראו את זה בפירוט, עם כרטיסי ה-T, ב<ScreenLink id="lab" />.
        </p>
        <EquationWidget />
      </>
    ),
  },

  expense: {
    lead: "השאלה לבדיקה: העסק ייהנה מזה יותר משנה, ויוכל למכור את זה? כן — השקעה (נכס). לא — הוצאה.",
    body: (
      <>
        <div className="grid gap-3 md:grid-cols-2">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-danger" /> הוצאה: שכירות לחודש
              </span>
            }
          >
            <p>השכירות של ינואר נוצלה בינואר, ולא נשאר ממנה כלום. הוצאה מקטינה את הרווח.</p>
          </Card>
          <Card
            title={
              <span className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-success" /> השקעה: לפטופ לעסק
              </span>
            }
          >
            <p>
              הלפטופ ב-<Money v={1_850} /> יעבוד שנים ואפשר למכור אותו — נכס. הוא לא מקטין את הרווח ביום הקנייה.
            </p>
          </Card>
        </div>
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
          הרישום נקרא <Term he="פקודת יומן" />: קודם שורות החובה (ח׳), ומתחתן, מוזחות פנימה, שורות הזכות (ז׳). מכל פקודה כל שורה עוברת לכרטיס של החשבון שלה:
        </p>
        <Stepper
          label="פקודה פשוטה ופקודה מורכבת"
          steps={[
            {
              title: "פקודה פשוטה: חשבון אחד בכל צד",
              body: <Posted entries={[SIMPLE]} at={0} note="העסק קיבל חודש שימוש במבנה (חובה) ונתן מזומן (זכות)." />,
            },
            {
              title: "פקודה מורכבת: כמה חשבונות באותו צד",
              body: <Posted entries={[COMPOUND]} at={0} note="העסק קיבל ציוד, ונתן שני דברים: 20,000 מזומן והבטחה לשלם 30,000." />,
            },
          ]}
        />
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
