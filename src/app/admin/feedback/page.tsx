import { CircleAlert, ClipboardList, Layers, Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, Kpi, Panel, SetupRequired, count } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { AddTester, RemoveTester } from "@/components/admin/testers-manager";
import { getTesterFeedback, listTesters, unlessSetupRequired } from "@/lib/data/admin";
import { type FormState, type Row, moduleName, sanitizeState, toMarkdown } from "@/lib/tester/form";

export const metadata: Metadata = { title: "משוב ניסיינים" };

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <FeedbackPage />
    </Suspense>
  );
}

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" });

function summarize(state: FormState) {
  const points = state.modules.flatMap((m) => ((m["stuckPoints.points"] as Row[]) ?? []).filter((r) => Object.values(r).some(Boolean)));
  return {
    code: (state.intake["intake.testerCode"] as string) || "",
    course: (state.intake["intake.course"] as string) || "",
    modules: state.modules.filter((m) => Object.keys(m).length > 0),
    points: points.length,
    blockers: points.filter((p) => p.severity === "blocker").length,
    verdict: (state.summary["summary.verdict"] as string) || "",
  };
}

async function FeedbackPage() {
  await requireAdmin("/admin/feedback");
  const loaded = await unlessSetupRequired(Promise.all([getTesterFeedback(), listTesters()]));
  if (!loaded) return <SetupRequired />;
  const [rows, people] = loaded;
  const emails = new Map(people.map((p) => [p.userId, p.email]));

  const testers = rows
    .map((r) => ({ ...r, state: sanitizeState(r.answers) }))
    .filter((r): r is typeof r & { state: FormState } => r.state !== null)
    .map((r) => ({ ...r, s: summarize(r.state) }));
  const total = testers.reduce(
    (t, x) => ({ modules: t.modules + x.s.modules.length, points: t.points + x.s.points, blockers: t.blockers + x.s.blockers }),
    { modules: 0, points: 0, blockers: 0 },
  );
  const all = JSON.stringify(testers.map((t) => ({ userId: t.userId, name: t.name, updatedAt: t.updatedAt, ...t.state })), null, 2);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="משוב ניסיינים"
        description="מי מוגדר כניסיין, ומה הניסיינים כתבו בטופס המשוב (/tester) ובכפתור המשוב שבתוך השיעורים."
        actions={
          testers.length > 0 ? (
            <a href={`data:application/json;charset=utf-8,${encodeURIComponent(all)}`} download="tester-feedback.json" className={buttonClass({ variant: "secondary", size: "sm" })}>
              הורדת הכל כ-JSON
            </a>
          ) : null
        }
      />

      <Panel title="ניסיינים" description="משתמש שמוגדר כאן רואה בכל מכשיר שהוא מחובר בו את כפתור המשוב הכתום, ויכול לפתוח את טופס המשוב (/tester). אפשר להגדיר ניסיין גם מהשורה שלו ב״משתמשים והרשאות״. ניסיין צריך גם אישור וקורס כדי להתחיל.">
        <AddTester />
        {people.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-start text-xs text-muted">
                  <th className="py-2 text-start font-medium">משתמש</th>
                  <th className="py-2 text-start font-medium">נוסף</th>
                  <th className="py-2 text-start font-medium">משוב אחרון</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.userId} className="border-b border-line last:border-0">
                    <td className="py-2.5">
                      <span dir="ltr" className="font-medium text-fg">
                        {p.email}
                      </span>
                      {p.fullName ? <span className="text-muted"> · {p.fullName}</span> : null}
                    </td>
                    <td className="py-2.5 text-muted">{dateTime.format(new Date(p.addedAt))}</td>
                    <td className="py-2.5 text-muted">{p.lastFeedbackAt ? dateTime.format(new Date(p.lastFeedbackAt)) : "עוד לא כתב"}</td>
                    <td className="py-2.5 text-end">
                      <RemoveTester userId={p.userId} email={p.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="ניסיינים" value={count(people.length)} hint={`${count(testers.length)} כבר כתבו משוב`} />
        <Kpi icon={Layers} label="מודולים שתועדו" value={count(total.modules)} />
        <Kpi icon={ClipboardList} label="נקודות היתקעות" value={count(total.points)} />
        <Kpi icon={CircleAlert} label="חוסמות" value={count(total.blockers)} tone={total.blockers > 0 ? "warn" : undefined} />
      </div>

      {testers.length === 0 ? (
        <Panel title="עוד אין משוב">
          <p className="text-sm text-muted">כשניסיין יתחיל למלא את הטופס או ירשום משהו בכפתור המשוב, המשוב שלו יופיע כאן.</p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {testers.map((t) => (
            <details key={t.userId} className="card group overflow-hidden">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold text-fg">
                    {t.s.code || t.name || emails.get(t.userId) || "ניסיין ללא קוד"}
                    {t.s.code && (t.name || emails.get(t.userId)) ? (
                      <span className="font-normal text-muted"> · {t.name || emails.get(t.userId)}</span>
                    ) : null}
                    {!emails.has(t.userId) && <span className="ms-2 text-xs font-normal text-subtle">(הוסר מהניסיינים)</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t.s.course ? `${t.s.course} · ` : ""}
                    {t.s.modules.length ? t.s.modules.map((m, i) => moduleName(m, i)).join(", ") : "בלי מודולים עדיין"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {t.s.blockers > 0 && <span className="rounded-full bg-danger/10 px-2.5 py-0.5 font-medium text-danger">{t.s.blockers} חוסמות</span>}
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">{t.s.points} נקודות היתקעות</span>
                  {t.s.verdict && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">אפשר מהקורס לבד? {t.s.verdict}</span>}
                  <span className="text-subtle">עודכן {dateTime.format(new Date(t.updatedAt))}</span>
                </div>
              </summary>
              <div className="border-t border-line px-5 py-4">
                <pre dir="rtl" className="max-h-[70vh] overflow-auto text-sm leading-relaxed whitespace-pre-wrap text-fg">
                  {toMarkdown(t.state)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
