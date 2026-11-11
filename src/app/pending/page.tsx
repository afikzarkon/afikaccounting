import { Clock, LogOut, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { signOut } from "@/lib/actions/auth";
import { getCurrentUser, getGateState } from "@/lib/auth/dal";
import { homeFor } from "@/lib/gate";

export const metadata: Metadata = { title: "ממתין לאישור", robots: { index: false } };

/**
 * Where an account waits until the admin approves it — the only page it can
 * open (the proxy sends it here from everywhere else). An approved account, or
 * an admin, is sent on to where it belongs.
 */
export default function PendingPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-16 h-80 max-w-md rounded-3xl" />}>
      <Pending />
    </Suspense>
  );
}

async function Pending() {
  const [user, state] = await Promise.all([getCurrentUser(), getGateState()]);
  if (!user || !state.signedIn) redirect("/login");
  if (state.admin || state.status === "approved") redirect(homeFor(state));
  const rejected = state.status === "rejected";

  return (
    <AuthCard
      title={rejected ? "הבקשה לא אושרה" : "החשבון ממתין לאישור"}
      description={
        rejected
          ? "מנהל האתר לא אישר את הגישה לחשבון הזה. אם נראה לכם שזו טעות, פנו אלינו."
          : "קיבלנו את ההרשמה. מנהל האתר יאשר את החשבון ויפתח לכם את הקורס שלכם — ואז תוכלו להיכנס."
      }
    >
      <div className="space-y-5">
        <p className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          {rejected ? <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden /> : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />}
          <span>
            מחוברים בתור{" "}
            <bdi dir="ltr" className="font-medium text-fg">
              {user.email}
            </bdi>
            . {rejected ? "" : "אין צורך לעשות דבר — אחרי האישור, רעננו את הדף או התחברו שוב."}
          </span>
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            <LogOut className="h-4 w-4" aria-hidden /> התנתקות
          </Button>
        </form>
      </div>
    </AuthCard>
  );
}
