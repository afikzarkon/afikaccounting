"use client";

import { type ComponentProps, type ComponentType, lazy, Suspense } from "react";

/*
 * The heavy interactive tools that only some lessons use, each loaded when it is first shown.
 *
 * Every lesson is one route (/study/[topic]), so every client component any lesson imports would
 * otherwise ship with every lesson: the first bookkeeping lesson downloaded the inventory calculator,
 * the IAS 19 drills and KaTeX. A lesson shows one screen at a time, so through these wrappers a tool's
 * script is fetched when the reader reaches the screen that holds it.
 *
 * React's `lazy`, not `next/dynamic`: Next.js loads a server-rendered `next/dynamic` component's
 * script with the page anyway (only in a file of its own), which saves nothing here.
 *
 * On a page rendered on the server (a course page's reference section), the tool is in the HTML,
 * and hydration keeps that HTML in place until the script arrives: nothing flashes. In the browser,
 * the first time a screen with a tool opens, a placeholder holds its place for that moment.
 * Server components import the tools from here instead of from their own files.
 */

function Placeholder() {
  return <div aria-busy="true" aria-label="טוען…" className="min-h-48 animate-pulse rounded-2xl bg-surface-2/60" />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any component; its props carry over to the wrapper.
function lazyWidget<C extends ComponentType<any>>(load: () => Promise<C>) {
  const Lazy = lazy(async () => ({ default: await load() })) as unknown as ComponentType<ComponentProps<C>>;
  function Widget(props: ComponentProps<C>) {
    return (
      <Suspense fallback={<Placeholder />}>
        <Lazy {...props} />
      </Suspense>
    );
  }
  return Widget;
}

// Fixed assets (IAS 16): the depreciation simulator, and the tools that set live formulas with KaTeX.
export const ProrationWidget = lazyWidget(() => import("@/components/learn/proration-widget").then((m) => m.ProrationWidget));
export const DepreciationSimulator = lazyWidget(() => import("@/components/learn/simulator").then((m) => m.DepreciationSimulator));
export const ExchangeCalculator = lazyWidget(() => import("@/components/exchange/calculator").then((m) => m.ExchangeCalculator));
export const RenovationCalculator = lazyWidget(() => import("@/components/renovation/calculator").then((m) => m.RenovationCalculator));
export const RevaluationCalculator = lazyWidget(() => import("@/components/revaluation/calculator").then((m) => m.RevaluationCalculator));

// Inventory: the calculator and all its panels.
export const InventoryCalculator = lazyWidget(() => import("./inventory-calculator").then((m) => m.InventoryCalculator));

// The basics course: the year-end worksheet game, and the credit-loss calculator.
export const WorksheetGame = lazyWidget(() => import("./worksheet-game").then((m) => m.WorksheetGame));
export const CreditLossCalculator = lazyWidget(() => import("./credit-calculator").then((m) => m.CreditLossCalculator));

// Employee benefits (IAS 19): the drills and explorers, one script between them.
const ias19 = () => import("./ias19-interactive");
export const DrillBox = lazyWidget(() => ias19().then((m) => m.DrillBox));
export const SolveTemplate = lazyWidget(() => ias19().then((m) => m.SolveTemplate));
export const PucExplorer = lazyWidget(() => ias19().then((m) => m.PucExplorer));
export const WindowExplorer = lazyWidget(() => ias19().then((m) => m.WindowExplorer));
export const TermDates = lazyWidget(() => ias19().then((m) => m.TermDates));
export const TermTest = lazyWidget(() => ias19().then((m) => m.TermTest));
export const RiskTest = lazyWidget(() => ias19().then((m) => m.RiskTest));
