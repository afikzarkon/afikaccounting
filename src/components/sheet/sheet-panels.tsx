"use client";

import { X } from "lucide-react";
import { ADDED, HEBREW } from "./sheet-functions";
import { TEMPLATES, type Template } from "./sheet-templates";

/** A function on the help page: its name and one example a reader can read off. */
type Entry = [name: string, example: string];

const GROUPS: { title: string; entries: Entry[] }[] = [
  {
    title: "ערך הזמן של הכסף",
    entries: [
      ["PV", "=PV(5%,3,0,-1000)"],
      ["FV", "=FV(5%,3,0,-1000)"],
      ["NPV", "=NPV(6%,B2:B6)"],
      ["IRR", "=IRR(B2:B6)"],
      ["XNPV", "=XNPV(6%,B2:B6,A2:A6)"],
      ["XIRR", "=XIRR(B2:B6,A2:A6)"],
      ["RATE", "=RATE(5,-23097,100000)"],
      ["EFFECT", "=EFFECT(12%,12)"],
    ],
  },
  {
    title: "הלוואות",
    entries: [
      ["PMT", "=PMT(5%,5,-100000)"],
      ["IPMT", "=IPMT(5%,1,5,-100000)"],
      ["PPMT", "=PPMT(5%,1,5,-100000)"],
      ["NPER", "=NPER(5%,-23097,100000)"],
    ],
  },
  {
    title: "פחת",
    entries: [
      ["SLN", "=SLN(240000,40000,8)"],
      ["DDB", "=DDB(240000,40000,8,1)"],
      ["SYD", "=SYD(240000,40000,8,1)"],
    ],
  },
  {
    title: "סיכום ותנאים",
    entries: [
      ["SUM", "=SUM(B2:B9)"],
      ["SUMIF", '=SUMIF(A2:A9,"דלק",B2:B9)'],
      ["SUMIFS", '=SUMIFS(C2:C9,A2:A9,"דלק",B2:B9,2025)'],
      ["SUMPRODUCT", "=SUMPRODUCT(B2:B6,C2:C6)"],
      ["ROUND", "=ROUND(A1,0)"],
      ["MIN", "=MIN(B2,C2)"],
      ["MAX", "=MAX(B2-C2,0)"],
      ["IF", "=IF(A1>B1,A1-B1,0)"],
      ["IFS", '=IFS(A1>=90,"א",A1>=80,"ב",TRUE,"ג")'],
      ["IFERROR", "=IFERROR(A1/B1,0)"],
    ],
  },
  {
    title: "חיפוש",
    entries: [
      ["VLOOKUP", "=VLOOKUP(A2,D2:E9,2,FALSE)"],
      ["XLOOKUP", "=XLOOKUP(A2,D2:D9,E2:E9)"],
      ["INDEX", "=INDEX(E2:E9,3,1)"],
      ["MATCH", "=MATCH(A2,D2:D9,0)"],
    ],
  },
  {
    title: "תאריכים",
    entries: [
      ["EOMONTH", "=EOMONTH(A1,0)"],
      ["EDATE", "=EDATE(A1,6)"],
      ["YEARFRAC", "=YEARFRAC(A1,B1)"],
      ["DAYS", "=DAYS(B1,A1)"],
      ["DATEDIF", '=DATEDIF(A1,B1,"M")'],
    ],
  },
];

const SHORTCUTS: [keys: string, what: string][] = [
  ["F4", "בזמן כתיבת נוסחה: נועל את ההפניה שהסמן עליה, ‎$A$1‎, ואז ‎A$1‎, ‎$A1‎ וחזרה"],
  ["← ↑ → ↓", "אחרי = או פעולת חשבון: בוחרים תא עם החצים במקום להקליד את הכתובת שלו"],
  ["Shift + חץ", "מרחיב את הבחירה לטווח, לדוגמה ‎A1:A5‎"],
  ["Alt + =", "סכום אוטומטי של המספרים שמעל התא או לצידו"],
  ["F2", "עריכת התא. החצים מזיזים את הסמן בתוך הטקסט"],
  ["Ctrl + Shift + 1", "מספר עם פסיקים ושתי ספרות אחרי הנקודה"],
  ["Ctrl + Shift + 4", "מטבע (₪)"],
  ["Ctrl + Shift + 5", "אחוזים"],
  ["Ctrl + B / I / U", "מודגש, נטוי, קו תחתון"],
  ["Ctrl + ;", "התאריך של היום"],
  ["Ctrl + D", "מעתיק את התא העליון לכל התאים המסומנים מתחתיו"],
  ["Ctrl + Z / Y", "ביטול וחזרה"],
];

const about = (name: string) => HEBREW[name]?.a ?? ADDED[name]?.a ?? "";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div dir="rtl" role="dialog" aria-label={title} className="absolute inset-0 z-30 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-sm font-semibold text-fg">{title}</p>
        <button type="button" onClick={onClose} aria-label="סגירה" className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>
  );
}

/** The functions an accounting student uses, each with an example; a click starts it in the selected cell. */
function Help({ onClose, onInsert }: { onClose: () => void; onInsert: (text: string) => void }) {
  return (
    <Shell title="פונקציות וקיצורי מקלדת" onClose={onClose}>
      <p className="text-[13px] leading-relaxed text-muted">לחיצה על פונקציה מתחילה אותה בתא המסומן. בזמן ההקלדה מופיע הסבר על כל ארגומנט.</p>
      {GROUPS.map((group) => (
        <section key={group.title} className="mt-5">
          <h3 className="mb-2 text-[13px] font-bold text-fg">{group.title}</h3>
          <ul className="space-y-1.5">
            {group.entries.map(([name, example]) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onInsert(`=${name}(`)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-start transition hover:border-accent hover:bg-accent-soft"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <bdi dir="ltr" className="font-mono text-[13px] font-bold text-accent">
                      {name}
                    </bdi>
                    <span className="text-[13px] text-fg">{about(name)}</span>
                  </span>
                  <bdi dir="ltr" className="mt-1 block text-left font-mono text-[12px] text-muted">
                    {example}
                  </bdi>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="mt-6">
        <h3 className="mb-2 text-[13px] font-bold text-fg">קיצורי מקלדת</h3>
        <dl className="space-y-1.5">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys} className="flex gap-3 rounded-xl bg-surface-2/60 px-3 py-2">
              <dt className="w-32 shrink-0">
                <bdi dir="ltr" className="font-mono text-[12px] font-bold text-fg">
                  {keys}
                </bdi>
              </dt>
              <dd className="text-[13px] leading-relaxed text-fg">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[12px] text-muted">במק: Cmd במקום Ctrl.</p>
      </section>
    </Shell>
  );
}

/** The ready sheets; a click adds one as a new tab. */
function Templates({ onClose, onPick }: { onClose: () => void; onPick: (template: Template) => void }) {
  return (
    <Shell title="תבניות מוכנות" onClose={onClose}>
      <p className="text-[13px] leading-relaxed text-muted">תבנית נפתחת כלשונית חדשה, והגיליון שלכם נשאר כמו שהוא. את התאים הצהובים ממלאים, והשאר מחושב מהם.</p>
      <ul className="mt-4 space-y-2">
        {TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-start transition hover:border-accent hover:bg-accent-soft"
            >
              <span className="block text-[14px] font-bold text-fg">{t.name}</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{t.about}</span>
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export type PanelKind = "help" | "templates";

export default function SheetPanel({ kind, onClose, onInsert, onPick }: { kind: PanelKind; onClose: () => void; onInsert: (text: string) => void; onPick: (template: Template) => void }) {
  return kind === "help" ? <Help onClose={onClose} onInsert={onInsert} /> : <Templates onClose={onClose} onPick={onPick} />;
}
