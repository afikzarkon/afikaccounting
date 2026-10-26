import { Callout, DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { solveLand, solveRevaluation } from "@/lib/learn/revaluation";
import { depLines, nettingLines, side, transferLines, YEARLY_EX, YEARLY_LAND } from "./data";

const r2 = (v: number) => Math.round(v * 100) / 100;
const R = solveRevaluation(YEARLY_EX);
const LAND_ROWS = solveLand(YEARLY_LAND.cost, YEARLY_LAND.values);
const X = YEARLY_EX;
const ANNUAL = (X.cost - X.salvage) / X.life;
// The years worked in full: every revaluation, and the year after the last one.
const YEARS = [...R.events.map((e) => e.year), R.events.at(-1)!.year + 1];

export function YearlyRevaluationSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">הנתונים</p>
        <p className="mt-1 text-[15px] leading-relaxed text-fg/90">
          ב-1.1.{X.firstYear} נקנה מבנה עם הקרקע שעליו ב-<Num v={X.cost + YEARLY_LAND.cost} /> ₪: הקרקע <Num v={YEARLY_LAND.cost} /> ₪ והמבנה <Num v={X.cost} /> ₪.
          אורך החיים של המבנה {X.life} שנים, ערך גרט <Num v={X.salvage} /> ₪, קו ישר. החברה מעריכה מחדש <strong>בכל 31.12</strong> — גם את המבנה וגם את
          הקרקע — ומעבירה את הקרן לעודפים בקצב הפחת.
        </p>
        <DataTable
          caption="השווי ההוגן בכל 31.12"
          head={["31.12", "מבנה", "קרקע"]}
          rows={R.events.map((e, i) => [String(e.year), e.fairValue, LAND_ROWS[i].fairValue])}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm font-semibold text-fg">הנוסחה לפחת אחרי כל הערכה</p>
          <Formula tex={String.raw`\text{פחת שנתי} = \frac{\text{שווי הוגן של המבנה} - \text{גרט}}{\text{יתרת אורך החיים}}`} />
          <p className="text-[13.5px] text-fg/90">
            הסכום בר-הפחת הוא <strong>השווי ההוגן פחות הגרט</strong> — את הגרט לא מפחיתים אף פעם. ו<strong>הקרקע לא נכנסת</strong>: היא לא מופחתת, אז רק
            השווי של המבנה נכנס למונה.
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-fg">הנוסחה להעברה לעודפים בקצב הפחת</p>
          <Formula tex={String.raw`\text{העברה שנתית} = \frac{\text{יתרת קרן ההערכה מחדש של המבנה}}{\text{יתרת אורך החיים}}`} />
          <p className="text-[13.5px] text-fg/90">
            הקרן &quot;מתממשת&quot; לאורך השנים שנשארו, באותו קצב שבו המבנה מופחת. בקו ישר זה יוצא בדיוק אותו סכום כמו{" "}
            <strong>פחת לפי השווי ההוגן פחות פחת לפי העלות</strong> — ושתי הדרכים מוצגות בכל שנה למטה. קרן הקרקע לא מועברת: הקרקע לא מופחתת.
          </p>
        </div>
      </div>

      <Callout kind="warn" title="שלוש טעויות שחוזרות בכל מבחן">
        <ul className="list-inside list-disc space-y-1">
          <li>שוכחים להוריד את הגרט מהשווי ההוגן לפני שמחלקים ביתרת החיים.</li>
          <li>מכניסים את הקרקע לבסיס הפחת — היא לא מופחתת, גם אחרי הערכה מחדש.</li>
          <li>מעבירים לעודפים גם את קרן הקרקע — היא נשארת בהון עד שהקרקע נמכרת או נגרעת.</li>
        </ul>
      </Callout>

      <ol className="space-y-4">
        {YEARS.map((year) => {
          const row = R.rows.find((x) => x.year === year)!;
          const prev = R.events.find((e) => e.year === year - 1);
          const ev = R.events.find((e) => e.year === year);
          const land = LAND_ROWS.find((x) => x.year === year);
          const left = prev ? prev.monthsLeft / 12 : X.life;
          return (
            <li key={year} className="card overflow-hidden">
              <p className="border-b border-line bg-surface-2/50 px-5 py-3 text-[16px] font-semibold text-fg">שנת {year}</p>
              <div className="space-y-3 px-5 py-4 text-[14.5px] text-fg/90">
                <p className="font-semibold text-fg">1. פחת השנה {prev ? `— לפי השווי ההוגן מ-31.12.${prev.year}` : "— לפי העלות (עוד לא הייתה הערכה)"}</p>
                <Formula
                  tex={
                    prev
                      ? String.raw`\frac{${texNum(prev.fairValue)} - ${texNum(X.salvage)}}{${left}} = ${texNum(r2(row.dep))}`
                      : String.raw`\frac{${texNum(X.cost)} - ${texNum(X.salvage)}}{${X.life}} = ${texNum(ANNUAL)}`
                  }
                  caption={prev ? `(שווי הוגן − גרט) ÷ ${left} השנים שנשארו מ-31.12.${prev.year}` : "(עלות − גרט) ÷ אורך החיים"}
                />
                <p className="font-semibold text-fg">2. העברה לעודפים</p>
                {prev && prev.surplusAfter > 0.005 ? (
                  <>
                    <Formula
                      tex={String.raw`\frac{${texNum(r2(prev.surplusAfter))}}{${left}} = ${texNum(r2(row.transfer))} \qquad \text{בדיקה: } ${texNum(r2(row.dep))} - ${texNum(r2(row.costDep))} = ${texNum(r2(row.dep - row.costDep))}`}
                      caption="יתרת הקרן ÷ יתרת אורך החיים — ואותו סכום בדרך השנייה: פחת לפי שווי הוגן פחות פחת לפי העלות"
                    />
                  </>
                ) : (
                  <p className="text-muted">אין עדיין קרן — אין מה להעביר.</p>
                )}
                {ev && (
                  <>
                    <p className="font-semibold text-fg">3. הערכה מחדש של המבנה ב-31.12.{year}</p>
                    <Formula
                      tex={String.raw`\text{ערך בספרים} = ${prev ? texNum(prev.fairValue) : texNum(X.cost)} - ${texNum(r2(row.dep))} = ${texNum(r2(ev.before))} \qquad \text{פער} = ${texNum(ev.fairValue)} - ${texNum(r2(ev.before))} = ${texNum(r2(ev.diff))}`}
                    />
                    <p>
                      {ev.diff >= 0 ? "עלייה" : "ירידה"} של <Num v={r2(Math.abs(ev.diff))} />
                      {ev.diff >= 0
                        ? ev.pl > 0
                          ? " — קודם מבטלת הפסד קודם, והשאר לקרן."
                          : " — נזקפת לקרן ההערכה מחדש."
                        : ev.pl < 0
                          ? " — מאפסת את הקרן, והשאר הפסד ברווח והפסד."
                          : " — יש מספיק בקרן, אז היא רק מקטינה אותה."}{" "}
                      יתרת קרן המבנה: <Num v={r2(prev ? prev.surplusAfter - row.transfer : 0)} /> {ev.oci >= 0 ? "+" : "−"} <Num v={r2(Math.abs(ev.oci))} /> ={" "}
                      <Num v={r2(ev.surplusAfter)} />. מכאן נשארו {ev.monthsLeft / 12} שנים.
                    </p>
                  </>
                )}
                {land && (
                  <>
                    <p className="font-semibold text-fg">4. הערכה מחדש של הקרקע</p>
                    <p>
                      שווי קודם <Num v={land.opening} />, שווי הוגן <Num v={land.fairValue} /> — פער <Num v={land.diff} />. אין פחת ואין העברה לעודפים; קרן הקרקע:{" "}
                      <Num v={land.surplus} />.
                    </p>
                  </>
                )}
                <div className="grid gap-3 xl:grid-cols-2">
                  <JournalEntry title="פחת השנה (מבנה)" date={`31.12.${year}`} lines={depLines(row.dep)} />
                  {row.transfer > 0.005 && <JournalEntry title="העברה לעודפים (קרן המבנה)" date={`31.12.${year}`} lines={transferLines(row.transfer)} />}
                  {ev && <JournalEntry title="הערכה מחדש — מבנה (שיטת הביטול)" date={`31.12.${year}`} lines={nettingLines(ev)} />}
                  {land && (
                    <JournalEntry
                      title="הערכה מחדש — קרקע"
                      date={`31.12.${year}`}
                      lines={[...side("קרקע", land.diff), ...side("קרן הערכה מחדש — קרקע (רווח כולל אחר)", -land.oci), ...side("הפסד מירידת ערך (רווח והפסד)", -land.pl)].sort(
                        (a, b) => Number(a.cr !== undefined) - Number(b.cr !== undefined),
                      )}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <DataTable
        caption="הכול במבט אחד — מבנה"
        head={["שנה", "פחת", "פחת לפי עלות", "העברה לעודפים", "פער הערכה", "ערך בספרים 31.12", "קרן מבנה 31.12"]}
        rows={R.rows
          .filter((x) => x.year <= YEARS.at(-1)!)
          .map((x) => [String(x.year), r2(x.dep), r2(x.costDep), r2(x.transfer) || "—", r2(x.revaluation) || "—", r2(x.closing), r2(x.surplus)])}
      />
    </>
  );
}
