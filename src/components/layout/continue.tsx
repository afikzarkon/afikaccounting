"use client";

import { ArrowLeft, BookOpen, Crown, LogIn, Play, Repeat, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useLast, useReviewDue } from "@/components/study-mode/progress-store";
import { EXAMS_HUB, FIRST_LESSON, LEARN_HUB } from "@/lib/catalog";
import { studyHref } from "@/lib/study/href";
import { today } from "@/lib/study/review";
import { cn } from "@/lib/utils";
import { useSession } from "./session-store";
import { useVisibility } from "./visibility";

/** A ring that fills with the lesson's progress, its number inside. */
function Ring({ percent, n, size = 28 }: { percent: number; n: number; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(var(--accent) ${percent}%, color-mix(in srgb, var(--accent) 20%, transparent) 0)` }} aria-hidden>
      <span className="num grid place-items-center rounded-full bg-surface text-[11px] font-bold text-fg" style={{ width: size - 7, height: size - 7 }}>
        {n}
      </span>
    </span>
  );
}

/**
 * "Continue where you left off" in the header: the lesson opened last and how
 * far through it, one click back in. Nothing before a first lesson, nor on
 * that lesson's own page.
 */
export function ContinueButton() {
  return <ContinueView pathname={usePathname()} />;
}

export function ContinueView({ pathname = "" }: { pathname?: string }) {
  const last = useLast();
  if (!last || pathname === studyHref(last.slug)) return null;
  return (
    <Link
      href={studyHref(last.slug)}
      title={`להמשיך: ${last.course} · שיעור ${last.n}`}
      className="hidden h-9 max-w-[15rem] items-center gap-2 rounded-lg border border-line-strong bg-surface ps-1 pe-2.5 text-[13px] transition-colors hover:border-accent/50 xl:flex"
    >
      <Ring percent={last.percent} n={last.n} />
      <span className="min-w-0 leading-tight">
        <span className="num block text-[11px] text-muted">להמשיך · {last.percent}%</span>
        <span className="block truncate font-semibold text-fg">{last.title}</span>
      </span>
      <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}

const noSubscribe = () => () => {};

/**
 * The phone's bottom bar, always in reach: the courses, the exams area,
 * continue (the lesson opened last, or lesson 1), the review (with what is due today), and the account.
 * Not inside a lesson, whose own "previous / next" bar sits there; not in the admin.
 */
export function MobileTabBar() {
  return <MobileTabBarView pathname={usePathname()} />;
}

export function MobileTabBarView({ pathname = "" }: { pathname?: string }) {
  const last = useLast();
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const due = useReviewDue(day);
  const { linkShown } = useVisibility();
  const session = useSession();
  const guest = session.known && !session.signedIn;
  const showReview = !guest || !!last || due > 0;
  if (pathname.startsWith("/study/") || pathname.startsWith("/admin")) return null;
  const on = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const tab = "flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";
  return (
    <>
      {/* Room at the end of every page, so the bar never covers its last lines. */}
      <div className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden />
      <nav
        aria-label="ניווט מהיר"
        className="no-print fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {linkShown(LEARN_HUB.href) && (
          <Link href={LEARN_HUB.href} aria-current={on(LEARN_HUB.href) || pathname.startsWith("/basics") ? "page" : undefined} className={cn(tab, "h-16", on(LEARN_HUB.href) || pathname.startsWith("/basics") ? "text-accent" : "text-muted")}>
            <BookOpen className="h-5 w-5" aria-hidden /> קורסים
          </Link>
        )}
        {linkShown(EXAMS_HUB.href) && (
          <Link href={EXAMS_HUB.href} aria-current={on(EXAMS_HUB.href) ? "page" : undefined} className={cn(tab, "h-16", on(EXAMS_HUB.href) ? "text-gold" : "text-muted")}>
            <Crown className="h-5 w-5" aria-hidden /> מבחנים
          </Link>
        )}
        <Link href={last ? studyHref(last.slug) : FIRST_LESSON} className={cn(tab, "h-16 text-fg")}>
          <span className="-mt-5 grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)]" aria-hidden>
            <Play className="h-5 w-5" />
          </span>
          {last ? "להמשיך" : "להתחיל"}
        </Link>
        {showReview && (
        <Link href="/review" aria-current={on("/review") ? "page" : undefined} className={cn(tab, "relative h-16", on("/review") ? "text-accent" : "text-muted")}>
          <span className="relative">
            <Repeat className="h-5 w-5" aria-hidden />
            {due > 0 && (
              <span className="num absolute -end-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                {due > 99 ? "99+" : due}
              </span>
            )}
          </span>
          חזרה
          {due > 0 && <span className="sr-only">: {due} שאלות מחכות היום</span>}
        </Link>
        )}
        {/* A guest has no account yet: "sign in" stands where "me" would. */}
        {guest ? (
          <Link href="/login" aria-current={on("/login") ? "page" : undefined} className={cn(tab, "h-16", on("/login") ? "text-accent" : "text-muted")}>
            <LogIn className="h-5 w-5" aria-hidden /> התחברות
          </Link>
        ) : (
          <Link href="/profile" aria-current={on("/profile") || on("/dashboard") ? "page" : undefined} className={cn(tab, "h-16", on("/profile") || on("/dashboard") ? "text-accent" : "text-muted")}>
            <UserRound className="h-5 w-5" aria-hidden /> אני
          </Link>
        )}
      </nav>
    </>
  );
}
