import { Dumbbell, Landmark, PiggyBank, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import {
  BACK,
  BACK_A,
  BACK_ACCRUED,
  BACK_OBLIGATION,
  BACK_PATH,
  BACK_WRONG,
  BACK_WRONG_OBLIGATION,
  CAPPED,
  CAPPED_PATH,
  FRONT,
  FRONT_ACCRUED,
  FRONT_OBLIGATION,
  FRONT_PATH,
  FRONT_WRONG,
  FRONT_WRONG_OBLIGATION,
  GYM_PATH,
  LATE,
  LATE_ROWS,
  LATE_TOTAL,
} from "@/lib/study/ias19/lessons/attribute";
import { GROUP, GROUP_OPENING, groupStep, VP, VP_ACCRUED, VP_LATER, VP_LATER_OBLIGATION, VP_LATER_PER_YEAR, VP_OBLIGATION, VP_PER_YEAR } from "@/lib/study/ias19/lessons/measure";
import { CF, CF_PER_YEAR, CHANGED, CHANGED_CLOSING, CHANGED_PER_YEAR, CHANGED_PN, RATE_ONLY_CLOSING, RATE_ONLY_PN, Y1, Y1_PN, Y2 } from "@/lib/study/ias19/lessons/rollforward";
import { lessonRef, pct } from "@/lib/study/ias19/shared";
import { FormulaFill, Ltr, type Term } from "./ias19-formula";
import { Bridge, ExplainTask, HintLadder, Ladder, MapBranch, Recipe5, RollForward, T19, TwoBuckets } from "./ias19-ui";
import { BankStatement, Diff, PeopleGrid, Routing, Timeline, WrongRight, YearBars } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { RollSchedule } from "./roll-schedule";
import { Money, Rule } from "./ui";
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
        <Story icon={<Landmark />} title="5% מהמשכורת האחרונה, על כל שנה">
          <p>מבטיחים לכם: ביום הפרישה תקבלו 5% מהמשכורת האחרונה, על כל שנת עבודה. כמה זה שווה היום?</p>
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
          להטבה מוגדרת שלוש מדרגות: מדידה ביום אחד (כאן), חלוקה לשנות העבודה ({lessonRef("ias19-attribute")}), ותנועה לאורך שנה ({lessonRef("ias19-rollforward")}).
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
        {servedVsN(7, 13, "המלכודת הגדולה: ② סופר אחורה, ④ סופר קדימה")}
        <Remember>② סופר את השנים שכבר עבדו. ④ סופר את השנים שנשארו עד התשלום. לא מחליפים ביניהם.</Remember>
      </>
    ),
    check: quiz("emp-measure-recipe", [
      { q: "באיזה צעד נכנס הסיכוי להגיע לפרישה?", options: ["③", "①", "②", "④"], answer: 0, why: "③ = עובדים × הסיכוי." },
      { q: "באיזה צעד נכנס השכר הצפוי?", options: ["①", "②", "④", "⑤"], answer: 0, why: "① היא ההטבה לשנה, בשכר הצפוי בפרישה." },
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
            per: { ...SYMBOLS.per, value: <M v={VP_PER_YEAR} />, from: <>{pct(VP.share)} × <Money v={VP.salary} plain /> × <L>{1 + VP.growth}^{VP.yearsToRetire}</L></> },
            years: { ...SYMBOLS.years, value: VP.served, from: <>עבדה {VP.served} שנים</> },
            heads: { ...SYMBOLS.heads, value: 1, from: "עובדת אחת, תגיע לפרישה" },
            n: { ...SYMBOLS.n, value: VP.yearsToRetire, from: <>הפרישה בעוד {VP.yearsToRetire} שנים</> },
            i: { ...SYMBOLS.i, value: pct(VP.rate), from: <>הקונצרנית {pct(VP.rate)}</> },
          }}
          top={TOP}
          bottom={BOTTOM}
          working={[
            <>
              מונה: <L><M v={VP_PER_YEAR} /> × {VP.served} × 1 = <M v={VP_ACCRUED} /></L> (מה שנצבר).
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
              "① (עוד שנתיים של עליית שכר), ④ (n) ו-⑤ (הריבית). ② ו-③ לא זזים.",
              <>
                ① = {pct(VP.share)} × <Money v={VP.salary} plain /> × <L>{1 + VP.growth}^{VP_LATER.yearsToRetire}</L> = <M v={VP_LATER_PER_YEAR} />
              </>,
              <>
                <M v={VP_LATER_PER_YEAR} /> × {VP.served} ÷ <L>{1 + VP_LATER.rate}^{VP_LATER.yearsToRetire}</L> = <strong><M v={VP_LATER_OBLIGATION} /></strong>
              </>,
            ]}
          />
        </Part>
        <Part title="ב. קבוצה של עובדים">
          <PeopleGrid total={GROUP.opening.staff} leaving={GROUP.opening.staff - g.heads} title={`${GROUP.opening.staff} עובדים, ${pct(GROUP.opening.stay)} צפויים לקבל`} />
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
              ltrFormulas(`שאלות ② ו-③: שנתיים, ו-${GROUP.opening.staff} × ${pct(GROUP.opening.stay)}.`),
              <>
                ① <L>{pct(GROUP.opening.share)} × <Money v={GROUP.opening.finalSalary} plain /> = <Money v={g.perYear} plain /></L>; ② {g.years}; ③ {g.heads}; ④ {g.n}; ⑤ {pct(g.i)} (לא הממשלתית).
              </>,
              <>
                <Money v={g.perYear} plain /> × {g.years} × {g.heads} ÷ <L>{1 + g.i}^{g.n}</L> = <strong><M v={GROUP_OPENING} /></strong>
              </>,
            ]}
          />
        </Part>
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
        <Bridge summary={<><L>החוב = הטבה לשנה × שנות עבודה × עובדים צפויים ÷ (1+i)ⁿ</L>.</>}>מה קורה כשההטבה לא שווה בכל שנה, כשיש תקרה, או כשהזכאות מתחילה רק משנה מסוימת? {lessonRef("ias19-attribute")}.</Bridge>
      </>
    ),
    check: quiz("emp-measure-master", [
      { q: "כמה שווים היום 2,000 ₪ שישולמו בעוד 8 שנים, בריבית 4%?", options: ["1,461 ₪", "1,385 ₪", "1,600 ₪", "2,737 ₪"], answer: 0, why: "2,000 ÷ 1.04⁸ = 1,461 ₪." },
      { q: "שכר היום 24,000 ₪, עולה 2% בשנה, פרישה בעוד 5 שנים, הטבה 5% לשנה. מה ①?", options: ["1,325 ₪", "1,200 ₪", "6,000 ₪", "1,087 ₪"], answer: 0, why: "5% × 24,000 × 1.02⁵ = 1,325 ₪." },
      { q: "ממשלתיות 4.8%, קונצרניות 6.2%. באיזו משתמשים?", options: ["6.2%, כי השוק בישראל עמוק", "4.8%, כי היא בטוחה יותר", "5.5%", "תלוי במשך"], answer: 0, why: "סעיף 83." },
      { q: "עובד עבד 4 שנים וצפוי לעבוד עוד 10. מה n?", options: ["10", "4", "14", "6"], answer: 0, why: "השנים עד התשלום." },
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
        <MapBranch lesson="ias19-attribute">
          {lessonRef("ias19-measure")} נתן את הנוסחה. כאן משלימים את שאלות ① ו-②: מהי ״ההטבה לשנה״, ואילו שנים נספרות.
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
      { q: "הטבה של 2,000 ₪ לכל אחת מ-5 השנים הראשונות, ו-500 ₪ לכל שנה אחריהן. איך משייכים?", options: ["לפי נוסחת התוכנית", "בקו ישר", "רק את השנים הראשונות", "שווה בשווה בין המדרגות"], answer: 0, why: "המאוחרות נותנות פחות, ואין סיבה לקו ישר." },
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
        <Remember>ובכל מקרה, ההיוון (④) הוא על השנים עד התשלום, לא על חלון הצבירה.</Remember>
      </>
    ),
    check: quiz("emp-attr-cap", [
      { q: "הטבה של 2,500 ₪ לכל שנה, עד תקרה של 10,000. אחרי 2 שנים, כמה נצבר?", options: ["5,000, והחלון 4 שנים", "10,000", "2,500", "5,000, והחלון כל שנות העבודה"], answer: 0, why: "החלון נגמר ב-4 שנים; עד אז 2,500 לשנה." },
      { q: "העובדת התחילה בגיל 26, והזכאות מגיל 35. היום היא בת 31. כמה שנים נספרות?", options: ["0", "5", "9", "4"], answer: 0, why: "עד גיל 35 העבודה לא מקנה זכאות." },
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
            { q: "מאיזה רגע העבודה מקנה זכאות?", yes: "סופרים רק משם." },
          ]}
        />
        <Rule>
          אחרי שלוש השאלות חוזרים לנוסחה: <span dir="ltr">① × ② × ③ ÷ (1+i)ⁿ</span>.
        </Rule>
      </>
    ),
    check: quiz("emp-attr-rule", [
      { q: "ההטבה משולמת בגיל 66, וצוברים אותה על 12 שנים מגיל 42. בגיל 48, מה n?", options: ["18", "6", "12", "24"], answer: 0, why: "מגיל 48 עד התשלום בגיל 66." },
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
              קו ישר (אסור כאן) היה נותן <L><Money v={FRONT.cap} plain /> ÷ {FRONT.expected} × {FRONT.served} = <Money v={FRONT_WRONG} plain /></L>, ומהוון <M v={FRONT_WRONG_OBLIGATION} />: נמוך מדי.
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
              "שאלה (א): הרבה יותר. קו ישר על כל שנות הצבירה.",
              <>
                הטבה כוללת: <L>{BACK.early.upTo} × <Money v={BACK.early.perYear} plain /> + {BACK.expected - BACK.early.upTo} × <Money v={BACK.later} plain /> = <Money v={BACK_A.total} plain /></L>;{" "}
                <L><Money v={BACK_A.total} plain /> ÷ {BACK.expected} = <M v={BACK_A.perYear!} /></L> לשנה.
              </>,
              <>
                <L><M v={BACK_A.perYear!} /> × {BACK.served} = <M v={BACK_ACCRUED} /></L>; <L><M v={BACK_ACCRUED} /> ÷ {1 + BACK.rate}^{BACK.n} = <strong><M v={BACK_OBLIGATION} /></strong></L>. הנוסחה (אסורה כאן) הייתה נותנת <Money v={BACK_WRONG} plain /> ו-<M v={BACK_WRONG_OBLIGATION} />.
              </>,
            ]}
          />
        </Part>
        <Part title={`ב. זכאות מגיל ${LATE.countsFrom}`}>
          <p className="text-[14.5px]">
            מענק של <Money v={LATE.grant} /> בפרישה בגיל {LATE.retire}. העבודה מקנה זכאות רק מגיל {LATE.countsFrom}. ריבית {pct(LATE.rate)}.
          </p>
          <Timeline
            label={`שלושה עובדים: כל אחד צובר מהמאוחר מבין גיל ההתחלה שלו לגיל ${LATE.countsFrom}, ועד הפרישה בגיל ${LATE.retire}`}
            title="מאיזה גיל כל אחד צובר"
            from={30}
            to={LATE.retire}
            ticks={[
              { at: 30, label: "30" },
              { at: LATE.countsFrom, label: `${LATE.countsFrom}: הזכאות` },
              { at: LATE.retire, label: `${LATE.retire}: פרישה` },
            ]}
            spans={LATE.people.map((p, k) => ({ from: LATE_ROWS[k].from, to: LATE.retire, label: `עובד ${p.id}: מגיל ${LATE_ROWS[k].from}`, tone: 2 as const, row: k }))}
            marks={LATE.people.map((p) => ({ at: p.age, label: `${p.id} היום` }))}
          />
          <HintLadder
            task="שלושה עובדים. מה החוב לכל אחד, ובסך הכול?"
            hints={[
              "לכל עובד: מאיזה גיל הוא צובר, ועל כמה שנים נפרש המענק?",
              `שאלה (ג): הצבירה מהמאוחר מבין גיל ההתחלה לגיל ${LATE.countsFrom}, ועד הפרישה.`,
              <>
                עובד א׳: צובר מגיל {LATE_ROWS[0].from}, על {LATE_ROWS[0].window} שנים: <Money v={LATE_ROWS[0].perYear} /> לשנה.
              </>,
              <DataTable
                key="t"
                head={["עובד", "צובר מגיל", "לשנה", "נספרו", "n", "סיכוי", "חוב"]}
                rows={LATE.people.map((p, k) => [p.id, LATE_ROWS[k].from, LATE_ROWS[k].perYear, LATE_ROWS[k].served, LATE_ROWS[k].n, pct(p.stay), Math.round(LATE_ROWS[k].obligation)])}
                foot={["סה״כ", "", "", "", "", "", Math.round(LATE_TOTAL)]}
              />,
            ]}
          />
        </Part>
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
      { q: "הטבה של 1,500 ₪ לשנה, עד תקרה של 6,000. אחרי 3 שנים: כמה נצבר, ומה החלון?", options: ["4,500; ארבע שנים", "6,000; שלוש שנים", "4,500; כל שנות העבודה", "1,500; שנה אחת"], answer: 0, why: "מגיעים לתקרה בשנה הרביעית." },
      { q: "הטבה של 1,000 ₪ ל-5 השנים הראשונות, 5,000 ₪ לכל שנה אחריהן. איזו שיטה?", options: ["קו ישר", "נוסחת התוכנית"], answer: 0, why: "סעיף 73." },
      { q: "התחיל בגיל 28, זכאות מגיל 35, היום בן 33. כמה שנים נספרות?", options: ["0", "5", "7", "2"], answer: 0, why: "הזכאות עוד לא התחילה." },
      { q: "משולם בגיל 67, נצבר על 12 שנים מגיל 50. בגיל 55, מה n?", options: ["12", "5", "7", "17"], answer: 0, why: "מגיל 55 עד 67." },
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
            בחוב לעובדים יש להפתעה שם: <T19 he="מדידה מחדש" par="57(d)" />, ובקורס P.N., המספר המאזן.
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
      { q: "פתיחה 4,000; ריבית תחילת השנה 5%; שירות 600; סגירה 4,950. מה ה-P.N.?", options: ["150, הפסד", "150, רווח", "350", "0"], answer: 0, why: "4,950 − 4,000 − 200 − 600 = 150: החוב גדל יותר מהצפוי." },
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
        <P>למה ירידת ריבית לא משנה את עלות השירות של אותה שנה? השירות נמדד לפי תחילת השנה, וכל השינוי נתפס ב-P.N.</P>
      </>
    ),
    check: quiz("emp-roll-rates", [
      { q: "באיזה שיעור מחשבים ריבית: תחילת השנה או סופה?", options: ["תחילת השנה", "סוף השנה", "ממוצע", "תלוי בשאלה"], answer: 0, why: "ריבית ושירות: תחילת השנה." },
      { q: "סגירה ב-31.12.2025, פרישה ב-31.12.2030. מה n של עלות השירות של 2025?", options: ["5", "6", "4", "1"], answer: 0, why: "מסוף 2025 עד סוף 2030." },
    ]),
  },
  "emp-roll-rule": {
    lead: "P.N. = סגירה − פתיחה − ריבית − שירות + תשלומים. ולכל שורה, המקום שלה בדוחות.",
    body: (
      <>
        <Rule><L>פתיחה + ריבית + עלות שירות − תשלומים + P.N. = סגירה</L>. ולכן <L>P.N. = סגירה − פתיחה − ריבית − שירות + תשלומים</L>.</Rule>
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
        <P>
          ① הצבירה לשנה: {pct(CF.share)} × <Money v={CF.salary} plain /> × <L>{1 + CF.growth}^{n1}</L> = <strong><M v={CF_PER_YEAR} /></strong>.
        </P>
        <RollForward
          title={`סמנכ״ל כספים, ${CF.from}`}
          rows={[
            { label: "יתרת פתיחה", value: 0, kind: "balance", how: "אין: שנה ראשונה" },
            { label: "עלות ריבית", value: 0, how: "אין על מה" },
            { label: "עלות שירות", value: Y1.service, how: ltrFormulas(`${pct(CF.rateStart)}, n = ${n1}`) },
            { label: "P.N., הפסד", value: Y1_PN, kind: "pn", how: "הריבית ירדה" },
            { label: "יתרת סגירה", value: Y1.closing, kind: "balance", how: ltrFormulas(`${pct(CF.rateEnd1)}, n = ${n1}`) },
          ]}
        />
        <RollForward
          title={`סמנכ״ל כספים, ${CF.from + 1}: שום הנחה לא השתנתה`}
          rows={[
            { label: "יתרת פתיחה", value: Y1.closing, kind: "balance" },
            { label: "עלות ריבית", value: Y2.interest, how: ltrFormulas(`${pct(CF.rateEnd1)} × הפתיחה`) },
            { label: "עלות שירות", value: Y2.service, how: ltrFormulas(`${pct(CF.rateEnd1)}, n = ${n1 - 1}`) },
            { label: "P.N.", value: Y2.pn, kind: "pn", how: "הכול הוסבר: אפס" },
            { label: "יתרת סגירה", value: Y2.closing, kind: "balance", how: ltrFormulas(`2 שנים, ${pct(CF.rateEnd1)}, n = ${n1 - 1}`) },
          ]}
        />
        <Part title={`ואם בסוף ${CF.from + 1} ההנחות השתנו?`}>
          <P>
            הפרישה נדחית ל-31.12.{CHANGED.retire} (עוד שנה של עליית שכר), והריבית יורדת ל-{pct(CHANGED.rateEnd)}. ריבית ושירות לא זזים: הם לפי תחילת השנה.
          </P>
          <P>
            רק הסגירה: 2 × <M v={CHANGED_PER_YEAR} /> ÷ <L>{1 + CHANGED.rateEnd}^{CHANGED.retire - CF.from - 1}</L> = <M v={CHANGED_CLOSING} />.
          </P>
          <P>
            <L>P.N. = <M v={CHANGED_CLOSING} /> − <M v={Y2.closing} /> = <strong><M v={CHANGED_PN} /></strong></L> הפסד, ל-OCI.
          </P>
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
              "רק הסגירה. פתיחה, ריבית ושירות לא זזים.",
              <>
                סגירה: 2 × <M v={CF_PER_YEAR} /> ÷ <L>{1 + CHANGED.rateEnd}^{n1 - 1}</L> = <M v={RATE_ONLY_CLOSING} />
              </>,
              <>
                <L>P.N. = <M v={RATE_ONLY_CLOSING} /> − <M v={Y2.closing} /> = <strong><M v={RATE_ONLY_PN} /></strong></L> הפסד (בלי עיגולי ביניים). ואם הריבית הייתה עולה? החוב היה קטן, וה-P.N. רווח.
              </>,
            ]}
          />
        </Part>
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
          מה קורה כשהחברה משפרת את התנאים ב-30 ביוני, וחצי שנה עובדים לפי תנאים אחרים? {lessonRef("ias19-amend")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-roll-master", [
      { q: "פתיחה 2,000; ריבית תחילת השנה 5%; שירות 400; תשלומים 300; סגירה 2,300. מה ה-P.N.?", options: ["100, הפסד", "100, רווח", "0", "200"], answer: 0, why: "צפוי: 2,000 + 100 + 400 − 300 = 2,200. בפועל 2,300: החוב גדל ב-100 יותר מהצפוי, הפסד." },
      { q: "ריבית: באיזה שיעור?", options: ["תחילת השנה", "סוף השנה"], answer: 0, why: "ריבית ושירות לפי תחילת השנה." },
      { q: "לאן הולך ה-P.N.?", options: ["ל-OCI", "לרווח והפסד"], answer: 0, why: "מדידה מחדש של הטבה מוגדרת: OCI (סעיף 57(ד))." },
      { q: "למה ירידת ריבית בסוף השנה לא משנה את עלות השירות של אותה שנה?", options: ["כי השירות נמדד לפי תחילת השנה, והשינוי נתפס ב-P.N.", "כי השירות לא מהוון", "כי היא משנה, רק מעט", "כי השירות נמדד בשנה הבאה"], answer: 0, why: "זה התפקיד של ה-P.N." },
      { q: "שנה בלי שינוי הנחות ובלי תשלומים חריגים: כמה P.N.?", options: ["אפס", "הריבית", "השירות", "תלוי"], answer: 0, why: "הכול מוסבר בשורות הרגילות." },
    ]),
  },
};
