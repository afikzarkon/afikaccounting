import type { BuildCell } from "./sheet-build";

/**
 * Ready sheets a reader can drop in: the layouts accounting questions keep asking for, with the
 * formulas already in place. The yellow cells are the ones to fill; everything else follows them.
 * The numbers are placeholders of our own, there only so the sheet shows something when it opens.
 */
export type Template = { id: string; name: string; about: string; rows: BuildCell[][]; widths: number[] };

const head = (v: string): BuildCell => ({ v, bold: true, shade: "head", align: "center" });
const label = (v: string): BuildCell => ({ v, align: "right" });
const strong = (v: string): BuildCell => ({ v, bold: true, align: "right" });
const input = (v: number, format?: "int" | "percent"): BuildCell => ({ v, shade: "input", format });
const calc = (v: string, format: "int" | "money" | "percent" | "factor" = "int", bold = false): BuildCell => ({ v, format, bold });
const text = (v: string): BuildCell => ({ v, shade: "input", align: "right" });

/** A note under a schedule on how to make it longer. */
const MORE_ROWS = "להוספת תקופות: מסמנים את השורה האחרונה וגוררים את הריבוע שבפינה כלפי מטה.";

const LOAN: Template = {
  id: "loan",
  name: "לוח סילוקין",
  about: "הלוואה בתשלומים קבועים (שפיצר): ריבית, קרן ויתרה בכל תקופה. אותו מבנה משמש גם להתחייבות חכירה.",
  widths: [150, 120, 110, 110, 110, 120],
  rows: [
    [strong("קרן ההלוואה"), input(100000, "int")],
    [strong("ריבית לתקופה"), input(0.05, "percent")],
    [strong("מספר תשלומים"), input(5)],
    [strong("תשלום קבוע"), calc("=PMT(B2,B3,-B1)", "int", true)],
    [strong("סך הריבית"), calc("=SUM(D7:D60)", "int", true)],
    [head("תקופה"), head("יתרת פתיחה"), head("תשלום"), head("ריבית"), head("קרן"), head("יתרת סגירה")],
    ...[7, 8, 9, 10, 11].map((n): BuildCell[] => [
      calc(n === 7 ? "=1" : `=A${n - 1}+1`),
      calc(n === 7 ? "=$B$1" : `=F${n - 1}`),
      calc("=$B$4"),
      calc(`=B${n}*$B$2`),
      calc(`=C${n}-D${n}`),
      calc(`=B${n}-E${n}`),
    ]),
    [],
    [MORE_ROWS],
  ],
};

const PRESENT_VALUE: Template = {
  id: "pv",
  name: "היוון תזרימים",
  about: "ערך נוכחי של תזרימים עתידיים: מקדם היוון לכל שנה, ערך נוכחי לכל תזרים וסך הכול.",
  widths: [150, 120, 120, 120],
  rows: [
    [strong("שיעור היוון"), input(0.06, "percent")],
    [],
    [head("שנה"), head("תזרים"), head("מקדם היוון"), head("ערך נוכחי")],
    ...[1, 2, 3, 4, 5].map((year, i): BuildCell[] => [input(year), input([20000, 20000, 20000, 20000, 50000][i], "int"), calc(`=1/(1+$B$1)^A${4 + i}`, "factor"), calc(`=B${4 + i}*C${4 + i}`, "int")]),
    [strong("סה\"כ"), calc("=SUM(B4:B8)", "int", true), null, calc("=SUM(D4:D8)", "int", true)],
    [],
    [label("בדיקה עם NPV"), calc("=NPV(B1,B4:B8)", "int")],
  ],
};

const DEPRECIATION: Template = {
  id: "depreciation",
  name: "לוח פחת",
  about: "פחת בקו ישר: הוצאת פחת, פחת נצבר ועלות מופחתת לכל שנה.",
  widths: [150, 120, 120, 130],
  rows: [
    [strong("עלות"), input(240000, "int")],
    [strong("ערך שייר"), input(40000, "int")],
    [strong("אורך חיים (שנים)"), input(8)],
    [strong("פחת שנתי"), calc("=SLN(B1,B2,B3)", "int", true)],
    [],
    [head("שנה"), head("הוצאות פחת"), head("פחת נצבר"), head("עלות מופחתת")],
    ...[7, 8, 9, 10, 11, 12, 13, 14].map((n): BuildCell[] => [
      calc(n === 7 ? "=1" : `=A${n - 1}+1`),
      calc("=$B$4"),
      calc(n === 7 ? `=B${n}` : `=C${n - 1}+B${n}`),
      calc(`=$B$1-C${n}`),
    ]),
    [],
    [MORE_ROWS],
  ],
};

const T_ACCOUNT: Template = {
  id: "t-account",
  name: "כרטיס T",
  about: "כרטיס חשבון בשני צדדים, חובה וזכות, עם סיכום ויתרה.",
  widths: [170, 110, 170, 110],
  rows: [
    [strong("שם החשבון"), text("לקוחות")],
    [],
    [head("חובה"), head("סכום"), head("זכות"), head("סכום")],
    [text("יתרת פתיחה"), input(30000, "int"), text("תקבולים"), input(45000, "int")],
    [text("מכירות באשראי"), input(60000, "int"), text(""), null],
    ...Array.from({ length: 6 }, (): BuildCell[] => [text(""), null, text(""), null]),
    [strong("סה\"כ חובה"), calc("=SUM(B4:B11)", "int", true), strong("סה\"כ זכות"), calc("=SUM(D4:D11)", "int", true)],
    [],
    [strong("יתרה (חובה חיובית, זכות שלילית)"), calc("=B12-D12", "int", true)],
  ],
};

const JOURNAL: Template = {
  id: "journal",
  name: "פקודת יומן",
  about: "פקודות יומן בטבלת חובה וזכות, עם בדיקה שהפקודה מאוזנת.",
  widths: [90, 220, 110, 110],
  rows: [
    [head("תאריך"), head("חשבון"), head("חובה"), head("זכות")],
    [text("31.12"), text("הוצאות פחת"), input(25000, "int"), null],
    [text(""), text("פחת נצבר"), null, input(25000, "int")],
    ...Array.from({ length: 8 }, (): BuildCell[] => [text(""), text(""), null, null]),
    [null, strong("סה\"כ"), calc("=SUM(C2:C11)", "int", true), calc("=SUM(D2:D11)", "int", true)],
    [null, strong("הפרש (צריך להיות 0)"), calc("=C12-D12", "int", true)],
  ],
};

const EFFECTIVE_RATE: Template = {
  id: "irr",
  name: "ריבית אפקטיבית",
  about: "מציאת הריבית האפקטיבית מתוך התזרימים עם IRR: הסכום שהתקבל במינוס והתשלומים בפלוס, או להפך.",
  widths: [150, 120],
  rows: [
    [head("תקופה"), head("תזרים")],
    [input(0), input(-95000, "int")],
    ...[1, 2, 3].map((n): BuildCell[] => [input(n), input(6000, "int")]),
    [input(4), input(106000, "int")],
    [],
    [strong("ריבית אפקטיבית לתקופה"), calc("=IRR(B2:B6)", "percent", true)],
  ],
};

export const TEMPLATES: Template[] = [LOAN, PRESENT_VALUE, DEPRECIATION, T_ACCOUNT, JOURNAL, EFFECTIVE_RATE];
