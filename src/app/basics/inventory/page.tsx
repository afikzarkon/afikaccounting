import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { type ChapterLink, ChapterNav } from "@/components/basics/chapter-nav";
import { InventoryChapters } from "@/components/basics/inventory";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "מלאי (IAS 2) — מדריך מלא ומחשבון",
  description:
    "מלאי מהרעיון ועד רמת מבחן: רישום תקופתי ותמידי, עלות לפי IAS 2, FIFO וממוצע משוקלל תקופתי ונע, שווי מימוש נטו, חילוץ נעלמים ושריפה — עם מחשבון שמראה את כל הדרך.",
};

const CHAPTERS: ChapterLink[] = [
  { id: "inv-idea", title: "הרעיון" },
  { id: "inv-terms", title: "אוצר מילים" },
  { id: "inv-systems", title: "תקופתי ותמידי" },
  { id: "inv-cogs", title: "עלות המכר והדוח" },
  { id: "inv-cost", title: "עלות המלאי" },
  { id: "inv-formulas", title: "שתי נוסחאות" },
  { id: "inv-fifo", title: "FIFO" },
  { id: "inv-wa", title: "ממוצע תקופתי" },
  { id: "inv-ma", title: "ממוצע נע" },
  { id: "inv-nrv", title: "עלות או שווי מימוש נטו" },
  { id: "inv-count", title: "מה נספר כמלאי" },
  { id: "inv-unknowns", title: "חילוץ נעלמים" },
  { id: "inv-exam", title: "פתרון שאלת מבחן" },
  { id: "inv-fullexam", title: "שאלה מלאה" },
  { id: "inv-tools", title: "מחשבון ותרגול" },
];

const ROADMAP: [string, string, string][] = [
  ["#inv-idea", "אני רוצה ללמוד מהיסוד", "15 פרקים קצרים, מהרעיון ועד רמת מבחן"],
  ["#inv-exam", "אני רוצה לפתור שאלת מבחן", "שגרת 8 צעדים, ביטויים ומלכודות"],
  ["#inv-tools", "אני רוצה מחשבון", "הזינו שאלה — וקבלו את הדרך המלאה"],
];

export default function InventoryPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Link href="/basics" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          <ArrowRight className="h-4 w-4" aria-hidden /> חזרה לחשבונאות מאפס
        </Link>
        <div className="mt-4">
          <Breadcrumbs trail={[{ label: "שלב 1 · יסודות" }, { label: "מלאי (IAS 2)" }]} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          מלאי <span className="text-gradient">מאפס ועד מבחן</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          מה שלא נמכר — לא הוצאה של השנה. מכאן מתחילים, ומשם מתקדמים צעד אחר צעד: שיטות רישום, עלות לפי IAS 2, שתי נוסחאות עלות (FIFO וממוצע משוקלל), שווי מימוש נטו, חילוץ נעלמים — ומחשבון שמראה את כל הדרך.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {ROADMAP.map(([href, title, hint]) => (
            <a key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-accent/60 hover:bg-accent-soft">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-fg">{title}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:-translate-x-1" aria-hidden />
            </a>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          מה צריך לדעת מראש: פקודת יומן בסיסית — חובה וזכות.{" "}
          <Link href="/basics" className="font-medium text-accent hover:underline">
            לחשבונאות מאפס
          </Link>
        </p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="contents lg:block lg:min-w-0">
            <ChapterNav chapters={CHAPTERS} />
          </aside>
          <div className="min-w-0 space-y-14">
            <InventoryChapters />
          </div>
        </div>
      </Container>
    </div>
  );
}
