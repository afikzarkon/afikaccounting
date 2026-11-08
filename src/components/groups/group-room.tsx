"use client";

import { CalendarClock, Check, Copy, Flame, Gauge, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { ShareButton } from "@/components/check/share-button";
import { useStudyDays, useTopics } from "@/components/study-mode/progress-store";
import { Button } from "@/components/ui/button";
import { leaveGroup, setGroupExamDate, updateMyMember } from "@/lib/actions/groups";
import type { Group, Member } from "@/lib/data/groups";
import { inName } from "@/lib/hebrew";
import { readinessOf } from "@/lib/study/readiness";
import { dayOf, today } from "@/lib/study/review";
import { streakOf } from "@/lib/study/streak";
import type { StudyModule } from "@/lib/study/types";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
const dayOfDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return dayOf(new Date(y, m - 1, d, 12).getTime());
};

/**
 * A study group: the exam's countdown, who studied today (a shared goal, not a
 * ranking), and each member — their readiness and streak only if they chose to
 * share them. The reader's own snapshot (readiness for the group's course,
 * streak, last study day) is sent when they open the room, so the others see it.
 */
export function GroupRoom({ group, members, me, courseName, lessons }: { group: Group; members: Member[]; me: string; courseName: string; lessons: StudyModule[] }) {
  const router = useRouter();
  const day = useSyncExternalStore(noSubscribe, today, () => -1);
  const topics = useTopics(lessons.map((m) => m.slug));
  const studyDays = useStudyDays();
  const mine = members.find((m) => m.user_id === me);
  const owner = group.owner === me;
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [date, setDate] = useState(group.exam_date ?? "");

  // The reader's snapshot for the others: sent when it differs from what the group holds.
  const readiness = day >= 0 ? readinessOf(lessons, topics, day).score : null;
  const streak = day >= 0 ? streakOf(studyDays, day).days : null;
  const last = studyDays.length ? studyDays[studyDays.length - 1] : null;
  useEffect(() => {
    if (!mine || readiness === null || streak === null) return;
    if (mine.readiness === readiness && mine.streak === streak && mine.studied_on === last) return;
    updateMyMember(group.id, { readiness, streak, studied_on: last }).then((r) => r.ok && router.refresh());
  }, [group.id, mine, readiness, streak, last, router]);

  if (day < 0) return null;
  const studiedToday = members.filter((m) => m.studied_on === day).length;
  const left = group.exam_date ? dayOfDate(group.exam_date) - day : null;
  const invitePath = `/groups/join/${group.invite_code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the share button still works.
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <Users className="h-4 w-4 text-accent" aria-hidden /> היעד של היום
          </p>
          <p className="num mt-1 text-[26px] font-bold text-fg">
            {studiedToday} מתוך {members.length}
          </p>
          <p className="text-[14px] text-fg/90">{studiedToday === members.length ? "כולם למדו היום. יפה!" : "למדו היום. תשובה אחת בשיעור או בחזרה נספרת."}</p>
        </section>
        <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted">
            <CalendarClock className="h-4 w-4 text-accent" aria-hidden /> המבחן {inName(courseName)}
          </p>
          {left === null ? (
            <p className="mt-1 text-[15px] text-fg">עוד לא נקבע תאריך.</p>
          ) : (
            <p className="num mt-1 text-[26px] font-bold text-fg">{left > 1 ? `עוד ${left} ימים` : left === 1 ? "מחר" : left === 0 ? "היום. בהצלחה!" : "המבחן עבר"}</p>
          )}
          {owner && (
            <div className="mt-2 flex flex-wrap gap-2">
              <input type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} aria-label="תאריך המבחן של הקבוצה" className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 text-sm text-fg" />
              <Button size="sm" variant="secondary" disabled={pending || date === (group.exam_date ?? "")} onClick={() => start(async () => void (await setGroupExamDate(group.id, date || null), router.refresh()))}>
                שמירה
              </Button>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-surface p-4 ring-1 ring-line">
        <p className="text-[15px] font-bold text-fg">להזמין חברים</p>
        <p className="mt-1 text-[14px] text-muted">כל מי שיש לו את הקישור יכול להצטרף (עד 30). שלחו אותו לקבוצת הוואטסאפ של הקורס.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} {copied ? "הקישור הועתק" : "העתקת הקישור"}
          </Button>
          <ShareButton path={invitePath} campaign={group.course} kind="group" label="שליחה בוואטסאפ" text={`בואו ללמוד איתי ${inName(courseName)} לקראת המבחן — קבוצה ב־AfikAccounting:`} />
        </div>
      </section>

      <section aria-labelledby="group-members">
        <h2 id="group-members" className="mb-2 text-[15px] font-bold text-fg">
          חברי הקבוצה
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
          {members.map((m) => {
            const today_ = m.studied_on === day;
            return (
              <li key={m.user_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <span className="min-w-0 flex-1 font-semibold text-fg">
                  {m.display_name}
                  {m.user_id === me && <span className="ms-1.5 text-[12px] font-normal text-muted">(אתם)</span>}
                  {m.user_id === group.owner && <span className="ms-1.5 text-[12px] font-normal text-muted">· פתח/ה את הקבוצה</span>}
                </span>
                <span className={cn("text-[13px]", today_ ? "text-success" : "text-subtle")}>{today_ ? "✓ למד/ה היום" : "עוד לא היום"}</span>
                {m.share_progress && m.readiness !== null && (
                  <span className="num flex items-center gap-1 text-[13px] text-fg/90">
                    <Gauge className="h-3.5 w-3.5 text-accent" aria-hidden /> {m.readiness}%
                  </span>
                )}
                {m.share_progress && !!m.streak && (
                  <span className="num flex items-center gap-1 text-[13px] text-fg/90">
                    <Flame className="h-3.5 w-3.5 text-[#f97316]" aria-hidden /> {m.streak}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {mine && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-2/60 p-4 ring-1 ring-line">
          <label className="flex min-w-0 flex-1 items-start gap-2.5 text-[14px] text-fg">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={mine.share_progress}
              disabled={pending}
              onChange={(e) => start(async () => void ((await updateMyMember(group.id, { share_progress: e.target.checked })).ok && router.refresh()))}
            />
            <span>
              להראות לקבוצה את המוכנות שלי ואת הרצף
              <span className="block text-[12.5px] text-muted">כבוי, הקבוצה רואה רק אם למדתם היום. אפשר לשנות בכל רגע.</span>
            </span>
          </label>
          <Button variant="danger" size="sm" disabled={pending} onClick={() => confirm(owner ? "לסגור את הקבוצה לכולם?" : "לעזוב את הקבוצה?") && start(() => leaveGroup(group.id))}>
            <LogOut className="h-4 w-4" aria-hidden /> {owner ? "סגירת הקבוצה" : "עזיבה"}
          </Button>
        </section>
      )}
    </div>
  );
}
