"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { markTesterUpdatesSeen } from "@/lib/actions/tester-updates";
import type { TesterUpdate } from "@/lib/tester/updates";

const day = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });

/** One update as the tester reads it: the date, the title, its lines, and a button to the changed page. */
export function UpdateCard({ update, onLink }: { update: Pick<TesterUpdate, "title" | "body" | "linkHref" | "linkLabel"> & { createdAt?: string }; onLink?: () => void }) {
  return (
    <article className="rounded-xl border border-line bg-surface-2/50 px-4 py-3.5">
      {update.createdAt && <p className="num text-xs text-muted">{day.format(new Date(update.createdAt))}</p>}
      <h3 className="mt-0.5 font-semibold text-fg">{update.title || "כותרת העדכון"}</h3>
      {update.body && <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-muted">{update.body}</p>}
      {update.linkHref && (
        <Link href={update.linkHref} onClick={onLink} className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
          {update.linkLabel || "לדף שהשתנה"} <ArrowLeft className="size-3.5" aria-hidden />
        </Link>
      )}
    </article>
  );
}

/**
 * For a tester, the first time they open the site after the admin published updates
 * (/admin/feedback): what changed since they last looked, newest first. Closing it, or
 * following a link in it, marks every update in it seen, in their account, so it doesn't
 * come back on another device. Not over the admin pages.
 */
export function TesterUpdatesPopup({ updates }: { updates: TesterUpdate[] }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [closed, setClosed] = useState(false);
  const show = updates.length > 0 && !closed && !pathname.startsWith("/admin");

  useEffect(() => {
    const d = ref.current;
    if (show && d && !d.open) d.showModal();
  }, [show]);

  if (!show) return null;
  const newest = [...updates].reverse();

  const close = () => {
    // The button closes the dialog, which fires its close event: mark them seen once.
    if (closed) return;
    setClosed(true);
    ref.current?.close();
    void markTesterUpdatesSeen(updates.map((u) => u.id));
  };

  return (
    <dialog
      ref={ref}
      onClose={close}
      aria-labelledby="tester-updates-title"
      className="no-print m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-surface p-0 text-fg shadow-card backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="border-b border-line px-5 pt-5 pb-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Sparkles className="size-3.5" aria-hidden /> לניסיינים
        </p>
        <h2 id="tester-updates-title" className="mt-1 text-lg font-bold">
          {updates.length === 1 ? "מה השתנה מאז הביקור הקודם" : `${updates.length} דברים השתנו מאז הביקור הקודם`}
        </h2>
        <p className="mt-1 text-sm text-muted">אם משהו עדיין לא ברור, ספרו לנו בדירוג שמתחת למסך.</p>
      </div>
      <div className="max-h-[60dvh] space-y-3 overflow-y-auto px-5 py-4">
        {newest.map((u) => (
          <UpdateCard key={u.id} update={u} onLink={close} />
        ))}
      </div>
      <div className="border-t border-line px-5 py-4">
        <Button className="w-full" onClick={close} autoFocus>
          הבנתי, תודה
        </Button>
      </div>
    </dialog>
  );
}
