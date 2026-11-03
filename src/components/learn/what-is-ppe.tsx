import { CircleCheck } from "lucide-react";
import { DataTable } from "@/components/study/blocks";
import { Part, Remember } from "@/components/study-mode/screen-parts";

/** The three things the definition asks of an item (IAS 16.6). */
const TESTS = [
  {
    title: "מוחשי",
    body: "פריט פיזי שאפשר לגעת בו: מכונה, מבנה, רכב, מחשב. זכויות ותוכנות בלי גוף פיזי הן נכסים בלתי מוחשיים — תקן אחר.",
  },
  {
    title: "מוחזק כדי להשתמש בו",
    body: "לייצור או לאספקת סחורות ושירותים, להשכרה לאחרים, או לצורכי הנהלה. לא כדי למכור אותו — מה שקונים כדי למכור הוא מלאי.",
  },
  {
    title: "ישמש יותר מתקופה אחת",
    body: "החברה מצפה להשתמש בו יותר משנה. מה שנגמר בתוך השנה — נייר, דלק, חומרי ניקוי — הוא הוצאה של השנה.",
  },
];

const EXAMPLES: [string, string, string][] = [
  ["מכונת ייצור במפעל", "כן", "מוחשית, משמשת לייצור, לשנים רבות"],
  ["משאית חלוקה של חברת שליחויות", "כן", "משמשת לאספקת שירות, לכמה שנים"],
  ["בניין המשרדים שבו החברה יושבת", "כן", "משמש לצורכי הנהלה; הקרקע שמתחתיו — פריט נפרד שאינו מופחת"],
  ["מחשבים לעובדים", "כן", "משמשים יותר משנה (גם אם יוחלפו אחרי 3 שנים)"],
  ["חלק חילוף עיקרי שישמש כמה שנים", "כן", "עומד בהגדרה — לכן הוא רכוש קבוע ולא מלאי (סעיף 8)"],
  ["מכוניות שסוכנות רכב קונה כדי למכור", "לא — מלאי", "מוחזקות למכירה, לא לשימוש"],
  ["נייר וטונר למדפסות", "לא — הוצאה", "נצרכים בתוך השנה"],
];

/** Opening: what property, plant and equipment is, and what makes an item one. */
export function WhatIsPpeSection() {
  return (
    <>
      <p>
        <strong>ההגדרה בתקן (סעיף 6):</strong> <strong>רכוש קבוע</strong> הוא פריטים <strong>מוחשיים</strong> ש<strong>מוחזקים לשימוש</strong> בייצור או באספקת סחורות
        או שירותים, להשכרה לאחרים או למטרות מנהלתיות, ו<strong>צפוי שישמשו יותר מתקופה אחת</strong>.
      </p>
      <p>במילים פשוטות: הדברים הפיזיים שהחברה קונה כדי לעבוד איתם לאורך שנים — לא כדי למכור אותם, ולא כדי לגמור אותם השנה.</p>

      <ol className="max-w-[70ch] space-y-2.5">
        {TESTS.map((t, i) => (
          <li key={t.title} className="flex items-baseline gap-2.5">
            <span className="num grid h-6 w-6 shrink-0 place-items-center self-start rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
            <span>
              <strong className="text-fg">{t.title}</strong> — {t.body}
            </span>
          </li>
        ))}
      </ol>

      <DataTable caption="רכוש קבוע או לא? בודקים את שלושת התנאים" head={["פריט", "רכוש קבוע?", "למה"]} rows={EXAMPLES} />

      <Part title="מתי רושמים אותו בספרים — סעיף 7">
        <p>פריט שעומד בהגדרה נרשם כנכס רק כששני התנאים מתקיימים:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CircleCheck className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              <strong>צפוי</strong> שהוא יביא לחברה הטבות כלכליות בעתיד — הכנסות, חיסכון או שירות.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CircleCheck className="mt-1 h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              אפשר <strong>למדוד את העלות שלו באופן מהימן</strong> — יש חשבונית, חוזה או סכום ששולם.
            </span>
          </li>
        </ul>
        <p>
          מכאן גם הכלל הבסיסי: הנכס נרשם לראשונה <strong>בעלותו</strong> (סעיף 15). מה נכנס לעלות — בשלב 4 של &quot;שאלה מלאה&quot; למטה.
        </p>
      </Part>

      <Remember>
        <p>מה הופך פריט לרכוש קבוע — שלוש שאלות, לפי הסדר:</p>
        <ol className="list-inside list-decimal space-y-1 font-medium">
          <li>יש לו גוף פיזי? אם לא — זה לא רכוש קבוע.</li>
          <li>קנינו אותו כדי להשתמש בו, או כדי למכור? למכירה — מלאי.</li>
          <li>הוא ישמש יותר משנה? אם לא — הוצאה של השנה.</li>
        </ol>
        <p className="mt-1 font-medium">תשובה &quot;לא&quot; לאחת מהן — הפריט אינו רכוש קבוע. שלוש פעמים &quot;כן&quot; — ממשיכים למושגי היסוד.</p>
      </Remember>
    </>
  );
}
