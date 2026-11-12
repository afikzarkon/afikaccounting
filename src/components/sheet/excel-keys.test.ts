import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canPoint, columnName, cycleRef, excelKey, formatKey, refName, stepCell, sumRange, type KeyLike, type SheetState } from "./excel-keys";

const key = (k: string, mods: Partial<KeyLike> = {}): KeyLike => ({ key: k, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...mods });
const idle: SheetState = { editing: false, typedEntry: false, formula: false, suggesting: false };
const typing: SheetState = { editing: true, typedEntry: true, formula: false, suggesting: false };

describe("the sheet's keys, as in Excel", () => {
  it("Enter on a selected cell moves down, Shift+Enter up", () => {
    assert.deepEqual(excelKey(key("Enter"), idle).keys, [["ArrowDown", false]]);
    assert.deepEqual(excelKey(key("Enter", { shiftKey: true }), idle).keys, [["ArrowUp", false]]);
  });

  it("Tab finishes an entry and steps right, Shift+Tab left", () => {
    assert.deepEqual(excelKey(key("Tab"), typing).keys, [["Enter", false], ["ArrowUp", false], ["ArrowRight", false]]);
    assert.deepEqual(excelKey(key("Tab", { shiftKey: true }), { ...typing, formula: true }).keys, [["Enter", false], ["ArrowUp", false], ["ArrowLeft", false]]);
  });

  it("Tab takes a picked function from the list instead", () => {
    assert.equal(excelKey(key("Tab"), { ...typing, formula: true, suggesting: true }).keys, undefined);
  });

  it("the arrows finish a typed entry and move that way", () => {
    assert.deepEqual(excelKey(key("ArrowDown"), typing).keys, [["Enter", false]]);
    assert.deepEqual(excelKey(key("ArrowUp"), typing).keys, [["Enter", false], ["ArrowUp", false], ["ArrowUp", false]]);
    assert.deepEqual(excelKey(key("ArrowLeft"), typing).keys, [["Enter", false], ["ArrowUp", false], ["ArrowLeft", false]]);
  });

  it("the arrows move the caret after F2 or a double click, and walk the function list when it is open", () => {
    assert.equal(excelKey(key("ArrowDown"), { ...typing, formula: true, suggesting: true }).keys, undefined);
    assert.equal(excelKey(key("ArrowLeft"), { ...typing, typedEntry: false }).keys, undefined);
    assert.equal(excelKey(key("F2"), typing).startsEntry, false);
  });

  it("typing a character on a selected cell begins a typed entry; F2 doesn't", () => {
    assert.equal(excelKey(key("7"), idle).startsEntry, true);
    assert.equal(excelKey(key("ש"), idle).startsEntry, true);
    assert.equal(excelKey(key("F2"), idle).startsEntry, false);
    assert.equal(excelKey(key("c", { ctrlKey: true }), idle).startsEntry, undefined);
  });

  it("leaves Alt+Enter (a line break in the cell) and plain Enter to the workbook", () => {
    assert.equal(excelKey(key("Enter", { altKey: true }), typing).keys, undefined);
    assert.equal(excelKey(key("Enter"), typing).keys, undefined);
  });
});

describe("formulas, as in Excel", () => {
  it("an arrow after a finished term of a typed formula ends the entry", () => {
    assert.deepEqual(excelKey(key("ArrowRight"), { ...typing, formula: true }).keys, [["Enter", false], ["ArrowUp", false], ["ArrowRight", false]]);
  });

  it("an arrow points at a cell only where a reference can go", () => {
    for (const text of ["=", "=A1+", "=SUM(", "=SUM(A1,", "=A1*", "=A1: ", " =B2>"]) assert.equal(canPoint(text), true, text);
    for (const text of ["=A1", "=SUM(A1)", "=12", "abc+", ""]) assert.equal(canPoint(text), false, text);
  });

  it("F4 turns the reference at the caret through its four forms", () => {
    const turn = (text: string, caret: number) => {
      const next = cycleRef(text, caret)!;
      return text.slice(0, next.start) + next.ref + text.slice(next.end);
    };
    assert.equal(turn("=A1+B2", 3), "=$A$1+B2");
    assert.equal(turn("=$A$1+B2", 5), "=A$1+B2");
    assert.equal(turn("=A$1+B2", 2), "=$A1+B2");
    assert.equal(turn("=$A1+B2", 2), "=A1+B2");
    assert.equal(turn("=A1+B2", 6), "=A1+$B$2", "the reference the caret is on, not the first");
    assert.equal(turn("=SUM(A1:B5)", 8), "=SUM($A$1:$B$5)", "a range turns as one");
    assert.equal(turn("=SUM(A$1:B5)", 10), "=SUM($A1:$B5)");
  });

  it("F4 leaves text that is not a reference alone", () => {
    assert.equal(cycleRef("=LOG10(5)", 4), null);
    assert.equal(cycleRef("=A1+5", 5), null);
    assert.equal(cycleRef("=SUM(", 5), null);
  });

  it("names cells and ranges", () => {
    assert.deepEqual([0, 25, 26, 27, 701, 702].map(columnName), ["A", "Z", "AA", "AB", "ZZ", "AAA"]);
    assert.equal(refName({ r: 2, c: 1 }), "B3");
    assert.equal(refName({ r: 6, c: 3 }, { r: 2, c: 1 }), "B3:D7");
  });

  it("an arrow steps one cell and stops at the sheet's edge", () => {
    assert.deepEqual(stepCell({ r: 3, c: 2 }, "ArrowUp", 100, 26), { r: 2, c: 2 });
    assert.deepEqual(stepCell({ r: 0, c: 0 }, "ArrowLeft", 100, 26), { r: 0, c: 0 });
    assert.deepEqual(stepCell({ r: 99, c: 25 }, "ArrowDown", 100, 26), { r: 99, c: 25 });
  });

  it("Alt+= sums the numbers above, or else those to the left", () => {
    const numbers = new Set(["0,0", "1,0", "2,0", "5,0", "5,1", "5,2"]);
    const isNumber = (r: number, c: number) => numbers.has(`${r},${c}`);
    assert.equal(sumRange({ r: 3, c: 0 }, isNumber), "A1:A3");
    assert.equal(sumRange({ r: 5, c: 3 }, isNumber), "A6:C6");
    assert.equal(sumRange({ r: 4, c: 4 }, isNumber), null);
    assert.equal(sumRange({ r: 6, c: 0 }, isNumber), "A6", "only the unbroken run");
  });

  it("the formatting shortcuts", () => {
    const press = (code: string, mods: Partial<KeyLike> = {}) => formatKey({ ...key(""), code, ...mods });
    assert.deepEqual(press("Digit1", { ctrlKey: true, shiftKey: true }), { ct: { fa: "#,##0.00", t: "n" } });
    assert.deepEqual(press("Digit5", { ctrlKey: true, shiftKey: true }), { ct: { fa: "0%", t: "n" } });
    assert.deepEqual(press("Digit4", { metaKey: true, shiftKey: true }), { ct: { fa: "₪ #,##0.00", t: "n" } });
    assert.deepEqual(press("KeyI", { ctrlKey: true }), { toggle: "it" });
    assert.deepEqual(press("KeyU", { ctrlKey: true }), { toggle: "un" });
    assert.deepEqual(press("Semicolon", { ctrlKey: true }), { today: true });
    assert.equal(press("KeyI"), null);
    assert.equal(press("KeyI", { ctrlKey: true, altKey: true }), null);
  });
});
