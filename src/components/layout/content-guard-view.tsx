"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

/** The pages whose content is guarded: the courses, the lessons, review, and an exam. */
const GUARDED = ["/study/", "/basics", "/review", "/exams/"];
export const isGuarded = (pathname: string) => GUARDED.some((p) => pathname === p.replace(/\/$/, "") || pathname.startsWith(p));

const editable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']");

/** A tiled, rotated line of text as an SVG background: no element to delete in place of it. */
function watermark(text: string) {
  const safe = text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200"><text x="0" y="110" transform="rotate(-24 180 100)" font-family="sans-serif" font-size="14" fill="#808080" fill-opacity="0.16">${safe}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function ContentGuardView({ mark }: { mark: string | null }) {
  const pathname = usePathname();
  const on = isGuarded(pathname);
  const background = useMemo(() => (mark ? watermark(`${mark} · ${new Date().toLocaleDateString("he-IL")}`) : null), [mark]);

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

  if (!on || !background) return null;
  return <div aria-hidden className="content-watermark" style={{ backgroundImage: background }} />;
}
