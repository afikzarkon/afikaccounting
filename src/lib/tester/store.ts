"use client";

import { useSyncExternalStore } from "react";
import { loadFeedback, saveFeedback } from "@/lib/actions/tester";
import { type FormState, emptyState, newer, sanitizeState, schema } from "./form";

/**
 * The tester's feedback in the browser: a copy in localStorage (every tab shares it) and, for a
 * signed-in tester, the copy in their account. One store for the whole tab: the rating under each
 * lesson page writes it, and "next" reads it.
 * On arrival the newer of the two copies wins; every change is written to both.
 */

const STORAGE_KEY = `tester-feedback-v${schema.version}`;

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

// ---- whether the signed-in account is a tester ----
// The server decides (components/tester/feedback-gate.tsx renders the marker only for a tester);
// the marker sets it here, so the lessons show the rating and hold "next" without asking the server again.

let tester = false;
const testerSubs = new Set<() => void>();

export function markTester() {
  if (tester) return;
  tester = true;
  testerSubs.forEach((f) => f());
}

function subscribeTester(cb: () => void) {
  testerSubs.add(cb);
  return () => testerSubs.delete(cb);
}

export const useIsTester = () => useSyncExternalStore(subscribeTester, () => tester, () => false);

// ---- the form itself ----

export type SyncStatus = "loading" | "account" | "saving" | "local" | "failed";
type Snapshot = { state: FormState | null; canSave: boolean; status: SyncStatus };

const INITIAL: Snapshot = { state: null, canSave: false, status: "loading" };
let snap = INITIAL;
const subs = new Set<() => void>();
let started = false;
// The account's copy was read (or there is none): until then nothing is written over it.
let synced = false;
let loading: Promise<void> | null = null;
let pending: FormState | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function emit(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch };
  subs.forEach((f) => f());
}

/** Read the account's copy, keep the newer of it and the browser's, and send the browser's up when it is the newer. */
function sync(): Promise<void> {
  loading ??= (async () => {
    const res = await loadFeedback().catch(() => ({ canSave: snap.canSave, state: null, failed: true }));
    if (res.failed) {
      synced = false;
      emit({ canSave: res.canSave, status: "failed" });
      return;
    }
    synced = true;
    const best = newer(readLocal(), res.state);
    if (best) writeLocal(best);
    emit({ canSave: res.canSave, state: best ?? snap.state, status: res.canSave ? "account" : "local" });
    if (res.canSave && best && best !== res.state) await push(best);
  })().finally(() => {
    loading = null;
  });
  return loading;
}

async function push(s: FormState) {
  // Never over a copy we couldn't read: read it first (that sends this change up, as the newer copy).
  if (!synced) return sync();
  if (!snap.canSave) return;
  emit({ status: "saving" });
  const { ok } = await saveFeedback(s).catch(() => ({ ok: false }));
  emit({ status: ok ? "account" : "failed" });
}

function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  const s = pending;
  pending = null;
  if (s) void push(s);
}

function start() {
  if (started) return;
  started = true;
  // The browser's copy at once, then the account's if it is newer.
  emit({ state: readLocal() ?? emptyState() });
  void sync();
  // Another tab changed it: take the newer copy.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const best = newer(snap.state, readLocal());
    if (best && best !== snap.state) emit({ state: best });
  });
  window.addEventListener("pagehide", flush);
}

function subscribe(cb: () => void) {
  subs.add(cb);
  start();
  return () => subs.delete(cb);
}

/** Change the form: the browser's copy now, the account's a moment later. */
export function updateFeedback(fn: (s: FormState) => FormState) {
  if (!snap.state) return;
  const next = { ...fn(snap.state), updatedAt: new Date().toISOString() };
  writeLocal(next);
  emit({ state: next });
  if (synced && !snap.canSave) {
    emit({ status: "local" });
    return;
  }
  pending = next;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 1200);
}

export function useFeedback() {
  const s = useSyncExternalStore(subscribe, () => snap, () => INITIAL);
  return { ...s, update: updateFeedback };
}

