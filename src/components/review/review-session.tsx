"use client";

import { ArrowLeft, ArrowRight, Crown, Loader2, Shuffle, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { JournalSimulator } from "@/components/study-mode/journal-simulator";
import { updateTopic } from "@/components/study-mode/progress-store";
import { QuestionExercise } from "@/components/study-mode/question-exercise";
import { cue } from "@/components/study-mode/sound";
import { TrapQuiz } from "@/components/study-mode/trap-quiz";
import { Button } from "@/components/ui/button";
import { similarQuestion } from "@/lib/actions/similar";
import { planHref } from "@/lib/pricing";
import { answerReview, type ReviewItem, topicOf } from "@/lib/study/review";
import { EMPTY_TOPIC, type ExResult, recordExercise } from "@/lib/study/score";
import type { Exercise, StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

type Answer = { ex?: ExResult; trap?: { choice: number; correct: boolean } };

/**
 * A review session: the questions one at a time, in the lesson's own question
 * screens. A question's first answer here moves it on its schedule — right up
 * a box, wrong back to tomorrow. Once it is answered, a subscriber can ask for a
 * similar question with new numbers (made on the server, and outside the
 * schedule); everyone else sees what that would be, and the way to it.
 */
export function ReviewSession({
  title,
  items,
  lessons,
  premium,
  similarIds,
  day,
  onDone,
}: {
  title: string;
  items: ReviewItem[];
  lessons: Map<string, StudyModule>;
  premium: boolean;
  /** Questions that have similar versions, as `slug:id`. */
  similarIds: Set<string>;
  day: number;
  onDone: () => void;
}) {
  // The queue is fixed when the session starts: answering a question moves its due day, not its place here.
  const [queue] = useState(items);
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [right, setRight] = useState(0);
  const [similar, setSimilar] = useState<{ key: string; ex: Exercise; result?: ExResult; n: number } | null>(null);
  const [loading, setLoading] = useState(false);

  if (at >= queue.length)
    return (
      <div className="relative overflow-hidden rounded-3xl bg-surface p-8 text-center ring-1 ring-line">
        <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-cyan-500 text-white">
            <Trophy className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-4 text-[22px] font-bold text-fg">סיימתם את החזרה</p>
          <p className="num mt-1 text-[15px] text-muted">
            {right} מתוך {queue.length} נכון בניסיון הראשון. מה שטעיתם בו יחזור מחר; מה שעניתם נכון — בעוד כמה ימים.
          </p>
          <Button size="lg" className="mt-6" onClick={onDone}>
            חזרה לרשימה
          </Button>
        </div>
      </div>
    );

  const x = queue[at];
  const m = lessons.get(x.slug)!;
  const key = `${x.slug}:${x.id}`;
  const answer = answers[key];
  const done = x.item.kind === "exercise" ? !!answer?.ex?.done : !!answer?.trap;

  /** The question's first answer in this session moves it on the schedule: right only if right at once. */
  const settle = (ok: boolean) => {
    updateTopic(x.slug, (q) => answerReview(q, x.id, ok, day));
    if (ok) setRight((n) => n + 1);
  };

  const onCheck = (ex: Exercise) => (ok: boolean) => {
    const prev = answers[key]?.ex;
    const next = recordExercise({ ...EMPTY_TOPIC, exercises: prev ? { [ex.id]: prev } : {} }, ex, ok).exercises[ex.id];
    setAnswers((a) => ({ ...a, [key]: { ex: next } }));
    cue(ok ? "ok" : "bad");
    if (next.done) settle(next.ok && next.tries === 1);
  };

  const askSimilar = async () => {
    setLoading(true);
    try {
      const r = await similarQuestion(x.slug, x.id);
      if (r.ok) setSimilar({ key, ex: r.exercise, n: (similar?.key === key ? similar.n : 0) + 1 });
    } finally {
      setLoading(false);
    }
  };

  const go = () => {
    setSimilar(null);
    setAt((i) => i + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onDone} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-accent">
          <ArrowRight className="h-4 w-4" aria-hidden /> לרשימה
        </button>
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-fg">{title}</p>
        <p className="num text-[13px] font-semibold text-muted">
          שאלה {at + 1} מתוך {queue.length}
        </p>
      </div>
      <div className="flex gap-1" aria-hidden>
        {queue.map((q, i) => (
          <span key={`${q.slug}:${q.id}`} className={cn("h-1.5 flex-1 rounded-full", i < at ? "bg-accent/45" : i === at ? "bg-accent" : "bg-line-strong")} />
        ))}
      </div>

      <div className="card p-5 sm:p-7">
        <p className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">{topicOf(m, x.item)}</span>
          <Link href={`/study/${m.slug}`} className="text-muted hover:text-accent">
            {m.course} · שיעור {m.n}: {m.title}
          </Link>
        </p>
        {x.item.kind === "trap" ? (
          <TrapQuiz
            key={key}
            trap={x.item.trap}
            answered={answer?.trap}
            onAnswer={(choice) => {
              const correct = choice === (x.item.kind === "trap" ? x.item.trap.answer : -1);
              setAnswers((a) => ({ ...a, [key]: { trap: { choice, correct } } }));
              cue(correct ? "ok" : "bad");
              settle(correct);
            }}
          />
        ) : x.item.ex.kind === "journal" ? (
          <JournalSimulator key={key} ex={x.item.ex} result={answer?.ex} onCheck={onCheck(x.item.ex)} />
        ) : (
          <QuestionExercise key={key} q={x.item.ex} result={answer?.ex} onCheck={onCheck(x.item.ex)} />
        )}
      </div>

      {similar?.key === key && (
        <div className="card border-accent/40 p-5 sm:p-7">
          <p className="mb-4 flex items-center gap-2 text-[13px] font-bold text-accent">
            <Shuffle className="h-4 w-4" aria-hidden /> שאלה דומה, במספרים חדשים
          </p>
          {similar.ex.kind === "journal" ? (
            <JournalSimulator
              key={`${key}:${similar.n}`}
              ex={similar.ex}
              result={similar.result}
              onCheck={(ok) => {
                const next = recordExercise({ ...EMPTY_TOPIC, exercises: similar.result ? { [similar.ex.id]: similar.result } : {} }, similar.ex, ok).exercises[similar.ex.id];
                setSimilar({ ...similar, result: next });
                cue(ok ? "ok" : "bad");
              }}
            />
          ) : (
            <QuestionExercise
              key={`${key}:${similar.n}`}
              q={similar.ex}
              result={similar.result}
              onCheck={(ok) => {
                const next = recordExercise({ ...EMPTY_TOPIC, exercises: similar.result ? { [similar.ex.id]: similar.result } : {} }, similar.ex, ok).exercises[similar.ex.id];
                setSimilar({ ...similar, result: next });
                cue(ok ? "ok" : "bad");
              }}
            />
          )}
        </div>
      )}

      {done && (
        <div className="flex flex-wrap items-center gap-3">
          {similarIds.has(key) &&
            (premium ? (
              <Button variant="secondary" onClick={askSimilar} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Shuffle className="h-4 w-4" aria-hidden />}
                {similar?.key === key ? "עוד שאלה דומה" : "שאלה דומה, במספרים חדשים"}
              </Button>
            ) : (
              <Link
                href={planHref("courses", "/review")}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400/10 px-3.5 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-400/35 hover:bg-amber-400/20 dark:text-amber-300"
              >
                <Crown className="h-4 w-4" aria-hidden /> שאלה דומה במספרים חדשים — במנוי
              </Link>
            ))}
          <Button className="ms-auto" onClick={go}>
            {at + 1 < queue.length ? "לשאלה הבאה" : "לסיום"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
