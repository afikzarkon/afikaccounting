"use client";

import { track } from "@/lib/analytics/track";
import { today } from "@/lib/study/review";
import { streakOf } from "@/lib/study/streak";
import { readStudyDays, recordStudyDay } from "./progress-store";

/**
 * A study action happened (a lesson answer, a review answer, a summary-check answer): today counts
 * for the streak. Counted once a day, with the run's length. Page views and reading don't count.
 */
export function markStudied() {
  const day = today();
  if (recordStudyDay(day)) track({ kind: "study_day", meta: { streak: streakOf(readStudyDays(), day).days } });
}
