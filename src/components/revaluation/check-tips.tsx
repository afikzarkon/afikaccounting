import { CalendarClock, Layers, Receipt, Repeat, Search, Store, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { texNum } from "@/components/study/ui";
import { solveRevaluation, type Timing } from "@/lib/learn/revaluation";
import { side, SL_EX, TAX_RATE, transferLines } from "./data";

const r2 = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number) => `${Math.round(v * 100)}%`;

const BY_DEP = solveRevaluation(SL_EX);
const AT_DISPOSAL = solveRevaluation({ ...SL_EX, transfer: "disposal" });
const EV = BY_DEP.events[0];
const CHECK_YEARS = BY_DEP.rows.map((row) => row.year);
const FIRST_LOSS = BY_DEP.events.find((e) => e.pl < 0)!;

// The same fair value in 2021, at each of the three dates (the building of example 1, revalued that once).
const TIMING_YEAR = 2021;
const TIMING_FV = 90_000;
const TIMINGS = (["start", "mid", "end"] as Timing[]).map((timing) => {
  const r = solveRevaluation({ ...SL_EX, revaluations: [{ year: TIMING_YEAR, timing, fairValue: TIMING_FV }] });
  return { timing, ev: r.events[0], dep: r.rows.find((row) => row.year === TIMING_YEAR)!.dep };
});

const TAX = r2(EV.oci * TAX_RATE);
const NET = r2(EV.oci - TAX);

// Disposal: the building of example 1 sold on 31.12.2021, right after that day's revaluation, while it still has a surplus.
const SALE_YEAR = 2021;
const SALE_PRICE = 60_000;
const saleRow = (r: typeof BY_DEP) => r.rows.find((row) => row.year === SALE_YEAR)!;

export function CheckTipsSection() {
  const sold = saleRow(BY_DEP);
  const soldKept = saleRow(AT_DISPOSAL);
  return (
    <>
      <section className="overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-amber-500/[0.06] shadow-card">
        <div className="flex items-center gap-3 border-b border-amber-500/30 bg-amber-500/[0.1] px-5 py-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">💡 טיפ בדיקה זהב למבחן</p>
            <h3 className="text-xl font-semibold text-fg">איך בודקים את יתרת קרן ההערכה מחדש בכל רגע נתון?</h3>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4 text-[15px] leading-relaxed text-fg/90">
          <p>
            <strong>כשמעבירים לעודפים בקצב הפחת:</strong> יתרת הקרן בסוף כל שנה שווה <strong>בדיוק</strong> להפרש בין הערך בספרים לפי מודל הערכה
            מחדש לבין הערך בספרים שהיה מתקבל באותו מועד אילו היינו ממשיכים במודל העלות המקורי.
          </p>
          <Formula tex={String.raw`\text{יתרת קרן הערכה מחדש} = \text{ערך בספרים (מודל הערכה מחדש)} - \text{ערך בספרים (מודל עלות מקורי)}`} />
          <DataTable
            caption="הבדיקה על דוגמה 1 — הערכה בכל שנה"
            head={["סוף שנה", "ערך בספרים — הערכה מחדש", "ערך בספרים — מודל העלות", "הפרש", "יתרת הקרן — בקצב הפחת", "מתקיים?", "יתרת הקרן — בגריעה בלבד"]}
            rows={CHECK_YEARS.map((y) => {
              const a = BY_DEP.rows.find((row) => row.year === y)!;
              const b = AT_DISPOSAL.rows.find((row) => row.year === y)!;
              const holds = Math.abs(a.surplus - (a.closing - a.costCarrying)) < 0.01;
              return [
                String(y),
                r2(a.closing),
                r2(a.costCarrying),
                r2(a.closing - a.costCarrying) + 0,
                r2(a.surplus) + 0,
                <span key="h" className={holds ? "font-semibold text-success" : "font-semibold text-danger"}>
                  {holds ? "✓ כן" : "✗ לא"}
                </span>,
                r2(b.surplus) + 0,
              ];
            })}
            highlight={CHECK_YEARS.map((y, i) => (y >= FIRST_LOSS.year ? i : -1)).filter((i) => i >= 0)}
          />
          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/[0.05] px-4 py-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <p className="text-[14.5px]">
              <strong>סייג חשוב למבחן:</strong> הבדיקה נכונה <strong>רק כשמעבירים לעודפים בקצב הפחת!</strong> כשאין העברה שוטפת — העברה רק בגריעה,
              או בקרקע — הקרן שומרת על כל העליות שנזקפו אליה (העמודה האחרונה), ולכן הנוסחה לא מתאימה לה. ועוד סייג: מהרגע שירידה נזקפה לרווח והפסד
              (כאן ב-{FIRST_LOSS.year}), ההפרש כולל גם את ההפסד הזה — והבדיקה כבר לא מדויקת. בשנים {CHECK_YEARS[0]} עד {FIRST_LOSS.year - 1} היא מתקיימת בדיוק.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TipCard icon={<Layers className="h-5 w-5" />} title="עקרון הקבוצה">
          <p>
            המודל נבחר לכל <strong>קבוצה</strong> של רכוש קבוע — מבנים, מכונות, כלי רכב — ולא לנכס בודד (סעיפים 29, 36–38). כשמעריכים מחדש נכס
            אחד, מעריכים את כל הנכסים בקבוצה, באותו מועד. כך אי אפשר לבחור רק את הנכסים שעלו בערכם.
          </p>
        </TipCard>
        <TipCard icon={<Repeat className="h-5 w-5" />} title="תדירות ההערכה">
          <p>
            ההערכות צריכות להיות סדירות מספיק כדי שהערך בספרים לא יהיה שונה מהותית מהשווי ההוגן (סעיף 34). נכס שערכו משתנה הרבה — מעריכים כל שנה;
            נכס יציב — אחת ל-3 עד 5 שנים מספיק. <strong>בשנים שבלי הערכה ממשיכים להפחית כרגיל</strong>, לפי השווי ההוגן האחרון.
          </p>
        </TipCard>
      </div>

      <TipCard icon={<CalendarClock className="h-5 w-5" />} title="מועד ההערכה במהלך השנה משנה את הפחת של אותה שנה">
        <p>
          אותו מבנה מדוגמה 1 — הפעם עם הערכה אחת, לשווי הוגן של <Num v={TIMING_FV} /> בשנת {TIMING_YEAR} — בשלושה מועדים שונים:
        </p>
        <DataTable
          head={["מועד ההערכה", "סדר הפעולות", "לקרן", `פחת שנת ${TIMING_YEAR}`]}
          rows={TIMINGS.map(({ timing, ev, dep }) => [
            timing === "start" ? `1.1.${TIMING_YEAR}` : timing === "mid" ? `1.7.${TIMING_YEAR}` : `31.12.${TIMING_YEAR}`,
            timing === "start"
              ? "שערוך בתחילת השנה, ואז פחת שנתי מלא לפי השווי ההוגן"
              : timing === "mid"
                ? "פחת חצי שנה לפי הבסיס הישן, שערוך, ואז חצי שנה לפי השווי ההוגן"
                : "פחת שנתי מלא לפי הבסיס הישן, ואז שערוך בסוף השנה",
            r2(ev.oci),
            r2(dep),
          ])}
        />
      </TipCard>

      <TipCard icon={<Receipt className="h-5 w-5" />} title="מסים נדחים — מנוכים מהקרן">
        <p>
          העלייה בשווי יוצרת הפרש זמני בין הערך בספרים לבסיס המס, ולכן התחייבות למסים נדחים. המס מנוכה ישירות מהקרן, ברווח כולל אחר — לא ברווח
          והפסד. בשיעור מס של {pct(TAX_RATE)}:
        </p>
        <Formula
          tex={String.raw`\text{קרן הערכה מחדש (נטו ממס)} = \text{פער הערכה מחדש} \times (1 - \text{שיעור המס}) = ${texNum(EV.oci)} \times (1 - ${TAX_RATE}) = ${texNum(NET)}`}
        />
        <JournalEntry
          title="הערכה מחדש עם מסים נדחים (שיטת הביטול)"
          date={`31.12.${EV.year}`}
          lines={[
            ...side("פחת נצבר", EV.accEliminated),
            ...side("מבנה", EV.fairValue - EV.grossBefore),
            ...side("קרן הערכה מחדש (רווח כולל אחר)", -NET),
            ...side("התחייבות למסים נדחים", -TAX),
          ].sort((x, y) => Number(x.cr !== undefined) - Number(y.cr !== undefined))}
          note={
            <>
              גם ההעברה השנתית לעודפים היא אז נטו ממס: <Num v={r2(BY_DEP.rows[1].transfer)} /> × (1 − {TAX_RATE}) ={" "}
              <Num v={r2(BY_DEP.rows[1].transfer * (1 - TAX_RATE))} />.
            </>
          }
        />
      </TipCard>

      <TipCard icon={<Store className="h-5 w-5" />} title="גריעת נכס שיש לו קרן">
        <p>
          כשהנכס נמכר, הרווח או ההפסד נמדדים מול הערך בספרים <strong>המשוערך</strong>, ויתרת הקרן שנותרה עוברת בבת אחת לעודפים — בלי לעבור ברווח
          והפסד (סעיף 41). נניח שהמבנה מדוגמה 1 נמכר ב-31.12.{SALE_YEAR}, מיד אחרי ההערכה של אותו יום (ערך בספרים <Num v={r2(sold.closing)} />), ב-
          <Num v={SALE_PRICE} />:
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <JournalEntry
            title="המכירה"
            date={`31.12.${SALE_YEAR}`}
            lines={[
              ...side("מזומן", SALE_PRICE),
              ...side("פחת נצבר", sold.acc),
              ...side("מבנה", -sold.gross),
              ...side(SALE_PRICE >= sold.closing ? "רווח ממכירת מבנה (רווח והפסד)" : "הפסד ממכירת מבנה (רווח והפסד)", -(SALE_PRICE - sold.closing)),
            ].sort((x, y) => Number(x.cr !== undefined) - Number(y.cr !== undefined))}
          />
          <JournalEntry
            title="העברת יתרת הקרן לעודפים"
            date={`31.12.${SALE_YEAR}`}
            lines={transferLines(sold.surplus)}
            note={
              <>
                בהעברה בקצב הפחת נותרו <Num v={r2(sold.surplus)} />; בהעברה בגריעה בלבד — כל <Num v={r2(soldKept.surplus)} /> עוברים עכשיו.
              </>
            }
          />
        </div>
        <p className="text-sm text-muted">
          נכס שנשא בעבר ירידת ערך שנזקפה לרווח והפסד — אין לו קרן, ולכן בגריעה אין מה להעביר לעודפים; רק הרווח או ההפסד מהמכירה.
        </p>
      </TipCard>
    </>
  );
}

function TipCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="card p-5">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-fg">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">{icon}</span>
        {title}
      </p>
      <div className="mt-2 text-[15px] leading-relaxed text-fg/90 [&_p]:my-2">{children}</div>
    </section>
  );
}
