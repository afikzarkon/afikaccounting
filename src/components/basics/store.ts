"use client";

import { useSyncExternalStore } from "react";

/**
 * The page's progress — chapters seen and practice answers — kept per browser.
 * Storage can be blocked (private mode, previews), so every access is guarded
 * and an in-memory copy keeps the page working without it.
 */
export type Progress = { visited: string[]; answers: Record<string, { value: string; correct: boolean }> };

const KEY = "afik.basics.progress.v1";
const EVENT = "afik-basics-progress";
const EMPTY: Progress = { visited: [], answers: {} };
let memory = JSON.stringify(EMPTY);

const read = () => {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
};

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};

const parse = (raw: string): Progress => {
  try {
    const p = JSON.parse(raw) as Partial<Progress>;
    return { visited: Array.isArray(p.visited) ? p.visited : [], answers: p.answers && typeof p.answers === "object" ? p.answers : {} };
  } catch {
    return EMPTY;
  }
};

export function useProgress(): Progress {
  const raw = useSyncExternalStore(subscribe, read, () => JSON.stringify(EMPTY));
  return parse(raw);
}

export function updateProgress(change: (p: Progress) => Progress) {
  const next = JSON.stringify(change(parse(read())));
  memory = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Storage blocked: progress lasts until the page is closed.
  }
  window.dispatchEvent(new Event(EVENT));
}
