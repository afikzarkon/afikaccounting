import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type ChapterLink, ChapterNav } from "@/components/basics/chapter-nav";
import { CreditLossChapters } from "@/components/basics/credit-losses";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "הפסדי אשראי — מדריך מלא",
  description:
    "הפרשה להפסדי אשראי חזויים מההתחלה ועד שאלת בחינה: כרטיס ההפרשה, מחיקת חובות אבודים, ביטול הפרשה, נעלם ביתרת פתיחה, ניתוח גיל חובות, הפרשה ספציפית וכללית, והצגת לקוחות נטו במאזן.",
};

const CHAPTERS: ChapterLink[] = [
  { id: "cl-why", title: "למה מפרישים" },
  { id: "cl-taccount", title: "כרטיס ההפרשה" },
  { id: "cl-entries", title: "כל פקודות היומן" },
  { id: "cl-opening", title: "נעלם ביתרת הפתיחה" },
  { id: "cl-closing", title: "חישוב יתרת הסגירה" },
  { id: "cl-specific", title: "ספציפית מול כללית" },
  { id: "cl-flow", title: "מכירות באשראי וגבייה" },
  { id: "cl-exam", title: "שאלה ברמת בחינה" },
  { id: "cl-tools", title: "מחשבון ותרגול" },
];

export default function CreditLossesPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-16 sm:pt-14">
        <Link href="/basics#creditloss" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          <ArrowRight className="h-4 w-4" aria-hidden /> חזרה לחשבונאות מאפס
        </Link>
        <p className="mt-4 text-xs font-semibold text-accent">לימוד · חשבונאות מאפס · העמקה</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          הפסדי <span className="text-gradient">אשראי</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          כל מה שצריך לדעת על הפרשה להפסדי אשראי חזויים: התאוריה, כרטיס ההפרשה, כל פקודות היומן, ודוגמה פתורה לכל סוג שאלה — עד שאלה מלאה ברמת בחינה.
        </p>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="contents lg:block lg:min-w-0">
            <ChapterNav chapters={CHAPTERS} />
          </aside>
          <div className="min-w-0 space-y-14">
            <CreditLossChapters />
          </div>
        </div>
      </Container>
    </div>
  );
}
