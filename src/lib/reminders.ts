/**
 * Study reminders by email: who gets one today, and what it says. Opt-in only
 * (study_habits.reminders), at most one a day, and only when there is a reason —
 * mistakes due for review, or an exam within two weeks — and the reader hasn't
 * studied yet today. Pure, so it is tested; sending lives in the route.
 */

/** Today's day number in Israel (the same count as dayOf in study/review.ts, on Israel's midnight). */
export function israelDay(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = parts.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** "YYYY-MM-DD" as a day number (midnight, as israelDay counts). */
export const dayOfDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
};

export type ReminderInput = {
  today: number;
  days: number[];
  exams: Record<string, string>;
  remindedOn: number | null;
  /** Review questions due today or overdue. */
  due: number;
  /** A course's name, by id. */
  courseName: (id: string) => string;
};

export type Reminder = { subject: string; lines: string[] };

const EXAM_WINDOW = 14;

export function reminderFor(r: ReminderInput): Reminder | null {
  if (r.days.includes(r.today) || r.remindedOn === r.today) return null;
  const exams = Object.entries(r.exams)
    .map(([id, date]) => ({ name: r.courseName(id), left: dayOfDate(date) - r.today }))
    .filter((e) => e.left >= 0 && e.left <= EXAM_WINDOW)
    .sort((a, b) => a.left - b.left);
  if (!r.due && !exams.length) return null;
  const lines: string[] = [];
  const exam = exams[0];
  if (exam) lines.push(exam.left === 0 ? `המבחן ב־${exam.name} היום. חזרה קצרה על הטעויות, בלי חומר חדש — ובהצלחה!` : `עוד ${exam.left === 1 ? "יום אחד" : `${exam.left} ימים`} למבחן ב־${exam.name}.`);
  if (r.due) lines.push(r.due === 1 ? "שאלה אחת שטעיתם בה מחכה לחזרה. זה לוקח דקה או שתיים." : `${r.due} שאלות שטעיתם בהן מחכות לחזרה. כמה דקות, ואתם שם.`);
  const subject = exam
    ? exam.left === 0
      ? `היום המבחן ב־${exam.name}`
      : `עוד ${exam.left === 1 ? "יום" : `${exam.left} ימים`} למבחן ב־${exam.name}`
    : r.due === 1
      ? "שאלה אחת מחכה לכם לחזרה"
      : `${r.due} שאלות מחכות לכם לחזרה`;
  return { subject, lines };
}
