import { Dumbbell, Landmark, PiggyBank, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { BACK, BACK_A, BACK_ACCRUED, BACK_OBLIGATION, BACK_WRONG, BACK_WRONG_OBLIGATION, DUAL, DUAL_ROWS, DUAL_TOTAL, FRONT, FRONT_ACCRUED, FRONT_OBLIGATION, FRONT_WRONG, FRONT_WRONG_OBLIGATION } from "@/lib/study/ias19/lessons/attribute";
import { GROUP, GROUP_OPENING, groupStep, VP, VP_ACCRUED, VP_LATER, VP_LATER_OBLIGATION, VP_LATER_PER_YEAR, VP_OBLIGATION, VP_PER_YEAR } from "@/lib/study/ias19/lessons/measure";
import { CF, CF_PER_YEAR, CHANGED, CHANGED_CLOSING, CHANGED_PER_YEAR, CHANGED_PN, RATE_ONLY_CLOSING, RATE_ONLY_PN, Y1, Y1_PN, Y2 } from "@/lib/study/ias19/lessons/rollforward";
import { lessonRef, pct } from "@/lib/study/ias19/shared";
import { DrillBox, PucExplorer, SolveTemplate, WindowExplorer } from "./ias19-interactive";
import { Bridge, ExplainTask, HintLadder, MapBranch, Recipe5, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Sorted, Story } from "./inventory-teach";
import { Card, KeyCard, Money, Rule, Stepper, Wide } from "./ui";

/** The employee-benefits course, lessons 5–7: measuring at one date, attribution to years of service, and a year's roll-forward. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const g = groupStep(GROUP.opening);
const n1 = CF.retire - CF.from;

export const IAS19_DB_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 5: measuring at one date.
  "emp-measure-hook": {
    lead: "כדי לדעת כמה שווה היום הבטחה לפרישה צריך שלושה ניחושים: השכר האחרון, כמה זמן עד התשלום, ובאיזו ריבית להחזיר להיום.",
    body: (
      <>
        <Story icon={<Landmark />} title="6% מהמשכורת האחרונה, על כל שנה">
          <p>מבטיחים לכם: ביום הפרישה תקבלו 6% מהמשכורת האחרונה שלכם על כל שנת עבודה. כמה זה שווה היום?</p>
          <p>כדי לענות צריך לנחש שלושה דברים: מה תהיה המשכורת האחרונה, כמה שנים נשארו עד התשלום, ואיזו ריבית להשתמש בה כדי להחזיר את הסכום להיום.</p>
        </Story>
        <MapBranch lesson="ias19-measure">
          ענף ההטבה המוגדרת בנוי משלוש מדרגות: מדידה בנקודת זמן אחת (השיעור הזה), חלוקה של ההטבה לשנות השירות ({lessonRef("ias19-attribute")}), ותנועה של ההתחייבות לאורך שנה ({lessonRef("ias19-rollforward")}).
        </MapBranch>
      </>
    ),
  },
  "emp-measure-puc": {
    lead: "כל שנת שירות מקנה ״יחידה״ של הטבה, לפי השכר הצפוי בפרישה — ואת מה שנצבר מחזירים להיום.",
    body: (
      <>
        <P>
          <T19 he="שיטת יחידת הזכאות הצפויה" en="Projected Unit Credit" par="68" />: כל שנת שירות מקנה יחידה אחת של ההטבה. את היחידה מחשבים לפי השכר <strong>הצפוי בפרישה</strong>, לא לפי השכר
          של היום. סופרים כמה יחידות נצברו עד תאריך המדידה, מכפילים במספר העובדים שצפויים לקבל — ומחזירים להיום.
        </P>
        <P>
          כל התשלומים מהוונים (<span dir="ltr">IAS 19.69</span>), כי הכסף ישולם רק בעתיד.
        </P>
      </>
    ),
    check: quiz("emp-measure-puc", [
      { q: "לפי איזה שכר מחשבים את היחידה?", options: ["השכר הצפוי בפרישה", "השכר של היום", "השכר הממוצע בשנות העבודה", "השכר בשנה הראשונה"], answer: 0, why: "ההבטחה היא על השכר האחרון — לכן מצפים אותו." },
      { q: "עובד צבר 3 יחידות מתוך 10 שיצבור. כמה מההטבה נכנס להתחייבות היום, לפני היוון?", options: ["3 יחידות", "10 יחידות", "7 יחידות", "כלום עד הפרישה"], answer: 0, why: "רק מה שנצבר עד תאריך המדידה." },
    ]),
  },
  "emp-measure-explore": {
    lead: "ההתחייבות היא רק היחידות שכבר נצברו, בשכר של יום הפרישה — מוחזרות להיום.",
    body: (
      <>
        <PucExplorer salary={VP.salary} share={VP.share} defaults={{ served: VP.served, left: VP.yearsToRetire, growth: VP.growth, rate: VP.rate }} />
      </>
    ),
    check: quiz("emp-measure-explore", [
      { q: "שיעור ההיוון עולה. מה קורה להתחייבות?", options: ["יורדת", "עולה", "לא משתנה", "תלוי בשכר"], answer: 0, why: "מחלקים בגורם היוון גדול יותר." },
      { q: "העובד צבר עוד שנת שירות, וכל השאר לא השתנה. מה קורה?", options: ["נוספת יחידה, וההתחייבות עולה", "ההתחייבות לא משתנה עד הפרישה", "היחידה לשנה קטנה", "n גדל"], answer: 0, why: "עוד יחידה נצברה — ו-n קטן בשנה, כך שגם ההיוון קטן." },
    ]),
  },
  "emp-measure-assume": {
    lead: "המדידה נשענת על הנחות: על העובדים עצמם (דמוגרפיות) ועל הכסף (פיננסיות) — בלי הטיה, ותואמות זו לזו.",
    body: (
      <>
        <P>
          כדי לנחש כמה ישולם ומתי, צריך <T19 he="הנחות אקטואריות" en="Actuarial assumptions" par="76" />. התקן ממליץ להסתייע באקטואר מוסמך (<span dir="ltr">IAS 19.59</span>).
        </P>
        <Sorted
          columns={[
            { title: "דמוגרפיות — על העובדים", tone: "neutral", items: ["תמותה", "תחלופת עובדים — מי יעזוב לפני הפרישה", "שיעורי תביעות רפואיות"] },
            { title: "פיננסיות — על הכסף", tone: "neutral", items: ["שיעור ההיוון", "רמות שכר עתידיות", "עלויות רפואיות עתידיות"] },
          ]}
        />
        <Wide className="grid gap-3 sm:grid-cols-2">
          <Card title="בלתי מוטות (סעיף 77)">
            <p>לא שמרניות מדי ולא נועזות מדי. ״ליתר ביטחון״ אינו נימוק.</p>
          </Card>
          <Card title="תואמות זו לזו (סעיף 78)">
            <p>אותה אינפלציה בכל ההנחות של אותה תקופה — בעליית השכר, בעלויות הרפואיות ובשיעור ההיוון. הפיננסיות — לפי ציפיות השוק בסוף התקופה (סעיף 80).</p>
          </Card>
        </Wide>
      </>
    ),
    check: quiz("emp-measure-assume", [
      { q: "״כמה מהעובדים ייפטרו לפני גיל הפרישה״ — איזו הנחה?", options: ["דמוגרפית", "פיננסית"], answer: 0, why: "מאפיין של העובדים — תמותה." },
      { q: "״כמה יעלה השכר בכל שנה״ — איזו הנחה?", options: ["פיננסית", "דמוגרפית"], answer: 0, why: "רמות שכר עתידיות — פיננסית (IAS 19.76(ב))." },
      { q: "בעליית השכר הונחה אינפלציה של 2%, ובעלויות הרפואיות 4%, לאותה תקופה. מה הבעיה?", options: ["ההנחות לא תואמות זו לזו", "אין בעיה", "ההנחות שמרניות מדי", "חסר אקטואר"], answer: 0, why: "IAS 19.78: אותה אינפלציה בכל ההנחות." },
    ]),
  },
  "emp-measure-rate": {
    lead: "מהוונים בתשואת אג״ח קונצרניות איכותיות בתאריך המדידה — לא בממשלתית, ולא בשיעור של תאריך אחר.",
    body: (
      <>
        <P>
          <T19 he="שיעור ההיוון" en="Discount rate" par="83" /> הוא התשואה, בסוף התקופה, על אגרות חוב קונצרניות באיכות גבוהה. רק כשאין לאג״ח כאלה שוק עמוק משתמשים בממשלתיות. בישראל השוק
          עמוק — ולכן כששאלה נותנת גם תשואה ממשלתית, היא בדרך כלל מסיחה.
        </P>
        <Card title="ערך זמן — לא הסיכון של החברה (סעיף 84)">
          <p>השיעור משקף את ערך הזמן של הכסף בלבד. הוא לא כולל את הסיכון האקטוארי, וגם לא את סיכון האשראי של החברה — גם אם האג״ח שלה עצמה נסחרות בתשואה אחרת. המטבע והתקופה של האג״ח צריכים להתאים לאלה של ההתחייבות; כשאין אג״ח לתקופה המתאימה, מתאימים את השיעור.</p>
        </Card>
        <Card title="שאלה עם שלוש עמודות של תאריכים">
          <p>בשאלה אחת יכולים להופיע שיעורים לכמה תאריכים. לכל מדידה — השיעור של התאריך שלה. לפתיחה — של תחילת השנה, לסגירה — של סוף השנה.</p>
        </Card>
      </>
    ),
    check: quiz("emp-measure-rate", [
      { q: "בתאריך המדידה: ממשלתיות 4%, קונצרניות איכותיות 5.5%. באיזה שיעור מהוונים?", options: ["5.5%", "4%", "4.75%", "תלוי בעובד"], answer: 0, why: "IAS 19.83, ובישראל השוק עמוק." },
    ]),
  },
  "emp-measure-recipe": {
    lead: "המתכון: ① × ② × ③ ÷ (1+i) בחזקת n — תמיד באותו סדר.",
    body: (
      <>
        <Recipe5 />
        <Rule>
          מתכון 5 הצעדים: ① הטבה לשנת שירות אחת, בשכר הצפוי בפרישה. ② שנות שירות שנצברו עד תאריך המדידה. ③ עובדים צפויים — מספר העובדים כפול ההסתברות שיקבלו. ④ n — שנים מתאריך המדידה ועד
          התשלום (לא שנות השירות). ⑤ i — התשואה הקונצרנית בתאריך המדידה.
        </Rule>
      </>
    ),
    check: quiz("emp-measure-recipe", [
      { q: "באיזה צעד נכנסת ההסתברות להגיע לפרישה?", options: ["③", "①", "②", "④"], answer: 0, why: "③ = עובדים × הסתברות." },
      { q: "באיזה צעד נכנס השכר הצפוי?", options: ["①", "②", "④", "⑤"], answer: 0, why: "① היא ההטבה לשנה, בשכר הצפוי בפרישה." },
    ]),
  },
  "emp-measure-template": {
    lead: "לפני שמחשבים — עונים על חמש שאלות בדיקה. אז המתכון רץ לבד.",
    body: (
      <>
        <SolveTemplate
          seek={["ההתחייבות בתאריך המדידה: הערך הנוכחי של היחידות שכבר נצברו, בשכר הצפוי בפרישה."]}
          check={[
            "מה הובטח? אחוז מהשכר השנתי, או מספר משכורות חודשיות — לכל שנת עבודה.",
            "באיזה שכר? האחרון — לכן מצפים את השכר של היום עד הפרישה: כמה עליות שכר יש עד אז?",
            "כמה שירות נצבר עד תאריך המדידה — כולל חודשים (מי שהתחיל ביולי צבר חצי שנה)?",
            "כמה שנים מתאריך המדידה עד התשלום? זה n — לא הוותק.",
            "איזה שיעור? הקונצרני באיכות גבוהה, של תאריך המדידה. יש הסתברות להגיע לפרישה? היא מכפילה.",
          ]}
          build={[
            { title: "① השכר בפרישה", lines: ["שכר היום × (1 + עליית שכר) בחזקת מספר העליות."] },
            { title: "② יחידת זכאות", lines: ["האחוז (או המכפלה) × השכר בפרישה — ההטבה לשנת עבודה אחת."] },
            { title: "③ הצבירה", lines: ["יחידה × שנות השירות עד היום (× עובדים × הסתברות)."] },
            { title: "④ היוון", lines: ["הצבירה ÷ (1+i) בחזקת n — וזו ההתחייבות."] },
          ]}
        />
      </>
    ),
    check: quiz("emp-measure-template", [
      { q: "עובד התחיל ב-1.4 לפני שנתיים, והמדידה ב-31.12 השנה. כמה שנות שירות?", options: ["2.75", "2", "3", "2.25"], answer: 0, why: "תשעה חודשים בשנה הראשונה ועוד שנתיים מלאות: 2.75." },
      { q: "השכר בדצמבר נתון, והשכר עולה בכל ינואר. הפרישה בעוד 7 שנים, ב-31.12. כמה עליות?", options: ["7", "6", "8", "אחת"], answer: 0, why: "ינואר של כל אחת משבע השנים הבאות." },
    ]),
  },
  "emp-measure-solved": {
    lead: "חמשת הצעדים, אחד אחד — וההתחייבות יוצאת מהנוסחה.",
    body: (
      <>
        <Story icon={<Landmark />} title="סמנכ״לית התפעול">
          <p>
            בפרישה תקבל {pct(VP.share)} מהשכר השנתי האחרון על כל שנת שירות. השכר היום <Money v={VP.salary} />, ועולה {pct(VP.growth)} בשנה; הפרישה בעוד {VP.yearsToRetire} שנים. ב-{VP.date} עבדה{" "}
            {VP.served} שנים, והתשואה הקונצרנית {pct(VP.rate)}.
          </p>
        </Story>
        <Wide>
          <Stepper
            label="חמשת הצעדים"
            steps={[
              { title: "① הטבה לשנה", body: <p>{pct(VP.share)} × <Money v={VP.salary} plain /> × <L>{1 + VP.growth}^{VP.yearsToRetire}</L> = <strong><M v={VP_PER_YEAR} /></strong> — בשכר הצפוי בפרישה.</p> },
              { title: "② שנות שירות", body: <p>{VP.served} שנים: <M v={VP_PER_YEAR} /> × {VP.served} = <M v={VP_ACCRUED} /> נצברו.</p> },
              { title: "③ עובדים צפויים", body: <p>עובדת אחת, והיא צפויה להגיע לפרישה: 1.</p> },
              { title: "④ n", body: <p>מ-{VP.date} עד הפרישה: <strong>{VP.yearsToRetire}</strong> שנים — לא {VP.served} השנים שעברו.</p> },
              { title: "⑤ i, והתוצאה", body: <Recipe5 values={[<M key="1" v={VP_PER_YEAR} />, VP.served, 1, VP.yearsToRetire, pct(VP.rate)]} result={<strong><M v={VP_OBLIGATION} /></strong>} /> },
            ]}
          />
        </Wide>
      </>
    ),
  },
  "emp-measure-together": {
    lead: "משנים נתון אחד, ושואלים איזה צעד הוא משנה.",
    body: (
      <>
        <Card title="א. הפרישה נדחית בשנתיים, והריבית יורדת">
          <HintLadder
            task={
              <>
                אותה סמנכ״לית, אבל הפרישה בעוד {VP_LATER.yearsToRetire} שנים, והתשואה {pct(VP_LATER.rate)}. מה ההתחייבות?
              </>
            }
            hints={[
              "אילו צעדים משתנים כשהפרישה רחוקה יותר?",
              "① (עוד שתי שנות עליית שכר), ④ (n) ו-⑤ (השיעור). ② ו-③ לא זזים.",
              <>
                ① = {pct(VP.share)} × <Money v={VP.salary} plain /> × <L>{1 + VP.growth}^{VP_LATER.yearsToRetire}</L> = <M v={VP_LATER_PER_YEAR} />
              </>,
              <>
                <M v={VP_LATER_PER_YEAR} /> × {VP.served} ÷ <L>{1 + VP_LATER.rate}^{VP_LATER.yearsToRetire}</L> = <strong><M v={VP_LATER_OBLIGATION} /></strong>
              </>,
            ]}
          />
        </Card>
        <Card title="ב. קבוצה של עובדים">
          <HintLadder
            task={
              <>
                חברת לוגיסטיקה, {GROUP.opening.date}: מענק פרישה של {pct(GROUP.opening.share)} מהשכר האחרון לכל שנת שירות; שכר ממוצע צפוי בפרישה <Money v={GROUP.opening.finalSalary} />. כולם התחילו
                ב-1.1.{GROUP.start}; {GROUP.opening.staff} עובדים, {pct(GROUP.opening.stay)} צפויים לקבל; התשלום בעוד {GROUP.opening.n} שנים. ממשלתיות {pct(GROUP.opening.government)}, קונצרניות{" "}
                {pct(GROUP.opening.corporate)}. מה ההתחייבות?
              </>
            }
            hints={[
              "כמה עובדים באמת יקבלו — וכמה שנים כל אחד צבר?",
              "צעדים ② ו-③: שנתיים, ו-400 × 85%.",
              <>
                ① {pct(GROUP.opening.share)} × <Money v={GROUP.opening.finalSalary} plain /> = <Money v={g.perYear} plain />; ② {g.years}; ③ {g.heads}; ④ {g.n}; ⑤ {pct(g.i)} (לא הממשלתית).
              </>,
              <>
                <Money v={g.perYear} plain /> × {g.years} × {g.heads} ÷ <L>{1 + g.i}^{g.n}</L> = <strong><M v={GROUP_OPENING} /></strong>
              </>,
            ]}
          />
        </Card>
      </>
    ),
  },
  "emp-measure-drill": {
    lead: "עובד חדש, חוזה חדש, מספרים חדשים — אותה תבנית.",
    body: (
      <>
        <P>בכל לחיצה: תפקיד אחר, אחוז או מכפלת משכורות, תאריך התחלה (גם באמצע שנה), עליית שכר, שיעור היוון — ולפעמים גם תשואה ממשלתית מסיחה או הסתברות להגיע לפרישה. פתרו, בדקו, ורק אז פתחו את הפתרון.</P>
        <DrillBox families={["puc"]} />
      </>
    ),
  },
  "emp-measure-master": {
    lead: "התחייבות = הטבה לשנה × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ.",
    body: (
      <>
        <ExplainTask task="נסחו את חמשת הצעדים בלי להסתכל, והסבירו לחבר מה n סופר." model="① הטבה לשנה בשכר הצפוי בפרישה; ② שנות שירות שנצברו; ③ עובדים כפול ההסתברות שיקבלו; ④ n — השנים מהיום ועד התשלום; ⑤ התשואה הקונצרנית של התאריך. n סופר קדימה, עד התשלום — את השנים שעברו כבר ספרנו ב-②." />
        <Bridge summary="התחייבות = הטבה לשנה × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ.">מה קורה כשההטבה לא שווה בכל שנה, כשיש תקרה, או כשהזכאות מתחילה רק משנה מסוימת? {lessonRef("ias19-attribute")}.</Bridge>
      </>
    ),
    check: quiz("emp-measure-master", [
      { q: "מה שווה היום 2,500 ₪ שישולמו בעוד 7 שנים, בריבית 4.5%?", options: ["1,837 ₪", "1,777 ₪", "2,500 ₪", "3,402 ₪"], answer: 0, why: "2,500 ÷ 1.045⁷ = 1,837 ₪." },
      { q: "שכר היום 21,000 ₪, עולה 2.5% בשנה, פרישה בעוד 6 שנים, הטבה 6% לשנה. מה ①?", options: ["1,461 ₪", "1,260 ₪", "7,560 ₪", "1,087 ₪"], answer: 0, why: "6% × 21,000 × 1.025⁶ = 1,461 ₪." },
      { q: "ממשלתיות 4.8%, קונצרניות 6.2%. באיזו משתמשים?", options: ["6.2%, כי השוק בישראל עמוק", "4.8%, כי היא בטוחה יותר", "5.5%", "תלוי במשך"], answer: 0, why: "IAS 19.83." },
      { q: "עובד עבד 4 שנים וצפוי לעבוד עוד 10. מה n?", options: ["10", "4", "14", "6"], answer: 0, why: "השנים עד התשלום." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 6: attribution.
  "emp-attr-hook": {
    lead: "כמה מההטבה ״שלכם״ אחרי חלק מהדרך — תלוי איך סופרים, והתקן קובע את הספירה.",
    body: (
      <>
        <Story icon={<Dumbbell />} title="מנוי חינם אחרי 100 אימונים">
          <p>מועדון כושר מבטיח: מי שמשלים 100 אימונים מקבל מנוי שנתי חינם. אחרי 40 אימונים — כמה מהמנוי כבר ״שלכם״?</p>
          <p>אם כל אימון שווה אותו דבר: 40%. אבל אם 20 האימונים הראשונים שווים כפול, או שהספירה מתחילה רק מהאימון ה-30 — התשובה אחרת.</p>
        </Story>
        <MapBranch lesson="ias19-attribute">
          {lessonRef("ias19-measure")} נתן את הנוסחה. כאן משלימים את צעדים ① ו-②: מהי בדיוק ״ההטבה לשנה״, ואילו שנים נספרות. {lessonRef("ias19-rollforward")} יוסיף את התנועה לאורך השנה.
        </MapBranch>
      </>
    ),
  },
  "emp-attr-formula": {
    lead: "משייכים לפי נוסחת התוכנית — אלא אם השנים המאוחרות נותנות הטבה גבוהה מהותית: אז בקו ישר.",
    body: (
      <>
        <P>
          ההתחייבות נצברת לאורך השנים שבהן העובד ״מרוויח״ את ההטבה. ברירת המחדל: <T19 he="לפי נוסחת ההטבה של התוכנית" en="Plan's benefit formula" par="71" />.
        </P>
        <P>
          החריג: אם שירות בשנים מאוחרות מניב הטבה גבוהה מהותית משירות בשנים מוקדמות, מחלקים את ההטבה הכוללת <T19 he="בקו ישר" en="Straight-line basis" par="73" /> על פני כל שנות הצבירה. בלי
          החריג, השנים הראשונות היו מקבלות כמעט כלום — אף שהן חלק מהדרך להטבה הגדולה.
        </P>
      </>
    ),
    check: quiz("emp-attr-formula", [
      { q: "2,400 ₪ לכל אחת מ-4 השנים הראשונות, ו-600 ₪ לכל שנה אחריהן. איך משייכים?", options: ["לפי נוסחת התוכנית", "בקו ישר", "רק את השנים הראשונות", "שווה בשווה בין המדרגות"], answer: 0, why: "המאוחרות נותנות פחות — אין סיבה לקו ישר." },
      { q: "1,500 ₪ לכל אחת מ-4 השנים הראשונות, ו-5,000 ₪ לכל שנה אחריהן. איך משייכים?", options: ["בקו ישר", "לפי נוסחת התוכנית", "רק את השנים המאוחרות", "לא משייכים"], answer: 0, why: "המאוחרות גבוהות מהותית (IAS 19.73)." },
    ]),
  },
  "emp-attr-cap": {
    lead: "תקרה מקצרת את חלון הצבירה — היא לא מכווצת את הסכום לשנה. וזכאות שמתחילה מאוחר — סופרים רק ממנה.",
    body: (
      <>
        <Card title="תקרה">
          <p>אם יש תקרה, ההטבה הצפויה נחתכת בתקרה, וחלון הצבירה נגמר בשנה שבה מגיעים אליה. השנים שאחריה לא מוסיפות דבר — ולכן הסכום לשנה לא קטן, אלא החלון קצר יותר.</p>
        </Card>
        <Card title="זכאות שמתחילה מגיל או מוותק">
          <p>אם השירות מקנה זכאות רק מגיל מסוים, או רק אחרי ותק מסוים, השנים שלפני כן אינן נספרות.</p>
        </Card>
        <KeyCard>ובכל מקרה: ההיוון (צעד ④) הוא תמיד על השנים עד התשלום — לא על חלון הצבירה.</KeyCard>
      </>
    ),
    check: quiz("emp-attr-cap", [
      { q: "2,500 ₪ לכל שנה עד תקרה של 10,000. אחרי 2 שנים — כמה נצבר?", options: ["5,000, והחלון 4 שנים", "10,000", "2,500", "5,000, והחלון כל שנות העבודה"], answer: 0, why: "החלון נגמר ב-4 שנים; עד אז 2,500 לשנה." },
      { q: "העובדת התחילה בגיל 26, והזכאות מגיל 35. היום היא בת 31 — כמה שנים נספרות?", options: ["0", "5", "9", "4"], answer: 0, why: "עד גיל 35 השירות לא מקנה זכאות." },
    ]),
  },
  "emp-attr-dual": {
    lead: "כשיש שני מסלולים לזכאות, שואלים לכל עובד: מתי השירות שלו מתחיל להגדיל את המענק, ומתי מפסיק.",
    body: (
      <>
        <P>
          מענק של <Money v={DUAL.rule.grant} /> למי שעדיין מועסק בגיל {DUAL.rule.minAge} אחרי {DUAL.rule.years} שנות שירות — או למי שעדיין מועסק בגיל {DUAL.rule.retire}, בלי קשר לוותק. הצבירה
          מתחילה כשהשירות מתחיל להוביל למענק (<span dir="ltr">IAS 19.71</span>), ונגמרת כששירות נוסף כבר לא מגדיל אותו (<span dir="ltr">IAS 19.73</span>). שלושה מקרים:
        </P>
        <Sorted
          columns={[
            { title: `התחיל לפני גיל ${DUAL.rule.minAge - DUAL.rule.years}`, tone: "neutral", items: [`צובר רק מגיל ${DUAL.rule.minAge - DUAL.rule.years}`, `על ${DUAL.rule.years} שנים, עד גיל ${DUAL.rule.minAge}`] },
            { title: `התחיל בזמן להשלים ${DUAL.rule.years} שנה`, tone: "neutral", items: ["צובר מיום שהתחיל", `על ${DUAL.rule.years} שנים — ואז כבר זכאי`] },
            { title: "התחיל מאוחר מדי", tone: "neutral", items: [`זכאי רק בגיל ${DUAL.rule.retire}`, "צובר מיום שהתחיל ועד אז"] },
          ]}
        />
        <WindowExplorer rule={DUAL.rule} start={{ hireAge: DUAL.people[0].hireAge, age: DUAL.people[0].age }} />
      </>
    ),
    check: quiz("emp-attr-dual", [
      { q: `לפי אותו מענק: עובדת התחילה בגיל 28. מאיזה גיל היא צוברת?`, options: [`${DUAL.rule.minAge - DUAL.rule.years}`, "28", `${DUAL.rule.minAge}`, `${DUAL.rule.retire}`], answer: 0, why: `השירות לפני ${DUAL.rule.minAge - DUAL.rule.years} לא מוסיף: בכל מקרה היא תהיה זכאית בגיל ${DUAL.rule.minAge}.` },
      { q: "עובד התחיל בגיל 55. על כמה שנים נפרש המענק?", options: [`${DUAL.rule.retire - 55}`, `${DUAL.rule.years}`, "5", "אין מענק"], answer: 0, why: `לא ישלים ${DUAL.rule.years} שנה — זכאי רק בגיל ${DUAL.rule.retire}, וכל שירותו מוביל לשם.` },
      { q: "בכמה שנים מהוונים מענק של עובד שצבירתו נגמרת בגיל 60, כשהוא היום בן 50 ויפרוש ב-67?", options: ["17", "10", "25", "7"], answer: 0, why: "ההיוון — עד התשלום, בגיל 67." },
    ]),
  },
  "emp-attr-rule": {
    lead: "שלוש שאלות לפני כל חישוב — ורק אז חוזרים לנוסחה של חמשת הצעדים.",
    body: (
      <>
        <Rule>
          שלוש שאלות לפני כל חישוב: (א) האם השנים המאוחרות נותנות הטבה גבוהה מהותית? כן — קו ישר (הטבה כוללת ÷ שנות הצבירה). לא — לפי נוסחת התוכנית. (ב) יש תקרה? חותכים את ההטבה בתקרה ומקצרים
          את חלון הצבירה. (ג) מאיזה רגע השירות מקנה זכאות, ועד מתי הוא מוסיף? סופרים רק את החלון הזה — וכשיש שני מסלולים (גיל וּותק, או גיל בלבד), בודקים לכל עובד באיזה מסלול יגיע. אחר כך חוזרים לנוסחה: ① × ② × ③ ÷ (1+i)ⁿ.
        </Rule>
      </>
    ),
    check: quiz("emp-attr-rule", [
      { q: "ההטבה משולמת בגיל 66, וצוברים אותה על 12 שנים מגיל 42. בגיל 48 — מה n?", options: ["18", "6", "12", "24"], answer: 0, why: "מגיל 48 עד התשלום בגיל 66." },
    ]),
  },
  "emp-attr-template": {
    lead: "שאלת ייחוס: קודם החלון — ממתי עד מתי ובאיזה קצב — ורק אחר כך ההיוון.",
    body: (
      <>
        <SolveTemplate
          seek={["כמה מההטבה שייך לשנים שכבר עבדו — ובערך נוכחי, לכל עובד ובסך הכול."]}
          check={[
            "נוסחה או קו ישר? השנים המאוחרות נותנות הטבה גבוהה מהותית → קו ישר (סעיף 73); אחרת — נוסחת התוכנית (סעיף 71).",
            "יש תקרה? היא חותכת את ההטבה ומקצרת את החלון — השנים שאחריה לא מוסיפות.",
            "ממתי השירות מוביל להטבה? שירות שלא מוסיף (לפני גיל מסוים, למשל) — לא נספר.",
            "עד מתי? כשהעובד כבר זכאי וכל שנה נוספת לא מגדילה — הצבירה נעצרת. יש שני מסלולים? לכל עובד — באיזה יגיע.",
            "ההיוון — עד התשלום (גיל הפרישה), לא עד סוף הצבירה. והסתברות — מכפילים.",
          ]}
          build={[
            { title: "1. החלון", lines: ["גיל תחילת הצבירה, גיל סוף הצבירה, ואורך החלון."] },
            { title: "2. הקצב", lines: ["קו ישר: ההטבה ÷ אורך החלון. נוסחה: לפי המדרגות של התוכנית."] },
            { title: "3. מה נצבר", lines: ["הקצב × השנים שכבר עברו בתוך החלון."] },
            { title: "4. היוון והסתברות", lines: ["÷ (1+i) בחזקת השנים עד התשלום, × ההסתברות. ואם יש כמה עובדים — טבלה וסכום."] },
          ]}
        />
      </>
    ),
    check: quiz("emp-attr-template", [
      { q: "באיזה שלב נכנסת התקרה?", options: ["בבדיקה — היא משנה את החלון", "רק בהיוון", "אחרי הסכום", "היא לא משפיעה על הצבירה"], answer: 0, why: "התקרה קובעת מתי הצבירה נעצרת." },
      { q: "הצבירה נגמרת בגיל 61, והתשלום בגיל 66. עד איזה גיל מהוונים?", options: ["66", "61", "ממוצע", "לא מהוונים"], answer: 0, why: "תמיד עד התשלום." },
    ]),
  },
  "emp-attr-solved": {
    lead: "כשהשנים הראשונות נותנות יותר — נוסחת התוכנית; קו ישר היה נותן תוצאה נמוכה מדי.",
    body: (
      <>
        <Story icon={<Trophy />} title="מענק שנותן יותר בהתחלה">
          <p>
            מענק פרישה: <Money v={FRONT.early.perYear} /> לכל אחת מ-{FRONT.early.upTo} השנים הראשונות, ו-<Money v={FRONT.later} /> לכל שנה אחריהן; תקרה <Money v={FRONT.cap} />. העובד צפוי לעבוד{" "}
            {FRONT.expected} שנים; הוא עבד {FRONT.served}, והתשלום בעוד {FRONT.n}. שיעור ההיוון {pct(FRONT.rate)}.
          </p>
        </Story>
        <Stepper
          label="שיוך לפי הנוסחה"
          steps={[
            { title: "(א) מי גבוה יותר?", body: <p>השנים הראשונות — <Money v={FRONT.early.perYear} /> מול <Money v={FRONT.later} />. אין סיבה לקו ישר: נוסחת התוכנית.</p> },
            { title: "(ב) התקרה", body: <p>בסוף {FRONT.expected} שנים ההטבה בדיוק <Money v={FRONT.cap} /> — התקרה לא חותכת כאן.</p> },
            { title: "(ג) מה נצבר", body: <p>{FRONT.early.upTo} × <Money v={FRONT.early.perYear} plain /> + {FRONT.served - FRONT.early.upTo} × <Money v={FRONT.later} plain /> = <strong><Money v={FRONT_ACCRUED} /></strong>.</p> },
            {
              title: "היוון, והשוואה",
              body: (
                <div className="space-y-2">
                  <p>
                    <Money v={FRONT_ACCRUED} plain /> ÷ <L>{1 + FRONT.rate}^{FRONT.n}</L> = <strong><M v={FRONT_OBLIGATION} /></strong>.
                  </p>
                  <p className="text-[14px] text-muted">
                    קו ישר — האסור כאן — היה נותן <Money v={FRONT.cap} plain /> ÷ {FRONT.expected} × {FRONT.served} = <Money v={FRONT_WRONG} plain />, ומהוון <M v={FRONT_WRONG_OBLIGATION} />: נמוך מדי.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </>
    ),
  },
  "emp-attr-together": {
    lead: "מענק שקופץ בשנים המאוחרות — קו ישר; זכאות שמתחילה מאוחר — סופרים רק ממנה.",
    body: (
      <>
        <Card title="א. מענק שקופץ">
          <HintLadder
            task={
              <>
                אותו מבנה, אבל <Money v={BACK.early.perYear} /> לכל אחת מ-{BACK.early.upTo} השנים הראשונות ו-<Money v={BACK.later} /> לכל שנה אחריהן, בלי תקרה. העובד צפוי לעבוד {BACK.expected} שנים, עבד{" "}
                {BACK.served}, והתשלום בעוד {BACK.n}; {pct(BACK.rate)}. מה ההתחייבות?
              </>
            }
            hints={[
              "השנים המאוחרות נותנות יותר או פחות?",
              "שאלה (א): גבוהות מהותית — קו ישר על כל שנות הצבירה.",
              <>
                הטבה כוללת: {BACK.early.upTo} × <Money v={BACK.early.perYear} plain /> + {BACK.expected - BACK.early.upTo} × <Money v={BACK.later} plain /> = <Money v={BACK_A.total} plain />; ÷ {BACK.expected} ={" "}
                <M v={BACK_A.perYear!} /> לשנה.
              </>,
              <>
                × {BACK.served} = <M v={BACK_ACCRUED} />; ÷ <L>{1 + BACK.rate}^{BACK.n}</L> = <strong><M v={BACK_OBLIGATION} /></strong>. הנוסחה — האסורה כאן — הייתה נותנת <Money v={BACK_WRONG} plain /> ו-<M v={BACK_WRONG_OBLIGATION} />.
              </>,
            ]}
          />
        </Card>
        <Card title="ב. שלושה עובדים, שני מסלולים">
          <p className="text-[14.5px]">
            מענק של <Money v={DUAL.rule.grant} /> למי שעדיין מועסק בגיל {DUAL.rule.minAge} אחרי {DUAL.rule.years} שנות שירות, או בגיל {DUAL.rule.retire} בלי קשר לוותק. כולם צפויים לפרוש בגיל{" "}
            {DUAL.rule.retire}; שיעור ההיוון {pct(DUAL.rate)}. ב-{DUAL.date}:{" "}
            {DUAL.people.map((p, k) => (
              <span key={p.id}>
                עובד {p.id} — בן {p.age}, עובד {p.age - p.hireAge} שנים, הסתברות {pct(p.stay)}
                {k < DUAL.people.length - 1 ? "; " : "."}
              </span>
            ))}
          </p>
          <HintLadder
            task="מה ההתחייבות לכל עובד, ובסך הכול?"
            hints={[
              `לכל עובד: האם הוא יכול להשלים ${DUAL.rule.years} שנות שירות עד גיל ${DUAL.rule.retire}? ומאיזה גיל השירות שלו מתחיל להוביל למענק?`,
              <>
                עובד א׳ התחיל בגיל {DUAL.people[0].hireAge} — לפני {DUAL.rule.minAge - DUAL.rule.years}, ולכן צובר מגיל {DUAL_ROWS[0].start}. עובד ב׳ התחיל בגיל {DUAL.people[1].hireAge} — ישלים{" "}
                {DUAL.rule.years} שנה בגיל {DUAL_ROWS[1].end}. עובד ג׳ התחיל בגיל {DUAL.people[2].hireAge} — לא ישלים, ולכן זכאי רק בגיל {DUAL.rule.retire}.
              </>,
              <>
                עובד א׳: <L>{DUAL.rule.grant.toLocaleString("en-US")} ÷ {DUAL_ROWS[0].window}</L> = <Money v={DUAL_ROWS[0].perYear} /> לשנה × {DUAL_ROWS[0].served} שנים = <Money v={DUAL_ROWS[0].accrued} />; ÷{" "}
                <L>{1 + DUAL.rate}^{DUAL_ROWS[0].n}</L> × {pct(DUAL.people[0].stay)} = <M v={DUAL_ROWS[0].obligation} />.
              </>,
              <Wide key="t">
                <DataTable
                  head={["עובד", "צובר מגיל", "עד גיל", "לשנה", "נצברו", "n", "הסתברות", "התחייבות"]}
                  rows={DUAL.people.map((p, k) => [p.id, DUAL_ROWS[k].start, DUAL_ROWS[k].end, Math.round(DUAL_ROWS[k].perYear), DUAL_ROWS[k].served, DUAL_ROWS[k].n, pct(p.stay), Math.round(DUAL_ROWS[k].obligation)])}
                  foot={["סה״כ", "", "", "", "", "", "", Math.round(DUAL_TOTAL)]}
                />
              </Wide>,
            ]}
          />
        </Card>
      </>
    ),
  },
  "emp-attr-drill": {
    lead: "שתי סוגיות ייחוס, מספרים חדשים בכל לחיצה — ופתרון מלא לפי התבנית.",
    body: (
      <>
        <P>״שני מסלולים״: מענק לפי גיל וּותק או לפי גיל בלבד, ושלושה עובדים — אחד מכל מקרה, בסדר משתנה. ״נוסחה או קו ישר״: מדרגות של ותק, לפעמים עם תקרה. פתרו, בדקו, ורק אז פתחו את הפתרון.</P>
        <DrillBox families={["window", "tiers"]} />
      </>
    ),
  },
  "emp-attr-master": {
    lead: "קודם מחליטים איך מחלקים בין השנים, ורק אחר כך מהוונים — עד התשלום.",
    body: (
      <>
        <ExplainTask task="הסבירו במשפט אחד: למה במענק שנצבר על 10 שנים ומשולם בעוד 26 — מחלקים ב-10, אבל מהוונים על 26?" model="החלוקה עונה על השאלה כמה מההטבה כבר הרווחתי — ואת זה מרוויחים בעשר שנים; ההיוון עונה על השאלה מתי יגיע הכסף — והוא יגיע רק בעוד 26 שנה." />
        <Bridge summary="קודם מחליטים איך מחלקים את ההטבה בין השנים — נוסחה, קו ישר, תקרה, תחילת זכאות — ואחר כך מהוונים לפי השנים עד התשלום.">
          ב-31.12 הכול עומד על ערכים של אותו יום. אבל מה קורה להתחייבות מתחילת השנה ועד סופה? {lessonRef("ias19-rollforward")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-attr-master", [
      { q: "1,500 ₪ לשנה עד תקרה של 6,000. אחרי 3 שנים — כמה נצבר, ומה החלון?", options: ["4,500; ארבע שנים", "6,000; שלוש שנים", "4,500; כל שנות העבודה", "1,500; שנה אחת"], answer: 0, why: "התקרה מושגת בשנה הרביעית." },
      { q: "1,200 ₪ ל-4 השנים הראשונות, 4,800 ₪ לכל שנה אחריהן. איזו שיטה?", options: ["קו ישר", "נוסחת התוכנית"], answer: 0, why: "IAS 19.73." },
      { q: "התחיל בגיל 28, זכאות מגיל 35, היום בן 33. כמה שנים נספרות?", options: ["0", "5", "7", "2"], answer: 0, why: "הזכאות עוד לא התחילה." },
      { q: "משולם בגיל 67, נצבר על 12 שנים מגיל 50. בגיל 55 — מה n?", options: ["12", "5", "7", "17"], answer: 0, why: "מגיל 55 עד 67." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 7: a year's roll-forward.
  "emp-roll-hook": {
    lead: "מה שלא מוסבר בשורות הרגילות — ״ההפתעה״ — הוא שורה בפני עצמה.",
    body: (
      <>
        <Story icon={<PiggyBank />} title="חשבון החיסכון שהפתיע">
          <p>התחלתם את השנה עם יתרה. נוספה ריבית, הפקדתם, משכתם חלק — ובסוף השנה הבנק שלח יתרה שונה ממה שחישבתם. ההפרש הוא ״ההפתעה״.</p>
          <p>
            בהתחייבות לעובדים יש לה שם: <T19 he="מדידה מחדש" en="Remeasurement" par="57(d)" /> — בקיצור P.N.
          </p>
        </Story>
        <MapBranch lesson="ias19-rollforward">
          {lessonRef("ias19-measure")} מדד יתרה אחת בתאריך אחד. עכשיו מודדים שתיים — פתיחה וסגירה — ומפרקים את השינוי ביניהן. {lessonRef("ias19-amend")} יוסיף שינוי תנאים ועזיבות באמצע שנה.
        </MapBranch>
      </>
    ),
  },
  "emp-roll-lines": {
    lead: "ארבע שורות מסבירות את השנה — ריבית, שירות, תשלומים, סגירה — והחמישית, P.N., היא מה שנשאר.",
    body: (
      <Wide>
        <DataTable
          head={["שורה", "מה היא אומרת"]}
          rows={[
            [<T19 key="i" he="עלות ריבית" en="Interest cost" />, "ההתחייבות ״התקרבה״ בשנה לתשלום: הפתיחה כפול שיעור ההיוון של תחילת השנה"],
            [<T19 key="s" he="עלות שירות שוטף" en="Current service cost" />, "הערך של מה שהעובד צבר השנה — לפי הנחות תחילת השנה, מהוון לסוף השנה"],
            ["תשלומים", "הטבות ששולמו — מקטינות את ההתחייבות"],
            ["יתרת סגירה", "מדידה חדשה, בהנחות של סוף השנה"],
            [<strong key="p">P.N.</strong>, "כל מה שנשאר: שינויי הנחות, והפער בין הצפוי למה שקרה. ל-OCI, לא לרווח והפסד"],
          ]}
        />
      </Wide>
    ),
    check: quiz("emp-roll-lines", [
      { q: "פתיחה 4,000; שיעור תחילת השנה 5%; שירות 600; סגירה 4,950. מה ה-P.N.?", options: ["150 — הפסד", "150 — רווח", "350", "0"], answer: 0, why: "4,950 − 4,000 − 200 − 600 = 150: ההתחייבות גדלה מעבר לצפוי." },
      { q: "לאן הולך ה-P.N. של התחייבות להטבה מוגדרת?", options: ["ל-OCI", "לרווח והפסד", "למאזן בלבד", "לעודפים ישירות"], answer: 0, why: "IAS 19.57(ד)." },
    ]),
  },
  "emp-roll-rates": {
    lead: "ריבית ושירות — לפי תחילת השנה; הסגירה — לפי סופה. וה-n של השירות נספר מסוף השנה.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["שורה", "ריבית", "n"]}
            rows={[
              ["פתיחה", "השיעור שבו נמדדה בסוף השנה הקודמת", "מתחילת השנה עד התשלום"],
              ["ריבית", "תחילת השנה", "שנה שלמה"],
              ["עלות שירות", "תחילת השנה", "מסוף השנה עד התשלום"],
              ["סגירה", "סוף השנה", "מסוף השנה עד התשלום"],
            ]}
          />
        </Wide>
        <P>למה השינוי בריבית לא משפיע על עלות השירות של אותה שנה? כי השירות נמדד לפי הנחות תחילת השנה, והשינוי נתפס — כולו — ב-P.N.</P>
      </>
    ),
    check: quiz("emp-roll-rates", [
      { q: "באיזה שיעור מחשבים ריבית: תחילת השנה או סופה?", options: ["תחילת השנה", "סוף השנה", "ממוצע", "תלוי בשאלה"], answer: 0, why: "ריבית ושירות — תחילת השנה." },
      { q: "סגירה ב-31.12.2025, פרישה ב-31.12.2030. מה n של עלות השירות של 2025?", options: ["5", "6", "4", "1"], answer: 0, why: "מסוף 2025 עד סוף 2030." },
    ]),
  },
  "emp-roll-rule": {
    lead: "P.N. = סגירה − פתיחה − ריבית − שירות + תשלומים — ולכל שורה פקודה משלה.",
    body: (
      <>
        <Rule>
          הכלל: פתיחה + ריבית + עלות שירות − תשלומים + P.N. = סגירה, ולכן P.N. = סגירה − פתיחה − ריבית − שירות + תשלומים. ריבית ועלות שירות — בשיעור תחילת השנה; סגירה — בשיעור סוף השנה; n של
          עלות השירות — עד סוף השנה.
        </Rule>
        <Wide>
          <DataTable
            head={["שורה", "חובה", "זכות"]}
            rows={[
              ["עלות שירות", "הוצאות שכר", "התחייבות"],
              ["ריבית", "הוצאות מימון", "התחייבות"],
              ["P.N. (הפסד)", "קרן הון — מדידה מחדש (OCI)", "התחייבות"],
              ["תשלום", "התחייבות", "מזומן"],
            ]}
          />
        </Wide>
      </>
    ),
    check: quiz("emp-roll-rule", [{ q: "רישום של P.N. הפסד:", options: ["ח׳ קרן הון (OCI), ז׳ התחייבות", "ח׳ הוצאות שכר, ז׳ התחייבות", "ח׳ התחייבות, ז׳ קרן הון", "ח׳ הוצאות מימון, ז׳ מזומן"], answer: 0, why: "הפסד מגדיל את ההתחייבות, ונרשם ב-OCI." }]),
  },
  "emp-roll-solved": {
    lead: "שנה ראשונה: אין פתיחה ואין ריבית; שנה שנייה: כל השורות — והסגירה מגלה אם משהו השתנה.",
    body: (
      <>
        <Story icon={<Landmark />} title="סמנכ״ל כספים, משנת 2023">
          <p>
            בפרישה יקבל {pct(CF.share)} מהשכר השנתי האחרון לכל שנת שירות. השכר ב-{CF.from}: <Money v={CF.salary} />, עולה {pct(CF.growth)} בשנה; הפרישה ב-31.12.{CF.retire}. שיעור ההיוון:{" "}
            {pct(CF.rateStart)} בתחילת {CF.from}, {pct(CF.rateEnd1)} בסוף {CF.from}.
          </p>
        </Story>
        <Wide>
          <Stepper
            label="שנתיים במעגל"
            steps={[
              {
                title: `${CF.from}: הצבירה לשנה`,
                body: (
                  <p>
                    {pct(CF.share)} × <Money v={CF.salary} plain /> × <L>{1 + CF.growth}^{n1}</L> = <strong><M v={CF_PER_YEAR} /></strong> לכל שנת שירות.
                  </p>
                ),
              },
              {
                title: `${CF.from}: המעגל`,
                body: (
                  <RollForward
                    title={`סמנכ״ל כספים — ${CF.from}`}
                    rows={[
                      { label: "יתרת פתיחה", value: 0, kind: "balance", how: "אין — שנה ראשונה" },
                      { label: "עלות ריבית", value: 0, how: "אין על מה" },
                      { label: "עלות שירות", value: Y1.service, how: `${pct(CF.rateStart)}, n = ${n1}` },
                      { label: "P.N. — הפסד", value: Y1_PN, kind: "pn", how: "הריבית ירדה" },
                      { label: "יתרת סגירה", value: Y1.closing, kind: "balance", how: `${pct(CF.rateEnd1)}, n = ${n1}` },
                    ]}
                  />
                ),
              },
              {
                title: `${CF.from + 1}: בלי שינוי בהנחות`,
                body: (
                  <RollForward
                    title={`סמנכ״ל כספים — ${CF.from + 1}`}
                    rows={[
                      { label: "יתרת פתיחה", value: Y1.closing, kind: "balance" },
                      { label: "עלות ריבית", value: Y2.interest, how: `${pct(CF.rateEnd1)} × הפתיחה` },
                      { label: "עלות שירות", value: Y2.service, how: `${pct(CF.rateEnd1)}, n = ${n1 - 1}` },
                      { label: "P.N.", value: Y2.pn, kind: "pn", how: "שום הנחה לא השתנתה" },
                      { label: "יתרת סגירה", value: Y2.closing, kind: "balance", how: `2 שנים, ${pct(CF.rateEnd1)}, n = ${n1 - 1}` },
                    ]}
                  />
                ),
              },
              {
                title: `${CF.from + 1}: ההנחות השתנו`,
                body: (
                  <div className="space-y-2">
                    <p>
                      בסוף {CF.from + 1} מתברר: הפרישה תהיה ב-31.12.{CHANGED.retire} (עוד שנה של עליית שכר), והשיעור ירד ל-{pct(CHANGED.rateEnd)}. ריבית ושירות לא זזים — הם לפי תחילת השנה. רק
                      הסגירה: 2 × <M v={CHANGED_PER_YEAR} /> ÷ <L>{1 + CHANGED.rateEnd}^{CHANGED.retire - CF.from - 1}</L> = <M v={CHANGED_CLOSING} />.
                    </p>
                    <p>
                      P.N. = <M v={CHANGED_CLOSING} /> − <M v={Y2.closing} /> = <strong><M v={CHANGED_PN} /></strong> הפסד ל-OCI.
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </Wide>
      </>
    ),
  },
  "emp-roll-together": {
    lead: "כשמשתנה רק הנחה של סוף השנה, משתנה רק הסגירה — וכל ההפרש עובר ל-P.N.",
    body: (
      <Card title="רק הריבית יורדת">
        <HintLadder
          task={
            <>
              אותו סמנכ״ל, {CF.from + 1}: כל ההנחות כמו קודם, רק השיעור בסוף השנה יורד ל-{pct(CHANGED.rateEnd)}. מה ה-P.N.?
            </>
          }
          hints={[
            "אילו שורות במעגל תלויות בשיעור של סוף השנה?",
            "רק הסגירה. פתיחה, ריבית ושירות — לא זזים.",
            <>
              סגירה: 2 × <M v={CF_PER_YEAR} /> ÷ <L>{1 + CHANGED.rateEnd}^{n1 - 1}</L> = <M v={RATE_ONLY_CLOSING} />
            </>,
            <>
              P.N. = <M v={RATE_ONLY_CLOSING} /> − <M v={Y2.closing} /> = <strong><M v={RATE_ONLY_PN} /></strong> הפסד (בלי עיגולי ביניים). ואם הריבית הייתה עולה? ההתחייבות הייתה קטנה, וה-P.N. — רווח.
            </>,
          ]}
        />
      </Card>
    ),
  },
  "emp-roll-master": {
    lead: "המעגל — פתיחה, ריבית, שירות, תשלומים, P.N. וסגירה — הוא הצורה של כל פתרון מכאן והלאה.",
    body: (
      <>
        <ExplainTask task="ציירו מהזיכרון מעגל עם שש השורות, וכתבו ליד כל שורה באיזה שיעור היא מחושבת." model="פתיחה (השיעור של סוף השנה הקודמת) · ריבית (תחילת השנה, על הפתיחה) · שירות (תחילת השנה, n מסוף השנה) · תשלומים (בפועל) · P.N. (מאזנת, ל-OCI) · סגירה (סוף השנה)." />
        <Bridge summary="המעגל הוא פתיחה, ריבית, שירות, תשלומים, P.N. וסגירה — הריבית והשירות לפי תחילת השנה, והסגירה לפי סופה.">
          מה קורה כשהחברה משפרת את התנאים ב-30 ביוני, וחצי שנה עובדים לפי תנאים אחרים? {lessonRef("ias19-amend")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-roll-master", [
      { q: "פתיחה 2,000; שיעור תחילת השנה 5%; שירות 400; תשלומים 300; סגירה 2,300. מה ה-P.N.?", options: ["100 — הפסד", "100 — רווח", "0", "200"], answer: 0, why: "צפוי: 2,000 + 100 + 400 − 300 = 2,200. בפועל 2,300 — ההתחייבות גדלה ב-100 מעבר לצפוי: הפסד." },
      { q: "ריבית — באיזה שיעור?", options: ["תחילת השנה", "סוף השנה"], answer: 0, why: "ריבית ושירות לפי תחילת השנה." },
      { q: "לאן הולך ה-P.N.?", options: ["ל-OCI", "לרווח והפסד"], answer: 0, why: "מדידה מחדש של הטבה מוגדרת — OCI (סעיף 57(ד))." },
      { q: "למה ירידת ריבית בסוף השנה לא משנה את עלות השירות של אותה שנה?", options: ["כי השירות נמדד לפי הנחות תחילת השנה, והשינוי נתפס ב-P.N.", "כי השירות לא מהוון", "כי היא משנה, רק מעט", "כי השירות נמדד בשנה הבאה"], answer: 0, why: "זה התפקיד של ה-P.N." },
      { q: "שנה בלי שינוי הנחות ובלי תשלומים חריגים — כמה P.N.?", options: ["אפס", "הריבית", "השירות", "תלוי"], answer: 0, why: "הכול מוסבר בשורות הרגילות." },
    ]),
  },
};
