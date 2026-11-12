"use client";

import { Check, ExternalLink, MessageSquareWarning, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { type Answers, type Option, type Row, moduleName, schema } from "@/lib/tester/form";
import { setTesterMode, useFeedback, useTesterMode } from "@/lib/tester/store";
import { cn } from "@/lib/utils";

/**
 * The tester's floating "משוב" button, for an account an admin marked as a tester
 * (components/tester/feedback-gate.tsx decides), on every page but the form itself and
 * the admin, unless the tester hid it in this browser. It opens a side panel that records
 * a sticking point or a note into the same form, with the page filled in, without leaving
 * the lesson.
 */
export function TesterFeedbackButton() {
  const on = useTesterMode();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (!on || pathname.startsWith("/tester") || pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="משוב לניסיין"
        aria-expanded={open}
        className={cn(
          "no-print fixed right-3 z-40 flex size-11 items-center justify-center gap-2 rounded-full bg-amber-500 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 md:right-4 md:bottom-6 md:size-auto md:px-4 md:py-2.5",
          pathname.startsWith("/study/") ? "bottom-[calc(6.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
          open && "hidden",
        )}
      >
        <MessageSquareWarning className="size-5 md:size-4" aria-hidden />
        <span className="hidden md:inline">משוב</span>
      </button>
      {open && <FeedbackPanel onClose={() => setOpen(false)} />}
    </>
  );
}

const asOptions = (name: string): Option[] => (schema.enums[name] ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
const KINDS = asOptions("stuckType");
const SEVERITIES = asOptions("severity");

const NEW_MODULE = "new";

function pageWhere() {
  // The page title without the site's name at its end: "חשבונאות מאפס · שיעור 1: מהי חשבונאות".
  const parts = document.title.split(" · ");
  const title = (parts.length > 1 ? parts.slice(0, -1) : parts).join(" · ").trim();
  return `${title} (${location.pathname}${location.hash})`;
}

function FeedbackPanel({ onClose }: { onClose: () => void }) {
  const { state, update, canSave, status } = useFeedback();
  const [mode, setMode] = useState<"stuck" | "note">("stuck");
  const [target, setTarget] = useState<string>("");
  // The panel only opens in the browser, on a click, so the page can be read right away.
  const [where, setWhere] = useState(pageWhere);
  const [kind, setKind] = useState("");
  const [severity, setSeverity] = useState("");
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const modules = state?.modules ?? [];
  // The last module by default: the one the tester is most likely in now.
  const chosen = target || (modules.length ? String(modules.length - 1) : NEW_MODULE);
  const ready = mode === "stuck" ? Boolean(text.trim() || kind) : Boolean(text.trim());

  const save = () => {
    if (!state || !ready) return;
    const stamp = new Date().toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
    // Which module gets it. A blank last module (the form starts with one) is used before adding another.
    const slot = (list: Answers[]) => {
      const i = Number(chosen);
      if (chosen !== NEW_MODULE && i in list) return { i, add: false };
      const last = list[list.length - 1];
      return last && Object.keys(last).length === 0 ? { i: list.length - 1, add: false } : { i: list.length, add: true };
    };
    const at = slot(state.modules);
    setDone(at.add ? `מודול ${at.i + 1}` : moduleName(state.modules[at.i], at.i));
    update((s) => {
      const list = s.modules.slice();
      const { i, add } = slot(list);
      if (add) list.push({});
      const m = { ...list[i] };
      if (mode === "stuck") {
        const rows = ((m["stuckPoints.points"] as Row[]) ?? []).filter((r) => Object.values(r).some(Boolean));
        m["stuckPoints.points"] = [...rows, { where, kind, severity, tried: text.trim(), minutesLost: minutes, resolved: "" }];
      } else {
        const prev = ((m["freeText.other"] as string) ?? "").trim();
        m["freeText.other"] = `${prev ? `${prev}\n` : ""}[${stamp}] ${where}: ${text.trim()}`;
      }
      list[i] = m;
      return { ...s, modules: list };
    });
    setTarget(String(at.i));
    setText("");
    setKind("");
    setSeverity("");
    setMinutes("");
  };

  const chip = (on: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-1 rounded-xl border px-3 py-1.5 text-sm transition-colors",
      on ? "border-accent bg-accent-soft font-medium text-accent" : "border-line-strong bg-surface text-fg hover:border-accent",
    );

  return (
    <div className="no-print fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tester-panel-title">
      <button type="button" aria-label="סגירה" onClick={onClose} className="absolute inset-0 bg-black/30" tabIndex={-1} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-2xl border border-line-strong bg-surface shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[400px] md:rounded-none md:border-y-0 md:border-r-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p id="tester-panel-title" className="font-bold text-fg">
              משוב מהיר
            </p>
            <p className="text-xs text-muted">נרשם ישר לטופס המשוב שלכם</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" aria-label="סגירה">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex gap-2" role="tablist" aria-label="סוג המשוב">
            <button ref={first} type="button" role="tab" aria-selected={mode === "stuck"} onClick={() => setMode("stuck")} className={chip(mode === "stuck")}>
              נתקעתי כאן
            </button>
            <button type="button" role="tab" aria-selected={mode === "note"} onClick={() => setMode("note")} className={chip(mode === "note")}>
              הערה
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="tp-module" className="mb-1.5 block text-[13px] font-medium text-fg">
                לאיזה מודול
              </label>
              <select id="tp-module" value={chosen} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
                {modules.map((m, i) => (
                  <option key={i} value={String(i)}>
                    {moduleName(m, i)}
                  </option>
                ))}
                <option value={NEW_MODULE}>+ מודול חדש</option>
              </select>
            </div>

            <div>
              <label htmlFor="tp-where" className="mb-1.5 block text-[13px] font-medium text-fg">
                איפה
              </label>
              <input id="tp-where" value={where} onChange={(e) => setWhere(e.target.value)} className={inputClass} />
            </div>

            {mode === "stuck" && (
              <>
                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-medium text-fg">מה סוג הקושי</legend>
                  <div className="flex flex-wrap gap-2">
                    {KINDS.map((o) => (
                      <button key={o.value} type="button" title={o.hint} aria-pressed={kind === o.value} onClick={() => setKind(kind === o.value ? "" : o.value)} className={chip(kind === o.value)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-medium text-fg">כמה זה עצר אתכם</legend>
                  <div className="flex flex-wrap gap-2">
                    {SEVERITIES.map((o) => (
                      <button key={o.value} type="button" title={o.hint} aria-pressed={severity === o.value} onClick={() => setSeverity(severity === o.value ? "" : o.value)} className={chip(severity === o.value)}>
                        <span aria-hidden>{o.icon}</span>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div>
              <label htmlFor="tp-text" className="mb-1.5 block text-[13px] font-medium text-fg">
                {mode === "stuck" ? "מה קרה, ומה ניסיתם" : "מה רציתם לרשום"}
              </label>
              <textarea id="tp-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} className={cn(inputClass, "h-auto min-h-28 resize-y py-2.5 leading-relaxed")} />
            </div>

            {mode === "stuck" && (
              <div>
                <label htmlFor="tp-min" className="mb-1.5 block text-[13px] font-medium text-fg">
                  דקות שאבדו (לא חובה)
                </label>
                <input id="tp-min" type="number" inputMode="numeric" dir="ltr" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} className={cn(inputClass, "max-w-32 text-end")} />
              </div>
            )}

            {done !== null && (
              <p className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-sm text-success" role="status">
                <Check className="size-4" /> נרשם ב&quot;{done}&quot;. אפשר לרשום עוד, או לחזור לשיעור.
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-line px-5 py-4">
          <Button className="w-full" onClick={save} disabled={!state || !ready}>
            רישום
          </Button>
          <p className="mt-2 text-xs text-muted">
            {status === "loading" ? "טוען…" : status === "failed" ? "השמירה בחשבון נכשלה; נשמר בדפדפן." : canSave ? "נשמר בחשבון שלכם." : "נשמר בדפדפן הזה בלבד."}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <Link href="/tester" target="_blank" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              לטופס המלא <ExternalLink className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setTesterMode(false);
                onClose();
              }}
              className="text-xs text-muted hover:text-fg"
            >
              הסתרת הכפתור (מחזירים אותו מהטופס המלא)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
