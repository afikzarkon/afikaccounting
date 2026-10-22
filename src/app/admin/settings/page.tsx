import type { Metadata } from "next";
import { Suspense } from "react";
import { PurgeEvents } from "@/components/admin/purge-events";
import { AdminHeader, AdminSkeleton, Panel, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { listAdmins, unlessSetupRequired } from "@/lib/data/admin";
import { shortDate } from "@/lib/utils";

export const metadata: Metadata = { title: "הגדרות" };

const GRANT_SQL = `update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'name@example.com');`;

export default function AdminSettingsPage() {
  return (
    <>
      <AdminHeader title="הגדרות" description="מנהלי המערכת ושמירת נתוני השימוש." />
      <Suspense fallback={<AdminSkeleton />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  const me = await requireAdmin("/admin/settings");
  const admins = await unlessSetupRequired(listAdmins());
  if (!admins) return <SetupRequired />;

  return (
    <div className="space-y-6">
      <Panel title="מנהלי המערכת" description="משתמשים עם גישה ל-/admin">
        <ul className="divide-y divide-line">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="text-fg">
                {a.fullName || "ללא שם"}
                {a.id === me.id && <span className="ms-2 text-xs text-accent">(את/ה)</span>}
              </span>
              <span className="text-xs text-muted">נרשם {shortDate(a.createdAt)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm font-medium text-fg">הוספת מנהל</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            המשתמש נרשם לאתר כרגיל, ואז מריצים ב-SQL Editor של Supabase את הפקודה הבאה עם כתובת המייל שלו. ההרשאה נבדקת במסד הנתונים עצמו: משתמש לא יכול לשנות לעצמו את
            התפקיד.
          </p>
          <pre dir="ltr" className="mt-3 overflow-x-auto rounded-xl bg-surface-2 p-3 text-start font-mono text-xs text-fg">
            {GRANT_SQL}
          </pre>
        </div>
      </Panel>

      <Panel title="שמירת נתוני אנליטיקה" description="האירועים אנונימיים. מחיקה של אירועים ישנים מקטינה את הטבלה ולא משפיעה על תוכן האתר.">
        <PurgeEvents />
      </Panel>
    </div>
  );
}
