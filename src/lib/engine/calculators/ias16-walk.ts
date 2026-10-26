import { money, percent, plain } from "../format";
import { round2, sum } from "../math";
import type { ScheduleRow, ScheduleTable, Solution, SolutionStage, StageStep, Values, Working } from "../types";
import { str } from "../validate";
import { DATED_TARGETS, readTarget, type Solved, type TargetKind } from "./ias16-solver";
import { dayBefore, fmtDate, isSyd, METHOD_LABEL, parseInputs, run, weightsOf } from "./ias16-timeline";

/**
 * The IAS 16 solution in the order a question is worked: the data and where
 * each figure goes, the unknown and the given that finds it, every operation
 * of every year, the journal entries, the statements year by year, and how
 * each year's closing balances open the next. Each step says why it is done.
 * The numbers are the timeline's; this file only lays them out.
 */

const fmt = (n: number) => money(n, "ILS");
const yearsText = (months: number) => `${plain(round2(months / 12))} שנים`;

type Ok = Extract<Solved, { ok: true }>;

/** What a missing figure holds up. */
const BLOCKS: Record<string, string> = {
  purchasePrice: "לחשב את עלות הנכס — ולכן גם לא את בסיס הפחת, הפחת והיתרה בספרים",
  attributableCosts: "לחשב את עלות הנכס — ולכן גם לא את בסיס הפחת, הפחת והיתרה בספרים",
  residual: "לחשב את בסיס הפחת (עלות − גרט), ולכן גם לא את הפחת",
  usefulLife: "לחלק את בסיס הפחת בין השנים",
  revisionCost: "לחשב את בסיס הפחת החדש אחרי השיפוץ",
  lifeExtension: "לדעת על פני כמה זמן מפחיתים אחרי השיפוץ",
  revisedResidual: "לחשב את בסיס הפחת אחרי השיפוץ",
  fairValues: "לחשב את הפער בהערכה מחדש, את הקרן ואת הפחת שאחריה",
  fvGiven: "לקבוע את עלות הנכס שהתקבל ואת הרווח או ההפסד מההחלפה",
  fvReceived: "לקבוע את עלות הנכס שהתקבל ואת הרווח או ההפסד מההחלפה",
};

/** Where a known result shows up in the solution. */
const SHOWS_UP: Record<TargetKind, string> = {
  carrying: "ביתרה בספרים בלוח הפחת ובמאזן",
  accumulated: "בפחת שנצבר בלוח הפחת ובמאזן",
  depreciation: "בהוצאות הפחת של השנה בדוח רווח והפסד",
  exchangeGain: "ברווח או בהפסד מההחלפה בדוח רווח והפסד",
  transfer: "בהעברה מהקרן לעודפים באותה שנה",
  surplus: "בקרן ההערכה מחדש במאזן",
  buildingSurplus: "בקרן ההערכה מחדש בגין המבנה במאזן",
  landSurplus: "בקרן ההערכה מחדש בגין הקרקע במאזן",
};

function dataStage(v: Values, unknown?: string): SolutionStage {
  const inp = parseInputs(v);
  const r = run(inp);
  const X = (id: string, shown: string) => (id === unknown ? "X — הנעלם" : shown);
  const method = inp.method;
  const lifeUse =
    method === "straight-line"
      ? "המכנה בנוסחת הפחת: בסיס הפחת מתחלק שווה על פני החודשים"
      : isSyd(method)
        ? `קובע את משקלי השנים ואת סכום הספרות (${weightsOf(method, inp.lifeMonths).map((w) => plain(w)).join(" + ")})`
        : method === "double-declining"
          ? `קובע את שיעור הפחת: 2 ÷ ${plain(round2(inp.lifeMonths / 12))} = ${percent(24 / Math.max(1, inp.lifeMonths))}`
          : "עד מתי הנכס בשימוש; הפחת עצמו לפי יחידות";
  const rows: ScheduleRow[] = [
    { item: "מועד זמינות לשימוש", value: fmtDate(inp.startDate), use: "הפחת מתחיל כאן: סופרים חודשים מחודש הכניסה לשימוש" },
    { item: "טווח החישוב", value: `${fmtDate(str(v, "calcStart"))} – ${fmtDate(str(v, "calcEnd"))}`, use: "השנים שמוצגות בפתרון" },
    { item: "מחיר רכישה", value: X("purchasePrice", fmt(inp.purchasePrice)), use: "נכנס לעלות הנכס" },
    { item: "עלויות המיוחסות במישרין", value: X("attributableCosts", fmt(inp.attributableCosts)), use: "מתווספות לעלות: הובלה, התקנה, הרצה" },
    ...(inp.land ? [{ item: "מרכיב קרקע", value: `${fmt(inp.land.cost)} (${percent(inp.land.share)})`, use: "מופרד מהעלות — קרקע אינה מופחתת" }] : []),
    { item: inp.land ? "ערך גרט (של המבנה)" : "ערך גרט", value: X("residual", fmt(inp.residual)), use: "מנוכה מהעלות: בסיס הפחת = עלות − גרט" },
    { item: "אורך חיים שימושיים", value: X("usefulLife", yearsText(inp.lifeMonths)), use: lifeUse },
    { item: "שיטת הפחת", value: METHOD_LABEL[method], use: "קובעת איך בסיס הפחת מתחלק בין השנים" },
    ...(method === "units"
      ? [{ item: "יחידות תפוקה", value: `${plain(inp.totalUnits)} סה״כ${inp.units.length ? ` · לפי שנה: ${inp.units.map((u) => (u === null ? "—" : plain(u))).join(", ")}` : ""}`, use: "פחת ליחידה = בסיס הפחת ÷ סך היחידות; × היחידות בכל שנה" }]
      : []),
    { item: "מודל המדידה", value: inp.revaluation ? "מודל ההערכה מחדש" : "מודל העלות", use: inp.revaluation ? "הנכס מוצג בשווי הוגן במועד ההערכה, פחות פחת מאז" : "הנכס מוצג בעלות פחות פחת נצבר" },
  ];
  if (inp.renovation) {
    const rn = inp.renovation;
    rows.push(
      { item: "שיפוץ — תאריך", value: fmtDate(rn.date), use: "עד כאן פחת לפי האומדן המקורי; מכאן שלב חדש" },
      { item: "שיפוץ — עלות", value: X("revisionCost", fmt(rn.cost)), use: "מתווספת ליתרה בספרים ערב השיפוץ" },
      { item: "שיפוץ — שינוי באורך החיים", value: X("lifeExtension", yearsText(rn.extension)), use: "מתווסף ליתרת אורך החיים מיום השיפוץ" },
      { item: "שיפוץ — גרט מתוקן", value: X("revisedResidual", fmt(rn.residual)), use: "מחליף את הגרט בבסיס הפחת החדש" },
    );
  }
  for (const rv of inp.revaluations) rows.push({ item: `שווי הוגן ליום ${fmtDate(rv.date)}`, value: unknown === "fairValues" ? `${fmt(rv.value)} (X)` : fmt(rv.value), use: "משווים ליתרה בספרים באותו יום — הפער הוא הערכה מחדש" });
  if (inp.revaluations.length) rows.push({ item: "העברה מהקרן לעודפים", value: inp.transferSurplus ? "בקצב הפחת" : "בעת מימוש בלבד", use: "קובעת אם הקרן קטנה כל שנה" });
  if (inp.exchange) {
    const e = inp.exchange;
    rows.push(
      { item: "החלפה — תאריך", value: fmtDate(e.date), use: "עד כאן פחת לנכס הישן; ביום הזה הוא נגרע" },
      { item: "מהות מסחרית", value: e.commercial ? "יש" : "אין", use: e.commercial ? "הנכס החדש נמדד בשווי הוגן, ומוכר רווח או הפסד" : "הנכס החדש נמדד לפי היתרה בספרים של הישן, בלי רווח או הפסד" },
      ...(e.paid || e.received ? [{ item: e.paid ? "מזומן ששולם" : "מזומן שהתקבל", value: fmt(e.paid || e.received), use: "מתווסף לעלות הנכס החדש או מנוכה ממנה" }] : []),
      ...(e.commercial
        ? [e.basis === "given" ? { item: "שווי הוגן של הנכס שנמסר", value: X("fvGiven", fmt(e.fvGiven)), use: "בסיס המדידה של הנכס החדש (IAS 16.26)" } : { item: "שווי הוגן של הנכס שהתקבל", value: X("fvReceived", fmt(e.fvReceived)), use: "בסיס המדידה של הנכס החדש" }]
        : []),
      { item: "הנכס החדש — אורך חיים וגרט", value: `${yearsText(e.newLife)} · ${fmt(e.newResidual)}`, use: "הפחת ממשיך עם הנכס החדש מיום ההחלפה" },
    );
  }
  const data: ScheduleTable = {
    id: "walk-data",
    title: "הנתונים מהשאלה",
    columns: [
      { key: "item", label: "נתון", format: "text" },
      { key: "value", label: "ערך", format: "text" },
      { key: "use", label: "איפה הוא נכנס בפתרון", format: "text" },
    ],
    rows,
  };

  // The timeline: every date that starts or ends something.
  const events: ScheduleRow[] = [{ date: fmtDate(inp.startDate), what: "הנכס זמין לשימוש", means: "תחילת הפחת" }];
  if (inp.renovation) events.push({ date: fmtDate(inp.renovation.date), what: "שיפוץ", means: "פחת עד יום השיפוץ, ואז בסיס חדש ויתרת חיים מעודכנת" });
  for (const rv of inp.revaluations) events.push({ date: fmtDate(rv.date), what: "הערכה מחדש", means: "פחת עד יום ההערכה, ואז הנכס עובר לשווי ההוגן" });
  if (inp.exchange) events.push({ date: fmtDate(inp.exchange.date), what: "החלפת נכס", means: "פחת עד יום ההחלפה, גריעה, והנכס החדש נכנס" });
  events.push({ date: dayBefore(r.stop), what: inp.exchange ? "תום אורך החיים של הנכס שהתקבל" : "תום אורך החיים", means: "הנכס מופחת עד הגרט — אין פחת נוסף" });
  events.sort((a, b) => String(a.date).split("/").reverse().join("").localeCompare(String(b.date).split("/").reverse().join("")));
  const timeline: ScheduleTable = {
    id: "walk-timeline",
    title: "ציר הזמן",
    columns: [
      { key: "date", label: "תאריך", format: "text" },
      { key: "what", label: "מה קורה", format: "text" },
      { key: "means", label: "מה זה אומר לחישוב", format: "text" },
    ],
    rows: events,
  };
  return {
    id: "data",
    title: "רישום הנתונים",
    why: "לפני שמחשבים, רושמים את כל נתוני השאלה במקום אחד ומסמנים איפה כל נתון נכנס. כך לא מפספסים נתון ורואים מיד מה חסר.",
    steps: [
      { id: "data-table", title: "כל הנתונים, ואיפה כל אחד נכנס", why: "כל מספר בשאלה משמש בחישוב מסוים — כשרושמים לידו לאן הוא הולך, הפתרון נבנה מעצמו.", tables: [data] },
      { id: "data-timeline", title: "ציר הזמן", why: "כל אירוע מחלק את חיי הנכס לשלבים: עד האירוע מחשבים בדרך אחת, ומהאירוע — בדרך חדשה. לכן קודם מסדרים את התאריכים.", tables: [timeline] },
    ],
  };
}

function unknownStage(v: Values, solved?: Ok): SolutionStage {
  const inp = parseInputs(v);
  const steps: StageStep[] = [];
  if (solved) {
    const target = readTarget(v);
    const shown = solved.years ? `${plain(round2(solved.x))} שנים` : fmt(solved.x);
    steps.push(
      {
        id: "x-missing",
        title: `מה חסר: ${solved.label}`,
        why: "מזהים בדיוק איזה נתון חסר ומה הוא עוצר — כדי לדעת איזה נתון אחר בשאלה יכול להחליף אותו.",
        text: [`השאלה לא נותנת את הנתון "${solved.label}". בלי הנתון הזה אי אפשר ${BLOCKS[solved.unknown] ?? "להשלים את החישוב"}.`, "מסמנים אותו X וממשיכים — את X נמצא מנתון אחר שהשאלה כן נותנת."],
      },
      {
        id: "x-given",
        title: `הנתון הנוסף: ${target.label}`,
        why: "נתון תוצאה הוא מה שהחישוב היה מייצר אילו X היה ידוע. לכן אפשר להפוך את הכיוון: לבנות את התוצאה מ-X, ולבודד את X.",
        text: [
          `השאלה נותנת: ${target.label} = ${fmt(target.amount)}.`,
          `הנתון הזה מופיע בפתרון ${SHOWS_UP[target.kind]}${DATED_TARGETS.includes(target.kind) ? "" : target.kind === "exchangeGain" ? "" : ` (שנת ${target.year})`} — והוא תלוי ב-X.`,
        ],
      },
      { id: "x-solve", title: "איך מצאנו את X", why: "כל שורה היא פעולה אחת: קודם הקשר בין הנתון ל-X, ואחר כך מבודדים את X צעד אחר צעד.", workings: solved.proof.steps },
      {
        id: "x-result",
        title: `התוצאה: ${solved.label} = ${shown}`,
        why: "מרגע שמצאנו את X הוא נתון רגיל — מציבים אותו בכל שאר הפתרון.",
        text: [`מעכשיו ${solved.label} = ${shown}, וכל שלבי החישוב שלהלן משתמשים בו. הבדיקה בסוף השלב הקודם מוכיחה שהוא נותן בדיוק את הנתון הידוע.`],
      },
    );
  } else {
    steps.push({ id: "x-none", title: "אין נעלם", why: "בודקים שאין נתון חסר לפני שמתחילים לחשב.", text: ["כל הנתונים הדרושים נתונים בשאלה — ממשיכים ישר לחישוב. (אם בשאלה חסר נתון, לחצו X שליד השדה שלו והזינו את התוצאה הידועה.)"] });
  }
  const extras: string[] = [];
  if (inp.land) extras.push(`מרכיב הקרקע (${fmt(inp.land.cost)}): מופרד מהמבנה. הפחת, הגרט והשיפוץ חלים על המבנה בלבד.`);
  if (inp.renovation) extras.push(`השיפוץ ב-${fmtDate(inp.renovation.date)}: עלותו מתווספת ליתרה בספרים, והיתרה החדשה פחות הגרט המתוקן מופחתת על פני יתרת החיים המעודכנת — מכאן ולהבא.`);
  if (inp.revaluations.length)
    extras.push(`השווי ההוגן (${inp.revaluations.map((rv) => `${fmtDate(rv.date)}: ${fmt(rv.value)}`).join("; ")}): משווים ליתרה בספרים באותו יום. עלייה — לקרן הערכה מחדש (אלא אם מבטלת ירידה קודמת); ירידה — קודם מהקרן, והשאר להפסד.`);
  if (inp.exchange)
    extras.push(
      `ההחלפה ב-${fmtDate(inp.exchange.date)}: ${inp.exchange.commercial ? "יש מהות מסחרית — הנכס החדש נמדד בשווי הוגן, וההפרש מול היתרה בספרים של הישן הוא רווח או הפסד" : "אין מהות מסחרית — הנכס החדש נמדד לפי היתרה בספרים של הישן (± מזומן), בלי רווח או הפסד"}.`,
    );
  if (extras.length) steps.push({ id: "x-extras", title: "מה כל נתון נוסף משנה", why: "כל אירוע בשאלה הוא נתון שמשנה את החישוב מנקודה מסוימת. כאן רואים מה כל אחד משנה, לפני שמחשבים.", text: extras });
  return {
    id: "unknown",
    title: "הנעלמים והנתונים הנוספים",
    why: "מזהים מה לא ידוע, ואיך הנתונים הנוספים בשאלה משלימים אותו — לפני שנכנסים לחישוב.",
    steps,
  };
}

function costStep(v: Values): StageStep {
  const inp = parseInputs(v);
  const D = round2(inp.buildingCost - inp.residual);
  const years = round2(inp.lifeMonths / 12);
  const w: Working[] = [
    { label: "עלות הנכס", equation: { lhs: "עלות", abstract: ["מחיר רכישה", "+", "עלויות המיוחסות במישרין"], numeric: [plain(inp.purchasePrice), "+", plain(inp.attributableCosts)], result: inp.cost } },
  ];
  if (inp.land) w.push({ label: "מפרידים את הקרקע — היא לא מופחתת", equation: { lhs: "עלות המבנה", abstract: ["עלות", "−", "קרקע"], numeric: [plain(inp.cost), "−", plain(inp.land.cost)], result: inp.buildingCost } });
  w.push({ label: "בסיס הפחת — הסכום שמתחלק על פני החיים", equation: { lhs: "בסיס הפחת", abstract: [inp.land ? "עלות המבנה" : "עלות", "−", "ערך גרט"], numeric: [plain(inp.buildingCost), "−", plain(inp.residual)], result: D } });
  const method = inp.method;
  if (method === "straight-line") w.push({ label: "פחת שנתי בקו ישר (לשנה מלאה)", equation: { lhs: "פחת שנתי", abstract: { over: ["בסיס הפחת", "אורך חיים בשנים"] }, numeric: { over: [plain(D), plain(years)] }, result: round2(D / years) } });
  else if (isSyd(method)) {
    const ws = weightsOf(method, inp.lifeMonths);
    w.push({ label: `סכום הספרות (${method === "sum-of-years" ? "יורד: המשקל הגדול בשנה הראשונה" : "עולה: המשקל הגדול בשנה האחרונה"})`, equation: { lhs: "סכום הספרות", abstract: "סכום משקלי שנות הנכס", numeric: ws.map((x) => plain(x)).join(" + "), result: round2(sum(ws)), unit: "number" } });
    w.push({ label: "פחת שנת הנכס הראשונה", equation: { lhs: "פחת שנה 1", abstract: ["בסיס הפחת", "×", { over: ["משקל שנה 1", "סכום הספרות"] }], numeric: [plain(D), "×", { over: [plain(ws[0]), plain(round2(sum(ws)))] }], result: round2((D * ws[0]) / sum(ws)) } });
  } else if (method === "double-declining") w.push({ label: "שיעור הפחת", equation: { lhs: "שיעור", abstract: { over: ["2", "אורך חיים בשנים"] }, numeric: { over: ["2", plain(years)] }, result: 2 / years, unit: "percent" } });
  else w.push({ label: "פחת ליחידת תפוקה", equation: { lhs: "פחת ליחידה", abstract: { over: ["בסיס הפחת", "סך היחידות הצפויות"] }, numeric: { over: [plain(D), plain(inp.totalUnits)] }, result: round2(D / Math.max(1, inp.totalUnits)) } });
  return { id: "calc-cost", title: "עלות הנכס ובסיס הפחת", why: "כל הפחת נגזר מבסיס הפחת — לכן מחשבים אותו ראשון: מה עלה הנכס, וכמה מזה יתחלק על פני השנים.", workings: w };
}

function stages(v: Values, s: Solution, solved?: Ok): SolutionStage[] {
  const years = s.years ?? [];
  const schedule = s.tables.find((t) => t.id === "depreciation")?.rows ?? [];
  const reports = s.tables.filter((t) => t.id === "balance-sheet" || t.id === "profit-or-loss");
  const fold = (i: number) => (i === 0 ? ("open" as const) : ("closed" as const));
  const revaluation = parseInputs(v).revaluation;

  const calc: SolutionStage = {
    id: "calc",
    title: "שלבי הפתרון",
    why: "כל פעולה בנפרד: הנוסחה במילים, הצבת המספרים, והתוצאה. כל תוצאה משמשת את השלב שאחריה.",
    steps: [
      costStep(v),
      ...years.map((y, i) => ({
        id: `calc-${y.id}`,
        title: `${y.title} — ${y.subtitle}`,
        why: "בכל שנה: קודם האירועים שקרו בה, לפי התאריך, ואחר כך הפחת על החודשים שבהם הנכס היה בשימוש. בשיטות ספרות השנים והיתרה הפוחתת — כל שנת נכס בנפרד.",
        workings: y.workings,
        fold: fold(i),
      })),
    ],
  };
  const journal: SolutionStage = {
    id: "journal",
    title: "פקודות יומן",
    why: "כל חישוב הופך לפקודה: ההכרה בנכס, הפחת עד כל אירוע ובסוף השנה, והאירועים עצמם. כל פקודה מאוזנת — חובה = זכות.",
    steps: years.map((y, i) => ({
      id: `journal-${y.id}`,
      title: `${y.title} — ${y.journal.length === 1 ? "פקודה אחת" : `${y.journal.length} פקודות`}`,
      why: i === 0 ? "בשנה הראשונה גם רושמים את הנכס לראשונה, בעלותו." : "הפקודות לפי סדר התאריכים: מה שקרה באמצע השנה קודם, הפחת לסוף השנה אחריו.",
      journal: y.journal,
      text: y.journal.length ? undefined : ["אין פקודות יומן בשנה זו."],
      fold: fold(i),
    })),
  };
  const statements: SolutionStage = {
    id: "statements",
    title: "הצגה מאזנית ותוצאתית לפי השנים",
    why: "בסוף כל שנה מראים איפה הנכס יושב בדוח על המצב הכספי (המאזן), ומה ההשפעה שלו על דוח רווח והפסד באותה שנה.",
    steps: [
      ...years.map((y, i) => ({
        id: `statements-${y.id}`,
        title: y.title,
        why: "המאזן מציג יתרות ליום מסוים (סוף השנה); רווח והפסד מציג את מה שקרה במהלך השנה.",
        statements: [
          { title: `מאזן ליום ${y.balanceDate}`, lines: y.balance },
          { title: `רווח והפסד ל${y.title}`, lines: y.profitOrLoss },
        ],
        fold: fold(i),
      })),
      ...(reports.length ? [{ id: "statements-all", title: "כל השנים במבט אחד", why: "אותם מספרים בטבלה אחת — כך רואים איך הנכס מתקדם משנה לשנה.", tables: reports }] : []),
    ],
  };
  const carry: SolutionStage = {
    id: "next",
    title: "המשך לשנים הבאות",
    why: "שנה אחת נגמרת בדיוק במקום שבו הבאה מתחילה: יתרות הסגירה הן יתרות הפתיחה. כאן רואים את המעבר, ואיך מחשבים את השנה שאחרי.",
    steps: years.map((y, i) => {
      const row = schedule[i] ?? {};
      const next = years[i + 1];
      const gross = round2(Number(row.gross ?? 0) + Number(row.buildingAllowance ?? 0));
      const to = next ? `יתרת הפתיחה של ${next.title}` : "יתרת הפתיחה של השנה הבאה";
      const lines: Working[] = [
        { label: `${revaluation ? "עלות / סכום משוערך" : "עלות"} ליום ${y.balanceDate} ← ${to}`, amount: gross },
        { label: `פחת שנצבר ליום ${y.balanceDate} ← ${to}`, amount: Number(row.accumulated ?? 0) },
        ...(Number(row.land ?? 0) > 0 ? [{ label: `קרקע ← ${to}`, amount: Number(row.land) }] : []),
        { label: `יתרה בספרים ליום ${y.balanceDate} ← ${to}`, amount: Number(row.carrying ?? 0) },
        ...(revaluation ? [{ label: `קרן הערכה מחדש ← ${to}`, amount: round2(Number(row.surplus ?? 0) + Number(row.landSurplus ?? 0)) }] : []),
      ];
      return {
        id: `next-${y.id}`,
        title: next ? `מ${y.title} ל${next.title}` : `אחרי ${y.title}`,
        why: next ? "לא מתחילים מהעלות מחדש: ממשיכים מהיתרות של סוף השנה, ועליהן מוסיפים את מה שקורה בשנה החדשה." : "זו השנה האחרונה בטווח שנבחר — כך ממשיכים אם השאלה מבקשת שנה נוספת.",
        // The balances carried first, then how the next year is worked from them.
        workings: [...lines, ...y.next.map((g) => ({ label: g.title, formula: g.body }))],
        fold: fold(i),
      };
    }),
  };
  return [dataStage(v, solved?.unknown), unknownStage(v, solved), calc, journal, statements, carry];
}

/** The solution with its walk-through attached. */
export function withWalk(v: Values, s: Solution, solved?: Ok): Solution {
  return { ...s, walk: stages(v, s, solved) };
}

