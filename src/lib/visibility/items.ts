/**
 * The parts of pages the admin can hide that have no address of their own:
 * the home page's sections and the site's main buttons (which can also be
 * renamed). Each has its key and its own text; the pages read them from here,
 * and so does the admin's list.
 */

export const HOME_SECTIONS = [
  { key: "home:how", label: "״איך לומדים כאן״ — שלושת הצעדים וצילומי המסך" },
  { key: "home:courses", label: "הקורסים (החינמי והמתקדמים)" },
  { key: "home:check", label: "״יש לכם סיכום? תבדקו אותו״" },
  { key: "home:faq", label: "שאלות נפוצות" },
  { key: "home:final", label: "הקריאה לפעולה בתחתית הדף" },
] as const;

export const BUTTONS = {
  heroStart: { key: "cta:hero-start", label: "מתחילים מאפס — שיעור 1", where: "דף הבית, בראש הדף" },
  heroTour: { key: "cta:hero-tour", label: "יש לי מבחן — לבחור נושא", where: "דף הבית, בראש הדף" },
  finalStart: { key: "cta:home-final", label: "התחילו את שיעור 1", where: "דף הבית, בתחתית" },
  headerLogin: { key: "cta:header-login", label: "התחברות", where: "הכותרת העליונה, לאורחים" },
  headerStart: { key: "cta:header-start", label: "התחילו בחינם", where: "הכותרת העליונה, לאורחים" },
  headerUpgrade: { key: "cta:header-upgrade", label: "שדרוג", where: "הכותרת העליונה, למחוברים במסלול החינמי" },
} as const;

export type ButtonId = keyof typeof BUTTONS;

export const planKey = (tier: string) => `plan:${tier}`;
