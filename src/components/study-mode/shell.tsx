"use client";

import { BookOpenText, ClipboardPen, Flag, TriangleAlert } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { clampPlace, markSeen, move, type Place, position, recordExercise, recordTrap, STEPS, xpOf } from "@/lib/study/score";
import type { StudyModule } from "@/lib/study/types";
import { BottomBar } from "./bottom-bar";
import { StudyHeader } from "./header";
import { JournalSimulator } from "./journal-simulator";
import { resetTopic, updateTopic, useTopic } from "./progress-store";
import { QuestionExercise } from "./question-exercise";
import { LessonContext } from "./screen-link";
import { cue } from "./sound";
import { SummaryCard } from "./summary-card";
import { TrapQuiz } from "./trap-quiz";

/**
 * On arrival, the address wins over the stored place, once: ?screen=<id> opens
 * a concept screen, ?step=<n> a step. Read from the router, which already holds
 * the new address during a client navigation (the window may not yet).
 */
function AddressPlace({ module: m, onApply }: { module: StudyModule; onApply: () => void }) {
  const params = useSearchParams();
  const applied = useRef(false);
  const screenId = params.get("screen");
  const stepParam = params.get("step");
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const screen = m.screens.findIndex((s) => s.id === screenId);
    const n = Number(stepParam);
    if (screen >= 0) updateTopic(m.slug, (q) => ({ ...q, step: 0, sub: screen }));
    else if (Number.isInteger(n) && n >= 1 && n <= STEPS.length) updateTopic(m.slug, (q) => (q.step === n - 1 ? q : { ...q, step: n - 1, sub: 0 }));
    else return;
    // The reader asked for this place: no "continuing where you left off".
    onApply();
  }, [m, screenId, stepParam, onApply]);
  return null;
}

/** A concept screen's content, rendered on the server: the one principle it teaches, and the rest. */
export type ScreenContent = { lead: ReactNode; body: ReactNode };

/**
 * The lesson, full screen: a fixed header and bottom bar, and between them one
 * card whose body alone scrolls when it must. The place in the lesson lives in
 * the progress store, so a return or a refresh resumes it; the address follows
 * with ?step=, and ?screen=<id> or ?step=<n> on arrival opens that place. Keys: ← next, → previous (right to
 * left), Esc leaves — unless a control inside the card already used the key.
 */
export function StudyShell({ module: m, screens, next }: { module: StudyModule; screens: ScreenContent[]; next?: { href: string; label: string } }) {
  const slug = m.slug;
  const p = useTopic(slug);
  const router = useRouter();
  const pathname = usePathname();
  const place = clampPlace(m, p);
  const step = place.step;
  const { at, total } = position(m, place);
  const last = at === total;
  const [dir, setDir] = useState<1 | -1>(1);
  const [moved, setMoved] = useState(false);
  const markMoved = useCallback(() => setMoved(true), []);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  const go = (to: Place, d: 1 | -1) => {
    setDir(d);
    setMoved(true);
    // Leaving a concept screen forward counts as having read it.
    updateTopic(slug, (q) => {
      const from = clampPlace(m, q);
      const read = from.step === 0 && (to.step > 0 || to.sub > from.sub) ? markSeen(q, from.sub) : q;
      return { ...read, ...to };
    });
    // The address follows the reader's moves (never on arrival, while a navigation may still be under way).
    window.history.replaceState(window.history.state, "", `${pathname}?step=${to.step + 1}`);
  };
  const nextScreen = () => go(move(m, place, 1), 1);
  const prevScreen = () => go(move(m, place, -1), -1);
  const restart = () => {
    resetTopic(slug);
    setDir(-1);
    setMoved(true);
    window.history.replaceState(window.history.state, "", pathname);
  };
  const jump = (screen: string) => {
    const i = m.screens.findIndex((s) => s.id === screen);
    if (i >= 0) go({ step: 0, sub: i }, step > 0 || i > place.sub ? 1 : -1);
  };

  // The page behind stays still while the lesson is open.
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  // On every new screen: back to its top, and focus to its heading for screen readers (not on arrival).
  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (first.current) first.current = false;
    else heading.current?.focus({ preventScroll: true });
  }, [place.step, place.sub]);

  const keys = useRef<(e: KeyboardEvent) => void>(undefined);
  useEffect(() => {
    keys.current = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") return router.push(m.backHref);
      if ((e.target as HTMLElement).closest("input, select, textarea, [contenteditable], [role=tablist], [role=radiogroup]")) return;
      if (e.key === "ArrowLeft" && !last) nextScreen();
      else if (e.key === "ArrowRight" && at > 1) prevScreen();
      else return;
      e.preventDefault();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const id = STEPS[step].id;
  let card: { icon: ReactNode; title: string; count?: string; content: ReactNode };
  if (id === "learn") {
    const s = screens[place.sub];
    card = {
      icon: <BookOpenText className="h-5 w-5" />,
      title: m.screens[place.sub].title,
      count: m.screens.length > 1 ? `מושג ${place.sub + 1} מתוך ${m.screens.length}` : undefined,
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3.5 text-[16px] font-semibold leading-relaxed text-fg sm:px-5">{s.lead}</div>
          <div className="space-y-4 text-[15.5px] leading-relaxed text-fg/90">{s.body}</div>
        </div>
      ),
    };
  } else if (id === "practice") {
    const ex = m.exercises[place.sub];
    const onCheck = (ok: boolean) => {
      updateTopic(slug, (q) => recordExercise(q, ex, ok));
      cue(ok ? "ok" : "bad");
    };
    card = {
      icon: <ClipboardPen className="h-5 w-5" />,
      title: ex.kind === "journal" ? `פקודת יומן · ${ex.skill}` : ex.skill,
      count: `תרגיל ${place.sub + 1} מתוך ${m.exercises.length}`,
      content:
        ex.kind === "journal" ? (
          <JournalSimulator key={ex.id} ex={ex} result={p.exercises[ex.id]} onCheck={onCheck} />
        ) : (
          <QuestionExercise key={ex.id} q={ex} result={p.exercises[ex.id]} onCheck={onCheck} />
        ),
    };
  } else if (id === "traps") {
    const t = m.traps[place.sub];
    card = {
      icon: <TriangleAlert className="h-5 w-5" />,
      title: "מלכודת מבחן",
      count: `שאלה ${place.sub + 1} מתוך ${m.traps.length}`,
      content: (
        <TrapQuiz
          key={t.id}
          trap={t}
          answered={p.traps[t.id]}
          onAnswer={(choice) => {
            updateTopic(slug, (q) => recordTrap(q, t.id, choice, choice === t.answer));
            cue(choice === t.answer ? "ok" : "bad");
          }}
        />
      ),
    };
  } else {
    card = {
      icon: <Flag className="h-5 w-5" />,
      title: "סיכום",
      content: (
        <SummaryCard
          module={m}
          progress={p}
          next={next}
          onRestart={restart}
        />
      ),
    };
  }

  const resumable = !moved && (p.step > 0 || p.sub > 0);

  return (
    <MotionConfig reducedMotion="user">
      {/* Its own boundary: reading the address must not keep the lesson itself from prerendering. */}
      <Suspense fallback={null}>
        <AddressPlace module={m} onApply={markMoved} />
      </Suspense>
      <LessonContext value={{ slug, jump }}>
        <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-hidden bg-canvas" aria-label={`שיעור אינטראקטיבי: ${m.title}`} role="region">
          <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-72 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
          <StudyHeader course={m.course} title={`שיעור ${m.n}: ${m.title}`} backHref={m.backHref} step={step} at={at} total={total} streak={p.streak} xp={xpOf(m, p)} />

          <div className="relative min-h-0 flex-1 px-3 py-3 sm:px-4 sm:py-5">
            <div className="card mx-auto flex h-full max-w-4xl flex-col overflow-hidden">
              <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-4 py-3 sm:px-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                  {card.icon}
                </span>
                <h1 ref={heading} tabIndex={-1} className="min-w-0 flex-1 truncate text-[17px] font-semibold text-fg outline-none sm:text-lg">
                  {card.title}
                </h1>
                {card.count && <span className="num shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-muted">{card.count}</span>}
              </div>
              {resumable && (
                <div className="flex shrink-0 items-center gap-3 border-b border-line bg-accent-soft/60 px-4 py-2 text-[13px] text-fg sm:px-5">
                  <span className="flex-1">ממשיכים מאיפה שעצרתם.</span>
                  <button type="button" onClick={() => setMoved(true)} className="font-semibold text-accent hover:underline">
                    הבנתי
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="font-semibold text-muted hover:text-fg hover:underline"
                  >
                    להתחיל מחדש
                  </button>
                </div>
              )}
              <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${place.step}-${place.sub}`}
                    initial={{ opacity: 0, x: -28 * dir }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 28 * dir }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="p-4 sm:p-5"
                  >
                    {card.content}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <BottomBar step={step} first={at === 1} last={last} onPrev={prevScreen} onNext={nextScreen} onJump={(i) => i !== step && go({ step: i, sub: 0 }, i > step ? 1 : -1)} />
        </div>
      </LessonContext>
    </MotionConfig>
  );
}
