import { Eye, ListChecks, Search } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { ScreenLink } from "@/components/study-mode/screen-link";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import { balancesOf, carryForward, type Entry, ledger, statements, trialBalance } from "@/lib/learn/basics";
import { NOGA, OFEK } from "@/lib/learn/basics-year";
import { MiniQuiz } from "./inventory-interactive";
import { TCardsDialog } from "./t-dialog";
import { Posted } from "./t-accounts";
import { Calc, Money, Stepper, TBTable } from "./ui";

const NOGA_B = balancesOf(ledger(NOGA.entries));
const NOGA_S = statements(NOGA_B);
const OFEK_CARDS = ledger(OFEK.entries);
const OFEK_B = balancesOf(OFEK_CARDS);
const OFEK_S = statements(OFEK_B);
const OFEK_OPEN = carryForward(OFEK_B);
const OFEK_NEXT_B = balancesOf(ledger(OFEK.next, OFEK_OPEN));
const OFEK_NEXT_S = statements(OFEK_NEXT_B);
const retainedOf = (s: ReturnType<typeof statements>) => s.equity.find(([a]) => a === "עודפים")![1];

// The five steps, each with what to do and the mistake it prevents.
const METHOD: { t: string; d: string; saves: string }[] = [
  { t: "קוראים את כל השאלה", d: "לפני הפקודה הראשונה. מסמנים כל ״ראה נתון״ ומחברים אירועים: מקדמה שתנוצל, צ׳ק שייפרע, תשלומים.", saves: "שוכחים שמקדמה כבר שולמה, ורושמים את הקנייה כולה במזומן." },
  { t: "לכל אירוע — שתי שאלות", d: "מה קיבלנו ומה נתנו? ובמה שולם: מזומן, צ׳ק מזומן, צ׳ק דחוי, אשראי, או מקדמה?", saves: "רושמים צ׳ק דחוי כמזומן." },
  { t: "כותבים ובודקים", d: "סך החובה = סך הזכות. ספקים — רק על סחורה; על ציוד ושירותים — זכאים.", saves: "פקודה לא מאוזנת, וספקים במקום זכאים." },
  { t: "מעבירים לכרטיסים", d: "כל שורה לכרטיס שלה, עם מספר הפקודה. בסוף — סך חובה מול סך זכות, והיתרה בצד הגדול.", saves: "יתרה בצד הלא נכון." },
  { t: "מאזן בוחן ובדיקה", d: "כל יתרה בצד שלה. לא מתאזן? ההפרש מכוון אותך לטעות.", saves: "מגישים מאזן בוחן לא מאוזן." },
];

// Words in a question and what they mean for the entry.
const CLUES: [string, string][] = [
  ["״במזומן״, ״בצ׳ק מזומן״, ״בהעברה בנקאית״", "מזומן — הכסף זז היום"],
  ["״באשראי״, ״בצ׳ק דחוי״, ״ישולם ב-…״", "לקוחות או ספקים (זכאים — כשזו לא סחורה)"],
  ["״מקדמה״, ״על חשבון הזמנה עתידית״", "מקדמות — עוד לא קנייה ולא מכירה"],
  ["״מתוך המקדמה״, ״ניצל את המקדמה״", "המקדמה נסגרת בסכום שנוצל"],
  ["״הצ׳ק נפרע״", "רק החוב נסגר מול המזומן"],
  ["״הצ׳ק חזר״, ״לא כובד״", "פקודה הפוכה לפירעון, ועמלה — הוצאה"],
];

/** An event the learner writes first; the entry and its cards behind a click. */
export function TryFirst({ entries, at, opening }: { entries: Entry[]; at: number; opening?: Record<string, number> }) {
  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[15px] text-fg">
        <span className="me-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11.5px] font-bold text-accent">תורכם</span>
        כתבו את הפקודה על דף: מה בחובה, מה בזכות, וכמה. רק אז פתחו.
      </p>
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[14.5px] font-semibold text-accent [&::-webkit-details-marker]:hidden">
          <Eye className="h-4 w-4" aria-hidden /> הצגת הפקודה והכרטיסים
        </summary>
        <div className="border-t border-line p-3">
          <Posted entries={entries} at={at} opening={opening} title="הפקודה" />
        </div>
      </details>
    </div>
  );
}

/** Something to work out first: a prompt, and the answer behind a click. */
export function Reveal({ prompt, label, children }: { prompt: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[15px] text-fg">
        <span className="me-1.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11.5px] font-bold text-accent">תורכם</span>
        {prompt}
      </p>
      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[14.5px] font-semibold text-accent [&::-webkit-details-marker]:hidden">
          <Eye className="h-4 w-4" aria-hidden /> {label}
        </summary>
        <div className="space-y-2 border-t border-line p-3">{children}</div>
      </details>
    </div>
  );
}

/** A short list of facts: the checks before handing in a trial balance. */
function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((x, i) => (
        <li key={i} className="flex items-start gap-2">
          <ListChecks className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export const YEAR_SCREENS: Record<string, ScreenContent> = {
  "year-method": {
    lead: "שאלה של שנה שלמה נראית מפחידה — עשרים אירועים, תאריכים ושמות. אבל היא בנויה מאותן פקודות שכבר מכירים. מה שעושה את ההבדל הוא סדר עבודה קבוע.",
    body: (
      <>
        <ol className="max-w-[70ch] space-y-3">
          {METHOD.map((m, i) => (
            <li key={m.t} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-start rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span className="min-w-0">
                <strong className="text-fg">{m.t}</strong> — {m.d}
                <span className="mt-0.5 block text-[14px] text-muted">
                  <strong className="text-success">חוסך: </strong>
                  {m.saves}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <Part
          title={
            <span className="flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" aria-hidden /> המילים בשאלה מגלות את החשבון
            </span>
          }
        >
          <dl className="divide-y divide-line">
            {CLUES.map(([w, a]) => (
              <div key={w} className="grid gap-x-4 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <dt className="text-[15px] font-semibold text-fg">{w}</dt>
                <dd className="text-[15px] text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </Part>
        <Remember>קוראים את כל השאלה לפני הפקודה הראשונה, ומחברים כל ״ראה נתון״.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="year-method"
        items={[
          {
            q: "בשאלה כתוב: ״ביום 1.8 הגיעה הסחורה (ראה נתון 3)״. מה הדבר הראשון לעשות?",
            options: ["לחזור לנתון 3 ולבדוק מה כבר שולם", "לרשום ח׳ קניות / ז׳ מזומן", "לרשום ח׳ קניות / ז׳ ספקים", "לדלג — כבר נרשם בנתון 3"],
            answer: 0,
            why: "״ראה נתון״ הוא רמז שהאירועים קשורים — למשל מקדמה ששולמה בנתון 3. בלי לבדוק, קל לשלם פעמיים.",
          },
          {
            q: "מאזן הבוחן לא מתאזן: הזכות גדולה מהחובה ב-12,000 בדיוק. מה הכי כדאי לבדוק קודם?",
            options: ["יתרה של 6,000 שנרשמה בזכות במקום בחובה", "יתרה של 12,000 שנשכחה בחובה", "שתי האפשרויות סבירות — בודקים את שתיהן", "אין טעות — מאזן בוחן לא חייב להתאזן"],
            answer: 2,
            why: "יתרה שנשכחה יוצרת הפרש בגובה שלה; יתרה בצד הלא נכון יוצרת הפרש כפול. לכן מחפשים יתרה של 12,000 שחסרה — או של 6,000 שהתהפכה.",
          },
        ]}
      />
    ),
  },

  "year-example": {
    lead: `לפני שתפתרו בעצמכם — דוגמה פתורה מקצה לקצה. ${NOGA.story} עקבו אחרי הכרטיסים: אחרי כל פקודה רואים מה זז.`,
    body: (
      <>
        <Stepper
          label={`${NOGA.name} · ${NOGA.year}`}
          steps={[
            ...NOGA.entries.map((x, i) => ({ title: `${x.date} · ${x.text}`, body: <Posted entries={NOGA.entries} at={i} title={`פקודה ${x.id}`} /> })),
            {
              title: "31.12 · מאזן הבוחן",
              body: (
                <>
                  <TBTable tb={trialBalance(NOGA_B)} caption={`מאזן בוחן · ${NOGA.name} · 31.12.${NOGA.year}`} kind />
                  <Calc result={<Money v={NOGA_S.profit} />}>
                    הכנסות <Money v={NOGA_S.totalIncome} /> − הוצאות <Money v={NOGA_S.totalExpenses} />
                  </Calc>
                </>
              ),
            },
          ]}
        />
        <Part title="שלוש יתרות שכדאי להבין">
          <CheckList
            items={[
              <>
                <strong>זכאים <Money v={-NOGA_B["זכאים"]} /></strong> — התשלום השלישי על מערכת ההגברה, שמגיע רק ב-1.2.2026. הוא עדיין חוב ב-31.12.
              </>,
              <>
                <strong>לקוחות <Money v={NOGA_B["לקוחות"]} /></strong> — מה ש״אולמי גן״ עוד חייבים. ״קפה ים״ כבר שילמו: הכרטיס שלהם נסגר ב-1.4.
              </>,
              <>
                <strong>מקדמות מלקוחות 0</strong> — המקדמה נסגרה ביום האירוע. מקדמה שעוד לא נוצלה הייתה נשארת כאן כהתחייבות.
              </>,
            ]}
          />
        </Part>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="year-example"
        items={[
          {
            q: "למה ההלוואה (100,000) לא נכנסת לרווח, אבל הריבית (3,000) כן?",
            options: ["הקרן צריך להחזיר — התחייבות. הריבית היא המחיר על הכסף — הוצאה", "כי הריבית שולמה במזומן וההלוואה לא", "כי ההלוואה התקבלה באמצע השנה", "שתיהן נכנסות לרווח"],
            answer: 0,
            why: "קבלת הלוואה מכניסה כסף שיוצא שוב. רק הריבית היא עלות של העסק.",
          },
        ]}
      />
    ),
  },

  "year-case": {
    lead: `עכשיו תורכם: שנה שלמה, 21 אירועים. ${OFEK.story} בכל צעד — קודם כותבים לבד, ורק אז פותחים את הפתרון.`,
    body: (
      <>
        <p>
          <strong>טיפ:</strong> עבדו עם דף. כתבו כל פקודה, ותנו לה מספר. כך תוכלו לבנות מהן את הכרטיסים במסך הבא.
        </p>
        <Stepper
          label={`${OFEK.name} · ${OFEK.year} · 21 אירועים`}
          steps={OFEK.entries.map((x, i) => ({ title: `אירוע ${x.id} · ${x.date} · ${x.text}`, body: <TryFirst entries={OFEK.entries} at={i} /> }))}
        />
        <p className="text-[14.5px] text-muted">
          בתרגול של השיעור תכתבו את הפקודות הקשות של אופק בסימולטור — ותקבלו בדיקה על כל שורה.
        </p>
      </>
    ),
  },

  "year-tb": {
    lead: "21 פקודות הפכו לכרטיסים. סוגרים כל כרטיס, מעבירים את היתרות למאזן בוחן — ובודקים לפני שממשיכים.",
    body: (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <TCardsDialog cards={OFEK_CARDS} />
          <span className="text-[14px] text-muted">כל הכרטיסים של אופק, אחרי 21 הפקודות</span>
        </div>
        <TBTable tb={trialBalance(OFEK_B)} caption={`מאזן בוחן · ${OFEK.name} · 31.12.${OFEK.year}`} kind />
        <Calc result={<Money v={OFEK_S.profit} />}>
          רווח {OFEK.year}: הכנסות <Money v={OFEK_S.totalIncome} /> − הוצאות <Money v={OFEK_S.totalExpenses} />
        </Calc>
        <Part title="הבדיקות לפני שממשיכים">
          <CheckList
            items={[
              <>סך החובה = סך הזכות.</>,
              <>חשבונות שנסגרו לאפס — זכאים, מקדמות לספקים, מקדמות מלקוחות — הם סימן טוב: כל חוב נסגר כשצריך.</>,
              <>
                ללקוחות יש יתרה רק של מי שעוד חייב (<Money v={OFEK_B["לקוחות"]} />, ״גבעון״). הצ׳ק שחזר נפתח ונסגר שוב — בכרטיס הוא מופיע שלוש פעמים.
              </>,
              <>
                בספקים נשאר רק האשראי ל״נייר ועוד״: <Money v={-OFEK_B["ספקים"]} />.
              </>,
            ]}
          />
        </Part>
        <Remember>עוד אין כאן מלאי סגירה — בשיעור הבא נלמד אותו. לכן כל הקניות נראות כהוצאה של השנה.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="year-tb"
        items={[
          {
            q: "בכרטיס הלקוחות של אופק יש 50,000 בחובה ביום 15.2, ו-50,000 בחובה שוב ביום 18.5. למה פעמיים?",
            options: ["פעם במכירה, ופעם כשהצ׳ק חזר והלקוח שוב חייב", "טעות — רשמו את המכירה פעמיים", "פעם על המכירה ופעם על העמלה", "כי היו שתי מכירות ל״רמות״"],
            answer: 0,
            why: "הצ׳ק נפרע (זכות), חזר (חובה שוב), ונגבה בסוף (זכות). הכרטיס מספר את כל הסיפור.",
          },
        ]}
      />
    ),
  },

  "year-next": {
    lead: "1.1.2026: אופק נכנסת לשנה השנייה. החשבונות המאזניים ממשיכים, התוצאתיים מתאפסים — והרווח של 2025 עובר לעודפים.",
    body: (
      <>
        <p>
          <strong>יתרות הפתיחה ב-1.1.2026.</strong> העודפים, <Money v={-OFEK_OPEN["עודפים"]} />, הם בדיוק רווח 2025: החברה חדשה, ולכן לפני כן היו 0. בכרטיסים ראו{" "}
          <ScreenLink id="carry" />.
        </p>
        <TBTable tb={trialBalance(OFEK_OPEN)} caption="יתרות פתיחה · רק חשבונות מאזניים, והעודפים עם רווח 2025" kind />
        <Stepper
          label={`${OFEK.name} · 2026`}
          steps={[
            ...OFEK.next.map((x, i) => ({ title: `${x.date} · ${x.text}`, body: <TryFirst entries={OFEK.next} at={i} opening={OFEK_OPEN} /> })),
            {
              title: "31.12.2026 · מאזן הבוחן והעודפים",
              body: (
                <>
                  <TBTable tb={trialBalance(OFEK_NEXT_B)} caption="מאזן בוחן · 31.12.2026" kind />
                  <Calc result={<Money v={OFEK_NEXT_S.profit} />}>
                    רווח 2026: הכנסות <Money v={OFEK_NEXT_S.totalIncome} /> − הוצאות <Money v={OFEK_NEXT_S.totalExpenses} />
                  </Calc>
                  <Calc result={<Money v={retainedOf(OFEK_NEXT_S)} />}>
                    עודפי סגירה: פתיחה <Money v={-OFEK_OPEN["עודפים"]} /> + רווח <Money v={OFEK_NEXT_S.profit} />
                  </Calc>
                </>
              ),
            },
          ]}
        />
        <Remember>בשנה השנייה: המאזני ממשיך, התוצאתי מאפס, והרווח של השנה הקודמת כבר בעודפים.</Remember>
      </>
    ),
    check: (
      <MiniQuiz
        bare
        prefix="basics"
        chapter="year-next"
        items={[
          {
            q: "ב-2026 ״גבעון״ שילם 25,000 על חוב מ-2025. כמה הכנסה נרשמת ב-2026?",
            options: ["0", "25,000", "40,000", "15,000"],
            answer: 0,
            why: "ההכנסה נרשמה ב-2025, ביום המסירה. ב-2026 רק החוב הופך למזומן.",
          },
          {
            q: "במאזן הבוחן של 31.12.2026 (לפני שסוגרים את השנה), כמה יופיע בעודפים?",
            options: ["40,420 — יתרת הפתיחה", "55,420", "15,000", "0"],
            answer: 0,
            why: "רווח 2026 עוד יושב בהכנסות ובהוצאות. העודפים במאזן הבוחן הם יתרת הפתיחה — רווח 2025.",
          },
        ]}
      />
    ),
  },
};
