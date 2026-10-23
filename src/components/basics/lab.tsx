"use client";

import { ChevronLeft, ChevronRight, CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { balancesOf, identityHolds, KITS, ledger, statements, typeOf, TYPE_LABEL } from "@/lib/learn/basics";
import { cn } from "@/lib/utils";
import { EntryView, Money } from "./ui";

const STEPS = [...KITS.entries, KITS.closing];
const FINAL_BEFORE = statements(balancesOf(ledger(KITS.entries)));
const FINAL_AFTER = statements(balancesOf(ledger(STEPS)));
const FINAL_BALANCES = balancesOf(ledger(STEPS));
const INVESTED = KITS.entries[0].lines[0].dr!;
const WITHDRAWN = KITS.entries.find((x) => x.lines[0].account === "הון בעלים")!.lines[0].dr!;

export function TransactionLab() {
  const [step, setStep] = useState(1);
  const entry = STEPS[step - 1];
  const accounts = ledger(STEPS.slice(0, step));
  const prev = balancesOf(ledger(STEPS.slice(0, step - 1)));
  const s = statements(balancesOf(accounts));
  const isClosing = step === STEPS.length;
  const cash = accounts.find((t) => t.account === "מזומן")?.balance ?? 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <button
          type="button"
          onClick={() => setStep((x) => Math.max(1, x - 1))}
          disabled={step === 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted ring-1 ring-line hover:text-fg disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" /> הקודם
        </button>
        <p className="num mx-auto text-sm font-semibold text-fg" aria-live="polite">
          {isClosing ? "סוף השנה: ספירת מלאי" : `פעולה ${step} מתוך ${KITS.entries.length}`}
        </p>
        <button
          type="button"
          onClick={() => setStep((x) => Math.min(STEPS.length, x + 1))}
          disabled={step === STEPS.length}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg disabled:opacity-40"
        >
          הבא <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1.5 bg-surface-2" aria-hidden>
        <div className="h-full bg-accent transition-all" style={{ width: `${(step / STEPS.length) * 100}%` }} />
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-fg">{entry.text}</p>
          {entry.why && <p className="mt-1 text-sm text-muted">{entry.why}</p>}
          <EntryView entry={entry} title={`פקודת יומן ${entry.id}`} note={isClosing ? "המלאי הוא נכס (מאזני). צדו השני מקטין את עלות הקניות ברווח והפסד." : undefined} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">יתרות אחרי הפעולה</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[20rem] text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="px-3 py-1.5 text-start font-medium">חשבון</th>
                  <th className="px-3 py-1.5 text-start font-medium">סוג</th>
                  <th className="px-3 py-1.5 text-end font-medium">יתרה</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((t) => {
                  const changed = (prev[t.account] ?? 0) !== t.balance;
                  return (
                    <tr key={t.account} className={cn("border-t border-line/70", changed && "bg-accent-soft/70")}>
                      <td className="px-3 py-1.5 text-fg">{t.account}</td>
                      <td className="px-3 py-1.5 text-xs text-muted">{TYPE_LABEL[typeOf(t.account)]}</td>
                      <td className="px-3 py-1.5 text-end">
                        <Money v={Math.abs(t.balance)} plain />{" "}
                        <span className={cn("text-[11px]", t.balance >= 0 ? "text-debit" : "text-credit")}>{t.balance >= 0 ? "ח'" : "ז'"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={cn("mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium", identityHolds(s) ? "text-success" : "text-danger")}>
            <CircleCheck className="h-4 w-4 shrink-0" /> נכסים <Money v={s.totalAssets} /> = התחייבויות <Money v={s.totalLiabilities} /> + הון{" "}
            <Money v={s.totalEquity} />
          </p>
          <p className="mt-1 text-sm text-muted">
            מזומן בקופה: <Money v={cash} className="font-semibold text-fg" />
          </p>
        </div>
      </div>

      {step >= KITS.entries.length && (
        <div className="grid gap-3 border-t border-line p-4 md:grid-cols-2">
          <div className="rounded-xl border border-danger/30 bg-danger/[0.05] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-danger">
              <TriangleAlert className="h-4 w-4" /> בלי מלאי סגירה
            </p>
            <p className="mt-1 text-[15px] text-fg">
              הכנסות <Money v={FINAL_BEFORE.totalIncome} /> פחות הוצאות <Money v={FINAL_BEFORE.totalExpenses} /> — העסק נראה כאילו{" "}
              <strong>הפסיד <Money v={-FINAL_BEFORE.profit} /></strong>.
            </p>
            <p className="mt-1 text-sm text-muted">אבל זה לא נכון: רוב הערכות עדיין במחסן. קנינו 10,000 ומכרנו רק 1,000.</p>
          </div>
          <div className={cn("rounded-xl border p-4", isClosing ? "border-success/40 bg-success/[0.06]" : "border-line bg-surface-2/40")}>
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CircleCheck className="h-4 w-4" /> עם מלאי סגירה
            </p>
            <p className="mt-1 text-[15px] text-fg">
              {KITS.closingUnits.toLocaleString("he-IL")} ערכות × <Money v={KITS.unitCost} /> = <Money v={KITS.closing.lines[0].dr!} /> חוזרים מההוצאות לנכסים.
              הרווח האמיתי: <strong className="text-success">{<Money v={FINAL_AFTER.profit} />}</strong>.
            </p>
            {!isClosing && (
              <button type="button" onClick={() => setStep(STEPS.length)} className="mt-2 text-sm font-medium text-accent hover:underline">
                הציגו את פקודת מלאי הסגירה ←
              </button>
            )}
          </div>
          {isClosing && (
            <p className="rounded-xl bg-surface-2/70 px-4 py-3 text-sm text-fg md:col-span-2">
              <strong>בדיקה:</strong> נכסים — מזומן <Money v={cash} /> + מלאי <Money v={KITS.closing.lines[0].dr!} /> + לפטופ <Money v={FINAL_BALANCES["לפטופ"]} /> ={" "}
              <Money v={FINAL_AFTER.totalAssets} />. הון — השקעה <Money v={INVESTED} /> − משיכה <Money v={WITHDRAWN} /> + רווח <Money v={FINAL_AFTER.profit} /> ={" "}
              <Money v={FINAL_AFTER.totalEquity} />. שווה.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
