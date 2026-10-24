import { CalendarClock, Layers, Repeat, Search, Store, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable, JournalEntry, Num } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { type RevRow, solveRevaluation, type Timing } from "@/lib/learn/revaluation";
import { side, SL_EX, transferLines } from "./data";

const r2 = (v: number) => Math.round(v * 100) / 100 + 0;
const f = (v: number) => r2(v).toLocaleString("en-US");

// The gold tip runs on the page's central building, under both ways of moving the surplus to retained earnings.
const BY_DEP = solveRevaluation(SL_EX);
const AT_DISPOSAL = solveRevaluation({ ...SL_EX, transfer: "disposal" });
const YEARS = BY_DEP.rows.map((row) => row.year);
const COST_ANNUAL = SL_EX.cost / SL_EX.life;
const disposalRow = (year: number) => AT_DISPOSAL.rows.find((row) => row.year === year)!;
const gap = (row: RevRow) => r2(row.closing - row.costCarrying);
const holds = (surplus: number, row: RevRow) => Math.abs(surplus - (row.closing - row.costCarrying)) < 0.01;
/** The last intermediate year in which the two surpluses differ: the clearest case for the comparison. */
const SHOWCASE = BY_DEP.rows.find((row) => !holds(disposalRow(row.year).surplus, row))!;

// The same fair value in 2021, at each of the three dates (the central building, revalued that once).
const TIMING_YEAR = 2021;
const TIMING_FV = 280_000;
const TIMINGS = (["start", "mid", "end"] as Timing[]).map((timing) => {
  const r = solveRevaluation({ ...SL_EX, revaluations: [{ year: TIMING_YEAR, timing, fairValue: TIMING_FV }] });
  return { timing, ev: r.events[0], dep: r.rows.find((row) => row.year === TIMING_YEAR)!.dep };
});

// Disposal: the central building sold on 31.12.2021, while it still has a surplus.
const SALE_YEAR = 2021;
const SALE_PRICE = 300_000;
const saleRow = (r: typeof BY_DEP) => r.rows.find((row) => row.year === SALE_YEAR)!;

/** How each year's revalued carrying amount is reached: last year's, less this year's charge, then the revaluation if there is one. */
function revaluedSteps(row: RevRow) {
  const before = row.opening - row.dep;
  const ev = BY_DEP.events.find((e) => e.year === row.year);
  return ev ? `${f(row.opening)} − ${f(row.dep)} = ${f(before)} ← שווי הוגן ${f(ev.fairValue)}` : `${f(row.opening)} − ${f(row.dep)} = ${f(row.closing)}`;
}
const costSteps = (row: RevRow) => `${f(row.costCarrying + row.costDep)} − ${f(row.costDep)} = ${f(row.costCarrying)}`;
function surplusSteps(row: RevRow, prev: number) {
  const parts = [f(prev)];
  if (row.transfer > 0.005) parts.push(`− ${f(row.transfer)} (העברה)`);
  if (Math.abs(row.oci) > 0.005) parts.push(`${row.oci > 0 ? "+" : "−"} ${f(Math.abs(row.oci))} (${row.oci > 0 ? "עלייה" : "ירידה"})`);
  return parts.length > 1 ? `${parts.join(" ")} = ${f(row.surplus)}` : `${f(row.surplus)} (ללא שינוי)`;
}

/** A calculation that reads left to right inside a Hebrew table. */
const Calc = ({ children }: { children: string }) => (
  <bdi dir="ltr" className="num whitespace-nowrap text-[13px]">
    {children}
  </bdi>
);

export function CheckTipsSection() {
  const sold = saleRow(BY_DEP);
  const soldKept = saleRow(AT_DISPOSAL);
  const [first, second] = BY_DEP.events;
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
        <div className="space-y-4 px-5 py-4 text-[15px] leading-relaxed text-fg/90">
          <p>
            <strong>כשמעבירים לעודפים בקצב הפחת</strong>, יתרת הקרן בסוף כל שנה שווה <strong>בדיוק</strong> להפרש בין הערך בספרים לפי מודל הערכה מחדש לבין
            הערך בספרים שהיה מתקבל באותו מועד אילו היינו נשארים במודל העלות:
          </p>
          <Formula tex={String.raw`\text{יתרת קרן הערכה מחדש} = \text{ערך בספרים (מודל הערכה מחדש)} - \text{ערך בספרים היפותטי (מודל העלות)}`} />

          <p className="font-semibold text-fg">הדוגמה: המבנה המרכזי של העמוד</p>
          <p>
            עלות <Num v={SL_EX.cost} /> ₪ ב-1.1.{SL_EX.firstYear}, {SL_EX.life} שנים, קו ישר, ללא גרט. שתי הערכות: ב-31.12.{first.year} לשווי הוגן{" "}
            <Num v={first.fairValue} />, וב-31.12.{second.year} לשווי הוגן <Num v={second.fairValue} />. אף ירידה לא עוברת את הקרן — ולכן שום סכום לא מגיע לרווח
            והפסד.
          </p>

          <p className="font-semibold text-fg">שלב א — שני ערכים בספרים, שנה אחרי שנה</p>
          <ul className="list-inside list-disc space-y-1 text-[14.5px]">
            <li>
              <strong>מודל העלות (היפותטי):</strong> העלות פחות פחת קבוע של <Num v={COST_ANNUAL} /> לשנה (<Num v={SL_EX.cost} /> ÷ {SL_EX.life}). זה הלוח שהיה לנו אילו
              לא היינו מעריכים מחדש.
            </li>
            <li>
              <strong>מודל הערכה מחדש:</strong> עד ההערכה הראשונה — אותו פחת. אחריה — השווי ההוגן ÷ יתרת השנים: {f(first.fairValue)} ÷ {first.monthsLeft / 12} ={" "}
              {f(first.firstYearCharge)} לשנה; ואחרי ההערכה השנייה {f(second.fairValue)} ÷ {second.monthsLeft / 12} = {f(second.firstYearCharge)} לשנה.
            </li>
          </ul>
          <DataTable
            caption="הערך בספרים בשני המודלים, וההפרש ביניהם"
            head={["31.12", "עלות מקורית", "פחת השנה — הערכה מחדש", "ערך בספרים — הערכה מחדש", "ערך בספרים — מודל העלות (היפותטי)", "הפרש"]}
            rows={BY_DEP.rows.map((row) => [
              String(row.year),
              SL_EX.cost,
              r2(row.dep),
              <span key="r" className="block text-end">
                <Num v={r2(row.closing)} />
                <span className="block text-xs text-muted">
                  <Calc>{revaluedSteps(row)}</Calc>
                </span>
              </span>,
              <span key="c" className="block text-end">
                <Num v={r2(row.costCarrying)} />
                <span className="block text-xs text-muted">
                  <Calc>{costSteps(row)}</Calc>
                </span>
              </span>,
              gap(row),
            ])}
          />

          <p className="font-semibold text-fg">שלב ב — יתרת הקרן, בשתי שיטות ההעברה זו לצד זו</p>
          <p className="text-[14.5px]">
            בכל 31.12 הסדר קבוע: פחת ← העברה לעודפים ← הערכה מחדש. בהעברה בקצב הפחת, ההעברה השנתית היא הפחת לפי השווי ההוגן פחות הפחת לפי העלות (למשל{" "}
            {first.year + 1}: {f(BY_DEP.rows[1].dep)} − {f(BY_DEP.rows[1].costDep)} = {f(BY_DEP.rows[1].transfer)}). בהעברה בעת גריעה — אין העברה שוטפת; הקרן משתנה רק
            בהערכות, וכל היתרה עוברת לעודפים ביום שהמבנה נגרע.
          </p>
          <DataTable
            caption="ההפרש מול יתרת הקרן — בכל שנה"
            head={["31.12", "הפרש (שלב א)", "קרן — העברה בקצב הפחת", "שווה להפרש?", "קרן — העברה בעת גריעה", "שווה להפרש?"]}
            rows={BY_DEP.rows.map((row, i) => {
              const d = disposalRow(row.year);
              const prevDep = i ? BY_DEP.rows[i - 1].surplus : 0;
              const prevDisp = i ? AT_DISPOSAL.rows[i - 1].surplus : 0;
              const ok = (v: number) => (
                <span className={holds(v, row) ? "font-semibold text-success" : "font-semibold text-danger"}>{holds(v, row) ? "✓ כן" : "✗ לא"}</span>
              );
              return [
                String(row.year),
                gap(row),
                <span key="a" className="block text-end">
                  <Num v={r2(row.surplus)} />
                  <span className="block text-xs text-muted">
                    <Calc>{surplusSteps(row, prevDep)}</Calc>
                  </span>
                </span>,
                ok(row.surplus),
                <span key="b" className="block text-end">
                  <Num v={r2(d.surplus)} />
                  <span className="block text-xs text-muted">
                    <Calc>{surplusSteps(d, prevDisp)}</Calc>
                  </span>
                </span>,
                ok(d.surplus),
              ];
            })}
            highlight={BY_DEP.rows.map((row, i) => (holds(disposalRow(row.year).surplus, row) ? -1 : i)).filter((i) => i >= 0)}
          />

          <p className="font-semibold text-fg">שלב ג — מה רואים בטבלה</p>
          <ul className="list-inside list-disc space-y-1 text-[14.5px]">
            <li>
              <strong>עמודת ההפרש זהה בשתי השיטות — וזה נכון שכך.</strong> ההעברה לעודפים היא פקודה בתוך ההון (ח׳ קרן / ז׳ עודפים); היא לא נוגעת במבנה ולא בפחת.
              לכן הערך בספרים בשני המודלים, וגם ההפרש ביניהם, לא תלויים בשיטת ההעברה. מה שתלוי בה — רק יתרת הקרן.
            </li>
            <li>
              <strong>בשנת ההערכה הראשונה ({first.year}) שתי הקרנות שוות</strong> (<Num v={first.oci} />): עוד לא היה פחת על השווי ההוגן, ולכן עוד לא הועבר כלום.
            </li>
            <li>
              <strong>בשנים הביניים התוצאות שונות.</strong> למשל ב-{SHOWCASE.year}: ההפרש <Num v={gap(SHOWCASE)} />; בקצב הפחת הקרן <Num v={r2(SHOWCASE.surplus)} /> — שווה
              להפרש; בעת גריעה הקרן <Num v={r2(disposalRow(SHOWCASE.year).surplus)} /> — גדולה ממנו בדיוק בסכום שכבר הועבר בשיטה הראשונה (
              {f(disposalRow(SHOWCASE.year).surplus - SHOWCASE.surplus)}).
            </li>
            <li>
              <strong>בסוף החיים ({YEARS.at(-1)})</strong> ההפרש 0. בקצב הפחת הקרן כבר 0; בעת גריעה נשארו <Num v={r2(AT_DISPOSAL.rows.at(-1)!.surplus)} />, והם עוברים
              לעודפים בבת אחת כשהמבנה נגרע.
            </li>
          </ul>

          <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/[0.05] px-4 py-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <div className="space-y-1 text-[14.5px]">
              <p>
                <strong>שלב ד — מתי הבדיקה עובדת:</strong> השוויון &quot;הפרש = יתרת קרן&quot; נכון <strong>רק בהעברה בקצב הפחת</strong>. סעיף 41 לתקן מתיר להעביר
                חלק מהקרן לעודפים תוך כדי השימוש — בסכום ההפרש בין הפחת לפי הערך המשוערך לפחת לפי העלות המקורית — ובדיוק ההעברה הזו מצמצמת את הקרן באותו
                קצב שבו מצטמצם ההפרש. בהעברה בעת גריעה בלבד הקרן לא יורדת עם הפחת, ולכן היא גדולה מההפרש בכל שנה שאחרי ההערכה.
              </p>
              <p>
                ועוד תנאי: הבדיקה מדויקת רק כל עוד אף ירידה לא נזקפה לרווח והפסד. מהרגע שירידה עברה את הקרן, ההפרש כולל גם את ההפסד הזה — והשוויון כבר לא
                מתקיים.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TipCard icon={<Layers className="h-5 w-5" />} title="עקרון הקבוצה">
          <p>
            המודל נבחר לכל <strong>קבוצה</strong> של רכוש קבוע — מבנים, מכונות, כלי רכב — ולא לנכס בודד (סעיפים 29, 36–38). כשמעריכים מחדש נכס אחד, מעריכים
            את כל הנכסים בקבוצה, באותו מועד. כך אי אפשר לבחור רק את הנכסים שעלו בערכם.
          </p>
        </TipCard>
        <TipCard icon={<Repeat className="h-5 w-5" />} title="תדירות ההערכה">
          <p>
            ההערכות צריכות להיות סדירות מספיק כדי שהערך בספרים לא יהיה שונה מהותית מהשווי ההוגן (סעיף 34). נכס שערכו משתנה הרבה — מעריכים כל שנה; נכס יציב —
            אחת ל-3 עד 5 שנים מספיק. <strong>בשנים שבלי הערכה ממשיכים להפחית כרגיל</strong>, לפי השווי ההוגן האחרון — כמו ב-{SL_EX.firstYear + 1} בדוגמה.
          </p>
        </TipCard>
      </div>

      <TipCard icon={<CalendarClock className="h-5 w-5" />} title="מועד ההערכה במהלך השנה משנה את הפחת של אותה שנה">
        <p>
          אותו מבנה — הפעם עם הערכה אחת, לשווי הוגן של <Num v={TIMING_FV} /> בשנת {TIMING_YEAR} — בשלושה מועדים שונים:
        </p>
        <DataTable
          head={["מועד ההערכה", "סדר הפעולות", "ערך בספרים לפני", "לקרן", `פחת שנת ${TIMING_YEAR}`]}
          rows={TIMINGS.map(({ timing, ev, dep }) => [
            timing === "start" ? `1.1.${TIMING_YEAR}` : timing === "mid" ? `1.7.${TIMING_YEAR}` : `31.12.${TIMING_YEAR}`,
            timing === "start"
              ? "שערוך בתחילת השנה, ואז פחת שנתי מלא לפי השווי ההוגן"
              : timing === "mid"
                ? "פחת חצי שנה לפי הבסיס הישן, שערוך, ואז חצי שנה לפי השווי ההוגן"
                : "פחת שנתי מלא לפי הבסיס הישן, ואז שערוך בסוף השנה",
            r2(ev.before),
            r2(ev.oci),
            r2(dep),
          ])}
        />
      </TipCard>

      <TipCard icon={<Store className="h-5 w-5" />} title="גריעת נכס שיש לו קרן">
        <p>
          כשהנכס נמכר, הרווח או ההפסד נמדדים מול הערך בספרים <strong>המשוערך</strong>, ויתרת הקרן שנותרה עוברת בבת אחת לעודפים — בלי לעבור ברווח והפסד (סעיף
          41). נניח שהמבנה נמכר ב-31.12.{SALE_YEAR} (ערך בספרים <Num v={r2(sold.closing)} />) ב-<Num v={SALE_PRICE} />:
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
                בהעברה בקצב הפחת נותרו <Num v={r2(sold.surplus)} />; בהעברה בעת גריעה — כל <Num v={r2(soldKept.surplus)} /> עוברים עכשיו. בשתי השיטות, סך מה שהגיע
                לעודפים עד היום זהה.
              </>
            }
          />
        </div>
        <p className="text-sm text-muted">נכס שנשא בעבר ירידת ערך שנזקפה לרווח והפסד — אין לו קרן, ולכן בגריעה אין מה להעביר לעודפים; רק הרווח או ההפסד מהמכירה.</p>
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
