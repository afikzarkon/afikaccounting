"use client";

import { Check, Lock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { type PageRating, RATING_TAGS, RATINGS, type Rating, ratingDone } from "@/lib/tester/form";
import { updateFeedback, useFeedback, useIsTester } from "@/lib/tester/store";
import { cn } from "@/lib/utils";

export type RatedPage = {
  /** The lesson's slug and its title. */
  slug: string;
  lesson: string;
  /** "screen:<id>", "check:<id>", "q:<practice id>" or "summary". */
  page: string;
  title: string;
  /** Where in the lesson, as its header says it ("מושג 3 מתוך 12"). */
  where: string;
  /** An address that opens this page. */
  path: string;
  /** How many pages the lesson has, to show how many are rated. */
  total: number;
  /** Whether this page still waits for its rating: the lesson holds "next" until it doesn't. */
  onPending?: (page: string, pending: boolean) => void;
  /** Bumped when the tester tried to move on without rating: the card says what is missing. */
  nudge?: number;
};

/**
 * The tester's one place for feedback: under every page of a lesson, for a course tester only.
 * One tap for how clear it was; anything less than clear asks what exactly was wrong (one tap each,
 * at least one) and, if they like, a line of their own. The lesson's summary asks instead whether they
 * could solve an exam question on it, and the one thing to change. Until the page is rated, "next"
 * stays shut (components/study-mode/shell.tsx). Everything goes into the tester's feedback, page by page
 * (lib/tester/store.ts), which reaches /admin/feedback.
 */
export function ScreenRating(props: RatedPage) {
  const isTester = useIsTester();
  if (!isTester) return null;
  return props.page === "summary" ? <LessonWrap key={props.page} {...props} /> : <PageCard key={props.page} {...props} />;
}

const now = () => Date.now();

function useRated({ slug, page, lesson, title, where, onPending }: RatedPage) {
  const { state, status } = useFeedback();
  const key = `${slug}/${page}`;
  const current = state?.pages[key];
  const rated = state ? Object.entries(state.pages).filter(([k, p]) => k.startsWith(`${slug}/`) && !k.endsWith("/summary") && p.r).length : 0;
  const done = ratingDone(page, current);
  // Until the form loads, nothing is held: a slow load never traps a tester.
  const pending = Boolean(state) && !done;
  useEffect(() => {
    onPending?.(page, pending);
  }, [onPending, page, pending]);
  const set = (patch: Partial<PageRating>) =>
    updateFeedback((s) => {
      const prev = s.pages[key];
      return { ...s, pages: { ...s.pages, [key]: { ...prev, ...patch, lesson, title, where, at: new Date().toISOString() } } };
    });
  return { ready: Boolean(state), current, rated, set, status, done };
}

const chip = (on: boolean) =>
  cn(
    "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors",
    on ? "border-amber-500 bg-amber-500/15 font-semibold text-amber-900 dark:text-amber-200" : "border-line-strong bg-surface text-fg hover:border-amber-500",
  );

function Frame({ children, label, done, nudge }: { children: React.ReactNode; label: string; done: boolean; nudge?: number }) {
  const ref = useRef<HTMLElement>(null);
  // Tried "next" without rating: bring the card into view and flash its border.
  useEffect(() => {
    const el = ref.current;
    if (!nudge || !el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const flash = ["border-danger", "ring-4", "ring-danger/20"];
    el.classList.add(...flash);
    const t = setTimeout(() => el.classList.remove(...flash), 900);
    return () => clearTimeout(t);
  }, [nudge]);
  return (
    <section
      ref={ref}
      id="tester-rating"
      aria-label={label}
      className={cn(
        "no-print mt-8 scroll-mt-28 rounded-2xl border-2 px-4 py-4 transition-colors sm:px-5",
        done ? "border-success/40 bg-success/5" : "border-amber-500/60 bg-amber-500/5",
      )}
    >
      {children}
    </section>
  );
}

function Status({ done, text }: { done: boolean; text: string }) {
  return done ? (
    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success" role="status">
      <Check className="h-4 w-4" aria-hidden /> תודה! אפשר להמשיך.
    </p>
  ) : (
    <p className="mt-3 flex items-center gap-1.5 text-sm text-muted" role="status">
      <Lock className="h-3.5 w-3.5" aria-hidden /> {text}
    </p>
  );
}

function PageCard(props: RatedPage) {
  const { ready, current, rated, set, done } = useRated(props);
  // When the page came on screen: its first rating records how long it was read.
  const shown = useRef(0);
  useEffect(() => {
    shown.current = now();
  }, []);
  const r = current?.r;
  const tags = current?.tags ?? [];
  const [noteOpen, setNoteOpen] = useState(false);
  const needsNote = tags.some((t) => RATING_TAGS.find((x) => x.value === t)?.needsNote) && !current?.note?.trim();

  const rate = (value: Rating) =>
    set({ r: value, ...(current?.secs === undefined && { secs: (now() - shown.current) / 1000 }), ...(value === "clear" && { tags: [] }) });
  const toggle = (t: string) => set({ tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });

  return (
    <Frame label="דירוג המסך" done={done} nudge={props.nudge}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-fg">
          איך היה המסך הזה? <span className="text-xs font-normal text-muted">(לניסיינים)</span>
        </p>
        <p className="num text-xs text-muted">
          דורגו {rated} מתוך {props.total} בשיעור
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="איך היה המסך">
        {RATINGS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={r === o.value}
            disabled={!ready}
            onClick={() => rate(o.value)}
            className={cn(chip(r === o.value), "flex-col justify-center gap-0.5 py-2.5 text-center")}
          >
            <span aria-hidden className="text-xl leading-none">
              {o.icon}
            </span>
            {o.label}
          </button>
        ))}
      </div>

      {r && r !== "clear" && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-medium text-fg">מה בדיוק הבעיה? אפשר לבחור כמה</legend>
          <div className="flex flex-wrap gap-2">
            {RATING_TAGS.map((t) => (
              <button key={t.value} type="button" aria-pressed={tags.includes(t.value)} onClick={() => toggle(t.value)} className={chip(tags.includes(t.value))}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {r && (r !== "clear" || noteOpen || current?.note) ? (
        <Note
          saved={current?.note ?? ""}
          onSave={(note) => set({ note })}
          label={needsNote ? "כתבו במשפט מה הבעיה" : r === "clear" ? "הערה (לא חובה)" : "רוצים לפרט? משפט אחד מספיק (לא חובה)"}
          required={needsNote}
        />
      ) : (
        r === "clear" && (
          <button type="button" onClick={() => setNoteOpen(true)} className="mt-3 text-xs font-medium text-muted hover:text-fg hover:underline">
            + להוסיף הערה
          </button>
        )
      )}

      <Status done={done} text={!r ? "דרגו את המסך כדי להמשיך לחלק הבא." : needsNote ? "כתבו מה הבעיה כדי להמשיך." : "בחרו מה הבעיה כדי להמשיך."} />
    </Frame>
  );
}

function LessonWrap(props: RatedPage) {
  const { ready, current, set, done } = useRated(props);
  const exam = current?.exam;

  return (
    <Frame label="סיכום השיעור לניסיינים" done={done} nudge={props.nudge}>
      <p className="font-semibold text-fg">
        סוף השיעור <span className="text-xs font-normal text-muted">(לניסיינים)</span>
      </p>
      <fieldset className="mt-3">
        <legend className="mb-2 text-sm text-fg">אני מרגיש/ה שאוכל לפתור שאלת בחינה בנושא של השיעור הזה</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">בכלל לא</span>
          <div className="flex gap-1.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={exam === n} disabled={!ready} onClick={() => set({ exam: n })} className={cn(chip(exam === n), "num w-10 justify-center px-0")}>
                {n}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted">בהחלט</span>
        </div>
      </fieldset>
      {ready && <Note multiline saved={current?.change ?? ""} onSave={(change) => set({ change })} label="הדבר האחד שהייתם משנים בשיעור הזה (לא חובה)" />}
      <Status done={done} text="סמנו מספר כדי לסיים את השיעור." />
    </Frame>
  );
}

/** A line of the tester's own, kept as they type (a moment after they stop) and when they leave the field. */
function Note({ saved, onSave, label, required = false, multiline = false }: { saved: string; onSave: (text: string) => void; label: string; required?: boolean; multiline?: boolean }) {
  const id = useId();
  const [text, setText] = useState(saved);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const save = (value = text) => value.trim() !== saved && onSave(value.trim());
  const change = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    // A required line unlocks "next" as soon as it's written, not only when the field is left.
    timer.current = setTimeout(() => save(value), 500);
  };
  const cls = cn(inputClass, required && "border-amber-500");
  return (
    <div className="mt-4">
      <label htmlFor={id} className="mb-1.5 block text-sm text-fg">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={2} value={text} onChange={(e) => change(e.target.value)} onBlur={() => save()} className={cn(cls, "h-auto min-h-16 resize-y py-2 leading-relaxed")} />
      ) : (
        <input id={id} value={text} onChange={(e) => change(e.target.value)} onBlur={() => save()} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className={cls} />
      )}
    </div>
  );
}
