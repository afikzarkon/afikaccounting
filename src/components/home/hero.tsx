"use client";

import { ArrowLeft, CheckCircle2, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

/** Illustrative output from the IFRS 16 calculator (5-year lease, 100/yr, 5%). */
const PREVIEW_LINES = [
  { account: "נכס זכות שימוש", dr: "432.95", cr: "" },
  { account: "התחייבות בגין חכירה", dr: "", cr: "432.95" },
];
const PREVIEW_SCHEDULE = [
  ["שנה 1", "432.95", "21.65", "354.60"],
  ["שנה 2", "354.60", "17.73", "272.33"],
  ["שנה 3", "272.33", "13.62", "185.95"],
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(79_139_255_/_0.28),transparent)] blur-2xl" />
      <div className="pointer-events-none absolute top-40 -end-40 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,rgb(34_211_238_/_0.2),transparent)] blur-2xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-28">
        <div>
          <motion.p
            {...rise(0)}
            className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            IFRS 16 · IAS 16 · IAS 37 · מס חברות בישראל
          </motion.p>
          <motion.h1
            {...rise(0.06)}
            className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl"
          >
            מנוע <span className="text-gradient">החשבונאות והכספים</span> של הדור הבא
          </motion.h1>
          <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
            {site.description} מגדירים תרחיש שלב אחר שלב ומקבלים פקודות יומן, לוחות סילוקין ובאורים מוכנים
            לביקורת — עם ההנמקה מהתקן לצד כל מספר.
          </motion.p>
          <motion.div {...rise(0.18)} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/engine" size="lg">
              הפעלת המנוע החשבונאי <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/learn" variant="secondary" size="lg">
              <GraduationCap className="h-4 w-4" /> למסלול הלימוד
            </ButtonLink>
            <ButtonLink href="/content" variant="ghost" size="lg">
              <PlayCircle className="h-4 w-4" /> וידאו ומאמרים
            </ButtonLink>
          </motion.div>
          <motion.ul {...rise(0.24)} className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            {["רישום כפול מאוזן, תמיד", "ייצוא ל-Excel ול-PDF", "הפניות ברמת הסעיף"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative [perspective:1200px]"
          aria-hidden
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass relative rounded-3xl p-5 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ms-3 font-mono text-[11px] text-subtle">ifrs-16 / פתרון</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                ["התחייבות חכירה", "₪432.95"],
                ["זכות שימוש", "₪432.95"],
                ["סך הריבית", "₪67.05"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-line bg-surface/70 p-3">
                  <p className="text-[10px] text-muted">{l}</p>
                  <p className="num mt-1 text-sm font-semibold text-fg">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-line bg-surface/70">
              <p className="border-b border-line px-3 py-2 text-[11px] font-medium text-muted">פקודה 1 · מועד ההתחלה</p>
              {PREVIEW_LINES.map((l) => (
                <div key={l.account} className="grid grid-cols-[1fr_70px_70px] px-3 py-1.5 font-mono text-[11px]">
                  <span className={l.cr ? "ps-5 text-muted" : "text-fg"}>{l.cr ? "ז׳ " : "ח׳ "}{l.account}</span>
                  <span className="text-end text-debit">{l.dr}</span>
                  <span className="text-end text-credit">{l.cr}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface/70">
              <div className="grid grid-cols-4 border-b border-line px-3 py-2 text-[10px] text-subtle">
                <span>תקופה</span>
                <span className="text-end">פתיחה</span>
                <span className="text-end">ריבית</span>
                <span className="text-end">סגירה</span>
              </div>
              {PREVIEW_SCHEDULE.map((r, i) => (
                <motion.div
                  key={r[0]}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.12 }}
                  className="grid grid-cols-4 px-3 py-1.5 font-mono text-[11px] text-muted"
                >
                  <span className="text-fg">{r[0]}</span>
                  {r.slice(1).map((c, j) => (
                    <span key={j} className="text-end">
                      {c}
                    </span>
                  ))}
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
            className="glass absolute -bottom-6 -start-4 hidden rounded-2xl px-4 py-3 shadow-xl sm:block"
          >
            <p className="text-[10px] font-semibold text-accent">הנחיה</p>
            <p className="mt-0.5 text-xs text-fg">IFRS 16.26 — היוון בשיעור הריבית הגלום בחכירה</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
