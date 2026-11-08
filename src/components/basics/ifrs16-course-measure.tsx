import { Building, Car, ListChecks, PiggyBank, Scale, Search, Truck, Warehouse } from "lucide-react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import { GUAR, GUAR_SHORTFALL, GUAR_WITH, GUAR_WITHOUT, IMPLICIT, IMPLICIT_LIABILITY, IMPLICIT_LIABILITY_DEALER, IMPLICIT_RATE, IMPLICIT_RATE_DEALER, MASTER, MASTER_CASH, MASTER_COST_SHOWN, MASTER_NET, MASTER_RESTORE, PAYMENT_ITEMS, PAYMENT_OPTIONS, PV_EX, PV_EX_END, PV_EX_GROSS, PV_EX_NET, WORK1, WORK1_L, WORK2, WORK2_L } from "@/lib/study/ifrs16/lessons/measure";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { DecisionTree, Fork, Timeline, TwoPanel, WrongRight } from "./ias19-visuals";
import { LeaseDrill, RouBuilder } from "./ifrs16-interactive";
import { FullSolution, P, quiz, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 3: the lessee on commencement. Nothing here looks
 * past that first day. Every figure comes from lib/study/ifrs16/lessons/measure.ts.
 */

/** An amount, rounded to the shekel: the solver keeps the precision, the screen shows whole shekels. */
const M = ({ v, plain }: { v: number; plain?: boolean }) => <Money v={Math.round(v)} plain={plain} />;
const pct = (r: number, d = 2) => `${(r * 100).toFixed(d)}%`;

export const IFRS16_MEASURE_SCREENS: Record<string, ScreenContent> = {
  "ls-meas-hook": {
    lead: "ביום שבו הנכס נמסר, החוכר רושם שני דברים: חוב על התשלומים, ונכס על הזכות להשתמש.",
    body: (
      <>
        <Story icon={<Truck />} title="צי של משאית אחת">
          <p>חברה קיבלה היום משאית לארבע שנים. בפועל היא קיבלה שני דברים: היא התחייבה לשלם, והיא יכולה להשתמש במשאית.</p>
          <p>לכן שני הצדדים של הפקודה מופיעים כבר היום, עוד לפני שעברה שנה אחת.</p>
        </Story>
        <TwoPanel
          label="שני דברים ביום הראשון: התחייבות חכירה, הערך הנוכחי של התשלומים שנשארו, ונכס זכות שימוש, שנמדד בעלות"
          panels={[
            { title: "התחייבות חכירה (סעיף 26)", icon: <Scale />, steps: ["מה עוד צריך לשלם", "בערך נוכחי, לא בסכום"], verdict: "ערך נוכחי", tone: 3 },
            { title: "נכס זכות שימוש (סעיף 23)", icon: <PiggyBank />, steps: ["הזכות להשתמש", "ההתחייבות, ועוד מה שעלה להשיג אותה"], verdict: "עלות", tone: 1 },
          ]}
        />
        <Rule>קודם מחשבים את ההתחייבות. ממנה בונים את עלות הנכס.</Rule>
        <Remember>בשיעור הזה נשארים ביום הראשון. מה קורה בסוף השנה, פחת וריבית, בשיעור הבא.</Remember>
      </>
    ),
  },
  "ls-meas-pv": {
    lead: "כסף שמשלמים בעתיד שווה היום פחות. לכן ההתחייבות קטנה מסכום התשלומים.",
    body: (
      <>
        <P>
          בכל הקורס נשתמש בנוסחה אחת: תשלום קבוע בסוף כל שנה, <Ltr>n</Ltr> שנים, בריבית <Ltr>i</Ltr>.
        </P>
        <Part title="הנוסחה">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"תשלום × (1 − (1 + i)^(−n)) ÷ i = ערך נוכחי"}</Ltr>
          </p>
        </Part>
        <Story icon={<Warehouse />} title="ארבעה תשלומים">
          <p>
            <M v={PV_EX.payment} /> בסוף כל שנה, {PV_EX.years} שנים, ריבית {pct(PV_EX.rate, 0)}.
          </p>
          <p>
            <Ltr>{`${PV_EX.payment.toLocaleString("en-US")} × (1 − 1.07^(−4)) ÷ 0.07 = ${Math.round(PV_EX_END).toLocaleString("en-US")}`}</Ltr>
          </p>
          <p>
            באקסל: <Ltr>{"=PV(7%;4;-30000)"}</Ltr>
          </p>
        </Story>
        <Timeline
          label={`ארבעה תשלומים של ${PV_EX.payment} בסוף כל שנה, ששווים היום ${Math.round(PV_EX_END)}`}
          title="ארבעה תשלומים, ומה הם שווים היום"
          from={0}
          to={4}
          ticks={[
            { at: 0, label: "היום" },
            { at: 1, label: "שנה 1" },
            { at: 2, label: "שנה 2" },
            { at: 3, label: "שנה 3" },
            { at: 4, label: "שנה 4" },
          ]}
          marks={[{ at: 0, label: <M v={PV_EX_END} plain />, strong: true }]}
        />
        <P>
          סכום התשלומים הוא <M v={PV_EX.payment * PV_EX.years} />, והערך הנוכחי <M v={PV_EX_END} />. ההפרש הוא הריבית שתירשם לאורך השנים.
        </P>
        <Deeper title="אם יש גם סכום בסוף התקופה">
          <P>
            מוסיפים אותו מהוון: <Ltr>{"סכום ÷ (1 + i)^n"}</Ltr>. באקסל הוא הפרמטר הרביעי: <Ltr>{"=PV(i;n;-תשלום;-סכום)"}</Ltr>.
          </P>
        </Deeper>
      </>
    ),
  },
  "ls-meas-what": {
    lead: "בהתחייבות יש רק תשלומים שאי אפשר להימנע מהם, או שמניחים שישולמו. כל השאר בחוץ.",
    body: (
      <>
        <P>
          <T16 he="חמישה סוגי תשלומים" par="סעיף 27" />: קבועים, צמודי מדד או שער, מחיר אופציית רכישה ודאית, קנס ביטול אם התקופה מניחה ביטול, וסכום צפוי בגין ערבות שייר.
        </P>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-meas-what" items={PAYMENT_ITEMS} options={PAYMENT_OPTIONS} />
        </TaskFrame>
        <Rule>התקופה והתשלומים הולכים יחד. מה שנספר בתקופה נספר גם בתשלומים, ולהפך.</Rule>
        <Remember>תשלום לפי מכירות או לפי שימוש אינו בהתחייבות. הוא הוצאה בשנה שבה הוא קורה (סעיף 38(ב)).</Remember>
      </>
    ),
  },
  "ls-meas-index": {
    lead: "תשלום צמוד למדד נכנס להתחייבות לפי המדד של היום. לא מנחשים את העתיד.",
    body: (
      <>
        <WrongRight
          label="טעות: להוסיף את עליית המדד הצפויה. נכון: להשתמש במדד של מועד התחילה"
          wrong={<p>״המדד צפוי לעלות ב-2% בשנה, אז נחשב את התשלומים לפי התחזית.״</p>}
          right={<p>משתמשים במדד הקיים במועד התחילה (סעיף 27(ב)). כשהמדד ישתנה בפועל, נעדכן.</p>}
        />
        <P>כך גם בתשלום שצמוד לריבית משתנה, ובתשלום שמשתנה לפי דמי השכירות בשוק (סעיף 28): לוקחים את הערך של היום.</P>
        <P>ולמה לא כמו תשלום לפי מכירות? כי מדד הוא שינוי במחיר של אותו שימוש. מכירות תלויות במה שהחוכר עושה.</P>
        <Remember>מטבע חוץ: לפי חומרי הקורס תשלום כזה נחשב קבוע, ובתקן עצמו זה לא כתוב במפורש. את הפרשי השער נלמד בהמשך.</Remember>
      </>
    ),
    check: quiz("ls-meas-index", [
      {
        q: "תשלום של 10,000 ש״ח לשנה צמוד למדד. המדד היום 100, ותחזית הבנק המרכזי 103 בעוד שנה. איזה תשלום נכנס לחישוב?",
        options: ["10,000 ש״ח", "10,300 ש״ח", "ממוצע של השניים", "לא נכנס, כי הוא משתנה"],
        answer: 0,
        why: "סעיף 27(ב): לפי המדד הקיים במועד התחילה.",
      },
    ]),
  },
  "ls-meas-fixed": {
    lead: "לפעמים תשלום נראה משתנה, אבל אי אפשר באמת להימנע ממנו. אז הוא קבוע במהותו.",
    body: (
      <>
        <P>
          <T16 he="ב42" /> בודק מהות, לא ניסוח:
        </P>
        <DecisionTree
          label="קבוע במהותו. אין השתנות אמיתית? נכלל. רק אפשרות אחת מציאותית? היא נכללת. כמה אפשרויות מציאותיות וחובה לבחור אחת? הנמוכה מהן נכללת"
          questions={[
            { q: "מנוסח כמשתנה, אבל אין בו השתנות אמיתית?", yes: "נכלל בהתחייבות", tone: 1 },
            { q: "יש כמה אפשרויות, ורק אחת מציאותית?", yes: "האפשרות המציאותית נכללת", tone: 1 },
            { q: "כמה אפשרויות מציאותיות, וחייבים לבצע לפחות אחת?", yes: "הנמוכה מהן נכללת", tone: 1 },
          ]}
          fallback={{ label: "אחרת: תשלום משתנה שלא נכלל", tone: "danger" }}
        />
        <Story icon={<Building />} title="הגבוה מבין שניים">
          <p>החוכר ישלם את הגבוה מבין 25,000 ש״ח ו-3% מהמכירות. את 25,000 הוא ישלם בכל מקרה, ולכן הם נכנסים להתחייבות. מה שמעל זה תלוי במכירות, ונרשם כהוצאה כשהוא קורה.</p>
        </Story>
        <Deeper title="ועוד מקרה: משתנה שהופך לקבוע">
          <P>תשלום שתלוי בשימוש עד תאריך מסוים, ואחר כך נקבע ליתרת התקופה (ב42(א)(ii)). עד אז הוא משתנה. מרגע שהוא מתברר, הוא קבוע במהותו.</P>
        </Deeper>
      </>
    ),
  },
  "ls-meas-guarantee": {
    lead: "החוכר מכניס להתחייבות רק את מה שהוא צופה לשלם בגלל הערבות, ולא את כל הערבות.",
    body: (
      <>
        <P>
          <T16 he="ערבות לערך שייר" par="נספח א׳" /> היא התחייבות שהנכס יהיה שווה בסוף לפחות סכום מסוים. אם הוא שווה פחות, החוכר משלים.
        </P>
        <Story icon={<Car />} title="ערבות על מכונה">
          <p>
            ערבות של <M v={GUAR.guarantee} />, והחוכר צופה ערך של <M v={GUAR.expected} />. הוא צופה להשלים <M v={GUAR_SHORTFALL} />, וזה מה שנכנס.
          </p>
          <p>
            לכן ההתחייבות, על {GUAR.years} תשלומים של <M v={GUAR.payment} /> בריבית {pct(GUAR.rate, 0)}, היא <M v={GUAR_WITH} />, במקום <M v={GUAR_WITHOUT} /> בלי הערבות.
          </p>
        </Story>
        <Fork
          label="אותה ערבות, שני צדדים. החוכר מכניס רק את הסכום שהוא צופה לשלם. המחכיר מכניס את כל הערבות"
          question="מי רואה מה?"
          branches={[
            { when: "החוכר (סעיף 27(ג))", then: "רק הסכום שהוא צופה לשלם" },
            { when: "המחכיר (סעיף 70(ג))", then: "את כל הערבות, ונחזור לזה בשיעורי המחכיר" },
          ]}
        />
        <Remember>אם הערך הצפוי גבוה מהערבות, החוכר לא מכניס כלום.</Remember>
        <Deeper title="אופציה שמשולבת עם ערבות (ב38)">
          <P>אם אופציית הארכה או ביטול משולבת עם ערבות כך שהמחכיר מקבל את אותה תשואה בכל מקרה, מניחים שוודאי באופן סביר שהחוכר יאריך, או לא יבטל.</P>
        </Deeper>
      </>
    ),
  },
  "ls-meas-rate": {
    lead: "יש סדר קבוע: קודם הריבית הגלומה בחכירה, ורק אם אי אפשר לקבוע אותה, הריבית התוספתית.",
    body: (
      <>
        <DecisionTree
          label="איזו ריבית. אפשר לקבוע בנקל את הריבית הגלומה? משתמשים בה. אחרת, בריבית התוספתית של החוכר"
          questions={[{ q: "החוכר יכול לקבוע בנקל את הריבית הגלומה בחכירה?", yes: "הריבית הגלומה", tone: 1 }]}
          fallback={{ label: "אחרת: הריבית התוספתית של החוכר", tone: 3 }}
        />
        <P>
          <T16 he="ריבית תוספתית" par="נספח א׳" />: מה החוכר היה משלם על הלוואה לתקופה דומה, בביטחונות דומים, כדי להשיג נכס בערך דומה, בסביבה כלכלית דומה.
        </P>
        <P>
          <T16 he="ריבית גלומה" par="נספח א׳" />: הריבית שבה המחכיר ״מרוויח״ על העסקה. היא קשורה לשווי של הנכס ולעלויות המחכיר, ולכן לחוכר לא תמיד יש את הנתונים.
        </P>
        <Remember>בשאלות תמיד כתוב אם הריבית הגלומה ידועה לחוכר. קראו את המשפט הזה לפני שאתם מחשבים.</Remember>
      </>
    ),
    check: quiz("ls-meas-rate", [
      {
        q: "ריבית גלומה 7%, אבל היא לא ידועה לחוכר ואי אפשר לקבוע אותה בנקל. ריבית תוספתית 5%. באיזו מהוונים?",
        options: ["5%", "7%", "הגבוהה מביניהן", "הממוצע"],
        answer: 0,
        why: "סעיף 26: אם אי אפשר לקבוע בנקל את הגלומה, משתמשים בתוספתית.",
      },
    ]),
  },
  "ls-meas-implicit": {
    lead: "הריבית הגלומה היא הריבית שבה מה שהמחכיר יקבל שווה למה שהוא נתן.",
    body: (
      <>
        <Part title="ההגדרה (נספח א׳)">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"ערך נוכחי של תשלומי החכירה ושל השייר הלא מובטח = שווי הוגן + עלויות ישירות של המחכיר"}</Ltr>
          </p>
        </Part>
        <Story icon={<Car />} title="אותה חכירה, שני מחכירים">
          <p>
            שווי הוגן <M v={IMPLICIT.fairValue} />, עלויות של המחכיר <M v={IMPLICIT.lessorCosts} />, {IMPLICIT.years} תשלומים של <M v={IMPLICIT.payment} />. המחכיר צופה שהנכס יהיה שווה בסוף <M v={IMPLICIT.residual} />. מזה <M v={IMPLICIT.guaranteed} /> מובטחים על ידי החוכר, והחוכר צופה שלא ישלם עליהם כלום.
          </p>
        </Story>
        <Tbl
          head={["", "מחכיר רגיל", "יצרן או סוחר"]}
          rows={[
            ["מול מה מהוונים", <M key="a" v={IMPLICIT.fairValue + IMPLICIT.lessorCosts} plain />, <M key="b" v={IMPLICIT.fairValue} plain />],
            ["ריבית גלומה", pct(IMPLICIT_RATE), pct(IMPLICIT_RATE_DEALER)],
            ["התחייבות החוכר", <M key="c" v={IMPLICIT_LIABILITY} plain />, <M key="d" v={IMPLICIT_LIABILITY_DEALER} plain />],
          ]}
        />
        <P>אצל יצרן או סוחר העלויות לא נכללות בהגדרה, ולכן הריבית גבוהה יותר. עלויות שלו נרשמות כהוצאה (סעיף 74).</P>
        <Rule>כל השייר, גם מובטח וגם לא, נכנס לחישוב הריבית. אבל החוכר מהוון בריבית הזו רק את מה שהוא צופה לשלם.</Rule>
        <P>
          באקסל מוצאים ריבית כך: <Ltr>{"=RATE(5;30000;-154000;32000)"}</Ltr>
        </P>
      </>
    ),
  },
  "ls-meas-start": {
    lead: "כשמשלמים בתחילת שנה, התשלום הראשון כבר יצא. הוא לא בחוב, אבל הוא כן חלק ממה שעלה הנכס.",
    body: (
      <>
        <Timeline
          label="תשלומים בתחילת כל שנה. הראשון היום, ואחריו שלושה שמהוונים"
          title="ארבעה תשלומים בתחילת שנה"
          from={0}
          to={4}
          ticks={[
            { at: 0, label: "היום" },
            { at: 1, label: "תשלום" },
            { at: 2, label: "תשלום" },
            { at: 3, label: "תשלום" },
            { at: 4, label: "סוף" },
          ]}
          marks={[{ at: 0, label: "משלמים היום" }]}
          spans={[{ from: 1, to: 3, label: "בהתחייבות", tone: 3 }]}
        />
        <Tbl
          head={["", "סכום"]}
          rows={[
            ["ערך נוכחי של כל 4 התשלומים", Math.round(PV_EX_GROSS)],
            ["פחות התשלום של היום", -PV_EX.payment],
          ]}
          foot={["התחייבות החכירה", Math.round(PV_EX_NET)]}
        />
        <P>
          באקסל: <Ltr>{"=PV(7%;3;-30000)"}</Ltr>, כלומר 3 התשלומים שנשארו. אפשר גם <Ltr>{"=PV(7%;4;-30000;;1)"}</Ltr> ולהפחית את התשלום של היום.
        </P>
        <Rule>
          עלות הנכס כוללת את שניהם: <M v={PV_EX_NET} /> ועוד <M v={PV_EX.payment} />, כלומר <M v={PV_EX_GROSS} />.
        </Rule>
        <Deeper title="אם ראיתם את זה אחרת במחברת">
          <P>יש שרושמים קודם התחייבות ברוטו, כולל התשלום של היום, ומיד אחר כך את התשלום. התוצאה זהה: אחרי התשלום נשארים אותה התחייבות ואותו נכס. התקן מגדיר את ההתחייבות רק על מה שלא שולם (סעיף 26).</P>
        </Deeper>
      </>
    ),
  },
  "ls-meas-cost": {
    lead: "עלות הנכס היא ההתחייבות, ועוד כל מה שעלה להשיג את הזכות, פחות מה שהמחכיר החזיר.",
    body: (
      <>
        <Part title="הנוסחה (סעיף 24)">
          <p className="text-[15.5px] font-semibold">
            <Ltr>{"התחייבות + תשלומים שבוצעו − תמריצים + עלויות ישירות + פירוק = עלות"}</Ltr>
          </p>
        </Part>
        <P>שחקו עם המספרים, וראו איך כל רכיב משנה את העלות ואת פקודת היומן:</P>
        <RouBuilder />
        <Remember>בעמודת הזכות יש תמיד שלושה סוגים: החוב, מה שיצא במזומן, וההפרשה לפירוק. עלות הנכס היא הסכום שמאזן אותם.</Remember>
      </>
    ),
  },
  "ls-meas-parts": {
    lead: "שלושה רכיבים שמבלבלים: מה נחשב תמריץ, מה נחשב עלות ישירה, ומה קורה עם פירוק.",
    body: (
      <>
        <Fork
          label="תמריץ הוא תשלום לחוכר או נטילת עלויות שלו. שיפוץ של המחכיר בנכס שלו אינו תמריץ"
          question="תמריץ חכירה (נספח א׳)"
          branches={[
            { when: "כן", then: "המחכיר שילם לחוכר, או לקח על עצמו עלות שלו (כמו שכר עורך הדין של החוכר)" },
            { when: "לא", then: "המחכיר משפץ נכס שלו על חשבונו" },
          ]}
        />
        <Fork
          label="עלות ישירה ראשונית היא עלות שלא הייתה מתהווה בלי החכירה, כמו עמלת מתווך או תשלום לחוכר הקודם. שכר קבוע של עובד אינו כזה"
          question="עלות ישירה ראשונית (נספח א׳)"
          branches={[
            { when: "כן", then: "עמלת מתווך, שכר עורך דין על החוזה, תשלום לחוכר הקודם" },
            { when: "לא", then: "שכר קבוע של מנהל שהיה משולם ממילא" },
          ]}
        />
        <P>
          <T16 he="פירוק ופינוי" par="סעיפים 24(ד), 25" />: אומדן העלות נכנס לעלות הנכס, כנגד <strong>הפרשה</strong> לפי IAS 37. ההפרשה נפרדת מהתחייבות החכירה, ויש לה ריבית היוון משלה.
        </P>
        <Part title="שני חריגים">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>
              <strong>פירוק שנוצר מייצור מלאי:</strong> הולך לעלות המלאי, לפי IAS 2.
            </li>
            <li>
              <strong>הקמה או תכנון של הנכס על חשבון החוכר (ב44):</strong> לפי תקן אחר, כמו IAS 16, ולא כתשלום חכירה.
            </li>
          </ul>
        </Part>
        <Part title="תמריץ שמגיע בעין">
          <P>
            אם המחכיר נותן שירות חינם שהחוכר היה קונה, כמו שנת ביטוח, הוא מקטין את עלות הנכס, וכנגדו נרשמות הוצאות מראש. ההוצאה עצמה נרשמת בשנה שבה הביטוח מכסה.
          </P>
        </Part>
      </>
    ),
  },
  "ls-meas-worked": {
    lead: "שתי דוגמאות שלמות, לפי הסדר של תשובה במבחן.",
    body: (
      <>
        <Story icon={<Warehouse />} title="דוגמה 1: מחסן, ושיפוץ שאינו תמריץ">
          <p>
            מחסן ל-{WORK1.years} שנים, <M v={WORK1.payment} /> בתחילת כל שנה. ריבית תוספתית {pct(WORK1.rate, 1)}. החוכר שילם <M v={WORK1.previousTenant} /> לחוכר הקודם ו-<M v={WORK1.lawyer} /> לעורך דין. המחכיר החזיר לו את שכר עורך הדין, ושיפץ את המחסן על חשבונו ב-<M v={WORK1.renovation} />.
          </p>
        </Story>
        <Tbl
          head={["רכיב", "סכום", "למה"]}
          rows={[
            ["התחייבות החכירה", Math.round(WORK1_L.liability - WORK1.payment), `${WORK1.years - 1} תשלומים שנשארו`],
            ["תשלום של היום", WORK1.payment, "סעיף 24(ב)"],
            ["עלויות ישירות", WORK1.previousTenant + WORK1.lawyer, "לחוכר הקודם ולעורך הדין"],
            ["תמריץ", -WORK1.reimbursed, "החזר שכר עורך הדין"],
            ["שיפוץ של המחכיר", 0, "אינו תמריץ"],
          ]}
          foot={["עלות הנכס", Math.round(WORK1_L.cost), ""]}
        />
        <JournalEntry
          title="פקודת היומן במועד התחילה"
          lines={[
            { account: "נכס זכות שימוש", dr: Math.round(WORK1_L.cost) },
            { account: "התחייבות חכירה", cr: Math.round(WORK1_L.liability - WORK1.payment) },
            { account: "מזומן", cr: Math.round(WORK1_L.cost) - Math.round(WORK1_L.liability - WORK1.payment) },
          ]}
        />
        <Story icon={<Car />} title="דוגמה 2: רכב, אופציה וביטוח חינם">
          <p>
            רכב ל-{WORK2.years} שנים, <M v={WORK2.payment} /> בתחילת כל שנה. ריבית גלומה {pct(WORK2.rate, 0)}, ידועה לחוכר. ודאי באופן סביר שיקנה את הרכב בסוף ב-<M v={WORK2.option} />. המחכיר נותן ביטוח חינם לשנה ששוויו <M v={WORK2.insurance} />. החוכר שילם אגרות של <M v={WORK2.fees} />.
          </p>
        </Story>
        <Tbl
          head={["רכיב", "סכום"]}
          rows={[
            ["התחייבות: 3 תשלומים ומחיר האופציה", Math.round(WORK2_L.liability - WORK2.payment)],
            ["תשלום של היום", WORK2.payment],
            ["אגרות", WORK2.fees],
            ["תמריץ בעין: ביטוח", -WORK2.insurance],
          ]}
          foot={["עלות הנכס", Math.round(WORK2_L.cost)]}
        />
        <JournalEntry
          title="פקודת היומן במועד התחילה"
          lines={[
            { account: "נכס זכות שימוש", dr: Math.round(WORK2_L.cost) },
            { account: "הוצאות מראש", dr: WORK2.insurance },
            { account: "התחייבות חכירה", cr: Math.round(WORK2_L.cost) + WORK2.insurance - WORK2.payment - WORK2.fees },
            { account: "מזומן", cr: WORK2.payment + WORK2.fees },
          ]}
        />
      </>
    ),
  },
  "ls-meas-drill": {
    lead: "כל לחיצה נותנת חכירה חדשה. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["end", "start", "guarantee", "cost"]} />,
  },
  "ls-meas-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנטית">
        <p>החוזה: מכונה ל-5 שנים, 40,000 ש״ח בסוף כל שנה, ועוד 2% מהמכירות. ריבית תוספתית 6%. ערבות שייר של 30,000 ש״ח, וערך צפוי של 25,000 ש״ח. המחכיר שיפץ את המכונה שלו ב-4,000 ש״ח.</p>
        <p>הפתרון: ״מהוונים 40,000 ועוד אומדן של 2% מהמכירות, ל-5 שנים. מוסיפים את הערבות המהוונת של 30,000 ש״ח. מהעלות מורידים 4,000 ש״ח כתמריץ.״</p>
      </Story>
    ),
    check: quiz("ls-meas-mistake", [
      {
        q: "מה הטעות לגבי 2% מהמכירות?",
        options: ["תשלום לפי מכירות לא נכנס להתחייבות", "צריך להכניס אותו לפי המכירות של השנה שעברה", "צריך להכניס אותו רק בשנה הראשונה", "אין טעות"],
        answer: 0,
        why: "סעיף 27 וסעיף 38(ב): הוא הוצאה כשהוא מתהווה.",
      },
      {
        q: "מה הטעות לגבי הערבות?",
        options: ["מכניסים רק את הצפוי: 30,000 − 25,000 = 5,000 מהוון", "לא מכניסים ערבות בכלל", "מכניסים 25,000 מהוון", "אין טעות"],
        answer: 0,
        why: "סעיף 27(ג): רק הסכום שהחוכר צופה לשלם.",
      },
      {
        q: "מה הטעות לגבי השיפוץ?",
        options: ["המחכיר משפץ נכס שלו, וזה אינו תמריץ", "צריך להוסיף 4,000 ש״ח לעלות", "צריך להכניס אותו להתחייבות", "אין טעות"],
        answer: 0,
        why: "תמריץ הוא תשלום לחוכר או נטילת עלות שלו (נספח א׳).",
      },
    ]),
  },
  "ls-meas-master": {
    lead: "שאלה אחת, כמו במבחן: כל הרכיבים של היום הראשון ביחד. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 חברת ״נתיב״ קיבלה מבנה ייצור לחכירה ל-{MASTER.years} שנים, עם אופציה לעוד {MASTER.optionYears} שנים ב-<M v={MASTER.optionPayment} /> לשנה, מחיר דומה לשוק הצפוי, בלי תמריץ נוסף להאריך.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                התשלום <M v={MASTER.payment} /> בתחילת כל שנה, והראשון שולם ב-1.1. בנוסף משולם {MASTER.sales}% מהמכירות.
              </li>
              <li>הריבית הגלומה לא ידועה. הריבית התוספתית {pct(MASTER.rate, 0)}.</li>
              <li>
                בדצמבר הקודם שולמה למחכיר מקדמה נפרדת של <M v={MASTER.prepaid} />, וב-1.1 התקבל ממנו תמריץ של <M v={MASTER.incentive} /> במזומן.
              </li>
              <li>
                שולמו: עמלת מתווך <M v={MASTER.broker} />, עורך דין <M v={MASTER.lawyer} />. שכר מנהל הנדל״ן על הזמן שהקדיש לחוזה: <M v={MASTER.manager} />.
              </li>
              <li>
                בסוף התקופה החברה תפרק מתקנים, בעלות צפויה של <M v={MASTER.restore} />. שיעור ההיוון של ההפרשה {pct(MASTER.restoreRate, 0)}.
              </li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: חשבו את התחייבות החכירה אחרי התשלום של 1.1 ואת עלות הנכס, ורשמו את פקודת היומן.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                {
                  title: "מה נכנס",
                  body: (
                    <ul className="list-disc space-y-1 ps-5">
                      <li>תקופה: {MASTER.years} שנים. האופציה במחיר שוק לא נספרת, ולכן גם התשלומים שלה לא.</li>
                      <li>{MASTER.sales}% מהמכירות: לא נכנס. הוצאה כשהוא מתהווה.</li>
                      <li>ריבית: התוספתית, כי הגלומה לא ידועה.</li>
                      <li>שכר המנהל: לא עלות ישירה, כי היה משולם ממילא.</li>
                    </ul>
                  ),
                },
                {
                  title: "התחייבות החכירה",
                  body: (
                    <p>
                      <Ltr>{`90,000 × (1 − 1.05^(−5)) ÷ 0.05 = ${Math.round(MASTER_NET).toLocaleString("en-US")}`}</Ltr>
                      <br />
                      נשארו {MASTER.years - 1} תשלומים, כי התשלום של 1.1 כבר שולם.
                    </p>
                  ),
                },
                {
                  title: "ההפרשה לפירוק",
                  body: (
                    <p>
                      <Ltr>{`40,000 ÷ 1.04^6 = ${Math.round(MASTER_RESTORE).toLocaleString("en-US")}`}</Ltr>
                    </p>
                  ),
                },
                {
                  title: "עלות הנכס",
                  body: (
                    <Tbl
                      head={["רכיב", "סכום"]}
                      rows={[
                        ["התחייבות החכירה", Math.round(MASTER_NET)],
                        ["תשלום של 1.1", MASTER.payment],
                        ["מקדמה", MASTER.prepaid],
                        ["תמריץ", -MASTER.incentive],
                        ["עלויות ישירות: מתווך ועורך דין", MASTER.broker + MASTER.lawyer],
                        ["פירוק", Math.round(MASTER_RESTORE)],
                      ]}
                      foot={["עלות הנכס", MASTER_COST_SHOWN]}
                    />
                  ),
                },
                {
                  title: "פקודת היומן",
                  body: (
                    <JournalEntry
                      title="מועד התחילה"
                      lines={[
                        { account: "נכס זכות שימוש", dr: MASTER_COST_SHOWN },
                        { account: "התחייבות חכירה", cr: Math.round(MASTER_NET) },
                        { account: "הפרשה לפירוק ופינוי", cr: Math.round(MASTER_RESTORE) },
                        { account: "מזומן", cr: MASTER_CASH - MASTER.prepaid },
                        { account: "מקדמה ששולמה (יתרה קודמת)", cr: MASTER.prepaid },
                      ]}
                      note="המקדמה שולמה בדצמבר, ולכן ביום הזה מעבירים אותה מהיתרה שנרשמה אז."
                    />
                  ),
                },
                {
                  title: "מלכודת נפוצה",
                  body: <p>להכניס את התשלום של 1.1 להתחייבות, או להוון 6 תקופות. התשלום כבר יצא. הוא בעלות, לא בחוב.</p>,
                },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו יש לכם נכס והתחייבות ביום הראשון. מה קורה להם בסוף השנה?">בשיעור הבא: פחת, ריבית, תשלומים, איך זה נראה בדוחות, ומתי אפשר לוותר על הכול.</Bridge>
      </>
    ),
  },
};
