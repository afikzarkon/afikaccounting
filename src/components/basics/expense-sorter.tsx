"use client";

import { CircleCheck, CircleX, RotateCcw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Kind = "expense" | "asset";

// Payments of the bakery, each with the reason it is what it is.
const ITEMS: { what: string; kind: Kind; why: string }[] = [
  { what: "משכורות העובדים לחודש מרץ", kind: "expense", why: "העבודה של מרץ נוצלה במרץ — לא נשאר ממנה דבר לחודשים הבאים." },
  { what: "תנור אפייה חדש", kind: "asset", why: "התנור יאפה שנים, ואפשר גם למכור אותו. הכסף הפך לנכס." },
  { what: "חשבון החשמל של החודש", kind: "expense", why: "החשמל נצרך החודש ונגמר. אין מה למכור ממנו." },
  { what: "רכב לחלוקת משלוחים", kind: "asset", why: "הרכב ישרת את המאפייה שנים — ויש לו ערך גם אם ימכרו אותו." },
  { what: "מודעה ממומנת ברשתות לשבוע", kind: "expense", why: "הפרסום רץ שבוע והסתיים. גם אם הביא לקוחות — אי אפשר למכור אותו או להשתמש בו שוב." },
  { what: "תיקון קטן לתנור שהתקלקל", kind: "expense", why: "התיקון רק החזיר את התנור לפעולה; הוא לא יצר דבר חדש שיש לו ערך משלו." },
  { what: "מקרר תצוגה לחנות", kind: "asset", why: "המקרר ישמש שנים בחנות, ואפשר למכור אותו — נכס." },
];

/** Sort the bakery's payments: an expense, or an investment (an asset). Each pick says why at once. */
export function ExpenseSorter() {
  const [picks, setPicks] = useState<Record<string, Kind>>({});
  const right = ITEMS.filter((it) => picks[it.what] === it.kind).length;
  const all = right === ITEMS.length;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-sm font-semibold text-fg">תרגיל: הוצאה או השקעה?</p>
        <span className="num rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-fg ring-1 ring-line" aria-live="polite">
          {right} / {ITEMS.length} נכון
        </span>
        <button
          type="button"
          onClick={() => setPicks({})}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> איפוס
        </button>
      </div>
      <ul className="divide-y divide-line/70">
        {ITEMS.map((it) => {
          const pick = picks[it.what];
          const ok = pick === it.kind;
          return (
            <li key={it.what} className={cn("px-3 py-2.5 sm:px-4", pick && (ok ? "bg-success/[0.04]" : "bg-danger/[0.04]"))}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-[15px] font-medium text-fg">{it.what}</span>
                <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`הוצאה או השקעה: ${it.what}`}>
                  {(["expense", "asset"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={pick === k}
                      onClick={() => setPicks((p) => ({ ...p, [it.what]: k }))}
                      className={cn(
                        "h-8 rounded-lg px-3 text-xs font-bold ring-1 transition-colors",
                        pick === k ? (ok ? "bg-success text-surface ring-success" : "bg-danger text-surface ring-danger") : "bg-surface text-fg ring-line-strong hover:bg-surface-2",
                      )}
                    >
                      {k === "expense" ? "הוצאה" : "השקעה"}
                    </button>
                  ))}
                </div>
              </div>
              {pick && (
                <p className={cn("anim-step-in mt-1.5 flex items-start gap-1.5 text-[13.5px] leading-snug", ok ? "text-success" : "text-danger")}>
                  {ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
                  <span>
                    <strong>{ok ? "נכון. " : `לא — זו ${it.kind === "expense" ? "הוצאה" : "השקעה"}. `}</strong>
                    <span className="text-fg/85">{it.why}</span>
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {all && <p className="anim-step-in border-t border-success/30 bg-success/[0.07] px-4 py-3 text-sm font-semibold text-success">כל התשלומים במקום. השאלה שעשתה את העבודה: האם זה ימשיך לשרת את העסק אחרי היום?</p>}
    </div>
  );
}
