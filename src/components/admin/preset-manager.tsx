"use client";

import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { Badge } from "@/components/ui/primitives";
import { deletePreset, savePreset } from "@/lib/actions/admin-presets";
import type { AdminPreset } from "@/lib/data/admin";
import { cn, shortDate } from "@/lib/utils";
import { DataTable } from "./data-table";
import { Field, Modal } from "./modal";

type Option = { value: string; label: string };

/** The engine's share link carries the scenario: /engine?calc=<slug>&v=<json>. */
function fromLink(text: string): { slug: string; values: string } | null {
  try {
    const url = new URL(text.trim(), "https://x.invalid");
    const slug = url.searchParams.get("calc");
    const v = url.searchParams.get("v");
    if (!slug || !v) return null;
    return { slug, values: JSON.stringify(JSON.parse(v), null, 2) };
  } catch {
    return null;
  }
}

const engineLink = (p: AdminPreset) => `/engine?${new URLSearchParams({ calc: p.calculatorSlug, v: JSON.stringify(p.inputs) })}`;

export function PresetManager({ presets, calculators }: { presets: AdminPreset[]; calculators: Option[] }) {
  const [editing, setEditing] = useState<AdminPreset | "new" | null>(null);
  const calcLabel = (slug: string) => calculators.find((c) => c.value === slug)?.label ?? slug;

  const remove = async (p: AdminPreset) => {
    if (!confirm(`למחוק את התרחיש ״${p.title}״?`)) return;
    const res = await deletePreset(p.id);
    if (!res.ok) alert(res.error);
  };

  return (
    <>
      <DataTable
        rows={presets}
        rowKey={(r) => r.id}
        searchText={(r) => [r.title, r.description, calcLabel(r.calculatorSlug)].join(" ")}
        initialSort={{ key: "calc", dir: "asc" }}
        empty="אין עדיין תרחישים מוכנים."
        toolbar={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" /> תרחיש חדש
          </Button>
        }
        filters={[
          { key: "calc", label: "מחשבון", options: calculators, test: (r, v) => r.calculatorSlug === v },
          { key: "status", label: "סטטוס", options: [{ value: "1", label: "מוצג" }, { value: "0", label: "מוסתר" }], test: (r, v) => r.isPublished === (v === "1") },
        ]}
        columns={[
          {
            key: "title",
            label: "תרחיש",
            sort: (r) => r.title,
            render: (r) => (
              <div>
                <p className="font-medium text-fg">{r.title}</p>
                {r.description && <p className="line-clamp-1 text-xs text-muted">{r.description}</p>}
              </div>
            ),
          },
          { key: "calc", label: "מחשבון", sort: (r) => `${r.calculatorSlug}-${String(r.sortOrder).padStart(4, "0")}`, render: (r) => <span className="text-xs text-muted">{calcLabel(r.calculatorSlug)}</span> },
          { key: "order", label: "סדר", sort: (r) => r.sortOrder, render: (r) => <span className="num font-mono text-xs text-muted">{r.sortOrder}</span> },
          { key: "status", label: "סטטוס", sort: (r) => Number(r.isPublished), render: (r) => <Badge tone={r.isPublished ? "success" : "neutral"}>{r.isPublished ? "מוצג" : "מוסתר"}</Badge> },
          { key: "updated", label: "עודכן", sort: (r) => r.updatedAt, className: "whitespace-nowrap", render: (r) => <span className="text-xs text-muted">{shortDate(r.updatedAt)}</span> },
          {
            key: "actions",
            label: "",
            className: "w-px whitespace-nowrap",
            render: (r) => (
              <div className="flex justify-end gap-0.5">
                <a href={engineLink(r)} target="_blank" rel="noopener noreferrer" title="פתיחה במחשבון" aria-label="פתיחה במחשבון" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" onClick={() => setEditing(r)} title="עריכה" aria-label="עריכה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(r)} title="מחיקה" aria-label="מחיקה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={editing !== null} title={editing === "new" ? "תרחיש חדש" : "עריכת תרחיש"} onClose={() => setEditing(null)} wide>
        {editing !== null && <PresetForm preset={editing === "new" ? undefined : editing} calculators={calculators} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

function PresetForm({ preset, calculators, onDone }: { preset?: AdminPreset; calculators: Option[]; onDone: () => void }) {
  const [slug, setSlug] = useState(preset?.calculatorSlug ?? calculators[0]?.value ?? "");
  const [title, setTitle] = useState(preset?.title ?? "");
  const [description, setDescription] = useState(preset?.description ?? "");
  const [json, setJson] = useState(preset ? JSON.stringify(preset.inputs, null, 2) : "");
  const [order, setOrder] = useState(preset?.sortOrder ?? 0);
  const [published, setPublished] = useState(preset?.isPublished ?? true);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const paste = (text: string) => {
    setLink(text);
    const parsed = fromLink(text);
    if (parsed) {
      setSlug(parsed.slug);
      setJson(parsed.values);
      setError(undefined);
    }
  };

  const submit = async () => {
    let inputs: unknown;
    try {
      inputs = JSON.parse(json);
    } catch {
      return setError("הנתונים אינם JSON תקין.");
    }
    setBusy(true);
    const res = await savePreset({ calculatorSlug: slug, title, description, inputs, sortOrder: order, isPublished: published }, preset?.id);
    setBusy(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="space-y-4">
      <Field label="קישור מהמחשבון (מומלץ)" hint="פתרו את השאלה במחשבון, לחצו ״העתקת קישור״ והדביקו כאן — המחשבון והנתונים יתמלאו לבד.">
        <input dir="ltr" className={inputClass} value={link} onChange={(e) => paste(e.target.value)} placeholder="https://…/engine?calc=…&v=…" />
      </Field>
      {link && !fromLink(link) && <p className="text-xs text-danger">הקישור אינו קישור תרחיש מהמחשבון (חסרים בו calc ו-v).</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="מחשבון">
          <select className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)}>
            {calculators.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="כותרת" hint="מה שהמשתמש יראה על הכפתור">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="מבנה עם קרקע 30% ושערוך" />
        </Field>
      </div>
      <Field label="תיאור (רשות)" hint="מופיע במעבר עכבר">
        <textarea className={cn(inputClass, "h-16 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="נתוני התרחיש (JSON)" hint="נבדקים מול המחשבון בשמירה: תרחיש שהמנוע לא יכול לפתור לא יישמר.">
        <textarea dir="ltr" spellCheck={false} className={cn(inputClass, "h-48 py-2 font-mono text-xs")} value={json} onChange={(e) => setJson(e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-6">
        <Field label="סדר הצגה">
          <input type="number" className={cn(inputClass, "w-24")} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </Field>
        <label className="mt-5 flex items-center gap-2.5 text-sm text-fg">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          מוצג למשתמשים
        </label>
      </div>
      {error && <FormAlert error={error} />}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          ביטול
        </Button>
        <Button onClick={submit} disabled={busy || !title.trim() || !json.trim()}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} שמירה
        </Button>
      </div>
    </div>
  );
}
