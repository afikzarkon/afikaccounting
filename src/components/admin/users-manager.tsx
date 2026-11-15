"use client";

import { Check, Clock, Loader2, MessageSquareWarning, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { setTester } from "@/lib/actions/admin-testers";
import { setUserAccess } from "@/lib/actions/admin-users";
import type { AdminUser, UserActivity } from "@/lib/data/admin";
import { cn, shortDate } from "@/lib/utils";
import { Panel } from "./ui";

type Course = { id: string; label: string };
type Filter = "pending" | "approved" | "rejected" | "all";
type Sort = "signup" | "activity" | "recent";

const SORTS: { id: Sort; label: string }[] = [
  { id: "signup", label: "הרשמה" },
  { id: "activity", label: "הכי פעילים" },
  { id: "recent", label: "נראו לאחרונה" },
];

const NO_ACTIVITY: UserActivity = { userId: "", signIns: 0, visits: 0, activeDays: 0, lastSeen: null };

const STATUS: Record<AdminUser["status"], { label: string; className: string }> = {
  pending: { label: "ממתין לאישור", className: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  approved: { label: "מאושר", className: "bg-success/10 text-success" },
  rejected: { label: "נדחה", className: "bg-danger/10 text-danger" },
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "ממתינים" },
  { id: "approved", label: "מאושרים" },
  { id: "rejected", label: "נדחו" },
  { id: "all", label: "כולם" },
];

/**
 * Every account: approve or reject it, choose the courses it may open, and mark course testers.
 * `activity` is how much each account used the site; null until its migration (20261115000000) runs.
 */
export function UsersManager({
  users,
  courses,
  me,
  testers = [],
  activity = null,
}: {
  users: AdminUser[];
  courses: Course[];
  me: string;
  testers?: string[];
  activity?: UserActivity[] | null;
}) {
  const pending = users.filter((u) => u.status === "pending" && u.role !== "admin").length;
  const [filter, setFilter] = useState<Filter>(pending ? "pending" : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("signup");
  const usage = useMemo(() => new Map((activity ?? []).map((a) => [a.userId, a])), [activity]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.filter(
      (u) => (filter === "all" || (u.role !== "admin" && u.status === filter)) && (!q || u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)),
    );
    if (sort === "signup") return list;
    const of = (u: AdminUser) => usage.get(u.userId) ?? NO_ACTIVITY;
    return [...list].sort((a, b) =>
      sort === "activity"
        ? of(b).visits - of(a).visits || of(b).signIns - of(a).signIns
        : (of(b).lastSeen ?? "").localeCompare(of(a).lastSeen ?? ""),
    );
  }, [users, filter, query, sort, usage]);

  return (
    <Panel
      title="חשבונות"
      description={pending ? `${pending} ממתינים לאישור · ${users.length} חשבונות` : `${users.length} חשבונות · אין ממתינים`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="סינון לפי סטטוס" className="flex gap-1 rounded-xl bg-surface-2 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", filter === f.id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}
              >
                {f.label}
                {f.id === "pending" && pending > 0 && <span className="num ms-1.5 text-amber-700 dark:text-amber-400">{pending}</span>}
              </button>
            ))}
          </div>
          {activity && (
            <select className={cn(inputClass, "h-9 w-auto")} value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="מיון">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  מיון: {s.label}
                </option>
              ))}
            </select>
          )}
          <input type="search" className={cn(inputClass, "h-9 w-48")} placeholder="חיפוש לפי שם או אימייל" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="חיפוש משתמש" />
        </div>
      }
    >
      {shown.length ? (
        <ul className="divide-y divide-line">
          {shown.map((u) => (
            <UserRow
              key={u.userId}
              user={u}
              courses={courses}
              self={u.userId === me}
              tester={testers.includes(u.userId)}
              activity={activity ? (usage.get(u.userId) ?? NO_ACTIVITY) : null}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{filter === "pending" ? "אין חשבונות שממתינים לאישור." : "אין חשבונות להצגה."}</p>
      )}
    </Panel>
  );
}

function UserRow({ user, courses, self, tester, activity }: { user: AdminUser; courses: Course[]; self: boolean; tester: boolean; activity: UserActivity | null }) {
  const [selected, setSelected] = useState<string[]>(user.courses);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const admin = user.role === "admin";
  const changed = selected.length !== user.courses.length || selected.some((c) => !user.courses.includes(c));

  const run = async (status: AdminUser["status"], label: string) => {
    if (status === "rejected" && !confirm(`לדחות את ${user.email}? החשבון לא יוכל להיכנס לאתר, וכל הקורסים שלו ייסגרו.`)) return;
    setBusy(status);
    setMessage(undefined);
    const res = await setUserAccess({ userId: user.userId, status, courses: status === "approved" ? selected : [] });
    setBusy(null);
    setMessage(res.ok ? { ok: true, text: label } : { ok: false, text: res.error });
  };

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((c) => c !== id) : [...s, id]));

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="min-w-0 flex-[1_1_14rem]">
          <span className="block truncate font-medium text-fg" dir="ltr">
            {user.email}
          </span>
          <span className="block text-xs text-muted">
            {user.fullName || "ללא שם"} · נרשם {shortDate(user.createdAt)}
            {user.reviewedAt ? ` · עודכן ${shortDate(user.reviewedAt)}` : ""}
          </span>
          {activity && <ActivityLine activity={activity} admin={admin} />}
        </span>
        {admin ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> מנהל · גישה מלאה
          </span>
        ) : (
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", STATUS[user.status].className)}>
            {user.status === "pending" && <Clock className="h-3.5 w-3.5" aria-hidden />}
            {STATUS[user.status].label}
          </span>
        )}
        {tester && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <MessageSquareWarning className="h-3.5 w-3.5" aria-hidden /> ניסיין
          </span>
        )}
      </div>

      {!admin && !self && (
        <>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">הקורסים שהמשתמש יוכל לראות</legend>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                      on ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    <input type="checkbox" className="accent-[var(--accent)]" checked={on} onChange={() => toggle(c.id)} />
                    {c.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            {user.status === "approved" ? (
              <Button size="sm" onClick={() => run("approved", "הקורסים עודכנו.")} disabled={!!busy || !changed || !selected.length}>
                {busy === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} שמירת קורסים
              </Button>
            ) : (
              <Button size="sm" onClick={() => run("approved", "החשבון אושר.")} disabled={!!busy || !selected.length} title={selected.length ? undefined : "בחרו לפחות קורס אחד"}>
                {busy === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} אישור
              </Button>
            )}
            {user.status !== "rejected" && (
              <Button variant="danger" size="sm" onClick={() => run("rejected", "החשבון נדחה.")} disabled={!!busy}>
                {busy === "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} {user.status === "approved" ? "חסימה" : "דחייה"}
              </Button>
            )}
            {user.status !== "pending" && (
              <Button variant="ghost" size="sm" onClick={() => run("pending", "החשבון הוחזר להמתנה.")} disabled={!!busy}>
                {busy === "pending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} החזרה להמתנה
              </Button>
            )}
            {user.status !== "approved" && !selected.length && <span className="text-xs text-muted">כדי לאשר, סמנו לפחות קורס אחד.</span>}
            <TesterToggle userId={user.userId} on={tester} approved={user.status === "approved"} />
            {message && <span className={message.ok ? "text-xs text-success" : "text-xs text-danger"}>{message.text}</span>}
          </div>
        </>
      )}
    </li>
  );
}

/**
 * Mark the account as a course tester: it gets the floating feedback button and the
 * feedback form (/tester), and what it writes shows in /admin/feedback. A tester still
 * needs to be approved, with the course to test, to open it.
 */
function TesterToggle({ userId, on, approved }: { userId: string; on: boolean; approved: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async () => {
    setBusy(true);
    setError(undefined);
    const res = await setTester({ userId, on: !on });
    setBusy(false);
    if (!res.ok) setError(res.error);
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2 border-s border-line ps-3">
      <Button variant={on ? "secondary" : "ghost"} size="sm" onClick={run} disabled={busy} aria-pressed={on} title="ניסיין רואה כפתור משוב בכל דף, ואת טופס המשוב">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareWarning className="h-3.5 w-3.5" />}
        {on ? "הסרה מהניסיינים" : "הגדרה כניסיין"}
      </Button>
      {on && !approved && <span className="text-xs text-muted">ניסיין צריך גם אישור וקורס כדי להתחיל.</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}

/**
 * Sign-ins, visits and active days, and when the account was last seen. An admin's
 * visits are never recorded (api/track), so an admin shows only its sign-ins.
 */
function ActivityLine({ activity, admin }: { activity: UserActivity; admin: boolean }) {
  if (admin)
    return (
      <span className="mt-1 block text-xs text-muted">
        <span className="num font-semibold text-fg">{activity.signIns}</span> התחברויות · ביקורים של מנהלים לא נספרים
      </span>
    );
  if (!activity.lastSeen) return <span className="mt-1 block text-xs text-muted">עוד לא נכנס לאתר</span>;
  const stats = [
    { value: activity.signIns, label: "התחברויות", title: "כמה פעמים התחבר עם סיסמה או קישור" },
    { value: activity.visits, label: "ביקורים", title: "כל לשונית שנפתחה באתר כשהוא מחובר" },
    { value: activity.activeDays, label: "ימים פעילים", title: "בכמה ימים שונים השתמש באתר" },
  ];
  return (
    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
      {stats.map((s) => (
        <span key={s.label} title={s.title}>
          <span className="num font-semibold text-fg">{s.value}</span> {s.label}
        </span>
      ))}
      <span>נראה לאחרונה {lastSeen(activity.lastSeen)}</span>
    </span>
  );
}

function lastSeen(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 7) return `לפני ${days} ימים`;
  return `ב-${shortDate(iso)}`;
}
