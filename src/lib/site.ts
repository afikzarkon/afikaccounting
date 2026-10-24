import { ENGINE_HUB, ENGINE_TOOLS, LEARN_HUB, LEARNING_PATH, LEARNING_TOOLS } from "./catalog";

export type NavLink = { href: string; label: string };
/** One link inside a menu group; the menu prints a heading wherever `section` changes. */
export type NavEntry = NavLink & { section: string; description?: string };
/** A top-level category: its pages open in a panel, with a link to the category's own page at the bottom. */
export type NavGroup = { label: string; hub: NavLink; items: NavEntry[] };
export type NavItem = NavLink | NavGroup;

// The menu is built from the catalog: by what you came to do — learn, calculate, watch.
const learnItems: NavEntry[] = LEARNING_PATH.flatMap((stage) =>
  stage.topics.flatMap((t) =>
    t.pages
      ? t.pages.map((p) => ({ section: `שלב ${stage.step} · ${t.standard} ${t.title}`, href: p.href, label: p.label, description: p.description }))
      : [{ section: `שלב ${stage.step} · ${stage.title}`, href: t.href, label: t.standard ? `${t.title} (${t.standard})` : t.title, description: t.covers.slice(0, 4).join(" · ") }],
  ),
);

const toolItems: NavEntry[] = [
  { section: "מנוע הפתרונות — לתרחישים מקצועיים", href: ENGINE_HUB.href, label: "כל מחשבוני המנוע", description: "תרחיש שלב אחר שלב, עם פקודות יומן ובאור" },
  ...ENGINE_TOOLS.map((c) => ({ section: "מנוע הפתרונות — לתרחישים מקצועיים", href: c.href, label: `${c.standard} · ${c.label}`, description: c.description })),
  ...LEARNING_TOOLS.map((c) => ({ section: "מחשבונים לימודיים — עם הדרך המלאה", href: c.href, label: c.label, description: c.topic })),
];

export const site = {
  name: "AfikAccounting",
  tagline: "מנוע החשבונאות והכספים של הדור הבא",
  description:
    "פתרונות חשבונאיים מבוססי תקינה — פקודות יומן, לוחות סילוקין ובאורים — לצד שיעורי וידאו של מומחים ב-IFRS ובמיסוי ישראלי.",
  nav: [
    { href: "/", label: "ראשי" },
    { label: "לימוד", hub: { href: LEARN_HUB.href, label: "למפת הלימוד המלאה" }, items: learnItems },
    { label: "מחשבונים", hub: { href: ENGINE_HUB.href, label: "למנוע הפתרונות" }, items: toolItems },
    { href: "/content", label: "וידאו ומאמרים" },
    { href: "/about", label: "אודות" },
  ] satisfies NavItem[] as NavItem[],
};
