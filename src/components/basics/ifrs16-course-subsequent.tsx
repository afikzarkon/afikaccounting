import { Banknote, ListChecks, PiggyBank, Printer, Scale, Search, ShieldCheck, Store, Truck } from "lucide-react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import { pvEnd } from "@/lib/learn/ifrs16";
import { CASH_ITEMS, CASH_OPTIONS, DEP_CASES, FILL_TASK, KIOSK, KIOSK_ACCRUED, KIOSK_EXPENSE, KIOSK_PAID, KIOSK_PER_MONTH, KIOSK_TOTAL, LAPTOP, LAPTOP_FULL, LOW_ITEMS, LOW_OPTIONS, MASTER, MASTER_EXP_FORKLIFT, MASTER_EXP_LINES, MASTER_EXP_SHARES, MASTER_EXP_VAN, MASTER_EXP_YEARLY, MASTER_FORKLIFT, MASTER_LINES, MASTER_SHARES, MASTER_TOTAL, MASTER_VAN, MASTER_YEARLY, SHORT_ITEMS, SHORT_OPTIONS, TRUCK, TRUCK_END, TRUCK_START, WORK, WORK_S, WORK_SECTIONS, WORK_VARIABLE } from "@/lib/study/ifrs16/lessons/subsequent";
import { INKIND, INKIND_YEARLY } from "@/lib/study/ifrs16/lessons/measure";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { DecisionTree, Fork, Timeline, TwoPanel, WrongRight, YearCompare } from "./ias19-visuals";
import { LeaseDrill, LeaseLab, StatementDrill, StatementFill } from "./ifrs16-interactive";
import { AssetCycle, FullSolution, LiabilityCycle, P, quiz, StatementTables, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 4: the lessee after the first day. Every figure
 * comes from lib/study/ifrs16/lessons/subsequent.ts; on a screen, balances are
 * whole shekels, and the year's movements are what makes them add up.
 */

const M = ({ v, plain }: { v: number; plain?: boolean }) => <Money v={Math.round(v)} plain={plain} />;
const pct = (r: number, d = 0) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");

/** One line of a schedule inside a panel: what moved, and by how much, with its sign, as in the tables. */
const Move = ({ label, v }: { label: string; v: number }) => (
  <span className="flex items-baseline justify-between gap-3">
    <span>{label}</span>
    <bdi dir="ltr" className="num whitespace-nowrap">
      {n(v)}
    </bdi>
  </span>
);

/** A balance cut in two by time: what leaves it within 12 months, and what is still there after them. */
function SplitBar({ title, current, nonCurrent }: { title: string; current: number; nonCurrent: number }) {
  const total = current + nonCurrent;
  const part = (name: string, v: number, wash: number) => (
    <div className="min-w-0 px-1.5 py-2 text-center" style={{ width: `${(v / total) * 100}%`, background: `color-mix(in oklab, var(--accent) ${wash}%, transparent)` }}>
      <span className="block">{name}</span>
      <bdi dir="ltr" className="num">
        {n(-v)}
      </bdi>
    </div>
  );
  return (
    <figure role="img" aria-label={`${title}. היתרה מינוס ${n(total)}: שוטף מינוס ${n(current)}, לא שוטף מינוס ${n(nonCurrent)}`} className="space-y-2 rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 text-[14px] font-bold text-fg">
        <span>{title}</span>
        <span className="text-[13px] font-medium text-muted">
          היתרה{" "}
          <bdi dir="ltr" className="num">
            {n(-total)}
          </bdi>
        </span>
      </figcaption>
      <div className="flex gap-0.5 overflow-hidden rounded-lg text-[12.5px] font-semibold leading-tight text-fg">
        {part("שוטף", current, 34)}
        {part("לא שוטף", nonCurrent, 10)}
      </div>
    </figure>
  );
}

export const IFRS16_SUBSEQUENT_SCREENS: Record<string, ScreenContent> = {
  "ls-sub-hook": {
    lead: "אחרי היום הראשון עוקבים אחרי שתי יתרות, החוב למחכיר והנכס. כל אחת מהן זזה מסיבה אחרת.",
    body: (
      <>
        <Story icon={<Truck />} title="משאית לארבע שנים">
          <p>
            חברת הובלה חכרה משאית ל-{TRUCK.years} שנים. היא משלמת <M v={TRUCK.payment} /> בסוף כל שנה, והריבית {pct(TRUCK.rate)}. ביום הראשון היא רשמה חוב ונכס של <M v={TRUCK_END.cost} />, כמו שלמדנו בשיעור הקודם: <Ltr>{`=PV(7%;4;-30000) → ${n(TRUCK_END.cost)}`}</Ltr>.
          </p>
          <p>עכשיו עברה שנה. החוב גדל בריבית, כי החברה הייתה חייבת את הכסף שנה שלמה, והוא קטן בתשלום ששילמה. הנכס רק קטן, כי נגמרה שנה אחת מתוך ארבע. לזה קוראים פחת.</p>
          <p>המשאית הזו תלווה אותנו לאורך השיעור.</p>
        </Story>
        <TwoPanel
          label={`השנה הראשונה של המשאית. החוב: מינוס ${n(TRUCK_END.cost)}, ריבית מינוס ${n(TRUCK_END.rows[0].interest)}, תשלום פלוס ${n(TRUCK.payment)}, ובסוף השנה מינוס ${n(TRUCK_END.rows[0].closing)}. הנכס: ${n(TRUCK_END.cost)}, פחת מינוס ${n(TRUCK_END.rows[0].depreciation)}, ובסוף השנה ${n(TRUCK_END.rows[0].rightOfUse)}`}
          panels={[
            {
              title: "החוב למחכיר",
              icon: <Scale />,
              steps: [<Move key="a" label="ביום הראשון" v={-TRUCK_END.cost} />, <Move key="b" label="ריבית" v={-TRUCK_END.rows[0].interest} />, <Move key="c" label="תשלום" v={TRUCK.payment} />],
              verdict: <Move label="בסוף השנה" v={-TRUCK_END.rows[0].closing} />,
              tone: 3,
            },
            {
              title: "הנכס",
              icon: <PiggyBank />,
              steps: [<Move key="a" label="ביום הראשון" v={TRUCK_END.cost} />, <Move key="b" label="פחת" v={-TRUCK_END.rows[0].depreciation} />],
              verdict: <Move label="בסוף השנה" v={TRUCK_END.rows[0].rightOfUse} />,
              tone: 1,
            },
          ]}
        />
        <P>
          טבלה כזו, מהיתרה בתחילת השנה דרך מה שקרה בה ועד היתרה בסופה, נקראת <strong>מעגל</strong>. לכל חכירה יש שניים: המעגל של <T16 he="התחייבות החכירה" par="36" />, והמעגל של <T16 he="נכס זכות השימוש" par="30" />.
        </P>
        <P>
          שימו לב מה לא קרה. {n(TRUCK.payment)} ש״ח יצאו מהקופה, ובכל זאת הם לא הוצאה. החברה החזירה חוב, בדיוק כמו בהחזר של הלוואה. אם נרשום את התשלום כהוצאה, נספור את העלות פעמיים, כי היא כבר נרשמת דרך הפחת והריבית.
        </P>
        <Rule>התשלום לא נכנס לדוח רווח או הפסד, כי הוא רק מקטין את החוב (סעיף 36(ב)). ההוצאות בדוח הן הריבית (סעיף 38) והפחת.</Rule>
        <Remember>בסוף השנה החוב והנכס כבר לא שווים, וזה תקין, כי כל אחד זז בקצב שלו. הם נפרדים עד שיש מדידה מחדש של ההתחייבות, ואז מתעדכן גם הנכס. נגיע לזה בשיעור הבא.</Remember>
      </>
    ),
  },
  "ls-sub-end": {
    lead: "כשמשלמים בסוף השנה, החוב עומד במלואו כל השנה. לכן הריבית מחושבת על כל היתרה שבתחילת השנה.",
    body: (
      <>
        <Timeline
          label={`השנה הראשונה של המשאית. מ-1.1 עד 31.12 החוב ${n(TRUCK_END.rows[0].opening)}, וב-31.12 משלמים ${n(TRUCK.payment)}`}
          title="המשאית, שנה 1, תשלום בסוף השנה"
          from={0}
          to={1}
          ticks={[
            { at: 0, label: "1.1" },
            { at: 1, label: `31.12: משלמים ${n(TRUCK.payment)}` },
          ]}
          spans={[{ from: 0, to: 1, label: `חוב של ${n(TRUCK_END.rows[0].opening)} כל השנה`, tone: 3 }]}
        />
        <P>ריבית היא מחיר של כסף לאורך זמן. במשך כל השנה החברה מחזיקה חוב של {n(TRUCK_END.rows[0].opening)} ש״ח, ולכן היא משלמת ריבית על כולו. אם נוריד קודם את התשלום, נחשב ריבית על חוב קטן ממה שהיה בפועל.</P>
        <P>לכן הסדר קבוע: בסוף השנה קודם מוסיפים את הריבית של השנה, ואז התשלום מוריד את החוב.</P>
        <Part title="המעגל (סעיפים 36, 37)">
          <p className="text-[15.5px] font-semibold">פתיחה × שיעור הריבית = ריבית</p>
          <p>
            <Ltr>{`${n(TRUCK_END.rows[0].opening)} × 7% = ${n(TRUCK_END.rows[0].interest)}`}</Ltr>
          </p>
          <p className="text-[15.5px] font-semibold">פתיחה + ריבית − תשלום = סגירה</p>
          <p>
            <Ltr>{`${n(TRUCK_END.rows[0].opening)} + ${n(TRUCK_END.rows[0].interest)} − ${n(TRUCK.payment)} = ${n(TRUCK_END.rows[0].closing)}`}</Ltr>
          </p>
        </Part>
        <P>היתרה בסוף השנה היא הפתיחה של השנה הבאה, וכך ממשיכים עד הסוף:</P>
        <LiabilityCycle rows={TRUCK_END.rows} />
        <P>הריבית יורדת כל שנה, כי החוב קטן. שיעור הריבית נשאר קבוע (סעיף 37), והיתרה מגיעה בסוף בדיוק לאפס. אם היא לא מגיעה לאפס, יש טעות בחישוב.</P>
        <P>
          יש גם בדיקה מהירה לכל יתרה. היתרה בכל 31.12 היא הערך הנוכחי של התשלומים שנשארו. אחרי שנה נשארו 3 תשלומים: <Ltr>{`=PV(7%;3;-30000) → ${n(TRUCK_END.rows[0].closing)}`}</Ltr>.
        </P>
        <P>
          בפקודת היומן התשלום מתפצל. מתוך {n(TRUCK.payment)} ש״ח, {n(TRUCK_END.rows[0].interest)} ש״ח הם הריבית של השנה, וזו הוצאה. השאר, <Ltr>{`${n(TRUCK.payment)} − ${n(TRUCK_END.rows[0].interest)} = ${n(TRUCK.payment - TRUCK_END.rows[0].interest)}`}</Ltr>, מקטין את החוב:
        </P>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "הוצאות מימון", dr: TRUCK_END.rows[0].interest },
            { account: "התחייבות חכירה", dr: TRUCK.payment - TRUCK_END.rows[0].interest },
            { account: "מזומן", cr: TRUCK.payment },
          ]}
        />
        <Remember>פתיחה, ריבית, תשלום, סגירה. כשמשלמים בסוף השנה, הריבית תמיד לפני התשלום.</Remember>
      </>
    ),
    check: quiz("ls-sub-end", [
      {
        q: "יתרת פתיחה 70,000 ש״ח, ריבית 5%, תשלום של 15,000 ש״ח ב-31.12. מהי יתרת הסגירה?",
        options: ["58,500 ש״ח", "55,000 ש״ח", "57,750 ש״ח", "73,500 ש״ח"],
        answer: 0,
        why: "70,000 × 0.05 = 3,500. ואז 70,000 + 3,500 − 15,000 = 58,500.",
      },
    ]),
  },
  "ls-sub-start": {
    lead: "כשמשלמים בתחילת השנה, הכסף יוצא כבר ביום הראשון שלה. לכן הריבית מחושבת רק על מה שנשאר אחרי התשלום.",
    body: (
      <>
        <P>אותה משאית ואותו סכום. הפעם החברה משלמת ב-1.1 של כל שנה, והתשלום הראשון יצא כבר ביום הראשון של החכירה. נסתכל על השנה השנייה:</P>
        <Timeline
          label={`השנה השנייה של המשאית. ב-1.1 משלמים ${n(TRUCK.payment)}, ומאז ועד 31.12 החוב ${n(TRUCK_START.rows[1].opening - TRUCK.payment)}`}
          title="המשאית, שנה 2, תשלום בתחילת השנה"
          from={0}
          to={1}
          ticks={[
            { at: 0, label: `1.1: משלמים ${n(TRUCK.payment)}` },
            { at: 1, label: "31.12" },
          ]}
          spans={[{ from: 0, to: 1, label: `חוב של ${n(TRUCK_START.rows[1].opening - TRUCK.payment)} כל השנה`, tone: 3 }]}
        />
        <P>
          ב-31.12 של שנה 1 החוב היה {n(TRUCK_START.rows[1].opening)} ש״ח. למחרת, ב-1.1, החברה משלמת {n(TRUCK.payment)} ש״ח. מכאן ועד סוף השנה החוב הוא רק {n(TRUCK_START.rows[1].opening - TRUCK.payment)} ש״ח, ועל זה משלמים ריבית.
        </P>
        <Part title="הריבית, כשהתשלום ב-1.1 (סעיף 37)">
          <p className="text-[15.5px] font-semibold">(פתיחה − תשלום) × שיעור הריבית = הוצאות מימון</p>
          <p>
            <Ltr>{`(${n(TRUCK_START.rows[1].opening)} − ${n(TRUCK.payment)}) × 7% = ${n(TRUCK_START.rows[1].interest)}`}</Ltr>
          </p>
        </Part>
        <WrongRight
          label="טעות: ריבית על היתרה לפני התשלום. נכון: ריבית על היתרה אחרי התשלום"
          wrong={<p>״החוב ב-1.1 הוא {n(TRUCK_START.rows[1].opening)}, אז הריבית של שנה 2 היא {n(TRUCK_START.rows[1].opening * TRUCK.rate)}.״</p>}
          right={
            <p>
              ב-1.1 משלמים {n(TRUCK.payment)}, ונשארים {n(TRUCK_START.rows[1].opening - TRUCK.payment)}. הריבית של שנה 2 היא {n(TRUCK_START.rows[1].interest)}.
            </p>
          }
        />
        <P>כל 4 השנים ביחד:</P>
        <LiabilityCycle rows={TRUCK_START.rows} />
        <P>
          ״יתרה ב-1.1״ של שנה 1 כוללת את התשלום של היום, ולכן היא הערך הנוכחי של כל {TRUCK.years} התשלומים. בשורה הבאה הוא יוצא, ונשארת ההתחייבות שחישבנו בשיעור הקודם: {n(TRUCK_START.rows[0].opening - TRUCK.payment)}.
        </P>
        <P>
          היתרה ב-31.12 של שנה 1 היא התשלום של מחר, ועוד הערך הנוכחי של השניים שאחריו: <Ltr>{`=30000+PV(7%;2;-30000) → ${n(TRUCK.payment + pvEnd(TRUCK.rate, 2, TRUCK.payment))}`}</Ltr>. שקל הפרש מהטבלה הוא עיגול.
        </P>
        <P>
          אותם תשלומים, וריבית אחרת. כשמשלמים בסוף שנה, סך הריבית לאורך החכירה הוא {n(TRUCK_END.rows.reduce((s, y) => s + y.interest, 0))} ש״ח. כשמשלמים בתחילת שנה הוא רק {n(TRUCK_START.rows.reduce((s, y) => s + y.interest, 0))} ש״ח, כי הכסף יוצא שנה קודם והחוב קטן יותר כל הזמן.
        </P>
        <Remember>בשנה האחרונה יש ריבית רק אם נשאר משהו לשלם בסופה. אם התשלום של 1.1 סוגר את החוב, אין על מה לחשב ריבית.</Remember>
      </>
    ),
    check: quiz("ls-sub-start", [
      {
        q: "יתרת ההתחייבות ב-31.12 היא 60,000 ש״ח. ב-1.1 משלמים 20,000 ש״ח. הריבית 5%. מהן הוצאות המימון של השנה?",
        options: ["2,000 ש״ח", "3,000 ש״ח", "4,000 ש״ח", "1,000 ש״ח"],
        answer: 0,
        why: "60,000 − 20,000 = 40,000. ואז 40,000 × 0.05 = 2,000.",
      },
    ]),
  },
  "ls-sub-dep": {
    lead: "שאלה אחת קובעת את הפחת: האם הנכס יישאר אצל החוכר בסוף?",
    body: (
      <>
        <P>פחת הוא פריסה של עלות הנכס על השנים שהחברה נהנית ממנו. אם הנכס יישאר אצלה, היא תמשיך ליהנות ממנו גם אחרי החכירה. אם הוא יחזור למחכיר, ההנאה נגמרת לכל המאוחר כשהחכירה נגמרת.</P>
        <DecisionTree
          label="על פני כמה שנים מפחיתים. הבעלות עוברת בסוף החכירה, או שהעלות כוללת אופציית רכישה שתמומש? לאורך החיים. אחרת, הקצר מבין אורך החיים ותקופת החכירה"
          questions={[{ q: "הבעלות עוברת לחוכר בסוף, או שעלות הנכס כוללת מימוש של אופציית רכישה?", yes: "לאורך החיים השימושיים", tone: 1 }]}
          fallback={{ label: "אחרת: הקצר מבין החיים והתקופה", tone: 3 }}
        />
        <P>
          <strong>אורך החיים השימושיים</strong> הוא כמה שנים החברה צופה שהנכס יהיה זמין לשימוש שלה. זה לא בהכרח כל מה שהוא מסוגל לעבוד: אם היא מתכוונת להפסיק להשתמש בו קודם, סופרים עד אז. <strong>תקופת החכירה</strong> היא כמה שנים הוא אצל החוכר לפי החוזה. זה הכלל של סעיף 32, ובטבלה ארבעה מצבים:
        </P>
        <Tbl
          head={["המקרה", "שנות פחת", "למה"]}
          rows={DEP_CASES.map((c) => [c.text, c.over, c.why])}
        />
        <P>למה זה חשוב? אילו המשאית, שחוזרת אחרי {TRUCK.years} שנים, הייתה מופחתת על פני {TRUCK.life} שנים, בסוף החכירה היה נשאר בספרים נכס של {n(TRUCK_END.cost - (TRUCK_END.cost / TRUCK.life) * TRUCK.years)} ש״ח, בלי שום משאית מאחוריו. ובכיוון ההפוך, נכס שהחברה תקנה ותמשיך לעבוד איתו, אם יופחת רק על תקופת החכירה, יגיע לאפס כשהוא עוד עובד, וההוצאה תירשם מוקדם מדי.</P>
        <P>אופציית רכישה משנה שני דברים ביחד: המחיר שלה מגדיל את עלות הנכס, והפחת נפרס על יותר שנים.</P>
        <Story icon={<Truck />} title="המשאית">
          <p>
            החברה הייתה יכולה להשתמש בה {TRUCK.life} שנים, אבל אחרי {TRUCK.years} שנים היא חוזרת למחכיר. לכן מפחיתים על פני {TRUCK.years} שנים.
          </p>
          <p className="font-semibold">עלות ÷ שנות פחת = פחת לשנה</p>
          <p>
            <Ltr>{`${n(TRUCK_END.cost)} ÷ ${TRUCK.years} = ${n(TRUCK_END.rows[0].depreciation)}`}</Ltr>
          </p>
        </Story>
        <AssetCycle rows={TRUCK_END.rows} cost={TRUCK_END.cost} />
        <P>היתרה בכל סוף שנה היא העלות פחות כל הפחת שנרשם עד אז, שנקרא פחת נצבר (סעיף 30).</P>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "הוצאות פחת", dr: TRUCK_END.rows[0].depreciation },
            { account: "פחת נצבר", cr: TRUCK_END.rows[0].depreciation },
          ]}
        />
        <P>גם על נכס זכות שימוש חל IAS 36 (סעיף 33). אם יש ירידת ערך, היא מקטינה את הנכס, בנוסף לפחת.</P>
        <Remember>כללי הפחת הם אותם כללים של רכוש קבוע, לפי IAS 16 (סעיף 31). בכל השאלות כתוב באיזו שיטה מפחיתים.</Remember>
      </>
    ),
    check: quiz("ls-sub-dep", [
      {
        q: "תקופת חכירה 5 שנים, אורך חיים 12 שנים, וודאי באופן סביר שאופציית הרכישה תמומש. על פני כמה שנים מפחיתים?",
        options: ["12", "5", "17", "8.5"],
        answer: 0,
        why: "סעיף 32: העלות משקפת מימוש של אופציית רכישה, ולכן לאורך החיים.",
      },
    ]),
  },
  "ls-sub-models": {
    lead: "כמעט תמיד הנכס נמדד כמו במשאית, עלות פחות פחת. רק בשני מצבים התקן שולח למודל אחר.",
    body: (
      <>
        <P>
          המצב הראשון הוא <strong>נדל״ן להשקעה</strong>, כלומר בניין שמחזיקים כדי להרוויח משכירות או מעליית ערך. נניח שחברה חכרה בניין ומשכירה אותו הלאה, וכל הנדל״ן להשקעה שלה נמדד בשווי הוגן. אז גם הבניין הזה נמדד בשווי הוגן, ומוצג כנדל״ן להשקעה (סעיפים 34, 48). אין לה כאן בחירה.
        </P>
        <P>
          המצב השני הוא רכוש קבוע שנמדד ב<strong>הערכה מחדש</strong>, כלומר לפי השווי שלו ולא לפי העלות. אם נכס זכות השימוש שייך לקבוצה כזו, החברה יכולה למדוד כך את כל נכסי זכות השימוש בקבוצה, אבל לא חייבת (סעיף 35).
        </P>
        <DecisionTree
          label="איך מודדים את הנכס. נדל״ן להשקעה בחברה שמודדת נדל״ן להשקעה בשווי הוגן? שווי הוגן, חובה. שייך לקבוצת רכוש קבוע בהערכה מחדש? מותר להעריך מחדש את כל הקבוצה. אחרת, מודל העלות"
          questions={[
            { q: "הנכס עונה להגדרת נדל״ן להשקעה, והחברה מודדת נדל״ן להשקעה בשווי הוגן?", yes: "שווי הוגן, חובה", tone: 4 },
            { q: "הנכס שייך לקבוצת רכוש קבוע שנמדדת בהערכה מחדש?", yes: "הערכה מחדש לכל הקבוצה, רשות", tone: 3 },
          ]}
          fallback={{ label: "בכל מקרה אחר: עלות, פחות פחת נצבר וירידת ערך (סעיף 29)", tone: 1 }}
        />
        <Remember>את המעבר של נכס זכות שימוש לנדל״ן להשקעה בשווי הוגן נלמד בשיעור 8. בשיעור הזה כל הדוגמאות במודל העלות.</Remember>
      </>
    ),
  },
  "ls-sub-current": {
    lead: "במאזן מחלקים את החוב לשניים. שוטף הוא החלק מהיתרה של היום שיסולק ב-12 החודשים הקרובים, ולא שוטף הוא מה שלא יסולק בתוכם.",
    body: (
      <>
        <P>החלוקה קיימת בשביל מי שקורא את המאזן: הוא רוצה לדעת כמה מהחוב צריך לכסות בשנה הקרובה. אם החברה תציג את הכול כלא שוטף, היא תיראה נזילה יותר ממה שהיא.</P>
        <P>הכי קל להתחיל מהחלק הלא שוטף, מה שמהיתרה של היום לא יסולק בתוך 12 חודשים. כל השאר שוטף. הנה המשאית ב-31.12 של שנה 1, פעם בתשלום בסוף שנה ופעם בתשלום בתחילת שנה:</P>
        <SplitBar title="תשלום בסוף שנה" current={TRUCK_END.rows[0].current} nonCurrent={TRUCK_END.rows[0].nonCurrent} />
        <SplitBar title="תשלום בתחילת שנה" current={TRUCK_START.rows[0].current} nonCurrent={TRUCK_START.rows[0].nonCurrent} />
        <P>החלק הלא שוטף זהה בשניהם, כי בשני המקרים נשארים אחרי התשלום הבא שני תשלומים. בתשלום בתחילת שנה לא לוקחים את היתרה של סוף השנה הבאה, {n(TRUCK_START.rows[1].closing)} ש״ח, כי כבר נוספה לה ריבית של שנה. איך מוצאים אותו תלוי במועד התשלום הבא:</P>
        <Fork
          label="תשלום בסוף שנה: הלא שוטף הוא היתרה של סוף השנה הבאה. תשלום בתחילת שנה: הלא שוטף הוא היתרה פחות התשלום של מחר"
          question="מתי התשלום הבא?"
          branches={[
            { when: "בעוד שנה, ב-31.12", then: "לא שוטף = היתרה של סוף השנה הבאה" },
            { when: "מחר, ב-1.1", then: "לא שוטף = היתרה פחות התשלום של מחר" },
          ]}
        />
        <P>
          בתשלום בסוף שנה השוטף יוצא <Ltr>{`${n(TRUCK_END.rows[0].closing)} − ${n(TRUCK_END.rows[0].nonCurrent)} = ${n(TRUCK_END.rows[0].current)}`}</Ltr>, פחות מהתשלום של {n(TRUCK.payment)}. ההפרש הוא הריבית של השנה הבאה. היא עוד לא נוצרה, ולכן היא לא נמצאת ביתרה של היום. אם נסווג כשוטף את כל התשלום, החלוקה לא תסתכם ליתרה.
        </P>
        <P>
          את הלא שוטף אפשר לבדוק לבד, כערך הנוכחי של מה שיישאר אחרי התשלום הבא: <Ltr>{`=PV(7%;2;-30000) → ${n(pvEnd(TRUCK.rate, 2, TRUCK.payment))}`}</Ltr>. שקל הפרש מהטבלה הוא עיגול.
        </P>
        <P>בתשלום בתחילת שנה השוטף הוא התשלום כולו, {n(TRUCK.payment)}. הוא משולם מחר, ואין ריבית בדרך.</P>
        <Rule>אם אחרי התשלום הבא לא נשאר תשלום מעבר ל-12 חודשים, כל היתרה שוטפת.</Rule>
        <Remember>
          המשאית בתשלום בתחילת שנה, ב-31.12 של שנה 3: היתרה {n(TRUCK_START.rows[2].closing)} תשולם מחר, ולכן כולה שוטפת.
        </Remember>
      </>
    ),
    check: quiz("ls-sub-current", [
      {
        q: "תשלום בסוף שנה. יתרה ב-31.12 של שנה 1: 90,000 ש״ח. יתרה ב-31.12 של שנה 2: 70,000 ש״ח. מהו החלק השוטף ב-31.12 של שנה 1?",
        options: ["20,000 ש״ח", "70,000 ש״ח", "90,000 ש״ח", "הסכום של התשלום הבא"],
        answer: 0,
        why: "הלא שוטף הוא 70,000, ולכן השוטף 90,000 − 70,000 = 20,000.",
      },
    ]),
  },
  "ls-sub-lab": {
    lead: "שנו את התנאים, עברו בין השנים, וראו איך שני המעגלים והדוחות זזים יחד.",
    body: (
      <>
        <LeaseLab />
        <Remember>נסו להעביר את התשלום לתחילת שנה, וראו שהריבית יורדת. אחר כך הוסיפו אופציית רכישה, וראו שהפחת מתפרס על פני אורך החיים.</Remember>
      </>
    ),
  },
  "ls-sub-other": {
    lead: "יש תשלומים שמלכתחילה לא נכנסו לחוב, ולכן הם לא עוברים דרך המעגלים. כל אחד מהם הוא הוצאה של השנה שאליה הוא שייך.",
    body: (
      <>
        <P>נניח שעל המשאית החברה משלמת גם לפי הקילומטרים שנסעה. היא לא יודעת מראש כמה תיסע, ולכן זה לא נכנס להתחייבות. בכל שנה היא רושמת הוצאה לפי הקילומטרים של אותה שנה, בלי לגעת באומדן לשנה הבאה. אם היא תחכה לסוף החכירה, או תפרוס את הסכום, ההוצאה לא תהיה בשנה שבה המשאית נסעה.</P>
        <P>כך גם בעוד שני מקרים:</P>
        <Tbl
          head={["מה", "מתי נרשם", "מקור"]}
          rows={[
            ["תשלום לפי מכירות או שימוש", "בשנה שבה המכירות או השימוש קרו", "סעיף 38(ב)"],
            ["תחזוקה שהופרדה מהחכירה", "בשנה שבה ניתן השירות", "סעיפים 12, 16"],
            ["תמריץ בעין, כמו שירות שהמחכיר שילם", "בשנים שהשירות מכסה", "לפי מהות ההוצאה"],
          ]}
        />
        <P>יוצא מהכלל אחד: אם תקן אחר מכניס את העלות לערך של נכס אחר, למשל למלאי, היא נכנסת לשם ולא לרווח או הפסד (סעיף 38).</P>
        <Story icon={<ShieldCheck />} title="האבטחה של המרפאה">
          <p>
            בשיעור 3 המחכיר של המרפאה שילם במקומה {INKIND.coverYears} שנות אבטחה, <M v={INKIND.service} />. זה הקטין את עלות הנכס, וכנגד זה נרשמו הוצאות מראש, כלומר שירות ששולם ועוד לא נצרך.
          </p>
          <p>
            עכשיו המרפאה צורכת את השירות. בכל שנה עובר חלק מההוצאות מראש להוצאה: <Ltr>{`${n(INKIND.service)} ÷ ${INKIND.coverYears} = ${n(INKIND_YEARLY)}`}</Ltr>.
          </p>
        </Story>
        <P>הוצאות מראש הן נכס, והן יורדות בכל חודש שעובר:</P>
        <Tbl
          dense
          head={["הוצאות מראש", "שנה 1", "שנה 2"]}
          rows={[
            ["יתרה ב-1.1", INKIND.service, INKIND.service - INKIND_YEARLY],
            ["העברה להוצאה", -INKIND_YEARLY, -INKIND_YEARLY],
          ]}
          foot={["יתרה ב-31.12", INKIND.service - INKIND_YEARLY, 0]}
        />
        <JournalEntry
          title="31.12, בכל אחת משתי השנים"
          lines={[
            { account: "הוצאות אבטחה", dr: INKIND_YEARLY },
            { account: "הוצאות מראש", cr: INKIND_YEARLY },
          ]}
        />
        <Remember>השאלה בכל שורה זהה: לאיזו שנה זה שייך? לשם נכנסת ההוצאה.</Remember>
      </>
    ),
    check: quiz("ls-sub-other", [
      {
        q: "חוכר משלם 1% מהמכירות. המכירות השנה 700,000 ש״ח. אומדן המכירות לשנה הבאה 900,000 ש״ח. כמה נרשם כהוצאה השנה?",
        options: ["7,000 ש״ח", "16,000 ש״ח", "9,000 ש״ח", "8,000 ש״ח"],
        answer: 0,
        why: "סעיף 38(ב): רק לפי האירוע של השנה. 700,000 × 0.01 = 7,000.",
      },
    ]),
  },
  "ls-sub-show": {
    lead: "כל מספר מהמעגלים נכנס לשורה אחת בדוחות. כשכתוב בשאלה ״להציג סעיפים רלוונטיים״, זה מה שמבקשים.",
    body: (
      <>
        <Tbl
          head={["מה לוקחים מהמעגל", "לאיזה דוח", "באיזו שורה"]}
          rows={[
            ["הריבית של השנה", "רווח או הפסד", "הוצאות מימון"],
            ["הפחת של השנה", "רווח או הפסד", "הוצאות פחת"],
            ["היתרה של הנכס", "מצב כספי", "נכס זכות שימוש, נטו"],
            ["היתרה של החוב", "מצב כספי", "התחייבות חכירה, שוטפת ולא שוטפת"],
          ]}
        />
        <P>הנה המשאית, בתשלום בסוף שנה, בשנתיים הראשונות. כל מספר כאן כבר הופיע במעגלים:</P>
        <StatementTables
          sections={[
            {
              title: "רווח או הפסד",
              rows: [
                { id: "dep", label: "הוצאות פחת", values: [TRUCK_END.rows[0].depreciation, TRUCK_END.rows[1].depreciation] },
                { id: "fin", label: "הוצאות מימון", values: [TRUCK_END.rows[0].interest, TRUCK_END.rows[1].interest] },
                { id: "total", label: "סך ההוצאות", values: [TRUCK_END.rows[0].depreciation + TRUCK_END.rows[0].interest, TRUCK_END.rows[1].depreciation + TRUCK_END.rows[1].interest] },
              ],
            },
            {
              title: "מצב כספי, 31.12",
              rows: [
                { id: "rou", label: "נכס זכות שימוש, נטו", values: [TRUCK_END.rows[0].rightOfUse, TRUCK_END.rows[1].rightOfUse] },
                { id: "cur", label: "התחייבות חכירה, שוטפת", values: [-TRUCK_END.rows[0].current, -TRUCK_END.rows[1].current] },
                { id: "non", label: "התחייבות חכירה, לא שוטפת", values: [-TRUCK_END.rows[0].nonCurrent, -TRUCK_END.rows[1].nonCurrent] },
              ],
            },
          ]}
        />
        <P>
          שימו לב כמה ההוצאה גבוהה בהתחלה. בשנה 1 <Ltr>{`${n(TRUCK_END.rows[0].depreciation)} + ${n(TRUCK_END.rows[0].interest)} = ${n(TRUCK_END.rows[0].depreciation + TRUCK_END.rows[0].interest)}`}</Ltr>, בזמן שהחברה שילמה {n(TRUCK.payment)} ש״ח. הפחת קבוע והריבית יורדת, ולכן ההוצאה הכוללת יורדת משנה לשנה, גם כשהתשלום לא משתנה.
        </P>
        <P>אם יש גם תשלום לפי מכירות או תחזוקה, הם מצטרפים לדוח רווח או הפסד בשורה משלהם, ונכנסים לסך ההוצאות.</P>
        <Rule>הריבית והפחת מוצגים בנפרד. אי אפשר לחבר אותם לשורה אחת של ״הוצאות חכירה״ (סעיף 49). הריבית היא עלות מימון, והפחת הוא עלות השימוש.</Rule>
        <P>איפה מציגים את הנכס וההתחייבות? יש שלושה כללים:</P>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
          <li>
            <T16 he="נכס בנפרד" par="סעיף 47(א)" />: בדוח או בביאור. אם רק בביאור, הוא נכלל בסעיף שבו היה מוצג אילו היה בבעלות, ומגלים באיזה סעיף.
          </li>
          <li>
            <T16 he="התחייבות בנפרד" par="סעיף 47(ב)" />: בדוח או בביאור, וגם כאן מגלים באיזה סעיף.
          </li>
          <li>
            <T16 he="נדל״ן להשקעה" par="סעיף 48" />: נכס זכות שימוש שהוא נדל״ן להשקעה מוצג כנדל״ן להשקעה, ולא בנפרד.
          </li>
        </ul>
        <Remember>אם בניתם את שני המעגלים, הדוחות כמעט מוכנים. נשאר לחלק את החוב לשוטף ולא שוטף.</Remember>
      </>
    ),
    check: quiz("ls-sub-show", [
      {
        q: "באיזה דוח מופיע החלק השוטף של התחייבות החכירה?",
        options: ["בדוח על המצב הכספי", "בדוח רווח או הפסד", "רק בביאור", "בשום דוח, רק ההתחייבות כולה"],
        answer: 0,
        why: "ההתחייבות מוצגת במצב הכספי, מחולקת לשוטף ולא שוטף.",
      },
    ]),
  },
  "ls-sub-worked": {
    lead: "ממשיכים עם מכונת הדפוס משיעור 3 עד הדוחות, לפי הסדר של תשובה במבחן: עלות, שני מעגלים, דוחות.",
    body: (
      <>
        <Story icon={<Printer />} title="מכונת הדפוס: תשלומים שעולים, ואופציה שתמומש">
          <p>
            זו אותה מכונה משיעור 3. ב-1.1 של שנה 1 בית הדפוס חכר אותה ל-{WORK.years} שנים. בסוף כל שנה הוא משלם <M v={WORK.payments[0]} /> בשנתיים הראשונות, ו-<M v={WORK.payments[2]} /> בשנתיים האחרונות. הריבית התוספתית {pct(WORK.rate)}.
          </p>
          <p>
            בסוף שנה {WORK.years} הוא יקנה את המכונה ב-<M v={WORK.option} />, כי ודאי באופן סביר שיממש את האופציה. אורך החיים של המכונה {WORK.life} שנים. בנוסף הוא משלם {WORK.perThousand} ש״ח לכל 1,000 עותקים.
          </p>
          <p className="font-semibold">נדרש: הציגו את הסעיפים הרלוונטיים בדוחות לכל {WORK.years} השנים.</p>
        </Story>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "עלות הנכס",
              body: (
                <p>
                  בשיעור 3 מצאנו את ההתחייבות, הערך הנוכחי של ארבעת התשלומים ומחיר האופציה: <Ltr>{`=NPV(6%;50000;50000;70000;85000) → ${n(WORK_S.cost)}`}</Ltr>. אין רכיבים אחרים, ולכן זו גם עלות הנכס. התשלום לפי עותקים לא בפנים.
                </p>
              ),
            },
            {
              title: "מעגל ההתחייבות",
              body: (
                <>
                  <p>
                    התשלום בסוף השנה, ולכן הריבית על כל היתרה שבפתיחה. בשנה 1: <Ltr>{`${n(WORK_S.rows[0].opening)} × 6% = ${n(WORK_S.rows[0].interest)}`}</Ltr>, וסגירה <Ltr>{`${n(WORK_S.rows[0].opening)} + ${n(WORK_S.rows[0].interest)} − ${n(WORK_S.rows[0].paidAtEnd)} = ${n(WORK_S.rows[0].closing)}`}</Ltr>.
                  </p>
                  <LiabilityCycle rows={WORK_S.rows} />
                  <p>
                    התשלום של שנה {WORK.years} הוא {n(WORK_S.rows[3].paidAtEnd)}: תשלום של {n(WORK.payments[3])} ומחיר האופציה, {n(WORK.option)}, באותו יום. בשנה הזו יש ריבית, כי כל החוב עומד עד 31.12. בדיקה ליתרה של שנה 3: <Ltr>{`=85000/1.06 → ${n(85_000 / 1.06)}`}</Ltr>. שקל הפרש מהטבלה הוא עיגול.
                  </p>
                </>
              ),
            },
            {
              title: "מעגל הנכס",
              body: (
                <>
                  <p>
                    בית הדפוס יקנה את המכונה, ולכן הפחת על פני {WORK.life} שנים, ולא {WORK.years} (סעיף 32): <Ltr>{`${n(WORK_S.cost)} ÷ ${WORK.life} = ${n(WORK_S.rows[0].depreciation)}`}</Ltr>.
                  </p>
                  <AssetCycle rows={WORK_S.rows} cost={WORK_S.cost} />
                  <p>
                    בסוף שנה {WORK.years} ההתחייבות באפס, אבל הנכס עדיין {n(WORK_S.rows[3].rightOfUse)}. זה תקין, כי המכונה תשרת את בית הדפוס עוד {WORK.life - WORK.years} שנים, והפחת ממשיך.
                  </p>
                </>
              ),
            },
            {
              title: "התשלום לפי עותקים",
              body: (
                <>
                  <p className="font-semibold">עותקים ÷ 1,000 × {WORK.perThousand} = הוצאה</p>
                  <p>
                    בשנה 1: <Ltr>{`${n(WORK.copies[0])} ÷ 1,000 × ${WORK.perThousand} = ${n(WORK_VARIABLE[0])}`}</Ltr>. התשלום הזה לא עובר דרך המעגלים. בכל שנה הוא הוצאה לפי העותקים של אותה שנה (סעיף 38(ב)).
                  </p>
                </>
              ),
            },
            {
              title: "שוטף ולא שוטף",
              body: (
                <p>
                  בסוף שנה 1 הלא שוטף הוא היתרה של סוף השנה הבאה, {n(WORK_S.rows[1].closing)}, והשוטף <Ltr>{`${n(WORK_S.rows[0].closing)} − ${n(WORK_S.rows[1].closing)} = ${n(WORK_S.rows[0].current)}`}</Ltr>. בסוף שנה 3 הכול שוטף, כי התשלום האחרון ומחיר האופציה משולמים בתוך 12 חודשים, ולא נשאר כלום אחריהם.
                </p>
              ),
            },
            {
              title: "הדוחות",
              body: (
                <>
                  <StatementTables sections={WORK_SECTIONS} />
                  <p>כל מספר כאן נלקח מהמעגלים או מהחישוב של העותקים. בסוף שנה {WORK.years} נשאר רק הנכס, והמכונה כבר של בית הדפוס.</p>
                </>
              ),
            },
            {
              title: "מלכודת נפוצה",
              body: <p>להפחית על פני {WORK.years} שנים כי ״זו תקופת החכירה״. האופציה בעלות הנכס, ולכן הפחת לאורך החיים.</p>,
            },
          ]}
        />
      </>
    ),
  },
  "ls-sub-fill": {
    lead: "הפעם אתם ממלאים. השנה הראשונה כבר מלאה, כדי שתראו את הדרך. בדקו כל תא בסוף.",
    body: (
      <TaskFrame label="טבלת דוחות למילוי">
        <TaskText>
          <p>{FILL_TASK.prompt}</p>
          <p className="mt-2">נדרש: השלימו את הסעיפים לשנים 2 ו-3.</p>
        </TaskText>
        <StatementFill task={FILL_TASK} />
      </TaskFrame>
    ),
  },
  "ls-sub-short": {
    lead: "כשהחכירה קצרה, התקן מרשה לוותר על הנכס ועל ההתחייבות, ופשוט לרשום את התשלומים כהוצאה. זו ההקלה הראשונה.",
    body: (
      <>
        <P>חברת ההובלה חכרה מחסן ל-8 חודשים לעונת השיא, בלי שום אופציה. היא לא חייבת לבנות שני מעגלים בשביל כמה חודשים. החישוב יעלה לה יותר ממה שהוא ייתן למי שקורא את הדוחות, כי החוב קטן ויסתיים בקרוב. כדי לדעת אם אפשר, שואלים שתי שאלות (נספח א׳):</P>
        <DecisionTree
          label="חכירה לטווח קצר. תקופת החכירה יותר מ-12 חודשים? אין הקלה. יש בחכירה אופציית רכישה? אין הקלה. אחרת, אפשר לבחור בהקלה"
          questions={[
            { q: "תקופת החכירה, במועד התחילה, ארוכה מ-12 חודשים?", yes: "אין הקלה", tone: "danger" },
            { q: "יש בחכירה אופציית רכישה, גם אם לא בטוח שתמומש?", yes: "אין הקלה", tone: "danger" },
          ]}
          fallback={{ label: "אפשר לבחור בהקלה לטווח קצר", tone: 1 }}
        />
        <Rule>בודקים את תקופת החכירה מהשיעור השני, ולא את אורך החוזה. אופציית הארכה שוודאי באופן סביר שתמומש נספרת בתקופה.</Rule>
        <P>הבחירה נעשית לפי קבוצה של נכסים דומים בשימוש דומה (סעיף 8). אם לחברה כמה מחסנים דומים בחכירות קצרות, או שכולם בהקלה, או שאף אחד מהם. אילו אפשר היה לבחור לכל מחסן בנפרד, חברות היו יכולות לבחור רק את החכירות שנוח להן להוציא מהמאזן.</P>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-short" items={SHORT_ITEMS} options={SHORT_OPTIONS} />
        </TaskFrame>
        <Remember>אם התקופה משתנה, או שהחוזה מתוקן, החכירה נחשבת חכירה חדשה, ובודקים הכול שוב (סעיף 7).</Remember>
      </>
    ),
  },
  "ls-sub-low": {
    lead: "ההקלה השנייה היא לנכס שגם כשהוא חדש עולה מעט, כמו טאבלט. כמה גדולה החברה שחוכרת אותו לא משנה.",
    body: (
      <>
        <P>
          טאבלט הוא נכס בעל ערך נמוך גם אצל עסק קטן שעבורו זו הוצאה גדולה, כי ההערכה מוחלטת (ב4). אחרת אותו טאבלט היה מקבל טיפול אחר אצל כל חברה. משאית ישנה שכמעט לא שווה כלום היא לא נכס בעל ערך נמוך, כי מעריכים לפי הערך של נכס <strong>חדש</strong> (ב3). אחרת היה אפשר להוציא מהמאזן כל נכס יקר, פשוט כי הוא ישן.
        </P>
        <DecisionTree
          label="נכס בעל ערך נמוך. כשהוא חדש הוא יקר? אין הקלה. אי אפשר להפיק ממנו תועלת לבדו, או שהוא תלוי מאוד בנכסים אחרים? אין הקלה. אחרת, אפשר לבחור בהקלה, לכל חכירה בנפרד"
          questions={[
            { q: "נכס כזה, כשהוא חדש, הוא יקר?", yes: "אין הקלה", tone: "danger" },
            { q: "אי אפשר להפיק ממנו תועלת לבדו, או שהוא תלוי מאוד בנכסים אחרים (ב5)?", yes: "אין הקלה", tone: "danger" },
          ]}
          fallback={{ label: "אפשר לבחור בהקלה, לכל חכירה בנפרד (סעיף 8)", tone: 1 }}
        />
        <P>גם חוכר שמחכיר את הנכס הלאה, או מצפה לעשות זאת, אינו יכול לטפל בחכירה הראשית כחכירה של נכס בעל ערך נמוך (ב7).</P>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-low" items={LOW_ITEMS} options={LOW_OPTIONS} />
        </TaskFrame>
        <Rule>
          בטווח קצר בוחרים <strong>לפי קבוצה</strong>. בערך נמוך בוחרים <strong>לכל חכירה</strong>.
        </Rule>
        <Remember>מעריכים את הנכס כשהוא חדש, בלי קשר לגודל החוכר.</Remember>
      </>
    ),
  },
  "ls-sub-line": {
    lead: "בהקלה אין נכס ואין התחייבות. לוקחים את כל התשלומים ופורסים אותם בשווה על תקופת החכירה.",
    body: (
      <>
        <Story icon={<Store />} title="דוכן לשנה">
          <p>
            חברה חכרה דוכן ל-{KIOSK.months} חודשים החל מ-1.7, ובחרה בהקלה לטווח קצר. {KIOSK.free} החודשים הראשונים בחינם, ובכל חודש אחריהם <M v={KIOSK.monthly} />.
          </p>
        </Story>
        <Timeline
          label="שנים עשר חודשים מ-1.7. חודשיים ראשונים בחינם, ואחריהם תשלום בכל חודש. ההוצאה נרשמת בשווה בכל החודשים. עד 31.12 עוברים שישה חודשים"
          title="התשלומים לא שווים, וההוצאה כן"
          from={0}
          to={KIOSK.months}
          ticks={[
            { at: 0, label: "1.7" },
            { at: KIOSK.free, label: "1.9" },
            { at: KIOSK.inFirstYear, label: "31.12" },
            { at: KIOSK.months, label: "30.6" },
          ]}
          spans={[
            { from: 0, to: KIOSK.free, label: "חינם", tone: 4 },
            { from: KIOSK.free, to: KIOSK.months, label: `תשלום ${n(KIOSK.monthly)} בחודש`, tone: 3 },
            { from: 0, to: KIOSK.months, label: `הוצאה של ${n(KIOSK_PER_MONTH)} בכל חודש`, tone: 1, row: 1 },
          ]}
        />
        <P>בחודשיים החינמיים החברה משתמשת בדוכן בדיוק כמו בשאר החודשים. אם נרשום הוצאה רק כשמשלמים, ייראה כאילו הדוכן לא עלה לה כלום, ובחודשים האחרים ההוצאה תהיה גבוהה מדי. לכן פורסים.</P>
        <Part title="הקו הישר (סעיף 6)">
          <p className="text-[15.5px] font-semibold">סך התשלומים ÷ תקופת החכירה = הוצאה לתקופה</p>
          <p>
            <Ltr>{`10 × ${n(KIOSK.monthly)} = ${n(KIOSK_TOTAL)}`}</Ltr>
          </p>
          <p>
            <Ltr>{`${n(KIOSK_TOTAL)} ÷ ${KIOSK.months} = ${n(KIOSK_PER_MONTH)}`}</Ltr>
          </p>
          <P>אם בסיס שיטתי אחר מייצג טוב יותר את התבנית שבה החוכר נהנה מהנכס, חייבים להשתמש בו.</P>
        </Part>
        <P>
          ב-31.12 עברו 6 חודשים. ההוצאה עד כאן היא <Ltr>{`${n(KIOSK_TOTAL)} ÷ ${KIOSK.months} × ${KIOSK.inFirstYear} = ${n(KIOSK_EXPENSE)}`}</Ltr>. שולמו רק 4 חודשים: <Ltr>{`4 × ${n(KIOSK.monthly)} = ${n(KIOSK_PAID)}`}</Ltr>. הפער נרשם כהוצאות לשלם, כלומר הוצאה שנרשמה ועוד לא שולמה. זו התחייבות:
        </P>
        <Tbl
          head={["הוצאות לשלם", "סכום"]}
          rows={[
            ["ההוצאה שנרשמה עד 31.12", -KIOSK_EXPENSE],
            ["התשלומים עד 31.12", KIOSK_PAID],
          ]}
          foot={["יתרה ב-31.12", -KIOSK_ACCRUED]}
        />
        <JournalEntry
          title="עד 31.12, בסיכום"
          lines={[
            { account: "הוצאות חכירה", dr: KIOSK_EXPENSE },
            { account: "מזומן", cr: KIOSK_PAID },
            { account: "הוצאות לשלם", cr: KIOSK_ACCRUED },
          ]}
        />
        <P>בששת החודשים הבאים ההוצאה שוב {n(KIOSK_EXPENSE)}, אבל משלמים {n(KIOSK.monthly * 6)}. הפער סוגר את היתרה, וב-30.6 היא אפס.</P>
        <Part title="מה ההקלה משנה">
          <P>אותה חכירה, פעם בהקלה ופעם במודל המלא. לאורך כל התקופה ההוצאה זהה, ורק העיתוי שונה.</P>
          <YearCompare
            label={`מחשבים ניידים ל-${LAPTOP.years} שנים, ${LAPTOP.payment} בשנה: בהקלה הוצאה שווה בכל שנה, במודל המלא הוצאה יורדת. הסכום הכולל זהה`}
            title={`מחשבים ניידים: ${LAPTOP.payment.toLocaleString("en-US")} ש״ח בסוף כל שנה, ריבית ${pct(LAPTOP.rate)}`}
            unit="הוצאה לכל שנה, בש״ח"
            columns={[
              { name: "הקלה: קו ישר", values: Array(LAPTOP.years).fill(LAPTOP.payment), tone: 1 },
              { name: "מודל מלא: פחת וריבית", values: LAPTOP_FULL, tone: 3 },
            ]}
            note="המודל המלא רק מקדים הוצאה, כי הריבית גבוהה בהתחלה."
          />
        </Part>
        <Remember>בהקלה אין במאזן נכס או התחייבות חכירה. בדוח רווח או הפסד יש הוצאה אחת, בלי ריבית ובלי פחת.</Remember>
      </>
    ),
    check: quiz("ls-sub-line", [
      {
        q: "חכירה ל-10 חודשים החל מ-1.11, בהקלה לטווח קצר. סך התשלומים 20,000 ש״ח. מהי ההוצאה בשנה שמסתיימת ב-31.12?",
        options: ["4,000 ש״ח", "20,000 ש״ח", "2,000 ש״ח", "0 ש״ח, אם עוד לא שולם"],
        answer: 0,
        why: "20,000 ÷ 10 = 2,000 לחודש. עד 31.12 עברו שני חודשים: 4,000.",
      },
    ]),
  },
  "ls-sub-cash": {
    lead: "גם בדוח על תזרימי המזומנים מפצלים את התשלום, כמו בפקודת היומן. הקרן לחוד, והריבית לחוד.",
    body: (
      <>
        <Story icon={<Truck />} title="המשאית, שנה 1">
          <p>
            מתוך התשלום של <M v={TRUCK.payment} />, <M v={TRUCK_END.rows[0].interest} /> הם ריבית. השאר, <Ltr>{`${n(TRUCK.payment)} − ${n(TRUCK_END.rows[0].interest)} = ${n(TRUCK.payment - TRUCK_END.rows[0].interest)}`}</Ltr>, הוא קרן, כלומר החלק שמקטין את החוב.
          </p>
          <p>החזר של חוב הוא פעילות מימון, ולכן הקרן נכנסת לשם. הריבית מסווגת לפי מה ש-IAS 7 קובע לכל ריבית ששולמה.</p>
        </Story>
        <Tbl
          head={["מה שולם", "איפה בדוח", "סעיף"]}
          rows={[
            ["הקרן בתשלום החכירה", "פעילות מימון", "50(א)"],
            ["הריבית בתשלום החכירה", "לפי IAS 7", "50(ב)"],
            ["חכירה בהקלה, ותשלום משתנה שלא בהתחייבות", "פעילות שוטפת", "50(ג)"],
          ]}
        />
        <P>בשורה האחרונה אין החזר של חוב, כי התשלומים האלה מעולם לא היו בהתחייבות. הם הוצאה רגילה של השנה, ולכן הם בפעילות השוטפת.</P>
        <TaskFrame label="שאלת מיון" icon={<Banknote className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-cash" items={CASH_ITEMS} options={CASH_OPTIONS} />
        </TaskFrame>
        <Remember>במודל המלא מפרידים בכל תשלום בין קרן לריבית. הקרן תמיד בפעילות מימון (סעיף 50).</Remember>
      </>
    ),
  },
  "ls-sub-drill": {
    lead: "כל לחיצה נותנת חכירה חדשה. למעלה שאלה ממוקדת, ולמטה דוחות שלמים למילוי.",
    body: (
      <>
        <LeaseDrill families={["cycle", "dep", "split"]} />
        <StatementDrill />
      </>
    ),
  },
  "ls-sub-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנט">
        <p>החוזה: תנור תעשייתי ל-5 שנים, 40,000 ש״ח בסוף כל שנה, בריבית 6%. אורך החיים 9 שנים. בסוף התקופה ודאי באופן סביר שהחברה תקנה את התנור ב-5,000 ש״ח.</p>
        <p>הפתרון: ״הורדתי את התשלום של השנה מהיתרה, ועל מה שנשאר חישבתי ריבית. את הפחת פרסתי על 5 שנים, כי זו תקופת החכירה. בחלק השוטף ב-31.12 רשמתי את כל התשלום הבא, 40,000 ש״ח.״</p>
      </Story>
    ),
    check: quiz("ls-sub-mistake", [
      {
        q: "מה הטעות בריבית?",
        options: ["התשלום יוצא רק ב-31.12, ולכן הריבית על כל היתרה שבפתיחה", "הריבית צריכה להיות על עלות הנכס", "הריבית צריכה להיות על סך התשלומים", "אין טעות"],
        answer: 0,
        why: "כל השנה החוב עומד במלואו. הורדת התשלום לפני הריבית מתאימה רק לתשלום ב-1.1.",
      },
      {
        q: "מה הטעות בפחת?",
        options: ["העלות כוללת אופציית רכישה שתמומש, ולכן הפחת על פני 9 שנים", "הפחת צריך להיות על פני 14 שנים", "אין פחת על נכס זכות שימוש", "אין טעות"],
        answer: 0,
        why: "סעיף 32: התנור יישאר אצל החברה, ולכן לאורך החיים.",
      },
      {
        q: "מה הטעות בחלק השוטף?",
        options: ["חלק מהתשלום הבא הוא ריבית שעוד לא נוצרה, ולכן השוטף הוא רק הירידה ביתרה", "החלק השוטף הוא כל היתרה", "אין חלק שוטף בחכירה", "אין טעות"],
        answer: 0,
        why: "כשמשלמים בסוף שנה, הלא שוטף הוא היתרה של סוף השנה הבאה, והשוטף הוא ההפרש.",
      },
    ]),
  },
  "ls-sub-master": {
    lead: "כמו במבחן: חוזה אחד, שתי חכירות ותחזוקה, עד הדוחות. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״דרור לוגיסטיקה״ חתמה על חוזה אחד ל-{MASTER.years} שנים: מלגזה מסוימת, טנדר מסוים, ושירותי תחזוקה למלגזה. התשלום הכולל <Money v={MASTER.yearly} /> בסוף כל שנה. אפשר להשתמש בכל כלי בלי קשר לשני.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                מחירים נפרדים לכל התקופה: מלגזה <Money v={MASTER.forklift} />, טנדר <Money v={MASTER.van} />, תחזוקה <Money v={MASTER.service} />.
              </li>
              <li>הריבית הגלומה לא ידועה. הריבית התוספתית {pct(MASTER.rate)}.</li>
              <li>החברה מפחיתה בקו ישר, והכלים חוזרים למחכיר בסוף התקופה. אורך החיים של שניהם 8 שנים.</li>
            </ul>
            <p className="mt-2 font-semibold">נדרש:</p>
            <ol className="mt-1 list-decimal space-y-1.5 ps-5">
              <li>החברה מפרידה רכיבים. הציגו את הסעיפים הרלוונטיים בדוחות לשתי השנים הראשונות.</li>
              <li>
                במקום זאת החברה בוחרת בהקלה של סעיף 15 למלגזה, והמחיר הנפרד של מלגזה עם תחזוקה הוא <Money v={MASTER.forkliftWithService} />. הציגו שוב את הסעיפים.
              </li>
            </ol>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                {
                  title: "סעיף 1: הקצאת התשלום",
                  body: (
                    <Tbl
                      dense head={["רכיב", "מחיר נפרד", "לתקופה", "לשנה"]}
                      rows={[
                        ["מלגזה", MASTER.forklift, MASTER_SHARES[0], MASTER_YEARLY[0]],
                        ["טנדר", MASTER.van, MASTER_SHARES[1], MASTER_YEARLY[1]],
                        ["תחזוקה", MASTER.service, MASTER_SHARES[2], MASTER_YEARLY[2]],
                      ]}
                      foot={["סך הכול", MASTER.forklift + MASTER.van + MASTER.service, MASTER_TOTAL, MASTER.yearly]}
                    />
                  ),
                },
                {
                  title: "סעיף 1: מלגזה",
                  body: (
                    <>
                      <p>
                        <Ltr>{`=PV(6%;4;-${MASTER_YEARLY[0]}) → ${n(MASTER_FORKLIFT.cost)}`}</Ltr>
                      </p>
                      <LiabilityCycle rows={MASTER_FORKLIFT.rows.slice(0, 2)} />
                      <AssetCycle rows={MASTER_FORKLIFT.rows.slice(0, 2)} cost={MASTER_FORKLIFT.cost} />
                    </>
                  ),
                },
                {
                  title: "סעיף 1: טנדר",
                  body: (
                    <>
                      <p>
                        <Ltr>{`=PV(6%;4;-${MASTER_YEARLY[1]}) → ${n(MASTER_VAN.cost)}`}</Ltr>
                      </p>
                      <LiabilityCycle rows={MASTER_VAN.rows.slice(0, 2)} />
                      <AssetCycle rows={MASTER_VAN.rows.slice(0, 2)} cost={MASTER_VAN.cost} />
                    </>
                  ),
                },
                {
                  title: "סעיף 1: הדוחות, שני הכלים יחד",
                  body: (
                    <>
                      <StatementTables sections={MASTER_LINES} />
                      <p>
                        התחזוקה, <Money v={MASTER_YEARLY[2]} /> בשנה, אינה חכירה. לכן היא לא בהתחייבות ולא בנכס, והיא הוצאה רגילה.
                      </p>
                    </>
                  ),
                },
                {
                  title: "סעיף 2: עם ההקלה",
                  body: (
                    <>
                      <Tbl
                        dense head={["רכיב", "מחיר נפרד", "לתקופה", "לשנה"]}
                        rows={[
                          ["מלגזה עם תחזוקה", MASTER.forkliftWithService, MASTER_EXP_SHARES[0], MASTER_EXP_YEARLY[0]],
                          ["טנדר", MASTER.van, MASTER_EXP_SHARES[1], MASTER_EXP_YEARLY[1]],
                        ]}
                        foot={["סך הכול", MASTER.forkliftWithService + MASTER.van, MASTER_TOTAL, MASTER.yearly]}
                      />
                      <p>
                        מלגזה: <Ltr>{`=PV(6%;4;-${MASTER_EXP_YEARLY[0]}) → ${n(MASTER_EXP_FORKLIFT.cost)}`}</Ltr>. טנדר: {n(MASTER_EXP_VAN.cost)}.
                      </p>
                      <StatementTables sections={MASTER_EXP_LINES} />
                      <p>אין עוד שורת תחזוקה: היא נכנסה לחכירה, ולכן הנכס וההתחייבות גדלו, וההוצאות יעברו דרך פחת וריבית.</p>
                    </>
                  ),
                },
                {
                  title: "מלכודת נפוצה",
                  body: <p>להוון את כל {n(MASTER.yearly)} בשנה. בסעיף 1 התחזוקה אינה חכירה, ובסעיף 2 רק היא מתאחדת עם המלגזה. הטנדר נשאר בנפרד בשני המקרים.</p>,
                },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אפשר ללכת עם חכירה עד סופה, כל עוד שום דבר לא משתנה. ומה אם המדד עולה, או שהחוזה משתנה?">
          בשיעור הבא: הערכה מחדש ותיקוני חכירה.
        </Bridge>
      </>
    ),
  },
};
