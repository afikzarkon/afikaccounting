/**
 * What the admin has hidden, and how a link is matched against it. Plain data
 * and pure functions: the menus (in the browser), the pages and the proxy all
 * use the same rules. The list itself is read on the server (./server.ts).
 *
 * Keys: "link:<href>" hides an address everywhere it's linked, and blocks it;
 * "home:<section>", "cta:<button>" and "plan:<tier>" hide a part of a page.
 */

export type Visibility = {
  /** Every hidden key, as stored. */
  hidden: string[];
  /**
   * The hidden addresses, expanded: a hidden course brings its lessons and its
   * tools; a hidden hub with "/*" hides everything under it (/exams/*).
   */
  links: string[];
  /** A button's text in place of its own, by key. */
  labels: Record<string, string>;
};

export const NOTHING_HIDDEN: Visibility = { hidden: [], links: [], labels: {} };

export const linkKey = (href: string) => `link:${href}`;

function split(href: string) {
  const [path, query = ""] = href.split("#")[0].split("?");
  return { path: path.replace(/\/$/, "") || "/", query: new URLSearchParams(query) };
}

/**
 * Whether an address is hidden: a hidden address with the same path whose
 * query is part of this one's ("/engine" hides "/engine?calc=x"; "/study/x"
 * hides its screens "/study/x?screen=y"), or a hidden "/exams/*" under it.
 */
export function isLinkHidden(links: readonly string[], href: string) {
  const target = split(href);
  return links.some((h) => {
    if (h.endsWith("/*")) return target.path.startsWith(h.slice(0, -1));
    const rule = split(h);
    if (rule.path !== target.path) return false;
    for (const [k, v] of rule.query) if (target.query.get(k) !== v) return false;
    return true;
  });
}

export const isHidden = (v: Visibility, key: string) => (key.startsWith("link:") ? isLinkHidden(v.links, key.slice(5)) : v.hidden.includes(key));

/** A button's text: the admin's, or its own. */
export const labelOf = (v: Visibility, key: string, fallback: string) => v.labels[key] || fallback;
