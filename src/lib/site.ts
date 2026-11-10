import { ENGINE_HUB, EXAMS_HUB, FIRST_LESSON, LEARN_HUB, LEARNING_PATH, LEARNING_TOOLS, PRICING_HUB } from "./catalog";
import type { Tier } from "./pricing";
import { type Visibility, isLinkHidden } from "./visibility/rules";

/**
 * A top-level link; `tier` gives it that plan's colour (the exams area is gold).
 * `when: "review"` shows it only to a reader who has something to review (the menu checks it in the browser).
 */
export type NavLink = { href: string; label: string; tier?: Tier; when?: "review" };
/** One link inside a menu group; the menu prints a heading wherever `section` changes, the standard as a chip, and `tag` as a green "free" pill. */
export type NavEntry = NavLink & { section: string; description?: string; standard?: string; tag?: string };
/** The menu's one highlighted card: the free course, with its own button. */
export type NavFeatured = NavEntry & { cta: NavLink };
/**
 * A top-level category: its pages open in a panel, with the category's own page at the bottom.
 * `featured` opens the panel with a card; `extra` adds links beside the hub; `note` is one quiet line under the list.
 */
export type NavGroup = { label: string; hub: NavLink; items: NavEntry[]; featured?: NavFeatured; extra?: NavLink[]; note?: string };
export type NavItem = NavLink | NavGroup;

const topics = LEARNING_PATH.flatMap((stage) => stage.topics);
const free = topics.find((t) => t.tier === "free");

// The courses menu opens on the free course, then one row per advanced course, each saying its size and that lesson 1 is free.
// No lock at this level: the gate is on a course's lessons, so that's where the lock shows.
const learnItems: NavEntry[] = topics
  .filter((t) => t !== free)
  .map((t) => ({ section: "לפי נושא במבחן", href: t.href, label: t.title, standard: t.standard, tag: "שיעור 1 חינם", description: [`${t.lessons} שיעורים`, ...t.covers.slice(0, 3)].join(" · "), tier: t.tier }));

const featured: NavFeatured | undefined = free && {
  section: "מתחילים כאן",
  href: free.href,
  label: free.title,
  tag: "חינם כולו",
  description: free.covers.slice(0, 4).join(", "),
  tier: free.tier,
  cta: { href: FIRST_LESSON, label: "להתחיל משיעור 1" },
};

// The learning calculators get a menu of their own, by standard; the professional solution engine is its hub. Locks once, in a note, not on every row.
const calculatorItems: NavEntry[] = LEARNING_TOOLS.map((c) => ({ section: "מחשבונים לימודיים, עם הדרך המלאה", href: c.href, label: c.label, standard: c.topic.split(" · ")[0], description: c.description, tier: c.tier }));

export const site = {
  name: "AfikAccounting",
  tagline: "חשבונאות מאפס ועד המבחן",
  description:
    "הבנתם בהרצאה ונתקעתם בשיעורי הבית? כאן לומדים חשבונאות פיננסית שלב אחרי שלב, ובכל שאלה רואים מיד אם צדקתם, עם הסבר ברמה של הקורס: מלאי, רכוש קבוע, הטבות עובד וחכירות. ולמתחילים, קורס חשבונאות מאפס, חינם כולו.",
  nav: [
    { label: "קורסים", hub: { href: LEARN_HUB.href, label: "למפת הלימוד המלאה" }, featured, items: learnItems, extra: [{ href: "/review", label: "החזרה שלי" }] },
    { label: "מחשבונים", hub: { href: ENGINE_HUB.href, label: "מנוע הפתרונות: לתרחישים מקצועיים" }, items: calculatorItems, note: "גישה מלאה בתוכנית" },
    { href: "/review", label: "חזרה", when: "review" },
    PRICING_HUB,
    { ...EXAMS_HUB, tier: "exams" },
  ] satisfies NavItem[] as NavItem[],
};

/**
 * The menu without what the admin hid: hidden links drop out, a category
 * keeps its hub only while the hub is shown, and an emptied category goes.
 */
export function navFor(v: Visibility): NavItem[] {
  const shown = (href: string) => !isLinkHidden(v.links, href);
  return site.nav.flatMap((item): NavItem[] => {
    if (!("items" in item)) return shown(item.href) ? [item] : [];
    const items = item.items.filter((i) => shown(i.href));
    const feat = item.featured && shown(item.featured.href) ? item.featured : undefined;
    if (!items.length && !feat && !shown(item.hub.href)) return [];
    return [{ ...item, items, featured: feat, extra: item.extra?.filter((l) => shown(l.href)), hub: shown(item.hub.href) ? item.hub : (items[0] ?? feat ?? item.hub) }];
  });
}

/**
 * A page's own share card: its title and line, over the site's card image. A page that sets
 * `openGraph` replaces the root's whole object (the image and site name too), so pages spread this.
 */
export const shareCard = (title: string, description: string) => ({
  type: "website" as const,
  locale: "he_IL",
  siteName: site.name,
  title,
  description,
  images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: `${site.name} — ${title}` }],
});
