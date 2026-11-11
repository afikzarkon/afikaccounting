"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MY_COURSES_PATH, courseOfPath } from "@/lib/gate";
import { cn } from "@/lib/utils";

type CourseLink = { id: string; href: string; label: string };

/**
 * The closed site's whole menu for an approved account: its own courses, and
 * the list of them. Nothing else on the site is linked — or open.
 */
export function CourseLinks({ courses }: { courses: CourseLink[] }) {
  const pathname = usePathname();
  const current = courseOfPath(pathname);
  const link = "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors";
  return (
    <nav aria-label="הקורסים שלי" className="me-auto hidden items-center gap-1 md:flex">
      <Link href={MY_COURSES_PATH} aria-current={pathname === MY_COURSES_PATH ? "page" : undefined} className={cn(link, pathname === MY_COURSES_PATH ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
        <BookOpen className="h-4 w-4" aria-hidden /> הקורסים שלי
      </Link>
      {courses.length <= 4 &&
        courses.map((c) => (
          <Link key={c.id} href={c.href} aria-current={current === c.id ? "page" : undefined} className={cn(link, current === c.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg")}>
            {c.label}
          </Link>
        ))}
    </nav>
  );
}
