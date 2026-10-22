"use client";

import { Copy, ExternalLink, FileSpreadsheet, FileText, Film, ImageIcon, Link2, Loader2, Pencil, MonitorPlay, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { Badge } from "@/components/ui/primitives";
import { addEmbed, deleteMedia, registerUpload, updateMedia } from "@/lib/actions/admin-media";
import type { MediaAsset, MediaKind } from "@/lib/data/admin";
import { parseEmbed, thumbnailUrl } from "@/lib/media/embed";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { cn, shortDate } from "@/lib/utils";
import { DataTable } from "./data-table";
import { Field, Modal, parseTags } from "./modal";
import { bytes } from "./ui";

type Option = { value: string; label: string };

const KIND: Record<MediaKind, { label: string; icon: typeof FileText }> = {
  excel: { label: "Excel", icon: FileSpreadsheet },
  pdf: { label: "PDF", icon: FileText },
  video: { label: "וידאו", icon: Film },
  image: { label: "תמונה", icon: ImageIcon },
  other: { label: "אחר", icon: Link2 },
};
const SOURCE = { upload: "הועלה לשרת", youtube: "YouTube", vimeo: "Vimeo" } as const;

function kindOf(file: File): MediaKind {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) return "excel";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "other";
}

/** A storage path the server accepts: "kind/<time>-<random>-<latin-name>". */
function storagePath(kind: MediaKind, name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^\w.]/g, "") : "";
  return `${kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${base}${ext}`;
}

const titleFromName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || name;

export function MediaManager({ items, modules }: { items: MediaAsset[]; modules: Option[] }) {
  const [dialog, setDialog] = useState<"upload" | "embed" | MediaAsset | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const moduleLabel = (v: string) => modules.find((m) => m.value === v)?.label ?? v;
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))].sort();

  const remove = async (item: MediaAsset) => {
    const what = item.source === "upload" ? "הפריט והקובץ בשרת יימחקו לצמיתות." : "הקישור יוסר מהספרייה.";
    if (!confirm(`למחוק את ״${item.title}״? ${what}`)) return;
    const res = await deleteMedia(item.id);
    if (!res.ok) alert(res.error);
  };
  const copy = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      prompt("העתיקו את הקישור:", url);
    }
  };

  return (
    <>
      <DataTable
        rows={items}
        rowKey={(r) => r.id}
        searchText={(r) => [r.title, r.description, r.category, r.module, ...r.tags].join(" ")}
        initialSort={{ key: "created", dir: "desc" }}
        empty="הספרייה ריקה. העלו קובץ או הטמיעו סרטון כדי להתחיל."
        toolbar={
          <>
            <Button size="sm" onClick={() => setDialog("upload")}>
              <Upload className="h-3.5 w-3.5" /> העלאת קבצים
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDialog("embed")}>
              <MonitorPlay className="h-3.5 w-3.5" /> הטמעת סרטון
            </Button>
          </>
        }
        filters={[
          { key: "kind", label: "סוג", options: Object.entries(KIND).map(([value, k]) => ({ value, label: k.label })), test: (r, v) => r.kind === v },
          { key: "source", label: "מקור", options: Object.entries(SOURCE).map(([value, label]) => ({ value, label })), test: (r, v) => r.source === v },
          { key: "module", label: "מודול", options: modules, test: (r, v) => r.module === v },
          ...(categories.length ? [{ key: "category", label: "קטגוריה", options: categories.map((c) => ({ value: c, label: c })), test: (r: MediaAsset, v: string) => r.category === v }] : []),
        ]}
        columns={[
          {
            key: "title",
            label: "פריט",
            sort: (r) => r.title,
            render: (r) => <MediaTitle item={r} />,
          },
          { key: "kind", label: "סוג", sort: (r) => r.kind, render: (r) => <Badge>{KIND[r.kind].label}</Badge> },
          { key: "size", label: "גודל", sort: (r) => r.sizeBytes, className: "whitespace-nowrap", render: (r) => <span className="num font-mono text-xs text-muted">{r.source === "upload" ? bytes(r.sizeBytes) : "—"}</span> },
          {
            key: "module",
            label: "שיוך",
            sort: (r) => `${r.module} ${r.category}`,
            render: (r) => (
              <div className="text-xs">
                {r.module && <p className="text-fg">{moduleLabel(r.module)}</p>}
                {r.category && <p className="text-muted">{r.category}</p>}
                {r.tags.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                        #{t}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ),
          },
          { key: "created", label: "נוסף", sort: (r) => r.createdAt, className: "whitespace-nowrap", render: (r) => <span className="text-xs text-muted">{shortDate(r.createdAt)}</span> },
          {
            key: "actions",
            label: "",
            className: "w-px whitespace-nowrap",
            render: (r) => (
              <div className="flex items-center justify-end gap-0.5">
                <IconButton label={copied === r.id ? "הועתק" : "העתקת קישור"} onClick={() => copy(r.url, r.id)}>
                  <Copy className={cn("h-4 w-4", copied === r.id && "text-success")} />
                </IconButton>
                <a href={r.url} target="_blank" rel="noopener noreferrer" aria-label="פתיחה" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <IconButton label="עריכה" onClick={() => setDialog(r)}>
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton label="מחיקה" onClick={() => remove(r)} danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
      />

      <Modal open={dialog === "upload"} title="העלאת קבצים" onClose={() => setDialog(null)} wide>
        <UploadForm modules={modules} onDone={() => setDialog(null)} />
      </Modal>
      <Modal open={dialog === "embed"} title="הטמעת סרטון מ-YouTube או Vimeo" onClose={() => setDialog(null)}>
        <EmbedForm modules={modules} onDone={() => setDialog(null)} />
      </Modal>
      <Modal open={typeof dialog === "object" && dialog !== null} title="עריכת פריט" onClose={() => setDialog(null)}>
        {typeof dialog === "object" && dialog !== null && <EditForm item={dialog} modules={modules} onDone={() => setDialog(null)} />}
      </Modal>
    </>
  );
}

function MediaTitle({ item }: { item: MediaAsset }) {
  const Icon = KIND[item.kind].icon;
  const embed = parseEmbed(item.source === "upload" ? null : item.url);
  const thumb = embed && thumbnailUrl(embed);
  return (
    <div className="flex items-center gap-3">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small remote thumbnail in an admin table.
        <img src={thumb} alt="" className="h-9 w-14 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-fg">{item.title}</p>
        <p className="truncate text-xs text-muted">{SOURCE[item.source]}{item.description && ` · ${item.description}`}</p>
      </div>
    </div>
  );
}

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2", danger ? "hover:text-danger" : "hover:text-fg")}
    >
      {children}
    </button>
  );
}

/** Category, module and tags: the same three fields on every form. */
function Labels({ modules, value, onChange }: { modules: Option[]; value: { category: string; module: string; tags: string }; onChange: (v: { category: string; module: string; tags: string }) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="קטגוריה">
        <input className={inputClass} value={value.category} onChange={(e) => onChange({ ...value, category: e.target.value })} placeholder="למשל: תבניות" />
      </Field>
      <Field label="מודול באתר">
        <select className={inputClass} value={value.module} onChange={(e) => onChange({ ...value, module: e.target.value })}>
          <option value="">— ללא —</option>
          {modules.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="תגיות" hint="מופרדות בפסיקים">
        <input className={inputClass} value={value.tags} onChange={(e) => onChange({ ...value, tags: e.target.value })} placeholder="פחת, שיערוך" />
      </Field>
    </div>
  );
}

type Pending = { file: File; title: string; status: "waiting" | "uploading" | "done" | "error"; error?: string };

/**
 * Uploads straight from the browser to the "media" bucket (the bucket's policy
 * admits only admins), then records each file in the library.
 */
function UploadForm({ modules, onDone }: { modules: Option[]; onDone: () => void }) {
  const [files, setFiles] = useState<Pending[]>([]);
  const [labels, setLabels] = useState({ category: "", module: "", tags: "" });
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...[...list].map((file) => ({ file, title: titleFromName(file.name), status: "waiting" as const }))]);
  };
  const patch = (i: number, p: Partial<Pending>) => setFiles((f) => f.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const upload = async () => {
    setBusy(true);
    const supabase = createBrowserSupabase();
    let failed = 0;
    for (const [i, p] of files.entries()) {
      if (p.status === "done") continue;
      patch(i, { status: "uploading", error: undefined });
      const kind = kindOf(p.file);
      const path = storagePath(kind, p.file.name);
      const { error } = await supabase.storage.from("media").upload(path, p.file, { contentType: p.file.type || undefined, upsert: false });
      if (error) {
        failed++;
        patch(i, { status: "error", error: error.message });
        continue;
      }
      const res = await registerUpload({ title: p.title, kind, path, mimeType: p.file.type, sizeBytes: p.file.size, category: labels.category, module: labels.module, tags: parseTags(labels.tags) });
      if (!res.ok) {
        failed++;
        await supabase.storage.from("media").remove([path]);
        patch(i, { status: "error", error: res.error });
        continue;
      }
      patch(i, { status: "done" });
    }
    setBusy(false);
    if (failed === 0) onDone();
  };

  return (
    <div className="space-y-5">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          over ? "border-accent bg-accent-soft" : "border-line-strong hover:border-accent/50",
        )}
      >
        <Upload className="h-6 w-6 text-accent" />
        <span className="text-sm font-medium text-fg">גררו קבצים לכאן או לחצו לבחירה</span>
        <span className="text-xs text-muted">Excel ‏(xlsx, xls, csv), PDF, וידאו ‏(mp4, webm) ותמונות. כמה קבצים בבת אחת.</span>
        <input type="file" multiple className="sr-only" accept=".xlsx,.xls,.xlsm,.csv,.pdf,video/*,image/*" onChange={(e) => add(e.target.files)} />
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((p, i) => (
            <li key={`${p.file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
              <Badge>{KIND[kindOf(p.file)].label}</Badge>
              <input
                className={cn(inputClass, "h-9 flex-1")}
                value={p.title}
                onChange={(e) => patch(i, { title: e.target.value })}
                disabled={p.status === "done" || busy}
                aria-label={`כותרת עבור ${p.file.name}`}
              />
              <span className="num w-16 shrink-0 text-end font-mono text-xs text-muted">{bytes(p.file.size)}</span>
              <span className="w-20 shrink-0 text-xs">
                {p.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                {p.status === "done" && <span className="text-success">✓ הועלה</span>}
                {p.status === "error" && <span className="text-danger" title={p.error}>✗ נכשל</span>}
                {p.status === "waiting" && !busy && (
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} className="text-muted hover:text-danger">
                    הסרה
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {files.some((f) => f.error) && <FormAlert error={files.find((f) => f.error)!.error} />}

      <Labels modules={modules} value={labels} onChange={setLabels} />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone} disabled={busy}>
          ביטול
        </Button>
        <Button onClick={upload} disabled={busy || files.every((f) => f.status === "done") || files.some((f) => !f.title.trim())}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          העלאה ({files.filter((f) => f.status !== "done").length})
        </Button>
      </div>
    </div>
  );
}

function EmbedForm({ modules, onDone }: { modules: Option[]; onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState({ category: "", module: "", tags: "" });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const embed = parseEmbed(url);
  const thumb = embed && thumbnailUrl(embed);

  const submit = async () => {
    setBusy(true);
    const res = await addEmbed({ url, title, description, category: labels.category, module: labels.module, tags: parseTags(labels.tags) });
    setBusy(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="space-y-4">
      <Field label="קישור לסרטון" hint={url && !embed ? "לא זוהה קישור YouTube או Vimeo." : embed ? `זוהה: ${embed.source === "youtube" ? "YouTube" : "Vimeo"}` : undefined}>
        <input dir="ltr" className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element -- preview of the linked video's thumbnail.
        <img src={thumb} alt="" className="aspect-video w-full rounded-xl object-cover" />
      )}
      <Field label="כותרת">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="תיאור (רשות)">
        <textarea className={cn(inputClass, "h-20 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Labels modules={modules} value={labels} onChange={setLabels} />
      {error && <FormAlert error={error} />}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          ביטול
        </Button>
        <Button onClick={submit} disabled={busy || !embed || !title.trim()}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} הוספה לספרייה
        </Button>
      </div>
    </div>
  );
}

function EditForm({ item, modules, onDone }: { item: MediaAsset; modules: Option[]; onDone: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [labels, setLabels] = useState({ category: item.category, module: item.module, tags: item.tags.join(", ") });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const res = await updateMedia(item.id, { title, description, category: labels.category, module: labels.module, tags: parseTags(labels.tags) });
    setBusy(false);
    if (res.ok) onDone();
    else setError(res.error);
  };

  return (
    <div className="space-y-4">
      <Field label="כותרת">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="תיאור">
        <textarea className={cn(inputClass, "h-20 py-2")} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Labels modules={modules} value={labels} onChange={setLabels} />
      <Field label="קישור">
        <input dir="ltr" readOnly className={cn(inputClass, "text-muted")} value={item.url} />
      </Field>
      {error && <FormAlert error={error} />}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          ביטול
        </Button>
        <Button onClick={submit} disabled={busy || !title.trim()}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} שמירה
        </Button>
      </div>
    </div>
  );
}
