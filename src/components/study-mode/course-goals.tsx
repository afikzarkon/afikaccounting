"use client";

import { ArrowLeft, CalendarClock, Flame, Gauge, Pencil } from "lucide-react";
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

/**
 * Above a course's path: how ready the reader is for its exam and the step that
 * raises it most, the days to the exam with today's share of the work, and the
 * days of study in a row. All from this browser's progress and the lessons the
 * course holds now, so it follows the course as its contents change. Nothing on
 * the server (the day is the reader's own).
 */
export function CourseGoals({ course, name, lessons, topics }: { course: string; name: string; lessons: StudyModule[]; topics: Record<string, TopicProgress> }) {
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const exams = useExamDates();
  const studyDays = useStudyDays();
  if (day < 0 || !lessons.length) return null;
  const r = readinessOf(lessons, topics, day);
  const streak = streakOf(studyDays, day);
  return (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      <ReadinessTile score={r.score} next={r.next} />
      <ExamTile course={course} name={name} date={exams[course]} day={day} lessons={lessons} topics={topics} due={r.due} />
      <StreakTile days={streak.days} studiedToday={streak.studiedToday} restFree={streak.restFree} />
      <p className="text-[13.5px] text-muted md:col-span-3">
        לומדים עם חברים לאותו מבחן?{" "}
        <Link href={`/groups?course=${course}`} className="font-semibold text-accent hover:underline">
          פתחו קבוצת לימוד
        </Link>{" "}
        — ספירה לאחור משותפת, ורואים מי למד היום.
      </p>
    </div>
  );
}

function Tile({ icon, title, children, className }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-1.5 rounded-2xl bg-surface p-3.5 ring-1 ring-line md:gap-2 md:p-4", className)}>
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
        {icon} {title}
      </p>
      {children}
    </section>
  );
}

function ReadinessTile({ score, next }: { score: number; next: ReturnType<typeof readinessOf>["next"] }) {
  return (
    <Tile icon={<Gauge className="h-4 w-4 text-accent" aria-hidden />} title="מוכנות למבחן">
      <p className="num text-[24px] leading-none font-bold text-fg md:text-[28px]">{score}%</p>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="meter" aria-label="מוכנות למבחן" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${score}%` }} />
      </div>
      {next ? (
        <Link href={next.kind === "review" ? "/review" : studyHref(next.slug)} className="inline-flex items-center gap-1 text-[14px] font-semibold text-accent hover:underline">
          {next.kind === "review"
            ? `הכי משתלם עכשיו: ${next.count === 1 ? "חזרה אחת" : `${next.count} חזרות`}`
            : `הצעד הבא: שיעור ${next.n} (בערך +${next.gain}%)`}
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : (
        <p className="text-[14px] font-semibold text-success">כל השיעורים מאחוריכם. עכשיו שאלות מבחן מלאות.</p>
      )}
      <p className="hidden text-[12px] text-subtle md:block">לפי שיעורים שסיימתם, תשובות נכונות בניסיון הראשון וחזרות. מדד להתקדמות, לא ציון.</p>
    </Tile>
  );
}

function ExamTile({
  course,
  name,
  date,
  day,
  lessons,
  topics,
  due,
}: {
  course: string;
  name: string;
  date?: string;
  day: number;
  lessons: StudyModule[];
  topics: Record<string, TopicProgress>;
  due: number;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(date ?? "");
  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    setExamDate(course, value);
    setEditing(false);
    track({ kind: "exam_goal_set", target: course, meta: { days: dayOfDate(value) - day } });
  };

  if (!date || editing)
    return (
      <Tile icon={<CalendarClock className="h-4 w-4 text-accent" aria-hidden />} title={`מתי המבחן ${inName(name)}?`}>
        <p className="hidden text-[14px] text-muted md:block">עם תאריך, תקבלו ספירה לאחור וחלוקה של השיעורים והחזרות לימים שנשארו.</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <input
            type="date"
            dir="ltr"
            value={value}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`תאריך המבחן ${inName(name)}`}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 text-sm text-fg"
          />
          <Button onClick={save} disabled={!value}>
            שמירה
          </Button>
          {date && (
            <Button
              variant="ghost"
              onClick={() => {
                setExamDate(course, null);
                setValue("");
                setEditing(false);
              }}
            >
              הסרה
            </Button>
          )}
        </div>
      </Tile>
    );

  const left = dayOfDate(date) - day;
  const remaining = lessons.filter((m) => {
    const p = topics[m.slug];
    return !(m.exercises.every((ex) => p?.exercises[ex.id]?.done) && m.traps.every((t) => p?.traps[t.id]));
  });
  // The last day before the exam is kept for review: the lessons share the days before it.
  const perDay = left > 0 ? Math.ceil(remaining.length / Math.max(1, left - 1)) : remaining.length;
  const todo = [due ? (due === 1 ? "חזרה אחת" : `${due} חזרות`) : "", remaining.length ? `שיעור ${remaining[0].n}${perDay > 1 ? ` ועוד ${perDay - 1}` : ""}` : ""].filter(Boolean);
  return (
    <Tile icon={<CalendarClock className="h-4 w-4 text-accent" aria-hidden />} title={`המבחן ${inName(name)}`}>
      {left > 0 ? (
        <>
          <p className="num text-[28px] leading-none font-bold text-fg">
            {left === 1 ? "מחר" : `עוד ${left} ימים`}
          </p>
          <p className="text-[14px] text-fg/90">
            {todo.length ? (
              <>
                <strong>היום:</strong> {todo.join(" + ")}
              </>
            ) : (
              "השיעורים מאחוריכם ואין חזרות להיום. זה הזמן לשאלות מבחן מלאות."
            )}
          </p>
          {remaining.length > 0 && left > 1 && (
            <p className="num hidden text-[12.5px] text-subtle md:block">
              {remaining.length} שיעורים נשארו, {left - 1} ימים לפני יום החזרה האחרון.
            </p>
          )}
        </>
      ) : left === 0 ? (
        <p className="text-[16px] font-bold text-fg">המבחן היום. בהצלחה! חזרה קצרה על הטעויות, ולא חומר חדש.</p>
      ) : (
        <p className="text-[15px] text-fg">המבחן עבר. איך היה? אם יש מועד נוסף, עדכנו את התאריך — והטעויות שלכם מחכות בחזרה.</p>
      )}
      <button type="button" onClick={() => setEditing(true)} className="mt-auto inline-flex w-fit items-center gap-1 text-[13px] text-muted hover:text-fg">
        <Pencil className="h-3.5 w-3.5" aria-hidden /> {left < 0 ? "תאריך חדש" : "שינוי התאריך"}
      </button>
    </Tile>
  );
}

function StreakTile({ days, studiedToday, restFree }: { days: number; studiedToday: boolean; restFree: boolean }) {
  return (
    <Tile icon={<Flame className={cn("h-4 w-4", days ? "text-[#f97316]" : "text-subtle")} aria-hidden />} title="ימי למידה ברצף">
      <p className="num text-[28px] leading-none font-bold text-fg">{days}</p>
      <p className="text-[14px] text-fg/90">
        {studiedToday
          ? "היום כבר נספר."
          : days
            ? "תשובה אחת היום — בשיעור או בחזרה — ממשיכה את הרצף."
            : "תשובה אחת היום פותחת רצף."}
      </p>
      <p className="hidden text-[12px] text-subtle md:block">{restFree ? "יום מנוחה אחד בשבוע לא שובר את הרצף." : "את יום המנוחה של השבוע כבר לקחתם."}</p>
    </Tile>
  );
}
