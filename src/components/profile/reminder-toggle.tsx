"use client";

import { BellRing } from "lucide-react";
import { useState, useTransition } from "react";
import { setReminders } from "@/lib/actions/habits";

/**
 * Study reminders by email: off until the reader turns them on. At most one a day,
 * only when mistakes are due for review or an exam is near, and never on a day
 * they already studied. Every email carries a one-click way to stop.
 */
export function ReminderToggle({ on, available }: { on: boolean; available: boolean }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
        <BellRing className="h-4 w-4 text-accent" aria-hidden /> תזכורות לימוד במייל
      </h2>
      <label className="mt-4 flex items-start gap-3 text-[14.5px] text-fg">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--accent)]"
          checked={value}
          disabled={pending || !available}
          onChange={(e) => {
            const next = e.target.checked;
            setValue(next);
            setFailed(false);
            start(async () => {
              const r = await setReminders(next);
              if (!r.ok) {
                setValue(!next);
                setFailed(true);
              }
            });
          }}
        />
        <span>
          לשלוח לי תזכורת כשיש שאלות שמחכות לחזרה, או כשהמבחן קרוב
          <span className="mt-1 block text-[13px] text-muted">
            לכל היותר מייל אחד ביום, ורק ביום שעוד לא למדתם בו. בכל מייל יש קישור לביטול בלחיצה אחת.
            {!available && " (התזכורות יופעלו בקרוב.)"}
          </span>
        </span>
      </label>
      {failed && <p className="mt-2 text-sm text-danger">לא הצלחנו לשמור. נסו שוב.</p>}
    </section>
  );
}
