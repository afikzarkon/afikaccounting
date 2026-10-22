"use client";

import {
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Check,
  Layers,
  Link2,
  Loader2,
  PlayCircle,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormAlert, inputClass } from "@/components/ui/form";
import { Badge } from "@/components/ui/primitives";
import { VideoDrawer } from "@/components/video/video-drawer";
import type { PlayableItem } from "@/components/video/video-player";
import { saveSolution } from "@/lib/actions/solutions";
import { track } from "@/lib/analytics/track";
import type { Preset } from "@/lib/data/presets";
import { CALCULATORS, getCalculator } from "@/lib/engine/registry";
import type { Calculator, FieldValue, Solution, Values } from "@/lib/engine/types";
import { conditionsHold, defaults, isDisabled, isUnknown, isVisible, sanitize, SOLVE_MODE, UNKNOWN, validateValues } from "@/lib/engine/validate";
import { cn } from "@/lib/utils";
import { ACCENTS, CalculatorIcon, SectionIcon } from "./calculator-visuals";
import { FieldControl } from "./field-control";
import { SolutionView } from "./solution-view";

const STEPS = [
  { title: "תקן ונושא", short: "תקן" },
  { title: "תרחיש", short: "תרחיש" },
  { title: "נתונים כספיים", short: "נתונים" },
  { title: "פתרון", short: "פתרון" },
] as const;

export type WizardStart = {
  slug: string;
  values: Values;
  step: number;
  saved?: { id: string; title: string };
};

type RunResult = { solution?: Solution; error?: string; ms?: number };

/**
 * Solve, and time it for the usage analytics. The clock reading is metadata
 * only: the solution itself depends on nothing but the inputs.
 */
function solveTimed(calc: Calculator, values: Values): RunResult {
  const t0 = performance.now();
  try {
    return { solution: calc.solve(values), ms: performance.now() - t0 };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "לא ניתן היה לחשב את הפתרון.", ms: performance.now() - t0 };
  }
}

const modeOf = (v: Values) => (v[SOLVE_MODE] === "solve" ? "solve" : "regular");

/** Keep the address bar shareable without a navigation (Next syncs useSearchParams with it). */
function setQuery(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  window.history.replaceState(null, "", qs ? `/engine?${qs}` : "/engine");
}

export function Wizard({
  start,
  explainers,
  presets = [],
  signedIn,
}: {
  start: WizardStart | null;
  explainers: Record<string, PlayableItem>;
  /** Ready-made scenarios from the admin's preset library, for every calculator. */
  presets?: Preset[];
  signedIn: boolean;
}) {
  const [step, setStep] = useState(start?.step ?? 0);
  const [direction, setDirection] = useState(1);
  const [calc, setCalc] = useState<Calculator | undefined>(() => getCalculator(start?.slug));
  const [values, setValues] = useState<Values>(() => start?.values ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Bumped to remount inputs after a reset, so their local text state resets too. */
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState(start?.saved);
  const [video, setVideo] = useState<{ open: boolean; at: number }>({ open: false, at: 0 });
  /** The preset the current values came from, so its runs are attributed to it. */
  const [presetId, setPresetId] = useState<string>();

  const explainer = calc?.explainerSlug ? explainers[calc.explainerSlug] : undefined;
  const currency = typeof values.currency === "string" ? values.currency : "ILS";

  const result = useMemo<RunResult>(() => (step === 3 && calc ? solveTimed(calc, values) : {}), [step, calc, values]);

  // One usage event per computed solution (success or failure), with the engine's run time.
  useEffect(() => {
    if (!calc || result.ms === undefined) return;
    track({ kind: "calc_run", calculator: calc.slug, mode: modeOf(values), ok: !result.error, durationMs: result.ms, presetId });
    // Only a new result is a new run; values and preset are read as they were for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const choose = (c: Calculator) => {
    if (c.slug !== calc?.slug) {
      setCalc(c);
      setValues(defaults(c));
      setErrors({});
      setSaved(undefined);
      setPresetId(undefined);
      setFormKey((k) => k + 1);
    }
    setQuery({ calc: c.slug });
    go(1);
  };

  const update = (id: string, v: FieldValue) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    if (errors[id]) {
      setErrors((prev) => {
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
    }
  };

  const next = () => {
    if (!calc) return;
    const scope = step === 1 ? "scenario" : "metrics";
    const found = validateValues(calc, values, scope);
    setErrors(found);
    if (Object.keys(found).length) {
      track({ kind: "calc_invalid", calculator: calc.slug, mode: modeOf(values), meta: { step, fields: Object.keys(found).slice(0, 6).join(",") } });
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    if (step === 2) setQuery({ calc: calc.slug, v: JSON.stringify(values) });
    go(step + 1);
  };

  const reset = () => {
    if (!calc) return;
    setValues(defaults(calc));
    setErrors({});
    setPresetId(undefined);
    setFormKey((k) => k + 1);
  };

  const loadPreset = (p: Preset) => {
    if (!calc) return;
    setValues(sanitize(calc, p.inputs));
    setErrors({});
    setPresetId(p.id);
    setFormKey((k) => k + 1);
    track({ kind: "preset_load", calculator: calc.slug, presetId: p.id, label: p.title });
  };
  const calcPresets = calc ? presets.filter((p) => p.calculatorSlug === calc.slug) : [];

  const canVisit = (i: number) => (i === 0 ? true : !!calc && (i <= step || (i === step + 1 && step > 0)));

  return (
    <div>
      <Stepper
        steps={[STEPS[0], calc?.steps?.scenario ?? STEPS[1], calc?.steps?.metrics ?? STEPS[2], STEPS[3]]}
        step={step}
        canVisit={canVisit}
        onSelect={(i) => (i > step ? next() : go(i))}
      />

      {calc && step > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3 pe-4">
          <CalculatorIcon calc={calc} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-fg">
              {calc.standard} <span className="font-normal text-muted">— {calc.title}</span>
            </p>
            <p className="truncate text-xs text-muted">{calc.tagline}</p>
          </div>
          {explainer && (
            <Button variant="outline" size="sm" onClick={() => setVideo({ open: true, at: 0 })} className="no-print">
              <PlayCircle className="h-3.5 w-3.5" /> סרטון הסבר
            </Button>
          )}
        </div>
      )}

      <div className="relative mt-6">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * 28 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <StandardStep selected={calc?.slug} onChoose={choose} />}

            {step === 1 && calcPresets.length > 0 && <PresetBar presets={calcPresets} activeId={presetId} onLoad={loadPreset} />}

            {(step === 1 || step === 2) && calc && (
              <FieldsStep
                key={formKey}
                calc={calc}
                scope={step === 1 ? "scenario" : "metrics"}
                values={values}
                errors={errors}
                currency={currency}
                onChange={update}
                onExplain={explainer ? (at) => setVideo({ open: true, at }) : undefined}
                onReset={reset}
              />
            )}

            {step === 3 && calc && (
              <>
                {result.error ? (
                  <FormAlert error={`${result.error} יש לבדוק את הנתונים ולנסות שוב.`} />
                ) : result.solution ? (
                  <>
                    <SaveBar
                      calc={calc}
                      values={values}
                      signedIn={signedIn}
                      saved={saved}
                      onSaved={(s) => {
                        setSaved(s);
                        setQuery({ solution: s.id });
                      }}
                    />
                    <SolutionView
                      solution={result.solution}
                      currency={currency}
                      standard={calc.standard}
                      title={saved?.title ?? calc.title}
                    />
                  </>
                ) : null}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 0 && (
        <div className="no-print mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
          <Button variant="ghost" onClick={() => go(step - 1)}>
            <ArrowRight className="h-4 w-4" /> חזרה
          </Button>
          {step < 3 ? (
            <Button onClick={next} size="lg">
              {step === 2 ? (
                <>
                  <Sparkles className="h-4 w-4" /> הפקת פתרון
                </>
              ) : (
                <>
                  המשך <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => go(1)}>
              <RotateCcw className="h-4 w-4" /> שינוי התרחיש
            </Button>
          )}
        </div>
      )}

      <VideoDrawer
        item={explainer ?? null}
        startAt={video.at}
        open={video.open}
        onClose={() => setVideo((v) => ({ ...v, open: false }))}
      />
    </div>
  );
}

function Stepper({
  steps,
  step,
  canVisit,
  onSelect,
}: {
  steps: { title: string; short: string }[];
  step: number;
  canVisit: (i: number) => boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="התקדמות באשף" className="no-print">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.title}>
              <button
                type="button"
                disabled={!canVisit(i) || active}
                onClick={() => onSelect(i)}
                aria-current={active ? "step" : undefined}
                className="group w-full text-start disabled:cursor-default"
              >
                <div className="relative h-1 overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-accent to-cyan-400"
                    initial={false}
                    animate={{ width: done || active ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold transition-colors",
                      done && "bg-accent text-accent-fg",
                      active && "bg-accent-soft text-accent ring-1 ring-accent",
                      !done && !active && "bg-surface-2 text-subtle",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "truncate text-xs font-medium sm:text-[13px]",
                      active ? "text-fg" : "text-muted",
                      canVisit(i) && !active && "group-hover:text-fg",
                    )}
                  >
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StandardStep({ selected, onChoose }: { selected?: string; onChoose: (c: Calculator) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-fg">באיזה תקן עוסקת הסוגיה שלכם?</h2>
      <p className="mt-1 text-sm text-muted">בחרו נושא כדי להגדיר את התרחיש שלב אחר שלב.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CALCULATORS.map((c, i) => {
          const active = c.slug === selected;
          return (
            <motion.button
              key={c.slug}
              type="button"
              onClick={() => onChoose(c)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "group card relative flex flex-col p-5 text-start transition-shadow",
                ACCENTS[c.accent].glow,
                active && "border-accent ring-2 ring-accent/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <CalculatorIcon calc={c} />
                {active ? <Badge tone="accent">נבחר</Badge> : <Badge>{c.category}</Badge>}
              </div>
              <p className={cn("mt-4 text-xs font-semibold", ACCENTS[c.accent].text)}>{c.standard}</p>
              <p className="mt-1 font-semibold text-fg">{c.title}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent">
                להגדרה <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function FieldsStep({
  calc,
  scope,
  values,
  errors,
  currency,
  onChange,
  onExplain,
  onReset,
}: {
  calc: Calculator;
  scope: "scenario" | "metrics";
  values: Values;
  errors: Record<string, string>;
  currency: string;
  onChange: (id: string, v: FieldValue) => void;
  onExplain?: (at: number) => void;
  onReset: () => void;
}) {
  const fields = (scope === "scenario" ? calc.scenario : calc.metrics).filter((f) => isVisible(f, values));
  // Cross-field errors (from calc.validate) can name fields on either step.
  const stray = Object.entries(errors).filter(([id]) => !fields.some((f) => f.id === id));
  const text = calc.steps?.[scope];

  return (
    <div className="card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">
            {text?.title ?? (scope === "scenario" ? "הגדרת התרחיש" : "הזנת הנתונים הכספיים")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {text?.intro ??
              (scope === "scenario"
                ? "הבחירות האלה קובעות איזה טיפול חשבונאי חל."
                : "הסכומים נבדקים תוך כדי הקלדה; הפתרון מחושב מחדש מיד.")}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" /> איפוס לברירות המחדל
        </Button>
      </div>

      {stray.length > 0 && (
        <div className="mt-5 space-y-2">
          {stray.map(([id, msg]) => (
            <FormAlert key={id} error={msg} />
          ))}
        </div>
      )}

      {fields.length === 0 && <p className="mt-6 text-sm text-muted">אין נתונים נוספים להזנה בשלב זה.</p>}

      <motion.div layout className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {fields.flatMap((f, i) => {
            const opensSection = f.section && f.section !== fields[i - 1]?.section;
            const control = (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={cn((f.kind === "radio" || f.kind === "series") && "sm:col-span-2")}
              >
                <FieldControl
                  field={f}
                  value={values[f.id]}
                  error={errors[f.id]}
                  // A fair-value list stays editable as X: only its blank row is the unknown.
                  disabled={isDisabled(f, values) || (isUnknown(f, values) && f.kind !== "dated-values")}
                  showNote={f.kind === "dated-values" && !!f.note && conditionsHold(f.note.showIf, values)}
                  unknown={
                    f.solvable && values[SOLVE_MODE] === "solve"
                      ? { active: isUnknown(f, values), onToggle: () => onChange(UNKNOWN, isUnknown(f, values) ? "" : f.id) }
                      : undefined
                  }
                  currency={currency}
                  onChange={(v) => onChange(f.id, v)}
                  onExplain={onExplain}
                />
              </motion.div>
            );
            if (!opensSection) return [control];
            return [
              <motion.h3
                key={`section-${f.section}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold text-fg sm:col-span-2",
                  i > 0 && "mt-2 border-t border-line pt-6",
                )}
              >
                {calc.sectionIcons?.[f.section!] ? (
                  <SectionIcon name={calc.sectionIcons[f.section!]} />
                ) : (
                  <span className="h-4 w-1 rounded-full bg-accent" />
                )}
                {f.section}
              </motion.h3>,
              control,
            ];
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SaveBar({
  calc,
  values,
  signedIn,
  saved,
  onSaved,
}: {
  calc: Calculator;
  values: Values;
  signedIn: boolean;
  saved?: { id: string; title: string };
  onSaved: (s: { id: string; title: string }) => void;
}) {
  const [title, setTitle] = useState(saved?.title ?? `${calc.standard} — ${calc.title}`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = () => `${window.location.origin}/engine?${new URLSearchParams({ calc: calc.slug, v: JSON.stringify(values) })}`;
  const returnTo = `/engine?${new URLSearchParams({ calc: calc.slug, v: JSON.stringify(values) })}`;

  const save = async (asNew: boolean) => {
    setPending(true);
    setError(null);
    const res = await saveSolution({ slug: calc.slug, title, values, id: asNew ? undefined : saved?.id });
    setPending(false);
    if (!res.ok) return setError(res.error);
    onSaved({ id: res.id, title: title.trim() });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div className="no-print glass mb-6 flex flex-col gap-3 rounded-2xl p-3 shadow-card sm:flex-row sm:items-center">
      {signedIn ? (
        <>
          <label className="sr-only" htmlFor="solution-title">
            שם הפתרון
          </label>
          <input
            id="solution-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className={cn(inputClass, "h-10 sm:max-w-sm")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => save(false)} disabled={pending || !title.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : justSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {justSaved ? "נשמר" : saved ? "עדכון" : "שמירת הפתרון"}
            </Button>
            {saved && (
              <Button variant="secondary" onClick={() => save(true)} disabled={pending}>
                שמירה כחדש
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-3 px-1">
          <p className="text-sm text-muted">התחברו כדי לשמור את התרחיש בלוח האישי.</p>
          <ButtonLink href={`/login?next=${encodeURIComponent(returnTo)}`} size="sm">
            <Bookmark className="h-3.5 w-3.5" /> התחברות לשמירה
          </ButtonLink>
        </div>
      )}
      <div className="flex items-center gap-2 sm:ms-auto">
        {saved && (
          <Link href="/dashboard" className="text-xs font-medium text-muted hover:text-fg">
            לצפייה בלוח האישי
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareUrl());
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            } catch {}
          }}
        >
          {linkCopied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
          {linkCopied ? "הקישור הועתק" : "העתקת קישור"}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger sm:basis-full" role="alert">
          <TriangleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

/** Ready-made scenarios: one click fills every field, ready to check and solve. */
function PresetBar({ presets, activeId, onLoad }: { presets: Preset[]; activeId?: string; onLoad: (p: Preset) => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-dashed border-accent/40 bg-accent-soft/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Layers className="h-4 w-4 text-accent" /> תרחישים מוכנים
        <span className="font-normal text-muted">— טעינה בלחיצה, ואפשר לשנות כל נתון אחר כך</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onLoad(p)}
            title={p.description || undefined}
            aria-pressed={p.id === activeId}
            className={cn(
              "rounded-xl border px-3 py-2 text-start text-sm transition-colors",
              p.id === activeId ? "border-accent bg-surface text-fg ring-1 ring-accent/40" : "border-line-strong bg-surface/70 text-muted hover:border-accent/50 hover:text-fg",
            )}
          >
            {p.id === activeId && <Check className="me-1.5 inline h-3.5 w-3.5 text-accent" />}
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}
