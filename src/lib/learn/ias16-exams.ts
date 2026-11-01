/**
 * The fixed-assets course's two exam-level questions (its last lesson): the
 * questions' data, and every answer worked out from it. The screens write the
 * questions from these numbers, and the tests check them against the course's
 * depreciation and revaluation solvers.
 */

// ---------------------------------------------------------------------------
// Question 1: "Hadfus Hayarok" buys a printing press. Its cost line by line,
// three components by three methods from 1 April, an improvement to the motor,
// maintenance, and an exchange of the whole machine at the end of 2025.

export const PRESS_Q = {
  price: 600_000,
  transport: 20_000,
  install: 30_000,
  staffHours: 100,
  hourly: 80,
  testing: 12_000,
  consultants: 25_000,
  /** The consultants' share that helped choose the machine; the rest installed it. */
  consultantsChoosing: 0.4,
  training: 15_000,
  launch: 10_000,
  /** Available for use on 1 April 2024; a strike held production back until 1 June. */
  availableMonth: 4,
  startedMonth: 6,
  head: { share: 0.4, life: 4 },
  frame: { share: 0.4, life: 10, salvage: 14_000 },
  motor: { share: 0.2, hours: 27_000, salvage: 2_000, used2024: 3_600, firstHalf2025: 2_000, secondHalf2025: 2_200 },
  maintenance: 6_000,
  improvement: 43_000,
  extraHours: 3_600,
  /** The exchange on 31.12.2025: the old machine's fair value, and cash the company received with the new one. */
  fairValue: 500_000,
  cashIn: 30_000,
};

export function press() {
  const P = PRESS_Q;
  const consultantsIn = P.consultants * (1 - P.consultantsChoosing);
  const cost = P.price + P.transport + P.install + P.staffHours * P.hourly + P.testing + consultantsIn;
  const expensed2024 = P.training + P.launch + P.consultants * P.consultantsChoosing;
  const part = (share: number) => cost * share;
  const months2024 = 13 - P.availableMonth;
  // The head, by the sum of the years' digits: each life year runs from 1 April, so a fiscal year takes 9 months of one and 3 of the one before.
  const digits = (P.head.life * (P.head.life + 1)) / 2;
  const headLife = (k: number) => (part(P.head.share) * (P.head.life - k + 1)) / digits;
  const head = [(headLife(1) * months2024) / 12, (headLife(1) * (12 - months2024)) / 12 + (headLife(2) * months2024) / 12];
  const frameAnnual = (part(P.frame.share) - P.frame.salvage) / P.frame.life;
  const frame = [(frameAnnual * months2024) / 12, frameAnnual];
  const rate1 = (part(P.motor.share) - P.motor.salvage) / P.motor.hours;
  const motor2024 = rate1 * P.motor.used2024;
  const motorFirstHalf = rate1 * P.motor.firstHalf2025;
  const motorCarryingAtImprovement = part(P.motor.share) - motor2024 - motorFirstHalf;
  const hoursLeft = P.motor.hours - P.motor.used2024 - P.motor.firstHalf2025;
  const rate2 = (motorCarryingAtImprovement + P.improvement - P.motor.salvage) / (hoursLeft + P.extraHours);
  const motor = [motor2024, motorFirstHalf + rate2 * P.motor.secondHalf2025];
  const dep = [head[0] + frame[0] + motor[0], head[1] + frame[1] + motor[1]];
  const accum2024 = dep[0];
  const accum2025 = dep[0] + dep[1];
  const cost2025 = cost + P.improvement;
  const carrying2025 = cost2025 - accum2025;
  const gain = P.fairValue - carrying2025;
  const newCost = P.fairValue - P.cashIn;
  return {
    consultantsIn,
    cost,
    expensed2024,
    parts: { head: part(P.head.share), frame: part(P.frame.share), motor: part(P.motor.share) },
    headLife: [headLife(1), headLife(2)],
    head,
    frameAnnual,
    frame,
    rate1,
    motorCarryingAtImprovement,
    hoursLeft,
    rate2,
    motor,
    dep,
    carrying2024: cost - accum2024,
    accum2024,
    cost2025,
    accum2025,
    carrying2025,
    gain,
    newCost,
  };
}

// ---------------------------------------------------------------------------
// Question 2: "Logistika Tzfonit" buys an office building with its land and
// revalues it every year (reset, transfer by depreciation), then sells it;
// four trucks bought together, one of them sold.

export const LOGI_Q = {
  price: 5_000_000,
  purchaseTax: 0.06,
  lawyer: 0.01,
  land: 0.2,
  life: 25,
  /** Fair values of the whole property (building and land) at the end of 2023 and of 2024. */
  fair: [5_580_000, 5_000_000],
  /** Sold on 1.1.2025, with no revaluation before the sale. */
  salePrice: 5_100_000,
  trucks: { count: 4, each: 400_000, boughtMonth: 7, availableMonth: 9, life: 8, salvage: 40_000, soldMonth: 4, salePrice: 300_000 },
};

export function logi() {
  const L = LOGI_Q;
  const cost = L.price * (1 + L.purchaseTax + L.lawyer);
  const landCost = cost * L.land;
  const buildingCost = cost - landCost;
  // 2023: depreciation, then the first revaluation (reset).
  const dep2023 = buildingCost / L.life;
  const carrying2023 = buildingCost - dep2023;
  const fair2023 = { building: L.fair[0] * (1 - L.land), land: L.fair[0] * L.land };
  const surplusBuilding2023 = fair2023.building - carrying2023;
  const surplusLand2023 = fair2023.land - landCost;
  // 2024: the new charge, the transfer, and a fall in value.
  const left = L.life - 1;
  const dep2024 = fair2023.building / left;
  const transfer2024 = surplusBuilding2023 / left;
  const carryingBuilding2024 = fair2023.building - dep2024;
  const surplusBuildingBefore = surplusBuilding2023 - transfer2024;
  const fair2024 = { building: L.fair[1] * (1 - L.land), land: L.fair[1] * L.land };
  const buildingFall = carryingBuilding2024 - fair2024.building;
  const surplusBuilding2024 = surplusBuildingBefore - buildingFall;
  const landFall = fair2023.land - fair2024.land;
  const landLoss = Math.max(0, landFall - surplusLand2023);
  const oci2024 = -buildingFall - Math.min(landFall, surplusLand2023);
  // The sale on 1.1.2025.
  const carryingAtSale = L.fair[1];
  const saleGain = L.salePrice - carryingAtSale;
  // The trucks.
  const T = L.trucks;
  const annual = (T.each - T.salvage) / T.life;
  const months2023 = 13 - T.availableMonth;
  const truckDep2023 = (annual * months2023 * T.count) / 12;
  const truckDep2024 = annual * T.count;
  const soldDep2025 = (annual * (T.soldMonth - 1)) / 12;
  const soldAccum = (annual * months2023) / 12 + annual + soldDep2025;
  const soldCarrying = T.each - soldAccum;
  const truckResult = T.salePrice - soldCarrying;
  const keptDep2025 = annual * (T.count - 1);
  const truckDep2025 = keptDep2025 + soldDep2025;
  const keptAccum2025 = ((annual * months2023) / 12 + 2 * annual) * (T.count - 1);
  return {
    cost,
    landCost,
    buildingCost,
    dep2023,
    carrying2023,
    fair2023,
    surplusBuilding2023,
    surplusLand2023,
    oci2023: surplusBuilding2023 + surplusLand2023,
    dep2024,
    transfer2024,
    carryingBuilding2024,
    surplusBuildingBefore,
    fair2024,
    buildingFall,
    surplusBuilding2024,
    landFall,
    landLoss,
    oci2024,
    carryingAtSale,
    saleGain,
    surplusAtSale: surplusBuilding2024,
    truck: { annual, dep2023: truckDep2023, dep2024: truckDep2024, soldDep2025, soldAccum, soldCarrying, result: truckResult, dep2025: truckDep2025, keptCost: T.each * (T.count - 1), keptAccum2025 },
  };
}
