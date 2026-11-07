import type { StudyModule } from "../types";
import { findScreenIn, screenHrefIn } from "../paths";
import { AMEND } from "./lessons/amend";
import { ASSETS } from "./lessons/assets";
import { ATTRIBUTE } from "./lessons/attribute";
import { DC_LESSON } from "./lessons/dc";
import { EXAMS } from "./lessons/exams";
import { MAP } from "./lessons/map";
import { MEASURE } from "./lessons/measure";
import { OTHER } from "./lessons/other";
import { PRESENT } from "./lessons/present";
import { ROLLFORWARD } from "./lessons/rollforward";
import { SHORT } from "./lessons/short";
import { TOOLKIT } from "./lessons/toolkit";
import { withLtrFormulas } from "./ltr";
import { LESSON_N } from "./shared";

type Screen = StudyModule["screens"][number];

/** A booklet-level question that closes a lesson (its screen is in ias19-course-booklet.tsx). */
const bk = (id: string, title: string): Screen => ({ id: `emp-bk-${id}`, title });

/** Put screens in before the one with this id (a lesson's last screen, its mastery check). */
function before(screens: Screen[], id: string, add: Screen[]) {
  const at = screens.findIndex((s) => s.id === id);
  if (at < 0) throw new Error(`no screen ${id}`);
  return [...screens.slice(0, at), ...add, ...screens.slice(at)];
}

/** A screen's title, renamed. */
const retitle = (screens: Screen[], titles: Record<string, string>) => screens.map((s) => (titles[s.id] ? { ...s, title: titles[s.id] } : s));

/**
 * Two lessons of the old twelve, folded into one: the first's screens, then the
 * second's; practice, traps and tips from both. The lesson's own words (title,
 * aim, outcomes) are given here.
 */
function merge(
  a: StudyModule,
  b: StudyModule,
  own: Pick<StudyModule, "slug" | "title" | "description" | "goal" | "outcomes"> & { screens: Screen[] },
): StudyModule {
  return {
    ...a,
    ...own,
    n: LESSON_N[own.slug as keyof typeof LESSON_N],
    exercises: [...a.exercises, ...b.exercises],
    traps: [...a.traps, ...b.traps],
    tips: [...a.tips, ...b.tips],
  };
}

const at = (m: StudyModule, slug: keyof typeof LESSON_N, screens: Screen[] = m.screens): StudyModule => ({ ...m, n: LESSON_N[slug], screens });

/** Lesson 1: what IAS 19 is, its four kinds of benefit, and the finance tools every later lesson uses. */
const FOUNDATIONS = merge(MAP, TOOLKIT, {
  slug: "ias19-map",
  title: "יסודות: ארבעת סוגי ההטבות, וכלי המימון",
  description: "מה זה IAS 19, ארבעת סוגי ההטבות והעיקרון: עבודה של היום יוצרת התחייבות היום. ואז הכלים שכל שאלה בקורס צריכה: ערך נוכחי, ריבית לחלק משנה, והמעגל שבו השורה החסרה משלימה.",
  goal: "לסווג כל הטבה לאחד מארבעת הסוגים, ולחשב ערך נוכחי, ריבית לחלק משנה ושורה חסרה במעגל.",
  outcomes: [
    "להסביר למה הטבה שתשולם בעוד שנים נרשמת כבר בשנה שבה עבדו",
    "למיין הטבה בעץ החלטות של שלוש שאלות, לפי תאריכים",
    "לחשב ערך עתידי וערך נוכחי, בנוסחה ובאקסל",
    "לחשב ריבית לחלק משנה בריבית אפקטיבית",
    "למצוא את השורה החסרה במעגל",
  ],
  screens: retitle([...MAP.screens, ...TOOLKIT.screens], {
    "emp-map-master": "בדיקת שליטה: סוגי ההטבות",
    "emp-tool-hook": "חלק ב׳: למה צריך מימון בקורס על עובדים",
    "emp-tool-practice": "תרגול מסכם: כל הכלים במקרה אחד",
  }),
});

const SHORT_TERM = at(SHORT, "ias19-short", [...SHORT.screens, bk("short", "שאלה מסכמת: ארבע הטבות לזמן קצר בחברה אחת")]);

const DC = at(DC_LESSON, "ias19-dc", before(DC_LESSON.screens, "emp-dc-master", [bk("dc", "שאלה מסכמת: שלושה הסדרי פרישה")]));

/** Lesson 4: measuring a defined benefit obligation at one date, and how much of the benefit each year of service carries. */
const MEASUREMENT = merge(MEASURE, ATTRIBUTE, {
  slug: "ias19-measure",
  title: "הטבה מוגדרת 1: מדידה בנקודת זמן, ולאיזו שנה שייך כל חלק",
  description: "שיטת יחידת הזכאות הצפויה בחמישה צעדים: הטבה לשנה, שנים שעברו, עובדים צפויים, שנים עד התשלום, וריבית. ואז הייחוס: נוסחת התוכנית או קו ישר, תקרה, וזכאות בשתי דרכים.",
  goal: "למדוד התחייבות להטבה מוגדרת בתאריך אחד, כולל כשהנוסחה לא אחידה, יש תקרה, או שהזכאות מתחילה מאוחר.",
  outcomes: [
    "למדוד התחייבות בחמישה צעדים, ולבחור את שיעור ההיוון",
    "להבחין בין שנות השירות שעברו לבין n, השנים עד התשלום",
    "להחליט בין נוסחת התוכנית לקו ישר, ולקצר את החלון כשיש תקרה",
    "לייחס מענק שאפשר לזכות בו בשתי דרכים",
    "לפתור שאלת מדידה ברמת חוברת התרגילים",
  ],
  screens: before(
    retitle([...MEASURE.screens, ...ATTRIBUTE.screens], {
      "emp-measure-master": "בדיקת שליטה: חמשת הצעדים",
      "emp-attr-hook": "חלק ב׳: לאיזו שנת שירות שייך כל חלק",
      "emp-attr-master": "בדיקת שליטה, וגשר לשיעור הבא",
    }),
    "emp-attr-master",
    [bk("tier", "שאלה מסכמת: מענק מדורג בנקודת זמן")],
  ),
});

/** Lesson 5: the obligation through a year, and a year split by an amendment, a settlement or an unexpected retirement. */
const MOVEMENT = merge(ROLLFORWARD, AMEND, {
  slug: "ias19-rollforward",
  title: "הטבה מוגדרת 2: תנועה בהתחייבות, ושינוי תנאים באמצע השנה",
  description: "מעגל ההתחייבות לשנה: ריבית, שירות שוטף, תשלומים, ומדידה מחדש שמאזנת. איזו ריבית ואיזה n בכל שורה, וריבית כשמשלמים באמצע השנה. ואז שנה מפוצלת: שינוי תנאים, שירות עבר, סילוק ופרישה בלתי צפויה.",
  goal: "לבנות תנועה בהתחייבות לשנה שלמה, גם כשהתנאים משתנים באמצע השנה.",
  outcomes: [
    "לבנות את המעגל ולמצוא את המדידה מחדש כשורה המאזנת",
    "לבחור לכל שורה את הריבית ואת n הנכונים",
    "לחשב ריבית כשמשלמים באמצע השנה",
    "לפצל שנה בשינוי תנאים ולחשב עלות שירות עבר",
    "להבחין בין סילוק לבין פרישה בלתי צפויה",
    "לפתור שאלת תנועה עם שינוי תנאים ברמת חוברת התרגילים",
  ],
  screens: before(
    retitle([...ROLLFORWARD.screens, ...AMEND.screens], {
      "emp-roll-master": "בדיקת שליטה: המעגל",
      "emp-amend-hook": "חלק ב׳: המענק עולה באמצע השנה",
    }),
    "emp-amend-master",
    [bk("format", "כך כותבים תשובה: טבלת תנועה וביאורים"), bk("amend", "שאלה מסכמת: מענק שהשתפר באמצע השנה"), bk("tiered", "שאלה מסכמת: מענק מדורג, ומענק בשתי דרכים")],
  ),
});

/** Lesson 6: plan assets and the ceiling, then where every line goes in the statements and what a note hides. */
const ASSETS_PRESENT = merge(ASSETS, PRESENT, {
  slug: "ias19-assets",
  title: "הטבה מוגדרת 3: נכסי תכנית, תקרת נכס, והצגה בדוחות",
  description: "קרן נפרדת עם מעגל משלה, התחייבות נטו ותקרת נכס. ואז ההצגה: לכל שורה כתובת (רווח והפסד, OCI או מאזן), והכיוון ההפוך: מה ביאור של שנה קודמת מסתיר.",
  goal: "לבנות מעגל לנכסי התכנית, להגביל נכס בתקרה, ולהציג כל שורה בסעיף שלה בדוחות.",
  outcomes: [
    "להחליט מתי קופה היא נכסי תכנית",
    "לבנות מעגל נכסים ולהציג התחייבות נטו",
    "להגביל נכס נטו בתקרת הנכס",
    "לנתב כל שורה לרווח והפסד, ל-OCI או למאזן",
    "להשלים ביאור חלקי ולחלץ ממנו שיעורים",
    "לפתור שאלות נכסים והצגה ברמת חוברת התרגילים",
  ],
  screens: before(
    retitle([...ASSETS.screens, ...PRESENT.screens], {
      "emp-assets-master": "בדיקת שליטה: נכסים ותקרה",
      "emp-present-hook": "חלק ב׳: כל שורה לקופסה שלה",
    }),
    "emp-present-master",
    [bk("gift", "שאלה מסכמת: חשבון נאמנות ותקרת הנכס"), bk("cases", "שאלה מסכמת: תיקון עם נכסי תכנית, וסילוק"), bk("three", "שאלה מסכמת: שלושה הסכמים והצגה בדוחות")],
  ),
});

const OTHER_TERM = at(OTHER, "ias19-other", before(OTHER.screens, "emp-other-master", [bk("olt", "שאלה מסכמת: שלוש תוכניות לזמן ארוך")]));

const EXAM_LESSON = at(EXAMS, "ias19-exams", before(EXAMS.screens, "emp-exam-master", [bk("note", "שאלה 3: מה הביאור מסתיר — במתכונת מבחן")]));

/** The employee-benefits course: eight lessons, in four stages — foundations, the simple benefits, the defined benefit chain (three lessons, each leaning on the one before), and the extensions with exam-level questions. Each lesson ends with questions at the level of the owner's exercise booklet. Every formula in their practice reads left to right. */
export const IAS19_LESSONS = [FOUNDATIONS, SHORT_TERM, DC, MEASUREMENT, MOVEMENT, ASSETS_PRESENT, OTHER_TERM, EXAM_LESSON].map(withLtrFormulas);

/** The lesson and index of a concept screen of the course, by its id. */
export const findIas19Screen = (id: string) => findScreenIn(IAS19_LESSONS, id);

/** Where a concept screen of the course lives. Throws on an unknown id. */
export const ias19ScreenHref = (id: string) => screenHrefIn(IAS19_LESSONS, id);
