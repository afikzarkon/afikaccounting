"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { type PageRating, RATING_TAGS, RATINGS, type Rating } from "@/lib/tester/form";
import { setCurrentPlace, updateFeedback, useFeedback, useIsTester, useTesterMode } from "@/lib/tester/store";
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
};

/**
 * Under each page of a lesson, for a course tester only: one tap for how clear the page was,
 * and for anything less than clear, why (one tap each) and a line of their own. The lesson's
 * summary asks instead whether they could solve an exam question on it, and the one thing to change.
 * Everything goes into the tester's feedback form (lib/tester/store.ts), page by page.
 */
export function ScreenRating(props: RatedPage) {
  const isTester = useIsTester();
  const on = useTesterMode();
  const { page, path, lesson, where, title } = props;

  // The floating button names this page when a note is written from it.
  useEffect(() => {
    setCurrentPlace({ path, label: `${lesson} · ${where} · ${title}` });
    return () => setCurrentPlace(null);
  }, [path, lesson, where, title]);

  if (!isTester || !on) return null;
  return page === "summary" ? <LessonWrap {...props} /> : <PageStrip key={page} {...props} />;
}

const now = () => Date.now();

function useRated({ slug, page, lesson, title, where }: RatedPage) {
  const { state, status } = useFeedback();
  const key = `${slug}/${page}`;
  const current = state?.pages[key];
  const rated = state ? Object.entries(state.pages).filter(([k, p]) => k.startsWith(`${slug}/`) && !k.endsWith("/summary") && p.r).length : 0;
  const set = (patch: Partial<PageRating>) =>
    updateFeedback((s) => {
      const prev = s.pages[key];
      return { ...s, pages: { ...s.pages, [key]: { ...prev, ...patch, lesson, title, where, at: new Date().toISOString() } } };
    });
  return { ready: Boolean(state), current, rated, set, status };
}

const chip = (on: boolean) =>
  cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-colors",
    on ? "border-amber-500 bg-amber-500/15 font-semibold text-amber-900 dark:text-amber-200" : "border-line-strong bg-surface text-fg hover:border-amber-500",
  );

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section aria-label={label} className="no-print mt-8 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/5 px-4 py-3.5 sm:px-5">
      {children}
    </section>
  );
}

function PageStrip(props: RatedPage) {
  const { ready, current, rated, set } = useRated(props);
  // When the page came on screen: its first rating records how long it was read.
  const shown = useRef(0);
  useEffect(() => {
    shown.current = now();
  }, []);
  const r = current?.r;
  const tags = current?.tags ?? [];

  const rate = (value: Rating) =>
    set({ r: value, ...(current?.secs === undefined && { secs: (now() - shown.current) / 1000 }), ...(value === "clear" && { tags: [] }) });
  const toggle = (t: string) => set({ tags: tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t] });

  return (
    <Frame label="דירוג המסך לניסיין">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <p className="text-sm font-semibold text-fg">
          איך היה המסך הזה? <span className="font-normal text-muted">(לניסיינים)</span>
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="איך היה המסך">
          {RATINGS.map((o) => (
            <button key={o.value} type="button" role="radio" aria-checked={r === o.value} disabled={!ready} onClick={() => rate(o.value)} className={chip(r === o.value)}>
              <span aria-hidden>{o.icon}</span>
              {o.label}
            </button>
          ))}
        </div>
        <p className="num ms-auto text-xs text-muted" aria-live="polite">
          {r && <Check className="me-1 inline h-3.5 w-3.5 text-success" aria-hidden />}
          דורגו {rated} מתוך {props.total} בשיעור
        </p>
      </div>

      {r && r !== "clear" && (
        <div className="mt-3 grid gap-3">
          <div className="flex flex-wrap gap-2" aria-label="מה לא עבד">
            {RATING_TAGS.map((t) => (
              <button key={t.value} type="button" aria-pressed={tags.includes(t.value)} onClick={() => toggle(t.value)} className={chip(tags.includes(t.value))}>
                {t.label}
              </button>
            ))}
          </div>
          <Note saved={current?.note ?? ""} onSave={(note) => set({ note })} />
        </div>
      )}
    </Frame>
  );
}

function LessonWrap(props: RatedPage) {
  const { ready, current, set } = useRated(props);
  const exam = current?.exam;

  return (
    <Frame label="סיכום השיעור לניסיין">
      <p className="text-sm font-semibold text-fg">
        סוף השיעור <span className="font-normal text-muted">(לניסיינים)</span>
      </p>
      <fieldset className="mt-3">
        <legend className="mb-2 text-sm text-fg">אני מרגיש שאוכל לפתור שאלת בחינה בנושא של השיעור הזה</legend>
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
      {ready && <Note multiline saved={current?.change ?? ""} onSave={(change) => set({ change })} />}
      {(exam || current?.change) && (
        <p className="mt-2 flex items-center gap-1 text-xs text-success" role="status">
          <Check className="h-3.5 w-3.5" aria-hidden /> נשמר בטופס המשוב שלכם
        </p>
      )}
    </Frame>
  );
}

/** A line of the tester's own, kept when they leave the field (or press Enter on a single line). */
function Note({ saved, onSave, multiline = false }: { saved: string; onSave: (text: string) => void; multiline?: boolean }) {
  const id = useId();
  const [text, setText] = useState(saved);
  const save = () => text.trim() !== saved && onSave(text.trim());
  return multiline ? (
    <div className="mt-3">
      <label htmlFor={id} className="mb-1.5 block text-sm text-fg">
        הדבר האחד שהייתם משנים בשיעור הזה
      </label>
      <textarea id={id} rows={2} value={text} onChange={(e) => setText(e.target.value)} onBlur={save} className={cn(inputClass, "h-auto min-h-16 resize-y py-2 leading-relaxed")} />
    </div>
  ) : (
    <div>
      <label htmlFor={id} className="sr-only">
        הערה קצרה
      </label>
      <input
        id={id}
        value={text}
        placeholder="הערה קצרה (לא חובה): מה בדיוק לא היה ברור?"
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={inputClass}
      />
    </div>
  );
}
