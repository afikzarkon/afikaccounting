import { CalendarClock } from "lucide-react";
import { Callout, DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { StepCard, texNum } from "@/components/study/ui";
import { solveExchange } from "@/lib/learn/exchange";
import { EXAMPLE, EXCHANGE_YEAR, YEAR_END, yearEndLines } from "./entries";

const WITH = solveExchange(EXAMPLE);
const WITHOUT = solveExchange({ ...EXAMPLE, commercial: false });
const RECEIVED = solveExchange({ ...EXAMPLE, basis: "received" });

export function NewAssetSection() {
  return (
    <>
      <StepCard
        step={4}
        title="המשך השנה: פחת הנכס החדש עד 31 בדצמבר"
        lead="הנכס החדש מתחיל דף חדש — עם הנתונים שלו בלבד"
        icon={<CalendarClock className="h-5 w-5" />}
      >
        <p>מיום ההחלפה הנכס הישן כבר לא קיים בספרים. את הנכס החדש מפחיתים מיום ההחלפה ועד סוף השנה:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            לפי אורך החיים, ערך הגרט ושיטת הפחת <strong>החדשים</strong> של הנכס שהתקבל — לא של הנכס הישן.
          </li>
          <li>על העלות החדשה שנקבעה בשלב 3, כשהפחת הנצבר שלו ביום ההחלפה הוא אפס.</li>
          <li>באופן יחסי — רק לחודשים שנותרו מיום ההחלפה ועד 31 בדצמבר.</li>
        </ul>
        <Formula
          tex={String.raw`\text{פחת שנתי — נכס חדש} = \frac{\text{עלות נכס חדש} - \text{גרט חדש}}{\text{אורך חיים חדש}} = \frac{${texNum(WITH.newCost)} - ${texNum(EXAMPLE.newSalvage)}}{${EXAMPLE.newLife}} = ${texNum(WITH.newAnnual)}`}
        />
        <Formula
          tex={String.raw`\text{פחת עד סוף השנה} = \text{פחת שנתי — נכס חדש} \times \frac{\text{החודשים שנותרו}}{12} = ${texNum(WITH.newAnnual)} \times \frac{${WITH.monthsAfter}}{12} = ${texNum(WITH.newDep)}`}
        />
        <JournalEntry title={`פחת הנכס החדש לשנת ${EXCHANGE_YEAR}`} date={YEAR_END} lines={yearEndLines(WITH)} />
        <DataTable
          caption="הנכס החדש בשלושת המקרים"
          head={["", "לפי השווי של הנכס שנמסר", "לפי השווי של הנכס שהתקבל", "אין מהות מסחרית"]}
          rows={[
            ["עלות הנכס החדש", WITH.newCost, RECEIVED.newCost, WITHOUT.newCost],
            ["פחת שנתי", WITH.newAnnual, RECEIVED.newAnnual, WITHOUT.newAnnual],
            [`פחת אפריל עד דצמבר (${WITH.monthsAfter} חודשים)`, WITH.newDep, RECEIVED.newDep, WITHOUT.newDep],
            [`יתרה בספרים ליום ${YEAR_END}`, WITH.newBookValue, RECEIVED.newBookValue, WITHOUT.newBookValue],
          ]}
        />
        <Callout title="למה הפחת נמוך יותר כשאין מהות מסחרית?">
          <p>
            כי העלות נמוכה ב-<Num v={WITH.gain} /> — בדיוק הרווח שלא הוכר. על פני חיי הנכס החדש, הפחת הנמוך מחזיר את אותו רווח לדוח רווח
            והפסד, רק בהדרגה.
          </p>
        </Callout>
      </StepCard>

      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">התמונה המלאה של שנת {EXCHANGE_YEAR} (יש מהות מסחרית)</p>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          <DataTable
            caption={`הצגה תוצאתית לשנת ${EXCHANGE_YEAR}`}
            head={["סעיף", "סכום"]}
            rows={[
              ["הוצאות פחת — נכס ישן (ינואר עד מרץ)", -WITH.depToDate],
              ["הוצאות פחת — נכס חדש (אפריל עד דצמבר)", -WITH.newDep],
              ["רווח מהחלפת נכסים", WITH.gain],
            ]}
            foot={["השפעה על הרווח", WITH.gain - WITH.totalDep]}
          />
          <DataTable
            caption={`הצגה מאזנית ליום ${YEAR_END}`}
            head={["רכוש קבוע — נכס חדש", "סכום"]}
            rows={[
              ["עלות", WITH.newCost],
              ["בניכוי פחת נצבר", -WITH.newDep],
            ]}
            foot={["יתרה בספרים", WITH.newBookValue]}
          />
        </div>
        <p className="text-sm text-muted">
          סך הוצאות הפחת בשנת ההחלפה: <Num v={WITH.depToDate} /> + <Num v={WITH.newDep} /> = <Num v={WITH.totalDep} />.
        </p>
      </div>
    </>
  );
}
