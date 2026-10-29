"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_TOPIC, type TopicProgress } from "@/lib/study/score";

/**
 * Lesson progress per topic, and the sound switch, kept per browser. Storage
 * can be blocked (private mode, previews), so every access is guarded and an
 * in-memory copy keeps the lesson working without it — as in basics/store.ts.
 */
type State = { sound: boolean; topics: Record<string, TopicProgress> };

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
    return { sound: s.sound !== false, topics: s.topics && typeof s.topics === "object" ? s.topics : {} };
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
