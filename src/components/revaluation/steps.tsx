import { ArrowRightLeft, History, Scale, TrendingUp } from "lucide-react";
import { Callout, DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { StepCard, texNum } from "@/components/study/ui";
import { solveRevaluation, splitRevaluation } from "@/lib/learn/revaluation";
import { depLines, nettingLines, proportionalLines, SL_EX } from "./data";

const R = solveRevaluation(SL_EX);
const EV = R.events[0];
const YEARS_BEFORE = EV.t / 12;
const OLD_ANNUAL = SL_EX.cost / SL_EX.life;
const NEW_ANNUAL = EV.firstYearCharge;
const SECOND_DOWN = R.events.find((e) => e.diff < 0 && e.pl === 0)!;
const LOSS = R.events.find((e) => e.pl < 0)!;

// How a gap can land, on small round figures.
const CASES = [
  { title: "הערכה ראשונה — עלייה", before: 80_000, fv: 120_000, surplus: 0, losses: 0 },
  { title: "הערכה ראשונה — ירידה", before: 80_000, fv: 70_000, surplus: 0, losses: 0 },
  { title: "עלייה נוספת (קרן 30,000)", before: 90_000, fv: 100_000, surplus: 30_000, losses: 0 },
  { title: "ירידה אחרי עלייה בעבר (קרן 30,000)", before: 90_000, fv: 50_000, surplus: 30_000, losses: 0 },
].map((c) => ({ ...c, ...splitRevaluation(c.fv - c.before, c.surplus, c.losses) }));

const STEPS = ["פחת עד יום ההערכה", "חישוב פער ההערכה", "סיווג הפער: קרן או רווח והפסד", "פחת חדש מיום ההערכה"];

export function RevaluationStepsSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">דרכים לפתור שאלת הערכה מחדש — במבט אחד</p>
        <p className="mt-1 text-[15px] text-fg/90">
          במודל הערכה מחדש הנכס מוצג בשווי ההוגן שלו ביום ההערכה, בניכוי פחת שנצבר מאז (סעיף 31). כל שאלה נפתרת באותם שלבים. לאורך הדרך נפתור
          דוגמה אחת: מבנה שנרכש ב-1.1.{SL_EX.firstYear} בעלות <Num v={SL_EX.cost} /> ₪, לאורך חיים של {SL_EX.life} שנים, בקו ישר. החברה מעריכה
          אותו מחדש <strong>בכל 31.12</strong>, ובכל שנה יש לו שווי הוגן חדש. כאן נפתור את ההערכה הראשונה — ב-31.12.{EV.year} השווי ההוגן{" "}
          <Num v={EV.fairValue} /> ₪ — ובכל שנה שאחריה חוזרים על אותם שלבים בדיוק (הלוח המלא בלשונית &quot;דוגמאות לפי שיטות&quot;).
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <StepCard step={1} title="עדכון פחת עד תאריך ההערכה מחדש" lead="קודם מביאים את הנכס ליום ההערכה — ורק אז משווים לשווי ההוגן" icon={<History className="h-5 w-5" />}>
        <p>
          לפני ההערכה מחדש רושמים את הוצאות הפחת מתחילת התקופה ועד יום ההערכה, ומחשבים את הערך בספרים המעודכן. בדוגמה ההערכה ב-31.12, ולכן
          רושמים קודם את הפחת של כל שנת {SL_EX.revaluations[0].year}.
        </p>
        <Formula
          tex={String.raw`\text{ערך בספרים מעודכן} = \text{עלות} - \text{פחת נצבר} = ${texNum(SL_EX.cost)} - ${texNum(OLD_ANNUAL)} \times ${YEARS_BEFORE} = ${texNum(EV.before)}`}
        />
        <JournalEntry title={`פחת לשנת ${SL_EX.revaluations[0].year}`} date={`31.12.${SL_EX.revaluations[0].year}`} lines={depLines(OLD_ANNUAL)} />
      </StepCard>

      <StepCard step={2} title="חישוב פער ההערכה מחדש" lead="כמה השווי ההוגן גבוה (או נמוך) מהערך בספרים" icon={<Scale className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{פער הערכה מחדש} = \text{שווי הוגן ליום ההערכה} - \text{ערך בספרים מעודכן} = ${texNum(EV.fairValue)} - ${texNum(EV.before)} = ${texNum(EV.diff)}`}
        />
      </StepCard>

      <StepCard step={3} title="סיווג הפער וטיפול חשבונאי" lead="קרן הערכה מחדש (רווח כולל אחר) או רווח והפסד — תלוי במה שקרה קודם" icon={<TrendingUp className="h-5 w-5" />}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface-2/40 p-4 text-[14.5px]">
            <p className="font-semibold text-fg">הערכה מחדש ראשונה</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-fg/90">
              <li>
                <strong>עלייה:</strong> נזקפת לרווח כולל אחר ומצטברת ב<strong>קרן הערכה מחדש</strong> בהון העצמי (סעיף 39).
              </li>
              <li>
                <strong>ירידה:</strong> מוכרת מיד כהוצאה ב<strong>רווח והפסד</strong> (סעיף 40).
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/40 p-4 text-[14.5px]">
            <p className="font-semibold text-fg">הערכות עוקבות</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-fg/90">
              <li>
                <strong>עלייה נוספת:</strong> מצטרפת לקרן הערכה מחדש.
              </li>
              <li>
                <strong>ירידה אחרי עלייה בעבר:</strong> קודם מקטינים את הקרן עד לאיפוסה, והיתרה — הפסד ברווח והפסד.
              </li>
            </ul>
          </div>
        </div>
        <DataTable
          caption="המקרים במספרים"
          head={["מקרה", "ערך בספרים", "שווי הוגן", "פער", "לקרן הערכה מחדש", "לרווח והפסד"]}
          rows={CASES.map((c) => [c.title, c.before, c.fv, c.fv - c.before, c.oci, c.pl])}
        />
        <p>
          בדוגמה שלנו זו הערכה ראשונה והפער חיובי — כל <Num v={EV.oci} /> נזקפים לקרן הערכה מחדש. בשנים הבאות של אותה דוגמה מופיעים גם שאר
          המקרים: עלייה נוספת ({R.events[1].year}), ירידה שמקטינה את הקרן ({SECOND_DOWN.year}), וירידה שעוברת אותה ונזקפת לרווח והפסד ({LOSS.year}).
        </p>
      </StepCard>

      <div className="card p-5">
        <p className="flex items-center gap-2 text-[17px] font-semibold text-fg">
          <ArrowRightLeft className="h-5 w-5 text-accent" /> מה עושים עם הפחת הנצבר ביום ההערכה? שתי שיטות
        </p>
        <p className="mt-1 text-[15px] text-fg/90">
          שתי השיטות מביאות את הנכס לאותו ערך בספרים — <Num v={EV.fairValue} /> — ואותו סכום לקרן. ההבדל רק באופן ההצגה של העלות והפחת הנצבר (סעיף
          35).
        </p>
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/[0.05] p-4">
            <p className="text-sm font-semibold text-success">שיטת הביטול (הקיזוז) — השכיחה בבחינות</p>
            <p className="mt-1 text-[14px] text-fg/90">
              מבטלים את כל הפחת הנצבר כנגד הנכס, ומתאימים את יתרת הנכס לשווי ההוגן. אחרי הרישום: נכס <Num v={EV.fairValue} />, פחת נצבר 0.
            </p>
            <JournalEntry title="הערכה מחדש — שיטת הביטול" date={`31.12.${EV.year}`} lines={nettingLines(EV)} />
          </div>
          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm font-semibold text-fg">שיטת ההתאמה היחסית</p>
            <p className="mt-1 text-[14px] text-fg/90">
              מעדכנים גם את העלות וגם את הפחת הנצבר באותו יחס שבו השתנה הערך בספרים:{" "}
              <bdi dir="ltr" className="num">
                {EV.fairValue.toLocaleString("en-US")} ÷ {EV.before.toLocaleString("en-US")} = {EV.factor}
              </bdi>
              . אחרי הרישום: נכס <Num v={EV.propGrossAfter} />, פחת נצבר <Num v={EV.propAccAfter} />.
            </p>
            <JournalEntry title="הערכה מחדש — התאמה יחסית" date={`31.12.${EV.year}`} lines={proportionalLines(EV)} />
          </div>
        </div>
        <DataTable
          caption="היתרות אחרי ההערכה"
          head={["", "שיטת הביטול", "התאמה יחסית"]}
          rows={[
            ["מבנה", EV.fairValue, EV.propGrossAfter],
            ["בניכוי פחת נצבר", 0, -EV.propAccAfter],
            ["ערך בספרים", EV.fairValue, EV.propGrossAfter - EV.propAccAfter],
          ]}
        />
      </div>

      <StepCard step={4} title="פחת חדש מיום ההערכה" lead="השווי ההוגן, פחות הגרט, על פני יתרת אורך החיים" icon={<History className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{פחת שנתי חדש} = \frac{\text{שווי הוגן} - \text{גרט}}{\text{יתרת אורך החיים}} = \frac{${texNum(EV.fairValue)} - ${texNum(SL_EX.salvage)}}{${EV.monthsLeft / 12}} = ${texNum(NEW_ANNUAL)}`}
        />
        <Callout kind="check" title="ומה קורה לקרן?">
          <p>
            הקרן יכולה לעבור לעודפים בהדרגה — בקצב הפחת — או רק כשהנכס נגרע. שתי החלופות מוסברות בלשונית &quot;קרקע מול מבנה&quot;, ובדוגמאות.
          </p>
        </Callout>
      </StepCard>
    </>
  );
}
