import type { Metadata } from "next";
import { Suspense } from "react";
import type { PlayableItem } from "@/components/video/video-player";
import { Wizard, type WizardStart } from "@/components/engine/wizard";
import { Container, Skeleton } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/auth/dal";
import { getContent } from "@/lib/data/content";
import { listPublishedPresets } from "@/lib/data/presets";
import { getSavedSolution } from "@/lib/data/user";
import { CALCULATORS, getCalculator } from "@/lib/engine/registry";
import { defaults, sanitize, validateValues } from "@/lib/engine/validate";

export const metadata: Metadata = {
  title: "מנוע הפתרונות החשבונאי",
  description:
    "בוחרים תקן, מגדירים את התרחיש ומפיקים פקודות יומן, לוחות, באורים והסברים תוך שניות.",
};

export default function EnginePage({ searchParams }: PageProps<"/engine">) {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-6 sm:pt-14">
        <p className="text-xs font-semibold text-accent">מנוע הפתרונות החשבונאי החכם</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">מתרחיש לפתרון מלא</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
          בוחרים תקן, מתארים את העובדות, מזינים את המספרים — ומקבלים פקודות יומן מאוזנות, לוחות, באור וההנמקה
          שמאחוריהם.
        </p>
        <div className="mt-10">
          <Suspense fallback={<WizardSkeleton />}>
            <EngineLoader searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function EngineLoader({ searchParams }: { searchParams: PageProps<"/engine">["searchParams"] }) {
  const sp = await searchParams;
  const [user, explainers, presets] = await Promise.all([getCurrentUser(), loadExplainers(), listPublishedPresets()]);
  return <Wizard key={JSON.stringify(sp)} start={await resolveStart(sp)} explainers={explainers} presets={presets} signedIn={!!user} />;
}

/**
 * Where the wizard opens: a saved solution (`?solution=`), a shared scenario
 * (`?calc=&v=`), or just a pre-selected calculator (`?calc=`).
 */
async function resolveStart(sp: Record<string, string | string[] | undefined>): Promise<WizardStart | null> {
  const solutionId = first(sp.solution);
  if (solutionId) {
    const saved = await getSavedSolution(solutionId);
    const calc = getCalculator(saved?.calculatorSlug);
    if (saved && calc) {
      return { slug: calc.slug, values: sanitize(calc, saved.inputs), step: 3, saved: { id: saved.id, title: saved.title } };
    }
  }

  const calc = getCalculator(first(sp.calc));
  if (!calc) return null;

  const raw = first(sp.v);
  if (raw) {
    try {
      const values = sanitize(calc, JSON.parse(raw));
      const valid = Object.keys(validateValues(calc, values)).length === 0;
      return { slug: calc.slug, values, step: valid ? 3 : 2 };
    } catch {
      // Malformed link: fall through to a fresh scenario.
    }
  }
  return { slug: calc.slug, values: defaults(calc), step: 1 };
}

async function loadExplainers(): Promise<Record<string, PlayableItem>> {
  const slugs = CALCULATORS.map((c) => c.explainerSlug).filter((s): s is string => !!s);
  const items = await Promise.all(slugs.map((s) => getContent(s)));
  return Object.fromEntries(
    items
      .filter((i) => i !== null)
      .map((i) => [i.slug, { slug: i.slug, title: i.title, videoUrl: i.videoUrl, durationSeconds: i.durationSeconds, chapters: i.chapters }]),
  );
}

function WizardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
