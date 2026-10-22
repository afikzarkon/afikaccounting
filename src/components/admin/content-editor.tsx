"use client";

import { ArrowDown, ArrowUp, Bold, Eye, Italic, Link2, List, Loader2, Plus, Save, Sigma, SquareFunction, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RichParagraph } from "@/components/content/rich-text";
import { Button } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { type ContentInput, deleteContent, saveContent } from "@/lib/actions/admin-content";
import { LEVELS, type Resource } from "@/lib/content/types";
import type { AdminContent, MediaAsset } from "@/lib/data/admin";
import { duration } from "@/lib/engine/format";
import { parseEmbed } from "@/lib/media/embed";
import { cn } from "@/lib/utils";
import { Field, parseTags } from "./modal";

/** A section as edited: paragraphs are one text, separated by blank lines. */
type Section = { heading: string; text: string };

const toSections = (body: AdminContent["body"]): Section[] => body.map((s) => ({ heading: s.heading, text: s.paragraphs.join("\n\n") }));
const fromSections = (sections: Section[]) =>
  sections.map((s) => ({ heading: s.heading.trim(), paragraphs: s.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) }));

/** "m:ss", "h:mm:ss" or plain seconds, to seconds. */
function seconds(v: string) {
  const parts = v.trim().split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function resourceKind(m: MediaAsset): Resource["kind"] {
  const ext = m.url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "txt") return "txt";
  if (m.kind === "excel") return "xlsx";
  if (m.kind === "pdf") return "pdf";
  return "link";
}

const EMPTY: ContentInput = {
  slug: "",
  kind: "article",
  title: "",
  summary: "",
  standard: "",
  category: "",
  level: "beginner",
  durationSeconds: 0,
  videoUrl: "",
  body: [],
  chapters: [],
  resources: [],
  tags: [],
  isPublished: false,
};

export function ContentEditor({ item, media }: { item?: AdminContent; media: MediaAsset[] }) {
  const router = useRouter();
  const start: ContentInput = item ? { ...item, videoUrl: item.videoUrl ?? "" } : EMPTY;
  const [form, setForm] = useState<ContentInput>(start);
  const [sections, setSections] = useState<Section[]>(() => (item ? toSections(item.body) : [{ heading: "", text: "" }]));
  const [tags, setTags] = useState(start.tags.join(", "));
  const [chapters, setChapters] = useState(start.chapters.map((c) => ({ at: duration(c.at), title: c.title })));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ContentInput>(k: K, v: ContentInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };
  const videos = media.filter((m) => m.kind === "video");
  const files = media.filter((m) => m.kind !== "video");

  const save = async () => {
    setBusy(true);
    setError(undefined);
    const input: ContentInput = {
      ...form,
      body: fromSections(sections),
      tags: parseTags(tags),
      chapters: chapters.map((c) => ({ at: seconds(c.at), title: c.title })),
    };
    const res = await saveContent(input, item?.id);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setSaved(true);
    if (!item && res.id) router.replace(`/admin/content/${res.id}`);
    else router.refresh();
  };

  const remove = async () => {
    if (!item || !confirm(`למחוק את ״${item.title}״ לצמיתות?`)) return;
    const res = await deleteContent(item.id);
    if (res.ok) router.replace("/admin/content");
    else setError(res.error);
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-5 p-5">
        <h2 className="text-sm font-semibold text-fg">פרטים</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="כותרת">
            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="כתובת (slug)" hint="אותיות לטיניות קטנות, ספרות ומקפים. הכתובת תהיה ‎/content/‎slug">
            <input dir="ltr" className={cn(inputClass, "font-mono")} value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="ias-16-revaluation" />
          </Field>
          <Field label="סוג">
            <select className={inputClass} value={form.kind} onChange={(e) => set("kind", e.target.value as ContentInput["kind"])}>
              <option value="article">מאמר</option>
              <option value="video">שיעור וידאו</option>
            </select>
          </Field>
          <Field label="רמה">
            <select className={inputClass} value={form.level} onChange={(e) => set("level", e.target.value as ContentInput["level"])}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="תקן">
            <input className={inputClass} value={form.standard} onChange={(e) => set("standard", e.target.value)} placeholder="IAS 16" />
          </Field>
          <Field label="קטגוריה">
            <input className={inputClass} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="רכוש קבוע" />
          </Field>
          <Field label="תגיות" hint="מופרדות בפסיקים">
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <Field label="משך (דקות:שניות)" hint="לסרטון — אורכו; למאמר — זמן קריאה משוער">
            <input dir="ltr" className={cn(inputClass, "font-mono")} defaultValue={duration(form.durationSeconds)} onChange={(e) => set("durationSeconds", seconds(e.target.value))} />
          </Field>
        </div>
        <Field label="תקציר">
          <textarea className={cn(inputClass, "h-20 py-2")} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
        </Field>
        <label className="flex items-center gap-2.5 text-sm text-fg">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          פורסם באתר (אחרת נשמר כטיוטה)
        </label>
      </div>

      {form.kind === "video" && (
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold text-fg">וידאו</h2>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="קישור לסרטון" hint={form.videoUrl ? (parseEmbed(form.videoUrl) ? "סרטון מוטמע (YouTube / Vimeo)" : "קובץ וידאו ישיר") : "ריק — ציר זמן מדומה עד שתועלה הקלטה"}>
              <input dir="ltr" className={inputClass} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="או מהספרייה">
              <select className={inputClass} value="" onChange={(e) => e.target.value && set("videoUrl", e.target.value)}>
                <option value="">— בחירת סרטון —</option>
                {videos.map((v) => (
                  <option key={v.id} value={v.url}>
                    {v.title}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium text-fg">פרקים</p>
            <div className="space-y-2">
              {chapters.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input dir="ltr" aria-label="זמן" className={cn(inputClass, "w-24 font-mono")} value={c.at} onChange={(e) => setChapters((cs) => cs.map((x, j) => (j === i ? { ...x, at: e.target.value } : x)))} placeholder="3:05" />
                  <input aria-label="כותרת הפרק" className={inputClass} value={c.title} onChange={(e) => setChapters((cs) => cs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                  <Button variant="ghost" size="icon" aria-label="הסרת פרק" onClick={() => setChapters((cs) => cs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setChapters((cs) => [...cs, { at: "", title: "" }])}>
              <Plus className="h-3.5 w-3.5" /> הוספת פרק
            </Button>
          </div>
        </div>
      )}

      <div className="card space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-fg">גוף התוכן</h2>
          <p className="mt-1 text-xs text-muted">
            פסקאות מופרדות בשורה ריקה. עיצוב: <code>**מודגש**</code>, <code>*נטוי*</code>, <code>[טקסט](https://…)</code>, נוסחה בשורה <code dir="ltr">$S = \frac{"{n(n+1)}"}{"{2}"}$</code>, נוסחה בשורה נפרדת{" "}
            <code dir="ltr">$$…$$</code>, ורשימה בשורות שמתחילות ב-<code>- </code>.
          </p>
        </div>
        {sections.map((s, i) => (
          <SectionEditor
            key={i}
            index={i}
            section={s}
            count={sections.length}
            onChange={(next) => {
              setSections((all) => all.map((x, j) => (j === i ? next : x)));
              setSaved(false);
            }}
            onMove={(d) => setSections((all) => {
              const out = [...all];
              [out[i], out[i + d]] = [out[i + d], out[i]];
              return out;
            })}
            onRemove={() => setSections((all) => all.filter((_, j) => j !== i))}
          />
        ))}
        <Button variant="outline" size="sm" onClick={() => setSections((all) => [...all, { heading: "", text: "" }])}>
          <Plus className="h-3.5 w-3.5" /> הוספת פרק טקסט
        </Button>
      </div>

      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-fg">קבצים מצורפים</h2>
        {form.resources.map((r, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_7rem_1.4fr_5rem_auto]">
            <input aria-label="כותרת" className={inputClass} value={r.title} onChange={(e) => set("resources", form.resources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <select aria-label="סוג" className={inputClass} value={r.kind} onChange={(e) => set("resources", form.resources.map((x, j) => (j === i ? { ...x, kind: e.target.value as Resource["kind"] } : x)))}>
              {["xlsx", "csv", "pdf", "txt", "link"].map((k) => (
                <option key={k} value={k}>
                  {k.toUpperCase()}
                </option>
              ))}
            </select>
            <input dir="ltr" aria-label="קישור" className={inputClass} value={r.url} onChange={(e) => set("resources", form.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <input dir="ltr" aria-label="גודל" className={inputClass} value={r.size ?? ""} placeholder="1 MB" onChange={(e) => set("resources", form.resources.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
            <Button variant="ghost" size="icon" aria-label="הסרה" onClick={() => set("resources", form.resources.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => set("resources", [...form.resources, { title: "", kind: "link", url: "" }])}>
            <Plus className="h-3.5 w-3.5" /> קישור ידני
          </Button>
          <select
            className={cn(inputClass, "h-8 w-auto text-xs")}
            value=""
            onChange={(e) => {
              const m = files.find((x) => x.id === e.target.value);
              if (m) set("resources", [...form.resources, { title: m.title, kind: resourceKind(m), url: m.url, ...(m.sizeBytes ? { size: `${Math.max(1, Math.round(m.sizeBytes / 1024))} KB` } : {}) }]);
            }}
          >
            <option value="">+ צירוף קובץ מהספרייה…</option>
            {files.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <FormAlert error={error} />}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/90 p-3 shadow-card backdrop-blur">
        <div>
          {item && (
            <Button variant="danger" size="sm" onClick={remove}>
              <Trash2 className="h-3.5 w-3.5" /> מחיקה
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-success">✓ נשמר</span>}
          {item && form.isPublished && (
            <a href={`/content/${item.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-accent">
              צפייה באתר ↗
            </a>
          )}
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {item ? "שמירת שינויים" : "יצירה"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const MARKUP: { label: string; icon: typeof Bold; before: string; after: string; placeholder: string }[] = [
  { label: "מודגש", icon: Bold, before: "**", after: "**", placeholder: "טקסט" },
  { label: "נטוי", icon: Italic, before: "*", after: "*", placeholder: "טקסט" },
  { label: "קישור", icon: Link2, before: "[", after: "](https://)", placeholder: "טקסט הקישור" },
  { label: "נוסחה בשורה", icon: Sigma, before: "$", after: "$", placeholder: "x^2" },
  { label: "נוסחה בשורה נפרדת", icon: SquareFunction, before: "\n\n$$", after: "$$\n\n", placeholder: "\\frac{a}{b}" },
  { label: "רשימה", icon: List, before: "\n\n- ", after: "\n- ", placeholder: "פריט" },
];

function SectionEditor({
  index,
  section,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  section: Section;
  count: number;
  onChange: (s: Section) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  /** Wrap the selection (or a placeholder) in the markup, keeping the cursor inside it. */
  const insert = (m: (typeof MARKUP)[number]) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    const inner = value.slice(a, b) || m.placeholder;
    onChange({ ...section, text: value.slice(0, a) + m.before + inner + m.after + value.slice(b) });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + m.before.length, a + m.before.length + inner.length);
    });
  };

  return (
    <div className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 p-2">
        <span className="num grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{index + 1}</span>
        <input aria-label="כותרת הפרק" className={cn(inputClass, "h-9 min-w-48 flex-1")} value={section.heading} onChange={(e) => onChange({ ...section, heading: e.target.value })} placeholder="כותרת הפרק" />
        <div className="flex items-center">
          <Button variant="ghost" size="icon" aria-label="הזזה למעלה" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="הזזה למטה" disabled={index === count - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="מחיקת הפרק" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1">
        {MARKUP.map((m) => (
          <button key={m.label} type="button" title={m.label} aria-label={m.label} onClick={() => insert(m)} disabled={preview} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-40">
            <m.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          className={cn("ms-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs", preview ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2")}
        >
          <Eye className="h-3.5 w-3.5" /> תצוגה מקדימה
        </button>
      </div>
      {preview ? (
        <div className="min-h-40 space-y-4 p-4 text-[15px] leading-7 text-fg/85">
          {section.text
            .split(/\n\s*\n/)
            .filter((p) => p.trim())
            .map((p, j) => (
              <RichParagraph key={j} text={p} />
            ))}
        </div>
      ) : (
        <textarea
          ref={ref}
          aria-label={`טקסט הפרק ${index + 1}`}
          className="block min-h-40 w-full resize-y bg-transparent p-4 text-[15px] leading-7 text-fg outline-none"
          value={section.text}
          onChange={(e) => onChange({ ...section, text: e.target.value })}
        />
      )}
    </div>
  );
}
