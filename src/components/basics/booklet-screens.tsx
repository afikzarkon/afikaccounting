import type { ScreenContent } from "@/components/study-mode/shell";
import { trialBalance } from "@/lib/learn/basics";
import { AGAM, GILAD, NEVEH } from "@/lib/learn/basics-booklet";
import { Remember } from "@/components/study-mode/screen-parts";
import { Given } from "./credit";
import { Calc, JE, Money, TBTable } from "./ui";
import { Reveal } from "./year";

const n = (v: number) => Math.round(v).toLocaleString("en-US");
const tb = trialBalance;

/** Booklet-level questions: one at the end of each of lessons 5, 6 and 7, the whole solution behind one button. */
export const BOOKLET_SCREENS: Record<string, ScreenContent> = {
  "adj-booklet": {
    lead: "שאלה ברמת החוברת: שמונה נתונים של חברה אחת, וכל אחד דורש פקודת התאמה. פתרו את כולם, ורק אז פתחו את הפתרון.",
    body: (
      <>
        <Given title={`נתון: ${AGAM.name}, 31.12.2025`} asks="פקודות יומן להתאמת החשבונות ליום 31.12.2025.">
          <ol className="list-decimal space-y-1.5 ps-5">
            {AGAM.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Given>
        <Reveal prompt="כתבו את שמונה הפקודות. לכל נתון: מה נרשם, מה צריך, ומה חסר." label="הצגת הפתרון המלא">
          <div className="grid gap-3 lg:grid-cols-2">
            {AGAM.entries.map((e) => (
              <JE key={e.id} entry={e} />
            ))}
          </div>
          <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[14.5px]">
            <strong>מלכודת נפוצה:</strong> {AGAM.trap}
          </p>
        </Reveal>
        <Remember>לפני כל פקודה שואלים: נרשם כהוצאה או כנכס? כמה חודשים נרשמו? והשיעור לשנה או לחצי שנה?</Remember>
      </>
    ),
  },

  "rev-booklet": {
    lead: "שאלה ברמת החוברת: מאזן בוחן ראשוני עם שתי יתרות חסרות, תיקונים וחוזים. מגיעים עד הרווח ועודפי הסגירה.",
    body: (
      <>
        <Given title={`נתון: ${GILAD.name}, מאזן בוחן ראשוני ליום 31.12.2025`} asks="השלמת היתרות החסרות, פקודות התאמה ותיקון, מאזן בוחן מתוקן (סופי), רווח השנה ועודפי הסגירה.">
          <ul className="divide-y divide-amber-500/20 text-[14.5px]">
            {[...Object.entries(GILAD.given), ...GILAD.unknowns.map((u) => [u, null] as [string, null])].map(([a, v]) => (
              <li key={a} className="flex justify-between gap-3 py-1">
                <span>{a}</span>
                {v === null ? <strong className="text-accent">?</strong> : <Money v={Math.abs(v)} plain />}
              </li>
            ))}
          </ul>
          <p className="pt-1 font-semibold">נתונים נוספים:</p>
          <ol className="list-decimal space-y-1.5 ps-5">
            {GILAD.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Given>
        <Reveal prompt="השלימו את שתי היתרות, רשמו את כל הפקודות, ובנו את מאזן הבוחן המתוקן עד הרווח והעודפים." label="הצגת הפתרון המלא">
          <Calc result={<Money v={GILAD.found.insurance} />}>ביטוח מראש: 48,000 ÷ 24 = 2,000 לחודש. ב-2024 נוצלו 3 חודשים, ונשארו 21 × 2,000</Calc>
          <Calc result={<Money v={GILAD.found.retained} />}>עודפים: ההפרש שמאזן את מאזן הבוחן, בזכות</Calc>
          <div className="grid gap-3 lg:grid-cols-2">
            {GILAD.entries.map((e) => (
              <JE key={e.id} entry={e} />
            ))}
          </div>
          <TBTable tb={tb(GILAD.final)} caption={`מאזן בוחן מתוקן · ${GILAD.name} · 31.12.2025`} kind />
          <Calc result={<Money v={GILAD.profit} />}>רווח 2025: הכנסות פחות הוצאות במאזן הבוחן המתוקן</Calc>
          <Calc result={<Money v={GILAD.closingRetained} />}>
            עודפי סגירה: <Money v={GILAD.found.retained} /> + <Money v={GILAD.profit} />
          </Calc>
          <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[14.5px]">
            <strong>מלכודת נפוצה:</strong> {GILAD.trap}
          </p>
        </Reveal>
        <Remember>סדר העבודה: יתרות ״?״ מהסיפור, אחר כך העודפים כהפרש, פקודות, מאזן בוחן מתוקן, ורק בסוף הרווח והעודפים.</Remember>
      </>
    ),
  },

  "cl-booklet": {
    lead: "שאלה ברמת החוברת: שלוש שנים של לקוחות והפרשה. בכל שנה בונים את כרטיס הלקוחות ואת כרטיס ההפרשה מחדש.",
    body: (
      <>
        <Given title={`נתון: ${NEVEH.name}, 2023 עד 2025`} asks="לכל שנה: יתרת ההפרשה בסוף השנה, הוצאות הפסדי האשראי, והלקוחות נטו במאזן.">
          <ul className="space-y-1 text-[14.5px]">
            {NEVEH.data.map((y) => (
              <li key={y.year} className="rounded-lg bg-surface/60 px-3 py-1.5">
                <strong>{y.year}:</strong> מכירות באשראי {n(y.sales)}, גבייה {n(y.collected)}, {y.written ? `חובות אבודים ${n(y.written)}` : "בלי חובות אבודים"}
              </li>
            ))}
          </ul>
          <ul className="list-disc space-y-1 ps-5">
            {NEVEH.facts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Given>
        <Reveal prompt="לכל שנה: לקוחות בסוף השנה, ההפרשה לפני ההתאמה, ההפרשה הנדרשת, וההוצאה כהפרש ביניהן." label="הצגת הפתרון המלא">
          {NEVEH.years.map((y, i) => (
            <div key={y.year} className="space-y-1.5 rounded-xl border border-line bg-surface p-3 text-[14.5px]">
              <p className="text-[15px] font-bold text-fg">{y.year}</p>
              <p>
                לקוחות: <Money v={y.opening} /> + <Money v={NEVEH.data[i].sales} /> − <Money v={NEVEH.data[i].collected} />
                {NEVEH.data[i].written ? (
                  <>
                    {" "}
                    − <Money v={NEVEH.data[i].written} />
                  </>
                ) : null}{" "}
                = <strong><Money v={y.customers} /></strong>
              </p>
              <p>
                ההפרשה לפני ההתאמה: <Money v={Math.abs(y.allowanceBefore)} />
                {y.allowanceBefore < 0 ? " בחובה (המחיקה גדולה מההפרשה שהייתה)" : y.allowanceBefore > 0 ? " בזכות" : ""}
              </p>
              <p>
                ההפרשה הנדרשת:{" "}
                {NEVEH.data[i].specific ? (
                  <>
                    <Money v={60_000} /> × 50% + (<Money v={y.customers} /> − <Money v={60_000} />) × 5% = <strong><Money v={y.required} /></strong>
                  </>
                ) : (
                  <>
                    <Money v={y.customers} /> × 2% = <strong><Money v={y.required} /></strong>
                  </>
                )}
              </p>
              <p>
                הוצאות הפסדי אשראי: <Money v={y.required} /> {y.allowanceBefore < 0 ? "+" : "−"} <Money v={Math.abs(y.allowanceBefore)} /> = <strong><Money v={y.expense} /></strong>
              </p>
              <p>
                לקוחות נטו: <Money v={y.customers} /> − <Money v={y.required} /> = <strong><Money v={y.net} /></strong>
              </p>
            </div>
          ))}
          <p className="rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[14.5px]">
            <strong>מלכודת נפוצה:</strong> {NEVEH.trap}
          </p>
        </Reveal>
        <Remember>בכל שנה: לקוחות סוף ← הפרשה נדרשת ← מה שיש אחרי המחיקות ← ההוצאה היא ההפרש. יתרת הסגירה של שנה היא הפתיחה של הבאה.</Remember>
      </>
    ),
  },
};
