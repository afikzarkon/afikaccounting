import { CreditCard, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { partRate, pv, simplePart } from "@/lib/learn/ias19";
import { HOOK, SOLVED, SOLVED_PART, SOLVED_PV, SOLVED_ROLL, TOGETHER, TOGETHER_PART, TOGETHER_PV, TOGETHER_ROLL } from "@/lib/study/ias19/lessons/toolkit";
import { lessonRef } from "@/lib/study/ias19/shared";
import { FormulaFill, Ltr } from "./ias19-formula";
import { Bridge, ExplainTask, HintLadder, MapBranch, RollForward, T19 } from "./ias19-ui";
import { BankStatement, Diff, PvSlide, SplitBar, Timeline, WrongRight } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Stepper } from "./ui";
import { ltrFormulas, ltrQuiz } from "@/lib/study/ias19/ltr";

/** The employee-benefits course, lesson 2: the toolkit — present value, interest for part of a year, and the roll-forward. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={ltrQuiz(items)} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const pct = (r: number, d = 2) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: d })}%`;
/** A formula inside a sentence, read left to right. */
const L = Ltr;

export const IAS19_TOOLS_SCREENS: Record<string, ScreenContent> = {
  "emp-tool-hook": {
    lead: "שקל של היום שווה יותר משקל של העתיד. בכל שאלה בקורס נצטרך לדעת בכמה.",
    body: (
      <>
        <Story icon={<PiggyBank />} title="היום, או בעוד ארבע שנים?">
          <p>
            מציעים לכם <Money v={HOOK.amount} />: היום, או בעוד {HOOK.years} שנים. רוב האנשים בוחרים היום, כי את הכסף אפשר להפקיד ולקבל ריבית.
          </p>
          <Timeline
            label={`${HOOK.amount} היום מול ${HOOK.amount} בעוד ${HOOK.years} שנים: כמה שווה היום הסכום הרחוק?`}
            from={0}
            to={HOOK.years}
            ticks={[
              { at: 0, label: "היום" },
              { at: HOOK.years, label: `בעוד ${HOOK.years} שנים` },
            ]}
            spans={[{ from: 0, to: HOOK.years, label: "מחכים", tone: 4 }]}
            marks={[
              { at: 0, label: "? שווה היום", tone: "accent" },
              { at: HOOK.years, label: `${HOOK.amount.toLocaleString("he-IL")} ₪`, tone: 1 },
            ]}
          />
          <p>אז כמה שווים היום ה-{HOOK.amount.toLocaleString("he-IL")} של עוד {HOOK.years} שנים?</p>
        </Story>
        <Story icon={<CreditCard />} title="ריבית על חצי שנה">
          <p>לקחתם הלוואה באמצע השנה, בריבית שנתית. הריבית על חצי השנה היא בדיוק חצי מהשנתית? (רמז: לא בדיוק.)</p>
        </Story>
        <MapBranch lesson="ias19-toolkit">ענף ״ארגז הכלים״: שלוש פעולות שחוזרות בכל שאלה. ערך נוכחי, ריבית על חלק משנה, ומעגל.</MapBranch>
      </>
    ),
  },
  "emp-tool-pv": {
    lead: "ערך נוכחי מחזיר סכום מהעתיד להיום: מחלקים ב-(1+i), פעם לכל שנה.",
    body: (
      <>
        <P>
          <T19 he="ערך נוכחי" /> הוא כמה שווה היום סכום שישולם בעתיד.
        </P>
        <P>ההפך מחיסכון בבנק: בבנק כל שנה מכפילים ב-(1+i). כאן הולכים אחורה, וכל שנה מחלקים.</P>
        <PvSlide fv={HOOK.amount} i={HOOK.rate} n={HOOK.years} title="הסכום מהסיפור, שנה אחר שנה, חוזר להיום" />
        <FormulaFill
          label={`ערך נוכחי: ${HOOK.amount} חלקי ${1 + HOOK.rate} בחזקת ${HOOK.years}`}
          lhs="ערך נוכחי"
          terms={{
            fv: { c: 0, sym: "הסכום העתידי", value: <Money v={HOOK.amount} plain />, from: <Money v={HOOK.amount} />, why: "מה שישולם בסוף." },
            i: { c: 5, sym: "i", value: pct(HOOK.rate), from: <>ריבית {pct(HOOK.rate)}</>, why: "הריבית לשנה." },
            n: { c: 4, sym: "n", value: HOOK.years, from: <>בעוד {HOOK.years} שנים</>, why: "כמה שנים מהיום עד התשלום." },
          }}
          top={[{ t: "fv" }]}
          bottom={["(1 + ", { t: "i" }, ")", { sup: "n" }]}
          result={<Money v={Math.round(pv(HOOK.amount, HOOK.rate, HOOK.years))} />}
        />
        <Remember>n הוא מספר השנים מהיום ועד התשלום, לא מספר השנים שכבר עברו. נשארה חצי שנה? <L>n = 0.5</L>.</Remember>
      </>
    ),
    check: quiz("emp-tool-pv", [
      { q: "כמה שווים היום 5,000 ₪ שישולמו בעוד שנתיים, בריבית 10%?", options: ["4,132 ₪", "4,000 ₪", "4,545 ₪", "6,050 ₪"], answer: 0, why: "5,000 ÷ 1.1² = 4,132 ₪. 4,545 הוא שנה אחת בלבד; 6,050 הוא כפל במקום חילוק." },
      { q: "ככל שהתשלום רחוק יותר (n גדול), הערך הנוכחי...", options: ["קטן", "גדל", "לא משתנה", "תלוי בסכום"], answer: 0, why: "מחלקים ביותר פעמים ב-(1+i)." },
    ]),
  },
  "emp-tool-part": {
    lead: "ריבית על חלק משנה היא ריבית דריבית: (1+i) בחזקת m/12, פחות 1.",
    body: (
      <>
        <P>
          כשצריך ריבית לכמה חודשים בלבד, מחשבים אותה כמו ריבית דריבית (סעיף 123). קודם השיעור לתקופה, ואז כפול היתרה.
        </P>
        <FormulaFill
          label="ריבית לחלק משנה: היתרה כפול אחת ועוד הריבית בחזקת מספר החודשים חלקי 12, פחות אחת"
          lhs="ריבית"
          terms={{
            b: { c: 0, sym: "יתרה", why: "על כמה כסף מחשבים." },
            i: { c: 5, sym: "i", why: "הריבית השנתית." },
            m: { c: 4, sym: "m/12", why: "איזה חלק מהשנה: 3 חודשים הם 3/12." },
          }}
          top={[{ t: "b" }, " × ((1 + ", { t: "i" }, ")", { sup: "m" }, " − 1)"]}
          given={false}
          stepwise={false}
        />
        <SplitBar
          title="רבעון אחד מתוך שנה, בריבית שנתית 8%"
          periods={[
            { months: 3, label: "הרבעון", rate: `${pct(partRate(0.08, 3), 4)} לרבעון`, tone: 5 },
            { months: 9, label: "שאר השנה", tone: 0 },
          ]}
          cuts={["1.1", "1.4", "31.12"]}
        />
        <WrongRight
          label={`ריבית פשוטה: 8% כפול 3/12, שווה ${pct(simplePart(0.08, 3))}. ריבית דריבית: 1.08 בחזקת 3/12 פחות 1, שווה ${pct(partRate(0.08, 3), 4)}`}
          wrong={
            <p>
              ריבית פשוטה: <L>8% × 3/12</L> = <Diff>{pct(simplePart(0.08, 3))}</Diff>
            </p>
          }
          right={
            <p>
              ריבית דריבית: <L>1.08^(3/12) − 1</L> = <Diff>{pct(partRate(0.08, 3), 4)}</Diff>
            </p>
          }
        />
        <Part title="ותשלום באמצע השנה?">
          <P>מיום התשלום החוב קטן, ולכן אין עליו ריבית עד סוף התקופה. מחשבים ריבית על כל היתרה, ומורידים את הריבית על התשלום מיום ששולם.</P>
        </Part>
      </>
    ),
    check: quiz("emp-tool-part", [
      { q: "ריבית שנתית 6%. מה השיעור לחצי שנה?", options: ["2.956%", "3%", "6%", "1.5%"], answer: 0, why: "1.06^0.5 − 1 = 2.956%. 3% הוא ריבית פשוטה." },
      { q: "יתרה 100,000 ₪ ב-1.1, ובאמצע השנה שולמו 20,000 ₪. על מה מחשבים ריבית?", options: ["על 100,000 לשנה, פחות ריבית על 20,000 לחצי שנה", "על 80,000 לשנה שלמה", "על 100,000 לשנה, בלי קשר לתשלום", "על 120,000"], answer: 0, why: "עד התשלום החוב היה 100,000; ממנו והלאה, 80,000." },
    ]),
  },
  "emp-tool-roll": {
    lead: "מעגל: פתיחה ועוד כל השינויים שווה סגירה. מה שנשאר כדי שיתאזן הוא ה-P.N.",
    body: (
      <>
        <P>
          <T19 he="מעגל" /> מספר מה קרה ליתרה בשנה. בדיוק כמו דף חשבון בנק:
        </P>
        <BankStatement
          opening={SOLVED.roll.opening}
          moves={[{ label: "תשלומים שיצאו", v: -SOLVED.roll.payments }]}
          closing={SOLVED.roll.closing}
          unexplained="מה שחסר כדי שיתאזן"
        />
        <P>כשכל השורות ידועות חוץ מאחת, מוצאים אותה מהמעגל. בהטבה מוגדרת זו בדרך כלל P.N., המספר המאזן.</P>
        <Part title="מוסכמת הסימנים">
          <P>בחוברות ובאקסל החוב נרשם במינוס, ותשלום בפלוס, כי תשלום מקטין את החוב. פונקציית PV באקסל מחזירה מינוס: זו לא טעות, רק הופכים סימן.</P>
        </Part>
        <Remember><L>פתיחה + מה שנוסף − תשלומים + P.N. = סגירה</L>. כל שורה אפשר לגלות, אם כל השאר ידועות.</Remember>
      </>
    ),
    check: quiz("emp-tool-roll", [
      { q: "פתיחה 4,000, הוצאה ?, תשלומים 9,000, סגירה 3,500. מה ההוצאה?", options: ["8,500", "9,500", "500", "16,500"], answer: 0, why: "3,500 − 4,000 + 9,000 = 8,500." },
      { q: "באקסל, PV מחזיר −12,000. מה הערך הנוכחי?", options: ["12,000", "−12,000, יש טעות", "0", "אי אפשר לדעת"], answer: 0, why: "המינוס הוא רק כיוון התזרים." },
    ]),
  },
  "emp-tool-solved": {
    lead: "כל כלי הוא חישוב של שורה אחת, וחוזרים עליו בכל שאלה.",
    body: (
      <>
        <Stepper
          label="שלוש מיני־דוגמאות"
          steps={[
            {
              title: "א. ערך נוכחי",
              body: (
                <div className="space-y-2">
                  <p>
                    עובד צבר מענק של <Money v={SOLVED.pv.fv} />, שישולם בעוד {SOLVED.pv.years} שנים. ריבית {pct(SOLVED.pv.rate)}. <L>
                      <Money v={SOLVED.pv.fv} plain /> ÷ {1 + SOLVED.pv.rate}
                      <sup>{SOLVED.pv.years}</sup> = <strong><Money v={Math.round(SOLVED_PV)} /></strong>
                    </L>
                    .
                  </p>
                  <PvSlide fv={SOLVED.pv.fv} i={SOLVED.pv.rate} n={SOLVED.pv.years} />
                </div>
              ),
            },
            {
              title: "ב. ריבית על חלק משנה",
              body: (
                <div className="space-y-2">
                  {SOLVED.part.map((p, k) => (
                    <p key={k}>
                      <Money v={p.balance} plain /> × (<L>{1 + p.rate}^({p.months}/12) − 1</L>) = <strong><Money v={Math.round(SOLVED_PART[k])} /></strong> ל-{p.months} חודשים, בריבית שנתית {pct(p.rate)}.
                    </p>
                  ))}
                </div>
              ),
            },
            {
              title: "ג. מעגל: הפרשה לחופשה",
              body: (
                <div className="space-y-3">
                  <p>
                    פתיחה <Money v={SOLVED.roll.opening} />, שולמו <Money v={SOLVED.roll.payments} />, סגירה <Money v={SOLVED.roll.closing} />. ההוצאה היא המספר המאזן.
                  </p>
                  <RollForward
                    pnTo="רווח והפסד"
                    title="הפרשה לחופשה"
                    rows={[
                      { label: "יתרת פתיחה", value: SOLVED.roll.opening, kind: "balance" },
                      { label: "תשלומים", value: -SOLVED.roll.payments },
                      { label: "הוצאה (המספר המאזן)", value: SOLVED_ROLL, kind: "pn", how: "סגירה − פתיחה + תשלומים" },
                      { label: "יתרת סגירה", value: SOLVED.roll.closing, kind: "balance" },
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
  "emp-tool-together": {
    lead: "פותרים לבד, ופותחים רמז רק כשנתקעים.",
    body: (
      <>
        <Part title="א. ערך נוכחי">
          <HintLadder
            task={
              <>
                <Money v={TOGETHER.pv.fv} /> ישולמו בעוד {TOGETHER.pv.years} שנים, בריבית {pct(TOGETHER.pv.rate)}. כמה הם שווים היום?
              </>
            }
            hints={[
              "מכפילים או מחלקים כשמחזירים סכום מהעתיד להיום?",
              ltrFormulas("הכלי הראשון: סכום עתידי ÷ (1 + ריבית)^שנים = ערך נוכחי."),
              <>
                <Money v={TOGETHER.pv.fv} plain /> ÷ <L>{1 + TOGETHER.pv.rate}</L>
                <sup>{TOGETHER.pv.years}</sup>
              </>,
              <>
                <Money v={Math.round(TOGETHER_PV)} />
              </>,
            ]}
          />
        </Part>
        <Part title="ב. ריבית עם תשלום באמצע השנה">
          <SplitBar
            title="השנה, חתוכה ביום התשלום"
            periods={[
              { months: 4, label: `על ${TOGETHER.part.balance.toLocaleString("he-IL")}`, rate: pct(TOGETHER.part.rate), tone: 1 },
              { months: 8, label: `על ${(TOGETHER.part.balance - TOGETHER.part.paid).toLocaleString("he-IL")}: התשלום כבר יצא`, rate: pct(TOGETHER.part.rate), tone: 4 },
            ]}
            cuts={["1.1", `1.5: שולמו ${TOGETHER.part.paid.toLocaleString("he-IL")}`, "31.12"]}
          />
          <HintLadder
            task={
              <>
                יתרה של <Money v={TOGETHER.part.balance} /> ב-1.1, ריבית {pct(TOGETHER.part.rate)}. ב-1.5 שולמו <Money v={TOGETHER.part.paid} />. מה הריבית של השנה?
              </>
            }
            hints={[
              "על איזה סכום הייתה ריבית מ-1.5 ועד סוף השנה?",
              "הכלי השני: ריבית לחלק משנה, על התשלום. שמונה חודשים.",
              <>
                <Money v={TOGETHER.part.balance} plain /> × {pct(TOGETHER.part.rate)} − <Money v={TOGETHER.part.paid} plain /> × (<L>{1 + TOGETHER.part.rate}^(8/12) − 1</L>)
              </>,
              <>
                <Money v={Math.round(TOGETHER_PART)} />
              </>,
            ]}
          />
        </Part>
        <Part title="ג. מעגל">
          <HintLadder
            task={
              <>
                פתיחה <Money v={TOGETHER.roll.opening} />, תשלומים <Money v={TOGETHER.roll.payments} />, סגירה <Money v={TOGETHER.roll.closing} />. מה ההוצאה?
              </>
            }
            hints={[
              "מה חסר כדי שהמעגל יתאזן?",
              ltrFormulas("הכלי השלישי: הוצאה = סגירה − פתיחה + תשלומים."),
              <>
                <Money v={TOGETHER.roll.closing} plain /> − <Money v={TOGETHER.roll.opening} plain /> + <Money v={TOGETHER.roll.payments} plain />
              </>,
              <>
                <Money v={TOGETHER_ROLL} />
              </>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-tool-master": {
    lead: "שלושה כלים, ואותם נפעיל בכל שיעור מכאן.",
    body: (
      <>
        <P>
          לא צריך לזכור שלוש נוסחאות. צריך לזכור שלוש פעולות: <strong>להחזיר להיום</strong>, <strong>להוסיף ריבית לחלק מהשנה</strong>, <strong>לסגור מעגל</strong>.
        </P>
        <ExplainTask
          task="הסבירו לחבר, בדקה, למה הריבית על חצי שנה אינה חצי מהריבית השנתית."
          model={
            <>
              בריבית שנתית, הריבית של החצי הראשון כבר מצטרפת לקרן ומרוויחה ריבית בחצי השני. לכן שיעור חצי השנה, פעמיים, צריך לתת את השיעור השנתי. והוא קצת פחות מחצי: (1+i)^0.5 − 1.
              <span className="mt-2 block">
                <SplitBar
                  periods={[
                    { months: 6, label: "חצי ראשון", rate: pct(partRate(0.06, 6), 3), tone: 5 },
                    { months: 6, label: "חצי שני: גם על הריבית של הראשון", rate: pct(partRate(0.06, 6), 3), tone: 5 },
                  ]}
                  cuts={["1.1", "1.7", "31.12: ביחד 6%"]}
                />
              </span>
            </>
          }
        />
        <Bridge summary="ארגז הכלים: ערך נוכחי, ריבית על חלק משנה, ומעגל.">ההטבה הראשונה במפה היא דווקא זו שבה לא מהוונים בכלל. למה? {lessonRef("ias19-short")}.</Bridge>
      </>
    ),
    check: quiz("emp-tool-master", [
      { q: "כמה שווים היום 6,000 ₪ בעוד 3 שנים, בריבית 4%?", options: ["5,334 ₪", "5,280 ₪", "5,769 ₪", "6,749 ₪"], answer: 0, why: "6,000 ÷ 1.04³ = 5,334 ₪." },
      { q: "ריבית שנתית 5%. מה השיעור לרבעון?", options: ["1.2272%", "1.25%", "5%", "1.6667%"], answer: 0, why: "1.05^0.25 − 1 = 1.2272%; 1.25% הוא ריבית פשוטה." },
      { q: "פתיחה 1,500, ריבית 90, תשלום 400, סגירה 1,400. מה ה-P.N.?", options: ["210, הפסד", "210, רווח", "190", "0"], answer: 0, why: "1,400 − 1,500 − 90 + 400 = 210: החוב גדל יותר ממה שהוסבר." },
      { q: "בהפרשה לחופשה, למה ההוצאה היא מה שמאזן את המעגל?", options: ["כי כל השאר נתונים, והיא הנעלם", "כי היא שווה לפתיחה", "כי מהוונים אותה", "כי התשלום הוא ההוצאה"], answer: 0, why: "פתיחה, תשלומים וסגירה ידועים; ההוצאה משלימה." },
    ]),
  },
};
