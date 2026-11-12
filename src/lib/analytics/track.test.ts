import assert from "node:assert/strict";
import { test } from "node:test";
import { EVENT_KINDS, toRow } from "./events";
import { entrySource } from "./track";

test("entrySource keeps the campaign tags and ?ref=, trimmed", () => {
  assert.deepEqual(entrySource("?utm_source=whatsapp&utm_medium=share&utm_campaign=trap&ref=dana&x=1", "", "afik.co.il"), {
    utm_source: "whatsapp",
    utm_medium: "share",
    utm_campaign: "trap",
    ref: "dana",
  });
});

test("entrySource records another site's host, never our own or a non-URL", () => {
  assert.deepEqual(entrySource("", "https://l.instagram.com/?u=abc", "afik.co.il"), { referrer: "l.instagram.com" });
  assert.deepEqual(entrySource("", "https://afik.co.il/basics", "afik.co.il"), {});
  assert.deepEqual(entrySource("", "not a url", "afik.co.il"), {});
});

test("the learning events are accepted, with their meta", () => {
  for (const kind of ["exercise_answer", "review_session", "share_click", "check_start", "check_complete"]) assert.ok((EVENT_KINDS as readonly string[]).includes(kind));
  const row = toRow({ kind: "exercise_answer", target: "basics-intro", ok: false, meta: { v: "visitor-1", id: "t1", trap: true } }, "session-12345");
  assert.equal(row?.kind, "exercise_answer");
  assert.deepEqual(row?.meta, { v: "visitor-1", id: "t1", trap: true });
});

test("only the live site records events, unless turned on to test", async () => {
  const { recordsEvents } = await import("./events");
  assert.equal(recordsEvents({ VERCEL_ENV: "production" }), true);
  assert.equal(recordsEvents({ VERCEL_ENV: "preview" }), false);
  assert.equal(recordsEvents({}), false);
  assert.equal(recordsEvents({ ANALYTICS_ANYWHERE: "1" }), true);
});

test("the same page again within the reload window is a reload; another page or later is a view", async () => {
  const { isReload, RELOAD_WINDOW_MS } = await import("./track");
  const last = { path: "/", at: 1_000_000 };
  assert.equal(isReload(null, "/", 1_000_000), false);
  assert.equal(isReload(last, "/", 1_000_500), true);
  assert.equal(isReload(last, "/basics", 1_000_500), false);
  assert.equal(isReload(last, "/", 1_000_000 + RELOAD_WINDOW_MS), false);
});
