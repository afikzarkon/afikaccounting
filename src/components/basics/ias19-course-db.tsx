import { Dumbbell, Landmark, PiggyBank, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import {
  BACK,
  BACK_A,
  BACK_ACCRUED,
  BACK_PATH,
  BACK_WRONG,
  CAPPED,
  CAPPED_PATH,
  DUAL,
  DUAL_ROWS,
  DUAL_TOTAL,
  FRONT,
  FRONT_ACCRUED,
  FRONT_OBLIGATION,
  FRONT_PATH,
  FRONT_WRONG,
  GYM_PATH,
} from "@/lib/study/ias19/lessons/attribute";
import { GROUP, groupStep, VP, VP_ACCRUED, VP_LATER, VP_LATER_PER_YEAR, VP_OBLIGATION, VP_PER_YEAR } from "@/lib/study/ias19/lessons/measure";
import { CF, CF_PER_YEAR, CHANGED, CHANGED_CLOSING, CHANGED_PER_YEAR, PAID_INTEREST, PAID_MONTHS, PAID_ON_OPENING, PAID_SAVED, PAID_YEAR, RATE_ONLY_CLOSING, Y1, Y1_PN, Y2 } from "@/lib/study/ias19/lessons/rollforward";
import { lessonRef, pct } from "@/lib/study/ias19/shared";
import { FORMULA, said, work } from "@/lib/study/ias19/formulas";
import { FormulaFill, Ltr, type Term, Work } from "./ias19-formula";
import { DrillBox, PucExplorer, SolveTemplate, WindowExplorer } from "./ias19-interactive";
import { Bridge, ExplainTask, HintLadder, Ladder, MapBranch, Recipe5, RollForward, T19, TwoBuckets } from "./ias19-ui";
import { BankStatement, Diff, PeopleGrid, Routing, Timeline, WrongRight, YearBars } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Sorted, Story } from "./inventory-teach";
import { RollSchedule } from "./roll-schedule";
import { Card, Money, Rule, Stepper, Wide } from "./ui";
import { ltrFormulas, ltrQuiz } from "@/lib/study/ias19/ltr";

/** The employee-benefits course, lessons 5–7: measuring at one date, attribution to years of service, and a year's roll-forward. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={ltrQuiz(items)} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
/** A formula inside a sentence, read left to right. */
const L = Ltr;
const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const g = groupStep(GROUP.opening);
const n1 = CF.retire - CF.from;

/** The measurement formula's five slots, symbols only. */
const SYMBOLS: Record<string, Term> = {
  per: { c: 1, sym: "הטבה לשנה", why: "כמה מקבלים על כל שנת עבודה, לפי השכר הצפוי בפרישה." },
  years: { c: 2, sym: "שנות עבודה", why: "כמה שנים כבר עבדו עד היום (תאריך המדידה)." },
  heads: { c: 3, sym: "עובדים צפויים", why: "כמה עובדים, כפול הסיכוי שיגיעו לקבל." },
  n: { c: 4, sym: "n", why: "בעוד כמה שנים משלמים, מהיום." },
  i: { c: 5, sym: "i", why: "הריבית: תשואת אג״ח קונצרניות איכותיות, בתאריך המדידה." },
};
const TOP = [{ t: "per" }, " × ", { t: "years" }, " × ", { t: "heads" }];
const BOTTOM = ["(1 + ", { t: "i" }, ")", { sup: "n" }];

/** The trap of the lesson, drawn: years already worked (②) against years still to payment (④). */
const servedVsN = (served: number, n: number, title?: ReactNode) => (
  <Timeline
    label={`${served} שנות עבודה עברו עד היום, ועוד ${n} שנים עד התשלום: ההיוון הוא על ${n} השנים שקדימה`}
    title={title}
    from={0}
    to={served + n}
    ticks={[
      { at: 0, label: "התחיל לעבוד" },
      { at: served, label: "היום: המדידה" },
      { at: served + n, label: "התשלום" },
    ]}
    spans={[
      { from: 0, to: served, label: `② ${served} שנות עבודה`, tone: 2 },
      { from: served, to: served + n, label: ltrFormulas(`④ n = ${n}: מהוונים על אלה`), tone: 4 },
    ]}
    marks={[{ at: served, label: "היום", tone: "accent" }]}
  />
);

export const IAS19_DB_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 5: measuring at one date.
  "emp-measure-hook": {
    lead: "כמה שווה היום הבטחה לפרישה? צריך לנחש שכר, זמן וריבית.",
    body: (
      <>
        <Story icon={<Landmark />} title="6% מהמשכורת האחרונה, על כל שנה">
          <p>מבטיחים לכם: ביום הפרישה תקבלו 6% מהמשכורת האחרונה, על כל שנת עבודה. כמה זה שווה היום?</p>
          <Timeline
            label="היום, עם שלוש שאלות פתוחות: מה תהיה המשכורת האחרונה, כמה שנים עד התשלום, ובאיזו ריבית מחזירים להיום"
            from={0}
            to={10}
            ticks={[
              { at: 0, label: "התחלתם לעבוד" },
              { at: 4, label: "היום" },
              { at: 10, label: "הפרישה" },
            ]}
            spans={[
              { from: 0, to: 4, label: "עבדתם", tone: 2 },
              { from: 4, to: 10, label: "? שנים עד התשלום", tone: 4 },
            ]}
            marks={[{ at: 10, label: "? המשכורת האחרונה", tone: 1 }]}
          />
          <p>צריך לנחש שלושה דברים: מה תהיה המשכורת האחרונה, כמה שנים עד התשלום, ובאיזו ריבית מחזירים להיום.</p>
        </Story>
        <MapBranch lesson="ias19-measure">
          להטבה מוגדרת שלוש מדרגות: מדידה ביום אחד (כאן), חלוקה לשנות העבודה (בהמשך השיעור), ותנועה לאורך שנה ({lessonRef("ias19-rollforward")}).
        </MapBranch>
      </>
    ),
  },
  "emp-measure-puc": {
    lead: "חמש שאלות, לפי הסדר. ורק אחריהן, הנוסחה.",
    body: (
      <>
        <P>כמו כרטיס חבר: כל שנת עבודה מוסיפה ״יחידה״ אחת של ההטבה. השאלה היא כמה יחידות נצברו, ומה הן שוות היום.</P>
        <P>עונים על חמש שאלות, תמיד באותו סדר:</P>
        <Recipe5 asQuestions />
        <P>
          לשיטה קוראים <T19 he="שיטת יחידת הזכאות הצפויה" par="68" />. את היחידה מחשבים לפי השכר <strong>הצפוי בפרישה</strong>, לא לפי השכר של היום.
        </P>
        <P>ועכשיו התשובות נכנסות לנוסחה. כל צבע הוא שאלה אחת:</P>
        <FormulaFill label="נוסחת המדידה: הטבה לשנה כפול שנות עבודה כפול עובדים צפויים, חלקי אחת ועוד הריבית בחזקת n" lhs="החוב היום" terms={SYMBOLS} top={TOP} bottom={BOTTOM} given={false} stepwise={false} />
        <Remember>כל התשלומים מהוונים (סעיף 69): הכסף ישולם רק בעתיד.</Remember>
      </>
    ),
    check: quiz("emp-measure-puc", [
      { q: "לפי איזה שכר מחשבים את היחידה?", options: ["השכר הצפוי בפרישה", "השכר של היום", "השכר הממוצע בשנות העבודה", "השכר בשנה הראשונה"], answer: 0, why: "ההבטחה היא על השכר האחרון, ולכן מעריכים אותו." },
      { q: "עובד צבר 3 יחידות מתוך 10 שיצבור. כמה נכנס לחוב היום, לפני היוון?", options: ["3 יחידות", "10 יחידות", "7 יחידות", "כלום עד הפרישה"], answer: 0, why: "רק מה שנצבר עד היום." },
    ]),
  },
  "emp-measure-explore": {
    lead: "החוב הוא רק היחידות שכבר נצברו, בשכר של יום הפרישה, מוחזרות להיום.",
    body: (
      <>
        <PucExplorer salary={VP.salary} share={VP.share} defaults={{ served: VP.served, left: VP.yearsToRetire, growth: VP.growth, rate: VP.rate }} />
      </>
    ),
    check: quiz("emp-measure-explore", [
      { q: "שיעור ההיוון עולה. מה קורה לחוב?", options: ["יורד", "עולה", "לא משתנה", "תלוי בשכר"], answer: 0, why: "מחלקים בגורם היוון גדול יותר." },
      { q: "העובד צבר עוד שנת עבודה, וכל השאר לא השתנה. מה קורה?", options: ["נוספת יחידה, והחוב עולה", "החוב לא משתנה עד הפרישה", "היחידה לשנה קטנה", "n גדל"], answer: 0, why: "עוד יחידה נצברה, ו-n קטן בשנה, כך שגם ההיוון קטן." },
    ]),
  },
  "emp-measure-assume": {
    lead: "המדידה נשענת על הנחות: על העובדים עצמם (דמוגרפיות) ועל הכסף (פיננסיות). בלי הטיה, ותואמות זו לזו.",
    body: (
      <>
        <P>
          כדי לנחש כמה ישולם ומתי, צריך <T19 he="הנחות אקטואריות" par="76" />. התקן ממליץ להסתייע באקטואר מוסמך (סעיף 59).
        </P>
        <Sorted
          columns={[
            { title: "דמוגרפיות: על העובדים", tone: "neutral", items: ["תמותה", "תחלופת עובדים: מי יעזוב לפני הפרישה", "שיעורי תביעות רפואיות"] },
            { title: "פיננסיות: על הכסף", tone: "neutral", items: ["שיעור ההיוון", "רמות שכר עתידיות", "עלויות רפואיות עתידיות"] },
          ]}
        />
        <Wide className="grid gap-3 sm:grid-cols-2">
          <Card title="בלתי מוטות (סעיף 77)">
            <p>לא שמרניות מדי ולא נועזות מדי. ״ליתר ביטחון״ אינו נימוק.</p>
          </Card>
          <Card title="תואמות זו לזו (סעיף 78)">
            <p>אותה אינפלציה בכל ההנחות של אותה תקופה: בעליית השכר, בעלויות הרפואיות ובשיעור ההיוון. הפיננסיות לפי ציפיות השוק בסוף התקופה (סעיף 80).</p>
          </Card>
        </Wide>
      </>
    ),
    check: quiz("emp-measure-assume", [
      { q: "״כמה מהעובדים ייפטרו לפני גיל הפרישה״: איזו הנחה?", options: ["דמוגרפית", "פיננסית"], answer: 0, why: "מאפיין של העובדים: תמותה." },
      { q: "״כמה יעלה השכר בכל שנה״: איזו הנחה?", options: ["פיננסית", "דמוגרפית"], answer: 0, why: "רמות שכר עתידיות: פיננסית (סעיף 76(ב))." },
      { q: "בעליית השכר הונחה אינפלציה של 1.5%, ובעלויות הרפואיות 3.5%, לאותה תקופה. מה הבעיה?", options: ["ההנחות לא תואמות זו לזו", "אין בעיה", "ההנחות שמרניות מדי", "חסר אקטואר"], answer: 0, why: "סעיף 78: אותה אינפלציה בכל ההנחות." },
    ]),
  },
  "emp-measure-rate": {
    lead: "מהוונים בתשואת אג״ח קונצרניות איכותיות, ביום המדידה.",
    body: (
      <>
        <P>
          <T19 he="שיעור ההיוון" par="83" /> הוא התשואה, בסוף התקופה, על אג״ח קונצרניות באיכות גבוהה.
        </P>
        <P>אג״ח ממשלתיות נכנסות רק כשאין לקונצרניות שוק עמוק. בישראל השוק עמוק, ולכן תשואה ממשלתית בשאלה היא בדרך כלל פיתיון.</P>
        <P>ולכל יום מדידה, הריבית של אותו יום: לפתיחה של תחילת השנה, לסגירה של סופה.</P>
        <Timeline
          label="שתי מדידות בשנה: הפתיחה בריבית של תחילת השנה, והסגירה בריבית של סוף השנה"
          title="לכל מדידה, הריבית של היום שלה"
          from={0}
          to={12}
          ticks={[
            { at: 0, label: "1.1" },
            { at: 6, label: "30.6" },
            { at: 12, label: "31.12" },
          ]}
          marks={[
            { at: 0, label: "⑤ הפתיחה: הריבית של 1.1", tone: 5 },
            { at: 12, label: "⑤ הסגירה: הריבית של 31.12", tone: 5 },
          ]}
        />
        <WrongRight
          label="הטעות: לקחת את הממשלתית או ריבית של תאריך אחר. הנכון: הקונצרנית האיכותית, ביום המדידה"
          wrong={
            <p>
              לקחת את התשואה <Diff>הממשלתית</Diff>, או את הריבית של <Diff>תאריך אחר</Diff>.
            </p>
          }
          right={
            <p>
              התשואה <Diff>הקונצרנית האיכותית</Diff>, של <Diff>יום המדידה</Diff>.
            </p>
          }
        />
        <Card title="ערך זמן, לא הסיכון של החברה (סעיף 84)">
          <p>השיעור משקף רק את ערך הזמן של הכסף. הוא לא כולל את הסיכון האקטוארי, וגם לא את סיכון האשראי של החברה, גם אם האג״ח שלה עצמה נסחרות בתשואה אחרת. המטבע והתקופה של האג״ח צריכים להתאים לאלה של החוב; כשאין אג״ח לתקופה המתאימה, מתאימים את השיעור.</p>
        </Card>
      </>
    ),
    check: quiz("emp-measure-rate", [
      { q: "ביום המדידה: ממשלתיות 4%, קונצרניות איכותיות 5.5%. באיזו ריבית מהוונים?", options: ["5.5%", "4%", "4.75%", "תלוי בעובד"], answer: 0, why: "סעיף 83, ובישראל השוק עמוק." },
    ]),
  },
  "emp-measure-recipe": {
    lead: "המתכון: ① × ② × ③ ÷ (1+i) בחזקת n. תמיד באותו סדר.",
    body: (
      <>
        <Recipe5 />
        <Remember>
          <span className="block">
            ①, כשנותנים את השכר היום: <L>{FORMULA.perYearGrown}</L>. וכשנותנים את השכר הצפוי בפרישה: <L>{FORMULA.perYear}</L>.
          </span>
          <span className="block">
            ③: <L>{FORMULA.heads}</L>.
          </span>
          <span className="block">
            ④: <L>{FORMULA.n}</L>.
          </span>
        </Remember>
        {servedVsN(7, 13, "המלכודת הגדולה: ② סופר אחורה, ④ סופר קדימה")}
        <Remember>② סופר את השנים שכבר עבדו. ④ סופר את השנים שנשארו עד התשלום. לא מחליפים ביניהם.</Remember>
      </>
    ),
    check: quiz("emp-measure-recipe", [
      { q: "באיזה צעד נכנס הסיכוי להגיע לפרישה?", options: ["③", "①", "②", "④"], answer: 0, why: "③ = עובדים × הסיכוי." },
      { q: "באיזה צעד נכנס השכר הצפוי?", options: ["①", "②", "④", "⑤"], answer: 0, why: "① היא ההטבה לשנה, בשכר הצפוי בפרישה." },
    ]),
  },
  "emp-measure-template": {
    lead: "לפני שמחשבים, עונים על חמש שאלות בדיקה. אז הנוסחה רצה לבד.",
    body: (
      <>
        <SolveTemplate
          seek={["החוב ביום המדידה: הערך הנוכחי של היחידות שכבר נצברו, בשכר הצפוי בפרישה."]}
          check={[
            "מה הובטח? אחוז מהשכר השנתי, או מספר משכורות חודשיות, לכל שנת עבודה.",
            "באיזה שכר? האחרון. לכן מצפים את השכר של היום עד הפרישה: כמה עליות שכר יש עד אז?",
            "כמה שנים נצברו עד יום המדידה, כולל חודשים (מי שהתחיל ביולי צבר חצי שנה)?",
            "כמה שנים מיום המדידה עד התשלום? זה n, לא הוותק.",
            "איזו ריבית? הקונצרנית באיכות גבוהה, של יום המדידה. יש סיכוי להגיע לפרישה? הוא מכפיל.",
          ]}
          build={[
            { title: "① השכר בפרישה", lines: [<L key="f">{FORMULA.grown}</L>] },
            { title: "② יחידת זכאות", lines: ["האחוז (או מספר המשכורות) × השכר בפרישה: ההטבה לשנת עבודה אחת."] },
            { title: "③ הצבירה, ④ ההיוון", lines: [<L key="f">{FORMULA.measure}</L>] },
          ]}
        />
      </>
    ),
    check: quiz("emp-measure-template", [
      { q: "עובד התחיל ב-1.4 לפני שנתיים, והמדידה ב-31.12 השנה. כמה שנות עבודה?", options: ["2.75", "2", "3", "2.25"], answer: 0, why: "תשעה חודשים בשנה הראשונה ועוד שנתיים מלאות: 2.75." },
      { q: "השכר בדצמבר נתון, והשכר עולה בכל ינואר. הפרישה בעוד 7 שנים, ב-31.12. כמה עליות?", options: ["7", "6", "8", "אחת"], answer: 0, why: "ינואר של כל אחת משבע השנים הבאות." },
    ]),
  },
  "emp-measure-solved": {
    lead: "חמש השאלות, אחת אחת, והחוב יוצא מהנוסחה.",
    body: (
      <>
        <Story icon={<Landmark />} title="סמנכ״לית התפעול">
          <p>
            בפרישה תקבל {pct(VP.share)} מהשכר השנתי האחרון, על כל שנת עבודה. השכר היום <Money v={VP.salary} />, והוא עולה {pct(VP.growth)} בשנה.
          </p>
          <p>
            ב-{VP.date} עבדה {VP.served} שנים, והפרישה בעוד {VP.yearsToRetire} שנים. התשואה הקונצרנית {pct(VP.rate)}.
          </p>
        </Story>
        {servedVsN(VP.served, VP.yearsToRetire, "קודם מציירים: מה עבר, ומה נשאר")}
        <FormulaFill
          label={`המדידה של הסמנכ״לית: ${Math.round(VP_PER_YEAR)} כפול ${VP.served} כפול 1, חלקי ${1 + VP.rate} בחזקת ${VP.yearsToRetire}`}
          lhs="החוב היום"
          terms={{
            per: { ...SYMBOLS.per, value: <Money v={VP_PER_YEAR} />, from: <>{pct(VP.share)} × <Money v={VP.salary} plain /> × <L>{1 + VP.growth}^{VP.yearsToRetire}</L></> },
            years: { ...SYMBOLS.years, value: VP.served, from: <>עבדה {VP.served} שנים</> },
            heads: { ...SYMBOLS.heads, value: 1, from: "עובדת אחת, תגיע לפרישה" },
            n: { ...SYMBOLS.n, value: VP.yearsToRetire, from: <>הפרישה בעוד {VP.yearsToRetire} שנים</> },
            i: { ...SYMBOLS.i, value: pct(VP.rate), from: <>הקונצרנית {pct(VP.rate)}</> },
          }}
          top={TOP}
          bottom={BOTTOM}
          working={[
            <>
              ① ההטבה לשנה, בשכר הצפוי בפרישה:
              <Work w={work.perYearGrown(VP.share, VP.salary, VP.growth, VP.yearsToRetire)} />
            </>,
            <>
              מונה: <L><Money v={VP_PER_YEAR} plain /> × {VP.served} × 1 = <M v={VP_ACCRUED} /></L> (מה שנצבר).
            </>,
            <>
              מכנה: <L>{1 + VP.rate}^{VP.yearsToRetire}</L>, ההיוון על {VP.yearsToRetire} השנים שנשארו, לא על {VP.served} שעברו.
            </>,
          ]}
          result={<M v={VP_OBLIGATION} />}
        />
      </>
    ),
  },
  "emp-measure-together": {
    lead: "משנים נתון אחד, ושואלים: איזו שאלה מהחמש הוא משנה?",
    body: (
      <>
        <Part title="א. הפרישה נדחית בשנתיים, והריבית יורדת">
          {servedVsN(VP.served, VP_LATER.yearsToRetire)}
          <HintLadder
            task={
              <>
                אותה סמנכ״לית, אבל הפרישה בעוד {VP_LATER.yearsToRetire} שנים, והתשואה {pct(VP_LATER.rate)}. מה החוב?
              </>
            }
            hints={[
              "אילו שאלות משתנות כשהפרישה רחוקה יותר?",
              <>
                ① (עוד שנתיים של עליית שכר), ④ (n) ו-⑤ (הריבית). ② ו-③ לא זזים. הנוסחה:
                <span className="block">
                  <L>{FORMULA.measure}</L>
                </span>
              </>,
              <>
                ①:
                <Work w={work.perYearGrown(VP.share, VP.salary, VP.growth, VP_LATER.yearsToRetire)} />
              </>,
              <>
                ①:
                <Work w={work.perYearGrown(VP.share, VP.salary, VP.growth, VP_LATER.yearsToRetire)} />
                החוב:
                <Work w={work.measure({ perYear: VP_LATER_PER_YEAR, years: VP.served, heads: 1, n: VP_LATER.yearsToRetire, i: VP_LATER.rate })} />
              </>,
            ]}
          />
        </Part>
        <Part title="ב. קבוצה של עובדים">
          <PeopleGrid total={GROUP.opening.staff} leaving={GROUP.opening.staff - g.heads} title={`${GROUP.opening.staff} עובדים, ${pct(GROUP.opening.stay)} צפויים לקבל`} />
          <Work w={work.heads(GROUP.opening.staff, GROUP.opening.stay)} />
          <HintLadder
            task={
              <>
                חברת לוגיסטיקה, {GROUP.opening.date}: מענק של {pct(GROUP.opening.share)} מהשכר האחרון לכל שנת עבודה. שכר ממוצע צפוי בפרישה <Money v={GROUP.opening.finalSalary} />. כולם התחילו ב-1.1.
                {GROUP.start}. {GROUP.opening.staff} עובדים, {pct(GROUP.opening.stay)} צפויים לקבל, והתשלום בעוד {GROUP.opening.n} שנים. ממשלתיות {pct(GROUP.opening.government)}, קונצרניות{" "}
                {pct(GROUP.opening.corporate)}. מה החוב?
              </>
            }
            hints={[
              "כמה עובדים באמת יקבלו, וכמה שנים כל אחד צבר?",
              <>
                שאלות ② ו-③: שנתיים, ועובדים כפול הסיכוי:
                <span className="block">
                  <L>{FORMULA.heads}</L>
                </span>
              </>,
              <>
                ①:
                <Work w={work.perYear(GROUP.opening.share, GROUP.opening.finalSalary)} />
                ② {g.years}; ③ {g.heads}, מהציור; ④ {g.n}; ⑤ {pct(g.i)} (לא הממשלתית).
              </>,
              <>
                <Work w={work.measure(g)} />
              </>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-measure-drill": {
    lead: "עובד חדש, חוזה חדש, מספרים חדשים: אותה תבנית.",
    body: (
      <>
        <P>בכל לחיצה: תפקיד אחר, אחוז או מספר משכורות, תאריך התחלה (גם באמצע שנה), עליית שכר, ריבית, ולפעמים גם תשואה ממשלתית שמסיחה את הדעת או סיכוי להגיע לפרישה. פתרו, בדקו, ורק אז פתחו את הפתרון.</P>
        <DrillBox families={["puc"]} />
      </>
    ),
  },
  "emp-measure-master": {
    lead: "החוב = הטבה לשנה × שנות עבודה × עובדים צפויים ÷ (1+i)ⁿ.",
    body: (
      <>
        <ExplainTask
          task="נסחו את חמש השאלות בלי להסתכל, והסבירו לחבר מה n סופר."
          model={
            <>
              ① כמה ההטבה לשנה, בשכר הצפוי בפרישה. ② כמה שנים כבר עבדו. ③ כמה עובדים צפויים לקבל. ④ בעוד כמה שנים משלמים. ⑤ באיזו ריבית. n סופר קדימה, עד התשלום; את מה שעבר כבר ספרנו ב-②.
              <span className="mt-2 block">{servedVsN(4, 10)}</span>
            </>
          }
        />
        <Bridge summary={<><L>{FORMULA.measure}</L>.</>}>מה קורה כשההטבה לא שווה בכל שנה, כשיש תקרה, או כשהזכאות מתחילה רק משנה מסוימת? זה החלק השני של השיעור.</Bridge>
      </>
    ),
    check: quiz("emp-measure-master", [
      { q: "כמה שווים היום 2,500 ₪ שישולמו בעוד 7 שנים, בריבית 4.5%?", options: ["1,837 ₪", "1,777 ₪", "2,500 ₪", "3,402 ₪"], answer: 0, why: said(work.pv(2_500, 0.045, 7)) },
      { q: "שכר היום 21,000 ₪, עולה 2.5% בשנה, פרישה בעוד 6 שנים, הטבה 6% לשנה. מה ①?", options: ["1,461 ₪", "1,260 ₪", "7,560 ₪", "1,087 ₪"], answer: 0, why: said(work.perYearGrown(0.06, 21_000, 0.025, 6)) },
      { q: "ממשלתיות 4.8%, קונצרניות 6.2%. באיזו משתמשים?", options: ["6.2%, כי השוק בישראל עמוק", "4.8%, כי היא בטוחה יותר", "5.5%", "תלוי במשך"], answer: 0, why: "סעיף 83." },
      { q: "עובד עבד 4 שנים וצפוי לעבוד עוד 10. מה n?", options: ["10", "4", "14", "6"], answer: 0, why: `השנים עד התשלום.
${said(work.n(14, 4))}` },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 6: attribution.
  "emp-attr-hook": {
    lead: "כמה מההטבה כבר ״שלכם״ באמצע הדרך? תלוי איך סופרים.",
    body: (
      <>
        <Story icon={<Dumbbell />} title="מנוי חינם אחרי 100 אימונים">
          <p>מועדון כושר מבטיח: מי שמשלים 100 אימונים מקבל מנוי שנתי חינם. אחרי 40 אימונים, כמה מהמנוי כבר ״שלכם״?</p>
          <p>אם כל אימון שווה אותו דבר: 40%. אבל אם הראשונים שווים כפול, או שסופרים רק מהאימון ה-30, התשובה אחרת.</p>
          <YearBars
            label="שתי דרכים לספור עשרה שלבים: בקו ישר כל שלב מוסיף אותו דבר; לפי הנוסחה השלבים הראשונים מוסיפים יותר"
            series={[
              { name: "כל אימון שווה אותו דבר", values: GYM_PATH.map((r) => r.straight), tone: 1 },
              { name: "הראשונים שווים כפול", values: GYM_PATH.map((r) => r.formula), tone: 4 },
            ]}
            at={4}
            note="כל עמודה: כמה אחוז מהמנוי נצבר אחרי כל עשרה אימונים."
          />
        </Story>
        <MapBranch lesson="ias19-measure">
          החלק הראשון נתן את הנוסחה. כאן משלימים את שאלות ① ו-②: מהי ״ההטבה לשנה״, ואילו שנים נספרות.
        </MapBranch>
      </>
    ),
  },
  "emp-attr-formula": {
    lead: "משייכים לפי נוסחת התוכנית. אם השנים המאוחרות נותנות הרבה יותר, בקו ישר.",
    body: (
      <>
        <P>
          השאלה היא <T19 he="שיוך" par="71" />: לאיזו שנת עבודה שייך כל חלק מההטבה. ברירת המחדל: לפי הנוסחה של התוכנית.
        </P>
        <P>
          החריג: כשהשנים המאוחרות נותנות הטבה גבוהה מהותית, מחלקים את הכול <T19 he="בקו ישר" par="73" />.
        </P>
        <P>בלי החריג, השנים הראשונות היו מקבלות כמעט כלום, אף שהן חלק מהדרך.</P>
        <Remember>
          <span className="block">
            לפי נוסחת התוכנית: <L>{FORMULA.tiers}</L>.
          </span>
          <span className="block">
            בקו ישר: <L>{FORMULA.straight}</L>, ואז <L>{FORMULA.accrued}</L>.
          </span>
        </Remember>
        <YearBars
          label={`מענק שקופץ: ${BACK.early.perYear} לשנה ב-${BACK.early.upTo} השנים הראשונות ו-${BACK.later} אחריהן. לפי הנוסחה השנים הראשונות מקבלות מעט; בקו ישר כל שנה מקבלת אותו חלק`}
          title="מענק שקופץ בשנים המאוחרות"
          series={[
            { name: "לפי הנוסחה", values: BACK_PATH.map((r) => r.formula), tone: 4 },
            { name: "בקו ישר (מה שעושים כאן)", values: BACK_PATH.map((r) => r.straight), tone: 1 },
          ]}
          note="הנוסחה ״מחכה״ לשנים המאוחרות. הקו הישר נותן לכל שנה את החלק שלה."
        />
      </>
    ),
    check: quiz("emp-attr-formula", [
      { q: "הטבה של 2,400 ₪ לכל אחת מ-4 השנים הראשונות, ו-600 ₪ לכל שנה אחריהן. איך משייכים?", options: ["לפי נוסחת התוכנית", "בקו ישר", "רק את השנים הראשונות", "שווה בשווה בין המדרגות"], answer: 0, why: "המאוחרות נותנות פחות, ואין סיבה לקו ישר." },
      { q: "הטבה של 1,500 ₪ לכל אחת מ-4 השנים הראשונות, ו-5,000 ₪ לכל שנה אחריהן. איך משייכים?", options: ["בקו ישר", "לפי נוסחת התוכנית", "רק את השנים המאוחרות", "לא משייכים"], answer: 0, why: "המאוחרות גבוהות מהותית (סעיף 73)." },
    ]),
  },
  "emp-attr-cap": {
    lead: "תקרה מקצרת את חלון הצבירה; היא לא מקטינה את הסכום לשנה.",
    body: (
      <>
        <P>
          <strong>תקרה:</strong> ההטבה נחתכת בתקרה, והצבירה נגמרת בשנה שבה מגיעים אליה. אחריה, השנים לא מוסיפות דבר.
        </P>
        <YearBars
          label={`${CAPPED.perYear} לשנה עד תקרה של ${CAPPED.cap}: הצבירה נעצרת בשנה הרביעית, והחלון נגמר שם`}
          title={`${CAPPED.perYear.toLocaleString("he-IL")} ₪ לשנה, תקרה ${CAPPED.cap.toLocaleString("he-IL")} ₪`}
          series={[{ name: "מה שנצבר", values: CAPPED_PATH.map((r) => r.straight), tone: 1 }]}
          cap={CAPPED.cap}
          note="ארבע שנים מגיעים לתקרה. מכאן העמודות לא עולות: החלון קצר יותר, והסכום לשנה לא קטן."
        />
        <Work w={work.capWindow(CAPPED.cap, CAPPED.perYear)} />
        <P>
          <strong>זכאות שמתחילה מגיל או מוותק:</strong> השנים שלפני כן לא נספרות.
        </P>
        <Timeline
          label="עובדת התחילה בגיל 26, והזכאות מתחילה מגיל 35. היום היא בת 31, ולכן עוד לא נספרה אף שנה"
          title="זכאות מגיל 35"
          from={26}
          to={45}
          ticks={[
            { at: 26, label: "26: התחילה" },
            { at: 31, label: "31: היום" },
            { at: 35, label: "35" },
            { at: 45, label: "45" },
          ]}
          spans={[
            { from: 26, to: 35, label: "לא נספר", tone: 0 },
            { from: 35, to: 45, label: "② נספר מכאן", tone: 2 },
          ]}
          marks={[{ at: 31, label: "היום", tone: "accent" }]}
        />
        <Work w={work.counted(31, 35)} />
        <P>
          ואורך החלון, כשהזכאות מתחילה מגיל מסוים: <L>{FORMULA.window}</L>.
        </P>
        <Remember>
          ובכל מקרה, ההיוון (④) הוא על השנים עד התשלום, לא על חלון הצבירה: <L>{FORMULA.nAge}</L>.
        </Remember>
      </>
    ),
    check: quiz("emp-attr-cap", [
      { q: "הטבה של 2,500 ₪ לכל שנה, עד תקרה של 10,000. אחרי 2 שנים, כמה נצבר?", options: ["5,000, והחלון 4 שנים", "10,000", "2,500", "5,000, והחלון כל שנות העבודה"], answer: 0, why: `${said(work.capWindow(10_000, 2_500))}
${said(work.accrued(2_500, 2))}` },
      { q: "העובדת התחילה בגיל 26, והזכאות מגיל 35. היום היא בת 31. כמה שנים נספרות?", options: ["0", "5", "9", "4"], answer: 0, why: `עד גיל 35 העבודה לא מקנה זכאות.
${said(work.counted(31, 35))}` },
    ]),
  },
  "emp-attr-dual": {
    lead: "כשיש שני מסלולים לזכאות, שואלים לכל עובד: מתי העבודה שלו מתחילה להגדיל את המענק, ומתי מפסיקה.",
    body: (
      <>
        <P>
          מענק של <Money v={DUAL.rule.grant} /> למי שעדיין מועסק בגיל {DUAL.rule.minAge} אחרי {DUAL.rule.years} שנות עבודה, או למי שעדיין מועסק בגיל {DUAL.rule.retire}, בלי קשר לוותק. הצבירה מתחילה
          כשהעבודה מתחילה להוביל למענק (סעיף 71), ונגמרת כשעבודה נוספת כבר לא מגדילה אותו (סעיף 73). שלושה מקרים:
        </P>
        <Sorted
          columns={[
            { title: `התחיל לפני גיל ${DUAL.rule.minAge - DUAL.rule.years}`, tone: "neutral", items: [`צובר רק מגיל ${DUAL.rule.minAge - DUAL.rule.years}`, `על ${DUAL.rule.years} שנים, עד גיל ${DUAL.rule.minAge}`] },
            { title: `התחיל בזמן להשלים ${DUAL.rule.years} שנה`, tone: "neutral", items: ["צובר מיום שהתחיל", `על ${DUAL.rule.years} שנים, ואז כבר זכאי`] },
            { title: "התחיל מאוחר מדי", tone: "neutral", items: [`זכאי רק בגיל ${DUAL.rule.retire}`, "צובר מיום שהתחיל ועד אז"] },
          ]}
        />
        <WindowExplorer rule={DUAL.rule} start={{ hireAge: DUAL.people[0].hireAge, age: DUAL.people[0].age }} />
      </>
    ),
    check: quiz("emp-attr-dual", [
      { q: "לפי אותו מענק: עובדת התחילה בגיל 28. מאיזה גיל היא צוברת?", options: [`${DUAL.rule.minAge - DUAL.rule.years}`, "28", `${DUAL.rule.minAge}`, `${DUAL.rule.retire}`], answer: 0, why: `העבודה לפני ${DUAL.rule.minAge - DUAL.rule.years} לא מוסיפה: בכל מקרה היא תהיה זכאית בגיל ${DUAL.rule.minAge}.` },
      { q: "עובד התחיל בגיל 55. על כמה שנים נפרש המענק?", options: [`${DUAL.rule.retire - 55}`, `${DUAL.rule.years}`, "5", "אין מענק"], answer: 0, why: `לא ישלים ${DUAL.rule.years} שנה: זכאי רק בגיל ${DUAL.rule.retire}, וכל עבודתו מובילה לשם.` },
      { q: "הצבירה של עובד נגמרת בגיל 60, הוא היום בן 50, ויפרוש ב-67. בכמה שנים מהוונים?", options: ["17", "10", "25", "7"], answer: 0, why: said(work.nAge(67, 50)) },
    ]),
  },
  "emp-attr-rule": {
    lead: "שלוש שאלות לפני כל חישוב, ורק אז חוזרים לנוסחה.",
    body: (
      <>
        <Ladder
          steps={[
            { q: "השנים המאוחרות נותנות הטבה גבוהה מהותית?", yes: "קו ישר: ההטבה הכוללת ÷ שנות הצבירה. לא: לפי הנוסחה." },
            { q: "יש תקרה?", yes: "חותכים בתקרה, ומקצרים את חלון הצבירה." },
            { q: "מאיזה רגע העבודה מקנה זכאות, ועד מתי היא מוסיפה?", yes: "סופרים רק את החלון הזה. ויש שני מסלולים (גיל וּותק, או גיל בלבד)? בודקים לכל עובד באיזה יגיע." },
          ]}
        />
        <Rule>
          אחרי שלוש השאלות חוזרים לנוסחה: <L>{FORMULA.measure}</L>.
        </Rule>
      </>
    ),
    check: quiz("emp-attr-rule", [
      { q: "ההטבה משולמת בגיל 66, וצוברים אותה על 12 שנים מגיל 42. בגיל 48, מה n?", options: ["18", "6", "12", "24"], answer: 0, why: said(work.nAge(66, 48)) },
    ]),
  },
  "emp-attr-template": {
    lead: "שאלת ייחוס: קודם החלון, ממתי עד מתי ובאיזה קצב. רק אחר כך ההיוון.",
    body: (
      <>
        <SolveTemplate
          seek={["כמה מההטבה שייך לשנים שכבר עבדו, ובערך נוכחי: לכל עובד ובסך הכול."]}
          check={[
            "נוסחה או קו ישר? השנים המאוחרות נותנות הטבה גבוהה מהותית: קו ישר (סעיף 73); אחרת נוסחת התוכנית (סעיף 71).",
            "יש תקרה? היא חותכת את ההטבה ומקצרת את החלון. השנים שאחריה לא מוסיפות.",
            "ממתי העבודה מובילה להטבה? עבודה שלא מוסיפה (לפני גיל מסוים, למשל) לא נספרת.",
            "עד מתי? כשהעובד כבר זכאי וכל שנה נוספת לא מגדילה, הצבירה נעצרת. יש שני מסלולים? לכל עובד: באיזה יגיע.",
            "ההיוון: עד התשלום (גיל הפרישה), לא עד סוף הצבירה. והסיכוי להגיע: מכפילים.",
          ]}
          build={[
            { title: "1. החלון", lines: ["גיל תחילת הצבירה, גיל סוף הצבירה, ואורך החלון."] },
            { title: "2. הקצב", lines: [<L key="f">{FORMULA.straight}</L>, "או לפי המדרגות של התוכנית."] },
            { title: "3. מה נצבר", lines: [<L key="f">{FORMULA.counted}</L>, "הקצב × השנים שכבר עברו בתוך החלון."] },
            { title: "4. היוון וסיכוי", lines: [<L key="f">{FORMULA.nAge}</L>, <L key="g">{FORMULA.measure}</L>, "ואם יש כמה עובדים: טבלה וסכום."] },
          ]}
        />
      </>
    ),
    check: quiz("emp-attr-template", [
      { q: "באיזה שלב נכנסת התקרה?", options: ["בבדיקה: היא משנה את החלון", "רק בהיוון", "אחרי הסכום", "היא לא משפיעה על הצבירה"], answer: 0, why: "התקרה קובעת מתי הצבירה נעצרת." },
      { q: "הצבירה נגמרת בגיל 61, והתשלום בגיל 66. עד איזה גיל מהוונים?", options: ["66", "61", "ממוצע", "לא מהוונים"], answer: 0, why: "תמיד עד התשלום." },
    ]),
  },
  "emp-attr-solved": {
    lead: "כשהשנים הראשונות נותנות יותר: לפי הנוסחה. קו ישר היה נותן מעט מדי.",
    body: (
      <>
        <Story icon={<Trophy />} title="מענק שנותן יותר בהתחלה">
          <p>
            מענק פרישה: <Money v={FRONT.early.perYear} /> לכל אחת מ-{FRONT.early.upTo} השנים הראשונות, ו-<Money v={FRONT.later} /> לכל שנה אחריהן. תקרה <Money v={FRONT.cap} />.
          </p>
          <p>
            העובד צפוי לעבוד {FRONT.expected} שנים. הוא עבד {FRONT.served}, והתשלום בעוד {FRONT.n}. ריבית {pct(FRONT.rate)}.
          </p>
        </Story>
        <YearBars
          label={`לפי הנוסחה נצברו אחרי ${FRONT.served} שנים ${FRONT_ACCRUED}; בקו ישר רק ${Math.round(FRONT_WRONG)}`}
          title="שתי הדרכים, שנה אחר שנה"
          series={[
            { name: "לפי הנוסחה (הנכון כאן)", values: FRONT_PATH.map((r) => r.formula), tone: 1 },
            { name: "בקו ישר", values: FRONT_PATH.map((r) => r.straight), tone: 4 },
          ]}
          cap={FRONT.cap}
          at={FRONT.served}
        />
        <FormulaFill
          label={`החוב: ${FRONT_ACCRUED} שנצברו, חלקי ${1 + FRONT.rate} בחזקת ${FRONT.n}`}
          lhs="החוב היום"
          terms={{
            acc: { c: 2, sym: "מה שנצבר", value: <Money v={FRONT_ACCRUED} plain />, from: <>{FRONT.early.upTo} × <Money v={FRONT.early.perYear} plain /> + {FRONT.served - FRONT.early.upTo} × <Money v={FRONT.later} plain /></>, why: "השנים הראשונות גבוהות יותר, ולכן לפי הנוסחה. התקרה לא חותכת: בדיוק 18,000 בסוף." },
            n: { ...SYMBOLS.n, value: FRONT.n, from: <>התשלום בעוד {FRONT.n}</> },
            i: { ...SYMBOLS.i, value: pct(FRONT.rate), from: pct(FRONT.rate) },
          }}
          top={[{ t: "acc" }]}
          bottom={BOTTOM}
          working={[
            <>
              מה שנצבר, לפי הנוסחה:
              <Work w={work.tiers([{ years: FRONT.early.upTo, perYear: FRONT.early.perYear }, { years: FRONT.served - FRONT.early.upTo, perYear: FRONT.later }])} />
            </>,
            <>
              קו ישר (אסור כאן) היה נותן פחות:
              <Work w={work.straight(FRONT.cap, FRONT.expected)} />
              <Work w={work.accrued(FRONT.cap / FRONT.expected, FRONT.served)} />
              <Work w={work.accPv(FRONT_WRONG, FRONT.rate, FRONT.n)} />
            </>,
          ]}
          result={<M v={FRONT_OBLIGATION} />}
        />
      </>
    ),
  },
  "emp-attr-together": {
    lead: "מענק שקופץ בסוף: קו ישר. זכאות שמתחילה מאוחר: סופרים רק ממנה.",
    body: (
      <>
        <Part title="א. מענק שקופץ">
          <YearBars
            label={`מענק שקופץ: אחרי ${BACK.served} שנים, בקו ישר נצברו ${Math.round(BACK_ACCRUED)}; הנוסחה הייתה נותנת ${BACK_WRONG}`}
            series={[
              { name: "בקו ישר (הנכון כאן)", values: BACK_PATH.map((r) => r.straight), tone: 1 },
              { name: "לפי הנוסחה", values: BACK_PATH.map((r) => r.formula), tone: 4 },
            ]}
            at={BACK.served}
          />
          <HintLadder
            task={
              <>
                <Money v={BACK.early.perYear} /> לכל אחת מ-{BACK.early.upTo} השנים הראשונות, ו-<Money v={BACK.later} /> לכל שנה אחריהן, בלי תקרה. צפוי לעבוד {BACK.expected} שנים, עבד {BACK.served}, התשלום בעוד{" "}
                {BACK.n}; ריבית {pct(BACK.rate)}. מה החוב?
              </>
            }
            hints={[
              "השנים המאוחרות נותנות יותר או פחות?",
              <>
                שאלה (א): הרבה יותר. קו ישר על כל שנות הצבירה:
                <span className="block">
                  <L>{FORMULA.straight}</L>
                </span>
              </>,
              <>
                ההטבה הכוללת:
                <Work w={work.tiers([{ years: BACK.early.upTo, perYear: BACK.early.perYear }, { years: BACK.expected - BACK.early.upTo, perYear: BACK.later }])} />
                <Work w={work.straight(BACK_A.total, BACK.expected)} />
              </>,
              <>
                <Work w={work.accrued(BACK_A.perYear!, BACK.served)} />
                <Work w={work.accPv(BACK_ACCRUED, BACK.rate, BACK.n)} />
                הנוסחה (אסורה כאן) הייתה נותנת:
                <Work w={work.tiers([{ years: BACK.early.upTo, perYear: BACK.early.perYear }, { years: BACK.served - BACK.early.upTo, perYear: BACK.later }])} />
                <Work w={work.accPv(BACK_WRONG, BACK.rate, BACK.n)} />
              </>,
            ]}
          />
        </Part>
        <Part title="ב. שלושה עובדים, שני מסלולים">
          <p className="text-[14.5px]">
            מענק של <Money v={DUAL.rule.grant} /> למי שעדיין מועסק בגיל {DUAL.rule.minAge} אחרי {DUAL.rule.years} שנות עבודה, או בגיל {DUAL.rule.retire} בלי קשר לוותק. כולם צפויים לפרוש בגיל{" "}
            {DUAL.rule.retire}; ריבית {pct(DUAL.rate)}. ב-{DUAL.date}:{" "}
            {DUAL.people.map((p, k) => (
              <span key={p.id}>
                עובד {p.id}, בן {p.age}, עובד {p.age - p.hireAge} שנים, סיכוי {pct(p.stay)}
                {k < DUAL.people.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
          <Timeline
            label={`שלושה עובדים: כל אחד צובר בחלון אחר, וכולם מקבלים בגיל ${DUAL.rule.retire}`}
            title="מאיזה גיל ועד איזה גיל כל אחד צובר"
            from={30}
            to={DUAL.rule.retire}
            ticks={[
              { at: 30, label: "30" },
              { at: DUAL.rule.minAge - DUAL.rule.years, label: `${DUAL.rule.minAge - DUAL.rule.years}` },
              { at: DUAL.rule.minAge, label: `${DUAL.rule.minAge}` },
              { at: DUAL.rule.retire, label: `${DUAL.rule.retire}: תשלום` },
            ]}
            spans={DUAL.people.map((p, k) => ({ from: DUAL_ROWS[k].start, to: DUAL_ROWS[k].end, label: `עובד ${p.id}: ${DUAL_ROWS[k].start}–${DUAL_ROWS[k].end}`, tone: 2 as const, row: k }))}
            marks={DUAL.people.map((p) => ({ at: p.age, label: `${p.id} היום` }))}
          />
          <HintLadder
            task="מה החוב לכל עובד, ובסך הכול?"
            hints={[
              `לכל עובד: האם הוא יכול להשלים ${DUAL.rule.years} שנות עבודה עד גיל ${DUAL.rule.retire}? ומאיזה גיל העבודה שלו מתחילה להוביל למענק?`,
              <>
                עובד א׳ התחיל בגיל {DUAL.people[0].hireAge}, לפני {DUAL.rule.minAge - DUAL.rule.years}: צובר מגיל {DUAL_ROWS[0].start} עד {DUAL_ROWS[0].end}. עובד ב׳ התחיל בגיל {DUAL.people[1].hireAge}: ישלים{" "}
                {DUAL.rule.years} שנה בגיל {DUAL_ROWS[1].end}. עובד ג׳ התחיל בגיל {DUAL.people[2].hireAge}: לא ישלים, ולכן זכאי רק בגיל {DUAL.rule.retire}, וצובר עד אז.
              </>,
              <>
                עובד א׳:
                <Work w={work.straight(DUAL.rule.grant, DUAL_ROWS[0].window)} />
                <Work w={work.counted(DUAL.people[0].age, DUAL_ROWS[0].start)} />
              </>,
              <div key="t" className="space-y-2">
                {DUAL.people.map((p, k) => (
                  <div key={p.id}>
                    <p className="font-semibold">
                      עובד {p.id}, צובר מגיל {DUAL_ROWS[k].start} עד {DUAL_ROWS[k].end}:
                    </p>
                    <Work w={work.straight(DUAL.rule.grant, DUAL_ROWS[k].window)} />
                    <Work w={work.counted(p.age, DUAL_ROWS[k].start)} />
                    <Work w={work.nAge(DUAL.rule.retire, p.age)} />
                    <Work w={work.measure({ perYear: DUAL_ROWS[k].perYear, years: DUAL_ROWS[k].served, heads: p.stay, n: DUAL_ROWS[k].n, i: DUAL.rate })} />
                  </div>
                ))}
                <Work w={work.peopleTotal(DUAL_ROWS.map((r) => r.obligation))} />
                <DataTable
                  head={["עובד", "צובר מגיל", "עד גיל", "לשנה", "נספרו", "n", "סיכוי", "חוב"]}
                  rows={DUAL.people.map((p, k) => [p.id, DUAL_ROWS[k].start, DUAL_ROWS[k].end, Math.round(DUAL_ROWS[k].perYear), DUAL_ROWS[k].served, DUAL_ROWS[k].n, pct(p.stay), Math.round(DUAL_ROWS[k].obligation)])}
                  foot={["סה״כ", "", "", "", "", "", "", Math.round(DUAL_TOTAL)]}
                />
              </div>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-attr-drill": {
    lead: "שתי סוגיות ייחוס, מספרים חדשים בכל לחיצה, ופתרון מלא לפי התבנית.",
    body: (
      <>
        <P>״שני מסלולים״: מענק לפי גיל וּותק או לפי גיל בלבד, ושלושה עובדים, אחד מכל מקרה, בסדר משתנה. ״נוסחה או קו ישר״: מדרגות של ותק, לפעמים עם תקרה. פתרו, בדקו, ורק אז פתחו את הפתרון.</P>
        <DrillBox families={["window", "tiers"]} />
      </>
    ),
  },
  "emp-attr-master": {
    lead: "קודם מחליטים איך מחלקים בין השנים. אחר כך מהוונים, עד התשלום.",
    body: (
      <>
        <ExplainTask
          task="הסבירו במשפט: למה במענק שנצבר על 10 שנים ומשולם בעוד 26, מחלקים ב-10 אבל מהוונים על 26?"
          model={
            <>
              החלוקה עונה על ״כמה כבר הרווחתי?״, ואת זה מרוויחים בעשר שנים. ההיוון עונה על ״מתי יגיע הכסף?״, והוא יגיע רק בעוד 26 שנה.
              <span className="mt-2 block">
                <Timeline
                  label="חלון צבירה של 10 שנים, והיוון על 26 שנים עד התשלום"
                  from={0}
                  to={26}
                  ticks={[
                    { at: 0, label: "היום" },
                    { at: 10, label: "+10" },
                    { at: 26, label: "+26: התשלום" },
                  ]}
                  spans={[
                    { from: 0, to: 10, label: "② צוברים 10 שנים", tone: 2, row: 0 },
                    { from: 0, to: 26, label: "④ מהוונים 26 שנים", tone: 4, row: 1 },
                  ]}
                />
              </span>
            </>
          }
        />
        <Bridge summary="קודם מחליטים איך מחלקים את ההטבה בין השנים (נוסחה, קו ישר, תקרה, תחילת זכאות), ואחר כך מהוונים לפי השנים עד התשלום.">
          ב-31.12 הכול עומד על ערכים של אותו יום. מה קורה לחוב מתחילת השנה ועד סופה? {lessonRef("ias19-rollforward")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-attr-master", [
      { q: "הטבה של 1,500 ₪ לשנה, עד תקרה של 6,000. אחרי 3 שנים: כמה נצבר, ומה החלון?", options: ["4,500; ארבע שנים", "6,000; שלוש שנים", "4,500; כל שנות העבודה", "1,500; שנה אחת"], answer: 0, why: `${said(work.capWindow(6_000, 1_500))}
${said(work.accrued(1_500, 3))}` },
      { q: "הטבה של 1,200 ₪ ל-4 השנים הראשונות, 4,800 ₪ לכל שנה אחריהן. איזו שיטה?", options: ["קו ישר", "נוסחת התוכנית"], answer: 0, why: "סעיף 73." },
      { q: "התחיל בגיל 28, זכאות מגיל 35, היום בן 33. כמה שנים נספרות?", options: ["0", "5", "7", "2"], answer: 0, why: `הזכאות עוד לא התחילה.
${said(work.counted(33, 35))}` },
      { q: "משולם בגיל 67, נצבר על 12 שנים מגיל 50. בגיל 55, מה n?", options: ["12", "5", "7", "17"], answer: 0, why: said(work.nAge(67, 55)) },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 7: a year's roll-forward.
  "emp-roll-hook": {
    lead: "מה שהשורות הרגילות לא מסבירות, ״ההפתעה״, הוא שורה בפני עצמה.",
    body: (
      <>
        <Story icon={<PiggyBank />} title="חשבון החיסכון שהפתיע">
          <p>התחלתם את השנה עם יתרה. נוספה ריבית, הפקדתם, משכתם. ובסוף השנה הבנק מראה יתרה אחרת ממה שחישבתם.</p>
          <BankStatement
            title="דף החשבון בסוף השנה"
            opening={1_000}
            moves={[
              { label: "ריבית", v: 50 },
              { label: "הפקדה", v: 200 },
              { label: "משיכה", v: -100 },
            ]}
            closing={1_180}
            unexplained="ההפתעה: לא הוסבר"
          />
          <p>
            בחוב לעובדים יש להפתעה שם: <T19 he="מדידה מחדש" par="57(ד)" />, ובקורס P.N., המספר המאזן.
          </p>
        </Story>
        <MapBranch lesson="ias19-rollforward">
          {lessonRef("ias19-measure")} מדד יתרה אחת ביום אחד. עכשיו מודדים שתיים, פתיחה וסגירה, ומפרקים את השינוי ביניהן.
        </MapBranch>
        <TwoBuckets />
      </>
    ),
  },
  "emp-roll-lines": {
    lead: "ארבע שורות מסבירות את השנה. החמישית, P.N., היא מה שנשאר.",
    body: (
      <>
        <P>כמו דף בנק, מהפתיחה לסגירה. לכל שורה תפקיד אחד:</P>
        <RollForward
          title={`סמנכ״ל כספים, ${CF.from + 1}`}
          rows={[
            { label: "יתרת פתיחה", value: Y1.closing, kind: "balance", how: "החוב בתחילת השנה" },
            { label: <T19 he="עלות ריבית" />, value: Y2.interest, how: "החוב ״התקרב״ בשנה לתשלום" },
            { label: <T19 he="עלות שירות שוטף" />, value: Y2.service, how: "מה שהעובד צבר השנה" },
            { label: "תשלומים", value: 0, how: "מה ששולם לעובדים: מקטין את החוב (השנה: כלום)" },
            { label: "P.N.", value: Y2.pn, kind: "pn", how: "מה שנשאר: ההערכות לא השתנו, ולכן אפס" },
            { label: "יתרת סגירה", value: Y2.closing, kind: "balance", how: "מדידה חדשה, בהנחות של סוף השנה" },
          ]}
        />
        <RollSchedule />
      </>
    ),
    check: quiz("emp-roll-lines", [
      { q: "פתיחה 4,000; ריבית תחילת השנה 5%; שירות 600; סגירה 4,950. מה ה-P.N.?", options: ["150, הפסד", "150, רווח", "350", "0"], answer: 0, why: `${said(work.interestCost(4_000, 0.05))}\n${said(work.pnDB({ opening: 4_000, interest: 200, service: 600, closing: 4_950 }))}\nהחוב גדל יותר מהצפוי: הפסד.` },
      { q: "לאן הולך ה-P.N. של הטבה מוגדרת?", options: ["ל-OCI", "לרווח והפסד", "למאזן בלבד", "לעודפים ישירות"], answer: 0, why: "סעיף 57(ד)." },
    ]),
  },
  "emp-roll-rates": {
    lead: "ריבית ושירות לפי תחילת השנה; הסגירה לפי סופה. ו-n של השירות נספר מסוף השנה.",
    body: (
      <>
        <Timeline
          label="ריבית ושירות בשיעור של תחילת השנה; הסגירה בשיעור של סוף השנה; ה-n של עלות השירות נספר מסוף השנה ועד התשלום"
          title="איזו ריבית, ואיזה n, לכל שורה"
          from={0}
          to={6}
          ticks={[
            { at: 0, label: "1.1" },
            { at: 1, label: "31.12" },
            { at: 6, label: "התשלום" },
          ]}
          spans={[
            { from: 0, to: 1, label: "⑤ ריבית ושירות: שיעור 1.1", tone: 5, row: 0 },
            { from: 1, to: 6, label: "④ n של השירות: מ-31.12", tone: 4, row: 1 },
          ]}
          marks={[{ at: 1, label: "⑤ סגירה: שיעור 31.12", tone: 5 }]}
        />
        <DataTable
          head={["שורה", "ריבית", "n"]}
          rows={[
            ["פתיחה", "השיעור שבו נמדדה בסוף השנה הקודמת", "מתחילת השנה עד התשלום"],
            ["ריבית", "תחילת השנה", "שנה שלמה"],
            ["עלות שירות", "תחילת השנה", "מסוף השנה עד התשלום"],
            ["סגירה", "סוף השנה", "מסוף השנה עד התשלום"],
          ]}
        />
        <Remember>
          <span className="block">
            <L>{FORMULA.interestCost}</L>.
          </span>
          <span className="block">
            <L>{FORMULA.service}</L>, ו-n של השירות: <L>{FORMULA.nYear}</L>.
          </span>
        </Remember>
        <P>למה ירידת ריבית לא משנה את עלות השירות של אותה שנה? השירות נמדד לפי תחילת השנה, וכל השינוי נתפס ב-P.N.</P>
      </>
    ),
    check: quiz("emp-roll-rates", [
      { q: "באיזה שיעור מחשבים ריבית: תחילת השנה או סופה?", options: ["תחילת השנה", "סוף השנה", "ממוצע", "תלוי בשאלה"], answer: 0, why: "ריבית ושירות: תחילת השנה." },
      { q: "סגירה ב-31.12.2025, פרישה ב-31.12.2030. מה n של עלות השירות של 2025?", options: ["5", "6", "4", "1"], answer: 0, why: said(work.nYear(2030, 2025)) },
    ]),
  },
  "emp-roll-paid": {
    lead: "כששולם מענק באמצע השנה, מיום התשלום החוב קטן — ולכן גם הריבית.",
    body: (
      <>
        <P>
          <T19 he="הריבית על ההתחייבות" par="123" /> היא השינוי בהתחייבות מחלוף הזמן: יתרת הפתיחה כפול השיעור שבו נמדדה, תוך התחשבות בתשלומים. מה ששולם כבר לא ״מתקרב לתשלום״ — ולכן מורידים את הריבית
          עליו, מיום ששולם ועד סוף השנה.
        </P>
        <Timeline
          label={`פתיחה ${PAID_YEAR.opening.toLocaleString("en-US")} נושאת ריבית כל השנה; התשלום ב-1.${PAID_YEAR.month} לא נושא ריבית ${PAID_MONTHS} חודשים`}
          title="מה נושא ריבית, וכמה זמן"
          from={0}
          to={12}
          ticks={[
            { at: 0, label: "1.1" },
            { at: PAID_YEAR.month - 1, label: `1.${PAID_YEAR.month}: תשלום` },
            { at: 12, label: "31.12" },
          ]}
          spans={[
            { from: 0, to: 12, label: "הפתיחה: 12 חודשים", tone: 5, row: 0 },
            { from: PAID_YEAR.month - 1, to: 12, label: `התשלום: ${PAID_MONTHS} חודשים שלא נושאים ריבית`, tone: 4, row: 1 },
          ]}
        />
        <Part title="דוגמה">
          <p className="text-[15px]">
            פתיחה <Money v={PAID_YEAR.opening} />, שיעור תחילת השנה {pct(PAID_YEAR.rate)}. ב-1.{PAID_YEAR.month} שולם לעובד שפרש, כצפוי, מענק של <Money v={PAID_YEAR.paid} />.
          </p>
          <Stepper
            label="ריבית עם תשלום"
            steps={[
              { title: "1. על הפתיחה", body: <p><L>{PAID_YEAR.opening.toLocaleString("en-US")} × {pct(PAID_YEAR.rate)} = {Math.round(PAID_ON_OPENING).toLocaleString("en-US")}</L></p> },
              { title: "2. על התשלום", body: <p><L>{PAID_YEAR.paid.toLocaleString("en-US")} × ({1 + PAID_YEAR.rate}^({PAID_MONTHS}/12) − 1) = {Math.round(PAID_SAVED).toLocaleString("en-US")}</L> — ריבית דריבית לחלק משנה, לא {pct(PAID_YEAR.rate)} × {PAID_MONTHS}/12.</p> },
              { title: "3. הריבית", body: <p><L>{Math.round(PAID_ON_OPENING).toLocaleString("en-US")} − {Math.round(PAID_SAVED).toLocaleString("en-US")} = {Math.round(PAID_INTEREST).toLocaleString("en-US")}</L> ₪.</p> },
            ]}
          />
        </Part>
      </>
    ),
    check: quiz("emp-roll-paid", [
      { q: "תשלום של 20,000 ב-1.10, שיעור 6%. כמה חודשים הוא לא נושא ריבית?", options: ["3", "9", "10", "2"], answer: 0, why: "מ-1.10 עד 31.12: אוקטובר, נובמבר, דצמבר." },
      { q: "האם משתמשים ב-6% × 3/12 על התשלום?", options: ["לא — 1.06^(3/12) − 1", "כן, זה הכי מדויק", "לא — 6% על כל השנה", "לא מורידים ריבית על תשלומים"], answer: 0, why: "ריבית לחלק משנה היא ריבית דריבית." },
    ]),
  },
  "emp-roll-rule": {
    lead: "P.N. = סגירה − פתיחה − ריבית − שירות + תשלומים. ולכל שורה, המקום שלה בדוחות.",
    body: (
      <>
        <Rule>
          <L>{FORMULA.rollDB}</L>. ולכן <L>{FORMULA.pnDB}</L>.
        </Rule>
        <Routing
          label="עלות השירות והריבית לרווח והפסד; ה-P.N. ל-OCI; הסגירה למאזן"
          title={`לאן הולכת כל שורה (סמנכ״ל הכספים, ${CF.from})`}
          rows={[
            { label: "עלות שירות", value: Math.round(Y1.service), to: "pl" },
            { label: "עלות ריבית", value: 0, to: "pl" },
            { label: "P.N., הפסד", value: Math.round(Y1_PN), to: "oci" },
            { label: "יתרת סגירה", value: Math.round(Y1.closing), to: "bs" },
          ]}
        />
        <DataTable
          head={["שורה", "חובה", "זכות"]}
          rows={[
            ["עלות שירות", "הוצאות שכר", "התחייבות"],
            ["ריבית", "הוצאות מימון", "התחייבות"],
            ["P.N. (הפסד)", "קרן הון: מדידה מחדש (OCI)", "התחייבות"],
            ["תשלום", "התחייבות", "מזומן"],
          ]}
        />
      </>
    ),
    check: quiz("emp-roll-rule", [{ q: "רישום של P.N. הפסד:", options: ["ח׳ קרן הון (OCI), ז׳ התחייבות", "ח׳ הוצאות שכר, ז׳ התחייבות", "ח׳ התחייבות, ז׳ קרן הון", "ח׳ הוצאות מימון, ז׳ מזומן"], answer: 0, why: "הפסד מגדיל את החוב, ונרשם ב-OCI." }]),
  },
  "emp-roll-where": {
    lead: "שירות, ריבית, שירות עבר וסילוק — לרווח והפסד. מדידה מחדש — ל-OCI, ולא חוזרת.",
    body: (
      <>
        <Sorted
          columns={[
            { title: "רווח והפסד", tone: "neutral", items: ["עלות שירות שוטף — בהוצאות השכר", "ריבית — במימון או בשכר", "עלות שירות עבר — בהמשך השיעור", "רווח או הפסד מסילוק — בהמשך השיעור"] },
            { title: "רווח כולל אחר (OCI)", tone: "neutral", items: ["רווח או הפסד ממדידה מחדש: שינוי בשיעור ההיוון, בתמותה, במועד הפרישה, בשכר הצפוי"] },
          ]}
        />
        <Card title="שני חריגים קטנים">
          <p>עלות שעובדת על ייצור יכולה להיכנס לעלות נכס (למשל מלאי) במקום לרווח והפסד. והריבית: התקן לא מחייב להציג אותה במימון — רק לתת לה גילוי נפרד. יש חברות שמציגות אותה במימון, ויש שבשכר.</p>
        </Card>
        <Remember>
          מדידה מחדש שנרשמה ב-OCI לא עוברת לעולם לרווח והפסד, גם כשהעובדים פורשים. מותר להעביר אותה בתוך ההון, מהקרן לעודפים (סעיף 122).
        </Remember>
      </>
    ),
    check: quiz("emp-roll-where", [
      { q: "הפסד ממדידה מחדש של 18,000. לאן?", options: ["OCI", "הוצאות שכר", "הוצאות מימון", "ישר לעודפים"], answer: 0, why: "סעיף 57(ד)." },
      { q: "החברה מציגה את הריבית בהוצאות השכר. מותר?", options: ["כן, עם גילוי נפרד לריבית", "לא, רק במימון", "רק אם היא קטנה", "רק ב-OCI"], answer: 0, why: "התקן דורש גילוי נפרד, לא שורה מסוימת." },
    ]),
  },
  "emp-roll-template": {
    lead: "תנועה בהתחייבות: שתי מדידות, ארבע שורות שמסבירות, ואחת שמאזנת.",
    body: (
      <>
        <SolveTemplate
          seek={["התנועה של השנה: פתיחה, עלות שירות שוטף, ריבית, תשלומים, סגירה — והמדידה מחדש שמאזנת."]}
          check={[
            "מה הפתיחה? אם לא נתונה — מודדים אותה בהנחות של 31.12 הקודם. עובד שהתחיל השנה: אין פתיחה ואין ריבית.",
            "עלות שירות שוטף: יחידת הזכאות של השנה, בשיעור של תחילת השנה, מהוונת מסוף השנה עד התשלום.",
            "ריבית: על הפתיחה, בשיעור שבו נמדדה, פחות הריבית על תשלומים מיום ששולמו (סעיף 123).",
            "הסגירה: בהנחות של סוף השנה — השיעור, מועד הפרישה (וממנו השכר הצפוי).",
            "מדידה מחדש = הסגירה פחות כל השאר. עלייה בהתחייבות = הפסד, ל-OCI.",
          ]}
          build={[
            { title: "① הפתיחה", lines: [<L key="f">{FORMULA.measure}</L>, "בהנחות של תחילת השנה."] },
            { title: "② עלות שירות שוטף", lines: [<L key="f">{FORMULA.service}</L>] },
            { title: "③ ריבית", lines: [<L key="f">{FORMULA.interestCost}</L>, "פחות הריבית על תשלומים מיום ששולמו."] },
            { title: "④ הסגירה", lines: ["אותה נוסחה, בהנחות של סוף השנה."] },
            { title: "⑤ המדידה מחדש", lines: [<L key="f">{FORMULA.pnDB}</L>] },
          ]}
        />
      </>
    ),
    check: quiz("emp-roll-template", [
      { q: "העובד התחיל לעבוד השנה. כמה ריבית בשנה הראשונה?", options: ["אפס — אין פתיחה", "הסגירה × השיעור", "עלות השירות × השיעור", "חצי מהשיעור"], answer: 0, why: "ריבית היא על הפתיחה, ובשנה הראשונה היא אפס." },
      { q: "ב-31.12 השתנה רק מועד הפרישה. איפה רואים את זה?", options: ["בסגירה, ומשם במדידה מחדש", "בעלות השירות של השנה", "בריבית", "בפתיחה"], answer: 0, why: "שירות וריבית לפי ההנחות של תחילת השנה." },
    ]),
  },
  "emp-roll-solved": {
    lead: "שנה ראשונה: אין פתיחה ואין ריבית. שנה שנייה: כל השורות.",
    body: (
      <>
        <Story icon={<Landmark />} title={`סמנכ״ל כספים, משנת ${CF.from}`}>
          <p>
            בפרישה יקבל {pct(CF.share)} מהשכר השנתי האחרון לכל שנת עבודה. השכר ב-{CF.from}: <Money v={CF.salary} />, עולה {pct(CF.growth)} בשנה. הפרישה ב-31.12.{CF.retire}.
          </p>
          <p>
            הריבית: {pct(CF.rateStart)} בתחילת {CF.from}, {pct(CF.rateEnd1)} בסופה.
          </p>
        </Story>
        <Timeline
          label={`הקריירה: מ-${CF.from} עד הפרישה ב-${CF.retire}; הריבית ירדה בסוף ${CF.from}`}
          from={CF.from}
          to={CF.retire + 1}
          ticks={[
            { at: CF.from, label: `1.1.${CF.from}` },
            { at: CF.from + 1, label: `31.12.${CF.from}` },
            { at: CF.from + 2, label: `31.12.${CF.from + 1}` },
            { at: CF.retire + 1, label: `31.12.${CF.retire}: פרישה` },
          ]}
          spans={[{ from: CF.from + 1, to: CF.retire + 1, label: ltrFormulas(`④ n = ${n1} מסוף השנה הראשונה`), tone: 4 }]}
          marks={[
            { at: CF.from, label: `⑤ ${pct(CF.rateStart)}`, tone: 5 },
            { at: CF.from + 1, label: `⑤ ${pct(CF.rateEnd1)}`, tone: 5 },
          ]}
        />
        <Work w={work.nYear(CF.retire, CF.from)} />
        <P>① הצבירה לשנה:</P>
        <Work w={work.perYearGrown(CF.share, CF.salary, CF.growth, n1)} />
        <RollForward
          title={`סמנכ״ל כספים, ${CF.from}`}
          rows={[
            { label: "יתרת פתיחה", value: 0, kind: "balance", how: "אין: שנה ראשונה" },
            { label: "עלות ריבית", value: 0, how: "אין על מה" },
            { label: "עלות שירות", value: Y1.service, how: <Work w={work.service(CF_PER_YEAR, CF.rateStart, n1)} /> },
            { label: "P.N., הפסד", value: Y1_PN, kind: "pn", how: <>הריבית ירדה:<Work w={work.pnDB({ opening: 0, interest: 0, service: Y1.service, closing: Y1.closing })} /></> },
            { label: "יתרת סגירה", value: Y1.closing, kind: "balance", how: <Work w={work.measure({ perYear: CF_PER_YEAR, years: 1, heads: 1, n: n1, i: CF.rateEnd1 })} /> },
          ]}
        />
        <RollForward
          title={`סמנכ״ל כספים, ${CF.from + 1}: שום הנחה לא השתנתה`}
          rows={[
            { label: "יתרת פתיחה", value: Y1.closing, kind: "balance" },
            { label: "עלות ריבית", value: Y2.interest, how: <Work w={work.interestCost(Y1.closing, CF.rateEnd1)} /> },
            { label: "עלות שירות", value: Y2.service, how: <Work w={work.service(CF_PER_YEAR, CF.rateEnd1, n1 - 1)} /> },
            { label: "P.N.", value: Y2.pn, kind: "pn", how: <>הכול הוסבר:<Work w={work.pnDB({ opening: Y1.closing, interest: Y2.interest, service: Y2.service, closing: Y2.closing })} /></> },
            { label: "יתרת סגירה", value: Y2.closing, kind: "balance", how: <Work w={work.measure({ perYear: CF_PER_YEAR, years: 2, heads: 1, n: n1 - 1, i: CF.rateEnd1 })} /> },
          ]}
        />
        <Part title={`ואם בסוף ${CF.from + 1} ההנחות השתנו?`}>
          <P>
            הפרישה נדחית ל-31.12.{CHANGED.retire} (עוד שנה של עליית שכר), והריבית יורדת ל-{pct(CHANGED.rateEnd)}. ריבית ושירות לא זזים: הם לפי תחילת השנה.
          </P>
          <P>עוד שנה של עליית שכר מגדילה את ①:</P>
          <Work w={work.perYearGrown(CF.share, CF.salary, CF.growth, CHANGED.retire - CF.from)} />
          <P>רק הסגירה זזה:</P>
          <Work w={work.measure({ perYear: CHANGED_PER_YEAR, years: 2, heads: 1, n: CHANGED.retire - CF.from - 1, i: CHANGED.rateEnd })} />
          <P>וה-P.N., הפסד ל-OCI:</P>
          <Work w={work.pnDB({ opening: Y1.closing, interest: Y2.interest, service: Y2.service, closing: CHANGED_CLOSING })} />
        </Part>
      </>
    ),
  },
  "emp-roll-together": {
    lead: "כשמשתנה רק הנחה של סוף השנה, משתנה רק הסגירה, וכל ההפרש עובר ל-P.N.",
    body: (
      <>
        <WrongRight
          label="הטעות: לחשב מחדש גם ריבית ושירות בריבית החדשה. הנכון: רק הסגירה זזה, וההפרש הולך ל-P.N."
          wrong={
            <p>
              הריבית ירדה בסוף השנה, אז מחשבים מחדש <Diff>גם את הריבית ואת השירות</Diff> בריבית החדשה.
            </p>
          }
          right={
            <p>
              ריבית ושירות נשארים לפי תחילת השנה. <Diff>רק הסגירה</Diff> נמדדת בריבית החדשה, וההפרש הולך ל-P.N.
            </p>
          }
        />
        <Part title="רק הריבית יורדת">
          <HintLadder
            task={
              <>
                אותו סמנכ״ל, {CF.from + 1}: כל ההנחות כמו קודם, רק הריבית בסוף השנה יורדת ל-{pct(CHANGED.rateEnd)}. מה ה-P.N.?
              </>
            }
            hints={[
              "אילו שורות תלויות בריבית של סוף השנה?",
              <>
                רק הסגירה. פתיחה, ריבית ושירות לא זזים, וה-P.N. יוצא מהמעגל:
                <span className="block">
                  <L>{FORMULA.pnDB}</L>
                </span>
              </>,
              <>
                סגירה:
                <Work w={work.measure({ perYear: CF_PER_YEAR, years: 2, heads: 1, n: n1 - 1, i: CHANGED.rateEnd })} />
              </>,
              <>
                <Work w={work.measure({ perYear: CF_PER_YEAR, years: 2, heads: 1, n: n1 - 1, i: CHANGED.rateEnd })} />
                <Work w={work.pnDB({ opening: Y1.closing, interest: Y2.interest, service: Y2.service, closing: RATE_ONLY_CLOSING })} />
                הפסד (בלי עיגולי ביניים). ואם הריבית הייתה עולה? החוב היה קטן, וה-P.N. רווח.
              </>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-roll-drill": {
    lead: "שנה חדשה, הנחות חדשות, מספרים חדשים — אותה תבנית.",
    body: (
      <>
        <P>״תנועה בהתחייבות״: עובד בשנתו השנייה, ובסוף השנה משתנים השיעור ולפעמים גם מועד הפרישה. ״ריבית עם תשלום״: מענק שמשולם באמצע השנה. פתרו, בדקו, ורק אז פתחו את הפתרון.</P>
        <DrillBox families={["year", "payint"]} />
      </>
    ),
  },
  "emp-roll-master": {
    lead: "פתיחה, ריבית, שירות, תשלומים, P.N. וסגירה: הצורה של כל פתרון מכאן.",
    body: (
      <>
        <ExplainTask
          task="ציירו מהזיכרון מעגל עם שש השורות, וכתבו ליד כל שורה באיזו ריבית היא מחושבת."
          model={
            <>
              פתיחה (הריבית של סוף השנה הקודמת) · ריבית (תחילת השנה, על הפתיחה) · שירות (תחילת השנה, n מסוף השנה) · תשלומים (בפועל) · P.N. (מאזן, ל-OCI) · סגירה (סוף השנה).
              <span className="mt-2 block">
                <Routing
                  label="שורות המעגל ולאן כל אחת הולכת: ריבית ושירות לרווח והפסד, P.N. ל-OCI, הסגירה למאזן"
                  rows={[
                    { label: "עלות ריבית: תחילת השנה × הפתיחה", to: "pl" },
                    { label: "עלות שירות: תחילת השנה, n מסוף השנה", to: "pl" },
                    { label: "P.N.: מה שנשאר", to: "oci" },
                    { label: "סגירה: ריבית סוף השנה", to: "bs" },
                  ]}
                />
              </span>
            </>
          }
        />
        <Bridge summary="המעגל: פתיחה, ריבית, שירות, תשלומים, P.N. וסגירה. ריבית ושירות לפי תחילת השנה, הסגירה לפי סופה.">
          מה קורה כשהחברה משפרת את התנאים ב-30 ביוני, וחצי שנה עובדים לפי תנאים אחרים? זה החלק השני של השיעור.
        </Bridge>
      </>
    ),
    check: quiz("emp-roll-master", [
      { q: "פתיחה 2,000; ריבית תחילת השנה 5%; שירות 400; תשלומים 300; סגירה 2,300. מה ה-P.N.?", options: ["100, הפסד", "100, רווח", "0", "200"], answer: 0, why: `${said(work.interestCost(2_000, 0.05))}\n${said(work.pnDB({ opening: 2_000, interest: 100, service: 400, payments: 300, closing: 2_300 }))}\nהחוב גדל ב-100 יותר מהצפוי: הפסד.` },
      { q: "ריבית: באיזה שיעור?", options: ["תחילת השנה", "סוף השנה"], answer: 0, why: "ריבית ושירות לפי תחילת השנה." },
      { q: "לאן הולך ה-P.N.?", options: ["ל-OCI", "לרווח והפסד"], answer: 0, why: "מדידה מחדש של הטבה מוגדרת: OCI (סעיף 57(ד))." },
      { q: "למה ירידת ריבית בסוף השנה לא משנה את עלות השירות של אותה שנה?", options: ["כי השירות נמדד לפי תחילת השנה, והשינוי נתפס ב-P.N.", "כי השירות לא מהוון", "כי היא משנה, רק מעט", "כי השירות נמדד בשנה הבאה"], answer: 0, why: "זה התפקיד של ה-P.N." },
      { q: "שנה בלי שינוי הנחות ובלי תשלומים חריגים: כמה P.N.?", options: ["אפס", "הריבית", "השירות", "תלוי"], answer: 0, why: "הכול מוסבר בשורות הרגילות." },
    ]),
  },
};
