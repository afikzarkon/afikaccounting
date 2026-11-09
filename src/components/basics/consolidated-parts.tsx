import { BookOpen, ChevronDown, MessageCircleQuestion } from "lucide-react";
import type { ReactNode } from "react";
import { ltrFormulas, ltrQuiz } from "@/lib/study/ias19/ltr";
import { IasQuiz } from "./ias19-quiz";
import type { QuizItem } from "./inventory-interactive";

/** What the consolidated course's screens share. */

export const quiz = (chapter: string, items: QuizItem[]) => <IasQuiz prefix="consolidated" chapter={chapter} items={ltrQuiz(items)} />;

function Fold({ tag, title, icon, children, foot }: { tag: string; title: ReactNode; icon: ReactNode; children: ReactNode; foot: ReactNode }) {
  return (
    <details className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[15px] font-semibold text-fg [&::-webkit-details-marker]:hidden">
        <span className="text-accent [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
        <span className="min-w-0 flex-1">{title}</span>
        <span className="text-[12px] font-medium text-muted">{tag}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 border-t border-line px-4 py-3 text-[15px] leading-relaxed">
        {children}
        <p className="text-[13.5px] font-semibold text-muted">{foot}</p>
      </div>
    </details>
  );
}

/** Where the lecturer differs from the standard or from himself: what each says and where. The lecturer's rule stays the screen's main path. */
export function LecturerNote({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Fold tag="הערה" title={title} icon={<MessageCircleQuestion aria-hidden />} foot="יש לשאול את המרצה.">
      {children}
    </Fold>
  );
}

/** What the standards say and the lecturer's written material doesn't teach, for whoever wants to know more. Never practised. */
export function Expansion({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Fold tag="להרחבה" title={title} icon={<BookOpen aria-hidden />} foot="הנושא לא מופיע בחומר הכתוב של המרצה. מי שרוצה לדעת אם הוא נדרש למבחן, שישאל את המרצה.">
      {children}
    </Fold>
  );
}

/** A table row's label with its calculation under it, so a row fits a phone without squeezing the figures. */
export function Calc({ label, formula }: { label: string; formula: string }) {
  return (
    <span>
      {label}
      <bdi dir="ltr" className="num block text-start text-[12.5px] text-muted">
        {formula}
      </bdi>
    </span>
  );
}

function Box({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <div className={`rounded-xl border px-3 py-2 text-center text-[14px] ${strong ? "border-accent bg-accent-soft font-semibold text-fg" : "border-line bg-surface text-fg"}`}>{children}</div>;
}

function Line({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-[13px] font-semibold text-muted">
      <span className="h-3 w-px bg-line-strong" aria-hidden />
      <bdi dir="ltr" className="num">{children}</bdi>
      <span className="h-3 w-px bg-line-strong" aria-hidden />
    </div>
  );
}

/** Worked cases, one card each: long text doesn't fit a three-column table on a phone. */
export function CaseList({ cases }: { cases: { story: string; verdict: string; yes: boolean; why: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {cases.map((c, i) => (
        <li key={i} className="rounded-xl border border-line bg-surface p-3.5 text-[15px] leading-relaxed">
          <p className="text-fg">{ltrFormulas(c.story)}</p>
          <p className={`mt-1.5 font-bold ${c.yes ? "text-success" : "text-danger"}`}>{c.verdict}</p>
          <p className="mt-0.5 text-muted">{ltrFormulas(c.why)}</p>
        </li>
      ))}
    </ul>
  );
}

function Down() {
  return <span className="mx-auto block h-3 w-px bg-line-strong" aria-hidden />;
}

/** The way through the question of power, from the relevant activities to who holds the votes, in the order of the lecturer's chart. */
export function PowerFlow() {
  return (
    <figure aria-label="קודם מזהים את הפעילויות הרלוונטיות, אחר כך את הזכויות הקיימות, ואז את הגורם הדומיננטי. בזכויות הצבעה בודקים אם יש רוב. אם קשה להכריע, עוברים לראיות ולסימנים" className="rounded-2xl border border-line bg-surface p-3.5">
      <Box strong>זיהוי הפעילויות הרלוונטיות</Box>
      <Down />
      <Box strong>זיהוי הזכויות הקיימות, שאינן מגינות</Box>
      <Down />
      <Box strong>מהו הגורם הדומיננטי בהתוויית הפעילויות?</Box>
      <Down />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-center text-[13px] font-semibold text-muted">זכויות הצבעה</p>
          <Box>האם יש רוב קולות?</Box>
          <Down />
          <Box>יש: האם הזכויות ממשיות? בודקים גם זכויות של אחרים</Box>
          <Down />
          <Box>אין: הסדרים חוזיים, גודל יחסי ופיזור, זכויות פוטנציאליות</Box>
        </div>
        <div className="space-y-1">
          <p className="text-center text-[13px] font-semibold text-muted">לא זכויות הצבעה</p>
          <Box>בוחנים את הזכויות החוזיות, יחד עם המטרה, המבנה והסיכונים של הישות</Box>
        </div>
      </div>
      <Down />
      <Box>קשה להכריע? ראיות אחרות לכוח השפעה, וסימנים ליחסים מיוחדים</Box>
    </figure>
  );
}

/** Who owns what: the parent's shareholders, the parent, the subsidiary, and the non-controlling interests beside them. */
export function HoldingChart({ parent, sub, pct, label }: { parent: string; sub: string; pct: number; label: string }) {
  return (
    <figure aria-label={label} className="grid grid-cols-2 gap-x-3">
      <div className="flex flex-col">
        <Box>בעלי המניות של {parent}</Box>
        <Line>100%</Line>
        <Box strong>{parent}: החברה האם</Box>
        <Line>{pct}%</Line>
      </div>
      <div className="flex flex-col justify-end">
        <Box>זשמ״ש: בעלי המניות האחרים של {sub}</Box>
        <Line>{100 - pct}%</Line>
      </div>
      <div className="col-span-2">
        <Box strong>{sub}: החברה הבת</Box>
      </div>
    </figure>
  );
}
