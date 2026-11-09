import { Caravan, Handshake, Landmark, ListChecks, PiggyBank, Printer, Search, Stethoscope, Sun, Truck, Warehouse } from "lucide-react";
import type { ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import * as L from "@/lib/study/ifrs16/lessons/lessor";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { TwoPanel, WrongRight } from "./ias19-visuals";
import { DecisionWalk, LeaseDrill, ResidualBar } from "./ifrs16-interactive";
import { FullSolution, P, quiz, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 6: the lessor. Every figure comes from
 * lib/study/ifrs16/lessons/lessor.ts, in whole shekels, and every table adds up.
 * Tables of balances and movements read debit plus, credit minus.
 */

const M = ({ v, plain }: { v: number; plain?: boolean }) => <Money v={Math.round(v)} plain={plain} />;
const pct = (r: number, d = 2) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");

/** A formula in the course's words: the numbers follow it in Ltr. */
const Formula = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] font-semibold">{children}</p>;

/** A net investment's movement, a column a year. */
function Invest({ rows }: { rows: L.InvestRow[] }) {
  const head = rows.map((y) => `שנה ${y.year}`);
  return (
    <Tbl
      dense
      head={["השקעה נטו", ...head]}
      rows={[
        ["יתרה ב-1.1", ...rows.map((y) => y.opening)],
        ["הכנסות מימון", ...rows.map((y) => y.income)],
        ["תקבול", ...rows.map((y) => -y.receipt)],
      ]}
      foot={["יתרה ב-31.12", ...rows.map((y) => y.closing)]}
    />
  );
}

/** Where the balance sits on 31.12: current and non-current. */
function Split({ rows }: { rows: L.InvestRow[] }) {
  return (
    <Tbl
      dense
      head={["מצב כספי, 31.12", ...rows.map((y) => `שנה ${y.year}`)]}
      rows={[
        ["השקעה נטו, שוטפת", ...rows.map((y) => y.current)],
        ["השקעה נטו, לא שוטפת", ...rows.map((y) => y.nonCurrent)],
      ]}
    />
  );
}

/** A total as one bar, in the colours of the residual bar in lesson 3: what it is made of, part by part. */
function PartsBar({ label, title, parts }: { label: string; title: ReactNode; parts: { name: ReactNode; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <figure role="img" aria-label={label} className="space-y-2 rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="text-[14.5px] font-semibold text-fg">{title}</figcaption>
      <div className="flex h-11 overflow-hidden rounded-lg border border-line-strong">
        {parts.map((p, i) => (
          <span key={i} className="flex items-center justify-center overflow-hidden whitespace-nowrap text-[13px] font-semibold text-fg" style={{ width: `${(p.value / total) * 100}%`, background: `color-mix(in oklab, ${p.color} 22%, transparent)` }}>
            {p.value / total >= 0.2 ? <bdi dir="ltr">{n(p.value)}</bdi> : ""}
          </span>
        ))}
      </div>
      <ul className="space-y-1 text-[14px] text-fg">
        {parts.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: `color-mix(in oklab, ${p.color} 45%, transparent)` }} aria-hidden />
            <span>
              {p.name}: <bdi dir="ltr">{n(p.value)}</bdi> ש״ח
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

const SURE = "var(--accent)";
const UNSURE = "var(--fg)";
const RES_UN_AFTER = L.RES.newEstimate - L.RES.guaranteed;
const RES_I = pct(L.RES_RATE, 4);
const RES_FACTOR = (1 + L.RES_RATE).toFixed(6);
const OP_LAST = L.OP_ROWS.length - 1;

export const IFRS16_LESSOR_SCREENS: Record<string, ScreenContent> = {
  "ls-lsr-hook": {
    lead: "אותו חוזה, מהצד השני. החוכר עובד במודל אחד. המחכיר צריך לשאול קודם: האם בפועל מכרתי?",
    body: (
      <>
        <Story icon={<Handshake />} title="שני בעלי משאיות">
          <p>בעל משאית אחד מחכיר אותה לשנתיים, ומקבל אותה בחזרה. הוא נשאר בעל הנכס, והוא זה שסופג אם ערכה יורד.</p>
          <p>השני מחכיר את המשאית לכל חייה, ובסוף היא של החוכר. בפועל הוא מכר אותה, ומימן את הקונה.</p>
        </Story>
        <P>
          מה שמבדיל ביניהם הוא מי נושא ב<strong>סיכונים ובהטבות</strong> של הנכס. סיכון הוא למשל שהערך ירד, שהנכס יתיישן או שיעמוד בלי עבודה. הטבה היא שהנכס ירוויח, או שערכו יעלה. אם למעשה כל אלה עברו לחוכר, החכירה מימונית. אחרת היא תפעולית (סעיף 62).
        </P>
        <P>למה החוכר לא מסווג? כי אצלו התמונה זהה בכל חכירה: הוא חייב תשלומים, ויש לו זכות להשתמש. אצל המחכיר התמונה תלויה בתשובה. אם הוא בעצם מכר, אין לו יותר נכס, יש לו חוב לגבות. אילו היה ממשיך להציג את הנכס בספרים, הדוחות היו מתארים בעלות שכבר אין לו.</P>
        <TwoPanel
          label="שני מודלים. תפעולית: הנכס נשאר בספרים, עם הכנסה בקו ישר ופחת. מימונית: הנכס יוצא, ובמקומו השקעה נטו עם הכנסות מימון"
          panels={[
            { title: "תפעולית", icon: <Truck />, steps: ["הנכס נשאר בספרים", "הכנסה בקו ישר, ופחת"], verdict: "כמו שכירות", tone: 1 },
            { title: "מימונית", icon: <Landmark />, steps: ["הנכס יוצא מהספרים", "השקעה נטו, והכנסות מימון"], verdict: "כמו מכירה ומימון", tone: 3 },
          ]}
        />
        <Rule>רק המחכיר מסווג (סעיף 61). החוכר רושם תמיד באותה דרך.</Rule>
      </>
    ),
  },
  "ls-lsr-class": {
    lead: "מה שקובע הוא מה קרה בפועל לסיכונים ולהטבות. התקן נותן רשימת סימנים, וכל אחד מהם בדרך כלל מספיק כדי שהחכירה תהיה מימונית.",
    body: (
      <>
        <P>כל סימן הוא דרך אחרת לשאול אם החוכר התנהג כמו קונה. כדאי לזכור את ההיגיון של כל אחד, כי בשאלה הניסוח ישתנה:</P>
        <Tbl
          head={["הסימן", "למה זה נראה כמו מכירה", "סעיף"]}
          rows={[
            ["הבעלות עוברת בסוף", "הנכס יהיה של החוכר, עם כל מה שיקרה לערכו", "63(א)"],
            ["אופציית רכישה זולה", "ברור כבר היום שהוא יקנה, אז זה כמו בעלות שעוברת", "63(ב)"],
            ["החלק העיקרי של החיים הכלכליים", "החוכר ינצל את רוב הנכס, ומה שיחזור למחכיר שווה מעט", "63(ג)"],
            ["ערך נוכחי של התשלומים, למעשה כל השווי", "החוכר משלם כמעט את כל מחיר הנכס, כמו קנייה בתשלומים", "63(ד)"],
            ["נכס ייחודי לחוכר", "אחריו אין מי שישתמש בנכס בלי שינויים גדולים", "63(ה)"],
          ]}
        />
        <P>עכשיו ענו על השאלות, ותראו לאן מגיעים.</P>
        <DecisionWalk nodes={L.CLASS_WALK} start={L.CLASS_WALK_START} label="מסווגים חכירה" again="מסווגים חכירה אחרת" />
        <WrongRight
          label="טעות: 75% ו-90% הם כללים בתקן. נכון: הם כללי אצבע, והתקן מדבר על חלק עיקרי ועל למעשה כל השווי"
          wrong={<p>״72% מהחיים? התקן אומר שזו תפעולית.״</p>}
          right={<p>בתקן כתוב ״החלק העיקרי״ ו״למעשה כל השווי ההוגן״. 75% ו-90% הם נוהג מקובל, שעוזר בשאלות כשאין נתון נוסף.</p>}
        />
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-lsr-class" items={L.CLASS_ITEMS} options={L.CLASS_OPTIONS} />
        </TaskFrame>
        <Remember>הסימנים לא תמיד חד משמעיים. אם ברור ממאפיינים אחרים שהסיכונים לא עברו, החכירה תפעולית (סעיף 65).</Remember>
      </>
    ),
  },
  "ls-lsr-when": {
    lead: "מסווגים פעם אחת, במועד ההתקשרות. אחר כך משנים רק אם יש תיקון בחוזה.",
    body: (
      <>
        <P>
          <strong>מועד ההתקשרות</strong> הוא היום שבו הצדדים התחייבו לעסקה, ושם קובעים את הסיווג. <strong>מועד התחילה</strong> הוא היום שבו הנכס נמסר לחוכר, ואז מתחילים לרשום.
        </P>
        <P>הסיווג מתאר את העסקה שנחתמה, ולכן הוא לא זז כשהמציאות זזה. גם אם אחרי שנתיים מתברר שהמכונה תחיה יותר ממה שחשבו, החוזה לא השתנה. אילו היינו מסווגים מחדש בכל שינוי אומדן, נכס היה יוצא מהספרים וחוזר אליהם רק בגלל הערכה חדשה.</P>
        <Tbl
          head={["מה קרה", "מסווגים מחדש?"]}
          rows={[
            ["תיקון חכירה", "כן (סעיף 66). בשיעור הבא"],
            ["שינוי באומדן החיים הכלכליים או השייר", "לא"],
            ["שינוי בנסיבות, כמו כשל של החוכר", "לא"],
          ]}
        />
      </>
    ),
    check: quiz("ls-lsr-when", [
      {
        q: "חכירה סווגה כמימונית. אחר כך החוכר נקלע לקשיים. מה עושים?",
        options: ["לא מסווגים מחדש. בוחנים ירידת ערך לפי IFRS 9", "מסווגים כתפעולית", "מחזירים את הנכס לספרים", "מבטלים את הרווח"],
        answer: 0,
        why: "סעיף 66 וסעיף 77.",
      },
    ]),
  },
  "ls-lsr-op": {
    lead: "בתפעולית המחכיר נשאר בעל הנכס וגובה שכירות. ההכנסה נפרסת שווה בשווה על השנים, גם בשנה שלא נכנס בה שקל.",
    body: (
      <>
        <Story icon={<Warehouse />} title="מחסן קירור עם שנה ראשונה בחינם">
          <p>
            ב-1.1 של שנה 1 חברה סיימה לבנות מחסן קירור בעלות <M v={L.OP.cost} />, עם {L.OP.life} שנות חיים ופחת בקו ישר. באותו יום היא מחכירה אותו לרשת מזון ל-{L.OP.years} שנים. כדי לסגור את העסקה היא נותנת לרשת את השנה הראשונה בחינם, ומשנה 2 הרשת משלמת <M v={L.OP.rents[1]} /> בסוף כל שנה. למתווך שמצא את הרשת שילמה החברה <M v={L.OP.fee} /> ביום החתימה.
          </p>
        </Story>
        <P>
          סיווג: {L.OP.years} מתוך {L.OP.life} שנים. כל התשלומים ביחד <M v={L.OP_TOTAL} />, מול מחסן ששווה <M v={L.OP.fairValue} />. אין העברת בעלות ואין אופציה. המחסן יחזור לחברה עם רוב ערכו, ולכן הסיכונים וההטבות נשארים אצלה, והחכירה <T16 he="תפעולית" />.
        </P>
        <P>המחסן נשאר בספרים לפי מהותו, כרכוש קבוע (סעיף 88). גם סוחר לא היה רושם כאן רווח ממכירה, כי לא הייתה מכירה (סעיף 86). נשארו שלוש שאלות: כמה הכנסה בכל שנה, מה עושים עם ההפרש מהמזומן, ומה עושים עם העמלה.</P>
        <Part title="ההכנסה: קו ישר">
          <P>למה לא פשוט לרשום הכנסה כשהכסף נכנס? המחסן מוחכר כל שנה באותה מידה. אילו הלכנו אחרי הכסף, שנה 1 הייתה מראה הכנסה אפס ופחת מלא, כאילו החברה הפסידה, ובשנה 4 היא הייתה נראית רווחית יותר ממה שהיא באמת. לכן סופרים את כל התשלומים של החוזה, ומחלקים בשווה (סעיף 81).</P>
          <Formula>הכנסה בשנה = סך התשלומים ÷ שנות החכירה</Formula>
          <p>
            <Ltr>{`(0 + 40,000 + 40,000 + 40,000) ÷ ${L.OP.years} = ${n(L.OP_INCOME)}`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{`=SUM(0;40000;40000;40000)/${L.OP.years} → ${n(L.OP_INCOME)}`}</Ltr>
          </p>
        </Part>
        <Part title="ההפרש מהמזומן: הכנסות לקבל">
          <P>
            בשנה 1 נרשמו {n(L.OP_INCOME)} של הכנסה, ולא נכנס כלום. החברה הרוויחה כסף שיגיע מאוחר יותר, וזו זכות שנרשמת כנכס בשם <strong>הכנסות לקבל</strong>. בשנים הבאות נכנס יותר מההכנסה, והיתרה יורדת עד אפס בסוף החוזה.
          </P>
          <Formula>הכנסות לקבל = הכנסה מצטברת − תקבולים מצטברים</Formula>
          <p>
            <Ltr>{`${n(L.OP_INCOME * 2)} − ${n(L.OP.rents[1])} = ${n(L.OP_ROWS[1].accrued)}`}</Ltr>, בסוף שנה 2.
          </p>
          <Tbl
            dense
            head={["הכנסות לקבל", "שנה 1", "שנה 2", "שנה 3", "שנה 4"]}
            rows={[
              ["יתרה ב-1.1", ...L.OP_ROWS.map((y) => y.accruedOpen)],
              ["הכנסה בקו ישר", ...L.OP_ROWS.map((y) => y.income)],
              ["תקבול", ...L.OP_ROWS.map((y) => -y.rent)],
            ]}
            foot={["יתרה ב-31.12", ...L.OP_ROWS.map((y) => y.accrued)]}
          />
          <JournalEntry
            title="31.12 של שנה 1"
            lines={[
              { account: "הכנסות לקבל", dr: L.OP_INCOME },
              { account: "הכנסות מהשכרה", cr: L.OP_INCOME },
            ]}
          />
          <JournalEntry
            title="31.12 של שנה 2"
            lines={[
              { account: "מזומן", dr: L.OP.rents[1] },
              { account: "הכנסות לקבל", cr: L.OP.rents[1] - L.OP_INCOME },
              { account: "הכנסות מהשכרה", cr: L.OP_INCOME },
            ]}
          />
        </Part>
        <Part title="העמלה: על הנכס, ונפרסת על החכירה">
          <P>
            העמלה היא <strong>עלות ישירה ראשונית</strong>: הוצאה שלא הייתה קורה בלי החוזה. אילו רשמנו אותה מיד כהוצאה, שנה 1 הייתה סופגת עלות שמביאה הכנסה ל-{L.OP.years} שנים. לכן מוסיפים אותה לערך המחסן בספרים, ומורידים אותה כהוצאה לאורך החכירה, באותו בסיס של ההכנסה (סעיף 83). היא לא נפרסת על {L.OP.life} שנות החיים, כי החוזה שהיא השיגה נגמר אחרי {L.OP.years}.
          </P>
          <JournalEntry
            title="1.1 של שנה 1"
            lines={[
              { account: "מחסן", dr: L.OP.fee },
              { account: "מזומן", cr: L.OP.fee },
            ]}
          />
          <Formula>הוצאה בשנה = עלות ÷ שנות חיים + עלות ישירה ÷ שנות חכירה</Formula>
          <p>
            <Ltr>{`${n(L.OP.cost)} ÷ ${L.OP.life} + ${n(L.OP.fee)} ÷ ${L.OP.years} = ${n(L.OP_DEP)} + ${n(L.OP_IDC_YEAR)} = ${n(L.OP_EXPENSE)}`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{`=${L.OP.cost}/${L.OP.life}+${L.OP.fee}/${L.OP.years} → ${n(L.OP_EXPENSE)}`}</Ltr>
          </p>
          <P>הפחת של המחסן עצמו הוא הפחת הרגיל של החברה (סעיף 84). אם יהיו סימנים לירידת ערך, בודקים לפי IAS 36, כמו בכל נכס אחר (סעיף 85).</P>
          <Tbl
            dense
            head={["מחסן, נטו", "שנה 1", "שנה 2", "שנה 3", "שנה 4"]}
            rows={[
              ["יתרה ב-1.1", ...L.OP_ROWS.map((y) => y.assetOpen)],
              ["פחת", ...L.OP_ROWS.map((y) => -y.expense)],
            ]}
            foot={["יתרה ב-31.12", ...L.OP_ROWS.map((y) => y.asset)]}
          />
          <P>
            אחרי {L.OP.years} שנים העמלה נגמרה לגמרי, ונשאר ערך המחסן עצמו: <Ltr>{`${n(L.OP.cost)} − ${L.OP.years} × ${n(L.OP_DEP)} = ${n(L.OP_ROWS[OP_LAST].asset)}`}</Ltr>.
          </P>
        </Part>
        <Part title="הדוחות">
          <Tbl
            dense
            head={["רווח או הפסד", "שנה 1", "שנה 2", "שנה 3", "שנה 4"]}
            rows={[
              ["הכנסות מהשכרה", ...L.OP_ROWS.map((y) => -y.income)],
              ["פחת", ...L.OP_ROWS.map((y) => y.expense)],
            ]}
            foot={["סך הכול", ...L.OP_ROWS.map((y) => y.expense - y.income)]}
          />
          <Tbl
            dense
            head={["מצב כספי, 31.12", "שנה 1", "שנה 2", "שנה 3", "שנה 4"]}
            rows={[
              ["מחסן, נטו", ...L.OP_ROWS.map((y) => y.asset)],
              ["הכנסות לקבל", ...L.OP_ROWS.map((y) => y.accrued)],
            ]}
          />
          <P>ארבע השנים נראות אותו דבר ברווח או הפסד, אף שהמזומן שונה לגמרי. בשביל זה נועד הקו הישר.</P>
        </Part>
        <Part title="קו ישר תמיד?">
          <P>התקן מחייב בסיס שיטתי אחר, אם הוא מייצג טוב יותר את הדרך שבה ההטבה מהנכס מתמעטת (סעיף 81). שנה בחינם או תשלום שעולה לא מספיקים לזה, כי הם מספרים על הכסף ולא על השימוש בנכס. בשאלה, אם לא נאמר אחרת, הולכים בקו ישר.</P>
        </Part>
      </>
    ),
    check: quiz("ls-lsr-op", [
      {
        q: "חכירה תפעולית: 10,000 בשנה הראשונה, 20,000 בשנייה. מה ההכנסה בשנה הראשונה?",
        options: ["15,000 ש״ח", "10,000 ש״ח", "20,000 ש״ח", "30,000 ש״ח"],
        answer: 0,
        why: "(10,000 + 20,000) ÷ 2 = 15,000.",
      },
    ]),
  },
  "ls-lsr-nondealer": {
    lead: "המחכיר כאן לא סוחר בנכס. הוא מוסר אותו, מקבל במקומו חוב של החוכר, ומכאן והלאה מרוויח ריבית, כמו בנק.",
    body: (
      <>
        <Story icon={<Printer />} title="מכונת דפוס שיוצאת מהמפעל">
          <p>
            בית דפוס החליף מכונה, והישנה עומדת בלי עבודה. הוא לא סוחר במכונות, והיא רשומה אצלו כרכוש קבוע ב-<M v={L.PRESS.bookValue} />. שוויה ההוגן היום <M v={L.PRESS.fairValue} />.
          </p>
          <p>
            ב-1.1 של שנה 1 הוא מחכיר אותה לבית דפוס קטן ל-{L.PRESS.years} שנים, תמורת <M v={L.PRESS.payment} /> בסוף כל שנה. ב-31.12 של שנה {L.PRESS.years} לחוכר יש אופציה לקנות אותה ב-<M v={L.PRESS.option} />, הרבה מתחת לשווי הצפוי. על עורך דין ומתווך לחוזה הוציא המחכיר <M v={L.PRESS.costs} />.
          </p>
        </Story>
        <P>סיווג: ודאי באופן סביר שהחוכר יקנה, ולכן למעשה כל הסיכונים וההטבות עברו (סעיף 63(ב)). החכירה מימונית. מה שנראה כמו חכירה הוא בפועל מכירה עם אשראי.</P>
        <Part title="היום הראשון: מה יוצא ומה נכנס">
          <P>
            המכונה יוצאת מהספרים, ובמקומה נכנס חוב של החוכר. החוב הזה נקרא <T16 he="השקעה נטו" par="67" />. היא נמדדת לפי מה שהמחכיר נתן תמורתה: מכונה בשווי הוגן, והעלויות הישירות שהוציא (סעיף 69, והגדרת הריבית הגלומה בנספח א׳).
          </P>
          <Formula>השקעה נטו = שווי הוגן + עלויות ישירות</Formula>
          <p>
            <Ltr>{`${n(L.PRESS.fairValue)} + ${n(L.PRESS.costs)} = ${n(L.ND_START)}`}</Ltr>
          </p>
          <P>
            למה שווי הוגן, ולא הערך בספרים? כי את המכונה אפשר היה למכור היום ב-{n(L.PRESS.fairValue)}, וזה מה שהחוכר קיבל. ההפרש בין השווי לערך בספרים כבר הושג, ולכן הוא רווח הון של היום הראשון. אם השווי היה נמוך מהערך בספרים, זה היה הפסד הון. בתקן אין על כך משפט מפורש למי שאינו סוחר: זה נובע מכך שהנכס יוצא מהספרים, ובמקומו נכנס חייב (סעיף 67).
          </P>
          <Formula>רווח הון = שווי הוגן − ערך בספרים</Formula>
          <p>
            <Ltr>{`${n(L.PRESS.fairValue)} − ${n(L.PRESS.bookValue)} = ${n(L.ND_GAIN)}`}</Ltr>
          </p>
          <JournalEntry
            title="1.1 של שנה 1"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.ND_START },
              { account: "מכונה, רכוש קבוע", cr: L.PRESS.bookValue },
              { account: "מזומן", cr: L.PRESS.costs },
              { account: "רווח הון", cr: L.ND_GAIN },
            ]}
          />
        </Part>
        <Part title="הריבית שגלומה בחוזה">
          <P>
            עכשיו צריך לדעת כמה ריבית המחכיר מרוויח. זו הריבית שבה מה שהוא יקבל שווה בדיוק למה שנתן. הוא יקבל {L.PRESS.years} תשלומים, ובסוף גם את מחיר האופציה, שנחשב תשלום חכירה כי ודאי שימומש (סעיף 70(ד)).
          </P>
          <Formula>ערך נוכחי של מה שיתקבל = מה שניתן</Formula>
          <p>
            <Ltr>{`${n(L.ND_START)} = ${n(L.PRESS.payment)} × (1 − (1 + i)^(−${L.PRESS.years})) ÷ i + ${n(L.PRESS.option)} ÷ (1 + i)^${L.PRESS.years}`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{`=RATE(${L.PRESS.years};${L.PRESS.payment};-${L.ND_START};${L.PRESS.option}) → ${pct(L.ND_RATE, 4)}`}</Ltr>
          </p>
          <P>
            ומכאן מתברר למה העלויות הישירות יושבות בתוך ההשקעה נטו. בלעדיהן הריבית הייתה {pct(L.ND_RATE_NO_COSTS)}, ואיתן {pct(L.ND_RATE)}. העלות לא נרשמת כהוצאה ביום אחד. היא מקטינה קצת את הכנסות המימון בכל שנה, וכך נפרסת על החוזה שהיא השיגה. בלי זה, שנה 1 הייתה נושאת עלות של {L.PRESS.years} שנים.
          </P>
        </Part>
        <Part title="כל שנה: ריבית, ואז תקבול">
          <P>מכאן זו הלוואה לכל דבר. בתחילת כל שנה יש יתרה, עליה נצברת ריבית, ובסוף מגיע התקבול (סעיף 75). כך התשואה על היתרה קבועה: בשנים הראשונות החוב גדול וההכנסה גבוהה, ובסוף שניהם קטנים.</P>
          <Formula>הכנסות מימון = יתרת פתיחה × ריבית</Formula>
          <p>
            <Ltr>{`${n(L.ND_START)} × ${pct(L.ND_RATE, 4)} = ${n(L.ND_ROWS[0].income)}`}</Ltr>
          </p>
          <Formula>יתרת סגירה = פתיחה + הכנסות מימון − תקבול</Formula>
          <p>
            <Ltr>{`${n(L.ND_START)} + ${n(L.ND_ROWS[0].income)} − ${n(L.PRESS.payment)} = ${n(L.ND_ROWS[0].closing)}`}</Ltr>
          </p>
          <Invest rows={L.ND_ROWS} />
          <P>
            בשנה {L.PRESS.years} התקבול הוא <Ltr>{`${n(L.PRESS.payment)} + ${n(L.PRESS.option)} = ${n(L.PRESS.payment + L.PRESS.option)}`}</Ltr>, כי החוכר גם מממש את האופציה. היתרה מגיעה לאפס.
          </P>
          <JournalEntry
            title="31.12 של שנה 1"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.ND_ROWS[0].income },
              { account: "מזומן", dr: L.PRESS.payment },
              { account: "הכנסות מימון", cr: L.ND_ROWS[0].income },
              { account: "השקעה נטו בחכירה", cr: L.PRESS.payment },
            ]}
          />
          <P>
            במצב הכספי, הלא שוטף הוא מה שיישאר אחרי התקבול של השנה הבאה, בדיוק כמו אצל החוכר. בשנה 1 זו היתרה של סוף שנה 2, {n(L.ND_ROWS[1].closing)}, והשוטף הוא השאר: <Ltr>{`${n(L.ND_ROWS[0].closing)} − ${n(L.ND_ROWS[1].closing)} = ${n(L.ND_ROWS[0].current)}`}</Ltr>. בסוף שנה 3 הכול שוטף, כי גם התשלום האחרון וגם האופציה יגיעו תוך שנה.
          </P>
          <Split rows={L.ND_ROWS} />
          <Tbl
            dense
            head={["רווח או הפסד", ...L.ND_ROWS.map((y) => `שנה ${y.year}`)]}
            rows={[
              ["רווח הון", -L.ND_GAIN, 0, 0, 0],
              ["הכנסות מימון", ...L.ND_ROWS.map((y) => -y.income)],
            ]}
            foot={["סך הכול", -L.ND_GAIN - L.ND_ROWS[0].income, ...L.ND_ROWS.slice(1).map((y) => -y.income)]}
          />
        </Part>
        <Part title="ואם המחכיר הוא חברת מימון?">
          <P>
            נניח שחברת מימון קנתה את אותה מכונה בשוק ב-{n(L.PRESS.fairValue)}, רק כדי להחכיר אותה בתנאים האלה. ההשקעה נטו, הריבית והטבלה לא משתנות, כי הן תלויות בשווי ההוגן ובעלויות. הדבר היחיד שנעלם הוא רווח ההון: המחיר ששילמה שווה לשווי, ואין הפרש.
          </P>
          <JournalEntry
            title="1.1 של שנה 1, אצל חברת מימון"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.ND_START },
              { account: "מכונה", cr: L.PRESS.fairValue },
              { account: "מזומן", cr: L.PRESS.costs },
            ]}
          />
        </Part>
      </>
    ),
    check: quiz("ls-lsr-nondealer", [
      {
        q: "שווי הוגן 60,000, עלויות ישירות 2,000. ערך בספרים 50,000. מהו רווח ההון?",
        options: ["10,000 ש״ח", "12,000 ש״ח", "8,000 ש״ח", "אפס"],
        answer: 0,
        why: "60,000 − 50,000 = 10,000. העלויות ישירות נכנסות להשקעה נטו.",
      },
    ]),
  },
  "ls-lsr-rate": {
    lead: "לפעמים השאלה לא נותנת שווי הוגן, רק את הריבית שגלומה בחכירה. גם מזה אפשר למדוד את ההשקעה נטו, ומגיעים לאותו מספר.",
    body: (
      <>
        <P>
          עד עכשיו התחלנו מהשווי ההוגן, ומצאנו ממנו את הריבית. כאן הולכים בכיוון ההפוך. <T16 he="הריבית הגלומה" par="נספח א׳" /> היא הריבית שבה הערך הנוכחי של תשלומי החכירה ושל השייר הלא מובטח שווה לשווי ההוגן של הנכס ועוד העלויות הישירות של המחכיר. אם יודעים את הריבית, מהוונים בה את כל מה שהמחכיר צפוי לקבל, והתוצאה היא ההשקעה נטו (סעיף 68). זו אותה משוואה, רק פותרים אותה מהצד השני.
        </P>
        <P>
          חברה חקלאית החליפה טרקטור, והישן רשום אצלה כרכוש קבוע ב-<M v={L.TRAC.bookValue} />. היא לא סוחרת בטרקטורים. ב-1.1 של שנה 1 היא מחכירה אותו לחקלאי שכן ל-{L.TRAC.years} שנים, תמורת <M v={L.TRAC.payment} /> בסוף כל שנה, ונשארו לו {L.TRAC.life} שנות חיים. בסוף התקופה הטרקטור חוזר. החוכר ערב שיהיה שווה אז לפחות <M v={L.TRAC.guaranteed} />, והחברה מעריכה שיהיה שווה <M v={L.TRAC_RESIDUAL} />. על עורך דין לחוזה היא שילמה <M v={L.TRAC.costs} />. הריבית הגלומה בחכירה {pct(L.TRAC.rate, 0)}, ושווי הוגן לא נתון.
        </P>
        <P>מה החברה תקבל? את התשלומים, את הערבות כולה, כי אצל המחכיר היא תשלום חכירה (סעיף 70(ג)), ואת מה שהיא צופה לקבל מעל הערבות. החלק האחרון אינו תשלום חכירה, אבל הוא נכנס להשקעה נטו, כי גם אותו היא צפויה לקבל. מהוונים כל חלק בריבית הגלומה:</P>
        <Tbl
          dense
          head={["מה החברה תקבל", "ברוטו", "בערך נוכחי"]}
          rows={[
            [`${L.TRAC.years} תשלומים`, L.TRAC.payment * L.TRAC.years, L.TRAC_PV_PAY],
            ["הערבות של החוכר", L.TRAC.guaranteed, L.TRAC_PV_GUAR],
            ["השייר הלא מובטח", L.TRAC.unguaranteed, L.TRAC_PV_UN],
          ]}
          foot={["השקעה ברוטו ונטו", L.TRAC.payment * L.TRAC.years + L.TRAC_RESIDUAL, L.TRAC_NI]}
        />
        <Formula>השקעה נטו = ערך נוכחי של התשלומים + ערך נוכחי של סך השייר, בריבית הגלומה</Formula>
        <p>
          <Ltr>{`${n(L.TRAC.payment)} × (1 − 1.07^(−${L.TRAC.years})) ÷ 0.07 + ${n(L.TRAC_RESIDUAL)} ÷ 1.07^${L.TRAC.years} = ${n(L.TRAC_NI)}`}</Ltr>
        </p>
        <p>
          באקסל: <Ltr>{`=PV(7%;${L.TRAC.years};-${L.TRAC.payment};-${L.TRAC_RESIDUAL}) → ${n(L.TRAC_NI)}`}</Ltr>
        </p>
        <P>
          לפני שרושמים צריך לסווג, ולשם כך צריך שווי הוגן. גם אותו הריבית נותנת. לפי ההגדרה, ההשקעה נטו היא השווי ההוגן ועוד העלויות הישירות, ולכן השווי הוא מה שנשאר כשמורידים את העלויות:
        </P>
        <Formula>שווי הוגן = השקעה נטו − עלויות ישירות</Formula>
        <p>
          <Ltr>{`${n(L.TRAC_NI)} − ${n(L.TRAC.costs)} = ${n(L.TRAC_FV)}`}</Ltr>
        </p>
        <P>
          הערך הנוכחי של תשלומי החכירה, עם הערבות ובלי השייר הלא מובטח, הוא <Ltr>{`${n(L.TRAC_LEASE_PV)} ÷ ${n(L.TRAC_FV)} = ${pct(L.TRAC_SHARE, 0)}`}</Ltr> מהשווי, כלומר למעשה כל השווי ההוגן (סעיף 63(ד)). החכירה מימונית.
        </P>
        <P>הטרקטור יוצא לפי הערך בספרים, והכסף לעורך הדין יצא מהקופה. מה שנשאר הוא רווח ההון:</P>
        <Formula>רווח הון = השקעה נטו − עלויות ישירות − ערך בספרים</Formula>
        <p>
          <Ltr>{`${n(L.TRAC_NI)} − ${n(L.TRAC.costs)} − ${n(L.TRAC.bookValue)} = ${n(L.TRAC_GAIN)}`}</Ltr>
        </p>
        <P>
          ומהדרך שכבר מכירים, שווי הוגן פחות ערך בספרים: <Ltr>{`${n(L.TRAC_FV)} − ${n(L.TRAC.bookValue)} = ${n(L.TRAC_GAIN)}`}</Ltr>. אותו רווח, כי שתי הדרכים נשענות על אותה הגדרה.
        </P>
        <JournalEntry
          title="1.1 של שנה 1"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.TRAC_NI },
            { account: "טרקטור, רכוש קבוע", cr: L.TRAC.bookValue },
            { account: "מזומן", cr: L.TRAC.costs },
            { account: "רווח הון", cr: L.TRAC_GAIN },
          ]}
        />
        <P>
          מכאן הכול כרגיל: הכנסות מימון של {pct(L.TRAC.rate, 0)} על היתרה, ותקבול בסוף כל שנה. בסוף שנה {L.TRAC.years} נשארים {n(L.TRAC_RESIDUAL)}, וזה הטרקטור שחוזר. אם יתברר שהוא שווה פחות מ-{n(L.TRAC.guaranteed)}, החוכר ישלים את ההפרש.
        </P>
        <Invest rows={L.TRAC_ROWS} />
        <P>
          הטעות הנפוצה כאן היא להשאיר בחוץ את השייר הלא מובטח, כי אף אחד לא ערב לו. אז ההשקעה נטו יוצאת <M v={L.TRAC_NO_UN} />, והרווח <M v={L.TRAC_NO_UN_GAIN} />, נמוך ב-{n(L.TRAC_PV_UN)}. השייר הלא מובטח הוא לא תשלום חכירה, ולכן הוא לא נספר במבחן הסיווג. אבל הוא בהחלט חלק ממה שהמחכיר יקבל, ולכן הוא בהשקעה נטו.
        </P>
        <Deeper title="ואם נתונה גם ריבית שוק?">
          <P>אצל מי שאינו יצרן או סוחר, ריבית השוק לא משנה כלום. אם נתון שווי הוגן, ההשקעה נטו היא השווי ועוד העלויות, והריבית הגלומה נגזרת מהם. אם נתונה הריבית הגלומה, מהוונים בה. ריבית שוק נחוצה רק אצל יצרן או סוחר, כדי לקבוע את המכירות (סעיף 71(א)).</P>
        </Deeper>
        <Remember>השקעה נטו היא הערך הנוכחי, בריבית הגלומה, של התשלומים, של כל הערבות ושל השייר הלא מובטח. משווי הוגן או מריבית, יוצא אותו מספר.</Remember>
      </>
    ),
  },
  "ls-lsr-dealer": {
    lead: "סוחר או יצרן נותנים ללקוח לבחור בין לקנות לבין לחכור. לכן יום החכירה הוא אצלם יום מכירה, עם רווח רגיל, ואחר כך הם מרוויחים גם ריבית.",
    body: (
      <>
        <Story icon={<Sun />} title="מערכת סולארית על גג של מפעל">
          <p>
            יצרן מערכות סולאריות בנה מערכת לפי מידות הגג של מפעל. במזומן היא נמכרת ב-<M v={L.SOLAR.fairValue} />, וזה שוויה ההוגן. הייצור עלה <M v={L.SOLAR.cost} />. המפעל בחר לחכור: <M v={L.SOLAR.payment} /> בסוף כל שנה, {L.SOLAR.years} שנים, ובסוף המערכת עוברת אליו. ריבית השוק {pct(L.SOLAR.marketRate, 0)}. עמלה לסוכן שהביא את העסקה עלתה ליצרן <M v={L.SOLAR.costs} />.
          </p>
        </Story>
        <P>סיווג: הבעלות עוברת (סעיף 63(א)), והמערכת גם נבנתה רק לגג הזה (סעיף 63(ה)). מימונית.</P>
        <P>
          למה היצרן רושם מכירה, ובית הדפוס רק רווח הון? כי מכירה היא העיסוק שלו. לקוח שחוכר אצלו עושה בפועל שתי עסקאות: קונה מערכת, ולוקח הלוואה. אם היינו רושמים רק ריבית, החברה לא הייתה מראה בכלל שמכרה, והרווח מהמכירה היה מתערבב עם הרווח מהמימון. לכן הרווח של היום הראשון זהה למה שהיה במכירה רגילה (סעיף 72).
        </P>
        <TwoPanel
          label={`הרווח של היצרן בשני חלקים. ביום הראשון מכירה: ${n(L.D_DAY_ONE)} ש״ח. בכל שנה אחר כך הכנסות מימון על היתרה`}
          panels={[
            { title: "ביום הראשון, מכירה", steps: [`מכירות ${n(L.D_SALES)}`, `עלות המכר ${n(L.SOLAR.cost)}`, `עמלה ${n(L.SOLAR.costs)}`], verdict: `רווח של ${n(L.D_DAY_ONE)} מיד`, tone: 1 },
            { title: "כל שנה אחר כך, ריבית", steps: [`השקעה נטו ${n(L.D_SALES)}`, "הכנסות מימון על היתרה", `תקבול ${n(L.SOLAR.payment)}`], verdict: `ריבית לאורך ${L.SOLAR.years} שנים`, tone: 3 },
          ]}
        />
        <Tbl
          head={["שורה", "סכום", "סעיף"]}
          rows={[
            ["הכנסות ממכירות", "הנמוך מבין שווי הוגן, וערך נוכחי בריבית שוק", "71(א)"],
            ["עלות המכר", "עלות המלאי. אם הנכס חוזר, פחות ערך נוכחי של שייר לא מובטח, ונגיע לזה בהמשך השיעור", "71(ב)"],
            ["עלויות השגת החכירה", "הוצאה מיידית", "74"],
          ]}
        />
        <Part title="המכירות: הנמוך משני סכומים">
          <P>בודקים כמה הלקוח משלם בפועל, בריבית שהשוק היה דורש ממנו:</P>
          <Formula>ערך נוכחי = תשלום × <Ltr>{"(1 − (1 + i)^(−n)) ÷ i"}</Ltr></Formula>
          <p>
            <Ltr>{`${n(L.SOLAR.payment)} × (1 − 1.08^(−${L.SOLAR.years})) ÷ 0.08 = ${n(L.D_PV_MARKET)}`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{`=PV(8%;${L.SOLAR.years};-${L.SOLAR.payment}) → ${n(L.D_PV_MARKET)}`}</Ltr>
          </p>
          <P>
            יצא יותר מהמחיר במזומן. {n(L.D_PV_MARKET)} מול {n(L.SOLAR.fairValue)}, ולכן המכירות הן <M v={L.D_SALES} />. אי אפשר למכור נכס ביותר משהוא שווה. מה שמעל השווי הוא תשלום על האשראי, והוא יירשם כריבית לאורך השנים. בלי הכלל הזה, הריבית הייתה הופכת לרווח מכירה ביום אחד.
          </P>
        </Part>
        <Part title="העמלה: הוצאה מיידית">
          <P>אצל בית הדפוס העלויות הישירות נכנסו להשקעה נטו. כאן לא. היצרן הוציא אותן כדי להשיג מכירה, ואת הרווח ממנה הוא רושם כבר היום, ולכן גם העלות נרשמת היום (סעיף 74). לכן היא גם לא נכנסת לריבית הגלומה, והריבית נמדדת מול השווי ההוגן בלבד.</P>
          <Formula>שווי הוגן = ערך נוכחי של התשלומים, בריבית הגלומה</Formula>
          <p>
            <Ltr>{`${n(L.SOLAR.fairValue)} = ${n(L.SOLAR.payment)} × (1 − (1 + i)^(−${L.SOLAR.years})) ÷ i`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{`=RATE(${L.SOLAR.years};${L.SOLAR.payment};-${L.SOLAR.fairValue}) → ${pct(L.D_RATE, 4)}`}</Ltr>
          </p>
          <P>
            הריבית הגלומה יצאה {pct(L.D_RATE)}, קצת מעל השוק. זה בדיוק מה שראינו בערך הנוכחי: היצרן גובה מעט יותר מריבית שוק.
          </P>
          <JournalEntry
            title="1.1 של שנה 1"
            lines={[
              { account: "השקעה נטו בחכירה", dr: L.D_SALES },
              { account: "עלות המכר", dr: L.SOLAR.cost },
              { account: "הוצאות השגת חכירה", dr: L.SOLAR.costs },
              { account: "מכירות", cr: L.D_SALES },
              { account: "מלאי", cr: L.SOLAR.cost },
              { account: "מזומן", cr: L.SOLAR.costs },
            ]}
          />
        </Part>
        <Part title="הדוחות">
          <Invest rows={L.D_ROWS} />
          <Split rows={L.D_ROWS} />
          <Tbl
            dense
            head={["רווח או הפסד", ...L.D_ROWS.map((y) => `שנה ${y.year}`)]}
            rows={[
              ["מכירות", -L.D_SALES, 0, 0, 0],
              ["עלות המכר", L.SOLAR.cost, 0, 0, 0],
              ["הוצאות השגה", L.SOLAR.costs, 0, 0, 0],
              ["הכנסות מימון", ...L.D_ROWS.map((y) => -y.income)],
            ]}
            foot={["סך הכול", -L.D_DAY_ONE - L.D_ROWS[0].income, ...L.D_ROWS.slice(1).map((y) => -y.income)]}
          />
          <P>
            בדיקה: כל הכסף שנכנס, פחות כל העלויות, שווה לסך הרווח. <Ltr>{`${L.SOLAR.years} × ${n(L.SOLAR.payment)} − ${n(L.SOLAR.cost)} − ${n(L.SOLAR.costs)} = ${n(L.D_DAY_ONE + L.D_INTEREST)}`}</Ltr>, מזה {n(L.D_DAY_ONE)} ביום הראשון ו-{n(L.D_INTEREST)} כריבית.
          </P>
        </Part>
        <Remember>סוחר רושם מכירה ועלות מכר, כמו בכל מכירה שלו (סעיף 72). מי שאינו סוחר רושם לכל היותר רווח הון אחד.</Remember>
      </>
    ),
  },
  "ls-lsr-low": {
    lead: "סוחר שמפרסם ריבית נמוכה נראה כאילו מכר ביוקר. כדי שהרווח לא יתנפח, מהוונים את התשלומים בריבית השוק.",
    body: (
      <>
        <Story icon={<Stethoscope />} title="״ציוד למרפאה, ריבית של 2% בלבד״">
          <p>
            יצרן ציוד רפואי מפרסם מבצע למרפאות שיניים. הציוד עולה לו <M v={L.DENT.cost} />, ובמזומן הוא נמכר ב-<M v={L.DENT.fairValue} />. במקום זה המרפאה יכולה לשלם <M v={L.DENT.payment} /> בסוף כל שנה, {L.DENT.years} שנים, ובסוף הציוד שלה. במודעה כתוב {pct(L.DENT.adRate, 0)}, אבל בשוק הלוואה כזו עולה {pct(L.DENT.marketRate, 0)}.
          </p>
        </Story>
        <P>אם מאמינים למודעה, כמעט כל {n(L.LOW_CASH)} הם מחיר הציוד, ורק מעט ריבית. אז כמעט כל הרווח נרשם ביום החתימה, ובשנים הבאות כמעט לא נשארת הכנסה. בפועל המרפאה קיבלה גם אשראי, ועל אשראי מרוויחים לאורך השנים. לכן התקן דורש לחשב כאילו נגבתה ריבית שוק (סעיף 73).</P>
        <WrongRight
          label="טעות: להוון בריבית שפרסם, ולקבל מכירות גבוהות. נכון: ריבית השוק, ומכירות נמוכות יותר"
          wrong={
            <>
              <p>
                <Ltr>{`=PV(2%;${L.DENT.years};-${L.DENT.payment}) → ${n(L.LOW_NAIVE)}`}</Ltr>
              </p>
              <p>בריבית שפורסמה: מכירות {n(L.LOW_NAIVE)}, ורווח גולמי {n(L.LOW_NAIVE_GROSS)}.</p>
            </>
          }
          right={
            <>
              <p>
                <Ltr>{`=PV(9%;${L.DENT.years};-${L.DENT.payment}) → ${n(L.LOW_SALES)}`}</Ltr>
              </p>
              <p>בריבית השוק: מכירות {n(L.LOW_SALES)}, ורווח גולמי {n(L.LOW_GROSS)}.</p>
            </>
          }
        />
        <Formula>מכירות = הנמוך מבין שווי הוגן וערך נוכחי בריבית שוק</Formula>
        <p>
          <Ltr>{`${n(L.DENT.payment)} × (1 − 1.09^(−${L.DENT.years})) ÷ 0.09 = ${n(L.LOW_SALES)}`}</Ltr>
        </p>
        <P>
          {n(L.LOW_SALES)} נמוך מ-{n(L.DENT.fairValue)}, ולכן אלה המכירות. הפעם השווי ההוגן הוא הגבוה, ההפך מהמערכת הסולארית.
        </P>
        <JournalEntry
          title="1.1 של שנה 1"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.LOW_SALES },
            { account: "עלות המכר", dr: L.DENT.cost },
            { account: "מכירות", cr: L.LOW_SALES },
            { account: "מלאי", cr: L.DENT.cost },
          ]}
        />
        <P>אחר כך הכנסות המימון בריבית השוק, על יתרת המכירות הנמוכה:</P>
        <Invest rows={L.LOW_ROWS} />
        <Part title="מה הכלל עושה בפועל">
          <P>
            הוא לא משנה כמה היצרן מרוויח, רק מתי. המרפאה תשלם <Ltr>{`${L.DENT.years} × ${n(L.DENT.payment)} = ${n(L.LOW_CASH)}`}</Ltr>, ובשתי הדרכים הרווח הכולל זהה. בטבלה רואים שאצל מי שמהוון בריבית המודעה, היום הראשון לוקח כמעט את הכול:
          </P>
          <Tbl
            dense
            head={["רווח או הפסד, כל התקופה", "בריבית המודעה", "בריבית השוק"]}
            rows={[
              ["מכירות", -L.LOW_NAIVE, -L.LOW_SALES],
              ["עלות המכר", L.DENT.cost, L.DENT.cost],
              ["הכנסות מימון, כל השנים", -L.LOW_NAIVE_INT, -L.LOW_INT],
            ]}
            foot={["סך הכול", L.DENT.cost - L.LOW_CASH, L.DENT.cost - L.LOW_CASH]}
          />
        </Part>
        <Rule>המכירות הן הנמוך מבין השווי ההוגן והערך הנוכחי בריבית השוק. הרווח שלא נרשם במכירה בגלל הריבית הנמוכה נרשם לאורך החכירה, כהכנסות מימון.</Rule>
      </>
    ),
    check: quiz("ls-lsr-low", [
      {
        q: "שווי הוגן 50,000. בריבית שוק הערך הנוכחי 42,000, ובריבית שפורסמה 49,000. אילו הכנסות ממכירות?",
        options: ["42,000 ש״ח", "49,000 ש״ח", "50,000 ש״ח", "45,500 ש״ח"],
        answer: 0,
        why: "הנמוך מבין 50,000 ו-42,000 בריבית שוק.",
      },
    ]),
  },
  "ls-lsr-resid": {
    lead: "כשנכס חוזר למחכיר, בסוף יש משהו שעדיין שווה כסף. חלק מהסכום מישהו הבטיח, וחלק לא. מההפרדה הזו נגזר מה נרשם במכירות, בעלות המכר, וכשהאומדן יורד.",
    body: (
      <>
        <Story icon={<Caravan />} title="קרוואן שחוזר לסוחר">
          <p>
            סוחר קרוואנים, שמוכר וגם מחכיר, מחכיר קרוואן לחברת נופש ל-{L.RES.years} שנים. החברה משלמת <M v={L.RES.payment} /> בסוף כל שנה, ובסוף שנה {L.RES.years} מחזירה את הקרוואן. היום הוא שווה <M v={L.RES.fairValue} />, והוא עלה לסוחר <M v={L.RES.cost} />. לקרוואן {L.RES.life} שנות חיים.
          </p>
          <p>
            הסוחר מעריך שביום החזרה הוא יהיה שווה <M v={L.RES.estimate} />. חברת ערבויות, שאינה קשורה לסוחר ויש לה יכולת לשלם, התחייבה כלפיו: אם הקרוואן יהיה שווה אז פחות מ-<M v={L.RES.guaranteed} />, היא תשלים לו את ההפרש. ריבית השוק שווה לריבית הגלומה.
          </p>
        </Story>
        <FullSteps
          label="שייר, צעד אחר צעד"
          steps={[
            {
              title: "שלושה מספרים: סך השייר, מובטח, לא מובטח",
              body: (
                <>
                  <p>
                    <strong>ערך השייר</strong> הוא כמה הנכס יהיה שווה ביום שהוא חוזר. כאן <M v={L.RES.estimate} />. זה אומדן של הסוחר, ואף אחד לא יודע אותו בוודאות.
                  </p>
                  <p>
                    <strong>שייר מובטח</strong> הוא החלק שמישהו התחייב עליו. כאן <M v={L.RES.guaranteed} />: גם אם הקרוואן יתרסק בערכו, הסוחר יקבל את הסכום הזה, מהקרוואן או מחברת הערבויות. <strong>שייר לא מובטח</strong> הוא מה שמעל זה, ואם הוא נעלם הסוחר הוא שמפסיד. גם חלק שרק צד קשור למחכיר ערב לו נחשב לא מובטח (נספח א׳).
                  </p>
                  <Tbl
                    head={["השייר", "סכום"]}
                    rows={[
                      ["מובטח: מישהו התחייב", L.RES.guaranteed],
                      ["לא מובטח: הסיכון של הסוחר", L.RES_UN],
                    ]}
                    foot={["סך השייר", L.RES.estimate]}
                  />
                  <PartsBar
                    label={`סך השייר ${n(L.RES.estimate)} ש״ח: ${n(L.RES.guaranteed)} מובטח, ${n(L.RES_UN)} לא מובטח`}
                    title={`סך השייר: ${n(L.RES.estimate)} ש״ח`}
                    parts={[
                      { name: "מובטח", value: L.RES.guaranteed, color: SURE },
                      { name: "לא מובטח", value: L.RES_UN, color: UNSURE },
                    ]}
                  />
                  <p>הכי קל לראות את זה ביום החזרה עצמו. כך הוא נראה בכמה תרחישים:</p>
                  <Tbl
                    dense
                    head={["הקרוואן שווה בפועל", "מהקרוואן", "מהערב", "הסוחר מקבל"]}
                    rows={[60_000, L.RES.estimate, L.RES.guaranteed, 20_000].map((worth) => [worth, worth, Math.max(0, L.RES.guaranteed - worth), Math.max(worth, L.RES.guaranteed)])}
                  />
                  <p>
                    למטה יש רצפה: הסוחר אף פעם לא מקבל פחות מ-{n(L.RES.guaranteed)}. מעל הרצפה הוא חשוף לגמרי לשווי של הקרוואן. בשביל זה מפרידים: החלק המובטח הוא כמו כסף שהובטח בחוזה, והחלק הלא מובטח הוא נכס שנשאר של הסוחר.
                  </p>
                </>
              ),
            },
            {
              title: "מה הסוחר מודד ביום הראשון, ולמה",
              body: (
                <>
                  <p>
                    הסוחר מסר קרוואן ששווה {n(L.RES.fairValue)}. בתמורה יש לו שלושה דברים: התשלומים, הערבות, ומה שהוא צופה לקבל מעליה. ביחד הם <strong>ההשקעה ברוטו</strong>: כל מה שהוא צפוי לקבל, לפני היוון (נספח א׳).
                  </p>
                  <p>
                    תשלומי החכירה של המחכיר כוללים את <strong>כל</strong> הערבות, גם של צד שלישי כזה, וגם אם אף אחד לא צופה שישלמו עליה (סעיף 70(ג)). מבחינתו הסכום מובטח מכל כיוון. החלק הלא מובטח אינו תשלום חכירה, אבל גם הוא נספר בהשקעה, כי זה ערך שהסוחר צפוי לקבל.
                  </p>
                  <p>כדי להוון צריך ריבית, והריבית הגלומה היא זו שבה כל מה שיתקבל שווה היום בדיוק לשווי הקרוואן. נכנס בה כל השייר:</p>
                  <Formula>שווי הוגן = ערך נוכחי של התשלומים + ערך נוכחי של סך השייר</Formula>
                  <p>
                    <Ltr>{`${n(L.RES.fairValue)} = ${n(L.RES.payment)} × (1 − (1 + i)^(−${L.RES.years})) ÷ i + ${n(L.RES.estimate)} ÷ (1 + i)^${L.RES.years}`}</Ltr>
                  </p>
                  <p>
                    באקסל: <Ltr>{`=RATE(${L.RES.years};${L.RES.payment};-${L.RES.fairValue};${L.RES.estimate}) → ${RES_I}`}</Ltr>
                  </p>
                  <p>עכשיו מהוונים כל חלק בנפרד. הערך הנוכחי של כולם ביחד הוא <strong>ההשקעה נטו</strong>:</p>
                  <Tbl
                    dense
                    head={["מה הסוחר יקבל", "ברוטו", "בערך נוכחי"]}
                    rows={[
                      [`${L.RES.years} תשלומים`, L.RES.payment * L.RES.years, L.RES_PV_PAY],
                      ["הערבות, כולה", L.RES.guaranteed, L.RES_PV_GUAR],
                      ["השייר הלא מובטח", L.RES_UN, L.RES_PV_UN],
                    ]}
                    foot={["השקעה ברוטו ונטו", L.RES_GROSS_INV, L.RES.fairValue]}
                  />
                  <p>
                    <Ltr>{`=PV(${RES_I};${L.RES.years};-${L.RES.payment}) → ${n(L.RES_PV_PAY)}`}</Ltr>
                  </p>
                  <p>
                    <Ltr>{`${n(L.RES.guaranteed)} ÷ ${RES_FACTOR}^${L.RES.years} = ${n(L.RES_PV_GUAR)}`}</Ltr>
                  </p>
                  <p>
                    <Ltr>{`${n(L.RES_UN)} ÷ ${RES_FACTOR}^${L.RES.years} = ${n(L.RES_PV_UN)}`}</Ltr>
                  </p>
                  <p>
                    ההפרש בין ברוטו לנטו, <Ltr>{`${n(L.RES_GROSS_INV)} − ${n(L.RES.fairValue)} = ${n(L.RES_GROSS_INV - L.RES.fairValue)}`}</Ltr>, הוא הריבית שתירשם לאורך החכירה, אם האומדן לא ישתנה.
                  </p>
                  <PartsBar
                    label={`השקעה נטו ${n(L.RES.fairValue)} ש״ח: ${n(L.RES_SALES)} תשלומי חכירה כולל הערבות, ${n(L.RES_PV_UN)} שייר לא מובטח`}
                    title={`ההשקעה נטו, בערך נוכחי: ${n(L.RES.fairValue)} ש״ח`}
                    parts={[
                      { name: "תשלומי חכירה, כולל כל הערבות", value: L.RES_SALES, color: SURE },
                      { name: "שייר לא מובטח", value: L.RES_PV_UN, color: UNSURE },
                    ]}
                  />
                  <p>
                    עכשיו אפשר גם לסווג. {L.RES.years} מתוך {L.RES.life} שנים הם {pct(L.RES.years / L.RES.life, 0)}, פחות מהנוהג של 75%. אבל הערך הנוכחי של תשלומי החכירה הוא <Ltr>{`${n(L.RES_SALES)} ÷ ${n(L.RES.fairValue)} = ${pct(L.RES_PV_SHARE, 0)}`}</Ltr> מהשווי, כלומר למעשה כל השווי ההוגן (סעיף 63(ד)). החכירה מימונית.
                  </p>
                </>
              ),
            },
            {
              title: "למה הלא מובטח יוצא גם מהמכירות וגם מעלות המכר",
              body: (
                <>
                  <p>
                    דמיינו את הקרוואן חתוך לשני חלקים. החלק הגדול נמכר: מישהו שילם עליו או התחייב עליו. החלק הקטן, השייר הלא מובטח, לא נמכר לאף אחד. הוא חוזר לסוחר, והסיכון עליו נשאר אצלו. אי אפשר לרשום הכנסה ממכירה של מה שלא נמכר.
                  </p>
                  <Formula>מכירות = הנמוך מבין שווי הוגן וערך נוכחי של תשלומי החכירה, בריבית שוק</Formula>
                  <p>
                    <Ltr>{`=PV(${RES_I};${L.RES.years};-${L.RES.payment};-${L.RES.guaranteed}) → ${n(L.RES_SALES)}`}</Ltr>
                  </p>
                  <p>
                    ואם החלק הזה לא נמכר, גם העלות שלו לא הפכה לעלות מכר. מורידים מעלות המכר אותו סכום בדיוק (סעיף 71(ב)).
                  </p>
                  <Formula>עלות המכר = עלות המלאי − ערך נוכחי של השייר הלא מובטח</Formula>
                  <p>
                    <Ltr>{`${n(L.RES.cost)} − ${n(L.RES_PV_UN)} = ${n(L.RES_COGS)}`}</Ltr>
                  </p>
                  <Tbl
                    dense
                    head={["רווח או הפסד", "אילו מכר הכול", "לא מובטח", "נרשם"]}
                    rows={[
                      ["מכירות", -L.RES.fairValue, L.RES_PV_UN, -L.RES_SALES],
                      ["עלות המכר", L.RES.cost, -L.RES_PV_UN, L.RES_COGS],
                    ]}
                    foot={["מינוס: רווח גולמי", L.RES.cost - L.RES.fairValue, 0, -L.RES_GROSS]}
                  />
                  <p>
                    שתי השורות זזות באותו סכום, ולכן הרווח הגולמי לא משתנה. הוא זהה למכירה מוחלטת, השווי ההוגן פחות העלות (סעיף 72). מה שמשתנה הוא גודל השורות: בלי הכלל הזה הסוחר היה מדווח על מכירות גדולות ב-{n(L.RES_PV_UN)} ממה שבאמת מכר. החלק הזה ממשיך לשבת בתוך ההשקעה נטו.
                  </p>
                  <JournalEntry
                    title="1.1 של שנה 1"
                    lines={[
                      { account: "השקעה נטו בחכירה", dr: L.RES.fairValue },
                      { account: "עלות המכר", dr: L.RES_COGS },
                      { account: "מכירות", cr: L.RES_SALES },
                      { account: "מלאי", cr: L.RES.cost },
                    ]}
                  />
                  <p>
                    שתי טעויות נפוצות. הראשונה, להוריד מהמכירות את כל השייר. רק החלק הלא מובטח יורד, כי הערבות היא תשלום חכירה, ולכן נשארת במכירות. השנייה, להוריד רק מהמכירות. אז הפקודה לא מתאזנת, וזה סימן מיד לטעות.
                  </p>
                </>
              ),
            },
            {
              title: "כשהאומדן יורד",
              body: (
                <>
                  <p>
                    שנתיים הכול הולך לפי התוכנית. בסוף שנה 2 הסוחר מעריך שהקרוואן יהיה שווה בסוף רק <M v={L.RES.newEstimate} />. הערבות לא השתנתה, ולכן כל הירידה, <M v={L.RES_DROP} />, פוגעת בחלק הלא מובטח. הרצפה עדיין עומדת.
                  </p>
                  <Tbl
                    dense
                    head={["השייר", "לפני", "אחרי"]}
                    rows={[
                      ["מובטח", L.RES.guaranteed, L.RES.guaranteed],
                      ["לא מובטח", L.RES_UN, RES_UN_AFTER],
                    ]}
                    foot={["סך השייר", L.RES.estimate, L.RES.newEstimate]}
                  />
                  <p>
                    ההשקעה נטו כוללת את הסכום הזה, והוא כבר לא צפוי להגיע. אם נשאיר אותו, הנכס במאזן ינופח. לכן מקטינים אותה מיד, וההפסד נרשם ברווח או הפסד (סעיף 77). את {n(L.RES_DROP)} הסוחר היה מקבל רק בעוד {L.RES.dropLeft} שנים, ולכן ההפסד הוא הערך הנוכחי שלהם.
                  </p>
                  <Formula>הפסד = הירידה באומדן ÷ <Ltr>{"(1 + i)^n"}</Ltr>, כש-n הוא השנים שנשארו</Formula>
                  <p>
                    <Ltr>{`${n(L.RES_DROP)} ÷ ${RES_FACTOR}^${L.RES.dropLeft} = ${n(L.RES_LOSS)}`}</Ltr>
                  </p>
                  <p>
                    באקסל: <Ltr>{`=PV(${RES_I};${L.RES.dropLeft};0;-${L.RES_DROP}) → ${n(L.RES_LOSS)}`}</Ltr>
                  </p>
                  <Tbl
                    dense
                    head={["השקעה נטו", "שנה 1", "שנה 2", "שנה 3"]}
                    rows={[
                      ["יתרה ב-1.1", L.RES.fairValue, L.RES_CLOSE1, L.RES_AFTER],
                      ["הכנסות מימון", L.RES_INT1, L.RES_INT2, L.RES_INT3],
                      ["תקבול", -L.RES.payment, -L.RES.payment, -L.RES.payment],
                      ["הפסד מירידת אומדן", 0, -L.RES_LOSS, 0],
                    ]}
                    foot={["יתרה ב-31.12", L.RES_CLOSE1, L.RES_AFTER, L.RES_CLOSE3]}
                  />
                  <JournalEntry
                    title="31.12 של שנה 2"
                    lines={[
                      { account: "הפסד מירידת אומדן שייר", dr: L.RES_LOSS },
                      { account: "השקעה נטו בחכירה", cr: L.RES_LOSS },
                    ]}
                  />
                  <p>
                    בדיקה: היתרה החדשה היא הערך הנוכחי של מה שנשאר, עם האומדן החדש. <Ltr>{`=PV(${RES_I};${L.RES.dropLeft};-${L.RES.payment};-${L.RES.newEstimate}) → ${n(L.RES_AFTER)}`}</Ltr>.
                  </p>
                  <p>
                    הריבית לא משתנה. הכנסות המימון יורדות מעצמן, כי היתרה קטנה: בשנה 3 הן {n(L.RES_INT3)}, במקום {n(L.RES_INT3_NO_DROP)}. זה מה שסעיף 77 מכנה עדכון ההקצאה של ההכנסה. בסך הכול הסוחר יקבל {n(L.RES_DROP)} פחות: {n(L.RES_LOSS)} כהפסד עכשיו, ו-{n(L.RES_LESS_INTEREST)} דרך ריבית נמוכה יותר בשנים שנשארו.
                  </p>
                  <p>
                    ואם האומדן היה יורד מתחת לערבות, למשל ל-{n(L.RES.belowEstimate)}? בתקן אין על זה משפט מפורש, אבל זה נובע מסעיפים 70(ג) ו-77. חברת הערבויות אינה קשורה לסוחר ויש לה יכולת לשלם, ולכן הערבות נשארת תשלום חכירה, והיא תשלם על מה שמתחת ל-{n(L.RES.guaranteed)}. סעיף 77 עוסק רק בשייר הלא מובטח: כולו נעלם, ושם זה נעצר. ההפסד היה על {n(L.RES_UN)} בלבד: <Ltr>{`${n(L.RES_UN)} ÷ ${RES_FACTOR}^${L.RES.dropLeft} = ${n(L.RES_BELOW_LOSS)}`}</Ltr>.
                  </p>
                  <p>ואם האומדן עולה? לא רושמים כלום. סעיף 77 מדבר רק על ירידה, ועל עלייה התקן לא אומר דבר.</p>
                </>
              ),
            },
            {
              title: "שלוש השנים בדוחות",
              body: (
                <>
                  <Tbl
                    dense
                    head={["רווח או הפסד", "שנה 1", "שנה 2", "שנה 3"]}
                    rows={[
                      ["מכירות", -L.RES_SALES, 0, 0],
                      ["עלות המכר", L.RES_COGS, 0, 0],
                      ["הכנסות מימון", -L.RES_INT1, -L.RES_INT2, -L.RES_INT3],
                      ["הפסד מירידת אומדן", 0, L.RES_LOSS, 0],
                    ]}
                    foot={["סך הכול", L.RES_COGS - L.RES_SALES - L.RES_INT1, L.RES_LOSS - L.RES_INT2, -L.RES_INT3]}
                  />
                  <p>במצב הכספי, הלא שוטף של כל שנה הוא היתרה שתישאר בסוף השנה הבאה. בסוף שנה 1 עוד לא ידוע על הירידה באומדן, ולכן הוא לפי התוכנית המקורית.</p>
                  <Tbl
                    dense
                    head={["מצב כספי, 31.12", "שנה 1", "שנה 2", "שנה 3"]}
                    rows={[
                      ["השקעה נטו, שוטפת", L.RES_CLOSE1 - L.RES_BEFORE, L.RES_AFTER - L.RES_CLOSE3, L.RES_CLOSE3 - L.RES_NC3],
                      ["השקעה נטו, לא שוטפת", L.RES_BEFORE, L.RES_CLOSE3, L.RES_NC3],
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
        <Deeper title="נסו סכומים אחרים">
          <P>הפס מהשיעור השלישי, עם האוטובוס שם. שנו את הערבות ואת השווי הצפוי, וראו מה נכנס אצל כל צד, לפני היוון.</P>
          <ResidualBar />
        </Deeper>
        <Remember>החוכר מכניס רק את מה שהוא צופה לשלם. המחכיר מכניס את כל הערבות, גם של צד שלישי בעל יכולת, שאינו קשור אליו (סעיף 70(ג)).</Remember>
      </>
    ),
  },
  "ls-lsr-index": {
    lead: "כאן המחכיר שונה מהחוכר: כשהמדד עולה הוא לא מעדכן את היתרה. התוספת היא פשוט הכנסה.",
    body: (
      <>
        <Story icon={<PiggyBank />} title="תקבול של 52,000">
          <p>
            הבסיס 50,000, והמדד עלה ב-4%. מתוך 52,000 שהתקבלו: 50,000 נכנסים לתנועה של ההשקעה נטו, ו-2,000 הם הכנסה.
          </p>
        </Story>
        <P>ההשקעה נטו נמדדה לפי המדד של מועד התחילה. מה שהמדד הוסיף אחר כך מעולם לא היה בה, ולכן הוא לא יכול להקטין אותה. אילו הורדנו ממנה את כל 52,000, היתרה הייתה נמוכה ממה שהחוכר באמת עוד חייב. לכן התוספת נרשמת בנפרד, כהכנסה מתשלום משתנה שלא נכלל. כך גם תשלום לפי מכירות.</P>
        <P>התקן לא אומר את זה במפורש, וזו הקריאה של הקורס: סעיף 70(ב) מודד לפי המדד של מועד התחילה, ואצל המחכיר אין סעיף מקביל ל-42(ב).</P>
        <Formula>תוספת מדד = תשלום בסיס × (מדד חדש ÷ מדד בסיס − 1)</Formula>
        <p>
          <Ltr>{"50,000 × (104 ÷ 100 − 1) = 2,000"}</Ltr>
        </p>
        <JournalEntry
          title="31.12"
          lines={[
            { account: "מזומן", dr: 52_000 },
            { account: "השקעה נטו בחכירה", cr: 50_000 },
            { account: "הכנסה מתשלומי חכירה משתנים", cr: 2_000 },
          ]}
        />
        <Tbl
          dense
          head={["שינוי במדד", "חוכר", "מחכיר"]}
          rows={[
            ["היתרה", "מודד מחדש (42(ב))", "לא משתנה (70(ב))"],
            ["התוספת", "נכנסת לנכס", "הכנסה (90(א)(iii))"],
          ]}
        />
        <Deeper title="אם ראיתם פתרון שמודד מחדש אצל המחכיר">
          <P>התקן לא קובע מדידה מחדש אצל המחכיר, וסעיף הגילוי 90(א)(iii) מדבר על הכנסה ממשתנים שלא נכללו במדידה. לכן בקורס התוספת היא הכנסה.</P>
          <P>
            בפתרונות של שיעורי הבית ושל אחד המבחנים הקודמים עשו אחרת. ב-31.12 מחשבים את ההשקעה נטו מחדש: הערך הנוכחי, בריבית הגלומה המקורית, של התשלומים שנשארו לפי המדד החדש. הכנסות המימון של השנה הן מה שמשלים את המעגל, כלומר יתרת סגירה פחות יתרת פתיחה ועוד התקבול. כך כל השפעת המדד, גם על השנים הבאות, נכנסת כבר השנה להכנסות המימון, וההשקעה נטו גבוהה יותר.
          </P>
          <P>אם שאלה במבחן מתאימה למקרה הזה, יש לשאול את המרצה באיזו דרך לפתור.</P>
        </Deeper>
      </>
    ),
  },
  "ls-lsr-service": {
    lead: "יש מחכירים שמוכרים עם הנכס גם שירות, תחזוקה או ניקיון. את השירות הזה הם מפרידים מהחכירה, תמיד.",
    body: (
      <>
        <P>
          חוכר רשאי לוותר על ההפרדה ולטפל בכל התשלום כתשלום חכירה (סעיף 15). למחכיר אין הקלה כזו. הוא מחלק את התמורה בין הרכיבים לפי IFRS 15, תקן ההכנסות, כלומר לפי מחירים נפרדים (סעיף 17). ההיגיון פשוט: ביום הראשון השירות עוד לא ניתן. אילו נכנס להשקעה נטו, המחכיר היה מציג חוב של החוכר על עבודה שעוד לא עשה, ובחכירה מימונית גם רווח של היום הראשון על שירות שיינתן רק בעוד כמה שנים.
        </P>
        <P>
          חברה שאינה סוחרת מחכירה למכבסה מכונות כביסה תעשייתיות ל-{L.WASH.years} שנים. המכבסה משלמת <M v={L.WASH.total} /> בסוף כל שנה, והמחיר כולל תחזוקה שוטפת של המכונות. בנפרד, חכירה כזו נמכרת ב-<M v={L.WASH.leasePrice} /> לשנה, ותחזוקה ב-<M v={L.WASH.servicePrice} />. בסוף התקופה המכונות עוברות למכבסה, ולכן החכירה מימונית (סעיף 63(א)). הן רשומות אצל החברה ב-<M v={L.WASH.bookValue} />, והריבית הגלומה בחלק החכירה {pct(L.WASH.rate, 0)}.
        </P>
        <P>קודם מחלקים את התשלום. שני המחירים הנפרדים ביחד גבוהים מהתשלום, כי בחבילה יש הנחה, וההנחה מתחלקת ביניהם לפי היחס:</P>
        <Formula>חלק החכירה = תשלום × מחיר נפרד של החכירה ÷ סך המחירים הנפרדים</Formula>
        <p>
          <Ltr>{`${n(L.WASH.total)} × ${n(L.WASH.leasePrice)} ÷ ${n(L.WASH_PRICES)} = ${n(L.WASH_LEASE)}`}</Ltr>
        </p>
        <p>
          באקסל: <Ltr>{`=${L.WASH.total}*${L.WASH.leasePrice}/(${L.WASH.leasePrice}+${L.WASH.servicePrice}) → ${n(L.WASH_LEASE)}`}</Ltr>
        </p>
        <Tbl
          dense
          head={["התשלום השנתי", "מחיר נפרד", "הוקצה"]}
          rows={[
            ["חכירה", L.WASH.leasePrice, L.WASH_LEASE],
            ["תחזוקה", L.WASH.servicePrice, L.WASH_SERVICE],
          ]}
          foot={["סך הכול", L.WASH_PRICES, L.WASH.total]}
        />
        <P>רק חלק החכירה הוא תשלום חכירה, ולכן רק הוא נכנס להשקעה נטו:</P>
        <Formula>השקעה נטו = ערך נוכחי של חלק החכירה, בריבית הגלומה</Formula>
        <p>
          <Ltr>{`${n(L.WASH_LEASE)} × (1 − 1.06^(−${L.WASH.years})) ÷ 0.06 = ${n(L.WASH_NI)}`}</Ltr>
        </p>
        <p>
          באקסל: <Ltr>{`=PV(6%;${L.WASH.years};-${L.WASH_LEASE}) → ${n(L.WASH_NI)}`}</Ltr>
        </p>
        <JournalEntry
          title="1.1 של שנה 1"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.WASH_NI },
            { account: "מכונות, רכוש קבוע", cr: L.WASH.bookValue },
            { account: "רווח הון", cr: L.WASH_GAIN },
          ]}
        />
        <P>
          בסוף כל שנה נכנסים {n(L.WASH.total)}, והם מתחלקים לשלושה. {n(L.WASH_SERVICE)} הם הכנסה מתחזוקה, כי השירות ניתן לאורך השנה. מתוך {n(L.WASH_LEASE)} של החכירה, חלק הוא הכנסות מימון על היתרה, והשאר מקטין את ההשקעה נטו:
        </P>
        <Formula>הכנסות מימון = יתרת פתיחה × ריבית</Formula>
        <p>
          <Ltr>{`${n(L.WASH_NI)} × 6% = ${n(L.WASH_ROWS[0].income)}`}</Ltr>
        </p>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "מזומן", dr: L.WASH.total },
            { account: "הכנסות מתחזוקה", cr: L.WASH_SERVICE },
            { account: "הכנסות מימון", cr: L.WASH_ROWS[0].income },
            { account: "השקעה נטו בחכירה", cr: L.WASH_LEASE - L.WASH_ROWS[0].income },
          ]}
        />
        <Invest rows={L.WASH_ROWS} />
        <Tbl
          dense
          head={["רווח או הפסד", ...L.WASH_ROWS.map((y) => `שנה ${y.year}`)]}
          rows={[
            ["רווח הון", -L.WASH_GAIN, 0, 0, 0],
            ["הכנסות מימון", ...L.WASH_ROWS.map((y) => -y.income)],
            ["הכנסות מתחזוקה", ...L.WASH_ROWS.map(() => -L.WASH_SERVICE)],
          ]}
          foot={["סך הכול", -L.WASH_GAIN - L.WASH_ROWS[0].income - L.WASH_SERVICE, ...L.WASH_ROWS.slice(1).map((y) => -y.income - L.WASH_SERVICE)]}
        />
        <P>
          מה היה קורה בלי ההפרדה? ההשקעה נטו הייתה <Ltr>{`=PV(6%;${L.WASH.years};-${L.WASH.total}) → ${n(L.WASH_WRONG_NI)}`}</Ltr>, ורווח ההון ביום הראשון <M v={L.WASH_WRONG_GAIN} /> במקום <M v={L.WASH_GAIN} />. כל ההפרש הוא תחזוקה של ארבע השנים הבאות, שנרשמה כרווח לפני שמישהו הזיז מברג.
        </P>
        <Part title="ואם החכירה תפעולית">
          <P>
            נניח שהמכונות לא עוברות למכבסה, וחוזרות לחברה עם רוב חייהן. החלוקה זהה, כי היא לא תלויה בסיווג. המכונות נשארות בספרים, עם {L.WASH.lifeLeft} שנות חיים. חלק החכירה הוא הכנסה מהשכרה בקו ישר (סעיף 81), והתחזוקה הכנסה נפרדת, כשהשירות ניתן.
          </P>
          <Tbl
            dense
            head={["רווח או הפסד, כל שנה", "סכום"]}
            rows={[
              ["הכנסות מהשכרה", -L.WASH_LEASE],
              ["הכנסות מתחזוקה", -L.WASH_SERVICE],
              [<>פחת: <Ltr key="dep">{`${n(L.WASH.bookValue)} ÷ ${L.WASH.lifeLeft}`}</Ltr></>, L.WASH_OP_DEP],
            ]}
            foot={["סך הכול", L.WASH_OP_PL]}
          />
          <P>כאן הרווח של השנה לא היה משתנה גם בלי ההפרדה, כי שני החלקים נרשמים שווה בשווה. אבל ההכנסה מהשכרה הייתה מוצגת ב-{n(L.WASH.total)}, ושאלה שמבקשת אותה לבד, או את ההכנסה מחכירות בביאור, הייתה מקבלת מספר שגוי.</P>
        </Part>
        <Remember>מחכיר תמיד מפריד שירות מחכירה, לפי מחירים נפרדים (סעיף 17). רק חלק החכירה נכנס להשקעה נטו או להכנסה מהשכרה. השירות הוא הכנסה כשהוא ניתן.</Remember>
      </>
    ),
  },
  "ls-lsr-credit": {
    lead: "השקעה נטו היא כסף שהחוכר חייב, והוא עלול לא לשלם. לכן גם עליה חלים כללי ירידת הערך של IFRS 9, התקן של נכסים פיננסיים.",
    body: (
      <>
        <P>המחכיר לא מחכה שהחוכר יפסיק לשלם. הוא מכיר מראש בהפסדי אשראי חזויים על ההשקעה נטו (סעיף 77). אילו חיכה, היתרה במאזן הייתה מוצגת במלואה עד היום שבו הכסף כבר אבוד.</P>
        <P>לחייבים בחכירה אפשר לבחור כמדיניות חשבונאית בין המודל הכללי לבין הכרה בהפסדי אשראי חזויים לכל אורך החיים. הבחירה נפרדת בין חייבים בחכירה מימונית לחייבים בחכירה תפעולית.</P>
        <P>שימו לב שזה עניין אחר מהירידה באומדן השייר. שם המחכיר טעה בכמה הנכס יהיה שווה. כאן הוא חושש שהחוכר לא יעמוד בתשלומים.</P>
      </>
    ),
  },
  "ls-lsr-map": {
    lead: "כל מה שלמדנו, בטבלה אחת.",
    body: (
      <>
        <Tbl
          dense
          head={["", "תפעולית", "מימונית, לא סוחר", "מימונית, סוחר"]}
          rows={[
            ["הנכס", "נשאר", "יוצא", "יוצא"],
            ["יום ראשון", "כלום", "רווח הון, אם יש", "מכירות ועלות מכר"],
            ["עלויות ישירות", "על הנכס, ונפרסות", "בהשקעה נטו", "הוצאה"],
            ["כל שנה", "הכנסה בקו ישר, ופחת", "הכנסות מימון", "הכנסות מימון"],
            ["במאזן", "הנכס, הכנסות לקבל", "השקעה נטו", "השקעה נטו"],
          ]}
        />
      </>
    ),
  },
  "ls-lsr-drill": {
    lead: "כל לחיצה נותנת עסקה חדשה. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["opIncome", "financeYear", "dealerProfit", "residualCogs"]} />,
  },
  "ls-lsr-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנט">
        <p>העסקה: סוחר מחכיר מכונה בחכירה מימונית. שווי הוגן 100,000 ש״ח, עלות 70,000 ש״ח, ועלויות השגה 4,000 ש״ח. המכונה חוזרת בסוף, עם שייר שלא מובטח בערך נוכחי של 5,000 ש״ח. התשלומים צמודים למדד.</p>
        <p>הפתרון: ״השקעה נטו 104,000 ש״ח. מכירות 100,000 ש״ח ועלות מכר 70,000 ש״ח. כשהמדד עלה, עדכנתי את ההשקעה נטו.״</p>
      </Story>
    ),
    check: quiz("ls-lsr-mistake", [
      {
        q: "מה הטעות בהשקעה נטו?",
        options: ["אצל סוחר העלויות הן הוצאה, ולכן 100,000", "צריך 110,000", "צריך 96,000", "אין טעות"],
        answer: 0,
        why: "סעיף 74.",
      },
      {
        q: "מה הטעות במכירות ובעלות המכר?",
        options: ["השייר יורד משתיהן: 95,000 ו-65,000", "השייר יורד רק ממכירות", "השייר מתווסף לשתיהן", "אין טעות"],
        answer: 0,
        why: "סעיף 71.",
      },
      {
        q: "מה הטעות במדד?",
        options: ["המחכיר לא מודד מחדש. התוספת היא הכנסה", "צריך לעדכן גם את המכירות", "צריך לעדכן גם את עלות המכר", "אין טעות"],
        answer: 0,
        why: "סעיפים 70(ב), 90(א)(iii).",
      },
    ]),
  },
  "ls-lsr-master": {
    lead: "כמו במבחן: אותה חנות שראינו מצד החוכר, עכשיו בספרי המחכיר. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״מגדל״, יצרנית מבנים, החכירה חנות ל-{L.STORE.years} שנים, כולל הארכה ודאית. התשלום <Money v={L.STORE.payment} /> בסוף כל שנה, צמוד למדד, ועוד 2% מהכנסות החנות. בסוף התקופה ודאי באופן סביר שהחוכר יקנה את החנות ב-<Money v={L.STORE.option} />, מחיר נמוך בהרבה מהשווי הצפוי, שאינו צמוד.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                שווי הוגן <Money v={L.STORE.fairValue} />, עלות <Money v={L.STORE.cost} />, ועלויות השגת החכירה <Money v={L.STORE.costs} />.
              </li>
              <li>אורך החיים של החנות {L.STORE.life} שנים, וריבית השוק שווה לריבית הגלומה בחכירה.</li>
              <li>
                בסוף שנה 1 המדד עלה מ-{L.STORE.base} ל-{L.STORE.index}, והכנסות החנות היו <Money v={L.STORE.sales} />.
              </li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: סווגו, והציגו את הסעיפים בספרי המחכיר לשנה 1.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                { title: "סיווג", body: <p>מימונית: אופציית רכישה ודאית (סעיף 63(ב)), וגם 8 מתוך 10 שנות חיים (סעיף 63(ג)).</p> },
                {
                  title: "ריבית גלומה",
                  body: (
                    <p>
                      <Ltr>{`=RATE(8;100000;-700000;8000) → ${pct(L.STORE_RATE)}`}</Ltr>. העלויות בחוץ, כי המחכיר יצרן. המדד לפי מועד התחילה (סעיף 70(ב)). ריבית השוק שווה לריבית הגלומה, ולכן המכירות הן השווי ההוגן (סעיף 71(א)).
                    </p>
                  ),
                },
                {
                  title: "השקעה נטו",
                  body: (
                    <Tbl
                      dense
                      head={["", "סכום"]}
                      rows={[
                        ["1.1", L.STORE.fairValue],
                        ["הכנסות מימון", L.STORE_INT],
                        ["תקבול שנכלל במדידה", -L.STORE.payment],
                      ]}
                      foot={["31.12", L.STORE_CLOSE]}
                    />
                  ),
                },
                {
                  title: "התקבולים בפועל",
                  body: (
                    <Tbl
                      dense
                      head={["", "סכום"]}
                      rows={[
                        ["התשלום הבסיסי", L.STORE.payment],
                        ["תוספת מדד: הכנסה", L.STORE_INDEX],
                        ["2% מההכנסות: הכנסה", L.STORE_VAR],
                      ]}
                      foot={["סך הכול במזומן", L.STORE_CASH]}
                    />
                  ),
                },
                {
                  title: "הדוחות",
                  body: (
                    <>
                      <Tbl
                        dense
                        head={["רווח או הפסד", "שנה 1"]}
                        rows={[
                          ["מכירות", -L.STORE.fairValue],
                          ["עלות המכר", L.STORE.cost],
                          ["הוצאות השגה", L.STORE.costs],
                          ["הכנסות מימון", -L.STORE_INT],
                          ["הכנסה מהצמדה", -L.STORE_INDEX],
                          ["הכנסה לפי מכירות", -L.STORE_VAR],
                        ]}
                        foot={["סך הכול", -L.STORE_TOTAL]}
                      />
                      <Tbl
                        dense
                        head={["מצב כספי, 31.12", "שנה 1"]}
                        rows={[
                          ["השקעה נטו, שוטפת", L.STORE_CLOSE - L.STORE_NC],
                          ["השקעה נטו, לא שוטפת", L.STORE_NC],
                        ]}
                      />
                    </>
                  ),
                },
                { title: "מלכודת נפוצה", body: <p>למדוד מחדש את ההשקעה נטו בגלל המדד, כמו אצל החוכר. אצל המחכיר התוספת היא הכנסה נפרדת.</p> },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אתם מכירים את שני המודלים. ומה קורה כשמשנים חוזה אצל המחכיר?">בשיעור הבא: תיקוני חכירה בספרי המחכיר, לפי הסיווג המקורי.</Bridge>
      </>
    ),
  },
};
