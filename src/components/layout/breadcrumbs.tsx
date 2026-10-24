import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { LEARN_HUB } from "@/lib/catalog";

/** Where a learning page sits: always from the learning map down; the last crumb is the page itself. */
export function Breadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  const all = [{ label: "לימוד", href: LEARN_HUB.href }, ...trail];
  return (
    <nav aria-label="מיקום באתר" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-accent">
      {all.map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && <ChevronLeft className="h-3.5 w-3.5 text-subtle" aria-hidden />}
          {i === all.length - 1 ? (
            <span aria-current="page">{c.label}</span>
          ) : c.href ? (
            <Link href={c.href} className="hover:underline">
              {c.label}
            </Link>
          ) : (
            <span>{c.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
