import { Box, Car, ClipboardCheck, Factory, Gift, Package, Scale, Ship, TrendingUp } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { CARS } from "@/lib/study/inventory/fifo";
import { CUST, custNet, ORDER, ORDER_COST, TARGET, TARGET_COST, TARGET_GROSS, TIER, tierCost } from "@/lib/study/inventory/discounts";
import { BASES, SET, SET_COST, SET_PRICE } from "@/lib/study/inventory/cost";
import { FIX, FIX_UNITS } from "@/lib/study/inventory/ias2";
import { FV_NRV, FV_TABLE } from "@/lib/study/inventory/nrv";
import { NET, NET_COGS, NET_PURCHASES, NET_SALES } from "@/lib/study/inventory/recording";
import { TWO_YEARS, YEAR2_COGS } from "@/lib/study/inventory/what";
import { MiniQuiz } from "./inventory-interactive";
import { Reveal, Sorted, Story } from "./inventory-teach";
import { Card, Money } from "./ui";

/**
 * The concept screens the twelve-lesson course added to the ones it kept:
 * the year-end entry and the next year, net amounts, the definition and a
 * count to correct, how freight is worded and bundles, discounts read
 * closely, specific identification, and NRV in the statements and in theory.
 * Each teaches one principle, with a self-check on a page of its own.
 */

// Lesson 1's candle shop, as the first screen tells it: 10 kits at 50, 6 sold.
const KITS = { bought: 10, sold: 6, cost: 50 };
const kitsLeft = KITS.bought - KITS.sold;

const Y = TWO_YEARS;
const left1 = Y.buy1 - Y.sold1;
const left2 = left1 + Y.buy2 - Y.sold2;

const perPack = (BASES.qty / BASES.pack.size) * BASES.pack.fee;
const perKg = BASES.qty * BASES.kg.perUnit * BASES.kg.rate;
const tierQty = [4_000, 6_000, 10_000];

/** Steps or items made on the server and handed to a client component: each needs a key. */
const keyed = (xs: ReactNode[]) => xs.map((x, i) => <Fragment key={i}>{x}</Fragment>);

export const COURSE_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------- lesson 1
  "iv-welcome": {
    lead: "לפני המושגים — מפה: מה נלמד בקורס, באיזה סדר, ומה תדעו לעשות בסופו.",
    body: (
      <>
        <Story icon={<ClipboardCheck />} title="מה שאלת מלאי במבחן מבקשת">
          <p>חברה קונה ומוכרת סחורה במהלך השנה. צריך למצוא כמה שווה מה שנשאר במחסן, כמה עלה מה שנמכר, וכמה הרוויחה — ולפעמים גם כמה תקבל מהביטוח אחרי שריפה.</p>
        </Story>
        <ol className="max-w-[70ch] space-y-2">
          {(
            [
              ["שיעורים 1–3 · היסודות", "מהו מלאי ולמה הוא לא הוצאה, איך רושמים אותו, ומה נספר כמלאי של החברה."],
              ["שיעורים 4–5 · כמה עולה המלאי", "מה נכנס לעלות של רכישה, ואיך קוראים כל סוג של הנחה."],
              ["שיעורים 6–8 · איך מעריכים", "FIFO, ממוצע תקופתי וממוצע נע — ואז הנמוך מבין העלות לשווי מימוש נטו."],
              ["שיעורים 9–12 · שאלות מבחן", "נעלמים, שריפה וביטוח, דף הפתרון — ושתי שאלות מלאות ברמת מבחן."],
            ] as const
          ).map(([t, d], i) => (
            <li key={t} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-start rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span>
                <strong className="text-fg">{t}</strong> — {d}
              </span>
            </li>
          ))}
        </ol>
        <Part title="בשיעור הזה">
          <ul className="list-inside list-disc space-y-1">
            <li>למה מה שלא נמכר אינו הוצאה של השנה</li>
            <li>ארבעת הצעדים בסוף השנה, ופקודת מלאי הסגירה</li>
            <li>מה קורה למלאי בשנה הבאה</li>
            <li>הדוח עד הרווח הגולמי</li>
          </ul>
        </Part>
        <Remember>כל שיעור בנוי אותו דבר: מושגים קצרים, אחד בכל מסך, עם בדיקה קטנה אחרי כל אחד — ואז תרגול וסיכום. מה שצריך לדעת מראש: רק חובה וזכות.</Remember>
      </>
    ),
  },
  "iv-year-end": {
    lead: "בשיטה תקופתית, הקניות נרשמות כל השנה כהוצאה. בסוף השנה מתקנים: סופרים מה נשאר, ומוציאים את העלות שלו מההוצאות.",
    body: (
      <>
        <Story icon={<ClipboardCheck />} title="להבה, 31.12">
          <p>
            במהלך השנה נרשמו קניות של {KITS.bought} ערכות × {KITS.cost} = <Money v={KITS.bought * KITS.cost} />. נמכרו {KITS.sold}. מה עושים עכשיו?
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              <strong>רושמים את הקניות</strong> לאורך השנה: ח׳ קניות / ז׳ ספקים — <Money v={KITS.bought * KITS.cost} />.
            </>,
            <>
              <strong>סופרים</strong> את מה שבמחסן ב-31.12: {kitsLeft} ערכות.
            </>,
            <>
              <strong>מעריכים בעלות</strong>: {kitsLeft} × {KITS.cost} = <Money v={kitsLeft * KITS.cost} />.
            </>,
            <>
              <strong>רושמים פקודת התאמה</strong>: ח׳ מלאי סגירה מאזני / ז׳ מלאי סגירה רווח או הפסד — <Money v={kitsLeft * KITS.cost} />. ההוצאה יורדת ל-
              <Money v={KITS.sold * KITS.cost} /> — בדיוק {KITS.sold} הערכות שנמכרו.
            </>,
          ])}
        />
        <Remember>הפקודה עושה שני דברים בבת אחת: יוצרת נכס במאזן, ומקטינה את ההוצאה — כי מה שלא נמכר אינו הוצאה של השנה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-year-end"
        items={[
          {
            q: "מה בא קודם בסוף השנה?",
            options: ["הספירה, ואחריה ההערכה בעלות", "ההערכה, ואחריה הספירה", "הפקודה, ואחריה הספירה", "אין סדר"],
            answer: 0,
            why: "קודם יודעים כמה יחידות יש — ורק אז אפשר לתת להן מחיר.",
          },
          {
            q: "בסוף השנה נספרו 30 יחידות שעלו 12 ₪ כל אחת. מה סכום הפקודה?",
            options: ["360 ₪", "30 ₪", "12 ₪", "תלוי במחיר המכירה"],
            answer: 0,
            why: "30 × 12 = 360 ₪ — לפי העלות, לא לפי המחיר שבו יימכרו.",
          },
        ]}
      />
    ),
  },
  "iv-next-year": {
    lead: "מלאי הסגירה המאזני עובר לשנה הבאה ומשנה שם: ב-1.1 הוא ״מלאי פתיחה״ — וחוזר לעלות המכר, יחד עם הקניות.",
    body: (
      <>
        <Story icon={<Package />} title="אותה חנות, שנתיים">
          <p>
            ב-2025 קנתה {Y.buy1} יח׳ ב-{Y.unit} ₪ ומכרה {Y.sold1}. ב-2026 קנתה עוד {Y.buy2} ומכרה {Y.sold2}.
          </p>
        </Story>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Card title="סוף 2025">
            <p>
              נשארו {left1} יח׳ × {Y.unit} = <Money v={left1 * Y.unit} />
            </p>
            <p className="text-sm text-muted">מלאי סגירה מאזני</p>
          </Card>
          <span className="grid place-items-center text-2xl text-muted" aria-hidden>
            ←
          </span>
          <Card title="1.1.2026">
            <p>
              מלאי פתיחה: <Money v={left1 * Y.unit} />
            </p>
            <p className="text-sm text-muted">חשבון תוצאתי בחובה — כמו קניות</p>
          </Card>
        </div>
        <p>
          <strong>עלות המכר 2026</strong> = <Money v={left1 * Y.unit} plain /> + <Money v={Y.buy2 * Y.unit} plain /> − <Money v={left2 * Y.unit} plain /> = <Money v={YEAR2_COGS} /> — בדיוק{" "}
          {Y.sold2} יח׳ × {Y.unit}.
        </p>
        <Remember>מה שלא נמכר השנה נמכר בשנה הבאה — ושם גם נרשמת ההוצאה שלו. כך כל יחידה נכנסת לעלות המכר פעם אחת, בשנה שבה נמכרה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-next-year"
        items={[
          {
            q: "מלאי הסגירה של 2025 היה 48,000 ₪. מהו מלאי הפתיחה של 2026?",
            options: ["48,000 ₪", "0 — כל שנה מתחילה מאפס", "תלוי בקניות של 2026", "תלוי בספירה של 2026"],
            answer: 0,
            why: "מה שעמד במחסן ב-31.12 הוא מה שעומד בו ב-1.1.",
          },
          {
            q: "איפה מופיע מלאי הפתיחה בדוח רווח או הפסד?",
            options: ["בעלות המכר, בתוספת לקניות", "בהכנסות", "מתחת לרווח הגולמי", "לא מופיע"],
            answer: 0,
            why: "עלות המכר = מלאי פתיחה + קניות − מלאי סגירה.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 2
  "iv-net": {
    lead: "הנחות והחזרות נרשמות בנטו: מה שקשור ללקוחות מקטין את המכירות, ומה שקשור לספקים מקטין את הקניות.",
    body: (
      <>
        <Sorted
          columns={[
            { title: "מקטין את המכירות", tone: "neutral", items: keyed([<>הנחות ללקוחות</>, <>החזרות מלקוחות</>]) },
            { title: "מקטין את הקניות", tone: "neutral", items: keyed([<>הנחות מספקים</>, <>החזרות לספקים</>]) },
          ]}
        />
        <p>שנה של חנות אחת, צעד אחר צעד:</p>
        <Reveal
          steps={keyed([
            <>
              מכירות נטו = <Money v={NET.sales} plain /> − <Money v={NET.custDiscounts} plain /> (הנחות) − <Money v={NET.custReturns} plain /> (החזרות) = <Money v={NET_SALES} />.
            </>,
            <>
              קניות נטו = <Money v={NET.purchases} plain /> − <Money v={NET.suppDiscounts} plain /> − <Money v={NET.suppReturns} plain /> = <Money v={NET_PURCHASES} />.
            </>,
            <>
              עלות המכר = <Money v={NET.opening} plain /> + <Money v={NET_PURCHASES} plain /> − <Money v={NET.closing} plain /> = <Money v={NET_COGS} />.
            </>,
            <>
              רווח גולמי = <Money v={NET_SALES} plain /> − <Money v={NET_COGS} plain /> = <Money v={NET_SALES - NET_COGS} />.
            </>,
          ])}
        />
        <Deeper title="וכשהקניות נטו חסרות?">
          <p>
            לפעמים נתונה עלות המכר, וחסרות ההחזרות לספקים. כותבים את המשוואה עם נעלם: עלות המכר = פתיחה + (קניות ברוטו − X) − סגירה, ופותרים.
          </p>
        </Deeper>
        <Remember>לפני שמציבים מספר בדוח, שואלים: זה של לקוח או של ספק? התשובה קובעת את השורה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-net"
        items={[
          {
            q: "הספק נתן לחברה הנחה של 3,000 ₪. מה קטן?",
            options: ["הקניות", "המכירות", "מלאי הפתיחה", "הרווח הגולמי"],
            answer: 0,
            why: "הנחה מספק מקטינה את הקניות נטו — ולכן את עלות המכר. הרווח הגולמי דווקא גדל.",
          },
          {
            q: "לקוחות החזירו סחורה ב-5,000 ₪. מה קטן?",
            options: ["המכירות", "הקניות", "עלות המכר", "שום דבר"],
            answer: 0,
            why: "החזרה מלקוח מבטלת חלק מהמכירה.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 3
  "iv-definition": {
    lead: "מלאי הוא נכס שמוחזק כדי למכור אותו. מה שהחברה משתמשת בו בעצמה, או מחלקת בחינם — אינו מלאי.",
    body: (
      <>
        <Sorted
          columns={[
            { title: "שלושה סוגי מלאי", tone: "good", items: ["מוצרים גמורים — מוכנים למכירה", "מוצרים בתהליך ייצור", "חומרי גלם וחומרי עזר לייצור"] },
            { title: "לא מלאי", tone: "bad", items: ["דוגמיות וקטלוגים לחלוקה חינם", "מכונה שהחברה עובדת בה", "מחשבים של המשרד"] },
          ]}
        />
        <Deeper title="על מה התקן לא חל?">
          <ul className="list-inside list-disc space-y-1">
            <li>מכשירים פיננסיים, כמו מניות ואגרות חוב (IAS 32, IFRS 9).</li>
            <li>נכסים ביולוגיים הקשורים לפעילות חקלאית, ותוצרת חקלאית בעת האסיף (IAS 41).</li>
          </ul>
          <p>לכל אלה יש תקן משלהם. כל שאר סוגי המלאי — לפי IAS 2.</p>
        </Deeper>
        <Remember>
          ״במהלך העסקים הרגיל״ — נבחן לפי מה שהחברה עושה. קרקע אצל קבלן שבונה ומוכר דירות היא מלאי; אותה קרקע אצל מפעל שבונה עליה מחסן — רכוש קבוע.
        </Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-definition"
        items={[
          {
            q: "מאפייה מחזיקה קמח במחסן. מאיזה סוג מלאי הוא?",
            options: ["חומר גלם", "מוצר גמור", "בתהליך ייצור", "לא מלאי"],
            answer: 0,
            why: "קמח ייצרך בייצור הלחם — חומר גלם.",
          },
          {
            q: "חנות מחשבים מחזיקה מחשב שמשמש את הקופה. האם הוא מלאי?",
            options: ["לא — הוא לא מוחזק למכירה", "כן — החנות מוכרת מחשבים", "רק אם הוא חדש", "כן, בשווי מימוש נטו"],
            answer: 0,
            why: "המחשב של הקופה משמש את החנות — רכוש קבוע. רק מה שמוחזק למכירה הוא מלאי.",
          },
        ]}
      />
    ),
  },
  "iv-count-fixes": {
    lead: "כשמתגלה שהספירה הייתה שגויה — מתקנים אותה: מוסיפים מה ששלנו ולא נספר, ומורידים מה שנספר ולא ראוי למכירה.",
    body: (
      <>
        <Story icon={<ClipboardCheck />} title="בהכנת הדוחות, בפברואר">
          <p>
            בסגירה של שנה שעברה נספרו {FIX.counted} יח׳ ב-{FIX.unitCost} ₪. עכשיו התברר: {FIX.consigned} יח׳ במשגור אצל רשת לא נספרו, ו-{FIX.broken} יח׳ שנספרו שבורות ולא
            ימכרו לעולם.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              משגור — שלנו עד שיימכר: <strong>מוסיפים</strong> {FIX.consigned} יח׳.
            </>,
            <>
              שבורות — אינן נכס: <strong>מורידים</strong> {FIX.broken} יח׳.
            </>,
            <>
              מלאי הפתיחה הנכון: ({FIX.counted} + {FIX.consigned} − {FIX.broken}) × {FIX.unitCost} = {FIX_UNITS} × {FIX.unitCost} = <Money v={FIX_UNITS * FIX.unitCost} />.
            </>,
          ])}
        />
        <Deeper title="ויחידות פגומות בסוף השנה הנוכחית?">
          <p>
            יחידות שנספרו אבל יושמדו — לא נכנסות למלאי הסגירה. העלות שלהן נשארת בעלות המכר, כי בעלות המכר נמצא כל מה שנקנה ולא נשאר כנכס.
          </p>
        </Deeper>
        <Remember>מלאי הפתיחה הוא מה שהיה באמת של החברה וראוי למכירה ב-31.12 — לא מה שנכתב בספירה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-count-fixes"
        items={[
          {
            q: "מלאי במשגור שלא נספר בסגירה של שנה שעברה — מה עושים השנה?",
            options: ["מוסיפים אותו למלאי הפתיחה", "מוסיפים אותו לקניות", "מתעלמים — הוא לא במחסן", "מורידים אותו מהמכירות"],
            answer: 0,
            why: "הוא היה שלנו ב-31.12 — ולכן הוא חלק מהמלאי שפותח את השנה.",
          },
          {
            q: "בספירה ב-31.12 נמצאו 20 יחידות פגומות שיושמדו. מה קורה לעלות שלהן?",
            options: ["נשארת בעלות המכר", "נשארת במלאי הסגירה", "עוברת להכנסות", "נמחקת מהקניות"],
            answer: 0,
            why: "הן לא נכס — לא נכנסות למלאי הסגירה, ולכן העלות שלהן נשארת בעלות המכר.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 4
  "iv-cost-bases": {
    lead: "אותה הובלה יכולה להיות מנוסחת בארבע דרכים. מתרגמים כל אחת לשקלים של הרכישה — ורק אז מחלקים בכמות.",
    body: (
      <>
        <Story icon={<Ship />} title={`רכישה אחת: ${BASES.qty} יח׳ ב-${BASES.price} ₪`}>
          <p>ארבעה ספקים, ארבעה ניסוחים להובלה. כמה הובלה נכנסת לרכישה?</p>
        </Story>
        <DataTable
          head={["הניסוח בשאלה", "החישוב", "סה״כ הובלה", "ליחידה"]}
          rows={[
            [`״${BASES.shipment.toLocaleString("he-IL")} ₪ למשלוח״`, "סכום אחד", BASES.shipment, BASES.shipment / BASES.qty],
            [`״${BASES.perUnit} ₪ ליחידה״`, `${BASES.qty} × ${BASES.perUnit}`, BASES.qty * BASES.perUnit, BASES.perUnit],
            [`״${BASES.pack.fee} ₪ לארגז של ${BASES.pack.size}״`, `${BASES.qty} ÷ ${BASES.pack.size} × ${BASES.pack.fee}`, perPack, perPack / BASES.qty],
            [`״${BASES.kg.rate} ₪ לק״ג; יחידה שוקלת ${BASES.kg.perUnit} ק״ג״`, `${BASES.qty} × ${BASES.kg.perUnit} × ${BASES.kg.rate}`, perKg, perKg / BASES.qty],
          ]}
        />
        <Deeper title="ומכס באחוזים?">
          <p>״מכס X% מעלות הרכישה נטו״ — האחוז מחושב על המחיר אחרי ההנחה, בלי ההובלה ובלי עלויות נלוות אחרות. מכס שאפשר לקבל בחזרה — לא נכנס בכלל.</p>
        </Deeper>
        <Remember>קודם הסכום לכל הרכישה, אחר כך ליחידה. הטעות הנפוצה: לכפול ״למשלוח״ בכמות, כאילו כתוב ״ליחידה״.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-cost-bases"
        items={[
          {
            q: "״הובלה 600 ₪ למשלוח״, ובמשלוח 200 יחידות. כמה הובלה ליחידה?",
            options: ["3 ₪", "600 ₪", "120,000 ₪", "0.33 ₪"],
            answer: 0,
            why: "600 ÷ 200 = 3 ₪ ליחידה.",
          },
          {
            q: "״20 ₪ לארגז; בכל ארגז 100 יחידות״. נקנו 5,000 יחידות. כמה הובלה?",
            options: ["1,000 ₪", "100,000 ₪", "20 ₪", "500 ₪"],
            answer: 0,
            why: "5,000 ÷ 100 = 50 ארגזים × 20 = 1,000 ₪.",
          },
        ]}
      />
    ),
  },
  "iv-bundles": {
    lead: "כשהחברה קונה ומוכרת ערכות שלמות, היחידה של המלאי היא הערכה: המחיר שלה הוא סכום מה שבתוכה, וכל השאר נספר בערכות.",
    body: (
      <>
        <Story icon={<Gift />} title="ערכת אירוח">
          <p>
            בכל ערכה {SET.cups} כוסות ב-{SET.cup} ₪ ו-{SET.plates} צלחות ב-{SET.plate} ₪. החברה קנתה {SET.qty} ערכות, ומוכרת רק ערכות שלמות.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              מחיר ערכה: {SET.cups} × {SET.cup} + {SET.plates} × {SET.plate} = <Money v={SET_PRICE} />.
            </>,
            <>
              ההנחה נמדדת בערכות: {SET.qty} ערכות &gt; {SET.threshold}, אז {SET.pct}% — <Money v={(SET.qty * SET_PRICE * (100 - SET.pct)) / 100} />.
            </>,
            <>
              הובלה ימית <Money v={SET.shipment} plain /> למשלוח, והובלה למחסן {SET.inland} ₪ לערכה: סה״כ <Money v={SET_COST} />.
            </>,
            <>
              לערכה: <Money v={SET_COST} plain /> ÷ {SET.qty} = <Money v={SET_COST / SET.qty} />. זה המספר שנכנס לטבלת המלאי.
            </>,
          ])}
        />
        <Remember>הספירה, ההנחות, שווי המימוש נטו והמכירות — כולם בערכות. אל תפרקו ערכה לכוסות וצלחות, אלא כדי למצוא את המחיר שלה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-bundles"
        items={[
          {
            q: "בארגז 4 משחקים ב-40 ₪ ו-6 פאזלים ב-15 ₪. מה מחיר הארגז?",
            options: ["250 ₪", "55 ₪", "550 ₪", "100 ₪"],
            answer: 0,
            why: "4 × 40 + 6 × 15 = 160 + 90 = 250 ₪.",
          },
          {
            q: "״הנחה של 10% ברכישה של מעל 50 ארגזים״. נקנו 60 ארגזים, שבהם 600 פריטים. האם יש הנחה?",
            options: ["כן — 60 ארגזים מעל 50", "לא — צריך לספור פריטים", "רק על 10 ארגזים", "רק אם נמכרו"],
            answer: 0,
            why: "הסף בארגזים, וסופרים בארגזים: 60 > 50.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 5
  "iv-discount-order": {
    lead: "הנחה של ספק חלה על המחיר שלו בלבד. לכן סדר העבודה קבוע: מחיר, הנחה, מכס על מה שנשאר — ורק אז ההובלות.",
    body: (
      <>
        <Story icon={<Scale />} title={`${ORDER.qty.toLocaleString("he-IL")} יח׳ ב-${ORDER.price} ₪`}>
          <p>
            הנחה {ORDER.pct}%, מכס {ORDER.duty}% מהמחיר נטו, הובלה <Money v={ORDER.freight} plain /> ₪ למשלוח.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              מחיר: <Money v={ORDER.qty * ORDER.price} />.
            </>,
            <>
              פחות הנחה {ORDER.pct}%: <Money v={(ORDER.qty * ORDER.price * (100 - ORDER.pct)) / 100} /> — זה ״המחיר נטו״.
            </>,
            <>
              מכס {ORDER.duty}% על המחיר נטו: <Money v={(((ORDER.qty * ORDER.price * (100 - ORDER.pct)) / 100) * ORDER.duty) / 100} />.
            </>,
            <>
              ועוד הובלה: <Money v={ORDER.freight} plain />. עלות הרכישה: <Money v={ORDER_COST} />.
            </>,
          ])}
        />
        <Remember>ההובלה אינה של הספק — לכן ההנחה שלו לא חלה עליה. והמכס נמדד אחרי ההנחה, לא לפניה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-discount-order"
        items={[
          {
            q: "מחיר 10,000 ₪, הנחה 10%, מכס 5% מהמחיר נטו. כמה מכס?",
            options: ["450 ₪", "500 ₪", "550 ₪", "1,000 ₪"],
            answer: 0,
            why: "מחיר נטו 9,000 × 5% = 450 ₪.",
          },
          {
            q: "על מה לא חלה הנחת הספק?",
            options: ["על ההובלה", "על מחיר הרכישה", "על הכמות שמעל הסף", "על כל הרכישה"],
            answer: 0,
            why: "ההובלה משולמת לחברת הובלה — לא לספק שנותן את ההנחה.",
          },
        ]}
      />
    ),
  },
  "iv-tiered": {
    lead: "הנחה במדרגות: כל מדרגה נבדקת לחוד, באותה רכישה — ומחברים את מה שעברנו.",
    body: (
      <>
        <Story icon={<TrendingUp />} title="ההסכם עם הספק">
          <p>
            מחיר {TIER.price} ₪ ליחידה. ברכישה של מעל {TIER.wholeOver.toLocaleString("he-IL")} יח׳ — {TIER.wholePct}% הנחה על <strong>כל</strong> הרכישה. ובנוסף, {TIER.unitOff} ₪
            הנחה על כל יחידה <strong>מעבר ליחידה ה-{TIER.unitAfter.toLocaleString("he-IL")}</strong>.
          </p>
        </Story>
        <DataTable
          head={["כמות ברכישה", "מדרגה 1", "מדרגה 2", "עלות", "ליחידה"]}
          rows={tierQty.map((q) => [
            q.toLocaleString("he-IL"),
            q > TIER.wholeOver ? (q * TIER.price * TIER.wholePct) / 100 : "—",
            q > TIER.unitAfter ? (q - TIER.unitAfter) * TIER.unitOff : "—",
            tierCost(q),
            tierCost(q) / q,
          ])}
        />
        <Remember>ההנחות מחושבות לכל רכישה בנפרד. רכישה קטנה שאחריה רכישה גדולה — לא ״מצטרפות״ לסף, אלא אם כתוב שהסף שנתי.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-tiered"
        items={[
          {
            q: `לפי ההסכם, כמה מדרגה 2 שווה ברכישה של 9,000 יח׳?`,
            options: ["6,000 ₪", "54,000 ₪", "0", "36,000 ₪"],
            answer: 0,
            why: `רק ${9_000 - TIER.unitAfter} יח׳ מעבר ל-${TIER.unitAfter} × ${TIER.unitOff} = 6,000 ₪.`,
          },
          {
            q: "רכישה של 5,000 יח׳ בדיוק — האם מגיעה מדרגה 1?",
            options: ["לא — צריך מעל 5,000", "כן", "חצי ממנה", "רק אם הרכישה הבאה גדולה"],
            answer: 0,
            why: "״מעל״ — 5,000 בדיוק אינו מעל.",
          },
        ]}
      />
    ),
  },
  "iv-targets": {
    lead: "הנחת יעד רכישות, שהחברה צופה לעמוד בה, נרשמת כבר בכל רכישה — כי היעד בשליטתה. יעד שלא הושג — אין הנחה.",
    body: (
      <>
        <Story icon={<Package />} title={`${TARGET.pct}% על כל רכישות השנה — אם יירכשו מעל ${TARGET.over.toLocaleString("he-IL")} יח׳`}>
          <p>החברה צופה לעמוד ביעד. במהלך השנה קנתה:</p>
          <ul className="list-inside list-disc">
            {TARGET.buys.map((b, i) => (
              <li key={i}>
                {b.qty.toLocaleString("he-IL")} יח׳ ב-{b.price} ₪
              </li>
            ))}
          </ul>
        </Story>
        <p>
          ברוטו <Money v={TARGET_GROSS} plain /> × {100 - TARGET.pct}% = <Money v={TARGET_COST} /> — כל רכישה נרשמת כבר בנטו.
        </p>
        <Sorted
          columns={[
            { title: "מכירים בהנחה", tone: "good", items: ["היעד כבר הושג", "יעד רכישות, והחברה צופה לעמוד בו"] },
            { title: "לא מכירים", tone: "bad", items: ["יעד מכירות שעוד לא הושג", "יעד שהחברה לא צופה לעמוד בו", "יעד שהשנה נגמרה בלי להגיע אליו"] },
          ]}
        />
        <Remember>השאלה היא תמיד: האם ההנחה תלויה רק בחברה? רכישות — כן. מכירות — תלויות בלקוחות.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-targets"
        items={[
          {
            q: "ההנחה מותנית ברכישה של מעל 800,000 יח׳ בשנה. בסוף השנה נרכשו 540,000. כמה הנחה?",
            options: ["אין הנחה", "מלאה", "לפי היחס", "רק על הרכישה האחרונה"],
            answer: 0,
            why: "התנאי לא התקיים — העלות היא המחיר המלא.",
          },
          {
            q: "ההנחה מותנית במכירה של מעל 5,000 יח׳, והחברה בטוחה שתעמוד בכך. מנכים כבר ברכישה?",
            options: ["לא — יעד מכירות אינו בשליטת החברה", "כן", "רק חצי", "רק בשיטה תמידית"],
            answer: 0,
            why: "רק יעד שתלוי בחברה בלבד מוכר מראש.",
          },
        ]}
      />
    ),
  },
  "iv-customer-discounts": {
    lead: "הנחת כמות שהחברה נותנת ללקוח מקטינה את המכירות — ונבדקת בכל מכירה לחוד.",
    body: (
      <>
        <Story icon={<Box />} title={`${CUST.pct}% ללקוח שקונה מעל ${CUST.over} יחידות`}>
          <p>
            מחיר {CUST.price} ₪. השנה היו שתי מכירות: {CUST.sales[0]} יח׳ ו-{CUST.sales[1]} יח׳.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              {CUST.sales[0]} יח׳ — מתחת לסף, מחיר מלא: <Money v={CUST.sales[0] * CUST.price} />.
            </>,
            <>
              {CUST.sales[1]} יח׳ — מעל הסף, ההנחה על כל המכירה: <Money v={CUST.sales[1] * CUST.price} plain /> × {100 - CUST.pct}% ={" "}
              <Money v={CUST.sales[1] * CUST.price * (1 - CUST.pct / 100)} />.
            </>,
            <>
              מכירות נטו: <Money v={custNet} />. עלות המכר לא זזה — אותן יחידות יצאו מהמחסן.
            </>,
          ])}
        />
        <Remember>הנחה מספק — בצד העלות. הנחה ללקוח — בצד המכירות. אותה מילה, שני צדדים של הדוח.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-customer-discounts"
        items={[
          {
            q: "הנחה של 10% על מכירה של מעל 6 ארגזים. ארגז ב-1,000 ₪; נמכרו 7 ארגזים. מה ההכנסה נטו?",
            options: ["6,300 ₪", "7,000 ₪", "6,900 ₪", "600 ₪"],
            answer: 0,
            why: "7,000 × 90% = 6,300 ₪ — ההנחה על כל המכירה.",
          },
          {
            q: "הנחה ללקוח משנה את...",
            options: ["הרווח הגולמי, דרך המכירות", "עלות המכר", "מלאי הסגירה", "שום דבר"],
            answer: 0,
            why: "מכירות נטו קטנות, עלות המכר לא — והרווח הגולמי קטן.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 6
  "iv-specific": {
    lead: "כשכל פריט ייחודי, לא צריך נוסחה: לכל פריט העלות שלו. FIFO וממוצע נועדו לפריטים זהים, שאי אפשר לדעת איזה מהם נמכר.",
    body: (
      <>
        <Story icon={<Car />} title="סוכנות רכבי יוקרה">
          <ul className="list-inside list-disc">
            {CARS.map((c) => (
              <li key={c.name}>
                {c.name} — <Money v={c.cost} />
              </li>
            ))}
          </ul>
          <p>
            נמכר {CARS[1].name}. מלאי הסגירה: <Money v={CARS[0].cost} plain /> + <Money v={CARS[2].cost} plain /> = <Money v={CARS[0].cost + CARS[2].cost} />.
          </p>
        </Story>
        <Sorted
          columns={[
            { title: "זיהוי ספציפי", tone: "neutral", items: ["פריטים שאינם בני החלפה", "סחורה שיוצרה לפרויקט מסוים"] },
            { title: "FIFO או ממוצע משוקלל", tone: "neutral", items: ["כל השאר — פריטים זהים", "אותה נוסחה לכל מלאי דומה באופיו ובשימושו", "LIFO — אסור"] },
          ]}
        />
        <Remember>זיהוי ספציפי אינו בחירה: הוא חובה לפריטים ייחודיים, ואסור לפריטים זהים.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-specific"
        items={[
          {
            q: "חנות מוכרת אלפי חולצות זהות. באיזו נוסחה תעריך את המלאי?",
            options: ["FIFO או ממוצע משוקלל", "זיהוי ספציפי", "LIFO", "לפי מחיר המכירה"],
            answer: 0,
            why: "חולצות זהות הן בנות החלפה — לא מזהים כל אחת.",
          },
          {
            q: "גלריה מוכרת ציורים מקוריים. איזו נוסחה?",
            options: ["זיהוי ספציפי", "FIFO", "ממוצע משוקלל", "כל אחת לבחירה"],
            answer: 0,
            why: "כל ציור ייחודי — לכל אחד העלות שלו.",
          },
        ]}
      />
    ),
  },

  // ---------------------------------------------------------------- lesson 8
  "iv-nrv-fv": {
    lead: "שווי מימוש נטו הוא מה שהחברה צפויה לקבל, נטו. השווי ההוגן הוא מחיר שוק — מספר אחר, שמופיע בשאלות כדי להטעות.",
    body: (
      <>
        <Story icon={<Scale />} title="טבלה מתוך שאלה">
          <DataTable
            head={["ליחידה", "₪"]}
            rows={[
              ["עלות", FV_TABLE.cost],
              ["מחיר מכירה צפוי", FV_TABLE.price],
              ["שווי הוגן", FV_TABLE.fairValue],
              ["עלויות מכירה", FV_TABLE.selling],
            ]}
          />
        </Story>
        <Reveal
          steps={keyed([
            <>
              שווי מימוש נטו = מחיר מכירה − עלויות מכירה = {FV_TABLE.price} − {FV_TABLE.selling} = {FV_NRV} ₪.
            </>,
            <>השווי ההוגן ({FV_TABLE.fairValue} ₪) לא משתתף.</>,
            <>
              הנמוך מבין {FV_TABLE.cost} ל-{FV_NRV}: {Math.min(FV_TABLE.cost, FV_NRV)} ₪ × {FV_TABLE.qty.toLocaleString("he-IL")} ={" "}
              <Money v={FV_TABLE.qty * Math.min(FV_TABLE.cost, FV_NRV)} />.
            </>,
          ])}
        />
        <Remember>שווי מימוש נטו ספציפי לחברה — מה שהיא תקבל, אחרי מה שתוציא כדי להשלים ולמכור. שווי הוגן הוא של ״כל משתתף בשוק״.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-nrv-fv"
        items={[
          {
            q: "מחיר מכירה 80, עלויות השלמה 6, עלויות מכירה 4, שווי הוגן 70. מהו שווי המימוש נטו?",
            options: ["70 ₪", "80 ₪", "74 ₪", "60 ₪"],
            answer: 0,
            why: "80 − 6 − 4 = 70 ₪. (שהוא במקרה שווה לשווי ההוגן — אבל לא בגללו.)",
          },
          {
            q: "״שווי מימוש נטו שווה תמיד לשווי הוגן בניכוי עלויות מכירה״. נכון?",
            options: ["לא נכון", "נכון"],
            answer: 0,
            why: "שווי מימוש נטו ספציפי לחברה, ולכן לא בהכרח שווה לשווי ההוגן בניכוי עלויות מכירה.",
          },
        ]}
      />
    ),
  },
  "iv-nrv-sheet": {
    lead: "בשאלות הצגת דוחות נתונים העלות ושווי המימוש נטו. במאזן — הנמוך; ההפרש — בעלות המכר; ובשנה הבאה פותחים מהנמוך.",
    body: (
      <>
        <Story icon={<ClipboardCheck />} title="נתון נוסף בשאלת הצגת דוחות">
          <p>״עלות מלאי הסגירה 250,000 ₪; הערכת מלאי קבעה ששווי המימוש נטו שלו 240,000 ₪.״</p>
        </Story>
        <DataTable
          head={["איפה", "מה כותבים", "₪"]}
          rows={[
            ["דוח על המצב הכספי — מלאי", "הנמוך מבין השניים", 240_000],
            ["רווח או הפסד — מלאי סגירה בעלות המכר", "אותו סכום, כמלאי הסגירה", 240_000],
            ["השפעה על עלות המכר", "גדלה בהורדת הערך", 10_000],
            ["מלאי הפתיחה בשנה הבאה", "הערך אחרי ההורדה", 240_000],
          ]}
        />
        <Deeper title="ליחידה, או לכל המלאי?">
          <p>
            כשנתון שווי מימוש נטו ליחידה, כופלים ביחידות שבסגירה ומשווים לעלות הכוללת של הסגירה. כשנתון סכום כולל — משווים ישירות. בשאלות הקורס ההשוואה נעשית לכל
            המלאי מאותו סוג יחד.
          </p>
        </Deeper>
        <Remember>ולהפך — אם שווי המימוש נטו גבוה מהעלות (למשל 580,000 מול 1,250,000), המלאי בעלות, ושום דבר לא משתנה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-nrv-sheet"
        items={[
          {
            q: "עלות 550,000, שווי מימוש נטו 460,000. בכמה גדלה עלות המכר?",
            options: ["90,000 ₪", "0", "460,000 ₪", "550,000 ₪"],
            answer: 0,
            why: "מלאי הסגירה קטן ב-90,000 — ועלות המכר גדלה באותו סכום.",
          },
          {
            q: "עלות 880,000, שווי מימוש נטו 1,100,000. באיזה סכום יוצג המלאי?",
            options: ["880,000 ₪", "1,100,000 ₪", "220,000 ₪", "990,000 ₪"],
            answer: 0,
            why: "הנמוך — העלות. רווח צפוי לא נרשם.",
          },
        ]}
      />
    ),
  },
  "iv-nrv-theory": {
    lead: "שאלות התיאוריה בודקות עיקרון אחד: הפסד צפוי נרשם מיד, רווח צפוי — רק כשמוכרים. כמעט כל טענה נבדקת מולו.",
    body: (
      <>
        <Sorted
          columns={[
            { title: "משנה את ערך המלאי", tone: "bad", items: ["מחיר המכירה ירד מתחת לעלות", "המלאי ניזוק או התיישן", "עלויות ההשלמה או המכירה עלו"] },
            { title: "לא משנה", tone: "good", items: ["מחיר המכירה עלה", "שווי מימוש נטו גבוה מהעלות", "חומר גלם זול יותר — כשהמוצר הגמור עוד רווחי"] },
          ]}
        />
        <Deeper icon={<Factory />} title="תקורות ייצור קבועות בשנה חלשה">
          <p>
            בחברה יצרנית, תקורה קבועה (פחת מכונות, שכירות מפעל) מוקצית ליחידות לפי רמת ייצור <strong>רגילה</strong>.
          </p>
          <p>
            ירד הייצור באופן חריג? כל יחידה עדיין מקבלת את החלק ״הרגיל״ שלה, והחלק שלא הוקצה הוא הוצאה של התקופה. כך יחידה לא ״מתייקרת״ רק כי ייצרו מעט (IAS 2.13).
          </p>
        </Deeper>
        <Remember>
          מחירי הרכישה עלו לקראת סוף השנה? ב-FIFO מלאי הסגירה עשוי מהרכישות האחרונות — היקרות — ולכן הוא גבוה יותר מאשר בממוצע.
        </Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        chapter="iv-nrv-theory"
        items={[
          {
            q: "הביקוש למוצר ירד והחברה הורידה את מחירו מתחת לעלות. מה קורה בדוחות?",
            options: ["מורידים את המלאי לשווי מימוש נטו — הפסד מיד", "כלום עד שיימכר", "מורידים את הקניות", "רושמים הפרשה בהון"],
            answer: 0,
            why: "הפסד צפוי נרשם מיד, בעלות המכר.",
          },
          {
            q: "המחירים עלו לאורך השנה. באיזו שיטה מלאי הסגירה גבוה יותר?",
            options: ["FIFO", "ממוצע משוקלל", "בשתיהן שווה", "תלוי בשווי ההוגן"],
            answer: 0,
            why: "ב-FIFO נשארות האחרונות — היקרות.",
          },
        ]}
      />
    ),
  },
};
