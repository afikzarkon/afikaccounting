"use client";

import { ArrowLeft, ArrowRight, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { FullSteps } from "@/components/basics/ias19-ui";
import { Step } from "@/components/basics/ias19-step";
import { JE } from "@/components/basics/ui";
import { Button } from "@/components/ui/button";
import type { CalcSolution, CalcStep } from "@/lib/learn/ias19-calc";
import { type Answers, canContinue, errorsFor, type Field, nextYearAnswers, type Question, questionsFor, type Row, solveAnswers } from "@/lib/learn/ias19-calc-flow";
import { cn } from "@/lib/utils";

/**
 * The IAS 19 calculator: one question at a time, each depending on the answers
 * before it, then the whole solution in the course's format. Everything is
 * computed here in the browser; nothing is sent anywhere.
 */

const inputClass = "num min-h-10 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[15px] text-fg";

function FieldInput({ f, value, onChange, id }: { f: Field; value: string | boolean | undefined; onChange: (v: string | boolean) => void; id: string }) {
  if (f.check) {
    return (
      <label className="flex min-h-10 items-center gap-2 text-[14px] font-semibold">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
        {f.label}
      </label>
    );
  }
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-[13.5px] font-semibold text-fg">
      <span>
        {f.label}
        {f.unit ? <span className="font-normal text-muted"> ({f.unit})</span> : null}
        {f.optional ? <span className="font-normal text-muted"> · לא חובה</span> : null}
      </span>
      {f.select ? (
        <select id={id} value={typeof value === "string" ? value : "0"} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {f.select.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input id={id} dir={f.text ? undefined : "ltr"} inputMode={f.text ? "text" : "decimal"} autoComplete="off" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, !f.text && "text-end")} />
      )}
      {f.help && <span className="text-[12.5px] font-normal leading-snug text-muted">{f.help}</span>}
    </label>
  );
}

function Rows({ q, rows, onChange }: { q: Extract<Question, { kind: "rows" }>; rows: Row[]; onChange: (r: Row[]) => void }) {
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13.5px] font-bold text-muted">שורה {i + 1}</span>
            {rows.length > q.min && (
              <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} aria-label={`מחיקת שורה ${i + 1}`} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {q.columns.map((c) => (
              <FieldInput key={c.id} id={`${q.id}-${i}-${c.id}`} f={c} value={r[c.id]} onChange={(v) => onChange(rows.map((x, k) => (k === i ? { ...x, [c.id]: v } : x)))} />
            ))}
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => onChange([...rows, {}])}>
        <Plus className="h-4 w-4" aria-hidden />
        {q.addLabel}
      </Button>
    </div>
  );
}

function Solution({ s }: { s: CalcSolution }) {
  return (
    <section aria-label={s.title} className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-fg">{s.title}</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {s.metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-line bg-surface p-3.5">
            <p className="text-[13px] text-muted">{m.label}</p>
            <p className="mt-1 text-[22px] font-bold text-fg">
              <bdi dir="ltr" className="num">
                {Math.round(m.value).toLocaleString("en-US")} ₪
              </bdi>
            </p>
          </div>
        ))}
      </div>
      <FullSteps
        label={s.title}
        steps={s.steps.map((st: CalcStep) => ({
          title: st.title,
          body: (
            <>
              <Step s={st} />
              {st.journal
                ?.filter((j) => j.lines.length)
                .map((j, k) => <JE key={k} note={null} entry={{ id: String(k + 1), text: j.title, lines: j.lines }} className="mt-3" />)}
            </>
          ),
        }))}
      />
      {s.notes.length > 0 && (
        <ul className="list-disc space-y-1 rounded-xl border border-line bg-surface px-4 py-3 ps-8 text-[14px] leading-relaxed text-fg/85">
          {s.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Ias19Calculator() {
  const [answers, setAnswers] = useState<Answers>({});
  const [at, setAt] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [solved, setSolved] = useState<CalcSolution | null>(null);
  const [earlier, setEarlier] = useState<CalcSolution[]>([]);

  const questions = useMemo(() => questionsFor(answers), [answers]);
  const q = questions[Math.min(at, questions.length - 1)];

  const set = (id: string, v: Answers[string]) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors([]);
  };

  /** Forward: the next question if the answers open one, otherwise the solution. */
  const forward = (a: Answers, from: Question) => {
    const errs = errorsFor(from, a);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    const qs = questionsFor(a);
    const i = qs.findIndex((x) => x.id === from.id);
    if (i + 1 < qs.length) {
      setAt(i + 1);
      window.scrollTo({ top: 0 });
    } else {
      // Every question on the way must hold an answer, even after an earlier one changed the path.
      const gap = qs.findIndex((x) => errorsFor(x, a).length > 0);
      if (gap >= 0) {
        setAt(gap);
        setErrors(errorsFor(qs[gap], a));
        return;
      }
      setSolved(solveAnswers(a));
      window.scrollTo({ top: 0 });
    }
  };

  const restart = () => {
    setAnswers({});
    setAt(0);
    setSolved(null);
    setEarlier([]);
    setErrors([]);
  };

  if (solved) {
    return (
      <div className="space-y-6">
        {earlier.map((s) => (
          <details key={s.title} className="rounded-2xl border border-line bg-surface p-3.5">
            <summary className="cursor-pointer text-[15px] font-bold text-fg">{s.title}</summary>
            <div className="mt-3">
              <Solution s={s} />
            </div>
          </details>
        ))}
        <Solution s={solved} />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setSolved(null);
              setAt(questions.length - 1);
            }}
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            שינוי התשובות
          </Button>
          {canContinue(answers) && (
            <Button
              variant="secondary"
              onClick={() => {
                const next = nextYearAnswers(answers);
                setEarlier((e) => [...e, solved]);
                setAnswers(next);
                setSolved(null);
                setAt(questionsFor(next).findIndex((x) => x.id === "events"));
                window.scrollTo({ top: 0 });
              }}
            >
              המשך לשנה הבאה
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <Button variant="secondary" onClick={restart}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            שאלה חדשה
          </Button>
        </div>
      </div>
    );
  }

  const answered = questions.slice(0, at).filter((x) => x.kind === "choice" && typeof answers[x.id] === "string");
  const rows = q.kind === "rows" ? (Array.isArray(answers[q.id]) ? (answers[q.id] as Row[]) : q.min ? [{}] : []) : [];
  const example = () => {
    if (q.kind === "form") setAnswers((a) => ({ ...a, ...Object.fromEntries(q.fields.filter((f) => f.example !== undefined).map((f) => [f.id, String(f.example)])) }));
    if (q.kind === "rows") setAnswers((a) => ({ ...a, [q.id]: q.example }));
    setErrors([]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {answered.length > 0 && (
        <ol className="flex flex-wrap gap-1.5" aria-label="התשובות עד כה">
          {answered.map((x) => {
            const opt = x.kind === "choice" ? x.options.find((o) => o.value === answers[x.id]) : undefined;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => setAt(questions.indexOf(x))} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] text-muted hover:border-accent hover:text-fg">
                  {opt?.label}
                </button>
              </li>
            );
          })}
        </ol>
      )}
      <div className="card p-5">
        <p className="text-[13px] font-semibold text-accent">שאלה {Math.min(at, questions.length - 1) + 1}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-fg">{q.title}</h2>
        <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{q.why}</p>

        <div className="mt-4">
          {q.kind === "choice" && (
            <div className="grid gap-2">
              {q.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    const a = { ...answers, [q.id]: o.value };
                    setAnswers(a);
                    forward(a, q);
                  }}
                  className={cn("rounded-xl border bg-surface px-4 py-3 text-start transition-colors hover:border-accent", answers[q.id] === o.value ? "border-accent ring-1 ring-accent/30" : "border-line")}
                >
                  <span className="block text-[15px] font-semibold text-fg">{o.label}</span>
                  {o.hint && <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">{o.hint}</span>}
                </button>
              ))}
            </div>
          )}
          {q.kind === "multi" && (
            <div className="grid gap-2">
              {q.options.map((o) => {
                const on = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(o.value);
                return (
                  <label key={o.value} className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl border bg-surface px-4 py-3", on ? "border-accent ring-1 ring-accent/30" : "border-line")}>
                    <input
                      type="checkbox"
                      checked={on}
                      className="mt-1 h-4 w-4"
                      onChange={(e) => {
                        const cur = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                        set(q.id, e.target.checked ? [...cur, o.value] : cur.filter((x) => x !== o.value));
                      }}
                    />
                    <span>
                      <span className="block text-[15px] font-semibold text-fg">{o.label}</span>
                      {o.hint && <span className="mt-0.5 block text-[13.5px] leading-snug text-muted">{o.hint}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {q.kind === "form" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {q.fields.map((f) => (
                <FieldInput key={f.id} id={`f-${f.id}`} f={f} value={typeof answers[f.id] === "string" ? (answers[f.id] as string) : ""} onChange={(v) => set(f.id, String(v))} />
              ))}
            </div>
          )}
          {q.kind === "rows" && <Rows q={q} rows={rows} onChange={(r) => set(q.id, r)} />}
        </div>

        {errors.length > 0 && (
          <ul role="alert" className="mt-3 space-y-0.5 text-[14px] text-danger">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {at > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setAt(Math.min(at, questions.length - 1) - 1);
                setErrors([]);
              }}
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              חזרה
            </Button>
          )}
          {q.kind !== "choice" && (
            <Button
              onClick={() => {
                const a = q.kind === "rows" ? { ...answers, [q.id]: rows } : q.kind === "multi" ? { ...answers, [q.id]: Array.isArray(answers[q.id]) ? answers[q.id] : [] } : answers;
                setAnswers(a);
                forward(a, q);
              }}
            >
              המשך
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {(q.kind === "form" || q.kind === "rows") && (
            <button type="button" onClick={example} className="ms-auto text-[13.5px] font-medium text-muted underline underline-offset-2 hover:text-fg">
              מילוי במספרי דוגמה
            </button>
          )}
        </div>
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted">הפתרון מחושב במקום, לפי מה שהוזן. הוא כלי לימודי, ואינו מחליף שיקול דעת מקצועי או מדידה אקטוארית.</p>
    </div>
  );
}
