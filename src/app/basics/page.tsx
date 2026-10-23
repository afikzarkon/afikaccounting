import type { Metadata } from "next";
import { AdjustChapters } from "@/components/basics/adjust";
import { BooksChapters } from "@/components/basics/books";
import { type ChapterLink, ChapterNav } from "@/components/basics/chapter-nav";
import { EntriesChapters } from "@/components/basics/entries";
import { FinalChapters } from "@/components/basics/final";
import { IntroChapters } from "@/components/basics/intro";
import { TransactionLabChapter } from "@/components/basics/lab-chapter";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "חשבונאות בסיסית מאפס",
  description:
    "קורס קצר בעברית למי שמעולם לא למד חשבונאות: חובה וזכות, פקודות יומן, כרטיסי T, מאזן בוחן, דוחות כספיים, חשבונות חתך, מלאי סגירה והפסדי אשראי — עם מעבדה אינטראקטיבית ותרגול.",
};

const CHAPTERS: ChapterLink[] = [
  { id: "what", title: "מהי חשבונאות" },
  { id: "entity", title: "ישות נפרדת" },
  { id: "types", title: "חמשת סוגי החשבונות" },
  { id: "equation", title: "הזהות החשבונאית" },
  { id: "expense", title: "הוצאה מול השקעה" },
  { id: "double", title: "רישום כפול ופקודת יומן" },
  { id: "lab", title: "מעבדת עסקאות" },
  { id: "credit", title: "עסקאות באשראי" },
  { id: "taccounts", title: "כרטיסי T" },
  { id: "trial", title: "מאזן בוחן" },
  { id: "reports", title: "מאזני, תוצאתי ודוחות" },
  { id: "accrual", title: "בסיס מצטבר והתאמות" },
  { id: "inventory", title: "מלאי סגירה" },
  { id: "creditloss", title: "הפסדי אשראי" },
  { id: "worksheet", title: "גיליון רב-טורי" },
  { id: "practice", title: "תרגול" },
  { id: "summary", title: "סיכום וכלי עזר" },
];

export default function BasicsPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <p className="text-xs font-semibold text-accent">לימוד · יסודות</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          חשבונאות בסיסית <span className="text-gradient">מאפס</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          למי שמעולם לא שמע את המילים &quot;חובה&quot; ו&quot;זכות&quot;. 17 פרקים קצרים, מהשאלה &quot;מה זה בכלל חשבונאות&quot; ועד גיליון רב-טורי עם התאמות סוף
          שנה — עם מעבדה שבה רושמים עסקאות בעצמכם, ו-15 שאלות תרגול.
        </p>

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
