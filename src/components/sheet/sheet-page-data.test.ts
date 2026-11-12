import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { numbersIn, pageSheet, parseCell, textRows } from "./sheet-page-data";

describe("a question's data, read off the page", () => {
  it("a table cell becomes a number where it is one", () => {
    assert.equal(parseCell("1,250"), 1250);
    assert.equal(parseCell("(500)"), -500);
    assert.equal(parseCell("-500"), -500);
    assert.equal(parseCell("−1,200.50"), -1200.5);
    assert.equal(parseCell("120,000 ₪"), 120000);
    assert.equal(parseCell("‎2,000‎"), 2000);
    assert.deepEqual(parseCell("5%"), { v: 0.05, format: "percent" });
    assert.equal(parseCell("2024"), 2024);
    assert.equal(parseCell("  "), null);
  });

  it("dates and words stay text", () => {
    for (const text of ["31.12", "31.12.2024", "1/1/2025", "30.06", "לקוחות", "1,5", "(500", "5 שנים", "—"]) assert.equal(parseCell(text), text, text);
    assert.equal(parseCell("12.5"), 12.5, "a decimal, not the 12th of May");
  });

  it("finds the amounts in a sentence and leaves dates and codes", () => {
    assert.deepEqual(numbersIn("לקוחות ברוטו ב-31.12: 120,000 ₪, וההפרשה להפסדי אשראי היא 5% מהם."), [120000, { v: 0.05, format: "percent" }]);
    assert.deepEqual(numbersIn("המכונה נרכשה ב-1.1.2024 ב-240,000 ₪, ערך שייר 40,000 ואורך חיים 8 שנים."), [240000, 40000, 8]);
    assert.deepEqual(numbersIn("לפי IFRS16 וסעיף 4א, ההפסד היה (3,500)."), [-3500]);
    assert.deepEqual(numbersIn("המחיר עלה מ-100 ל-150 (ראו 20)."), [100, 150, 20]);
    assert.deepEqual(numbersIn("אין כאן מספרים"), []);
  });

  it("text comes over line by line, each with its numbers", () => {
    const rows = textRows("חברה רכשה מלאי ב-50,000 ₪. היא מכרה 60% ממנו.\n\nנדרש: מה יתרת המלאי?");
    assert.deepEqual(rows, [
      [{ v: "חברה רכשה מלאי ב-50,000 ₪.", align: "right", wrap: true }, 50000],
      [{ v: "היא מכרה 60% ממנו.", align: "right", wrap: true }, { v: 0.6, format: "percent" }],
      [{ v: "נדרש:", align: "right", wrap: true }],
      [{ v: "מה יתרת המלאי?", align: "right", wrap: true }],
    ]);
  });

  it("blocks go one under another with a blank row between, and the first column fits its text", () => {
    const { rows, widths } = pageSheet([{ rows: [["א", 1]] }, { title: "מאזן בוחן", rows: [["לקוחות", 100, 200]] }]);
    assert.deepEqual(rows, [["א", 1], [], [{ v: "מאזן בוחן", bold: true, align: "right" }], ["לקוחות", 100, 200]]);
    assert.deepEqual(widths, [140, 100, 100]);
  });
});
