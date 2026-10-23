import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula, Tex } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { dbRate, type RevaluationResult, solveRevaluation } from "@/lib/learn/revaluation";
import { RevSchedule } from "./schedule";
import { DB_EX, depLines, nettingLines, SL_EX, SYD_EX, transferLines } from "./data";

const r2 = (v: number) => Math.round(v * 100) / 100;

export function RevaluationExamplesSection() {
  const sl = solveRevaluation(SL_EX);
  const syd = solveRevaluation(SYD_EX);
  const db = solveRevaluation(DB_EX);
  const slEv = sl.events[0];
  const sydEv = syd.events[0];
  const dbEv = db.events[0];
  const after = (r: RevaluationResult, year: number) => r.rows.find((row) => row.year === year)!;
  const y3 = after(sl, SL_EX.firstYear + 2);
  const sydRemaining = sydEv.monthsLeft / 12;
  const sydDigits = (sydRemaining * (sydRemaining + 1)) / 2;

  return (
    <>
      <Topic title="דוגמה 1: מבנה בקו ישר — העברה לעודפים בקצב הפחת" open>
        <p>
          מבנה שנרכש ב-<Num v={SL_EX.cost} /> ₪, אורך חיים {SL_EX.life} שנים, קו ישר. כעבור שנתיים — ב-31.12.{slEv.year} — שוויו ההוגן{" "}
          <Num v={slEv.fairValue} /> ₪.
        </p>
        <DataTable
          head={["שלב", "חישוב", "תוצאה"]}
          rows={[
            ["1. ערך בספרים בתום שנה 2", <Tex key="t">{String.raw`${texNum(SL_EX.cost)} - ${texNum(slEv.accEliminated)}`}</Tex>, slEv.before],
            ["2. קרן הערכה מחדש", <Tex key="t">{String.raw`${texNum(slEv.fairValue)} - ${texNum(slEv.before)}`}</Tex>, slEv.oci],
            ["3. פחת חדש לשנים 3 עד 10", <Tex key="t">{String.raw`\frac{${texNum(slEv.fairValue)}}{8}`}</Tex>, r2(y3.dep)],
            ["4. פחת שהיה לפי מודל העלות", <Tex key="t">{String.raw`\frac{${texNum(SL_EX.cost)}}{${SL_EX.life}}`}</Tex>, r2(y3.costDep)],
            ["5. העברה שנתית לעודפים", <Tex key="t">{String.raw`${texNum(y3.dep)} - ${texNum(y3.costDep)}`}</Tex>, r2(y3.transfer)],
          ]}
        />
        <div className="grid gap-3 xl:grid-cols-3">
          <JournalEntry title={`הערכה מחדש (שיטת הביטול)`} date={`31.12.${slEv.year}`} lines={nettingLines(slEv)} />
          <JournalEntry title={`פחת לשנת ${y3.year}`} date={`31.12.${y3.year}`} lines={depLines(y3.dep)} />
          <JournalEntry title={`העברה לעודפים — ${y3.year}`} date={`31.12.${y3.year}`} lines={transferLines(y3.transfer)} note="פקודה בהון העצמי — לא דרך רווח והפסד." />
        </div>
        <RevSchedule r={sl} caption="לוח מלא — קו ישר, העברה בקצב הפחת" />
        <p className="text-sm text-muted">
          בסוף אורך החיים הקרן מתאפסת: כל <Num v={slEv.oci} /> עברו לעודפים, <Num v={y3.transfer} /> בכל שנה במשך 8 שנים.
        </p>
      </Topic>

      <Topic title="דוגמה 2: מבנה בסכום ספרות השנים וביתרה פוחתת" open>
        <p className="!mb-1 font-semibold text-fg">סכום ספרות השנים — יורד</p>
        <p>
          מבנה בעלות <Num v={SYD_EX.cost} /> ₪, {SYD_EX.life} שנים, ללא גרט. פחת לפני ההערכה: 5/15 ו-4/15 — סה״כ <Num v={sydEv.accEliminated} />, ערך
          בספרים <Num v={sydEv.before} />. ב-31.12.{sydEv.year} שווי הוגן <Num v={sydEv.fairValue} />, ולכן לקרן: <Num v={sydEv.oci} />.
        </p>
        <Formula
          tex={String.raw`\text{סכום ספרות חדש} = \frac{${sydRemaining} \times ${sydRemaining + 1}}{2} = ${sydDigits} \qquad \text{פחת שנה ראשונה} = ${texNum(sydEv.fairValue)} \times \frac{${sydRemaining}}{${sydDigits}} = ${texNum(sydEv.firstYearCharge)}`}
        />
        <p>
          את הפחת לפי מודל העלות ממשיכים לחשב כאילו לא הייתה הערכה: 3/15, 2/15, 1/15 מהעלות המקורית. ההעברה לעודפים היא ההפרש בכל שנה:
        </p>
        <RevSchedule r={syd} caption="אחרי ההערכה — סכום ספרות השנים" from={sydEv.year + 1} />

        <p className="!mb-1 font-semibold text-fg">יתרה פוחתת</p>
        <p>
          מבנה בעלות <Num v={DB_EX.cost} /> ₪, {DB_EX.life} שנים, גרט <Num v={DB_EX.salvage} />. שיעור מקורי 50%: פחת <Num v={DB_EX.cost / 2} /> ואחר כך{" "}
          <Num v={DB_EX.cost / 4} />, ערך בספרים <Num v={dbEv.before} />. ב-31.12.{dbEv.year} שווי הוגן <Num v={dbEv.fairValue} />, לקרן <Num v={dbEv.oci} />.
        </p>
        <Formula
          tex={String.raw`\text{שיעור חדש} = 1 - \left(\frac{\text{גרט}}{\text{שווי הוגן}}\right)^{\frac{1}{\text{יתרת שנים}}} = 1 - \left(\frac{${texNum(DB_EX.salvage)}}{${texNum(dbEv.fairValue)}}\right)^{\frac{1}{${dbEv.monthsLeft / 12}}} = ${(dbRate(dbEv.fairValue, DB_EX.salvage, dbEv.monthsLeft / 12) * 100).toFixed(2)}\%`}
        />
        <RevSchedule r={db} caption="אחרי ההערכה — יתרה פוחתת" from={dbEv.year + 1} />
        <Callout title="איך מודדים את הפרש הפחת בשיטות מואצות">
          <p>
            מחשבים שני לוחות במקביל: הלוח בפועל — מהשווי ההוגן, על יתרת החיים, בשיעור או במכנה חדשים — ולוח &quot;צל&quot; של מודל העלות, שממשיך
            כאילו לא הייתה הערכה. ההעברה בכל שנה היא ההפרש ביניהם, ולכן היא לא קבועה כמו בקו ישר — אבל בסוף החיים הקרן מתאפסת בדיוק.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
