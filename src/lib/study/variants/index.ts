import { dbQ, depEntryQ, estimateQ, midYearQ, sydQ, unitsQ } from "../ias16/depreciation";
import { exchangeQuestions } from "../ias16/exchange";
import { machineQuestions } from "../ias16/intro";
import { oldRoofQ, renoFigures, renovationQuestions } from "../ias16/renovation";
import { dropQ, revaluationQuestions } from "../ias16/revaluation";
import type { Exercise } from "../types";

/**
 * Similar questions with new numbers: for each question that has them, a
 * maker that draws the question's numbers at random and builds it with the
 * lesson's own text and arithmetic. The numbers are drawn so every figure
 * comes out whole — a plausible exam question, not a puzzle of decimals.
 * Made on the server, for subscribers (actions/similar.ts); variants.test
 * checks hundreds of draws of each against the course's solvers.
 */
export type Rand = () => number;

/** A small seeded generator (mulberry32), so a draw can be repeated in a test. */
export function seeded(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r: Rand, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const step = (r: Rand, min: number, max: number, by: number) => int(r, Math.ceil(min / by), Math.floor(max / by)) * by;
const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

/** A straight-line asset whose depreciable amount divides by its life in whole thousands, with a salvage of up to a fifth. */
function straight(r: Rand) {
  const life = pick(r, [4, 5, 8, 10]);
  const annual = step(r, 5_000, 30_000, 1_000);
  const salvage = step(r, 0, (annual * life) / 4, 1_000);
  return { cost: annual * life + salvage, salvage, life, annual };
}

function machine(r: Rand) {
  const { cost, salvage, life } = straight(r);
  // Transport and installation each up to a tenth of the cost, so the price stays most of it.
  const transport = step(r, 1_000, Math.max(1_000, cost / 10), 1_000);
  const install = step(r, 1_000, Math.max(1_000, cost / 10), 1_000);
  return { price: cost - transport - install, transport, install, training: step(r, 1_000, 8_000, 1_000), salvage, life, years: int(r, 1, life - 1) };
}

function reno(r: Rand) {
  const life = pick(r, [10, 20, 25]);
  const cost = life * 12_000 * int(r, 1, 4);
  const firstYear = int(r, 2017, 2021);
  const year = firstYear + int(r, 2, 6);
  const month = int(r, 2, 12);
  const newLife = pick(r, [4, 5, 8, 10]);
  // The renovation rounds the new base up to whole months of the new life, so every charge is whole.
  const base = { cost, life, firstYear, year, month, renoCost: 0, newLife };
  const carrying = renoFigures(base).carrying;
  const unit = newLife * 12_000;
  const total = Math.ceil((carrying + 10_000) / unit) * unit;
  return { ...base, renoCost: total - carrying };
}

function swap(r: Rand) {
  const life = pick(r, [5, 8, 10]);
  const annual = 12_000 * int(r, 1, 3);
  const cost = annual * life;
  const accumulatedOpening = annual * int(r, 1, life - 2);
  const month = int(r, 2, 12);
  const carrying = cost - accumulatedOpening - (annual * (month - 1)) / 12;
  return { cost, life, accumulatedOpening, month, fairValue: carrying + step(r, 1_000, 20_000, 1_000), cash: step(r, 2_000, 15_000, 1_000) };
}

function reval(r: Rand) {
  const life = pick(r, [10, 20, 25, 40]);
  const cost = life * 1_000 * int(r, 3, 12);
  const firstYear = int(r, 2017, 2022);
  const elapsed = int(r, 1, Math.min(5, life - 2));
  const left = life - elapsed;
  const before = cost - (cost / life) * elapsed;
  // A fair value above the carrying amount, in whole thousands a year over the remaining life.
  const fairValue = left * 1_000 * (Math.floor(before / (left * 1_000)) + int(r, 1, 6));
  return { cost, life, firstYear, year: firstYear + elapsed, fairValue };
}

type Maker = (r: Rand) => Exercise;

export const VARIANTS: Record<string, Record<string, Maker>> = {
  "ias16-cost": {
    "machine-cost": (r) => machineQuestions(machine(r))["machine-cost"],
    "machine-buy": (r) => machineQuestions(machine(r))["machine-buy"],
  },
  "ias16-table": {
    "annual-dep": (r) => machineQuestions(machine(r))["annual-dep"],
    carrying: (r) => machineQuestions(machine(r)).carrying,
    "dep-entry": (r) => depEntryQ(straight(r)),
  },
  "ias16-straight": {
    "mid-year": (r) => {
      const life = pick(r, [4, 5, 8, 10]);
      return midYearQ({ cost: life * 12_000 * int(r, 1, 5), life, readyMonth: int(r, 2, 12) });
    },
  },
  "ias16-methods": {
    "syd-year2": (r) => {
      const life = pick(r, [3, 4, 5]);
      const salvage = step(r, 0, 20_000, 5_000);
      return sydQ({ cost: ((life * (life + 1)) / 2) * 1_000 * int(r, 2, 20) + salvage, salvage, life });
    },
    "db-year2": (r) => dbQ({ cost: step(r, 50_000, 200_000, 10_000), rate: pick(r, [10, 20, 25, 30, 40]) }),
    units: (r) => {
      const total = pick(r, [50_000, 80_000, 100_000, 120_000]);
      const rate = pick(r, [0.5, 1, 1.5, 2]);
      const salvage = step(r, 0, 10_000, 1_000);
      return unitsQ({ cost: total * rate + salvage, salvage, total, made: step(r, total / 10, (total * 2) / 5, 1_000) });
    },
  },
  "ias16-renovation": {
    estimate: (r) => {
      const life = pick(r, [8, 10, 12]);
      const left = int(r, 2, 6);
      return estimateQ({ cost: life * 1_000 * left * int(r, 1, 4), life, years: int(r, 2, life - 3), left });
    },
    "reno-capitalise": (r) => renovationQuestions(reno(r))["reno-capitalise"],
    "reno-carrying": (r) => renovationQuestions(reno(r))["reno-carrying"],
    "reno-year": (r) => renovationQuestions(reno(r))["reno-year"],
    "old-roof": (r) => {
      const cost = step(r, 20_000, 80_000, 5_000);
      return oldRoofQ({ cost, accumulated: step(r, 5_000, cost - 5_000, 5_000) });
    },
  },
  "ias16-exchange": {
    "swap-dep": (r) => exchangeQuestions(swap(r))["swap-dep"],
    "swap-gain": (r) => exchangeQuestions(swap(r))["swap-gain"],
    "swap-entry": (r) => exchangeQuestions(swap(r))["swap-entry"],
    "swap-cash": (r) => exchangeQuestions(swap(r))["swap-cash"],
    "swap-no-substance": (r) => exchangeQuestions(swap(r))["swap-no-substance"],
  },
  "ias16-revaluation": {
    "reval-gap": (r) => revaluationQuestions(reval(r))["reval-gap"],
    "reval-entry": (r) => revaluationQuestions(reval(r))["reval-entry"],
    "reval-new-dep": (r) => revaluationQuestions(reval(r))["reval-new-dep"],
    "reval-transfer": (r) => revaluationQuestions(reval(r))["reval-transfer"],
  },
  "ias16-revaluation-land": {
    "reval-drop": (r) => {
      const surplus = step(r, 5_000, 40_000, 1_000);
      return dropQ({ surplus, decrease: surplus + step(r, 1_000, 20_000, 1_000) });
    },
  },
};

/** Every question that has similar versions, as `slug:id`: what the review shows the button on. */
export const SIMILAR_IDS = Object.entries(VARIANTS).flatMap(([slug, qs]) => Object.keys(qs).map((id) => `${slug}:${id}`));

/** The number draws behind the makers, for the tests that check them against the solvers. */
export const DRAWS = { straight, machine, reno, swap, reval };

/** A similar question to one of a lesson's, with new numbers; none when it has no similar versions. */
export const makeSimilar = (slug: string, id: string, r: Rand = Math.random) => VARIANTS[slug]?.[id]?.(r) ?? null;
