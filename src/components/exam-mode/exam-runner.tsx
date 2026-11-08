"use client";

import { ArrowLeft, CircleCheck, CircleX, Clock, RotateCcw, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { updateTopic } from "@/components/study-mode/progress-store";
import { markStudied } from "@/components/study-mode/study-day";
import { Button, ButtonLink } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { buildExam, EXAM_SIZE, type ExamItem, isRight } from "@/lib/study/exam-mode";
import { afterAnswer, today } from "@/lib/study/review";
import { PRACTICE_GROUPS, recordTrap } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

const SECONDS_PER_QUESTION = 90;
const nf = new Intl.NumberFormat("en-US");

/**
 * Exam mode: a course's questions one after another, with no hints and no
 * feedback until the end — then the score, each question with the right answer
 * and why, and the trap misses into the reader's review. A clock is optional:
 * some students want the pressure, others don't.
 */
export function ExamRunner({ course, name, lessons, href }: { course: string; name: string; lessons: StudyModule[]; href: string }) {
  const [exam, setExam] = useState<ExamItem[] | null>(null);
  const [timed, setTimed] = useState(false);
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [ends, setEnds] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);

  const start = () => {
    const items = buildExam(lessons, Math.floor(Math.random() * 2 ** 31));
    setExam(items);
    setAt(0);
    setAnswers({});
    setDone(false);
    setEnds(timed ? Date.now() + items.length * SECONDS_PER_QUESTION * 1000 : null);
    setNow(Date.now());
    track({ kind: "check_start", target: `exam-${course}`, meta: { mode: "exam", timed } });
  };

  const finish = (items: ExamItem[], final: Record<string, number>) => {
    setDone(true);
    const right = items.filter((it) => isRight(it, final[it.key])).length;
    track({ kind: "check_complete", target: `exam-${course}`, meta: { mode: "exam", right, of: items.length } });
    // Traps count as the lessons' own answers (a miss joins the review); "find the error" is made up for the exam, so it doesn't.
    for (const it of items) {
      if (it.kind !== "trap" || final[it.key] === undefined) continue;
      const choice = final[it.key];
      updateTopic(it.slug, (q) => afterAnswer(recordTrap(q, it.trap.id, choice, choice === it.trap.answer), { kind: "trap", trap: it.trap, group: PRACTICE_GROUPS[1] }, today()));
    }
    markStudied();
  };

  // The clock: ticks once a second while it runs, and hands the exam in when time is up.
  useEffect(() => {
    if (!exam || done || ends === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= ends) {
        clearInterval(t);
        finish(exam, answers);
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish reads the answers at the moment time runs out
  }, [exam, done, ends, answers]);

  if (!lessons.length)
    return (
      <div className="card p-6 text-center">
        <p className="text-fg">אין עדיין שאלות פתוחות לכם בקורס הזה.</p>
        <ButtonLink href={href} className="mt-4">
          לדף הקורס
        </ButtonLink>
      </div>
    );

  if (!exam)
    return (
      <div className="card bg-grid p-6 sm:p-8">
        <p className="text-[17px] leading-relaxed text-fg">
          {EXAM_SIZE} שאלות {name ? `מ־${name}` : ""}: מלכודות, ושאלות ״מצאו את הטעות בפקודה״. בלי רמזים ובלי משוב באמצע — את התשובות והסברים תראו בסוף, כמו אחרי מבחן.
        </p>
        <label className="mt-5 flex items-center gap-2.5 text-[15px] text-fg">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
          <Timer className="h-4 w-4 text-accent" aria-hidden /> עם שעון ({Math.round((EXAM_SIZE * SECONDS_PER_QUESTION) / 60)} דקות)
        </label>
        <Button size="lg" className="mt-6" onClick={start}>
          להתחיל את המבחן <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );

  if (done) {
    const right = exam.filter((it) => isRight(it, answers[it.key])).length;
    return (
      <div className="space-y-5">
        <section className="card p-6 text-center">
          <p className="text-sm font-semibold text-muted">מצב מבחן · {name}</p>
          <p className="num mt-2 font-display text-[3.25rem] leading-none font-black text-fg">
            {right}
            <span className="text-[1.75rem] text-muted">/{exam.length}</span>
          </p>
          <p className="mt-3 text-[16px] text-fg">{right === exam.length ? "מושלם. אתם מוכנים לשאלות המלאות." : "התשובות וההסברים למטה. המלכודות שטעיתם בהן נכנסו לחזרה שלכם."}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={start}>
              <RotateCcw className="h-4 w-4" aria-hidden /> מבחן חדש
            </Button>
            <ButtonLink href="/review" variant="secondary">
              לחזרה שלי
            </ButtonLink>
            <ButtonLink href={href} variant="secondary">
              לדף הקורס
            </ButtonLink>
          </div>
        </section>
        <ol className="space-y-3">
          {exam.map((it, i) => (
            <li key={it.key} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
              <Review item={it} answer={answers[it.key]} n={i + 1} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const it = exam[at];
  const chosen = answers[it.key];
  const left = ends === null ? null : Math.max(0, Math.round((ends - now) / 1000));
  const choose = (v: number) => setAnswers((a) => ({ ...a, [it.key]: v }));
  const next = () => (at + 1 < exam.length ? setAt(at + 1) : finish(exam, answers));
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="num text-sm font-semibold text-muted">
          שאלה {at + 1} מתוך {exam.length}
        </p>
        <div className="flex flex-1 gap-1" aria-hidden>
          {exam.map((x, i) => (
            <span key={x.key} className={cn("h-1.5 flex-1 rounded-full", answers[x.key] !== undefined ? "bg-accent" : i === at ? "bg-accent/40" : "bg-line")} />
          ))}
        </div>
        {left !== null && (
          <span className={cn("num flex items-center gap-1 text-sm font-semibold", left < 60 ? "text-danger" : "text-muted")} role="timer" aria-live="off">
            <Clock className="h-4 w-4" aria-hidden /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <section className="card p-5 sm:p-6">
        <p className="mb-3 text-[13px] text-muted">{it.kind === "trap" ? "בחרו תשובה אחת" : "מצאו את הטעות: באיזו שורה בפקודה יש טעות?"}</p>
        {it.kind === "trap" ? (
          <>
            <p className="text-[17px] font-semibold leading-relaxed text-fg">{it.trap.prompt}</p>
            <div className="mt-4 grid gap-2.5" role="radiogroup">
              {it.order.map((oi, k) => (
                <Option key={oi} on={chosen === oi} onClick={() => choose(oi)} letter={"אבגדהו"[k]}>
                  {it.trap.options[oi]}
                </Option>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[17px] font-semibold leading-relaxed text-fg">{it.text}</p>
            <div className="mt-4 grid gap-2" role="radiogroup">
              {it.lines.map((l, li) => (
                <Option key={li} on={chosen === li} onClick={() => choose(li)} letter={String(li + 1)}>
                  <EntryLine line={l} />
                </Option>
              ))}
            </div>
          </>
        )}
        <Button size="lg" className="mt-5 w-full sm:w-auto" disabled={chosen === undefined} onClick={next}>
          {at + 1 < exam.length ? "לשאלה הבאה" : "להגשת המבחן"} <ArrowLeft className="h-4 w-4" aria-hidden />
        </Button>
      </section>
      <p className="text-center text-sm text-muted">
        <Link href={href} className="hover:text-fg hover:underline">
          יציאה מהמבחן
        </Link>
      </p>
    </div>
  );
}

function Option({ on, onClick, letter, children }: { on: boolean; onClick: () => void; letter: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-start text-[15.5px] transition-colors",
        on ? "border-accent bg-accent-soft text-fg" : "border-line-strong bg-surface text-fg hover:border-accent/50",
      )}
    >
      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px] font-bold", on ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted")}>{letter}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

function EntryLine({ line }: { line: { account: string; dr?: number; cr?: number } }) {
  const credit = line.cr !== undefined;
  return (
    <span className={cn("flex items-center gap-2", credit && "ps-6")}>
      <span className={cn("text-xs font-semibold", credit ? "text-credit" : "text-debit")}>{credit ? "ז׳" : "ח׳"}</span>
      <span className="min-w-0 flex-1">{line.account}</span>
      <span className={cn("num shrink-0", credit ? "text-credit" : "text-debit")} dir="ltr">
        {nf.format((credit ? line.cr : line.dr) ?? 0)}
      </span>
    </span>
  );
}

function Review({ item: it, answer, n }: { item: ExamItem; answer: number | undefined; n: number }) {
  const ok = isRight(it, answer);
  return (
    <div>
      <p className="flex items-start gap-2">
        {ok ? <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden /> : <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />}
        <span className="min-w-0">
          <span className="num text-[13px] text-muted">
            {n}. {it.lesson}
          </span>
          <span className="block font-semibold text-fg">{it.kind === "trap" ? it.trap.prompt : `מצאו את הטעות: ${it.text}`}</span>
        </span>
      </p>
      <div className="mt-2 space-y-1.5 ps-7 text-[14.5px] text-fg/90">
        {it.kind === "trap" ? (
          <>
            {!ok && answer !== undefined && (
              <p>
                <span className="font-semibold text-danger">עניתם: </span>
                {it.trap.options[answer]} — {it.trap.traps[answer]}
              </p>
            )}
            {answer === undefined && <p className="text-muted">לא נענתה.</p>}
            <p>
              <span className="font-semibold text-success">התשובה: </span>
              {it.trap.options[it.trap.answer]}. {it.trap.why}
            </p>
          </>
        ) : (
          <>
            {!ok && answer !== undefined && (
              <p>
                <span className="font-semibold text-danger">סימנתם את שורה {answer + 1}</span> ({it.lines[answer].account}), והיא נכונה.
              </p>
            )}
            {answer === undefined && <p className="text-muted">לא נענתה.</p>}
            <p>
              <span className="font-semibold text-success">הטעות בשורה {it.wrong + 1}: </span>
              כתוב ״{it.lines[it.wrong].account}״, ונכון ״{it.right}״.
            </p>
            {it.why && <p className="text-muted">{it.why}</p>}
          </>
        )}
      </div>
    </div>
  );
}
