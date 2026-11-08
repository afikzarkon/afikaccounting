import { Banknote, Car, ListChecks, PiggyBank, Scale, Search, Store, Truck } from "lucide-react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import { CASH_ITEMS, CASH_OPTIONS, DEP_CASES, FILL_TASK, KIOSK, KIOSK_ACCRUED, KIOSK_EXPENSE, KIOSK_PAID, KIOSK_PER_MONTH, KIOSK_TOTAL, LAPTOP, LAPTOP_FULL, LOW_ITEMS, LOW_OPTIONS, MASTER, MASTER_EXP_FORKLIFT, MASTER_EXP_LINES, MASTER_EXP_SHARES, MASTER_EXP_VAN, MASTER_EXP_YEARLY, MASTER_FORKLIFT, MASTER_LINES, MASTER_SHARES, MASTER_TOTAL, MASTER_VAN, MASTER_YEARLY, SHORT_ITEMS, SHORT_OPTIONS, TRUCK, TRUCK_END, TRUCK_START, WORK, WORK_S, WORK_SECTIONS } from "@/lib/study/ifrs16/lessons/subsequent";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { DecisionTree, Fork, TwoPanel, WrongRight, YearCompare } from "./ias19-visuals";
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

export const IFRS16_SUBSEQUENT_SCREENS: Record<string, ScreenContent> = {
  "ls-sub-hook": {
    lead: "אחרי היום הראשון יש שני מעגלים נפרדים: ההתחייבות יורדת בתשלומים, והנכס יורד בפחת.",
    body: (
      <>
        <Story icon={<Truck />} title="עברה שנה">
          <p>חברה חכרה משאית לפני שנה. בסוף השנה היא שילמה למחכיר, והמשאית התיישנה בשנה.</p>
          <p>אלה שני דברים שונים, ולכן יש שתי תנועות: החוב משתנה מריבית ומתשלומים, והנכס משתנה מפחת. אין שום קשר ביניהן אחרי היום הראשון.</p>
        </Story>
        <TwoPanel
          label="שני מעגלים. התחייבות החכירה: פתיחה, ועוד ריבית, פחות תשלום. נכס זכות השימוש: פתיחה, פחות פחת"
          panels={[
            { title: "התחייבות החכירה (סעיף 36)", icon: <Scale />, steps: ["גדלה בריבית", "קטנה בתשלום"], verdict: "הוצאה: ריבית", tone: 3 },
            { title: "נכס זכות השימוש (סעיף 30)", icon: <PiggyBank />, steps: ["קטן בפחת", "לא מושפע מהתשלום"], verdict: "הוצאה: פחת", tone: 1 },
          ]}
        />
        <Rule>התשלום אינו הוצאה. הוא מקטין חוב. ההוצאות בדוח הן ריבית ופחת.</Rule>
        <Remember>שתי היתרות לא שוות זו לזו אחרי היום הראשון, וזה תקין. הן זזות בקצב שונה.</Remember>
      </>
    ),
  },
  "ls-sub-end": {
    lead: "כשמשלמים בסוף שנה, החוב עומד במלואו כל השנה. לכן הריבית על יתרת הפתיחה.",
    body: (
      <>
        <Part title="המעגל (סעיפים 36, 37)">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"פתיחה + ריבית − תשלום = סגירה"}</Ltr>
          </p>
        </Part>
        <Story icon={<Truck />} title="המשאית">
          <p>
            <M v={TRUCK.payment} /> בסוף כל שנה, {TRUCK.years} שנים, ריבית {pct(TRUCK.rate)}. ההתחייבות ביום הראשון: <M v={TRUCK_END.rows[0].opening} />.
          </p>
        </Story>
        <LiabilityCycle rows={TRUCK_END.rows} />
        <P>
          שימו לב לשורת הריבית: היא יורדת כל שנה, כי החוב קטן. שיעור הריבית קבוע (סעיף 37), והיתרה בסוף התקופה מגיעה בדיוק לאפס.
        </P>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "הוצאות מימון", dr: TRUCK_END.rows[0].interest },
            { account: "התחייבות חכירה", dr: TRUCK.payment - TRUCK_END.rows[0].interest },
            { account: "מזומן", cr: TRUCK.payment },
          ]}
        />
        <Deeper title="בדיקה מהירה לכל יתרה">
          <P>
            היתרה בכל 31.12 היא הערך הנוכחי של התשלומים שנשארו. אחרי שנה נשארו 3 תשלומים: <Ltr>{"=PV(7%;3;-30000)"}</Ltr>, כלומר {n(TRUCK_END.rows[0].closing)}.
          </P>
        </Deeper>
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
    lead: "כשמשלמים בתחילת שנה, הכסף יצא ביום הראשון של השנה. לכן הריבית רק על מה שנשאר אחרי התשלום.",
    body: (
      <>
        <WrongRight
          label="טעות: ריבית על היתרה לפני התשלום. נכון: ריבית על היתרה אחרי התשלום"
          wrong={<p>״החוב ב-1.1 הוא {n(TRUCK_START.rows[1].opening)}, אז הריבית של שנה 2 היא {n(TRUCK_START.rows[1].opening * TRUCK.rate)}.״</p>}
          right={
            <p>
              ב-1.1 משלמים {n(TRUCK.payment)}, ונשארים {n(TRUCK_START.rows[1].opening - TRUCK.payment)}. הריבית של שנה 2 היא {n(TRUCK_START.rows[1].interest)}.
            </p>
          }
        />
        <Part title="המעגל, כשהתשלום ב-1.1">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"(פתיחה − תשלום) × ריבית = הוצאות מימון"}</Ltr>
          </p>
        </Part>
        <P>אותה משאית, אותם תשלומים, והפעם בתחילת כל שנה:</P>
        <LiabilityCycle rows={TRUCK_START.rows} />
        <P>
          ״יתרה ב-1.1״ של שנה 1 היא הערך הנוכחי של כל {TRUCK.years} התשלומים, לפני התשלום של היום. בשורה הבאה הוא יוצא, ונשארת ההתחייבות שחישבנו בשיעור הקודם: {n(TRUCK_START.rows[0].opening - TRUCK.payment)}.
        </P>
        <Remember>
          בסוף כל שנה עדיין יש ריבית שנצברה, ולמחרת מגיע תשלום. בשנה האחרונה אין ריבית כלל, כי התשלום של 1.1 סוגר את החוב.
        </Remember>
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
    lead: "שאלה אחת קובעת את הפחת: האם החוכר יישאר עם הנכס בסוף?",
    body: (
      <>
        <DecisionTree
          label="על פני כמה שנים מפחיתים. הבעלות עוברת בסוף החכירה, או שהעלות כוללת אופציית רכישה שתמומש? לאורך החיים. אחרת, הקצר מבין אורך החיים ותקופת החכירה"
          questions={[{ q: "הבעלות עוברת בסוף, או שהעלות משקפת מימוש של אופציית רכישה?", yes: "לאורך החיים השימושיים", tone: 1 }]}
          fallback={{ label: "אחרת: הקצר מבין החיים והתקופה", tone: 3 }}
        />
        <P>ההיגיון פשוט: אם הנכס יישאר אצל החוכר, הוא ימשיך להפיק ממנו תועלת גם אחרי החכירה. אם הנכס יחזור, התועלת נגמרת לכל המאוחר כשהחכירה נגמרת.</P>
        <Tbl
          head={["המקרה", "שנות פחת", "למה"]}
          rows={DEP_CASES.map((c) => [c.text, c.over, c.why])}
        />
        <Part title="המעגל (סעיף 30)">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"עלות − פחת נצבר = נכס זכות שימוש, נטו"}</Ltr>
          </p>
        </Part>
        <P>
          המשאית: עלות <M v={TRUCK_END.cost} />, {TRUCK.years} שנים לפי החוזה, ו-{TRUCK.life} שנות חיים. היא חוזרת למחכיר, ולכן הפחת על פני {TRUCK.years} שנים, כלומר <M v={TRUCK_END.rows[0].depreciation} /> בשנה.
        </P>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "הוצאות פחת", dr: TRUCK_END.rows[0].depreciation },
            { account: "פחת נצבר", cr: TRUCK_END.rows[0].depreciation },
          ]}
        />
        <Remember>ההפניה בסעיף 31 היא ל-IAS 16: אותם כללי פחת כמו ברכוש קבוע. בכל השאלות כתוב באיזו שיטה מפחיתים.</Remember>
        <Deeper title="ירידת ערך">
          <P>גם על נכס זכות שימוש חל IAS 36 (סעיף 33). אם יש ירידת ערך, היא מקטינה את הנכס, בנוסף לפחת.</P>
        </Deeper>
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
    lead: "כמעט תמיד מודדים את הנכס בעלות. יש שני מקרים שבהם התקן שולח למודל אחר.",
    body: (
      <>
        <Tbl
          head={["מתי", "איך מודדים", "חובה?"]}
          rows={[
            ["תמיד, כברירת מחדל (סעיף 29)", "עלות, פחות פחת נצבר וירידת ערך", "כן"],
            ["הנכס עונה להגדרת נדל״ן להשקעה, והחברה מודדת נדל״ן להשקעה בשווי הוגן (סעיף 34)", "שווי הוגן", "כן, כשזו המדיניות"],
            ["הנכס שייך לקבוצת רכוש קבוע שנמדדת בהערכה מחדש (סעיף 35)", "הערכה מחדש, לכל הקבוצה", "לא, רשות"],
          ]}
        />
        <Rule>שימו לב להבדל: בנדל״ן להשקעה המודל מחייב. ברכוש קבוע הוא רשות.</Rule>
        <Remember>את המעבר של נכס זכות שימוש לנדל״ן להשקעה בשווי הוגן נלמד בשיעור 8. בשיעור הזה כל הדוגמאות במודל העלות.</Remember>
      </>
    ),
  },
  "ls-sub-current": {
    lead: "החלק השוטף הוא מה שיירד מהחוב בתוך 12 חודשים. השאלה היחידה: מתי מגיע התשלום הבא?",
    body: (
      <>
        <Fork
          label="תשלום בסוף שנה: הלא שוטף הוא היתרה של סוף השנה הבאה. תשלום בתחילת שנה: הלא שוטף הוא היתרה פחות התשלום של מחר. אם לא נשאר תשלום מעבר ל-12 חודשים, הכול שוטף"
          question="מתי התשלום הבא?"
          branches={[
            { when: "בעוד שנה, ב-31.12", then: "לא שוטף = היתרה של סוף השנה הבאה" },
            { when: "מחר, ב-1.1", then: "לא שוטף = היתרה פחות התשלום של מחר" },
          ]}
        />
        <P>המשאית, ב-31.12 של שנה 1, בשני המקרים:</P>
        <Tbl
          dense
          head={["", "תשלום בסוף שנה", "תשלום בתחילת שנה"]}
          rows={[
            ["היתרה", TRUCK_END.rows[0].closing, TRUCK_START.rows[0].closing],
            ["לא שוטף", TRUCK_END.rows[0].nonCurrent, TRUCK_START.rows[0].nonCurrent],
          ]}
          foot={["שוטף", TRUCK_END.rows[0].current, TRUCK_START.rows[0].current]}
        />
        <P>
          למה בסוף שנה השוטף אינו {n(TRUCK.payment)}? כי התשלום הבא כולל ריבית של השנה הבאה, שעדיין לא נוצרה ולא נמצאת ביתרה. הקרן בלבד יורדת: {n(TRUCK_END.rows[0].current)}.
        </P>
        <P>
          ולמה בתחילת שנה השוטף כן {n(TRUCK.payment)}? כי התשלום משולם מחר, ואין ריבית בדרך.
        </P>
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
        <Remember>נסו: העבירו את התשלום לתחילת שנה וראו שהריבית יורדת. הוסיפו אופציית רכישה וראו שהפחת מתפרס על פני אורך החיים.</Remember>
      </>
    ),
  },
  "ls-sub-other": {
    lead: "לא כל מה שמשלמים בחוזה עובר דרך המעגלים. יש תשלומים שהולכים ישר לרווח או הפסד.",
    body: (
      <>
        <Tbl
          head={["מה", "מתי נרשם", "מקור"]}
          rows={[
            ["תשלום לפי מכירות או שימוש", "בשנה שבה המכירות או השימוש קרו", "סעיף 38(ב)"],
            ["תחזוקה שהופרדה מהחכירה", "בשנה שבה ניתן השירות", "סעיף 12"],
            ["תמריץ בעין, כמו ביטוח חינם", "בשנה שהביטוח מכסה", "לפי מהות ההוצאה"],
          ]}
        />
        <Story icon={<Car />} title="ביטוח חינם">
          <p>
            המחכיר נותן ביטוח חינם לשנה ששוויו <M v={WORK.insurance} />. ביום הראשון הוא הקטין את עלות הנכס, וכנגדו נרשמו הוצאות מראש.
          </p>
          <p>בשנה הראשונה הביטוח נצרך, ולכן ההוצאות מראש הופכות להוצאה:</p>
        </Story>
        <JournalEntry
          title="31.12 של שנה 1"
          lines={[
            { account: "הוצאות ביטוח", dr: WORK.insurance },
            { account: "הוצאות מראש", cr: WORK.insurance },
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
    lead: "כל מספר מהמעגלים נכנס לסעיף אחד בדוחות. ״להציג סעיפים רלוונטיים״ פירושו בדיוק זה.",
    body: (
      <>
        <P>המשאית, בתשלום בסוף שנה, בשנתיים הראשונות:</P>
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
                { id: "cur", label: "התחייבות חכירה, שוטפת", values: [TRUCK_END.rows[0].current, TRUCK_END.rows[1].current] },
                { id: "non", label: "התחייבות חכירה, לא שוטפת", values: [TRUCK_END.rows[0].nonCurrent, TRUCK_END.rows[1].nonCurrent] },
              ],
            },
          ]}
        />
        <Part title="שלושה כללי הצגה">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>
              <T16 he="ריבית בנפרד מפחת" par="סעיף 49" />: אי אפשר לחבר אותן לשורה אחת של ״הוצאות חכירה״.
            </li>
            <li>
              <T16 he="נכס בנפרד" par="סעיף 47(א)" />: בדוח או בביאור. אם רק בביאור, הוא נכלל בסעיף שבו היה מוצג אילו היה בבעלות, ומגלים באיזה סעיף.
            </li>
            <li>
              <T16 he="התחייבות בנפרד" par="סעיף 47(ב)" />: בדוח או בביאור, וגם כאן מגלים באיזה סעיף.
            </li>
          </ul>
        </Part>
        <Remember>נכס זכות שימוש שהוא נדל״ן להשקעה מוצג כנדל״ן להשקעה, ולא בנפרד (סעיף 48).</Remember>
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
    lead: "דוגמה שלמה, לפי הסדר של תשובה במבחן: עלות, שני מעגלים, דוחות.",
    body: (
      <>
        <Story icon={<Car />} title="רכב, אופציה וביטוח חינם">
          <p>
            ב-1.1 של שנה 1 חברה חכרה רכב חדש ל-{WORK.years} שנים, ב-<M v={WORK.payment} /> בתחילת כל שנה, והראשון שולם ב-1.1. ריבית גלומה {pct(WORK.rate)}, ידועה לחברה.
          </p>
          <p>
            ודאי באופן סביר שהחברה תקנה את הרכב בסוף ב-<M v={WORK.option} />, ותשתמש בו עוד שנתיים. אורך החיים: {WORK.life} שנים. המחכיר נותן ביטוח חינם לשנה ששוויו <M v={WORK.insurance} />, והחברה שילמה אגרות של <M v={WORK.fees} />.
          </p>
          <p className="font-semibold">נדרש: הציגו את הסעיפים הרלוונטיים בדוחות לכל {WORK.years} השנים.</p>
        </Story>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "עלות הנכס",
              body: (
                <Tbl
                  head={["רכיב", "סכום"]}
                  rows={[
                    ["ערך נוכחי: 4 תשלומים ומחיר האופציה", WORK_S.rows[0].opening],
                    ["אגרות", WORK.fees],
                    ["תמריץ בעין: ביטוח", -WORK.insurance],
                  ]}
                  foot={["עלות הנכס", WORK_S.cost]}
                />
              ),
            },
            {
              title: "מעגל ההתחייבות",
              body: (
                <>
                  <LiabilityCycle rows={WORK_S.rows} />
                  <p>הריבית על היתרה אחרי התשלום של 1.1. בסוף שנה 4 משלמים את מחיר האופציה, והיתרה מתאפסת.</p>
                </>
              ),
            },
            {
              title: "מעגל הנכס",
              body: (
                <>
                  <p>
                    החברה תקנה את הרכב, ולכן הפחת על פני {WORK.life} שנים, לא {WORK.years} (סעיף 32). בסוף שנה 4 נשארים עוד 2 שנות פחת.
                  </p>
                  <AssetCycle rows={WORK_S.rows} cost={WORK_S.cost} />
                </>
              ),
            },
            {
              title: "הדוחות",
              body: (
                <>
                  <StatementTables sections={WORK_SECTIONS} />
                  <p>
                    בסוף שנה 2 יש חלק לא שוטף, כי נשאר תשלום מעבר ל-12 חודשים. בסוף שנה 3 הכול שוטף: התשלום של מחר ומחיר האופציה, שניהם בתוך 12 חודשים.
                  </p>
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
    lead: "החוכר רשאי לוותר על הנכס וההתחייבות, ולרשום הוצאה בקו ישר. הקלה ראשונה: חכירה קצרה.",
    body: (
      <>
        <Part title="חכירה לטווח קצר (נספח א׳)">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>תקופת החכירה, במועד התחילה, 12 חודשים או פחות.</li>
            <li>אין בה אופציית רכישה, גם אם לא בטוח שתמומש.</li>
            <li>הבחירה לפי קבוצה של נכסים דומים בשימוש דומה (סעיף 8).</li>
          </ul>
        </Part>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-short" items={SHORT_ITEMS} options={SHORT_OPTIONS} />
        </TaskFrame>
        <Rule>בודקים את תקופת החכירה מהשיעור השני, לא את אורך החוזה.</Rule>
        <Remember>שינוי בתקופה, או תיקון בחוזה, והחכירה נחשבת חכירה חדשה, ובודקים הכול שוב (סעיף 7).</Remember>
      </>
    ),
  },
  "ls-sub-low": {
    lead: "הקלה שנייה: נכס שערכו נמוך. המבחן הוא על הנכס, לא על החברה.",
    body: (
      <>
        <Part title="נכס בעל ערך נמוך (ב3–ב8)">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>מוערך לפי הערך של נכס <strong>חדש</strong>, גם אם המוחכר ישן (ב3).</li>
            <li>הערכה <strong>מוחלטת</strong>: לא משנה כמה החברה גדולה (ב4).</li>
            <li>אפשר להפיק ממנו תועלת לבדו, והוא לא תלוי מאוד בנכסים אחרים (ב5).</li>
            <li>הבחירה לכל חכירה בנפרד (סעיף 8).</li>
          </ul>
        </Part>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-low" items={LOW_ITEMS} options={LOW_OPTIONS} />
        </TaskFrame>
        <Deeper title="מקרה אחד שיוצא מההקלה (ב7)">
          <P>חוכר שמחכיר את הנכס הלאה, או מצפה לעשות זאת, אינו יכול לטפל בחכירה הראשית כחכירה של נכס בעל ערך נמוך.</P>
        </Deeper>
        <Rule>
          טווח קצר: <strong>לפי קבוצה</strong>. ערך נמוך: <strong>לכל חכירה</strong>.
        </Rule>
      </>
    ),
  },
  "ls-sub-line": {
    lead: "בהקלה אין נכס ואין התחייבות. פורסים את כל התשלומים על התקופה, בקו ישר.",
    body: (
      <>
        <Part title="סעיף 6">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"סך התשלומים ÷ תקופת החכירה = הוצאה לתקופה"}</Ltr>
          </p>
        </Part>
        <Story icon={<Store />} title="דוכן לשנה">
          <p>
            חברה חכרה דוכן ל-{KIOSK.months} חודשים החל מ-1.7, ובחרה בהקלה לטווח קצר. {KIOSK.free} החודשים הראשונים בחינם, ובכל חודש אחריהם <M v={KIOSK.monthly} />.
          </p>
        </Story>
        <Tbl
          head={["", "סכום"]}
          rows={[
            ["סך התשלומים: 10 חודשים", KIOSK_TOTAL],
            ["לחודש, בקו ישר", KIOSK_PER_MONTH],
            ["הוצאה עד 31.12: 6 חודשים", KIOSK_EXPENSE],
            ["שולם עד 31.12: 4 חודשים", KIOSK_PAID],
          ]}
          foot={["הוצאות לשלם ב-31.12", KIOSK_ACCRUED]}
        />
        <P>ההוצאה לא הולכת אחרי הכסף: החודשים בחינם גם הם חלק מהתקופה.</P>
        <YearCompare
          label={`מחשבים ניידים ל-${LAPTOP.years} שנים, ${LAPTOP.payment} בשנה: בהקלה הוצאה שווה בכל שנה, במודל המלא הוצאה יורדת. הסכום הכולל זהה`}
          title={`אותה חכירה, שני טיפולים: ${LAPTOP.payment.toLocaleString("en-US")} ש״ח בסוף כל שנה, ריבית ${pct(LAPTOP.rate)}`}
          unit="הוצאה לכל שנה, בש״ח"
          columns={[
            { name: "הקלה: קו ישר", values: Array(LAPTOP.years).fill(LAPTOP.payment), tone: 1 },
            { name: "מודל מלא: פחת וריבית", values: LAPTOP_FULL, tone: 3 },
          ]}
          note="הסך זהה. המודל המלא רק מקדים הוצאה, כי הריבית גבוהה בהתחלה."
        />
        <Remember>בהקלה אין במאזן לא נכס ולא התחייבות חכירה. בדוח רווח או הפסד יש הוצאה אחת, בלי ריבית ובלי פחת.</Remember>
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
    lead: "גם בדוח על תזרימי המזומנים התשלום מתפצל: קרן לחוד, וריבית לחוד.",
    body: (
      <>
        <TaskFrame label="שאלת מיון" icon={<Banknote className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-sub-cash" items={CASH_ITEMS} options={CASH_OPTIONS} />
        </TaskFrame>
        <Story icon={<Truck />} title="המשאית, שנה 1">
          <p>
            התשלום <M v={TRUCK.payment} /> מתפצל: ריבית <M v={TRUCK_END.rows[0].interest} />, וקרן <M v={TRUCK.payment - TRUCK_END.rows[0].interest} />, שהיא פעילות מימון.
          </p>
        </Story>
        <Remember>
          <T16 he="הכלל" par="סעיף 50" />: קרן במימון, ריבית לפי IAS 7, והקלות ומשתנים בפעילות שוטפת.
        </Remember>
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
        <p>החוזה: רכב ל-3 שנים, 30,000 ש״ח בתחילת כל שנה, והראשון שולם במועד התחילה. אורך החיים 6 שנים, והרכב חוזר למחכיר בסוף.</p>
        <p>הפתרון: ״הריבית של שנה 2 מחושבת על היתרה ב-31.12 של שנה 1. הפחת על פני 6 שנים. בדוח רווח או הפסד רשמתי פחת, ריבית, ובנוסף את התשלום של 30,000 ש״ח.״</p>
      </Story>
    ),
    check: quiz("ls-sub-mistake", [
      {
        q: "מה הטעות בריבית?",
        options: ["הריבית על היתרה אחרי התשלום של 1.1", "הריבית צריכה להיות על עלות הנכס", "הריבית צריכה להיות על סך התשלומים", "אין טעות"],
        answer: 0,
        why: "התשלום יוצא ב-1.1, ולכן בשאר השנה החוב קטן ממנו.",
      },
      {
        q: "מה הטעות בפחת?",
        options: ["הרכב חוזר למחכיר, ולכן הקצר מבין החיים והתקופה: 3 שנים", "הפחת צריך להיות על פני 9 שנים", "אין פחת על נכס זכות שימוש", "אין טעות"],
        answer: 0,
        why: "סעיף 32: אין העברת בעלות ואין אופציית רכישה.",
      },
      {
        q: "מה הטעות בדוח רווח או הפסד?",
        options: ["התשלום אינו הוצאה. הוא מקטין את ההתחייבות", "חסר רווח מהתשלום", "הריבית לא נרשמת ברווח או הפסד", "אין טעות"],
        answer: 0,
        why: "סעיף 36(ב). הכללת התשלום סופרת את העלות פעמיים.",
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
