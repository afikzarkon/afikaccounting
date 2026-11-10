"use client";

import { ArrowLeft, RotateCcw, Repeat } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TrapQuiz } from "@/components/study-mode/trap-quiz";
import { track } from "@/lib/analytics/track";
import type { Trap } from "@/lib/study/types";
import { cn } from "@/lib/utils";

/** The demo's one question: prepaid rent, the classic first trap of accrual accounting. */
const TRAP: Trap = {
  id: "home-prepaid-rent",
  prompt: "שילמתם במזומן 5,000 ₪ שכר דירה על החודש הבא. מה נרשם בחובה?",
  options: ["הוצאות שכר דירה", "שכר דירה מראש (נכס)", "מזומנים"],
  answer: 1,
  why: "החודש עוד לא עבר, ועוד לא השתמשתם בדירה. מה ששילמתם הוא הזכות לגור בה בחודש הבא, ולכן זה נכס: שכר דירה מראש. בחודש הבא, כשתגורו בה, הנכס יהפוך להוצאה.",
  traps: ["שילמתם, אז נראה שזו הוצאה. אבל הוצאה נרשמת כשמשתמשים בדירה, וזה יקרה רק בחודש הבא.", "", "מזומנים יצאו מהעסק, ולכן הם בצד הזכות."],
};

const STEPS = ["המושג", "השאלה", "מה קרה"];

/**
 * "A one-minute lesson" in the hero: one concept, one question in the lesson's own
 * quiz (same feedback, same "why it tempts"), then what the site does with a mistake.
 * It shows how a lesson works instead of describing it. Nothing is stored; the answer is counted.
 */
export function MinuteLesson({ firstLesson, signUp }: { firstLesson: string; signUp: string }) {
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState<{ choice: number; correct: boolean }>();
  const [round, setRound] = useState(0);
  const restart = () => {
    setAnswered(undefined);
    setStep(0);
    setRound((r) => r + 1);
  };
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <p className="text-[15px] font-semibold text-fg">
          שיעור של דקה <span className="font-normal text-muted">· שלב {step + 1} מתוך 3: {STEPS[step]}</span>
        </p>
        <div className="flex w-24 shrink-0 gap-1" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-surface-2")} />
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-[18px] font-bold text-fg">כל אירוע בעסק נרשם פעמיים</p>
            <p className="text-[15.5px] leading-relaxed text-muted">
              קניתם ציוד ב־<bdi className="num">12,000</bdi> ₪ במזומן. נכנס לעסק ציוד, ויצא ממנו מזומן. מה שנכנס נרשם בחובה, מה שיצא בזכות, ושני הצדדים שווים.
            </p>
            <table className="num w-full text-[15px]">
              <thead>
                <tr className="border-b border-line-strong text-[12.5px] text-muted">
                  <th className="py-1.5 text-start font-semibold">חשבון</th>
                  <th className="py-1.5 text-end font-semibold">חובה</th>
                  <th className="py-1.5 text-end font-semibold">זכות</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2">
                    <span className="me-1.5 text-[12.5px] font-bold text-debit">ח׳</span>ציוד
                  </td>
                  <td className="py-2 text-end">12,000</td>
                  <td />
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2 ps-6">
                    <span className="me-1.5 text-[12.5px] font-bold text-credit">ז׳</span>מזומנים
                  </td>
                  <td />
                  <td className="py-2 text-end">12,000</td>
                </tr>
              </tbody>
            </table>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-[15px] font-semibold text-accent-fg transition hover:brightness-110"
            >
              הבנתי, לשאלה <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        {step >= 1 && (
          <div className="space-y-4">
            <TrapQuiz
              key={round}
              trap={TRAP}
              answered={answered}
              onAnswer={(choice) => {
                const correct = choice === TRAP.answer;
                setAnswered({ choice, correct });
                setStep(2);
                track({ kind: "exercise_answer", target: "home-minute", ok: correct, meta: { id: TRAP.id, trap: true, round } });
              }}
            />
            {answered && (
              <>
                <div className="flex items-start gap-3 rounded-xl bg-accent-soft p-3.5 text-[14.5px] leading-relaxed text-fg">
                  <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
                  <span>
                    <strong>ככה זה בכל שיעור.</strong> שאלה שטעיתם בה חוזרת אליכם אחרי יום, אחרי שלושה ימים ואחרי שבוע, עד שתענו עליה נכון שלוש פעמים ברצף.
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={firstLesson} className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-[15px] font-semibold text-accent-fg transition hover:brightness-110">
                    להמשיך לשיעור 1, חינם <ArrowLeft className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link href={signUp} className="text-sm font-semibold text-accent hover:underline">
                    להירשם ולשמור את ההתקדמות
                  </Link>
                  <button type="button" onClick={restart} className="ms-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden /> מההתחלה
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
