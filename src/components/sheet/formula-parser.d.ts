// The spreadsheet library's formula parser ships without types; only its class is used here.
declare module "@fortune-sheet/formula-parser" {
  export class Parser {
    getFunction(name: string): unknown;
    parse(formula: string): { error: string | null; result: unknown };
    on(event: string, handler: (...args: never[]) => void): void;
  }
}

declare module "@formulajs/formulajs" {
  /** The #N/A error value. */
  export function NA(): Error;
  /** A number's absolute value; text gives the #VALUE! error value. */
  export function ABS(value: unknown): number | Error;
}
