"use client";

import { CircleCheck, CircleX, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { TBox } from "@/components/basics/t-accounts";
import { Money } from "@/components/basics/ui";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { type Entry, type Line, ledger, round2, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { checkEntry, type ExResult, parseAmount, triesFor, XP } from "@/lib/study/score";
import type { JournalExercise } from "@/lib/study/types";
import { cn } from "@/lib/utils";

type Draft = { account: string; side: "dr" | "cr"; amount: string };

const amountOf = (s: string) => parseAmount(s) || 0;
const toLines = (d: Draft[]): Line[] => d.filter((x) => amountOf(x.amount) > 0).map((x) => ({ account: x.account, [x.side]: amountOf(x.amount) }));

/**
 * Practice: build the entry for a transaction. Each offered account goes to the
 * debit or the credit side with an amount; the T-accounts and the debit = credit
 * check follow every keystroke. Two tries, then the answer is shown.
 */
export function JournalSimulator({ ex, result, onCheck }: { ex: JournalExercise; result?: ExResult; onCheck: (ok: boolean) => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const answer = ex.entry;
  const done = !!result?.done;

  // Once done, the board shows the answer: the learner's own when right, the correct one when not.
  const lines = done ? answer.lines : toLines(drafts);
  const shown: Entry = { id: "1", text: answer.text, lines };
  const dr = round2(lines.reduce((s, l) => s + (l.dr ?? 0), 0));
  const cr = round2(lines.reduce((s, l) => s + (l.cr ?? 0), 0));
  const balanced = dr > 0 && dr === cr;
  const used = new Set(drafts.map((d) => d.account));

  const add = (account: string, side: "dr" | "cr") => setDrafts([...drafts, { account, side, amount: "" }]);
  const edit = (account: string, amount: string) => setDrafts(drafts.map((d) => (d.account === account ? { ...d, amount } : d)));
  const remove = (account: string) => setDrafts(drafts.filter((d) => d.account !== account));
  const check = () => {
    const r = checkEntry(answer, toLines(drafts));
    setWrong(r.wrong);
    onCheck(r.ok);
  };

  const column = (side: "dr" | "cr") => {
    const rows = done ? answer.lines.filter((l) => (side === "dr" ? l.dr : l.cr)).map((l) => ({ account: l.account, amount: String(l.dr ?? l.cr) })) : drafts.filter((d) => d.side === side);
    return (
      <div className={cn("min-w-0 rounded-xl border-2 p-2", side === "dr" ? "border-debit/30 bg-debit/5" : "border-credit/30 bg-credit/5")}>
        <p className={cn("px-1 pb-1 text-[12.5px] font-bold", side === "dr" ? "text-debit" : "text-credit")}>{side === "dr" ? "חובה (מקבל)" : "זכות (נותן)"}</p>
        {rows.length === 0 && <p className="px-1 py-2 text-[12.5px] text-subtle">בחרו חשבון מהרשימה</p>}
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <motion.li key={r.account} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 rounded-lg bg-surface px-2 py-1.5">
              <span className={cn("min-w-0 flex-1 truncate text-[13.5px] font-medium", wrong.includes(r.account) && !done ? "text-danger" : "text-fg")}>{r.account}</span>
              {done ? (
                <Money v={Number(r.amount)} plain className="text-[13.5px] font-semibold" />
              ) : (
                <>
                  <input
                    dir="ltr"
                    inputMode="decimal"
                    value={r.amount}
                    onChange={(e) => edit(r.account, e.target.value)}
                    placeholder="סכום"
                    aria-label={`סכום ל${r.account}`}
                    className={cn(inputClass, "num h-8 w-24 px-2 text-[13.5px]")}
                  />
                  <button type="button" onClick={() => remove(r.account)} aria-label={`הסרת ${r.account}`} className="grid h-7 w-7 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </motion.li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3 text-[16px] font-semibold leading-relaxed text-fg">
        <span className="me-1.5 text-[12px] font-bold text-accent">העסקה:</span>
        {answer.text}
      </p>

      {!done && (
        <div>
          <p className="mb-1.5 text-[12.5px] font-semibold text-muted">החשבונות — הוסיפו כל חשבון לצד שלו:</p>
          <ul className="flex flex-wrap gap-1.5">
            {ex.accounts.map((a) => (
              <li key={a} className={cn("flex items-center overflow-hidden rounded-full border border-line-strong bg-surface text-[13.5px]", used.has(a) && "opacity-40")}>
                <SideButton side="dr" account={a} disabled={used.has(a)} onClick={() => add(a, "dr")} />
                <span className="px-2 font-medium text-fg" title={TYPE_LABEL[typeOf(a)]}>
                  {a}
                </span>
                <SideButton side="cr" account={a} disabled={used.has(a)} onClick={() => add(a, "cr")} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {column("dr")}
        {column("cr")}
      </div>

      <p className={cn("num flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold", balanced ? "bg-success/10 text-success" : "bg-surface-2 text-muted")}>
        חובה <Money v={dr} plain /> {balanced ? "=" : "≠"} זכות <Money v={cr} plain /> {balanced && "✓"}
      </p>

      {lines.length > 0 && (
        <div>
          <p className="mb-1.5 text-[12.5px] font-semibold text-muted">ובכרטיסי ה-T:</p>
          <div className={cn("grid gap-2", lines.length > 1 && "grid-cols-2")}>
            {ledger([shown]).map((t) => (
              <TBox key={t.account} t={t} fresh="1" />
            ))}
          </div>
        </div>
      )}

      {done ? (
        <Feedback ok={result!.ok} title={result!.ok ? <Gain xp={result!.tries === 1 ? XP.first : XP.second} /> : "זו הפקודה הנכונה"} text={answer.why} />
      ) : (
        <div className="space-y-2">
          {result && result.tries > 0 && (
            <Feedback
              ok={false}
              title={`לא מדויק — נותר ניסיון ${triesFor(ex) - result.tries}`}
              text={wrong.length ? `בדקו את: ${wrong.join(", ")}` : "בדקו את הצדדים ואת הסכומים."}
            />
          )}
          <Button onClick={check} disabled={!balanced} className="w-full sm:w-auto">
            בדיקה
          </Button>
          {!balanced && drafts.length > 0 && <p className="text-[12px] text-muted">כדי לבדוק, סך החובה צריך להיות שווה לסך הזכות.</p>}
        </div>
      )}
    </div>
  );
}

function SideButton({ side, account, disabled, onClick }: { side: "dr" | "cr"; account: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${account} ל${side === "dr" ? "חובה" : "זכות"}`}
      className={cn(
        "flex h-8 items-center gap-0.5 px-2 text-[12px] font-bold transition-colors disabled:pointer-events-none",
        side === "dr" ? "text-debit hover:bg-debit/10" : "text-credit hover:bg-credit/10",
      )}
    >
      <Plus className="h-3 w-3" aria-hidden />
      {side === "dr" ? "ח׳" : "ז׳"}
    </button>
  );
}

/** "Right!" with the XP it earned; the amount stays left to right inside the Hebrew. */
export function Gain({ xp }: { xp: number }) {
  return (
    <>
      נכון! <bdi dir="ltr">+{xp} XP</bdi>
    </>
  );
}

export function Feedback({ ok, title, text }: { ok: boolean; title: ReactNode; text?: string }) {
  return (
    <motion.div
      role="status"
      initial={ok ? { scale: 0.96, opacity: 0 } : { x: 0, opacity: 0 }}
      animate={ok ? { scale: 1, opacity: 1 } : { x: [0, -8, 8, -5, 5, 0], opacity: 1 }}
      transition={{ duration: ok ? 0.25 : 0.4 }}
      className={cn("flex gap-2.5 rounded-xl border px-3.5 py-3", ok ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10")}
    >
      {ok ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden /> : <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />}
      <div className="min-w-0">
        <p className={cn("text-[14.5px] font-bold", ok ? "text-success" : "text-danger")}>{title}</p>
        {text && <p className="mt-0.5 text-[14px] leading-relaxed text-fg/90">{text}</p>}
      </div>
    </motion.div>
  );
}
