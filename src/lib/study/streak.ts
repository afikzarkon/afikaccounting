/**
 * Days of study in a row, forgiving by design: one rest day in any seven doesn't
 * break the run (Shabbat, a holiday, a bad day), two days missed in a row, or a
 * second miss within the week, do. Today not studied yet never breaks it — the day
 * isn't over. Counts study days, not calendar days. Pure: the day is passed in.
 */
export type Streak = {
  /** Study days in the current run. */
  days: number;
  studiedToday: boolean;
  /** Whether a rest day is still free this week (no miss in the last six days). */
  restFree: boolean;
};

export const KEEP_DAYS = 60;

export function streakOf(studyDays: number[], today: number): Streak {
  const active = new Set(studyDays);
  const studiedToday = active.has(today);
  let days = 0;
  let lastMiss: number | null = null;
  for (let d = today; d > today - 400; d--) {
    if (active.has(d)) {
      days++;
      continue;
    }
    if (d === today) continue;
    // A miss: the run ends on two in a row, on a second within seven days, or before any study at all.
    if (!active.has(d - 1) || (lastMiss !== null && lastMiss - d < 7)) break;
    lastMiss = d;
  }
  // The rest day is taken when the run itself skipped a day in the last six (a gap before the run doesn't count).
  const restFree = lastMiss === null || today - lastMiss > 6;
  return { days, studiedToday, restFree };
}

/** The study days to keep after studying on `day`: unique, newest last, at most KEEP_DAYS. */
export function withStudyDay(studyDays: number[], day: number): number[] {
  if (studyDays.includes(day)) return studyDays;
  return [...studyDays, day].sort((a, b) => a - b).slice(-KEEP_DAYS);
}
