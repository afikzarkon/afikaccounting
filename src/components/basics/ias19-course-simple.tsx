import { Backpack, CalendarDays, Coins, Mail, PartyPopper } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { DC, DC_PAID, DC_VAR, DC_VAR_YEAR, DC_YEAR, INSURED, INSURED_EXPENSE } from "@/lib/study/ias19/lessons/dc";
import {
  BONUS,
  BONUS_EXPENSE,
  BONUS_OPENING,
  BONUS_PAID,
  SICK,
  SICK_CLOSING,
  SICK_EXPENSE,
  SICK_LEFT,
  SICK_OPENING,
  SICK_PAID,
  VEST,
  VEST_EXPENSE,
  VEST_OPENING,
  VEST_PAID,
} from "@/lib/study/ias19/lessons/short";
import { lessonRef, lessonsRef, pct } from "@/lib/study/ias19/shared";
import { FormulaFill, Ltr } from "./ias19-formula";
import { Bridge, ExplainTask, HintLadder, MapBranch, RollForward, T19 } from "./ias19-ui";
import { Fork, PeopleGrid, SplitBar, Timeline, TwoPanel } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Sorted, Story } from "./inventory-teach";
import { Card, JE, Money, Stepper } from "./ui";
import { ltrFormulas, ltrQuiz } from "@/lib/study/ias19/ltr";

/** The employee-benefits course, lessons 3–4: short-term benefits, and defined contribution against defined benefit. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={ltrQuiz(items)} />;
/** A formula inside a sentence, read left to right. */
const L = Ltr;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const stayers = SICK.carried.staff - SICK.carried.leavers;

/** Two questions decide how an absence is provided for: does it carry forward, and is it paid on leaving? */
const ABSENCE_FORK = (
  <Fork
    label="הימים עוברים לשנה הבאה? לא: לא נצברת, רושמים כשקורה. כן ומשלמים בעזיבה: מבשילה, הפרשה כולל העוזבים. כן ולא משלמים בעזיבה: לא מבשילה, הפרשה רק על מה שינוצל"
    question="הימים עוברים לשנה הבאה?"
    branches={[
      { when: "לא", then: "לא נצברת: רושמים רק כשההיעדרות קורית" },
      { when: "כן, ומשלמים עליהם בעזיבה", then: "מבשילה: הפרשה גם על ימי העוזבים" },
      { when: "כן, אבל בעזיבה כלום", then: "לא מבשילה: הפרשה רק על מה שינוצל" },
    ]}
  />
);

export const IAS19_SIMPLE_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 3: short-term benefits.
  "emp-short-hook": {
    lead: "זכות שעוברת לשנה הבאה היא כבר חוב של החברה, גם לפני שנוצלה.",
    body: (
      <>
        <Story icon={<CalendarDays />} title="חמישה ימי חופש שלא ניצלת">
          <p>נשארו לך חמישה ימי חופש מהשנה שעברה. החברה חייבת לך אותם? ואם תעזוב מחר, היא תשלם לך עליהם בכסף?</p>
          {ABSENCE_FORK}
          <p>התשובה תלויה בשתי שאלות: הימים עוברים לשנה הבאה? ומשלמים עליהם בעזיבה? זה כל השיעור.</p>
        </Story>
        <MapBranch lesson="ias19-short">ענף ״הטבות לזמן קצר״: הענף היחיד במפה שבו לא מהוונים.</MapBranch>
      </>
    ),
  },
  "emp-short-what": {
    lead: "הטבה שמשולמת עד 12 חודשים מסוף שנת העבודה נרשמת בסכום המלא, בלי היוון.",
    body: (
      <>
        <P>
          <T19 he="הטבה לזמן קצר" par="9" /> צפויה להשתלם כולה עד 12 חודשים אחרי סוף שנת העבודה. משכורת, חופשה, מחלה, בונוס שנתי.
        </P>
        <Timeline
          label="שנת העבודה, ואחריה חלון של 12 חודשים: מה שמשולם בתוכו הוא הטבה לזמן קצר, בלי היוון; מה שמשולם אחריו כבר לא"
          title="חלון 12 החודשים"
          from={0}
          to={30}
          ticks={[
            { at: 0, label: "1.1" },
            { at: 12, label: "31.12: סוף שנת העבודה" },
            { at: 24, label: "+12 חודשים" },
            { at: 30, label: "+18" },
          ]}
          spans={[
            { from: 0, to: 12, label: "עובדים", tone: 2 },
            { from: 12, to: 24, label: "משולם כאן? קצר. בלי היוון", tone: 1 },
          ]}
          marks={[{ at: 28, label: "כבר לא קצר", tone: "danger" }]}
        />
        <P>
          הכסף יוצא מהר, ולכן אין טעם להוון: רושמים את הסכום <strong>בלי היוון</strong> (סעיף 11). זה ההבדל הגדול משאר הענפים.
        </P>
      </>
    ),
    check: quiz("emp-short-what", [
      { q: "בונוס על השנה ישולם בעוד חודשיים. מהוונים אותו?", options: ["לא, הטבה לזמן קצר נרשמת בסכום המלא", "כן, תמיד", "רק אם הריבית גבוהה", "רק בבונוס גדול"], answer: 0, why: "סעיף 11: סכום לא מהוון." },
      { q: "מענק שישולם 18 חודשים אחרי סוף שנת העבודה: לזמן קצר?", options: ["לא", "כן", "רק אם הוא קטן", "תלוי בשם"], answer: 0, why: "הוא אחרי 12 חודשים מסוף שנת העבודה." },
    ]),
  },
  "emp-short-absence": {
    lead: "ימים שנצברים יוצרים הפרשה על מה שצפוי להיות מנוצל. כשהם מבשילים, גם על מה שישולם לעוזבים.",
    body: (
      <>
        {ABSENCE_FORK}
        <DataTable
          head={["", "מה זה", "מתי רושמים"]}
          rows={[
            [<T19 key="a" he="לא נצברת" />, "חג, מחלה שלא עוברת, חופשת לידה, מילואים", "רק כשההיעדרות קורית (סעיפים 13ב, 18)"],
            [<T19 key="b" he="נצברת" />, "ימים שעוברים לשנה הבאה", "הפרשה על מה שצפוי להיות מנוצל (סעיפים 15–16)"],
            [<T19 key="c" he="מבשילה" />, "בעזיבה משלמים על הצבירה", "גם ימי העוזבים הצפויים בהפרשה"],
            [<T19 key="d" he="לא מבשילה" />, "בעזיבה: כלום", "רק ימים שצפויים להיות מנוצלים"],
          ]}
        />
        <Part title="LIFO: מה מנוצל קודם">
          <P>עובד עם ימים צבורים מנצל קודם את הימים של השנה, ורק אחר כך את מה שנשאר מהעבר.</P>
          <TwoPanel
            label="LIFO: קודם מנצלים את הזכאות של השנה, ורק אחריה את הימים הצבורים. מי שניצל פחות מהזכאות לא נגע בצבור, והצבור עלול לפקוע"
            panels={[
              { title: "1. הזכאות של השנה", steps: ["8 ימים", "מנוצלים ראשונים"], verdict: "יוצאים קודם", tone: 1 },
              { title: "2. הצבור מהעבר", steps: ["2 ימים", "רק אחרי שה-8 נגמרו"], verdict: "לא נוצלו? עלולים לפקוע", tone: 4 },
            ]}
          />
        </Part>
      </>
    ),
    check: quiz("emp-short-absence", [
      { q: "ימי מחלה עוברים לשנה הבאה, אבל לא משולמים בעזיבה. איך הם מסווגים?", options: ["נצברים ולא מבשילים", "נצברים ומבשילים", "לא נצברים", "לא מבשילים ולא נצברים"], answer: 0, why: "עוברים = נצברים; לא משולמים בעזיבה = לא מבשילים." },
      { q: "לעובד 8 ימים בשנה ו-2 צבורים. הוא ניצל השנה 9. לפי LIFO, כמה מהצבורים נוצלו?", options: ["1", "2", "0", "9"], answer: 0, why: "8 מהשנה, ועוד יום אחד מהצבור." },
    ]),
  },
  "emp-short-bonus": {
    lead: "בונוס נרשם כשיש מחויבות ואומדן מהימן. וההוצאה היא מה שסוגר את המעגל.",
    body: (
      <>
        <P>
          <T19 he="בונוס ושיתוף ברווחים" par="19" /> נרשמים בשני תנאים: יש <strong>מחויבות קיימת</strong>, ואפשר לאמוד את הסכום <strong>באופן מהימן</strong>.
        </P>
        <P>אומדן מהימן: נוסחה בתוכנית, סכום שנקבע לפני אישור הדוחות, או נוהג קבוע מהעבר.</P>
        <PeopleGrid total={BONUS.staff} leaving={BONUS.expectedLeavers} title="בונוס לפי נוסחה: רק מי שצפוי להישאר" />
        <FormulaFill
          label="ההפרשה לבונוס: שיעור הבונוס כפול הרווח כפול העובדים הצפויים להישאר"
          lhs="הפרשה לבונוס"
          terms={{
            s: { c: 0, sym: "שיעור הבונוס", why: "האחוז מהרווח שהנוסחה נותנת לכל עובד." },
            p: { c: 1, sym: "הרווח", why: "הרווח המוערך של השנה." },
            h: { c: 3, sym: "עובדים צפויים", why: "רק מי שיישאר עד יום התשלום." },
          }}
          top={[{ t: "s" }, " × ", { t: "p" }, " × ", { t: "h" }]}
          given={false}
          stepwise={false}
        />
        <P>ובונוס על רווחים של כמה שנים? הוא כבר לא לזמן קצר: על השנה הראשונה ישלמו מאוחר מדי.</P>
        <FormulaFill
          label="עלות יום: שכר חלקי ימי עבודה, כפול אחת ועוד תוספות המעסיק"
          lhs="עלות יום"
          terms={{
            w: { c: 0, sym: "שכר", why: "השכר לתקופה." },
            d: { c: 0, sym: "ימי עבודה", why: "כמה ימי עבודה בתקופה." },
            o: { c: 0, sym: "תוספות", why: "תוספות המעסיק שחלות על הרכיב הזה." },
          }}
          top={[{ t: "w" }, " ÷ ", { t: "d" }, " × (1 + ", { t: "o" }, ")"]}
          given={false}
          stepwise={false}
        />
        <Remember><L>הפרשה בסוף השנה = (ימים שצפוי לנצל + ימי העוזבים, אם מבשילה) × עלות יום</L>. ההוצאה: <L>סגירה − פתיחה + תשלומים</L>.</Remember>
      </>
    ),
    check: quiz("emp-short-bonus", [
      { q: "החברה מחליטה על בונוס רק אחרי אישור הדוחות, ואין נוהג. מכירים בו בדוח?", options: ["לא, לא הייתה מחויבות בתאריך הדוח", "כן, תמיד", "כן, כהערכה", "רק אם הרווח גבוה"], answer: 0, why: "בתאריך הדוח לא הייתה מחויבות ולא אומדן." },
      { q: "פתיחה 10,000, שולמו 50,000, סגירה 12,000. מה ההוצאה?", options: ["52,000", "50,000", "48,000", "72,000"], answer: 0, why: "12,000 − 10,000 + 50,000." },
    ]),
  },
  "emp-short-solved": {
    lead: "ימים שלא מבשילים: מפרישים רק על מה שצפוי להיות מנוצל, וההוצאה מאזנת את המעגל.",
    body: (
      <>
        <Story icon={<CalendarDays />} title="רשת מרפאות: ימי מחלה">
          <p>
            לכל עובד {SICK.entitlement} ימי מחלה בשנה, שעוברים לשנה אחת בלבד. הם <strong>לא מבשילים</strong>, והניצול ב-LIFO. עלות יום: <Money v={SICK.dayCost} />.
          </p>
          <p>
            בתחילת השנה: {SICK.carried.staff} עובדים עם {SICK.carried.days} ימים צבורים כל אחד; {SICK.carried.leavers} מהם צפויים לעזוב.
          </p>
          <p>
            במהלך השנה {SICK.usedMore.staff} עובדים ניצלו {SICK.usedMore.days} ימים, ו-{SICK.usedLess.staff} ניצלו {SICK.usedLess.days}.
          </p>
        </Story>
        <PeopleGrid total={SICK.carried.staff} leaving={SICK.carried.leavers} title="מי מקבל הפרשה בפתיחה: רק הנשארים (לא מבשילים)" />
        <Stepper
          label="ימי מחלה: המעגל"
          steps={[
            {
              title: "1. פתיחה",
              body: (
                <p>
                  לא מבשילים: העוזבים לא יקבלו כלום. מפרישים רק לנשארים: <L>{stayers} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <strong><Money v={SICK_OPENING} /></strong></L>.
                </p>
              ),
            },
            {
              title: "2. תשלומים",
              body: (
                <p>
                  <L><Money v={SICK.dayCost} plain /> × ({SICK.usedMore.staff} × {SICK.usedMore.days} + {SICK.usedLess.staff} × {SICK.usedLess.days}) = <strong><Money v={SICK_PAID} /></strong></L>.
                </p>
              ),
            },
            {
              title: "3. סגירה, לפי LIFO",
              body: (
                <div className="space-y-1.5">
                  <p>מי שניצל {SICK.usedMore.days} ניצל את כל {SICK.entitlement} הימים של השנה ועוד יום מהצבור. שאר הצבור שלו פקע.</p>
                  <p>
                    מי שניצל {SICK.usedLess.days} השאיר {SICK_LEFT} יום מהשנה: <L>{SICK.usedLess.staff} × {SICK_LEFT} × <Money v={SICK.dayCost} plain /> = <strong><Money v={SICK_CLOSING} /></strong></L>.
                  </p>
                </div>
              ),
            },
            {
              title: "4. ההוצאה: המספר המאזן",
              body: (
                <div className="space-y-3">
                  <p>
                    <L><Money v={SICK_CLOSING} plain /> − <Money v={SICK_OPENING} plain /> + <Money v={SICK_PAID} plain /> = <strong><Money v={SICK_EXPENSE} /></strong></L>.
                  </p>
                  <RollForward
                    pnTo="רווח והפסד"
                    title="הפרשה לימי מחלה"
                    rows={[
                      { label: "יתרת פתיחה", value: SICK_OPENING, kind: "balance" },
                      { label: "תשלומים", value: -SICK_PAID },
                      { label: "הוצאה (המספר המאזן)", value: SICK_EXPENSE, kind: "pn", how: "בלי היוון: סגירה − פתיחה + תשלומים" },
                      { label: "יתרת סגירה", value: SICK_CLOSING, kind: "balance" },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </>
    ),
  },
  "emp-short-together": {
    lead: "כשהימים מבשילים, גם ימי העוזבים נכנסים להפרשה. ובבונוס, הפער בין האומדן לתשלום הוא הוצאת השנה.",
    body: (
      <>
        <Part title="א. אותה רשת, אבל הימים מבשילים">
          <PeopleGrid total={SICK.carried.staff} leaving={SICK.carried.leavers} title="עכשיו מפרישים לכולם: גם העוזבים יקבלו כסף" />
          <HintLadder
            task={
              <>
                הימים מבשילים: מי שעוזב מקבל כסף על הצבור. מתוך {SICK.carried.leavers} העוזבים הצפויים עזבו בפועל {VEST.left}, וקיבלו כסף על {SICK.carried.days} הימים שלהם. מה הפתיחה, מה
                התשלומים, ומה ההוצאה?
              </>
            }
            hints={[
              "למי מפרישים עכשיו בפתיחה: רק לנשארים?",
              "הכלל: ימים שצפוי לנצל + ימי העוזבים, כי ההיעדרות מבשילה.",
              <>
                פתיחה: <L>{SICK.carried.staff} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <Money v={VEST_OPENING} /></L>.
              </>,
              <>
                תשלומים: <L><Money v={SICK_PAID} plain /> + {VEST.left} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <Money v={VEST_PAID} /></L>. סגירה <Money v={SICK_CLOSING} plain /> (כמו קודם).
                הוצאה: <L><Money v={SICK_CLOSING} plain /> − <Money v={VEST_OPENING} plain /> + <Money v={VEST_PAID} plain /> = <strong><Money v={VEST_EXPENSE} /></strong></L>.
              </>,
            ]}
          />
        </Part>
        <Part title="ב. בונוס לפי נוסחה">
          <HintLadder
            task={
              <>
                כל עובד שנשאר עד יום התשלום מקבל <span dir="ltr">{pct(BONUS.share)}</span> מהרווח השנתי. בסוף השנה: {BONUS.staff} עובדים, {BONUS.expectedLeavers} צפויים לעזוב, והרווח המוערך{" "}
                <Money v={BONUS.estimate} />. במרץ שולם הבונוס ל-{BONUS.paidTo} עובדים, על רווח סופי של <Money v={BONUS.actual} />. בונוס על השנה הבאה לא יינתן. מה ההפרשה בפתיחה, ומה ההוצאה של
                השנה הבאה?
              </>
            }
            hints={[
              "מי צפוי לקבל: כולם, או רק מי שיישאר?",
              ltrFormulas("מחויבות ואומדן מהימן: נוסחה × עובדים צפויים."),
              <>
                פתיחה: <L>({BONUS.staff} − {BONUS.expectedLeavers}) × {pct(BONUS.share)} × <Money v={BONUS.estimate} plain /> = <Money v={BONUS_OPENING} /></L>.
              </>,
              <>
                תשלום: <L>{BONUS.paidTo} × {pct(BONUS.share)} × <Money v={BONUS.actual} plain /> = <Money v={BONUS_PAID} /></L>; סגירה 0. הוצאה: <L>0 − <Money v={BONUS_OPENING} plain /> +{" "}
                <Money v={BONUS_PAID} plain /> = <strong><Money v={BONUS_EXPENSE} /></strong></L>: הפער בין האומדן לתשלום.
              </>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-short-master": {
    lead: "בזמן קצר: סכום מלא, לפי מה שצפוי להשתלם. והמעגל סוגר את ההוצאה.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר, בדקה, מה ההבדל בין היעדרות מבשילה ללא מבשילה."
          model={
            <>
              בשתיהן הימים עוברים לשנה הבאה. במבשילה, מי שעוזב מקבל כסף על הימים, ולכן ההפרשה כוללת גם את העוזבים. בלא מבשילה, מי שעוזב מפסיד אותם, ולכן מפרישים רק על מה שצפוי להיות מנוצל.
              <span className="mt-2 block">{ABSENCE_FORK}</span>
            </>
          }
        />
        <Bridge summary="הטבה לזמן קצר היא סכום לא מהוון, לפי מה שצפוי להשתלם.">ומה אם ההטבה תשולם רק בעוד שלושים שנה, וגוף אחר מחזיק את הכסף? מי נושא בסיכון אז? {lessonRef("ias19-dc")}.</Bridge>
      </>
    ),
    check: quiz("emp-short-master", [
      { q: "מענק לידה של 1,800 ₪ לכל יולדת; השנה ילדו 6 עובדות. מה ההוצאה, ומתי?", options: ["10,800 ₪, כשההיעדרות קורית", "10,800 ₪ מראש, בתחילת השנה", "הערך הנוכחי של 10,800", "אפס"], answer: 0, why: "לא נצבר: מכירים כשקורה." },
      { q: "עובד עוזב עם 2 ימים צבורים, וההיעדרות לא מבשילה. מה הוא מקבל?", options: ["כלום, ואין בגינו הפרשה", "פדיון 2 ימים", "פדיון יום אחד", "תלוי בוותק"], answer: 0, why: "לא מבשילה = אין פדיון." },
      { q: "בונוס על רווחים מצטברים של שלוש שנים: לזמן קצר?", options: ["לא", "כן", "רק בשנה השלישית", "רק להנהלה"], answer: 0, why: "על רוב השנים ישלמו יותר מ-12 חודשים אחרי סופן." },
      { q: "סכום הבונוס נקבע אחרי תאריך הדוח. מוכר בדוח?", options: ["רק אם הייתה מחויבות קיימת בתאריך הדוח", "תמיד", "לעולם לא", "רק בדוח של השנה הבאה"], answer: 0, why: "התנאי: מחויבות ואומדן מהימן בתאריך הדוח." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 4: defined contribution against defined benefit.
  "emp-dc-hook": {
    lead: "מי שמבטיח תוצאה נושא בסיכון. מי שמבטיח רק סכום קבוע, לא.",
    body: (
      <>
        <Story icon={<Backpack />} title="דמי כיס, או ״אני משלם על הכול״">
          <p>אפשרות אחת: נותנים לבן שלכם דמי כיס קבועים לטיול השנתי, והוא כבר יסתדר. אפשרות שנייה: מבטיחים לשלם את כל החשבון, יעלה כמה שיעלה.</p>
          <TwoPanel
            label="דמי כיס קבועים: אם הטיול יתייקר, הבן יסתדר, והסיכון עליו. הבטחה לשלם הכול: אם הטיול יתייקר, ההורה משלם, והסיכון עליו"
            panels={[
              { title: "דמי כיס קבועים", icon: <Coins />, steps: ["נותנים סכום קבוע", "הטיול התייקר?"], verdict: "הבן מסתדר: הסיכון עליו", tone: 1 },
              { title: "״אני משלם על הכול״", icon: <Backpack />, steps: ["מבטיחים את החשבון", "הטיול התייקר?"], verdict: "ההורה משלם: הסיכון עליו", tone: 4 },
            ]}
          />
          <p>מי נושא בסיכון שהטיול יתייקר, בכל אחד מהמקרים?</p>
        </Story>
        <MapBranch lesson="ias19-dc">הענף ״לאחר סיום העסקה״ מתפצל לשניים: הפקדה מוגדרת, פשוטה וכולה בשיעור הזה, והטבה מוגדרת, ב{lessonsRef("ias19-measure", "ias19-present")}.</MapBranch>
      </>
    ),
  },
  "emp-dc-two": {
    lead: "בהפקדה מוגדרת החברה מעבירה סכום קבוע ונפטרת. בהטבה מוגדרת היא מבטיחה את התוצאה.",
    body: (
      <>
        <TwoPanel
          label="מעטפה לחתונה מול הבטחה לממן את החתונה: במעטפה נותנים סכום קבוע, ומה שקורה אחר כך לא עליך; בהבטחה משלמים כמה שיעלה, והסיכון עליך"
          panels={[
            { title: "מעטפה לחתונה", icon: <Mail />, steps: ["נותנים סכום קבוע", "מה שקורה אחר כך: לא עליך"], verdict: "הסיכון על הזוג: הפקדה מוגדרת", tone: 1 },
            { title: "״אני מממן את החתונה״", icon: <PartyPopper />, steps: ["מבטיחים את התוצאה", "יעלה כמה שיעלה"], verdict: "הסיכון עליך: הטבה מוגדרת", tone: 4 },
          ]}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Card title={<T19 he="הפקדה מוגדרת" par="28" />}>
            <p>החברה מעבירה סכום קבוע לקרן נפרדת, ואין לה מחויבות נוספת. כמה העובד יקבל בסוף תלוי בתשואת הקרן. הסיכון על העובד.</p>
            <p className="text-[14px] text-muted">בישראל: פיצויים לעובדים עם סעיף 14, וכל הפקדה קבועה לקופה שאחריה לחברה אין חובה נוספת.</p>
          </Card>
          <Card title={<T19 he="הטבה מוגדרת" par="27(ב)" />}>
            <p>החברה מתחייבת לסכום לפי נוסחה. הסיכון שההערכות יתבדו (תמותה, שכר, תשואה) עליה, גם כשקרן חיצונית משלמת.</p>
            <p className="text-[14px] text-muted">בישראל: פיצויים לפי משכורת אחרונה, ומענקי פרישה.</p>
          </Card>
        </div>
      </>
    ),
    check: quiz("emp-dc-two", [
      { q: "המעסיק מפקיד 6.5% מהשכר לקופה חיצונית, והסיכון על העובד. איזו תוכנית?", options: ["הפקדה מוגדרת", "הטבה מוגדרת", "הטבה לזמן קצר", "פיטורין"], answer: 0, why: "סכום קבוע, בלי מחויבות נוספת." },
      { q: "החברה התחייבה לשלם לכל עובד שפורש משכורת אחרונה אחת על כל שנת עבודה. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "אחרת לזמן ארוך", "לזמן קצר"], answer: 0, why: "החברה הבטיחה את התוצאה." },
    ]),
  },
  "emp-dc-test": {
    lead: "המבחן הוא מי נושא בסיכון, לא מי משלם.",
    body: (
      <>
        <P>קרן חיצונית יכולה לשלם את ההטבות, והתוכנית עדיין הטבה מוגדרת: אם החברה חייבת להשלים חוסר (סעיף 29).</P>
        <Fork
          label="השאלה: מי יפסיד אם הכסף לא יספיק? העובד: הפקדה מוגדרת. החברה: הטבה מוגדרת"
          question="מי יפסיד אם הכסף לא יספיק?"
          branches={[
            { when: "העובד", then: "הפקדה מוגדרת" },
            { when: "החברה", then: "הטבה מוגדרת" },
          ]}
        />
        <Sorted
          columns={[
            { title: "הסיכון על העובד: הפקדה מוגדרת", tone: "good", items: ["הפקדה קבועה, בלי ערבות", "מבטח לקח על עצמו את כל הסיכון", "פיצויים לפי סעיף 14"] },
            { title: "הסיכון על החברה: הטבה מוגדרת", tone: "bad", items: ["ערבות לתשואה מינימלית", "חובה להשלים חוסר בקרן", "נוסחה לפי משכורת אחרונה", "אין הפקדות בכלל"] },
          ]}
        />
      </>
    ),
    check: quiz("emp-dc-test", [
      { q: "קרן נפרדת משלמת את ההטבות, והחברה חייבת להשלים חוסרים. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "תלוי בקרן", "אין"], answer: 0, why: "חובת ההשלמה = הסיכון על החברה." },
      { q: "החברה ערבה לתשואה מינימלית על ההפקדות. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "לזמן קצר", "פיטורין"], answer: 0, why: "סעיף 29." },
    ]),
  },
  "emp-dc-record": {
    lead: "בהפקדה מוגדרת ההוצאה היא ההפקדה של השנה. מה שעוד לא הועבר הוא חוב.",
    body: (
      <>
        <P>
          <strong>הכלל</strong> (סעיף 51–52): ההוצאה היא ההפקדה המגיעה על עבודת השנה. מה שעוד לא שולם הוא חוב (ואם שילמו יותר, נכס).
        </P>
        <P>בלי היוון, אלא אם ההפקדה תשולם יותר מ-12 חודשים אחרי סוף השנה.</P>
        <Timeline
          label="ההפקדה של דצמבר עוברת ב-10 בינואר: ההוצאה שייכת לדצמבר, וב-31.12 היא חוב"
          title="ההפקדה של דצמבר"
          from={0}
          to={2}
          ticks={[
            { at: 0, label: "1.12" },
            { at: 1, label: "31.12" },
            { at: 2, label: "31.1" },
          ]}
          spans={[{ from: 0, to: 1, label: "עבודת דצמבר: ההוצאה", tone: 1 }]}
          marks={[
            { at: 1, label: "חוב: זכאים", tone: "accent" },
            { at: 1.33, label: "10.1: הכסף עובר", tone: 4 },
          ]}
        />
        <Remember>אין כאן מדידה אקטוארית, אין ריבית ואין P.N. ההפקדה המוגדרת היא החלק הקל.</Remember>
      </>
    ),
    check: quiz("emp-dc-record", [
      { q: "בתוכנית הפקדה מוגדרת, מתי יש חוב במאזן?", options: ["רק כשהפקדה מגיעה ועוד לא שולמה", "תמיד, לפי ערך נוכחי של ההטבה", "אף פעם", "רק בפרישה"], answer: 0, why: "החוב הוא רק ההפקדה שטרם הועברה." },
    ]),
  },
  "emp-dc-solved": {
    lead: "הוצאה = שכר × שיעור ההפקדה. ההפקדה של דצמבר, שתעבור בינואר, היא חוב.",
    body: (
      <>
        <Story icon={<Coins />} title="משרד תכנון: הפקדה חודשית לקופה">
          <p>
            שכר שנתי <Money v={DC.payroll} />. המעסיק מפקיד {pct(DC.rate)} לקופה חיצונית, והכסף עובר ב-10 לחודש שאחרי.
          </p>
        </Story>
        <SplitBar
          title="12 הפקדות: 11 עברו בשנה, אחת עוברת בינואר"
          periods={[
            { months: 11, label: `שולם: ${Math.round(DC_PAID).toLocaleString("he-IL")} ₪`, tone: 1 },
            { months: 1, label: "חוב", tone: 4 },
          ]}
          cuts={["ינואר", "דצמבר"]}
        />
        <Stepper
          label="הפקדה מוגדרת"
          steps={[
            { title: "1. ההוצאה", body: <p><L><Money v={DC.payroll} plain /> × {pct(DC.rate)} = <strong><Money v={DC_YEAR.expense} /></strong></L>.</p> },
            { title: "2. מה שולם", body: <p>11 חודשים הועברו במהלך השנה: <Money v={DC_PAID} />.</p> },
            { title: "3. מה נשאר", body: <p>ההפקדה של דצמבר תעבור בינואר: <strong><Money v={DC_YEAR.liability} /></strong>, זכאים.</p> },
            {
              title: "4. הפקודה",
              body: (
                <JE
                  entry={{
                    id: "1",
                    date: "31.12",
                    text: "הפקדה מוגדרת",
                    lines: [
                      { account: "הוצאות שכר", dr: DC_YEAR.expense },
                      { account: "מזומן", cr: DC_PAID },
                      { account: "זכאים", cr: DC_YEAR.liability },
                    ],
                  }}
                />
              ),
            },
          ]}
        />
      </>
    ),
  },
  "emp-dc-together": {
    lead: "שכר אחר, אותה דרך. ומבטח שלקח את כל הסיכון הופך את התוכנית להפקדה מוגדרת.",
    body: (
      <>
        <Part title="א. שכר אחר">
          <HintLadder
            task={
              <>
                שכר שנתי <Money v={DC_VAR.payroll} />, הפקדה {pct(DC_VAR.rate)}, הכסף עובר ב-10 לחודש שאחרי. מה ההוצאה, מה שולם ומה הזכאים?
              </>
            }
            hints={["מה מגיע על כל השנה, ומה מזה כבר הועבר?", ltrFormulas("הכלל: הוצאה = ההפקדה המגיעה; ההפרש הוא זכאים."), <>הוצאה: <L><Money v={DC_VAR.payroll} plain /> × {pct(DC_VAR.rate)} = <Money v={DC_VAR_YEAR.expense} /></L>.</>, <>זכאים <Money v={DC_VAR_YEAR.liability} />; מזומן <Money v={DC_VAR_YEAR.expense - DC_VAR_YEAR.liability} />.</>]}
          />
        </Part>
        <Part title="ב. מבטח שלקח את הסיכון">
          <Fork
            label="מבטח לקח את כל הסיכון: אם הכסף לא יספיק, המבטח יפסיד, ולכן זו הפקדה מוגדרת"
            question="מי יפסיד אם הכסף לא יספיק?"
            branches={[
              { when: "המבטח (לא החברה)", then: "הפקדה מוגדרת: ההוצאה היא הפרמיה" },
              { when: "החברה", then: "הטבה מוגדרת" },
            ]}
          />
          <HintLadder
            task={
              <>
                מבטח קיבל על עצמו את כל הסיכון של מענקי הפרישה, והחברה משלמת לו רק פרמיה של {pct(INSURED.premium)} מעלות השכר (<Money v={INSURED.payroll} />). סווגו, וצרו את המעגל.
              </>
            }
            hints={["יש לחברה מחויבות כלשהי מעבר לפרמיה?", "המבחן: מי נושא בסיכון. המבטח: הפקדה מוגדרת.", <>הוצאה = הפרמיה: <L><Money v={INSURED.payroll} plain /> × {pct(INSURED.premium)} = <Money v={INSURED_EXPENSE} /></L>.</>, <>מעגל: פתיחה 0, הוצאה <Money v={INSURED_EXPENSE} plain />, תשלום <Money v={INSURED_EXPENSE} plain />, סגירה 0.</>]}
          />
        </Part>
      </>
    ),
  },
  "emp-dc-master": {
    lead: "הפקדה מוגדרת: ההוצאה היא ההפקדה. הטבה מוגדרת: מדידה, וזה כל ההמשך.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר, בדקה, למה ״מי משלם״ אינו המבחן."
          model={
            <>
              גם בהטבה מוגדרת, קרן חיצונית יכולה לשלם לגמלאים. אבל אם חסר בה כסף והחברה חייבת להשלים, הסיכון אצל החברה. לכן שואלים מי יפסיד אם הכסף לא יספיק, לא מי מעביר אותו.
            </>
          }
        />
        <TwoPanel
          label="קרן משלמת בשני המקרים; ההבדל הוא מי משלים חוסר"
          panels={[
            { title: "הקרן משלמת, ואין השלמה", steps: ["חסר כסף בקרן", "העובד מקבל פחות"], verdict: "הפקדה מוגדרת", tone: 1 },
            { title: "הקרן משלמת, והחברה משלימה", steps: ["חסר כסף בקרן", "החברה מוסיפה"], verdict: "הטבה מוגדרת", tone: 4 },
          ]}
        />
        <Bridge summary="הפקדה מוגדרת: ההוצאה היא ההפקדה. הטבה מוגדרת: מדידה אקטוארית.">איך מודדים בדוחות את מה שהחברה הבטיחה לשלם בעוד 14 שנה? {lessonRef("ias19-measure")}.</Bridge>
      </>
    ),
    check: quiz("emp-dc-master", [
      { q: "המעסיק מפקיד 7% לקרן, והסיכון על העובד. הפקדה מוגדרת או הטבה מוגדרת?", options: ["הפקדה מוגדרת", "הטבה מוגדרת"], answer: 0, why: "סכום קבוע, בלי מחויבות נוספת." },
      { q: "החברה ערבה לתשואה מינימלית. הפקדה מוגדרת או הטבה מוגדרת?", options: ["הטבה מוגדרת", "הפקדה מוגדרת"], answer: 0, why: "ערבות = סיכון על החברה (סעיף 29)." },
      { q: "בהפקדה מוגדרת, מתי יש חוב במאזן?", options: ["רק כשהפקדה מגיעה ועוד לא שולמה", "תמיד", "רק בפרישה", "אף פעם"], answer: 0, why: "ההפקדה שטרם הועברה." },
      { q: "קרן נפרדת משלמת, והחברה חייבת להשלים חוסרים. הפקדה מוגדרת או הטבה מוגדרת?", options: ["הטבה מוגדרת", "הפקדה מוגדרת"], answer: 0, why: "הסיכון על החברה." },
    ]),
  },
};
