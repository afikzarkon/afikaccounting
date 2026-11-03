import { CreditCard, PiggyBank } from "lucide-react";
import type { ReactNode } from "react";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { partRate, pv, simplePart } from "@/lib/learn/ias19";
import { HOOK, SOLVED, SOLVED_PART, SOLVED_PV, SOLVED_ROLL, TOGETHER, TOGETHER_PART, TOGETHER_PV, TOGETHER_ROLL } from "@/lib/study/ias19/lessons/toolkit";
import { lessonRef } from "@/lib/study/ias19/shared";
import { Bridge, ExplainTask, HintLadder, MapBranch, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Frac, Money, Stepper } from "./ui";

/** The employee-benefits course, lesson 2: the toolkit — present value, interest for part of a year, and the roll-forward. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const pct = (r: number, d = 2) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: d })}%`;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;

export const IAS19_TOOLS_SCREENS: Record<string, ScreenContent> = {
  "emp-tool-hook": {
    lead: "שקל של היום שווה יותר משקל של העתיד — ובכל שאלה בקורס נצטרך לדעת בכמה.",
    body: (
      <>
        <Story icon={<PiggyBank />} title="היום, או בעוד ארבע שנים?">
          <p>
            מציעים לכם <Money v={HOOK.amount} /> — היום, או בעוד {HOOK.years} שנים. רוב האנשים בוחרים ״היום״: את הכסף של היום אפשר להפקיד ולקבל עליו ריבית. אז כמה ״שווים״ היום{" "}
            <Money v={HOOK.amount} /> של עוד {HOOK.years} שנים?
          </p>
        </Story>
        <Story icon={<CreditCard />} title="ריבית על חצי שנה">
          <p>לקחתם הלוואה באמצע השנה, בריבית שנתית. האם הריבית על חצי השנה היא בדיוק חצי מהריבית השנתית? (רמז: לא בדיוק.)</p>
        </Story>
        <MapBranch lesson="ias19-toolkit">ענף ״ארגז הכלים״: שלוש פעולות שחוזרות בכל שאלה של הטבה מוגדרת ושל הטבה ארוכה — ערך נוכחי, ריבית על חלק משנה ומעגל.</MapBranch>
      </>
    ),
  },
  "emp-tool-pv": {
    lead: "ערך נוכחי מחזיר סכום מהעתיד להיום: מחלקים ב-(1+i) בחזקת מספר השנים עד התשלום.",
    body: (
      <>
        <P>
          <T19 he="ערך נוכחי" en="Present Value, PV" /> הוא כמה שווה היום סכום שישולם בעתיד (<span dir="ltr">FV</span>). מחלקים את הסכום העתידי ב-(1+i) פעם אחת לכל שנה שנשארה עד
          התשלום:
        </P>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[18px] font-semibold ring-1 ring-accent/40">
          PV = <Frac top="FV" bottom={<L>(1 + i)ⁿ</L>} />
        </div>
        <P>
          <strong>בסיפור מהמסך הקודם:</strong> <Money v={HOOK.amount} /> בעוד {HOOK.years} שנים, בריבית {pct(HOOK.rate)}: <Money v={HOOK.amount} plain /> ÷ <L>{1 + HOOK.rate}</L>
            <sup>{HOOK.years}</sup> = <strong><Money v={Math.round(pv(HOOK.amount, HOOK.rate, HOOK.years))} /></strong>. זה מה שהם שווים היום.
        </P>
        <Remember>n הוא מספר השנים מהיום ועד התשלום — לא מספר השנים שכבר עברו.</Remember>
      </>
    ),
    check: quiz("emp-tool-pv", [
      { q: "מה שווה היום 5,000 ₪ שישולמו בעוד שנתיים, בריבית 10%?", options: ["4,132 ₪", "4,000 ₪", "4,545 ₪", "6,050 ₪"], answer: 0, why: "5,000 ÷ 1.1² = 4,132 ₪. 4,545 הוא שנה אחת בלבד; 6,050 הוא ערך עתידי." },
      { q: "ככל שהתשלום רחוק יותר (n גדול), הערך הנוכחי...", options: ["קטן", "גדל", "לא משתנה", "תלוי בסכום"], answer: 0, why: "מחלקים ביותר פעמים ב-(1+i)." },
    ]),
  },
  "emp-tool-part": {
    lead: "ריבית על חלק משנה היא ריבית דריבית: (1+i) בחזקת m/12, פחות 1 — לא i כפול חלק השנה.",
    body: (
      <>
        <P>
          כשצריך ריבית ל-m חודשים בלבד, התקן מחשב אותה כמו ריבית דריבית (<span dir="ltr">IAS 19.123</span>): קודם השיעור לתקופה, אחר כך כפול היתרה.
        </P>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-[17px] font-semibold ring-1 ring-accent/40">
          ריבית = יתרה × (<L>(1 + i)^(m/12) − 1</L>)
        </div>
        <P>
          <strong>רבעון בריבית שנתית 8%:</strong> ריבית דריבית: <L>1.08^(3/12) − 1</L> = <strong>{pct(partRate(0.08, 3), 4)}</strong>. ריבית פשוטה הייתה נותנת <L>8% × 3/12</L> ={" "}
          {pct(simplePart(0.08, 3))}. ההפרש קטן — אבל רק הראשון נכון.
        </P>
        <Part title="ותשלום באמצע השנה?">
          <P>מיום התשלום החוב קטן, ולכן אין עליו ריבית עד סוף התקופה. מחשבים ריבית על כל היתרה, ומפחיתים את הריבית על התשלום מיום שולם.</P>
        </Part>
      </>
    ),
    check: quiz("emp-tool-part", [
      { q: "ריבית שנתית 6%. מה השיעור לחצי שנה?", options: ["2.956%", "3%", "6%", "1.5%"], answer: 0, why: "1.06^0.5 − 1 = 2.956%. 3% הוא ריבית פשוטה." },
      { q: "יתרה 100,000 ₪ ב-1.1, ובאמצע השנה שולמו 20,000 ₪. על מה מחשבים ריבית?", options: ["על 100,000 לשנה, פחות ריבית על 20,000 לחצי שנה", "על 80,000 לשנה שלמה", "על 100,000 לשנה, בלי קשר לתשלום", "על 120,000"], answer: 0, why: "עד התשלום החוב היה 100,000; ממנו והלאה — 80,000." },
    ]),
  },
  "emp-tool-roll": {
    lead: "מעגל: פתיחה ועוד כל השינויים שווה סגירה — והמספר שנשאר כדי שיתאזן הוא ה-P.N.",
    body: (
      <>
        <P>
          <T19 he="מעגל" en="Roll-forward" /> הוא דרך לספר מה קרה ליתרה בשנה: מתחילים ביתרת הפתיחה, מוסיפים מה שהגדיל אותה, מורידים מה שהקטין אותה — ומגיעים ליתרת הסגירה.
        </P>
        <P>
          כשכל השורות ידועות חוץ מאחת, מוצאים אותה מהמעגל. בהטבה מוגדרת השורה הזו היא בדרך כלל <strong>P.N.</strong> — מה שנשאר אחרי שהסברנו כל רכיב.
        </P>
        <P>
          <strong>מוסכמת הסימנים:</strong> בחוברות ובקבצי אקסל ההתחייבות נרשמת במינוס, ותשלום בפלוס — כי תשלום מקטין את ההתחייבות. פונקציית PV באקסל מחזירה מינוס; זו לא טעות, רק
          מהפכים סימן.
        </P>
        <Remember>
          כלל המעגל: פתיחה + הוצאות ושינויים − תשלומים + P.N. = סגירה; כל רכיב אפשר לגלות אם כל השאר ידועים. כלל הריבית (<span dir="ltr">IAS 19.123</span>): יתרה × ((1+i)^(m/12) − 1),
          ותשלום באמצע השנה מקטין את הריבית על התקופה שנשארה.
        </Remember>
      </>
    ),
    check: quiz("emp-tool-roll", [
      { q: "פתיחה 4,000, הוצאה ?, תשלומים 9,000, סגירה 3,500. מה ההוצאה?", options: ["8,500", "9,500", "500", "16,500"], answer: 0, why: "3,500 − 4,000 + 9,000 = 8,500." },
      { q: "באקסל, PV מחזיר −12,000. מה הערך הנוכחי?", options: ["12,000", "−12,000 — יש טעות", "0", "אי אפשר לדעת"], answer: 0, why: "המינוס הוא רק כיוון התזרים." },
    ]),
  },
  "emp-tool-solved": {
    lead: "כל אחד משלושת הכלים הוא חישוב של שורה אחת — וחוזרים עליו בכל שאלה.",
    body: (
      <>
        <Stepper
          label="שלוש מיני־דוגמאות"
          steps={[
            {
              title: "א. ערך נוכחי",
              body: (
                <p>
                  עובד צבר מענק של <Money v={SOLVED.pv.fv} />, שישולם בעוד {SOLVED.pv.years} שנים. שיעור ההיוון {pct(SOLVED.pv.rate)}. <Money v={SOLVED.pv.fv} plain /> ÷ <L>{1 + SOLVED.pv.rate}</L>
                  <sup>{SOLVED.pv.years}</sup> = <strong><Money v={Math.round(SOLVED_PV)} /></strong>.
                </p>
              ),
            },
            {
              title: "ב. ריבית על חלק משנה",
              body: (
                <div className="space-y-2">
                  {SOLVED.part.map((p, k) => (
                    <p key={k}>
                      <Money v={p.balance} plain /> × (<L>{1 + p.rate}^({p.months}/12) − 1</L>) = <strong><Money v={Math.round(SOLVED_PART[k])} /></strong> ל-{p.months} חודשים, בשיעור שנתי {pct(p.rate)}.
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
                    פתיחה <Money v={SOLVED.roll.opening} />, שולמו <Money v={SOLVED.roll.payments} />, סגירה <Money v={SOLVED.roll.closing} />. ההוצאה היא המספר שמאזן.
                  </p>
                  <RollForward pnTo="רווח והפסד"
                    title="הפרשה לחופשה"
                    rows={[
                      { label: "יתרת פתיחה", value: SOLVED.roll.opening, kind: "balance" },
                      { label: "תשלומים", value: -SOLVED.roll.payments },
                      { label: "הוצאה (P.N.)", value: SOLVED_ROLL, kind: "pn", how: "סגירה − פתיחה + תשלומים" },
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
    lead: "פותרים לבד, ופותחים רמז רק כשנתקעים: קודם שאלה מכוונת, אחר כך הכלל, השורה הראשונה — והפתרון.",
    body: (
      <>
        <Part title="א. ערך נוכחי">
          <HintLadder
            task={
              <>
                <Money v={TOGETHER.pv.fv} /> ישולמו בעוד {TOGETHER.pv.years} שנים, בשיעור {pct(TOGETHER.pv.rate)}. כמה הם שווים היום?
              </>
            }
            hints={[
              "מכפילים או מחלקים כשמחזירים סכום מהעתיד להיום?",
              "הכלי הראשון: PV = FV ÷ (1+i)ⁿ.",
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
          <HintLadder
            task={
              <>
                יתרה של <Money v={TOGETHER.part.balance} /> ב-1.1, ריבית {pct(TOGETHER.part.rate)}. ב-1.5 שולמו <Money v={TOGETHER.part.paid} />. מה הריבית של השנה?
              </>
            }
            hints={[
              "על איזה סכום הייתה ריבית מ-1.5 ועד סוף השנה?",
              "הכלי השני: ריבית לחלק משנה, על התשלום — שמונה חודשים.",
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
            hints={["מה חסר כדי שהמעגל יתאזן?", "הכלי השלישי: הוצאה = סגירה − פתיחה + תשלומים.", <>
                <Money v={TOGETHER.roll.closing} plain /> − <Money v={TOGETHER.roll.opening} plain /> + <Money v={TOGETHER.roll.payments} plain />
              </>, <><Money v={TOGETHER_ROLL} /></>]}
          />
        </Part>
      </>
    ),
  },
  "emp-tool-master": {
    lead: "שלושה כלים — ואותם נפעיל בכל שיעור מכאן והלאה.",
    body: (
      <>
        <P>
          את שלושת הכלים לא צריך לזכור כנוסחאות נפרדות: <strong>להחזיר להיום</strong>, <strong>להוסיף ריבית לחלק מהשנה</strong>, <strong>לסגור מעגל</strong>.
        </P>
        <ExplainTask
          task="הסבירו לחבר, בדקה, למה הריבית על חצי שנה אינה חצי מהריבית השנתית."
          model="ריבית שנתית מניחה שהריבית של החצי הראשון כבר מצטרפת לקרן ומרוויחה ריבית בחצי השני. לכן שיעור של חצי שנה, כפול עצמו, צריך לתת את השיעור השנתי — והוא קצת פחות מהחצי: (1+i)^0.5 − 1."
        />
        <Bridge summary="ארגז הכלים הוא ערך נוכחי, ריבית על חלק משנה ומעגל.">
          ההטבה הראשונה במפה היא דווקא זו שבה לא מהוונים בכלל. למה? {lessonRef("ias19-short")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-tool-master", [
      { q: "מה הערך הנוכחי של 6,000 ₪ בעוד 3 שנים, בריבית 4%?", options: ["5,334 ₪", "5,280 ₪", "5,769 ₪", "6,749 ₪"], answer: 0, why: "6,000 ÷ 1.04³ = 5,334 ₪." },
      { q: "ריבית שנתית 5%. מה השיעור לרבעון?", options: ["1.2272%", "1.25%", "5%", "1.6667%"], answer: 0, why: "1.05^0.25 − 1 = 1.2272%; 1.25% הוא ריבית פשוטה." },
      { q: "פתיחה 1,500, ריבית 90, תשלום 400, סגירה 1,400. מה ה-P.N.?", options: ["210 — הפסד", "210 — רווח", "190", "0"], answer: 0, why: "1,400 − 1,500 − 90 + 400 = 210: ההתחייבות גדלה מעבר למה שהוסבר." },
      { q: "בהפרשה לחופשה, למה ההוצאה היא מה שמאזן את המעגל?", options: ["כי כל השאר נתונים, והיא הנעלם", "כי היא שווה לפתיחה", "כי מהוונים אותה", "כי התשלום הוא ההוצאה"], answer: 0, why: "פתיחה, תשלומים וסגירה ידועים — ההוצאה משלימה." },
    ]),
  },
};
