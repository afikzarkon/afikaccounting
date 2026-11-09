import { ArrowDown, ArrowLeft, Building2, Car, Dumbbell, Factory, GraduationCap, ListChecks, Package, Search, Snowflake, Store, Trees, Truck, Warehouse, Wheat } from "lucide-react";
import type { ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import * as L from "@/lib/study/ifrs16/lessons/special";
import { type ColorKey, FORMULA_COLORS, Ltr, tint } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { Fork, Timeline, TwoPanel, WrongRight } from "./ias19-visuals";
import { DecisionWalk, LeaseDrill } from "./ifrs16-interactive";
import { FullSolution, P, quiz, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 8: land and buildings, subleases, sale and leaseback.
 * Every figure comes from lib/study/ifrs16/lessons/special.ts, in whole shekels,
 * and every table adds up. In a table of a balance or a movement, credit is minus
 * and debit is plus; a breakdown of a calculation stays plain arithmetic.
 */

const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const pct = (r: number, d = 0) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");
const Formula = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] font-semibold">{children}</p>;
const CH_HEAD_ROWS = [
  { open: L.CH_HEAD_PV, income: L.CH_HEAD_I1, close: L.CH_HEAD_C1 },
  { open: L.CH_HEAD_C1, income: L.CH_HEAD_I2, close: L.CH_HEAD_C2 },
];
const BAKERY_SOLD_FV = L.BAKERY.fairValue - L.BAKERY_L;
const BAKERY_SOLD_BV = L.BAKERY.bookValue - L.BAKERY_ROU;

/** One whole cut into parts: the bar, then what each part is. */
function ShareBar({ label, title, parts }: { label: string; title: ReactNode; parts: { share: number; name: ReactNode; detail?: ReactNode; c: ColorKey }[] }) {
  return (
    <figure role="img" aria-label={label} className="space-y-2.5 rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="text-[14px] font-bold text-fg">{title}</figcaption>
      <div className="flex h-10 overflow-hidden rounded-lg border border-line">
        {parts.map((p, i) => (
          <div key={i} className="grid min-w-0 place-items-center text-[12.5px] font-bold text-fg" style={{ ...tint(p.c, 30), width: `${p.share * 100}%` }}>
            <bdi dir="ltr" className="num">
              {pct(p.share, Number.isInteger(p.share * 100) ? 0 : 2)}
            </bdi>
          </div>
        ))}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {parts.map((p, i) => (
          <li key={i} className="flex gap-2 text-[13.5px] text-fg">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-sm border" style={tint(p.c, 30)} aria-hidden />
            <span>
              <strong className="font-semibold">{p.name}</strong>
              {p.detail && <span className="block text-muted">{p.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** A plain bar, how much of the whole a part takes. */
function MiniBar({ share, c }: { share: number; c: ColorKey }) {
  return (
    <span className="block h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <span className="block h-full rounded-full" style={{ width: `${share * 100}%`, background: FORMULA_COLORS[c].color }} />
    </span>
  );
}

/** The three companies of a sublease, and what sits in each one's books. */
function ThreeParties() {
  const cards = [
    { who: "חברה א׳, הבעלים", role: "המחכיר הראשי", books: "הנכס עצמו או השקעה נטו, לפי הסיווג שלו. נכס זכות שימוש אין לה לעולם.", c: 1 as const },
    { who: "חברה ב׳, באמצע", role: "חוכרת ומחכירה הלאה", books: "התחייבות חכירה לחברה א׳. ועוד נכס זכות שימוש אם המשנה תפעולית, או השקעה נטו אם היא מימונית.", c: 3 as const },
    { who: "חברה ג׳, המשתמשת", role: "חוכרת המשנה", books: "נכס זכות שימוש והתחייבות חכירה, כמו כל חוכר.", c: 2 as const },
  ];
  const links = ["חכירה ראשית", "חכירת משנה"];
  return (
    <figure role="img" aria-label="שלוש חברות בחכירת משנה. חברה א׳ מחכירה לחברה ב׳ בחכירה ראשית, וחברה ב׳ מחכירה לחברה ג׳ בחכירת משנה" className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3.5 sm:flex-row">
      {cards.map((card, i) => (
        <div key={card.who} className="contents">
          {i > 0 && (
            <div className="flex shrink-0 items-center justify-center gap-1 text-[12px] font-semibold text-muted sm:flex-col sm:gap-0">
              <span>{links[i - 1]}</span>
              <ArrowDown className="h-4 w-4 sm:hidden" aria-hidden />
              <ArrowLeft className="hidden h-4 w-4 sm:block" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1 rounded-xl border-2 p-2.5" style={tint(card.c, 8)}>
            <p className="text-[14px] font-bold text-fg">{card.who}</p>
            <p className="text-[12.5px] font-semibold text-muted">{card.role}</p>
            <p className="mt-1.5 text-[13px] leading-snug text-fg">{card.books}</p>
          </div>
        </div>
      ))}
    </figure>
  );
}

export const IFRS16_SPECIAL_SCREENS: Record<string, ScreenContent> = {
  "ls-spc-hook": {
    lead: "עד עכשיו ראינו חוזה אחד, נכס אחד ושני צדדים. בשיעור הזה שלושה מצבים שנראים אחרת, ומטפלים בהם באותם כלים.",
    body: (
      <>
        <Tbl
          head={["מה קורה", "מה בודקים קודם"]}
          rows={[
            ["מחכירים בניין עם הקרקע שמתחתיו", "האם זו חכירה אחת או שתיים"],
            ["חוכר מעביר את הנכס הלאה לחברה שלישית", "כמה מהזכות שלו הוא העביר"],
            ["חברה מוכרת נכס וחוכרת אותו בחזרה", "האם באמת נמכר, ובאילו תנאים"],
          ]}
        />
        <P>הסימנים לסיווג מהשיעור השישי, ההשקעה נטו ומעגל ההתחייבות נשארים כמו שהם. בכל מצב נוספת רק שאלה אחת לפני החישוב. בדרך נלמד עוד שני דברים שצריך בשאלות האלה: מעבר לנדל״ן להשקעה, וריבית שאינה שנתית.</P>
        <P>כל מקרה בשיעור הוא סיפור בפני עצמו, עם חברה אחרת ומספרים אחרים.</P>
        <Rule>קודם מבינים איזה מצב לפנינו, ורק אחר כך מחשבים.</Rule>
      </>
    ),
  },
  "ls-spc-land": {
    lead: "בחוזה על בניין מסתתרים שני נכסים. המבנה מתבלה עם השנים, והקרקע נשארת, ולכן בודקים כל אחד לחוד.",
    body: (
      <>
        <P>תזכורת מהשיעור השישי: בחכירה מימונית המחכיר העביר למעשה את כל הסיכונים וההטבות, כאילו מכר את הנכס. בחכירה תפעולית הנכס נשאר שלו, והוא גובה שכירות.</P>
        <P>
          עכשיו דמיינו בית מלאכה שמוחכר ל-25 שנה, כשהמבנה יחזיק 30 שנה. בסוף החכירה המבנה כמעט גמור, ולכן החוכר קיבל את רוב מה שהוא שווה. הקרקע שמתחתיו תחזור למחכיר שלמה, ואולי תהיה שווה יותר מהיום. על המבנה אפשר לומר שהוא כמעט נמכר, ועל הקרקע אי אפשר. לכן אותו חוזה יכול לצאת מימוני במבנה ותפעולי בקרקע (סעיף ב55).
        </P>
        <P>בלי ההפרדה הייתה טעות אמיתית בדוחות. אילו סיווגנו את כל החוזה לפי המבנה, הקרקע הייתה יוצאת מהספרים של המחכיר כאילו נמכרה, ונרשם עליה רווח, אף שהיא חוזרת אליו בסוף.</P>
        <TwoPanel
          label="המבנה מתבלה ויש לו אורך חיים סופי, ולכן חכירה ארוכה יכולה להיות מימונית. לקרקע בדרך כלל אורך חיים לא מוגדר, ולכן חכירה שלה בדרך כלל תפעולית"
          panels={[
            { title: "המבנה", icon: <Building2 />, steps: ["מתבלה עם השנים", "החיים שלו נגמרים", "חכירה ארוכה לוקחת את רובם"], verdict: "יכול לצאת מימונית", tone: 1 },
            { title: "הקרקע", icon: <Trees />, steps: ["לא מתבלה", "אורך חייה הכלכליים לא מוגדר", "גם 30 שנה הן לא רוב החיים"], verdict: "בדרך כלל תפעולית", tone: 2 },
          ]}
        />
        <P>
          לפני שמפרידים יש שתי בדיקות. <strong>קרקע מהותית</strong> פירושה שהקרקע שווה מספיק כדי לשנות את התמונה בדוחות. אם היא שווה מעט, ההפרדה היא עבודה שלא משנה כלום. <strong>הקצאה מהימנה</strong> פירושה שיש דרך אמינה לומר כמה מהתשלום הוא על הקרקע וכמה על המבנה. בלי דרך כזו אי אפשר לסווג כל חלק לבדו. בשני המסכים הבאים נראה ארבע חברות שונות, כל אחת במקום אחר במפה. עברו בכמה דרכים:
        </P>
        <DecisionWalk nodes={L.LAND_WALK} start={L.LAND_WALK_START} label="קרקע ומבנה" again="בודקים בניין אחר" />
        <WrongRight
          label="טעות: 30 שנים זה הרבה, ולכן חכירת הקרקע מימונית. נכון: לקרקע חיים לא מוגדרים"
          wrong={<p>״חכירת קרקע ל-30 שנים היא החלק העיקרי של חייה.״</p>}
          right={<p>לקרקע בדרך כלל חיים כלכליים לא מוגדרים (סעיף ב55). בלי העברת בעלות או אופציה, ובלי שהערך הנוכחי הוא כמעט כל השווי, היא תפעולית.</p>}
        />
      </>
    ),
    check: quiz("ls-spc-land", [
      {
        q: "סכום הקרקע מהותי, ואפשר להקצות באופן מהימן. כמה חכירות יש?",
        options: ["שתיים, כל מרכיב בנפרד", "אחת, לפי המבנה", "אחת, לפי הקרקע", "לפי בחירת המחכיר"],
        answer: 0,
        why: "כשאפשר לחלק, כל מרכיב מסווג לבדו (סעיפים ב55, ב56).",
      },
    ]),
  },
  "ls-spc-split": {
    lead: "כשהקרקע מהותית ויש דרך אמינה לחלק, החוזה הופך לשתי חכירות. כל אחת מקבלת חלק בתשלום ובשווי, ועוברת את הסימנים לבדה.",
    body: (
      <>
        <Story icon={<Truck />} title="חצר לוגיסטית של קרן נכסים">
          <p>
            קרן נכסים, שאינה סוחרת בנדל״ן, החכירה חצר לוגיסטית עם המגרש שלה ל-{L.YARD.years} שנים, ב-<M v={L.YARD.payment} /> בסוף כל שנה. שמאי קבע שביום החתימה שווי זכויות החכירה הוא <M v={L.YARD_BLD_FV} /> במבנה ו-<M v={L.YARD_LAND_FV} /> במגרש. למבנה {L.YARD.life} שנות חיים.
          </p>
          <p>
            בספרי הקרן המבנה רשום ב-<M v={L.YARD.buildingBV} /> והמגרש ב-<M v={L.YARD.landBV} />. אין אופציית רכישה, והחוכר לא ערב לכלום. בסוף החכירה הקרן צופה מבנה בשווי <M v={L.YARD.buildingEnd} /> ומגרש בשווי <M v={L.YARD.landEnd} />.
          </p>
        </Story>
        <P>המגרש שווה {L.YARD.landPct}% מהעסקה, וזה מהותי. יש הערכה של שמאי, ולכן יש גם הקצאה מהימנה. יוצא שלפנינו שתי חכירות.</P>
        <ShareBar
          label={`חלוקת העסקה: ${L.YARD.landPct} אחוז למגרש, והשאר למבנה`}
          title="החוזה מתחלק לפי השווי של זכויות החכירה בכל חלק"
          parts={[
            { share: L.YARD.landPct / 100, name: "מגרש", detail: `שווי ${n(L.YARD_LAND_FV)}, תשלום ${n(L.YARD_LAND_PAY)} בשנה`, c: 2 },
            { share: 1 - L.YARD.landPct / 100, name: "מבנה", detail: `שווי ${n(L.YARD_BLD_FV)}, תשלום ${n(L.YARD_BLD_PAY)} בשנה`, c: 1 },
          ]}
        />
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "מחלקים את התשלום",
              body: (
                <>
                  <p>התשלום הוא אחד, אבל הוא משלם על שני דברים. לכן מחלקים אותו באותו יחס של השווי. השווי נלקח מיום ההתקשרות, יום החתימה על החוזה (סעיף ב56).</p>
                  <Formula>תשלום למרכיב = תשלום כולל × חלק המרכיב בשווי</Formula>
                  <p>
                    <Ltr>{`${n(L.YARD.payment)} × ${L.YARD.landPct}% = ${n(L.YARD_LAND_PAY)}`}</Ltr> למגרש, והשאר למבנה: <Ltr>{`${n(L.YARD.payment)} − ${n(L.YARD_LAND_PAY)} = ${n(L.YARD_BLD_PAY)}`}</Ltr>.
                  </p>
                  <p>
                    הערך בספרים לא משחק כאן. אילו חילקנו לפיו, המגרש, שרשום בזול כי נקנה מזמן, היה מקבל רק {n(L.YARD_BOOK_PAY)} בשנה. המחיר בספרים מספר מתי נקנה הנכס, ולא כמה משלמים היום על השימוש בו.
                  </p>
                </>
              ),
            },
            {
              title: "המגרש: תפעולית",
              body: (
                <>
                  <p>
                    אין העברת בעלות ואין אופציה, ולקרקע אין אורך חיים שאפשר למדוד מולו. נשאר סימן אחד: האם הערך הנוכחי של התשלומים מגיע כמעט לכל השווי. כדי להוון צריך את הריבית הגלומה, הריבית שבה מה שהמחכיר יקבל שווה למה שהוא נתן. הוא נתן זכויות בשווי {n(L.YARD_LAND_FV)}, ויקבל {n(L.YARD_LAND_PAY)} בשנה, ובסוף את המגרש בחזרה:
                  </p>
                  <p>
                    <Ltr>{`=RATE(12;28000;-250000;300000) → ${pct(L.YARD_LAND_RATE, 2)}`}</Ltr>
                  </p>
                  <p>
                    עכשיו מהוונים רק את התשלומים, בלי המגרש שחוזר, כי את המגרש החוכר לא משלם: <Ltr>{`=PV(RATE(12;28000;-250000;300000);12;-28000) → ${n(L.YARD_LAND_PV)}`}</Ltr>. זה {pct(L.YARD_LAND_PV / L.YARD_LAND_FV)} מהשווי, רחוק מכל השווי. לכן תפעולית: המגרש נשאר בספרים, ובכל שנה נרשמת הכנסה של {n(L.YARD_LAND_PAY)}.
                  </p>
                </>
              ),
            },
            {
              title: "המבנה: הסימן הראשון לא מכריע",
              body: (
                <>
                  <p>
                    {L.YARD.years} מתוך {L.YARD.life} שנים הן {pct(L.YARD.years / L.YARD.life)} מחיי המבנה. זה הרבה, אבל לא בהכרח החלק העיקרי. לכן לא עוצרים כאן, ועוברים לסימן הבא, אותו סימן כמו במגרש:
                  </p>
                  <p>
                    <Ltr>{`=RATE(12;112000;-1000000;150000) → ${pct(L.YARD_BLD_RATE, 2)}`}</Ltr>
                  </p>
                  <p>
                    <Ltr>{`=PV(RATE(12;112000;-1000000;150000);12;-112000) → ${n(L.YARD_BLD_PV)}`}</Ltr>. זה {pct(L.YARD_BLD_PV / L.YARD_BLD_FV)} מהשווי, כמעט הכול. החוכר משלם בפועל כמעט את כל מה שהמבנה שווה, ולכן מימונית. מספיק סימן אחד.
                  </p>
                </>
              ),
            },
            {
              title: "המבנה: יוצא מהספרים",
              body: (
                <>
                  <p>חכירה מימונית היא כאילו מכרנו. המבנה יוצא, ובמקומו נכנסת השקעה נטו, הסכום שהקרן עוד תקבל בערך נוכחי. כאן הקרן אינה סוחרת, ולכן ההשקעה נטו היא השווי ההוגן, וההפרש מעל הערך בספרים הוא רווח הון:</p>
                  <p>
                    <Ltr>{`${n(L.YARD_BLD_FV)} − ${n(L.YARD.buildingBV)} = ${n(L.YARD_GAIN)}`}</Ltr>
                  </p>
                  <JournalEntry
                    title="1.1 של שנה 1"
                    lines={[
                      { account: "השקעה נטו בחכירה", dr: L.YARD_BLD_FV },
                      { account: "מבנה", cr: L.YARD.buildingBV },
                      { account: "רווח הון", cr: L.YARD_GAIN },
                    ]}
                  />
                  <p>
                    במהלך השנה ההשקעה נטו גדלה בריבית, הכנסות המימון של הקרן, וקטנה בתקבול. הריבית היא היתרה כפול הריבית הגלומה: <Ltr>{`${n(L.YARD_BLD_FV)} × ${pct(L.YARD_BLD_RATE, 4)} = ${n(L.YARD_INT)}`}</Ltr>.
                  </p>
                  <Tbl
                    dense
                    head={["השקעה נטו, שנה 1", "סכום"]}
                    rows={[
                      ["1.1", L.YARD_BLD_FV],
                      ["ריבית", L.YARD_INT],
                      ["תקבול", -L.YARD_BLD_PAY],
                    ]}
                    foot={["31.12", L.YARD_CLOSE]}
                  />
                </>
              ),
            },
            {
              title: "שנה 1 בדוחות",
              body: (
                <>
                  <p>מכאן שתי החכירות נראות זו לצד זו: מהמבנה רווח הון והכנסות מימון, ומהמגרש שכירות רגילה.</p>
                  <Tbl
                    dense
                    head={["רווח או הפסד, שנה 1", "סכום"]}
                    rows={[
                      ["רווח הון", -L.YARD_GAIN],
                      ["הכנסות מימון, מבנה", -L.YARD_INT],
                      ["הכנסות מהשכרה, מגרש", -L.YARD_LAND_PAY],
                    ]}
                    foot={["סך הכול", -(L.YARD_GAIN + L.YARD_INT + L.YARD_LAND_PAY)]}
                  />
                  <Tbl
                    dense
                    head={["מצב כספי, 31.12", "סכום"]}
                    rows={[
                      ["השקעה נטו בחכירה", L.YARD_CLOSE],
                      ["מגרש", L.YARD.landBV],
                    ]}
                  />
                </>
              ),
            },
            {
              title: "מה היה קורה בלי הפרדה",
              body: (
                <p>
                  אילו סיווגנו הכול כמימונית, גם המגרש היה יוצא מהספרים, והרווח היה <Ltr>{`${n(L.YARD.fairValue)} − ${n(L.YARD.buildingBV)} − ${n(L.YARD.landBV)} = ${n(L.YARD_WHOLE_GAIN)}`}</Ltr>. כלומר עוד {n(L.YARD_WHOLE_GAIN - L.YARD_GAIN)} רווח על מגרש שבכלל לא נמכר, וחוזר לקרן בעוד {L.YARD.years} שנים.
                </p>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>להקצות לפי הערכים בספרים, או לעצור אחרי סימן התקופה. מקצים לפי השווי ההוגן של זכויות החכירה, ביום ההתקשרות (סעיף ב56), ובודקים את כל הסימנים עד שאחד מהם מכריע.</p> },
          ]}
        />
      </>
    ),
    check: quiz("ls-spc-split", [
      {
        q: "תשלום שנתי 40,000. 20% מהשווי בקרקע. מה התשלום שמוקצה למבנה?",
        options: ["32,000 ש״ח", "8,000 ש״ח", "40,000 ש״ח", "20,000 ש״ח"],
        answer: 0,
        why: "למבנה נשארים 80%: 40,000 × 80% = 32,000.",
      },
    ]),
  },
  "ls-spc-whole": {
    lead: "לפעמים לא מפרידים בין הקרקע למבנה, ומסווגים את כל החוזה בבת אחת. זה קורה בשני מצבים שונים מאוד, ולכל אחד סיבה משלו.",
    body: (
      <>
        <Fork
          label="למה לא מפרידים. אי אפשר לחלק את התשלומים: הכול מימונית, אלא אם ברור ששני החלקים תפעוליים. הקרקע לא מהותית: יחידה אחת, לפי חיי המבנה"
          question="למה לא מפרידים?"
          branches={[
            { when: "אי אפשר לחלק באמינות", then: "הכול מימונית, אלא אם ברור ששני החלקים תפעוליים (סעיף ב56)" },
            { when: "הקרקע לא מהותית", then: "יחידה אחת, ומשווים לחיי המבנה (סעיף ב57)" },
          ]}
        />
        <Part title="אי אפשר לחלק: מפעל ישן">
          <Story icon={<Factory />} title="מפעל שאין מה להשוות אליו">
            <p>
              חברה שאינה סוחרת מחכירה מפעל ישן עם המגרש שלו ל-{L.PLANT.years} שנים, ב-<M v={L.PLANT.payment} /> בסוף כל שנה. למבנה נשארו {L.PLANT.life} שנות חיים. המגרש מהותי, אבל ייעוד הקרקע מיוחד ואין עסקאות דומות, ולכן אף אחד לא יכול לומר כמה מהתשלום הוא על המגרש.
            </p>
            <p>
              העסקה כולה שווה <M v={L.PLANT.fairValue} />. בספרים: מבנה <M v={L.PLANT.buildingBV} /> ומגרש <M v={L.PLANT.landBV} />. החברה שילמה <M v={L.PLANT.costs} /> עלויות ישירות על החוזה. בסוף החכירה היא צופה לקבל בחזרה נכס בשווי <M v={L.PLANT.end} />.
            </p>
          </Story>
          <P>
            בלי חלוקה אי אפשר לסווג כל חלק לבדו, אבל חייבים להחליט. התקן אומר: הכול מימונית, אלא אם ברור ששני החלקים תפעוליים. אז שואלים רק דבר אחד: האם ברור ששניהם תפעוליים? כאן לא. החכירה לוקחת {L.PLANT.years} מתוך {L.PLANT.life} שנות חיי המבנה, ולכן המבנה בוודאי לא תפעולי. מספיק חלק אחד כדי שהכול יהיה מימונית.
          </P>
          <P>המשמעות היא שגם המגרש יוצא מהספרים, אף שאילו יכולנו לחלק הוא כנראה היה נשאר. זה המחיר של חוסר המידע.</P>
          <P>
            ההשקעה נטו אצל מחכיר שאינו סוחר היא השווי ההוגן ועוד העלויות הישירות: <Ltr>{`${n(L.PLANT.fairValue)} + ${n(L.PLANT.costs)} = ${n(L.PLANT_NI)}`}</Ltr>. העלויות לא נכנסות לרווח, כי הן נפרסות דרך הריבית לאורך החכירה. הרווח הוא רק השווי פחות מה שיצא מהספרים: <Ltr>{`${n(L.PLANT.fairValue)} − ${n(L.PLANT.buildingBV)} − ${n(L.PLANT.landBV)} = ${n(L.PLANT_GAIN)}`}</Ltr>.
          </P>
          <JournalEntry
            title="1.1 של שנה 1"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.PLANT_NI },
              { account: "מבנה", cr: L.PLANT.buildingBV },
              { account: "מגרש", cr: L.PLANT.landBV },
              { account: "מזומן", cr: L.PLANT.costs },
              { account: "רווח הון", cr: L.PLANT_GAIN },
            ]}
          />
          <P>
            הריבית הגלומה היא זו שבה התשלומים והנכס שחוזר שווים היום בדיוק {n(L.PLANT_NI)}: <Ltr>{`=RATE(14;95000;-915000;240000) → ${pct(L.PLANT_RATE, 2)}`}</Ltr>. הריבית של השנה: <Ltr>{`${n(L.PLANT_NI)} × ${pct(L.PLANT_RATE, 4)} = ${n(L.PLANT_INT)}`}</Ltr>.
          </P>
          <Tbl
            dense
            head={["השקעה נטו, שנה 1", "סכום"]}
            rows={[
              ["1.1", L.PLANT_NI],
              ["ריבית", L.PLANT_INT],
              ["תקבול", -L.PLANT.payment],
            ]}
            foot={["31.12", L.PLANT_CLOSE]}
          />
        </Part>
        <Part title="החריג: ברור ששניהם תפעוליים">
          <P>
            חברה אחרת מחכירה חנות ברחוב ראשי ל-{L.SHOP.years} שנים, ב-<M v={L.SHOP.payment} /> בשנה, בריבית {pct(L.SHOP.rate)}. גם כאן אי אפשר לחלק, אבל למבנה {L.SHOP.life} שנות חיים, והחנות כולה שווה <M v={L.SHOP.fairValue} />. הערך הנוכחי: <Ltr>{`=PV(5%;4;-40000) → ${n(L.SHOP_PV)}`}</Ltr>, רק {pct(L.SHOP_PV / L.SHOP.fairValue)} מהשווי.
          </P>
          <P>לא משנה איך נחלק את התשלום, אף חלק לא יגיע לכל השווי שלו, ו-{L.SHOP.years} שנים הן מעט מאוד מחיי המבנה. לכן לא צריך לדעת את החלוקה: ברור ששניהם תפעוליים. הכול נשאר בספרים, והכנסה של {n(L.SHOP.payment)} בשנה.</P>
        </Part>
        <Part title="קרקע לא מהותית: האנגר על מגרש קטן">
          <Story icon={<Warehouse />} title="האנגר ל-18 שנה">
            <p>
              חברה מחכירה האנגר ל-{L.HANGAR.years} שנים, כשלמבנה {L.HANGAR.life} שנות חיים. המגרש שמתחתיו שווה רק {L.HANGAR.landPct}% מהעסקה. כל העסקה שווה <M v={L.HANGAR.fairValue} />, וההאנגר רשום בספרים, עם המגרש, ב-<M v={L.HANGAR.bookValue} />.
            </p>
          </Story>
          <P>
            הפעם לא חסר מידע, פשוט אין טעם בהפרדה. כשהקרקע כמעט לא שווה כלום, סיווג נפרד שלה לא ישנה דבר בדוחות, ולכן מותר לטפל בהכול כיחידה אחת. למדוד את התקופה אפשר רק מול חיי המבנה, כי לקרקע אין חיים שאפשר להשוות אליהם (סעיף ב57).
          </P>
          <P>
            <Ltr>{`${L.HANGAR.years} ÷ ${L.HANGAR.life} = ${pct(L.HANGAR.years / L.HANGAR.life)}`}</Ltr> מחיי המבנה, החלק העיקרי. לכן הכול מימונית, והכול יוצא מהספרים, גם המגרש הקטן.
          </P>
          <JournalEntry
            title="ביום החכירה"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.HANGAR.fairValue },
              { account: "האנגר ומגרש", cr: L.HANGAR.bookValue },
              { account: "רווח הון", cr: L.HANGAR_GAIN },
            ]}
          />
          <P>
            אילו למבנה היו {L.HANGAR.longLife} שנות חיים, אותן {L.HANGAR.years} שנים היו רק {pct(L.HANGAR.years / L.HANGAR.longLife)}. אז היינו בודקים את הערך הנוכחי, ואם גם הוא רחוק מהשווי, הכול תפעולית והאנגר נשאר בספרים.
          </P>
        </Part>
        <Remember>בשני המצבים הסיווג הוא אחד לכל החוזה. כשהכול מימונית, גם הקרקע יוצאת מהספרים. כשהכול תפעולית, הכול נשאר.</Remember>
      </>
    ),
    check: quiz("ls-spc-whole", [
      {
        q: "אי אפשר להקצות. המבנה מוחכר לרוב חייו. מה הסיווג?",
        options: ["הכול מימונית", "הכול תפעולית", "מפרידים בכל זאת", "לא מכירים עד שאפשר להקצות"],
        answer: 0,
        why: "סעיף ב56: מימונית, אלא אם ברור ששניהם תפעוליים. כאן המבנה בוודאי לא.",
      },
    ]),
  },
  "ls-spc-sub": {
    lead: "חכירת משנה היא מצב שבו חוכר מעביר את הנכס הלאה לחברה שלישית, והוא עצמו ממשיך לשלם לבעלים.",
    body: (
      <>
        <ThreeParties />
        <P>
          השאלה הראשונה היא מה בכלל החברה שבאמצע יכולה למכור. בניין היא לא יכולה להעביר, כי הוא לא שלה. מה שיש לה הוא הזכות להשתמש בו עד סוף החכירה שלה, וזה הנכס שרשום אצלה. לכן את חכירת המשנה מסווגים מול זכות השימוש: כמה מהשנים שנשארו לה היא העבירה, והאם התשלומים מגיעים כמעט לכל השווי של הזכות הזו (<T16 he="סעיף ב58(ב)" />).
        </P>
        <P>אילו היינו מסווגים מול הבניין, כמעט כל חכירת משנה הייתה יוצאת תפעולית, כי לבניין יש עשרות שנים. אז חברה שהעבירה כמעט את כל מה שיש לה הייתה ממשיכה להחזיק בספרים נכס זכות שימוש, ולהציג אותו כנכס שלה, אף שלא נשאר לה ממנו כמעט כלום.</P>
        <P>דוגמה. חברת ספנות חכרה מחסן בנמל ל-12 שנים, וחיי המחסן 60 שנה. בתחילת שנה 4 היא העבירה את הפעילות לנמל אחר. נשארו לה 9 שנים, והיא החכירה את המחסן לחברה אחרת ל-8 מהן.</P>
        <WrongRight
          label="טעות: מסווגים מול חיי הבניין. נכון: מול זכות השימוש"
          wrong={
            <>
              <p>״8 שנים מתוך 60. 13% בלבד, ולכן תפעולית.״</p>
              <MiniBar share={8 / 60} c={0} />
            </>
          }
          right={
            <>
              <p>8 שנים מתוך 9 שנשארו. זה 89% ממה שיש לה, ולכן מימונית.</p>
              <MiniBar share={8 / 9} c={1} />
            </>
          }
        />
        <P>יש גם סימן שני. נניח שנשארו 6 שנים, וחכירת המשנה רק לשנתיים, אבל הערך הנוכחי של התשלומים הוא 95% מהשווי ההוגן של זכות השימוש. השנים לא מכריעות, ובכל זאת חוכר המשנה משלם כמעט את כל מה שהזכות שווה, ולכן מימונית. גם כאן השווי הוא של הזכות, ולא של הבניין.</P>
        <P>יש חריג אחד. אם החכירה הראשית קצרה והחברה בחרה בהקלה לטווח קצר, אין לה בכלל נכס זכות שימוש בספרים, ואין מול מה לסווג. לכן חכירת המשנה תמיד תפעולית (סעיף ב58(א)).</P>
        <P>ובכיוון ההפוך, על הקלת הערך הנמוך: חוכר שמחכיר נכס בחכירת משנה, או מצפה לעשות זאת, לא יכול ליישם אותה על החכירה הראשית, גם אם הנכס זול (סעיף ב7).</P>
        <DecisionWalk nodes={L.SUB_WALK} start={L.SUB_WALK_START} label="סיווג חכירת משנה" again="בודקים חכירת משנה אחרת" />
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-spc-sub" items={L.SUB_ITEMS} options={L.SUB_OPTIONS} />
        </TaskFrame>
      </>
    ),
  },
  "ls-spc-subfin": {
    lead: "כשהחוכר העביר הלאה כמעט את כל מה שיש לו, זה כאילו מכר את זכות השימוש. הנכס יוצא מהספרים, ובמקומו נכנסת השקעה נטו. החוב שלו לבעלים נשאר כמו שהיה.",
    body: (
      <>
        <Story icon={<Store />} title="סניף שנסגר">
          <p>
            רשת חנויות חכרה חנות ל-{L.BRANCH.years} שנים, <M v={L.BRANCH.payment} /> בסוף כל שנה, בריבית {pct(L.BRANCH.rate)}, אחרי {L.BRANCH.done} שנים הסניף נסגר. ביום הסגירה רשומים בספרים שיפורים במושכר של <M v={L.BRANCH.improvements} />, אחרי פחת.
          </p>
          <p>
            ב-1.1 של שנה 4 הרשת מחכירה את החנות לבית קפה לכל {L.BRANCH.left} השנים שנשארו, ב-<M v={L.BRANCH.subPayment} /> בלבד בסוף כל שנה. את הריבית הגלומה בחכירת המשנה אי אפשר לקבוע בקלות.
          </p>
        </Story>
        <P>
          {L.BRANCH.left} מתוך {L.BRANCH.left} השנים שנשארו, ולכן מימונית. עכשיו נבדוק מה יש בספרים. עד אותו יום זו הייתה חכירה רגילה. נכס זכות השימוש התחיל ב-<Ltr>{`=PV(6%;8;-300000) → ${n(L.BRANCH_L0)}`}</Ltr>, ואחרי {L.BRANCH.done} שנות פחת נשארו <Ltr>{`${n(L.BRANCH_L0)} − ${n(L.BRANCH_DEP)} × 3 = ${n(L.BRANCH_ROU)}`}</Ltr>. ההתחייבות היא הערך הנוכחי של מה שנשאר לשלם: <Ltr>{`=PV(6%;5;-300000) → ${n(L.BRANCH_L)}`}</Ltr>.
        </P>
        <P>
          ההשקעה נטו היא הערך הנוכחי של מה שהרשת תקבל מבית הקפה. באיזו ריבית? הריבית הגלומה בחכירת המשנה לא ידועה, וסעיף 68 מאפשר להשתמש בשיעור ההיוון של החכירה הראשית. אין כאן עלויות ישירות, ולכן אין מה להתאים: <Ltr>{`=PV(6%;5;-280000) → ${n(L.BRANCH_NI)}`}</Ltr>.
        </P>
        <P>כך נראה המאזן של הרשת לפני חכירת המשנה ואחריה. שימו לב לשורה האחרונה.</P>
        <Tbl
          dense
          head={["1.1 של שנה 4", "לפני", "אחרי"]}
          rows={[
            ["נכס זכות שימוש", L.BRANCH_ROU, 0],
            ["שיפורים במושכר", L.BRANCH.improvements, 0],
            ["השקעה נטו בחכירה", 0, L.BRANCH_NI],
            ["התחייבות חכירה", -L.BRANCH_L, -L.BRANCH_L],
          ]}
        />
        <P>נכס זכות השימוש יוצא, כי הרשת העבירה את הזכות ולא תשתמש בה יותר. אם היה נשאר, היא הייתה מציגה נכס שאין לה ממנו הטבה. גם השיפורים יוצאים מאותה סיבה: הם נשארים בחנות, ומי שישתמש בהם הוא בית הקפה. בתקן החכירות אין משפט על שיפורים, וזו הקריאה של הקורס לפי IAS 16 סעיף 67(ב): נכס שלא צפויות ממנו עוד הטבות נגרע.</P>
        <P>ההתחייבות נשארת, כי בעל החנות לא שחרר את הרשת. היא תמשיך לשלם לו כל שנה, גם אם בית הקפה יפסיק לשלם לה. לכן אי אפשר להוריד אותה מהספרים, וגם אי אפשר לקזז אותה עם ההשקעה נטו: אלה שני חוזים עם שני צדדים שונים, ומי שקורא את הדוחות צריך לראות את שתי החשיפות.</P>
        <Formula>רווח או הפסד = השקעה נטו − נכס זכות שימוש − שיפורים</Formula>
        <P>
          <Ltr>{`${n(L.BRANCH_NI)} − ${n(L.BRANCH_ROU)} − ${n(L.BRANCH.improvements)} = −${n(L.BRANCH_LOSS)}`}</Ltr>. יצא יותר ממה שנכנס, ולכן זה הפסד. מי שמוסיף לחישוב את ההתחייבות מקבל תוצאה שגויה לגמרי, כי היא בכלל לא זזה.
        </P>
        <JournalEntry
          title="1.1 של שנה 4"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.BRANCH_NI },
            { account: "הפסד מחכירת משנה", dr: L.BRANCH_LOSS },
            { account: "נכס זכות שימוש", cr: L.BRANCH_ROU },
            { account: "שיפורים במושכר", cr: L.BRANCH.improvements },
          ]}
        />
        <P>
          מעכשיו הרשת מחזיקה שתי יתרות נפרדות, כל אחת עם הריבית שלה. על ההשקעה נטו: <Ltr>{`${n(L.BRANCH_NI)} × 6% = ${n(L.BRANCH_NI_INT)}`}</Ltr>, הכנסות מימון. על ההתחייבות: <Ltr>{`${n(L.BRANCH_L)} × 6% = ${n(L.BRANCH_L_INT)}`}</Ltr>, הוצאות מימון.
        </P>
        <Tbl
          dense
          head={["שנה 4", "השקעה נטו", "התחייבות"]}
          rows={[
            ["1.1", L.BRANCH_NI, -L.BRANCH_L],
            ["ריבית", L.BRANCH_NI_INT, -L.BRANCH_L_INT],
            ["תקבול או תשלום", -L.BRANCH.subPayment, L.BRANCH.payment],
          ]}
          foot={["31.12", L.BRANCH_NI_CLOSE, -L.BRANCH_L_CLOSE]}
        />
        <Tbl
          dense
          head={["רווח או הפסד, שנה 4", "סכום"]}
          rows={[
            ["הפסד מחכירת משנה", L.BRANCH_LOSS],
            ["הכנסות מימון", -L.BRANCH_NI_INT],
            ["הוצאות מימון", L.BRANCH_L_INT],
          ]}
          foot={["סך הכול", L.BRANCH_LOSS - L.BRANCH_NI_INT + L.BRANCH_L_INT]}
        />
        <Part title="ואם שווי זכות השימוש נתון?">
          <P>אם השאלה נותנת את השווי ההוגן של זכות השימוש, ההשקעה נטו היא השווי הזה, והריבית נגזרת ממנו. ההגדרה של ריבית גלומה מדברת על השווי ההוגן של נכס הבסיס, ובחכירת משנה מתאימים אותה לזכות השימוש: הריבית שבה התשלומים שווים היום לשווי הזכות. באקסל זה RATE, כמו בחצר הלוגיסטית.</P>
        </Part>
        <Remember>שתי ריביות שונות: הכנסות מימון על ההשקעה נטו, והוצאות מימון על ההתחייבות. ונכס זכות שימוש יש רק למי שהוא גם חוכר: במימונית החברה שבאמצע גורעת אותו, ובתפעולית הוא נשאר אצלה.</Remember>
      </>
    ),
    check: quiz("ls-spc-subfin", [
      {
        q: "השקעה נטו 200,000, נכס זכות שימוש 170,000, והתחייבות 190,000. כמה רווח הון ביום חכירת המשנה?",
        options: ["30,000 ש״ח", "10,000 ש״ח", "20,000 ש״ח", "אפס"],
        answer: 0,
        why: "200,000 − 170,000 = 30,000. ההתחייבות נשארת, ולכן היא לא בחישוב.",
      },
    ]),
  },
  "ls-spc-subop": {
    lead: "כשהחוכר העביר הלאה רק חלק מהזכות שלו, הנכס נשאר אצלו. הוא ממשיך להפחית אותו, ורושם הכנסה קבועה בכל שנה.",
    body: (
      <>
        <Story icon={<GraduationCap />} title="מרכז הדרכה שעומד ריק לשנתיים">
          <p>
            חברה חכרה מרכז הדרכה ל-{L.CENTRE.years} שנים, <M v={L.CENTRE.payment} /> בסוף כל שנה, בריבית {pct(L.CENTRE.rate)}. אחרי {L.CENTRE.done} שנים הקורסים עברו למקוון, והחברה צופה שהמרכז יעמוד ריק לשנתיים.
          </p>
          <p>
            ב-1.1 של שנה 4 היא מחכירה אותו למכללה ל-{L.CENTRE.subYears} שנים. השכירות מדורגת: <M v={L.CENTRE.subRents[0]} /> בסוף השנה הראשונה, ו-<M v={L.CENTRE.subRents[1]} /> בסוף השנייה. הריבית הגלומה {pct(L.CENTRE.subRate)}. זכות השימוש שלה שווה באותו יום <M v={L.CENTRE.rightFV} />.
          </p>
        </Story>
        <Timeline
          label={`${L.CENTRE.years} שנות החכירה הראשית. ${L.CENTRE.done} שנים של שימוש, ${L.CENTRE.subYears} שנים של חכירת משנה, ועוד ${L.CENTRE.left - L.CENTRE.subYears} שנים שנשארות לחברה`}
          title={`חכירת המשנה לוקחת ${L.CENTRE.subYears} מתוך ${L.CENTRE.left} השנים שנשארו`}
          from={0}
          to={L.CENTRE.years}
          ticks={[
            { at: 0, label: "שנה 1" },
            { at: L.CENTRE.done, label: "1.1 של שנה 4" },
            { at: L.CENTRE.done + L.CENTRE.subYears, label: "סוף שנה 5" },
            { at: L.CENTRE.years, label: "סוף שנה 10" },
          ]}
          spans={[
            { from: 0, to: L.CENTRE.done, label: "בשימוש", tone: 0 },
            { from: L.CENTRE.done, to: L.CENTRE.done + L.CENTRE.subYears, label: "משנה", tone: 3 },
            { from: L.CENTRE.done + L.CENTRE.subYears, to: L.CENTRE.years, label: "נשאר לחברה", tone: 1 },
          ]}
        />
        <P>
          קודם מסווגים, מול זכות השימוש. התשלומים לא שווים, ולכן מהוונים כל אחד לחוד: <Ltr>{`80,000 ÷ 1.07 + 120,000 ÷ 1.07^2 = ${n(L.CENTRE_SUB_PV)}`}</Ltr>. באקסל: <Ltr>{`=NPV(7%;80000;120000) → ${n(L.CENTRE_SUB_PV)}`}</Ltr>.
        </P>
        <Tbl
          dense
          head={["סימן", "מה יצא", "מסקנה"]}
          rows={[
            ["התקופה מתוך מה שנשאר", `${L.CENTRE.subYears} מתוך ${L.CENTRE.left}: ${pct(L.CENTRE.subYears / L.CENTRE.left)}`, "לא העיקרי"],
            ["ערך נוכחי מתוך השווי", pct(L.CENTRE_SUB_PV / L.CENTRE.rightFV), "לא כל השווי"],
          ]}
        />
        <P>
          לכן תפעולית. לחברה נשארו עוד {L.CENTRE.left - L.CENTRE.subYears} שנים של שימוש אחרי חכירת המשנה, אז הזכות עדיין שלה, והנכס נשאר בספרים. בזמן שהמרכז מושכר לאחרים הוא נדל״ן להשקעה, נכס שמחזיקים כדי להרוויח ממנו שכירות. החברה מודדת נדל״ן להשקעה בעלות, ובמודל העלות המעבר לא משנה סכומים (IAS 40 סעיף 59). במאזן הוא מוצג כנדל״ן להשקעה (IFRS 16 סעיף 48).
        </P>
        <P>
          הפחת ממשיך עד סוף החכירה הראשית, כי עד אז נמשכת הזכות של החברה. אילו פרסנו אותו על שנתיים חכירת המשנה, הנכס היה מתאפס והיו נשארות לה {L.CENTRE.left - L.CENTRE.subYears} שנים של זכות בלי שום יתרה. הנכס ב-1.1 של שנה 4: <Ltr>{`${n(L.CENTRE_L0)} − ${n(L.CENTRE_DEP)} × 3 = ${n(L.CENTRE_ROU)}`}</Ltr>, והפחת: <Ltr>{`${n(L.CENTRE_ROU)} ÷ ${L.CENTRE.left} = ${n(L.CENTRE_DEP)}`}</Ltr>, אותו פחת כמו קודם, כי גם היתרה וגם התקופה נמשכות כרגיל.
        </P>
        <P>
          ההכנסה בקו ישר, גם כשהשכירות מדורגת. המכללה משתמשת במרכז אותו דבר בשתי השנים, ולכן כל שנה מקבלת אותה הכנסה: <Ltr>{`(80,000 + 120,000) ÷ 2 = ${n(L.CENTRE_INCOME)}`}</Ltr>. בשנה הראשונה נכנסו רק {n(L.CENTRE.subRents[0])}, ולכן נרשמות הכנסות לקבל של {n(L.CENTRE_ACCRUED)}, והן נסגרות בשנה הבאה.
        </P>
        <P>
          ההתחייבות נשארת כמו בכל חכירה. היתרה ב-1.1: <Ltr>{`=PV(5%;7;-150000) → ${n(L.CENTRE_L)}`}</Ltr>, והריבית: <Ltr>{`${n(L.CENTRE_L)} × 5% = ${n(L.CENTRE_INT)}`}</Ltr>.
        </P>
        <Tbl
          dense
          head={["התחייבות, שנה 4", "סכום"]}
          rows={[
            ["1.1", -L.CENTRE_L],
            ["ריבית", -L.CENTRE_INT],
            ["תשלום", L.CENTRE.payment],
          ]}
          foot={["31.12", -L.CENTRE_CLOSE]}
        />
        <Tbl
          dense
          head={["רווח או הפסד, שנה 4", "סכום"]}
          rows={[
            ["הכנסות מהשכרה", -L.CENTRE_INCOME],
            ["פחת", L.CENTRE_DEP],
            ["הוצאות מימון", L.CENTRE_INT],
          ]}
          foot={["סך הכול", L.CENTRE_DEP + L.CENTRE_INT - L.CENTRE_INCOME]}
        />
        <Tbl
          dense
          head={["מאזן, 31.12 של שנה 4", "סכום"]}
          rows={[
            ["נדל״ן להשקעה: זכות השימוש", L.CENTRE_ROU1],
            ["הכנסות לקבל", L.CENTRE_ACCRUED],
            ["התחייבות, שוטפת", -(L.CENTRE_CLOSE - L.CENTRE_NC)],
            ["התחייבות, לא שוטפת", -L.CENTRE_NC],
          ]}
        />
        <Remember>בתפעולית שום דבר לא יוצא מהספרים. נוספת רק הכנסה בקו ישר. הפחת הוא היתרה חלקי השנים שנשארו בחכירה הראשית, והחלק הלא שוטף הוא היתרה שתהיה בסוף השנה הבאה.</Remember>
      </>
    ),
    check: quiz("ls-spc-subop", [
      {
        q: "חכירת משנה תפעולית. מה קורה לנכס זכות השימוש?",
        options: ["נשאר בספרים, וממשיך להיות מופחת", "יוצא מהספרים", "נמדד מחדש לשווי הוגן תמיד", "עובר לחוכר המשנה"],
        answer: 0,
        why: "במודל העלות אין שינוי בסכום. רק במודל השווי ההוגן יש שערוך, וזה המסך הבא.",
      },
    ]),
  },
  "ls-spc-ip": {
    lead: "אם החברה מודדת נדל״ן להשקעה בשווי הוגן, יום סיום השימוש משנה את התמונה. מעדכנים את הנכס לשווי, ומאותו יום אין יותר פחת.",
    body: (
      <>
        <P>
          ככה זה עובד. עד סיום השימוש הנכס הוא נכס זכות שימוש רגיל, עם פחת. ביום סיום השימוש הוא עובר לנדל״ן להשקעה, ומעלים אותו לשווי ההוגן. העלייה הזו לא נכנסת לרווח של השנה, אלא אם היא מבטלת ירידת ערך קודמת. היא נרשמת ב<strong>רווח כולל אחר</strong>, ונאספת בהון בקרן שנקראת <strong>קרן הערכה מחדש</strong>. מאותו יום כל שינוי בשווי כבר הולך לרווח או הפסד.
        </P>
        <P>למה יש כאן שני יעדים? ביום המעבר החברה רק משנה את השימוש בנכס, והתקן מטפל בעלייה כמו בהערכה מחדש לפי IAS 16 (IAS 40 סעיף 62). מיום המעבר הנכס כבר מוחזק לשכירות ולעליית ערך, ולכן עליות וירידות הן התוצאה השוטפת שלו.</P>
        <Story icon={<Car />} title="חניון שעובר לציבור">
          <p>
            ב-1.1 של שנה 1 חברה חכרה חניון לעובדים ל-{L.PARK.years} שנים, <M v={L.PARK.payment} /> בסוף כל שנה, בריבית {pct(L.PARK.rate)}. הנכס התחיל ב-<Ltr>{`=PV(6%;12;-90000) → ${n(L.PARK_L0)}`}</Ltr>, עם פחת של {n(L.PARK_DEP)} בשנה.
          </p>
          <p>
            בשנה 6, ב-1.2, הדירקטוריון החליט שהעובדים יעברו לחניון אחר, והחניון יוחכר למפעיל. ב-1.10 המכוניות האחרונות יצאו ונחתמה חכירת משנה תפעולית. זכות השימוש שווה ב-1.10 <M v={L.PARK.fairValue} />, וב-31.12 <M v={L.PARK.endFV} />. נדל״ן להשקעה נמדד בשווי הוגן.
          </p>
        </Story>
        <Timeline
          label="שנה 6. עד 1.10 נכס זכות שימוש עם פחת, וההחלטה ב-1.2 לא משנה דבר. מ-1.10 נדל״ן להשקעה בשווי הוגן, בלי פחת"
          title="שנה 6"
          from={0}
          to={12}
          ticks={[
            { at: 0, label: "1.1" },
            { at: 1, label: "1.2: ההחלטה" },
            { at: 9, label: "1.10: המעבר" },
            { at: 12, label: "31.12" },
          ]}
          spans={[
            { from: 0, to: 9, label: "עם פחת", tone: 1 },
            { from: 9, to: 12, label: "בשווי הוגן", tone: 3 },
          ]}
        />
        <FullSteps
          label="הפתרון"
          steps={[
            { title: "מועד המעבר", body: <p>הקובע הוא מתי השימוש נגמר בפועל. ב-1.2 הייתה רק כוונה, והעובדים עדיין חנו שם. אילו עברנו ביום ההחלטה, היינו מפסיקים פחת על נכס שעוד בשימוש. לכן המעבר ב-1.10 (IAS 40 סעיפים 57, 61), ועד אז ממשיכים להפחית.</p> },
            {
              title: "ביום המעבר",
              body: (
                <>
                  <p>
                    קודם מביאים את הנכס לערך שלו ב-1.10. אחרי 5 שנים הוא <Ltr>{`${n(L.PARK_L0)} − ${n(L.PARK_DEP)} × 5 = ${n(L.PARK_ROU)}`}</Ltr>. מ-1.1 עד 1.10 עוד 9 חודשי פחת: <Ltr>{`${n(L.PARK_DEP)} × 9 ÷ 12 = ${n(L.PARK_NINE)}`}</Ltr>. רק אחר כך מעלים אותו לשווי ההוגן, וההפרש הוא הקרן.
                  </p>
                  <Tbl
                    dense
                    head={["נכס זכות שימוש", "סכום"]}
                    rows={[
                      ["31.12 של שנה 5", L.PARK_ROU],
                      ["פחת, 9 חודשים", -L.PARK_NINE],
                      ["הערכה מחדש: רווח כולל אחר", L.PARK_OCI],
                    ]}
                    foot={["שווי הוגן, 1.10", L.PARK.fairValue]}
                  />
                  <JournalEntry
                    title="1.10 של שנה 6"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.PARK.fairValue },
                      { account: "נכס זכות שימוש", cr: L.PARK_AT },
                      { account: "קרן הערכה מחדש", cr: L.PARK_OCI },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "אחרי המעבר",
              body: (
                <>
                  <p>
                    השווי עלה עד סוף השנה: <Ltr>{`${n(L.PARK.endFV)} − ${n(L.PARK.fairValue)} = ${n(L.PARK_GAIN)}`}</Ltr>. הפעם זה כבר אחרי המעבר, ולכן הולך לרווח או הפסד, והקרן לא נוגעת. אין יותר פחת, וההתחייבות ממשיכה כרגיל.
                  </p>
                  <JournalEntry
                    title="31.12 של שנה 6"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.PARK_GAIN },
                      { account: "רווח משערוך נדל״ן", cr: L.PARK_GAIN },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "שנה 6 בדוחות",
              body: (
                <Tbl
                  dense
                  head={["בלי ההתחייבות", "סכום"]}
                  rows={[
                    ["רווח או הפסד: פחת, 9 חודשים", L.PARK_NINE],
                    ["רווח או הפסד: עליית שווי", -L.PARK_GAIN],
                    ["רווח כולל אחר: הערכה מחדש", -L.PARK_OCI],
                    ["מאזן: נדל״ן להשקעה", L.PARK.endFV],
                    ["מאזן: קרן הערכה מחדש", -L.PARK_OCI],
                  ]}
                />
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לחבר את שתי העליות ולרשום {n(L.PARK_OCI + L.PARK_GAIN)} במקום אחד. הן מוצגות בנפרד: {n(L.PARK_OCI)} ברווח כולל אחר, ו-{n(L.PARK_GAIN)} ברווח או הפסד.</p> },
          ]}
        />
        <Part title="אם העלייה מבטלת ירידת ערך קודמת">
          <P>
            נניח שבעבר הוכרה על החניון ירידת ערך של <M v={L.PARK.impairment} />, ברווח או הפסד. אז החלק של העלייה שמבטל אותה חוזר לאותו מקום, רווח או הפסד, עד הסכום שהיה בספרים אלמלא ירידת הערך, אחרי פחת. רק השאר הולך לרווח כולל אחר (IAS 40 סעיף 62(ב)). לשם הפשטות נניח שכל הסכום עדיין מתבטל, ושהעלייה לא השתנתה. בעלייה של {n(L.PARK_OCI)}: <Ltr>{`${n(L.PARK_OCI)} − ${n(L.PARK.impairment)} = ${n(L.PARK_OCI - L.PARK.impairment)}`}</Ltr> ברווח כולל אחר, ו-{n(L.PARK.impairment)} ברווח או הפסד.
          </P>
          <P>כך נראית התמונה המלאה. ירידה ביום המעבר הולכת לרווח או הפסד, אלא אם יש קרן קודמת לאותו נדל״ן (IAS 40 סעיף 62(א)).</P>
          <Tbl
            dense
            head={["מה קורה לשווי", "ביום המעבר", "אחרי המעבר"]}
            rows={[
              ["עלייה", "רווח כולל אחר, אלא אם היא מבטלת ירידת ערך קודמת", "רווח או הפסד"],
              ["ירידה", "רווח או הפסד", "רווח או הפסד"],
            ]}
          />
        </Part>
        <Part title="אם רק חלק מהנכס עובר">
          <P>אפשר להפריד חלק מהנכס רק אם אפשר למכור אותו בנפרד, או להחכיר אותו בנפרד בחכירה מימונית. אם אי אפשר, הנכס כולו הוא נדל״ן להשקעה רק כשהחלק שבשימוש החברה זניח (IAS 40 סעיף 10). כשאפשר, מעבירים רק את חלקו בנכס זכות השימוש, למשל שליש בבניין של שלוש קומות זהות, ומפחיתים אותו עד יום המעבר. שאר הקומות נשארות בשימוש, עם פחת רגיל. ההתחייבות נשארת אחת, כי החוזה עם המחכיר אחד.</P>
        </Part>
        <Remember>הקרן קפואה. היא לא יורדת כשהשווי יורד. כשהנכס נגרע אפשר להעביר אותה לעודפים, בלי לעבור דרך רווח או הפסד (IAS 40 סעיף 62(ב)(ii)).</Remember>
      </>
    ),
    check: quiz("ls-spc-ip", [
      {
        q: "ביום המעבר הערך בספרים 500,000 והשווי ההוגן 460,000. אין קרן קודמת. איפה נרשם ההפרש?",
        options: ["הפסד של 40,000 ברווח או הפסד", "ברווח כולל אחר", "לא נרשם", "נפרס על החכירה"],
        answer: 0,
        why: "IAS 40 סעיף 62(א): ירידה הולכת לרווח או הפסד, אלא אם יש קרן קודמת לאותו נדל״ן.",
      },
    ]),
  },
  "ls-spc-rates": {
    lead: "הריבית והתקופות חייבות להיות באותה יחידת זמן. תשלום חודשי הולך עם ריבית חודשית, ותשלום חצי שנתי עם ריבית של חצי שנה.",
    body: (
      <>
        <Part title="תשלום חודשי">
          <P>
            חנות חכרה חלל ל-{L.MON.months} חודשים, <M v={L.MON.payment} /> בסוף כל חודש, בריבית חודשית של {pct(L.MON.rate, 1)}. מכניסים לאקסל חודשים וריבית חודשית, כי הכסף זז פעם בחודש: <Ltr>{`=PV(0.8%;96;-20000) → ${n(L.MON_L)}`}</Ltr>.
          </P>
          <P>כדי למצוא את הוצאות המימון של שנה שלמה לא חייבים לעבור חודש חודש. אם יודעים את היתרה בתחילת השנה ובסופה, ומה שולם בדרך, הריבית היא מה שמשלים את המעגל:</P>
          <Formula>הוצאות מימון = יתרת סגירה + תשלומים − יתרת פתיחה</Formula>
          <Tbl
            dense
            head={["התחייבות, שנה 3", "סכום"]}
            rows={[
              [<>1.1, נשארו 72 תשלומים: <Ltr>=PV(0.8%;72;-20000)</Ltr></>, -L.MON_OPEN],
              ["ריבית, מה שמשלים", -L.MON_INT],
              ["12 תשלומים", L.MON_PAID],
            ]}
            foot={[<>31.12, נשארו 60 תשלומים: <Ltr key="c">=PV(0.8%;60;-20000)</Ltr></>, -L.MON_CLOSE]}
          />
          <P>
            <Ltr>{`${n(L.MON_CLOSE)} + ${n(L.MON_PAID)} − ${n(L.MON_OPEN)} = ${n(L.MON_INT)}`}</Ltr>
          </P>
        </Part>
        <Part title="תשלום חצי שנתי, מתוך ריבית שנתית אפקטיבית">
          <P>
            <strong>ריבית שנתית אפקטיבית</strong> אומרת בכמה הכסף גדל בשנה שלמה, כולל ריבית על הריבית. נניח {L.HALF.periods} תשלומים של <M v={L.HALF.payment} />, אחד כל חצי שנה, בריבית שנתית אפקטיבית של {pct(L.HALF.annual)}.
          </P>
          <P>אנחנו מחפשים ריבית לחצי שנה, ששתי פעמים ברצף נותנת בדיוק 7%. בדקו מה קורה ל-100 ש״ח:</P>
          <Tbl
            dense
            head={["100 ש״ח", "ב-3.44%", "ב-3.5%"]}
            rows={[
              ["אחרי חצי שנה", <Ltr key="a">103.44</Ltr>, <Ltr key="b">103.50</Ltr>],
              ["אחרי שנה", <Ltr key="c">107.00</Ltr>, <Ltr key="d">107.12</Ltr>],
            ]}
          />
          <P>
            <Ltr>{`(1 + 7%)^(1/2) − 1 = ${pct(L.HALF_RATE, 2)}`}</Ltr>
          </P>
          <P>
            ובאקסל: <Ltr>{`=PV((1+7%)^(1/2)-1;6;-300000) → ${n(L.HALF_PV)}`}</Ltr>
          </P>
          <WrongRight
            label="טעות: מחלקים ריבית שנתית אפקטיבית ב-2. נכון: ריבית דריבית"
            wrong={<p>״7% ÷ 2 = 3.5%, ולכן {n(L.HALF_WRONG)}.״</p>}
            right={<p>שני חצאי שנה ב-3.5% נותנים יותר מ-7%. הריבית השקולה היא {pct(L.HALF_RATE, 2)}.</p>}
          />
        </Part>
        <Part title="ריבית חודשית מתוך שווי הוגן">
          <P>
            בחכירה מימונית עם שווי הוגן נתון, הריבית נגזרת באותה דרך, ביחידת הזמן של התשלום. חכירה ל-{L.FVM.months} חודשים, <M v={L.FVM.payment} /> בסוף כל חודש, שווי הוגן <M v={L.FVM.fairValue} />: <Ltr>{`=RATE(60;30000;-1500000) → ${pct(L.FVM_RATE, 2)}`}</Ltr> לחודש.
          </P>
        </Part>
      </>
    ),
    check: quiz("ls-spc-rates", [
      {
        q: "יתרה ב-1.1: 100,000. יתרה ב-31.12: 90,000. שולמו בשנה 18,000. מהן הוצאות המימון?",
        options: ["8,000 ש״ח", "10,000 ש״ח", "18,000 ש״ח", "28,000 ש״ח"],
        answer: 0,
        why: "90,000 + 18,000 − 100,000 = 8,000.",
      },
    ]),
  },
  "ls-spc-slb": {
    lead: "במכירה וחכירה בחזרה חברה מוכרת נכס ומיד חוכרת אותו מהקונה. היא מקבלת כסף, וממשיכה להשתמש בנכס כאילו כלום לא קרה. לכן השאלה הראשונה היא אם בכלל היה כאן מכירה.",
    body: (
      <>
        <P>חברה שצריכה מזומן יכולה ללוות מהבנק, או ״למכור״ בניין ולהמשיך לשבת בו. מבחינת הזרמים זה נראה דומה: כסף עכשיו, תשלומים אחר כך. ההבדל הוא אם הנכס באמת עבר. אם לא בודקים, חברה יכולה לרשום רווח גדול על הלוואה. לכן לפני כל חישוב יש שתי שאלות.</P>
        <P>הראשונה: האם הנכס באמת היה של החברה? אם היא רק העבירה הלאה נכס שמעולם לא שלטה בו, כמו מכונה שקנתה מיצרן ומיד העבירה למחכיר, אין כאן מכירה שלה. זו חכירה רגילה (סעיפים ב46, ב47).</P>
        <P>השנייה: האם הקונה באמת קיבל שליטה, כלומר הוא זה שמחליט על הנכס ומרוויח ממנו (סעיף 99)? בודקים את זה לפי הסימנים של IFRS 15.</P>
        <Part title="איך יודעים שהשליטה עברה (IFRS 15 סעיף 38)">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>למוכר יש זכות לתשלום בהווה.</li>
            <li>הקונה קיבל בעלות משפטית.</li>
            <li>הקונה קיבל חזקה פיזית.</li>
            <li>הקונה נושא בסיכונים ובהטבות המשמעותיים.</li>
            <li>הקונה אישר את קבלת הנכס.</li>
          </ul>
          <P>העובדה שהמוכר ממשיך להשתמש בנכס לא מלמדת כלום. זו פשוט התוצאה של החכירה בחזרה.</P>
        </Part>
        <Deeper title="כשלמוכר יש זכות לקנות את הנכס בחזרה">
          <P>הסימנים האלה הם דוגמאות, ולא רשימה סגורה. אם למוכר יש זכות או חובה לקנות את הנכס בחזרה, הקונה לא משיג שליטה, גם כשהסימנים האחרים מתקיימים. בעסקה כזו הנכס נשאר בספרים, והכסף הוא התחייבות פיננסית (IFRS 15 סעיף ב66).</P>
        </Deeper>
        <DecisionWalk nodes={L.SLB_WALK} start={L.SLB_WALK_START} label="מכירה וחכירה בחזרה" again="בודקים עסקה אחרת" />
        <Part title="כשאין מכירה: מחסן קירור">
          <Story icon={<Snowflake />} title="״מכירה״ שנשארה על הנייר">
            <p>
              רשת מזון העבירה מחסן קירור לחברת מימון, וקיבלה <M v={L.COLD.received} />. המחסן רשום בספרים ב-<M v={L.COLD.bookValue} />. לפי החוזה הרישום בטאבו לא משתנה, וכל ירידה בשווי המחסן על חשבון הרשת. במקביל היא ״חוכרת״ אותו בחזרה ל-{L.COLD.years} שנים, <M v={L.COLD.payment} /> בסוף כל שנה.
            </p>
          </Story>
          <P>
            עוברים על הסימנים. בעלות משפטית לא עברה, והסיכונים נשארו אצל הרשת. חברת המימון לא שולטת במחסן, ולכן זו לא מכירה. בפועל הרשת לקחה הלוואה, בביטחון המחסן, ומחזירה אותה בתשלומים.
          </P>
          <P>
            אילו היינו רושמים מכירה, היה נכנס רווח של <Ltr>{`${n(L.COLD.received)} − ${n(L.COLD.bookValue)} = ${n(L.COLD_GAP)}`}</Ltr> על עסקה שלא מכרה כלום. לכן המחסן נשאר בספרים, עם הפחת הרגיל שלו, ואין רווח. הכסף הוא התחייבות פיננסית (סעיף 103).
          </P>
          <Tbl
            dense
            head={["", "הרשת, המוכרת-חוכרת", "חברת המימון"]}
            rows={[
              ["הנכס", "נשאר בספרים", "לא נרשם"],
              ["הכסף", "ז׳ התחייבות פיננסית", "ח׳ הלוואה לקבל"],
              ["רווח", "אין", "אין"],
            ]}
          />
          <P>
            ממשיכים לפי IFRS 9, בריבית האפקטיבית, הריבית שמשווה בין הכסף שהתקבל לתשלומים: <Ltr>{`=RATE(10;200000;-1400000) → ${pct(L.COLD_RATE, 2)}`}</Ltr>. הריבית של השנה: <Ltr>{`${n(L.COLD.received)} × ${pct(L.COLD_RATE, 4)} = ${n(L.COLD_INT)}`}</Ltr>. חברת המימון רושמת את אותם מספרים כהלוואה לקבל והכנסות מימון.
          </P>
          <Tbl
            dense
            head={["שנה 1", "הרשת: התחייבות", "חברת המימון: הלוואה"]}
            rows={[
              ["1.1", -L.COLD.received, L.COLD.received],
              ["ריבית", -L.COLD_INT, L.COLD_INT],
              ["תשלום", L.COLD.payment, -L.COLD.payment],
            ]}
            foot={["31.12", -L.COLD_CLOSE, L.COLD_CLOSE]}
          />
        </Part>
      </>
    ),
    check: quiz("ls-spc-slb", [
      {
        q: "העברה שאינה מכירה. המוכר קיבל 300,000. מה הוא רושם?",
        options: ["ח׳ מזומן, ז׳ התחייבות פיננסית", "ח׳ מזומן, ז׳ הנכס, ז׳ רווח", "ח׳ מזומן, ז׳ הכנסות מראש", "ח׳ נכס זכות שימוש, ז׳ מזומן"],
        answer: 0,
        why: "אין מכירה, ולכן הכסף הוא הלוואה (סעיף 103(א)).",
      },
    ]),
  },
  "ls-spc-fair": {
    lead: "החברה מכרה נכס, אבל דרך החכירה חלק ממנו נשאר אצלה. לכן היא רושמת רווח רק על החלק שבאמת עזב.",
    body: (
      <>
        <Story icon={<Wheat />} title="מאפייה שעוברת עוד חמש שנים">
          <p>
            מאפייה מתכננת לעבור למבנה חדש בעוד {L.BAKERY.years} שנים. היא מוכרת את המבנה הנוכחי לקרן, וחוכרת אותו בחזרה רק לזמן שהיא צריכה: {L.BAKERY.years} שנים, <M v={L.BAKERY.payment} /> בסוף כל שנה, בריבית גלומה ידועה של {pct(L.BAKERY.rate)}. חיי המבנה {L.BAKERY.life} שנה.
          </p>
          <p>
            בספרים המבנה רשום ב-<M v={L.BAKERY.bookValue} />. הקרן משלמת <M v={L.BAKERY.fairValue} />, בדיוק השווי ההוגן, ודמי החכירה בגובה השוק. הבעלות והסיכונים עברו לקרן, ולכן זו מכירה.
          </p>
        </Story>
        <P>המחיר ודמי החכירה שניהם בגובה השוק, ולכן אין מה לתקן (סעיף 101). שני המסכים הבאים יראו מה קורה כשהם לא.</P>
        <P>
          למה לא לרשום את כל {n(L.BAKERY_GAP)}? כי המאפייה לא נפרדה מכל המבנה. ב-{L.BAKERY.years} השנים הקרובות היא ממשיכה להשתמש בו, בדיוק כמו קודם. על החלק הזה לא קרה שום דבר, אז אין עליו רווח. רווח אמיתי יש רק על מה שעבר לקרן: כל מה שיקרה במבנה אחרי {L.BAKERY.years} השנים (סעיף 100(א)).
        </P>
        <P>כמה מהמבנה נשאר אצלה? מודדים את זה בכסף: הזכות שנשארה לה שווה כמו ההתחייבות שלקחה על עצמה, מתוך כל השווי.</P>
        <ShareBar
          label={`מהמבנה נשארו אצל המאפייה ${pct(L.BAKERY_SHARE, 2)}, ועברו לקרן ${pct(1 - L.BAKERY_SHARE, 2)}`}
          title="מה נשאר ומה עזב"
          parts={[
            { share: L.BAKERY_SHARE, name: "נשאר אצל המאפייה, דרך החכירה", detail: "על החלק הזה אין רווח", c: 1 },
            { share: 1 - L.BAKERY_SHARE, name: "עבר לקרן", detail: "רק על החלק הזה יש רווח", c: 3 },
          ]}
        />
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "ההתחייבות",
              body: (
                <p>
                  כמו בכל חכירה, הערך הנוכחי של התשלומים: <Ltr>{`=PV(6%;5;-90000) → ${n(L.BAKERY_L)}`}</Ltr>
                </p>
              ),
            },
            {
              title: "כמה נשאר בידי החברה",
              body: (
                <>
                  <Formula>החלק שנשאר = התחייבות החכירה ÷ שווי הוגן</Formula>
                  <p>
                    <Ltr>{`${n(L.BAKERY_L)} ÷ ${n(L.BAKERY.fairValue)} = ${pct(L.BAKERY_SHARE, 2)}`}</Ltr>
                  </p>
                </>
              ),
            },
            {
              title: "נכס זכות השימוש",
              body: (
                <>
                  <p>הנכס הוא אותו חלק מהערך בספרים, כי החברה פשוט השאירה אצלה חלק מהמבנה הישן, בערך הישן שלו (סעיף 100(א)). בחכירה רגילה הנכס נבנה מההתחייבות, וכאן לא.</p>
                  <Formula>נכס זכות שימוש = ערך בספרים × החלק שנשאר</Formula>
                  <p>
                    <Ltr>{`${n(L.BAKERY.bookValue)} × ${n(L.BAKERY_L)} ÷ ${n(L.BAKERY.fairValue)} = ${n(L.BAKERY_ROU)}`}</Ltr>
                  </p>
                </>
              ),
            },
            {
              title: "הרווח",
              body: (
                <>
                  <p>מחלקים את המבנה לשני החלקים. כל הפרש שייך לחלק שלו, ורק ההפרש של החלק שעבר הוא רווח.</p>
                  <Tbl
                    dense
                    head={["", "נשאר", "עבר לקונה", "הכול"]}
                    rows={[
                      ["חלק מהמבנה", pct(L.BAKERY_SHARE, 2), pct(1 - L.BAKERY_SHARE, 2), "100%"],
                      ["שווי הוגן", L.BAKERY_L, BAKERY_SOLD_FV, L.BAKERY.fairValue],
                      ["ערך בספרים", L.BAKERY_ROU, BAKERY_SOLD_BV, L.BAKERY.bookValue],
                    ]}
                    foot={["הפרש", L.BAKERY_L - L.BAKERY_ROU, L.BAKERY_GAIN, L.BAKERY_GAP]}
                  />
                  <Formula>רווח = (שווי הוגן − ערך בספרים) × החלק שעבר לקונה</Formula>
                  <p>
                    <Ltr>{`${n(L.BAKERY_GAP)} × ${n(BAKERY_SOLD_FV)} ÷ ${n(L.BAKERY.fairValue)} = ${n(L.BAKERY_GAIN)}`}</Ltr>
                  </p>
                  <JournalEntry
                    title="1.1, בספרי המוכר"
                    lines={[
                      { account: "מזומן", dr: L.BAKERY.fairValue },
                      { account: "נכס זכות שימוש", dr: L.BAKERY_ROU },
                      { account: "מבנה", cr: L.BAKERY.bookValue },
                      { account: "התחייבות חכירה", cr: L.BAKERY_L },
                      { account: "רווח הון", cr: L.BAKERY_GAIN },
                    ]}
                  />
                  <p>
                    ההפרש של {n(L.BAKERY_L - L.BAKERY_ROU)} על החלק שנשאר לא נעלם. הנכס נרשם ב-{n(L.BAKERY_ROU)} בעוד שההתחייבות {n(L.BAKERY_L)}, ולכן הפחת נמוך יותר, והיתרון הזה נכנס לרווח לאט, לאורך {L.BAKERY.years} שנות השימוש.
                  </p>
                </>
              ),
            },
            {
              title: "בספרי הקונה",
              body: (
                <>
                  <p>הקונה עושה מה שעושה כל מי שקנה נכס: רושם אותו לפי התקן שמתאים לו, וכאן זה נדל״ן להשקעה. את החכירה הוא מסווג כרגיל (סעיף 100(ב)).</p>
                  <JournalEntry
                    title="1.1, בספרי הקונה"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.BAKERY.fairValue },
                      { account: "מזומן", cr: L.BAKERY.fairValue },
                    ]}
                  />
                  <p>
                    {L.BAKERY.years} מתוך {L.BAKERY.life} שנים, והערך הנוכחי {pct(L.BAKERY_SHARE)} מהשווי. לכן תפעולית, עם הכנסה של {n(L.BAKERY.payment)} בשנה.
                  </p>
                </>
              ),
            },
            {
              title: "שנה 1, אצל המוכר",
              body: (
                <>
                  <p>
                    מכאן זו חכירה רגילה. פחת: <Ltr>{`${n(L.BAKERY_ROU)} ÷ ${L.BAKERY.years} = ${n(L.BAKERY_DEP)}`}</Ltr>. ריבית: <Ltr>{`${n(L.BAKERY_L)} × 6% = ${n(L.BAKERY_INT)}`}</Ltr>.
                  </p>
                  <Tbl
                    dense
                    head={["שנה 1", "התחייבות", "נכס"]}
                    rows={[
                      ["1.1", -L.BAKERY_L, L.BAKERY_ROU],
                      ["ריבית", -L.BAKERY_INT, ""],
                      ["תשלום", L.BAKERY.payment, ""],
                      ["פחת", "", -L.BAKERY_DEP],
                    ]}
                    foot={["31.12", -L.BAKERY_CLOSE, L.BAKERY_ROU - L.BAKERY_DEP]}
                  />
                </>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לרשום רווח של {n(L.BAKERY_GAP)}, כאילו הכול נמכר. זה היה נכון בלי החכירה בחזרה.</p> },
          ]}
        />
        <Part title="ככל שחוכרים יותר, הרווח קטן">
          <P>
            נניח שהמאפייה לא מתכננת לעבור, וחוכרת בחזרה ל-{L.BAKERY.longYears} שנים, <M v={L.BAKERY.longPayment} /> בשנה. זה נראה יותר כמו הלוואה עם ביטחון מאשר כמו מכירה, והתקן מוריד את הרווח בהתאם:
          </P>
          <Tbl
            dense
            head={["אותו מחיר ואותו ערך בספרים", `${L.BAKERY.years} שנים`, `${L.BAKERY.longYears} שנים`]}
            rows={[
              ["התחייבות חכירה", L.BAKERY_L, L.BAKERY_LONG_L],
              ["החלק שנשאר", pct(L.BAKERY_SHARE, 2), pct(L.BAKERY_LONG_SHARE, 2)],
              ["נכס זכות שימוש", L.BAKERY_ROU, L.BAKERY_LONG_ROU],
              ["רווח", L.BAKERY_GAIN, L.BAKERY_LONG_GAIN],
            ]}
          />
          <P>
            בחכירה הארוכה גם הקונה רואה תמונה אחרת: {L.BAKERY.longYears} מתוך {L.BAKERY.life} שנים, והערך הנוכחי {pct(L.BAKERY_LONG_SHARE)} מהשווי. אצלו היא תהיה מימונית.
          </P>
        </Part>
      </>
    ),
    check: quiz("ls-spc-fair", [
      {
        q: "ערך בספרים 400,000, שווי הוגן 1,000,000, והתחייבות חכירה 600,000. כמה רווח?",
        options: ["240,000 ש״ח", "600,000 ש״ח", "360,000 ש״ח", "400,000 ש״ח"],
        answer: 0,
        why: "נשארו 60%, אז עברו 40%: 600,000 × (1 − 60%) = 240,000.",
      },
    ]),
  },
  "ls-spc-high": {
    lead: "קונה שמשלם יותר מהשווי בעצם מלווה לחברה את ההפרש, וגובה אותו בחזרה בתוך דמי חכירה גבוהים מהשוק.",
    body: (
      <>
        <Story icon={<Dumbbell />} title="אולם ספורט שצריך מזומן">
          <p>
            רשת מכוני כושר צריכה כסף להתרחבות. היא מוכרת את האולם שלה לקרן ב-<M v={L.GYM.price} />, והאולם שווה בשוק <M v={L.GYM.fairValue} />. בספרים הוא רשום ב-<M v={L.GYM.bookValue} />. הבעלות והסיכונים עברו לקרן.
          </p>
          <p>
            הרשת חוכרת בחזרה ל-{L.GYM.years} שנים, <M v={L.GYM.payment} /> בסוף כל שנה, בריבית גלומה ידועה של {pct(L.GYM.rate)}. דמי שכירות בשוק לאולם כזה: <M v={L.GYM_RENT} /> בשנה. חיי האולם {L.GYM.life} שנה.
          </p>
        </Story>
        <P>
          למה קרן תשלם {n(L.GYM_LOAN)} יותר ממה שהאולם שווה? כי היא מקבלת אותם בחזרה. דמי החכירה גבוהים מהשוק ב-{n(L.GYM_PMT)} בשנה, במשך {L.GYM.years} שנים. כסף שנותנים היום ומקבלים בחזרה עם ריבית הוא הלוואה, גם אם בחוזה הוא כתוב כמחיר. לכן התקן קובע שההפרש הוא מימון (סעיף 101(ב)).
        </P>
        <P>
          בלי התיקון הרשת הייתה מציגה {n(L.GYM_LOAN)} נוספים כתמורה על המכירה, ומנפחת את הרווח, והחוב הזה היה נראה כחלק מהחכירה. כך אפשר היה להגדיל רווח פשוט על ידי העלאת המחיר ודמי השכירות יחד.
        </P>
        <P>את גובה התיקון מודדים לפי מה שקל יותר לקבוע (סעיף 102). כאן אפשר בשתי הדרכים, והן מגיעות לאותו מקום, חוץ מעיגול:</P>
        <Tbl
          dense
          head={["שתי דרכים למדוד", "חישוב", "תיאום"]}
          rows={[
            ["מחיר מול שווי הוגן", <Ltr key="a">{`${n(L.GYM.price)} − ${n(L.GYM.fairValue)}`}</Ltr>, L.GYM_LOAN],
            ["ערך נוכחי של החוזה מול השוק", <Ltr key="b">{`${n(L.GYM_PV)} − ${n(L.GYM_RENT_PV)}`}</Ltr>, L.GYM_PV - L.GYM_RENT_PV],
          ]}
        />
        <P>הדרך השנייה שימושית גם כשהמחיר שווה לשווי ההוגן אבל דמי החכירה אינם בשיעורי שוק, או כשהשווי ההוגן של הנכס קשה למדידה. לכן בודקים תמיד גם מחיר וגם דמי חכירה (סעיף 101).</P>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "מחלקים את התשלומים",
              body: (
                <>
                  <p>
                    הרשת עדיין משלמת {n(L.GYM.payment)} בשנה, אבל זה תשלום על שני דברים. הערך הנוכחי של כולם: <Ltr>{`=PV(6%;10;-240000) → ${n(L.GYM_PV)}`}</Ltr>. ממנו יוצאת ההלוואה, ומה שנשאר הוא החכירה.
                  </p>
                  <Tbl
                    dense
                    head={["הערך הנוכחי של התשלומים", "סכום"]}
                    rows={[
                      ["הלוואה", L.GYM_LOAN],
                      ["התחייבות חכירה", L.GYM_L],
                    ]}
                    foot={["סך הכול", L.GYM_PV]}
                  />
                </>
              ),
            },
            {
              title: "כמה נשאר בידי הרשת",
              body: (
                <>
                  <p>כמו במאפייה, אבל רק עם התחייבות החכירה. ההלוואה היא לא זכות באולם.</p>
                  <p>
                    <Ltr>{`${n(L.GYM_L)} ÷ ${n(L.GYM.fairValue)} = ${pct(L.GYM_SHARE, 2)}`}</Ltr>
                  </p>
                  <p>
                    נכס זכות השימוש: <Ltr>{`${n(L.GYM.bookValue)} × ${n(L.GYM_L)} ÷ ${n(L.GYM.fairValue)} = ${n(L.GYM_ROU)}`}</Ltr>
                  </p>
                </>
              ),
            },
            {
              title: "הפקודה והרווח",
              body: (
                <>
                  <p>
                    הרווח מחושב על השווי ההוגן, לא על המחיר, כי ההלוואה לא קשורה לאולם: <Ltr>{`${n(L.GYM_GAP)} × ${n(L.GYM.fairValue - L.GYM_L)} ÷ ${n(L.GYM.fairValue)} = ${n(L.GYM_GAIN)}`}</Ltr>.
                  </p>
                  <JournalEntry
                    title="1.1, בספרי המוכר"
                    lines={[
                      { account: "מזומן", dr: L.GYM.price },
                      { account: "נכס זכות שימוש", dr: L.GYM_ROU },
                      { account: "אולם", cr: L.GYM.bookValue },
                      { account: "התחייבות חכירה", cr: L.GYM_L },
                      { account: "התחייבות פיננסית", cr: L.GYM_LOAN },
                      { account: "רווח הון", cr: L.GYM_GAIN },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "שנה 1, אצל המוכר",
              body: (
                <>
                  <p>
                    כל תשלום מתחלק לשניים. החלק של ההלוואה הוא התשלום השנתי שמחזיר אותה: <Ltr>{`=PMT(6%;10;-300000) → ${n(L.GYM_PMT)}`}</Ltr>. השאר הוא החכירה: <Ltr>{`${n(L.GYM.payment)} − ${n(L.GYM_PMT)} = ${n(L.GYM_RENT)}`}</Ltr>, בדיוק דמי השוק.
                  </p>
                  <Tbl
                    dense
                    head={["שנה 1", "התחייבות חכירה", "הלוואה לשלם"]}
                    rows={[
                      ["1.1", -L.GYM_L, -L.GYM_LOAN],
                      ["ריבית", -L.GYM_L_INT, -L.GYM_LOAN_INT],
                      ["תשלום", L.GYM_RENT, L.GYM_PMT],
                    ]}
                    foot={["31.12", -L.GYM_L_CLOSE, -L.GYM_LOAN_CLOSE]}
                  />
                </>
              ),
            },
            {
              title: "בספרי הקונה",
              body: (
                <>
                  <p>הקונה רושם אולם בשווי ההוגן והלוואה על ההפרש. {L.GYM.years} מתוך {L.GYM.life} שנים הן לא החלק העיקרי. הערך הנוכחי של דמי השוק הוא {pct(L.GYM_RENT_PV / L.GYM.fairValue)} מהשווי. בתקן אין קו מדויק, וכלל האצבע הוא 90%, אז כאן לא ראינו בזה למעשה כל השווי. לכן תפעולית. את התקבול השנתי הוא מפריד לפירעון הלוואה ולהכנסה מהשכרה, ואת הריבית רושם כהכנסות מימון.</p>
                  <JournalEntry
                    title="1.1, בספרי הקונה"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.GYM.fairValue },
                      { account: "הלוואה לקבל", dr: L.GYM_LOAN },
                      { account: "מזומן", cr: L.GYM.price },
                    ]}
                  />
                  <Tbl
                    dense
                    head={["אצל הקונה, שנה 1", "סכום"]}
                    rows={[
                      ["רווח או הפסד: הכנסות מהשכרה", -L.GYM_RENT],
                      ["רווח או הפסד: הכנסות מימון", -L.GYM_LOAN_INT],
                      ["מאזן: הלוואה לקבל, 31.12", L.GYM_LOAN_CLOSE],
                    ]}
                  />
                </>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לכלול את ההלוואה ברווח, או להשתמש בכל הערך הנוכחי {n(L.GYM_PV)} כדי לחשב את החלק שנשאר.</p> },
          ]}
        />
        <Deeper title="הלוואה וחכירה כהתחייבות אחת">
          <P>יש פתרונות שלא מפרידים, ומציגים את ההלוואה והחכירה כהתחייבות אחת של {n(L.GYM_PV)}. נכס זכות השימוש והרווח יוצאים אותו דבר, ורק ההצגה שונה.</P>
        </Deeper>
        <Remember>תנאים מעל השוק הם הלוואה. היא לא נכנסת לרווח ולא לחלק שנשאר, ולכן נכס זכות השימוש קטן.</Remember>
      </>
    ),
    check: quiz("ls-spc-high", [
      {
        q: "שווי הוגן 700,000, תמורה 760,000. ערך נוכחי של התשלומים 500,000. מהי התחייבות החכירה?",
        options: ["440,000 ש״ח", "500,000 ש״ח", "560,000 ש״ח", "60,000 ש״ח"],
        answer: 0,
        why: "500,000 − 60,000 = 440,000. ה-60,000 הם הלוואה.",
      },
    ]),
  },
  "ls-spc-low": {
    lead: "מוכר שמקבל פחות מהשווי מוותר על כסף היום, ובתמורה משלם דמי חכירה נוחים. ההנחה הזו היא בעצם תשלום מראש על החכירה.",
    body: (
      <>
        <Story icon={<Package />} title="מרכז לוגיסטי לקרן פנסיה">
          <p>
            חברת הפצה מוכרת מרכז לוגיסטי לקרן פנסיה ב-<M v={L.LOGI.price} />, כשהוא שווה בשוק <M v={L.LOGI.fairValue} />. בספרים הוא רשום ב-<M v={L.LOGI.bookValue} />. הבעלות והסיכונים עברו לקרן.
          </p>
          <p>
            החברה חוכרת בחזרה ל-{L.LOGI.years} שנים, <M v={L.LOGI.payment} /> בסוף כל שנה, בריבית גלומה ידועה של {pct(L.LOGI.rate)}. דמי שכירות בשוק: <M v={L.LOGI_MARKET} /> בשנה. חיי המרכז {L.LOGI.life} שנה.
          </p>
        </Story>
        <P>
          למה חברה תמכור בפחות מהשווי? כי היא מקבלת את ההפרש בחזרה. כל שנה היא משלמת {n(L.LOGI_PMT)} פחות מהשוק. זה בדיוק מה שקורה כששוכר משלם מראש בתחילת החוזה, ואחר כך משלם פחות כל חודש. לכן {n(L.LOGI_PRE)} הם מקדמה על החכירה (סעיף 101(א)).
        </P>
        <P>בלי התיקון החברה הייתה מציגה הפסד או רווח נמוך על המכירה, והוצאות שכירות נמוכות מדי בכל השנים הבאות. המקדמה מחזירה את הדברים למקום: המכירה נמדדת בשווי ההוגן, והחכירה נושאת בכל מה ששולם עליה.</P>
        <P>שוב אפשר למדוד בשתי דרכים (סעיף 102), והן מסכימות חוץ מעיגול:</P>
        <Tbl
          dense
          head={["שתי דרכים למדוד", "חישוב", "תיאום"]}
          rows={[
            ["שווי הוגן מול מחיר", <Ltr key="a">{`${n(L.LOGI.fairValue)} − ${n(L.LOGI.price)}`}</Ltr>, L.LOGI_PRE],
            ["ערך נוכחי של השוק מול החוזה", <Ltr key="b">{`${n(L.LOGI_MARKET_PV)} − ${n(L.LOGI_L)}`}</Ltr>, L.LOGI_MARKET_PV - L.LOGI_L],
          ]}
        />
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "ההתחייבות לא משתנה",
              body: (
                <p>
                  התשלומים הם התשלומים, והמקדמה כבר שולמה. לכן ההתחייבות היא רק הערך הנוכחי שלהם: <Ltr>{`=PV(5%;15;-170000) → ${n(L.LOGI_L)}`}</Ltr>.
                </p>
              ),
            },
            {
              title: "כמה נשאר בידי החברה",
              body: (
                <>
                  <p>הזכות שנשארה לה שווה את מה שעוד תשלם ועוד מה שכבר שילמה מראש.</p>
                  <Tbl
                    dense
                    head={["כמה נשאר בידי החברה", "סכום"]}
                    rows={[
                      ["התחייבות חכירה", L.LOGI_L],
                      ["מקדמה", L.LOGI_PRE],
                    ]}
                    foot={["זכות השימוש", L.LOGI_L + L.LOGI_PRE]}
                  />
                  <p>
                    <Ltr>{`${n(L.LOGI_L + L.LOGI_PRE)} ÷ ${n(L.LOGI.fairValue)} = ${pct(L.LOGI_SHARE, 2)}`}</Ltr>
                  </p>
                  <p>
                    נכס זכות השימוש: <Ltr>{`${n(L.LOGI.bookValue)} × ${n(L.LOGI_L + L.LOGI_PRE)} ÷ ${n(L.LOGI.fairValue)} = ${n(L.LOGI_ROU)}`}</Ltr>
                  </p>
                </>
              ),
            },
            {
              title: "הפקודה והרווח",
              body: (
                <>
                  <p>
                    בדיקה: <Ltr>{`${n(L.LOGI_GAP)} × ${n(L.LOGI.fairValue - L.LOGI_L - L.LOGI_PRE)} ÷ ${n(L.LOGI.fairValue)} = ${n(L.LOGI_GAIN)}`}</Ltr>.
                  </p>
                  <JournalEntry
                    title="1.1, בספרי המוכר"
                    lines={[
                      { account: "מזומן", dr: L.LOGI.price },
                      { account: "נכס זכות שימוש", dr: L.LOGI_ROU },
                      { account: "מרכז לוגיסטי", cr: L.LOGI.bookValue },
                      { account: "התחייבות חכירה", cr: L.LOGI_L },
                      { account: "רווח הון", cr: L.LOGI_GAIN },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "בספרי הקונה",
              body: (
                <>
                  <p>הקרן רושמת את המרכז בשווי ההוגן. היא שילמה {n(L.LOGI_PRE)} פחות, והיא מחזירה אותם בדמי חכירה נמוכים, ולכן ההפרש הוא הכנסות מראש. {L.LOGI.years} מתוך {L.LOGI.life} שנים, והערך הנוכחי של דמי השוק {pct(L.LOGI_MARKET_PV / L.LOGI.fairValue)} מהשווי. שני הסימנים רחוקים, ולכן תפעולית.</p>
                  <JournalEntry
                    title="1.1, בספרי הקונה"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.LOGI.fairValue },
                      { account: "מזומן", cr: L.LOGI.price },
                      { account: "הכנסות מראש", cr: L.LOGI_PRE },
                    ]}
                  />
                  <p>
                    ההכנסה בקו ישר סופרת גם את מה שהתקבל מראש: <Ltr>{`(${n(L.LOGI.payment)} × ${L.LOGI.years} + ${n(L.LOGI_PRE)}) ÷ ${L.LOGI.years} = ${n(L.LOGI_RENT)}`}</Ltr>.
                  </p>
                  <JournalEntry
                    title="כל 31.12"
                    lines={[
                      { account: "מזומן", dr: L.LOGI.payment },
                      { account: "הכנסות מראש", dr: L.LOGI_FALL },
                      { account: "הכנסות מהשכרה", cr: L.LOGI_RENT },
                    ]}
                  />
                  <Tbl
                    dense
                    head={["הכנסות מראש, שנה 1", "סכום"]}
                    rows={[
                      ["1.1", -L.LOGI_PRE],
                      ["פריסה", L.LOGI_FALL],
                    ]}
                    foot={["31.12", -(L.LOGI_PRE - L.LOGI_FALL)]}
                  />
                </>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לשכוח את המקדמה בחלק שנשאר, או להוסיף אותה להתחייבות. היא כבר שולמה, ולכן אין עליה חוב.</p> },
          ]}
        />
        <Deeper title="אחרי יום המכירה (סעיף 102א)">
          <P>סעיף 102א נוסף בספטמבר 2022 ונכנס לתוקף ב-2024. אחרי מועד התחילה הנכס נמדד לפי סעיפים 29–35, וההתחייבות לפי סעיפים 36–46. את תשלומי החכירה, או התשלומים המעודכנים, קובעים כך שלא יוכר רווח או הפסד על זכות השימוש שנשארה. התקן לא מכתיב שיטה אחת. זה חשוב במיוחד בדמי חכירה משתנים שאינם תלויים במדד: דרך אחת היא לכלול אותם בהתחייבות. זה לא מונע רווח או הפסד מביטול מלא או חלקי של החכירה, לפי סעיף 46(א).</P>
        </Deeper>
        <Part title="שלושת התנאים, זה מול זה">
          <P>אותו סדר חשיבה בכל עסקה: בודקים מחיר ודמי חכירה מול השוק, מתקנים, ורק אז מחשבים את החלק שנשאר.</P>
          <Tbl
            dense
            head={["התנאים", "ההפרש הוא", "החלק שנשאר", "נכס זכות השימוש"]}
            rows={[
              ["בשוק", "אין הפרש", "התחייבות ÷ שווי", "בסיס"],
              ["מעל השוק", "הלוואה", "(ערך נוכחי של התשלומים − הלוואה) ÷ שווי", "קטן"],
              ["מתחת לשוק", "מקדמה", "(התחייבות + מקדמה) ÷ שווי", "גדל"],
            ]}
          />
        </Part>
        <Remember>תנאים מתחת לשוק הם מקדמה, ונכס זכות השימוש גדל. תנאים מעל השוק הם הלוואה, ונכס זכות השימוש קטן. בשניהם הרווח מחושב על השווי ההוגן.</Remember>
      </>
    ),
    check: quiz("ls-spc-low", [
      {
        q: "שווי הוגן 900,000, תמורה 850,000. מה זה ההפרש?",
        options: ["מקדמה על החכירה", "הפסד מיידי", "הלוואה מהקונה", "הנחה שנרשמת ברווח"],
        answer: 0,
        why: "תמורה נמוכה מהשווי היא תשלום מראש על החכירה (סעיף 101(א)).",
      },
    ]),
  },
  "ls-spc-drill": {
    lead: "כל לחיצה נותנת עסקה חדשה. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["landGain", "subGain", "halfPv", "slbGain", "slbLow"]} />,
  },
  "ls-spc-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנט">
        <p>העסקה: חברה החכירה בחכירת משנה ל-6 מתוך 7 השנים שנשארו לה בבניין עם 40 שנות חיים. בנפרד, היא מכרה מחסן בשווי הוגן של 800,000 ש״ח, בערך בספרים של 500,000 ש״ח, וחכרה אותו בחזרה, עם התחייבות של 600,000 ש״ח.</p>
        <p>הפתרון: ״חכירת המשנה תפעולית, כי 6 שנים הן מעט מ-40. במימונית הייתי גורע גם את התחייבות החכירה. במחסן: רווח 300,000 ש״ח.״</p>
      </Story>
    ),
    check: quiz("ls-spc-mistake", [
      {
        q: "מה הטעות בסיווג?",
        options: ["מסווגים מול זכות השימוש: 6 מתוך 7, ולכן מימונית", "צריך להשוות ל-34 שנה", "חכירת משנה תמיד תפעולית", "אין טעות"],
        answer: 0,
        why: "החברה העבירה כמעט את כל מה שיש לה (סעיף ב58(ב)).",
      },
      {
        q: "מה הטעות בהתחייבות?",
        options: ["היא נשארת. יוצא רק נכס זכות השימוש", "היא מתקזזת עם ההשקעה נטו", "היא עוברת לחוכר המשנה", "אין טעות"],
        answer: 0,
        why: "החברה עדיין חייבת למחכיר הראשי.",
      },
      {
        q: "מה הטעות ברווח במחסן?",
        options: ["רק 25% עברו לקונה, ולכן 75,000", "צריך 600,000", "אין רווח בכלל", "אין טעות"],
        answer: 0,
        why: "נשארו 600,000 ÷ 800,000 = 75%, אז 300,000 × (1 − 75%) = 75,000 (סעיף 100(א)).",
      },
    ]),
  },
  "ls-spc-master": {
    lead: "כמו במבחן: בניין אחד, שלוש חברות. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״גשר״ חכרה מחברת ״אלון״ בניין משרדים ל-{L.CH.firstYears} שנים, עם אופציה של ״גשר״ ל-{L.CH.optionYears} שנים נוספות. התשלום <Money v={L.CH.payment} /> בסוף כל שנה, גם בתקופת האופציה, בזמן שמחיר השוק הצפוי באותן שנים <Money v={L.CH.marketRent} />.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                <strong>אלון:</strong> ערך הבניין בספרים <Money v={L.CH.bookValue} />, ושוויו ההוגן <Money v={L.CH.fairValue} />. קרקע זניחה. {L.CH.life} שנות חיים. הריבית הגלומה {pct(L.CH.implicit)}, ואינה ידועה ל״גשר״. אלון אינה סוחרת, והיו לה עלויות ישירות.
              </li>
              <li>
                <strong>גשר:</strong> ריבית תוספתית {pct(L.CH.ibr)}. עלויות ישירות <Money v={L.CH.costs} />. שיפוץ של <Money v={L.CH.renovation} /> במהלך שנה 1, כשיפורים במושכר. השיפוץ הסתיים ב-31.12 של שנה 1.
              </li>
              <li>
                <strong>חכירת משנה:</strong> ב-1.1 של שנה 2 גשר החליטה לא להשתמש בבניין, והחכירה אותו לחברת ״תמר״ ל-{L.CH.subYears} שנים, <Money v={L.CH.subPayment} /> בסוף כל שנה. הריבית הגלומה {pct(L.CH.subRate)}, ואינה ידועה לתמר. הריבית התוספתית של תמר {pct(L.CH.subIbr)}.
              </li>
              <li>כל החברות: מודל העלות, פחת בקו ישר.</li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: חשבו את העלויות הישירות של אלון, והציגו את היתרות ב-31.12 של שנה 2 ואת ההשפעה על רווח או הפסד של שנה 2, בכל אחת משלוש החברות.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                {
                  title: "תקופת החכירה",
                  body: <p>קודם קובעים כמה שנים החוזה באמת נמשך, כי כל שאר המספרים נשענים על זה. בשנות האופציה גשר תשלם {n(L.CH.payment)} במקום {n(L.CH.marketRent)} בשוק, וזה תמריץ ברור לממש אותה. לכן {L.CH.years} שנים (סעיף 18).</p>,
                },
                {
                  title: "אלון: עלויות וסיווג",
                  body: (
                    <>
                      <p>
                        הריבית הגלומה ידועה, ובה הערך הנוכחי של התשלומים שווה לשווי ההוגן ועוד העלויות הישירות. השאלה לא נותנת ערך בסוף החכירה, ולכן מהערך הנוכחי של התשלומים יוצאות העלויות: <Ltr>{`=PV(9%;12;-400000) → ${n(L.CH_HEAD_PV)}`}</Ltr>.
                      </p>
                      <p>
                        <Ltr>{`${n(L.CH_HEAD_PV)} − ${n(L.CH.fairValue)} = ${n(L.CH_HEAD_COSTS)}`}</Ltr>. {L.CH.years} מתוך {L.CH.life} שנים הן כמעט כל החיים, ולכן מימונית.
                      </p>
                    </>
                  ),
                },
                {
                  title: "אלון: השקעה נטו",
                  body: (
                    <>
                      <p>מגלגלים את ההשקעה נטו שנתיים: מוסיפים ריבית, ומורידים את התקבול. הלא שוטף הוא מה שיישאר אחרי התקבול הבא, כי זה מה שהיא לא תקבל בשנה הקרובה.</p>
                      <Tbl
                        dense
                        head={["השקעה נטו", "שנה 1", "שנה 2"]}
                        rows={[
                          ["1.1", CH_HEAD_ROWS[0].open, CH_HEAD_ROWS[1].open],
                          ["ריבית", CH_HEAD_ROWS[0].income, CH_HEAD_ROWS[1].income],
                          ["תקבול", -L.CH.payment, -L.CH.payment],
                        ]}
                        foot={["31.12", CH_HEAD_ROWS[0].close, CH_HEAD_ROWS[1].close]}
                      />
                      <Tbl
                        dense
                        head={["אלון, שנה 2", "סכום"]}
                        rows={[
                          ["השקעה נטו, שוטפת", L.CH_HEAD_C2 - L.CH_HEAD_NC],
                          ["השקעה נטו, לא שוטפת", L.CH_HEAD_NC],
                          ["רווח או הפסד: הכנסות מימון", -L.CH_HEAD_I2],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: שנה 1",
                  body: (
                    <>
                      <p>
                        הריבית הגלומה לא ידועה לה, ולכן היא מהוונת בריבית התוספתית. התחייבות: <Ltr>{`=PV(10%;12;-400000) → ${n(L.CH_L)}`}</Ltr>. העלויות הישירות נכנסות לנכס, כי הן חלק ממה שעלה לה להשיג את הזכות: <Ltr>{`${n(L.CH_L)} + ${n(L.CH.costs)} = ${n(L.CH_ROU)}`}</Ltr>.
                      </p>
                      <Tbl
                        dense
                        head={["גשר, שנה 1", "סכום"]}
                        rows={[
                          ["רווח או הפסד: פחת", L.CH_DEP],
                          ["מאזן: נכס זכות שימוש, 31.12", L.CH_ROU1],
                          ["מאזן: שיפורים במושכר, 31.12", L.CH.renovation],
                          ["מאזן: התחייבות, 31.12", -L.CH_C1],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: חכירת המשנה",
                  body: (
                    <>
                      <p>
                        {L.CH.subYears} מתוך {L.CH.subYears} השנים שנשארו, מול זכות השימוש, ולכן מימונית. ההשקעה נטו בריבית הגלומה של המשנה: <Ltr>{`=PV(7%;11;-470000) → ${n(L.CH_NI)}`}</Ltr>. הנכס והשיפורים יוצאים, כי גשר לא תשתמש בהם יותר (לגבי השיפורים, IAS 16 סעיף 67(ב)), וההתחייבות נשארת, כי היא עדיין חייבת לאלון.
                      </p>
                      <JournalEntry
                        title="1.1 של שנה 2"
                        lines={[
                          { account: "השקעה נטו בחכירה", dr: L.CH_NI },
                          { account: "נכס זכות שימוש", cr: L.CH_ROU1 },
                          { account: "שיפורים במושכר", cr: L.CH.renovation },
                          { account: "רווח הון", cr: L.CH_GAIN },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: שנה 2 בדוחות",
                  body: (
                    <>
                      <p>שתי יתרות נפרדות, כל אחת עם הריבית שלה. במאזן הן מוצגות בלי קיזוז.</p>
                      <Tbl
                        dense
                        head={["רווח או הפסד", "סכום"]}
                        rows={[
                          ["רווח הון", -L.CH_GAIN],
                          ["הכנסות מימון", -L.CH_NI_INT],
                          ["הוצאות מימון", L.CH_I2],
                        ]}
                        foot={["סך הכול", -L.CH_TOTAL]}
                      />
                      <Tbl
                        dense
                        head={["31.12 של שנה 2", "שוטף", "לא שוטף"]}
                        rows={[
                          ["השקעה נטו", L.CH_NI_CLOSE - L.CH_NI_NC, L.CH_NI_NC],
                          ["התחייבות חכירה", -(L.CH_C2 - L.CH_NC), -L.CH_NC],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "תמר: חוכרת רגילה",
                  body: (
                    <>
                      <p>
                        מבחינתה זו חכירה רגילה, וזה שהמחכיר שלה עצמו חוכר לא משנה לה. הריבית הגלומה לא ידועה לה, ולכן היא מהוונת בריבית התוספתית שלה: <Ltr>{`=PV(8%;11;-470000) → ${n(L.CH_S_L)}`}</Ltr>.
                      </p>
                      <Tbl
                        dense
                        head={["תמר, שנה 2", "סכום"]}
                        rows={[
                          ["רווח או הפסד: פחת", L.CH_S_DEP],
                          ["רווח או הפסד: הוצאות מימון", L.CH_S_INT],
                          ["מאזן: נכס זכות שימוש, 31.12", L.CH_S_ROU],
                          ["מאזן: התחייבות, שוטפת", -(L.CH_S_CLOSE - L.CH_S_NC)],
                          ["מאזן: התחייבות, לא שוטפת", -L.CH_S_NC],
                        ]}
                      />
                    </>
                  ),
                },
                { title: "מלכודת נפוצה", body: <p>לסווג את חכירת המשנה מול {L.CH.life} שנות חיי הבניין, ולקבל תפעולית. או לקזז בספרי גשר בין ההשקעה נטו להתחייבות.</p> },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אתם מכירים את כל התקן. נשאר לבדוק את זה בלי רמזים.">בשיעור הבא: מבחני סיכום ברמת מועצה, ועץ החלטה של כל התקן.</Bridge>
      </>
    ),
  },
};
