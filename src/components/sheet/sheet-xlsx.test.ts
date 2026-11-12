import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileFormat, fileFormula, sheetNames, toXlsx, zip } from "./sheet-xlsx";

/** The files inside a stored (uncompressed) zip, read back from its bytes. */
function unzip(bytes: Uint8Array): Record<string, string> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const files: Record<string, string> = {};
  let at = 0;
  while (view.getUint32(at, true) === 0x04034b50) {
    const size = view.getUint32(at + 18, true);
    const nameLength = view.getUint16(at + 26, true);
    const name = decoder.decode(bytes.subarray(at + 30, at + 30 + nameLength));
    files[name] = decoder.decode(bytes.subarray(at + 30 + nameLength, at + 30 + nameLength + size));
    at += 30 + nameLength + size;
  }
  return files;
}

describe("the sheet as an Excel file", () => {
  it("a formula is stored the way Excel wants it", () => {
    assert.equal(fileFormula("=sum(a1:a3)"), "SUM(a1:a3)");
    assert.equal(fileFormula("=IFS(A1>5,1,TRUE,2)"), "_xlfn.IFS(A1>5,1,TRUE,2)");
    assert.equal(fileFormula('=xlookup(A1,B:B,C:C,"sum(x)")'), '_xlfn.XLOOKUP(A1,B:B,C:C,"sum(x)")');
    assert.equal(fileFormula("=PV(5%,3,0,-1000)+B2"), "PV(5%,3,0,-1000)+B2");
  });

  it("a plain number keeps the look it has on the site", () => {
    assert.equal(fileFormat({ v: 1500, ct: { fa: "General", t: "n" } }), "#,##0;(#,##0)");
    assert.equal(fileFormat({ v: "-2500.5", ct: { fa: "General", t: "n" } }), "#,##0.00;(#,##0.00)");
    assert.equal(fileFormat({ v: 2024, ct: { fa: "General", t: "n" } }), "General");
    assert.equal(fileFormat({ v: 0.0525, ct: { fa: "General", t: "n" } }), "General");
    assert.equal(fileFormat({ v: "שם", ct: { fa: "General", t: "g" } }), "General");
    assert.equal(fileFormat({ v: 45000, ct: { fa: "yyyy-MM-dd hh:mm AM/PM", t: "d" } }), "yyyy-mm-dd hh:mm AM/PM");
    assert.equal(fileFormat({ v: 5, ct: { fa: "₪ #,##0.00", t: "n" } }), '"₪" #,##0.00');
    assert.equal(fileFormat({ v: 0.05, ct: { fa: "0.00%", t: "n" } }), "0.00%");
  });

  it("sheet names are ones Excel accepts", () => {
    assert.deepEqual(sheetNames(["נתונים: [שאלה 1]", "", "לוח", "לוח", "x".repeat(40)]), ["נתונים   שאלה 1", "Sheet2", "לוח", "לוח 2", "x".repeat(31)]);
  });

  it("the zip holds each file as it was given", () => {
    const files = unzip(zip([["a.xml", "<a/>"], ["תיקייה/b.xml", "שלום"]]));
    assert.deepEqual(files, { "a.xml": "<a/>", "תיקייה/b.xml": "שלום" });
  });

  it("writes every sheet with its cells, formulas, styles, widths and merges", () => {
    const files = unzip(
      toXlsx([
        {
          name: "ראשון",
          celldata: [
            { r: 0, c: 0, v: { v: "סכום & <עוד>", ct: { fa: "General", t: "g" }, bl: 1, bg: "#fff8d6" } },
            { r: 0, c: 1, v: { v: "1500", ct: { fa: "General", t: "n" } } },
            { r: 1, c: 1, v: { v: 3000, f: "=b1*2", ct: { fa: "General", t: "n" } } },
            { r: 2, c: 1, v: { v: "#N/A", f: "=xmatch(1,A:A)", ct: { fa: "General", t: "e" } } },
          ],
          config: { columnlen: { 0: 140 }, merge: { "4_0": { r: 4, c: 0, rs: 1, cs: 2 } } },
        },
        { name: "שני", data: [[null, { v: true }]] },
      ]),
    );
    assert.deepEqual(Object.keys(files).sort(), ["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]);
    const one = files["xl/worksheets/sheet1.xml"];
    assert.match(one, /<c r="A1" s="\d+" t="inlineStr"><is><t xml:space="preserve">סכום &amp; &lt;עוד&gt;<\/t><\/is><\/c>/);
    assert.match(one, /<c r="B1" s="\d+"><v>1500<\/v><\/c>/);
    assert.match(one, /<c r="B2" s="\d+"><f>b1\*2<\/f><v>3000<\/v><\/c>/);
    assert.match(one, /<c r="B3" t="e"><f>_xlfn\.XMATCH\(1,A:A\)<\/f><v>#N\/A<\/v><\/c>/);
    assert.match(one, /<col min="1" max="1" width="20" customWidth="1"\/>/);
    assert.match(one, /<mergeCell ref="A5:B5"\/>/);
    assert.match(files["xl/worksheets/sheet2.xml"], /<c r="B1" t="b"><v>1<\/v><\/c>/);
    assert.match(files["xl/styles.xml"], /formatCode="#,##0;\(#,##0\)"/);
    assert.match(files["xl/styles.xml"], /<b\/>/);
    assert.match(files["xl/styles.xml"], /<fgColor rgb="FFFFF8D6"\/>/);
    assert.match(files["xl/workbook.xml"], /<sheet name="ראשון" sheetId="1" r:id="rId1"\/><sheet name="שני" sheetId="2" r:id="rId2"\/>/);
  });
});
