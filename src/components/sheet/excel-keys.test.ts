import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { excelKey, type KeyLike, type SheetState } from "./excel-keys";

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

  it("the arrows move the caret in a formula, or after F2 or a double click", () => {
    assert.equal(excelKey(key("ArrowLeft"), { ...typing, formula: true }).keys, undefined);
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
