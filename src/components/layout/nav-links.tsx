"use client";

import { ArrowLeft, ChevronDown, Menu, Search, Sprout, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLast, useReviewDue } from "@/components/study-mode/progress-store";
import { type NavEntry, type NavFeatured, type NavGroup, type NavItem, type NavLink, navFor } from "@/lib/site";
import { today } from "@/lib/study/review";
import { cn } from "@/lib/utils";
import { openSearch } from "./search";
import { ThemeToggle } from "./theme-toggle";
import { useVisibility } from "./visibility";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
/** A link to a spot inside a page (#tab) or a preset (?calc) is never "the page you're on". */
const plain = (href: string) => !/[?#]/.test(href);
// Pages inside a category can nest (/basics and /basics/inventory), so each one is active only on its own path.
const isItemActive = (pathname: string, href: string) => plain(href) && pathname === href;
const groupActive = (pathname: string, group: NavGroup) =>
  isActive(pathname, group.hub.href) || (!!group.featured && isActive(pathname, group.featured.href)) || group.items.some((i) => plain(i.href) && isActive(pathname, i.href));

/** The group's links, gathered under their section headings. */
const sectionsOf = (group: NavGroup) => {
  const out: { title: string; items: NavEntry[] }[] = [];
  for (const i of group.items) {
    const last = out.at(-1);
    if (last?.title === i.section) last.items.push(i);
    else out.push({ title: i.section, items: [i] });
  }
  return out;
};

const noSubscribe = () => () => {};

/**
 * The menu as this reader should see it: what the admin hid drops out, and the
 * review link shows only once there is something to review (a lesson opened, or
 * questions due), with today's count beside it. Read in the browser, from the
 * reader's own progress, so a first-time visitor never sees an empty "review".
 */
function useNav(): { nav: NavItem[]; due: number } {
  const nav = navFor(useVisibility().visibility);
  const last = useLast();
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const due = useReviewDue(day);
  const hasReview = !!last || due > 0;
  return { nav: nav.filter((i) => "items" in i || i.when !== "review" || hasReview), due };
}

/** A standard's code, as a quiet left-to-right chip. */
function Standard({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <bdi dir="ltr" className="num rounded-md bg-surface-2 px-1.5 py-px text-[11.5px] font-medium text-muted">
      {code}
    </bdi>
  );
}

/** The green "free" pill: "שיעור 1 חינם", "חינם כולו". */
function FreeTag({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-success">
      <Sprout className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function DueBadge({ due }: { due: number }) {
  if (due <= 0) return null;
  return (
    <span className="num grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent-soft px-1.5 text-[11px] font-bold text-accent">
      {due > 99 ? "99+" : due}
      <span className="sr-only"> שאלות מחכות היום</span>
    </span>
  );
}

/**
 * The hook-reading wrappers sit inside Suspense in the navbar, because a
 * dynamic route's URL is only known at request time; the views also render
 * as the fallback (pathname "": no active item).
 */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

export function NavLinksView({ pathname = "" }: { pathname?: string }) {
  const { nav, due } = useNav();
  return (
    <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
      {nav.map((item) => {
        if ("items" in item) return <NavDropdown key={item.label} group={item} pathname={pathname} />;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              item.tier === "exams" ? "font-semibold text-amber-800 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200" : active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && <ActivePill />}
            {item.label}
            {item.when === "review" && <DueBadge due={due} />}
          </Link>
        );
      })}
    </nav>
  );
}

function ActivePill() {
  return <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-lg bg-surface-2" transition={{ type: "spring", stiffness: 420, damping: 34 }} />;
}

/** The free course, as the menu's one highlighted card. */
function FeaturedCard({ f, pathname }: { f: NavFeatured; pathname: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-accent-soft p-4">
      <p className="text-xs font-semibold text-muted">{f.section}</p>
      <FreeTag label={f.tag} />
      <Link href={f.href} aria-current={isItemActive(pathname, f.href) ? "page" : undefined} className="text-[17px] font-bold text-fg hover:text-accent">
        {f.label}
      </Link>
      {f.description && <p className="text-[13px] leading-relaxed text-muted">{f.description}</p>}
      <Link href={f.cta.href} className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg transition hover:brightness-110">
        {f.cta.label} <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A row in a menu panel: title, standard chip and free tag, with a line of what's inside. */
function EntryLink({ i, pathname, onClick }: { i: NavEntry; pathname: string; onClick?: () => void }) {
  const on = isItemActive(pathname, i.href);
  return (
    <Link href={i.href} onClick={onClick} aria-current={on ? "page" : undefined} className={cn("block rounded-xl px-3 py-2 transition-colors hover:bg-surface-2", on && "bg-surface-2")}>
      <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-fg">
        {i.label}
        <Standard code={i.standard} />
        <FreeTag label={i.tag} />
      </span>
      {i.description && <span className="mt-0.5 block text-[13px] text-muted">{i.description}</span>}
    </Link>
  );
}

/** The links along the panel's bottom: the extras, then the category's own page at the end. */
function PanelFooter({ group }: { group: NavGroup }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-surface-2/70 px-4 py-2.5 text-sm font-semibold">
      {group.extra?.map((l) => (
        <Link key={l.href} href={l.href} className="inline-flex items-center gap-1.5 text-accent hover:underline">
          {l.label} <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ))}
      <Link href={group.hub.href} className="ms-auto inline-flex items-center gap-1.5 text-accent hover:underline">
        {group.hub.label} <ArrowLeft className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

/** A top-level category: its pages open in a panel under the header — the featured card first, then the sections. */
function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const ref = useRef<HTMLDivElement>(null);
  const active = groupActive(pathname, group);
  // Close the panel after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const sections = sectionsOf(group);
  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn("relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors", active || open ? "text-fg" : "text-muted hover:text-fg")}
      >
        {active && <ActivePill />}
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className={cn(
              "fixed inset-x-0 top-[4.25rem] z-50 mx-auto rounded-2xl border border-line-strong bg-surface p-3 shadow-xl",
              group.featured ? "w-[min(50rem,calc(100vw-2rem))]" : "w-[min(30rem,calc(100vw-2rem))]",
            )}
          >
            <div className={cn("max-h-[calc(100vh-10rem)] overflow-y-auto", group.featured && "grid gap-4 sm:grid-cols-[16rem_1fr]")}>
              {group.featured && <FeaturedCard f={group.featured} pathname={pathname} />}
              <div>
                {sections.map((s) => (
                  <div key={s.title} className="mb-1">
                    <p className="px-3 pt-1 pb-1 text-xs font-semibold text-muted">{s.title}</p>
                    {s.items.map((i) => (
                      <EntryLink key={i.href} i={i} pathname={pathname} />
                    ))}
                  </div>
                ))}
                {group.note && <p className="px-3 pt-1 text-xs text-muted">{group.note}</p>}
              </div>
            </div>
            <PanelFooter group={group} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav() {
  return <MobileNavView pathname={usePathname()} />;
}

/**
 * The phone's menu: a full-height sheet. The courses are open from the start —
 * on a phone the course list is the navigation — and the theme switch lives
 * here rather than in the narrow header.
 */
export function MobileNavView({ pathname = "" }: { pathname?: string }) {
  const { nav, due } = useNav();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  // Close the menu after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  // No page scroll behind the open sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const topLink = (l: NavLink) => {
    const on = isActive(pathname, l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        className={cn(
          "flex min-h-12 items-center justify-between gap-2 rounded-xl px-4 text-base font-medium",
          l.tier === "exams" ? "font-semibold text-amber-700 dark:text-amber-300" : on ? "bg-surface-2 text-fg" : "text-fg hover:bg-surface-2",
        )}
      >
        <span className="flex items-center gap-2">
          {l.label}
          {l.when === "review" && <DueBadge due={due} />}
        </span>
        <ArrowLeft className="h-4 w-4 text-muted" aria-hidden />
      </Link>
    );
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "סגירת התפריט" : "פתיחת התפריט"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label="ניווט ראשי"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            // Down to the bottom bar, not under it: the header's stacking context keeps the sheet below the bar.
            className="fixed inset-x-0 top-16 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 overflow-y-auto border-t border-line bg-canvas px-4 pt-3 pb-6"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSearch();
              }}
              className="mb-3 flex h-12 w-full items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[15px] text-subtle hover:border-accent/50 hover:text-muted"
            >
              <Search className="h-4 w-4" aria-hidden /> חיפוש: תקן, מושג, שיעור
            </button>
            {nav.map((item) =>
              "items" in item ? (
                // The courses start open; any other category folds, unless you're in it.
                <details key={item.label} open={!!item.featured || groupActive(pathname, item)} className="group border-b border-line py-1">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl px-4 text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
                    {item.label}
                    <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  {item.featured && (
                    <div className="mb-2">
                      <FeaturedCard f={item.featured} pathname={pathname} />
                    </div>
                  )}
                  {sectionsOf(item).map((s) => (
                    <div key={s.title}>
                      <p className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted">{s.title}</p>
                      {s.items.map((i) => (
                        <EntryLink key={i.href} i={i} pathname={pathname} />
                      ))}
                    </div>
                  ))}
                  {item.note && <p className="px-3 pt-1 text-xs text-muted">{item.note}</p>}
                  <div className="flex flex-wrap gap-x-5 px-3 py-2 text-sm font-semibold">
                    {item.extra?.map((l) => (
                      <Link key={l.href} href={l.href} className="inline-flex min-h-10 items-center gap-1.5 text-accent">
                        {l.label} <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    ))}
                    <Link href={item.hub.href} className="inline-flex min-h-10 items-center gap-1.5 text-accent">
                      {item.hub.label} <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </details>
              ) : (
                topLink(item)
              ),
            )}
            <div className="mt-3 flex min-h-12 items-center justify-between rounded-xl px-4 text-base font-medium text-fg">
              ערכת נושא
              <ThemeToggle />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
