/**
 * The closed site's gate: who may open which address. Pure, so it is tested
 * and shared — the proxy decides every request with it, and the menus and pages
 * use the same course mapping.
 *
 * - A guest sees only the sign-in pages (and the legal pages they agree to).
 * - A signed-in account the admin hasn't approved sees only the waiting page.
 * - An approved account sees its own courses — their pages, lessons, tools and
 *   exam mode — its course list and its profile. Nothing else on the site.
 * - An admin sees everything.
 */

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type GateState =
  | { signedIn: false }
  | { signedIn: true; admin: boolean; status: ApprovalStatus; courses: readonly string[] };

export type GateDecision =
  /** Go ahead. */
  | { kind: "allow" }
  /** Not signed in: to sign-in, then back here. */
  | { kind: "login" }
  /** Signed in, not approved (yet): to the waiting page. */
  | { kind: "pending" }
  /** Approved, but this isn't theirs: to their courses, with a notice. */
  | { kind: "denied" }
  /** A general page (home, dashboard, map) or a sign-in page while signed in: to where this account belongs. */
  | { kind: "home"; to: string };

/** The waiting page, and an approved account's own course list. */
export const PENDING_PATH = "/pending";
export const MY_COURSES_PATH = "/my-courses";

/** Open to everyone, signed in or not. */
const PUBLIC_EXACT = new Set(["/login", "/register", "/forgot-password", "/reset-password", "/terms", "/privacy", "/accessibility", "/robots.txt", "/sitemap.xml"]);
/**
 * Endpoints that carry their own check or none is needed: sign-in callbacks, the
 * payment provider's webhook (signed), the scheduler's reminders (a secret) and
 * their unsubscribe link (a token), the hidden-pages list the proxy itself reads,
 * and the write-only page-view counter.
 */
const PUBLIC_PREFIX = ["/auth", "/api/billing/webhook", "/api/reminders", "/api/visibility", "/api/track"];
/** Sign-in pages a signed-in account has no use for. */
const GUEST_ONLY = new Set(["/login", "/register", "/forgot-password"]);
/** General pages that lead an account to where it belongs instead of refusing it. */
const HOME_LIKE = new Set(["/", "/dashboard", "/learn"]);
/**
 * What every approved account may open besides its courses. /tester is the feedback form for
 * course testers: the page itself shows it only to an account an admin marked as one.
 */
const APPROVED_EXTRA = new Set([MY_COURSES_PATH, "/profile", "/tester"]);

/** The catalog's courses: their id, their page, and the slug prefix of their lessons (/study/<prefix>-…). */
export const COURSE_ROUTES: readonly { id: string; href: string; lessonPrefix: string }[] = [
  { id: "basics", href: "/basics", lessonPrefix: "basics" },
  { id: "inventory", href: "/basics/inventory", lessonPrefix: "inventory" },
  { id: "ias16", href: "/basics/ias16", lessonPrefix: "ias16" },
  { id: "ias19", href: "/basics/ias19", lessonPrefix: "ias19" },
  { id: "ifrs16", href: "/basics/ifrs16", lessonPrefix: "ifrs16" },
  { id: "consolidated", href: "/basics/consolidated", lessonPrefix: "consolidated" },
];

const normalize = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname) || "/";

/**
 * The course an address belongs to, or null: a course's page, one of its
 * lessons, or its exam mode. Every other address belongs to no course.
 */
export function courseOfPath(pathname: string): string | null {
  const path = normalize(pathname);
  const lesson = /^\/study\/([a-z0-9]+)-[a-z0-9-]+$/.exec(path);
  if (lesson) return COURSE_ROUTES.find((c) => c.lessonPrefix === lesson[1])?.id ?? null;
  const exam = /^\/exam-mode\/([a-z0-9-]+)$/.exec(path);
  if (exam) return COURSE_ROUTES.some((c) => c.id === exam[1]) ? exam[1] : null;
  return COURSE_ROUTES.find((c) => c.href === path)?.id ?? null;
}

export const isPublicPath = (pathname: string) => {
  const path = normalize(pathname);
  return PUBLIC_EXACT.has(path) || PUBLIC_PREFIX.some((p) => path === p || path.startsWith(`${p}/`));
};

/** Where a signed-in account lands: the admin's dashboard, the waiting page, or its courses. */
export function homeFor(state: GateState) {
  if (!state.signedIn) return "/login";
  if (state.admin) return "/admin";
  return state.status === "approved" ? MY_COURSES_PATH : PENDING_PATH;
}

/** Whether this account may open this course. */
export const mayOpenCourse = (state: GateState, courseId: string) =>
  state.signedIn && (state.admin || (state.status === "approved" && state.courses.includes(courseId)));

/** The decision for one request's path. */
export function decide(pathname: string, state: GateState): GateDecision {
  const path = normalize(pathname);

  if (!state.signedIn) return isPublicPath(path) ? { kind: "allow" } : { kind: "login" };

  if (GUEST_ONLY.has(path)) return { kind: "home", to: homeFor(state) };
  if (state.admin) return { kind: "allow" };
  if (isPublicPath(path)) return { kind: "allow" };

  if (state.status !== "approved") return path === PENDING_PATH ? { kind: "allow" } : { kind: "pending" };

  if (path === PENDING_PATH || HOME_LIKE.has(path)) return { kind: "home", to: MY_COURSES_PATH };
  if (APPROVED_EXTRA.has(path)) return { kind: "allow" };
  const course = courseOfPath(path);
  if (course && state.courses.includes(course)) return { kind: "allow" };
  return { kind: "denied" };
}
