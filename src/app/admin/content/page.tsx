import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentTable } from "@/components/admin/content-table";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { listContentAdmin, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "ניהול תוכן" };

export default function AdminContentPage() {
  return (
    <>
      <AdminHeader
        title="ניהול תוכן"
        description="שיעורי וידאו ומאמרים במרכז התוכן: טקסטים, נוסחאות, פרקים וקבצים מצורפים. שינוי שנשמר מופיע באתר מיד."
        actions={
          <ButtonLink href="/admin/content/new" size="sm">
            <Plus className="h-3.5 w-3.5" /> תוכן חדש
          </ButtonLink>
        }
      />
      <Suspense fallback={<AdminSkeleton />}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  await requireAdmin("/admin/content");
  const rows = await unlessSetupRequired(listContentAdmin());
  return rows ? <ContentTable rows={rows} /> : <SetupRequired />;
}
