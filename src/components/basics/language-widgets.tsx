"use client";

import { ArrowDown, BookCheck, Languages } from "lucide-react";
import { useId, useState } from "react";
import { isBalanceSheet, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { TRANSLATIONS, TWINS, twinProfit } from "@/lib/study/basics/intro";
import { cn } from "@/lib/utils";
import { Money } from "./ui";

/**
 * The translator: pick an everyday event and see it in the language of business —
 * which accounts change, by how much, and on which report each one lands.
 */
export function TranslatorWidget() {
  const [id, setId] = useState(TRANSLATIONS[0].id);
  const t = TRANSLATIONS.find((x) => x.id === id)!;
  const head = useId();
  return (
    <section aria-labelledby={head} className="rounded-2xl border border-line bg-surface-2/50 p-4">
      <p id={head} className="flex items-center gap-2 text-[15px] font-semibold text-fg">
        <Languages className="h-4.5 w-4.5 text-accent" aria-hidden /> נסו בעצמכם: בחרו אירוע ותראו את התרגום
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {TRANSLATIONS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={x.id === id}
            onClick={() => setId(x.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[13.5px] font-medium transition-colors",
              x.id === id ? "border-accent bg-accent text-accent-fg" : "border-line-strong bg-surface text-fg hover:border-accent/50",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div key={id} className="anim-step-in mt-3 space-y-2">
        <Layer n={1} title="מה קרה — בשפה של בני אדם">
          <p className="text-[15px] text-fg">{t.story}</p>
        </Layer>
        <ArrowDown className="mx-auto h-4 w-4 text-muted" aria-hidden />
        <Layer n={2} title="מה השתנה בעסק — בשפת העסקים">
          {t.changes.length === 0 ? (
            <p className="text-[14.5px] text-muted">שום דבר.</p>
          ) : (
            <ul className="space-y-1.5">
              {t.changes.map((c) => (
                <li key={c.account} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14.5px]">
                  <span className="font-semibold text-fg">{c.account}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold text-muted">{TYPE_LABEL[typeOf(c.account)]}</span>
                  <span className={cn("ms-auto font-bold", c.by > 0 ? "text-success" : "text-danger")}>
                    {c.by > 0 ? "גדל ב-" : "קטן ב-"}
                    <Money v={Math.abs(c.by)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Layer>
        <ArrowDown className="mx-auto h-4 w-4 text-muted" aria-hidden />
        <Layer n={3} title="איפה זה מופיע — בדוחות">
          {t.changes.length === 0 ? (
            <p className="text-[14.5px] text-muted">בשום דוח.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {t.changes.map((c) => (
                <li key={c.account} className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[13.5px]">
                  {c.account} ← <strong>{isBalanceSheet(c.account) ? "מאזן" : "רווח והפסד"}</strong>
                </li>
              ))}
            </ul>
          )}
        </Layer>
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-[14px] font-semibold text-fg">{t.moral}</p>
      </div>
    </section>
  );
}

function Layer({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="mb-1 flex items-center gap-2 text-[12.5px] font-bold text-muted">
        <span className="num grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] text-accent-fg">{n}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * Why grammar matters: two bakeries with the very same year. Without a rule each
 * records its computer its own way, and their profits disagree; with the standard
 * both spread its cost over the years it serves — and the reports agree.
 */
export function GrammarWidget() {
  const [rules, setRules] = useState(false);
  const perYear = TWINS.computer / TWINS.years;
  const bakeries = [
    { name: "מאפיית אורן", expense: rules ? perYear : TWINS.computer, how: rules ? "לפי התקן: חלק שנה אחת מתוך שלוש" : "רשמה את כל המחשב כהוצאה השנה" },
    { name: "מאפיית ליה", expense: perYear, how: rules ? "לפי התקן: חלק שנה אחת מתוך שלוש" : "פרסה את המחשב על שלוש שנים" },
  ];
  const head = useId();
  return (
    <section aria-labelledby={head} className="rounded-2xl border border-line bg-surface-2/50 p-4">
      <p id={head} className="flex items-center gap-2 text-[15px] font-semibold text-fg">
        <BookCheck className="h-4.5 w-4.5 text-accent" aria-hidden /> אותה שנה, שתי מאפיות
      </p>
      <p className="mt-1 text-[14px] text-muted">
        כל אחת מכרה ב-<Money v={TWINS.sales} />, הוציאה <Money v={TWINS.other} /> על כל השאר, וקנתה מחשב ב-<Money v={TWINS.computer} /> שישמש אותה {TWINS.years} שנים.
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={rules}
        onClick={() => setRules(!rules)}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-line-strong bg-surface px-3 py-2 text-start text-[14.5px] font-semibold text-fg"
      >
        <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", rules ? "bg-success" : "bg-line-strong")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", rules ? "start-[22px]" : "start-0.5")} />
        </span>
        {rules ? "עם דקדוק: שתיהן רושמות לפי התקן" : "בלי דקדוק: כל אחת רושמת איך שבא לה"}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {bakeries.map((b) => (
          <div key={b.name} className="min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5">
            <p className="text-[14.5px] font-bold text-fg">{b.name}</p>
            <p className="mt-0.5 min-h-10 text-[12.5px] text-muted">{b.how}</p>
            <p className="mt-1 flex justify-between gap-2 text-[13px]">
              <span>הוצאת המחשב</span>
              <Money v={b.expense} plain />
            </p>
            <p className="mt-1 flex justify-between gap-2 border-t border-line pt-1 text-[14px] font-bold text-fg">
              <span>רווח</span>
              <Money v={twinProfit(b.expense)} plain />
            </p>
          </div>
        ))}
      </div>
      <p className={cn("mt-2 text-center text-[13.5px] font-semibold", rules ? "text-success" : "text-danger")}>
        {rules ? "✓ אותה שנה — אותו רווח. עכשיו אפשר להשוות." : "✗ אותה שנה בדיוק, ופי שניים רווח לאחת מהן. את מי להאמין?"}
      </p>
    </section>
  );
}
