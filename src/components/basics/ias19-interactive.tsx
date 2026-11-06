"use client";

import { Check, ClipboardList, Dices, Eye, Hammer, RotateCcw, Search, ShieldQuestion, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { grown, pv } from "@/lib/learn/ias19";
import { type Drill, type DrillFamily, drillRight, DRILL_TITLES, makeDrill, windowOf, type WindowRule } from "@/lib/study/ias19/drills";
import { lessonsRef } from "@/lib/study/ias19/shared";
import { cn } from "@/lib/utils";

/**
 * The post-employment lessons' interactive pieces: the risk test that sorts
 * a plan, an explorer of the projected unit credit method, an explorer of
 * when service counts toward a grant with two routes, the solving template,
 * and the practice box that draws similar questions with new numbers and
 * shows each one's full solution in the template's three parts.
 */

const n0 = (v: number) => Math.round(v).toLocaleString("en-US");
const pc = (v: number) => `${(v * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;

// ---------------------------------------------------------------------------
// The solving template.

export function SolveTemplate({ seek, check, build, compact }: { seek: ReactNode[]; check: ReactNode[]; build: { title: ReactNode; lines: ReactNode[] }[]; compact?: boolean }) {
  return (
    <div className="space-y-2.5">
      <TemplatePart icon={<Search className="h-4 w-4" />} title="מה מחפשים" tone="bg-sky-500/10 ring-sky-500/30">
        <ul className="list-disc space-y-1 ps-5">{seek.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </TemplatePart>
      <TemplatePart icon={<ClipboardList className="h-4 w-4" />} title="מה בודקים" tone="bg-amber-500/10 ring-amber-500/30">
        <ul className="space-y-1">
          {check.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
              <span className="min-w-0">{s}</span>
            </li>
          ))}
        </ul>
      </TemplatePart>
      <TemplatePart icon={<Hammer className="h-4 w-4" />} title="איך בונים" tone="bg-accent-soft ring-accent/30">
        <ol className={cn("space-y-2", compact && "space-y-1")}>
          {build.map((b, i) => (
            <li key={i} className="rounded-lg bg-surface/70 px-3 py-2 ring-1 ring-line">
              <p className="font-bold text-fg">{b.title}</p>
              {b.lines.map((l, k) => (
                <p key={k} className="text-[14.5px] leading-relaxed text-fg/90">
                  {l}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </TemplatePart>
    </div>
  );
}

function TemplatePart({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl px-3.5 py-2.5 text-[14.5px] text-fg ring-1", tone)}>
      <p className="mb-1.5 flex items-center gap-1.5 font-bold">
        {icon} {title}
      </p>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The risk test: three questions, and the verdict.

const RISK_QS = [
  { q: "האם החברה הבטיחה את ההטבה עצמה — סכום לפי נוסחה (שכר אחרון, ותק), פנסיה, שי לגמלאים או השתתפות בהוצאות?", yes: "החברה הבטיחה תוצאה, ולכן היא נושאת בסיכון שהתוצאה תעלה ביוקר." },
  { q: "האם החברה ערבה לתשואה, או חייבת להשלים אם בקרן לא יהיה מספיק כסף?", yes: "ערבות או חובת השלמה משאירות את הסיכון אצל החברה, גם כשקרן חיצונית משלמת (IAS 19.29)." },
  { q: "האם יש נוהג קבוע שיוצר אצל העובדים ציפייה שהחברה תשלים פערים?", yes: "נוהג כזה הוא מחויבות משתמעת — והיא משאירה את הסיכון אצל החברה." },
];

export function RiskTest() {
  const [answers, setAnswers] = useState<boolean[]>([]);
  const at = answers.length;
  const db = answers.includes(true);
  const done = db || at === RISK_QS.length;
  return (
    <section className="space-y-2.5 rounded-2xl border border-line bg-surface p-3.5" aria-label="מבחן הסיכון">
      <p className="flex items-center gap-2 font-bold text-fg">
        <ShieldQuestion className="h-5 w-5 text-accent" aria-hidden /> מבחן הסיכון: מי יפסיד אם הכסף לא יספיק?
      </p>
      <ol className="space-y-2">
        {RISK_QS.slice(0, Math.min(at + 1, RISK_QS.length)).map((x, i) => {
          const a = answers[i];
          return (
            <li key={i} className={cn("rounded-xl px-3 py-2 ring-1", a === undefined ? "bg-accent-soft ring-accent/40" : "bg-surface-2/50 ring-line")}>
              <p className="text-[14.5px] text-fg">
                <span className="num me-1 font-bold text-accent">{i + 1}.</span>
                {x.q}
              </p>
              {a === undefined && !done ? (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setAnswers([...answers, true])} className="h-9 rounded-lg bg-accent px-4 text-[14px] font-bold text-accent-fg">
                    כן
                  </button>
                  <button type="button" onClick={() => setAnswers([...answers, false])} className="h-9 rounded-lg bg-surface px-4 text-[14px] font-bold text-fg ring-1 ring-line-strong">
                    לא
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-[13.5px] text-muted">{a ? <>כן — {x.yes}</> : "לא — ממשיכים לשאלה הבאה."}</p>
              )}
            </li>
          );
        })}
      </ol>
      {done && (
        <div className={cn("anim-step-in rounded-xl px-3.5 py-2.5 text-[15px] font-semibold ring-1", db ? "bg-amber-500/10 text-fg ring-amber-500/40" : "bg-success/10 text-fg ring-success/40")}>
          {db ? `הסיכון אצל החברה → הטבה מוגדרת. מודדים התחייבות אקטוארית (${lessonsRef("ias19-measure", "ias19-present")}).` : "החברה מפקידה ונפטרת; הסיכון אצל העובד → הפקדה מוגדרת. ההוצאה היא ההפקדה."}
          <button type="button" onClick={() => setAnswers([])} className="ms-2 inline-flex items-center gap-1 text-[13px] font-bold text-accent hover:underline">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> תוכנית אחרת
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The projected unit credit method, as a timeline you can move.

function Slider({ label, value, min, max, step, onChange, show }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: string }) {
  return (
    <label className="block text-[13.5px] text-fg">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="num font-bold text-accent">{show}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
    </label>
  );
}

export function PucExplorer({ salary, share, defaults }: { salary: number; share: number; defaults: { served: number; left: number; growth: number; rate: number } }) {
  const [served, setServed] = useState(defaults.served);
  const [left, setLeft] = useState(defaults.left);
  const [growth, setGrowth] = useState(defaults.growth);
  const [rate, setRate] = useState(defaults.rate);
  const final = grown(salary, growth, left);
  const unit = share * final;
  const acc = unit * served;
  const ob = pv(acc, rate, left);
  const total = served + left;
  const W = 640;
  const x0 = 24;
  const x1 = W - 24;
  // Time runs right to left, as the page reads.
  const sx = (t: number) => x1 - ((x1 - x0) * t) / total;
  const units = Math.ceil(total);
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-3.5" aria-label="מעבדה: יחידת הזכאות הצפויה">
      <p className="font-bold text-fg">מעבדה: הזיזו את הנתונים וראו מה משתנה</p>
      <svg viewBox={`0 0 ${W} 150`} direction="ltr" className="w-full" role="img" aria-label={`ציר זמן: ${served} שנות שירות עד היום, ${left} שנים עד הפרישה`}>
        {Array.from({ length: units }, (_, k) => {
          const a = k;
          const b = Math.min(k + 1, total);
          const done = b <= served + 1e-9;
          const part = a < served && b > served;
          return (
            <g key={k}>
              <rect x={sx(b) + 1.5} y={34} width={Math.max(0, sx(a) - sx(b) - 3)} height={30} rx={5} className={done ? "fill-[var(--accent)]" : "fill-transparent stroke-[var(--line-strong)]"} strokeWidth={1.5} strokeDasharray={done ? undefined : "4 3"} />
              {part && <rect x={sx(served)} y={34} width={Math.max(0, sx(a) - sx(served) - 1.5)} height={30} rx={5} className="fill-[var(--accent)]" />}
            </g>
          );
        })}
        <line x1={sx(served)} x2={sx(served)} y1={20} y2={78} className="stroke-[var(--fg)]" strokeWidth={2} />
        <text x={sx(served)} y={14} textAnchor="middle" className="fill-[var(--fg)] text-[12px] font-bold">
          היום
        </text>
        <text x={x1} y={92} textAnchor="end" className="fill-[var(--muted)] text-[11px]">
          תחילת העבודה
        </text>
        <text x={x0} y={92} textAnchor="start" className="fill-[var(--muted)] text-[11px]">
          פרישה ותשלום
        </text>
        <path d={`M ${x0 + 4} 104 Q ${(sx(served) + x0) / 2} 140 ${sx(served) - 4} 104`} className="fill-none stroke-amber-500" strokeWidth={2} markerEnd="url(#pucArrow)" />
        <defs>
          <marker id="pucArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-amber-500" />
          </marker>
        </defs>
        <text x={(sx(served) + x0) / 2} y={146} textAnchor="middle" className="fill-amber-600 text-[12px] font-bold dark:fill-amber-300">
          ÷ (1+{pc(rate)})^{left}
        </text>
      </svg>
      <p className="text-[13px] text-muted">
        כל ריבוע הוא שנת שירות — יחידת זכאות אחת. המלאים כבר נצברו ונכנסים להתחייבות; המקווקווים עוד לא. החץ מחזיר את הסכום מיום התשלום להיום.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="שנות שירות עד היום" value={served} min={0.5} max={12} step={0.5} onChange={setServed} show={`${served}`} />
        <Slider label="שנים עד הפרישה (n)" value={left} min={1} max={15} step={1} onChange={setLeft} show={`${left}`} />
        <Slider label="עליית שכר שנתית" value={growth} min={0} max={0.05} step={0.005} onChange={setGrowth} show={pc(growth)} />
        <Slider label="שיעור היוון" value={rate} min={0.02} max={0.08} step={0.005} onChange={setRate} show={pc(rate)} />
      </div>
      <ol className="space-y-1 rounded-xl bg-surface-2/50 p-3 text-[14px] text-fg">
        <li>
          ① שכר בפרישה: <L>{n0(salary)} × {(1 + growth).toFixed(3)}^{left}</L> = <strong className="num">{n0(final)}</strong>
        </li>
        <li>
          ② יחידה לשנה: <L>{pc(share)} × {n0(final)}</L> = <strong className="num">{n0(unit)}</strong>
        </li>
        <li>
          ③ נצבר: <L>{n0(unit)} × {served}</L> = <strong className="num">{n0(acc)}</strong>
        </li>
        <li className="font-bold">
          ④ התחייבות: <L>{n0(acc)} ÷ {(1 + rate).toFixed(3)}^{left}</L> = <span className="num text-accent">{n0(ob)} ₪</span>
        </li>
      </ol>
      <p className="text-[13px] text-muted">נסו: הגדילו את שיעור ההיוון — ההתחייבות יורדת. הגדילו את עליית השכר — היא עולה. הוסיפו שנת שירות — נוספת יחידה.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// When service counts toward a grant with two routes: an age line you can move.

export function WindowExplorer({ rule, start }: { rule: WindowRule; start: { hireAge: number; age: number } }) {
  const [hireAge, setHire] = useState(start.hireAge);
  const [ageRaw, setAge] = useState(start.age);
  const age = Math.min(Math.max(ageRaw, hireAge), rule.retire);
  const w = windowOf(rule, hireAge);
  const window = w.end - w.start;
  const served = Math.min(Math.max(0, age - w.start), window);
  const lo = 20;
  const hi = rule.retire + 1;
  const W = 640;
  // Ages run right to left, as the page reads.
  const sx = (a: number) => W - 16 - ((W - 32) * (a - lo)) / (hi - lo);
  const seg = (a: number, b: number) => ({ x: sx(b), width: Math.max(0, sx(a) - sx(b)) });
  const from = rule.minAge - rule.years;
  const caseText =
    w.route === "age"
      ? `התחיל בגיל ${hireAge}: עד ${rule.retire} לא ישלים ${rule.years} שנים. הזכאות רק במסלול הגיל — ולכן המענק נצבר על כל השירות, ${window} שנים.`
      : hireAge < from
        ? `התחיל לפני גיל ${from}. השירות עד ${from} לא מוסיף כלום — בכל מקרה הזכאות תגיע בגיל ${rule.minAge}. נצבר על ${rule.years} השנים שלפניה.`
        : `ישלים ${rule.years} שנים בגיל ${w.end} — ומאז שירות נוסף לא מגדיל את המענק. נצבר על ${window} שנים.`;
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-3.5" aria-label="מעבדה: מתי השירות נספר">
      <p className="font-bold text-fg">מעבדה: הזיזו את גיל ההתחלה וראו מתי השירות נספר</p>
      <svg viewBox={`0 0 ${W} 110`} direction="ltr" className="w-full" role="img" aria-label={`צבירה מגיל ${w.start} עד ${w.end}`}>
        <line x1={sx(lo)} x2={sx(hi)} y1={58} y2={58} className="stroke-[var(--line-strong)]" strokeWidth={2} />
        {hireAge < w.start && <rect {...seg(hireAge, w.start)} y={46} height={24} rx={4} className="fill-[var(--surface-2)] stroke-[var(--line-strong)]" strokeDasharray="4 3" />}
        <rect {...seg(w.start, w.end)} y={46} height={24} rx={4} className="fill-[var(--accent)] opacity-25" />
        <rect {...seg(w.start, w.start + served)} y={46} height={24} rx={4} className="fill-[var(--accent)]" />
        {w.end < rule.retire && <rect {...seg(w.end, rule.retire)} y={46} height={24} rx={4} className="fill-transparent stroke-[var(--line-strong)]" />}
        {[hireAge, w.start, w.end, rule.retire].filter((v, i, a) => a.indexOf(v) === i).map((a) => (
          <text key={a} x={sx(a)} y={88} textAnchor="middle" className="fill-[var(--muted)] text-[11px] font-semibold">
            {a}
          </text>
        ))}
        <line x1={sx(age)} x2={sx(age)} y1={30} y2={76} className="stroke-[var(--fg)]" strokeWidth={2} />
        <text x={sx(age)} y={24} textAnchor="middle" className="fill-[var(--fg)] text-[12px] font-bold">
          היום ({age})
        </text>
        <text x={sx(rule.retire)} y={104} textAnchor="middle" className="fill-amber-600 text-[11px] font-bold dark:fill-amber-300">
          תשלום
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-5 rounded border border-dashed border-line-strong bg-surface-2" /> עובד, אבל לא נספר
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-5 rounded bg-accent" /> נצבר עד היום
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-5 rounded bg-accent opacity-25" /> ייצבר
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-3 w-5 rounded border border-line-strong" /> אחרי הזכאות — לא מוסיף
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="גיל בתחילת העבודה" value={hireAge} min={22} max={rule.retire - 2} step={1} onChange={setHire} show={`${hireAge}`} />
        <Slider label="גיל היום" value={age} min={hireAge} max={rule.retire} step={1} onChange={setAge} show={`${age}`} />
      </div>
      <p className="rounded-xl bg-surface-2/50 px-3 py-2 text-[14px] text-fg">{caseText}</p>
      <p className="text-[14px] text-fg">
        לשנה: <L>{n0(rule.grant)} ÷ {window}</L> = <strong className="num">{n0(rule.grant / window)}</strong> ₪ · נצברו {served} שנים · n = {rule.retire - age} (עד התשלום בגיל {rule.retire}, גם אם הצבירה נגמרת קודם).
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Practice: similar questions with new numbers.

/** A practice box for one or more kinds of question; the first draw is fixed (so the page renders the same on the server), every "new question" a random one. */
export function DrillBox({ families }: { families: DrillFamily[] }) {
  const [family, setFamily] = useState<DrillFamily>(families[0]);
  const [seed, setSeed] = useState(1);
  const drill = useMemo(() => makeDrill(family, seed), [family, seed]);
  const fresh = (f: DrillFamily = family) => {
    setFamily(f);
    setSeed(1 + Math.floor(Math.random() * 1e9));
  };
  return (
    <section className="space-y-3 rounded-2xl border-2 border-accent/30 bg-surface p-3.5" aria-label="מחולל שאלות דומות">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-bold text-fg">
          <Dices className="h-5 w-5 text-accent" aria-hidden /> מחולל שאלות: אותה סוגיה, מספרים חדשים
        </p>
        <button type="button" onClick={() => fresh()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-4 text-[14px] font-bold text-accent-fg">
          <Dices className="h-4 w-4" aria-hidden /> שאלה חדשה
        </button>
      </div>
      {families.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={f === family}
              onClick={() => fresh(f)}
              className={cn("rounded-full px-3 py-1 text-[13px] font-semibold ring-1", f === family ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line hover:text-fg")}
            >
              {DRILL_TITLES[f]}
            </button>
          ))}
        </div>
      )}
      <DrillView key={`${family}-${seed}`} drill={drill} />
    </section>
  );
}

function DrillView({ drill }: { drill: Drill }) {
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [solution, setSolution] = useState(false);
  const right = drill.asks.map((a) => (a.kind === "number" ? drillRight(a.answer, typed[a.id] ?? "") : picked[a.id] === a.answer));
  const score = right.filter(Boolean).length;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 rounded-xl bg-surface-2/50 px-3.5 py-3 text-[15px] leading-relaxed text-fg">
        {drill.story.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </div>
      <ol className="space-y-2">
        {drill.asks.map((a, i) => (
          <li key={a.id} className={cn("rounded-xl px-3 py-2 ring-1", !checked ? "ring-line" : right[i] ? "bg-success/10 ring-success/40" : "bg-danger/10 ring-danger/40")}>
            <p className="text-[14.5px] font-semibold text-fg">
              <span className="num me-1 text-accent">{i + 1}.</span>
              {a.label}
            </p>
            {a.kind === "number" ? (
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  inputMode="decimal"
                  dir="ltr"
                  value={typed[a.id] ?? ""}
                  onChange={(e) => {
                    setTyped({ ...typed, [a.id]: e.target.value });
                    setChecked(false);
                  }}
                  className="num h-10 w-40 rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-fg"
                  aria-label={a.label}
                />
                {a.unit && <span className="text-muted">{a.unit}</span>}
                {checked && (right[i] ? <Check className="h-5 w-5 text-success" aria-label="נכון" /> : <X className="h-5 w-5 text-danger" aria-label="לא נכון" />)}
                {checked && !right[i] && solution && <span className="num text-[13.5px] text-muted">התשובה: {n0(a.answer)}</span>}
              </div>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {a.options.map((o, k) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => {
                      setPicked({ ...picked, [a.id]: k });
                      setChecked(false);
                    }}
                    className={cn("rounded-lg px-3 py-1.5 text-[14px] font-semibold ring-1", picked[a.id] === k ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-fg ring-line-strong")}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setChecked(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-accent px-5 text-[15px] font-bold text-accent-fg">
          <Check className="h-4 w-4" aria-hidden /> בדיקה
        </button>
        <button type="button" onClick={() => setSolution(!solution)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-surface px-5 text-[15px] font-bold text-accent ring-1 ring-accent/40">
          <Eye className="h-4 w-4" aria-hidden /> {solution ? "הסתרת הפתרון" : "פתרון מלא"}
        </button>
        {checked && (
          <span className="text-[14px] font-semibold text-fg" aria-live="polite">
            {score} מתוך {drill.asks.length} נכונות{score === drill.asks.length ? " — מצוין!" : ". נסו שוב, או פתחו את הפתרון."}
          </span>
        )}
      </div>
      {solution && (
        <div className="anim-step-in space-y-2.5">
          <SolveTemplate seek={drill.seek} check={drill.check} build={drill.build} compact />
          {drill.table && (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[30rem] text-[13.5px]">
                <thead>
                  <tr className="bg-surface-2/70 text-muted">
                    {drill.table.head.map((h) => (
                      <th key={h} className="px-2.5 py-1.5 text-start font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drill.table.rows.map((r, i) => (
                    <tr key={i} className="border-t border-line/70">
                      {r.map((c, k) => (
                        <td key={k} className="num px-2.5 py-1.5 text-fg">
                          {typeof c === "number" ? n0(c) : c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {drill.table.foot && (
                  <tfoot>
                    <tr className="border-t border-line bg-surface-2/50 font-bold">
                      {drill.table.foot.map((c, k) => (
                        <td key={k} className="num px-2.5 py-1.5 text-fg">
                          {typeof c === "number" ? n0(c) : c}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
