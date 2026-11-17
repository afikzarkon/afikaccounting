"use client";

import { Check, Clock, Loader2, MessageSquareWarning, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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

/** On the site in the last two minutes: the browser reports about once a minute while a tab is in view. */
const ONLINE_MS = 2 * 60_000;

// The clock, ticking every 20 seconds; null while rendering on the server, so nothing time-relative mismatches.
const tickers = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribeNow(cb: () => void) {
  tickers.add(cb);
  timer ??= setInterval(() => tickers.forEach((f) => f()), 20_000);
  return () => {
    tickers.delete(cb);
    if (!tickers.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
const useNow = () => useSyncExternalStore(subscribeNow, () => Math.floor(Date.now() / 20_000) * 20_000, () => null);

const isOnline = (a: UserActivity | undefined, now: number | null) => Boolean(now && a?.lastActive && now - new Date(a.lastActive).getTime() < ONLINE_MS);

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
  const now = useNow();
  const online = users.filter((u) => isOnline(usage.get(u.userId), now)).length;
  // Who is on the site changes by the minute: the list reloads itself while the page is in view.
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => document.visibilityState === "visible" && router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

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
        : Number(isOnline(of(b), now)) - Number(isOnline(of(a), now)) || (of(b).lastSeen ?? "").localeCompare(of(a).lastSeen ?? ""),
    );
  }, [users, filter, query, sort, usage, now]);

  return (
    <Panel
      title="חשבונות"
      description={
        <>
          {pending ? `${pending} ממתינים לאישור · ${users.length} חשבונות` : `${users.length} חשבונות · אין ממתינים`}
          {activity && now !== null && (
            <span className={cn("ms-2 inline-flex items-center gap-1 font-medium", online ? "text-success" : "")}>
              · <span className={cn("inline-block size-2 rounded-full", online ? "bg-success" : "bg-line-strong")} aria-hidden />
              {online === 1 ? "מחובר אחד עכשיו" : `${online} מחוברים עכשיו`}
            </span>
          )}
        </>
      }
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
              now={now}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{filter === "pending" ? "אין חשבונות שממתינים לאישור." : "אין חשבונות להצגה."}</p>
      )}
    </Panel>
  );
}

function UserRow({
  user,
  courses,
  self,
  tester,
  activity,
  now,
}: {
  user: AdminUser;
  courses: Course[];
  self: boolean;
  tester: boolean;
  activity: UserActivity | null;
  now: number | null;
}) {
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
          {activity && <ActivityLine activity={activity} admin={admin} now={now} />}
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
 * Whether the account is on the site right now (and on which page), else when it was last active,
 * to the minute; when it last signed in; and its sign-ins, visits and active days. An admin's visits
 * are never recorded (api/track), so an admin shows its sign-ins and presence only.
 */
function ActivityLine({ activity, admin, now }: { activity: UserActivity; admin: boolean; now: number | null }) {
  const online = isOnline(activity, now);
  const lastActive = activity.lastActive ?? activity.lastSeen;
  const presence =
    now === null ? null : online ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        מחובר עכשיו
        {activity.activePath && (
          <span dir="ltr" className="font-normal opacity-80">
            {activity.activePath}
          </span>
        )}
      </span>
    ) : lastActive ? (
      <span title={dateTime.format(new Date(lastActive))}>
        <span className="text-fg">פעיל לאחרונה</span> {ago(lastActive, now)}
      </span>
    ) : null;
  const signIn = activity.lastSignIn ? <span title={dateTime.format(new Date(activity.lastSignIn))}>התחברות אחרונה {when(activity.lastSignIn)}</span> : null;

  if (admin)
    return (
      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
        {presence}
        {signIn}
        <span>
          <span className="num font-semibold text-fg">{activity.signIns}</span> התחברויות · ביקורים של מנהלים לא נספרים
        </span>
      </span>
    );
  if (!activity.lastSeen && !activity.lastSignIn) return <span className="mt-1 block text-xs text-muted">עוד לא נכנס לאתר</span>;
  const stats = [
    { value: activity.signIns, label: "התחברויות", title: "כמה פעמים התחבר עם סיסמה או קישור" },
    { value: activity.visits, label: "ביקורים", title: "כל לשונית שנפתחה באתר כשהוא מחובר" },
    { value: activity.activeDays, label: "ימים פעילים", title: "בכמה ימים שונים השתמש באתר" },
  ];
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
      {presence}
      {signIn}
      {stats.map((s) => (
        <span key={s.label} title={s.title}>
          <span className="num font-semibold text-fg">{s.value}</span> {s.label}
        </span>
      ))}
    </span>
  );
}

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jerusalem" });
const hm = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" });

/** "היום ב-14:32", "אתמול ב-09:05", or "ב-12.11.26, 18:40" (Israel time). */
function when(iso: string) {
  const d = new Date(iso);
  const today = dayKey.format(new Date());
  const yesterday = dayKey.format(new Date(Date.now() - 86_400_000));
  const day = dayKey.format(d);
  if (day === today) return `היום ב-${hm.format(d)}`;
  if (day === yesterday) return `אתמול ב-${hm.format(d)}`;
  return `ב-${shortDate(iso)}, ${hm.format(d)}`;
}

/** "לפני 7 דקות" within the hour, "לפני 3 שעות (11:20)" within half a day, else the day and the hour. */
function ago(iso: string, now: number) {
  const mins = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return mins === 1 ? "לפני דקה" : `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 12) return `${hours === 1 ? "לפני שעה" : hours === 2 ? "לפני שעתיים" : `לפני ${hours} שעות`} (${hm.format(new Date(iso))})`;
  return when(iso);
}
