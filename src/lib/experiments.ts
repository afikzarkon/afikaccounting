/**
 * A/B experiments: the registry, and the pure rules the proxy and the dashboard
 * share. A visitor is put in one variant on their first visit to the page under
 * test, kept in a cookie (so they see the same version every time), and the
 * proxy serves that variant's prerendered page at the same address. The page
 * records an `experiment_view` with the variant; /admin/funnel compares them.
 *
 * Kept free of other imports: the proxy runs it on every request.
 */
export type Experiment = {
  id: string;
  /** What it tests, for the dashboard. */
  title: string;
  /** The page under test. */
  path: string;
  /** The first is the control (the page as it is); the others are served from /x/<id>/<variant>. */
  variants: { id: string; label: string; weight: number }[];
  /** Off: everyone gets the control, and only ?ab=<id>:<variant> shows a variant (for previewing). Turn on at launch. */
  active: boolean;
};

export const EXPERIMENTS: Experiment[] = [
  {
    id: "hero",
    title: "כותרת דף הבית",
    path: "/",
    variants: [
      { id: "control", label: "״הבנתם בהרצאה, ונתקעתם בשיעורי הבית? כאן בודקים כל תשובה מיד.״", weight: 1 },
      { id: "doors", label: "״מתחילים חשבונאות — או שהמבחן כבר קרוב?״ (שתי דלתות)", weight: 1 },
    ],
    active: false,
  },
];

export const cookieOf = (id: string) => `ab_${id}`;
export const experimentFor = (path: string) => EXPERIMENTS.find((e) => e.path === path);
const hasVariant = (e: Experiment, v: string | undefined): v is string => !!v && e.variants.some((x) => x.id === v);

/** A variant by weight, from a number in [0, 1). */
export function pickVariant(e: Experiment, r: number): string {
  const total = e.variants.reduce((a, v) => a + v.weight, 0);
  let x = r * total;
  for (const v of e.variants) {
    if (x < v.weight) return v.id;
    x -= v.weight;
  }
  return e.variants[e.variants.length - 1].id;
}

/**
 * Which variant a request gets, and whether to store it: a preview (?ab=hero:doors) wins and is stored;
 * then the visitor's cookie; then, while the experiment runs, a fresh pick. Off, it is the control and nothing is stored.
 */
export function assign(e: Experiment, cookie: string | undefined, search: string, r: number): { variant: string; store: boolean } {
  const preview = new URLSearchParams(search).get("ab");
  if (preview) {
    const [id, v] = preview.split(":");
    if (id === e.id && hasVariant(e, v)) return { variant: v, store: true };
  }
  if (hasVariant(e, cookie)) return { variant: cookie, store: false };
  if (!e.active) return { variant: e.variants[0].id, store: false };
  return { variant: pickVariant(e, r), store: true };
}

/**
 * Whether a variant's rate differs from the control's beyond chance: a two-sided two-proportion z-test.
 * Returns the lift (relative), z, and p; nothing below 30 per arm, where the test isn't meaningful.
 */
export function compare(control: { n: number; x: number }, variant: { n: number; x: number }) {
  if (control.n < 30 || variant.n < 30) return null;
  const p1 = control.x / control.n;
  const p2 = variant.x / variant.n;
  const p = (control.x + variant.x) / (control.n + variant.n);
  const se = Math.sqrt(p * (1 - p) * (1 / control.n + 1 / variant.n));
  if (!se) return null;
  const z = (p2 - p1) / se;
  return { lift: p1 ? (p2 - p1) / p1 : null, z, p: 2 * (1 - normalCdf(Math.abs(z))) };
}

// Abramowitz–Stegun approximation of the standard normal CDF (error below 1e-7).
function normalCdf(z: number) {
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const q = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return 1 - q;
}
