import { CalendarCheck, History, Scale } from "lucide-react";
import { Callout, DataTable, Dt, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { StepCard, texNum } from "@/components/study/ui";
import { solveExchange } from "@/lib/learn/exchange";
import { MACHINE } from "@/lib/learn/ias16-example";
import { catchUpLines, EXAMPLE, EXCHANGE_DATE, EXCHANGE_YEAR, exchangeLines } from "./entries";

const WITH = solveExchange(EXAMPLE);
const WITHOUT = solveExchange({ ...EXAMPLE, commercial: false });
const RECEIVED_X = { ...EXAMPLE, basis: "received" as const };
const RECEIVED = solveExchange(RECEIVED_X);
const MONTHS_BEFORE = Math.round((EXAMPLE.accumulatedOpening / WITH.oldAnnual) * 12);

const STEPS = ["זיהוי תאריך ההחלפה", "עדכון פחת עד לתאריך ההחלפה", "סיווג העסקה וקביעת עלות הנכס החדש"];

export function ExchangeStepsSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">דרכים לפתור שאלת החלפה — במבט אחד</p>
        <p className="mt-1 text-[15px] text-fg/90">
          כל שאלת החלפת נכסים נפתרת באותם שלושה שלבים, באותו הסדר. לאורך הדרך נמשיך את השאלה המרכזית של הפרק (
          <a href="#method" className="font-medium text-accent hover:underline">
            דרכים לפתור שאלה
          </a>
          ): המכונה של {MACHINE.company} נכנסה לשימוש ב-<Dt>{MACHINE.readyDate}</Dt> בעלות <Num v={EXAMPLE.oldCost} /> ₪, לאורך חיים של{" "}
          {EXAMPLE.oldLife} שנים, ערך גרט <Num v={EXAMPLE.oldSalvage} /> ₪ ובקו ישר. ב-<Dt>{EXCHANGE_DATE}</Dt> החליפה אותה החברה במכונה חדשה ושילמה
          בנוסף <Num v={EXAMPLE.cashPaid} /> ₪ במזומן. השווי ההוגן של המכונה הישנה ביום ההחלפה: <Num v={EXAMPLE.fairValueGiven} />{" "}
          ₪. למכונה החדשה: אורך חיים של {EXAMPLE.newLife} שנים וערך גרט של <Num v={EXAMPLE.newSalvage} /> ₪.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <StepCard step={1} title="זיהוי תאריך ההחלפה" lead="מועד העסקה המדויק במהלך השנה" icon={<CalendarCheck className="h-5 w-5" />}>
        <p>
          תאריך ההחלפה הוא קו הגבול של השנה. הוא קובע שני דברים: <strong>עד מתי</strong> מפחיתים את הנכס הישן, ו<strong>ממתי</strong> מתחילים
          להפחית את הנכס החדש. מסמנים אותו בשאלה לפני כל חישוב.
        </p>
        <DataTable
          caption={`בדוגמה: החלפה ב-${EXCHANGE_DATE}`}
          head={["נכס", `תקופה בשנת ${EXCHANGE_YEAR}`, "חודשי פחת"]}
          rows={[
            ["הנכס הישן", "ינואר עד מרץ", `${WITH.monthsBefore} חודשים`],
            ["הנכס החדש", "אפריל עד דצמבר", `${WITH.monthsAfter} חודשים`],
          ]}
        />
        <Callout kind="warn" title="החלפה באמצע השנה = שני חישובי פחת באותה שנה">
          <p>
            בשנת ההחלפה הוצאות הפחת הן סכום של שני חלקים: הנכס הישן עד יום ההחלפה, והנכס החדש מיום ההחלפה ועד סוף השנה. מי שמחשב רק אחד
            מהם — מפספס חלק מההוצאה.
          </p>
        </Callout>
      </StepCard>

      <StepCard step={2} title="עדכון פחת עד לתאריך ההחלפה" lead="מביאים את הנכס הישן ליום ההחלפה — ורק אז מחליפים" icon={<History className="h-5 w-5" />}>
        <p>
          הפחת הנצבר שבשאלה הוא בדרך כלל לתחילת השנה. לפני ההחלפה מחשבים את הוצאות הפחת <strong>מתחילת השנה ועד יום ההחלפה</strong>, ומעדכנים את
          הפחת הנצבר ואת הערך בספרים לאותו יום.
        </p>
        <Formula
          tex={String.raw`\text{פחת שנתי} = \frac{\text{עלות} - \text{גרט}}{\text{אורך חיים}} = \frac{${texNum(EXAMPLE.oldCost)} - ${texNum(EXAMPLE.oldSalvage)}}{${EXAMPLE.oldLife}} = ${texNum(WITH.oldAnnual)}`}
        />
        <Formula
          tex={String.raw`\text{פחת עד ההחלפה} = \text{פחת שנתי} \times \frac{\text{חודשים מתחילת השנה}}{12} = ${texNum(WITH.oldAnnual)} \times \frac{${WITH.monthsBefore}}{12} = ${texNum(WITH.depToDate)}`}
        />
        <DataTable
          caption="הפחת הנצבר של המכונה הישנה"
          head={["", "סכום"]}
          rows={[
            [`פחת נצבר ליום 1.1.${EXCHANGE_YEAR} (${MONTHS_BEFORE} חודשים מ-${MACHINE.readyDate}, לפי לוח הפחת בשאלה המרכזית)`, EXAMPLE.accumulatedOpening],
            [`פחת ינואר עד מרץ ${EXCHANGE_YEAR}`, WITH.depToDate],
          ]}
          foot={["פחת נצבר מעודכן ליום ההחלפה", WITH.accumulated]}
        />
        <Formula
          tex={String.raw`\text{ערך בספרים ליום ההחלפה} = \text{עלות מקורית} - \text{פחת נצבר מעודכן} = ${texNum(EXAMPLE.oldCost)} - ${texNum(WITH.accumulated)} = ${texNum(WITH.bookValue)}`}
        />
        <JournalEntry title="פחת הנכס הישן עד יום ההחלפה" date={EXCHANGE_DATE} lines={catchUpLines(WITH)} />
        <Callout kind="warn" title="המלכודת הקלאסית">
          <p>
            מי שמדלג על הפחת של החודשים האחרונים מחשב ערך בספרים גבוה מדי (<Num v={EXAMPLE.oldCost - EXAMPLE.accumulatedOpening} /> במקום{" "}
            <Num v={WITH.bookValue} />), ולכן גם רווח קטן מדי מההחלפה.
          </p>
        </Callout>
      </StepCard>

      <StepCard step={3} title="סיווג העסקה וקביעת עלות הנכס החדש" lead="האם יש מהות מסחרית — והאם השווי ההוגן ניתן למדידה מהימנה" icon={<Scale className="h-5 w-5" />}>
        <p>
          לפי <strong>סעיף 25</strong>, לעסקה יש <strong>מהות מסחרית</strong> כשהיא באמת משנה את הכלכלה של החברה: תזרימי המזומנים הצפויים
          מהנכס החדש שונים מאלה של הנכס הישן — בסיכון, בעיתוי או בסכום — ובאופן משמעותי. מכונה ישנה תמורת מכונה חדשה עם תפוקה אחרת — יש מהות
          מסחרית. רכב תמורת רכב כמעט זהה — אין.
        </p>
        <div className="my-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/[0.05] p-4">
            <p className="text-sm font-semibold text-success">א. יש מהות מסחרית, והשווי ההוגן ידוע באופן מהימן</p>
            <Formula
              tex={String.raw`\text{עלות נכס חדש} = \text{שווי הוגן נמסר} + \text{מזומן ששולם} - \text{מזומן שהתקבל}`}
              caption={
                <>
                  בדוגמה: <Num v={EXAMPLE.fairValueGiven} /> + <Num v={EXAMPLE.cashPaid} /> = <Num v={WITH.newCost} />
                </>
              }
            />
            <Formula
              tex={String.raw`\text{רווח (הפסד) מהחלפה} = \text{שווי הוגן נמסר} - \text{ערך בספרים נמסר ליום ההחלפה}`}
              caption={
                <>
                  בדוגמה: <Num v={EXAMPLE.fairValueGiven} /> − <Num v={WITH.bookValue} /> = <Num v={WITH.gain} /> רווח
                </>
              }
            />
            <p className="text-[13.5px] text-fg/85">
              <strong>אם השווי ההוגן של הנכס המתקבל ברור ומובהק יותר</strong> — משתמשים בו (סעיף 26): הוא עלות הנכס החדש, והשווי ההוגן של הנכס
              שנמסר נגזר ממנו — שווי הנכס המתקבל, פחות מזומן ששולם, ועוד מזומן שהתקבל.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">ב. אין מהות מסחרית, או שהשווי ההוגן אינו ניתן למדידה מהימנה</p>
            <p className="mt-2 text-[15px] font-semibold text-fg">לא מכירים ברווח או בהפסד!</p>
            <Formula
              tex={String.raw`\text{עלות נכס חדש} = \text{ערך בספרים נמסר ליום ההחלפה} + \text{מזומן ששולם} - \text{מזומן שהתקבל}`}
              caption={
                <>
                  בדוגמה: <Num v={WITH.bookValue} /> + <Num v={EXAMPLE.cashPaid} /> = <Num v={WITHOUT.newCost} />
                </>
              }
            />
            <p className="text-[13.5px] text-fg/85">
              הנכס החדש פשוט &quot;ממשיך&quot; את הערך בספרים של הישן. הרווח שלא הוכר עכשיו יתבטא בעתיד דרך פחת נמוך יותר.
            </p>
          </div>
        </div>
        <div className="my-4 rounded-xl border border-accent/30 bg-accent-soft/60 p-4">
          <p className="text-sm font-semibold text-accent">דוגמה: ידוע רק השווי ההוגן של הנכס שהתקבל</p>
          <p className="mt-1 text-[14.5px] text-fg/90">
            נניח שאת השווי ההוגן של המכונה הישנה אי אפשר למדוד באופן מהימן, אבל ידוע שהמכונה החדשה שווה{" "}
            <Num v={EXAMPLE.fairValueReceived} /> ₪. במקרה כזה השווי של הנכס שהתקבל הוא עלות הנכס החדש, ואת השווי של הנכס שנמסר גוזרים ממנו
            (סעיף 26):
          </p>
          <Formula tex={String.raw`\text{עלות נכס חדש} = \text{שווי הוגן מתקבל} = ${texNum(RECEIVED.newCost)}`} />
          <Formula
            tex={String.raw`\text{שווי הוגן נמסר} = \text{שווי הוגן מתקבל} - \text{מזומן ששולם} + \text{מזומן שהתקבל} = ${texNum(EXAMPLE.fairValueReceived)} - ${texNum(EXAMPLE.cashPaid)} = ${texNum(RECEIVED.fairValueGiven!)}`}
          />
          <Formula
            tex={String.raw`\text{רווח (הפסד) מהחלפה} = \text{שווי הוגן נמסר} - \text{ערך בספרים נמסר} = ${texNum(RECEIVED.fairValueGiven!)} - ${texNum(RECEIVED.bookValue)} = ${texNum(RECEIVED.gain)}`}
          />
          <JournalEntry title="החלפה לפי השווי ההוגן של הנכס שהתקבל — פקודה מלאה" date={EXCHANGE_DATE} lines={exchangeLines(RECEIVED_X, RECEIVED, "full")} />
          <p className="text-[13.5px] text-fg/85">
            שימו לב: המזומן ששולם כבר &quot;בתוך&quot; השווי של הנכס שהתקבל, ולכן לא מוסיפים אותו לעלות — מנכים אותו כדי להגיע לשווי של מה
            שנמסר.
          </p>
        </div>
        <Callout kind="check" title="בדיקה מהירה">
          <p>
            ההפרש בין עלות הנכס החדש בשני המקרים הראשונים שווה בדיוק לרווח: <Num v={WITH.newCost} /> − <Num v={WITHOUT.newCost} /> ={" "}
            <Num v={WITH.newCost - WITHOUT.newCost} />.
          </p>
        </Callout>
      </StepCard>
    </>
  );
}
