/** What every lesson of the employee-benefits course shares: its name, its page, the lessons' numbers and prerequisites. The question builders are the inventory course's. */
export const COURSE = "הטבות עובד (IAS 19)";
export const COURSE_HREF = "/basics/ias19";

export { calc, choice, fmt, journal } from "../inventory/shared";

/** Each lesson's number on the site, by slug — every reference from one lesson to another goes through here, never a number typed by hand. A test checks it against the course's order. */
export const LESSON_N = {
  "ias19-map": 1,
  "ias19-toolkit": 2,
  "ias19-short": 3,
  "ias19-dc": 4,
  "ias19-measure": 5,
  "ias19-attribute": 6,
  "ias19-rollforward": 7,
  "ias19-amend": 8,
  "ias19-assets": 9,
  "ias19-present": 10,
  "ias19-other": 11,
  "ias19-exams": 12,
} as const;

export type Ias19Slug = keyof typeof LESSON_N;

/** "שיעור 7". */
export const lessonRef = (slug: Ias19Slug) => `שיעור ${LESSON_N[slug]}`;

/** "שיעורים 5–10" for a run of lessons. */
export const lessonsRef = (from: Ias19Slug, to: Ias19Slug) => `שיעורים ${LESSON_N[from]}–${LESSON_N[to]}`;

/** "שיעורים 2, 5 ו-6" for a list. */
export function lessonList(slugs: Ias19Slug[]) {
  const ns = slugs.map((s) => LESSON_N[s]);
  if (ns.length === 1) return `שיעור ${ns[0]}`;
  return `שיעורים ${ns.slice(0, -1).join(", ")} ו-${ns[ns.length - 1]}`;
}

/** What each lesson needs from the ones before it. */
export const PREREQS: Record<Ias19Slug, Ias19Slug[]> = {
  "ias19-map": [],
  "ias19-toolkit": ["ias19-map"],
  "ias19-short": ["ias19-map", "ias19-toolkit"],
  "ias19-dc": ["ias19-map", "ias19-toolkit"],
  "ias19-measure": ["ias19-toolkit", "ias19-dc"],
  "ias19-attribute": ["ias19-measure"],
  "ias19-rollforward": ["ias19-toolkit", "ias19-measure", "ias19-attribute"],
  "ias19-amend": ["ias19-measure", "ias19-attribute", "ias19-rollforward"],
  "ias19-assets": ["ias19-rollforward", "ias19-amend"],
  "ias19-present": ["ias19-rollforward", "ias19-amend", "ias19-assets"],
  "ias19-other": ["ias19-map", "ias19-attribute", "ias19-rollforward", "ias19-amend"],
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
  { n: 1, title: "יסודות", lessons: ["ias19-map", "ias19-toolkit"] },
  { n: 2, title: "הטבות פשוטות", lessons: ["ias19-short", "ias19-dc"] },
  { n: 3, title: "הטבה מוגדרת", lessons: ["ias19-measure", "ias19-attribute", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present"], core: true },
  { n: 4, title: "הרחבות וסיכום", lessons: ["ias19-other", "ias19-exams"] },
];

/** A rate as a percentage, e.g. 0.07 → "7%" (never 7.000000000000001%). */
export const pct = (r: number, digits = 4) => `${(r * 100).toLocaleString("en-US", { maximumFractionDigits: digits })}%`;
