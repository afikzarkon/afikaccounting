import type { StudyModule } from "../../types";
import { OVEN, OVEN_ANNUAL } from "../bakery";
import { depEntryQ } from "../depreciation";
import { MACHINE, machineQuestions } from "../intro";
import { calc, choice, COURSE, COURSE_HREF, fmt, journal } from "../shared";

const Q = machineQuestions(MACHINE);
/** Two sheets read backwards: the cost from the accumulated depreciation, and from the amortised cost. */
export const BACK_ACCUM = { accumulated: 54_000, years: 3, life: 10 };
export const BACK_CARRYING = { carrying: 60_000, years: 4, life: 10 };
const backAccumCost = (BACK_ACCUM.accumulated / BACK_ACCUM.years) * BACK_ACCUM.life;
const backCarryingCost = (BACK_CARRYING.carrying * BACK_CARRYING.life) / (BACK_CARRYING.life - BACK_CARRYING.years);
/** The oven at the end of its third year. */
const OVEN_YEARS = 3;

/** Lesson 3: the four words — cost, depreciation expense, accumulated depreciation, amortised cost — the entry, and the sheet that carries them. */
export const TABLE: StudyModule = {
  slug: "ias16-table",
  course: COURSE,
  n: 3,
  title: "ארבע המילים, פקודת הפחת והטבלה",
  description: "עלות, הוצאות פחת, פחת נצבר ועלות מופחתת — מה שייך לשנה ומה מצטבר; פקודת הפחת; והטבלה שכל שאלת רכוש קבוע נפתרת בה: שורה לכל שנה.",
  goal: "להכיר את ארבעת המספרים של כל נכס, לרשום את פקודת הפחת ולבנות את טבלת הנכס שנה אחר שנה.",
  outcomes: [
    "להסביר מה זה הוצאות פחת, פחת נצבר ועלות מופחתת — ומה שייך לשנה ומה מצטבר",
    "לרשום את פקודת הפחת בסוף השנה",
    "לבנות טבלה של נכס: עלות, הוצאות פחת, פחת נצבר ועלות מופחתת לכל שנה",
    "להציג את הנכס במאזן ואת הפחת ברווח והפסד",
    "לחלץ את עלות הנכס מתוך פחת נצבר או עלות מופחתת שנתונים",
  ],
  backHref: COURSE_HREF,
  screens: [
    { id: "ppe-four-words", title: "ארבע מילים: מה שייך לשנה ומה מצטבר" },
    { id: "ppe-dep-entry", title: "פקודת הפחת: הוצאות פחת ופחת נצבר" },
    { id: "ppe-table", title: "הטבלה: שורה לכל שנה" },
    { id: "concepts", title: "ציר אחד: מהעלות ועד ערך הגרט" },
    { id: "ppe-bs-view", title: "איך זה נראה בדוחות" },
  ],
  exercises: [
    choice(
      "year-or-total",
      "שנה או מצטבר",
      "איזה מהמספרים הבאים שייך לשנה אחת בלבד, ומתחיל כל שנה מאפס?",
      ["הוצאות פחת", "פחת נצבר", "עלות מופחתת", "עלות"],
      0,
      "הוצאות פחת הן חשבון תוצאתי — רק הפחת של השנה. פחת נצבר ועלות מופחתת מצטברים מאז הקנייה, והעלות לא משתנה.",
    ),
    journal(
      "first-dep",
      "פחת ראשון",
      "מכונה בעלות 48,000 ₪ תשמש 4 שנים, בלי ערך גרט, בקו ישר, מתחילת השנה. רשמו את פקודת הפחת בסוף השנה.",
      [
        { account: "הוצאות פחת", dr: 12_000 },
        { account: "פחת נצבר", cr: 12_000 },
      ],
      "48,000 ÷ 4 = 12,000 ₪: החלק של המכונה שנצרך השנה עובר להוצאות; הפחת הנצבר מקטין את הנכס במאזן.",
      ["הוצאות פחת", "פחת נצבר", "מכונה", "מזומן"],
    ),
    depEntryQ({ cost: 120_000, salvage: 20_000, life: 5 }),
    Q["annual-dep"],
    Q.carrying,
    calc(
      "oven-accum",
      "פחת נצבר",
      `התנור של המאפייה: עלות ${fmt(OVEN.cost)} ₪, ערך גרט ${fmt(OVEN.salvage)} ₪, ${OVEN.life} שנים בקו ישר, מתחילת ${OVEN.from}. מה הפחת הנצבר ב-31.12.${OVEN.from + OVEN_YEARS - 1}?`,
      OVEN_ANNUAL * OVEN_YEARS,
      [
        `פחת שנתי: (${fmt(OVEN.cost)} − ${fmt(OVEN.salvage)}) ÷ ${OVEN.life} = ${fmt(OVEN_ANNUAL)} ₪.`,
        `עד סוף ${OVEN.from + OVEN_YEARS - 1} עברו ${OVEN_YEARS} שנים: ${fmt(OVEN_ANNUAL)} × ${OVEN_YEARS} = ${fmt(OVEN_ANNUAL * OVEN_YEARS)} ₪.`,
      ],
    ),
    calc(
      "back-from-accum",
      "מהפחת הנצבר אל העלות",
      `בסוף השנה השלישית, הפחת הנצבר של מכונה הוא ${fmt(BACK_ACCUM.accumulated)} ₪. היא מופחתת בקו ישר על ${BACK_ACCUM.life} שנים, בלי ערך גרט. מה עלות המכונה?`,
      backAccumCost,
      [
        `פחת נצבר = פחת שנתי × שנים. לכן פחת שנתי = ${fmt(BACK_ACCUM.accumulated)} ÷ ${BACK_ACCUM.years} = ${fmt(BACK_ACCUM.accumulated / BACK_ACCUM.years)} ₪.`,
        `פחת שנתי = עלות ÷ שנות חיים. לכן עלות = ${fmt(BACK_ACCUM.accumulated / BACK_ACCUM.years)} × ${BACK_ACCUM.life} = ${fmt(backAccumCost)} ₪.`,
      ],
    ),
    calc(
      "back-from-carrying",
      "מהעלות המופחתת אל העלות",
      `אחרי ${BACK_CARRYING.years} שנים מתוך ${BACK_CARRYING.life}, העלות המופחתת של מכונה היא ${fmt(BACK_CARRYING.carrying)} ₪ (קו ישר, בלי ערך גרט). מה עלות המכונה?`,
      backCarryingCost,
      [
        `אחרי ${BACK_CARRYING.years} שנים מתוך ${BACK_CARRYING.life} נשארו ${BACK_CARRYING.life - BACK_CARRYING.years} שנים — כלומר ${BACK_CARRYING.life - BACK_CARRYING.years}/${BACK_CARRYING.life} מהעלות עוד לא הופחתו.`,
        `עלות = ${fmt(BACK_CARRYING.carrying)} ÷ ${BACK_CARRYING.life - BACK_CARRYING.years}/${BACK_CARRYING.life} = ${fmt(backCarryingCost)} ₪.`,
      ],
    ),
  ],
  traps: [
    {
      id: "salvage-in-balance",
      prompt: "מכונה בעלות 130,000 ₪, ערך גרט 10,000 ₪, 3 שנות חיים בקו ישר. מה העלות המופחתת בסוף חייה?",
      options: ["10,000 ₪", "0", "130,000 ₪", "40,000 ₪"],
      answer: 0,
      why: "מפחיתים רק את הסכום בר-הפחת (120,000). ערך הגרט לא מופחת — הוא מה שנשאר בספרים בסוף.",
      traps: ["", "המלכודת: הפחתתם גם את הגרט. בסוף החיים נשאר בדיוק ערך הגרט.", "זו העלות — בלי שום פחת.", "זה הפחת השנתי, לא מה שנשאר."],
    },
    {
      id: "accum-is-expense",
      prompt: "מה זה פחת נצבר?",
      options: ["חשבון מאזני שמקטין את הנכס: כל הפחת מאז הקנייה", "הוצאה ברווח והפסד", "כסף שהחברה שומרת בצד כדי לקנות נכס חדש", "הירידה במחיר השוק של הנכס"],
      answer: 0,
      why: "פחת נצבר הוא ״נכס בניכוי״: יתרת זכות מתחת לנכס במאזן, שמצטברת משנה לשנה.",
      traps: ["", "המלכודת: ההוצאה היא ״הוצאות פחת״ — של השנה בלבד. הפחת הנצבר יושב במאזן.", "פחת לא שם כסף בצד — הוא רק מקצה את העלות לשנים.", "פחת אינו מדידה של שווי השוק, אלא הקצאה של העלות."],
    },
    {
      id: "cost-falls",
      prompt: "מכונה בעלות 80,000 ₪ מופחתת 10,000 ₪ בשנה. מה העלות שלה בספרים אחרי שנתיים?",
      options: ["80,000 ₪ — העלות לא משתנה", "60,000 ₪", "20,000 ₪", "70,000 ₪"],
      answer: 0,
      why: "העלות נשארת כפי שהייתה. מה שיורד הוא העלות המופחתת: 80,000 − 20,000 = 60,000.",
      traps: ["", "המלכודת: 60,000 היא העלות המופחתת, לא העלות. העלות לא משתנה — לידה גדל הפחת הנצבר.", "זה הפחת הנצבר.", "זו העלות המופחתת אחרי שנה אחת, וגם היא אינה העלות."],
    },
  ],
  tips: [
    "ארבע מילים: עלות (לא משתנה), הוצאות פחת (של השנה — רווח והפסד), פחת נצבר (מצטבר — מאזן), עלות מופחתת = עלות − פחת נצבר.",
    "עלות מופחתת, ערך בספרים ויתרה בספרים — שלושה שמות לאותו מספר.",
    "פקודת הפחת: ח׳ הוצאות פחת / ז׳ פחת נצבר. את חשבון הנכס עצמו לא מזכים.",
    "בטבלה: פחת נצבר של השנה = פחת נצבר של השנה הקודמת + הוצאות הפחת של השנה.",
    "בסוף החיים העלות המופחתת שווה בדיוק לערך הגרט.",
    "שאלה הפוכה: כותבים את החישוב הרגיל, ומחלצים ממנו את מה שחסר.",
  ],
};
