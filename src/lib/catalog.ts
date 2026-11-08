/**
 * The site's map: every learning page and every calculator, in one place.
 *
 * The menu, the footer, the home page and the learning map are all built from
 * these lists, so a new page added here shows up everywhere at once. Kept free
 * of engine imports, because the menu ships to the browser; a test checks the
 * engine calculators listed here against the engine's own registry.
 */

import type { Tier } from "./pricing";
import { LESSON_N as IAS19_LESSON_N } from "./study/ias19/shared";
import { LESSON_N as IFRS16_LESSON_N } from "./study/ifrs16/shared";

/** The employee-benefits course's size, from its lessons' numbering (a test checks it against the lessons) — so the menu never ships the lessons themselves. */
const IAS19_LESSON_COUNT = Object.keys(IAS19_LESSON_N).length;
const IFRS16_LESSON_COUNT = Object.keys(IFRS16_LESSON_N).length;

export type CatalogLink = { href: string; label: string; description?: string };
/** A topic's tool; `calculator` lists a tool inside a lesson among the calculators too (other tools of the page always are). */
export type ToolLink = CatalogLink & { calculator?: boolean };

export type Topic = {
  id: string;
  title: string;
  /** The standard, when the topic is one ("IAS 2"). */
  standard?: string;
  href: string;
  description: string;
  /** What is inside, in a few words each. */
  covers: string[];
  /** Sub-pages, when the topic spans several. */
  pages?: CatalogLink[];
  tools: ToolLink[];
  /** The topic's interactive lesson, when it is a single lesson (/study/[slug]); a course of lessons is its own page. */
  lesson?: string;
  /** A course of interactive lessons (/study/[slug]), or one long page of chapters. */
  format: "lessons" | "page";
  /** The plan that opens the whole topic. */
  tier: Exclude<Tier, "exams">;
  /**
   * What of a paid topic is open to everyone, as a taste: lesson slugs for a
   * course of lessons, chapter ids for a long page. Empty for a free topic.
   */
  preview: string[];
};

export type Stage = { id: string; step: number; title: string; lead: string; topics: Topic[] };

/**
 * The learning path: the free course from zero first, then the advanced
 * courses, whose first lesson or chapter is free. Each topic is one page, so
 * each is one entry in the menu.
 */
export const LEARNING_PATH: Stage[] = [
  {
    id: "foundations",
    step: 1,
    title: "חינם — חשבונאות מאפס",
    lead: "הקורס שמתחילים ממנו, פתוח לגמרי: מחובה וזכות ועד דוחות, התאמות והפסדי אשראי",
    topics: [
      {
        id: "basics",
        format: "lessons",
        title: "חשבונאות מאפס",
        href: "/basics",
        description: "8 שיעורים אינטראקטיביים, מ״מה זה בכלל חשבונאות״ דרך צ׳קים ומקדמות, שנה שלמה של פקודות, התאמות סוף שנה, מאזן בוחן ראשוני והפסדי אשראי — ועד שאלת בחינה מלאה. עם תרגול ובדיקה עצמית בכל שיעור.",
        covers: ["חובה וזכות", "פקודות יומן", "כרטיסי T", "מאזן בוחן", "דוחות כספיים", "התאמות סוף שנה", "הפסדי אשראי"],
        tools: [
          { href: "/study/basics-double-entry?screen=lab", label: "עסק שלם, פקודה אחר פקודה" },
          { href: "/study/basics-credit?screen=cl-calc", label: "מחשבון הפסדי אשראי" },
          { href: "/study/basics-final?step=2", label: "תרגול מסכם" },
        ],
        tier: "free",
        preview: [],
      },
    ],
  },
  {
    id: "advanced",
    step: 2,
    title: "קורסים מתקדמים",
    lead: "הנושאים שחוזרים בכל מבחן, עד רמת מבחן — השיעור הראשון בכל אחד פתוח בחינם",
    topics: [
      {
        id: "inventory",
        format: "lessons",
        title: "מלאי",
        standard: "IAS 2",
        href: "/basics/inventory",
        description: "12 שיעורים אינטראקטיביים, מ״מה שלא נמכר אינו הוצאה״ דרך IAS 2, עלות והנחות, FIFO וממוצעים, שווי מימוש נטו, נעלמים ושריפה וביטוח — ועד שתי שאלות ברמת מבחן, עם תרגול בכל שיעור ומחשבון.",
        covers: ["תקופתי ותמידי", "IAS 2 ומה נספר", "עלות והנחות", "FIFO", "ממוצע משוקלל", "שווי מימוש נטו", "חילוץ נעלמים", "שריפה וביטוח", "שאלות מבחן"],
        tools: [{ href: "/study/inventory-worksheet?screen=inv-calc", label: "מחשבון מלאי", calculator: true }],
        tier: "courses",
        preview: ["inventory-what"],
      },
      {
        id: "ias16",
        format: "lessons",
        title: "רכוש קבוע",
        standard: "IAS 16",
        href: "/basics/ias16",
        description: "14 שיעורים אינטראקטיביים, מ״מה הופך פריט לרכוש קבוע״ דרך עלות, שיטות פחת ופחת לפי רכיבים, מכירה, שיפוצים, החלפה והערכה מחדש — ועד שלוש שאלות ברמת מבחן, עם תרגול בכל שיעור ומחשבון לכל סוגיה.",
        covers: ["מהו רכוש קבוע", "עלות הנכס", "שיטות פחת", "רכיבים", "מכירה", "שיפוצים", "החלפה", "הערכה מחדש", "שאלות מבחן"],
        tools: [
          { href: "/study/ias16-methods?screen=depreciation", label: "סימולטור פחת", calculator: true },
          { href: "/study/ias16-renovation?screen=renovation-calculator", label: "מחשבון שיפוץ", calculator: true },
          { href: "/study/ias16-exchange?screen=exchange-calculator", label: "מחשבון החלפה", calculator: true },
          { href: "/study/ias16-revaluation?screen=revaluation-calculator", label: "מחשבון הערכה מחדש", calculator: true },
        ],
        tier: "courses",
        preview: ["ias16-intro"],
      },
      {
        id: "ias19",
        format: "lessons",
        title: "הטבות עובד",
        standard: "IAS 19",
        href: "/basics/ias19",
        description: `${IAS19_LESSON_COUNT} שיעורים אינטראקטיביים, מארבעת סוגי ההטבות וארגז הכלים — ערך נוכחי ומעגל התחייבות — דרך הטבות לזמן קצר, הפקדה מוגדרת והטבה מוגדרת לכל אורכה: מדידה, שיוך לשנים, שינוי תנאים, נכסי תכנית והצגה — ועד שאלות ברמת מבחן. כל שיעור נגמר בשאלות ברמת חוברת התרגילים.`,
        covers: [
          "ארבעת סוגי ההטבות",
          "ערך נוכחי וריבית חלקית",
          "הטבות לזמן קצר",
          "הפקדה מוגדרת מול הטבה מוגדרת",
          "מדידה בחמישה צעדים",
          "שיוך לשנות שירות",
          "מעגל ההתחייבות",
          "שירות עבר וסילוק",
          "נכסי תכנית ותקרה",
          "הטבות ארוכות ופיטורין",
          "שאלות מבחן",
        ],
        tools: [],
        tier: "courses",
        preview: ["ias19-map"],
      },
      {
        id: "ifrs16",
        format: "lessons",
        title: "חכירות",
        standard: "IFRS 16",
        href: "/basics/ifrs16",
        description: `${IFRS16_LESSON_COUNT === 1 ? "שיעור אינטראקטיבי ראשון" : `${IFRS16_LESSON_COUNT} שיעורים אינטראקטיביים`}: מתי חוזה הוא חכירה, איך מפרידים רכיבים וקובעים את תקופת החכירה, עם שאלה מסכמת ופתרון מלא בכל שיעור. שיעורים נוספים בדרך.`,
        covers: ["מתי חוזה הוא חכירה", "נכס מזוהה וזכות החלפה", "זכות לכוון את השימוש", "הפרדת רכיבים", "תקופת החכירה", "שאלות ברמת מבחן"],
        tools: [],
        tier: "courses",
        preview: ["ifrs16-what"],
      },
    ],
  },
];

/** The IAS 19 calculator has a questionnaire and a page of its own, so it isn't in the engine's registry. */
export const IAS19_CALCULATOR_SLUG = "ias-19-employee-benefits";

/** The solution engine's calculators (titles as in the engine registry). */
export const ENGINE_TOOLS: (CatalogLink & { slug: string; standard: string })[] = [
  { slug: "ifrs-16-leases", standard: "IFRS 16", href: "/engine?calc=ifrs-16-leases", label: "חכירות", description: "לוח סילוקין, נכס זכות שימוש ובאור" },
  { slug: "ias-16-property-plant-equipment", standard: "IAS 16", href: "/engine?calc=ias-16-property-plant-equipment", label: "רכוש קבוע", description: "ציר זמן מלא של נכס, עם פקודות ובאור" },
  { slug: "ias-37-provisions", standard: "IAS 37", href: "/engine?calc=ias-37-provisions", label: "הפרשות", description: "עץ ההחלטות, אומדן והיוון" },
  { slug: "corporate-tax-ias-12", standard: "IAS 12", href: "/engine?calc=corporate-tax-ias-12", label: "מס הכנסה על חברות", description: "מס שוטף, מסים נדחים והתאמה" },
  { slug: IAS19_CALCULATOR_SLUG, standard: "IAS 19", href: "/engine/ias19", label: "הטבות עובד", description: "שאלון, ופתרון מלא לכל הטבה. במסלול קורסים" },
];

/** Every calculator inside a learning page, in learning-path order. */
export const LEARNING_TOOLS: (CatalogLink & { topic: string })[] = LEARNING_PATH.flatMap((s) =>
  s.topics.flatMap((t) =>
    t.tools.filter((x) => x.calculator || !x.href.startsWith("/study/")).map(({ href, label, description }) => ({ href, label, description, topic: t.standard ? `${t.standard} · ${t.title}` : t.title })),
  ),
);

/** Every topic, in learning-path order. */
export const TOPICS: Topic[] = LEARNING_PATH.flatMap((s) => s.topics);

/** "שיעור ראשון חינם" or "פרק ראשון חינם": the free taste of a paid topic, by its format. */
export const tasteLabel = (t: Pick<Topic, "format">) => (t.format === "lessons" ? "שיעור ראשון חינם" : "פרק ראשון חינם");

/** The topic a page or a lesson's course page belongs to. */
export const topicByHref = (href: string) => TOPICS.find((t) => t.href === href);

/** Where the site starts a newcomer: the free course's first lesson, no account needed. */
export const FIRST_LESSON = "/study/basics-intro";

export const LEARN_HUB = { href: "/learn", label: "מפת הלימוד" };
/** The exams area: worked solutions to exam-level questions and past exams. Not open yet: its page says so. */
export const EXAMS_HUB = { href: "/exams", label: "מתחם מבחנים" };
export const PRICING_HUB = { href: "/pricing", label: "מחירים" };
export const ENGINE_HUB = { href: "/engine", label: "מנוע הפתרונות" };
