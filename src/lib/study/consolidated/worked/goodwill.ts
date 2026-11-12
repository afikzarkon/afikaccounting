import { A, type Worked } from "./types";

/**
 * Lesson 5's numeric demonstrations as full worked solutions, by the owner's
 * word of 2026-11-12 ("all the calculations, the whole way"). These are the
 * course's own numbers, not the lecturer's: the example stays as it was on the
 * screen, and every step that the screen skipped is shown.
 */

/* The measurement period: provisional amounts, then the final valuation in April 2026. */
const shares = { total: 12_000, bought: 9_000, price: 14 };
const pub = { cash: 130_000, land: 22_000, earnout: 4_000, excess: 28_000 };
const fin = { cash: 130_000, land: 27_000, earnout: 5_300, excess: 40_000 };
const EQUITY = 110_000;
const TAX = 0.25;
const LIFE = 4;
const MONTHS_2025 = 3;

export const PERIOD_W = (() => {
  const holding = shares.bought / shares.total;
  const nciShares = shares.total - shares.bought;
  const nciFair = nciShares * shares.price;
  const side = (s: typeof pub) => {
    const paid = s.cash + s.land + s.earnout;
    const dtl = s.excess * TAX;
    const net = EQUITY + s.excess - dtl;
    const nciShare = net * (1 - holding);
    const year = s.excess / LIFE;
    const amort25 = (year * MONTHS_2025) / 12;
    return { paid, dtl, net, gwFair: paid + nciFair - net, nciShare, gwShare: paid + nciShare - net, year, amort25, taxAmort25: amort25 * TAX };
  };
  const p = side(pub);
  const f = side(fin);
  const extra = f.amort25 - p.amort25;
  const extraNet = extra * (1 - TAX);
  const landGain = fin.land - pub.land;
  return { holding, nciShares, nciFair, p, f, extra, extraNet, landGain, nciOfExtra: extraNet * (1 - holding) };
})();

const W = PERIOD_W;
const dGw = W.f.gwFair - W.p.gwFair;
const dGwShare = W.f.gwShare - W.p.gwShare;

export const W_PERIOD: Worked = {
  own: true,
  title: "דוגמה פתורה: סכומים ארעיים, והתיקון למפרע",
  givens: [
    "ב־1.10.2025 חברת האם רכשה **9,000** מתוך **12,000** מניות של חברת הבת. מחיר השוק של מניית הבת באותו יום **14** ש״ח.",
    "התמורה: **130,000** ש״ח במזומן, קרקע של האם בשווי ארעי של **22,000** ש״ח, ותמורה מותנית הונית בשווי ארעי של **4,000** ש״ח.",
    "הון הבת במועד הרכישה **110,000** ש״ח.",
    "למכונה של הבת עודף עלות ארעי של **28,000** ש״ח. יתרת אורך החיים **4 שנים**. שיעור המס **25%**.",
    "הדוחות של 2025 פורסמו עם הסכומים הארעיים.",
    "באפריל 2026 הסתיימו הערכות השווי, לפי המצב ב־1.10.2025: קרקע **27,000** ש״ח, עודף עלות על המכונה **40,000** ש״ח, ותמורה מותנית **5,300** ש״ח.",
  ],
  required: [
    "1. האם מתקנים למפרע?",
    "2. חשבו את המוניטין כפי שפורסם ולאחר התיקון, כשהזשמ״ש בשווי הוגן וכשהם לפי חלק בנמ״נ.",
    "3. הציגו את טבלת עודף העלות לפני התיקון ואחריו.",
    "4. רשמו את פקודת התיקון ליום הרכישה.",
    "5. מה משתנה במספרי ההשוואה של 2025?",
  ],
  tryFirst: "המידע מאפריל מתאר את המצב ב־1.10.2025? אם כן, אילו סכומים חוזרים אחורה, ומה זה עושה למוניטין?",
  steps: [
    {
      h: "האם מתקנים למפרע",
      why: ["למה כן?", "שני התנאים מתקיימים. המידע מתאר את השווי **כפי שהיה ב־1.10.2025**, ולא אירוע שקרה אחר כך. והוא הגיע באפריל 2026, בתוך שנה ממועד הרכישה (עד 1.10.2026)."],
      result: "הקרקע, המכונה והתמורה המותנית מתוקנות למפרע, ליום הרכישה.",
    },
    {
      h: "התמורה שהועברה",
      why: ["למה גם התמורה המותנית זזה?", "בדרך כלל תמורה מותנית הונית לא נמדדת מחדש. כאן זו לא מדידה מחדש: זה מידע על השווי שלה **ביום הרכישה**, ולכן גם היא מתוקנת למפרע."],
      tables: [
        {
          head: ["רכיב", "כפי שפורסם", "לאחר התיקון", "שינוי"],
          rows: [
            { c: ["מזומן", pub.cash, fin.cash, 0] },
            { c: ["קרקע שהועברה, בשווי הוגן", pub.land, fin.land, fin.land - pub.land] },
            { c: ["תמורה מותנית הונית", pub.earnout, fin.earnout, fin.earnout - pub.earnout] },
            { c: ["תמורה שהועברה", W.p.paid, W.f.paid, W.f.paid - W.p.paid], res: true },
          ],
        },
      ],
      result: `התמורה עולה ב־${A(W.f.paid - W.p.paid)}, מ־${A(W.p.paid)} ל־${A(W.f.paid)}.`,
    },
    {
      h: "הזשמ״ש בשווי הוגן",
      sheet: [
        { l: "מניות הבת", a: shares.total },
        { l: "פחות מניות שהאם רכשה", a: -shares.bought, k: "op" },
        { l: "מניות בידי הזשמ״ש", a: W.nciShares, k: "sub" },
        { l: "× מחיר מניה בשוק ביום הרכישה", a: shares.price, k: "op" },
        { l: "זשמ״ש בשווי הוגן", a: W.nciFair, k: "tot" },
      ],
      why: ["למה הסכום לא משתנה בתיקון?", "מחיר המניה בשוק ביום הרכישה ידוע. הערכות השווי נוגעות לנכסים ולתמורה, לא למחיר המניה."],
      result: `הזשמ״ש בשווי הוגן ${A(W.nciFair)}, לפני התיקון ואחריו.`,
      xl: "`=(12000-9000)*14`",
    },
    {
      h: "הנכסים המזוהים נטו",
      why: ["למה מורידים מס?", "במאוחד המכונה עולה בעודף העלות, אבל לצורכי מס היא נשארת בערך שלה אצל הבת. ההפרש הזמני יוצר התחייבות מסים נדחים: `28,000 × 25% = 7,000`, ולאחר התיקון `40,000 × 25% = 10,000`."],
      tables: [
        {
          head: ["", "כפי שפורסם", "לאחר התיקון"],
          rows: [
            { c: ["הון הבת", EQUITY, EQUITY] },
            { c: ["עודף עלות: מכונה", pub.excess, fin.excess] },
            { c: ["מס נדחה, 25% מהעודף", -W.p.dtl, -W.f.dtl] },
            { c: ["נכסים מזוהים נטו", W.p.net, W.f.net], res: true },
          ],
        },
      ],
      result: `הנכסים נטו עולים ב־${A(W.f.net - W.p.net)}: עודף של ${A(fin.excess - pub.excess)} פחות מס של ${A(W.f.dtl - W.p.dtl)}.`,
    },
    {
      h: "המוניטין, כשהזשמ״ש בשווי הוגן",
      tables: [
        {
          head: ["", "כפי שפורסם", "לאחר התיקון"],
          rows: [
            { c: ["תמורה שהועברה", W.p.paid, W.f.paid] },
            { c: ["זשמ״ש בשווי הוגן", W.nciFair, W.nciFair] },
            { c: ["פחות נכסים מזוהים נטו", -W.p.net, -W.f.net] },
            { c: ["מוניטין", W.p.gwFair, W.f.gwFair], res: true },
          ],
        },
      ],
      why: ["למה המוניטין יורד?", "המוניטין הוא מה שנשאר אחרי שמורידים את הנכסים המזוהים. עלייה בנכס מקטינה אותו, ועלייה בתמורה מגדילה אותו. כאן הנכסים עלו ב־9,000, יותר מהתמורה, שעלתה ב־6,300."],
      result: `המוניטין יורד מ־${A(W.p.gwFair)} ל־${A(W.f.gwFair)}. השינוי, עלייה בתמורה פחות עלייה בנכסים נטו: \`6,300 − 9,000 = (2,700)\``,
    },
    {
      h: "המוניטין, כשהזשמ״ש לפי חלק בנמ״נ",
      why: ["למה כאן גם הזשמ״ש זזים?", "במדידה הזו הזשמ״ש הם 25% מהנכסים נטו, ולכן הם עולים יחד איתם: `25% × 9,000 = 2,250`. המוניטין זז רק בחלק של האם: `6,300 − 75% × 9,000 = (450)`."],
      tables: [
        {
          head: ["", "כפי שפורסם", "לאחר התיקון"],
          rows: [
            { c: ["תמורה שהועברה", W.p.paid, W.f.paid] },
            { c: ["זשמ״ש: 25% × נכסים נטו", W.p.nciShare, W.f.nciShare] },
            { c: ["פחות נכסים מזוהים נטו", -W.p.net, -W.f.net] },
            { c: ["מוניטין", W.p.gwShare, W.f.gwShare], res: true },
          ],
        },
      ],
      result: `המוניטין יורד מ־${A(W.p.gwShare)} ל־${A(W.f.gwShare)}, כלומר ב־${A(-dGwShare)}.`,
    },
    {
      h: "טבלת עודף העלות לפני התיקון ואחריו",
      sheet: [
        { l: "עודף עלות על המכונה, כפי שפורסם", a: pub.excess },
        { l: "÷ 4 שנים", a: W.p.year, k: "sub" },
        { l: "× 3/12 (אוקטובר עד דצמבר)", a: W.p.amort25, k: "tot" },
      ],
      why: ["למה רק שלושה חודשים?", "הבת במאוחד מ־1.10.2025, ולכן ב־2025 מפחיתים את העודף רק על אוקטובר, נובמבר ודצמבר. לאחר התיקון אותו חישוב על 40,000: `40,000 ÷ 4 × 3/12 = 2,500`."],
      tables: [
        {
          cap: "כפי שפורסם",
          head: ["", "ייחוס", "הפחתה 2025", "31.12.25"],
          rows: [
            { c: ["מכונה", pub.excess, -W.p.amort25, pub.excess - W.p.amort25] },
            { c: ["מס נדחה", -W.p.dtl, W.p.taxAmort25, -W.p.dtl + W.p.taxAmort25] },
            { c: ["סך הכול", pub.excess - W.p.dtl, -W.p.amort25 + W.p.taxAmort25, pub.excess - W.p.dtl - W.p.amort25 + W.p.taxAmort25], res: true },
          ],
        },
        {
          cap: "לאחר התיקון למפרע",
          head: ["", "ייחוס", "הפחתה 2025", "31.12.25", "הפחתה 2026", "31.12.26"],
          rows: [
            { c: ["מכונה", fin.excess, -W.f.amort25, fin.excess - W.f.amort25, -W.f.year, fin.excess - W.f.amort25 - W.f.year] },
            { c: ["מס נדחה", -W.f.dtl, W.f.taxAmort25, -W.f.dtl + W.f.taxAmort25, W.f.year * TAX, -W.f.dtl + W.f.taxAmort25 + W.f.year * TAX] },
            {
              c: [
                "סך הכול",
                fin.excess - W.f.dtl,
                -(W.f.amort25 - W.f.taxAmort25),
                fin.excess - W.f.dtl - W.f.amort25 + W.f.taxAmort25,
                -W.f.year * (1 - TAX),
                (fin.excess - W.f.amort25 - W.f.year) * (1 - TAX),
              ],
              res: true,
            },
          ],
        },
      ],
      p: ["טבלת עודף העלות זהה בשתי המדידות של הזשמ״ש, כי היא לפי 100% מהנכס."],
      xl: "`=40000/4*3/12`",
    },
    {
      h: "פקודת התיקון ליום הרכישה, כשהזשמ״ש בשווי הוגן",
      why: ["למה המוניטין בזכות?", "התמורה עלתה ב־6,300 והנכסים נטו ב־9,000. ההפרש, 2,700, יוצא מהמוניטין שנרשם בדוחות שפורסמו."],
      tables: [
        {
          cap: "זשמ״ש בשווי הוגן",
          head: ["חשבון", "חובה", "זכות"],
          rows: [
            { c: ["ח׳ מכונה (עודף עלות)", fin.excess - pub.excess, ""] },
            { c: ["ז׳ התחייבות מסים נדחים", "", W.f.dtl - W.p.dtl] },
            { c: ["ז׳ רווח ממימוש קרקע", "", W.landGain] },
            { c: ["ז׳ קרן הון, תמורה מותנית", "", fin.earnout - pub.earnout] },
            { c: ["ז׳ מוניטין", "", -dGw] },
          ],
        },
        {
          cap: "זשמ״ש לפי חלק בנמ״נ: השורה של המוניטין מתחלקת לשתיים",
          head: ["חשבון", "חובה", "זכות"],
          rows: [
            { c: ["ח׳ מכונה (עודף עלות)", fin.excess - pub.excess, ""] },
            { c: ["ז׳ התחייבות מסים נדחים", "", W.f.dtl - W.p.dtl] },
            { c: ["ז׳ רווח ממימוש קרקע", "", W.landGain] },
            { c: ["ז׳ קרן הון, תמורה מותנית", "", fin.earnout - pub.earnout] },
            { c: ["ז׳ מוניטין", "", -dGwShare] },
            { c: ["ז׳ זשמ״ש", "", W.f.nciShare - W.p.nciShare] },
          ],
        },
      ],
      result: "בשתי הפקודות החובה `12,000`, והזכות `3,000 + 5,000 + 1,300 + 2,700 = 12,000`, או `3,000 + 5,000 + 1,300 + 450 + 2,250 = 12,000`.",
    },
    {
      h: "מה משתנה במספרי ההשוואה של 2025",
      sheet: [
        { l: "הפחתת העודף לאחר התיקון", a: W.f.amort25 },
        { l: "פחות הפחתה שפורסמה", a: -W.p.amort25, k: "op" },
        { l: "הפחתה נוספת, לפני מס", a: W.extra, k: "sub" },
        { l: "פחות חיסכון במס, 25%", a: -W.extra * TAX, k: "op" },
        { l: "ירידה ברווח מההפחתה", a: W.extraNet, k: "tot" },
      ],
      why: ["למה מתקנים את 2025?", "מציגים כאילו הטיפול הושלם כבר ביום הרכישה. לכן בדוחות של 2026, מספרי ההשוואה של 2025 מוצגים מחדש עם הסכומים הסופיים."],
      tables: [
        {
          cap: "רווח או הפסד, 2025",
          head: ["", "שינוי"],
          rows: [
            { c: ["רווח ממימוש הקרקע (ראו ההרחבה למטה)", W.landGain] },
            { c: ["הפחתת עודף עלות, נטו ממס", -W.extraNet] },
            { c: ["השפעה נטו על הרווח", W.landGain - W.extraNet], res: true },
            // Rounded half up before the sign, so (140.63) like the result line, not (140.62).
            { c: ["מזה לזשמ״ש: 25% × (562.50)", -Math.round(W.nciOfExtra * 100) / 100] },
          ],
        },
        {
          cap: "הדוח על המצב הכספי, 31.12.2025",
          head: ["", "כפי שפורסם", "מוצג מחדש"],
          rows: [
            { c: ["עודף עלות: מכונה", pub.excess - W.p.amort25, fin.excess - W.f.amort25] },
            { c: ["התחייבות מסים נדחים", -(W.p.dtl - W.p.taxAmort25), -(W.f.dtl - W.f.taxAmort25)] },
            { c: ["מוניטין (זשמ״ש בשווי הוגן)", W.p.gwFair, W.f.gwFair] },
          ],
        },
      ],
      result: `הרווח של 2025 עולה ב־${A(W.landGain - W.extraNet)}. הרווח מהקרקע שייך כולו לאם, והזשמ״ש נושאים ב־${A(W.nciOfExtra)} מההפחתה הנוספת.`,
    },
  ],
  notes: ["בגיליון של המרצה (4.3) שינוי בשווי הקרקע מתאם רק את התמורה. הרווח ממימוש הקרקע במספרי ההשוואה בא מסעיפים 38 ו־49 בתקן, כמו בהרחבה למטה."],
};
