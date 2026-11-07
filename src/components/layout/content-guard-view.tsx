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

/** On the local dev server the guard stays off: the page doesn't blur when focus moves to the editor or a devtool. */
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
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Print and save-page.
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) e.preventDefault();
    };
    let timer: number | undefined;
    const printScreen = (e: KeyboardEvent) => {
      if (e.key !== "PrintScreen") return;
      // The capture is already taken when the key comes up; hide the page and replace what it copied.
      hide();
      navigator.clipboard?.writeText("").catch(() => {});
      window.clearTimeout(timer);
      timer = window.setTimeout(show, 1500);
    };
    // Blur when the window loses focus (a snipping tool, another app) — but not for clicks into
    // the page's own frames (the exam paper, a video), which also take focus from the window.
    const blurred = () => window.setTimeout(() => document.activeElement?.tagName !== "IFRAME" && hide(), 0);
    const visibility = () => (document.visibilityState === "hidden" ? hide() : show());

    document.addEventListener("contextmenu", noMenu);
    document.addEventListener("copy", noCopy);
    document.addEventListener("cut", noCopy);
    document.addEventListener("dragstart", noDrag);
    document.addEventListener("keydown", keys);
    document.addEventListener("keyup", printScreen);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blurred);
    window.addEventListener("focus", show);
    return () => {
      delete root.dataset.guard;
      window.clearTimeout(timer);
      document.removeEventListener("contextmenu", noMenu);
      document.removeEventListener("copy", noCopy);
      document.removeEventListener("cut", noCopy);
      document.removeEventListener("dragstart", noDrag);
      document.removeEventListener("keydown", keys);
      document.removeEventListener("keyup", printScreen);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blurred);
      window.removeEventListener("focus", show);
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
