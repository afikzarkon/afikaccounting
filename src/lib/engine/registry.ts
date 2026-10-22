import { corporateTax } from "./calculators/corporate-tax";
import { ias16Ppe } from "./calculators/ias16-ppe";
import { ias37Provisions } from "./calculators/ias37-provisions";
import { ifrs16Leases } from "./calculators/ifrs16-leases";
import type { Calculator, CalculatorSchema } from "./types";

export const CALCULATORS: Calculator[] = [ifrs16Leases, ias16Ppe, ias37Provisions, corporateTax];

export function getCalculator(slug: string | null | undefined): Calculator | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

/** The JSON-serialisable part of a calculator, as stored in `accounting_calculators.schema`. */
export function toSchema(calc: Calculator): CalculatorSchema {
  const schema: Partial<Calculator> = { ...calc };
  delete schema.validate;
  delete schema.solve;
  return schema as CalculatorSchema;
}
