import { Factory, Plane } from "lucide-react";
import { Callout, DataTable, Num, Topic } from "./blocks";
import { Formula, Tex } from "./math";
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

// A wide-body passenger aircraft, split into its significant parts (IAS 16.43–44). Figures in ₪ millions.
const PARTS: [string, number, number, number, string][] = [
  ["גוף המטוס", 240, 40, 25, "קו ישר"],
  ["מנועים", 100, 10, 10, "יחידות תפוקה — שעות טיסה"],
  ["פנים התא ומושבים", 36, 0, 8, "קו ישר"],
  ["בדיקה תקופתית מקיפה", 24, 0, 6, "קו ישר עד הבדיקה הבאה"],
];
const PART_ROWS = PARTS.map(([name, cost, salvage, life, method]) => [name, method, cost, salvage, `${life} שנים`, (cost - salvage) / life]);
const TOTAL_COST = PARTS.reduce((s, p) => s + p[1], 0);
const TOTAL_SALVAGE = PARTS.reduce((s, p) => s + p[2], 0);
const COMPONENT_DEP = PARTS.reduce((s, [, c, r, n]) => s + (c - r) / n, 0);
const WHOLE_DEP = (TOTAL_COST - TOTAL_SALVAGE) / 25;
// The engines' units-of-production rate: 30,000 flight hours over their life, 3,000 in a normal year.
const ENGINE_HOURS = 30_000;
const HOURS_PER_YEAR = 3_000;

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

      <Topic title="דוגמה פיזית: מטוס נוסעים מפורק לרכיבים — גישת הרכיבים" refs="סעיפים 43–49" open>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Plane className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            מטוס הוא לא נכס אחד אלא כמה נכסים שבמקרה מחוברים זה לזה. גוף המטוס יטוס 25 שנה, אבל המנועים יוחלפו אחרי 10, הריפוד אחרי 8,
            והבדיקה התקופתית המקיפה חוזרת כל 6 שנים. סעיף 43 מחייב להפחית <strong>בנפרד</strong> כל חלק שעלותו משמעותית ביחס לסך העלות —
            כל רכיב לפי אורך החיים שלו, <strong>ובשיטת הפחת שמתאימה לו</strong>.
          </p>
        </div>
        <DataTable
          caption="מטוס בעלות 400 מיליון ₪ (סכומים במיליוני ₪)"
          head={["רכיב", "שיטת פחת", "עלות", "גרט", "אורך חיים", "פחת שנתי"]}
          rows={PART_ROWS}
          foot={["סה״כ — גישת הרכיבים", "", TOTAL_COST, TOTAL_SALVAGE, "", COMPONENT_DEP]}
        />
        <p className="text-sm text-muted">
          המנועים: <Num v={90} /> מיליון ₪ ÷ <Num v={ENGINE_HOURS} /> שעות טיסה = <Num v={3_000} /> ₪ לשעת טיסה. בשנה רגילה של{" "}
          <Num v={HOURS_PER_YEAR} /> שעות — <Num v={9} /> מיליון ₪. בשנה שבה המטוס טס פחות, גם פחת המנועים קטן.
        </p>
        <Callout title="גם שיטת הפחת יכולה להיות שונה בין רכיב לרכיב">
          <p>
            גישת הרכיבים לא מסתפקת באורך חיים נפרד לכל רכיב. כל רכיב מופחת בשיטה שמשקפת את הדרך שבה <strong>הוא</strong> נצרך (סעיף 60): גוף
            המטוס נשחק עם הזמן — קו ישר; המנועים נשחקים לפי השימוש — יחידות תפוקה לפי שעות טיסה. אותו נכס פיזי, שתי שיטות פחת שונות במקביל.
          </p>
        </Callout>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/[0.06] p-4">
            <p className="text-xs font-semibold text-success">גישת הרכיבים (נכון)</p>
            <p className="num mt-1 text-2xl font-semibold text-fg">{COMPONENT_DEP} מ׳ ₪ לשנה</p>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/[0.05] p-4">
            <p className="text-xs font-semibold text-danger">מטוס כנכס אחד ל-25 שנה (שגוי)</p>
            <p className="num mt-1 text-2xl font-semibold text-fg">{WHOLE_DEP} מ׳ ₪ לשנה</p>
            <p className="mt-1 text-xs text-muted">
              <Tex>{String.raw`\frac{400 - 50}{25} = 14`}</Tex> — הוצאה נמוכה ב-{COMPONENT_DEP - WHOLE_DEP} מ׳ ₪ בכל שנה, והמנועים עוד &quot;רשומים&quot; כשכבר
              הוחלפו.
            </p>
          </div>
        </div>
        <Callout title="הבדיקה התקופתית היא רכיב בפני עצמו">
          <p>
            עלות הבדיקה התקופתית המקיפה נרשמת כרכיב נפרד ומופחתת עד הבדיקה הבאה (סעיף 14). כשמבצעים את הבדיקה הבאה, יתרת הבדיקה הקודמת (אם
            נותרה) נגרעת, והבדיקה החדשה נרשמת במקומה.
          </p>
        </Callout>
        <div className="mt-4 flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Factory className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            <strong>אותו היגיון במפעל:</strong> מבנה (40 שנה), קו ייצור (10 שנים), מערכת מיזוג (15 שנה) — והקרקע שמתחתיו{" "}
            <strong>לא מופחתת בכלל</strong>, כי אורך החיים שלה בלתי מוגבל (סעיף 58). כשרוכשים &quot;מבנה עם קרקע&quot; בסכום אחד, קודם מפצלים
            את העלות.
          </p>
        </div>
      </Topic>

      <Callout kind="check" title="אומדנים נבחנים כל שנה">
        <p>
          ערך הגרט, אורך החיים ושיטת הפחת נבחנים לפחות בסוף כל שנה (סעיפים 51, 61). שינוי בהם הוא <strong>שינוי אומדן</strong>: לא מתקנים
          אחורה — מחלקים מחדש את היתרה בספרים בניכוי הגרט החדש על פני יתרת החיים, מכאן ולהבא.
        </p>
      </Callout>
    </>
  );
}
