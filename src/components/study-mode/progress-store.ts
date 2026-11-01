"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_TOPIC, type TopicProgress } from "@/lib/study/score";
import { mergeTopic } from "@/lib/study/sync";

/**
 * Lesson progress per topic, and the sound switch, kept per browser. Storage
 * can be blocked (private mode, previews), so every access is guarded and an
 * in-memory copy keeps the lesson working without it — as in basics/store.ts.
 */
/** The lesson opened last, for "continue where you left off": enough to show and link it without loading the lesson. */
export type LastLesson = { slug: string; title: string; course: string; n: number; percent: number };
/** `owner` is the account this browser's progress was last joined with; none for a guest's. */
type State = { sound: boolean; topics: Record<string, TopicProgress>; last?: LastLesson; owner?: string };

const KEY = "afik.study.v2";
const EVENT = "afik-study-progress";
const EMPTY = JSON.stringify({ sound: true, topics: {} } satisfies State);
let memory = EMPTY;

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

const parse = (raw: string): State => {
  try {
    const s = JSON.parse(raw) as Partial<State>;
    const last = s.last && typeof s.last === "object" && typeof s.last.slug === "string" ? s.last : undefined;
    const owner = typeof s.owner === "string" ? s.owner : undefined;
    return { sound: s.sound !== false, topics: s.topics && typeof s.topics === "object" ? s.topics : {}, last, owner };
  } catch {
    return JSON.parse(EMPTY);
  }
};

const write = (change: (s: State) => State) => {
  const next = JSON.stringify(change(parse(read())));
  memory = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Storage blocked: progress lasts until the page is closed.
  }
  window.dispatchEvent(new Event(EVENT));
};

const useStore = () => parse(useSyncExternalStore(subscribe, read, () => EMPTY));

export function useTopic(slug: string): TopicProgress {
  return { ...EMPTY_TOPIC, ...useStore().topics[slug] };
}

export const useSound = () => useStore().sound;

export function updateTopic(slug: string, change: (p: TopicProgress) => TopicProgress) {
  write((s) => ({ ...s, topics: { ...s.topics, [slug]: change({ ...EMPTY_TOPIC, ...s.topics[slug] }) } }));
}

export const resetTopic = (slug: string) => write((s) => ({ ...s, topics: { ...s.topics, [slug]: EMPTY_TOPIC } }));

export const toggleSound = () => write((s) => ({ ...s, sound: !s.sound }));

/** Whether sound is on right now, for event handlers. */
export const soundOn = () => parse(read()).sound;

/** Every lesson's progress, for the course page. */
export function useTopics(slugs: string[]): Record<string, TopicProgress> {
  const topics = useStore().topics;
  return Object.fromEntries(slugs.map((s) => [s, { ...EMPTY_TOPIC, ...topics[s] }]));
}

/** Remember the lesson just opened, and how far through it the reader is. Written only when it changes. */
export function setLast(last: LastLesson) {
  const cur = parse(read()).last;
  if (cur && cur.slug === last.slug && cur.percent === last.percent && cur.title === last.title) return;
  write((s) => ({ ...s, last }));
}

/** The lesson opened last, if any (none on the server and before the first lesson). */
export const useLast = () => useStore().last;

/** Every lesson's progress as stored now, for the account sync (outside React). */
export const readTopics = () => parse(read()).topics;

/** Told of every change to the stored progress, from this tab or another; returns the way to stop. */
export const onProgressChange = (cb: () => void) => subscribe(cb);

/**
 * Join the account's progress into this browser's, lesson by lesson (the
 * account's copy first: see mergeTopic). A guest's progress joins the account
 * that signs in; progress another account left in this browser (a shared
 * computer) does not — it is replaced by this account's own.
 */
export function mergeAccountTopics(account: Record<string, TopicProgress>, owner: string) {
  write((s) => {
    if (s.owner && s.owner !== owner) return { ...s, topics: account, last: undefined, owner };
    const topics = { ...s.topics };
    for (const [slug, p] of Object.entries(account)) topics[slug] = topics[slug] ? mergeTopic(p, { ...EMPTY_TOPIC, ...topics[slug] }) : p;
    return { ...s, topics, owner };
  });
}
