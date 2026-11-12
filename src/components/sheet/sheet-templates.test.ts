import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ABS, NA } from "@formulajs/formulajs";
import { Parser } from "@fortune-sheet/formula-parser";
import { buildSheet, freeName, plainNumber, withSheet, type BuiltSheet } from "./sheet-build";
import { addFunctions } from "./sheet-functions";
import { TEMPLATES } from "./sheet-templates";

addFunctions(Parser, { na: NA(), value: ABS("x") });

type Coord = { row: { index: number }; column: { index: number } };

/** Works a built sheet out with the library's own formula parser, the way the workbook will. */
function evaluate(sheet: BuiltSheet) {
  const cells = new Map(sheet.celldata.map((c) => [`${c.r},${c.c}`, c.v]));
  const done = new Map<string, unknown>();
  const parser = new Parser();
  const value = (r: number, c: number): unknown => {
    const key = `${r},${c}`;
    if (done.has(key)) return done.get(key);
    const cell = cells.get(key);
    let v: unknown = cell?.v ?? null;
    if (typeof cell?.f === "string") {
      const { error, result } = parser.parse(cell.f.slice(1));
      v = error ?? result;
    }
    done.set(key, v);
    return v;
  };
  parser.on("callCellValue", ((cell: Coord, _: unknown, give: (v: unknown) => void) => give(value(cell.row.index, cell.column.index))) as never);
  parser.on("callRangeValue", ((a: Coord, b: Coord, _: unknown, give: (v: unknown) => void) => {
    const rows = [];
    for (let r = a.row.index; r <= b.row.index; r++) {
      const row = [];
      for (let c = a.column.index; c <= b.column.index; c++) row.push(value(r, c));
      rows.push(row);
    }
    give(rows);
  }) as never);
  for (const c of sheet.celldata) value(c.r, c.c);
  /** A cell by its name, "B4". */
  return (name: string) => value(Number(name.slice(1)) - 1, name.charCodeAt(0) - 65);
}

const built = (id: string) => {
  const t = TEMPLATES.find((x) => x.id === id)!;
  return buildSheet(t.name, t.rows, t.widths);
};
const near = (actual: unknown, expected: number, within = 0.01) => assert.ok(Math.abs(Number(actual) - expected) <= within, `${actual} is not ${expected}`);

describe("the ready templates", () => {
  it("no formula in any template ends in an error", () => {
    for (const t of TEMPLATES) {
      const sheet = buildSheet(t.name, t.rows, t.widths);
      const at = evaluate(sheet);
      for (const c of sheet.celldata) {
        const v = at(`${String.fromCharCode(65 + c.c)}${c.r + 1}`);
        assert.ok(!(typeof v === "string" && v.startsWith("#")), `${t.name} ${String.fromCharCode(65 + c.c)}${c.r + 1}: ${v}`);
      }
      assert.equal(sheet.calcChain.length, sheet.celldata.filter((c) => "f" in c.v).length, "every formula is listed for recalculation");
    }
  });

  it("the loan schedule pays the loan off exactly", () => {
    const at = evaluate(built("loan"));
    near(at("B4"), 23097.48);
    near(at("D7"), 5000);
    near(at("F11"), 0);
    near(at("B5"), 5 * 23097.48 - 100000, 0.05);
  });

  it("discounting by factors agrees with NPV", () => {
    const at = evaluate(built("pv"));
    near(at("C4"), 1 / 1.06, 1e-9);
    near(at("D9"), Number(at("B11")));
  });

  it("straight-line depreciation ends at the salvage value", () => {
    const at = evaluate(built("depreciation"));
    near(at("B4"), 25000);
    near(at("D14"), 40000);
  });

  it("the T-account's balance is debit less credit, and the journal entry balances", () => {
    near(evaluate(built("t-account"))("B14"), 45000);
    near(evaluate(built("journal"))("C13"), 0);
  });

  it("the effective rate discounts the flows back to the amount received", () => {
    const rate = Number(evaluate(built("irr"))("B8"));
    const pv = [6000, 6000, 6000, 106000].reduce((sum, flow, i) => sum + flow / (1 + rate) ** (i + 1), 0);
    near(pv, 95000, 0.5);
  });
});

describe("building a sheet", () => {
  it("shows a plain number as the sheet does", () => {
    assert.equal(plainNumber(1234567), "1,234,567");
    assert.equal(plainNumber(-2500.5), "(2,500.5)");
    assert.equal(plainNumber(2024), "2024");
    assert.equal(plainNumber(0.0525), "0.0525");
    assert.equal(plainNumber(1234.5678), "1,234.57");
    assert.equal(plainNumber(0), "0");
  });

  it("writes text, numbers and formulas in the workbook's shape", () => {
    const sheet = buildSheet("בדיקה", [["שם", 1500, { v: "=B1*2", format: "int" }], [null, { v: 0.05, format: "percent", bold: true, shade: "input" }]]);
    const [name, amount, formula, rate] = sheet.celldata.map((c) => c.v);
    assert.deepEqual(name, { v: "שם", m: "שם", ct: { fa: "General", t: "g" } });
    assert.deepEqual(amount, { v: 1500, m: "1,500", ct: { fa: "General", t: "n" } });
    assert.equal(formula.f, "=B1*2");
    assert.equal(formula.v, undefined);
    assert.deepEqual([rate.m, rate.bl, rate.bg], ["5.00%", 1, "#fff8d6"]);
    assert.deepEqual(sheet.calcChain, [{ r: 0, c: 2, id: sheet.id }]);
  });

  it("adds a sheet in front under a free name", () => {
    assert.equal(freeName("לוח", ["לוח", "לוח 2"]), "לוח 3");
    const sheets = withSheet([{ name: "Sheet1", status: 1 }, { name: "לוח", status: 0 }], buildSheet("לוח", [[1]]));
    assert.deepEqual(sheets.map((s) => [s.name, s.status]), [["Sheet1", 0], ["לוח", 0], ["לוח 2", 1]]);
  });
});
