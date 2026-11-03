import { ArrowLeft, Banknote, CalendarClock, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { CHECKS, SPLIT } from "@/lib/learn/basics";
import { Part, Remember } from "@/components/study-mode/screen-parts";
import { cn } from "@/lib/utils";
import { JournalCheck } from "./journal-check";
import { Posted } from "./t-accounts";
import { JE, Money, Stepper, Term } from "./ui";

// The three kinds of cheque, each by the one question that matters: when does the money move?
const KINDS: { icon: ReactNode; name: string; when: string; got: string; gave: string; tone: "cash" | "later" | "back" }[] = [
  { icon: <Banknote className="h-5 w-5" />, name: "צ׳ק מזומן", when: "התאריך עליו הוא היום — הכסף זז היום", got: "מזומן", gave: "מזומן", tone: "cash" },
  { icon: <CalendarClock className="h-5 w-5" />, name: "צ׳ק דחוי", when: "הכסף יזוז רק בתאריך שעל הצ׳ק — עד אז זה חוב", got: "לקוחות", gave: "ספקים (על סחורה) · זכאים (על כל דבר אחר)", tone: "later" },
  { icon: <Undo2 className="h-5 w-5" />, name: "צ׳ק שחזר", when: "הבנק לא כיבד אותו — הכסף לא באמת עבר", got: "פקודה הפוכה לפירעון: הלקוח שוב חייב", gave: "פקודה הפוכה לפירעון: אנחנו שוב חייבים", tone: "back" },
];

/** A deal and how its price was paid: the whole amount on one side, a line per way of paying on the other. */
function Breakdown({ total, parts, label }: { total: number; parts: { name: string; amount: number; account: string }[]; label: string }) {
  return (
    <figure className="rounded-2xl border border-line bg-surface p-3.5">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[14px] font-bold text-fg">
        <span>{label}</span>
        <Money v={total} />
      </figcaption>
      <div className="flex h-9 overflow-hidden rounded-lg ring-1 ring-line" aria-hidden>
        {parts.map((p, i) => (
          <span
            key={p.name}
            className={cn("grid min-w-0 place-items-center truncate px-1 text-[11.5px] font-semibold", ["bg-accent text-accent-fg", "bg-debit/80 text-surface", "bg-credit/80 text-surface", "bg-surface-2 text-fg"][i % 4])}
            style={{ width: `${(p.amount / total) * 100}%` }}
          >
            {p.name}
          </span>
        ))}
      </div>
      <ul className="mt-2 grid gap-1 text-[13.5px]">
        {parts.map((p) => (
          <li key={p.name} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/60 px-2.5 py-1.5">
            <span>
              {p.name} <ArrowLeft className="inline h-3.5 w-3.5 text-subtle" aria-hidden /> <strong className="text-fg">{p.account}</strong>
            </span>
            <Money v={p.amount} plain />
          </li>
        ))}
      </ul>
    </figure>
  );
}

export const CHECKS_SCREENS: Record<string, ScreenContent> = {
  checks: {
    lead: "צ׳ק הוא אמצעי תשלום, לא חשבון — אין חשבון בשם ״צ׳קים״. בכל צ׳ק שואלים שאלה אחת: מתי הכסף באמת זז?",
    body: (
      <>
        <ul className="grid gap-2 md:grid-cols-3">
          {KINDS.map((k) => (
            <li
              key={k.name}
              className={cn(
                "flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3",
                k.tone === "cash" ? "border-success/35 bg-success/[0.05]" : k.tone === "later" ? "border-accent/40 bg-accent-soft/50" : "border-danger/35 bg-danger/[0.05]",
              )}
            >
              <span className="flex items-center gap-2 text-[16px] font-bold text-fg">
                <span className="text-accent" aria-hidden>
                  {k.icon}
                </span>
                {k.name}
              </span>
              <span className="text-[14px] text-fg/85">{k.when}</span>
              <span className="mt-auto space-y-0.5 border-t border-line pt-1.5 text-[13px]">
                <span className="block">
                  <span className="text-muted">קיבלנו: </span>
                  <strong className="text-fg">{k.got}</strong>
                </span>
                <span className="block">
                  <span className="text-muted">נתנו: </span>
                  <strong className="text-fg">{k.gave}</strong>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p>
          <strong>צ׳ק דחוי מתנהג בדיוק כמו אשראי.</strong> ביום הפירעון רק החוב נסגר מול המזומן — אין הכנסה או הוצאה חדשה.
        </p>
        <p>
          עכשיו הכול בסיפור אחד: חנות כלי בית באביב. עברו צעד אחר צעד, ושימו לב לכרטיס <strong>לקוחות</strong> — הוא נסגר, נפתח שוב כשהצ׳ק חוזר, ונסגר שוב בסוף.
        </p>
        <Stepper
          label="חנות כלי הבית · צ׳קים מכל הסוגים"
          steps={CHECKS.run.map((x, i) => ({ title: `${x.date} · ${x.text}`, body: <Posted entries={CHECKS.run} at={i} title="פקודת היומן" /> }))}
        />
        <p>
          <strong>צ׳ק שחזר</strong> לא מבטל את המכירה: הסחורה נמסרה, ורק הגבייה נכשלה. לכן מחזירים רק את מה שקרה ביום הפירעון — ח׳ לקוחות / ז׳ מזומן. ה
          <Term he="עמלה" /> שהבנק גבה היא הוצאה של העסק.
        </p>
        <Remember>צ׳ק דחוי = אשראי עד יום הפירעון. צ׳ק שחזר = פקודה הפוכה לפירעון, ועמלת הבנק — הוצאה.</Remember>
      </>
    ),
    check: (
      <JournalCheck
        chapter="checks"
        items={[
          {
            text: "מכרתם סחורה ב-3,000 ₪ וקיבלתם צ׳ק מזומן.",
            lines: [{ account: "מזומן", dr: 3_000 }, { account: "מכירות", cr: 3_000 }],
            why: "צ׳ק מזומן נפרע מיד — הכסף זז היום, ולכן נרשם כמו מזומן.",
            accounts: ["מזומן", "לקוחות", "מכירות", "ספקים"],
          },
          {
            text: "שילמתם לנגר 8,000 ₪ על ארון למשרד, בצ׳ק דחוי לעוד חודשיים.",
            lines: [{ account: "ריהוט משרדי", dr: 8_000 }, { account: "זכאים", cr: 8_000 }],
            why: "הכסף עוד לא יצא — זה חוב. והחוב אינו על סחורה למכירה אלא על ריהוט, ולכן זכאים ולא ספקים.",
            accounts: ["ריהוט משרדי", "זכאים", "ספקים", "מזומן"],
          },
          {
            text: "צ׳ק של לקוח על 4,000 ₪, שכבר נרשם כמזומן ביום הפירעון, חזר מהבנק.",
            lines: [{ account: "לקוחות", dr: 4_000 }, { account: "מזומן", cr: 4_000 }],
            why: "המכירה לא מתבטלת — הסחורה נמסרה. מחזירים רק את מה שקרה ביום הפירעון: הלקוח שוב חייב, והמזומן קטן.",
            accounts: ["לקוחות", "מזומן", "מכירות", "ספקים"],
          },
        ]}
      />
    ),
  },

  "advance-split": {
    lead: "בדרך כלל המקדמה לא מכסה את כל העסקה. כשהסחורה מגיעה, מפרקים את המחיר לפי האופן שבו שולם כל חלק.",
    body: (
      <>
        <p>
          צ׳ק דחוי ואשראי לאותו ספק (או לאותו לקוח) נרשמים באותו חשבון: שניהם חוב שעוד לא נפרע. לכן מותר — ונוח — לחבר אותם לשורה אחת.
        </p>
        <p>
          <strong>קנייה: חלק מהמקדמה, חלק בצ׳ק, חלק באשראי</strong>
        </p>
        <Breakdown
          label="הקנייה מהספק"
          total={50_000}
          parts={[
            { name: "מהמקדמה", amount: 18_000, account: "מקדמות לספקים" },
            { name: "צ׳ק דחוי", amount: 12_000, account: "ספקים" },
            { name: "אשראי", amount: 20_000, account: "ספקים" },
          ]}
        />
        <JE entry={SPLIT.purchase} />
        <Part title="מכירה: אותו היגיון, מהצד השני">
          <Breakdown
            label="המכירה ללקוח"
            total={26_000}
            parts={[
              { name: "מהמקדמה", amount: 6_000, account: "מקדמות מלקוחות" },
              { name: "מזומן", amount: 4_000, account: "מזומן" },
              { name: "צ׳ק דחוי", amount: 5_000, account: "לקוחות" },
              { name: "אשראי", amount: 11_000, account: "לקוחות" },
            ]}
          />
          <JE entry={SPLIT.sale} />
        </Part>
        <Remember>צד אחד של הפקודה הוא העסקה כולה. בצד השני — שורה לכל אופן תשלום. והמקדמה? היא נסגרת בסכום שנוצל ממנה.</Remember>
      </>
    ),
    check: (
      <JournalCheck
        chapter="advance-split"
        items={[
          {
            text: "לקוח ששילם בעבר מקדמה של 5,000 ₪ קיבל היום סחורה ב-20,000 ₪, ושילם את השאר במזומן.",
            lines: [{ account: "מקדמות מלקוחות", dr: 5_000 }, { account: "מזומן", dr: 15_000 }, { account: "מכירות", cr: 20_000 }],
            why: "המכירה כולה קורית היום: 20,000. המקדמה רק אומרת איך שולם חלק מהמחיר — 5,000 נסגרים ממנה, ו-15,000 נכנסים במזומן.",
            accounts: ["מקדמות מלקוחות", "מזומן", "מכירות", "לקוחות"],
          },
          {
            text: "שילמתם לספק מקדמה של 9,000 ₪. היום קיבלתם ממנו סחורה ב-9,000 ₪ בדיוק.",
            lines: [{ account: "קניות", dr: 9_000 }, { account: "מקדמות לספקים", cr: 9_000 }],
            why: "הקנייה קורית ביום האספקה. היא שולמה כולה מהמקדמה, ולכן המקדמה נסגרת. המזומן יצא כבר ביום המקדמה.",
            accounts: ["קניות", "מקדמות לספקים", "מזומן", "ספקים"],
          },
        ]}
      />
    ),
  },
};
