"use client";

import { ArrowLeft, CloudUpload, NotebookPen, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "@/components/layout/session-store";
import { updateTopic } from "@/components/study-mode/progress-store";
import { cue } from "@/components/study-mode/sound";
import { markStudied } from "@/components/study-mode/study-day";
import { TrapQuiz } from "@/components/study-mode/trap-quiz";
import { Button, ButtonLink } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { type Check, scoreCheck } from "@/lib/check";
import { afterAnswer, today } from "@/lib/study/review";
import { PRACTICE_GROUPS, recordTrap } from "@/lib/study/score";
import { studyHref } from "@/lib/study/href";
import { cn } from "@/lib/utils";

/**
 * Five traps, one at a time, with the summary open beside them; then the score,
 * every miss with why it tempts, and three ways on: keep the mistakes (an
 * account), send the check to the group, or go on to the course's free lesson.
 * Each answer counts as the lesson's own answer, so a miss joins the reader's review.
 */
export function CheckQuiz({ check, url }: { check: Check; url: string }) {
  const { items, topic, first } = check;
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const session = useSession();
  const name = topic.standard ? `${topic.standard} · ${topic.title}` : topic.title;
  const done = at >= items.length;

  const answer = (choice: number) => {
    const it = items[at];
    if (it.trap.id in answers) return;
    const ok = choice === it.trap.answer;
    const next = { ...answers, [it.trap.id]: choice };
    setAnswers(next);
    cue(ok ? "ok" : "bad");
    updateTopic(it.slug, (q) => afterAnswer(recordTrap(q, it.trap.id, choice, ok), { kind: "trap", trap: it.trap, group: PRACTICE_GROUPS[1] }, today()));
    markStudied();
    if (at === 0) track({ kind: "check_start", target: topic.id });
    track({ kind: "exercise_answer", target: it.slug, ok, meta: { id: it.trap.id, trap: true, check: topic.id } });
    if (Object.keys(next).length === items.length) track({ kind: "check_complete", target: topic.id, meta: { right: scoreCheck(items, next).right, of: items.length } });
  };

  if (done) {
    const { right, missed } = scoreCheck(items, answers);
    const kept = missed.filter((m) => m.free).length;
    const text = `בדקתי את הסיכום שלי ב־${name}: ${right} מתוך ${items.length}. בואו נראה אתכם — 5 שאלות, בלי הרשמה:`;
    const share = async () => {
      track({ kind: "share_click", target: topic.id, meta: { kind: "check", right } });
      const link = `${url}?utm_source=share&utm_medium=check&utm_campaign=${topic.id}`;
      if (navigator.share) {
        try {
          await navigator.share({ text, url: link });
          return;
        } catch {
          // Cancelled, or not allowed here: fall back to WhatsApp.
        }
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, "_blank", "noopener");
    };
    return (
      <div className="space-y-6">
        <section className="card p-6 text-center sm:p-8">
          <p className="text-sm font-semibold text-muted">{name}</p>
          <p className="num mt-2 font-display text-[3.25rem] leading-none font-black text-fg">
            {right}
            <span className="text-[1.75rem] text-muted">/{items.length}</span>
          </p>
          <p className="mt-3 text-[17px] font-semibold text-fg">
            {right === items.length
              ? "אף מלכודת לא תפסה אתכם. הסיכום שלכם עובד — עכשיו נשאר לפתור את השאלות המלאות."
              : missed.length === 1
                ? "כאן הייתם מפסידים נקודות בשאלה אחת. עדיף לגלות את זה עכשיו."
                : `כאן הייתם מפסידים נקודות ב־${missed.length} שאלות. עדיף לגלות את זה עכשיו.`}
          </p>
        </section>

        {missed.length > 0 && (
          <section aria-labelledby="check-missed" className="space-y-3">
            <h2 id="check-missed" className="text-[15px] font-bold text-fg">
              איפה נפלתם, ולמה זה מפתה
            </h2>
            {missed.map((m) => (
              <div key={m.trap.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                <p className="text-[13px] text-muted">
                  שיעור <span className="num">{m.n}</span>: {m.lesson}
                </p>
                <p className="mt-1 font-semibold text-fg">{m.trap.prompt}</p>
                <p className="mt-2 text-[14.5px] text-fg/90">
                  <span className="font-semibold text-danger">עניתם: </span>
                  {m.trap.options[answers[m.trap.id]]} — {m.trap.traps[answers[m.trap.id]]}
                </p>
                <p className="mt-1.5 text-[14.5px] text-fg/90">
                  <span className="font-semibold text-success">התשובה: </span>
                  {m.trap.options[m.trap.answer]}. {m.trap.why}
                </p>
              </div>
            ))}
          </section>
        )}

        <section aria-label="מה עכשיו" className="grid gap-3 sm:grid-cols-3">
          {session.known && !session.signedIn && missed.length > 0 ? (
            <Exit icon={<CloudUpload className="h-5 w-5" />} title="לשמור את הטעויות" text={kept ? "הן יחזרו אליכם לחזרה קצרה כבר מחר, בכל מכשיר." : "הן מחכות לכם בקורס, בכל מכשיר."}>
              <ButtonLink href={`/register?next=${encodeURIComponent(kept ? "/review" : studyHref(first.slug))}`} className="w-full">
                חשבון חינמי
              </ButtonLink>
            </Exit>
          ) : (
            <Exit icon={<NotebookPen className="h-5 w-5" />} title="לחזור על הטעויות" text={kept ? "מה שטעיתם בו נכנס לחזרה שלכם, ויחזור מחר." : "בחזרה תמצאו את השאלות שטעיתם בהן, בזמן הנכון."}>
              <ButtonLink href="/review" variant="secondary" className="w-full">
                לחזרה שלי
              </ButtonLink>
            </Exit>
          )}
          <Exit icon={<Share2 className="h-5 w-5" />} title="לבדוק את החברים" text="שלחו לקבוצה של הקורס. מי ייפול פחות?">
            <Button variant="secondary" onClick={share} className="w-full">
              שליחה לקבוצה
            </Button>
          </Exit>
          <Exit icon={<ArrowLeft className="h-5 w-5" />} title={`להמשיך ל${topic.title}`} text={`שיעור ${first.n} פתוח בחינם, עם תרגול ומשוב מיידי.`}>
            <ButtonLink href={studyHref(first.slug)} className="w-full">
              לשיעור {first.n}
            </ButtonLink>
          </Exit>
        </section>
      </div>
    );
  }

  const it = items[at];
  const answered = it.trap.id in answers ? { choice: answers[it.trap.id], correct: answers[it.trap.id] === it.trap.answer } : undefined;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="num text-sm font-semibold text-muted">
          שאלה {at + 1} מתוך {items.length}
        </p>
        <div className="flex flex-1 gap-1.5" aria-hidden>
          {items.map((x, i) => (
            <span key={x.trap.id} className={cn("h-1.5 flex-1 rounded-full", i < at || (i === at && answered) ? "bg-accent" : "bg-line")} />
          ))}
        </div>
      </div>
      <section className="card p-5 sm:p-6">
        <p className="mb-3 text-[13px] text-muted">
          משיעור <span className="num">{it.n}</span>: {it.lesson}
        </p>
        <TrapQuiz key={it.trap.id} trap={it.trap} answered={answered} onAnswer={answer} />
        {answered && (
          <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => setAt(at + 1)}>
            {at + 1 < items.length ? "לשאלה הבאה" : "לתוצאה"} <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </section>
      <p className="text-center text-sm text-muted">
        <Link href={topic.href} className="hover:text-fg hover:underline">
          מה יש בקורס {name}
        </Link>
      </p>
    </div>
  );
}

function Exit({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className="text-accent" aria-hidden>
          {icon}
        </span>
        {title}
      </p>
      <p className="flex-1 text-[14px] text-muted">{text}</p>
      {children}
    </div>
  );
}
