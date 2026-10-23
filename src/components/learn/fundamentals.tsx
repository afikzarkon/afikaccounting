import { Factory, Plane } from "lucide-react";
import { Callout, DataTable, Num, Topic } from "@/components/guide/blocks";
import { Formula, Tex } from "@/components/guide/math";
import { BookValueSlider } from "./widgets";

const CONCEPTS: { term: string; en: string; plain: string; example: string }[] = [
  {
    term: "עלות",
    en: "Cost",
    plain: "כל מה שהוצאתם כדי שהנכס יעמוד במקום ויהיה מסוגל לעבוד — לא רק המחיר על התווית.",
    example: "מכונת קפה למשרד: המחיר, המשלוח והחיבור לצנרת. לא ההדרכה לצוות ולא פולי הקפה.",
  },
  {
    term: "פחת",
    en: "Depreciation",
    plain: "החלק מהעלות ש\"נצרך\" בתקופה. הקצאה שיטתית של העלות לשנים שבהן הנכס מייצר הטבות — לא הערכת שווי.",
    example: "רכב שמשרת אתכם 5 שנים — כל שנה נושאת חלק מהמחיר ששילמתם עליו.",
  },
  {
    term: "פחת נצבר",
    en: "Accumulated Depreciation",
    plain: "הסכום המצטבר של כל הפחת שנרשם מאז הכניסה לשימוש. חשבון מנוגד נכס — מקטין את הנכס בלי לגעת בעלות.",
    example: "\"מד הקילומטרים\" של הנכס בשקלים: כמה ממנו כבר נוצל עד היום.",
  },
  {
    term: "יתרה בספרים",
    en: "Book Value",
    plain: "עלות פחות פחת נצבר (ופחות ירידת ערך, אם יש). זה הסכום שמוצג בדוח על המצב הכספי.",
    example: "לא בהכרח מה שתקבלו אם תמכרו היום — זה רק מה שעוד לא הוקצה להוצאות.",
  },
  {
    term: "ערך גרט (שייר)",
    en: "Salvage / Residual Value",
    plain: "מה שהחברה מצפה לקבל על הנכס בסוף השימוש בו, נטו מעלויות המימוש — כאילו הנכס כבר בגיל ובמצב של סוף חייו.",
    example: "משאית שתימכר בסוף 8 שנים כגרוטאה ב-20,000 ₪ — את החלק הזה לא מפחיתים.",
  },
  {
    term: "אורך חיים שימושיים",
    en: "Useful Life",
    plain: "התקופה שהחברה מצפה להשתמש בנכס — לא אורך החיים הפיזי. יכול להימדד בשנים או ביחידות תפוקה.",
    example: "מחשב נייד שמחזיק 8 שנים, אבל החברה מחליפה אותו כל 3 — אורך החיים הוא 3 שנים.",
  },
];

// A wide-body passenger aircraft, split into its significant parts (IAS 16.43–44). Figures in ₪ millions.
const PARTS: [string, number, number, number][] = [
  ["גוף המטוס (Airframe)", 240, 40, 25],
  ["מנועים (Engines)", 100, 10, 10],
  ["פנים התא ומושבים (Cabin interior)", 36, 0, 8],
  ["בדיקה תקופתית מקיפה (D-Check)", 24, 0, 6],
];
const PART_ROWS = PARTS.map(([name, cost, salvage, life]) => [name, cost, salvage, `${life} שנים`, (cost - salvage) / life]);
const TOTAL_COST = PARTS.reduce((s, p) => s + p[1], 0);
const TOTAL_SALVAGE = PARTS.reduce((s, p) => s + p[2], 0);
const COMPONENT_DEP = PARTS.reduce((s, [, c, r, n]) => s + (c - r) / n, 0);
const WHOLE_DEP = (TOTAL_COST - TOTAL_SALVAGE) / 25;

export function FundamentalsSection() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c) => (
          <article key={c.term} className="card flex flex-col p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[17px] font-semibold text-fg">{c.term}</h3>
              <span dir="ltr" className="text-xs text-subtle">
                {c.en}
              </span>
            </div>
            <p className="mt-2 text-[14.5px] leading-relaxed text-fg/90">{c.plain}</p>
            <div className="mt-auto pt-3">
              <p className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] leading-relaxed text-fg/85">
                <span className="font-semibold text-accent">בחיים: </span>
                {c.example}
              </p>
            </div>
          </article>
        ))}
      </div>

      <Topic title="איך כל המושגים מתחברים — על ציר אחד" refs="IAS 16.6, 50" open>
        <p>
          העלות היא כל הפס. הפחת הנצבר &quot;אוכל&quot; אותו מצד אחד, שנה אחרי שנה; הגרט בקצה השני לעולם לא מופחת. מה שנשאר באמצע ועוד לא
          נאכל, ועוד הגרט — זו היתרה בספרים. בדוגמה: עלות <Num v={300_000} />, גרט <Num v={30_000} />, 5 שנים בקו ישר.
        </p>
        <Formula tex={String.raw`\text{Book Value}_t = \text{Cost} - \text{Accumulated Depreciation}_t \;\ge\; \text{Salvage}`} />
        <BookValueSlider cost={300_000} salvage={30_000} life={5} />
      </Topic>

      <Topic title="דוגמה פיזית: מטוס נוסעים מפורק לרכיבים (Component Approach)" refs="IAS 16.43–49" open>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Plane className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            מטוס הוא לא נכס אחד אלא כמה נכסים שבמקרה מחוברים זה לזה. גוף המטוס יטוס 25 שנה, אבל המנועים יוחלפו אחרי 10, הריפוד אחרי 8,
            ובדיקת D-Check חוזרת כל 6 שנים. IAS 16.43 מחייב להפחית <strong>בנפרד</strong> כל חלק שעלותו משמעותית ביחס לסך העלות — כל רכיב לפי
            אורך החיים שלו.
          </p>
        </div>
        <DataTable
          caption="מטוס בעלות 400 מיליון ₪ (סכומים במיליוני ₪)"
          head={["רכיב", "עלות", "גרט", "אורך חיים", "פחת שנתי"]}
          rows={PART_ROWS}
          foot={["סה״כ — גישת הרכיבים", TOTAL_COST, TOTAL_SALVAGE, "", COMPONENT_DEP]}
        />
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
            עלות D-Check מהוונת כרכיב נפרד ומופחתת עד הבדיקה הבאה (IAS 16.14). כשמבצעים את הבדיקה הבאה, יתרת הבדיקה הקודמת (אם נותרה) נגרעת,
            והבדיקה החדשה מהוונת במקומה.
          </p>
        </Callout>
        <div className="mt-4 flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Factory className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            <strong>אותו היגיון במפעל:</strong> מבנה (40 שנה), קו ייצור (10 שנים), מערכת מיזוג (15 שנה) — והקרקע שמתחתיו{" "}
            <strong>לא מופחתת בכלל</strong>, כי אורך החיים שלה בלתי מוגבל (IAS 16.58). כשרוכשים &quot;מבנה עם קרקע&quot; בסכום אחד, קודם מפצלים
            את העלות.
          </p>
        </div>
      </Topic>

      <Callout kind="check" title="אומדנים נבחנים כל שנה">
        <p>
          ערך הגרט, אורך החיים ושיטת הפחת נבחנים לפחות בסוף כל שנה (IAS 16.51, 61). שינוי בהם הוא <strong>שינוי אומדן</strong>: לא מתקנים
          אחורה — מחלקים מחדש את היתרה בספרים בניכוי הגרט החדש על פני יתרת החיים, מכאן ולהבא.
        </p>
      </Callout>
    </>
  );
}
