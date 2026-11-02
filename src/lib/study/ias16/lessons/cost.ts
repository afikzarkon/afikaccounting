import type { StudyModule } from "../../types";
import { MACHINE, machineQuestions } from "../intro";
import { calc, choice, COURSE, COURSE_HREF, fmt } from "../shared";

const Q = machineQuestions(MACHINE);

/** The cost screen's machine, line by line: what joins the cost and what is an expense. */
export const PRESS = {
  price: 400_000,
  importTax: 20_000,
  vat: 72_000,
  transport: 15_000,
  installHours: 60,
  hourly: 90,
  testing: 8_000,
  consultants: 30_000,
  consultantsInstall: 0.6,
  training: 12_000,
  launch: 9_000,
  survey: 5_000,
};
export const PRESS_IN = PRESS.price + PRESS.importTax + PRESS.transport + PRESS.installHours * PRESS.hourly + PRESS.testing + PRESS.consultants * PRESS.consultantsInstall;
export const PRESS_OUT = PRESS.training + PRESS.launch + PRESS.survey + PRESS.consultants * (1 - PRESS.consultantsInstall);
/** The building screen: price, purchase tax, legal fees, and the land inside it. */
export const SHOP = { price: 2_000_000, purchaseTax: 0.06, lawyer: 0.01, land: 0.25 };
export const SHOP_COST = SHOP.price * (1 + SHOP.purchaseTax + SHOP.lawyer);
/** Deferred payment beyond normal credit: the cost is the cash price. */
export const LATE = { cash: 180_000, paid: 200_000 };
const STAFF = { hours: 40, hourly: 75, price: 90_000 };
const SPLIT = { fee: 50_000, install: 0.7, price: 300_000 };

/** Lesson 2: what goes into the cost of an item — the rule, a machine line by line, a building, deferred payment and a self-built asset. */
export const COST: StudyModule = {
  slug: "ias16-cost",
  course: COURSE,
  n: 2,
  title: "עלות הנכס",
  description: "מה נכנס לעלות של רכוש קבוע ומה נשאר הוצאה: מכונה שורה אחר שורה, מבנה עם מס רכישה ושכר טרחה, תשלום נדחה ונכס שהחברה בונה בעצמה.",
  goal: "לבנות את עלות הנכס שורה אחר שורה, ולדעת מה נשאר הוצאה.",
  outcomes: [
    "להחליט לכל תשלום אם הוא הביא את הנכס למקומו ולמצבו — ולכן נכנס לעלות",
    "לחשב עלות של מכונה ושל מבנה, כולל מס רכישה ושכר טרחה",
    "להפריד את עלות הקרקע מעלות המבנה",
    "לטפל בתשלום נדחה ובנכס שהחברה בונה בעצמה",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-cost-rule", title: "הכלל: מה שהביא את הנכס למקומו ולמצבו" },
    { id: "ppe-cost-build", title: "מכונה, שורה אחר שורה" },
    { id: "ppe-cost-building", title: "מבנה: מס רכישה, שכר טרחה וקרקע" },
    { id: "ppe-cost-credit", title: "תשלום נדחה ונכס שבונים לבד" },
    { id: "ppe-cost-sort", title: "תרגול הבנה: בעלות או הוצאה?" },
  ],
  exercises: [
    Q["machine-cost"],
    Q["machine-buy"],
    calc(
      "own-staff",
      "שכר עובדי החברה",
      `מכונה נקנתה ב-${fmt(STAFF.price)} ₪. עובדי החברה הקדישו ${STAFF.hours} שעות להתקנתה, בשכר ${STAFF.hourly} ₪ לשעה. מהי עלות המכונה?`,
      STAFF.price + STAFF.hours * STAFF.hourly,
      ["שכר עובדים שעבדו ישירות בהתקנה הוא חלק מהבאת המכונה למצב שמיש.", `${fmt(STAFF.price)} + ${STAFF.hours} × ${STAFF.hourly} = ${fmt(STAFF.price + STAFF.hours * STAFF.hourly)} ₪.`],
    ),
    calc(
      "consultants",
      "יועצים בשני תפקידים",
      `מכונה נקנתה ב-${fmt(SPLIT.price)} ₪. יועצים קיבלו ${fmt(SPLIT.fee)} ₪: ${Math.round((1 - SPLIT.install) * 100)}% על עזרה בהחלטה איזו מכונה לקנות, ו-${Math.round(SPLIT.install * 100)}% על הרכבה והתקנה. מהי עלות המכונה?`,
      SPLIT.price + SPLIT.fee * SPLIT.install,
      [
        `החלק של ההתקנה נכנס לעלות: ${fmt(SPLIT.fee)} × ${Math.round(SPLIT.install * 100)}% = ${fmt(SPLIT.fee * SPLIT.install)} ₪.`,
        "החלק של ההחלטה — לפני שיש נכס — הוצאה.",
        `עלות: ${fmt(SPLIT.price)} + ${fmt(SPLIT.fee * SPLIT.install)} = ${fmt(SPLIT.price + SPLIT.fee * SPLIT.install)} ₪.`,
      ],
    ),
    calc(
      "shop-cost",
      "עלות מבנה",
      `חנות נקנתה ב-${fmt(SHOP.price)} ₪. שולמו גם מס רכישה ${SHOP.purchaseTax * 100}% (לא מוחזר) ושכר טרחה לעורך דין ${SHOP.lawyer * 100}% מהמחיר. מהי עלות החנות?`,
      SHOP_COST,
      [`מס רכישה ושכר טרחה הם עלויות ישירות של הרכישה: ${fmt(SHOP.price)} × ${100 + (SHOP.purchaseTax + SHOP.lawyer) * 100}% = ${fmt(SHOP_COST)} ₪.`],
    ),
    calc(
      "shop-building",
      "קרקע ומבנה",
      `עלות החנות ${fmt(SHOP_COST)} ₪, ו-${SHOP.land * 100}% ממנה מיוחסים לקרקע. מאיזה סכום יחושב הפחת?`,
      SHOP_COST * (1 - SHOP.land),
      [`לקרקע אין פחת: ${fmt(SHOP_COST)} × ${SHOP.land * 100}% = ${fmt(SHOP_COST * SHOP.land)} ₪ נשארים בלי פחת.`, `הפחת מחושב רק מהמבנה: ${fmt(SHOP_COST)} − ${fmt(SHOP_COST * SHOP.land)} = ${fmt(SHOP_COST * (1 - SHOP.land))} ₪.`],
    ),
    calc(
      "deferred",
      "תשלום נדחה",
      `מכונה שמחירה במזומן ${fmt(LATE.cash)} ₪ נקנתה בתנאי אשראי חריגים, ותשולם בעוד שנתיים: ${fmt(LATE.paid)} ₪. מהי עלות המכונה?`,
      LATE.cash,
      ["העלות היא המחיר במזומן ביום ההכרה.", `ההפרש — ${fmt(LATE.paid - LATE.cash)} ₪ — הוא מחיר הכסף: הוצאות מימון, לאורך תקופת האשראי.`],
    ),
    choice(
      "survey",
      "סקר לפני הרכישה",
      "לפני שבחרה מכונה, החברה שילמה למומחים על סקר שוק ואיתור מכונות. מה הטיפול?",
      ["הוצאה", "חלק מעלות המכונה", "חלק מעלות המכונה, רק אם בסוף קנו אותה", "נכס נפרד"],
      0,
      "הסקר קרה לפני שהיה נכס, ולא הביא אף מכונה למקומה ולמצבה — הוצאה.",
    ),
    choice(
      "testing",
      "בדיקת תקינות",
      "אחרי ההתקנה בוצעו בדיקות תקינות, כדי לוודא שהמכונה עובדת כמו שצריך. מה הטיפול?",
      ["חלק מעלות המכונה", "הוצאה", "הוצאה, אם המכונה תקינה"],
      0,
      "בדיקת תקינות היא חלק מהבאת הנכס למצב שבו הוא יכול לפעול — נכנסת לעלות.",
    ),
  ],
  traps: [
    {
      id: "training-cost",
      prompt: "מכונה עלתה 200,000 ₪, ההובלה שלה 5,000 ₪, והדרכת העובדים לתפעולה 8,000 ₪. מהי עלות המכונה?",
      options: ["205,000 ₪", "213,000 ₪", "200,000 ₪", "208,000 ₪"],
      answer: 0,
      why: "בעלות נכלל מה שנדרש כדי להביא את המכונה למקומה ולמצב שמיש: מחיר + הובלה = 205,000 ₪. ההדרכה — הוצאה.",
      traps: ["", "המלכודת: הדרכת עובדים אינה מביאה את המכונה למצב שמיש — היא הוצאה של התקופה.", "חסרה ההובלה: היא חלק מהבאת המכונה למקומה, ולכן נכללת בעלות.", "הפוך: את ההדרכה צריך להשאיר בחוץ, ואת ההובלה — להכניס."],
    },
    {
      id: "vat",
      prompt: "על מכונה ששוויה 300,000 ₪ שולמו גם מכס 15,000 ₪ (לא מוחזר) ומע״מ 54,000 ₪ (מוחזר). מהי העלות?",
      options: ["315,000 ₪", "369,000 ₪", "300,000 ₪", "354,000 ₪"],
      answer: 0,
      why: "מס שלא מוחזר — חלק מהעלות. מע״מ שמוחזר — לא עלות.",
      traps: ["", "המלכודת: הוספתם גם את המע״מ. מס שהחברה מקבלת בחזרה אינו עלות.", "חסר המכס: מס שלא מוחזר נכנס לעלות.", "הפוך: הוספתם את המע״מ והשמטתם את המכס."],
    },
    {
      id: "waste",
      prompt: "בהתאמת מכונה לצרכי החברה התבזבזו, בגלל תכנון לקוי, עבודה וחומרים ב-50,000 ₪. מה הטיפול בהם?",
      options: ["הוצאה", "חלק מעלות המכונה", "חלק מהעלות, בפריסה על חיי המכונה", "נכס נפרד"],
      answer: 0,
      why: "סכומים חריגים של חומרים ועבודה שבוזבזו לא הביאו את הנכס למצבו — הם הוצאה.",
      traps: ["", "המלכודת: ״זה קשור למכונה״. אבל בזבוז חריג לא נכלל בעלות, גם כשהוא חלק מאותו פרויקט.", "פריסה היא בדיוק מה שקורה לעלות — ובזבוז אינו עלות.", "אין כאן נכס — רק הפסד."],
    },
  ],
  tips: [
    "בעלות: מחיר (כולל מסים שלא מוחזרים, פחות הנחות) + כל מה שהביא את הנכס למקומו ולמצב שבו יפעל כפי שהתכוונה ההנהלה.",
    "נכנס: הובלה, הרכבה והתקנה, שכר עובדים שהתקינו, הכנת אתר, יועצים להתקנה, בדיקות תקינות, מס רכישה ושכר טרחה.",
    "בחוץ: הדרכת עובדים, פרסום והשקה, סקר או נסיעה לפני ההחלטה, מע״מ מוחזר, בזבוז חריג, עלויות אחרי שהנכס מוכן.",
    "תשלום נדחה בתנאים חריגים — העלות היא המחיר במזומן; ההפרש הוא מימון.",
    "לקרקע אין פחת, ואסור להפחית אותה. מבנה עם קרקע — מפרידים כבר ביום הרכישה, ומחשבים פחת רק מהעלות פחות הקרקע.",
  ],
};
