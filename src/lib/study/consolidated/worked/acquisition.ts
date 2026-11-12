import { BOND, LESSEE, LESSOR, STORY_TABLE } from "../lessons/acquisition";
import { A, agora, pv, type Worked, type WTable } from "./types";

/**
 * Lesson 4's numeric demonstrations as full worked solutions, by the owner's
 * word of 2026-11-12 (all 66 demonstrations of the course, the whole way).
 * The course's own numbers: the café the bakery chain bought, and the
 * screens' small examples. Every figure is worked here and checked against
 * the lesson's solver in the course's tests.
 */

const fac = (r: number, k: number) => `1 ÷ ${(1 + r).toFixed(2)}${k > 1 ? (k === 2 ? "²" : k === 3 ? "³" : k === 4 ? "⁴" : `^${k}`) : ""} = ${(1 / (1 + r) ** k).toFixed(6)}`;
const annuity = (r: number, n: number) => pv(r, n, 1).toFixed(6);
const whole = (v: number) => Math.round(v) + 0;

/* Excess cost on the café's inventory. */
const inv = { book: 140_000, fair: 155_000, sold: 0.6 };

/* The lessor's equipment. */
const lessor = { book: 90_000, first: 40_000, market: 36_000, rate: 0.05, years: 4 };
const lessorFlows = [lessor.first, lessor.market, lessor.market, lessor.market];
const lessorPv = lessorFlows.map((c, i) => c / (1 + lessor.rate) ** (i + 1));

/* The lessee. */
const lessee = { pay: 12_000, market: 13_000, oldRate: 0.06, newRate: 0.08, term: 5, left: 3 };
const lesseeStart = pv(lessee.oldRate, lessee.term, lessee.pay);

/* The contingent liability, and the three year-end states. */
const CLAIM = 32_000;
const claimStates = [0, 14_000, 36_000].map((provision) => {
  const group = Math.max(provision, CLAIM);
  const balance = provision - group;
  return { provision, group, balance, amortized: balance + CLAIM };
});

/* Deferred tax on a 60,000 excess, and the asset held for sale. */
const TAX_EX = { excess: 60_000, rate: 0.23 };
const HFS = { fair: 127_000, costs: 2_000, book: 113_000 };

/* The café's table on 1.7.2025: half a year to the year's end. */
const cafe = { eqBook: 300_000, eqFair: 348_000, eqLife: 8, patent: 50_000, patentLife: 5, hfsEndNet: 121_000, claim: 20_000, face: 200_000, coupon: 10_000, issueRate: 0.03, marketRate: 0.07, tax: 0.23 };
const bondFlows = [cafe.coupon, cafe.coupon + cafe.face];
const bondNeed = bondFlows.map((c, i) => c / (1 + cafe.marketRate) ** (i + 1));
const bondBook = bondFlows.map((c, i) => c / (1 + cafe.issueRate) ** (i + 1));
const sum = (xs: number[]) => xs.reduce((s, v) => s + v, 0);

/** The figures the worked solutions add to the solver's, worked separately. */
export const ACQUISITION_W = {
  invExcess: inv.fair - inv.book,
  invSoldBook: inv.book * inv.sold,
  invSoldExcess: (inv.fair - inv.book) * inv.sold,
  invSoldGroup: inv.fair * inv.sold,
  lessorPv: agora(sum(lessorPv.map(agora))),
  lessorPremium: LESSOR.value - LESSOR.plain,
  lesseeStart: whole(lesseeStart),
  lesseeLiabilityExcess: LESSEE.liabilityBook - LESSEE.liabilityNeed,
  lesseeRouExcess: LESSEE.rouNeed - LESSEE.rouBook,
  claimStates,
  dtl: TAX_EX.excess * TAX_EX.rate,
  netOfTax: TAX_EX.excess * (1 - TAX_EX.rate),
  hfsNet: HFS.fair - HFS.costs,
  hfsExcess: HFS.fair - HFS.costs - HFS.book,
  eqExcess: cafe.eqFair - cafe.eqBook,
  eqHalfYear: ((cafe.eqFair - cafe.eqBook) / cafe.eqLife) * 0.5,
  patentHalfYear: (cafe.patent / cafe.patentLife) * 0.5,
  hfsEnd: Math.min(HFS.fair - HFS.costs, cafe.hfsEndNet) - HFS.book,
  bondNeed: agora(sum(bondNeed.map(agora))),
  bondBook: agora(sum(bondBook.map(agora))),
  taxBaseAt: sum(STORY_TABLE.items.map((r) => r.at)),
  taxBaseEnd: sum(STORY_TABLE.items.map((r) => r.end)),
};

const W = ACQUISITION_W;

export const W_EXCESS: Worked = {
  own: true,
  title: "דוגמה פתורה: עודף העלות על המלאי, ומה קורה כשהוא נמכר",
  givens: [
    "שיבולת קנתה **70%** מרשת קפה הגליל.",
    "בספרי הקפה מלאי בערך של **140,000** ש״ח. השווי ההוגן שלו במועד הרכישה **155,000** ש״ח.",
    "עד סוף השנה נמכרו **60%** מהמלאי.",
  ],
  required: ["1. מהו עודף העלות על המלאי במועד הרכישה?", "2. מה עלות המכר בספרי הקפה ובמאוחד?", "3. מה יתרת המלאי בסוף השנה, בספרים ובמאוחד?"],
  tryFirst: "עודף העלות לפי 100% או לפי 70%? ומה קורה לו כשהמלאי יוצא מהמחסן?",
  steps: [
    {
      h: "עודף העלות במועד הרכישה",
      sheet: [
        { l: "שווי הוגן של המלאי", a: inv.fair },
        { l: "פחות הערך בספרי הקפה", a: -inv.book, k: "op" },
        { l: "עודף עלות", a: W.invExcess, k: "tot" },
      ],
      why: ["למה לא 70%?", "במאוחד מציגים 100% מהמלאי של הקפה, ולכן גם את כל ההפרש בין הספרים לשווי. שיעור ההחזקה נכנס רק כשמחלקים את ההון והרווח."],
      tables: [{ head: ["המלאי", "ספרי הקפה", "עודף עלות", "מאוחד"], rows: [{ c: ["במועד הרכישה", inv.book, W.invExcess, inv.fair], res: true }] }],
      result: `עודף העלות ${A(W.invExcess)}. במאוחד המלאי נמדד לראשונה ב־${A(inv.fair)}.`,
      xl: "`=155000-140000`",
    },
    {
      h: "עלות המכר: 60% נמכרו",
      why: ["למה גם העודף נמכר?", "העודף הוא חלק מהעלות של אותו מלאי בעיני הקבוצה. כשמוכרים 60% מהמלאי, יוצאים גם 60% מהעודף, ונכנסים לעלות המכר."],
      tables: [
        {
          head: ["", "ספרי הקפה", "עודף עלות", "מאוחד"],
          rows: [
            { c: ["ערך במועד הרכישה", inv.book, W.invExcess, inv.fair] },
            { c: ["× החלק שנמכר", "60%", "60%", "60%"] },
            { c: ["עלות המכר", -W.invSoldBook, -W.invSoldExcess, -W.invSoldGroup], res: true },
          ],
        },
      ],
      result: `בספרי הקפה עלות המכר ${A(W.invSoldBook)}, ובמאוחד ${A(W.invSoldGroup)}. ההפרש, ${A(W.invSoldExcess)}, הוא הפחתת עודף העלות.`,
      xl: "`=155000*60%`",
    },
    {
      h: "יתרת המלאי בסוף השנה",
      tables: [
        {
          head: ["", "ספרי הקפה", "עודף עלות", "מאוחד"],
          rows: [
            { c: ["ערך במועד הרכישה", inv.book, W.invExcess, inv.fair] },
            { c: ["פחות עלות המכר", -W.invSoldBook, -W.invSoldExcess, -W.invSoldGroup] },
            { c: ["יתרת המלאי", inv.book - W.invSoldBook, W.invExcess - W.invSoldExcess, inv.fair - W.invSoldGroup], res: true },
          ],
        },
      ],
      result: `בדיקה: \`155,000 × 40% = ${(inv.fair * (1 - inv.sold)).toLocaleString("en-US")}\`. הפחתת העודף מתאימה את הרווח של הבת לרווח של הקבוצה.`,
    },
  ],
};

export const W_LESSOR: Worked = {
  own: true,
  title: "דוגמה פתורה: ציוד שהבת מחכירה בתנאים עדיפים",
  givens: [
    "לבת ציוד בערך בספרים של **90,000** ש״ח, ועוד **4** שנות חיים.",
    "הציוד מוחכר עד סוף השנה הראשונה ב־**40,000** ש״ח, שמתקבלים בסוף השנה.",
    "דמי השוק לציוד כזה **36,000** ש״ח בשנה. שיעור ההיוון **5%**.",
  ],
  required: ["1. מה השווי ההוגן של הציוד במועד הרכישה?", "2. מה עודף העלות?", "3. מה קורה לתנאים העדיפים?"],
  tryFirst: "אילו תזרימים הציוד יביא בכל אחת מארבע השנים? בשנה הראשונה, ובשלוש שאחריה.",
  steps: [
    {
      h: "התזרימים מהציוד",
      timeline: [
        { d: "מועד הרכישה", key: true },
        { d: "סוף שנה 1", n: "החכירה", cf: lessor.first },
        { d: "סוף שנה 2", n: "דמי שוק", cf: lessor.market },
        { d: "סוף שנה 3", n: "דמי שוק", cf: lessor.market },
        { d: "סוף שנה 4", n: "דמי שוק", cf: lessor.market, key: true },
      ],
      why: ["למה 40,000 רק בשנה הראשונה?", "החכירה הקיימת מסתיימת בסוף השנה הראשונה. אחריה הציוד יושכר בדמי השוק, 36,000. לפי ב42, תנאי החכירה נכנסים לתוך שווי הציוד."],
      tables: [
        {
          cap: "היוון בריבית 5%",
          head: ["מועד", "תזרים", "מקדם היוון", "ערך נוכחי"],
          rows: [
            ...lessorFlows.map((c, i) => ({ c: [`סוף שנה ${i + 1}`, c, fac(lessor.rate, i + 1), agora(lessorPv[i])] })),
            { c: ["שווי הוגן של הציוד", "", "", W.lessorPv], res: true },
          ],
        },
      ],
      result: `שווי הציוד, עם החכירה: ${A(LESSOR.value)} (מעוגל לשקל).`,
      xl: "`=NPV(5%,40000,36000,36000,36000)`",
    },
    {
      h: "עודף העלות",
      sheet: [
        { l: "שווי הוגן של הציוד", a: LESSOR.value },
        { l: "פחות הערך בספרי הבת", a: -lessor.book, k: "op" },
        { l: "עודף עלות על הציוד", a: LESSOR.excess, k: "tot" },
      ],
      result: `עודף העלות ${A(LESSOR.excess)}, כולו בשורה של הציוד.`,
    },
    {
      h: "התנאים העדיפים נשארים בתוך הציוד",
      sheet: [
        { l: "שווי הציוד עם החכירה", a: LESSOR.value },
        { l: `פחות שווי בלי החכירה: \`36,000 × ${annuity(lessor.rate, lessor.years)}\``, a: -LESSOR.plain, k: "op" },
        { l: "הערך של התנאים העדיפים", a: W.lessorPremium, k: "tot" },
      ],
      why: ["למה לא נכס נפרד?", "כשהבת היא המחכירה, ב42 אוסר להכיר בנכס או בהתחייבות נפרדים בגלל תנאי החכירה. ההפרש נכנס לשווי של הציוד עצמו."],
      result: `${A(W.lessorPremium)} מהעודף נובעים מהחכירה העדיפה, והם חלק מהציוד.`,
      xl: "`=PV(5%,4,-36000)`",
    },
  ],
};

export const W_LESSEE: Worked = {
  own: true,
  title: "דוגמה פתורה: חכירה של הבת, מהוונת מחדש במועד הרכישה",
  givens: [
    "לפני שנתיים הבת חתמה על חכירת ציוד ל־**5** שנים, **12,000** ש״ח בסוף כל שנה, בריבית תוספתית של **6%**.",
    "ב־1.1.2026 הקבוצה קנתה את הבת. נותרו **3** תשלומים.",
    "הריבית התוספתית ב־1.1.2026 **8%**. דמי השוק לציוד כזה **13,000** ש״ח בשנה.",
    "הבת מפחיתה את נכס זכות השימוש בקו ישר על פני 5 שנים.",
  ],
  required: ["1. כמה צריכים להיות ההתחייבות והנכס במאוחד?", "2. כמה הם בספרי הבת?", "3. מה עודף העלות על כל אחד?"],
  tryFirst: "איזו ריבית משמשת במאוחד, ואיזו בספרי הבת? ולפי איזה תשלום מודדים כל אחד?",
  steps: [
    {
      h: "התחייבות החכירה במאוחד",
      timeline: [
        { d: "1.1.2026", n: "צירוף, 8%", key: true },
        { d: "31.12.2026", n: "תשלום", cf: lessee.pay },
        { d: "31.12.2027", n: "תשלום", cf: lessee.pay },
        { d: "31.12.2028", n: "תשלום אחרון", cf: lessee.pay, key: true },
      ],
      sheet: [
        { l: "תשלום שנתי", a: lessee.pay },
        { l: "× מקדם קצבה, 8%, 3 שנים", a: annuity(lessee.newRate, lessee.left), k: "op" },
        { l: "התחייבות, צריך להיות", a: LESSEE.liabilityNeed, k: "tot" },
      ],
      why: ["למה 8%?", "לפי סעיף 28ב, מהוונים את התשלומים שנותרו כאילו החכירה חדשה, בריבית של מועד הרכישה."],
      result: `ההתחייבות במאוחד ${A(LESSEE.liabilityNeed)}.`,
      xl: "`=-PV(8%,3,12000)`",
    },
    {
      h: "התחייבות החכירה בספרי הבת",
      sheet: [
        { l: "תשלום שנתי", a: lessee.pay },
        { l: "× מקדם קצבה, 6%, 3 שנים", a: annuity(lessee.oldRate, lessee.left), k: "op" },
        { l: "התחייבות בספרי הבת", a: LESSEE.liabilityBook, k: "tot" },
      ],
      why: ["למה 6%?", "הבת ממשיכה בריבית שבה התחילה את החכירה. אחרי שני תשלומים, היתרה שלה היא הערך הנוכחי של שלושת התשלומים שנותרו באותה ריבית."],
      result: `בספרי הבת ${A(LESSEE.liabilityBook)}.`,
      xl: "`=-PV(6%,3,12000)`",
    },
    {
      h: "נכס זכות השימוש במאוחד",
      sheet: [
        { l: "דמי שוק שנתיים", a: lessee.market },
        { l: "× מקדם קצבה, 8%, 3 שנים", a: annuity(lessee.newRate, lessee.left), k: "op" },
        { l: "נכס, צריך להיות", a: LESSEE.rouNeed, k: "tot" },
      ],
      why: ["למה דמי השוק?", "הנכס נמדד כמו ההתחייבות, ומותאם לתנאים עדיפים או נחותים. התשלום, 12,000, נמוך מהשוק, 13,000. לכן הנכס גדול מההתחייבות."],
      result: `הנכס במאוחד ${A(LESSEE.rouNeed)}.`,
      xl: "`=-PV(8%,3,13000)`",
    },
    {
      h: "נכס זכות השימוש בספרי הבת",
      sheet: [
        { l: `הנכס בתחילת החכירה: \`12,000 × ${annuity(lessee.oldRate, lessee.term)}\``, a: W.lesseeStart },
        { l: "× 3/5, השנים שנותרו", a: LESSEE.rouBook, k: "tot" },
      ],
      why: ["למה 3/5?", "בתחילת החכירה הנכס שווה להתחייבות. הבת מפחיתה אותו בקו ישר על 5 שנים. עברו 2 שנים, ולכן נשארו 3/5 ממנו."],
      result: `בספרי הבת ${A(LESSEE.rouBook)}.`,
      xl: "`=-PV(6%,5,12000)*3/5`",
    },
    {
      h: "עודף העלות",
      tables: [
        {
          head: ["", "התחייבות", "נכס זכות שימוש"],
          rows: [
            { c: ["צריך להיות", -LESSEE.liabilityNeed, LESSEE.rouNeed] },
            { c: ["פחות בספרי הבת", LESSEE.liabilityBook, -LESSEE.rouBook] },
            { c: ["עודף עלות", W.lesseeLiabilityExcess, W.lesseeRouExcess], res: true },
          ],
        },
      ],
      why: ["למה העודף על ההתחייבות חיובי?", "ההתחייבות במאוחד נמוכה מזו שבספרים, כי הריבית עלתה. התחייבות שקטנה מגדילה את הנכסים נטו, ולכן לפי הסימנים העודף חיובי."],
      result: `עודף על ההתחייבות ${A(W.lesseeLiabilityExcess)}, ועל הנכס ${A(W.lesseeRouExcess)}.`,
    },
  ],
};

export const W_CLAIM: Worked = {
  own: true,
  title: "דוגמה פתורה: התחייבות תלויה, ושלושה מצבים בסוף השנה",
  givens: [
    "לבת תביעה שבגללה קיימת מחויבות בהווה, אבל לא צפוי תזרים. לכן בספרי הבת אין הפרשה.",
    "השווי ההוגן של התביעה במועד הרכישה **32,000** ש״ח.",
    "בסוף השנה בודקים שלושה מצבים: הבת לא הכירה בהפרשה, הכירה ב־**14,000** ש״ח, או הכירה ב־**36,000** ש״ח.",
  ],
  required: ["1. מה עודף העלות במועד הרכישה?", "2. בכל מצב: בכמה מוצגת התביעה במאוחד, מה יתרת העודף, ומה הופחת?"],
  tryFirst: "במאוחד מציגים את הגבוה מבין שני סכומים. אילו?",
  steps: [
    {
      h: "עודף העלות במועד הרכישה",
      sheet: [
        { l: "התחייבות, צריך להיות", a: -CLAIM },
        { l: "פחות בספרי הבת", a: 0, k: "op" },
        { l: "עודף עלות", a: -CLAIM, k: "tot" },
      ],
      why: ["למה מכירים בלי תזרים צפוי?", "לפי סעיפים 22 ו־23 של IFRS 3, במועד הרכישה מספיקה מחויבות בהווה ששוויה ניתן למדידה מהימנה. התנאי של IAS 37 שצפוי תזרים לא נדרש."],
      result: `עודף עלות שלילי של ${A(CLAIM)}, כי זו התחייבות שאין בספרי הבת.`,
    },
    {
      h: "בסוף השנה: הגבוה מבין",
      why: ["מה הכלל?", "לפי סעיף 56, עד שהתביעה מסולקת היא נמדדת לפי הגבוה מבין הסכום לפי IAS 37, כלומר ההפרשה בבת, לבין הסכום שהוכר לראשונה, 32,000."],
      tables: [
        {
          head: ["הפרשה בספרי הבת", "צריך להיות: הגבוה מבין ההפרשה ל־32,000", "יתרת העודף", "הפחתה"],
          rows: claimStates.map((s) => ({ c: [s.provision, s.group, s.balance, s.amortized] })),
        },
      ],
      p: ["יתרת העודף היא ההפרשה בספרים פחות מה שצריך להיות. ההפחתה היא כמה העודף התקרב לאפס מאז מועד הרכישה."],
      result: "כשהבת מכירה בהפרשה, הפער בינה לבין המאוחד קטן, ולכן העודף מופחת. במאוחד הסכום משתנה רק כשההפרשה עוברת את 32,000, כמו במצב השלישי.",
      xl: "`=MAX(14000,32000)`",
    },
  ],
};

export const W_TAX: Worked = {
  own: true,
  title: "דוגמה פתורה: מס נדחה על עודף עלות",
  givens: ["עודפי העלות לפני מס **60,000** ש״ח, כולם על נכסים.", "שיעור המס **23%**.", "בסיס המס של הנכסים לא משתנה בגלל הרכישה."],
  required: ["1. מה שורת המס הנדחה בטבלה?", "2. מה עודף העלות נטו ממס?"],
  tryFirst: "הנכס במאוחד גדול מבסיס המס שלו. מה זה יוצר: נכס מס או התחייבות מס?",
  steps: [
    {
      h: "ההפרש הזמני",
      why: ["למה נוצר מס נדחה?", "במאוחד הנכסים גבוהים ב־60,000 מהערך שלהם לצורכי מס. כשהם יופחתו או יימכרו, הקבוצה תשלם מס על ההפרש. זו התחייבות מסים נדחים."],
      result: "הפרש זמני חייב במס של 60,000.",
    },
    {
      h: "שורת המס הנדחה",
      sheet: [
        { l: "עודפי עלות לפני מס", a: TAX_EX.excess },
        { l: "× 23%", a: W.dtl, k: "sub" },
        { l: "בטבלה, בסימן הפוך", a: -W.dtl, k: "tot" },
      ],
      why: ["למה בסימן הפוך?", "עודף על נכס הוא חיובי. המס עליו הוא התחייבות, ולכן בטבלה הוא שלילי."],
      result: `התחייבות מסים נדחים ${A(W.dtl)}, שורה של ${A(-W.dtl)} בטבלה.`,
      xl: "`=60000*23%`",
    },
    {
      h: "עודף העלות נטו ממס",
      sheet: [
        { l: "עודפי עלות לפני מס", a: TAX_EX.excess },
        { l: "פחות מס נדחה", a: -W.dtl, k: "op" },
        { l: "עודף עלות נטו", a: W.netOfTax, k: "tot" },
      ],
      result: `עודף העלות נטו ${A(W.netOfTax)}, כלומר \`60,000 × 77%\`.`,
      xl: "`=60000*(1-23%)`",
    },
  ],
};

export const W_HFS: Worked = {
  own: true,
  title: "דוגמה פתורה: נכס מוחזק למכירה",
  givens: ["לבת מבנה שסווג כמוחזק למכירה, בערך בספרים של **113,000** ש״ח.", "השווי ההוגן שלו במועד הרכישה **127,000** ש״ח. עלויות המכירה **2,000** ש״ח."],
  required: ["1. לפי מה מודדים את המבנה במועד הרכישה, ובכמה?", "2. מה עודף העלות?"],
  tryFirst: "זה חריג למדידה בשווי הוגן. איזה תקן קובע כאן, ומה הוא מוריד מהשווי?",
  steps: [
    {
      h: "המדידה במועד הרכישה",
      sheet: [
        { l: "שווי הוגן", a: HFS.fair },
        { l: "פחות עלויות מכירה", a: -HFS.costs, k: "op" },
        { l: "שווי הוגן בניכוי עלויות מכירה", a: W.hfsNet, k: "tot" },
      ],
      why: ["למה בניכוי עלויות מכירה?", "לפי סעיף 31 של IFRS 3, נכס מוחזק למכירה נמדד לפי IFRS 5, ולא בשווי הוגן. IFRS 5 מודד אותו לפי השווי ההוגן בניכוי עלויות המכירה."],
      result: `המבנה נמדד ב־${A(W.hfsNet)}.`,
      xl: "`=127000-2000`",
    },
    {
      h: "עודף העלות",
      sheet: [
        { l: "המדידה לפי IFRS 5", a: W.hfsNet },
        { l: "פחות הערך בספרי הבת", a: -HFS.book, k: "op" },
        { l: "עודף עלות", a: W.hfsExcess, k: "tot" },
      ],
      why: ["ומה אחר כך?", "למבנה מוחזק למכירה אין פחת. בכל תאריך דיווח בודקים אם השווי ההוגן בניכוי עלויות המכירה ירד, ואז מכירים בהפסד מירידת ערך."],
      result: `עודף העלות ${A(W.hfsExcess)}. מי שמחסיר רק את השווי ההוגן מקבל 14,000, ושוכח את עלויות המכירה.`,
      xl: "`=127000-2000-113000`",
    },
  ],
};

const tableRows = (t: typeof STORY_TABLE): WTable["rows"] => [...t.items, t.tax].map((r) => ({ c: [r.name, r.at, r.amortized, r.end] }));

export const W_TABLE: Worked = {
  own: true,
  title: "דוגמה פתורה: טבלת עודף העלות של קפה הגליל",
  givens: [
    "שיבולת קנתה **70%** מקפה הגליל ב־**1.7.2025**. עד סוף השנה עוברת חצי שנה.",
    "השווי ההוגן של כל הנכסים וההתחייבויות זהה לערך בספרים, חוץ מאלה שבטבלה. שיעור המס **23%**.",
    "האג״ח: ערך נקוב **200,000** ש״ח, ריבית **5%** שמשולמת ב־30.6 כל שנה, פירעון ב־**30.6.2027**. הן הונפקו בריבית שוק של **3%**. ב־1.7.2025 ריבית השוק **7%**.",
  ],
  tables: [
    {
      head: ["פריט", "במועד הרכישה", "ב־31.12.2025"],
      rows: [
        { c: ["מלאי", "ספרים 140,000, שווי 155,000", "60% נמכרו"] },
        { c: ["ציוד", "ספרים 300,000, שווי 348,000", "8 שנות חיים מ־1.7"] },
        { c: ["פטנט", "לא בספרים, שווי 50,000", "5 שנות חיים מ־1.7"] },
        { c: ["מבנה מוחזק למכירה", "ספרים 113,000, שווי 127,000, עלויות מכירה 2,000", "שווי נטו 121,000"] },
        { c: ["תביעה", "מחויבות קיימת, בלי הפרשה, שווי 20,000", "לא השתנתה"] },
      ],
    },
  ],
  required: ["1. חשבו את עודף העלות של כל פריט במועד הרכישה.", "2. חשבו את ההפחתה עד 31.12.2025 ואת היתרה.", "3. חשבו את שורת המס הנדחה.", "4. הציגו את הטבלה המלאה, ולאן הולכת כל הפחתה."],
  tryFirst: "לכל פריט שלוש שאלות: מה ההפרש מהספרים, איך הוא מופחת, וכמה עבר מאז 1.7?",
  steps: [
    {
      h: "מלאי",
      sheet: [
        { l: "עודף במועד הרכישה: `155,000 − 140,000`", a: W.invExcess },
        { l: "פחות 60% שנמכרו", a: -W.invSoldExcess, k: "op" },
        { l: "יתרה ב־31.12", a: W.invExcess - W.invSoldExcess, k: "tot" },
      ],
      why: ["לאן הולכת ההפחתה?", "לעלות המכר. מה שנמכר מהמלאי לוקח איתו את החלק שלו בעודף."],
      result: `ייחוס ${A(W.invExcess)}, הפחתה ${A(-W.invSoldExcess)}, יתרה ${A(W.invExcess - W.invSoldExcess)}.`,
    },
    {
      h: "ציוד",
      sheet: [
        { l: "עודף במועד הרכישה: `348,000 − 300,000`", a: W.eqExcess },
        { l: "פחות פחת לחצי שנה: `48,000 ÷ 8 × 0.5`", a: -W.eqHalfYear, k: "op" },
        { l: "יתרה ב־31.12", a: W.eqExcess - W.eqHalfYear, k: "tot" },
      ],
      why: ["למה רק חצי?", "הבת במאוחד מ־1.7. הפחת השנתי על העודף הוא 6,000, ומ־1.7 עד 31.12 עברה חצי שנה."],
      result: `ייחוס ${A(W.eqExcess)}, הפחתה ${A(-W.eqHalfYear)}, יתרה ${A(W.eqExcess - W.eqHalfYear)}. ההפחתה הולכת לפחת.`,
      xl: "`=48000/8*0.5`",
    },
    {
      h: "פטנט",
      sheet: [
        { l: "עודף במועד הרכישה: `50,000 − 0`", a: cafe.patent },
        { l: "פחות הפחתה לחצי שנה: `50,000 ÷ 5 × 0.5`", a: -W.patentHalfYear, k: "op" },
        { l: "יתרה ב־31.12", a: cafe.patent - W.patentHalfYear, k: "tot" },
      ],
      why: ["למה כל השווי הוא עודף?", "הפטנט לא רשום בספרי הבת, כי פותח בתוכה. במאוחד הוא נכס מזוהה שנקנה, ולכן כל השווי שלו הוא עודף עלות."],
      result: `ייחוס ${A(cafe.patent)}, הפחתה ${A(-W.patentHalfYear)}, יתרה ${A(cafe.patent - W.patentHalfYear)}. ההפחתה הולכת להוצאות הפחתה.`,
      xl: "`=50000/5*0.5`",
    },
    {
      h: "מבנה מוחזק למכירה",
      sheet: [
        { l: "עודף במועד הרכישה: `127,000 − 2,000 − 113,000`", a: W.hfsExcess },
        { l: "ב־31.12: הנמוך מבין 125,000 ל־121,000, פחות 113,000", a: W.hfsEnd, k: "sub" },
        { l: "הפחתה: `8,000 − 12,000`", a: W.hfsEnd - W.hfsExcess, k: "tot" },
      ],
      why: ["למה הנמוך מבין?", "לפי IFRS 5 נכס מוחזק למכירה נמדד לפי הנמוך מבין הערך שלו לבין השווי ההוגן בניכוי עלויות מכירה. השווי נטו ירד ל־121,000, ולכן הערך במאוחד יורד אליו."],
      result: `ייחוס ${A(W.hfsExcess)}, הפחתה ${A(W.hfsEnd - W.hfsExcess)}, יתרה ${A(W.hfsEnd)}. ההפחתה הולכת להפסד מירידת ערך.`,
    },
    {
      h: "תביעה",
      why: ["למה אין הפחתה?", "בספרי הבת עדיין אין הפרשה. במאוחד מציגים את הגבוה מבין ההפרשה, אפס, לבין הסכום הראשוני, 20,000. לכן העודף לא זז."],
      result: "ייחוס (20,000), הפחתה 0, יתרה (20,000).",
    },
    {
      h: "אג״ח לשלם במועד הרכישה",
      timeline: [
        { d: "1.7.2025", n: "צירוף, 7%", key: true },
        { d: "30.6.2026", n: "ריבית", cf: cafe.coupon },
        { d: "30.6.2027", n: "ריבית + קרן", cf: cafe.coupon + cafe.face, key: true },
      ],
      why: ["למה שתי ריביות?", "בספרי הבת האג״ח רשומות לפי הריבית ביום ההנפקה, 3%. במאוחד מודדים אותן מחדש לפי ריבית השוק במועד הרכישה, 7%."],
      tables: [
        {
          cap: "היוון התזרים שנותר, בשתי הריביות",
          head: ["מועד", "תזרים", "ריבית", "מקדם היוון", "ערך נוכחי"],
          rows: [
            ...bondFlows.map((c, i) => ({ c: [i === 0 ? "30.6.2026" : "30.6.2027", c, "7%", fac(cafe.marketRate, i + 1), agora(bondNeed[i])] })),
            { c: ["צריך להיות במאוחד", "", "7%", "", W.bondNeed], res: true },
            ...bondFlows.map((c, i) => ({ c: [i === 0 ? "30.6.2026" : "30.6.2027", c, "3%", fac(cafe.issueRate, i + 1), agora(bondBook[i])] })),
            { c: ["בספרי הבת", "", "3%", "", W.bondBook], res: true },
          ],
        },
      ],
      result: `עודף עלות: \`${BOND.book.toLocaleString("en-US")} − ${BOND.need.toLocaleString("en-US")} = ${Math.round(BOND.at).toLocaleString("en-US")}\`. ההתחייבות במאוחד נמוכה מזו שבספרים, ולכן העודף חיובי.`,
      xl: "`=-PV(7%,2,10000,200000)` ו־`=-PV(3%,2,10000,200000)`",
    },
    {
      h: "אג״ח לשלם ב־31.12.2025",
      tables: [
        {
          head: ["", "ב־1.7.2025", "× ריבית לחצי שנה", "ב־31.12.2025"],
          rows: [
            { c: ["צריך להיות, 7%", -BOND.need, "1.07^0.5", -BOND.needEnd] },
            { c: ["בספרי הבת, 3%", -BOND.book, "1.03^0.5", -BOND.bookEnd] },
            { c: ["עודף עלות", Math.round(BOND.at), "", Math.round(BOND.end)], res: true },
          ],
        },
      ],
      why: ["למה להכפיל?", "עד הריבית הבאה, ב־30.6.2026, כל יתרה גדלה בריבית שלה. לחצי שנה מכפילים בשורש של 1 ועוד הריבית, בריבית דריבית."],
      result: `הפחתה: \`${Math.round(BOND.end).toLocaleString("en-US")} − ${Math.round(BOND.at).toLocaleString("en-US")} = (${(Math.round(BOND.at) - Math.round(BOND.end)).toLocaleString("en-US")})\`. ההפחתה הולכת להוצאות מימון.`,
      xl: "`=192768*1.07^0.5` ו־`=207654*1.03^0.5`",
    },
    {
      h: "מס נדחה",
      sheet: [
        { l: "סך העודפים במועד הרכישה", a: W.taxBaseAt },
        { l: "× 23%, בסימן הפוך", a: STORY_TABLE.tax.at, k: "sub" },
        { l: "סך העודפים ב־31.12", a: W.taxBaseEnd },
        { l: "× 23%, בסימן הפוך", a: STORY_TABLE.tax.end, k: "sub" },
        { l: "הפחתה: היתרה פחות הייחוס", a: STORY_TABLE.tax.amortized, k: "tot" },
      ],
      why: ["למה על הסך?", "התביעה השלילית יוצרת נכס מס, והוא מקזז את התחייבות המס על שאר העודפים. לכן מחשבים 23% על הסך, עם הסימנים, ולא שורה שורה."],
      result: `ייחוס ${A(STORY_TABLE.tax.at)}, הפחתה ${A(STORY_TABLE.tax.amortized)}, יתרה ${A(STORY_TABLE.tax.end)}. ההפחתה הולכת להוצאות מס.`,
      xl: `\`=-(${W.taxBaseAt})*23%\``,
    },
    {
      h: "הטבלה המלאה",
      tables: [
        {
          head: ["", "ייחוס 1.7.2025", "הפחתה 2025", "יתרה 31.12.2025"],
          rows: [...tableRows(STORY_TABLE), { c: ["סך הכול", STORY_TABLE.total.at, STORY_TABLE.total.amortized, STORY_TABLE.total.end], res: true }],
        },
        {
          cap: "לאן הולכת ההפחתה",
          head: ["השורה", "סעיף בדוח רווח והפסד"],
          rows: [{ c: ["מלאי", "עלות המכר"] }, { c: ["ציוד", "פחת"] }, { c: ["פטנט", "הוצאות הפחתה"] }, { c: ["מבנה", "הפסד מירידת ערך"] }, { c: ["תביעה", "אין"] }, { c: ["אג״ח", "הוצאות מימון"] }, { c: ["מס נדחה", "הוצאות מס"] }],
        },
      ],
      result: `העודפים נטו ממס: ${A(STORY_TABLE.total.at)} במועד הרכישה, ו־${A(STORY_TABLE.total.end)} בסוף השנה. ההפחתה נטו, ${A(STORY_TABLE.total.amortized)}, מקטינה את הרווח של הבת בעיני הקבוצה.`,
    },
  ],
};
