"use client";

import { soundOn } from "./progress-store";

/** A short tone, made on the spot with Web Audio: rising for a right answer, a low buzz for a wrong one. No audio files. */
let ctx: AudioContext | undefined;

export function cue(kind: "ok" | "bad") {
  if (!soundOn()) return;
  try {
    ctx ??= new AudioContext();
    const notes = kind === "ok" ? [660, 880] : [220, 180];
    notes.forEach((f, i) => {
      const t = ctx!.currentTime + i * 0.09;
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = kind === "ok" ? "sine" : "triangle";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {
    // No audio available: the visual cue is enough.
  }
}
