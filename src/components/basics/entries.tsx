import { ArrowLeft, Laptop, Receipt } from "lucide-react";
import Link from "next/link";
import { Callout } from "@/components/study/blocks";
import type { Entry } from "@/lib/learn/basics";
import { ActionFinder } from "./action-finder";
import { Card, Chapter, EntryView, Money, Rule, Term } from "./ui";

const SIMPLE: Entry = {
  id: "1",
  text: "פקודה פשוטה: העסק שילם 2,000 ₪ שכירות במזומן",
  lines: [
    { account: "הוצאות שכירות", dr: 2_000 },
    { account: "מזומן", cr: 2_000 },
  ],
};
const COMPOUND: Entry = {
  id: "2",
  text: "פקודה מורכבת: ציוד ב-50,000 ₪ — 20,000 במזומן והשאר באשראי",
  lines: [
    { account: "ציוד", dr: 50_000 },
    { account: "מזומן", cr: 20_000 },
    { account: "זכאים", cr: 30_000 },
  ],
};

export function EntriesChapters() {
  return (
    <>
      <Chapter n={4} id="equation" title="הזהות החשבונאית" lead="המשוואה שתמיד, אבל תמיד, מתקיימת">
        <p>
          כל מה שיש לעסק הגיע ממקום כלשהו: או שמישהו הלווה לו, או שהבעלים השקיעו (או שהעסק הרוויח בעצמו). זו{" "}
          <Term he="הזהות החשבונאית" />:
        </p>
        <div className="flex flex-wrap items-stretch justify-center gap-2 rounded-xl bg-surface-2/70 p-4 text-center sm:gap-3" role="math" aria-label="נכסים שווה התחייבויות ועוד הון">
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
          כל פעולה משנה את המשוואה בשני מקומות לפחות, כך שהיא תמיד נשארת מאוזנת. את זה תראו בפועל, פעולה אחר פעולה, בפרק 7.
        </p>
      </Chapter>

      <Chapter n={5} id="expense" title="הוצאה מול השקעה" lead="מה נעלם בתוך החודש, ומה נשאר לשנים">
        <div className="grid gap-3 md:grid-cols-2">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-danger" /> הוצאה: שכירות לחודש
              </span>
            }
          >
            <p>
              <Term he="הוצאה" /> היא משהו שהעסק משתמש בו לטווח קצר — בדרך כלל עד שנה — ואי אפשר למכור אותו אחר כך. השכירות של ינואר נוצלה
              בינואר, ולא יישאר ממנה כלום. הוצאה מקטינה את הרווח.
            </p>
          </Card>
          <Card
            title={
              <span className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-success" /> השקעה: לפטופ לעסק
              </span>
            }
          >
            <p>
              <Term he="השקעה" /> היא משהו שישמש את העסק לטווח ארוך — יותר משנה — ואפשר למכור אותו בהמשך. הלפטופ ב-
              <Money v={1_850} /> יעבוד שנים, ולכן הוא נרשם כנכס ולא כהוצאה. השקעה לא מקטינה את הרווח ביום הקנייה.
            </p>
          </Card>
        </div>
        <Rule>השאלה לבדיקה: האם העסק ייהנה מזה יותר משנה, ויוכל למכור את זה? כן — השקעה (נכס). לא — הוצאה.</Rule>
        <Link
          href="/basics/ias16"
          className="group flex items-center gap-4 rounded-xl border-2 border-accent bg-accent-soft px-5 py-4 transition-colors hover:bg-accent-soft/70"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-fg">המדריך המלא לרכוש קבוע (IAS 16) נמצא בעמוד נפרד</span>
            <span className="mt-0.5 block text-sm text-fg/85">
              שם הנושא נלמד מההתחלה, צעד אחר צעד: מהו רכוש קבוע, מושגי יסוד, שיטות הפחת, שאלה מלאה, שיפוצים, החלפת נכסים והערכה מחדש — עם מחשבון לכל סוגיה.
            </span>
            <span className="mt-1.5 block text-sm font-semibold text-accent">למדריך המלא ←</span>
          </span>
          <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
        </Link>
        <p className="text-sm text-muted">
          ומה עם קניית סחורה למכירה? בקורס היא נרשמת בחשבון <Term he="קניות" /> — סוג של הוצאה, והגדולה מכולן. את מה שלא נמכר עד סוף השנה
          מתקנים במלאי הסגירה (פרק 13).
        </p>
      </Chapter>

      <Chapter n={6} id="double" title="רישום כפול ופקודת יומן" lead="כל אירוע נרשם פעמיים: מי קיבל, ומי נתן">
        <p>
          <Term he="רישום כפול" /> אומר שכל אירוע נרשם לפחות בשני חשבונות. הרישום עצמו נקרא{" "}
          <Term he="פקודת יומן" /> — שורה לכל חשבון, לפי סדר הזמנים.
        </p>
        <Rule>
          כלל הזהב: <span className="text-debit">ערך מקבל (נכנס) = חובה</span>, <span className="text-credit">ערך נותן (יוצא) = זכות</span>.
        </Rule>
        <p>
          בכל פקודה סך החובה שווה לסך הזכות — אחרת משהו נשכח. בפקודה <strong>פשוטה</strong> יש חשבון אחד בכל צד. בפקודה <strong>מורכבת</strong> יש כמה
          חשבונות בצד אחד או בשניהם, וכל שורה מקבלת את הסכום שלה:
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <EntryView entry={SIMPLE} note="העסק קיבל חודש שימוש במבנה (חובה), ונתן מזומן (זכות)." />
          <EntryView entry={COMPOUND} note="העסק קיבל ציוד בשווי 50,000, ונתן שני דברים: 20,000 מזומן, והבטחה לשלם 30,000 (חוב לזכאים)." />
        </div>
        <p>
          כך כותבים פקודה: קודם החובה (ח&apos;), ומתחתיה, מוזחת פנימה, הזכות (ז&apos;). כמה מונחים שיופיעו בטבלה:{" "}
          <Term he="ספקים" /> — מי שהעסק חייב לו על סחורה; <Term he="לקוחות" /> — מי שחייב לעסק על סחורה
          שקנה; <Term he="זכאים" /> ו<Term he="חייבים" /> — אותו דבר, אבל לא בגלל סחורה;{" "}
          <Term he="צ'ק דחוי" /> — צ&apos;ק שייפרע בתאריך מאוחר יותר, ועד אז נחשב חוב.
        </p>
        <ActionFinder />
        <Callout kind="check" title="דפוסים שחוזרים תמיד">
          <ul className="list-inside list-disc space-y-1">
            <li>קניות והוצאות — תמיד בחובה. מכירות והכנסות — תמיד בזכות.</li>
            <li>מזומן: נכנס — חובה, יוצא — זכות.</li>
            <li>רכוש שנקנה — בחובה.</li>
            <li>השקעת בעלים — הון בזכות; משיכה — הון בחובה.</li>
          </ul>
        </Callout>
      </Chapter>
    </>
  );
}

function IdentityPart({ name, hint }: { name: string; hint: string }) {
  return (
    <span className="min-w-[6.5rem] rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="block text-xl font-bold text-fg">{name}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </span>
  );
}
