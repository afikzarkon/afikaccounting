import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeContent } from "@/components/home/home-content";
import { ExperimentExposure } from "@/components/layout/experiment-exposure";
import { EXPERIMENTS } from "@/lib/experiments";

/**
 * An experiment's variant, prerendered like the page it replaces. Visitors never see this address:
 * the proxy serves it at the page under test (see lib/experiments.ts). Not for search engines.
 */
export const metadata: Metadata = { robots: { index: false, follow: true }, alternates: { canonical: "/" } };

export function generateStaticParams() {
  return EXPERIMENTS.flatMap((e) => e.variants.slice(1).map((v) => ({ experiment: e.id, variant: v.id })));
}

export default async function Variant({ params }: PageProps<"/x/[experiment]/[variant]">) {
  const { experiment, variant } = await params;
  const e = EXPERIMENTS.find((x) => x.id === experiment);
  if (!e || !e.variants.slice(1).some((v) => v.id === variant)) notFound();
  if (e.id === "hero")
    return (
      <>
        <ExperimentExposure experiment={e.id} variant={variant} />
        <HomeContent heroVariant={variant} />
      </>
    );
  notFound();
}
