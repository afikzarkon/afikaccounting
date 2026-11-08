import { ENGINE_HUB, ENGINE_TOOLS, EXAMS_HUB, LEARN_HUB, LEARNING_PATH, LEARNING_TOOLS, PRICING_HUB } from "./catalog";
import type { Tier } from "./pricing";
import { type Visibility, isLinkHidden } from "./visibility/rules";

/** A top-level link; `tier` gives it that plan's colour (the exams area is gold). */
export type NavLink = { href: string; label: string; tier?: Tier };
/** One link inside a menu group; the menu prints a heading wherever `section` changes, and a plan's tag beside a link with `tier`. */
export type NavEntry = NavLink & { section: string; description?: string };
/** A top-level category: its pages open in a panel, with a link to the category's own page at the bottom. */
export type NavGroup = { label: string; hub: NavLink; items: NavEntry[] };
export type NavItem = NavLink | NavGroup;

// The menu is built from the catalog, around the courses: the free one first, then the advanced ones; then the tools, the videos and the plans.
const learnItems: NavEntry[] = LEARNING_PATH.flatMap((stage) =>
  stage.topics.flatMap((t) =>
    t.pages
      ? t.pages.map((p) => ({ section: `שלב ${stage.step} · ${t.standard} ${t.title}`, href: p.href, label: p.label, description: p.description, tier: t.tier }))
      : [{ section: `שלב ${stage.step} · ${stage.title}`, href: t.href, label: t.standard ? `${t.title} (${t.standard})` : t.title, description: t.covers.slice(0, 4).join(" · "), tier: t.tier }],
  ),
);

// Spaced review sits with the courses: it is their questions, back on their day.
learnItems.push({ section: "חזרה", href: "/review", label: "החזרה שלי", description: "שאלות שטעיתם בהן, חוזרות בזמן הנכון", tier: "free" });

const toolItems: NavEntry[] = [
  { section: "מנוע הפתרונות — לתרחישים מקצועיים", href: ENGINE_HUB.href, label: "כל מחשבוני המנוע", description: "תרחיש שלב אחר שלב, עם פקודות יומן ובאור" },
  ...ENGINE_TOOLS.map((c) => ({ section: "מנוע הפתרונות — לתרחישים מקצועיים", href: c.href, label: `${c.standard} · ${c.label}`, description: c.description })),
  ...LEARNING_TOOLS.map((c) => ({ section: "מחשבונים לימודיים — עם הדרך המלאה", href: c.href, label: c.label, description: c.topic })),
];

export const site = {
  name: "AfikAccounting",
  tagline: "חשבונאות מאפס ועד המבחן",
  description:
    "סיכום אומר מה כתוב בתקן — כאן רואים איפה מפסידים נקודות. שאלות ברמת מבחן במלאי, ברכוש קבוע ובהטבות עובד, מלכודות עם הסבר וחזרה על הטעויות שלכם. ולמתחילים: קורס חשבונאות מאפס, חינם כולו.",
  nav: [
    { label: "קורסים", hub: { href: LEARN_HUB.href, label: "למפת הלימוד המלאה" }, items: learnItems },
    { ...EXAMS_HUB, tier: "exams" },
    { label: "כלים", hub: { href: ENGINE_HUB.href, label: "למנוע הפתרונות" }, items: toolItems },
    PRICING_HUB,
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
    if (!items.length && !shown(item.hub.href)) return [];
    return [{ ...item, items, hub: shown(item.hub.href) ? item.hub : (items[0] ?? item.hub) }];
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
