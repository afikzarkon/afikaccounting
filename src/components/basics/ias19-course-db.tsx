import { Dumbbell, Landmark, PiggyBank, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { BACK, BACK_A, BACK_ACCRUED, BACK_OBLIGATION, BACK_WRONG, BACK_WRONG_OBLIGATION, FRONT, FRONT_ACCRUED, FRONT_OBLIGATION, FRONT_WRONG, FRONT_WRONG_OBLIGATION, LATE, LATE_ROWS, LATE_TOTAL } from "@/lib/study/ias19/lessons/attribute";
import { GROUP, GROUP_OPENING, groupStep, VP, VP_ACCRUED, VP_LATER, VP_LATER_OBLIGATION, VP_LATER_PER_YEAR, VP_OBLIGATION, VP_PER_YEAR } from "@/lib/study/ias19/lessons/measure";
import { CF, CF_PER_YEAR, CHANGED, CHANGED_CLOSING, CHANGED_PER_YEAR, CHANGED_PN, RATE_ONLY_CLOSING, RATE_ONLY_PN, Y1, Y1_PN, Y2 } from "@/lib/study/ias19/lessons/rollforward";
import { lessonRef, pct } from "@/lib/study/ias19/shared";
import { Bridge, ExplainTask, HintLadder, MapBranch, Recipe5, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { RollSchedule } from "./roll-schedule";
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
        <Story icon={<Landmark />} title="5% מהמשכורת האחרונה, על כל שנה">
          <p>מבטיחים לכם: ביום הפרישה תקבלו 5% מהמשכורת האחרונה שלכם על כל שנת עבודה. כמה זה שווה היום?</p>
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
  "emp-measure-rate": {
    lead: "מהוונים בתשואת אג״ח קונצרניות איכותיות בתאריך המדידה — לא בממשלתית, ולא בשיעור של תאריך אחר.",
    body: (
      <>
        <P>
          <T19 he="שיעור ההיוון" en="Discount rate" par="83" /> הוא התשואה, בסוף התקופה, על אגרות חוב קונצרניות באיכות גבוהה. רק כשאין לאג״ח כאלה שוק עמוק משתמשים בממשלתיות. בישראל השוק
          עמוק — ולכן כששאלה נותנת גם תשואה ממשלתית, היא בדרך כלל מסיחה.
        </P>
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
  "emp-measure-master": {
    lead: "התחייבות = הטבה לשנה × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ.",
    body: (
      <>
        <ExplainTask task="נסחו את חמשת הצעדים בלי להסתכל, והסבירו לחבר מה n סופר." model="① הטבה לשנה בשכר הצפוי בפרישה; ② שנות שירות שנצברו; ③ עובדים כפול ההסתברות שיקבלו; ④ n — השנים מהיום ועד התשלום; ⑤ התשואה הקונצרנית של התאריך. n סופר קדימה, עד התשלום — את השנים שעברו כבר ספרנו ב-②." />
        <Bridge summary="התחייבות = הטבה לשנה × שנות שירות × עובדים צפויים ÷ (1+i)ⁿ.">מה קורה כשההטבה לא שווה בכל שנה, כשיש תקרה, או כשהזכאות מתחילה רק משנה מסוימת? {lessonRef("ias19-attribute")}.</Bridge>
      </>
    ),
    check: quiz("emp-measure-master", [
      { q: "מה שווה היום 2,000 ₪ שישולמו בעוד 8 שנים, בריבית 4%?", options: ["1,461 ₪", "1,385 ₪", "1,600 ₪", "2,737 ₪"], answer: 0, why: "2,000 ÷ 1.04⁸ = 1,461 ₪." },
      { q: "שכר היום 24,000 ₪, עולה 2% בשנה, פרישה בעוד 5 שנים, הטבה 5% לשנה. מה ①?", options: ["1,325 ₪", "1,200 ₪", "6,000 ₪", "1,087 ₪"], answer: 0, why: "5% × 24,000 × 1.02⁵ = 1,325 ₪." },
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
      { q: "2,000 ₪ לכל אחת מ-5 השנים הראשונות, ו-500 ₪ לכל שנה אחריהן. איך משייכים?", options: ["לפי נוסחת התוכנית", "בקו ישר", "רק את השנים הראשונות", "שווה בשווה בין המדרגות"], answer: 0, why: "המאוחרות נותנות פחות — אין סיבה לקו ישר." },
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
  "emp-attr-rule": {
    lead: "שלוש שאלות לפני כל חישוב — ורק אז חוזרים לנוסחה של חמשת הצעדים.",
    body: (
      <>
        <Rule>
          שלוש שאלות לפני כל חישוב: (א) האם השנים המאוחרות נותנות הטבה גבוהה מהותית? כן — קו ישר (הטבה כוללת ÷ שנות הצבירה). לא — לפי נוסחת התוכנית. (ב) יש תקרה? חותכים את ההטבה בתקרה ומקצרים
          את חלון הצבירה. (ג) מאיזה רגע השירות מקנה זכאות? סופרים רק משם. אחר כך חוזרים לנוסחה: ① × ② × ③ ÷ (1+i)ⁿ.
        </Rule>
      </>
    ),
    check: quiz("emp-attr-rule", [
      { q: "ההטבה משולמת בגיל 66, וצוברים אותה על 12 שנים מגיל 42. בגיל 48 — מה n?", options: ["18", "6", "12", "24"], answer: 0, why: "מגיל 48 עד התשלום בגיל 66." },
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
        <Card title="ב. זכאות מגיל 47">
          <p className="text-[14.5px]">
            מענק של <Money v={LATE.grant} /> בפרישה בגיל {LATE.retire}; השירות מקנה זכאות רק מגיל {LATE.countsFrom}. שיעור {pct(LATE.rate)}.
          </p>
          <HintLadder
            task="שלושה עובדים — מה ההתחייבות לכל אחד, ובסך הכול?"
            hints={[
              "לכל עובד: מאיזה גיל הוא צובר, ועל כמה שנים נפרש המענק?",
              "שאלה (ג): הצבירה מהמאוחר מבין גיל ההתחלה לגיל 47, ועד הפרישה.",
              <>עובד א׳: צובר מגיל {LATE_ROWS[0].from}, על {LATE_ROWS[0].window} שנים — <Money v={LATE_ROWS[0].perYear} /> לשנה.</>,
              <Wide key="t">
                <DataTable
                  head={["עובד", "צובר מגיל", "לשנה", "נספרו", "n", "הסתברות", "התחייבות"]}
                  rows={LATE.people.map((p, k) => [p.id, LATE_ROWS[k].from, LATE_ROWS[k].perYear, LATE_ROWS[k].served, LATE_ROWS[k].n, pct(p.stay), Math.round(LATE_ROWS[k].obligation)])}
                  foot={["סה״כ", "", "", "", "", "", Math.round(LATE_TOTAL)]}
                />
              </Wide>,
            ]}
          />
        </Card>
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
      { q: "1,000 ₪ ל-5 השנים הראשונות, 5,000 ₪ לכל שנה אחריהן. איזו שיטה?", options: ["קו ישר", "נוסחת התוכנית"], answer: 0, why: "IAS 19.73." },
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
      <Wide className="space-y-4">
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
        <RollSchedule />
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
