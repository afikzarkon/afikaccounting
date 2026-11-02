/**
 * The parts of pages the admin can hide that have no address of their own:
 * the home page's sections and the site's main buttons (which can also be
 * renamed). Each has its key and its own text; the pages read them from here,
 * and so does the admin's list.
 */

export const HOME_SECTIONS = [
  { key: "home:pains", label: "״מכירים את זה?״ — שלוש הבעיות" },
  { key: "home:how", label: "״איך לומדים כאן״ — שלושת הצעדים וצילומי המסך" },
  { key: "home:free-course", label: "הקורס החינמי ושיעוריו" },
  { key: "home:courses", label: "הקורסים המתקדמים" },
  { key: "home:exams", label: "מתחם המבחנים (״השלב הבא״)" },
  { key: "home:pricing", label: "המחירים" },
  { key: "home:faq", label: "שאלות נפוצות" },
  { key: "home:final", label: "הקריאה לפעולה בתחתית הדף" },
] as const;

export const BUTTONS = {
  heroStart: { key: "cta:hero-start", label: "התחילו את שיעור 1", where: "דף הבית, בראש הדף" },
  heroTour: { key: "cta:hero-tour", label: "מה יש בקורס", where: "דף הבית, בראש הדף" },
  freeCourse: { key: "cta:home-free-course", label: "לדף הקורס", where: "דף הבית, ליד הקורס החינמי" },
  freeCourseStart: { key: "cta:home-free-start", label: "התחילו את שיעור 1", where: "דף הבית, מתחת לשיעורי הקורס החינמי" },
  pricingCompare: { key: "cta:home-pricing", label: "להשוואה המלאה", where: "דף הבית, ליד המחירים" },
  finalStart: { key: "cta:home-final", label: "התחילו את שיעור 1", where: "דף הבית, בתחתית" },
  headerLogin: { key: "cta:header-login", label: "התחברות", where: "הכותרת העליונה, לאורחים" },
  headerStart: { key: "cta:header-start", label: "התחילו בחינם", where: "הכותרת העליונה, לאורחים" },
  headerUpgrade: { key: "cta:header-upgrade", label: "שדרוג", where: "הכותרת העליונה, למחוברים במסלול החינמי" },
} as const;

export type ButtonId = keyof typeof BUTTONS;

export const planKey = (tier: string) => `plan:${tier}`;
