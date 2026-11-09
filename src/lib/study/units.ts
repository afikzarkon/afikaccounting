import type { StudyModule } from "./types";

/**
 * A course's lessons in units, for the course page: a few lessons under one
 * heading each, so a long course reads as four or five steps instead of a list
 * of fourteen. Data only, by lesson slug, and forgiving because course contents
 * still change: a slug that no longer exists is skipped, and a lesson no unit
 * names joins "more lessons" at the end. A course with no units here is shown as
 * one plain list.
 */
export type UnitDef = { title: string; lessons: string[] };

export const UNITS: Record<string, UnitDef[]> = {
  "/basics": [
    { title: "היסודות: חובה, זכות ופקודות", lessons: ["basics-intro", "basics-double-entry", "basics-books"] },
    { title: "שנה שלמה בספרים", lessons: ["basics-year", "basics-adjust", "basics-review"] },
    { title: "סוף השנה והדוחות", lessons: ["basics-credit", "basics-final", "basics-exams"] },
  ],
  "/basics/inventory": [
    { title: "מהו מלאי ואיך רושמים אותו", lessons: ["inventory-what", "inventory-recording", "inventory-ias2"] },
    { title: "עלות המלאי", lessons: ["inventory-cost", "inventory-discounts"] },
    { title: "שיטות תמחור והערכה", lessons: ["inventory-fifo", "inventory-average", "inventory-nrv"] },
    { title: "לקראת המבחן", lessons: ["inventory-unknowns", "inventory-fire", "inventory-worksheet", "inventory-exams"] },
  ],
  "/basics/ias16": [
    { title: "הנכס ועלותו", lessons: ["ias16-intro", "ias16-cost"] },
    { title: "פחת", lessons: ["ias16-table", "ias16-straight", "ias16-methods", "ias16-components"] },
    { title: "שינויים בנכס", lessons: ["ias16-disposal", "ias16-renovation", "ias16-exchange"] },
    { title: "מודל הערכה מחדש", lessons: ["ias16-revaluation-land", "ias16-revaluation"] },
    { title: "לקראת המבחן", lessons: ["ias16-worksheet", "ias16-unknowns", "ias16-exams"] },
  ],
  "/basics/ias19": [
    { title: "יסודות והטבות לזמן קצר", lessons: ["ias19-map", "ias19-short"] },
    { title: "הטבות לאחר סיום העסקה", lessons: ["ias19-dc", "ias19-measure", "ias19-rollforward", "ias19-assets"] },
    { title: "הטבות נוספות ושאלות מבחן", lessons: ["ias19-other", "ias19-exams"] },
  ],
};

export type Unit = { title: string; lessons: StudyModule[] };

/** The units of a course's lessons, in the course's order; every lesson exactly once. Empty when the course has no units. */
export function unitsOf(lessons: StudyModule[]): Unit[] {
  const defs = lessons[0] ? UNITS[lessons[0].backHref] : undefined;
  if (!defs) return [];
  const bySlug = new Map(lessons.map((m) => [m.slug, m]));
  const used = new Set<string>();
  const units: Unit[] = defs
    .map((d) => ({
      title: d.title,
      lessons: d.lessons.flatMap((slug) => {
        const m = bySlug.get(slug);
        if (!m || used.has(slug)) return [];
        used.add(slug);
        return [m];
      }),
    }))
    .filter((u) => u.lessons.length);
  const rest = lessons.filter((m) => !used.has(m.slug));
  if (rest.length) units.push({ title: "שיעורים נוספים", lessons: rest });
  // In the order of the lessons themselves: a unit sits where its first lesson does.
  return units.sort((a, b) => a.lessons[0].n - b.lessons[0].n);
}
