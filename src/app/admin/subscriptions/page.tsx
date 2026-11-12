import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { RevokeTier } from "@/components/admin/grant-tier";
import { AdminHeader, AdminSkeleton, Panel, SetupRequired } from "@/components/admin/ui";
import { TierBadge } from "@/components/pricing/tier-badge";
import { requireAdmin } from "@/lib/auth/dal";
import { listDeviceAlerts, listSubscriptions, unlessSetupRequired } from "@/lib/data/admin";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "מנויים" };

const STATUS: Record<string, string> = { active: "פעיל", trialing: "ניסיון", past_due: "בפיגור תשלום", canceled: "בוטל" };

export default function AdminSubscriptionsPage() {
  return (
    <>
      <AdminHeader
        title="מנויים"
        description="המסלולים והתשלומים של המשתמשים. הגישה לקורסים עצמם נקבעת בדף משתמשים והרשאות."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <Subscriptions />
      </Suspense>
    </>
  );
}

async function Subscriptions() {
  await requireAdmin("/admin/subscriptions");
  const [data, alerts] = await Promise.all([unlessSetupRequired(listSubscriptions()), unlessSetupRequired(listDeviceAlerts())]);
  if (!data) return <SetupRequired />;

  return (
    <div className="space-y-6">
      {/* The closed site: access is per course, from the users page; a plan opens nothing on its own. */}
      <Panel title="גישה לקורסים" description="האתר סגור: מה שמשתמש רואה נקבע רק לפי הקורסים שסימנתם לו — לא לפי מסלול.">
        <p className="text-sm text-muted">
          כדי לאשר משתמש ולפתוח לו קורס ספציפי (בלי גישה לשאר הקורסים), עברו ל
          <Link href="/admin/users" className="font-semibold text-accent hover:underline">
            משתמשים והרשאות
          </Link>
          . המסלולים שבהמשך הדף נשמרים לתיעוד בלבד, ואינם פותחים קורסים.
        </p>
      </Panel>

      <Panel title="מסלולים" description={`${data.subscriptions.length} משתמשים`}>
        {data.subscriptions.length ? (
          <ul className="divide-y divide-line">
            {data.subscriptions.map((s) => {
              const { ended } = s;
              return (
                <li key={s.userId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
                  <span className="min-w-0 flex-[1_1_14rem]">
                    <span className="block font-medium text-fg" dir="ltr">
                      {s.email}
                    </span>
                    <span className="block text-xs text-muted">{s.fullName || "ללא שם"}</span>
                  </span>
                  <TierBadge tier={s.tier} />
                  <span className={ended ? "text-xs text-danger" : "text-xs text-muted"}>
                    {ended ? "הסתיים" : (STATUS[s.status] ?? s.status)} · {s.periodEnd ? `עד ${shortDate(s.periodEnd)}` : "ללא הגבלה"} · {s.provider === "manual" ? "ידני" : s.provider}
                  </span>
                  <RevokeTier userId={s.userId} email={s.email} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">עדיין אין מסלולים. הענקה ידנית מופיעה כאן מיד.</p>
        )}
      </Panel>

      <Panel
        title="חשבונות בשימוש חשוד"
        description="ב-30 הימים האחרונים: חשבון שנכנסו אליו משלושה מכשירים או יותר, או משתי מדינות. ייתכן שהוא משותף או נמכר. אפשר להיות מחוברים ממכשיר אחד בכל פעם; כניסה חדשה מנתקת את הקודמת."
      >
        {alerts === null ? (
          <p className="text-sm text-muted">כדי לראות את הרשימה, יש להריץ את ה-migration של החיבור היחיד (20261105000000_single_session.sql).</p>
        ) : alerts.length ? (
          <ul className="divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.userId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                <span className="min-w-0 flex-[1_1_14rem]">
                  <span className="block font-medium text-fg" dir="ltr">
                    {a.email}
                  </span>
                  <span className="block text-xs text-muted">{a.fullName || "ללא שם"}</span>
                </span>
                <span className="text-xs font-medium text-danger">
                  {a.devices} מכשירים · {a.countries || 1} {a.countries > 1 ? "מדינות" : "מדינה"} · {a.signIns} כניסות
                </span>
                <span className="w-full text-xs text-muted">
                  {a.labels.join(" · ")}
                  {a.countryList.length ? ` · ${a.countryList.join(", ")}` : ""} · אחרונה {shortDate(a.lastAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין חשבונות חשודים.</p>
        )}
      </Panel>

      <Panel title="נרשמו דרך מסלול בתשלום" description="בחרו מסלול בדף המחירים ונרשמו, לפני שהתשלום נפתח. אפשר להעניק להם את המסלול למעלה.">
        {data.interested.length ? (
          <ul className="divide-y divide-line">
            {data.interested.map((i) => (
              <li key={i.userId} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 text-fg" dir="ltr">
                  {i.email}
                </span>
                <TierBadge tier={i.plan} />
                <span className="text-xs text-muted">נרשם {shortDate(i.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין עדיין.</p>
        )}
      </Panel>

      <Panel title="רשימת עדכונים" description="מי שביקש הודעה כשמתחם המבחנים (או התשלום) נפתח.">
        {data.waitlist.length ? (
          <ul className="divide-y divide-line">
            {data.waitlist.map((w) => (
              <li key={`${w.email}-${w.topic}`} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="min-w-0 flex-1 text-fg" dir="ltr">
                  {w.email}
                </span>
                <TierBadge tier={w.topic === "exams" ? "exams" : "courses"} label={w.topic === "exams" ? "מתחם מבחנים" : "קורסים"} />
                <span className="text-xs text-muted">{shortDate(w.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">אין עדיין.</p>
        )}
      </Panel>
    </div>
  );
}
