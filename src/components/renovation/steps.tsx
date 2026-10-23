import { CalendarCheck, Calculator, History, PlusCircle, SlidersHorizontal } from "lucide-react";
import { Callout, DataTable, JournalEntry, n, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { StepCard, texNum } from "@/components/study/ui";
import { solveRenovation } from "@/lib/learn/renovation";
import { capitaliseLines, catchUpLines, dateOf, SL_EX, yearEndLines } from "./data";

const X = SL_EX;
const R = solveRenovation(X);
const FULL_YEARS = X.renoYear - X.firstYear;
const OLD_ANNUAL = R.oldYears[0];
const ELAPSED = FULL_YEARS + R.monthsBefore / 12;
const REMAINING_BEFORE = X.life - ELAPSED;
const NEW_ANNUAL = R.newYears[0];
const RENO_ROW = R.rows.find((r) => r.year === X.renoYear)!;
const RENO_DATE = dateOf(X.renoMonth, X.renoYear);

const STEPS = ["זיהוי תאריך השיפוץ", "עדכון פחת עד תאריך השיפוץ", "הוספת עלות השיפוץ", "בחינת שינוי באומדנים", "חישוב הפחת מיום השיפוץ"];

export function RenovationStepsSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">דרכים לפתור שאלת שיפוץ — במבט אחד</p>
        <p className="mt-1 text-[15px] text-fg/90">
          כל שאלה על שיפוץ מהותי נפתרת באותם חמישה שלבים, באותו הסדר. לאורך הדרך נפתור דוגמה אחת: נכס שנרכש ב-1.1.{X.firstYear} בעלות{" "}
          <Num v={X.cost} /> ₪, לאורך חיים של {X.life} שנים, ללא גרט, בקו ישר. ב-{RENO_DATE} (כעבור {ELAPSED} שנים) בוצע בו שיפוץ מהותי בעלות{" "}
          <Num v={X.renoCost} /> ₪, שהאריך את אורך החיים הנותר ל-{X.newLife} שנים מיום השיפוץ, ונקבע ערך גרט חדש של <Num v={X.newSalvage} /> ₪.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <StepCard step={1} title="זיהוי תאריך השיפוץ" lead="בתחילת השנה או במהלכה?" icon={<CalendarCheck className="h-5 w-5" />}>
        <p>
          התאריך קובע איך נראית שנת השיפוץ. שיפוץ ב-1 בינואר פשוט: כל השנה כבר מחושבת לפי הנתונים החדשים. שיפוץ <strong>במהלך השנה</strong> מפצל
          אותה לשניים — חלק לפי הנתונים הישנים, וחלק לפי החדשים.
        </p>
        <DataTable
          caption={`בדוגמה: שיפוץ ב-${RENO_DATE}`}
          head={["חלק משנת " + X.renoYear, "תקופה", "חודשים", "לפי"]}
          rows={[
            ["לפני השיפוץ", "ינואר עד יוני", `${R.monthsBefore}`, "הנתונים המקוריים"],
            ["אחרי השיפוץ", "יולי עד דצמבר", `${R.monthsAfter}`, "הערך המותאם והאומדנים החדשים"],
          ]}
        />
      </StepCard>

      <StepCard step={2} title="עדכון פחת עד תאריך השיפוץ" lead="פחת יחסי מתחילת השנה ועד יום השיפוץ — ורק אז מוסיפים" icon={<History className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{פחת שנתי מקורי} = \frac{\text{עלות} - \text{גרט}}{\text{אורך חיים}} = \frac{${texNum(X.cost)} - ${texNum(X.salvage)}}{${X.life}} = ${texNum(OLD_ANNUAL)}`}
        />
        <Formula
          tex={String.raw`\text{פחת עד יום השיפוץ} = ${texNum(OLD_ANNUAL)} \times ${ELAPSED} = ${texNum(R.accumulatedAtReno)}`}
          caption={`${FULL_YEARS} שנים מלאות (${n(OLD_ANNUAL * FULL_YEARS)}) ועוד ${R.monthsBefore} חודשים בשנת ${X.renoYear} (${n(R.depToDate)})`}
        />
        <Formula
          tex={String.raw`\text{ערך בספרים ליום השיפוץ} = \text{עלות מקורית} - \text{פחת נצבר מעודכן} = ${texNum(X.cost)} - ${texNum(R.accumulatedAtReno)} = ${texNum(R.carryingAtReno)}`}
        />
        <JournalEntry title={`פחת ינואר עד יוני ${X.renoYear}`} date={`30.6.${X.renoYear}`} lines={catchUpLines(R)} />
      </StepCard>

      <StepCard step={3} title="הוספת עלות השיפוץ לערך בספרים" lead="השיפוץ נכנס לנכס, והערך בספרים גדל" icon={<PlusCircle className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{ערך בספרים מותאם} = \text{ערך בספרים ליום השיפוץ} + \text{עלות השיפוץ} = ${texNum(R.carryingAtReno)} + ${texNum(X.renoCost)} = ${texNum(R.adjusted)}`}
        />
        <JournalEntry title="היוון השיפוץ" date={RENO_DATE} lines={capitaliseLines(X)} />
        <p className="text-sm text-muted">
          בספרים: עלות <Num v={X.cost + X.renoCost} /> (מקורית ועוד שיפוץ), פחת נצבר <Num v={R.accumulatedAtReno} /> — ערך בספרים <Num v={R.adjusted} />.
        </p>
      </StepCard>

      <StepCard step={4} title="בחינת שינוי באומדנים" lead="אורך חיים, ערך גרט ושיטת פחת — מה השתנה בעקבות השיפוץ?" icon={<SlidersHorizontal className="h-5 w-5" />}>
        <DataTable
          head={["אומדן", "לפני השיפוץ", "אחרי השיפוץ"]}
          rows={[
            ["יתרת אורך חיים", `${REMAINING_BEFORE} שנים`, `${X.newLife} שנים`],
            ["ערך גרט", X.salvage, X.newSalvage],
            ["שיטת פחת", "קו ישר", "קו ישר (ללא שינוי)"],
          ]}
        />
        <Callout kind="check" title="שינוי אומדן — מכאן ולהבא">
          <p>
            שינוי באורך החיים, בערך הגרט או בשיטת הפחת הוא <strong>שינוי אומדן</strong> (סעיפים 51, 61): לא מתקנים את הפחת של השנים הקודמות —
            רק מחשבים מחדש מיום השיפוץ.
          </p>
        </Callout>
      </StepCard>

      <StepCard step={5} title="חישוב הפחת מיום השיפוץ ואילך" lead="הערך המותאם, פחות הגרט החדש, על פני יתרת אורך החיים" icon={<Calculator className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{פחת שנתי חדש} = \frac{\text{ערך בספרים מותאם} - \text{גרט חדש}}{\text{יתרת אורך החיים}} = \frac{${texNum(R.adjusted)} - ${texNum(X.newSalvage)}}{${X.newLife}} = ${texNum(NEW_ANNUAL)}`}
        />
        <Formula
          tex={String.raw`\text{פחת יולי עד דצמבר} = ${texNum(NEW_ANNUAL)} \times \frac{${R.monthsAfter}}{12} = ${texNum(RENO_ROW.after)}`}
        />
        <JournalEntry title={`פחת יולי עד דצמבר ${X.renoYear}`} date={`31.12.${X.renoYear}`} lines={yearEndLines(RENO_ROW.after)} />
        <Callout kind="check" title={`סך הפחת בשנת ${X.renoYear}`}>
          <p>
            שני חלקים: <Num v={R.depToDate} /> לפני השיפוץ ועוד <Num v={RENO_ROW.after} /> אחריו = <Num v={RENO_ROW.charge} />. הלוח המלא — בלשונית
            &quot;דוגמאות לפי שיטות&quot;.
          </p>
        </Callout>
      </StepCard>
    </>
  );
}
