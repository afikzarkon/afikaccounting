import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { dbRate, type RevaluationResult, type RevEvent, solveRevaluation } from "@/lib/learn/revaluation";
import { DB_EX, depLines, nettingLines, SL_EX, SYD_EX, transferLines } from "./data";
import { RevSchedule } from "./schedule";

const r2 = (v: number) => Math.round(v * 100) / 100;

/** What each revaluation found and where its gap went. */
function EventsTable({ r, caption }: { r: RevaluationResult; caption: string }) {
  return (
    <DataTable
      caption={caption}
      head={["31.12", "ערך בספרים לפני", "שווי הוגן", "פער", "לקרן", "לרווח והפסד", "יתרת הקרן אחרי", "מה קרה"]}
      rows={r.events.map((ev) => [
        <span key="y" className="num font-semibold">
          {ev.year}
        </span>,
        r2(ev.before),
        ev.fairValue,
        r2(ev.diff) + 0,
        r2(ev.oci) + 0,
        r2(ev.pl) + 0,
        r2(ev.surplusAfter) + 0,
        whatHappened(ev),
      ])}
    />
  );
}

function whatHappened(ev: RevEvent) {
  if (Math.abs(ev.diff) < 0.005) return "אין שינוי";
  if (ev.diff > 0) return ev.surplusBefore > 0 ? "עלייה נוספת — לקרן" : "עלייה — לקרן";
  return ev.pl < 0 ? (ev.oci < 0 ? "הקרן מתאפסת, והיתרה הפסד" : "ירידה — הפסד ברווח והפסד") : "ירידה — מקטינה את הקרן";
}

/** Every 31.12 in the same order: the year's depreciation, the transfer to retained earnings, then the revaluation. */
function YearEntries({ r, year, asset = "מבנה" }: { r: RevaluationResult; year: number; asset?: string }) {
  const row = r.rows.find((x) => x.year === year)!;
  const ev = r.events.find((e) => e.year === year);
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-fg">31.12.{year}</p>
      <div className="grid gap-3 xl:grid-cols-3">
        <JournalEntry title="1. פחת השנה" date={`31.12.${year}`} lines={depLines(row.dep)} />
        {row.transfer > 0.005 ? (
          <JournalEntry
            title="2. העברה לעודפים"
            date={`31.12.${year}`}
            lines={transferLines(row.transfer)}
            note={
              <>
                <Num v={r2(row.dep)} /> − <Num v={r2(row.costDep)} /> = <Num v={r2(row.transfer)} />. פקודה בהון העצמי — לא דרך רווח והפסד.
              </>
            }
          />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">2. אין העברה לעודפים — עדיין אין קרן, או שהפחת שווה לפחת לפי העלות.</p>
        )}
        {ev ? (
          <JournalEntry title="3. הערכה מחדש (שיטת הביטול)" date={`31.12.${year}`} lines={nettingLines(ev, asset)} note={<>הפחת הנצבר שנסגר: <Num v={r2(ev.accEliminated)} />.</>} />
        ) : (
          <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">3. אין הערכה מחדש בשנה הזו.</p>
        )}
      </div>
    </div>
  );
}

export function RevaluationExamplesSection() {
  const sl = solveRevaluation(SL_EX);
  const syd = solveRevaluation(SYD_EX);
  const db = solveRevaluation(DB_EX);
  const years = sl.rows.map((x) => x.year);
  const [first, second] = sl.events;
  const row = (r: RevaluationResult, year: number) => r.rows.find((x) => x.year === year)!;
  const firstRow = row(sl, first.year + 1);
  const [sydFirst, sydSecond] = syd.events;
  const n = SL_EX.life;

  return (
    <>
      <Topic title="דוגמה 1: המבנה המרכזי בקו ישר — כל הפקודות, שנה אחרי שנה" open>
        <p>
          המבנה מהשלבים: נרכש ב-1.1.{SL_EX.firstYear} ב-<Num v={SL_EX.cost} /> ₪, {n} שנים, קו ישר, ללא גרט. שתי הערכות מחדש: ב-31.12.{first.year} לשווי הוגן של{" "}
          <Num v={first.fairValue} />, וב-31.12.{second.year} לשווי הוגן של <Num v={second.fairValue} />. העברה לעודפים בקצב הפחת.
        </p>
        <EventsTable r={sl} caption="שתי ההערכות מחדש" />
        <Formula
          tex={String.raw`\text{פחת אחרי הערכה} = \frac{\text{השווי ההוגן}}{\text{יתרת אורך החיים}} \qquad ${first.year + 1}: \ \frac{${texNum(first.fairValue)}}{${first.monthsLeft / 12}} = ${texNum(first.firstYearCharge)} \qquad ${second.year + 1}: \ \frac{${texNum(second.fairValue)}}{${second.monthsLeft / 12}} = ${texNum(second.firstYearCharge)}`}
        />
        <Formula
          tex={String.raw`\text{העברה לעודפים} = \text{פחת לפי השווי ההוגן} - \text{פחת לפי העלות} \qquad ${first.year + 1}: \ ${texNum(firstRow.dep)} - ${texNum(firstRow.costDep)} = ${texNum(firstRow.transfer)}`}
        />
        <p className="!mb-1 font-semibold text-fg">הפקודות — באותו סדר בכל 31.12: פחת ← העברה לעודפים ← הערכה מחדש</p>
        <div className="space-y-4">
          {years.map((y) => (
            <YearEntries key={y} r={sl} year={y} />
          ))}
        </div>
        <RevSchedule r={sl} caption="לוח מלא — קו ישר" />
        <Callout kind="check" title="בדיקה: בסוף החיים הקרן מתאפסת">
          <p>
            הקרן נוצרה ב-<Num v={first.oci} />, ירדה ב-<Num v={-second.oci} /> בהערכה השנייה, והשאר עבר לעודפים בהדרגה:{" "}
            {sl.rows
              .filter((x) => x.transfer > 0.005)
              .map((x) => r2(x.transfer).toLocaleString("en-US"))
              .join(" + ")}{" "}
            = <Num v={r2(sl.rows.reduce((s, x) => s + x.transfer, 0))} />. ביחד: <Num v={first.oci} /> − <Num v={-second.oci} /> −{" "}
            <Num v={r2(sl.rows.reduce((s, x) => s + x.transfer, 0))} /> = 0.
          </p>
        </Callout>
      </Topic>

      <Topic title="דוגמה 2: אותו מבנה, באותם שווים הוגנים — סכום ספרות השנים" open>
        <p>
          כל הנתונים זהים לדוגמה 1, רק שיטת הפחת שונה. אחרי כל הערכה מחשבים <strong>מכנה חדש</strong> לפי יתרת השנים, ושנת החיים הראשונה מתחילה מחדש.
          שימו לב שאותו שווי הוגן ב-{sydSecond.year} נותן כאן <strong>עלייה</strong> של <Num v={sydSecond.diff} />, ולא ירידה כמו בקו ישר — כי הפחת המואץ
          הוריד את הערך בספרים יותר.
        </p>
        <DataTable
          head={["אחרי ההערכה של", "שווי הוגן", "יתרת שנים", "מכנה חדש", "פחת השנה הבאה"]}
          rows={syd.events.map((ev) => {
            const left = ev.monthsLeft / 12;
            return [String(ev.year), ev.fairValue, left, (left * (left + 1)) / 2, r2(ev.firstYearCharge)];
          })}
        />
        <EventsTable r={syd} caption="שתי ההערכות מחדש — סכום ספרות השנים" />
        <p>
          לוח הצל של מודל העלות ממשיך כאילו לא הייתה הערכה: {Array.from({ length: n }, (_, i) => `${n - i}/${(n * (n + 1)) / 2}`).join(", ")} מהעלות. ההעברה לעודפים בכל
          שנה — ההפרש בין שני הלוחות, ולכן היא לא קבועה כמו בקו ישר.
        </p>
        <div className="space-y-4">
          <YearEntries r={syd} year={sydFirst.year + 1} />
          <YearEntries r={syd} year={sydSecond.year} />
        </div>
        <RevSchedule r={syd} caption="לוח מלא — סכום ספרות השנים" />
      </Topic>

      <Topic title="דוגמה 3 (נפרדת): יתרה פוחתת" open>
        <p>
          ביתרה פוחתת השיעור מחושב מהגרט, ולמבנה המרכזי אין גרט — לכן לשיטה הזו דוגמה נפרדת: מבנה בעלות <Num v={DB_EX.cost} /> ₪, {DB_EX.life} שנים, גרט{" "}
          <Num v={DB_EX.salvage} /> ₪, מוערך בכל 31.12. אחרי כל הערכה מחשבים <strong>שיעור חדש</strong> מהשווי ההוגן:
        </p>
        <Formula tex={String.raw`\text{שיעור חדש} = 1 - \left(\frac{\text{גרט}}{\text{שווי הוגן}}\right)^{\frac{1}{\text{יתרת שנים}}}`} />
        <DataTable
          head={["אחרי ההערכה של", "שווי הוגן", "יתרת שנים", "שיעור חדש", "פחת השנה הבאה"]}
          rows={[
            ["שיעור מקורי (מהעלות)", DB_EX.cost, DB_EX.life, `${(dbRate(DB_EX.cost, DB_EX.salvage, DB_EX.life) * 100).toFixed(2)}%`, r2(db.rows[0].dep)],
            ...db.events.map((ev) => {
              const left = ev.monthsLeft / 12;
              return [String(ev.year), ev.fairValue, left, `${(dbRate(ev.fairValue, DB_EX.salvage, left) * 100).toFixed(2)}%`, r2(ev.firstYearCharge)];
            }),
          ]}
        />
        <RevSchedule r={db} caption="לוח מלא — יתרה פוחתת" />
        <Callout title="איך מודדים את הפרש הפחת בשיטות מואצות">
          <p>
            מחשבים שני לוחות במקביל: הלוח בפועל — מהשווי ההוגן האחרון, במכנה או בשיעור חדשים — ולוח &quot;צל&quot; של מודל העלות, שממשיך כאילו לא הייתה
            הערכה. ההעברה בכל שנה היא ההפרש ביניהם, ובסוף החיים הקרן מתאפסת בדיוק.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
