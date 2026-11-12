import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ABS, NA } from "@formulajs/formulajs";
import { Parser } from "@fortune-sheet/formula-parser";
import { ADDED, HEBREW, addFunctions, booleans, criterion, localiseFunctions, type ListedFunction } from "./sheet-functions";

addFunctions(Parser, { na: NA(), value: ABS("x") });

// A small sheet: column A account names, column B amounts, column C the year.
const GRID: unknown[][] = [
  ["מכירות", 1000, 2024],
  ["דלק", 300, 2024],
  ["שכר", 700, 2025],
  ["דלק", 450, 2025],
  ["", null, null],
];

type Coord = { row: { index: number }; column: { index: number } };
function sheet() {
  const parser = new Parser();
  parser.on("callCellValue", ((cell: Coord, _: unknown, done: (v: unknown) => void) => done(GRID[cell.row.index]?.[cell.column.index] ?? null)) as never);
  parser.on("callRangeValue", ((a: Coord, b: Coord, _: unknown, done: (v: unknown) => void) => {
    const rows = [];
    for (let r = a.row.index; r <= b.row.index; r++) {
      const row = [];
      for (let c = a.column.index; c <= b.column.index; c++) row.push(GRID[r]?.[c] ?? null);
      rows.push(row);
    }
    done(rows);
  }) as never);
  return (formula: string) => {
    const { error, result } = parser.parse(formula);
    return error ?? result;
  };
}

describe("functions the sheet adds to the library", () => {
  const calc = sheet();

  it("IFS returns the first value whose test holds", () => {
    assert.equal(calc("IFS(B1>2000,\"גדול\",B1>500,\"בינוני\",TRUE,\"קטן\")"), "בינוני");
    assert.equal(calc("ifs(B2>2000,1,B2>500,2,true,3)"), 3);
    assert.equal(calc("IFS(B2>2000,1)"), "#N/A");
  });

  it("XLOOKUP finds a key and returns the matching cell", () => {
    assert.equal(calc("XLOOKUP(\"שכר\",A1:A4,B1:B4)"), 700);
    assert.equal(calc("xlookup(\"דלק\",A1:A4,B1:B4)"), 300);
    assert.equal(calc("XLOOKUP(\"דלק\",A1:A4,B1:B4,0,0,-1)"), 450, "searching from the end");
    assert.equal(calc("XLOOKUP(\"אין\",A1:A4,B1:B4)"), "#N/A");
    assert.equal(calc("XLOOKUP(\"אין\",A1:A4,B1:B4,\"חסר\")"), "חסר");
    assert.equal(calc("XLOOKUP(500,B1:B4,A1:A4,\"\",-1)"), "דלק", "the nearest smaller amount is 450");
    assert.equal(calc("XLOOKUP(500,B1:B4,A1:A4,\"\",1)"), "שכר", "the nearest larger amount is 700");
    assert.equal(calc("XLOOKUP(\"ש*\",A1:A4,B1:B4,0,2)"), 700);
  });

  it("XMATCH gives the position, counting from 1", () => {
    assert.equal(calc("XMATCH(\"שכר\",A1:A4)"), 3);
    assert.equal(calc("XMATCH(\"אין\",A1:A4)"), "#N/A");
  });

  it("MAXIFS and MINIFS keep only the rows that pass every condition", () => {
    assert.equal(calc("MAXIFS(B1:B4,A1:A4,\"דלק\")"), 450);
    assert.equal(calc("MINIFS(B1:B4,A1:A4,\"דלק\")"), 300);
    assert.equal(calc("MAXIFS(B1:B4,C1:C4,2024,B1:B4,\"<1000\")"), 300);
    assert.equal(calc("MAXIFS(B1:B4,A1:A4,\"אין\")"), 0);
    assert.equal(calc("MAXIFS(B1:B4,A1:A3,\"דלק\")"), "#VALUE!");
  });

  it("TEXTJOIN joins with a separator and can skip empty cells", () => {
    assert.equal(calc("TEXTJOIN(\", \",TRUE,A1:A5)"), "מכירות, דלק, שכר, דלק");
    assert.equal(calc("TEXTJOIN(\"-\",FALSE,A4:A5,\"x\")"), "דלק--x");
  });

  it("TRUE and FALSE work without brackets, as in Excel", () => {
    assert.equal(calc("IF(TRUE,1,2)"), 1);
    assert.equal(calc("IF(false,1,2)"), 2);
    assert.equal(calc("VLOOKUP(\"שכר\",A1:C4,2,FALSE)"), 700);
    assert.equal(booleans("IF(A1=\"TRUE\",TRUE,FALSE())"), "IF(A1=\"TRUE\",TRUE(),FALSE())");
    assert.equal(booleans("TRUEST+ISTRUE"), "TRUEST+ISTRUE");
  });

  it("the functions the library already has still work", () => {
    assert.equal(calc("SUM(B1:B4)"), 2450);
    assert.equal(Math.round(Number(calc("PV(0.05,3,0,-1000)")) * 100) / 100, 863.84);
    assert.equal(calc("SWITCH(C3,2024,\"א\",2025,\"ב\")"), "ב");
  });
});

describe("a condition as SUMIF writes it", () => {
  it("compares numbers", () => {
    assert.equal(criterion(">100")(150), true);
    assert.equal(criterion(">100")(100), false);
    assert.equal(criterion("<>0")(0), false);
    assert.equal(criterion("<>0")("טקסט"), true);
    assert.equal(criterion(5)("5"), true);
    assert.equal(criterion("=5")(5), true);
  });

  it("compares text without regard to case, with wildcards", () => {
    assert.equal(criterion("abc")("ABC"), true);
    assert.equal(criterion("ד*")("דלק"), true);
    assert.equal(criterion("ד?")("דלק"), false);
    assert.equal(criterion("<>דלק")("שכר"), true);
    assert.equal(criterion("")(null), true);
  });
});

describe("the Hebrew in the function list", () => {
  const entry = (n: string, params: string[]): ListedFunction => ({
    n,
    t: 8,
    d: "English",
    a: "English",
    m: [1, params.length],
    p: params.map((name) => ({ name, detail: "English", example: "A1", require: "m", repeat: "n", type: "rangenumber" })),
  });

  it("replaces the summary and the arguments, and keeps what it does not know", () => {
    const list = [entry("PV", ["rate", "number_of_periods", "payment_amount", "future_value", "end_or_beginning"]), entry("IF", ["a", "b", "c"]), entry("VLOOKUP", ["a"]), entry("MAX", ["a"]), entry("MATCH", ["a"]), entry("CONCATENATE", ["a"]), entry("ZZZ", ["x"])];
    localiseFunctions(list);
    const pv = list[0];
    assert.equal(pv.a, HEBREW.PV.a);
    assert.deepEqual(pv.p.map((p) => p.name), ["rate", "nper", "pmt", "fv", "type"]);
    assert.equal(pv.p[3].require, "o");
    assert.equal(pv.p[0].type, "rangenumber", "the library's own fields are kept");
    assert.equal(list.find((f) => f.n === "ZZZ")!.a, "English");
  });

  it("adds the missing functions once", () => {
    const list = [entry("IF", ["a"]), entry("VLOOKUP", ["a"]), entry("MAX", ["a"]), entry("MIN", ["a"]), entry("MATCH", ["a"]), entry("CONCATENATE", ["a"]), entry("PV", ["a"])];
    localiseFunctions(list);
    const count = list.length;
    localiseFunctions(list);
    assert.equal(list.length, count);
    for (const name of Object.keys(ADDED)) assert.ok(list.some((f) => f.n === name), name);
    assert.equal(list.find((f) => f.n === "XLOOKUP")!.t, 8, "takes the group of the function it sits beside");
  });
});
