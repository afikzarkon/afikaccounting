/**
 * The reader's sheets as a real Excel file (.xlsx): values, formulas, number formats, bold and
 * colours, alignment, column widths and merged cells. Written by hand, with no library: an .xlsx
 * is a zip of a few small XML files, and a zip without compression is a few headers and a checksum.
 *
 * Borders and conditional formats are not carried over.
 */

export type XCell = {
  v?: string | number | boolean | null;
  m?: string | number;
  f?: string;
  ct?: { fa?: string; t?: string; s?: { v?: string }[] };
  bl?: number;
  it?: number;
  un?: number;
  cl?: number;
  fc?: string;
  bg?: string;
  fs?: number | string;
  ht?: number | string;
  vt?: number | string;
  tb?: number | string;
};

export type XSheet = {
  name: string;
  celldata?: { r: number; c: number; v: XCell | string | number | null }[];
  data?: (XCell | null)[][];
  config?: { columnlen?: Record<string, number>; merge?: Record<string, { r: number; c: number; rs: number; cs: number }> };
};

/* ---------- zip ---------- */

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A zip archive of text files, stored without compression. */
export function zip(files: [path: string, text: string][]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  const header = (size: number) => new DataView(new ArrayBuffer(size));
  for (const [path, text] of files) {
    const name = encoder.encode(path);
    const body = encoder.encode(text);
    const crc = crc32(body);
    const local = header(30);
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // names are UTF-8
    local.setUint16(12, 0x21, true); // a fixed date: 1 January 1980
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, body.length, true);
    local.setUint16(26, name.length, true);
    const central = header(46);
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(14, 0x21, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, body.length, true);
    central.setUint32(24, body.length, true);
    central.setUint16(28, name.length, true);
    central.setUint32(42, offset, true);
    chunks.push(new Uint8Array(local.buffer), name, body);
    directory.push(new Uint8Array(central.buffer), name);
    offset += 30 + name.length + body.length;
  }
  const size = directory.reduce((n, part) => n + part.length, 0);
  const end = header(22);
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  const out = new Uint8Array(offset + size + 22);
  let at = 0;
  for (const part of [...chunks, ...directory, new Uint8Array(end.buffer)]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/* ---------- pieces ---------- */

const esc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function columnName(c: number): string {
  let name = "";
  for (let n = c; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name;
  return name;
}

/** Functions newer than the file format's first version: Excel wants them marked in the file. */
const NEWER = new Set(["IFS", "SWITCH", "IFNA", "XLOOKUP", "XMATCH", "MAXIFS", "MINIFS", "TEXTJOIN", "CONCAT", "RRI", "PDURATION", "DAYS"]);

/** A formula as the file stores it: no "=", function names in capitals, the newer ones marked. Text in quotes is left alone. */
export function fileFormula(formula: string): string {
  return formula
    .replace(/^=/, "")
    .split(/("(?:[^"]|"")*"?)/)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/([A-Za-z_][A-Za-z0-9_.]*)(\s*\()/g, (_, name: string, open: string) => {
            const upper = name.toUpperCase();
            return (NEWER.has(upper) ? `_xlfn.${upper}` : upper) + open;
          }),
    )
    .join("");
}

/** "#1a2b3c" or "rgb(26, 43, 60)" as the file writes a colour; null for anything else. */
function colour(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const hex = /^#?([0-9a-f]{6})$/i.exec(value.trim()) ?? /^#?([0-9a-f]{3})$/i.exec(value.trim());
  if (hex) return `FF${(hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1]).toUpperCase()}`;
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(value);
  if (!rgb) return null;
  return `FF${rgb
    .slice(1, 4)
    .map((n) => Math.min(255, Number(n)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

const isNumeric = (v: unknown): v is number | string => (typeof v === "number" && Number.isFinite(v)) || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));

/** The number format a cell takes in the file. A plain number keeps the look it has on the site. */
export function fileFormat(cell: XCell): string {
  const fa = cell.ct?.fa ?? "General";
  if (fa === "@") return "@";
  if (cell.ct?.t === "d") return fa.replace(/AM\/PM|M/g, (m) => (m === "M" ? "m" : m));
  if (fa !== "General" && !/^0\.0+$/.test(fa)) return fa.replace(/₪/g, '"₪"');
  if (!isNumeric(cell.v)) return "General";
  const n = Number(cell.v);
  if (Number.isInteger(n)) return n >= 1900 && n <= 2100 ? "General" : "#,##0;(#,##0)";
  return Math.abs(n) >= 1000 ? "#,##0.00;(#,##0.00)" : "General";
}

type Style = { format: string; bold: boolean; italic: boolean; underline: boolean; strike: boolean; size: number; colour: string | null; fill: string | null; h: string | null; v: string | null; wrap: boolean };

function styleOf(cell: XCell): Style {
  const h = { "0": "center", "1": "left", "2": "right" }[String(cell.ht ?? "")] ?? null;
  const v = { "0": "center", "1": "top", "2": "bottom" }[String(cell.vt ?? "")] ?? null;
  const size = Number(cell.fs);
  return {
    format: fileFormat(cell),
    bold: Number(cell.bl) === 1,
    italic: Number(cell.it) === 1,
    underline: Number(cell.un) === 1,
    strike: Number(cell.cl) === 1,
    size: size > 0 ? size : 11,
    colour: colour(cell.fc),
    fill: colour(cell.bg),
    h,
    v,
    wrap: String(cell.tb ?? "") === "2",
  };
}

/** Gives each distinct value a number, starting after the ones the file must begin with. */
function registry(first: string[]) {
  const list = [...first];
  const index = new Map(first.map((item, i) => [item, i]));
  return {
    list,
    id(item: string) {
      let at = index.get(item);
      if (at === undefined) {
        at = list.length;
        list.push(item);
        index.set(item, at);
      }
      return at;
    },
  };
}

/** A sheet name Excel accepts: at most 31 characters, none of []:*?/\ , and unlike the others. */
export function sheetNames(names: string[]): string[] {
  const taken = new Set<string>();
  return names.map((raw, i) => {
    const base = raw.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || `Sheet${i + 1}`;
    let name = base;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
    taken.add(name.toLowerCase());
    return name;
  });
}

function cellsOf(sheet: XSheet): { r: number; c: number; cell: XCell }[] {
  const out: { r: number; c: number; cell: XCell }[] = [];
  const add = (r: number, c: number, v: XCell | string | number | null | undefined) => {
    if (v === null || v === undefined) return;
    out.push({ r, c, cell: typeof v === "object" ? v : { v } });
  };
  if (sheet.data?.length) sheet.data.forEach((row, r) => row?.forEach((v, c) => add(r, c, v)));
  else sheet.celldata?.forEach(({ r, c, v }) => add(r, c, v));
  return out.sort((a, b) => a.r - b.r || a.c - b.c);
}

/* ---------- the workbook ---------- */

const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

export function toXlsx(sheets: XSheet[]): Uint8Array {
  const book = sheets.length ? sheets : [{ name: "Sheet1" }];
  const names = sheetNames(book.map((s) => s.name));
  const formats = registry([]);
  const fonts = registry(['<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>']);
  const fills = registry(['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>']);
  const xfs = registry(['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']);

  const xf = (s: Style): number => {
    const numFmtId = s.format === "General" ? 0 : s.format === "@" ? 49 : 164 + formats.id(s.format);
    const fontId = fonts.id(
      `<font>${s.bold ? "<b/>" : ""}${s.italic ? "<i/>" : ""}${s.strike ? "<strike/>" : ""}${s.underline ? "<u/>" : ""}<sz val="${s.size}"/>${s.colour ? `<color rgb="${s.colour}"/>` : ""}<name val="Calibri"/><family val="2"/></font>`,
    );
    const fillId = s.fill ? fills.id(`<fill><patternFill patternType="solid"><fgColor rgb="${s.fill}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const aligned = s.h || s.v || s.wrap;
    const alignment = aligned ? `<alignment${s.h ? ` horizontal="${s.h}"` : ""}${s.v ? ` vertical="${s.v}"` : ""}${s.wrap ? ' wrapText="1"' : ""}/>` : "";
    return xfs.id(
      `<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="0" xfId="0"${numFmtId ? ' applyNumberFormat="1"' : ""}${fontId ? ' applyFont="1"' : ""}${fillId ? ' applyFill="1"' : ""}${aligned ? ' applyAlignment="1"' : ""}${alignment ? `>${alignment}</xf>` : "/>"}`,
    );
  };

  const sheetXml = (sheet: XSheet): string => {
    const rows = new Map<number, string[]>();
    for (const { r, c, cell } of cellsOf(sheet)) {
      const ref = `${columnName(c)}${r + 1}`;
      const s = xf(styleOf(cell));
      const style = s ? ` s="${s}"` : "";
      const text = cell.ct?.s ? cell.ct.s.map((part) => part.v ?? "").join("") : cell.v;
      const formula = typeof cell.f === "string" && cell.f.startsWith("=") ? `<f>${esc(fileFormula(cell.f))}</f>` : "";
      let xml: string;
      if (text === null || text === undefined || text === "") {
        xml = formula ? `<c r="${ref}"${style}>${formula}</c>` : style ? `<c r="${ref}"${style}/>` : "";
      } else if (typeof text === "boolean") {
        xml = `<c r="${ref}"${style} t="b">${formula}<v>${text ? 1 : 0}</v></c>`;
      } else if (isNumeric(text) && cell.ct?.fa !== "@" && cell.ct?.t !== "s" && cell.ct?.t !== "g") {
        xml = `<c r="${ref}"${style}>${formula}<v>${Number(text)}</v></c>`;
      } else if (formula) {
        const error = /^#[A-Z0-9/!?]+$/.test(String(text));
        xml = `<c r="${ref}"${style} t="${error ? "e" : "str"}">${formula}<v>${esc(String(text))}</v></c>`;
      } else {
        xml = `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${esc(String(text))}</t></is></c>`;
      }
      if (!xml) continue;
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r)!.push(xml);
    }
    const widths = Object.entries(sheet.config?.columnlen ?? {})
      .map(([c, px]) => [Number(c), Number(px)])
      .filter(([c, px]) => Number.isInteger(c) && c >= 0 && px > 0)
      .sort((a, b) => a[0] - b[0]);
    const cols = widths.length ? `<cols>${widths.map(([c, px]) => `<col min="${c + 1}" max="${c + 1}" width="${Math.round((px / 7) * 100) / 100}" customWidth="1"/>`).join("")}</cols>` : "";
    const merges = Object.values(sheet.config?.merge ?? {}).filter((m) => m && (m.rs > 1 || m.cs > 1));
    const merged = merges.length
      ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${columnName(m.c)}${m.r + 1}:${columnName(m.c + m.cs - 1)}${m.r + m.rs}"/>`).join("")}</mergeCells>`
      : "";
    const data = [...rows.entries()].map(([r, cells]) => `<row r="${r + 1}">${cells.join("")}</row>`).join("");
    return `${HEAD}<worksheet xmlns="${MAIN}"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${data}</sheetData>${merged}</worksheet>`;
  };

  const sheetFiles = book.map((sheet, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet)]);

  const styles =
    `${HEAD}<styleSheet xmlns="${MAIN}">` +
    (formats.list.length ? `<numFmts count="${formats.list.length}">${formats.list.map((f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(f)}"/>`).join("")}</numFmts>` : "") +
    `<fonts count="${fonts.list.length}">${fonts.list.join("")}</fonts>` +
    `<fills count="${fills.list.length}">${fills.list.join("")}</fills>` +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    `<cellXfs count="${xfs.list.length}">${xfs.list.join("")}</cellXfs>` +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    "</styleSheet>";

  return zip([
    [
      "[Content_Types].xml",
      `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${book.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    ["_rels/.rels", `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    [
      "xl/workbook.xml",
      `${HEAD}<workbook xmlns="${MAIN}" xmlns:r="${REL}"><bookViews><workbookView/></bookViews><sheets>${names.map((name, i) => `<sheet name="${esc(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr fullCalcOnLoad="1"/></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${book.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${book.length + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
    ],
    ["xl/styles.xml", styles],
    ...sheetFiles,
  ]);
}
