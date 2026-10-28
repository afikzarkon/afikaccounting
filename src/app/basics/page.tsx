import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { AdjustChapters } from "@/components/basics/adjust";
import { BooksChapters } from "@/components/basics/books";
import { ChapterNav } from "@/components/basics/chapter-nav";
import { CHAPTERS } from "@/components/basics/chapters";
import { EntriesChapters } from "@/components/basics/entries";
import { FinalChapters } from "@/components/basics/final";
import { IntroChapters } from "@/components/basics/intro";
import { TransactionLabChapter } from "@/components/basics/lab-chapter";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "חשבונאות בסיסית מאפס",
  description:
    "קורס קצר בעברית, צעד אחר צעד: חובה וזכות, פקודות יומן וכרטיסי T, מאזן בוחן ועודפים, התאמות סוף שנה, מלאי סגירה והפסדי אשראי — עם מעבדה אינטראקטיבית ותרגול.",
};

// The four stages of the books: the road this page walks, in order.
const ROADMAP: [string, string][] = [
  ["פקודת יומן", "lab"],
  ["כרטיסי T", "taccounts"],
  ["מאזן בוחן", "trial"],
  ["דוחות כספיים", "reports"],
];

export default function BasicsPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Breadcrumbs trail={[{ label: "שלב 1 · יסודות" }, { label: "חשבונאות מאפס" }]} />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          חשבונאות בסיסית <span className="text-gradient">מאפס</span>
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          <span className="num">{CHAPTERS.length}</span> פרקים קצרים, צעד אחר צעד.
        </p>
        <ol className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="ארבעת שלבי הרישום">
          {ROADMAP.map(([t, id], i) => (
            <li key={t} className="flex items-center gap-1.5">
              <a href={`#${id}`} className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-fg hover:border-accent/50">
                <span className="num grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">{i + 1}</span>
                {t}
              </a>
              {i < ROADMAP.length - 1 && <ArrowLeft className="h-3.5 w-3.5 text-subtle" aria-hidden />}
            </li>
          ))}
        </ol>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          {/* On narrow screens the aside dissolves, so its chip bar stays sticky along the whole page. */}
          <aside className="contents lg:block lg:min-w-0">
            <ChapterNav chapters={CHAPTERS} />
          </aside>
          <div className="min-w-0 space-y-14">
            <IntroChapters />
            <EntriesChapters />
            <TransactionLabChapter />
            <BooksChapters />
            <AdjustChapters />
            <FinalChapters />
          </div>
        </div>
      </Container>
    </div>
  );
}
