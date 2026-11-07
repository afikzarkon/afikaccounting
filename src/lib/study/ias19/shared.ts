/** What every lesson of the employee-benefits course shares: its name, its page, the lessons' numbers and prerequisites. The question builders are the inventory course's. */
export const COURSE = "הטבות עובד (IAS 19)";
export const COURSE_HREF = "/basics/ias19";

export { calc, choice, fmt, journal } from "../inventory/shared";

/** Each lesson's number on the site, by slug — every reference from one lesson to another goes through here, never a number typed by hand. A test checks it against the course's order. */
export const LESSON_N = {
  "ias19-map": 1,
  "ias19-short": 2,
  "ias19-dc": 3,
  "ias19-measure": 4,
  "ias19-rollforward": 5,
  "ias19-assets": 6,
  "ias19-other": 7,
  "ias19-exams": 8,
} as const;

export type Ias19Slug = keyof typeof LESSON_N;

/** The four lessons folded into others when the course went from twelve lessons to eight, and the lesson each now lives in. Their screens keep their ids; a reference to one names its host lesson. */
export const MERGED_INTO = {
  "ias19-toolkit": "ias19-map",
  "ias19-attribute": "ias19-measure",
  "ias19-amend": "ias19-rollforward",
  "ias19-present": "ias19-assets",
} as const satisfies Record<string, Ias19Slug>;

/** A lesson, or a part of one that used to be a lesson of its own. */
export type Ias19Ref = Ias19Slug | keyof typeof MERGED_INTO;

/** The lesson a reference lives in now. */
export const hostOf = (ref: Ias19Ref): Ias19Slug => (ref in MERGED_INTO ? MERGED_INTO[ref as keyof typeof MERGED_INTO] : (ref as Ias19Slug));

/** A lesson's number, through its host. */
export const lessonN = (ref: Ias19Ref) => LESSON_N[hostOf(ref)];

/** "שיעור 5". */
export const lessonRef = (ref: Ias19Ref) => `שיעור ${lessonN(ref)}`;

/** "שיעורים 4–6" for a run of lessons. */
export const lessonsRef = (from: Ias19Ref, to: Ias19Ref) => (lessonN(from) === lessonN(to) ? lessonRef(from) : `שיעורים ${lessonN(from)}–${lessonN(to)}`);

/** "שיעורים 2, 4 ו-5" for a list (a lesson named twice through its parts counts once). */
export function lessonList(refs: Ias19Ref[]) {
  const ns = [...new Set(refs.map(lessonN))].sort((a, b) => a - b);
  if (ns.length === 1) return `שיעור ${ns[0]}`;
  return `שיעורים ${ns.slice(0, -1).join(", ")} ו-${ns[ns.length - 1]}`;
}

/** What each lesson needs from the ones before it. */
export const PREREQS: Record<Ias19Slug, Ias19Slug[]> = {
  "ias19-map": [],
  "ias19-short": ["ias19-map"],
  "ias19-dc": ["ias19-map"],
  "ias19-measure": ["ias19-map", "ias19-dc"],
  "ias19-rollforward": ["ias19-map", "ias19-measure"],
  "ias19-assets": ["ias19-rollforward"],
  "ias19-other": ["ias19-map", "ias19-measure", "ias19-rollforward"],
  "ias19-exams": [],
};

/** The prerequisites line, as a lesson's opening and the course page show it. */
export function prereqLine(slug: Ias19Slug) {
  if (slug === "ias19-exams") return `כל השיעורים, ובעיקר ${lessonsRef("ias19-measure", "ias19-other")}.`;
  const p = PREREQS[slug];
  return p.length ? `${lessonList(p)}.` : "אין — מתחילים מכאן.";
}

/** The course's four stages, in the site's numbering. */
export const STAGES: { n: number; title: string; lessons: Ias19Slug[]; core?: boolean }[] = [
  { n: 1, title: "יסודות", lessons: ["ias19-map"] },
  { n: 2, title: "הטבות פשוטות", lessons: ["ias19-short", "ias19-dc"] },
  { n: 3, title: "הטבה מוגדרת", lessons: ["ias19-measure", "ias19-rollforward", "ias19-assets"], core: true },
  { n: 4, title: "הרחבות וסיכום", lessons: ["ias19-other", "ias19-exams"] },
];

/** A rate as a percentage, e.g. 0.07 → "7%" (never 7.000000000000001%). */
export const pct = (r: number, digits = 4) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: digits })}%`;
