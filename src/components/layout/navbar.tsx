import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { getAccess } from "@/lib/auth/access";
import { getCurrentUser, getGateState, getProfile, isAdmin } from "@/lib/auth/dal";
import { TOPICS } from "@/lib/catalog";
import { ProgressSync } from "@/components/study-mode/progress-sync";
import { CourseLinks } from "./course-links";
import { FullSiteOnly, SessionMark } from "./session-store";
import { ContinueButton, ContinueView } from "./continue";
import { Logo } from "./logo";
import { MobileNav, MobileNavView, NavLinks, NavLinksView } from "./nav-links";
import { SearchTrigger } from "./search";
import { ThemeToggle } from "./theme-toggle";
import { UpgradeButton, UserMenu } from "./user-menu";

export function Navbar() {
  return (
    <header className="glass no-print sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 md:gap-6 lg:px-8">
        <Logo />
        {/* The closed site: the general menus only for an admin; everyone else sees their own courses (in AuthArea). */}
        <FullSiteOnly>
          <Suspense fallback={<NavLinksView />}>
            <NavLinks />
          </Suspense>
        </FullSiteOnly>
        <div className="ms-auto flex items-center gap-1.5">
          <FullSiteOnly>
            <Suspense fallback={<ContinueView />}>
              <ContinueButton />
            </Suspense>
            <SearchTrigger />
          </FullSiteOnly>
          {/* On a phone the theme switch lives in the menu, so the narrow header keeps room for the main button. */}
          <span className="hidden md:contents">
            <ThemeToggle />
          </span>
          <Suspense fallback={<Skeleton className="h-9 w-24" />}>
            <AuthArea />
          </Suspense>
          <FullSiteOnly>
            <Suspense fallback={<MobileNavView />}>
              <MobileNav />
            </Suspense>
          </FullSiteOnly>
        </div>
      </div>
    </header>
  );
}

/** Reads the session, so it streams in behind its own Suspense boundary. */
async function AuthArea() {
  const user = await getCurrentUser();
  // A guest only ever sees the sign-in pages: the proxy sends them there from everywhere else.
  if (!user) return <SessionMark signedIn={false} tier="free" scope={[]} />;
  const [profile, admin, access, gate] = await Promise.all([getProfile(), isAdmin(), getAccess(), getGateState()]);
  const approved = gate.signedIn && gate.status === "approved";
  const courses = admin ? [] : approved && gate.signedIn ? TOPICS.filter((t) => gate.courses.includes(t.id)).map((t) => ({ id: t.id, href: t.href, label: t.title })) : [];
  return (
    <>
      <SessionMark signedIn tier={access.tier} scope={admin ? "all" : courses.map((c) => c.id)} />
      {/* A signed-in reader's lesson progress follows them to every device. */}
      {(admin || approved) && <ProgressSync userId={user.id} />}
      {!admin && approved && <CourseLinks courses={courses} />}
      {admin && access.tier === "free" && <UpgradeButton />}
      <UserMenu name={profile?.fullName || user.email.split("@")[0]} email={user.email} admin={admin} mode={admin ? "full" : approved ? "courses" : "pending"} />
    </>
  );
}
