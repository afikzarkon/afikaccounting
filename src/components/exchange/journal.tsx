import { Callout, DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { solveExchange } from "@/lib/learn/exchange";
import { EXAMPLE, exchangeLines } from "./entries";

const WITH = solveExchange(EXAMPLE);
const WITHOUT_X = { ...EXAMPLE, commercial: false };
const WITHOUT = solveExchange(WITHOUT_X);
const RECEIVED_X = { ...EXAMPLE, basis: "received" as const };
const RECEIVED = solveExchange(RECEIVED_X);

const side = (s: "dr" | "cr" | "both") => (
  <span className={s === "dr" ? "font-semibold text-debit" : s === "cr" ? "font-semibold text-credit" : "font-semibold text-fg"}>
    {s === "dr" ? "חובה" : s === "cr" ? "זכות" : "חובה / זכות"}
  </span>
);

const FULL_RULES = [
  ["נכס חדש", side("dr"), "לפי העלות החדשה שחושבה"],
  ["פחת נצבר — נכס ישן", side("dr"), "סגירת הפחת הנצבר עד יום ההחלפה"],
  ["מזומן", side("both"), "חובה אם התקבל מזומן · זכות אם שולם מזומן"],
  ["רווח / הפסד מהחלפת נכסים", side("both"), "חובה אם נוצר הפסד · זכות אם נוצר רווח"],
  ["נכס ישן", side("cr"), "סגירת העלות המקורית של הנכס הישן"],
];
const NET_RULES = [
  ["נכס חדש", side("dr"), "העלות החדשה"],
  ["מזומן", side("both"), "אם שולם או התקבל"],
  ["רווח / הפסד מהחלפה", side("both"), "אם יש"],
  ["נכס ישן — ערך בספרים", side("cr"), "עלות פחות פחת נצבר"],
];

export function ExchangeJournalSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">שתי דרכים לרשום את אותה החלפה</p>
        <p className="mt-1 text-[15px] text-fg/90">
          הפקודה <strong>המלאה</strong> סוגרת בנפרד את העלות המקורית ואת הפחת הנצבר של הנכס הישן. הפקודה <strong>המקוצרת</strong> סוגרת את שניהם
          בבת אחת — דרך הערך בספרים. שתיהן נותנות בדיוק אותה תוצאה בדוחות. לפני כל אחת מהן רושמים את פחת הנכס הישן עד יום ההחלפה.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <p className="text-[17px] font-semibold text-fg">פקודת יומן מלאה</p>
          <p className="text-xs text-muted">כשיש מהות מסחרית</p>
          <DataTable head={["חשבון", "צד", "מתי ובאיזה סכום"]} rows={FULL_RULES} />
          <JournalEntry
            title="החלפת המכונה — פקודה מלאה"
            date="1.4.X4"
            lines={exchangeLines(EXAMPLE, WITH, "full")}
            note={
              <>
                הפחת הנצבר הנסגר (<Num v={WITH.accumulated} />) כולל את הפחת של ינואר עד מרץ. הרווח: <Num v={EXAMPLE.fairValueGiven} /> −{" "}
                <Num v={WITH.bookValue} /> = <Num v={WITH.gain} />.
              </>
            }
          />
        </div>
        <div className="card p-5">
          <p className="text-[17px] font-semibold text-fg">פקודת יומן מקוצרת (נטו)</p>
          <p className="text-xs text-muted">אותה עסקה, בשורה אחת לנכס הישן</p>
          <DataTable head={["חשבון", "צד", "מתי ובאיזה סכום"]} rows={NET_RULES} />
          <JournalEntry
            title="החלפת המכונה — פקודה מקוצרת"
            date="1.4.X4"
            lines={exchangeLines(EXAMPLE, WITH, "net")}
            note={
              <>
                הערך בספרים הנסגר: <Num v={EXAMPLE.oldCost} /> − <Num v={WITH.accumulated} /> = <Num v={WITH.bookValue} />.
              </>
            }
          />
        </div>
      </div>

      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">ואם אין מהות מסחרית?</p>
        <p className="mt-1 text-[15px] text-fg/90">
          אותה פקודה בדיוק — בלי שורת רווח או הפסד. הנכס החדש נרשם לפי הערך בספרים של הישן ועוד המזומן ששולם: <Num v={WITH.bookValue} /> +{" "}
          <Num v={EXAMPLE.cashPaid} /> = <Num v={WITHOUT.newCost} />.
        </p>
        <JournalEntry title="החלפה ללא מהות מסחרית — פקודה מלאה" date="1.4.X4" lines={exchangeLines(WITHOUT_X, WITHOUT, "full")} />
      </div>

      <div className="card p-5">
        <p className="text-[17px] font-semibold text-fg">ואם ידוע רק השווי ההוגן של הנכס שהתקבל?</p>
        <p className="mt-1 text-[15px] text-fg/90">
          הנכס החדש נרשם לפי השווי שלו — <Num v={EXAMPLE.fairValueReceived} />. השווי של הנכס שנמסר נגזר ממנו: <Num v={EXAMPLE.fairValueReceived} /> −{" "}
          <Num v={EXAMPLE.cashPaid} /> = <Num v={RECEIVED.fairValueGiven!} />, והרווח: <Num v={RECEIVED.fairValueGiven!} /> − <Num v={RECEIVED.bookValue} /> ={" "}
          <Num v={RECEIVED.gain} />.
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <JournalEntry title="לפי השווי של הנכס שהתקבל — פקודה מלאה" date="1.4.X4" lines={exchangeLines(RECEIVED_X, RECEIVED, "full")} />
          <JournalEntry title="לפי השווי של הנכס שהתקבל — פקודה מקוצרת" date="1.4.X4" lines={exchangeLines(RECEIVED_X, RECEIVED, "net")} />
        </div>
      </div>

      <Callout kind="check" title="איך יודעים שהפקודה נכונה">
        <ul className="list-inside list-disc space-y-1">
          <li>הפקודה מאוזנת: סך החובה שווה לסך הזכות.</li>
          <li>אחרי הרישום לא נשארת יתרה בחשבונות הנכס הישן — לא בעלות ולא בפחת הנצבר.</li>
          <li>שורת הרווח או ההפסד מופיעה רק כשיש מהות מסחרית.</li>
        </ul>
      </Callout>
    </>
  );
}
