import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { UsersManager } from "@/components/admin/users-manager";
import { requireAdmin } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { listTesters, listUserActivity, listUsers, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "משתמשים והרשאות" };

export default function AdminUsersPage() {
  return (
    <>
      <AdminHeader
        title="משתמשים והרשאות"
        description="האתר סגור: כל נרשם חדש ממתין לאישור, ולא רואה דבר עד שתאשרו אותו. משתמש מאושר רואה רק את הקורסים שסימנתם לו — לא את שאר האתר."
      />
      <Suspense fallback={<AdminSkeleton />}>
        <Users />
      </Suspense>
    </>
  );
}

async function Users() {
  const me = await requireAdmin("/admin/users");
  // Testers and activity come from their own functions; before their migrations run, there are none.
  const [users, testers, activity] = await Promise.all([
    unlessSetupRequired(listUsers()),
    listTesters().catch(() => []),
    listUserActivity().catch(() => null),
  ]);
  if (!users) return <SetupRequired />;
  const courses = TOPICS.map((t) => ({ id: t.id, label: t.standard ? `${t.title} (${t.standard})` : t.title }));
  return <UsersManager users={users} courses={courses} me={me.id} testers={testers.map((t) => t.userId)} activity={activity} />;
}
