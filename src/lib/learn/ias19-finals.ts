import { b, type BkQuestion, type BkRoll, type BkStep, d2, endOf, money, nf, pc, pvTable, sum, yrs } from "./ias19-booklet";

/**
 * The course's eight summary exam questions: each built on a real exam
 * question the owner sent (its calculation kept, its wording made exact) and
 * raised a level where the exam allowed two readings or stopped short. Every
 * convention a question needs is stated in it, so there is one right answer.
 * Solvers first, then the question as data — the same shape as the booklet
 * questions, so the same screen shows them.
 */

const R = (title: string, rows: BkRoll["rows"], extra: Partial<BkRoll> = {}): BkRoll => ({ title, rows, ...extra });

/** Years and months as the accrued part of a present-value table: "3/12" for months alone, "5.25" when exact, else "63/12". */
const yp = (years: number, months = 0) => {
  const t = years * 12 + months;
  if (!years) return `${months}/12`;
  return t % 3 === 0 ? String(t / 12) : `${t}/12`;
};

// ===========================================================================
// 1. Grants in two categories — one front-loaded (the plan's formula), one back-loaded (straight line) — and their cancellation part way through the next year.

export type GrantPerson = { name: string; hired: number; ends: number };
export type CancelInput = {
  company: string;
  founded: number;
  /** The year whose closing balance is asked; the cancellation is in the next one. */
  year: number;
  ops: { name: string; first: number; firstYears: number; later: number };
  dev: { name: string; first: number; firstYears: number; growth: number };
  a: GrantPerson;
  c: GrantPerson;
  r0: number;
  rM: number;
  /** The cancellation takes effect at the end of this month of the next year. */
  month: number;
  pay: [number, number];
};

export function solveCancel(q: CancelInput) {
  const O = q.ops;
  const D = q.dev;
  const m = q.month / 12;
  // The operations employee: the plan's own formula, since later years are worth less.
  const accA = (s: number) => O.first * Math.min(s, O.firstYears) + O.later * Math.max(0, s - O.firstYears);
  const TA = q.a.ends - q.a.hired + 1;
  const sA = q.year - q.a.hired + 1;
  const nA = TA - sA;
  const A = {
    T: TA,
    served: sA,
    n: nA,
    accrued: accA(sA),
    opening: accA(sA) / (1 + q.r0) ** nA,
    interest: 0,
    service: (accA(sA + m) - accA(sA)) / (1 + q.r0) ** (nA - m),
    remeasured: accA(sA + m) / (1 + q.rM) ** (nA - m),
    accruedM: accA(sA + m),
    pn: 0,
  };
  A.interest = A.opening * ((1 + q.r0) ** m - 1);
  A.pn = A.remeasured - A.opening - A.interest - A.service;
  // The business development employee: later years are materially higher, so straight line over the whole stay.
  const TC = q.c.ends - q.c.hired + 1;
  const grants = Array.from({ length: TC }, (_, k) => (k < D.firstYears ? D.first : D.first * (1 + D.growth) ** (k - D.firstYears + 1)));
  const total = sum(grants);
  const per = total / TC;
  const sC = q.year - q.c.hired + 1;
  const nC = TC - sC;
  const C = {
    T: TC,
    grants,
    total,
    per,
    served: sC,
    n: nC,
    opening: (per * sC) / (1 + q.r0) ** nC,
    interest: 0,
    service: (per * m) / (1 + q.r0) ** (nC - m),
    remeasured: (per * (sC + m)) / (1 + q.rM) ** (nC - m),
    pn: 0,
  };
  C.interest = C.opening * ((1 + q.r0) ** m - 1);
  C.pn = C.remeasured - C.opening - C.interest - C.service;
  const books = A.remeasured + C.remeasured;
  const paid = q.pay[0] + q.pay[1];
  return { A, C, books, paid, result: paid - books, perPerson: [q.pay[0] - A.remeasured, q.pay[1] - C.remeasured] };
}

export function cancelQuestion(id: string, title: string, q: CancelInput): BkQuestion {
  const s = solveCancel(q);
  const y = q.year;
  const O = q.ops;
  const D = q.dev;
  const mo = q.month;
  const cancel = endOf(mo, y + 1);
  const loss = s.result > 0;
  return {
    id,
    title,
    point: "לפני שמכירים ברווח או בהפסד מסילוק, מעדכנים את ההתחייבות ליום הסילוק: ריבית ושירות עד אותו יום, ומדידה מחדש לפי הריבית החדשה. רק את ההפרש בין המחיר **להתחייבות המעודכנת** רושמים כסילוק.",
    facts: [
      `חברת ״${q.company}״ הוקמה ב-1.1.${q.founded}. עובד שמסיים לעבוד, מכל סיבה, מקבל מענק לפי מחלקתו ושנות הוותק שלו.`,
      `${O.name}: ${money(O.first)} ₪ לכל אחת מ-${O.firstYears} שנות הוותק הראשונות, ו-${money(O.later)} ₪ לכל שנה נוספת.`,
      `${D.name}: ${money(D.first)} ₪ לכל אחת מ-${D.firstYears} שנות הוותק הראשונות. מהשנה ה-${D.firstYears + 1}, המענק לכל שנה גבוה ב-${pc(D.growth)} מהמענק לשנה שלפניה (בשנה ה-${D.firstYears + 1}: ${money(D.first * (1 + D.growth))} ₪).`,
      `${q.a.name} (${O.name}) התחילה לעבוד ב-1.1.${q.a.hired}, וצפויה לסיים ב-31.12.${q.a.ends}. ${q.c.name} (${D.name}) התחיל ב-1.1.${q.c.hired}, וצפוי לסיים ב-31.12.${q.c.ends}. הצפי לא השתנה.`,
      `ב-${cancel} ביטלה החברה את שני המענקים, שלא לפי תנאי התוכנית, ושילמה במקומם במזומן ${money(q.pay[0])} ₪ ל${q.a.name} ו-${money(q.pay[1])} ₪ ל${q.c.name}. שניהם ממשיכים לעבוד.`,
      `שיעור ההיוון: ${pc(q.r0)} ב-31.12.${y}, ו-${pc(q.rM)} ב-${cancel}. עלות השירות השוטף מחושבת לפי ריבית תחילת התקופה. ריבית לחלק משנה מחושבת בריבית אפקטיבית.`,
    ],
    tables: [],
    required: [
      `ההתחייבות בגין כל עובד ב-31.12.${y}, כולל נימוק לשיטת הייחוס.`,
      `התנועה בהתחייבות מ-1.1.${y + 1} ועד ${cancel}, לכל עובד.`,
      `הרווח או ההפסד מהביטול, ופקודת היומן ב-${cancel}.`,
    ],
    checks: [
      { label: `${q.a.name}: התחייבות 31.12.${y}`, value: s.A.opening },
      { label: `${q.c.name}: התחייבות 31.12.${y}`, value: s.C.opening },
      { label: `סה״כ ההתחייבות המעודכנת ב-${cancel}`, value: s.books },
      { label: loss ? "הפסד מסילוק" : "רווח מסילוק", value: Math.abs(s.result) },
    ],
    steps: [
      {
        title: "שיטת הייחוס לכל עובד",
        tables: [
          {
            head: ["עובד", "המענק בשנים המאוחרות", "שיטה (סעיף 73)"],
            rows: [
              [q.a.name, `נמוך יותר (${money(O.later)} במקום ${money(O.first)})`, "נוסחת התוכנית"],
              [q.c.name, `גבוה מהותית (עולה ב-${pc(D.growth)} כל שנה)`, "קו ישר על כל שנות השירות"],
            ],
          },
        ],
      },
      {
        title: `${q.c.name}: המענק הכולל, ולכל שנה`,
        tables: [
          {
            head: ["שנת ותק", "מענק"],
            rows: s.C.grants.map((g, k) => [String(k + 1), money(g)]),
            foot: ["סה״כ", money(s.C.total)],
          },
        ],
        text: [`לכל שנה בקו ישר: ${money(s.C.total)} ÷ ${s.C.T} = ${d2(s.C.per)} ₪.`],
      },
      pvTable(`ההתחייבות ב-31.12.${y}`, [
        { label: q.a.name, amount: s.A.accrued, n: s.A.n, value: s.A.opening },
        { label: q.c.name, amount: s.C.per, part: String(s.C.served), n: s.C.n, value: s.C.opening },
      ], {
        rate: q.r0,
        label: "עובד",
        amount: "מענק",
        why: [
          `אצל ${q.a.name} המענק הוא מה שנצבר לפי נוסחת התוכנית: ${money(O.first)} × ${O.firstYears} + ${money(O.later)} × ${s.A.served - O.firstYears} = ${money(s.A.accrued)}.`,
          `אצל ${q.c.name} המענק הוא הסכום לשנה בקו ישר (${d2(s.C.per)} ₪), והחלק שנצבר הוא ${s.C.served} השנים שעברו.`,
        ],
      }),
      pvTable(`עלות שירות שוטף, ${mo} חודשים`, [
        { label: q.a.name, amount: s.A.accruedM - s.A.accrued, n: s.A.n - mo / 12, value: s.A.service },
        { label: q.c.name, amount: s.C.per, part: `${mo}/12`, n: s.C.n - mo / 12, value: s.C.service },
      ], {
        rate: q.r0,
        label: "עובד",
        amount: "מענק",
        why: [
          "ריבית ושירות עד יום הביטול לפי ריבית תחילת השנה. ההתחייבות ביום הביטול נמדדת מחדש לפי הריבית של אותו יום, וההפרש הוא מדידה מחדש ל-OCI (סעיף 99).",
          `אצל ${q.a.name}: מה שנוסף לנצבר לפי הנוסחה ב-${mo} החודשים. אצל ${q.c.name}: ${mo}/12 מהסכום לשנה.`,
        ],
      }),
      pvTable(`ההתחייבות ביום הביטול, ${cancel}`, [
        { label: q.a.name, amount: s.A.accruedM, n: s.A.n - mo / 12, value: s.A.remeasured },
        { label: q.c.name, amount: s.C.per, part: yp(s.C.served, mo), n: s.C.n - mo / 12, value: s.C.remeasured },
      ], { rate: q.rM, label: "עובד", amount: "מענק", why: `לפי הריבית ביום הביטול, ${pc(q.rM)}.` }),
      {
        title: `עדכון ההתחייבות ליום הביטול (${mo} חודשים)`,
        tables: [
          {
            head: ["שורה", q.a.name, q.c.name],
            rows: [
              [`פתיחה 31.12.${y}`, money(s.A.opening), money(s.C.opening)],
              [`ריבית ${mo} חודשים: × (${b(q.r0)}^(${mo}/12) − 1)`, money(s.A.interest), money(s.C.interest)],
              [`שירות ${mo} חודשים`, money(s.A.service), money(s.C.service)],
              ["מדידה מחדש (OCI), מאזנת", money(s.A.pn), money(s.C.pn)],
              [`התחייבות ב-${cancel}`, money(s.A.remeasured), money(s.C.remeasured)],
            ],
          },
        ],
      },
      {
        title: "הסילוק, ופקודת היומן",
        text: [
          `**זה סילוק**: עסקה שלא הייתה בתנאי התוכנית, שמבטלת את המחויבות לגמרי (סעיפים 109–111). ההפרש בין מה ששולם לבין ההתחייבות המעודכנת הולך לרווח והפסד, ובסך הכול: ${money(s.paid)} − ${money(s.books)} = ${money(s.result)} ${loss ? "הפסד" : "רווח"}.`,
          `לכל עובד בנפרד: ${q.a.name} ${money(s.perPerson[0])}, ${q.c.name} ${money(s.perPerson[1])}. רושמים את ההשפעה המצטברת.`,
        ],
        tables: [
          {
            title: `פקודת יומן, ${cancel}`,
            head: ["", "חובה", "זכות"],
            rows: [
              ["התחייבות בגין הטבות לעובדים", money(s.books), ""],
              [loss ? "הפסד מסילוק (רווח והפסד)" : "רווח מסילוק (רווח והפסד)", loss ? money(s.result) : "", loss ? "" : money(-s.result)],
              ["מזומן", "", money(s.paid)],
            ],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 2. Management: some on a defined contribution plan (section 14), the rest on a defined benefit plan with plan assets; the headcount and the opening rate come out of last year's note; then an amendment on 30.9 with the assets' value given on that day.

export type MgmtInput = {
  company: string;
  founded: number;
  heads: number;
  age: number;
  retire: number;
  salary: number;
  raise: number;
  /** Section 14 employees (recovered from the note's deposits). */
  dcHeads: number;
  dcRate: number;
  /** Plan assets in the note's year (the year before the one asked about). */
  assets0: { opening: number; contrib: number; closing: number };
  rOpen: number;
  r1: number;
  rAm: number;
  r2: number;
  gov: [number, number, number];
  month: number;
  add: number;
  assets1: { atAmend: number; contrib: number; closing: number };
};

export function solveMgmt(q: MgmtInput) {
  const y1 = q.founded + 11; // the note's year: 2025 when founded 2014
  const T = q.retire - q.age;
  const final = q.salary * (1 + q.raise) ** (T - 1);
  const sal = (y: number) => q.salary * (1 + q.raise) ** (y - q.founded);
  const dcDeposit0 = Math.round(q.dcHeads * 12 * sal(y1) * q.dcRate);
  const dcRecovered = dcDeposit0 / (12 * sal(y1) * q.dcRate);
  const H = q.heads - q.dcHeads;
  const s0 = y1 - q.founded; // years served at the start of the note's year
  const ob = (served: number, i: number, n: number, f = 1) => (H * final * f * served) / (1 + i) ** n;
  const assetInterest0 = Math.round(q.assets0.opening * q.rOpen);
  const rRecovered = assetInterest0 / q.assets0.opening;
  const a0 = { opening: q.assets0.opening, interest: assetInterest0, contrib: q.assets0.contrib, pn: 0, closing: q.assets0.closing };
  a0.pn = a0.closing - a0.opening - a0.interest - a0.contrib;
  const o0 = { opening: ob(s0, q.rOpen, T - s0), interest: 0, service: (H * final) / (1 + q.rOpen) ** (T - s0 - 1), pn: 0, closing: ob(s0 + 1, q.r1, T - s0 - 1) };
  o0.interest = o0.opening * q.rOpen;
  o0.pn = o0.closing - o0.opening - o0.interest - o0.service;
  // The asked year: split at the amendment.
  const m = q.month / 12;
  const n1 = T - s0 - 1; // years to payment at the start of the asked year
  const i1 = o0.closing * ((1 + q.r1) ** m - 1);
  const sv1 = (H * final * m) / (1 + q.r1) ** (n1 - m);
  const before = ob(s0 + 1 + m, q.rAm, n1 - m);
  const pnAm = before - o0.closing - i1 - sv1;
  const after = before * (1 + q.add);
  const past = after - before;
  const i2 = after * ((1 + q.rAm) ** (1 - m) - 1);
  const sv2 = (H * final * (1 + q.add) * (1 - m)) / (1 + q.rAm) ** (n1 - 1);
  const closing = ob(s0 + 2, q.r2, n1 - 1, 1 + q.add);
  const pnEnd = closing - after - i2 - sv2;
  const o1 = { opening: o0.closing, i1, sv1, pnAm, before, after, past, i2, sv2, pnEnd, closing, interest: i1 + i2, service: sv1 + sv2, pn: pnAm + pnEnd };
  const A = q.assets1;
  const ai1 = q.assets0.closing * ((1 + q.r1) ** m - 1);
  const apn1 = A.atAmend - q.assets0.closing - ai1;
  const ai2 = A.atAmend * ((1 + q.rAm) ** (1 - m) - 1);
  const apn2 = A.closing - A.atAmend - ai2 - A.contrib;
  const a1 = { opening: q.assets0.closing, ai1, apn1, ai2, apn2, contrib: A.contrib, closing: A.closing, interest: ai1 + ai2, pn: apn1 + apn2 };
  const dcExpense1 = q.dcHeads * 12 * sal(y1 + 1) * q.dcRate;
  return {
    y1,
    T,
    final,
    sal,
    dcDeposit0,
    dcRecovered,
    H,
    s0,
    assetInterest0,
    rRecovered,
    a0,
    o0,
    o1,
    a1,
    dcExpense1,
    pl0: { service: o0.service, netInterest: o0.interest - a0.interest, dc: dcDeposit0, oci: o0.pn - a0.pn, net: o0.closing - a0.closing },
    pl1: { salary: o1.service + o1.past, netInterest: o1.interest - a1.interest, dc: dcExpense1, oci: o1.pn - a1.pn, net: o1.closing - a1.closing },
  };
}

export function mgmtQuestion(id: string, title: string, q: MgmtInput): BkQuestion {
  const s = solveMgmt(q);
  const y1 = s.y1;
  const y2 = y1 + 1;
  const mo = q.month;
  const am = endOf(mo, y2);
  const fin = `${money(q.salary)} × ${b(q.raise)}^${s.T - 1}`;
  const gain = (v: number) => (v < 0 ? `רווח ${money(-v)}` : `הפסד ${money(v)}`);
  const pvM = { label: "תוכנית", amount: "שכר בפרישה" };
  const n1 = s.T - s.s0 - 1;
  const finalNew = s.final * (1 + q.add);
  return {
    id,
    title,
    point: "כשהשאלה נותנת ביאור, מחלצים ממנו קודם את מה שחסר: כמה עובדים בכל תוכנית, ובאיזו ריבית נפתחה השנה. שינוי תנאים באמצע השנה מחייב מדידה מחדש של ההתחייבות ושל הנכסים **באותו יום**, ומאז ריבית לפי הנתונים המעודכנים (סעיף 123א).",
    facts: [
      `חברת ״${q.company}״ הוקמה ב-1.1.${q.founded}. מאז מועסקים בה ${q.heads} עובדי הנהלה, ואיש לא עזב. כולם התחילו לעבוד ביום הקמת החברה, בגיל ${q.age} בדיוק, וכולם צפויים לעבוד עד שימלאו להם ${q.retire}, כלומר עד 31.12.${q.founded + q.retire - q.age - 1}.`,
      `השכר החודשי בשנת העבודה הראשונה היה ${money(q.salary)} ₪, והוא עולה ב-${pc(q.raise)} בכל 1.1.`,
      `חלק מהעובדים חתומים על סעיף 14: החברה מפקידה בסוף כל חודש ${pc(q.dcRate)} מהשכר החודשי, ואין לה מחויבות נוספת. מספרם לא השתנה מעולם.`,
      `לשאר העובדים: בסיום העבודה, שכר חודשי אחרון × שנות הוותק, בתשלום אחד. החברה מפקידה לקרן שמקיימת את הגדרת נכסי תכנית. כל ההפקדות לקרן ביום 31.12.`,
      `מהביאור לדוחות ${y1}: ההפקדות לסעיף 14 בשנת ${y1} הסתכמו ב-${money(s.dcDeposit0)} ₪. נכסי התכנית: יתרת פתיחה ${money(q.assets0.opening)}, הכנסות ריבית ${money(s.assetInterest0)}, הפקדות ${money(q.assets0.contrib)}, יתרת סגירה ${money(q.assets0.closing)}. נתוני המחויבות לא מוצגים.`,
      `ב-${am} תוקנה התוכנית: כל עובד שאינו על סעיף 14 יקבל שכר אחרון × שנות ותק, ועוד ${pc(q.add)}, כולל על השנים שכבר עבד. השווי ההוגן של נכסי התכנית באותו יום: ${money(q.assets1.atAmend)} ₪.`,
      `ב-31.12.${y2} הופקדו לקרן ${money(q.assets1.contrib)} ₪, ושווייה ההוגן בסוף ${y2}: ${money(q.assets1.closing)} ₪.`,
      "הוצאות והכנסות מימון של תוכנית הטבה מוגדרת מוצגות בנפרד מהוצאות השכר. עלות השירות השוטף והריבית מחושבות לפי הריבית בתחילת כל תקופה; יום תיקון פותח תקופה חדשה. ריבית לחלק משנה מחושבת בריבית אפקטיבית.",
    ],
    tables: [
      {
        title: "שיעורי תשואה",
        head: ["", `31.12.${y1 - 1}`, `31.12.${y1}`, am, `31.12.${y2}`],
        rows: [
          ["אג״ח קונצרניות איכותיות", "?", pc(q.r1), pc(q.rAm), pc(q.r2)],
          ["אג״ח ממשלתיות", pc(q.gov[0]), pc(q.gov[1]), pc(q.gov[2]), pc(q.gov[2])],
        ],
      },
    ],
    required: [
      `התנועה במחויבות ובנכסי התכנית לשנת ${y1}, וההשפעה על רווח והפסד ועל הרווח הכולל האחר של שתי התוכניות.`,
      `התנועה במחויבות ובנכסי התכנית לשנת ${y2}, וההשפעה על הוצאות השכר, המימון נטו וה-OCI. מהי ההתחייבות נטו ב-31.12.${y2}?`,
    ],
    checks: [
      { label: "עובדים על סעיף 14", value: q.dcHeads },
      { label: `מחויבות 31.12.${y1}`, value: s.o0.closing },
      { label: `עלות שירות עבר ${y2}`, value: s.o1.past },
      { label: `התחייבות נטו 31.12.${y2}`, value: s.pl1.net },
    ],
    steps: [
      {
        title: "מה מחלצים מהביאור",
        tables: [
          {
            head: ["נעלם", "איך", "חישוב", "תוצאה"],
            rows: [
              ["עובדים על סעיף 14", `הפקדות השנה ÷ (12 × שכר ${y1} × ${pc(q.dcRate)})`, `${money(s.dcDeposit0)} ÷ (12 × ${d2(s.sal(y1))} × ${pc(q.dcRate)})`, `${d2(s.dcRecovered)} → ${q.dcHeads}`],
              ["עובדים בהטבה מוגדרת", "כל העובדים פחות סעיף 14", `${q.heads} − ${q.dcHeads}`, String(s.H)],
              [`ריבית 31.12.${y1 - 1}`, "הכנסות ריבית ÷ נכסים בפתיחה (ההפקדה ב-31.12)", `${money(s.assetInterest0)} ÷ ${money(q.assets0.opening)}`, pc(s.rRecovered)],
              ["שכר בפרישה", `${s.T} שנות עבודה, ${s.T - 1} העלאות`, fin, d2(s.final)],
            ],
          },
        ],
        text: [`שכר ${y1}: ${money(q.salary)} × ${b(q.raise)}^${y1 - q.founded} = ${d2(s.sal(y1))}. האג״ח הממשלתיות הן **נתון סרק** (סעיף 83).`],
      },
      pvTable(`מחויבות 31.12.${y1 - 1}`, [{ label: "הטבה מוגדרת", heads: s.H, amount: s.final, part: String(s.s0), n: s.T - s.s0, value: s.o0.opening }], {
        ...pvM,
        rate: q.rOpen,
        why: `ההטבה היא שכר אחרון × שנות ותק, ולכן החלק שנצבר הוא השנים שעברו (${s.s0}). הריבית היא זו שחולצה מהביאור, ${pc(s.rRecovered)}.`,
      }),
      pvTable(`עלות שירות שוטף ${y1}`, [{ label: "הטבה מוגדרת", heads: s.H, amount: s.final, part: "1", n: s.T - s.s0 - 1, value: s.o0.service }], { ...pvM, rate: q.rOpen, why: "שנה אחת שנוספה, מהוונת מסוף השנה לפי ריבית תחילת השנה." }),
      pvTable(`מחויבות 31.12.${y1}`, [{ label: "הטבה מוגדרת", heads: s.H, amount: s.final, part: String(s.s0 + 1), n: s.T - s.s0 - 1, value: s.o0.closing }], { ...pvM, rate: q.r1 }),
      {
        title: `${y1}: המחויבות והנכסים`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y1 - 1}`, "", money(s.o0.opening)],
              ["ריבית", `${money(s.o0.opening)} × ${pc(q.rOpen)}`, money(s.o0.interest)],
              ["שירות שוטף", "", money(s.o0.service)],
              ["מדידה מחדש (OCI), מאזנת", `${money(s.o0.closing)} − ${money(s.o0.opening)} − ${money(s.o0.interest)} − ${money(s.o0.service)}`, money(s.o0.pn)],
              [`סגירה 31.12.${y1}`, "", money(s.o0.closing)],
            ],
          },
        ],
        rolls: [
          R(
            `נכסי התכנית, ${y1}`,
            [
              { label: "יתרת פתיחה", value: s.a0.opening, kind: "balance" },
              { label: "הכנסות ריבית", value: s.a0.interest },
              { label: "הפקדות", value: s.a0.contrib },
              { label: "מדידה מחדש", value: s.a0.pn, kind: "pn" },
              { label: "יתרת סגירה", value: s.a0.closing, kind: "balance" },
            ],
            { side: "debit" },
          ),
        ],
      },
      {
        title: `${y1}: ההשפעה על הדוחות`,
        tables: [
          {
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר: הפקדה מוגדרת", "ההפקדות של השנה", money(s.pl0.dc)],
              ["הוצאות שכר: שירות שוטף", "", money(s.pl0.service)],
              ["מימון נטו", `${money(s.o0.interest)} − ${money(s.a0.interest)}`, money(s.pl0.netInterest)],
              ["OCI", `${gain(s.o0.pn)} על המחויבות, ${gain(-s.a0.pn)} על הנכסים`, gain(s.pl0.oci)],
              [`התחייבות נטו 31.12.${y1}`, `${money(s.o0.closing)} − ${money(s.a0.closing)}`, money(s.pl0.net)],
            ],
          },
        ],
      },
      pvTable(`עלות שירות שוטף ${y2}`, [
        { label: `עד ${am}`, heads: s.H, amount: s.final, part: `${mo}/12`, n: n1 - mo / 12, rate: q.r1, value: s.o1.sv1 },
        { label: `מ-${am}`, heads: s.H, amount: finalNew, part: `${12 - mo}/12`, n: n1 - 1, rate: q.rAm, value: s.o1.sv2 },
      ], {
        ...pvM,
        label: "תקופה",
        rate: q.r1,
        why: `עד ${am}: ${mo} חודשים בתנאים הישנים ובריבית ${pc(q.r1)}. מיום התיקון: התנאים החדשים (השכר בפרישה × ${nf(1 + q.add, 3)}) והריבית של יום התיקון, ${pc(q.rAm)}.`,
      }),
      pvTable(`ביום התיקון, ${am}`, [
        { label: "לפני התיקון", heads: s.H, amount: s.final, part: yp(s.s0 + 1, mo), n: n1 - mo / 12, value: s.o1.before },
        { label: "אחרי התיקון", heads: s.H, amount: finalNew, part: yp(s.s0 + 1, mo), n: n1 - mo / 12, value: s.o1.after },
      ], {
        ...pvM,
        label: "מדידה",
        rate: q.rAm,
        total: false,
        why: `ביום התיקון **מודדים מחדש** לפי ${pc(q.rAm)} (סעיף 99), ואז מוסיפים את השיפור כשירות עבר. אחרי התיקון כל עובד מקבל ${pc(q.add)} יותר, גם על השנים שכבר עבד.`,
      }),
      {
        title: `${y2}: עד התיקון, והתיקון`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 1.1.${y2}`, "", money(s.o1.opening)],
              [`ריבית ${mo} חודשים`, `${money(s.o1.opening)} × (${b(q.r1)}^(${mo}/12) − 1)`, money(s.o1.i1)],
              [`שירות ${mo} חודשים`, "", money(s.o1.sv1)],
              ["מדידה מחדש ביום התיקון (OCI), מאזנת", `${money(s.o1.before)} − ${money(s.o1.opening)} − ${money(s.o1.i1)} − ${money(s.o1.sv1)}`, money(s.o1.pnAm)],
              [`לפני התיקון, ${am}`, "", money(s.o1.before)],
              ["שירות עבר", `${money(s.o1.after)} − ${money(s.o1.before)}`, money(s.o1.past)],
              ["אחרי התיקון", "", money(s.o1.after)],
            ],
          },
        ],
      },
      pvTable(`מחויבות 31.12.${y2}`, [{ label: "הטבה מוגדרת", heads: s.H, amount: finalNew, part: String(s.s0 + 2), n: n1 - 1, value: s.o1.closing }], { ...pvM, rate: q.r2 }),
      {
        title: `${y2}: מהתיקון עד סוף השנה`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`ריבית ${12 - mo} חודשים`, `${money(s.o1.after)} × (${b(q.rAm)}^(${12 - mo}/12) − 1)`, money(s.o1.i2)],
              [`שירות ${12 - mo} חודשים`, "", money(s.o1.sv2)],
              ["מדידה מחדש בסוף השנה (OCI), מאזנת", `${money(s.o1.closing)} − ${money(s.o1.after)} − ${money(s.o1.i2)} − ${money(s.o1.sv2)}`, money(s.o1.pnEnd)],
              [`סגירה 31.12.${y2}`, "", money(s.o1.closing)],
            ],
          },
        ],
        rolls: [
          R(`מחויבות, ${y2}`, [
            { label: "יתרת פתיחה", value: s.o1.opening, kind: "balance" },
            { label: "עלות ריבית", value: s.o1.interest },
            { label: "עלות שירות שוטף", value: s.o1.service },
            { label: "עלות שירות עבר", value: s.o1.past },
            { label: "מדידה מחדש", value: s.o1.pn, kind: "pn" },
            { label: "יתרת סגירה", value: s.o1.closing, kind: "balance" },
          ]),
        ],
      },
      {
        title: `${y2}: הנכסים, והדוחות`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`ריבית עד ${am}`, `${money(s.a1.opening)} × (${b(q.r1)}^(${mo}/12) − 1)`, money(s.a1.ai1)],
              [`מדידה מחדש ב-${am}`, `${money(q.assets1.atAmend)} − ${money(s.a1.opening)} − ${money(s.a1.ai1)}`, money(s.a1.apn1)],
              ["ריבית מהתיקון", `${money(q.assets1.atAmend)} × (${b(q.rAm)}^(${12 - mo}/12) − 1)`, money(s.a1.ai2)],
              ["מדידה מחדש בסוף השנה", `${money(q.assets1.closing)} − ${money(q.assets1.atAmend)} − ${money(s.a1.ai2)} − ${money(q.assets1.contrib)}`, money(s.a1.apn2)],
            ],
          },
          {
            title: `ההשפעה על הדוחות ${y2}`,
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר: הפקדה מוגדרת", `${q.dcHeads} × 12 × ${d2(s.sal(y2))} × ${pc(q.dcRate)}`, money(s.dcExpense1)],
              ["הוצאות שכר: שירות שוטף + עבר", `${money(s.o1.service)} + ${money(s.o1.past)}`, money(s.pl1.salary)],
              ["מימון נטו", `${money(s.o1.interest)} − ${money(s.a1.interest)}`, money(s.pl1.netInterest)],
              ["OCI", `${gain(s.o1.pn)} על המחויבות, ${gain(-s.a1.pn)} על הנכסים`, gain(s.pl1.oci)],
              [`התחייבות נטו 31.12.${y2}`, `${money(s.o1.closing)} − ${money(q.assets1.closing)}`, money(s.pl1.net)],
            ],
          },
        ],
        rolls: [
          R(
            `נכסי התכנית, ${y2}`,
            [
              { label: "יתרת פתיחה", value: s.a1.opening, kind: "balance" },
              { label: "הכנסות ריבית", value: s.a1.interest },
              { label: "הפקדות", value: s.a1.contrib },
              { label: "מדידה מחדש", value: s.a1.pn, kind: "pn" },
              { label: "יתרת סגירה", value: s.a1.closing, kind: "balance" },
            ],
            { side: "debit" },
          ),
        ],
      },
    ],
  };
}

// ===========================================================================
// 3. Three short-term benefits: a 13th salary by practice, vacation on FIFO with half paid to leavers, and choice days at part pay.

export type ShortExamInput = {
  company: string;
  year: number;
  workDays: number;
  /** Monthly salary in the year before the one asked about; it rises on every 1.1. */
  salary: number;
  raise: number;
  vacation: number;
  payout: number;
  choice: { max: number; pay: number; used: number };
  start: { staff: number; balance: number; leavers: number; use: number };
  actual: { leavers: number; used: number };
  end: { staff: number; leavers: number; use: number };
};

export function solveShortExam(q: ShortExamInput) {
  const sal = [q.salary, q.salary * (1 + q.raise), q.salary * (1 + q.raise) ** 2];
  const day = sal.map((x) => x / q.workDays);
  const S = q.start;
  const E = q.end;
  // 13th salary: a full month for the year just ended, to whoever is still employed in April, at the salary in force then.
  const t = { opening: (S.staff - S.leavers) * sal[1], paid: (S.staff - q.actual.leavers) * sal[1], closing: (E.staff - E.leavers) * sal[2], expense: 0 };
  t.expense = t.closing - t.opening + t.paid;
  // Vacation.
  const stay0 = S.staff - q.actual.leavers;
  const carried = stay0 * S.balance;
  const accrued = stay0 * q.vacation;
  const left = carried + accrued - q.actual.used;
  const balance1 = left / stay0;
  const lapsed = Math.max(0, carried - q.actual.used);
  const v = {
    openLeavers: S.leavers * S.balance * q.payout * day[0],
    openStayers: (S.staff - S.leavers) * S.balance * S.use * day[1],
    payLeavers: q.actual.leavers * S.balance * q.payout * day[0],
    payUsed: q.actual.used * day[1],
    closeLeavers: E.leavers * balance1 * q.payout * day[1],
    closeStayers: (E.staff - E.leavers) * balance1 * E.use * day[2],
    opening: 0,
    paid: 0,
    closing: 0,
    expense: 0,
  };
  v.opening = v.openLeavers + v.openStayers;
  v.paid = v.payLeavers + v.payUsed;
  v.closing = v.closeLeavers + v.closeStayers;
  v.expense = v.closing - v.opening + v.paid;
  const choice = q.choice.used * day[1] * q.choice.pay;
  return { sal, day, t, stay0, carried, accrued, left, balance1, lapsed, v, choice, total: t.expense + v.expense + choice };
}

export function shortExamQuestion(id: string, title: string, q: ShortExamInput): BkQuestion {
  const s = solveShortExam(q);
  const y = q.year;
  const S = q.start;
  const E = q.end;
  return {
    id,
    title,
    point: "כל הטבה לזמן קצר נמדדת **בסכום שצפוי להיות משולם**: משכורת 13 לשנה שלמה, פחות מי שיעזוב לפני התשלום; פדיון חופשה רק בשיעור שהעוזב מקבל בפועל; ויום בחירה בשיעור השכר שמשולם עליו.",
    facts: [
      `חברת ״${q.company}״. כל הסכומים בשאלה הם עלות השכר בלבד, בלי תוספות.`,
      `השכר החודשי הממוצע לעובד בשנת ${y - 1}: ${money(q.salary)} ₪. השכר עולה ב-${pc(q.raise)} בכל 1.1. בחודש ${q.workDays} ימי עבודה.`,
      `משכורת 13: מאז 2019 החברה משלמת בכל 10 באפריל משכורת נוספת בגין השנה הקודמת, בגובה השכר החודשי שבתוקף ביום התשלום. זה לא כתוב בהסכמים, אבל החברה מעולם לא דילגה עליה. עובד שעוזב לפני 10 באפריל לא מקבל.`,
      `חופשה: ${q.vacation} ימים בשנה. יתרה שלא נוצלה אפשר לנצל עד סוף השנה העוקבת, ואז היא פוקעת. הניצול ב-FIFO: קודם מהיתרה של השנה הקודמת.`,
      `עובד שעוזב, מכל סיבה, מקבל במזומן ${pc(q.payout)} משווי הימים שלא ניצל, לפי השכר של השנה שהסתיימה.`,
      `ימי בחירה: עד ${q.choice.max} ימים בשנה, שבהם העובד לא עובד ומקבל ${pc(q.choice.pay)} משכרו. ימים שלא נוצלו פוקעים בסוף השנה. בשנת ${y} נוצלו ${q.choice.used} ימי בחירה.`,
      `העזיבות הצפויות (בטבלה) הן ביום 1.1 של השנה הבאה. ב-1.1.${y} עזבו בפועל ${q.actual.leavers} עובדים, ולא היו עזיבות אחרות. לכל העובדים אותה יתרת ימים.`,
      `הנחת מדידה: כל הטבה נמדדת לפי השכר שיהיה בתוקף כשהיא תשולם או תנוצל, מלבד פדיון לעוזבים, שנמדד לפי השכר של השנה שהסתיימה.`,
      `ההוצאה של כל הטבה כוללת גם את השכר ששולם בגינה בשנה (למשל שכר ימי החופשה שנוצלו), כלומר: סגירה − פתיחה + תשלומים.`,
    ],
    tables: [
      {
        title: "נתונים",
        head: ["", `31.12.${y - 1}`, `31.12.${y}`],
        rows: [
          ["עובדים", S.staff, E.staff],
          ["יתרת ימי חופשה לעובד", S.balance, "?"],
          ["עוזבים צפויים ב-1.1 הבא", S.leavers, E.leavers],
          ["שיעור היתרה שהנשארים צפויים לנצל", pc(S.use), pc(E.use)],
          [`ימי חופשה שנוצלו בשנת ${y} (בידי מי שלא עזב)`, "", money(q.actual.used)],
        ],
      },
    ],
    required: [`ההשפעה של משכורת 13, דמי החופשה וימי הבחירה על רווח והפסד לשנת ${y}, לכל הטבה בנפרד, והיתרות ב-31.12.${y}. נמקו את הטיפול בכל הטבה.`],
    checks: [
      { label: "משכורת 13: הוצאה", value: s.t.expense },
      { label: "חופשה: הוצאה", value: s.v.expense },
      { label: "ימי בחירה: הוצאה", value: s.choice },
      { label: `חופשה: התחייבות 31.12.${y}`, value: s.v.closing },
    ],
    steps: [
      {
        title: "סיווג ושכר",
        tables: [
          {
            head: ["הטבה", "סיווג", "מה רושמים"],
            rows: [
              ["משכורת 13", "זמן קצר. מחויבות משתמעת מהנוהג (סעיף 19)", "התחייבות לשנה שלמה, למי שצפוי להישאר עד אפריל"],
              ["חופשה", "היעדרות נצברת, מבשילה חלקית", "הפרשה לפי הצפי: הנשארים לפי הניצול, העוזבים לפי הפדיון"],
              ["ימי בחירה", "היעדרות לא נצברת (סעיף 13)", "הוצאה כשהן קורות, בשיעור התשלום"],
            ],
          },
          {
            head: ["שנה", "שכר חודשי", "שכר יומי"],
            rows: s.sal.map((x, k) => [String(y - 1 + k), d2(x), d2(s.day[k])]),
          },
        ],
      },
      {
        title: "משכורת 13",
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, `(${S.staff} − ${S.leavers}) × ${d2(s.sal[1])}`, money(s.t.opening)],
              [`תשלום 10.4.${y}`, `(${S.staff} − ${q.actual.leavers}) × ${d2(s.sal[1])}`, money(s.t.paid)],
              [`סגירה 31.12.${y}`, `(${E.staff} − ${E.leavers}) × ${d2(s.sal[2])}`, money(s.t.closing)],
              ["הוצאה (השורה החסרה)", `${money(s.t.closing)} − ${money(s.t.opening)} + ${money(s.t.paid)}`, money(s.t.expense)],
            ],
          },
        ],
        text: ["משכורת 13 היא בגין השנה כולה, ולכן בסוף השנה היא צבורה במלואה. מי שעוזב ב-1.1 מוצא מהחישוב, אבל **לא מקצרים** את תקופת הצבירה."],
      },
      {
        title: `חופשה: יתרת פתיחה 31.12.${y - 1}, לפי הצפי`,
        text: [`ב-FIFO מנצלים קודם את היתרה, ולכן הצפי ניתן כשיעור מהיתרה. עוזב מקבל ${pc(q.payout)} מהיתרה, לפי שכר ${y - 1}; הנשארים ינצלו את הימים ב-${y}, לפי שכר ${y}.`],
        tables: [
          {
            head: ["קבוצה", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [
              ["עוזבים ב-1.1", S.leavers, S.balance, "עוזב", q.vacation, `פדיון: ${S.balance} × ${pc(q.payout)} = ${d2(S.balance * q.payout)}`, `${S.leavers} × ${d2(S.balance * q.payout)} = ${d2(S.leavers * S.balance * q.payout)}`, d2(s.day[0]), money(s.v.openLeavers)],
              ["נשארים", S.staff - S.leavers, S.balance, `${pc(S.use)} מהיתרה`, q.vacation, `${S.balance} × ${pc(S.use)} = ${d2(S.balance * S.use)}`, `${S.staff - S.leavers} × ${d2(S.balance * S.use)} = ${d2((S.staff - S.leavers) * S.balance * S.use)}`, d2(s.day[1]), money(s.v.openStayers)],
            ],
            foot: ["סה״כ", S.staff, "", "", "", "", "", "", money(s.v.opening)],
          },
        ],
      },
      {
        title: `חופשה: תשלומים ${y}, לפי מה שקרה`,
        text: [s.lapsed > 0 ? `ב-FIFO היתרה הישנה מנוצלת ראשונה. ${money(s.lapsed)} ימים ממנה לא נוצלו ופקעו.` : "ב-FIFO היתרה הישנה נוצלה כולה, ולא פקע דבר. כל היתרה לשנה הבאה היא מזכאות השנה."],
        tables: [
          {
            head: ["קבוצה", "עובדים", "יתרה שנה קודמת", "ימי חופש בשנה", "ניצול בפועל", "יתרה לשנה הבאה", "פדיון", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [
              ["עזבו ב-1.1", q.actual.leavers, S.balance, "—", 0, "עזב: 0", `${S.balance} × ${pc(q.payout)} = ${d2(S.balance * q.payout)}`, `${q.actual.leavers} × ${d2(S.balance * q.payout)} = ${d2(q.actual.leavers * S.balance * q.payout)}`, d2(s.day[0]), money(s.v.payLeavers)],
              [
                "נשארו",
                s.stay0,
                S.balance,
                q.vacation,
                `${money(q.actual.used)} ÷ ${s.stay0} = ${d2(q.actual.used / s.stay0)}`,
                `${S.balance} + ${q.vacation} − ${d2(q.actual.used / s.stay0)} = ${d2(s.balance1)}`,
                0,
                `${s.stay0} × ${d2(q.actual.used / s.stay0)} = ${money(q.actual.used)}`,
                d2(s.day[1]),
                money(s.v.payUsed),
              ],
            ],
            foot: ["סה״כ", S.staff, "", "", "", "", "", "", "", money(s.v.paid)],
          },
        ],
      },
      {
        title: `חופשה: יתרת סגירה 31.12.${y}`,
        text: [`היתרה משנה שעברה היא העמודה ״יתרה לשנה הבאה״ מטבלת התשלומים. העוזבים נמדדים לפי שכר ${y}, והנשארים לפי שכר ${y + 1}, שבה ינצלו.`],
        tables: [
          {
            head: ["קבוצה", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [
              ["עוזבים ב-1.1", E.leavers, d2(s.balance1), "עוזב", q.vacation, `פדיון: ${d2(s.balance1)} × ${pc(q.payout)} = ${d2(s.balance1 * q.payout)}`, `${E.leavers} × ${d2(s.balance1 * q.payout)} = ${d2(E.leavers * s.balance1 * q.payout)}`, d2(s.day[1]), money(s.v.closeLeavers)],
              ["נשארים", E.staff - E.leavers, d2(s.balance1), `${pc(E.use)} מהיתרה`, q.vacation, `${d2(s.balance1)} × ${pc(E.use)} = ${d2(s.balance1 * E.use)}`, `${E.staff - E.leavers} × ${d2(s.balance1 * E.use)} = ${d2((E.staff - E.leavers) * s.balance1 * E.use)}`, d2(s.day[2]), money(s.v.closeStayers)],
            ],
            foot: ["סה״כ", E.staff, "", "", "", "", "", "", money(s.v.closing)],
          },
        ],
      },
      {
        title: "חופשה: התנועה",
        tables: [
          {
            title: "טבלת התנועה",
            head: ["שורה", "משכורת 13", "חופשה"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, money(s.t.opening), money(s.v.opening)],
              ["הוצאה (השורה החסרה)", money(s.t.expense), money(s.v.expense)],
              ["תשלומים", `(${money(s.t.paid)})`, `(${money(s.v.paid)})`],
            ],
            foot: [`סגירה 31.12.${y}`, money(s.t.closing), money(s.v.closing)],
          },
        ],
      },
      {
        title: "ימי בחירה, וסיכום",
        tables: [
          {
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["ימי בחירה", `${q.choice.used} × ${d2(s.day[1])} × ${pc(q.choice.pay)}`, money(s.choice)],
              ["משכורת 13", "", money(s.t.expense)],
              ["חופשה", "", money(s.v.expense)],
            ],
            foot: ["סה״כ הוצאות שכר", "", money(s.total)],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// 4. Three agreements: a front-loaded long-term grant reduced by amendment (with compensation), termination benefits with a stay-on bonus, and section 14.

export type ThreeAgreeInput = {
  company: string;
  /** The grant's first year; the question asks about the year after. */
  start: number;
  grant: { heads: number; amount: number; units: number[]; r0: number; r1: number; newAmount: number; comp: number };
  term: { decided: { day: number; month: number }; closes: { day: number; month: number }; staff: number; base: number; stay: number; leaveNow: number; stayLeave: number };
  dc: { staff: number; hired: number; salary: number; raise: number; rate: number };
};

export function solveThreeAgree(q: ThreeAgreeInput) {
  const G = q.grant;
  const Y = G.units.length;
  const cum = (k: number) => sum(G.units.slice(0, k));
  const opening = (G.heads * cum(1)) / (1 + G.r0) ** (Y - 1);
  const interest = opening * G.r0;
  const service = (G.heads * G.units[1]) / (1 + G.r0) ** (Y - 2);
  const before = (G.heads * cum(2)) / (1 + G.r1) ** (Y - 2);
  const pn = before - opening - interest - service;
  const after = (G.heads * ((G.newAmount * 2) / Y)) / (1 + G.r1) ** (Y - 2);
  const past = after - before;
  const comp = G.heads * G.comp;
  const T = q.term;
  // From the decision to the closing, in months (the decision at a month's end).
  const months = (T.closes.month - T.decided.month + 12) % 12 || 12;
  const stayers = T.staff - T.leaveNow - T.stayLeave;
  const provision = T.staff * T.base;
  const stayAccrued = (stayers * (T.stay - T.base) * 1) / months;
  const D = q.dc;
  const dcExpense = D.staff * D.salary * (1 + D.raise) ** (q.start + 1 - D.hired);
  return {
    Y,
    cum,
    a: { opening, interest, service, before, pn, after, past, comp, total: interest + service + pn + past + comp },
    months,
    stayers,
    provision,
    stayAccrued,
    dcExpense,
  };
}

export function threeAgreeQuestion(id: string, title: string, q: ThreeAgreeInput): BkQuestion {
  const s = solveThreeAgree(q);
  const G = q.grant;
  const T = q.term;
  const D = q.dc;
  const y0 = q.start;
  const y1 = y0 + 1;
  const decided = `${T.decided.day}.${T.decided.month}.${y0}`;
  const closes = `${T.closes.day}.${T.closes.month}.${y1}`;
  const endY = y0 + s.Y - 1;
  return {
    id,
    title,
    point: "תיקון שמקטין הטבה בתוכנית שממשיכה הוא עלות שירות עבר שלילית, **ולא סילוק**. בהטבת פיטורין מכירים רק במה שההחלטה נותנת לכולם; התוספת למי שממשיך לעבוד היא שכר על שירות עתידי, ונצברת על פני השירות.",
    facts: [
      `חברת ״${q.company}״. שלושה הסכמים.`,
      `הסכם א׳: ב-1.1.${y0} הודיעה החברה לכל אחד מ-${G.heads} עובדי ההנהלה שיקבל ${money(G.amount)} ₪ ב-31.12.${endY}, אם יעבוד עד אז. לפי התוכנית, הזכאות נצברת בכל שנה בסכום שבטבלה 1. בשום מועד לא צפויות עזיבות.`,
      `ב-31.12.${y1} הוסכם עם עובדי ההנהלה שהמענק יקטן ל-${money(G.newAmount)} ₪, ויצבר בקו ישר על פני ${y0}–${endY}, רטרואקטיבית. בתמורה שילמה החברה באותו יום ${money(G.comp)} ₪ לכל עובד. התוכנית ממשיכה: המענק המעודכן ישולם ב-31.12.${endY}. שיעור ההיוון: ${pc(G.r0)} ב-31.12.${y0} ו-${pc(G.r1)} ב-31.12.${y1}.`,
      `הסכם ב׳: ב-${decided} החליטה החברה לסגור את המפעל ב-${closes}, אישרה תוכנית מפורטת ומסרה הודעה לכל המושפעים. באותו יום קיבלו כל ${T.staff} עובדי המפעל הודעת פיטורין, וכל אחד יקבל ${money(T.base)} ₪ ביום הסגירה. עובד שימשיך לעבוד עד יום הסגירה יקבל ${money(T.stay)} ₪ במקום ${money(T.base)} ₪. עובד שבחר להמשיך ועזב לפני כן, מקבל ${money(T.base)} ₪ בלבד.`,
      `עד 31.12.${y0}: ${T.leaveNow} עובדים בחרו לעזוב מיד (ועזבו), והשאר בחרו להמשיך. החברה צופה ש-${T.stayLeave} מהממשיכים יעזבו לפני יום הסגירה. התוספת למי שממשיך נצברת בשווה לפי חודשים, מיום ההחלטה ועד יום הסגירה.`,
      `הסכם ג׳: ${D.staff} עובדים מ-1.1.${D.hired}, עם סעיף 14. ההפקדה בסוף כל שנה, בגובה השכר החודשי של אותה שנה. השכר ההתחלתי ${money(D.salary)} ₪, והוא עולה ב-${pc(D.raise)} בכל ינואר מ-${D.hired + 1}. שיעור ההיוון להתחייבויות דומות: ${pc(D.rate)}.`,
    ],
    tables: [{ title: "טבלה 1: הזכאות השנתית בהסכם א׳ (לעובד)", head: ["שנה", "זכאות (₪)"], rows: G.units.map((u, k) => [String(y0 + k), money(u)]) }],
    required: [
      `הסכם א׳: ההשפעה על רווח והפסד לשנת ${y1}, לפי סעיפים.`,
      `הסכם ב׳: הסיווג, וההתחייבויות שיוצגו ב-31.12.${y0}.`,
      `הסכם ג׳: ההשפעה על הרווח הכולל לשנת ${y1}.`,
    ],
    checks: [
      { label: `א׳: התחייבות לפני התיקון 31.12.${y1}`, value: s.a.before },
      { label: "א׳: עלות שירות עבר (שלילית)", value: Math.abs(s.a.past) },
      { label: `ב׳: הפרשה לפיטורין 31.12.${y0}`, value: s.provision },
      { label: `ג׳: הוצאה ${y1}`, value: s.dcExpense },
    ],
    steps: [
      {
        title: "הסכם א׳: סיווג ושיטה",
        text: [
          "המענק משולם בזמן העבודה, יותר מ-12 חודשים אחרי סוף השנה שבה נצבר: **הטבה אחרת לזמן ארוך**. מודדים כמו הטבה מוגדרת, אבל המדידה מחדש הולכת לרווח והפסד (סעיף 156).",
          "הזכאות הולכת וקטנה, ולכן מייחסים **לפי נוסחת התוכנית**, לא בקו ישר (סעיף 73).",
        ],
      },
      pvTable(`הסכם א׳: יתרת פתיחה 31.12.${y0}`, [{ label: "הנהלה", heads: G.heads, amount: s.cum(1), n: s.Y - 1, value: s.a.opening }], {
        rate: G.r0,
        amount: "זכאות לעובד",
        why: `לפי נוסחת התוכנית נצברו בשנה הראשונה ${money(s.cum(1))} ₪ לעובד.`,
      }),
      pvTable(`הסכם א׳: עלות שירות שוטף ${y1}`, [{ label: "הנהלה", heads: G.heads, amount: G.units[1], n: s.Y - 2, value: s.a.service }], {
        rate: G.r0,
        amount: "זכאות לעובד",
        why: `הזכאות שנוספה ב-${y1} לפי טבלה 1, מהוונת מסוף השנה לפי ריבית תחילת השנה.`,
      }),
      pvTable(`הסכם א׳: ביום התיקון, 31.12.${y1}`, [
        { label: "לפני התיקון", heads: G.heads, amount: s.cum(2), n: s.Y - 2, value: s.a.before },
        { label: "אחרי התיקון", heads: G.heads, amount: G.newAmount, part: `2/${s.Y}`, n: s.Y - 2, value: s.a.after },
      ], {
        rate: G.r1,
        label: "מדידה",
        amount: "זכאות לעובד",
        total: false,
        why: `לפני התיקון: מה שנצבר בשנתיים לפי נוסחת התוכנית (${money(s.cum(2))} ₪). אחרי התיקון: המענק החדש בקו ישר, שנתיים מתוך ${s.Y}.`,
      }),
      {
        title: `הסכם א׳: ${y1}`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y0}`, "", money(s.a.opening)],
              ["ריבית", `${money(s.a.opening)} × ${pc(G.r0)}`, money(s.a.interest)],
              ["שירות שוטף", "", money(s.a.service)],
              ["מדידה מחדש (רווח והפסד), מאזנת", `${money(s.a.before)} − ${money(s.a.opening)} − ${money(s.a.interest)} − ${money(s.a.service)}`, money(s.a.pn)],
              ["לפני התיקון", "", money(s.a.before)],
              ["אחרי התיקון", "", money(s.a.after)],
              ["עלות שירות עבר (שלילית)", `${money(s.a.after)} − ${money(s.a.before)}`, money(s.a.past)],
              ["פיצוי ששולם", `${G.heads} × ${money(G.comp)}`, money(s.a.comp)],
            ],
          },
        ],
        rolls: [
          R(
            `הסכם א׳, ${y1}`,
            [
              { label: "יתרת פתיחה", value: s.a.opening, kind: "balance" },
              { label: "עלות ריבית", value: s.a.interest },
              { label: "עלות שירות שוטף", value: s.a.service },
              { label: "מדידה מחדש", value: s.a.pn, kind: "pn" },
              { label: "עלות שירות עבר", value: s.a.past },
              { label: "יתרת סגירה", value: s.a.after, kind: "balance" },
            ],
            { pnTo: "רווח והפסד" },
          ),
        ],
      },
      {
        title: `הסכם א׳: ההשפעה על רווח והפסד ${y1}`,
        tables: [
          {
            head: ["סעיף", "סכום"],
            rows: [
              ["הוצאות שכר: שירות שוטף", money(s.a.service)],
              ["הוצאות שכר: שירות עבר (הכנסה)", `(${money(-s.a.past)})`],
              ["הוצאות שכר: פיצוי ששולם", money(s.a.comp)],
              ["הוצאות מימון: ריבית", money(s.a.interest)],
              ["מדידה מחדש (רווח והפסד)", s.a.pn < 0 ? `(${money(-s.a.pn)})` : money(s.a.pn)],
            ],
            foot: ["סה״כ (הכנסה בסוגריים)", s.a.total < 0 ? `(${money(-s.a.total)})` : money(s.a.total)],
          },
        ],
        text: ["העובדים עדיין יקבלו מענק, והתוכנית ממשיכה. לכן ההקטנה היא תיקון (סעיף 103), והפיצוי הוא הוצאה בגין אותו תיקון. שניהם נרשמים מיד. מי שמסווג את זה כסילוק חלקי מגיע לאותו סכום ברווח והפסד."],
      },
      {
        title: "הסכם ב׳: פיטורין, ותוספת על שירות",
        tables: [
          {
            head: ["רכיב", "סיווג", "חישוב", "סכום"],
            rows: [
              ["המענק הבסיסי, לכל המפוטרים", "הטבת פיטורין: נולדה מההחלטה (סעיף 159)", `${T.staff} × ${money(T.base)}`, money(s.provision)],
              [
                "התוספת לממשיכים",
                "שכר על שירות עתידי (סעיף 162): זמן קצר, נצבר על פני השירות",
                `${s.stayers} × ${money(T.stay - T.base)} × 1/${s.months}`,
                money(s.stayAccrued),
              ],
            ],
          },
        ],
        text: [
          `כל ${T.staff} העובדים יקבלו את המענק הבסיסי **בכל מקרה**, ולכן כולו מוכר ביום ההחלטה. הוא ישולם תוך פחות מ-12 חודשים מסוף השנה, ולכן לא מהוונים (סעיף 169).`,
          `התוספת **רק למי שצפוי להמשיך** עד הסוף: ${T.staff} − ${T.leaveNow} − ${T.stayLeave} = ${s.stayers}. עד 31.12.${y0} עבר חודש אחד מתוך ${s.months}.`,
        ],
      },
      {
        title: "הסכם ג׳: הפקדה מוגדרת",
        tables: [
          {
            head: ["", "חישוב", "סכום"],
            rows: [[`הוצאות שכר ${y1}`, `${D.staff} × ${money(D.salary)} × ${b(D.raise)}^${y1 - D.hired}`, money(s.dcExpense)]],
          },
        ],
        text: ["ההוצאה היא ההפקדה של השנה, ואין יתרה כי ההפקדה בסוף השנה. שיעור ההיוון הוא **נתון סרק**."],
      },
    ],
  };
}

// ===========================================================================
// 5. Vacation measured at the salary it will be paid at, and a sales grant raised mid-year with one employee replaced.

export type SalesInput = {
  company: string;
  year: number;
  vac: { staff: number; entitlement: number; balance: number; expectNow: number; expectNext: number; used: number; salary: number; days: number; raise: number };
  grant: { heads: number; start: number; years: number; amount: number; newAmount: number; month: number; joinMonth: number; companyRate: number; r0: number; r1: number };
};

export function solveSales(q: SalesInput) {
  const V = q.vac;
  const day = [V.salary / V.days, (V.salary * (1 + V.raise)) / V.days, (V.salary * (1 + V.raise) ** 2) / V.days];
  const openDays = Math.min(V.balance, Math.max(0, V.expectNow - V.entitlement));
  const newBal = Math.max(0, V.entitlement - V.used);
  const closeDays = Math.min(newBal, Math.max(0, V.expectNext - V.entitlement));
  const vac = { opening: V.staff * openDays * day[1], paid: V.staff * V.used * day[1], closing: V.staff * closeDays * day[2], expense: 0 };
  vac.expense = vac.closing - vac.opening + vac.paid;
  const G = q.grant;
  const y = q.year;
  const per0 = G.amount / G.years;
  const per1 = G.newAmount / G.years;
  const served0 = y - G.start; // years served at 1.1 of the asked year
  const n0 = G.years - served0;
  const m = G.month / 12;
  const opening = (G.heads * per0 * served0) / (1 + G.r0) ** n0;
  const leaverShare = opening / G.heads;
  const stay = G.heads - 1;
  const i1 = (opening - leaverShare) * ((1 + G.r0) ** m - 1);
  const sv1 = (stay * per0 * m) / (1 + G.r0) ** (n0 - m);
  const atAmend = (stay * per0 * (served0 + m)) / (1 + G.r0) ** (n0 - m);
  const afterAmend = (stay * per1 * (served0 + m)) / (1 + G.r0) ** (n0 - m);
  const past = afterAmend - atAmend;
  const i2 = afterAmend * ((1 + G.r0) ** (1 - m) - 1);
  const sv2 = (stay * per1 * (1 - m)) / (1 + G.r0) ** (n0 - 1);
  const joinYears = (12 - G.joinMonth + 1) / 12; // joined on 1.joinMonth
  const nNew = G.years - joinYears;
  const svNew = (per1 * joinYears) / (1 + G.r0) ** nNew;
  const closeOld = (stay * per1 * (served0 + 1)) / (1 + G.r1) ** (n0 - 1);
  const closeNew = (per1 * joinYears) / (1 + G.r1) ** nNew;
  const closing = closeOld + closeNew;
  const interest = i1 + i2;
  const service = sv1 + sv2 + svNew;
  const pn = closing - opening - interest - service - past;
  return { day, openDays, newBal, closeDays, vac, per0, per1, served0, n0, opening, leaverShare, i1, sv1, atAmend, afterAmend, past, i2, sv2, joinYears, nNew, svNew, closeOld, closeNew, closing, interest, service, pn };
}

export function salesQuestion(id: string, title: string, q: SalesInput): BkQuestion {
  const s = solveSales(q);
  const V = q.vac;
  const G = q.grant;
  const y = q.year;
  const mo = G.month;
  const endGrant = G.start + G.years - 1;
  return {
    id,
    title,
    point: "עובד שעוזב לפני הזכאות מבטל את חלקו בהתחייבות, וזו מדידה מחדש. בהטבה אחרת לזמן ארוך גם המדידה מחדש וגם שירות העבר הולכים לרווח והפסד, ומהוונים לפי אג״ח קונצרניות, **לא לפי הריבית של החברה**.",
    facts: [
      `חברת ״${q.company}״ מעסיקה ${V.staff} עובדי תפעול (מחלקת המכירות נפרדת, ונתוני החופשה לא כוללים אותה). מעובדי התפעול לא עזבו ולא הצטרפו עובדים, ולא צפויות עזיבות.`,
      `חופשה: ${V.entitlement} ימים בשנה, ב-LIFO (קודם ימי השנה). יתרה אפשר לנצל עד סוף השנה העוקבת, ואז היא פוקעת. עובד שעוזב מקבל את כל היתרה בכסף.`,
      `ב-31.12.${y - 1} היתרה הממוצעת לעובד: ${V.balance} ימים, והחברה צפתה שכל עובד ינצל ב-${y} ‏${V.expectNow} ימים. בפועל נוצלו ב-${y} ‏${V.used} ימים לעובד. ב-31.12.${y} החברה צופה ניצול של ${V.expectNext} ימים לעובד ב-${y + 1}.`,
      `השכר החודשי הממוצע ב-${y - 1}: ${money(V.salary)} ₪, ${V.days} ימי עבודה בחודש. השכר עולה ב-${pc(V.raise)} בכל 1.1. ההפרשה נמדדת לפי השכר שיהיה בתוקף כשהימים ינוצלו. הוצאות החופשה כוללות את שכר הימים שנוצלו.`,
      `מענק למחלקת המכירות: ב-1.1.${G.start} הוסכם עם ${G.heads} עובדי המכירות שכל מי שישלים ${G.years} שנות עבודה (עד 31.12.${endGrant}) יקבל ${money(G.amount)} ₪.`,
      `ב-1.${mo + 1}.${y} הוגדל המענק ל-${money(G.newAmount)} ₪ למי שישלים את התקופה.`,
      `עובד אחד עזב ב-1.1.${y}, בלי לקבל דבר. ב-31.12.${y - 1} החברה לא צפתה את העזיבה. במקומו הצטרף ב-1.${G.joinMonth}.${y} עובד חדש, שיקבל ${money(G.newAmount)} ₪ אם ישלים ${G.years} שנות עבודה מיום הצטרפותו. בשום מועד החברה לא צופה עזיבות נוספות.`,
      `שיעור ההיוון הפנימי של החברה: ${pc(G.companyRate)}. תשואת אג״ח קונצרניות איכותיות: ${pc(G.r0)} עד 30.12.${y}, ו-${pc(G.r1)} ב-31.12.${y}. עלות השירות השוטף לפי ריבית תחילת התקופה. ריבית לחלק משנה בריבית אפקטיבית. הוצאות ריבית בגין הטבות לעובדים מוצגות במימון.`,
    ],
    tables: [],
    required: [`ההתחייבות לחופשה ב-31.12.${y} וההוצאה לשנת ${y}.`, `ההשפעה של המענק על רווח והפסד לשנת ${y}, בהפרדה בין שכר, מימון ומדידה מחדש.`],
    checks: [
      { label: `חופשה: התחייבות 31.12.${y}`, value: s.vac.closing },
      { label: "חופשה: הוצאה", value: s.vac.expense },
      { label: "מענק: עלות שירות עבר", value: s.past },
      { label: `מענק: התחייבות 31.12.${y}`, value: s.closing },
    ],
    steps: [
      {
        title: "חופשה",
        tables: [
          {
            title: `יתרת פתיחה 31.12.${y - 1}, לפי הצפי`,
            head: ["קבוצה", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [["עובדי התפעול", V.staff, V.balance, V.expectNow, V.entitlement, `MIN(${V.balance}, MAX(0, ${V.expectNow} − ${V.entitlement})) = ${s.openDays}`, `${V.staff} × ${s.openDays} = ${nf(V.staff * s.openDays, 2)}`, d2(s.day[1]), money(s.vac.opening)]],
          },
          {
            title: `תשלומים ${y}, לפי מה שקרה`,
            head: ["קבוצה", "עובדים", "יתרה שנה קודמת", "ימי חופש בשנה", "ניצול בפועל", "יתרה לשנה הבאה", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [["עובדי התפעול", V.staff, V.balance, V.entitlement, V.used, `MAX(0, ${V.entitlement} − ${V.used}) = ${s.newBal}`, `${V.staff} × ${V.used} = ${nf(V.staff * V.used, 2)}`, d2(s.day[1]), money(s.vac.paid)]],
          },
          {
            title: `יתרת סגירה 31.12.${y}`,
            head: ["קבוצה", "עובדים", "יתרה משנה שעברה", "צפי כללי", "ימי חופש בשנה", "צפי לניצול מיתרה קודמת", "סה״כ ימים", "עלות יום", "סכום"],
            rows: [["עובדי התפעול", V.staff, s.newBal, V.expectNext, V.entitlement, `MIN(${s.newBal}, MAX(0, ${V.expectNext} − ${V.entitlement})) = ${s.closeDays}`, `${V.staff} × ${s.closeDays} = ${nf(V.staff * s.closeDays, 2)}`, d2(s.day[2]), money(s.vac.closing)]],
          },
          {
            title: "התנועה",
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, "", money(s.vac.opening)],
              [`תשלומים ${y}`, "", money(s.vac.paid)],
              [`סגירה 31.12.${y}`, "", money(s.vac.closing)],
              ["הוצאה (השורה החסרה)", `${money(s.vac.closing)} − ${money(s.vac.opening)} + ${money(s.vac.paid)}`, money(s.vac.expense)],
            ],
          },
        ],
        text: [
          `שווי יום: ${y}: ${d2(s.day[1])}; ${y + 1}: ${d2(s.day[2])}. היתרה הישנה פקעה, ולכן היתרה משנה שעברה בסגירה היא רק מה שנשאר מזכאות ${y}.`,
        ],
      },
      {
        title: "המענק: סיווג וריבית",
        text: [
          "משולם בזמן העבודה, יותר מ-12 חודשים אחרי השנים שבהן נצבר: **הטבה אחרת לזמן ארוך**. נצבר בקו ישר על פני חמש השנים.",
          `מהוונים לפי אג״ח קונצרניות (סעיף 83): ${pc(G.r0)} במהלך השנה, ${pc(G.r1)} בסגירה. הריבית הפנימית (${pc(G.companyRate)}) היא **נתון סרק**.`,
        ],
      },
      pvTable(`המענק: יתרת פתיחה 31.12.${y - 1}`, [{ label: "עובדי המכירות", heads: G.heads, amount: s.per0, part: String(s.served0), n: s.n0, value: s.opening }], {
        rate: G.r0,
        amount: "מענק לשנה",
        why: `המענק נצבר בקו ישר: ${money(G.amount)} ÷ ${G.years} = ${money(s.per0)} ₪ לשנה, והחלק שנצבר הוא השנים שעברו.`,
      }),
      pvTable(`המענק: עלות שירות שוטף ${y}`, [
        { label: `ותיקים עד 1.${mo + 1}`, heads: G.heads - 1, amount: s.per0, part: `${mo}/12`, n: s.n0 - mo / 12, value: s.sv1 },
        { label: `ותיקים מ-1.${mo + 1}`, heads: G.heads - 1, amount: s.per1, part: `${12 - mo}/12`, n: s.n0 - 1, value: s.sv2 },
        { label: "העובד החדש", heads: 1, amount: s.per1, part: yp(0, 13 - G.joinMonth), n: s.nNew, value: s.svNew },
      ], {
        rate: G.r0,
        label: "תקופה",
        amount: "מענק לשנה",
        why: `העוזב יצא ב-1.1, ולכן נשארו ${G.heads - 1} ותיקים. מ-1.${mo + 1} המענק לשנה הוא ${money(G.newAmount)} ÷ ${G.years} = ${money(s.per1)} ₪. העובד החדש עבד ${13 - G.joinMonth} חודשים, ונשארו לו ${yrs(s.nNew)} שנים עד המענק.`,
      }),
      pvTable(`המענק: ביום ההגדלה, 1.${mo + 1}.${y}`, [
        { label: "לפני ההגדלה", heads: G.heads - 1, amount: s.per0, part: yp(s.served0, mo), n: s.n0 - mo / 12, value: s.atAmend },
        { label: "אחרי ההגדלה", heads: G.heads - 1, amount: s.per1, part: yp(s.served0, mo), n: s.n0 - mo / 12, value: s.afterAmend },
      ], { rate: G.r0, label: "מדידה", amount: "מענק לשנה", total: false, why: "ההגדלה חלה גם על השנים שכבר עברו, ולכן ההפרש בין שתי המדידות הוא עלות שירות עבר." }),
      pvTable(`המענק: יתרת סגירה 31.12.${y}`, [
        { label: "הוותיקים", heads: G.heads - 1, amount: s.per1, part: String(s.served0 + 1), n: s.n0 - 1, value: s.closeOld },
        { label: "העובד החדש", heads: 1, amount: s.per1, part: yp(0, 13 - G.joinMonth), n: s.nNew, value: s.closeNew },
      ], { rate: G.r1, amount: "מענק לשנה", why: `לפי הריבית בסוף השנה, ${pc(G.r1)}.` }),
      {
        title: `המענק: ${y}`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, "", money(s.opening)],
              ["העוזב ב-1.1: חלקו יוצא (מדידה מחדש)", `${money(s.opening)} ÷ ${G.heads}`, `(${money(s.leaverShare)})`],
              [`ריבית עד 1.${mo + 1}`, `${money(s.opening - s.leaverShare)} × (${b(G.r0)}^(${mo}/12) − 1)`, money(s.i1)],
              [`שירות עד 1.${mo + 1}`, "", money(s.sv1)],
              ["לפני ההגדלה", "", money(s.atAmend)],
              ["אחרי ההגדלה", "", money(s.afterAmend)],
              ["עלות שירות עבר", `${money(s.afterAmend)} − ${money(s.atAmend)}`, money(s.past)],
              [`ריבית מ-1.${mo + 1}`, `${money(s.afterAmend)} × (${b(G.r0)}^(${12 - mo}/12) − 1)`, money(s.i2)],
              [`שירות מ-1.${mo + 1}`, "", money(s.sv2)],
              ["שירות העובד החדש", "", money(s.svNew)],
              ["יתרת סגירה", "", money(s.closing)],
            ],
          },
        ],
        rolls: [
          R(
            `המענק, ${y}`,
            [
              { label: "יתרת פתיחה", value: s.opening, kind: "balance" },
              { label: "עלות ריבית", value: s.interest },
              { label: "עלות שירות שוטף", value: s.service },
              { label: "עלות שירות עבר", value: s.past },
              { label: "מדידה מחדש", value: s.pn, kind: "pn", note: "העוזב, וירידת הריבית" },
              { label: "יתרת סגירה", value: s.closing, kind: "balance" },
            ],
            { pnTo: "רווח והפסד" },
          ),
        ],
      },
      {
        title: "ההשפעה על רווח והפסד",
        tables: [
          {
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר", `שירות ${money(s.service)} + שירות עבר ${money(s.past)}`, money(s.service + s.past)],
              ["הוצאות מימון", "", money(s.interest)],
              ["מדידה מחדש", "העוזב, וירידת הריבית בסוף השנה", s.pn < 0 ? `(${money(-s.pn)}) רווח` : `${money(s.pn)} הפסד`],
            ],
            foot: ["סה״כ", "", money(s.service + s.past + s.interest + s.pn)],
          },
        ],
        text: [`בדיקה: סך ההשפעה שווה לגידול בהתחייבות, ${money(s.closing)} − ${money(s.opening)}, כי לא שולם דבר.`],
      },
    ],
  };
}

// ===========================================================================
// 6. Section 14 for one group, and a cliff-vested grant for another with a trust account that the ceiling caps — the asset side reported in full.

export type TrustInput = {
  company: string;
  year: number;
  dc: { staff: number; hired: number; salary: number; raise: number; leftEarlier: number };
  db: { staff: number; hired: number; grant: number; vestYears: number; stayYears: number; retiredBefore: number; retiredNow: number };
  deposit: { amount: number; month: number };
  fv: number;
  r0: number;
  r1: number;
  gov: [number, number];
};

export function solveTrust(q: TrustInput) {
  const y = q.year;
  const D = q.dc;
  const dcExpense = (D.staff - D.leftEarlier) * D.salary * (1 + D.raise) ** (y - D.hired);
  const B = q.db;
  const per = B.grant / B.vestYears;
  const s0 = y - B.hired;
  const n0 = B.stayYears - s0;
  const h0 = B.staff - B.retiredBefore;
  const h1 = h0 - B.retiredNow;
  const opening = (h0 * per * s0) / (1 + q.r0) ** n0;
  const interest = opening * q.r0;
  const service = (h0 * per) / (1 + q.r0) ** (n0 - 1);
  const closing = (h1 * per * (s0 + 1)) / (1 + q.r1) ** (n0 - 1);
  const pn = closing - opening - interest - service;
  const months = 12 - q.deposit.month;
  const assetInterest = q.deposit.amount * ((1 + q.r0) ** (months / 12) - 1);
  const returnPn = q.fv - q.deposit.amount - assetInterest;
  const surplus = q.fv - closing;
  const ceilingEffect = -Math.max(0, surplus);
  const assetsRecognised = q.fv + ceilingEffect;
  return {
    dcExpense,
    per,
    s0,
    n0,
    h0,
    h1,
    o: { opening, interest, service, pn, closing },
    a: { deposit: q.deposit.amount, interest: assetInterest, returnPn, ceilingEffect, recognised: assetsRecognised, months },
    surplus,
    pl: { salary: service, netInterest: interest - assetInterest, oci: pn - (returnPn + ceilingEffect) },
    net: closing - assetsRecognised,
    totalCost: service + (interest - assetInterest) + pn - (returnPn + ceilingEffect),
  };
}

export function trustQuestion(id: string, title: string, q: TrustInput): BkQuestion {
  const s = solveTrust(q);
  const y = q.year;
  const D = q.dc;
  const B = q.db;
  const dep = endOf(q.deposit.month, y);
  const oci = (v: number) => (v < 0 ? `רווח ${money(-v)}` : `הפסד ${money(v)}`);
  return {
    id,
    title,
    point: "נכסי תכנית נמדדים בשווי הוגן, והתקרה חלה על הנטו. גם כשהתקרה מאפסת את הנכס נטו, **הנכסים מופיעים בדוחות**: הכנסות הריבית שלהם מקטינות את הוצאות המימון, והתשואה העודפת והשפעת התקרה הולכות ל-OCI.",
    facts: [
      `חברת ״${q.company}״, ציבורית.`,
      `עובדי פיתוח: ${D.staff} עובדים מ-1.1.${D.hired}, עם סעיף 14. ההפקדה ביום האחרון של כל שנה, בגובה השכר החודשי של אותה שנה. שכר התחלתי ${money(D.salary)} ₪, עולה ב-${pc(D.raise)} בכל ינואר מ-${D.hired + 1}. ${D.leftEarlier} עובדים עזבו ב-1.1.${y}, כפי שהחברה צפתה.`,
      `עובדי ייצור: ${B.staff} עובדים התחילו ב-1.1.${B.hired}. מי שיפרוש אחרי ${B.vestYears} שנות עבודה רצופות לפחות יקבל מענק חד פעמי של ${money(B.grant)} ₪. בכל מועד החברה צופה שכל הנותרים יעבדו ${B.stayYears} שנים (עד 31.12.${B.hired + B.stayYears - 1}).`,
      `לפני שהשלימו ${B.vestYears} שנים, ולכן בלי מענק, פרשו ${B.retiredBefore} עובדי ייצור ב-31.12.${y - 1} ו-${B.retiredNow} נוספים ב-31.12.${y}. החברה לא צפתה את הפרישות.`,
      `ב-1.1.${y} נפתח חשבון נאמנות להבטחת המענק. הכסף משמש רק לתשלום המענקים או להחזר לחברה על מענקים ששילמה, ולא זמין לנושי החברה. החברה לא יכולה למשוך עודפים, ועודף לא מקטין את ההפקדות העתידיות. כשהתוכנית תיסגר, הנאמן יחליט אם להחזיר עודף לחברה או לחלק אותו לעובדים.`,
      `ב-${dep} הופקדו ${money(q.deposit.amount)} ₪. בסוף ${y} השווי ההוגן של החשבון: ${money(q.fv)} ₪.`,
      `תשואת אג״ח קונצרניות איכותיות: ${pc(q.r0)} ב-31.12.${y - 1} ו-${pc(q.r1)} ב-31.12.${y}. אג״ח ממשלתיות: ${pc(q.gov[0])} ו-${pc(q.gov[1])}. מימון של תוכניות הטבה מוגדרת מוצג בנפרד מהשכר. ריבית לחלק משנה בריבית אפקטיבית.`,
    ],
    tables: [],
    required: [`ההשפעה של כל ההסכמים על הרווח הכולל לשנת ${y}, לפי סעיפים, והיתרות במאזן ב-31.12.${y}.`],
    checks: [
      { label: `פיתוח: הוצאה ${y}`, value: s.dcExpense },
      { label: `ייצור: מחויבות 31.12.${y}`, value: s.o.closing },
      { label: "מימון נטו", value: Math.abs(s.pl.netInterest) },
      { label: "סה״כ OCI", value: Math.abs(s.pl.oci) },
    ],
    steps: [
      {
        title: "סיווג",
        tables: [
          {
            head: ["הסכם", "סיווג", "למה"],
            rows: [
              ["עובדי פיתוח", "הפקדה מוגדרת", "סעיף 14: אין מחויבות מעבר להפקדה"],
              ["עובדי ייצור", "הטבה מוגדרת", "הסכום מובטח, והחברה נושאת בסיכון"],
              ["חשבון הנאמנות", "נכסי תכנית", "שמור לעובדים ולא זמין לנושים (סעיף 8)"],
            ],
          },
        ],
        text: [`הזכאות לייצור נוצרת אחרי ${B.vestYears} שנים, ו**שירות נוסף לא מוסיף לה**. לכן מייחסים בקו ישר על ${B.vestYears} השנים הראשונות (סעיף 73): ${money(B.grant)} ÷ ${B.vestYears} = ${money(s.per)} לשנה.`],
      },
      {
        title: "עובדי פיתוח",
        tables: [{ head: ["", "חישוב", "סכום"], rows: [[`הוצאות שכר ${y}`, `${D.staff - D.leftEarlier} × ${money(D.salary)} × ${b(D.raise)}^${y - D.hired}`, money(s.dcExpense)]] }],
      },
      pvTable(`עובדי ייצור: מחויבות 31.12.${y - 1}`, [{ label: "עובדי ייצור", heads: s.h0, amount: s.per, part: String(s.s0), n: s.n0, value: s.o.opening }], {
        rate: q.r0,
        amount: "מענק לשנה",
        why: `${B.retiredBefore} עובדים פרשו כבר ב-31.12.${y - 1}, ולכן נשארו ${s.h0}. הם צפויים לעבוד ${B.stayYears} שנים, כלומר עוד ${s.n0}.`,
      }),
      pvTable(`עובדי ייצור: עלות שירות שוטף ${y}`, [{ label: "עובדי ייצור", heads: s.h0, amount: s.per, part: "1", n: s.n0 - 1, value: s.o.service }], {
        rate: q.r0,
        amount: "מענק לשנה",
        why: "לפי ההנחות של תחילת השנה: הפרישות של סוף השנה לא היו צפויות.",
      }),
      pvTable(`עובדי ייצור: מחויבות 31.12.${y}`, [{ label: "עובדי ייצור", heads: s.h1, amount: s.per, part: String(s.s0 + 1), n: s.n0 - 1, value: s.o.closing }], {
        rate: q.r1,
        amount: "מענק לשנה",
        why: `אחרי ש-${B.retiredNow} נוספים פרשו נשארו ${s.h1}, והריבית עלתה ל-${pc(q.r1)}.`,
      }),
      {
        title: "עובדי ייצור: המחויבות",
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, "", money(s.o.opening)],
              ["ריבית", `${money(s.o.opening)} × ${pc(q.r0)}`, money(s.o.interest)],
              ["שירות שוטף", "", money(s.o.service)],
              ["מדידה מחדש (OCI), מאזנת: הפרישות והריבית", `${money(s.o.closing)} − ${money(s.o.opening)} − ${money(s.o.interest)} − ${money(s.o.service)}`, money(s.o.pn)],
              [`סגירה 31.12.${y}`, "", money(s.o.closing)],
            ],
          },
        ],
        text: ["הפורשים לא קיבלו כסף, ולכן אין שורת תשלומים. הפרישה הבלתי צפויה היא שינוי בהנחות, **לא סילוק**."],
      },
      {
        title: "חשבון הנאמנות, ותקרת הנכס",
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`הפקדה ${dep}`, "", money(s.a.deposit)],
              [`הכנסות ריבית (${s.a.months} חודשים)`, `${money(s.a.deposit)} × (${b(q.r0)}^(${s.a.months}/12) − 1)`, money(s.a.interest)],
              ["תשואה מעבר לריבית (OCI)", `${money(q.fv)} − ${money(s.a.deposit)} − ${money(s.a.interest)}`, money(s.a.returnPn)],
              ["שווי הוגן 31.12", "", money(q.fv)],
              ["עודף", `${money(q.fv)} − ${money(s.o.closing)}`, money(s.surplus)],
              ["תקרת הנכס", "אין החזרים ואין הקטנת הפקדות: 0", "0"],
              ["השפעת התקרה (OCI)", "", money(s.a.ceilingEffect)],
              ["נכסים שמוצגים נגד המחויבות", "", money(s.a.recognised)],
            ],
          },
        ],
        text: ["העודף שייך בסוף לנאמן, ולחברה אין ממנו הטבה כלכלית (סעיף 64, IFRIC 14). לכן **הנכס נטו 0**. ההשפעה של התקרה נוצרה בסוף השנה, ולכן אין עליה ריבית השנה."],
      },
      {
        title: "ההשפעה על הדוחות",
        tables: [
          {
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר: הפקדה מוגדרת", "", money(s.dcExpense)],
              ["הוצאות שכר: שירות שוטף", "", money(s.pl.salary)],
              ["מימון נטו", `${money(s.o.interest)} − ${money(s.a.interest)}`, money(s.pl.netInterest)],
              ["OCI: מחויבות", "", oci(s.o.pn)],
              ["OCI: תשואה על הנכסים", "", oci(-s.a.returnPn)],
              ["OCI: השפעת התקרה", "", oci(-s.a.ceilingEffect)],
              ["סה״כ OCI", "", oci(s.pl.oci)],
              [`התחייבות (נכס) נטו 31.12.${y}`, `${money(s.o.closing)} − ${money(s.a.recognised)}`, money(s.net)],
            ],
          },
        ],
        text: [`בדיקה לתוכנית הייצור: העלות הכוללת (שכר + מימון + OCI) שווה לשינוי בנטו פחות ההפקדה: ${money(s.net)} − ${money(s.o.opening)} + ${money(s.a.deposit)} = ${money(s.totalCost)}.`],
      },
    ],
  };
}

// ===========================================================================
// 7. A surplus under a minimum funding requirement: how much of it is an asset (IFRIC 14), and the year that leads to it.

export type MfrInput = {
  company: string;
  granted: number;
  heads: number;
  grant: number;
  years: number;
  rate: number;
  mfr: number;
  year: number;
  fvOpen: number;
  fvClose: number;
};

export function solveMfr(q: MfrInput) {
  const y = q.year;
  const r = q.rate;
  const per = q.heads * (q.grant / q.years);
  const end = q.granted + q.years - 1;
  const s0 = y - q.granted; // years accrued at 1.1 of the year
  const n0 = end - y + 1;
  const obOpen = (per * s0) / (1 + r) ** n0;
  const interest = obOpen * r;
  const service = per / (1 + r) ** (n0 - 1);
  const obClose = (per * (s0 + 1)) / (1 + r) ** (n0 - 1);
  // The ceiling at a date: present value of future service cost less present value of minimum contributions for it, never below zero.
  const ceilingAt = (future: number) => {
    const fsc = (per * future) / (1 + r) ** future;
    const pvMfr = sum(Array.from({ length: future }, (_, k) => q.mfr / (1 + r) ** (k + 1)));
    return { fsc, pvMfr, benefit: Math.max(0, fsc - pvMfr) };
  };
  const c0 = ceilingAt(n0);
  const c1 = ceilingAt(n0 - 1);
  const surplus0 = q.fvOpen - obOpen;
  const asset0 = Math.min(surplus0, c0.benefit);
  const effect0 = surplus0 - asset0;
  const assetInterest = q.fvOpen * r;
  const returnPn = q.fvClose - q.fvOpen - assetInterest - q.mfr;
  const surplus1 = q.fvClose - obClose;
  const asset1 = Math.min(surplus1, c1.benefit);
  const effect1 = surplus1 - asset1;
  const effectInterest = effect0 * r;
  const effectChange = effect1 - effect0 - effectInterest;
  const netInterest = interest - assetInterest + effectInterest;
  return { per, end, s0, n0, obOpen, interest, service, obClose, c0, c1, surplus0, asset0, effect0, assetInterest, returnPn, surplus1, asset1, effect1, effectInterest, effectChange, netInterest, oci: -returnPn + effectChange };
}

export function mfrQuestion(id: string, title: string, q: MfrInput): BkQuestion {
  const s = solveMfr(q);
  const y = q.year;
  const r = q.rate;
  const per = q.grant / q.years;
  return {
    id,
    title,
    point: "עודף בתוכנית מוכר כנכס עד גובה התקרה: הערך הנוכחי של ההטבה הכלכלית שזמינה לחברה. בלי החזרים, ההטבה היא **הקטנת הפקדות עתידיות**: עלות השירות העתידית פחות ההפקדות המינימליות בגינה, ולא פחות מאפס (IFRIC 14, סעיפים 16–22).",
    facts: [
      `ב-1.1.${q.granted} העניקה חברת ״${q.company}״ לכל אחד מ-${q.heads} מנהלי הייצור מענק של ${money(q.grant)} ₪ בפרישה, בתנאי שיעבוד ${q.years} שנים רצופות מיום ההענקה. כולם צפויים לפרוש ב-31.12.${s.end}, וזה גם היום שבו התוכנית תיסגר. לא צפויות עזיבות.`,
      "המענק נצבר בקו ישר על פני שנות התוכנית.",
      `החברה פתחה קרן נפרדת. הכסף בה משמש רק לתשלום המענקים ולא זמין לנושים. החברה לא תקבל החזרים מהקרן בשום מצב: עודף שיישאר בסגירה יחולק למנהלים.`,
      `לפי תקנון הקרן, על החברה להפקיד ${money(q.mfr)} ₪ בסוף כל שנה עד סגירת התוכנית. ההפקדות האלה מיועדות למימון השירות העתידי.`,
      `ב-31.12.${y} הפקידה החברה ${money(q.mfr)} ₪, כנדרש. השווי ההוגן של הקרן: ${money(q.fvOpen)} ₪ ב-31.12.${y - 1}, ו-${money(q.fvClose)} ₪ ב-31.12.${y} (אחרי ההפקדה).`,
      `שיעור ההיוון: ${pc(r)}, ולא השתנה.`,
      `לצורך התקרה: עלות השירות העתידית של כל שנה היא ההטבה שתיצבר בה, מהוונת להיום מיום התשלום (31.12.${s.end}). ההפקדות המינימליות מהוונות מיום ההפקדה.`,
      `בישיבת הדירקטוריון טען סמנכ״ל הכספים שאסור להכיר בעודף כנכס, כי אין החזרים ויש חובת הפקדה מינימלית. היו״ר טען שאפשר להכיר בחלק ממנו.`,
    ],
    tables: [],
    required: [`הנכס נטו שיוצג ב-31.12.${y - 1} וב-31.12.${y}.`, `ההשפעה על רווח והפסד ועל ה-OCI לשנת ${y}.`, "מי צודק בדירקטוריון? נמקו לפי IAS 19 ו-IFRIC 14."],
    checks: [
      { label: `מחויבות 31.12.${y}`, value: s.obClose },
      { label: `תקרה 31.12.${y}`, value: s.c1.benefit },
      { label: `נכס נטו 31.12.${y}`, value: s.asset1 },
      { label: "מימון נטו (הכנסה)", value: Math.abs(s.netInterest) },
    ],
    steps: [
      pvTable(`מחויבות 31.12.${y - 1}`, [{ label: "מנהלי הייצור", heads: q.heads, amount: per, part: String(s.s0), n: s.n0, value: s.obOpen }], {
        rate: r,
        amount: "מענק לשנה",
        why: `המענק נצבר בקו ישר: ${money(q.grant)} ÷ ${q.years} = ${money(per)} ₪ לשנה, והחלק שנצבר הוא השנים שעברו.`,
      }),
      pvTable(`עלות שירות שוטף ${y}`, [{ label: "מנהלי הייצור", heads: q.heads, amount: per, part: "1", n: s.n0 - 1, value: s.service }], { rate: r, amount: "מענק לשנה" }),
      pvTable(`מחויבות 31.12.${y}`, [{ label: "מנהלי הייצור", heads: q.heads, amount: per, part: String(s.s0 + 1), n: s.n0 - 1, value: s.obClose }], { rate: r, amount: "מענק לשנה" }),
      {
        title: `התנועה במחויבות ${y}`,
        text: [`ריבית: ${money(s.obOpen)} × ${pc(r)} = ${money(s.interest)} ₪`, `בדיקה: ${money(s.obOpen)} + ${money(s.interest)} + ${money(s.service)} = ${money(s.obOpen + s.interest + s.service)}, בדיוק יתרת הסגירה.`, "שום הנחה לא השתנתה, ולכן אין מדידה מחדש של המחויבות."],
      },
      pvTable(
        "ערך נוכחי של עלות השירות העתידית",
        [
          { label: `31.12.${y - 1}`, amount: s.per, part: String(s.n0), n: s.n0, value: s.c0.fsc },
          { label: `31.12.${y}`, amount: s.per, part: String(s.n0 - 1), n: s.n0 - 1, value: s.c1.fsc },
        ],
        {
          rate: r,
          label: "תאריך",
          amount: "עלות שנה, כל המנהלים",
          total: false,
          why: `כל שנת שירות שנותרה מוסיפה ${q.heads} × ${money(per)} = ${money(s.per)} ₪, וכולן ישולמו ב-31.12.${s.end}. לכן החלק כאן הוא מספר השנים שנותרו, וגם n.`,
        },
      ),
      {
        title: "התקרה בשני התאריכים",
        tables: [
          {
            head: ["", `31.12.${y - 1}`, `31.12.${y}`],
            rows: [
              ["שנות שירות שנותרו", s.n0, s.n0 - 1],
              ["ערך נוכחי של עלות השירות העתידית", money(s.c0.fsc), money(s.c1.fsc)],
              ["ערך נוכחי של ההפקדות המינימליות", money(s.c0.pvMfr), money(s.c1.pvMfr)],
              ["תקרה = ההפרש (לא פחות מ-0)", money(s.c0.benefit), money(s.c1.benefit)],
              ["עודף: שווי הוגן − מחויבות", `${money(q.fvOpen)} − ${money(s.obOpen)} = ${money(s.surplus0)}`, `${money(q.fvClose)} − ${money(s.obClose)} = ${money(s.surplus1)}`],
              ["נכס נטו = הנמוך מביניהם", money(s.asset0), money(s.asset1)],
              ["השפעת התקרה", money(s.effect0), money(s.effect1)],
            ],
          },
        ],
        text: [`הערך הנוכחי של ההפקדות: ${money(q.mfr)} ליום ההפקדה בכל שנה, מהוון לפי ${pc(r)}.`],
      },
      {
        title: `${y}: הנכסים, ומה נכנס לדוחות`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              ["הכנסות ריבית על הנכסים", `${money(q.fvOpen)} × ${pc(r)}`, money(s.assetInterest)],
              ["תשואה מעבר לריבית (OCI)", `${money(q.fvClose)} − ${money(q.fvOpen)} − ${money(s.assetInterest)} − ${money(q.mfr)}`, money(s.returnPn)],
              ["ריבית על השפעת התקרה (סעיף 124)", `${money(s.effect0)} × ${pc(r)}`, money(s.effectInterest)],
              ["שינוי בהשפעת התקרה מעבר לריבית (OCI)", `${money(s.effect1)} − ${money(s.effect0)} − ${money(s.effectInterest)}`, money(s.effectChange)],
            ],
          },
          {
            title: `ההשפעה על הדוחות ${y}`,
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר: שירות שוטף", "", money(s.service)],
              ["מימון נטו", `${money(s.interest)} − ${money(s.assetInterest)} + ${money(s.effectInterest)}`, s.netInterest < 0 ? `(${money(-s.netInterest)}) הכנסה` : money(s.netInterest)],
              ["OCI", `תשואה ${money(s.returnPn)}, תקרה (${money(s.effectChange)})`, s.oci < 0 ? `רווח ${money(-s.oci)}` : `הפסד ${money(s.oci)}`],
            ],
          },
        ],
        text: [`בדיקה: נכס נטו ${money(s.asset0)} + הפקדה ${money(q.mfr)} − שירות ${money(s.service)} − מימון נטו (${money(s.netInterest)}) − OCI (${money(s.oci)}) = ${money(s.asset0 + q.mfr - s.service - s.netInterest - s.oci)}.`],
      },
      {
        title: "מי צודק",
        text: [
          "סמנכ״ל הכספים טועה. **היעדר החזרים לא מונע** הכרה בנכס: ההטבה הכלכלית יכולה לבוא מהקטנת הפקדות עתידיות (סעיף 8, IFRIC 14 סעיף 11).",
          "חובת הפקדה מינימלית לא מבטלת את הנכס. היא **מקטינה את ההטבה**: עלות השירות העתידית פחות ההפקדות המינימליות בגינה (IFRIC 14 סעיף 20).",
          `היו״ר צודק: כאן עלות השירות העתידית גדולה מההפקדות המינימליות, ולכן מכירים בנכס של ${money(s.asset1)}, ולא בכל העודף של ${money(s.surplus1)} (סעיף 64).`,
        ],
      },
    ],
  };
}

// ===========================================================================
// 8. One year, many events: the rate out of last year's note, a settlement with an insurer mid-year, early retirements on the plan's terms, a termination offer paid in more than twelve months, and the full statements.

export type IntegratedInput = {
  company: string;
  year: number;
  heads: number;
  hired: number;
  retireYear: number;
  salary: number;
  raise: number;
  note: { assetsOpen: number; assetInterest: number; contrib: number; assetPn: number };
  rateDrop: number;
  rMid: number;
  rEnd: number;
  month: number;
  settled: { heads: number; premium: number };
  retired: { heads: number };
  contrib: number;
  fvEnd: number;
  term: { heads: number; amount: number; payYear: number; payMonth: number };
};

export function solveIntegrated(q: IntegratedInput) {
  const y = q.year;
  const T = q.retireYear - q.hired + 1;
  const final = q.salary * (1 + q.raise) ** (q.retireYear - (y - 1));
  const ben = final * T;
  const r0 = q.note.assetInterest / q.note.assetsOpen;
  const r1 = r0 - q.rateDrop;
  const s1 = y - q.hired; // years served at 1.1 of the asked year
  const n1 = T - s1;
  const ob = (heads: number, served: number, i: number, n: number) => (heads * ben * served) / T / (1 + i) ** n;
  const opening = ob(q.heads, s1, r1, n1);
  const assetsOpen = q.note.assetsOpen + q.note.assetInterest + q.note.contrib + q.note.assetPn;
  const m = q.month / 12;
  const i1 = opening * ((1 + r1) ** m - 1);
  const sv1 = (q.heads * ben * m) / T / (1 + r1) ** (n1 - m);
  const atMid = ob(q.heads, s1 + m, q.rMid, n1 - m);
  const pnMid = atMid - opening - i1 - sv1;
  const settledOb = (atMid * q.settled.heads) / q.heads;
  const settleLoss = q.settled.premium - settledOb;
  const h2 = q.heads - q.settled.heads;
  const after = atMid - settledOb;
  const i2 = after * ((1 + q.rMid) ** (1 - m) - 1);
  const sv2 = (h2 * ben * (1 - m)) / T / (1 + q.rMid) ** (n1 - 1);
  const retiredOb = ob(q.retired.heads, s1 + 1, q.rEnd, n1 - 1);
  const salaryNow = q.salary * (1 + q.raise);
  const retiredPaid = q.retired.heads * salaryNow * (s1 + 1);
  const h3 = h2 - q.retired.heads;
  const closing = ob(h3, s1 + 1, q.rEnd, n1 - 1);
  const pnEnd = closing - (after + i2 + sv2 - retiredPaid);
  const ai1 = assetsOpen * ((1 + r1) ** m - 1);
  const assetsAfter = assetsOpen + ai1 - q.settled.premium;
  const ai2 = assetsAfter * ((1 + q.rMid) ** (1 - m) - 1);
  const assetPn = q.fvEnd - (assetsOpen + ai1 + ai2 - q.settled.premium - retiredPaid + q.contrib);
  const Tm = q.term;
  const nTerm = Tm.payYear - y - 1 + Tm.payMonth / 12;
  const termProvision = (Tm.heads * Tm.amount) / (1 + q.rEnd) ** nTerm;
  const pl = {
    service: sv1 + sv2,
    settleLoss,
    term: termProvision,
    netInterest: i1 + i2 - ai1 - ai2,
    oci: pnMid + pnEnd - assetPn,
  };
  return {
    T,
    final,
    ben,
    r0,
    r1,
    s1,
    n1,
    opening,
    assetsOpen,
    i1,
    sv1,
    atMid,
    pnMid,
    settledOb,
    settleLoss,
    h2,
    after,
    i2,
    sv2,
    retiredOb,
    salaryNow,
    retiredPaid,
    h3,
    closing,
    pnEnd,
    ai1,
    assetsAfter,
    ai2,
    assetPn,
    nTerm,
    termProvision,
    pl,
    netLiability: closing - q.fvEnd,
  };
}

export function integratedQuestion(id: string, title: string, q: IntegratedInput): BkQuestion {
  const s = solveIntegrated(q);
  const y = q.year;
  const N = q.note;
  const mo = q.month;
  const mid = endOf(mo, y);
  const Tm = q.term;
  const pay = endOf(Tm.payMonth, Tm.payYear);
  const oci = (v: number) => (v < 0 ? `רווח ${money(-v)}` : `הפסד ${money(v)}`);
  const pvI = { label: "קבוצה", amount: "שכר בפרישה" };
  return {
    id,
    title,
    point: "סדר העבודה בשנה עם כמה אירועים: מחלצים את הריבית מהביאור, מתקדמים עד האירוע הראשון, מודדים מחדש באותו יום, רושמים את האירוע, וממשיכים לפי הנתונים המעודכנים. סילוק הולך לרווח והפסד; פרישה לפי תנאי התוכנית היא **מדידה מחדש ב-OCI**.",
    facts: [
      `חברת ״${q.company}״. ${q.heads} עובדים התחילו לעבוד ב-1.1.${q.hired}, וכולם צפויים לפרוש ב-31.12.${q.retireYear}. בפרישה כל עובד מקבל שכר חודשי אחרון × שנות השירות. השכר ב-${y - 1}: ${money(q.salary)} ₪ לכל עובד (לכל העובדים אותו שכר ואותו ותק), והוא עולה ב-${pc(q.raise)} בכל 1.1.`,
      `החברה מפקידה לקרן שמקיימת את הגדרת נכסי תכנית. ההפקדות ביום 31.12. מהביאור לדוחות ${y - 1} (₪), נכסי התכנית: יתרת פתיחה ${money(N.assetsOpen)}, הכנסות ריבית ${money(N.assetInterest)}, הפקדות ${money(N.contrib)}, תשואה מעבר לריבית ${money(N.assetPn)}.`,
      `שיעור ההיוון ב-31.12.${y - 1} נמוך ב-${nf(q.rateDrop * 100, 2)} נקודת אחוז מהשיעור שלפיו חושבו הכנסות הריבית ב-${y - 1}. ב-${mid} הוא היה ${pc(q.rMid)}, ובסוף ${y} ‏${pc(q.rEnd)}.`,
      `ב-${mid} העבירה החברה לחברת ביטוח, באופן בלתי חוזר, את כל המחויבות כלפי ${q.settled.heads} מהעובדים, תמורת פרמיה של ${money(q.settled.premium)} ₪ ששולמה מנכסי הקרן. העובדים האלה ממשיכים לעבוד, והחברה לא חייבת להם דבר, גם לא בגין שירותם העתידי. השווי ההוגן של הקרן ב-${mid}, לפני תשלום הפרמיה: ${money(s.assetsOpen + s.ai1)} ₪.`,
      `ב-31.12.${y} פרשו באופן לא צפוי ${q.retired.heads} מהעובדים שלא הועברו לחברת הביטוח, וקיבלו מהקרן את מה שהתוכנית קובעת: שכרם ב-${y} × שנות השירות.`,
      `ב-31.12.${y} הופקדו לקרן ${money(q.contrib)} ₪. השווי ההוגן של הקרן בסוף ${y}: ${money(q.fvEnd)} ₪.`,
      `במחלקה אחרת: ב-1.10.${y} הציעה החברה פרישה מרצון. עד 31.12.${y} קיבלו את ההצעה ${Tm.heads} עובדים, והחברה כבר לא יכולה לבטל אותה. כל אחד יקבל ${money(Tm.amount)} ₪ ב-${pay}.`,
      "ריבית לחלק משנה מחושבת בריבית אפקטיבית. מימון של תוכניות הטבה מוגדרת מוצג בנפרד. עלות השירות השוטף לפי ריבית תחילת התקופה.",
    ],
    tables: [],
    required: [
      `התנועה במחויבות ובנכסי התכנית לשנת ${y}.`,
      `ההתחייבות בגין הפרישה מרצון ב-31.12.${y}, כולל סיווג.`,
      `ההשפעה של כל האירועים על רווח והפסד ועל ה-OCI לשנת ${y}, והיתרות במאזן ב-31.12.${y}.`,
    ],
    checks: [
      { label: "הפסד מסילוק", value: s.settleLoss },
      { label: `מחויבות 31.12.${y}`, value: s.closing },
      { label: "התחייבות לפרישה מרצון", value: s.termProvision },
      { label: `התחייבות נטו בגין הטבה מוגדרת 31.12.${y}`, value: s.netLiability },
    ],
    steps: [
      {
        title: "מה מחלצים מהביאור",
        tables: [
          {
            head: ["נעלם", "חישוב", "תוצאה"],
            rows: [
              [`ריבית ${y - 1}: הכנסות ריבית ÷ נכסים בפתיחה (ההפקדה ב-31.12)`, `${money(N.assetInterest)} ÷ ${money(N.assetsOpen)}`, pc(s.r0)],
              [`ריבית 31.12.${y - 1}`, `${pc(s.r0)} − ${nf(q.rateDrop * 100, 2)}%`, pc(s.r1)],
              [`נכסים 31.12.${y - 1}`, `${money(N.assetsOpen)} + ${money(N.assetInterest)} + ${money(N.contrib)} + ${money(N.assetPn)}`, money(s.assetsOpen)],
              ["שכר בפרישה", `${money(q.salary)} × ${b(q.raise)}^${q.retireYear - y + 1}`, d2(s.final)],
              ["הטבה לעובד בפרישה", `${d2(s.final)} × ${s.T}`, money(s.ben)],
            ],
          },
        ],
        text: ["הריבית על הנכסים והריבית על המחויבות הן **אותה ריבית** (סעיף 123), ולכן הביאור של הנכסים מגלה את שיעור ההיוון."],
      },
      pvTable(`מחויבות 31.12.${y - 1}`, [{ label: "כל העובדים", heads: q.heads, amount: s.final, part: String(s.s1), n: s.n1, value: s.opening }], {
        ...pvI,
        rate: s.r1,
        why: `ההטבה היא שכר אחרון × שנות שירות, ולכן החלק שנצבר הוא השנים שעברו (${s.s1} מתוך ${s.T}). הריבית היא זו שחולצה מהביאור, ${pc(s.r1)}.`,
      }),
      pvTable(`עלות שירות שוטף ${y}`, [
        { label: `עד ${mid}`, heads: q.heads, amount: s.final, part: `${mo}/12`, n: s.n1 - mo / 12, rate: s.r1, value: s.sv1 },
        { label: `מ-${mid}`, heads: s.h2, amount: s.final, part: `${12 - mo}/12`, n: s.n1 - 1, rate: q.rMid, value: s.sv2 },
      ], {
        ...pvI,
        label: "תקופה",
        rate: s.r1,
        why: `עד ${mid}: כל ${q.heads} העובדים, בריבית תחילת השנה. אחרי הסילוק נשארו ${s.h2} עובדים, והריבית היא של יום הסילוק.`,
      }),
      pvTable(`ביום הסילוק, ${mid}`, [
        { label: "כל העובדים", heads: q.heads, amount: s.final, part: yp(s.s1, mo), n: s.n1 - mo / 12, value: s.atMid },
        { label: "המועברים לביטוח", heads: q.settled.heads, amount: s.final, part: yp(s.s1, mo), n: s.n1 - mo / 12, value: s.settledOb },
      ], {
        ...pvI,
        label: "מדידה",
        rate: q.rMid,
        total: false,
        why: "**לפני הסילוק מודדים מחדש** את כל המחויבות לפי הנחות יום הסילוק (סעיף 99). הסילוק עצמו מבטל את חלקם של העובדים שהועברו, וההפרש מול הפרמיה הוא רווח או הפסד מסילוק (סעיף 109).",
      }),
      {
        title: `המחויבות עד ${mid}, והסילוק`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`פתיחה 31.12.${y - 1}`, "", money(s.opening)],
              [`ריבית ${mo} חודשים`, `${money(s.opening)} × (${b(s.r1)}^(${mo}/12) − 1)`, money(s.i1)],
              [`שירות ${mo} חודשים`, "", money(s.sv1)],
              ["מדידה מחדש ביום הסילוק (OCI), מאזנת", `${money(s.atMid)} − ${money(s.opening)} − ${money(s.i1)} − ${money(s.sv1)}`, money(s.pnMid)],
              [`מחויבות ב-${mid}`, "", money(s.atMid)],
              [`החלק של ${q.settled.heads} העובדים`, "", money(s.settledOb)],
              ["הפסד מסילוק (רווח והפסד)", `${money(q.settled.premium)} − ${money(s.settledOb)}`, money(s.settleLoss)],
            ],
          },
        ],
      },
      pvTable(`מחויבות 31.12.${y}`, [{ label: "העובדים שנשארו", heads: s.h3, amount: s.final, part: String(s.s1 + 1), n: s.n1 - 1, value: s.closing }], {
        ...pvI,
        rate: q.rEnd,
        why: `מ-${q.heads} העובדים הועברו ${q.settled.heads} לביטוח ו-${q.retired.heads} פרשו, ולכן נשארו ${s.h3}.`,
      }),
      {
        title: `המחויבות מ-${mid} עד סוף השנה`,
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              ["אחרי הסילוק", `${money(s.atMid)} − ${money(s.settledOb)}`, money(s.after)],
              [`ריבית ${12 - mo} חודשים`, `${money(s.after)} × (${b(q.rMid)}^(${12 - mo}/12) − 1)`, money(s.i2)],
              [`שירות ${12 - mo} חודשים`, "", money(s.sv2)],
              ["שולם לפורשים", `${q.retired.heads} × ${d2(s.salaryNow)} × ${s.s1 + 1}`, `(${money(s.retiredPaid)})`],
              ["מדידה מחדש בסוף השנה (OCI), מאזנת: הפורשים והריבית", `${money(s.closing)} − ${money(s.after)} − ${money(s.i2)} − ${money(s.sv2)} + ${money(s.retiredPaid)}`, money(s.pnEnd)],
              [`סגירה 31.12.${y}`, "", money(s.closing)],
            ],
          },
        ],
        text: ["הפורשים קיבלו בדיוק את מה שהתוכנית קובעת, רק מוקדם מהצפוי. **זה לא סילוק**: ההפרש בין התשלום לבין המחויבות בגינם הוא מדידה מחדש."],
        rolls: [
          R(`מחויבות, ${y}`, [
            { label: "יתרת פתיחה", value: s.opening, kind: "balance" },
            { label: "עלות ריבית", value: s.i1 + s.i2 },
            { label: "עלות שירות שוטף", value: s.sv1 + s.sv2 },
            { label: "סילוק", value: -s.settledOb },
            { label: "שולם לפורשים", value: -s.retiredPaid },
            { label: "מדידה מחדש", value: s.pnMid + s.pnEnd, kind: "pn" },
            { label: "יתרת סגירה", value: s.closing, kind: "balance" },
          ]),
        ],
      },
      {
        title: "נכסי התכנית",
        tables: [
          {
            head: ["שורה", "חישוב", "סכום"],
            rows: [
              [`ריבית עד ${mid}`, `${money(s.assetsOpen)} × (${b(s.r1)}^(${mo}/12) − 1)`, money(s.ai1)],
              ["פרמיה ששולמה", "", `(${money(q.settled.premium)})`],
              [`ריבית מ-${mid}`, `(${money(s.assetsOpen)} + ${money(s.ai1)} − ${money(q.settled.premium)}) × (${b(q.rMid)}^(${12 - mo}/12) − 1)`, money(s.ai2)],
              ["תשלום לפורשים", "", `(${money(s.retiredPaid)})`],
              ["הפקדה", "", money(q.contrib)],
              ["תשואה מעבר לריבית (OCI), מאזנת", "", money(s.assetPn)],
            ],
          },
        ],
        rolls: [
          R(
            `נכסי התכנית, ${y}`,
            [
              { label: "יתרת פתיחה", value: s.assetsOpen, kind: "balance" },
              { label: "הכנסות ריבית", value: s.ai1 + s.ai2 },
              { label: "פרמיה לסילוק", value: -q.settled.premium },
              { label: "תשלום לפורשים", value: -s.retiredPaid },
              { label: "הפקדות", value: q.contrib },
              { label: "מדידה מחדש", value: s.assetPn, kind: "pn" },
              { label: "יתרת סגירה", value: q.fvEnd, kind: "balance" },
            ],
            { side: "debit" },
          ),
        ],
      },
      pvTable(`הפרישה מרצון: התחייבות 31.12.${y}`, [{ label: "מי שקיבלו את ההצעה", heads: Tm.heads, amount: Tm.amount, n: s.nTerm, value: s.termProvision }], {
        rate: q.rEnd,
        why: [
          "הטבת פיטורין: נולדה מההצעה לסיים את העבודה, ומוכרת כשהחברה **כבר לא יכולה לבטל** אותה (סעיף 165).",
          `התשלום ב-${pay}, יותר מ-12 חודשים אחרי סוף השנה, ולכן מודדים כמו הטבה אחרת לזמן ארוך: **מהוונים** (סעיף 169), ${yrs(s.nTerm)} שנים מ-31.12.${y}.`,
        ],
      }),
      {
        title: "ההשפעה על הדוחות",
        tables: [
          {
            head: ["סעיף", "חישוב", "סכום"],
            rows: [
              ["הוצאות שכר: שירות שוטף", "", money(s.pl.service)],
              ["הוצאות שכר: הפסד מסילוק", "", money(s.pl.settleLoss)],
              ["הוצאות שכר: פרישה מרצון", "", money(s.pl.term)],
              ["מימון נטו", `${money(s.i1 + s.i2)} − ${money(s.ai1 + s.ai2)}`, money(s.pl.netInterest)],
              ["OCI", `מחויבות ${money(s.pnMid + s.pnEnd)}, נכסים ${money(s.assetPn)}`, oci(s.pl.oci)],
              [`התחייבות נטו בגין הטבה מוגדרת 31.12.${y}`, `${money(s.closing)} − ${money(q.fvEnd)}`, money(s.netLiability)],
              ["התחייבות לפרישה מרצון (לזמן ארוך)", "", money(s.termProvision)],
            ],
          },
        ],
      },
    ],
  };
}

// ===========================================================================
// The eight questions, on the course's own companies and figures.

export const FINAL_CANCEL: CancelInput = {
  company: "מגן אלקטרוניקה",
  founded: 2015,
  year: 2025,
  ops: { name: "מחלקת תפעול", first: 5_500, firstYears: 6, later: 4_500 },
  dev: { name: "מחלקת פיתוח עסקי", first: 6_000, firstYears: 6, growth: 0.25 },
  a: { name: "נועה", hired: 2015, ends: 2031 },
  c: { name: "איתי", hired: 2021, ends: 2034 },
  r0: 0.045,
  rM: 0.042,
  month: 3,
  pay: [41_000, 54_000],
};

export const FINAL_MGMT: MgmtInput = {
  company: "אופק ייעוץ",
  founded: 2014,
  heads: 24,
  age: 28,
  retire: 65,
  salary: 8_000,
  raise: 0.025,
  dcHeads: 9,
  dcRate: 0.0833,
  assets0: { opening: 600_000, contrib: 60_000, closing: 655_000 },
  rOpen: 0.038,
  r1: 0.044,
  rAm: 0.041,
  r2: 0.043,
  gov: [0.022, 0.025, 0.024],
  month: 9,
  add: 0.12,
  assets1: { atAmend: 690_000, contrib: 70_000, closing: 775_000 },
};

export const FINAL_SHORT: ShortExamInput = {
  company: "שחקים שירותים",
  year: 2025,
  workDays: 21,
  salary: 15_750,
  raise: 0.04,
  vacation: 18,
  payout: 0.5,
  choice: { max: 4, pay: 0.75, used: 150 },
  start: { staff: 80, balance: 6, leavers: 5, use: 0.9 },
  actual: { leavers: 4, used: 1_330 },
  end: { staff: 76, leavers: 4, use: 0.88 },
};

export const FINAL_THREE: ThreeAgreeInput = {
  company: "טעמי הגליל",
  start: 2025,
  grant: { heads: 12, amount: 30_000, units: [9_000, 8_000, 6_000, 4_000, 3_000], r0: 0.065, r1: 0.075, newAmount: 20_000, comp: 4_000 },
  term: { decided: { day: 30, month: 11 }, closes: { day: 31, month: 10 }, staff: 60, base: 8_000, stay: 15_000, leaveNow: 18, stayLeave: 6 },
  dc: { staff: 14, hired: 2023, salary: 10_400, raise: 0.03, rate: 0.05 },
};

export const FINAL_SALES: SalesInput = {
  company: "רשת לקוחות",
  year: 2025,
  vac: { staff: 120, entitlement: 16, balance: 6, expectNow: 19, expectNext: 18, used: 12, salary: 10_120, days: 22, raise: 0.025 },
  grant: { heads: 6, start: 2024, years: 5, amount: 45_000, newAmount: 54_000, month: 6, joinMonth: 10, companyRate: 0.05, r0: 0.06, r1: 0.055 },
};

export const FINAL_TRUST: TrustInput = {
  company: "מערכות הגנה",
  year: 2025,
  dc: { staff: 12, hired: 2022, salary: 16_000, raise: 0.04, leftEarlier: 2 },
  db: { staff: 40, hired: 2019, grant: 72_000, vestYears: 12, stayYears: 16, retiredBefore: 3, retiredNow: 4 },
  deposit: { amount: 680_000, month: 2 },
  fv: 715_000,
  r0: 0.075,
  r1: 0.08,
  gov: [0.055, 0.06],
};

export const FINAL_MFR: MfrInput = { company: "מחשבי הצפון", granted: 2023, heads: 5, grant: 240_000, years: 6, rate: 0.05, mfr: 120_000, year: 2025, fvOpen: 520_000, fvClose: 760_000 };

export const FINAL_INTEGRATED: IntegratedInput = {
  company: "אלומה תעשיות",
  year: 2026,
  heads: 50,
  hired: 2016,
  retireYear: 2040,
  salary: 12_000,
  raise: 0.03,
  note: { assetsOpen: 2_100_000, assetInterest: 105_000, contrib: 300_000, assetPn: 45_000 },
  rateDrop: 0.005,
  rMid: 0.05,
  rEnd: 0.05,
  month: 6,
  settled: { heads: 10, premium: 1_020_000 },
  retired: { heads: 2 },
  contrib: 320_000,
  fvEnd: 1_700_000,
  term: { heads: 25, amount: 40_000, payYear: 2028, payMonth: 3 },
};

export const FINAL_EXAMS: BkQuestion[] = [
  cancelQuestion("mx-cancel", "מבחן מסכם 1: מענקים בשתי מחלקות, וביטול באמצע השנה", FINAL_CANCEL),
  mgmtQuestion("mx-mgmt", "מבחן מסכם 2: הנהלה בשתי תוכניות, ותיקון ב-30.9", FINAL_MGMT),
  shortExamQuestion("mx-short", "מבחן מסכם 3: משכורת 13, חופשה וימי בחירה", FINAL_SHORT),
  threeAgreeQuestion("mx-three", "מבחן מסכם 4: מענק שהוקטן, פיטורין וסעיף 14", FINAL_THREE),
  salesQuestion("mx-sales", "מבחן מסכם 5: חופשה, ומענק מכירות עם עובד שהוחלף", FINAL_SALES),
  trustQuestion("mx-trust", "מבחן מסכם 6: חשבון נאמנות, ונכסים שהתקרה מאפסת", FINAL_TRUST),
  mfrQuestion("mx-mfr", "מבחן מסכם 7: עודף, תקרה והפקדה מינימלית", FINAL_MFR),
  integratedQuestion("mx-integrated", "מבחן מסכם 8: שנה של אירועים, מביאור ועד הדוחות", FINAL_INTEGRATED),
];

export type { BkStep };
