"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { loadFeedback, saveFeedback } from "@/lib/actions/tester";
import { type FormState, emptyState, newer, sanitizeState, schema } from "./form";

/**
 * The tester's feedback form in the browser: a copy in localStorage (every tab and the
 * floating button share it) and, for a signed-in tester, the copy in their account. On
 * arrival the newer of the two wins; every change is written to both.
 */

const STORAGE_KEY = `tester-feedback-v${schema.version}`;
// Set when a tester hides the floating button in this browser; shown otherwise.
const MODE_KEY = "tester-button-hidden";
const MODE_EVENT = "tester-mode-change";

export function readLocal(): FormState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(state: FormState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// ---- whether this browser shows a tester the floating feedback button ----

export function setTesterMode(on: boolean) {
  try {
    if (on) localStorage.removeItem(MODE_KEY);
    else localStorage.setItem(MODE_KEY, "1");
  } catch {}
  window.dispatchEvent(new Event(MODE_EVENT));
}

const readMode = () => {
  try {
    return localStorage.getItem(MODE_KEY) !== "1";
  } catch {
    return true;
  }
};

function subscribeMode(cb: () => void) {
  window.addEventListener(MODE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(MODE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const useTesterMode = () => useSyncExternalStore(subscribeMode, readMode, () => false);

// ---- the form itself ----

export type SyncStatus = "loading" | "account" | "saving" | "local" | "failed";

export function useFeedback() {
  const [state, setState] = useState<FormState | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const dirty = useRef(false);
  const canSaveRef = useRef(false);
  const pending = useRef<FormState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushRemote = useCallback(async (s: FormState) => {
    if (!canSaveRef.current) return;
    setStatus("saving");
    const { ok } = await saveFeedback(s).catch(() => ({ ok: false }));
    setStatus(ok ? "account" : "failed");
  }, []);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const s = pending.current;
    pending.current = null;
    if (s) void pushRemote(s);
  }, [pushRemote]);

  // Arrival: the browser's copy at once, then the account's if it is newer.
  useEffect(() => {
    let live = true;
    const local = readLocal();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the saved draft after mount
    setState(local ?? emptyState());
    loadFeedback()
      .catch(() => ({ canSave: false, state: null }))
      .then(({ canSave, state: remote }) => {
        if (!live) return;
        canSaveRef.current = canSave;
        setCanSave(canSave);
        const best = newer(readLocal(), remote);
        if (canSave && best && best !== remote) {
          // The browser has something the account doesn't: send it up.
          setStatus("saving");
          void pushRemote(best);
        } else setStatus(canSave ? "account" : "local");
        if (best) {
          writeLocal(best);
          setState(best);
        }
      });
    return () => {
      live = false;
    };
  }, [pushRemote]);

  // Each change: the browser's copy now, the account's a moment later.
  useEffect(() => {
    if (!state || !dirty.current) return;
    dirty.current = false;
    writeLocal(state);
    if (!canSaveRef.current) {
      setStatus("local");
      return;
    }
    pending.current = state;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1200);
  }, [state, flush]);

  // Another tab (the full form, or a lesson with the button) changed it: take the newer copy.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const other = readLocal();
      setState((s) => newer(s, other) ?? s);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const update = useCallback((fn: (s: FormState) => FormState) => {
    dirty.current = true;
    setState((s) => (s ? { ...fn(s), updatedAt: new Date().toISOString() } : s));
  }, []);

  return { state, update, canSave, status };
}
