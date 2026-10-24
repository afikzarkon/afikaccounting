import { ArrowLeft, Banknote } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/study/blocks";
import {
  balancesOf,
  costOfSales,
  creditLoss,
  creditLossEntries,
  CUTOFF,
  type Entry,
  ledger,
  MIA,
  RONEN,
  round2,
  statements,
  trialBalance,
  TZAAD,
} from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { Card, Chapter, EntryView, Money, Rule, StatementsView, TBTable, TCard, Term } from "./ui";

const RONEN_FINAL = balancesOf(ledger(RONEN.adjustments, RONEN.preliminary));
const RONEN_S = statements(RONEN_FINAL);
const TZAAD_C = creditLoss(TZAAD);
const TZAAD_ENTRIES = creditLossEntries(TZAAD);
const TZAAD_LEDGER = ledger(TZAAD_ENTRIES, { לקוחות: TZAAD.openingCustomers, "הפרשה להפסדי אשראי חזויים": -TZAAD.openingAllowance });
const f = (v: number) => v.toLocaleString("he-IL");
const pct = (r: number) => `${round2(r * 100)}%`;

/** One numbered step of the worked example. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-fg">{n}</span>
        {title}
      </p>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

type Segment = { months: number; label: string; year: "this" | "next" };

/** Months as a bar: this year's share of the period, and what belongs to next year; the coin marks when cash moves. */
function Timeline({ segments, cash, cashAt }: { segments: Segment[]; cash: string; cashAt: "start" | "end" }) {
  const total = segments.reduce((s, x) => s + x.months, 0);
  return (
    <div className="my-2" aria-label={`ציר זמן: ${segments.map((s) => `${s.label} ${s.months} חודשים`).join(", ")}; ${cash}`}>
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

const MATRIX: [string, string, string][] = [
  ["צד ההוצאות", "הוצאות מראש — נכס", "הוצאות לשלם — התחייבות"],
  ["צד ההכנסות", "הכנסות לקבל — נכס", "הכנסות מראש — התחייבות"],
];

function CutoffCard({ title, kind, plain, timeline, entry, why }: { title: string; kind: string; plain: string; timeline: React.ReactNode; entry: Entry; why: string }) {
  return (
    <Card
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          <Term he={title} />
          <span className="text-xs font-normal text-muted">{kind}</span>
        </span>
      }
    >
      <p>{plain}</p>
      {timeline}
      <EntryView entry={entry} title={entry.text} note={why} />
    </Card>
  );
}

export function AdjustChapters() {
  return (
    <>
      <Chapter n={12} id="accrual" title="בסיס מצטבר והתאמות סוף שנה" lead="כל הכנסה והוצאה — לשנה שבה באמת נהנו ממנה">
        <p>
          הדוחות מוכנים ל<Term he="תקופה חשבונאית" /> — בדרך כלל שנה. לפי <Term he="עיקרון ההקבלה" />, בכל
          שנה רושמים רק את ההכנסות וההוצאות ששייכות לה, וההוצאות נרשמות יחד עם ההכנסות שבגללן הוצאו. אבל הכסף לא תמיד זז באותה שנה: לפעמים משלמים
          מראש, לפעמים באיחור. בסוף השנה מתקנים את זה בעזרת ארבעה <Term he="חשבונות חתך" /> — כולם מאזניים:
        </p>
        <DataTable head={["", "שילמנו / קיבלנו מראש", "עוד לא שילמנו / קיבלנו"]} rows={MATRIX} />
        <p>
          הפקודה שמוסיפה את מה שחסר נקראת <Term he="פקודת התאמה" />. אם נרשמה פקודה שגויה, רושמים{" "}
          <Term he="פקודת תיקון" /> שמגשרת בין מה שנרשם למה שהיה צריך להירשם.
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <CutoffCard
            title="הוצאות מראש"
           
            kind="נכס"
            plain="שילמנו עכשיו על משהו שנקבל גם בשנים הבאות. החלק של השנים הבאות הוא נכס."
            timeline={<Timeline cash="תשלום 120,000 ב-1.1.2020" cashAt="start" segments={[{ months: 12, label: "2020 — הוצאה", year: "this" }, { months: 12, label: "2021 — מראש", year: "next" }]} />}
            entry={CUTOFF.prepaid}
            why="שנה אחת מתוך שתיים שייכת ל-2020; השנייה עוד לפנינו."
          />
          <CutoffCard
            title="הוצאות לשלם"
           
            kind="התחייבות"
            plain="קיבלנו משהו השנה ועוד לא שילמנו עליו — למשל שכר דצמבר שישולם בינואר, או חשמל שהחשבונית שלו עוד לא הגיעה."
            timeline={<Timeline cash="תשלום ב-5.1.2021" cashAt="end" segments={[{ months: 11, label: "ינואר–נובמבר — נרשם", year: "this" }, { months: 1, label: "דצמבר", year: "this" }]} />}
            entry={CUTOFF.accruedSalary}
            why="העובדים עבדו בדצמבר — ההוצאה של 2020, גם אם הכסף ייצא ב-2021."
          />
          <CutoffCard
            title="הכנסות מראש"
           
            kind="התחייבות"
            plain="קיבלנו כסף עכשיו על משהו שניתן גם בשנים הבאות. עד שניתן אותו — אנחנו חייבים אותו."
            timeline={<Timeline cash="תקבול 120,000 ב-1.1.2019" cashAt="start" segments={[{ months: 12, label: "2019 — הכנסה", year: "this" }, { months: 24, label: "2020–2021 — מראש", year: "next" }]} />}
            entry={CUTOFF.unearned}
            why="שנה אחת מתוך שלוש שייכת ל-2019 — 40,000 לשנה."
          />
          <CutoffCard
            title="הכנסות לקבל"
           
            kind="נכס"
            plain="נתנו משהו השנה ועוד לא קיבלנו עליו כסף — למשל ריבית על הלוואה שנתנו, שתשולם רק בשנה הבאה."
            timeline={<Timeline cash="ריבית תתקבל ב-1.1.2021" cashAt="end" segments={[{ months: 12, label: "2020 — הריבית הורווחה", year: "this" }]} />}
            entry={CUTOFF.accruedInterest}
            why="100,000 × 10% = 10,000 שהורווחו ב-2020, גם אם יתקבלו רק ב-2021."
          />
        </div>
        <EntryView entry={CUTOFF.accruedPower} title={CUTOFF.accruedPower.text} note="גם בלי חשבונית יודעים שהחשמל נצרך בדצמבר — רושמים את ההוצאה לפי הסכום הידוע או אומדן." />

        <h3 className="pt-2 text-lg font-semibold text-fg">דוגמה מלאה: חברת רונן בע&quot;מ, 31.12.2017</h3>
        <p>
          רונן הוקמה ב-2016. זה מאזן הבוחן <strong>הראשוני</strong> שלה — לפני ההתאמות. העודפים (יתרת הפתיחה של 2017) הם בחובה: הפסדים צבורים של{" "}
          <Money v={RONEN.preliminary["עודפים"]} />.
        </p>
        <TBTable tb={trialBalance(RONEN.preliminary)} caption="מאזן בוחן ראשוני ליום 31.12.2017" />
        <p>לכל סעיף שואלים שלוש שאלות: מה קרה? מה נרשם? ומה היה צריך להירשם? הפער — זו פקודת ההתאמה או התיקון.</p>
        <div className="space-y-3">
          {RONEN.items.map((it) => (
            <details key={it.title} className="group card overflow-hidden" open={it.title === "פרסום"}>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 font-semibold text-fg hover:bg-surface-2/50 [&::-webkit-details-marker]:hidden">
                <span className="num grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-xs text-accent">{it.entry.id}</span>
                {it.title}
                <span className="ms-auto text-xs font-normal text-muted group-open:hidden">פתחו</span>
              </summary>
              <div className="space-y-2 border-t border-line px-5 py-4 text-[15px]">
                <p>{it.story}</p>
                <p>
                  <strong className="text-muted">מה נרשם: </strong>
                  {it.recorded}
                </p>
                <p>
                  <strong className="text-muted">מה צריך להיות: </strong>
                  {it.should}
                </p>
                <EntryView entry={it.entry} title={it.entry.text} />
              </div>
            </details>
          ))}
        </div>
        <TBTable tb={trialBalance(RONEN_FINAL)} caption="מאזן בוחן מתוקן ליום 31.12.2017" kind />
        <StatementsView s={RONEN_S} year="2017" />
        <Rule>
          רווח 2017: <Money v={RONEN_S.profit} />. העודפים: מהפסדים צבורים של <Money v={RONEN.preliminary["עודפים"]} /> (חובה) ל-
          <Money v={-RONEN_S.equity.find(([a]) => a === "עודפים")![1]} /> (חובה) — ההפסד המצטבר קטן ברווח השנה.
        </Rule>
      </Chapter>

      <Chapter n={13} id="inventory" title="מלאי סגירה" lead="מה שלא נמכר — לא הוצאה של השנה">
        <p>
          בשיטה של הקורס, כל קנייה של סחורה נרשמת בחשבון קניות. אבל לא כל מה שנקנה נמכר. בסוף השנה סופרים את מה שנשאר במחסן — זה{" "}
          <Term he="מלאי הסגירה" /> — ומוציאים אותו מההוצאות. מה שנשאר בהוצאות הוא <Term he="עלות המכר" />: העלות של
          מה שבאמת נמכר.
        </p>
        <Rule>עלות המכר = מלאי פתיחה + קניות − מלאי סגירה</Rule>
        <Card title='חברת מיה בע"מ, 2020'>
          <DataTable
            head={["", "סכום"]}
            rows={[
              ["מלאי פתיחה (מה שנשאר מ-2019)", MIA.opening],
              ["ועוד קניות השנה (אחרי תיקון מקדמה שנרשמה בטעות כקנייה)", MIA.purchases],
              ["פחות מלאי סגירה (ספירה ב-31.12.2020)", -MIA.closing],
            ]}
            foot={["עלות המכר", costOfSales(MIA)]}
          />
          <EntryView
            entry={{
              id: "מלאי",
              date: "31.12.2020",
              text: "רישום מלאי הסגירה",
              lines: [
                { account: "מלאי סגירה מאזני", dr: MIA.closing },
                { account: "מלאי סגירה רווח או הפסד", cr: MIA.closing },
              ],
            }}
            note="שני חשבונות באותו סכום: אחד מאזני (הנכס שבמחסן), ואחד תוצאתי (שמקטין את עלות הקניות). בשנה הבאה, המלאי הזה יהיה מלאי הפתיחה."
          />
        </Card>
        <Link
          href="/basics/inventory"
          className="group flex items-center gap-4 rounded-xl border-2 border-accent bg-accent-soft px-5 py-4 transition-colors hover:bg-accent-soft/70"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-fg">המדריך המלא למלאי נמצא בעמוד נפרד</span>
            <span className="mt-0.5 block text-sm text-fg/85">
              שם הנושא נלמד מההתחלה, צעד אחר צעד: רישום תקופתי ותמידי, FIFO וממוצעים, שווי מימוש נטו, חילוץ נעלמים — ומחשבון שמראה את כל הדרך.
            </span>
            <span className="mt-1.5 block text-sm font-semibold text-accent">למדריך המלא ←</span>
          </span>
          <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
        </Link>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3 text-[15px] text-fg">
          <strong>שימו לב:</strong> הדוגמה כאן היא דוגמה קצרה לחזרה — למי שכבר עבר על המדריך. אם זו הפעם הראשונה שאתם פוגשים מלאי, התחילו במדריך וחזרו לכאן אחר
          כך.
        </p>
      </Chapter>

      <Chapter n={14} id="creditloss" title="הפסדי אשראי" lead="לא כל לקוח ישלם — וצריך לומר זאת מראש">
        <p>
          כשמוכרים באשראי, חלק מהלקוחות לא ישלמו. כדי שהלקוחות לא יוצגו ביותר ממה שבאמת ייגבה, מעריכים את ההפסד מראש ורושמים{" "}
          <Term he="הפרשה להפסדי אשראי חזויים" /> — חשבון שמקטין את הלקוחות במאזן. שלושה מצבים:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            <strong>הפרשה ספציפית</strong> — ללקוח מסוים שיש סיבה לחשוש לגביו (למשל 80% מהחוב שלו).
          </li>
          <li>
            <strong>הפרשה כללית</strong> — אחוז קבוע מכל שאר הלקוחות.
          </li>
          <li>
            <Term he="חוב אבוד" /> — כשברור שהלקוח לא ישלם (למשל פשט רגל): מוחקים את החוב מהלקוחות כנגד ההפרשה.
          </li>
        </ul>
        <Link
          href="/basics/credit-losses"
          className="group flex items-center gap-4 rounded-xl border-2 border-accent bg-accent-soft px-5 py-4 transition-colors hover:bg-accent-soft/70"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-fg">המדריך המלא להפסדי אשראי נמצא בעמוד נפרד</span>
            <span className="mt-0.5 block text-sm text-fg/85">
              שם הנושא נלמד מההתחלה, צעד אחר צעד: הרעיון, מתווה 3 הכללים, שני כרטיסי T, חילוץ נעלמים, הפרשה ספציפית ושאלה ברמת בחינה.
            </span>
            <span className="mt-1.5 block text-sm font-semibold text-accent">למדריך המלא ←</span>
          </span>
          <ArrowLeft className="h-5 w-5 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
        </Link>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3 text-[15px] text-fg">
          <strong>שימו לב:</strong> הדוגמה כאן היא דוגמה קצרה לחזרה — למי שכבר עבר על המדריך. אם זו הפעם הראשונה שאתם פוגשים הפסדי אשראי, התחילו במדריך וחזרו
          לכאן אחר כך.
        </p>

        <Card title='דוגמה לחזרה: חנות הנעליים "צעד", 2025'>
          <p>
            ב-1.1.2025 הלקוחות של החנות חייבים לה <Money v={TZAAD.openingCustomers} />, ובהפרשה יש <Money v={TZAAD.openingAllowance} />. במהלך השנה החנות מכרה
            בהקפה ב-<Money v={TZAAD.creditSales} />, גבתה מהלקוחות <Money v={TZAAD.collections} />, ולקוח אחד שחייב <Money v={TZAAD.badDebt} /> נעלם — החוב
            אבוד. בסוף השנה החנות מעריכה ש-{pct(TZAAD.rate)} מהלקוחות לא ישלמו. כמה הוצאות הפסדי אשראי תרשום?
          </p>

          <Step n={1} title="רושמים את מה שקרה במהלך השנה">
            <p>שלוש פקודות רגילות. שימו לב לשלישית: מחיקת החוב האבוד לא יוצרת הוצאה — ההפסד הזה כבר נחזה בהפרשה, ולכן מורידים אותו מהלקוחות ומההפרשה יחד.</p>
            <div className="grid gap-3 xl:grid-cols-3">
              {TZAAD_ENTRIES.slice(0, 3).map((x) => (
                <EntryView key={x.id} entry={x} title={`${x.id}. ${x.text}`} />
              ))}
            </div>
          </Step>

          <Step n={2} title="כמה הלקוחות חייבים בסוף השנה?">
            <p>
              מה שהיה, ועוד מה שנמכר בהקפה, פחות מה שנגבה ופחות מה שנמחק: {f(TZAAD.openingCustomers)} + {f(TZAAD.creditSales)} − {f(TZAAD.collections)} −{" "}
              {f(TZAAD.badDebt)} ={" "}
              <strong>
                <Money v={TZAAD_C.customers} />
              </strong>
              .
            </p>
          </Step>

          <Step n={3} title="כמה הפרשה צריכה להיות בסוף השנה?">
            <p>
              {pct(TZAAD.rate)} מהלקוחות לא צפויים לשלם: {f(TZAAD_C.customers)} × {pct(TZAAD.rate)} ={" "}
              <strong>
                <Money v={TZAAD_C.required} />
              </strong>
              . זו יתרת הסגירה של ההפרשה — הסכום שחייב להיות בה ב-31.12.
            </p>
          </Step>

          <Step n={4} title="כמה כבר יש בהפרשה — ומה חסר?">
            <p>
              ההפרשה נפתחה ב-{f(TZAAD.openingAllowance)}, ומחיקת החוב השתמשה ב-{f(TZAAD.badDebt)} ממנה: נשארו <Money v={TZAAD_C.before} />. צריך{" "}
              {f(TZAAD_C.required)}, ולכן משלימים רק את מה שחסר: {f(TZAAD_C.required)} − {f(TZAAD_C.before)} ={" "}
              <strong>
                <Money v={TZAAD_C.expense} />
              </strong>{" "}
              — אלה הוצאות הפסדי האשראי של השנה.
            </p>
            <EntryView entry={TZAAD_ENTRIES[3]} title={`${TZAAD_ENTRIES[3].id}. ${TZAAD_ENTRIES[3].text}`} />
          </Step>

          <p className="text-sm font-semibold text-fg">כך נראים שני הכרטיסים בסוף השנה (י.פ = יתרת פתיחה):</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TZAAD_LEDGER.filter((t) => t.account === "לקוחות" || t.account === "הפרשה להפסדי אשראי חזויים").map((t) => (
              <TCard key={t.account} t={t} />
            ))}
          </div>
          <DataTable
            caption="במאזן ליום 31.12.2025 — סעיף הלקוחות"
            head={["", "סכום"]}
            rows={[
              ["לקוחות", TZAAD_C.customers],
              ["בניכוי: הפרשה להפסדי אשראי חזויים", -TZAAD_C.required],
            ]}
            foot={["לקוחות, נטו — מה שהחנות באמת מצפה לגבות", TZAAD_C.net]}
          />
          <Rule>
            בקיצור: הוצאה = ההפרשה הנדרשת בסוף השנה פחות מה שכבר יש בה. כאן: {f(TZAAD_C.required)} − {f(TZAAD_C.before)} = {f(TZAAD_C.expense)}.
          </Rule>
        </Card>
      </Chapter>
    </>
  );
}
