import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import type { Entry } from "@/lib/learn/basics";
import {
  accumulatedTo,
  bookValue,
  depreciationEntry,
  depreciationOfYear,
  DEVICES,
  deviceResults,
  FORKLIFTS,
  forkliftResults,
  monthsBetween,
  monthsInYear,
  OVEN,
  PRESS,
  sale,
  saleEntry,
  VAN,
  yearly,
} from "@/lib/learn/basics-ppe";
import { Deeper, Remember } from "@/components/study-mode/screen-parts";
import { cn } from "@/lib/utils";
import { MiniQuiz } from "./inventory-interactive";
import { JE, Money } from "./ui";

// Every figure below comes from the fixed-asset solver; none is typed by hand.
const OVEN_YEAR = yearly(OVEN.cost, OVEN.wear);
const OVEN_YEARS = "years" in OVEN.wear ? OVEN.wear.years : 0;
const VAN_RATE = "rate" in VAN.wear ? VAN.wear.rate : 0;
const VAN_YEAR = yearly(VAN.cost, VAN.wear);
const VAN_MONTHS_1 = monthsInYear(VAN.bought, VAN.bought.year);
const VAN_DEP_1 = depreciationOfYear(VAN.cost, VAN.wear, VAN.bought, VAN.bought.year);
const VAN_ACC_2 = accumulatedTo(VAN.cost, VAN.wear, VAN.bought, { year: VAN.bought.year + 1, month: 12 });
const VAN_BV_2 = bookValue(VAN.cost, VAN_ACC_2);
const VAN_MONTHS_TO_2 = monthsBetween(VAN.bought, { year: VAN.bought.year + 1, month: 12 });
const PRESS_YEAR = yearly(PRESS.cost, PRESS.wear);
const PRESS_YEARS = "years" in PRESS.wear ? PRESS.wear.years : 0;
const PRESS_PARTS = [PRESS.bought.year, PRESS.bought.year + 1, PRESS.bought.year + 2, PRESS.sold.year].map((y) => ({
  year: y,
  months: y === PRESS.sold.year ? PRESS.sold.month : monthsInYear(PRESS.bought, y),
}));
const PRESS_ACC = accumulatedTo(PRESS.cost, PRESS.wear, PRESS.bought, PRESS.sold);
const PRESS_GAIN = sale(PRESS.cost, PRESS_ACC, PRESS.proceeds);
const PRESS_LOSS = sale(PRESS.cost, PRESS_ACC, PRESS.lowProceeds);
const PRESS_ASSET = { account: "מכונות", accumulatedAccount: "מכונות – פחת נצבר", cost: PRESS.cost, accumulated: PRESS_ACC };
const PRESS_SALE = saleEntry("1", `מכירת מכונת הדפוס, 30.${PRESS.sold.month}.${PRESS.sold.year}`, PRESS_ASSET, PRESS.proceeds, "המכונה יוצאת מהספרים: גם העלות שלה וגם כל הפחת שנצבר עליה. ההפרש בין מה שקיבלנו לעלות המופחתת הוא רווח הון.");
const PRESS_LAST = PRESS_PARTS.at(-1)!;
const PRESS_LAST_DEP = (PRESS_YEAR * PRESS_LAST.months) / 12;
const VAN_ENTRY = depreciationEntry("1", `פחת הטנדר, 31.12.${VAN.bought.year}`, "כלי רכב – פחת נצבר", VAN_DEP_1, "הוצאות פחת: הוצאה של השנה. פחת נצבר: חשבון מאזני שמקטין את הטנדר, בלי לגעת בעלות שלו.");
const F = forkliftResults();
const D = deviceResults();
const DEVICES_YEARS = "years" in DEVICES.wear ? DEVICES.wear.years : 0;
const FORK_RATE = "rate" in FORKLIFTS.wear ? FORKLIFTS.wear.rate : 0;
const FORK_YEARS = F.monthsToLastYear / 12;

const n = (v: number) => v.toLocaleString("en-US");
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

/** Three ways to treat the oven over its eight years: the expense each way lands in each year. */
function OvenWays() {
  const ways: { title: string; tone: string; years: number[]; verdict: string }[] = [
    { title: "הכול הוצאה ביום הקנייה", tone: "border-danger/50", years: Array.from({ length: OVEN_YEARS }, (_, i) => (i === 0 ? OVEN.cost : 0)), verdict: "השנה הראשונה נראית הפסדית, והשנים אחריה נראות רווחיות מדי." },
    { title: "אף פעם לא הוצאה", tone: "border-danger/50", years: Array.from({ length: OVEN_YEARS }, () => 0), verdict: "התנור עובד שמונה שנים, ואף שנה לא נושאת את העלות שלו." },
    { title: "פחת: חלק בכל שנה", tone: "border-success/60", years: Array.from({ length: OVEN_YEARS }, () => OVEN_YEAR), verdict: "כל שנה שהתנור אפה בה נושאת חלק שווה מהעלות." },
  ];
  const max = OVEN.cost;
  return (
    <div className="space-y-3" aria-label={`התנור עולה ${n(OVEN.cost)} ש״ח ומשמש ${OVEN_YEARS} שנים. שלוש דרכים לרשום את העלות: הכול בשנה הראשונה, אף פעם, או ${n(OVEN_YEAR)} בכל שנה.`}>
      {ways.map((w) => (
        <div key={w.title} className={cn("rounded-2xl border-2 bg-surface p-3", w.tone)}>
          <p className="text-[14.5px] font-bold text-fg">{w.title}</p>
          <div className="mt-2 flex h-20 items-end gap-1" dir="rtl" aria-hidden>
            {w.years.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="w-full rounded-t bg-accent/70" style={{ height: `${Math.max(2, (v / max) * 64)}px` }} />
                <span className="num text-[10.5px] text-muted">{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[13.5px] text-fg/85">{w.verdict}</p>
        </div>
      ))}
    </div>
  );
}

/** The three rows a fixed asset gives a worksheet, and where each one ends up. */
function WorksheetRows({ rows }: { rows: { account: string; dr?: number; cr?: number; where: string; carries: string }[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.account} className="rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-bold text-fg">{r.account}</span>
            <span className={cn("num font-semibold", r.dr ? "text-debit" : "text-credit")}>
              {r.dr ? "חובה" : "זכות"} <Money v={(r.dr ?? r.cr)!} plain />
            </span>
          </div>
          <p className="mt-0.5 text-[13.5px] text-muted">
            {r.where}. {r.carries}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** A fixed asset as the balance sheet shows it: cost, accumulated depreciation below it in minus, and the net. */
function NetColumn({ name, cost, accumulated }: { name: string; cost: number; accumulated: number }) {
  return (
    <div className="max-w-sm rounded-2xl border border-line bg-surface p-4" role="table" aria-label={`${name}: עלות ${n(cost)}, פחת נצבר ${n(accumulated)}, עלות מופחתת ${n(cost - accumulated)}`}>
      <p className="mb-2 text-[13px] font-bold text-muted">במאזן</p>
      {(
        [
          [`${name}, עלות`, cost],
          ["פחת נצבר", -accumulated],
        ] as [string, number][]
      ).map(([t, v]) => (
        <p key={t} className="flex justify-between py-0.5 text-[15px]">
          <span>{t}</span>
          <bdi dir="ltr" className="num">{v < 0 ? `−${n(-v)}` : n(v)}</bdi>
        </p>
      ))}
      <p className="mt-1 flex justify-between border-t-2 border-fg/70 pt-1.5 text-[15px] font-bold">
        <span>עלות מופחתת</span>
        <bdi dir="ltr" className="num">{n(cost - accumulated)}</bdi>
      </p>
    </div>
  );
}

/** A formula of the course: the rule in words, the example's numbers under it, and the same calculation in Excel. */
function Fx({ title, formula, numbers, result, excel, note }: { title: string; formula: ReactNode; numbers: string; result: number; excel: string; note?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border-2 border-accent/40 bg-surface p-4" role="group" aria-label={`${title}: ${numbers} = ${n(result)}. באקסל: ${excel}`}>
      <p className="text-[13px] font-bold text-muted">{title}</p>
      <p className="mt-1 text-[17px] font-extrabold text-fg">{formula}</p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 rounded-lg bg-accent-soft px-3 py-2 text-[15.5px] text-fg">
        <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-fg">בדוגמה</span>
        <bdi dir="ltr" className="num">
          {numbers} = <strong>{n(result)}</strong>
        </bdi>
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[14px] text-muted">
        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-bold text-fg ring-1 ring-line">באקסל</span>
        <bdi dir="ltr" className="font-mono text-fg">
          {excel}
        </bdi>
      </p>
      {note && <p className="mt-1.5 text-[13.5px] text-muted">{note}</p>}
    </div>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-1.5">
      {items.map((x, i) => (
        <li key={i} className="flex items-baseline gap-2.5">
          <span className="num grid h-6 w-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
          <span>{x}</span>
        </li>
      ))}
    </ol>
  );
}

const lossEntry: Entry = saleEntry("2", "אילו נמכרה ב-" + n(PRESS.lowProceeds), PRESS_ASSET, PRESS.lowProceeds);

export const PPE_SCREENS: Record<string, ScreenContent> = {
  "ppe-idea": {
    lead: "תנור שקונים לשמונה שנים לא נעלם ביום הקנייה, וגם לא נשאר חדש לתמיד. מה שנשחק ממנו בכל שנה הוא הוצאה של אותה שנה.",
    body: (
      <>
        <p>
          כשלמדנו על הוצאה מול השקעה ראינו שקניית רכוש היא השקעה, כי העסק ישתמש בו שנים. אבל גם השקעה מתבלה. מאפייה קנתה ב-1.1.{OVEN.bought.year} תנור ב-<Money v={OVEN.cost} />, והיא צופה שהוא יעבוד {OVEN_YEARS} שנים. איך נכון לרשום את העלות שלו?
        </p>
        <OvenWays />
        <p>
          הדרך השלישית נקראת <strong>פחת</strong>: מחלקים את עלות הנכס על השנים שבהן הוא משמש את העסק. זה עקרון ההקבלה מתחילת השיעור: ההוצאה נרשמת בשנים שבהן התנור עזר להרוויח.
        </p>
        <p>
          בכל סוף שנה רושמים את הפחת של אותה שנה בפקודת התאמה, כמו חשבונות החתך. נכס כזה, שמשמש את העסק לאורך שנים, נקרא <strong>רכוש קבוע</strong>: מבנה, מכונה, רכב, מחשבים, ריהוט.
        </p>
        <Remember>פחת הוא החלק מעלות הרכוש הקבוע שנשחק בשנה. הוא הוצאה בדוח רווח או הפסד, ונרשם בפקודת התאמה בסוף השנה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="ppe-idea"
        items={[
          {
            q: "חברה קנתה מכונה ב-1.1 ב-64,000 ₪ לעשר שנים. כמה הוצאות פחת יופיעו בדוח רווח או הפסד של השנה הראשונה?",
            options: ["6,400", "64,000", "0", "640"],
            answer: 0,
            why: "64,000 ÷ 10 = 6,400. העלות מתחלקת על עשר השנים, וכל שנה נושאת חלק שווה.",
          },
          {
            q: "איזה מאלה הוא רכוש קבוע?",
            options: ["משאית שהחברה משתמשת בה להובלות", "סחורה שנקנתה כדי למכור", "שכירות ששולמה מראש לשנה", "מזומן בקופה"],
            answer: 0,
            why: "המשאית משמשת את העסק לאורך שנים. סחורה נקנית כדי להימכר, ושכירות מראש היא חשבון חתך.",
          },
        ]}
      />
    ),
  },

  "ppe-straight": {
    lead: "בקו ישר כל שנה מלאה מקבלת את אותו פחת. השאלה נותנת מספר שנים או אחוז בשנה, ובשנת הקנייה סופרים רק את החודשים שהנכס היה בעסק.",
    body: (
      <>
        <p>
          טנדר נקנה ב-1.{VAN.bought.month}.{VAN.bought.year} ב-<Money v={VAN.cost} />, ושיעור הפחת שלו {pct(VAN_RATE)}. בשנה מלאה הוא נשחק בחמישית מהעלות שלו:
        </p>
        <Fx
          title="פחת שנתי"
          formula="פחת שנתי = עלות ÷ שנות השימוש = עלות × שיעור הפחת"
          numbers={`${n(VAN.cost)} × ${pct(VAN_RATE)}`}
          result={VAN_YEAR}
          excel={`=SLN(${VAN.cost};0;${Math.round(1 / VAN_RATE)})`}
          note={
            <>
              שנים ואחוז הם שתי צורות של אותו דבר: {pct(VAN_RATE)} בשנה זה {Math.round(1 / VAN_RATE)} שנים, ו-{OVEN_YEARS} שנים זה {pct(1 / OVEN_YEARS)} בשנה. באקסל הפונקציה SLN מקבלת עלות, ערך שייר (0 בקורס) ומספר שנים.
            </>
          }
        />
        <p>
          אבל ב-{VAN.bought.year} הטנדר היה בעסק רק מאפריל עד דצמבר, {VAN_MONTHS_1} חודשים. לכן ב-{VAN.bought.year} נרשם רק החלק של החודשים האלה, ומ-{VAN.bought.year + 1} כל שנה מלאה:
        </p>
        <Fx
          title="פחת בשנת הקנייה"
          formula="פחת = פחת שנתי × חודשים בעסק ÷ 12"
          numbers={`${n(VAN_YEAR)} × ${VAN_MONTHS_1}/12`}
          result={VAN_DEP_1}
          excel={`=SLN(${VAN.cost};0;${Math.round(1 / VAN_RATE)})*${VAN_MONTHS_1}/12`}
        />
        <p>
          את החודשים סופרים כמו בחשבונות החתך: מהחודש שבו הנכס הגיע לעסק ועד סוף השנה. התקן אומר שהפחת מתחיל כשהנכס זמין לשימוש. בשאלות זה כמעט תמיד יום הקנייה.
        </p>
        <Deeper title="להרחבה: ערך שייר">
          <p>
            לפי התקן (<bdi dir="ltr">IAS 16</bdi>) מפחיתים את העלות פחות <strong>ערך השייר</strong>: הסכום שהעסק צופה לקבל על הנכס בסוף שנות השימוש. בחומר הכתוב של הקורס ערך השייר לא מופיע, והפחת מחושב על כל העלות. מי שרוצה לדעת אם הנושא נדרש לבחינה, ישאל את המרצה.
          </p>
        </Deeper>
        <Remember>פחת שנתי = עלות ÷ שנים = עלות × שיעור. בשנת הקנייה: פחת שנתי × החודשים שהנכס היה בעסק ÷ 12.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="ppe-straight"
        items={[
          {
            q: "מחשבים נקנו ב-1.7 ב-36,000 ₪, ל-3 שנים. מה הפחת של שנת הקנייה?",
            options: ["6,000", "12,000", "3,000", "18,000"],
            answer: 0,
            why: "פחת שנתי: 36,000 ÷ 3 = 12,000. מיולי עד דצמבר יש 6 חודשים: 12,000 × 6/12 = 6,000.",
          },
          {
            q: "שיעור הפחת של רכב הוא 25% בשנה. כמה שנים הוא ישמש את העסק?",
            options: ["4", "25", "2.5", "8"],
            answer: 0,
            why: "בכל שנה נשחק רבע מהעלות, ולכן העלות כולה נגמרת אחרי 4 שנים: 100% ÷ 25% = 4.",
          },
        ]}
      />
    ),
  },

  "ppe-accum": {
    lead: "את הפחת לא מורידים מחשבון הנכס עצמו. הוא נצבר בחשבון נפרד לידו, וכך רואים תמיד גם כמה הנכס עלה וגם כמה כבר נשחק.",
    body: (
      <>
        <p>פקודת הפחת של הטנדר לסוף {VAN.bought.year}:</p>
        <JE entry={VAN_ENTRY} />
        <p>
          <strong>פחת נצבר</strong> הוא חשבון מאזני עם יתרת זכות, והוא מקטין את הנכס שלידו. כל שנה מוסיפים לו את הפחת של השנה, והוא עובר לשנה הבאה כמו כל חשבון מאזני. אחרי {VAN.bought.year + 1} נצברו בו <Money v={VAN_DEP_1} /> ועוד <Money v={VAN_YEAR} />:
        </p>
        <Fx
          title="פחת נצבר ליום מסוים"
          formula="פחת נצבר = פחת שנתי × החודשים מיום הקנייה ÷ 12"
          numbers={`${n(VAN_YEAR)} × ${VAN_MONTHS_TO_2}/12`}
          result={VAN_ACC_2}
          excel={`=SLN(${VAN.cost};0;${Math.round(1 / VAN_RATE)})*${VAN_MONTHS_TO_2}/12`}
          note={<>מאפריל {VAN.bought.year} עד דצמבר {VAN.bought.year + 1}: {VAN_MONTHS_TO_2} חודשים. אותה תוצאה כמו לחבר את הפחת של כל שנה.</>}
        />
        <NetColumn name="טנדר" cost={VAN.cost} accumulated={VAN_ACC_2} />
        <p>
          העלות פחות הפחת הנצבר נקראת <strong>עלות מופחתת</strong>. זה הסכום שהטנדר שווה בספרים. בשוק אפשר למכור אותו ביותר או בפחות.
        </p>
        <Fx title="עלות מופחתת" formula="עלות מופחתת = עלות − פחת נצבר" numbers={`${n(VAN.cost)} − ${n(VAN_ACC_2)}`} result={VAN_BV_2} excel={`=${VAN.cost}-${VAN_ACC_2}`} />
        <p className="font-semibold text-fg">בגיליון הרב-טורי כל רכוש קבוע נותן שלוש שורות. כך הן נראות במאזן הבוחן הסופי של {VAN.bought.year + 1}:</p>
        <WorksheetRows
          rows={[
            { account: "כלי רכב", dr: VAN.cost, where: "מאזני, נכס", carries: "נשאר בעלות עד שהטנדר נמכר" },
            { account: "כלי רכב – פחת נצבר", cr: VAN_ACC_2, where: "מאזני, מקטין את הנכס", carries: "גדל כל שנה, ועובר לשנה הבאה" },
            { account: "הוצאות פחת", dr: VAN_YEAR, where: `תוצאתי, הפחת של ${VAN.bought.year + 1} בלבד`, carries: "מתאפס בסוף השנה, כמו כל הוצאה" },
          ]}
        />
        <Remember>ח׳ הוצאות פחת / ז׳ פחת נצבר. העלות לא זזה. עלות פחות פחת נצבר = עלות מופחתת.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="ppe-accum"
        items={[
          {
            q: "במאזן הבוחן: מכונות 230,000, מכונות – פחת נצבר 92,000. מה העלות המופחתת של המכונות?",
            options: ["138,000", "230,000", "322,000", "92,000"],
            answer: 0,
            why: "עלות פחות פחת נצבר: 230,000 − 92,000 = 138,000.",
          },
          {
            q: "באיזה צד נמצאת היתרה של ״פחת נצבר״, ובאיזה דוח?",
            options: ["זכות, במאזן", "חובה, ברווח או הפסד", "זכות, ברווח או הפסד", "חובה, במאזן"],
            answer: 0,
            why: "פחת נצבר מקטין נכס, ולכן היתרה שלו בזכות. הוא מאזני וממשיך משנה לשנה. ההוצאה של השנה היא חשבון אחר: הוצאות פחת.",
          },
        ]}
      />
    ),
  },

  "ppe-sell": {
    lead: "כשמוכרים רכוש קבוע מוציאים מהספרים את כל מה ששייך לו: את העלות ואת הפחת שנצבר עליו. מה שנשאר בין התמורה לעלות המופחתת הוא רווח הון או הפסד הון.",
    body: (
      <>
        <p>
          מכונת דפוס נקנתה ב-1.{PRESS.bought.month}.{PRESS.bought.year} ב-<Money v={PRESS.cost} />, ל-{PRESS_YEARS} שנים (<Money v={PRESS_YEAR} /> בשנה). ב-30.{PRESS.sold.month}.{PRESS.sold.year} היא נמכרה במזומן ב-<Money v={PRESS.proceeds} />.
        </p>
        <Steps
          items={[
            <>
              <strong>פחת עד יום המכירה.</strong> ב-{PRESS.sold.year} המכונה עבדה {PRESS_LAST.months} חודשים, ובשנה הזו עוד לא נרשם עליה פחת: <bdi dir="ltr" className="num my-0.5 block text-right">{n(PRESS_YEAR)} × {PRESS_LAST.months}/12 = {n(PRESS_LAST_DEP)}</bdi>
            </>,
            <>
              <strong>הפחת הנצבר ביום המכירה.</strong> {PRESS_PARTS.map((p) => `${p.year}: ${n((PRESS_YEAR * p.months) / 12)}`).join(", ")}. ביחד <strong className="num">{n(PRESS_ACC)}</strong>, ועלות מופחתת:<bdi dir="ltr" className="num my-0.5 block text-right">{n(PRESS.cost)} − {n(PRESS_ACC)} = {n(PRESS_GAIN.bookValue)}</bdi>
            </>,
            <>
              <strong>התמורה מול העלות המופחתת.</strong> <bdi dir="ltr" className="num my-0.5 block text-right">{n(PRESS.proceeds)} − {n(PRESS_GAIN.bookValue)} = {n(PRESS_GAIN.result)}</bdi>קיבלנו יותר משהמכונה שווה בספרים: רווח הון.
            </>,
          ]}
        />
        <Fx
          title="רווח או הפסד הון"
          formula="תוצאת המכירה = תמורה − עלות מופחתת"
          numbers={`${n(PRESS.proceeds)} − (${n(PRESS.cost)} − ${n(PRESS_ACC)})`}
          result={PRESS_GAIN.result}
          excel={`=${PRESS.proceeds}-(${PRESS.cost}-${PRESS_ACC})`}
          note="תוצאה חיובית: רווח הון, בזכות. תוצאה שלילית: הפסד הון, בחובה."
        />
        <JE entry={PRESS_SALE} />
        <p>
          אילו המכונה נמכרה ב-<Money v={PRESS.lowProceeds} />, פחות מהעלות המופחתת, ההפרש היה <strong>הפסד הון</strong> של <Money v={-PRESS_LOSS.result} />, בצד החובה:
        </p>
        <JE entry={lossEntry} note={null} />
        <p>
          ואם בשאלה כתוב שהנכס נמכר <strong>בעלותו המופחתת</strong>, אין רווח ואין הפסד. הפקודה כוללת רק מזומן, פחת נצבר ועלות.
        </p>
        <p>
          <strong>כשנמכר רק אחד מכמה נכסים</strong> (משאית אחת מתוך שלוש), מוציאים רק את העלות של המשאית הזו ואת הפחת שנצבר עליה. שתי האחרות נשארות בספרים.
        </p>
        <Remember>מכירה: פחת עד יום המכירה ← ח׳ מזומן, ח׳ פחת נצבר / ז׳ עלות הנכס ← ההפרש: רווח הון (זכות) או הפסד הון (חובה).</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="ppe-sell"
        items={[
          {
            q: "רכב שעלה 92,000 ₪, עם פחת נצבר של 55,200 ₪ ביום המכירה, נמכר ב-41,000 ₪. מה התוצאה?",
            options: ["רווח הון 4,200", "הפסד הון 51,000", "רווח הון 41,000", "הפסד הון 4,200"],
            answer: 0,
            why: "עלות מופחתת: 92,000 − 55,200 = 36,800. התמורה גבוהה ממנה ב-4,200: רווח הון.",
          },
          {
            q: "במכירת רכוש קבוע, איזה סכום רושמים בזכות חשבון הנכס?",
            options: ["את העלות המקורית שלו", "את העלות המופחתת", "את התמורה", "את הפחת הנצבר"],
            answer: 0,
            why: "חשבון הנכס מחזיק את העלות, ולכן היא יוצאת במלואה. הפחת הנצבר יוצא בנפרד, בצד החובה.",
          },
        ]}
      />
    ),
  },

  "rev-ppe": {
    lead: "במאזן בוחן ראשוני הפחת של השנה עוד לא נרשם. לכן הפחת הנצבר שבו נכון לסוף השנה הקודמת, בדיוק כמו ״מראש״ של חוזה ישן.",
    body: (
      <>
        <p>
          כשבמאזן הבוחן כתוב ״?״ ליד עלות או ליד פחת נצבר, משחזרים אותם מהסיפור. שתי שאלות מכוונות את החישוב: אילו נכסים עדיין בספרים, ועד איזה תאריך נצבר הפחת.
        </p>
        <p className="font-semibold text-fg">מקרה א׳: נכס שנמכר בשנה קודמת</p>
        <p>
          ב-1.{FORKLIFTS.bought.month}.{FORKLIFTS.bought.year} נקנו {FORKLIFTS.count} מלגזות ב-<Money v={FORKLIFTS.each} /> כל אחת, בפחת של {pct(FORK_RATE)} בשנה. ב-31.12.{FORKLIFTS.soldAt.year} נמכרה אחת מהן בעלותה המופחתת, והמכירה נרשמה כראוי. מה העלות והפחת הנצבר במאזן הבוחן הראשוני של 31.12.{FORKLIFTS.year}?
        </p>
        <Steps
          items={[
            <>
              <strong>מה בספרים.</strong> המלגזה שנמכרה כבר יצאה, עם הפחת שלה. נשארו {F.left}: <bdi dir="ltr" className="num my-0.5 block text-right">{F.left} × {n(FORKLIFTS.each)} = {n(F.cost)}</bdi>
            </>,
            <>
              <strong>עד מתי נצבר הפחת.</strong> עד 31.12.{FORKLIFTS.year - 1}, כי הפחת של {FORKLIFTS.year} עוד לא נרשם. מאפריל {FORKLIFTS.bought.year} עד דצמבר {FORKLIFTS.year - 1}: {F.monthsToLastYear} חודשים, כלומר {FORK_YEARS} שנים.
            </>,
            <>
              <strong>הפחת הנצבר.</strong> <bdi dir="ltr" className="num my-0.5 block text-right">{n(F.cost)} × {pct(FORK_RATE)} × {FORK_YEARS} = {n(F.accumulated)}</bdi>
            </>,
            <>
              <strong>פקודת ההתאמה של {FORKLIFTS.year}.</strong> שנה מלאה על {F.left} המלגזות: <bdi dir="ltr" className="num my-0.5 block text-right">{n(F.cost)} × {pct(FORK_RATE)} = {n(F.yearDep)}</bdi>
            </>,
          ]}
        />
        <p className="font-semibold text-fg">מקרה ב׳: רק הפחת הנצבר ידוע</p>
        <p>
          ב-1.{DEVICES.bought.month}.{DEVICES.bought.year} נקנו {DEVICES.tablets} טאבלטים ו-{DEVICES.laptops} מחשבים ניידים, ל-{DEVICES_YEARS} שנים. נייד עולה פי {DEVICES.laptopTimes} מטאבלט. במאזן הבוחן הראשוני של 31.12.{DEVICES.year} הפחת הנצבר הוא <Money v={DEVICES.accumulated} />, והעלות ״?״.
        </p>
        <Steps
          items={[
            <>
              <strong>העלות במשתנה אחד.</strong> טאבלט = X, נייד = {DEVICES.laptopTimes}X. סך הכול: <bdi dir="ltr" className="num my-0.5 block text-right">{DEVICES.tablets}X + {DEVICES.laptops} × {DEVICES.laptopTimes}X = {D.units}X</bdi>
            </>,
            <>
              <strong>החלק שנשחק.</strong> מאוקטובר {DEVICES.bought.year} עד דצמבר {DEVICES.known.year}: {D.months} חודשים מתוך {DEVICES_YEARS * 12}.
            </>,
            <>
              <strong>המשוואה.</strong> <bdi dir="ltr" className="num my-0.5 block text-right">{D.units}X × {D.months}/{DEVICES_YEARS * 12} = {n(DEVICES.accumulated)}</bdi>ולכן:<bdi dir="ltr" className="num my-0.5 block text-right">X = {n(D.x)}</bdi>העלות:<bdi dir="ltr" className="num my-0.5 block text-right">{D.units} × {n(D.x)} = {n(D.cost)}</bdi>
            </>,
            <>
              <strong>פחת {DEVICES.year}:</strong> <bdi dir="ltr" className="num my-0.5 block text-right">{n(D.cost)} ÷ {DEVICES_YEARS} = {n(D.yearDep)}</bdi>
            </>,
          ]}
        />
        <Remember>במאזן בוחן ראשוני: עלות של מה שעדיין בספרים, ופחת נצבר עד סוף השנה הקודמת. הפחת של השנה הוא פקודת התאמה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="rev-ppe"
        items={[
          {
            q: "ציוד נקנה ב-1.1.2023 ב-86,000 ₪, בפחת של 10%. מה הפחת הנצבר במאזן הבוחן הראשוני של 31.12.2025?",
            options: ["17,200", "25,800", "8,600", "86,000"],
            answer: 0,
            why: "הפחת של 2025 עוד לא נרשם, ולכן הפחת הנצבר הוא של 2023 ו-2024: 86,000 × 10% × 2 = 17,200.",
          },
        ]}
      />
    ),
  },
};

