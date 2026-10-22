import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContentEditor } from "@/components/admin/content-editor";
import { AdminHeader, AdminSkeleton, SetupRequired } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getContentAdmin, listMedia, unlessSetupRequired } from "@/lib/data/admin";

export const metadata: Metadata = { title: "עריכת תוכן" };

/** `/admin/content/new` creates; any other segment is the id of an item to edit. */
export default function AdminContentEditPage({ params }: PageProps<"/admin/content/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/content/[id]">["params"] }) {
  const { id } = await params;
  await requireAdmin(`/admin/content/${id}`);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const loaded = await unlessSetupRequired(Promise.all([isNew ? null : getContentAdmin(id), listMedia()]));
  if (!loaded) return <SetupRequired />;
  const [item, media] = loaded;
  if (!isNew && !item) notFound();
  return (
    <>
      <AdminHeader
        title={item ? item.title : "תוכן חדש"}
        description={
          <Link href="/admin/content" className="hover:text-accent">
            → חזרה לרשימת התוכן
          </Link>
        }
      />
      <ContentEditor key={item?.id ?? "new"} item={item ?? undefined} media={media} />
    </>
  );
}
