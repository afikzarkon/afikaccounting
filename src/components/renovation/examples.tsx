import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula, Tex } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { type RenovationInputs, type RenovationResult, solveRenovation } from "@/lib/learn/renovation";
import { capitaliseLines, catchUpLines, DB_EX, dateOf, SL_EX, SYD_ASC_EX, SYD_EX, yearEndLines } from "./data";

const r2 = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number) => `${(v * 100).toFixed(2)}\\%`;

/** The fiscal-year schedule, with the renovation year highlighted. */
function Schedule({ x, r, caption }: { x: RenovationInputs; r: RenovationResult; caption: string }) {
  const split = r.monthsBefore > 0;
  return (
    <DataTable
      caption={caption}
      head={["שנה", "יתרת פתיחה", "שיפוץ", ...(split ? ["פחת לפני השיפוץ", "פחת אחרי השיפוץ"] : []), "סך הפחת", "פחת נצבר", "יתרה בספרים"]}
      rows={r.rows.map((row) => [
        <span key="y" className="num font-semibold">
          {row.year}
        </span>,
        r2(row.opening),
        row.addition ? r2(row.addition) : "—",
        ...(split ? [row.before ? r2(row.before) : "—", row.after ? r2(row.after) : "—"] : []),
        r2(row.charge),
        r2(row.accumulated),
        r2(row.closing),
      ])}
      foot={["סה״כ", "", r2(x.renoCost), ...(split ? ["", ""] : []), r2(r.rows.reduce((s, row) => s + row.charge, 0)), "", ""]}
      highlight={[r.rows.findIndex((row) => row.year === x.renoYear)]}
    />
  );
}

/** The life-year charges after the renovation, with each year's weight or opening balance. */
function NewYears({ x, r }: { x: RenovationInputs; r: RenovationResult }) {
  const openings = r.newYears.map((_, i) => r.adjusted - r.newYears.slice(0, i).reduce((s, c) => s + c, 0));
  return (
    <DataTable
      caption="פחת לכל שנת חיים מיום השיפוץ"
      head={["שנת חיים", "חישוב", "פחת"]}
      rows={r.newYears.map((c, i) => {
        const w = x.newMethod === "syd-desc" ? x.newLife - i : i + 1;
        const calc =
          x.newMethod === "db"
            ? i === x.newLife - 1
              ? `${r2(openings[i]).toLocaleString("en-US")} − ${x.newSalvage.toLocaleString("en-US")} (השלמה לגרט)`
              : `${r2(openings[i]).toLocaleString("en-US")} × ${(r.newRate! * 100).toFixed(2)}%`
            : `${r.newBase.toLocaleString("en-US")} × ${w}/${r.newDigits}`;
        return [
          <span key="k" className="num">
            {i + 1}
          </span>,
          <bdi key="c" dir="ltr" className="num text-[13px]">
            {calc}
          </bdi>,
          r2(c),
        ];
      })}
    />
  );
}

export function RenovationExamplesSection() {
  const sl = solveRenovation(SL_EX);
  const desc = solveRenovation(SYD_EX);
  const asc = solveRenovation(SYD_ASC_EX);
  const db = solveRenovation(DB_EX);
  const slReno = sl.rows.find((row) => row.year === SL_EX.renoYear)!;
  const remainingNoReno = SYD_EX.life - (SYD_EX.renoYear - SYD_EX.firstYear);

  return (
    <>
      <Topic title="דוגמה 1: שיפוץ באמצע השנה — קו ישר" open>
        <p>
          נכס שנרכש ב-1.1.{SL_EX.firstYear} בעלות <Num v={SL_EX.cost} /> ₪, אורך חיים {SL_EX.life} שנים, ללא גרט. ב-{dateOf(SL_EX.renoMonth, SL_EX.renoYear)}{" "}
          בוצע שיפוץ מהותי בעלות <Num v={SL_EX.renoCost} /> ₪, שהאריך את אורך החיים הנותר ל-{SL_EX.newLife} שנים מיום השיפוץ, וגרט חדש של{" "}
          <Num v={SL_EX.newSalvage} /> ₪.
        </p>
        <DataTable
          head={["שלב", "חישוב", "תוצאה"]}
          rows={[
            ["פחת עד יום השיפוץ (3.5 שנים)", <Tex key="f">{String.raw`\frac{${texNum(SL_EX.cost)}}{${SL_EX.life}} \times 3.5`}</Tex>, sl.accumulatedAtReno],
            ["ערך בספרים ליום השיפוץ", <Tex key="f">{String.raw`${texNum(SL_EX.cost)} - ${texNum(sl.accumulatedAtReno)}`}</Tex>, sl.carryingAtReno],
            ["ערך בספרים מותאם", <Tex key="f">{String.raw`${texNum(sl.carryingAtReno)} + ${texNum(SL_EX.renoCost)}`}</Tex>, sl.adjusted],
            ["פחת שנתי חדש", <Tex key="f">{String.raw`\frac{${texNum(sl.adjusted)} - ${texNum(SL_EX.newSalvage)}}{${SL_EX.newLife}}`}</Tex>, sl.newYears[0]],
            ["פחת יולי עד דצמבר", <Tex key="f">{String.raw`${texNum(sl.newYears[0])} \times \frac{6}{12}`}</Tex>, slReno.after],
          ]}
        />
        <div className="grid gap-3 xl:grid-cols-3">
          <JournalEntry title="1. פחת עד השיפוץ" date={`30.6.${SL_EX.renoYear}`} lines={catchUpLines(sl)} />
          <JournalEntry title="2. היוון השיפוץ" date={dateOf(SL_EX.renoMonth, SL_EX.renoYear)} lines={capitaliseLines(SL_EX)} />
          <JournalEntry title="3. פחת לסוף השנה" date={`31.12.${SL_EX.renoYear}`} lines={yearEndLines(slReno.after)} />
        </div>
        <Schedule x={SL_EX} r={sl} caption="לוח פחת מלא — קו ישר" />
        <p className="text-sm text-muted">
          הנכס מגיע לגרט החדש (<Num v={SL_EX.newSalvage} />) ב-30.6.{SL_EX.renoYear + SL_EX.newLife} — שמונה שנים בדיוק מיום השיפוץ. לכן בשנה
          האחרונה יש רק חצי שנה של פחת.
        </p>
      </Topic>

      <Topic title="דוגמה 2: שיפוץ בתחילת שנה — סכום ספרות השנים" open>
        <p>
          נכס שנרכש ב-1.1.{SYD_EX.firstYear} בעלות <Num v={SYD_EX.cost} /> ₪, אורך חיים {SYD_EX.life} שנים, ללא גרט. ב-1.1.{SYD_EX.renoYear} (אחרי
          שתי שנים) בוצע שיפוץ מהותי בעלות <Num v={SYD_EX.renoCost} /> ₪. יתרת אורך החיים עודכנה ל-{SYD_EX.newLife} שנים, וערך הגרט החדש:{" "}
          <Num v={SYD_EX.newSalvage} /> ₪. כי השיפוץ ב-1 בינואר, אין פחת יחסי — כל שנה מחושבת במלואה לפי הנתונים של אותה תקופה.
        </p>

        <p className="!mb-1 font-semibold text-fg">איך מחשבים את סכום הספרות החדש</p>
        <Formula
          tex={String.raw`\text{סכום ספרות השנים} = \frac{\text{יתרת שנים} \times (\text{יתרת שנים} + 1)}{2}`}
          caption={`בלי השיפוץ היו נותרות ${remainingNoReno} שנים: 3 + 2 + 1 = ${(remainingNoReno * (remainingNoReno + 1)) / 2}. אחרי השיפוץ נותרו ${SYD_EX.newLife}: 4 + 3 + 2 + 1 = ${desc.newDigits}`}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="text-[15px] font-semibold text-fg">יורד (מואץ) — הפחת הגבוה בשנה הראשונה</p>
            <Formula
              tex={String.raw`\text{ערך מותאם} = \underbrace{${texNum(SYD_EX.cost)} - ${texNum(desc.accumulatedAtReno)}}_{\text{ערך בספרים}} + ${texNum(SYD_EX.renoCost)} = ${texNum(desc.adjusted)}`}
              caption={`הפחת לפני השיפוץ: ${SYD_EX.cost.toLocaleString("en-US")} × 5/15 + ${SYD_EX.cost.toLocaleString("en-US")} × 4/15 = ${desc.accumulatedAtReno.toLocaleString("en-US")}`}
            />
            <Formula tex={String.raw`\text{פחת שנת חיים} = (${texNum(desc.adjusted)} - ${texNum(SYD_EX.newSalvage)}) \times \frac{\text{שנים שנותרו, כולל השנה}}{${desc.newDigits}}`} />
            <NewYears x={SYD_EX} r={desc} />
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-[15px] font-semibold text-fg">עולה (מואט) — הפחת הגבוה בשנה האחרונה</p>
            <Formula
              tex={String.raw`\text{ערך מותאם} = \underbrace{${texNum(SYD_ASC_EX.cost)} - ${texNum(asc.accumulatedAtReno)}}_{\text{ערך בספרים}} + ${texNum(SYD_ASC_EX.renoCost)} = ${texNum(asc.adjusted)}`}
              caption={`הפחת לפני השיפוץ: ${SYD_ASC_EX.cost.toLocaleString("en-US")} × 1/15 + ${SYD_ASC_EX.cost.toLocaleString("en-US")} × 2/15 = ${asc.accumulatedAtReno.toLocaleString("en-US")}`}
            />
            <Formula tex={String.raw`\text{פחת שנת חיים} = (${texNum(asc.adjusted)} - ${texNum(SYD_ASC_EX.newSalvage)}) \times \frac{\text{מספר שנת החיים מיום השיפוץ}}{${asc.newDigits}}`} />
            <NewYears x={SYD_ASC_EX} r={asc} />
          </div>
        </div>
        <Callout title="סופרים את שנות החיים מחדש מיום השיפוץ">
          <p>
            אחרי השיפוץ שנת החיים הראשונה היא שוב &quot;שנה 1&quot;. ביורד — המשקל שלה הוא היתרה המלאה ({SYD_EX.newLife}/{desc.newDigits}); בעולה — 1/
            {asc.newDigits}. מה שהיה לפני השיפוץ לא משנה את המשקלות, רק את הערך בספרים שממנו מתחילים.
          </p>
        </Callout>
        <Schedule x={SYD_EX} r={desc} caption="לוח פחת מלא — יורד" />
      </Topic>

      <Topic title="דוגמה 3: שיפוץ בשיטת היתרה הפוחתת" open>
        <p>
          נכס שנרכש ב-1.1.{DB_EX.firstYear} בעלות <Num v={DB_EX.cost} /> ₪, אורך חיים {DB_EX.life} שנים, גרט <Num v={DB_EX.salvage} /> ₪. ב-1.1.
          {DB_EX.renoYear} בוצע שיפוץ מהותי בעלות <Num v={DB_EX.renoCost} /> ₪; יתרת אורך החיים עודכנה ל-{DB_EX.newLife} שנים והגרט ל-
          <Num v={DB_EX.newSalvage} /> ₪.
        </p>
        <Formula
          tex={String.raw`\text{שיעור הפחת המקורי} = 1 - \left(\frac{\text{ערך גרט}}{\text{עלות}}\right)^{\frac{1}{\text{אורך חיים}}} = 1 - \left(\frac{${texNum(DB_EX.salvage)}}{${texNum(DB_EX.cost)}}\right)^{\frac{1}{${DB_EX.life}}} = ${pct(db.oldRate!)}`}
          caption={`לפני השיפוץ: ${DB_EX.cost.toLocaleString("en-US")} × 50% = ${db.oldYears[0].toLocaleString("en-US")}, ואחר כך ${(DB_EX.cost - db.oldYears[0]).toLocaleString("en-US")} × 50% = ${db.oldYears[1].toLocaleString("en-US")}`}
        />
        <Formula
          tex={String.raw`\text{ערך בספרים מותאם} = ${texNum(db.carryingAtReno)} + ${texNum(DB_EX.renoCost)} = ${texNum(db.adjusted)}`}
          caption="הערך המותאם משמש כ״עלות החדשה״ של היתרה הפוחתת"
        />
        <Formula
          tex={String.raw`\text{שיעור חדש} = 1 - \left(\frac{\text{ערך גרט חדש}}{\text{ערך בספרים מותאם}}\right)^{\frac{1}{\text{יתרת שנים}}} = 1 - \left(\frac{${texNum(DB_EX.newSalvage)}}{${texNum(db.adjusted)}}\right)^{\frac{1}{${DB_EX.newLife}}} = ${pct(db.newRate!)}`}
        />
        <NewYears x={DB_EX} r={db} />
        <Callout kind="warn" title="לא ממשיכים עם השיעור הישן">
          <p>
            השיעור הישן (50%) נבנה כדי להביא את העלות המקורית לגרט הישן. אחרי השיפוץ יש נתונים חדשים — ערך מותאם, גרט חדש ויתרת שנים — ולכן מחשבים
            שיעור חדש. בשנה האחרונה היתרה מושלמת בדיוק לגרט, כדי לסגור הפרשי עיגול.
          </p>
        </Callout>
        <Schedule x={DB_EX} r={db} caption="לוח פחת מלא — יתרה פוחתת" />
      </Topic>
    </>
  );
}
