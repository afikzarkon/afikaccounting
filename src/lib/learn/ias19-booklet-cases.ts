import {
  amendQuestion,
  type AmendInput,
  casesQuestion,
  type DcInput,
  dcQuestion,
  type GiftInput,
  giftQuestion,
  type NoteInput,
  noteQuestion,
  oltQuestion,
  type OltInput,
  shortQuestion,
  type ShortInput,
  threeQuestion,
  type LumpSettleInput,
  tierQuestion,
  type TierGrantInput,
  type ThreeInput,
  tieredQuestion,
  type TieredInput,
} from "./ias19-booklet";

/**
 * The course's booklet-level questions: the same calculations as the owner's
 * exercise booklet, on original companies and figures. Each sits at the end
 * of the lesson that teaches what it needs.
 */

export const SHORT_CASE: ShortInput = {
  company: "אופק טכנולוגיות",
  year: 2026,
  grades: [
    { name: "מנהלים", one: "מנהל", staff: 3, salary: 13_200, workDays: 22, retreat: 5, vacation: 18 },
    { name: "טכנאים", one: "טכנאי", staff: 8, salary: 9_000, workDays: 24, retreat: 4, vacation: 15 },
    { name: "מפעילים", one: "מפעיל", staff: 12, salary: 7_200, workDays: 24, retreat: 4, vacation: 13 },
  ],
  onCosts: [
    { label: "ביטוח לאומי", rate: 0.06 },
    { label: "פיצויים", rate: 0.0833 },
    { label: "פנסיה", rate: 0.065 },
  ],
  managerExtra: { label: "קרן השתלמות", rate: 0.075 },
  bonusRate: 0.08,
  retreat: { notUsed: [1, 3, 5], willUse: [1, 2, 3] },
  vacation: { carried: [3, 2, 4], expectedNow: [21, 16, 16], actual: [14, 17, 12], expectedNext: [16, "max", "max"] },
  leavers: 1,
  maternity: { count: 1, months: 3.5 },
};

export const OLT_CASE: OltInput = {
  company: "נתיב מערכות",
  year: 2026,
  rate: 0.09,
  dev: { staff: 15, salary: 144_000, growth: 0.025, serviceYears: 6, p: 0.85 },
  buy: { staff: 80, salary: 96_000, growth: 0.015, serviceYears: 5, p0: 0.9, p1: 0.85 },
  mgmt: { heads: 4, share: 0.04, threshold: 40_000_000, profits: [12_000_000, 18_000_000] },
};

export const AMEND_CASE: AmendInput = {
  company: "גבעות ייעוץ",
  year: 2026,
  since: 2024,
  start: { heads: 400, p: 0.85, remaining: 16, salary: 28_000, gov: 0.065, corp: 0.08 },
  amend: { heads: 392, p: 0.8, remaining: 15.5, salary: 31_000, gov: 0.06, corp: 0.075 },
  end: { heads: 380, p: 0.82, remaining: 15, salary: 30_000, gov: 0.055, corp: 0.07 },
  oldRate: 0.045,
  newRate: 0.055,
  month: 8,
  payment: { amount: 40_000, month: 3 },
};

export const GIFT_CASE: GiftInput = {
  company: "מתכת הצפון",
  year: 2026,
  since: 2024,
  tiers: [
    { name: "שעון יוקרה", window: 10, rule: "למי שהשלים לפחות 10 שנות ותק במועד הזכאות" },
    { name: "שעון קלאסי", window: 5, rule: "למי שהשלים בין 5 ל-10 שנות ותק במועד הזכאות" },
  ],
  start: [
    { heads: 24, remaining: 12, cost: 24_000 },
    { heads: 72, remaining: 6, cost: 10_000 },
  ],
  end: [
    { heads: 22, remaining: 11, cost: 26_000 },
    { heads: 66, remaining: 5, cost: 10_500 },
  ],
  totals: { start: 112, end: 104, notExpected: 16 },
  iStart: 0.075,
  iEnd: 0.08,
  govStart: 0.06,
  govEnd: 0.065,
  deposit: { amount: 450_000, month: 4 },
  fvEnd: 380_000,
  dc: { name: "שעון לכולם", share: 0.006, payment: 126_000, giftValue: 3_500, heads: 140 },
};

export const THREE_CASE: ThreeInput = {
  company: "אריג אופנה",
  years: [2025, 2026],
  sales: {
    staff: 40,
    opening: 2_800_000,
    assetsOpening: 2_100_000,
    y1: { rate: 0.034, service: 560_000, paid: 290_000, deposits: 180_000, paidFromAssets: 60_000, assetsClosing: 2_300_000, closing: 3_250_000 },
    y2: { rate: 0.03, service: 620_000, pn: 260_000, deposits: 230_000, paidFromAssets: 55_000, assetsClosing: 2_600_000, closing: 3_400_000 },
  },
  production: { staff: 25, hired: 2023, salary: 10_200, raise: 0.035 },
  ceo: { hired: 2024, term: 15, salary: 46_000, firstRaise: 0.03, raise: 0.035, multiple: 1.4, newMultiple: 1.6, month: 7, rates: [0.034, 0.03, 0.032, 0.033], gov: [0.016, 0.013, 0.015, 0.016] },
};

export const TIERED_CASE: TieredInput = {
  company: "אור לבית",
  founded: 2022,
  years: [2026, 2027],
  prod: {
    low: 1_800,
    first: 2_400,
    next: 12_000,
    cap: 60_000,
    groups: [
      { heads: 6, hired: 2022, ends: 2035 },
      { heads: 8, hired: 2023, ends: 2030 },
      { heads: 10, hired: 2025, ends: 2030 },
      { heads: 5, hired: 2026, ends: 2029 },
    ],
    extra: 18_000,
    extraAfter: 7,
    month: 3,
  },
  mkt: {
    grant: 25_000,
    years: 15,
    age: 50,
    groups: [
      { heads: 3, age: 45, hired: 2023, ends: 2030 },
      { heads: 4, age: 35, hired: 2023, ends: 2031 },
      { heads: 30, age: 24, ageTo: 28, hired: 2024, ends: 2043, leave: 3 },
    ],
  },
  rate: 0.08,
  rateDec: 0.075,
};

export const CASES_CASE: LumpSettleInput = {
  lump: { company: "שחר אנרגיה", hired: 2024, age: 37, retireAge: 64, window: 10, grant: 130_000, newGrant: 220_000, rates: [0.055, 0.045, 0.065, 0.075], deposit1: 2_400, fv1: 2_150, deposit2: 3_600, fv2: 3_050 },
  settle: { company: "גל משחקים", hired: 2021, salary: 12_000, raise: 0.06, share: 0.015, rate: 0.09, newRate: 0.07, expected: [5, 6], pay: 650 },
};

export const TIER_CASE: TierGrantInput & { company: string } = { company: "מגדל שמירה", salary: 14_000, raise: 0.06, served: 3, remaining: 7.5, low: 0.06, high: 0.09, threshold: 10, rate: 0.046, year: 2025 };

export const DC_CASE: DcInput = {
  company: "קו ייצור",
  years: [2025, 2026],
  production: { staff: 18, hired: 2024, salary: 9_800, raise: 0.03 },
  insurer: { share: 0.005, payroll: [21_600_000, 22_400_000] },
  guaranteed: { rate: 0.03 },
};

export const NOTE_CASE: NoteInput = {
  company: "יהלום תעשיות",
  year: 2026,
  hired: 2016,
  term: 22,
  rate: 0.045,
  grades: [
    { name: "דרג א׳", heads: 30, salary: 16_000, raise: 0.03, retired0: 8 },
    { name: "דרג ב׳", heads: 90, salary: 13_000, raise: 0.02, retired0: 12 },
    { name: "דרג ג׳", heads: 200, salary: 9_500, raise: 0.01, retired0: 25 },
  ],
  addA: 0.12,
  retireC: 20,
  deposit: 0.94,
  fromAssets: 0.85,
  assetsOpening0: 28_100,
  assetsPn0: 150,
  assetsPn1: 380,
};

/** The questions, by the lesson they close. */
export const BK_SHORT = shortQuestion("bk-short", "שאלה מסכמת: ארבע הטבות לזמן קצר בחברה אחת", SHORT_CASE);
export const BK_OLT = oltQuestion("bk-olt", "שאלה מסכמת: שלוש תוכניות לזמן ארוך", OLT_CASE);
export const BK_AMEND = amendQuestion("bk-amend", "שאלה מסכמת: מענק שהשתפר באמצע השנה", AMEND_CASE);
export const BK_GIFT = giftQuestion("bk-gift", "שאלה מסכמת: חשבון נאמנות ותקרת הנכס", GIFT_CASE);
export const BK_THREE = threeQuestion("bk-three", "שאלה מסכמת: שלושה הסכמים והצגה בדוחות", THREE_CASE);
export const BK_TIERED = tieredQuestion("bk-tiered", "שאלה מסכמת: מענק מדורג, ומענק בשתי דרכים", TIERED_CASE);
export const BK_CASES = casesQuestion("bk-cases", "שאלה מסכמת: תיקון עם נכסי תכנית, וסילוק", CASES_CASE);
export const BK_TIER = tierQuestion("bk-tier", "שאלה מסכמת: מענק מדורג בנקודת זמן", TIER_CASE);
export const BK_DC = dcQuestion("bk-dc", "שאלה מסכמת: שלושה הסדרי פרישה", DC_CASE);
export const BK_NOTE = noteQuestion("bk-note", "שאלה ברמת מבחן: מה הביאור מסתיר", NOTE_CASE);

export const BOOKLET = [BK_SHORT, BK_DC, BK_TIER, BK_AMEND, BK_TIERED, BK_GIFT, BK_CASES, BK_THREE, BK_OLT, BK_NOTE];
