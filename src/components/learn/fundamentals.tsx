import { Num, Topic } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { BookValueSlider } from "./widgets";

const CONCEPTS: { term: string; plain: string; example: string }[] = [
  {
    term: "עלות",
    plain: "כל מה שהוצאתם כדי שהנכס יגיע למקום ויהיה מוכן לעבוד — לא רק המחיר על התווית.",
    example: "קניתם מכונת קפה למשרד: המחיר, המשלוח והחיבור לצנרת הם חלק מהעלות. ההדרכה לצוות ופולי הקפה — לא, הם הוצאה רגילה.",
  },
  {
    term: "פחת",
    plain: "החלק מהעלות שנחשב כ\"נוצל\" בכל תקופה. זו חלוקה מסודרת של העלות על פני השנים שבהן הנכס משרת את החברה — לא הערכה של כמה הנכס שווה היום.",
    example: "קניתם רכב שישרת אתכם חמש שנים? כל שנה נושאת חלק מהמחיר כהוצאה, במקום שכל ההוצאה תיפול בשנת הקנייה.",
  },
  {
    term: "פחת נצבר",
    plain: "סך כל הפחת שנרשם מאז שהנכס נכנס לשימוש. הוא נרשם בחשבון נפרד שמקטין את הנכס, כך שהעלות המקורית נשארת גלויה בספרים.",
    example: "כמו מד הקילומטרים של הרכב, רק בשקלים: הוא מראה כמה מהעלות כבר נוצל עד היום.",
  },
  {
    term: "יתרה בספרים",
    plain: "עלות פחות פחת נצבר (ופחות ירידת ערך, אם יש). זה הסכום שמוצג בדוח על המצב הכספי.",
    example: "זה לא בהכרח המחיר שתקבלו אם תמכרו את הנכס היום — זה רק החלק מהעלות שעוד לא נרשם כהוצאה.",
  },
  {
    term: "ערך גרט (שייר)",
    plain: "מה שהחברה מצפה לקבל על הנכס בסוף השימוש בו, נטו מעלויות המימוש — כאילו הנכס כבר בגיל ובמצב של סוף חייו.",
    example: "משאית שאחרי 8 שנים תימכר כגרוטאה ב-20,000 ₪ — את 20,000 השקלים האלה לא מפחיתים.",
  },
  {
    term: "אורך חיים שימושיים",
    plain: "התקופה שהחברה מצפה להשתמש בנכס — לא כמה זמן הוא מחזיק פיזית. אפשר למדוד אותה בשנים או ביחידות תפוקה.",
    example: "מחשב נייד יכול להחזיק 8 שנים, אבל אם החברה מחליפה מחשבים כל 3 שנים — אורך החיים שלו הוא 3 שנים.",
  },
];

export function FundamentalsSection() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c) => (
          <article key={c.term} className="card flex flex-col p-5">
            <h3 className="text-[17px] font-semibold text-fg">{c.term}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-fg/90">{c.plain}</p>
            <div className="mt-auto pt-3">
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] leading-relaxed text-fg/85">
                <span className="font-semibold text-accent">דוגמה מהחיים: </span>
                {c.example}
              </p>
            </div>
          </article>
        ))}
      </div>

      <Topic title="איך כל המושגים מתחברים — על ציר אחד" refs="סעיפים 6, 50" open>
        <p>
          העלות היא כל הפס. הפחת הנצבר &quot;אוכל&quot; אותו מצד אחד, שנה אחרי שנה; הגרט בקצה השני לעולם לא מופחת. מה שנשאר באמצע ועוד לא
          נאכל, ועוד הגרט — זו היתרה בספרים. בדוגמה: עלות <Num v={300_000} />, גרט <Num v={30_000} />, 5 שנים בקו ישר.
        </p>
        <Formula tex={String.raw`\text{יתרה בספרים} = \text{עלות} - \text{פחת נצבר} \;\ge\; \text{ערך גרט}`} />
        <BookValueSlider cost={300_000} salvage={30_000} life={5} />
      </Topic>
    </>
  );
}
