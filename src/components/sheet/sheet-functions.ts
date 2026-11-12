/**
 * The sheet's functions, beyond what the library ships:
 *
 * - functions Excel has and the library lacks (IFS, XLOOKUP, XMATCH, MAXIFS, MINIFS, TEXTJOIN),
 * - the Hebrew a reader sees while typing a function: its one-line summary and its arguments.
 *
 * Nothing here touches the DOM, so it can be tested as it is.
 */

type Arg = unknown;
type Fn = (params: Arg[]) => unknown;

/** A function's way of saying "this is an error"; turned into the library's own error value on the way out. */
class Fail extends Error {}
const fail = (code: "#N/A" | "#VALUE!"): never => {
  throw new Fail(code);
};

const flat = (a: Arg): unknown[] => (Array.isArray(a) ? a.flatMap(flat) : [a]);
const empty = (v: unknown) => v === null || v === undefined || v === "";
const asNumber = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

/** Excel's wildcards: * is any run of characters, ? is any one, ~ takes the next as it is. */
function wildcard(pattern: string): RegExp {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "~" && i + 1 < pattern.length) out += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    else if (ch === "*") out += ".*";
    else if (ch === "?") out += ".";
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`, "i");
}

/** A condition as SUMIF writes it: 5, "דלק", ">100", "<>0", "ב*". */
export function criterion(c: unknown): (v: unknown) => boolean {
  if (typeof c === "boolean") return (v) => v === c;
  if (typeof c === "number") return (v) => asNumber(v) === c;
  const [, op = "=", rhs = ""] = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(String(c ?? "")) ?? [];
  const num = asNumber(rhs);
  if (num !== null) {
    return (v) => {
      const n = asNumber(v);
      if (n === null) return op === "<>";
      if (op === "=") return n === num;
      if (op === "<>") return n !== num;
      if (op === "<") return n < num;
      if (op === "<=") return n <= num;
      if (op === ">") return n > num;
      return n >= num;
    };
  }
  if (op === "=" || op === "<>") {
    const re = wildcard(rhs);
    const hit = (v: unknown) => (rhs === "" ? empty(v) : re.test(String(v ?? "")));
    return op === "=" ? hit : (v) => !hit(v);
  }
  // An order comparison against text: by the alphabet, as Excel does.
  return (v) => {
    if (empty(v)) return false;
    const cmp = String(v).localeCompare(rhs, undefined, { sensitivity: "base" });
    return op === "<" ? cmp < 0 : op === "<=" ? cmp <= 0 : op === ">" ? cmp > 0 : cmp >= 0;
  };
}

/** The rows of `range` that pass every (criteria range, condition) pair. */
function matching(range: Arg, pairs: Arg[]): number[] {
  const values = flat(range);
  if (pairs.length === 0 || pairs.length % 2) fail("#VALUE!");
  const keep = values.map(() => true);
  for (let i = 0; i < pairs.length; i += 2) {
    const tested = flat(pairs[i]);
    if (tested.length !== values.length) fail("#VALUE!");
    const pass = criterion(flat(pairs[i + 1])[0]);
    tested.forEach((v, k) => {
      if (!pass(v)) keep[k] = false;
    });
  }
  return values.filter((v, k) => keep[k] && typeof v === "number") as number[];
}

const same = (a: unknown, b: unknown) => {
  const x = asNumber(a);
  const y = asNumber(b);
  if (typeof a !== "string" && typeof b !== "string") return x !== null && x === y;
  return String(a ?? "").toLowerCase() === String(b ?? "").toLowerCase();
};

/** Where `key` sits in `list` (0-based), by XLOOKUP's match modes; -1 when it is not there. */
function position(key: unknown, list: unknown[], mode: number, backwards: boolean): number {
  const order = list.map((_, i) => i);
  if (backwards) order.reverse();
  if (mode === 2) {
    const re = wildcard(String(key ?? ""));
    return order.find((i) => re.test(String(list[i] ?? ""))) ?? -1;
  }
  const exact = order.find((i) => same(list[i], key));
  if (exact !== undefined || mode === 0) return exact ?? -1;
  // The nearest smaller (-1) or larger (1) value, among numbers.
  const k = asNumber(key);
  if (k === null) return -1;
  let best = -1;
  for (const i of order) {
    const n = asNumber(list[i]);
    if (n === null || (mode === -1 ? n > k : n < k)) continue;
    const b = best === -1 ? null : asNumber(list[best]);
    if (b === null || (mode === -1 ? n > b : n < b)) best = i;
  }
  return best;
}

export const CUSTOM_FUNCTIONS: Record<string, Fn> = {
  IFS: (p) => {
    if (p.length < 2 || p.length % 2) fail("#N/A");
    for (let i = 0; i < p.length; i += 2) {
      const test = flat(p[i])[0];
      if (test === true || (typeof test === "number" && test !== 0)) return p[i + 1];
    }
    return fail("#N/A");
  },
  XLOOKUP: (p) => {
    if (p.length < 3) fail("#VALUE!");
    const keys = flat(p[1]);
    const results = flat(p[2]);
    if (keys.length !== results.length) fail("#VALUE!");
    const at = position(flat(p[0])[0], keys, asNumber(p[4]) ?? 0, asNumber(p[5]) === -1);
    if (at === -1) return p.length > 3 && !empty(p[3]) ? p[3] : fail("#N/A");
    return results[at] ?? 0;
  },
  XMATCH: (p) => {
    if (p.length < 2) fail("#VALUE!");
    const at = position(flat(p[0])[0], flat(p[1]), asNumber(p[2]) ?? 0, asNumber(p[3]) === -1);
    return at === -1 ? fail("#N/A") : at + 1;
  },
  MAXIFS: (p) => {
    const hits = matching(p[0], p.slice(1));
    return hits.length ? Math.max(...hits) : 0;
  },
  MINIFS: (p) => {
    const hits = matching(p[0], p.slice(1));
    return hits.length ? Math.min(...hits) : 0;
  },
  TEXTJOIN: (p) => {
    if (p.length < 3) fail("#VALUE!");
    const skip = flat(p[1])[0] !== false && flat(p[1])[0] !== 0;
    return p
      .slice(2)
      .flatMap(flat)
      .filter((v) => !(skip && empty(v)))
      .map((v) => String(v ?? ""))
      .join(String(flat(p[0])[0] ?? ""));
  },
};

/** One argument: its name as Excel writes it, and what it is. */
type Param = [name: string, detail: string, more?: "optional" | "repeats"];
type Help = { a: string; p?: Param[] };

// Shared wording, so the same argument reads the same under every function.
const RATE: Param = ["rate", "שיעור הריבית לתקופה. לדוגמה 5% או 0.05."];
const NPER: Param = ["nper", "מספר התקופות (מספר התשלומים)."];
const PMT: Param = ["pmt", "התשלום הקבוע בכל תקופה. תשלום שיוצא נרשם במינוס."];
const PV: Param = ["pv", "הערך הנוכחי: הסכום היום. לדוגמה קרן ההלוואה."];
const FV: Param = ["fv", "הערך העתידי שנשאר אחרי התשלום האחרון. ברירת המחדל 0.", "optional"];
const TYPE: Param = ["type", "מועד התשלום: 0 בסוף כל תקופה (ברירת המחדל), 1 בתחילתה.", "optional"];
const GUESS: Param = ["guess", "ניחוש ראשוני לשיעור. ברירת המחדל 10%.", "optional"];
const COST: Param = ["cost", "עלות הנכס."];
const SALVAGE: Param = ["salvage", "ערך השייר (הגרט) בסוף אורך החיים."];
const LIFE: Param = ["life", "אורך החיים השימושיים, בתקופות."];
const PERIOD: Param = ["period", "התקופה שעבורה מחשבים."];
const CRITERION = "התנאי. לדוגמה 5, \"דלק\" או \">100\".";
const START: Param = ["start_date", "תאריך ההתחלה."];
const END: Param = ["end_date", "תאריך הסיום."];
const MORE = "ערכים או טווחים נוספים.";

/** The Hebrew for the functions an accounting student reaches for. The rest stay as the library has them. */
export const HEBREW: Record<string, Help> = {
  // סיכום ועיגול
  SUM: { a: "סכום של מספרים או של טווח.", p: [["number1", "המספר או הטווח הראשון לסיכום."], ["number2", MORE, "repeats"]] },
  SUMIF: { a: "סכום התאים שעומדים בתנאי.", p: [["range", "הטווח שנבדק מול התנאי."], ["criteria", CRITERION], ["sum_range", "הטווח שמסכמים, אם הוא שונה מהטווח הנבדק.", "optional"]] },
  SUMIFS: { a: "סכום התאים שעומדים בכמה תנאים.", p: [["sum_range", "הטווח שמסכמים."], ["criteria_range1", "הטווח שנבדק מול התנאי הראשון."], ["criteria1", CRITERION], ["criteria_range2", "זוגות נוספים של טווח ותנאי.", "repeats"]] },
  SUMPRODUCT: { a: "מכפיל טווחים תא מול תא ומסכם את המכפלות.", p: [["array1", "הטווח הראשון."], ["array2", "טווחים נוספים באותו גודל.", "repeats"]] },
  PRODUCT: { a: "מכפלה של מספרים או של טווח.", p: [["number1", "המספר או הטווח הראשון."], ["number2", MORE, "repeats"]] },
  SUBTOTAL: { a: "סיכום ביניים שמתעלם משורות מסוננות.", p: [["function_num", "סוג החישוב: 9 סכום, 1 ממוצע, 2 ספירה, 4 מקסימום, 5 מינימום."], ["ref1", "הטווח הראשון."], ["ref2", "טווחים נוספים.", "repeats"]] },
  ROUND: { a: "מעגל מספר למספר ספרות נתון.", p: [["number", "המספר שמעגלים."], ["num_digits", "מספר הספרות אחרי הנקודה. 0 לשלם, ‎-3 לאלפים."]] },
  ROUNDUP: { a: "מעגל מספר כלפי מעלה (הרחק מאפס).", p: [["number", "המספר שמעגלים."], ["num_digits", "מספר הספרות אחרי הנקודה."]] },
  ROUNDDOWN: { a: "מעגל מספר כלפי מטה (לכיוון אפס).", p: [["number", "המספר שמעגלים."], ["num_digits", "מספר הספרות אחרי הנקודה."]] },
  MROUND: { a: "מעגל לכפולה הקרובה.", p: [["number", "המספר שמעגלים."], ["multiple", "הכפולה. לדוגמה 5 או 0.05."]] },
  CEILING: { a: "מעגל כלפי מעלה לכפולה הקרובה.", p: [["number", "המספר שמעגלים."], ["significance", "הכפולה."]] },
  FLOOR: { a: "מעגל כלפי מטה לכפולה הקרובה.", p: [["number", "המספר שמעגלים."], ["significance", "הכפולה."]] },
  INT: { a: "החלק השלם של מספר (עיגול כלפי מטה).", p: [["number", "המספר."]] },
  TRUNC: { a: "חותך את הספרות שאחרי הנקודה בלי לעגל.", p: [["number", "המספר."], ["num_digits", "כמה ספרות להשאיר אחרי הנקודה. ברירת המחדל 0.", "optional"]] },
  ABS: { a: "הערך המוחלט של מספר (בלי הסימן).", p: [["number", "המספר."]] },
  POWER: { a: "חזקה. לדוגמה ‎(1+r)^n.", p: [["number", "הבסיס."], ["power", "המעריך."]] },
  SQRT: { a: "שורש ריבועי.", p: [["number", "המספר."]] },
  MOD: { a: "השארית מחילוק.", p: [["number", "המחולק."], ["divisor", "המחלק."]] },
  EXP: { a: "e בחזקת מספר.", p: [["number", "המעריך."]] },
  LN: { a: "הלוגריתם הטבעי של מספר.", p: [["number", "המספר."]] },

  // ממוצע, ספירה, קיצון
  AVERAGE: { a: "ממוצע של מספרים או של טווח.", p: [["number1", "המספר או הטווח הראשון."], ["number2", MORE, "repeats"]] },
  AVERAGEIF: { a: "ממוצע התאים שעומדים בתנאי.", p: [["range", "הטווח שנבדק מול התנאי."], ["criteria", CRITERION], ["average_range", "הטווח שממצעים, אם הוא שונה מהטווח הנבדק.", "optional"]] },
  AVERAGEIFS: { a: "ממוצע התאים שעומדים בכמה תנאים.", p: [["average_range", "הטווח שממצעים."], ["criteria_range1", "הטווח שנבדק מול התנאי הראשון."], ["criteria1", CRITERION], ["criteria_range2", "זוגות נוספים של טווח ותנאי."]] },
  COUNT: { a: "כמה תאים מכילים מספר.", p: [["value1", "הערך או הטווח הראשון."], ["value2", MORE, "repeats"]] },
  COUNTA: { a: "כמה תאים אינם ריקים.", p: [["value1", "הערך או הטווח הראשון."], ["value2", MORE, "repeats"]] },
  COUNTIF: { a: "כמה תאים עומדים בתנאי.", p: [["range", "הטווח שנבדק."], ["criteria", CRITERION]] },
  COUNTIFS: { a: "כמה שורות עומדות בכמה תנאים.", p: [["criteria_range1", "הטווח שנבדק מול התנאי הראשון."], ["criteria1", CRITERION], ["criteria_range2", "זוגות נוספים של טווח ותנאי.", "repeats"]] },
  COUNTBLANK: { a: "כמה תאים ריקים יש בטווח.", p: [["range", "הטווח."]] },
  MAX: { a: "הערך הגדול ביותר.", p: [["number1", "המספר או הטווח הראשון."], ["number2", MORE, "repeats"]] },
  MIN: { a: "הערך הקטן ביותר. שימושי ל\"נמוך מבין עלות ושווי מימוש נטו\".", p: [["number1", "המספר או הטווח הראשון."], ["number2", MORE, "repeats"]] },
  MEDIAN: { a: "החציון של קבוצת מספרים.", p: [["number1", "המספר או הטווח הראשון."], ["number2", MORE, "repeats"]] },
  LARGE: { a: "הערך ה-k בגודלו, מהגדול לקטן.", p: [["array", "הטווח."], ["k", "המקום בדירוג. 1 הוא הגדול ביותר."]] },
  SMALL: { a: "הערך ה-k בגודלו, מהקטן לגדול.", p: [["array", "הטווח."], ["k", "המקום בדירוג. 1 הוא הקטן ביותר."]] },

  // תנאים
  IF: { a: "מחזיר ערך אחד אם התנאי מתקיים וערך אחר אם לא.", p: [["logical_test", "התנאי. לדוגמה A1>B1."], ["value_if_true", "מה להחזיר כשהתנאי מתקיים."], ["value_if_false", "מה להחזיר כשהוא לא מתקיים.", "optional"]] },
  AND: { a: "אמת רק אם כל התנאים מתקיימים.", p: [["logical1", "התנאי הראשון."], ["logical2", "תנאים נוספים.", "repeats"]] },
  OR: { a: "אמת אם לפחות אחד מהתנאים מתקיים.", p: [["logical1", "התנאי הראשון."], ["logical2", "תנאים נוספים."]] },
  NOT: { a: "הופך תנאי: אמת לשקר ושקר לאמת.", p: [["logical", "התנאי."]] },
  IFERROR: { a: "מחזיר ערך חלופי כשהנוסחה נותנת שגיאה.", p: [["value", "הנוסחה שנבדקת."], ["value_if_error", "מה להחזיר במקרה של שגיאה. לדוגמה 0."]] },

  // חיפוש
  VLOOKUP: { a: "מחפש ערך בעמודה הראשונה של טבלה ומחזיר ערך מאותה שורה.", p: [["lookup_value", "הערך שמחפשים."], ["table_array", "הטבלה. החיפוש נעשה בעמודה הראשונה שלה."], ["col_index_num", "מספר העמודה בטבלה שממנה מחזירים את התוצאה."], ["range_lookup", "FALSE להתאמה מדויקת, TRUE להתאמה קרובה בטבלה ממוינת.", "optional"]] },
  HLOOKUP: { a: "מחפש ערך בשורה הראשונה של טבלה ומחזיר ערך מאותה עמודה.", p: [["lookup_value", "הערך שמחפשים."], ["table_array", "הטבלה. החיפוש נעשה בשורה הראשונה שלה."], ["row_index_num", "מספר השורה בטבלה שממנה מחזירים את התוצאה."], ["range_lookup", "FALSE להתאמה מדויקת, TRUE להתאמה קרובה.", "optional"]] },
  INDEX: { a: "מחזיר את התא שבשורה ובעמודה נתונות בתוך טווח.", p: [["array", "הטווח."], ["row_num", "מספר השורה בטווח."], ["column_num", "מספר העמודה בטווח."]] },
  MATCH: { a: "מחזיר את המקום של ערך בתוך טווח.", p: [["lookup_value", "הערך שמחפשים."], ["lookup_array", "הטווח שמחפשים בו: שורה אחת או עמודה אחת."], ["match_type", "0 להתאמה מדויקת, 1 לגדול ביותר שאינו עולה על הערך, ‎-1 לקטן ביותר שאינו נמוך ממנו.", "optional"]] },
  CHOOSE: { a: "בוחר ערך מרשימה לפי מספר סידורי.", p: [["index_num", "איזה ערך לבחור: 1 לראשון, 2 לשני."], ["value1", "הערך הראשון."], ["value2", "ערכים נוספים.", "repeats"]] },
  LOOKUP: { a: "מחפש ערך בטווח ממוין ומחזיר ערך מקביל מטווח אחר.", p: [["lookup_value", "הערך שמחפשים."], ["lookup_vector", "הטווח הממוין שמחפשים בו."], ["result_vector", "הטווח שממנו מחזירים את התוצאה.", "optional"]] },

  // ערך הזמן של הכסף
  PV: { a: "ערך נוכחי של סדרת תשלומים קבועים או של סכום עתידי.", p: [RATE, NPER, PMT, ["fv", "סכום חד-פעמי שמתקבל בסוף. להיוון סכום בודד: pmt שווה 0 והסכום כאן.", "optional"], TYPE] },
  FV: { a: "ערך עתידי של סכום ושל סדרת תשלומים קבועים.", p: [RATE, NPER, PMT, ["pv", "הסכום היום. ברירת המחדל 0."], TYPE] },
  NPV: { a: "ערך נוכחי נקי של תזרימים במרווחים קבועים. התזרים הראשון הוא בסוף התקופה הראשונה.", p: [["rate", "שיעור ההיוון לתקופה."], ["value1", "התזרים הראשון או טווח התזרימים."], ["value2", "תזרימים נוספים.", "repeats"]] },
  XNPV: { a: "ערך נוכחי נקי של תזרימים בתאריכים שאינם במרווחים קבועים.", p: [["rate", "שיעור ההיוון השנתי."], ["values", "טווח התזרימים."], ["dates", "טווח התאריכים, אחד לכל תזרים."]] },
  IRR: { a: "שיעור התשואה הפנימי של תזרימים במרווחים קבועים. כך מוצאים ריבית אפקטיבית.", p: [["values", "טווח התזרימים. חייב לכלול לפחות סכום שלילי אחד וסכום חיובי אחד."], GUESS] },
  XIRR: { a: "שיעור התשואה הפנימי השנתי של תזרימים בתאריכים שאינם במרווחים קבועים.", p: [["values", "טווח התזרימים."], ["dates", "טווח התאריכים, אחד לכל תזרים."], GUESS] },
  MIRR: { a: "שיעור תשואה פנימי מתוקן, עם ריבית מימון וריבית השקעה מחדש נפרדות.", p: [["values", "טווח התזרימים."], ["finance_rate", "הריבית על הכסף שהושקע."], ["reinvest_rate", "הריבית שבה משקיעים מחדש את התקבולים."]] },
  PMT: { a: "התשלום הקבוע של הלוואה (קרן וריבית יחד).", p: [RATE, NPER, PV, ["fv", "היתרה שנשארת אחרי התשלום האחרון. ברירת המחדל 0."], ["type", "מועד התשלום: 0 בסוף כל תקופה (ברירת המחדל), 1 בתחילתה."]] },
  IPMT: { a: "חלק הריבית בתוך תשלום מסוים של הלוואה.", p: [RATE, ["per", "מספר התשלום שעבורו מחשבים."], NPER, PV, ["fv", "היתרה שנשארת אחרי התשלום האחרון. ברירת המחדל 0."], ["type", "מועד התשלום: 0 בסוף כל תקופה, 1 בתחילתה."]] },
  PPMT: { a: "חלק הקרן בתוך תשלום מסוים של הלוואה.", p: [RATE, ["per", "מספר התשלום שעבורו מחשבים."], NPER, PV, FV, TYPE] },
  RATE: { a: "שיעור הריבית לתקופה של סדרת תשלומים קבועים.", p: [NPER, PMT, PV, FV, TYPE, GUESS] },
  NPER: { a: "מספר התקופות הדרוש לסילוק הלוואה בתשלומים קבועים.", p: [RATE, PMT, PV, FV, TYPE] },
  EFFECT: { a: "ריבית אפקטיבית שנתית מתוך ריבית נקובה.", p: [["nominal_rate", "הריבית הנקובה השנתית."], ["npery", "מספר תקופות הצבירה בשנה. לדוגמה 12 לחודשי, 4 לרבעוני."]] },
  NOMINAL: { a: "ריבית נקובה שנתית מתוך ריבית אפקטיבית.", p: [["effect_rate", "הריבית האפקטיבית השנתית."], ["npery", "מספר תקופות הצבירה בשנה."]] },
  CUMIPMT: { a: "סך הריבית ששולמה בין שני תשלומים של הלוואה.", p: [RATE, NPER, PV, ["start_period", "התשלום הראשון בחישוב."], ["end_period", "התשלום האחרון בחישוב."], ["type", "מועד התשלום: 0 בסוף כל תקופה, 1 בתחילתה."]] },
  CUMPRINC: { a: "סך הקרן שנפרעה בין שני תשלומים של הלוואה.", p: [RATE, NPER, PV, ["start_period", "התשלום הראשון בחישוב."], ["end_period", "התשלום האחרון בחישוב."], ["type", "מועד התשלום: 0 בסוף כל תקופה, 1 בתחילתה."]] },

  // פחת
  SLN: { a: "פחת לתקופה בשיטת הקו הישר.", p: [COST, SALVAGE, LIFE] },
  DDB: { a: "פחת לתקופה בשיטת היתרה הפוחתת הכפולה.", p: [COST, SALVAGE, LIFE, PERIOD, ["factor", "קצב ההפחתה. ברירת המחדל 2 (כפול)."]] },
  DB: { a: "פחת לתקופה בשיטת היתרה הפוחתת בשיעור קבוע.", p: [COST, SALVAGE, LIFE, PERIOD, ["month", "מספר החודשים בשנה הראשונה. ברירת המחדל 12."]] },
  SYD: { a: "פחת לתקופה בשיטת סכום ספרות השנים.", p: [COST, SALVAGE, LIFE, PERIOD] },

  // תאריכים
  TODAY: { a: "התאריך של היום." },
  DATE: { a: "בונה תאריך משנה, חודש ויום.", p: [["year", "השנה."], ["month", "החודש, 1 עד 12."], ["day", "היום בחודש."]] },
  YEAR: { a: "השנה של תאריך.", p: [["serial_number", "התאריך."]] },
  MONTH: { a: "החודש של תאריך, 1 עד 12.", p: [["serial_number", "התאריך."]] },
  DAY: { a: "היום בחודש של תאריך.", p: [["serial_number", "התאריך."]] },
  EDATE: { a: "התאריך שחל מספר חודשים אחרי תאריך נתון (או לפניו).", p: [START, ["months", "מספר החודשים. מספר שלילי הולך אחורה."]] },
  EOMONTH: { a: "היום האחרון של החודש, מספר חודשים אחרי תאריך נתון.", p: [START, ["months", "מספר החודשים. 0 לסוף אותו חודש."]] },
  DAYS: { a: "מספר הימים בין שני תאריכים.", p: [END, START] },
  DAYS360: { a: "מספר הימים בין שני תאריכים לפי שנה של 360 יום (12 חודשים של 30 יום).", p: [START, END, ["method", "FALSE לשיטה האמריקאית (ברירת המחדל), TRUE לאירופית.", "optional"]] },
  YEARFRAC: { a: "החלק מהשנה שבין שני תאריכים. שימושי לריבית ולפחת יחסיים.", p: [START, END, ["basis", "בסיס הימים: 0 הוא 30/360 (ברירת המחדל), 1 ימים בפועל, 3 ימים בפועל חלקי 365.", "optional"]] },
  DATEDIF: { a: "ההפרש בין שני תאריכים בשנים, בחודשים או בימים.", p: [START, END, ["unit", "היחידה: \"Y\" שנים מלאות, \"M\" חודשים מלאים, \"D\" ימים."]] },
  NETWORKDAYS: { a: "מספר ימי העבודה בין שני תאריכים.", p: [START, END, ["holidays", "טווח של חגים שלא נספרים.", "optional"]] },
  WEEKDAY: { a: "היום בשבוע של תאריך, כמספר.", p: [["serial_number", "התאריך."], ["return_type", "1 כשהשבוע מתחיל ביום ראשון (ברירת המחדל), 2 כשהוא מתחיל ביום שני.", "optional"]] },

  // טקסט
  TEXT: { a: "מציג מספר כטקסט בתבנית שבוחרים.", p: [["value", "המספר או התאריך."], ["format_text", "התבנית. לדוגמה \"#,##0\" או \"dd/mm/yyyy\"."]] },
  VALUE: { a: "הופך טקסט שנראה כמו מספר למספר.", p: [["text", "הטקסט."]] },
  LEFT: { a: "התווים הראשונים של טקסט.", p: [["text", "הטקסט."], ["num_chars", "כמה תווים לקחת. ברירת המחדל 1."]] },
  RIGHT: { a: "התווים האחרונים של טקסט.", p: [["text", "הטקסט."], ["num_chars", "כמה תווים לקחת. ברירת המחדל 1."]] },
  MID: { a: "תווים מאמצע טקסט.", p: [["text", "הטקסט."], ["start_num", "המקום של התו הראשון שלוקחים."], ["num_chars", "כמה תווים לקחת."]] },
  LEN: { a: "מספר התווים בטקסט.", p: [["text", "הטקסט."]] },
  TRIM: { a: "מסיר רווחים מיותרים מטקסט.", p: [["text", "הטקסט."]] },
  CONCATENATE: { a: "מחבר כמה טקסטים לטקסט אחד.", p: [["text1", "הטקסט הראשון."], ["text2", "טקסטים נוספים.", "repeats"]] },
  CONCAT: { a: "מחבר שני ערכים לטקסט אחד.", p: [["value1", "הערך הראשון."], ["value2", "הערך השני."]] },
};

/** Functions the library has no entry for: where they sit in its list, and their Hebrew. */
export const ADDED: Record<string, Help & { like: string; m: [number, number] }> = {
  IFS: { like: "IF", m: [2, 254], a: "בודק תנאים לפי הסדר ומחזיר את הערך של הראשון שמתקיים.", p: [["logical_test1", "התנאי הראשון."], ["value_if_true1", "מה להחזיר כשהוא מתקיים."], ["logical_test2", "זוגות נוספים של תנאי וערך. TRUE כתנאי אחרון פירושו \"בכל מקרה אחר\".", "repeats"]] },
  SWITCH: { like: "IF", m: [3, 255], a: "משווה ערך לרשימת אפשרויות ומחזיר את התוצאה של זו שמתאימה.", p: [["expression", "הערך שבודקים."], ["value1", "האפשרות הראשונה."], ["result1", "מה להחזיר כשהיא מתאימה."], ["value2", "זוגות נוספים של אפשרות ותוצאה. ערך בודד בסוף הוא ברירת המחדל.", "repeats"]] },
  IFNA: { like: "IF", m: [2, 2], a: "מחזיר ערך חלופי כשהנוסחה נותנת ‎#N/A (לא נמצא).", p: [["value", "הנוסחה שנבדקת."], ["value_if_na", "מה להחזיר כשהתוצאה היא ‎#N/A."]] },
  XLOOKUP: { like: "VLOOKUP", m: [3, 6], a: "מחפש ערך בטווח אחד ומחזיר את הערך המקביל מטווח אחר.", p: [["lookup_value", "הערך שמחפשים."], ["lookup_array", "הטווח שמחפשים בו."], ["return_array", "הטווח שממנו מחזירים את התוצאה. באותו גודל כמו טווח החיפוש."], ["if_not_found", "מה להחזיר כשהערך לא נמצא.", "optional"], ["match_mode", "0 התאמה מדויקת (ברירת המחדל), ‎-1 מדויקת או הקטן הקרוב, 1 מדויקת או הגדול הקרוב, 2 תווים כלליים.", "optional"], ["search_mode", "1 מההתחלה לסוף (ברירת המחדל), ‎-1 מהסוף להתחלה.", "optional"]] },
  XMATCH: { like: "MATCH", m: [2, 4], a: "מחזיר את המקום של ערך בתוך טווח.", p: [["lookup_value", "הערך שמחפשים."], ["lookup_array", "הטווח שמחפשים בו."], ["match_mode", "0 התאמה מדויקת (ברירת המחדל), ‎-1 מדויקת או הקטן הקרוב, 1 מדויקת או הגדול הקרוב, 2 תווים כלליים.", "optional"], ["search_mode", "1 מההתחלה לסוף (ברירת המחדל), ‎-1 מהסוף להתחלה.", "optional"]] },
  MAXIFS: { like: "MAX", m: [3, 255], a: "הערך הגדול ביותר מבין התאים שעומדים בתנאים.", p: [["max_range", "הטווח שממנו לוקחים את המקסימום."], ["criteria_range1", "הטווח שנבדק מול התנאי הראשון."], ["criteria1", CRITERION], ["criteria_range2", "זוגות נוספים של טווח ותנאי.", "repeats"]] },
  MINIFS: { like: "MIN", m: [3, 255], a: "הערך הקטן ביותר מבין התאים שעומדים בתנאים.", p: [["min_range", "הטווח שממנו לוקחים את המינימום."], ["criteria_range1", "הטווח שנבדק מול התנאי הראשון."], ["criteria1", CRITERION], ["criteria_range2", "זוגות נוספים של טווח ותנאי.", "repeats"]] },
  TEXTJOIN: { like: "CONCATENATE", m: [3, 255], a: "מחבר טקסטים עם מפריד ביניהם.", p: [["delimiter", "המפריד. לדוגמה \", \"."], ["ignore_empty", "TRUE כדי לדלג על תאים ריקים."], ["text1", "הטקסט או הטווח הראשון."], ["text2", "טקסטים נוספים.", "repeats"]] },
  RRI: { like: "PV", m: [3, 3], a: "שיעור הצמיחה לתקופה שמביא ערך נוכחי לערך עתידי.", p: [NPER, ["pv", "הערך היום."], ["fv", "הערך בסוף."]] },
  PDURATION: { like: "PV", m: [3, 3], a: "מספר התקופות שדרוש לסכום כדי להגיע לערך נתון בריבית קבועה.", p: [RATE, ["pv", "הערך היום."], ["fv", "הערך שרוצים להגיע אליו."]] },
};

/** One entry of the library's function list (the fields this file reads and writes). */
export type ListedFunction = {
  n: string;
  t: number | string;
  d: string;
  a: string;
  m: [number, number];
  p: { name: string; detail: string; example: string; require: string; repeat: string; type: string }[];
};

const listed = ([name, detail, more]: Param, old?: ListedFunction["p"][number]): ListedFunction["p"][number] => ({
  example: old?.example ?? "A1",
  type: old?.type ?? "rangeall",
  name,
  detail,
  require: more ? "o" : (old?.require ?? "m"),
  repeat: more === "repeats" ? "y" : (old?.repeat ?? "n"),
});

/**
 * Puts the Hebrew into the library's function list and adds the functions it lacks.
 * The list is the one the library reads, so it is changed in place; doing it twice changes nothing.
 */
export function localiseFunctions(list: ListedFunction[]) {
  const byName = new Map(list.map((f) => [f.n, f]));
  for (const [name, help] of Object.entries(HEBREW)) {
    const f = byName.get(name);
    if (!f) continue;
    f.a = help.a;
    f.d = help.a;
    if (help.p) f.p = help.p.map((p, i) => listed(p, f.p[i]));
  }
  for (const [name, help] of Object.entries(ADDED)) {
    if (byName.has(name)) continue;
    list.push({ n: name, t: byName.get(help.like)?.t ?? 0, d: help.a, a: help.a, m: help.m, p: (help.p ?? []).map((p) => listed(p)) });
  }
}

/**
 * TRUE and FALSE the way Excel takes them. The library's parser only knows them as functions,
 * TRUE() and FALSE(), so `VLOOKUP(A1,B:C,2,FALSE)` would give #NAME?. Text inside quotes is left alone.
 */
export function booleans(formula: string): string {
  return formula
    .split(/("(?:[^"]|"")*"?)/)
    .map((part, i) => (i % 2 ? part : part.replace(/(?<![A-Za-z0-9_.$])(TRUE|FALSE)(?![A-Za-z0-9_.]|\s*\()/gi, (word) => `${word.toUpperCase()}()`)))
    .join("");
}

type ParserClass = { prototype: { getFunction: (name: string) => unknown; parse: (formula: string) => unknown } };

/**
 * Teaches the library's formula parser the functions above, and TRUE/FALSE. `Parser` is its class; safe to call twice.
 * `errors` are the library's own #N/A and #VALUE! values: only those are caught by IFERROR and IFNA around a function.
 */
export function addFunctions(Parser: ParserClass, errors: { na: unknown; value: unknown }) {
  const proto = Parser.prototype as ParserClass["prototype"] & { __afik?: boolean };
  if (proto.__afik) return;
  const { getFunction, parse } = proto;
  const added = Object.fromEntries(
    Object.entries(CUSTOM_FUNCTIONS).map(([name, fn]): [string, Fn] => [
      name,
      (params) => {
        try {
          return fn(params);
        } catch (e) {
          if (e instanceof Fail) return e.message === "#N/A" ? errors.na : errors.value;
          throw e;
        }
      },
    ]),
  );
  proto.getFunction = function (this: unknown, name: string) {
    return getFunction.call(this, name) ?? added[String(name).toUpperCase()];
  };
  proto.parse = function (this: unknown, formula: string, ...rest: unknown[]) {
    return (parse as (...args: unknown[]) => unknown).call(this, typeof formula === "string" ? booleans(formula) : formula, ...rest);
  };
  proto.__afik = true;
}
