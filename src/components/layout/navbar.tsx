import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { getAccess } from "@/lib/auth/access";
import { getCurrentUser, getProfile, isAdmin } from "@/lib/auth/dal";
import { ProgressSync } from "@/components/study-mode/progress-sync";
import { SessionMark } from "./session-store";
import { ContinueButton, ContinueView } from "./continue";
import { Logo } from "./logo";
import { MobileNav, MobileNavView, NavLinks, NavLinksView } from "./nav-links";
import { SearchTrigger } from "./search";
import { ThemeToggle } from "./theme-toggle";
import { GuestActions, UpgradeButton, UserMenu } from "./user-menu";

export function Navbar() {
  return (
    <header className="glass no-print sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-6 lg:px-8">
        <Logo />
        <Suspense fallback={<NavLinksView />}>
          <NavLinks />
        </Suspense>
        <div className="ms-auto flex items-center gap-1.5">
          <Suspense fallback={<ContinueView />}>
            <ContinueButton />
          </Suspense>
          <SearchTrigger />
          {/* On a phone the theme switch lives in the menu, so the narrow header keeps room for the main button. */}
          <span className="hidden md:contents">
            <ThemeToggle />
          </span>
          <Suspense fallback={<Skeleton className="h-9 w-24" />}>
            <AuthArea />
          </Suspense>
          <Suspense fallback={<MobileNavView />}>
            <MobileNav />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Reads the session, so it streams in behind its own Suspense boundary. */
async function AuthArea() {
  const user = await getCurrentUser();
  if (!user)
    return (
      <>
        <SessionMark signedIn={false} tier={(await getAccess()).tier} />
        <GuestActions />
      </>
    );
  const [profile, admin, access] = await Promise.all([getProfile(), isAdmin(), getAccess()]);
  return (
    <>
      <SessionMark signedIn tier={access.tier} />
      {/* A signed-in reader's lesson progress follows them to every device. */}
      <ProgressSync userId={user.id} />
      {access.tier === "free" && <UpgradeButton />}
      <UserMenu name={profile?.fullName || user.email.split("@")[0]} email={user.email} admin={admin} />
    </>
  );
}
