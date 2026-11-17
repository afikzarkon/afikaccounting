"use client";

import { Check, Loader2, Pencil, Send, Trash2, X } from "lucide-react";
import { useState } from "react";
import { UpdateCard } from "@/components/tester/updates-popup";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { deleteTesterUpdate, editTesterUpdate, publishCourseChanges, publishTesterUpdate, skipCourseChanges } from "@/lib/actions/tester-updates";
import type { AdminTesterUpdate } from "@/lib/tester/updates";
import { cn } from "@/lib/utils";
import { Field } from "./modal";

type Draft = { title: string; body: string; linkHref: string; linkLabel: string };
type Course = { id: string; title: string };

function DraftFields({ d, setD }: { d: Draft; setD: (d: Draft) => void }) {
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });
  return (
    <div className="grid content-start gap-3">
      <Field label="כותרת">
        <input className={inputClass} value={d.title} onChange={set("title")} maxLength={120} />
      </Field>
      <Field label="מה השתנה">
        <textarea className={cn(inputClass, "h-auto min-h-32 resize-y py-2.5 leading-relaxed")} value={d.body} onChange={set("body")} maxLength={4000} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="קישור לדף (לא חובה)">
          <input className={inputClass} dir="ltr" value={d.linkHref} onChange={set("linkHref")} placeholder="/study/ias19-map" />
        </Field>
        <Field label="מה כתוב על הכפתור">
          <input className={inputClass} value={d.linkLabel} onChange={set("linkLabel")} maxLength={60} disabled={!d.linkHref} />
        </Field>
      </div>
    </div>
  );
}

/**
 * What the site found changed in one course since the last decision, written as an update:
 * the admin publishes it to the course's testers (rewording it first, if they like) or skips it.
 */
export function CourseChanges({
  course,
  suggestion,
  testers,
  since,
  canDecide,
}: {
  course: Course;
  suggestion: Draft;
  testers: number;
  since: string;
  canDecide: boolean;
}) {
  const [d, setD] = useState<Draft>(suggestion);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"publish" | "skip" | null>(null);
  const [error, setError] = useState("");

  const publish = async () => {
    if (!confirm(`לפרסם ל-${testers} הניסיינים של הקורס ${course.title}? זה יקפוץ להם בכניסה הבאה לאתר.`)) return;
    setBusy("publish");
    const res = await publishCourseChanges({ courseId: course.id, ...d });
    setBusy(null);
    if (!res.ok) setError(res.error);
  };
  const skip = async () => {
    if (!confirm("לא לפרסם? השינויים האלה לא יוצעו שוב, והניסיינים לא ישמעו עליהם.")) return;
    setBusy("skip");
    const res = await skipCourseChanges(course.id);
    setBusy(null);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-fg">
          {course.title} <span className="text-sm font-normal text-muted">· השתנה מאז {since}</span>
        </p>
        <p className="text-xs text-muted">{testers ? `יגיע ל-${testers} ניסיינים של הקורס` : "אין כרגע ניסיינים בקורס הזה"}</p>
      </div>
      <div className={cn("mt-3 grid gap-4", editing && "lg:grid-cols-2")}>
        {editing && <DraftFields d={d} setD={setD} />}
        <UpdateCard update={d} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={publish} disabled={!canDecide || busy !== null || !d.title.trim()}>
          {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} פרסום לניסיינים
        </Button>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>
          {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />} {editing ? "סיום עריכה" : "עריכת הנוסח"}
        </Button>
        <Button variant="ghost" onClick={skip} disabled={!canDecide || busy !== null}>
          {busy === "skip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} לא לפרסם
        </Button>
      </div>
      {!canDecide && <p className="mt-2 text-xs text-muted">זו גרסה מקומית של האתר: מפרסמים או מדלגים מהאתר החי, שבו השינויים כבר עלו.</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

const EMPTY: Draft = { title: "", body: "", linkHref: "", linkLabel: "" };

/** An update of the admin's own, for what the site can't see in the lessons (a new feature, a fix inside a component). */
export function ManualTesterUpdate({ courses }: { courses: Course[] }) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [courseId, setCourseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const run = async () => {
    const who = courseId ? `לניסיינים של ${courses.find((c) => c.id === courseId)?.title}` : "לכל הניסיינים";
    if (!confirm(`לפרסם ${who}? זה יקפוץ להם בכניסה הבאה לאתר.`)) return;
    setBusy(true);
    const res = await publishTesterUpdate({ courseId: courseId || null, ...d });
    setBusy(false);
    setMessage(res.ok ? { ok: true, text: "פורסם." } : { ok: false, text: res.error });
    if (res.ok) setD(EMPTY);
  };

  return (
    <form
      className="mt-3 grid gap-5 lg:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (d.title.trim() && !busy) void run();
      }}
    >
      <div className="grid content-start gap-3">
        <Field label="למי">
          <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">כל הניסיינים</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                הניסיינים של {c.title}
              </option>
            ))}
          </select>
        </Field>
        <DraftFields d={d} setD={setD} />
        <div>
          <Button type="submit" disabled={busy || !d.title.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} פרסום
          </Button>
        </div>
        {message && <p className={message.ok ? "text-sm text-success" : "text-sm text-danger"}>{message.text}</p>}
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-fg">כך זה ייראה לניסיין</p>
        <UpdateCard update={d} />
      </div>
    </form>
  );
}

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" });

/** An update already published: to whom, how many of them have seen it; fix or remove it. */
export function PublishedTesterUpdate({ update, courseTitle, unseen }: { update: AdminTesterUpdate; courseTitle: string; unseen: string[] }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState<Draft>({ title: update.title, body: update.body, linkHref: update.linkHref ?? "", linkLabel: update.linkLabel ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const remove = async () => {
    if (!confirm(`למחוק את "${update.title}"? ניסיינים שעוד לא ראו אותו לא יראו אותו.`)) return;
    setBusy(true);
    const res = await deleteTesterUpdate(update.id);
    setBusy(false);
    if (!res.ok) setError(res.error);
  };
  const save = async () => {
    setBusy(true);
    const res = await editTesterUpdate({ id: update.id, courseId: update.courseId, ...d });
    setBusy(false);
    if (res.ok) setEditing(false);
    else setError(res.error);
  };

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-fg">{update.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {courseTitle} · פורסם {dateTime.format(new Date(update.createdAt))} ·{" "}
            <span className={update.seen < update.audience ? "" : "text-success"}>
              ראו {update.seen} מתוך {update.audience}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3.5 w-3.5" /> עריכה
          </Button>
          <Button variant="danger" size="sm" onClick={remove} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} מחיקה
          </Button>
        </div>
      </div>
      {editing ? (
        <div className="mt-3 grid gap-3">
          <DraftFields d={d} setD={setD} />
          <div>
            <Button size="sm" onClick={save} disabled={busy || !d.title.trim()}>
              שמירה
            </Button>
          </div>
        </div>
      ) : (
        update.body && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{update.body}</p>
      )}
      {unseen.length > 0 && (
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">מי עוד לא ראה ({unseen.length})</summary>
          <p dir="ltr" className="mt-1 text-start leading-relaxed">
            {unseen.join(", ")}
          </p>
        </details>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
