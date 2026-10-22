import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentCard } from "@/components/content/content-card";
import { ContentFilters } from "@/components/content/content-filters";
import { ButtonLink } from "@/components/ui/button";
import { Container, EmptyState, Skeleton } from "@/components/ui/primitives";
import type { ContentFilters as Filters } from "@/lib/content/types";
import { getFacets, listContent } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "מרכז התוכן",
  description: "שיעורי וידאו ומאמרים על IFRS, IAS ומיסוי ישראלי — סינון לפי תקן, קטגוריה ורמה.",
};

export default async function ContentPage({ searchParams }: PageProps<"/content">) {
  const facets = await getFacets();
  return (
    <Container className="pt-10 sm:pt-14">
      <p className="text-xs font-semibold text-accent">מרכז התוכן</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">לומדים את התקנים, ואז מיישמים אותם</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
        הדרכות וידאו של מומחים ומאמרים מעשיים, כל אחד מקושר למחשבון שמיישם אותו.
      </p>

      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-24 rounded-2xl" />}>
          <ContentFilters standards={facets.standards} categories={facets.categories} />
        </Suspense>
      </div>

      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function Results({ searchParams }: { searchParams: PageProps<"/content">["searchParams"] }) {
  const sp = await searchParams;
  const filters: Filters = {
    q: first(sp.q)?.slice(0, 100),
    standard: first(sp.standard),
    category: first(sp.category),
    level: first(sp.level),
    kind: first(sp.kind),
  };
  const items = await listContent(filters);

  return (
    <section aria-live="polite" className="mt-8">
      <p className="mb-4 text-sm text-muted">
        {items.length === 1 ? "תוצאה אחת" : `${items.length} תוצאות`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="אין תוצאות לסינון הזה"
          description="נסו חיפוש רחב יותר או הסירו מסנן."
          action={
            <ButtonLink href="/content" variant="secondary" size="sm">
              ניקוי סינון
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-80 rounded-2xl" />
      ))}
    </div>
  );
}
