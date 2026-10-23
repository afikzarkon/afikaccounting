import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { dbRate, type RevaluationResult, type RevEvent, solveLand, solveRevaluation } from "@/lib/learn/revaluation";
import { DB_EX, depLines, nettingLines, PROPERTY, PROPERTY_BUILDING, PROPERTY_LAND, SL_EX, SYD_EX, transferLines } from "./data";
import { RevSchedule } from "./schedule";

const r2 = (v: number) => Math.round(v * 100) / 100;

/** What each year's revaluation found and where its gap went. */
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
      highlight={r.events.map((ev, i) => (Math.abs(ev.pl) > 0.005 ? i : -1)).filter((i) => i >= 0)}
    />
  );
}

function whatHappened(ev: RevEvent) {
  if (Math.abs(ev.diff) < 0.005) return "אין שינוי";
  if (ev.diff > 0) return ev.surplusBefore > 0 ? "עלייה נוספת — לקרן" : "עלייה — לקרן";
  return ev.pl < 0 ? (ev.oci < 0 ? "הקרן מתאפסת, והיתרה הפסד" : "ירידה — הפסד ברווח והפסד") : "ירידה — מקטינה את הקרן";
}

export function RevaluationExamplesSection() {
  const sl = solveRevaluation(SL_EX);
  const syd = solveRevaluation(SYD_EX);
  const db = solveRevaluation(DB_EX);
  const row = (r: RevaluationResult, year: number) => r.rows.find((x) => x.year === year)!;
  const first = sl.events[0];
  const y2021 = row(sl, 2021);
  const ev2021 = sl.events.find((e) => e.year === 2021)!;
  const sydFirst = syd.events[0];
  const loss = sl.events.find((e) => e.pl < 0)!;
  const lossRow = row(sl, loss.year);
  const pb = solveRevaluation(PROPERTY_BUILDING);
  const pl = solveLand(PROPERTY.land.cost, PROPERTY_LAND);

  return (
    <>
      <Topic title="דוגמה 1: מבנה בקו ישר — הערכה מחדש בכל שנה, העברה לעודפים בקצב הפחת" open>
        <p>
          מבנה שנרכש ב-1.1.{SL_EX.firstYear} ב-<Num v={SL_EX.cost} /> ₪, אורך חיים {SL_EX.life} שנים, קו ישר, ללא גרט. החברה מעריכה אותו מחדש בכל 31.12. בכל
          שנה אותם שלבים: פחת השנה לפי השווי ההוגן הקודם, פער מול השווי החדש, סיווג — ופחת חדש על יתרת החיים.
        </p>
        <EventsTable r={sl} caption="ההערכות מחדש, שנה אחרי שנה" />
        <Formula
          tex={String.raw`\text{פחת השנה} = \frac{\text{השווי ההוגן הקודם}}{\text{יתרת אורך החיים}} \qquad \text{למשל לשנת 2021:} \ \frac{${texNum(first.fairValue)}}{${first.monthsLeft / 12}} = ${texNum(first.firstYearCharge)}`}
        />
        <Formula
          tex={String.raw`\text{העברה לעודפים} = \text{פחת לפי שווי הוגן} - \text{פחת לפי מודל העלות} \qquad \text{לשנת 2021:} \ ${texNum(y2021.dep)} - ${texNum(y2021.costDep)} = ${texNum(y2021.transfer)}`}
        />
        <p className="!mb-1 font-semibold text-fg">הפקודות של שנת 2021 — ירידה בתוך הקרן</p>
        <div className="grid gap-3 xl:grid-cols-3">
          <JournalEntry title="1. פחת השנה" date="31.12.2021" lines={depLines(y2021.dep)} />
          <JournalEntry title="2. העברה לעודפים" date="31.12.2021" lines={transferLines(y2021.transfer)} note="פקודה בהון העצמי — לא דרך רווח והפסד." />
          <JournalEntry title="3. הערכה מחדש (שיטת הביטול)" date="31.12.2021" lines={nettingLines(ev2021)} />
        </div>
        <p className="!mb-1 font-semibold text-fg">והפקודות של שנת {loss.year} — כשהירידה עוברת את הקרן</p>
        <div className="grid gap-3 xl:grid-cols-3">
          <JournalEntry title="1. פחת השנה" date={`31.12.${loss.year}`} lines={depLines(lossRow.dep)} />
          <JournalEntry title="2. העברה לעודפים" date={`31.12.${loss.year}`} lines={transferLines(lossRow.transfer)} />
          <JournalEntry
            title="3. הערכה מחדש — קודם הקרן, היתרה הפסד"
            date={`31.12.${loss.year}`}
            lines={nettingLines(loss)}
            note={
              <>
                בקרן נותרו <Num v={r2(loss.surplusBefore)} /> בלבד, ולכן מתוך ירידה של <Num v={r2(-loss.diff)} /> — <Num v={r2(-loss.oci)} /> מאפסים את הקרן ו-
                <Num v={r2(-loss.pl)} /> נזקפים להפסד.
              </>
            }
          />
        </div>
        <RevSchedule r={sl} caption="לוח מלא — קו ישר, הערכה בכל שנה" />
        <p className="text-sm text-muted">
          שימו לב: הסדר בכל 31.12 הוא תמיד פחת ← העברה לעודפים ← הערכה מחדש. ההעברה מחושבת לפי הפחת של השנה, ולכן נרשמת לפני ההערכה של אותו
          יום.
        </p>
      </Topic>

      <Topic title="דוגמה 2: הערכה בכל שנה בשיטות מואצות" open>
        <p className="!mb-1 font-semibold text-fg">סכום ספרות השנים — יורד</p>
        <p>
          מבנה בעלות <Num v={SYD_EX.cost} /> ₪, {SYD_EX.life} שנים, ללא גרט, מוערך בכל 31.12. אחרי כל הערכה מחשבים <strong>מכנה חדש</strong> לפי יתרת
          השנים, ושנת החיים הראשונה מתחילה מחדש:
        </p>
        <DataTable
          head={["אחרי ההערכה של", "שווי הוגן", "יתרת שנים", "מכנה חדש", "פחת השנה הבאה"]}
          rows={syd.events.map((ev) => {
            const n = ev.monthsLeft / 12;
            return [String(ev.year), ev.fairValue, n, (n * (n + 1)) / 2, r2(ev.firstYearCharge)];
          })}
        />
        <p>
          לוח הצל של מודל העלות ממשיך כאילו לא הייתה אף הערכה: 4/10, 3/10, 2/10, 1/10 מהעלות המקורית. ההעברה לעודפים בכל שנה — ההפרש. שימו לב
          ל-{syd.events[1].year}: עלייה נוספת, שמצטרפת לקרן שכבר נוצרה ב-{sydFirst.year}:
        </p>
        <RevSchedule r={syd} caption="לוח מלא — סכום ספרות השנים" />

        <p className="!mb-1 font-semibold text-fg">יתרה פוחתת</p>
        <p>
          מבנה בעלות <Num v={DB_EX.cost} /> ₪, {DB_EX.life} שנים, גרט <Num v={DB_EX.salvage} /> ₪, מוערך בכל 31.12. אחרי כל הערכה מחשבים{" "}
          <strong>שיעור חדש</strong> מהשווי ההוגן:
        </p>
        <Formula tex={String.raw`\text{שיעור חדש} = 1 - \left(\frac{\text{גרט}}{\text{שווי הוגן}}\right)^{\frac{1}{\text{יתרת שנים}}}`} />
        <DataTable
          head={["אחרי ההערכה של", "שווי הוגן", "יתרת שנים", "שיעור חדש", "פחת השנה הבאה"]}
          rows={[
            ["שיעור מקורי (מהעלות)", DB_EX.cost, DB_EX.life, `${(dbRate(DB_EX.cost, DB_EX.salvage, DB_EX.life) * 100).toFixed(2)}%`, r2(db.rows[0].dep)],
            ...db.events.map((ev) => {
              const n = ev.monthsLeft / 12;
              return [String(ev.year), ev.fairValue, n, `${(dbRate(ev.fairValue, DB_EX.salvage, n) * 100).toFixed(2)}%`, r2(ev.firstYearCharge)];
            }),
          ]}
        />
        <RevSchedule r={db} caption="לוח מלא — יתרה פוחתת" />
        <Callout title="איך מודדים את הפרש הפחת בשיטות מואצות">
          <p>
            מחשבים שני לוחות במקביל: הלוח בפועל — מהשווי ההוגן האחרון, במכנה או בשיעור חדשים — ולוח &quot;צל&quot; של מודל העלות, שממשיך כאילו לא
            הייתה הערכה. ההעברה בכל שנה היא ההפרש ביניהם, ולכן היא לא קבועה כמו בקו ישר — אבל בסוף החיים הקרן מתאפסת בדיוק.
          </p>
        </Callout>
      </Topic>

      <Topic title="דוגמה 3: נכס עם קרקע — מבנה וקרקע מוערכים בנפרד" open>
        <p>
          ב-1.1.{PROPERTY.firstYear} נרכש נכס ב-<Num v={PROPERTY.land.cost + PROPERTY.building.cost} /> ₪: קרקע <Num v={PROPERTY.land.cost} /> ומבנה{" "}
          <Num v={PROPERTY.building.cost} /> (אורך חיים {PROPERTY.building.life} שנים, קו ישר). בכל 31.12 נקבע שווי הוגן לנכס כולו, ומפצלים אותו בין
          הקרקע למבנה. כל מרכיב מוערך <strong>בנפרד</strong>, עם קרן משלו — ירידה בקרקע לא מקוזזת מול הקרן של המבנה (סעיף 58).
        </p>
        <DataTable
          caption="השווי ההוגן ופיצולו"
          head={["31.12", "שווי הוגן — נכס כולו", "מתוכו קרקע", "מתוכו מבנה"]}
          rows={pl.map((l, i) => [String(l.year), l.fairValue + pb.events[i].fairValue, l.fairValue, pb.events[i].fairValue])}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <DataTable
            caption="הקרקע — אין פחת"
            head={["31.12", "לפני", "פער", "לקרן", "לרווח והפסד", "קרן קרקע"]}
            rows={pl.map((l) => [String(l.year), l.opening, l.diff, l.oci + 0, l.pl + 0, l.surplus + 0])}
          />
          <DataTable
            caption="המבנה — פחת, הערכה, העברה"
            head={["31.12", "פחת", "לפני", "פער", "לקרן", "קרן מבנה"]}
            rows={pb.events.map((ev) => [String(ev.year), r2(row(pb, ev.year).dep), r2(ev.before), r2(ev.diff), r2(ev.oci) + 0, r2(ev.surplusAfter) + 0])}
          />
        </div>
        <Callout kind="warn" title="שני מרכיבים, שתי קרנות — לא מקזזים ביניהם">
          <p>
            ב-{pl[1].year} הקרקע ירדה ב-<Num v={-pl[1].diff} />: הקרן שלה (<Num v={pl[0].surplus} />) התאפסה, והיתרה — <Num v={-pl[1].pl} /> — נזקפה להפסד.
            לא משתמשים לשם כך בקרן של המבנה: כל מרכיב והקרן שלו. ב-{pl[2].year} הקרקע ירדה שוב ב-<Num v={-pl[2].diff} />, ואין לה עוד קרן — ולכן כל הירידה
            הפסד, אף שלמבנה יש באותה שנה קרן של <Num v={r2(pb.events[2].surplusAfter)} />.
          </p>
        </Callout>
        <div className="grid gap-3 xl:grid-cols-2">
          <JournalEntry
            title={`הערכה מחדש ${pl[1].year} — קרקע`}
            date={`31.12.${pl[1].year}`}
            lines={[
              { account: "קרן הערכה מחדש — קרקע", dr: -pl[1].oci },
              { account: "הפסד מירידת ערך קרקע (רווח והפסד)", dr: -pl[1].pl },
              { account: "קרקע", cr: -pl[1].diff },
            ]}
          />
          <JournalEntry title={`הערכה מחדש ${pb.events[1].year} — מבנה`} date={`31.12.${pb.events[1].year}`} lines={nettingLines(pb.events[1])} />
        </div>
        <p className="text-sm text-muted">
          רק קרן המבנה עוברת לעודפים בקצב הפחת. קרן הקרקע נשארת בהון עד שהקרקע נמכרת.
        </p>
      </Topic>
    </>
  );
}
