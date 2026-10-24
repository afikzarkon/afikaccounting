"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type NavItem = (typeof site.nav)[number];
type NavGroup = Extract<NavItem, { items: unknown }>;

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
// Pages inside a category can nest (/ias16-lab and /ias16-lab/exchange), so each one is active only on its own path.
const isItemActive = (pathname: string, href: string) => pathname === href;
const groupActive = (pathname: string, group: NavGroup) => group.items.some((i) => isActive(pathname, i.href));
const startsSection = (group: NavGroup, n: number) => n === 0 || group.items[n].section !== group.items[n - 1].section;

/**
 * The hook-reading wrappers sit inside Suspense in the navbar, because a
 * dynamic route's URL is only known at request time; the views also render
 * as the fallback (pathname "": no active item).
 */
export function NavLinks() {
  return <NavLinksView pathname={usePathname()} />;
}

export function NavLinksView({ pathname = "" }: { pathname?: string }) {
  return (
    <nav aria-label="ניווט ראשי" className="hidden items-center gap-1 md:flex">
      {site.nav.map((item) => {
        if ("items" in item) return <NavDropdown key={item.label} group={item} pathname={pathname} />;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {active && <ActivePill />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActivePill() {
  return (
    <motion.span
      layoutId="nav-pill"
      className="absolute inset-0 -z-10 rounded-lg bg-surface-2"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}

/** A top-level category whose pages open in a solid panel under it. */
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active || open ? "text-fg" : "text-muted hover:text-fg",
        )}
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
            className="absolute start-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line-strong bg-surface p-1.5 shadow-xl"
          >
            {group.items.map((i, n) => {
              const on = isItemActive(pathname, i.href);
              return (
                <Fragment key={i.href}>
                  {startsSection(group, n) && <p className={cn("px-3 pb-1 text-xs font-semibold text-accent", n ? "mt-1 border-t border-line pt-2.5" : "pt-2")}>{i.section}</p>}
                  <Link
                    href={i.href}
                    aria-current={on ? "page" : undefined}
                    className={cn("block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2", on && "bg-surface-2")}
                  >
                    <span className="block text-sm font-semibold text-fg">{i.label}</span>
                    <span className="block text-xs text-muted">{i.description}</span>
                  </Link>
                </Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileNav() {
  return <MobileNavView pathname={usePathname()} />;
}

export function MobileNavView({ pathname = "" }: { pathname?: string }) {
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  // Close the menu after navigating.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const link = (href: string, label: string, nested = false) => {
    const on = nested ? isItemActive(pathname, href) : isActive(pathname, href);
    return (
    <Link
      key={href}
      href={href}
      className={cn(
        "block rounded-xl px-4 py-3 text-[15px] font-medium",
        nested && "ms-3 border-s-2 border-line-strong ps-4",
        on ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {label}
    </Link>
    );
  };

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-3 top-[4.25rem] z-50 rounded-2xl border border-line-strong bg-surface p-2 shadow-xl"
          >
            {site.nav.map((item) =>
              "items" in item ? (
                <div key={item.label} className="py-1">
                  <p className="px-4 pt-2 text-xs font-semibold text-subtle">{item.label}</p>
                  {item.items.map((i, n) => (
                    <Fragment key={i.href}>
                      {startsSection(item, n) && <p className="px-4 pt-1.5 pb-1 text-xs font-semibold text-accent">{i.section}</p>}
                      {link(i.href, i.label, true)}
                    </Fragment>
                  ))}
                </div>
              ) : (
                link(item.href, item.label)
              ),
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
