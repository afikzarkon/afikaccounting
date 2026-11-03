import { Printer } from "lucide-react";
import { balancesOf, ledger, statements, trialBalance } from "@/lib/learn/basics";
import { ALMOG } from "@/lib/learn/basics-exam";
import { ZAYIT, RIMON, SIGAL } from "@/lib/learn/worksheet";
import { Given } from "./credit";
import { Glossary } from "./glossary";
import { Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { PrintButton } from "./print-button";
import { Tabs } from "./tabs";
import { Calc, Money, Rule, Stepper, TBTable } from "./ui";
import { Reveal, TryFirst } from "./year";
import { WorksheetWalk } from "./worksheet";
import { WorksheetGame } from "./worksheet-game";

const MISTAKES: [string, string][] = [
  ["רושמים משיכת בעלים כהוצאה", "משיכה מקטינה את ההון (ח׳ הון בעלים), ולא נכנסת לרווח והפסד."],
  ["רושמים קניית מחשב כהוצאה", "רכוש שישמש יותר משנה הוא נכס — ח׳ מחשב, לא ח׳ הוצאות."],
  ["רושמים מקדמה מלקוח כמכירה", "עד האספקה זו התחייבות — מקדמות מלקוחות בזכות."],
  ["רושמים פירעון הלוואה כהוצאה", "רק הריבית היא הוצאה. החזר הקרן מקטין את ההלוואה."],
  ["מבלבלים בין ספקים ללקוחות", "ספקים — אנחנו חייבים להם (זכות). לקוחות — הם חייבים לנו (חובה)."],
  ["שוכחים מלאי סגירה", "בלי מלאי סגירה כל הקניות נראות כהוצאה, והרווח יוצא נמוך מדי."],
  ["מעבירים חשבון תוצאתי לשנה הבאה", "הכנסות והוצאות מתחילות כל שנה מאפס; רק התוצאה עוברת לעודפים."],
  ["רושמים הוצאה של השנה רק כשמשלמים", "בסיס מצטבר: שכר דצמבר שייך לדצמבר גם אם ישולם בינואר."],
  ["רושמים צ׳ק דחוי כמזומן", "עד יום הפירעון הכסף לא זז: צ׳ק שקיבלנו — לקוחות; צ׳ק שנתנו — ספקים או זכאים."],
  ["רושמים הכנסה שוב כשהצ׳ק נפרע", "ההכנסה נרשמה ביום המכירה. ביום הפירעון רק החוב נסגר מול המזומן."],
  ["מחשבים חוזה ישן מתחילת החוזה", "בחוזה ישן היתרה במאזן הבוחן היא של סוף השנה הקודמת. מעבירים רק את החלק של השנה."],
  ["מחלקים ב-12 כשנרשמו 11 חודשים", "חודש רגיל = מה שנרשם ÷ מספר החודשים שנרשמו. רק אז מתקנים את החודש החריג."],
  ["מתייחסים לריבית חצי שנתית כשנתית", "קוראים לאיזו תקופה השיעור. ריבית חצי שנתית לשנה שלמה — פעמיים."],
  ["מפרישים לפני שמתקנים את הלקוחות", "ההפרשה היא אחוז מהלקוחות. קודם כל תיקון שמשנה אותם, ורק אז מחשבים."],
];

const FAQ: [string, string][] = [
  ["למה ימין הוא חובה?", "זו מוסכמה של הרישום: בכרטיס T החובה מימין והזכות משמאל. מה שחשוב הוא העיקרון — מה שנכנס לעסק בחובה, מה שיצא ממנו בזכות."],
  ["חובה זה דבר רע?", "לא. 'חובה' היא רק שם של צד. מזומן בחובה הוא דבר טוב — זה כסף שיש לעסק."],
  ["למה עודפים יכולים להיות בחובה?", "כשהעסק הפסיד לאורך השנים יותר משהרוויח, היתרה עוברת לחובה. קוראים לזה הפסדים צבורים."],
  ["מה ההבדל בין מאזן למאזן בוחן?", "מאזן בוחן הוא כלי עבודה פנימי עם כל היתרות. המאזן הוא דוח, עם החשבונות המאזניים בלבד."],
  ["אם מאזן הבוחן מאוזן — אין טעויות?", "לא בהכרח. פקודה שלמה בחשבון הלא נכון, או פקודה שנשכחה, לא יפריעו לאיזון. האיזון תופס רק טעויות חד-צדדיות."],
  ["למה הוצאות מראש הן נכס?", "כי שילמתם על משהו שעוד תקבלו — חודשי ביטוח או שימוש. זה ערך שיש לעסק."],
  ["למה צ׳ק שחזר מחזיר את הלקוח, ולא מבטל את המכירה?", "הסחורה נמסרה — המכירה קרתה. רק הגבייה נכשלה, ולכן מבטלים רק את פקודת הפירעון: ח׳ לקוחות / ז׳ מזומן."],
  ["איך יודעים מהמאזן אם חוזה ישן?", "יש יתרת ״מראש״ ואין שורת הוצאה או הכנסה של אותו נושא: השנה עוד לא נרשם כלום, והיתרה של סוף השנה הקודמת."],
  ["צ׳ק דחוי מלקוח: ״לקוחות״ או ״שיקים לגבייה״?", "בקורס הזה — לקוחות: עד הפירעון הלקוח חייב לנו. יש מקומות שמנהלים חשבון נפרד בשם שיקים לגבייה; העיקרון זהה — נכס עד שהכסף נכנס."],
];

/** The sheet's columns, in order: what each one holds. */
const COLUMNS: [string, string][] = [
  ["לפני התאמות", "מאזן הבוחן כפי שמקבלים אותו בשאלה."],
  ["התאמות", "פקודות ההתאמה, כל חשבון בשורה שלו. חשבון חדש — בשורה חדשה."],
  ["מאזן בוחן סופי", "לכל חשבון: לפני + התאמות, בצד הנכון."],
  ["תוצאתי", "הכנסות והוצאות — מהן הרווח."],
  ["מאזני", "נכסים, התחייבויות והון — עם עודפי הסגירה."],
];

export const FINAL_SCREENS: Record<string, ScreenContent> = {
  worksheet: {
    lead: "גיליון רב-טורי מוביל, בטבלה אחת, ממאזן הבוחן לפני ההתאמות ועד רווח השנה ויתרת העודפים בסוף השנה.",
    body: (
      <>
        <p>כל מה שלמדנו עד עכשיו נועד להגיע לרגע הזה: מרכזים הכול בגיליון אחד. העמודות שלו, לפי הסדר:</p>
        <ol className="max-w-[70ch] space-y-1.5">
          {COLUMNS.map(([title, what], i) => (
            <li key={title} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span>
                <strong className="text-fg">{title}</strong> — {what}
              </span>
            </li>
          ))}
        </ol>
        <p>
          <strong>מה מקבלים בשאלה:</strong> מאזן בוחן לפני התאמות, ורשימת עובדות — מה קרה ומה לא נרשם. <strong>מה מבקשים:</strong> לבנות את הגיליון, ולהגיע לרווח השנה
          ולעודפי הסגירה.
        </p>
        <Remember>מאזן בוחן לפני התאמות + התאמות = מאזן בוחן סופי. ממנו: תוצאתי ← רווח השנה; מאזני ← עם עודפי הסגירה, מאוזן.</Remember>
      </>
    ),
  },

  "ws-question": {
    body: (
      <Given title={`נתון: ${RIMON.name} — מאזן בוחן ליום ${RIMON.date}, לפני פקודות התאמה`} asks={<>גיליון רב-טורי ליום {RIMON.date}, רווח השנה ועודפי הסגירה.</>}>
        <div className="space-y-4">
          <TBTable tb={trialBalance(RIMON.preliminary)} caption="מאזן בוחן לפני התאמות" />
          <div>
            <p className="mb-1.5 font-bold">מידע נוסף לסוף השנה:</p>
            <ol className="space-y-1.5">
              {RIMON.items.map((it) => (
                <li key={it.entry.id} className="flex gap-2 rounded-lg bg-surface px-3 py-2 text-[14.5px]">
                  <span className="font-bold text-amber-700 dark:text-amber-400">{it.entry.id}.</span>
                  <span>{it.story}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Given>
    ),
  },

  "ws-solve": {
    lead: `פותרים את השאלה של ${RIMON.name}: קודם מעתיקים את מאזן הבוחן, אחר כך פקודת התאמה אחת בכל צעד — ובסוף מפצלים ומגיעים לרווח.`,
    body: <WorksheetWalk c={RIMON} />,
  },

  "ws-game": {
    lead: `עכשיו תורכם, עם חברה חדשה — ${SIGAL.name}. ממיינים את המאזן הראשוני (אפשר נגד השעון), רושמים ומשבצים כל פקודת התאמה, ומגיעים לרווח השנה.`,
    body: <WorksheetGame c={SIGAL} />,
  },

  "ws-game-hard": {
    lead: `אותו משחק, ברמה של בחינה — ${ZAYIT.name}: יתרה אחת במאזן לא נתונה, פקודה מורכבת, פקודת תיקון, ונתונים שצריך לחשב לפני שרושמים. ובסוף — גם רווח השנה וגם עודפי הסגירה.`,
    body: <WorksheetGame c={ZAYIT} />,
  },
  "ws-exam": {
    lead: `השאלה המסכמת של הקורס, ברמת בחינה — ${ALMOG.name}: שלוש יתרות חסרות, חוזים שמתחדשים ונגמרים, תיקונים, הפסדי אשראי ומלאי. כל נושא בקורס, בשאלה אחת. פתרו כל שלב לבד, ורק אז פתחו.`,
    body: (
      <>
        <Given title={`נתון: ${ALMOG.name} — מאזן בוחן ראשוני ליום ${ALMOG.date}`} asks={<>השלמת שלוש היתרות החסרות, פקודות התאמה ותיקון, מאזן בוחן סופי, רווח השנה ועודפי הסגירה.</>}>
          <ExamGiven />
        </Given>
        <ol className="list-decimal space-y-1.5 ps-5 text-[15px] marker:font-bold marker:text-accent">
          {ALMOG.story.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
        <Stepper
          label={`${ALMOG.name} · הפתרון, שלב אחר שלב`}
          steps={[
            {
              title: "שלב 1 · שלוש היתרות החסרות",
              body: (
                <Reveal prompt="חשבו את שלוש היתרות החסרות: ביטוח מראש, פרסום מראש, ועודפים. רמז: העודפים — אחרונים." label="הצגת הפתרון">
                  <Calc result={<Money v={ALMOG.found.insurance} />}>
                    ביטוח: מחזורים 2020–21, 2022–23, 2024–25. ב-1.1.2024 שולמו 108,000; אחרי 2024 נשארו 12 חודשים × 4,500
                  </Calc>
                  <Calc result={<Money v={ALMOG.found.ads} />}>
                    פרסום: 84,000 ÷ 24 = 3,500 לחודש. ב-2024 נוצלו 8 חודשים; נשארו 16 × 3,500
                  </Calc>
                  <Calc result={<Money v={ALMOG.found.retained} />}>עודפים: ההפרש שמאזן את מאזן הבוחן — בזכות</Calc>
                  <Rule>את העודפים אפשר למצוא רק אחרי שתי היתרות האחרות: הם ההפרש של כל הטבלה.</Rule>
                </Reveal>
              ),
            },
            ...ALMOG.entries.map((x, i) => ({ title: `שלב 2 · פקודה ${x.id}: ${x.text}`, body: <TryFirst entries={ALMOG.entries} at={i} opening={ALMOG.preliminary} /> })),
            {
              title: "שלב 3 · מאזן בוחן סופי, רווח ועודפים",
              body: (
                <Reveal prompt="בנו את מאזן הבוחן הסופי, וחשבו את רווח 2025 ואת עודפי הסגירה." label="הצגת מאזן הבוחן והתוצאה">
                  <ExamResult />
                </Reveal>
              ),
            },
          ]}
        />
        <Remember>ארבע מלכודות בשאלה: ההפרשה אחרי התיקון והמחיקה · ריבית חצי שנתית · השכירות שנגמרה מתאפסת · העודפים — רק אחרי שאר היתרות.</Remember>
      </>
    ),
  },
};

const EXAM_FINAL = balancesOf(ledger(ALMOG.entries, ALMOG.preliminary));
const EXAM_S = statements(EXAM_FINAL);

/** Almog's trial balance as the question gives it, with its three missing balances. */
function ExamGiven() {
  const rows: [string, number | null][] = [...Object.entries(ALMOG.given), ...ALMOG.unknowns.map((u) => [u, null] as [string, null])];
  return (
    <ul className="grid gap-x-6 text-[14px] sm:grid-cols-2">
      {rows.map(([a, v]) => (
        <li key={a} className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
          <span>{a}</span>
          {v === null ? <span className="rounded bg-amber-500/15 px-2 font-bold text-amber-600 dark:text-amber-400">?</span> : <Money v={Math.abs(v)} plain />}
        </li>
      ))}
    </ul>
  );
}

function ExamResult() {
  return (
    <div className="space-y-3">
      <TBTable tb={trialBalance(EXAM_FINAL)} caption={`מאזן בוחן סופי · ${ALMOG.name} · ${ALMOG.date}`} kind />
      <Calc result={<Money v={EXAM_S.profit} />}>
        רווח 2025: הכנסות <Money v={EXAM_S.totalIncome} /> − הוצאות <Money v={EXAM_S.totalExpenses} />
      </Calc>
      <Calc result={<Money v={EXAM_S.equity.find(([a]) => a === "עודפים")![1]} />}>
        עודפי סגירה: <Money v={ALMOG.found.retained} /> + <Money v={EXAM_S.profit} />
      </Calc>
    </div>
  );
}


/** The course's reference: a one-page cheat sheet (printable), the glossary, common mistakes and questions. */
export function BasicsReference() {
  return (
        <Tabs
          label="כלי עזר"
          tabs={[
            {
              id: "sheet",
              label: "גיליון עזר",
              content: (
                <section id="cheatsheet" className="card print-sheet p-4" aria-labelledby="cheatsheet-title">
                  <div className="flex items-center gap-3">
                    <h3 id="cheatsheet-title" className="me-auto text-base font-semibold text-fg">
                      גיליון עזר — עמוד אחד
                    </h3>
                    <PrintButton icon={<Printer className="h-4 w-4" />} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <Sheet title="מהי חשבונאות">קרה משהו בעסק ← מתרגמים אותו לפקודה ← מהפקודות בונים את הדוחות.</Sheet>
                    <Sheet title="הדרך לדוחות">כל אירוע בפקודה; כל חשבון בכרטיס; כל היתרות בטבלה אחת; ומהטבלה — שני הדוחות.</Sheet>
                    <Sheet title="כלל הזהב">מה שנכנס לעסק — חובה · מה שיצא ממנו — זכות · סך החובה = סך הזכות.</Sheet>
                    <Sheet title="חמשת הסוגים">נכסים והוצאות — גדלים בחובה. התחייבויות, הון והכנסות — גדלים בזכות.</Sheet>
                    <Sheet title="הזהות">נכסים = התחייבויות + הון.</Sheet>
                    <Sheet title="יתרת סגירה">סך חובה מול סך זכות; היתרה בצד הגדול, בגובה ההפרש.</Sheet>
                    <Sheet title="מאזני / תוצאתי">מאזני ממשיך לשנה הבאה. תוצאתי מתאפס בכל 1.1, והרווח עובר לעודפים.</Sheet>
                    <Sheet title="עודפים">פתיחה + רווח (− הפסד) = סגירה. חברה חדשה: פתיחה 0. יתרה בחובה = הפסדים צבורים.</Sheet>
                    <Sheet title="חשבונות חתך">הוצאות מראש והכנסות לקבל — נכסים. הוצאות לשלם והכנסות מראש — התחייבויות.</Sheet>
                    <Sheet title="עלות המכר">מלאי פתיחה + קניות − מלאי סגירה. המלאי — בנמוך מבין עלות לשווי מימוש נטו.</Sheet>
                    <Sheet title="צ׳קים">צ׳ק מזומן = מזומן. צ׳ק דחוי = לקוחות / ספקים עד הפירעון. צ׳ק שחזר = פקודה הפוכה, ועמלה — הוצאה.</Sheet>
                    <Sheet title="מקדמה בחלק מעסקה">צד אחד — העסקה כולה. בצד השני — שורה לכל אופן תשלום.</Sheet>
                    <Sheet title="מאזן בוחן ראשוני">תיקון = צריך − נרשם. ״מראש״ בלי שורה תוצאתית = חוזה ישן, יתרה של סוף השנה הקודמת.</Sheet>
                    <Sheet title="חוזים וריבית">יתרת מראש = תשלום לחודש × חודשים שנשארו. ריבית = קרן × שיעור × חודשים ÷ חודשי תקופת השיעור.</Sheet>
                  </div>
                </section>
              ),
            },
            { id: "glossary", label: "מילון", content: <Glossary /> },
            {
              id: "mistakes",
              label: "טעויות נפוצות",
              content: (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {MISTAKES.map(([wrong, right]) => (
                    <li key={wrong} className="rounded-xl border border-line bg-surface p-3 text-sm">
                      <span className="font-semibold text-danger">✗ {wrong}</span>
                      <span className="mt-0.5 block text-fg/85">✓ {right}</span>
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              id: "faq",
              label: "שאלות נפוצות",
              content: (
                <div className="card divide-y divide-line px-4">
                  {FAQ.map(([q, a]) => (
                    <details key={q} className="group py-2.5">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                        <span className="me-1 inline-block text-accent transition-transform group-open:-rotate-90">‹</span> {q}
                      </summary>
                      <p className="mt-1.5 text-sm text-fg/85">{a}</p>
                    </details>
                  ))}
                </div>
              ),
            },
          ]}
        />
  );
}

function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-xs font-semibold text-accent">{title}</p>
      <p className="mt-1 text-fg">{children}</p>
    </div>
  );
}
