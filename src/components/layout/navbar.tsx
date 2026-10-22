import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { getCurrentUser, getProfile, isAdmin } from "@/lib/auth/dal";
import { Logo } from "./logo";
import { MobileNav, MobileNavView, NavLinks, NavLinksView } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";
import { GuestActions, UserMenu } from "./user-menu";

export function Navbar() {
  return (
    <header className="glass no-print sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />
        <Suspense fallback={<NavLinksView />}>
          <NavLinks />
        </Suspense>
        <div className="ms-auto flex items-center gap-1.5">
          <ThemeToggle />
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
  if (!user) return <GuestActions />;
  const [profile, admin] = await Promise.all([getProfile(), isAdmin()]);
  return <UserMenu name={profile?.fullName || user.email.split("@")[0]} email={user.email} admin={admin} />;
}
