import { allocate, leaseTerm } from "../../../learn/ifrs16";
import type { StudyModule, Trap } from "../../types";
import { ask, askNumber, COURSE, COURSE_HREF, fmt } from "../shared";

/** The allocation screen's example: a coffee machine and its service, in one yearly payment. */
export const SPLIT = { total: 17_000, rent: 14_000, service: 6_000 };
export const [SPLIT_LEASE, SPLIT_SERVICE] = allocate(SPLIT.total, [SPLIT.rent, SPLIT.service]);

/**
 * The fees screen's example: a bistro's yearly bill, line by line as the contract names them.
 * The rent, the lessor's building insurance, the owner's taxes and the paperwork charge carry no
 * service of their own (B33); the "management fee" pays for cleaning and lift upkeep, a service.
 * Stand-alone prices: the floor alone, and the cleaning and upkeep alone.
 */
export const FEES = { rent: 100_000, insurance: 6_000, ownerTax: 9_000, management: 24_000, paperwork: 1_000, floorPrice: 120_000, servicePrice: 30_000, wasteYear: 7_200, months: 12 };
export const FEES_TOTAL = FEES.rent + FEES.insurance + FEES.ownerTax + FEES.management + FEES.paperwork;
export const [FEES_LEASE, FEES_SERVICE] = allocate(FEES_TOTAL, [FEES.floorPrice, FEES.servicePrice]);
/** The lessor paid the bistro's own waste-removal contract for the first year: a lease incentive, used up month by month. */
export const FEES_WASTE_MONTH = FEES.wasteYear / FEES.months;

/** The consent screen's example: a nursery's greenhouse, five years certain and three more at a rent well below market. */
export const CONSENT = { years: 5, extra: 3 };
export const CONSENT_OWN = leaseTerm({ contractYears: CONSENT.years, extendYears: CONSENT.extra, certainToExtend: true }).term;
export const CONSENT_NEEDS_OK = leaseTerm({ contractYears: CONSENT.years, extendYears: CONSENT.extra, certainToExtend: false }).term;

/** The length screen's example: a beach pitch usable only part of each year, in months. */
export const SEASON = { first: 4, later: 6 };
export const SEASON_MONTHS = SEASON.first + SEASON.later * 2;

/** The closing question: one contract, three parts, four years. */
export const MASTER = { yearly: 90_000, years: 4, forklift: 150_000, van: 90_000, service: 60_000, forkliftWithService: 210_000, optionYears: 3 };
export const MASTER_TOTAL = MASTER.yearly * MASTER.years;
export const MASTER_SHARES = allocate(MASTER_TOTAL, [MASTER.forklift, MASTER.van, MASTER.service]);
export const MASTER_YEARLY = MASTER_SHARES.map((s) => s / MASTER.years);
export const MASTER_EXPEDIENT = allocate(MASTER_TOTAL, [MASTER.forkliftWithService, MASTER.van]);
export const MASTER_EXPEDIENT_YEARLY = MASTER_EXPEDIENT.map((s) => s / MASTER.years);
export const MASTER_TERM = leaseTerm({ contractYears: MASTER.years, extendYears: MASTER.optionYears, certainToExtend: true }).term;

/** Practice figures, each from the solver. */
const A = { total: 20_000, rent: 16_000, service: 9_000 };
const A_LEASE = allocate(A.total, [A.rent, A.service])[0];
const B = { total: 33_000, rent: 24_000, service: 8_000 };
const B_LEASE = allocate(B.total, [B.rent, B.service])[0];
const C = { total: 72_000, one: 30_000, two: 50_000 };
const C_ONE = allocate(C.total, [C.one, C.two])[0];
export const FEE_Q = { rent: 60_000, insurance: 4_000, management: 18_000, paperwork: 2_000, spacePrice: 72_000, servicePrice: 24_000 };
export const FEE_Q_TOTAL = FEE_Q.rent + FEE_Q.insurance + FEE_Q.management + FEE_Q.paperwork;
export const FEE_Q_LEASE = allocate(FEE_Q_TOTAL, [FEE_Q.spacePrice, FEE_Q.servicePrice])[0];
export const CONSENT_Q = { years: 6, extra: 4 };
export const CONSENT_CHAIN = { years: 4, own: 2, needsOk: 3 };
export const CONSENT_CHAIN_TERM = leaseTerm({ contractYears: CONSENT_CHAIN.years, extendYears: CONSENT_CHAIN.own, certainToExtend: true }).term;

/** Events to sort: do they send the lessee back to reassess the term? */
export const REASSESS_ITEMS: { text: string; answer: "yes" | "no"; why: string }[] = [
  { text: "החוכר ביצע בנכס שיפוץ גדול שלא נחזה, ויהיה לו ערך רב כשהאופציה תהיה ניתנת למימוש.", answer: "yes", why: "אירוע משמעותי בשליטת החוכר שמשפיע על ההחלטה (ב41(א))." },
  { text: "מחירי השכירות בשוק עלו ב-30%, ועכשיו האופציה שלו זולה בהרבה מהשוק.", answer: "no", why: "שינוי בשוק אינו בשליטת החוכר, ולכן הוא לבדו לא מחייב הערכה מחדש (סעיף 20(א))." },
  { text: "החוכר החכיר את הנכס בחכירת משנה לתקופה שעוברת את סוף תקופת החכירה שקבע.", answer: "yes", why: "זו דוגמה מפורשת בתקן (ב41(ג))." },
  { text: "החוכר החליט למכור את היחידה העסקית שמשתמשת בנכס.", answer: "yes", why: "החלטה עסקית בשליטתו, שרלוונטית במישרין למימוש האופציה (ב41(ד))." },
  { text: "מתחרה פתח מפעל ברחוב הסמוך, והביקוש של החוכר ירד.", answer: "no", why: "האירוע לא בשליטת החוכר." },
  { text: "החוכר מימש בפועל אופציית הארכה שלא נכללה בתקופה.", answer: "yes", why: "כאן התקופה שאינה ניתנת לביטול השתנתה, ולכן מעדכנים את התקופה (סעיף 21(א))." },
];
export const REASSESS_OPTIONS: [string, string][] = [
  ["yes", "בודקים מחדש"],
  ["no", "לא בודקים"],
];

const exercises = [
  ask({
    id: "one-part",
    skill: "רכיבים",
    prompt: "חברה חוכרת מכונת חיתוך ואת המנגנון שבלעדיו המכונה לא פועלת, ושלא קונים או חוכרים אותו בנפרד. כמה רכיבי חכירה יש?",
    options: ["אחד", "שניים, כי יש שני פריטים", "אפס, כי זה ציוד", "תלוי בשווי של כל פריט"],
    answer: 0,
    why: "לפי ב32 נכס הוא רכיב נפרד רק אם אפשר להפיק ממנו הטבה לבד או עם משאבים זמינים, והוא לא תלוי במידה רבה בנכסים האחרים בחוזה. המנגנון והמכונה תלויים זה בזה.",
    trap: "לספור פריטים. סופרים זכויות שאפשר להפיק מהן תועלת בנפרד.",
    level: 1,
    source: "מקורית",
    ref: "ב32",
  }),
  askNumber({
    id: "split-lease",
    skill: "הקצאה",
    prompt: `חוזה שנתי של ${fmt(A.total)} ש״ח כולל חכירת מכונה ושירות תחזוקה. בשוק: חכירה בלי שירות ${fmt(A.rent)} ש״ח, ושירות לבדו ${fmt(A.service)} ש״ח. החברה מפרידה רכיבים. מהו תשלום החכירה לשנה?`,
    answer: A_LEASE,
    steps: [`התשלום מתחלק לפי מחירים נפרדים (סעיף 13), ולא לפי מה שכתוב בחוזה.\nתשלום החכירה = סך התשלום × מחיר החכירה ÷ סך המחירים\n${fmt(A.total)} × ${fmt(A.rent)} ÷ ${fmt(A.rent + A.service)} = ${fmt(A_LEASE)}`, `באקסל: =${A.total}*${A.rent}/(${A.rent}+${A.service})`],
    trap: "להוריד את מחיר השירות מהתשלום. היחס קובע, ולכן ההנחה מתחלקת בין הרכיבים.",
    level: 2,
    source: "מקורית",
    ref: "סעיפים 13–14",
  }),
  askNumber({
    id: "expedient-lease",
    skill: "הקלה",
    prompt: `חוזה שנתי של ${fmt(A.total)} ש״ח כולל חכירת מכונה ושירות תחזוקה. בשוק: חכירה בלי שירות ${fmt(A.rent)} ש״ח, ושירות לבדו ${fmt(A.service)} ש״ח. החוכר בחר בהקלה של סעיף 15 לקבוצת הנכסים הזו. מהו תשלום החכירה לשנה?`,
    answer: A.total,
    steps: [`עם ההקלה לא מפרידים: החכירה והשירות הם רכיב חכירה אחד, ולכן כל התשלום הוא תשלום חכירה.\nתשלום החכירה = ${fmt(A.total)}`],
    trap: "לחשב יחס גם כשבחרו בהקלה. היחס נדרש רק כשמפרידים.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 15",
  }),
  ask({
    id: "lessor-split",
    skill: "הקלה",
    prompt: "מחכיר של מכונות כולל בחוזה גם שירות תחזוקה. האם הוא יכול לבחור בהקלה ולטפל בהכול כרכיב אחד?",
    options: ["לא. ההקלה של סעיף 15 היא לחוכר בלבד", "כן, לפי קבוצות נכסים", "כן, לכל חוזה בנפרד", "רק אם גם החוכר בחר בהקלה"],
    answer: 0,
    why: "סעיף 15 מדבר על חוכר. המחכיר מקצה את התמורה לפי IFRS 15 (סעיף 17).",
    trap: "להניח ששני הצדדים פועלים באותה דרך.",
    level: 1,
    source: "מקורית",
    ref: "סעיפים 15, 17",
  }),
  askNumber({
    id: "admin-fee",
    skill: "הקצאה",
    prompt: `חוזה שנתי של ${fmt(B.total)} ש״ח כולל חכירת מכונה, שירות תחזוקה, ו-1,000 ש״ח ״דמי ניהול״ על הטיפול של המחכיר בניירת. הניירת לא מעבירה ללקוח שום שירות. מחירים נפרדים: חכירה ${fmt(B.rent)} ש״ח, ושירות ${fmt(B.service)} ש״ח. החברה מפרידה רכיבים. מהו תשלום החכירה לשנה?`,
    answer: B_LEASE,
    steps: [`דמי הניהול אינם רכיב (ב33). הם חלק מהתמורה שמתחלקת בין הרכיבים האמיתיים.\nתשלום החכירה = סך התשלום × מחיר החכירה ÷ סך המחירים\n${fmt(B.total)} × ${fmt(B.rent)} ÷ ${fmt(B.rent + B.service)} = ${fmt(B_LEASE)}`, `באקסל: =${B.total}*${B.rent}/(${B.rent}+${B.service})`],
    trap: "להוציא את דמי הניהול מהחישוב. הם נשארים בתמורה שמחלקים.",
    level: 2,
    source: "מקורית",
    ref: "ב33",
  }),
  askNumber({
    id: "fee-names",
    skill: "שמות של תשלומים",
    prompt: `חוזה שנתי של ${fmt(FEE_Q.rent + FEE_Q.insurance + FEE_Q.management + FEE_Q.paperwork)} ש״ח על שטח בקניון. בחוזה ארבע שורות: ״דמי שכירות״ ${fmt(FEE_Q.rent)} ש״ח, ״ביטוח המבנה״ ${fmt(FEE_Q.insurance)} ש״ח, שהמחכיר עורך על הבניין שלו, ״דמי ניהול״ ${fmt(FEE_Q.management)} ש״ח, שמממנים שומר בכניסה וניקיון יומי של השטח, ו״דמי טיפול״ ${fmt(FEE_Q.paperwork)} ש״ח על הניירת של המחכיר. מחירים נפרדים: השטח לבדו ${fmt(FEE_Q.spacePrice)} ש״ח, ושמירה וניקיון ${fmt(FEE_Q.servicePrice)} ש״ח. החברה מפרידה רכיבים. מהו תשלום החכירה לשנה?`,
    answer: FEE_Q_LEASE,
    steps: [
      `קודם ממיינים לפי מה שהכסף קונה, ולא לפי השם. הביטוח של המחכיר ודמי הטיפול לא נותנים לחוכר שום דבר משלהם, ולכן הם חלק מהתמורה שמחלקים (ב33). ״דמי הניהול״ קונים שמירה וניקיון, שהם רכיב שאינו חכירה (סעיף 12).`,
      `כל ${fmt(FEE_Q_TOTAL)} מתחלקים לפי מחירים נפרדים (סעיף 13).\nתשלום החכירה = סך התשלום × מחיר השטח ÷ סך המחירים\n${fmt(FEE_Q_TOTAL)} × ${fmt(FEE_Q.spacePrice)} ÷ ${fmt(FEE_Q.spacePrice + FEE_Q.servicePrice)} = ${fmt(FEE_Q_LEASE)}`,
      `באקסל: =${FEE_Q_TOTAL}*${FEE_Q.spacePrice}/(${FEE_Q.spacePrice}+${FEE_Q.servicePrice})`,
    ],
    trap: "לקחת רק את השורה ״דמי שכירות״, או להוציא את הביטוח ודמי הטיפול מהחישוב. הם נשארים בסכום שמחלקים, ו״דמי הניהול״ הם שירות.",
    level: 3,
    source: "מקורית",
    ref: "סעיפים 12, 13, ב33",
  }),
  ask({
    id: "fee-service",
    skill: "שמות של תשלומים",
    prompt: "בחוזה חכירה של קומת משרדים יש שורה בשם ״דמי ניהול״. הכסף משמש לניקיון הלובי ולתחזוקה של המעליות. מה זה?",
    options: ["רכיב שאינו חכירה, כי הוא קונה שירות", "חלק מהתמורה שמחלקים, כמו כל תשלום שנקרא דמי ניהול", "תשלום חכירה, כי הוא משולם למחכיר", "הוצאה שלא קשורה לחוזה"],
    answer: 0,
    why: "מה שקובע הוא מה החוכר מקבל תמורת הכסף. ניקיון ותחזוקה הם שירות, ולכן רכיב שאינו חכירה (סעיף 12). רק תשלום שלא מעביר לחוכר סחורה או שירות נשאר בתמורה בלי רכיב משלו (ב33).",
    trap: "להחליט לפי השם. ״דמי ניהול״ יכולים להיות שירות של ממש, או סתם ניירת של המחכיר.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 12, ב33",
  }),
  ask({
    id: "fee-incentive",
    skill: "תמריץ",
    prompt: "לפי חוזה החכירה, מאפייה חייבת להחזיק חוזה שנתי להדברה, על חשבונה. המחכיר שילם במקומה את חוזה ההדברה לשנה הראשונה. איך המאפייה מטפלת בזה?",
    options: ["כתמריץ חכירה: עלות נכס זכות השימוש קטנה, וכנגד נרשמות הוצאות מראש שהופכות להוצאה במשך השנה", "כתשלום חכירה נוסף שמגדיל את ההתחייבות", "כהכנסה ביום שהמחכיר שילם", "לא רושמים כלום, כי המאפייה לא שילמה"],
    answer: 0,
    why: "המחכיר לקח על עצמו עלות של החוכר, וזה תמריץ חכירה לפי ההגדרה (נספח א׳). התמריץ מקטין את עלות הנכס (סעיף 24(ב)). המאפייה עדיין צורכת הדברה, ולכן היא רושמת הוצאות מראש, והן הופכות להוצאה בחודשים שהחוזה מכסה.",
    trap: "לא לרשום כלום. אז הנכס גבוה מדי, ושנה שלמה של הדברה לא מופיעה כהוצאה.",
    level: 2,
    source: "הרצאה",
    ref: "נספח א׳ (תמריצי חכירה), סעיף 24(ב)",
  }),
  askNumber({
    id: "two-leases",
    skill: "הקצאה",
    prompt: `חוזה אחד של ${fmt(C.total)} ש״ח לשנה נותן זכות להשתמש בקומת משרדים וגם בחניון נפרד, שאפשר לוותר עליו בלי שזה ישפיע על המשרדים. בחוזה נכתב ש-40,000 ש״ח הם לחניון. מחירים נפרדים בשוק: חניון ${fmt(C.one)} ש״ח, משרדים ${fmt(C.two)} ש״ח. מהו התשלום השנתי המיוחס לחניון?`,
    answer: C_ONE,
    steps: [`אלה שני רכיבי חכירה (ב32). מקצים לפי מחירים נפרדים, בלי קשר למה שכתוב בחוזה.\nתשלום לחניון = סך התשלום × מחיר החניון ÷ סך המחירים\n${fmt(C.total)} × ${fmt(C.one)} ÷ ${fmt(C.one + C.two)} = ${fmt(C_ONE)}`, `באקסל: =${C.total}*${C.one}/(${C.one}+${C.two})`],
    trap: "לקחת את הסכום מהחוזה. התקן מחייב לפי מחירים נפרדים.",
    level: 2,
    source: "מקורית",
    ref: "סעיף 13",
  }),
  ask({
    id: "combine",
    skill: "שילוב חוזים",
    prompt: "חברה חתמה ביום אחד על שני חוזים מול מחכיר אחד: חכירת מחסן, וחכירת משאית שמחירה תלוי בכך שהחברה תחכור את המחסן. מה עושים?",
    options: ["מטפלים בהם כחוזה אחד", "תמיד מטפלים בכל חוזה בנפרד", "מחברים רק אם הם חולקים את אותו נכס", "מחברים רק אם נחתמו על אותו מסמך"],
    answer: 0,
    why: "לפי ב2 חוזים באותו מועד עם אותו צד משולבים אם מתקיים אחד התנאים. כאן התמורה בחוזה אחד תלויה בחוזה השני (ב2(ב)).",
    trap: "לחשוב שצריך את כל שלושת התנאים. די באחד.",
    level: 2,
    source: "מקורית",
    ref: "ב2",
  }),
  askNumber({
    id: "option-no",
    skill: "תקופת חכירה",
    prompt: "סטודיו חכר אולם ל-7 שנים שאינן ניתנות לביטול, עם אופציה להאריך ב-2 שנים במחיר השוק שיהיה אז. הוא השקיע בבידוד אקוסטי יקר, אבל הבידוד יתיישן לגמרי עד סוף שנה 7. יש הרבה אולמות דומים בעיר. מהי תקופת החכירה בשנים?",
    answer: 7,
    steps: ["שיפורים הם סימן רק אם יהיה להם ערך כשאפשר יהיה לממש את האופציה (ב37(ב)). כאן בסוף שנה 7 לא יישאר מהם כלום, המחיר הוא מחיר שוק ויש חלופות. אין תמריץ כלכלי, ולכן לא ודאי באופן סביר שהאופציה תמומש.\nתקופת החכירה = 7 שנים"],
    trap: "להוסיף את האופציה רק כי החוכר השקיע. בודקים מה ההשקעה תהיה שווה ביום שאפשר לממש.",
    level: 1,
    source: "מקורית",
    ref: "סעיף 18, ב37",
  }),
  askNumber({
    id: "option-yes",
    skill: "תקופת חכירה",
    prompt: "מרפאה חכרה קומה ל-7 שנים שאינן ניתנות לביטול, עם אופציה להאריך ב-2 שנים במחיר השוק שיהיה אז. היא בנתה בקומה חדר רנטגן ממוגן שיהיה שווה הרבה בסוף שנה 7, וייאבד אם תעזוב. מעבר למקום אחר ידרוש גם רישוי מחדש של כמה חודשים. מהי תקופת החכירה בשנים?",
    answer: 9,
    steps: ["שני סימנים פועלים יחד: שיפורים שיהיה להם ערך ביום המימוש (ב37(ב)), ועלויות עזיבה (ב37(ג)). גם במחיר שוק יש תמריץ כלכלי חזק להישאר, ולכן ודאי באופן סביר שהאופציה תמומש.\nתקופת החכירה = 7 + 2 = 9 שנים"],
    trap: "להסיק ממחיר השוק שהאופציה לא נספרת. המחיר הוא רק אחד הסימנים.",
    level: 2,
    source: "מקורית",
    ref: "ב37(ב), ב37(ג)",
  }),
  askNumber({
    id: "free-months",
    skill: "תקופת חכירה",
    prompt: "החוזה נחתם ב-1.11, והחנות נמסרה לחוכר ב-1.1 של השנה שאחריה. 6 החודשים הראשונים מרגע המסירה הם בחינם, ואחריהם 5 שנים בתשלום. מהי תקופת החכירה בחודשים?",
    answer: 66,
    steps: ["התקופה מתחילה במועד התחילה, כשהנכס זמין לחוכר, ולא ביום החתימה. היא כוללת גם חודשים בלי תשלום (ב36).\nתקופת החכירה = 6 + 5 × 12 = 66 חודשים"],
    trap: "לא לספור חודשים חינם, או לספור מיום החתימה.",
    level: 2,
    source: "מקורית",
    ref: "ב36",
  }),
  askNumber({
    id: "seasonal",
    skill: "תקופת חכירה",
    prompt: "חברת הפקות חתמה ל-7 שנים שאינן ניתנות לביטול על שטח לפסטיבל, אבל בכל שנה יש לה זכות להשתמש בו רק 3 שבועות. מהי תקופת החכירה בשבועות?",
    answer: 21,
    steps: ["נספר רק הזמן שבו יש לחברה זכות להשתמש בנכס.\nתקופת החכירה = 7 × 3 = 21 שבועות"],
    trap: "לספור את כל 7 השנים. בשאר הזמן אין לה זכות שימוש.",
    level: 2,
    source: "מקורית",
    ref: "נספח א׳ (תקופת חכירה)",
  }),
  askNumber({
    id: "lessor-break",
    skill: "מי יכול לבטל",
    prompt: "חוזה ל-7 שנים. רק למחכיר יש זכות לבטל אחרי 3 שנים. מהי תקופת החכירה בשנים?",
    answer: 7,
    steps: ["זכות ביטול שרק למחכיר לא מקצרת את התקופה: התקופה שאינה ניתנת לביטול כוללת אותה (ב35).\nתקופת החכירה = 7 שנים"],
    trap: "לקצר ל-3 שנים. החוכר לא שולט בביטול הזה, ולכן לא מתחשבים בו.",
    level: 2,
    source: "מקורית",
    ref: "ב35",
  }),
  askNumber({
    id: "both-break",
    skill: "מי יכול לבטל",
    prompt: "חוזה ל-5 שנים. אחרי השנה השנייה כל אחד מהצדדים יכול לבטל בלי רשות מהאחר, בקנס לא משמעותי. מהי תקופת החכירה בשנים?",
    answer: 2,
    steps: ["כששני הצדדים יכולים לבטל בלי יותר מקנס לא משמעותי, החוזה כבר לא ניתן לאכיפה (ב34).\nתקופת החכירה = 2 שנים"],
    trap: "לחפש אם החוכר מתכוון להישאר. אחרי השנה השנייה אין חוזה שאפשר לאכוף.",
    level: 3,
    source: "מקורית",
    ref: "ב34",
  }),
  askNumber({
    id: "consent-term",
    skill: "של מי האופציה",
    prompt: `חברת שילוח חכרה מחסן ל-${CONSENT_Q.years} שנים שאינן ניתנות לביטול. בחוזה יש הארכה ב-${CONSENT_Q.extra} שנים בדמי שכירות נמוכים בהרבה מהשוק, אבל ההארכה טעונה אישור של המחכיר, והוא רשאי לסרב בלי לתת סיבה. מהי תקופת החכירה בשנים?`,
    answer: CONSENT_Q.years,
    steps: [`סעיף 18 מוסיף תקופה של אופציה רק אם ודאי באופן סביר שהחוכר יממש אותה. כאן ההחלטה לא בידיו: אחרי שנה ${CONSENT_Q.years} אף צד לא יכול לחייב את השני להמשיך, ולכן החוזה לא ניתן לאכיפה לשנים האלה (ב34). המחיר הנמוך לא משנה את זה.\nתקופת החכירה = ${CONSENT_Q.years} שנים`],
    trap: `להוסיף את ${CONSENT_Q.extra} השנים בגלל המחיר הנמוך. תמריץ כלכלי בודקים רק באופציה שהחוכר יכול לממש לבד.`,
    level: 2,
    source: "מקורית",
    ref: "סעיף 18, ב34–ב35",
  }),
  askNumber({
    id: "consent-chain",
    skill: "של מי האופציה",
    prompt: `חוזה ל-${CONSENT_CHAIN.years} שנים שאינן ניתנות לביטול. לחוכר לבדו יש אופציה להאריך ב-${CONSENT_CHAIN.own} שנים, בדמי שכירות נמוכים בהרבה מהשוק. אחריהן אפשר להאריך ב-${CONSENT_CHAIN.needsOk} שנים נוספות במחיר נמוך דומה, אבל רק אם המחכיר יאשר. מהי תקופת החכירה בשנים?`,
    answer: CONSENT_CHAIN_TERM,
    steps: [`בודקים כל אופציה לחוד. ההארכה הראשונה היא של החוכר לבדו, והמחיר הנמוך הוא תמריץ כלכלי, ולכן היא נספרת (סעיף 18(א), ב37(א)). ההארכה השנייה תלויה באישור המחכיר, ולכן היא לא אופציה של החוכר ולא נספרת, גם במחיר נמוך.\nתקופת החכירה = ${CONSENT_CHAIN.years} + ${CONSENT_CHAIN.own} = ${CONSENT_CHAIN_TERM} שנים`],
    trap: `לספור ${CONSENT_CHAIN.years + CONSENT_CHAIN.own + CONSENT_CHAIN.needsOk} שנים כי שתי ההארכות זולות, או ${CONSENT_CHAIN.years} כי ״יש בחוזה צורך באישור״. האישור נוגע רק להארכה השנייה.`,
    level: 3,
    source: "מקורית",
    ref: "סעיף 18, ב34–ב35, ב37",
  }),
  askNumber({
    id: "both-options",
    skill: "תקופת חכירה",
    prompt: "חוזה ל-10 שנים, ולחוכר אופציה לבטל אחרי 6 שנים. בנוסף יש אופציה להאריך ב-4 שנים אחרי השנה ה-10, במחיר השוק. בעשר השנים הקרובות הנכס חיוני לפעילות, ואחר כך יהיו לו חלופות מתאימות. החוכר ישקיע בו בשיפורים שיחזיקו עד השנה ה-10 ויתיישנו לגמרי בסופה. לכן ודאי באופן סביר שלא יבטל, ואין סיבה מיוחדת להאריך. מהי תקופת החכירה בשנים?",
    answer: 10,
    steps: ["בודקים כל אופציה בנפרד. ודאי באופן סביר שהביטול לא ימומש, ולכן נספרות גם השנים 7 עד 10 (סעיף 18(ב)). ההארכה במחיר שוק לא ודאית, ולכן לא נספרת (סעיף 18(א)).\nתקופת החכירה = 6 + 4 = 10 שנים"],
    trap: "לערבב בין שתי האופציות: 4 השנים כאן הן השנים שמעבר לביטול, ולא שנות ההארכה.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 18",
  }),
  ask({
    id: "sublet-beyond",
    skill: "הערכה מחדש",
    prompt: "חוכר קבע תקופה של 5 שנים ולא כלל אופציית הארכה של 2 שנים. בתום השנה השלישית הוא החכיר את הנכס בחכירת משנה ל-4 שנים. מה קורה?",
    options: ["חכירת המשנה עוברת את סוף התקופה, ולכן הוא בודק מחדש אם ההארכה ודאית", "כלום, התקופה נקבעה במועד התחילה", "התקופה מתקצרת ל-3 שנים", "הוא בודק מחדש רק אם המחכיר מסכים"],
    answer: 0,
    why: "סעיף 20 וב41(ג): זה אירוע משמעותי בשליטת החוכר. חכירת המשנה מסתיימת אחרי 7 שנים, והיא משפיעה על ההחלטה לממש את ההארכה.",
    trap: "לחשוב שהתקופה קפואה. חוכר בודק מחדש כשאירוע בשליטתו משנה את התמונה.",
    level: 3,
    source: "מקורית",
    ref: "סעיף 20, ב41(ג)",
  }),
];

const traps: Trap[] = [
  {
    id: "contract-says",
    prompt: "בחוזה כתוב: ״החכירה 9,000 ש״ח, התחזוקה 1,000 ש״ח״. בשוק התחזוקה עולה 3,000 ש״ח והחכירה 9,000 ש״ח. החברה מפרידה. לפי מה מקצים?",
    options: ["לפי המחירים הנפרדים בשוק", "לפי מה שכתוב בחוזה", "חצי חצי", "לפי מה שהמחכיר מציג בדוחות שלו"],
    answer: 0,
    why: "סעיף 13: לפי מחירים נפרדים יחסיים. החלוקה בחוזה לא קובעת, כי הצדדים יכולים לכתוב בה מה שנוח להם.",
    traps: ["", "המלכודת: לסמוך על החלוקה הכתובה. היא לא משקפת בהכרח את המחירים.", "אין בסיס לחלוקה שווה.", "החוכר מקצה לפי מחירים נפרדים, לא לפי הדוחות של המחכיר."],
  },
  {
    id: "intent",
    prompt: "המנכ״ל אומר: ״כנראה נאריך, אבל נראה מה יהיה״. אין שיפורים, האופציה במחיר שוק, ויש הרבה נכסים חלופיים. האם האופציה נכללת בתקופה?",
    options: ["לא. אין תמריץ כלכלי, וכוונה לבדה לא מספיקה", "כן. ההנהלה רוצה להאריך", "כן. כל אופציה נכללת", "רק אם המחכיר מסכים"],
    answer: 0,
    why: "סעיף 19: בוחנים עובדות ונסיבות שיוצרות תמריץ כלכלי. כאן אין כאלה.",
    traps: ["", "המלכודת: ״כנראה״ אינו ״ודאי באופן סביר״, ומחפשים תמריץ כלכלי.", "נכללות רק אופציות ודאיות באופן סביר.", "כאן החוכר מממש לבד, בלי אישור של המחכיר, ולכן השאלה היא רק אם יש תמריץ. אילו ההארכה הייתה טעונה אישור של המחכיר, היא לא הייתה נכנסת לתקופה בכלל."],
  },
  {
    id: "short-period",
    prompt: "חוכר רשאי להאריך חוזה קצר של שנה אחת, והמעבר לנכס אחר יקר ומסובך. מה נכון לגבי תקופה קצרה שאינה ניתנת לביטול?",
    options: ["ככל שהיא קצרה יותר, סביר יותר שיאריך", "ככל שהיא קצרה יותר, סביר פחות שיאריך", "אורך התקופה לא רלוונטי", "תקופה קצרה מבטלת אופציות"],
    answer: 0,
    why: "ב39: עלויות השגת נכס חלופי גבוהות יחסית כשהתקופה קצרה, ולכן סביר יותר שיאריך.",
    traps: ["", "הכיוון הפוך: תקופה קצרה מגדילה את התמריץ להישאר.", "התקן מתייחס לכך במפורש.", "האופציה נשארת, ועוד מקבלת משקל."],
  },
  {
    id: "signing-day",
    prompt: "חוזה נחתם ב-1.3. החוכר יכול להיכנס לנכס רק מ-1.7, ל-3 שנים. ממתי סופרים את התקופה?",
    options: ["מ-1.7, מועד התחילה", "מ-1.3, יום החתימה", "מיום התשלום הראשון", "מתחילת השנה הקלנדרית"],
    answer: 0,
    why: "ב36: התקופה מתחילה במועד התחילה, שבו המחכיר הופך את הנכס לזמין לשימוש.",
    traps: ["", "יום החתימה הוא לרוב מועד ההתקשרות, שבו בודקים אם יש חכירה. לא ממנו סופרים.", "התשלום לא קובע את התחלת התקופה.", "השנה הקלנדרית לא משנה."],
  },
];

/** The screen that teaches what each question asks; a test checks that it comes before the question. */
export const TERM_TAUGHT: Record<string, string> = {
  "one-part": "ls-term-parts",
  "split-lease": "ls-term-split",
  "expedient-lease": "ls-term-relief",
  "lessor-split": "ls-term-relief",
  "admin-fee": "ls-term-split",
  "fee-names": "ls-term-fees",
  "fee-service": "ls-term-fees",
  "fee-incentive": "ls-term-fees",
  "consent-term": "ls-term-consent",
  "consent-chain": "ls-term-consent",
  "two-leases": "ls-term-parts",
  combine: "ls-term-combine",
  "option-no": "ls-term-options",
  "option-yes": "ls-term-options",
  "free-months": "ls-term-start",
  seasonal: "ls-term-length",
  "lessor-break": "ls-term-who",
  "both-break": "ls-term-who",
  "both-options": "ls-term-lab",
  "sublet-beyond": "ls-term-reassess",
  "contract-says": "ls-term-split",
  intent: "ls-term-options",
  "short-period": "ls-term-options",
  "signing-day": "ls-term-start",
};

/** Lesson 2: what the contract holds, and for how long. Only splitting the payment and counting years: measuring comes next. */
export const TERM: StudyModule = {
  slug: "ifrs16-term",
  course: COURSE,
  n: 2,
  title: "מה בחוזה ולכמה זמן: רכיבים ותקופת חכירה",
  description: "לפני שמחשבים משהו צריך לדעת איזה חלק מהתשלום הוא בכלל על חכירה, ולכמה שנים. מחלקים את התשלום לפי מחירים נפרדים, וקובעים את התקופה לפי האופציות, לפי מי שיכול לבטל, ועם התקופות בחינם.",
  goal: "לחלק תשלום בין רכיבי החוזה, ולקבוע את תקופת החכירה של כל חוזה.",
  outcomes: [
    "לזהות כמה רכיבים יש בחוזה, ולהקצות את התשלום לפי מחירים נפרדים",
    "להשתמש בהקלה לחוכר, ולהסביר מה היא משנה",
    "להחליט מתי משלבים כמה חוזים לחוזה אחד",
    "לקבוע את תקופת החכירה עם אופציות להארכה ולביטול",
    "להכריע מי יכול לבטל ומה זה עושה לתקופה, ומתי הארכה בכלל שייכת לחוכר",
    "למיין תשלומים לפי מה שהם קונים, גם כשהשם שלהם מטעה",
    "לזהות אירועים שמחייבים לבדוק מחדש את התקופה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ls-term-hook", title: "שני נתונים לפני כל חישוב" },
    { id: "ls-term-parts", title: "כמה רכיבים יש בחוזה" },
    { id: "ls-term-split", title: "חלוקת התשלום: מחירים נפרדים" },
    { id: "ls-term-relief", title: "ההקלה: לא להפריד" },
    { id: "ls-term-fees", title: "מה שם התשלום לא אומר" },
    { id: "ls-term-combine", title: "כמה חוזים, או חוזה אחד" },
    { id: "ls-term-length", title: "תקופת החכירה: איך בונים אותה" },
    { id: "ls-term-start", title: "מאיזה יום סופרים" },
    { id: "ls-term-options", title: "אופציות: ודאי באופן סביר" },
    { id: "ls-term-who", title: "מי יכול לבטל" },
    { id: "ls-term-consent", title: "הארכה שצריכה את אישור המחכיר" },
    { id: "ls-term-lab", title: "בונים תקופת חכירה" },
    { id: "ls-term-reassess", title: "מתי בודקים מחדש" },
    { id: "ls-term-mistake", title: "מצאו את הטעות" },
    { id: "ls-term-master", title: "שאלה מסכמת: חוזה עם שלושה חלקים" },
  ],
  exercises,
  traps,
  tips: [
    "לפני כל חישוב: מה בתשלום הוא חכירה, ולכמה זמן.",
    "מקצים לפי מחירים נפרדים יחסיים, לא לפי מה שכתוב בחוזה, ולא בהפחתה של מחיר השירות.",
    "ההקלה בסעיף 15 היא לחוכר בלבד, לפי קבוצת נכסים. בלי הפרדה, כל התשלום הוא תשלום חכירה.",
    "ממיינים תשלום לפי מה שהוא קונה, לא לפי השם. ביטוח ומיסים של המחכיר על הבניין שלו וניירת שלו אינם רכיב: הם חלק מהתמורה שמחלקים. ״דמי ניהול״ שמממנים ניקיון ותחזוקה הם שירות.",
    "המחכיר שילם הוצאה שהחוכר חייב בה? זה תמריץ חכירה, והוא מקטין את עלות הנכס.",
    "תקופת החכירה = התקופה שאינה ניתנת לביטול, ועוד הארכה שוודאי שתמומש, ועוד שנים אחרי ביטול שוודאי שלא ימומש.",
    "מחפשים תמריץ כלכלי, כמו מחיר נמוך מהשוק, שיפורים, עלויות מעבר וחשיבות הנכס. כוונה לבדה לא מספיקה.",
    "ביטול שרק לחוכר הוא אופציה. ביטול שרק למחכיר לא נספר. אם לשניהם יש זכות בלי קנס משמעותי, שם התקופה נגמרת.",
    "הארכה שטעונה אישור של המחכיר אינה אופציה של החוכר, ולא נספרת גם כשהמחיר נמוך מהשוק.",
    "סופרים ממועד התחילה, גם חודשים בחינם.",
    "בודקים מחדש רק באירוע בשליטת החוכר, או כשהתקופה שאינה ניתנת לביטול השתנתה בפועל.",
  ],
};
