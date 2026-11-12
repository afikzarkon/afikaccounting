"use client";

import { Check, ClipboardCopy, Download, FileText, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  type Answers,
  type Field,
  type Row,
  type Section,
  emptyState,
  isVisible,
  keyOf,
  missingRequired,
  moduleSections,
  optionsOf,
  schema,
  sectionById,
  toMarkdown,
} from "@/lib/tester/form";
import { type SyncStatus, setTesterMode, useFeedback, useTesterMode } from "@/lib/tester/store";
import { cn } from "@/lib/utils";

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = { kind: "intake" } | { kind: "module"; index: number } | { kind: "summary" };

const STATUS: Record<SyncStatus, string> = {
  loading: "טוען…",
  saving: "שומר…",
  account: "נשמר בחשבון שלכם, והצוות רואה אותו",
  local: "נשמר בדפדפן הזה בלבד",
  failed: "השמירה בחשבון נכשלה. מה שכתבתם שמור בדפדפן, וננסה שוב בשינוי הבא",
};

export function FeedbackForm() {
  const { state, update, canSave, status } = useFeedback();
  const testerMode = useTesterMode();
  const [tab, setTab] = useState<Tab>({ kind: "intake" });
  const [copied, setCopied] = useState(false);

  if (!state) return <div className="card h-96 animate-pulse" />;

  const setAnswer = (where: Tab, key: string, value: unknown) =>
    update((s) => {
      if (where.kind === "intake") return { ...s, intake: { ...s.intake, [key]: value } };
      if (where.kind === "summary") return { ...s, summary: { ...s.summary, [key]: value } };
      const modules = s.modules.slice();
      modules[where.index] = { ...modules[where.index], [key]: value };
      return { ...s, modules };
    });

  const addModule = () => {
    update((s) => ({ ...s, modules: [...s.modules, {}] }));
    setTab({ kind: "module", index: state.modules.length });
  };

  const removeModule = (index: number) => {
    const name = (state.modules[index]["module.moduleName"] as string) || `מודול ${index + 1}`;
    if (!window.confirm(`למחוק את "${name}" וכל מה שמילאתם בו?`)) return;
    update((s) => ({ ...s, modules: s.modules.length > 1 ? s.modules.filter((_, i) => i !== index) : [{}] }));
    setTab({ kind: "module", index: Math.max(0, index - 1) });
  };

  const clearAll = () => {
    if (!window.confirm("לנקות את כל הטופס? כדאי להוריד עותק לפני כן. אי אפשר לבטל את זה.")) return;
    update(() => emptyState());
    setTab({ kind: "intake" });
  };

  const code = (state.intake["intake.testerCode"] as string) || "tester";
  const fileBase = `feedback-${code}-${new Date().toISOString().slice(0, 10)}`;

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(state));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      download(`${fileBase}.md`, toMarkdown(state), "text/markdown");
    }
  };

  const intake = sectionById("intake");
  const summary = sectionById("summary");
  const current: { sections: Section[]; answers: Answers } =
    tab.kind === "intake"
      ? { sections: [intake], answers: state.intake }
      : tab.kind === "summary"
        ? { sections: [summary], answers: state.summary }
        : { sections: moduleSections, answers: state.modules[tab.index] ?? {} };
  const missing = missingRequired(current.sections, current.answers);

  const tabButton = (t: Tab, label: string, todo: number) => {
    const active = t.kind === tab.kind && (t.kind !== "module" || (tab.kind === "module" && t.index === tab.index));
    return (
      <button
        key={t.kind === "module" ? `m${t.index}` : t.kind}
        type="button"
        onClick={() => setTab(t)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex max-w-56 items-center gap-1.5 truncate rounded-xl border px-3.5 py-2 text-sm transition-colors",
          active ? "border-accent bg-accent-soft font-semibold text-accent" : "border-line bg-surface text-muted hover:text-fg",
        )}
      >
        <span className="truncate">{label}</span>
        {todo === 0 ? <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-label="החובה מולא" /> : null}
      </button>
    );
  };

  return (
    <div>
      {status !== "loading" && !canSave && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-fg">
          <p className="font-semibold">תצוגה בלבד: החשבון הזה לא מוגדר כניסיין, אז מה שנכתב כאן נשמר רק בדפדפן הזה.</p>
          <p className="mt-1 text-muted">
            כדי לנסות את השמירה, הוסיפו את עצמכם כניסיינים ב
            <Link href="/admin/feedback" className="font-medium text-accent underline underline-offset-2">
              ניהול ← משוב ניסיינים
            </Link>
            .
          </p>
        </div>
      )}

      <div className="sticky top-16 z-10 -mx-4 border-b border-line bg-canvas/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <nav aria-label="חלקי הטופס" className="flex flex-wrap gap-2">
          {tabButton({ kind: "intake" }, "פתיחה", missingRequired([intake], state.intake))}
          {state.modules.map((m, i) =>
            tabButton({ kind: "module", index: i }, (m["module.moduleName"] as string) || `מודול ${i + 1}`, missingRequired(moduleSections, m)),
          )}
          <button
            type="button"
            onClick={addModule}
            className="inline-flex items-center gap-1 rounded-xl border border-dashed border-line-strong px-3.5 py-2 text-sm text-muted hover:border-accent hover:text-accent"
          >
            <Plus className="h-4 w-4" /> מודול חדש
          </button>
          {tabButton({ kind: "summary" }, "סיכום הסבב", missingRequired([summary], state.summary))}
        </nav>
      </div>

      <div className="mt-6 grid gap-6">
        {tab.kind === "module" && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              ממלאים בסוף המודול, 5 עד 10 דקות. נקודות היתקעות כדאי לרשום ברגע שהן קורות.
            </p>
            <Button variant="danger" size="sm" onClick={() => removeModule(tab.index)}>
              <Trash2 className="h-3.5 w-3.5" /> מחיקת המודול
            </Button>
          </div>
        )}
        {tab.kind === "intake" && <p className="text-sm text-muted">ממלאים פעם אחת, לפני שמתחילים ללמוד.</p>}
        {tab.kind === "summary" && <p className="text-sm text-muted">ממלאים פעם אחת, אחרי בחינת הסיום.</p>}

        {current.sections.map((section) => (
          <SectionCard
            key={`${tab.kind}-${tab.kind === "module" ? tab.index : 0}-${section.id}`}
            section={section}
            answers={current.answers}
            onChange={(key, value) => setAnswer(tab, key, value)}
          />
        ))}

        {missing > 0 && (
          <p className="text-sm text-muted">
            נשארו {missing} שדות חובה בחלק הזה (מסומנים ב-<span className="text-danger">*</span>).
          </p>
        )}
      </div>

      <div className="card mt-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-fg">שמירה ושליחה</p>
          <p className={cn("mt-1 text-sm", status === "failed" ? "text-danger" : "text-muted")} role="status">
            {STATUS[status]}.
          </p>
          <p className="mt-1 text-sm text-muted">
            {canSave
              ? "אין צורך לשלוח. אפשר גם להעתיק או להוריד עותק לעצמכם."
              : "בסוף כל מודול, העתיקו את הדוח או הורידו אותו ושלחו לאיש הקשר."}
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={testerMode} onChange={(e) => setTesterMode(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            להציג את כפתור המשוב הכתום בדפים, בדפדפן הזה
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={copyReport}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
            {copied ? "הועתק" : "העתקת הדוח"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => download(`${fileBase}.md`, toMarkdown(state), "text/markdown")}>
            <FileText className="h-3.5 w-3.5" /> הורדה כ-Markdown
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => download(`${fileBase}.json`, JSON.stringify({ form: schema.id, ...state }, null, 2), "application/json")}
          >
            <Download className="h-3.5 w-3.5" /> הורדה כ-JSON
          </Button>
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <X className="h-3.5 w-3.5" /> ניקוי הטופס
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ section, answers, onChange }: { section: Section; answers: Answers; onChange: (key: string, value: unknown) => void }) {
  const isRubric = section.id === "quickRubric";
  const boxes = isRubric ? section.fields.filter((f) => f.type === "textarea") : [];
  const rest = isRubric ? section.fields.filter((f) => f.type !== "textarea") : section.fields;
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-bold text-fg">{section.title}</h2>
      {isRubric && <p className="mt-1 text-sm text-muted">לפחות דבר אחד בכל תיבה. אם אין מה לכתוב, כתבו &quot;אין&quot;.</p>}
      {boxes.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {boxes.map((f) => (
            <FieldView key={f.id} field={f} fieldKey={keyOf(section, f)} answers={answers} onChange={onChange} />
          ))}
        </div>
      )}
      <div className="mt-5 grid gap-5">
        {rest
          .filter((f) => isVisible(section, f, answers))
          .map((f) => (
            <FieldView key={f.id} field={f} fieldKey={keyOf(section, f)} answers={answers} onChange={onChange} />
          ))}
      </div>
    </section>
  );
}

function Label({ field, htmlFor, id }: { field: Field; htmlFor?: string; id?: string }) {
  if (!field.label) return null;
  const Tag = htmlFor ? "label" : "p";
  return (
    <Tag id={id} htmlFor={htmlFor} className="mb-2 block text-[14px] font-medium text-fg">
      {field.icon ? <span className="me-1.5" aria-hidden>{field.icon}</span> : null}
      {field.label}
      {field.required ? <span className="ms-1 text-danger" aria-label="חובה">*</span> : null}
    </Tag>
  );
}

const pill = (on: boolean) =>
  cn(
    "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm transition-colors cursor-pointer has-focus-visible:ring-4 has-focus-visible:ring-accent/20",
    on ? "border-accent bg-accent-soft text-accent font-medium" : "border-line-strong bg-surface text-fg hover:border-accent",
  );

function FieldView({ field, fieldKey, answers, onChange }: { field: Field; fieldKey: string; answers: Answers; onChange: (key: string, value: unknown) => void }) {
  const id = useId();
  const value = answers[fieldKey];

  switch (field.type) {
    case "textarea":
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <textarea
            id={id}
            rows={3}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className={cn(inputClass, "h-auto min-h-24 resize-y py-2.5 leading-relaxed")}
          />
        </div>
      );

    case "choice": {
      const opts = optionsOf(field);
      return (
        <fieldset>
          <legend className="contents">
            <Label field={field} />
          </legend>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => (
              <label key={o.value} className={pill(value === o.value)} title={o.hint}>
                <input
                  type="radio"
                  name={id}
                  className="sr-only"
                  checked={value === o.value}
                  onChange={() => onChange(fieldKey, o.value)}
                  onClick={() => value === o.value && onChange(fieldKey, "")}
                />
                {o.icon ? <span aria-hidden>{o.icon}</span> : null}
                {o.label}
              </label>
            ))}
          </div>
          {opts.some((o) => o.hint) && value ? (
            <p className="mt-1.5 text-xs text-muted">{opts.find((o) => o.value === value)?.hint}</p>
          ) : null}
        </fieldset>
      );
    }

    case "multiChoice": {
      const selected = (value as string[]) ?? [];
      return (
        <fieldset>
          <legend className="contents">
            <Label field={field} />
          </legend>
          <div className="flex flex-wrap gap-2">
            {optionsOf(field).map((o) => {
              const on = selected.includes(o.value);
              return (
                <span key={o.value} className="inline-flex flex-wrap items-center gap-2">
                  <label className={pill(on)}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => onChange(fieldKey, on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                    />
                    {on ? <Check className="h-3.5 w-3.5" /> : null}
                    {o.label}
                  </label>
                  {on && o.withText ? (
                    <input
                      aria-label={`${o.label}: איזה?`}
                      placeholder="איזה?"
                      value={(answers[`${fieldKey}:${o.value}`] as string) ?? ""}
                      onChange={(e) => onChange(`${fieldKey}:${o.value}`, e.target.value)}
                      className={cn(inputClass, "h-10 w-40")}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        </fieldset>
      );
    }

    case "scale": {
      const min = field.min ?? 1;
      const max = field.max ?? 5;
      const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <fieldset>
          <legend className="contents">
            <Label field={field} />
          </legend>
          <ScaleRow name={id} steps={steps} value={value as number | undefined} onPick={(n) => onChange(fieldKey, n)} />
          {field.minLabel || field.maxLabel ? (
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>
                {min} = {field.minLabel}
              </span>
              <span>
                {max} = {field.maxLabel}
              </span>
            </div>
          ) : null}
        </fieldset>
      );
    }

    case "scaleGrid": {
      const grid = (value as Record<string, number>) ?? {};
      const min = field.min ?? 1;
      const max = field.max ?? 5;
      const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div>
          <p className="mb-3 text-[14px] font-medium text-fg">
            דירוג מהיר ({min} עד {max})
          </p>
          <div className="grid gap-3">
            {(field.items ?? []).map((item) => (
              <fieldset key={item.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <legend className="contents">
                  <span className="text-sm text-fg">{item.label}</span>
                </legend>
                <ScaleRow
                  name={`${id}-${item.id}`}
                  steps={steps}
                  value={grid[item.id]}
                  onPick={(n) => onChange(fieldKey, { ...grid, [item.id]: n })}
                />
              </fieldset>
            ))}
          </div>
        </div>
      );
    }

    case "rows":
      return <RowsField field={field} fieldKey={fieldKey} rows={(value as Row[]) ?? []} onChange={onChange} />;

    default: {
      const type = field.type === "file" ? "text" : field.type;
      return (
        <div>
          <Label field={field} htmlFor={id} />
          <input
            id={id}
            type={type}
            inputMode={type === "number" ? "numeric" : undefined}
            dir={type === "date" || type === "time" || type === "number" ? "ltr" : undefined}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(fieldKey, e.target.value)}
            className={cn(inputClass, (type === "date" || type === "time" || type === "number") && "max-w-48 text-end")}
          />
        </div>
      );
    }
  }
}

function ScaleRow({ name, steps, value, onPick }: { name: string; steps: number[]; value?: number; onPick: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" dir="ltr">
      {steps.map((n) => (
        <label key={n} className={cn(pill(value === n), "w-10 justify-center px-0 tabular-nums")}>
          <input type="radio" name={name} className="sr-only" checked={value === n} onChange={() => onPick(n)} />
          {n}
        </label>
      ))}
    </div>
  );
}

function RowsField({ field, fieldKey, rows, onChange }: { field: Field; fieldKey: string; rows: Row[]; onChange: (key: string, value: unknown) => void }) {
  const list = rows.length > 0 ? rows : [{}];
  const setRow = (i: number, patch: Row) => onChange(fieldKey, list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <Label field={field} />
      <p className="mb-3 text-xs text-muted">
        סוג: הבנה · פער בחינה · ממשק · תקלה. חומרה: 🔴 חוסם · 🟠 מאט · 🟡 קוסמטי. בצילום מסך רושמים את שם הקובץ.
      </p>
      <div className="grid gap-3">
        {list.map((row, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface-2/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-fg">נקודה {i + 1}</span>
              <button
                type="button"
                onClick={() => onChange(fieldKey, list.filter((_, j) => j !== i))}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger"
                aria-label={`מחיקת נקודה ${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" /> מחיקה
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(field.columns ?? []).map((c) => (
                <div key={c.id} className={c.type === "choice" ? "sm:col-span-2" : undefined}>
                  <FieldView
                    field={c}
                    fieldKey={c.id}
                    answers={row}
                    onChange={(k, v) => setRow(i, { [k]: v === undefined ? "" : String(v) })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => onChange(fieldKey, [...list, {}])}>
        <Plus className="h-3.5 w-3.5" /> עוד נקודה
      </Button>
    </div>
  );
}
