import { Banknote } from "lucide-react";
import { ACCRUAL, balancesOf, costOfSales, creditLoss, creditLossEntries, type Entry, ledger, MIA, RONEN, round2, statements, trialBalance, TZAAD } from "@/lib/learn/basics";
import type { ScreenContent } from "@/components/study-mode/shell";
import { cn } from "@/lib/utils";
import { Posted, TBox } from "./t-accounts";
import { Calc, KeyCard, Money, Rule, StatementsView, type Step, Stepper, TBTable } from "./ui";

const RONEN_FINAL = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
const RONEN_S = statements(RONEN_FINAL);
const TZAAD_C = creditLoss(TZAAD);
const TZAAD_ENTRIES = creditLossEntries(TZAAD);
const TZAAD_OPEN = { לקוחות: TZAAD.openingCustomers, "הפרשה להפסדי אשראי חזויים": -TZAAD.openingAllowance };
const tzaadCard = (account: string, upto: number) => ledger(TZAAD_ENTRIES.slice(0, upto), TZAAD_OPEN).find((t) => t.account === account)!;
const f = (v: number) => v.toLocaleString("he-IL");
const pct = (r: number) => `${round2(r * 100)}%`;
// Two illustrative net realisable values for Mia's closing stock: one above its cost, one below.
const MIA_NRV_HIGH = 330_000;
const MIA_NRV_LOW = 300_000;
const MIA_ENTRY: Entry = {
  id: "מלאי",
  date: "31.12.2020",
  text: "רישום מלאי הסגירה",
  lines: [
    { account: "מלאי סגירה מאזני", dr: Math.min(MIA.closing, MIA_NRV_HIGH) },
    { account: "מלאי סגירה רווח או הפסד", cr: Math.min(MIA.closing, MIA_NRV_HIGH) },
  ],
};

type Segment = { months: number; label: string; year: "this" | "next" };

/** Months as a bar: this year's share of the period, and what belongs to next year; the coin marks when cash moves. */
function Timeline({ segments, cash, cashAt }: { segments: Segment[]; cash: string; cashAt: "start" | "end" }) {
  const total = segments.reduce((s, x) => s + x.months, 0);
  return (
    <div aria-label={`ציר זמן: ${segments.map((s) => `${s.label} ${s.months} חודשים`).join(", ")}; ${cash}`}>
      <div className={cn("mb-1 flex items-center gap-1 text-xs font-medium text-accent", cashAt === "end" && "justify-end")}>
        <Banknote className="h-3.5 w-3.5" aria-hidden /> {cash}
      </div>
      <div className="flex h-8 overflow-hidden rounded-lg ring-1 ring-line" dir="rtl">
        {segments.map((s, i) => (
          <div
            key={i}
            className={cn(
              "grid min-w-0 place-items-center truncate px-1 text-[11px] font-semibold",
              s.year === "this" ? "bg-accent text-accent-fg" : "bg-[repeating-linear-gradient(45deg,var(--surface-2)_0_6px,transparent_6px_12px)] text-muted",
            )}
            style={{ width: `${(s.months / total) * 100}%` }}
          >
            {s.label} · {s.months} ח׳
          </div>
        ))}
      </div>
    </div>
  );
}

/** One cut-off case: how it differs from the one before, the story, the sum written out, and the adjustment with its cards. */
function CutoffStep({ diff, story, timeline, calc, entries }: { diff: React.ReactNode; story: React.ReactNode; timeline: React.ReactNode; calc: React.ReactNode; entries: Entry[] }) {
  return (
    <>
      <p className="rounded-lg bg-fg/[0.04] px-3 py-2 text-[14px] text-fg">
        <span className="me-1.5 rounded-md bg-fg px-1.5 py-0.5 text-[11px] font-bold text-surface">במה שונה</span>
        {diff}
      </p>
      <p>{story}</p>
      {timeline}
      {calc}
      <Posted entries={entries} at={entries.length - 1} title="פקודת ההתאמה" />
    </>
  );
}

const MATRIX: { row: string; cells: [string, string, "נכס" | "התחייבות"][] }[] = [
  { row: "הוצאות", cells: [["מראש", "הוצאות מראש", "נכס"], ["עוד לא", "הוצאות לשלם", "התחייבות"]] },
  { row: "הכנסות", cells: [["מראש", "הכנסות מראש", "התחייבות"], ["עוד לא", "הכנסות לקבל", "נכס"]] },
];

// The three walkthroughs: the four cut-off accounts, Ronen at year end, and Tzaad's credit losses.
const A = ACCRUAL;
const R = A.results;
const cutoff: Step[] = [
  {
    title: "1. הוצאות מראש — נכס",
    body: (
      <CutoffStep
        diff="הראשון: הכסף יצא לפני שנהנינו."
        story={
          <>
            ב-1.10 שילמנו <Money v={A.prepaid.paid} /> על ביטוח לשנה, ורשמנו הכול כהוצאה. אבל רק חלק מהשנה הזו עבר.
          </>
        }
        timeline={<Timeline cash="תשלום ב-1.10" cashAt="start" segments={[{ months: 3, label: "השנה", year: "this" }, { months: 9, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <>
            <Calc>
              השנה עברו 3 חודשים: 3/12 × <Money v={A.prepaid.paid} /> = <strong><Money v={A.prepaid.paid - R.prepaid} /></strong> הוצאה השנה. 9/12 × <Money v={A.prepaid.paid} /> ={" "}
              <strong><Money v={R.prepaid} /></strong> הוצאה מראש לשנה הבאה.
            </Calc>
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.08] px-3 py-2 text-[13.5px]">
              <strong>הכול תלוי בנתונים:</strong> אילו התשלום נרשם מלכתחילה כהוצאה מראש, הפקודה הייתה הפוכה — מעבירים 300 להוצאה. תמיד בודקים קודם מה כבר נרשם.
            </p>
          </>
        }
        entries={A.entries.prepaid}
      />
    ),
  },
  {
    title: "2. הוצאות לשלם — התחייבות",
    body: (
      <CutoffStep
        diff="ההפך מהקודם: כבר נהנינו, והכסף עוד לא יצא."
        story={
          <>
            העובדים עבדו כל השנה. שכר ינואר עד נובמבר, <Money v={A.accrued.recorded} />, שולם ונרשם. שכר דצמבר ישולם רק ב-5 בינואר — ולא נרשם.
          </>
        }
        timeline={<Timeline cash="תשלום דצמבר ב-5.1" cashAt="end" segments={[{ months: 11, label: "ינואר–נובמבר · נרשם", year: "this" }, { months: 1, label: "דצמבר · חסר", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.accrued} />}>
            שכר לחודש: <Money v={A.accrued.recorded} /> ÷ 11 = <Money v={A.accrued.recorded / 11} />. חסר חודש אחד (דצמבר): <Money v={A.accrued.recorded / 11} /> × 1
          </Calc>
        }
        entries={A.entries.accrued}
      />
    ),
  },
  {
    title: "3. הכנסות מראש — התחייבות",
    body: (
      <CutoffStep
        diff="המראה של הוצאות מראש, בצד ההכנסות: הכסף נכנס לפני שנתנו את השירות."
        story={
          <>
            ב-1.11 קיבלנו <Money v={A.unearned.received} /> שכירות מחסן לחצי שנה, ורשמנו הכול כהכנסה. עד שנספק את החודשים הנותרים — אנחנו חייבים אותם לשוכר.
          </>
        }
        timeline={<Timeline cash="תקבול ב-1.11" cashAt="start" segments={[{ months: 2, label: "השנה", year: "this" }, { months: 4, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc>
            השנה עברו 2 חודשים: 2/6 × <Money v={A.unearned.received} /> = <strong><Money v={A.unearned.received - R.unearned} /></strong> הכנסה השנה. 4/6 ×{" "}
            <Money v={A.unearned.received} /> = <strong><Money v={R.unearned} /></strong> הכנסה מראש.
          </Calc>
        }
        entries={A.entries.unearned}
      />
    ),
  },
  {
    title: "4. הכנסות לקבל — נכס",
    body: (
      <CutoffStep
        diff="המראה של הוצאות לשלם: כבר הרווחנו, והכסף עוד לא נכנס."
        story={
          <>
            ב-1.7 הלווינו לעובד <Money v={A.receivable.loan} /> בריבית שנתית של {pct(A.receivable.rate)}. הריבית תשולם רק ב-30.6 בשנה הבאה, ולא נרשם דבר.
          </>
        }
        timeline={<Timeline cash="ריבית תתקבל ב-30.6" cashAt="end" segments={[{ months: 6, label: "השנה · הורווחה", year: "this" }, { months: 6, label: "שנה הבאה", year: "next" }]} />}
        calc={
          <Calc result={<Money v={R.receivable} />}>
            <Money v={A.receivable.loan} /> × {pct(A.receivable.rate)} × 6/12
          </Calc>
        }
        entries={A.entries.receivable}
      />
    ),
  },
];

const ronen: Step[] = [
  {
    title: "הנתונים: מאזן בוחן ראשוני ליום 31.12.2017",
    body: (
      <>
        <TBTable tb={trialBalance(RONEN.preliminary)} />
        <p className="text-[14.5px] text-muted">
          העודפים בחובה: הפסדים צבורים של <Money v={RONEN.preliminary["עודפים"]} /> — היתרה של 1.1.2017. לכל סעיף שואלים: מה נרשם, ומה היה צריך להירשם?
        </p>
      </>
    ),
  },
  ...RONEN.items.map((it, i) => ({
    title: `${it.entry.id}. ${it.title}`,
    body: (
      <>
        <p>{it.story}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-muted">מה נרשם</span>
            {it.recorded}
          </p>
          <p className="rounded-lg border border-accent/30 bg-accent-soft/60 px-3 py-2 text-[14px]">
            <span className="mb-0.5 block text-[11px] font-bold text-accent">מה צריך להיות</span>
            {it.should}
          </p>
        </div>
        <Posted entries={RONEN.adjustments} at={i} opening={RONEN.preliminary} openingLabel="יתרה" />
      </>
    ),
  })),
  {
    title: "התוצאה: מאזן בוחן מתוקן ודוחות",
    body: (
      <>
        <TBTable tb={trialBalance(RONEN_FINAL)} caption="מאזן בוחן מתוקן ליום 31.12.2017" kind />
        <StatementsView s={RONEN_S} year="2017" />
        <Rule>
          רווח 2017: <Money v={RONEN_S.profit} />. העודפים: מהפסדים צבורים של <Money v={RONEN.preliminary["עודפים"]} /> ל-
          <Money v={-RONEN_S.equity.find(([a]) => a === "עודפים")![1]} /> (חובה).
        </Rule>
      </>
    ),
  },
];

const tzaad: Step[] = [
  {
    title: "הנתונים — ומה מחפשים",
    body: (
      <>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {(
            [
              ["לקוחות ב-1.1.2025", TZAAD.openingCustomers],
              ["הפרשה ב-1.1.2025", TZAAD.openingAllowance],
              ["מכירות באשראי בשנה", TZAAD.creditSales],
              ["גבייה מלקוחות", TZAAD.collections],
              ["חוב אבוד (לקוח שנעלם)", TZAAD.badDebt],
            ] as [string, number][]
          ).map(([t, v]) => (
            <li key={t} className="flex justify-between gap-2 rounded-lg bg-surface-2/70 px-3 py-1.5 text-[14.5px]">
              <span>{t}</span>
              <Money v={v} className="font-semibold" />
            </li>
          ))}
          <li className="flex justify-between gap-2 rounded-lg bg-surface-2/70 px-3 py-1.5 text-[14.5px]">
            <span>שיעור הלקוחות שלא ישלמו</span>
            <span className="font-semibold">{pct(TZAAD.rate)}</span>
          </li>
        </ul>
        <KeyCard>מחפשים: כמה הוצאות הפסדי אשראי תרשום החנות ב-2025?</KeyCard>
      </>
    ),
  },
  ...TZAAD_ENTRIES.slice(0, 3).map((x, i) => ({
    title: `${x.id}. ${x.text}${i === 2 ? " — בלי הוצאה" : ""}`,
    body: (
      <>
        <p className="text-[14px] text-muted">
          <strong className="text-fg">מאיפה: </strong>
          {["\"מכרה בהקפה\" — הלקוחות גדלים.", "\"גבתה מהלקוחות\" — הלקוחות קטנים, המזומן גדל.", "ההפסד כבר נחזה בהפרשה, ולכן מוחקים את החוב כנגדה — לא כנגד הוצאה."][i]}
        </p>
        <Posted entries={TZAAD_ENTRIES} at={i} opening={TZAAD_OPEN} title="פקודת היומן" note={null} />
      </>
    ),
  })),
  {
    title: "יתרת הלקוחות בסוף השנה — מתוך הכרטיס",
    body: (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-start">
        <TBox t={tzaadCard("לקוחות", 3)} totals />
        <div className="space-y-2">
          <Calc result={<Money v={TZAAD_C.customers} />}>
            {f(TZAAD.openingCustomers)} + {f(TZAAD.creditSales)} − {f(TZAAD.collections)} − {f(TZAAD.badDebt)}
          </Calc>
          <p className="text-[14.5px]">היתרה היא הנעלם שסוגר את הכרטיס: הפרש שני הצדדים.</p>
        </div>
      </div>
    ),
  },
  {
    title: "כמה הפרשה צריכה להיות ב-31.12?",
    body: (
      <>
        <Calc result={<Money v={TZAAD_C.required} />}>
          לקוחות <Money v={TZAAD_C.customers} /> (מהצעד הקודם) × {pct(TZAAD.rate)}
        </Calc>
        <p className="text-[14.5px]">זו יתרת הסגירה שחייבת להיות בכרטיס ההפרשה.</p>
      </>
    ),
  },
  {
    title: "מה כבר יש בהפרשה — ומה חסר?",
    body: (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:items-start">
        <TBox t={tzaadCard("הפרשה להפסדי אשראי חזויים", 3)} totals />
        <div className="space-y-2">
          <Calc result={<Money v={TZAAD_C.before} />}>
            יש: פתיחה {f(TZAAD.openingAllowance)} − חוב אבוד {f(TZAAD.badDebt)}
          </Calc>
          <Calc result={<Money v={TZAAD_C.expense} />}>
            חסר: נדרש {f(TZAAD_C.required)} − יש {f(TZAAD_C.before)}
          </Calc>
          <p className="text-[14.5px]">מה שחסר — זו ההוצאה של השנה.</p>
        </div>
      </div>
    ),
  },
  {
    title: `${TZAAD_ENTRIES[3].id}. ${TZAAD_ENTRIES[3].text}`,
    body: <Posted entries={TZAAD_ENTRIES} at={3} opening={TZAAD_OPEN} title="פקודת ההתאמה" note={`עכשיו בהפרשה ${f(TZAAD_C.required)} — בדיוק הנדרש.`} />,
  },
  {
    title: "במאזן: לקוחות נטו",
    body: (
      <>
        <Calc result={<Money v={TZAAD_C.net} />}>
          לקוחות <Money v={TZAAD_C.customers} /> − הפרשה <Money v={TZAAD_C.required} />
        </Calc>
        <Rule>
          הוצאה = ההפרשה הנדרשת − מה שכבר יש בה. כאן: {f(TZAAD_C.required)} − {f(TZAAD_C.before)} = {f(TZAAD_C.expense)}.
        </Rule>
      </>
    ),
  },
];

export const ADJUST_SCREENS: Record<string, ScreenContent> = {
  accrual: {
    lead: "הכנסה או הוצאה שייכות לשנה שבה נהנו מהן, לא לשנה שבה זז הכסף. כשהכסף זז בשנה אחרת, מתקנים בסוף השנה — ונוצרים חשבונות שממשיכים איתנו לשנה הבאה.",
    body: (
      <>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] text-center text-[12px] font-bold text-muted">
            <span className="bg-surface-2/70 py-2" />
            <span className="bg-surface-2/70 py-2">הכסף זז מראש</span>
            <span className="bg-surface-2/70 py-2">הכסף עוד לא זז</span>
          </div>
          {MATRIX.map((m) => (
            <div key={m.row} className="grid grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] border-t border-line">
              <span className="grid place-items-center bg-surface-2/40 text-[13px] font-bold text-fg">{m.row}</span>
              {m.cells.map(([, name, kind]) => (
                <span key={name} className="border-s border-line px-2 py-2.5 text-center">
                  <span className="block text-[14.5px] font-bold text-fg">{name}</span>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2 py-px text-[11px] font-semibold", kind === "נכס" ? "bg-debit/10 text-debit" : "bg-credit/10 text-credit")}>{kind}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <Stepper label="ארבעת חשבונות החתך" steps={cutoff} />
      </>
    ),
  },

  ronen: {
    lead: "דוגמה מלאה: חברת רונן בע״מ, 31.12.2017. מקבלים מאזן בוחן ראשוני, ולכל סעיף שואלים: מה נרשם, ומה היה צריך להירשם? ההפרש — זו פקודת ההתאמה.",
    body: <Stepper label="רונן · 31.12.2017" steps={ronen} />,
  },

  inventory: {
    lead: "מה שלא נמכר עד סוף השנה אינו הוצאה של השנה: סופרים אותו, מוציאים אותו מהעלות, ורושמים אותו כנכס.",
    body: (
      <>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border-2 border-accent/40 bg-surface p-4" role="math" aria-label="עלות המכר שווה מלאי פתיחה ועוד קניות פחות מלאי סגירה">
            <p className="text-[18px] font-extrabold text-fg">עלות המכר =</p>
            <ul className="mt-2 space-y-1.5 text-[15.5px]">
              {(
                [
                  ["", "יתרת פתיחה מלאי", MIA.opening],
                  ["+", "קניות השנה", MIA.purchases],
                  ["−", "מלאי סגירה", MIA.closing],
                ] as [string, string, number][]
              ).map(([op, t, v]) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="w-5 text-center text-lg font-bold text-accent">{op}</span>
                  <span className="flex-1 font-medium text-fg">{t}</span>
                  <Money v={v} plain className="text-muted" />
                </li>
              ))}
            </ul>
            <p className="mt-2 flex items-center gap-2 border-t-2 border-fg/70 pt-2 font-bold">
              <span className="w-5" />
              <span className="flex-1">עלות המכר במיה, 2020</span>
              <Money v={costOfSales(MIA)} plain />
            </p>
          </div>
          <div className="space-y-2">
            <KeyCard>מלאי הסגירה נמדד לפי הנמוך מבין העלות לבין שווי המימוש נטו.</KeyCard>
            <p className="text-[14.5px]">
              שווי מימוש נטו = מה שנקבל במכירה, פחות מה שיעלה למכור. במיה העלות <Money v={MIA.closing} />:
            </p>
            <ul className="space-y-1 text-[14px]">
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                שווי מימוש <Money v={MIA_NRV_HIGH} /> ← רושמים <strong><Money v={Math.min(MIA.closing, MIA_NRV_HIGH)} /></strong> (העלות)
              </li>
              <li className="rounded-lg bg-surface-2/70 px-3 py-1.5">
                אילו היה <Money v={MIA_NRV_LOW} /> ← היינו רושמים <strong><Money v={Math.min(MIA.closing, MIA_NRV_LOW)} /></strong>, ועלות המכר הייתה עולה ב-
                <Money v={MIA.closing - MIA_NRV_LOW} />
              </li>
            </ul>
          </div>
        </div>
        <Posted entries={[MIA_ENTRY]} at={0} note="שני חשבונות באותו סכום: הנכס שבמחסן, והקטנת העלות ברווח והפסד. בשנה הבאה זה מלאי הפתיחה." />
      </>
    ),
  },

  creditloss: {
    lead: "חלק מהלקוחות לא ישלמו. כדי שהמאזן לא יציג חוב שלא ייגבה, מפרישים מראש: הוצאה השנה, וחשבון הפרשה שמקטין את הלקוחות.",
    body: (
      <>
        <div className="grid gap-2 md:grid-cols-3">
          {(
            [
              ["ההפרשה הנדרשת", "שיעור × יתרת הלקוחות בסוף השנה"],
              ["ההוצאה", "ההפרשה הנדרשת − מה שכבר יש בה"],
              ["חוב אבוד", "נמחק כנגד ההפרשה (ח׳ הפרשה / ז׳ לקוחות) — בלי הוצאה"],
            ] as [string, string][]
          ).map(([t, d]) => (
            <div key={t} className="rounded-xl border border-line bg-surface p-3">
              <p className="text-sm font-bold text-accent">{t}</p>
              <p className="mt-0.5 text-[14.5px] text-fg">{d}</p>
            </div>
          ))}
        </div>
        <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-[15px]">
          <strong>איך זה מופיע בשאלה:</strong> נותנים יתרות פתיחה, מכירות באשראי, גבייה, חוב אבוד ושיעור. הנעלמים — יתרת הלקוחות בסוף השנה וההוצאה. מוצאים אותם מכרטיסי ה-T: הנעלם
          הוא המספר שסוגר את הכרטיס.
        </p>
        <Stepper label='חנות הנעליים "צעד" · 2025' steps={tzaad} />
      </>
    ),
  },
};
