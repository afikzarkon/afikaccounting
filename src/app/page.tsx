import { HomeContent } from "@/components/home/home-content";
import { ExperimentExposure } from "@/components/layout/experiment-exposure";

/** The home page: the control of any experiment running on it (see lib/experiments.ts). */
export default function Home() {
  return (
    <>
      <ExperimentExposure experiment="hero" />
      <HomeContent />
    </>
  );
}
