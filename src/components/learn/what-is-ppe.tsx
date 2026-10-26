import { CalendarRange, CircleCheck, CircleX, Hand, Wrench } from "lucide-react";
import { Callout, DataTable } from "@/components/study/blocks";

/** The three things the definition asks of an item (IAS 16.6). */
const TESTS = [
  {
    icon: <Hand className="h-5 w-5" />,
    title: "מוחשי",
    body: "פריט פיזי שאפשר לגעת בו: מכונה, מבנה, רכב, מחשב. זכויות ותוכנות בלי גוף פיזי הן נכסים בלתי מוחשיים — תקן אחר.",
  },
  {
    icon: <Wrench className="h-5 w-5" />,
    title: "מוחזק כדי להשתמש בו",
    body: "לייצור או לאספקת סחורות ושירותים, להשכרה לאחרים, או לצורכי הנהלה. לא כדי למכור אותו — מה שקונים כדי למכור הוא מלאי.",
  },
  {
    icon: <CalendarRange className="h-5 w-5" />,
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
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">ההגדרה בתקן — סעיף 6</p>
        <p className="mt-2 text-[16px] leading-relaxed text-fg">
          <strong>רכוש קבוע</strong> הוא פריטים <strong>מוחשיים</strong> ש<strong>מוחזקים לשימוש</strong> בייצור או באספקת סחורות או שירותים,
          להשכרה לאחרים או למטרות מנהלתיות, ו<strong>צפוי שישמשו יותר מתקופה אחת</strong>.
        </p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          במילים פשוטות: הדברים הפיזיים שהחברה קונה כדי לעבוד איתם לאורך שנים — לא כדי למכור אותם, ולא כדי לגמור אותם השנה.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TESTS.map((t, i) => (
          <article key={t.title} className="card p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{t.icon}</span>
              <h3 className="text-[16px] font-semibold text-fg">
                <span className="num me-1 text-accent">{i + 1}.</span>
                {t.title}
              </h3>
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-fg/90">{t.body}</p>
          </article>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">מתי רושמים אותו בספרים — סעיף 7</p>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fg/90">פריט שעומד בהגדרה נרשם כנכס רק כששני התנאים מתקיימים:</p>
        <ul className="mt-2 space-y-2">
          <li className="flex items-start gap-2 text-[14.5px] text-fg">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              <strong>צפוי</strong> שהוא יביא לחברה הטבות כלכליות בעתיד — הכנסות, חיסכון או שירות.
            </span>
          </li>
          <li className="flex items-start gap-2 text-[14.5px] text-fg">
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <span>
              אפשר <strong>למדוד את העלות שלו באופן מהימן</strong> — יש חשבונית, חוזה או סכום ששולם.
            </span>
          </li>
        </ul>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          מכאן גם הכלל הבסיסי: הנכס נרשם לראשונה <strong>בעלותו</strong> (סעיף 15). מה נכנס לעלות — בשלב 4 של &quot;שאלה מלאה&quot; למטה.
        </p>
      </div>

      <DataTable caption="רכוש קבוע או לא? בודקים את שלושת התנאים" head={["פריט", "רכוש קבוע?", "למה"]} rows={EXAMPLES} />

      <Callout kind="check" title="מה הופך פריט לרכוש קבוע — שלוש שאלות, לפי הסדר">
        <ol className="list-inside list-decimal space-y-1">
          <li>יש לו גוף פיזי? אם לא — זה לא רכוש קבוע.</li>
          <li>קנינו אותו כדי להשתמש בו, או כדי למכור? למכירה — מלאי.</li>
          <li>הוא ישמש יותר משנה? אם לא — הוצאה של השנה.</li>
        </ol>
        <p className="mt-2 flex items-center gap-1.5">
          <CircleX className="h-4 w-4 shrink-0 text-danger" aria-hidden />
          תשובה &quot;לא&quot; לאחת מהן — הפריט אינו רכוש קבוע. שלוש פעמים &quot;כן&quot; — ממשיכים למושגי היסוד.
        </p>
      </Callout>
    </>
  );
}
