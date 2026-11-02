/**
 * The course's running company: a bakery and its three assets, followed from
 * lesson to lesson — the oven's sheet is born in lesson 3, the truck meets
 * time in lesson 4 and leaves in lesson 7, the oven is upgraded in lesson 8,
 * and lesson 12 lays all three side by side. Every figure is computed here;
 * the screens only write it.
 */

export const BAKERY = "מאפיית הגליל בע״מ";

/** A row of an asset's sheet: one year under the cost model. */
export type SheetRow = { year: number; cost: number; charge: number; accumulated: number; carrying: number };

/** The oven: available for use on 1.1.2024, straight line. */
export const OVEN = { cost: 180_000, salvage: 20_000, life: 8, from: 2024 };
export const OVEN_ANNUAL = (OVEN.cost - OVEN.salvage) / OVEN.life;

/** The oven's sheet, a row a year, from its first year for so many years. */
export function ovenRows(years = OVEN.life): SheetRow[] {
  return Array.from({ length: years }, (_, i) => ({
    year: OVEN.from + i,
    cost: OVEN.cost,
    charge: OVEN_ANNUAL,
    accumulated: OVEN_ANNUAL * (i + 1),
    carrying: OVEN.cost - OVEN_ANNUAL * (i + 1),
  }));
}

/** The upgrade on 1.1.2027, after three years: it raises output, and from that day the oven has seven years left. */
export const UPGRADE = { year: 2027, cost: 54_000, lifeLeft: 7 };
const ovenAtUpgrade = ovenRows(UPGRADE.year - OVEN.from).at(-1)!;
export const UPGRADE_BASE = ovenAtUpgrade.carrying + UPGRADE.cost;
export const UPGRADE_ANNUAL = (UPGRADE_BASE - OVEN.salvage) / UPGRADE.lifeLeft;
/** The oven's carrying amount on the day of the upgrade, before it. */
export const OVEN_BEFORE_UPGRADE = ovenAtUpgrade.carrying;

/** The delivery truck: bought on 1.3.2024, ready for use on 1.4.2024; 20% a year on cost, straight line, no salvage. */
export const VAN = { cost: 120_000, rate: 0.2, boughtMonth: 3, readyMonth: 4, from: 2024 };
export const VAN_ANNUAL = VAN.cost * VAN.rate;
export const VAN_LIFE = 1 / VAN.rate;
/** Months of use in the truck's first year: from the month it was ready to December. */
export const VAN_FIRST_MONTHS = 13 - VAN.readyMonth;
export const VAN_FIRST = (VAN_ANNUAL * VAN_FIRST_MONTHS) / 12;

/** The truck's sheet until it leaves: a row a year. */
export function vanRows(years: number): SheetRow[] {
  let accumulated = 0;
  return Array.from({ length: years }, (_, i) => {
    const charge = i === 0 ? VAN_FIRST : VAN_ANNUAL;
    accumulated += charge;
    return { year: VAN.from + i, cost: VAN.cost, charge, accumulated, carrying: VAN.cost - accumulated };
  });
}

/** Sold on 1.10.2026: depreciation runs to the day of the sale, then the carrying amount meets the proceeds. */
export const VAN_SALE = { year: 2026, month: 10, proceeds: 52_000 };
const vanBefore = vanRows(VAN_SALE.year - VAN.from).at(-1)!;
export const VAN_SALE_MONTHS = VAN_SALE.month - 1;
export const VAN_SALE_CHARGE = (VAN_ANNUAL * VAN_SALE_MONTHS) / 12;
export const VAN_ACCUM_AT_SALE = vanBefore.accumulated + VAN_SALE_CHARGE;
export const VAN_CARRYING_AT_SALE = VAN.cost - VAN_ACCUM_AT_SALE;
/** A gain if positive, a loss if negative. */
export const VAN_SALE_RESULT = VAN_SALE.proceeds - VAN_CARRYING_AT_SALE;

/** The same day, an exchange instead of a sale: the old truck (fair value as the sale price) and cash, for a new truck. */
export const VAN_SWAP = { fairValue: VAN_SALE.proceeds, cashPaid: 100_000 };
export const NEW_VAN_COST = VAN_SWAP.fairValue + VAN_SWAP.cashPaid;

/** The building and its land: bought together on 1.1.2024; the land is not depreciated. */
export const PREMISES = { total: 1_000_000, landShare: 0.4, life: 30, from: 2024 };
export const LAND_COST = PREMISES.total * PREMISES.landShare;
export const BUILDING_COST = PREMISES.total - LAND_COST;
export const BUILDING_ANNUAL = BUILDING_COST / PREMISES.life;

/** The bakery's year of the sale, 2026, in the statements: every charge and the truck's result. */
export const YEAR_2026 = (() => {
  const year = 2026;
  const oven = ovenRows(year - OVEN.from + 1).at(-1)!;
  const buildingAccum = BUILDING_ANNUAL * (year - PREMISES.from + 1);
  return {
    year,
    charges: { oven: oven.charge, van: VAN_SALE_CHARGE, building: BUILDING_ANNUAL },
    totalCharge: oven.charge + VAN_SALE_CHARGE + BUILDING_ANNUAL,
    saleResult: VAN_SALE_RESULT,
    oven,
    building: { cost: BUILDING_COST, accumulated: buildingAccum, carrying: BUILDING_COST - buildingAccum },
    land: LAND_COST,
  };
})();
