"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { MARK_SPOTS } from "@/lib/watermark";

/** The pages whose content is guarded: the courses, the lessons, review, and an exam. */
const GUARDED = ["/study/", "/basics", "/review", "/exams/"];
export const isGuarded = (pathname: string) => GUARDED.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p));

// The reader's own spreadsheet (components/sheet) is theirs to copy and paste in.
const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true'], [data-sheet]");

/** On the local dev server the guard stays off. */
const DEV = process.env.NODE_ENV === "development";

export function ContentGuardView({ code }: { code: string | null }) {
  const pathname = usePathname();
  const on = !DEV && isGuarded(pathname);

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.dataset.guard = "on";
    const hide = () => (root.dataset.guard = "hidden");
    const show = () => (root.dataset.guard = "on");

    const noMenu = (e: MouseEvent) => !editable(e.target) && e.preventDefault();
    const noCopy = (e: ClipboardEvent) => !editable(e.target) && e.preventDefault();
    const noDrag = (e: DragEvent) => e.preventDefault();
    let timer: number | undefined;
    // Blur only for a screenshot attempt — not when the reader moves to another window beside the page.
    const capture = () => {
      hide();
      window.clearTimeout(timer);
      timer = window.setTimeout(show, 1500);
    };
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Print and save-page.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (k === "p" || k === "s")) e.preventDefault();
      // Screenshot shortcuts the browser gets to see: Win+Shift+S, Cmd+Shift+3/4/5.
      if (e.metaKey && e.shiftKey && ["s", "3", "4", "5"].includes(k)) capture();
    };
    const printScreen = (e: KeyboardEvent) => {
      if (e.key !== "PrintScreen") return;
      // The capture is already taken when the key comes up; hide the page and replace what it copied.
      capture();
      navigator.clipboard?.writeText("").catch(() => {});
    };

    document.addEventListener("contextmenu", noMenu);
    document.addEventListener("copy", noCopy);
    document.addEventListener("cut", noCopy);
    document.addEventListener("dragstart", noDrag);
    document.addEventListener("keydown", keys);
    document.addEventListener("keyup", printScreen);
    return () => {
      delete root.dataset.guard;
      window.clearTimeout(timer);
      document.removeEventListener("contextmenu", noMenu);
      document.removeEventListener("copy", noCopy);
      document.removeEventListener("cut", noCopy);
      document.removeEventListener("dragstart", noDrag);
      document.removeEventListener("keydown", keys);
      document.removeEventListener("keyup", printScreen);
    };
  }, [on]);

  if (!on || !code) return null;
  // Nearly transparent: unseen while reading, there in every capture of the screen.
  return (
    <div aria-hidden>
      {MARK_SPOTS.map((s) => (
        <span key={s.id} className="content-mark" style={s.style}>
          {code}
        </span>
      ))}
    </div>
  );
}
