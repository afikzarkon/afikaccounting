"use client";

import { ChevronDown, ExternalLink, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { Panel } from "@/components/admin/ui";
import { inputClass } from "@/components/ui/form";
import { setVisibility } from "@/lib/actions/admin-visibility";
import { cn } from "@/lib/utils";
import type { ControlGroup, ControlItem } from "@/lib/visibility/server";

type State = { hidden: Record<string, boolean>; labels: Record<string, string> };

/** The admin's switches: every group, every item, lessons folded under their course. */
export function VisibilityManager({ groups, initial }: { groups: ControlGroup[]; initial: State }) {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (key: string, hidden: boolean, label?: string) => {
    const before = state;
    setState((s) => ({ hidden: { ...s.hidden, [key]: hidden }, labels: label === undefined ? s.labels : { ...s.labels, [key]: label } }));
    setError(null);
    start(async () => {
      const res = await setVisibility({ key, hidden, label: label ?? state.labels[key] ?? null });
      if (!res.ok) {
        setState(before);
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {groups.map((g) => {
        const count = countHidden(g.items, state.hidden);
        return (
          <Panel key={g.title} title={g.title} description={g.description} actions={count > 0 && <span className="text-xs font-medium text-danger">{count} מוסתרים</span>}>
            <ul className="divide-y divide-line">
              {g.items.map((item) => (
                <Row key={item.key} item={item} state={state} save={save} busy={pending} />
              ))}
            </ul>
          </Panel>
        );
      })}
    </div>
  );
}

const countHidden = (items: ControlItem[], hidden: Record<string, boolean>): number => items.reduce((n, i) => n + (hidden[i.key] ? 1 : 0) + countHidden(i.children ?? [], hidden), 0);

function Row({ item, state, save, busy, parentHidden = false }: { item: ControlItem; state: State; save: (key: string, hidden: boolean, label?: string) => void; busy: boolean; parentHidden?: boolean }) {
  const hidden = !!state.hidden[item.key];
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(state.labels[item.key] ?? "");
  const childHidden = countHidden(item.children ?? [], state.hidden);
  const off = hidden || parentHidden;

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Switch on={!hidden} disabled={busy || parentHidden} onChange={(on) => save(item.key, !on)} label={item.label} />
        <span className={cn("min-w-0 flex-1", off && "opacity-60")}>
          <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
            {off && <EyeOff className="h-3.5 w-3.5 text-danger" aria-label="מוסתר" />}
            {item.label}
          </span>
          {(item.hint || parentHidden) && <span className="block text-xs text-muted">{parentHidden ? "מוסתר יחד עם הקורס" : item.hint}</span>}
        </span>
        {item.href && (
          <a href={item.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
            פתיחה <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
        {item.children && item.children.length > 0 && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
            {item.children.length} שיעורים{childHidden > 0 && <span className="text-danger"> · {childHidden} מוסתרים</span>}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        )}
      </div>

      {item.renamable && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2 ps-14"
          onSubmit={(e) => {
            e.preventDefault();
            save(item.key, hidden, text);
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={80} placeholder={`הטקסט הנוכחי: ${item.label}`} aria-label={`טקסט חדש לכפתור ${item.label}`} className={cn(inputClass, "h-9 max-w-xs text-sm")} />
          <button type="submit" disabled={busy || text === (state.labels[item.key] ?? "")} className="h-9 rounded-lg border border-line px-3 text-xs font-medium text-fg hover:bg-surface-2 disabled:opacity-50">
            שמירת הטקסט
          </button>
          {state.labels[item.key] && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setText("");
                save(item.key, hidden, "");
              }}
              className="text-xs text-muted hover:text-fg"
            >
              חזרה לטקסט המקורי
            </button>
          )}
        </form>
      )}

      {open && item.children && (
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line ps-4">
          {item.children.map((c) => (
            <Row key={c.key} item={c} state={state} save={save} busy={busy} parentHidden={off} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Switch({ on, disabled, onChange, label }: { on: boolean; disabled?: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label}: ${on ? "מוצג" : "מוסתר"}`}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn("relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50", on ? "bg-success" : "bg-line-strong")}
    >
      <span className={cn("absolute h-5 w-5 rounded-full bg-white shadow transition-all", on ? "start-[1.1rem]" : "start-0.5")} />
    </button>
  );
}
