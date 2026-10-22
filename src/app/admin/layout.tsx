import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: { default: "ניהול", template: "%s · ניהול" }, robots: { index: false } };

/**
 * The admin shell is static, so it renders instantly; each page checks the
 * admin role itself inside its Suspense boundary (layouts don't re-run on
 * navigation, so they can't be the only guard), and every action checks again.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Container className="pt-6 pb-10 lg:pt-10">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden items-center gap-2 px-3 text-xs font-semibold text-accent lg:flex">
            <ShieldCheck className="h-3.5 w-3.5" /> מערכת ניהול
          </p>
          <Suspense fallback={<AdminNavLinks />}>
            <AdminNav />
          </Suspense>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
