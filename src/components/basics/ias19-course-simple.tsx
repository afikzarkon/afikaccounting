import { Backpack, CalendarDays, Coins } from "lucide-react";
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
import { Bridge, ExplainTask, HintLadder, MapBranch, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Sorted, Story } from "./inventory-teach";
import { Card, JE, Money, Stepper } from "./ui";

/** The employee-benefits course, lessons 3–4: short-term benefits, and defined contribution against defined benefit. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const stayers = SICK.carried.staff - SICK.carried.leavers;

export const IAS19_SIMPLE_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 3: short-term benefits.
  "emp-short-hook": {
    lead: "זכות שעוברת לשנה הבאה היא כבר חוב של החברה — גם לפני שנוצלה.",
    body: (
      <>
        <Story icon={<CalendarDays />} title="חמישה ימי חופש שלא ניצלת">
          <p>נשארו לך חמישה ימי חופש מהשנה שעברה. האם החברה חייבת לך אותם? ואם תעזוב מחר — האם היא תשלם לך עליהם בכסף?</p>
          <p>התשובה תלויה בשני דברים: האם הימים עוברים לשנה הבאה, והאם משלמים עליהם בעזיבה. זה כל השיעור.</p>
        </Story>
        <MapBranch lesson="ias19-short">ענף ״הטבות לזמן קצר״ — הענף היחיד במפה שבו לא מהוונים.</MapBranch>
      </>
    ),
  },
  "emp-short-what": {
    lead: "הטבה שתסולק תוך 12 חודשים מסוף שנת השירות נרשמת בסכום המלא — בלי היוון.",
    body: (
      <>
        <P>
          <T19 he="הטבה לזמן קצר" en="Short-term employee benefit" par="9" /> היא הטבה שצפוי לסלק במלואה עד 12 חודשים אחרי סוף השנה שבה העובד נתן את השירות: משכורת, חופשה, מחלה,
          בונוס שנתי.
        </P>
        <P>
          כי הכסף יוצא מהר, אין טעם להוון: מכירים בסכום <strong>לא מהוון</strong> (<span dir="ltr">IAS 19.11</span>). זה ההבדל הגדול משאר הענפים במפה.
        </P>
      </>
    ),
    check: quiz("emp-short-what", [
      { q: "בונוס על השנה ישולם בעוד חודשיים. האם מהוונים אותו?", options: ["לא — הטבה לזמן קצר נרשמת בסכום המלא", "כן, תמיד", "רק אם הריבית גבוהה", "רק בבונוס גדול"], answer: 0, why: "IAS 19.11: סכום לא מהוון." },
      { q: "מענק שישולם 18 חודשים אחרי סוף שנת השירות — לזמן קצר?", options: ["לא", "כן", "רק אם הוא קטן", "תלוי בשם"], answer: 0, why: "הוא מעבר ל-12 חודשים מסוף שנת השירות." },
    ]),
  },
  "emp-short-absence": {
    lead: "היעדרות שנצברת יוצרת הפרשה על מה שצפוי להיות מנוצל — ובמבשילה, גם על מה שישולם לעוזבים.",
    body: (
      <>
        <DataTable
          head={["", "מה זה", "מתי מכירים"]}
          rows={[
            [<T19 key="a" he="לא נצברת" en="Non-accumulating" />, "חג, מחלה שלא עוברת, חופשת לידה, מילואים", "רק כשההיעדרות קורית (סעיפים 13ב, 18)"],
            [<T19 key="b" he="נצברת" en="Accumulating" />, "ימים שעוברים לשנה הבאה", "הפרשה על מה שצפוי להיות מנוצל (סעיפים 15–16)"],
            [<T19 key="c" he="מבשילה" en="Vesting" />, "בעזיבה משלמים על הצבירה", "גם ימי העוזבים הצפויים בהפרשה"],
            [<T19 key="d" he="לא מבשילה" en="Non-vesting" />, "בעזיבה — כלום", "רק ימים שצפויים להיות מנוצלים"],
          ]}
        />
        <Part title="LIFO: מה מנוצל קודם">
          <P>
            עובד שיש לו ימים צבורים ומנצל השנה ימים — מנצל <strong>קודם את הזכאות של השנה</strong>, ורק אחר כך את היתרה מהעבר. לכן מי שניצל פחות מהזכאות השנתית לא נגע בצבור, והצבור
            עלול לפקוע.
          </P>
        </Part>
      </>
    ),
    check: quiz("emp-short-absence", [
      { q: "ימי מחלה עוברים לשנה הבאה, אבל לא משולמים בעזיבה. איך הם מסווגים?", options: ["נצברים ולא מבשילים", "נצברים ומבשילים", "לא נצברים", "לא מבשילים ולא נצברים"], answer: 0, why: "עוברים = נצברים; לא משולמים בעזיבה = לא מבשילים." },
      { q: "לעובד 8 ימים בשנה ו-2 צבורים. הוא ניצל השנה 9. לפי LIFO, כמה מהצבורים נוצלו?", options: ["1", "2", "0", "9"], answer: 0, why: "8 מהשנה, ועוד יום אחד מהצבור." },
    ]),
  },
  "emp-short-bonus": {
    lead: "בונוס נרשם כשיש מחויבות קיימת ואומדן מהימן — ועל הכול: ההוצאה היא מה שסוגר את המעגל.",
    body: (
      <>
        <P>
          <T19 he="בונוס ושיתוף ברווחים" en="Bonus and profit-sharing" par="19" /> נרשמים כשמתקיימים שני תנאים: יש <strong>מחויבות קיימת</strong> (משפטית או משתמעת), ואפשר לאמוד את
          הסכום <strong>באופן מהימן</strong>: נוסחה בתנאי התוכנית, סכום שנקבע לפני אישור הדוחות, או דפוס קבוע מהעבר.
        </P>
        <P>ובונוס על רווחים של כמה שנים? הוא כבר לא לזמן קצר — השירות של השנה הראשונה ישולם מאוחר מדי.</P>
        <P>
          <strong>עלות יום</strong> = שכר ÷ ימי עבודה × (1 + תוספות המעסיק שחלות על הרכיב הזה).
        </P>
        <Remember>
          הכלל: הפרשה בסוף השנה = (ימי הצבירה שצפוי לנצל + ימי הצבירה של עוזבים צפויים, אם ההיעדרות מבשילה) × עלות יום. ההוצאה היא ה-P.N. של המעגל: סגירה − פתיחה + תשלומים.
        </Remember>
      </>
    ),
    check: quiz("emp-short-bonus", [
      { q: "החברה מחליטה על בונוס רק אחרי אישור הדוחות, ואין נוהג. האם מכירים בו בדוח?", options: ["לא — לא הייתה מחויבות בתאריך הדוח", "כן, תמיד", "כן, כהערכה", "רק אם הרווח גבוה"], answer: 0, why: "בתאריך הדוח לא הייתה מחויבות ולא אומדן." },
      { q: "פתיחה 10,000, שולמו 50,000, סגירה 12,000. מה ההוצאה?", options: ["52,000", "50,000", "48,000", "72,000"], answer: 0, why: "12,000 − 10,000 + 50,000." },
    ]),
  },
  "emp-short-solved": {
    lead: "ימים שאינם מבשילים: מפרישים רק על מה שצפוי להיות מנוצל, וההוצאה מאזנת את המעגל.",
    body: (
      <>
        <Story icon={<CalendarDays />} title="רשת מרפאות: ימי מחלה">
          <p>
            לכל עובד {SICK.entitlement} ימי מחלה בשנה, שעוברים לשנה אחת בלבד. הם <strong>לא מבשילים</strong>, והניצול ב-LIFO. עלות יום: <Money v={SICK.dayCost} />.
          </p>
          <p>
            בתחילת השנה: {SICK.carried.staff} עובדים עם {SICK.carried.days} ימים צבורים כל אחד; מהם {SICK.carried.leavers} צפויים לעזוב. במהלך השנה: {SICK.usedMore.staff} עובדים ניצלו{" "}
            {SICK.usedMore.days} ימים, ו-{SICK.usedLess.staff} ניצלו {SICK.usedLess.days}.
          </p>
        </Story>
        <Stepper
          label="ימי מחלה — המעגל"
          steps={[
            {
              title: "1. פתיחה",
              body: (
                <p>
                  לא מבשילים: העוזבים לא יקבלו כלום. מפרישים רק לנשארים: {stayers} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <strong><Money v={SICK_OPENING} /></strong>.
                </p>
              ),
            },
            {
              title: "2. תשלומים",
              body: (
                <p>
                  <Money v={SICK.dayCost} plain /> × ({SICK.usedMore.staff} × {SICK.usedMore.days} + {SICK.usedLess.staff} × {SICK.usedLess.days}) = <strong><Money v={SICK_PAID} /></strong>.
                </p>
              ),
            },
            {
              title: "3. סגירה — LIFO",
              body: (
                <p>
                  מי שניצל {SICK.usedMore.days} ניצל את כל {SICK.entitlement} הימים של השנה ועוד יום מהצבור; שאר הצבור שלו פקע. מי שניצל {SICK.usedLess.days} השאיר {SICK_LEFT} יום מהשנה:{" "}
                  {SICK.usedLess.staff} × {SICK_LEFT} × <Money v={SICK.dayCost} plain /> = <strong><Money v={SICK_CLOSING} /></strong>.
                </p>
              ),
            },
            {
              title: "4. ההוצאה — המספר שמאזן",
              body: (
                <div className="space-y-3">
                  <p>
                    <Money v={SICK_CLOSING} plain /> − <Money v={SICK_OPENING} plain /> + <Money v={SICK_PAID} plain /> = <strong><Money v={SICK_EXPENSE} /></strong>.
                  </p>
                  <RollForward pnTo="רווח והפסד"
                    title="הפרשה לימי מחלה"
                    rows={[
                      { label: "יתרת פתיחה", value: SICK_OPENING, kind: "balance" },
                      { label: "תשלומים", value: -SICK_PAID },
                      { label: "הוצאה (P.N.)", value: SICK_EXPENSE, kind: "pn", how: "בלי היוון — סגירה − פתיחה + תשלומים" },
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
    lead: "כשהימים מבשילים, גם ימי העוזבים נכנסים להפרשה — ובבונוס, ההפרש בין האומדן לתשלום הוא הוצאת השנה.",
    body: (
      <>
        <Part title="א. אותה רשת, אבל הימים מבשילים">
          <HintLadder
            task={
              <>
                הימים מבשילים: מי שעוזב מקבל כסף על הצבור. מתוך {SICK.carried.leavers} העוזבים הצפויים עזבו בפועל {VEST.left}, וקיבלו כסף על {SICK.carried.days} הימים שלהם. מה הפתיחה, מה
                התשלומים, ומה ההוצאה?
              </>
            }
            hints={[
              "למי עכשיו מפרישים בפתיחה — רק לנשארים?",
              "הכלל: ימי ניצול צפויים + ימי עוזבים צפויים, כי ההיעדרות מבשילה.",
              <>
                פתיחה: {SICK.carried.staff} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <Money v={VEST_OPENING} />.
              </>,
              <>
                תשלומים: <Money v={SICK_PAID} plain /> + {VEST.left} × {SICK.carried.days} × <Money v={SICK.dayCost} plain /> = <Money v={VEST_PAID} />. סגירה <Money v={SICK_CLOSING} plain /> (כמו קודם).
                הוצאה: <Money v={SICK_CLOSING} plain /> − <Money v={VEST_OPENING} plain /> + <Money v={VEST_PAID} plain /> = <strong><Money v={VEST_EXPENSE} /></strong>.
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
              "מי צפוי לקבל — כולם, או רק מי שיישאר?",
              "מחויבות קיימת ואומדן מהימן: נוסחה × עובדים צפויים.",
              <>
                פתיחה: ({BONUS.staff} − {BONUS.expectedLeavers}) × <span dir="ltr">{pct(BONUS.share)}</span> × <Money v={BONUS.estimate} plain /> = <Money v={BONUS_OPENING} />.
              </>,
              <>
                תשלום: {BONUS.paidTo} × <span dir="ltr">{pct(BONUS.share)}</span> × <Money v={BONUS.actual} plain /> = <Money v={BONUS_PAID} />; סגירה 0. הוצאה: 0 − <Money v={BONUS_OPENING} plain /> +{" "}
                <Money v={BONUS_PAID} plain /> = <strong><Money v={BONUS_EXPENSE} /></strong> — ההפרש בין האומדן לתשלום.
              </>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-short-master": {
    lead: "בזמן קצר: סכום מלא, לפי מה שצפוי להשתלם — והמעגל סוגר את ההוצאה.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר, בדקה, מה ההבדל בין היעדרות מבשילה ללא מבשילה."
          model="בשתיהן הימים עוברים לשנה הבאה. במבשילה, מי שעוזב מקבל כסף על הימים שצבר — ולכן ההפרשה כוללת גם את הימים של העוזבים. בלא מבשילה, מי שעוזב מפסיד אותם — ולכן מפרישים רק על הימים שצפוי שינוצלו."
        />
        <Bridge summary="הטבה לזמן קצר היא סכום לא מהוון, לפי מה שצפוי להשתלם.">
          ומה אם ההטבה תשולם רק בעוד שלושים שנה, וגוף אחר מחזיק את הכסף? מי נושא בסיכון אז? {lessonRef("ias19-dc")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-short-master", [
      { q: "מענק לידה של 1,800 ₪ לכל יולדת; השנה ילדו 6 עובדות. מה ההוצאה, ומתי?", options: ["10,800 ₪, כשההיעדרות קורית", "10,800 ₪ מראש, בתחילת השנה", "הערך הנוכחי של 10,800", "אפס"], answer: 0, why: "לא נצבר — מכירים כשקורה." },
      { q: "עובד עוזב עם 2 ימים צבורים, וההיעדרות לא מבשילה. מה הוא מקבל?", options: ["כלום, ואין בגינו הפרשה", "פדיון 2 ימים", "פדיון יום אחד", "תלוי בוותק"], answer: 0, why: "לא מבשילה = אין פדיון." },
      { q: "בונוס על רווחים מצטברים של שלוש שנים — לזמן קצר?", options: ["לא", "כן", "רק בשנה השלישית", "רק להנהלה"], answer: 0, why: "רוב השירות ישולם יותר מ-12 חודשים אחרי סוף שנתו." },
      { q: "סכום הבונוס נקבע אחרי תאריך הדוח. מוכר בדוח?", options: ["רק אם הייתה מחויבות קיימת בתאריך הדוח", "תמיד", "לעולם לא", "רק בדוח של השנה הבאה"], answer: 0, why: "התנאי הוא מחויבות קיימת ואומדן מהימן בתאריך הדוח." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 4: defined contribution against defined benefit.
  "emp-dc-hook": {
    lead: "מי שמבטיח תוצאה — נושא בסיכון; מי שמבטיח רק סכום קבוע — לא.",
    body: (
      <>
        <Story icon={<Backpack />} title="דמי כיס, או ״אני משלם על הכול״">
          <p>אפשרות אחת: נותנים לבן שלכם דמי כיס קבועים כל שבוע לטיול השנתי, והוא כבר יסתדר. אפשרות שנייה: מבטיחים לשלם את כל החשבון של הטיול, יעלה כמה שיעלה.</p>
          <p>מי נושא בסיכון שהטיול יתייקר — בכל אחד מהמקרים?</p>
        </Story>
        <MapBranch lesson="ias19-dc">
          הענף ״לאחר סיום העסקה״ מתפצל לשניים: הפקדה מוגדרת — פשוטה, והיא כולה בשיעור הזה — והטבה מוגדרת, ב{lessonsRef("ias19-measure", "ias19-present")}.
        </MapBranch>
      </>
    ),
  },
  "emp-dc-two": {
    lead: "בהפקדה מוגדרת החברה מעבירה סכום קבוע ונפטרת; בהטבה מוגדרת היא מבטיחה את ההטבה עצמה.",
    body: (
      <>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card title={<T19 he="הפקדה מוגדרת" en="Defined Contribution, DC" par="28" />}>
            <p>החברה מעבירה סכום קבוע לקרן נפרדת, ואין לה שום מחויבות נוספת. כמה העובד יקבל בסוף — תלוי בתשואת הקרן. הסיכון על העובד.</p>
            <p className="text-[14px] text-muted">בישראל: פנסיה צוברת, ורכיב הפיצויים אצל עובדים שחתומים על סעיף 14 לחוק פיצויי פיטורין.</p>
          </Card>
          <Card title={<T19 he="הטבה מוגדרת" en="Defined Benefit, DB" par="27(b)" />}>
            <p>החברה מתחייבת להטבה עצמה — סכום לפי נוסחה. הסיכון האקטוארי (תמותה, עליית שכר, תשואה) עליה, גם כשקרן חיצונית משלמת בפועל.</p>
            <p className="text-[14px] text-muted">בישראל: פיצויים מלאים לפי משכורת אחרונה, מענקי פרישה, פנסיה תקציבית.</p>
          </Card>
        </div>
      </>
    ),
    check: quiz("emp-dc-two", [
      { q: "המעסיק מפקיד 6.5% מהשכר לקרן פנסיה, והסיכון על העובד. איזו תוכנית?", options: ["הפקדה מוגדרת", "הטבה מוגדרת", "הטבה לזמן קצר", "פיטורין"], answer: 0, why: "סכום קבוע, בלי מחויבות נוספת." },
      { q: "פנסיה תקציבית: החברה משלמת לגמלאי 70% מהמשכורת האחרונה. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "אחרת לזמן ארוך", "לזמן קצר"], answer: 0, why: "החברה הבטיחה את ההטבה." },
    ]),
  },
  "emp-dc-test": {
    lead: "המבחן הוא מי נושא בסיכון — לא מי משלם.",
    body: (
      <>
        <P>קרן חיצונית יכולה לשלם את ההטבות — ועדיין התוכנית תהיה הטבה מוגדרת, אם החברה חייבת לכסות חוסר. מה שהופך תוכנית להטבה מוגדרת (<span dir="ltr">IAS 19.29</span>):</P>
        <Sorted
          columns={[
            { title: "הסיכון על העובד → הפקדה מוגדרת", tone: "good", items: ["הפקדה קבועה, בלי ערבות", "מבטח לקח על עצמו את כל הסיכון", "רכיב פיצויים לפי סעיף 14"] },
            { title: "הסיכון על החברה → הטבה מוגדרת", tone: "bad", items: ["ערבות לתשואה מינימלית", "חובה להשלים חוסר בקרן", "נוסחה לפי משכורת אחרונה", "אין הפקדות בכלל"] },
          ]}
        />
      </>
    ),
    check: quiz("emp-dc-test", [
      { q: "קרן נפרדת משלמת את ההטבות, והחברה מחויבת להשלים חוסרים. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "תלוי בקרן", "אין"], answer: 0, why: "חובת ההשלמה = הסיכון על החברה." },
      { q: "החברה ערבה לתשואה מינימלית על ההפקדות. איזו תוכנית?", options: ["הטבה מוגדרת", "הפקדה מוגדרת", "לזמן קצר", "פיטורין"], answer: 0, why: "IAS 19.29." },
    ]),
  },
  "emp-dc-record": {
    lead: "בהפקדה מוגדרת ההוצאה היא ההפקדה המגיעה על השנה; מה שעוד לא הועבר — התחייבות.",
    body: (
      <>
        <P>
          <strong>הכלל</strong> (<span dir="ltr">IAS 19.51–52</span>): הוצאה = ההפקדה המגיעה בגין שירות התקופה. ההפרש מול מה ששולם הוא התחייבות (או נכס, אם שילמו יותר). בלי היוון —
          אלא אם ההפקדה צפויה להשתלם יותר מ-12 חודשים אחרי סוף השנה.
        </P>
        <Remember>אין כאן מדידה אקטוארית, אין ריבית ואין P.N. ההפקדה המוגדרת היא העלה הקל בענף.</Remember>
      </>
    ),
    check: quiz("emp-dc-record", [
      { q: "בתוכנית הפקדה מוגדרת — מתי יש התחייבות במאזן?", options: ["רק כשהפקדה מגיעה ועוד לא שולמה", "תמיד, לפי ערך נוכחי של הפנסיה", "אף פעם", "רק בפרישה"], answer: 0, why: "ההתחייבות היא רק ההפקדה שטרם הועברה." },
    ]),
  },
  "emp-dc-solved": {
    lead: "הוצאה = שכר × שיעור ההפקדה; ההפקדה של דצמבר, שתעבור בינואר, היא התחייבות.",
    body: (
      <>
        <Story icon={<Coins />} title="משרד תכנון: הפקדה לפנסיה">
          <p>
            שכר שנתי <Money v={DC.payroll} />. המעסיק מפקיד {pct(DC.rate)} לקרן פנסיה צוברת, והכסף עובר ב-10 לחודש שאחרי.
          </p>
        </Story>
        <Stepper
          label="הפקדה מוגדרת"
          steps={[
            { title: "1. ההוצאה", body: <p><Money v={DC.payroll} plain /> × {pct(DC.rate)} = <strong><Money v={DC_YEAR.expense} /></strong>.</p> },
            { title: "2. מה שולם", body: <p>11 חודשים הועברו במהלך השנה: <Money v={DC_PAID} />.</p> },
            { title: "3. מה נשאר", body: <p>ההפקדה של דצמבר תעבור בינואר: <strong><Money v={DC_YEAR.liability} /></strong> — זכאים.</p> },
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
    lead: "שכר אחר — אותה דרך; ומבטח שקיבל את כל הסיכון הופך את התוכנית להפקדה מוגדרת.",
    body: (
      <>
        <Part title="א. שכר אחר">
          <HintLadder
            task={
              <>
                שכר שנתי <Money v={DC_VAR.payroll} />, הפקדה {pct(DC_VAR.rate)}, הכסף עובר ב-10 לחודש שאחרי. מה ההוצאה, מה שולם ומה הזכאים?
              </>
            }
            hints={["מה מגיע על כל השנה — ומה מזה כבר הועבר?", "הכלל: הוצאה = ההפקדה המגיעה; ההפרש — זכאים.", <>הוצאה: <Money v={DC_VAR.payroll} plain /> × {pct(DC_VAR.rate)} = <Money v={DC_VAR_YEAR.expense} />.</>, <>זכאים <Money v={DC_VAR_YEAR.liability} />; מזומן <Money v={DC_VAR_YEAR.expense - DC_VAR_YEAR.liability} />.</>]}
          />
        </Part>
        <Part title="ב. מבטח שלקח את הסיכון">
          <HintLadder
            task={
              <>
                מבטח קיבל על עצמו את כל הסיכון של מענקי הפרישה, והחברה משלמת לו רק פרמיה של {pct(INSURED.premium)} מעלות השכר (<Money v={INSURED.payroll} />). סווגו, וצרו את המעגל.
              </>
            }
            hints={["האם לחברה יש מחויבות כלשהי מעבר לפרמיה?", "המבחן: מי נושא בסיכון — המבטח. הפקדה מוגדרת.", <>הוצאה = הפרמיה: <Money v={INSURED.payroll} plain /> × {pct(INSURED.premium)} = <Money v={INSURED_EXPENSE} />.</>, <>מעגל: פתיחה 0, הוצאה <Money v={INSURED_EXPENSE} plain />, תשלום <Money v={INSURED_EXPENSE} plain />, סגירה 0.</>]}
          />
        </Part>
      </>
    ),
  },
  "emp-dc-master": {
    lead: "הפקדה מוגדרת: ההוצאה היא ההפקדה. הטבה מוגדרת: מדידה — וזה כל ההמשך.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר, בדקה, למה ״מי משלם״ אינו המבחן."
          model="גם בתוכנית של הטבה מוגדרת, קרן חיצונית יכולה להיות זו שמשלמת לגמלאים. אבל אם בקרן חסר כסף והחברה חייבת להשלים, הסיכון נשאר אצל החברה. לכן שואלים מי יפסיד אם הכסף לא יספיק — לא מי מעביר את הכסף."
        />
        <Bridge summary="הפקדה מוגדרת: הוצאה שווה להפקדה. הטבה מוגדרת: מדידה אקטוארית.">
          איך מודדים בדוחות את מה שהחברה הבטיחה לשלם בעוד 14 שנה? {lessonRef("ias19-measure")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-dc-master", [
      { q: "המעסיק מפקיד 7% לקרן, והסיכון על העובד. DC או DB?", options: ["DC", "DB"], answer: 0, why: "סכום קבוע, בלי מחויבות נוספת." },
      { q: "החברה ערבה לתשואה מינימלית. DC או DB?", options: ["DB", "DC"], answer: 0, why: "ערבות = סיכון על החברה (IAS 19.29)." },
      { q: "בתוכנית DC — מתי יש התחייבות במאזן?", options: ["רק כשהפקדה מגיעה ועוד לא שולמה", "תמיד", "רק בפרישה", "אף פעם"], answer: 0, why: "ההפקדה שטרם הועברה." },
      { q: "קרן נפרדת משלמת, והחברה מחויבת להשלים חוסרים. DC או DB?", options: ["DB", "DC"], answer: 0, why: "הסיכון על החברה." },
    ]),
  },
};
