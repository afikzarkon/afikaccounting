"use client";

import { CalendarClock, Flame, Gauge, X } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { inName } from "@/lib/hebrew";
import { studyHref } from "@/lib/study/href";
import { readinessOf } from "@/lib/study/readiness";
import { dayOf, today } from "@/lib/study/review";
import type { TopicProgress } from "@/lib/study/score";
import { streakOf } from "@/lib/study/streak";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";
import { setExamDate, useExamDates, useStudyDays } from "./progress-store";

const noSubscribe = () => () => {};

/** "YYYY-MM-DD" as a day number in the reader's own time zone (see dayOf). */
const dayOfDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return dayOf(new Date(y, m - 1, d, 12).getTime());
};

const done = (m: StudyModule, p?: TopicProgress) => m.exercises.every((ex) => p?.exercises[ex.id]?.done) && m.traps.every((t) => p?.traps[t.id]);

/**
 * One thin row under a course's progress: readiness for the exam (and the step
 * that raises it most), the days to the exam with today's share of the work, and
 * the days of study in a row. All from this browser's progress and the lessons
 * the course holds now. Nothing on the server (the day is the reader's own).
 */
export function CourseGoals({ course, name, lessons, topics }: { course: string; name: string; lessons: StudyModule[]; topics: Record<string, TopicProgress> }) {
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const exams = useExamDates();
  const studyDays = useStudyDays();
  const [editing, setEditing] = useState(false);
  if (day < 0 || !lessons.length) return null;
  const r = readinessOf(lessons, topics, day);
  const streak = streakOf(studyDays, day);
  const date = exams[course];
  const left = date ? dayOfDate(date) - day : null;
  const remaining = lessons.filter((m) => !done(m, topics[m.slug]));
  // The last day before the exam is kept for review: the lessons share the days before it.
  const perDay = left !== null && left > 0 ? Math.ceil(remaining.length / Math.max(1, left - 1)) : remaining.length;
  const todo = [r.due ? (r.due === 1 ? "חזרה אחת" : `${r.due} חזרות`) : "", remaining.length ? `שיעור ${remaining[0].n}${perDay > 1 ? ` ועוד ${perDay - 1}` : ""}` : ""].filter(Boolean);

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
        <Item icon={<Gauge className="h-4 w-4 text-accent" aria-hidden />} label="מוכנות למבחן" title="לפי שיעורים שסיימתם, תשובות נכונות בניסיון הראשון וחזרות. מדד להתקדמות, לא ציון.">
          <span className="flex items-center gap-2">
            <span className="num font-bold text-fg">{r.score}%</span>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2" role="meter" aria-label="מוכנות למבחן" aria-valuemin={0} aria-valuemax={100} aria-valuenow={r.score}>
              <span className="block h-full rounded-full bg-accent" style={{ width: `${r.score}%` }} />
            </span>
          </span>
          {r.next && (
            <Link href={r.next.kind === "review" ? "/review" : studyHref(r.next.slug)} className="num block truncate text-[12.5px] text-accent hover:underline">
              {r.next.kind === "review" ? `הכי משתלם: ${r.next.count === 1 ? "חזרה אחת" : `${r.next.count} חזרות`}` : `הבא: שיעור ${r.next.n} (+${r.next.gain}%)`}
            </Link>
          )}
        </Item>

        <Item icon={<CalendarClock className="h-4 w-4 text-accent" aria-hidden />} label={`המבחן ${inName(name)}`}>
          {editing || !date ? (
            <ExamDate course={course} name={name} date={date} day={day} editing={editing} onDone={() => setEditing(false)} />
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className="num font-bold text-fg hover:underline" title="שינוי התאריך">
                {left === null ? "" : left > 1 ? `עוד ${left} ימים` : left === 1 ? "מחר" : left === 0 ? "היום. בהצלחה!" : "המבחן עבר · תאריך חדש?"}
              </button>
              {left !== null && left > 0 && <span className="num block truncate text-[12.5px] text-muted">{todo.length ? `היום: ${todo.join(" + ")}` : "היום: שאלות מבחן מלאות"}</span>}
            </>
          )}
        </Item>

        <Item icon={<Flame className={cn("h-4 w-4", streak.days ? "text-gold-strong" : "text-subtle")} aria-hidden />} label="ימי למידה ברצף" title="יום מנוחה אחד בשבוע לא שובר את הרצף.">
          <span className="num font-bold text-fg">{streak.days}</span>
          <span className="block truncate text-[12.5px] text-muted">{streak.studiedToday ? "היום כבר נספר" : streak.days ? "תשובה אחת היום ממשיכה אותו" : "תשובה אחת היום פותחת רצף"}</span>
        </Item>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        <Link href={`/exam-mode/${course}`} className="font-semibold text-accent hover:underline">
          מצב מבחן
        </Link>{" "}
        — 10 שאלות בלי רמזים, עם שעון אם תרצו. · לומדים עם חברים?{" "}
        <Link href={`/groups?course=${course}`} className="font-semibold text-accent hover:underline">
          קבוצת לימוד
        </Link>{" "}
        — ספירה לאחור משותפת, ורואים מי למד היום.
      </p>
    </div>
  );
}

function Item({ icon, label, title, children }: { icon: React.ReactNode; label: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0" title={title}>
      <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted">
        {icon} {label}
      </p>
      <div className="mt-1 text-[15px]">{children}</div>
    </div>
  );
}

function ExamDate({ course, name, date, day, editing, onDone }: { course: string; name: string; date?: string; day: number; editing: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(editing);
  const [value, setValue] = useState(date ?? "");
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[14px] font-semibold text-accent hover:underline">
        קבעו תאריך — ותקבלו תוכנית יומית
      </button>
    );
  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    setExamDate(course, value);
    setOpen(false);
    onDone();
    track({ kind: "exam_goal_set", target: course, meta: { days: dayOfDate(value) - day } });
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="date"
        dir="ltr"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`תאריך המבחן ${inName(name)}`}
        className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 text-sm text-fg"
      />
      <Button size="sm" onClick={save} disabled={!value}>
        שמירה
      </Button>
      <button
        type="button"
        aria-label={date ? "הסרת התאריך" : "ביטול"}
        onClick={() => {
          if (date) setExamDate(course, null);
          setOpen(false);
          onDone();
        }}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
