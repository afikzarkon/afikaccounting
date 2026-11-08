/**
 * The growth dashboard's aggregates (public.admin_funnel), on the real migrations
 * (see pg.ts): visitors are browsers (meta.v), each counted once per funnel step,
 * split by where they entered from; only an admin may read them.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const ADMIN = "00000000-0000-4000-8000-0000000000c1";
const USER = "00000000-0000-4000-8000-0000000000c2";

let db: Db;
type F = {
  funnel: Record<string, number>;
  sources: { source: string; visitors: number; activated: number; signedUp: number; paid: number }[];
  weekly: { learners: number }[];
  retention: { size: number; d1: number }[];
  traps: { id: string; answers: number; falls: number }[];
  paywalls: { gate: string; views: number; clicks: number }[];
  shares: { clicks: number; byKind: Record<string, number> };
  checks: { started: number; completed: number; avgRight: number };
  streaks: Record<string, number>;
};

// One event, `ago` days back at noon, for a browser.
const ev = (v: string, kind: string, ago: number, extra: { target?: string; ok?: boolean; meta?: Record<string, unknown>; user?: string } = {}) =>
  `insert into public.analytics_events (kind, session_id, user_id, path, target, ok, meta, created_at) values ('${kind}', 'session-${v}', ${extra.user ? `'${extra.user}'` : "null"}, '/', ${extra.target ? `'${extra.target}'` : "null"}, ${extra.ok === undefined ? "null" : extra.ok}, '${JSON.stringify({ v, ...extra.meta })}', date_trunc('day', now()) - interval '${ago} days' + interval '12 hours');`;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com'), ('${USER}', 'user@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
  const answers = (v: string, n: number, ago: number, trapAt = -1) =>
    Array.from({ length: n }, (_, i) => ev(v, "exercise_answer", ago, { target: "ias16-intro", ok: i % 2 === 0, meta: i === trapAt ? { id: "land-dealer", trap: true } : { id: `e${i}`, try: 1 } })).join("\n");
  await db.exec(
    [
      // A: from a WhatsApp share — 12 answers with a trap, signs up, comes back the next day, sees the paywall, clicks, pays.
      ev("A", "landing_view", 3, { meta: { utm_source: "share" } }),
      answers("A", 12, 3, 0),
      ev("A", "signup", 3),
      ev("A", "review_session", 2),
      ev("A", "study_day", 2, { meta: { streak: 2 } }),
      ev("A", "paywall_view", 2, { target: "/study/ias16-cost" }),
      ev("A", "plan_click", 2, { target: "courses" }),
      ev("A", "checkout_start", 2),
      ev("A", "payment_success", 2, { target: "courses" }),
      ev("A", "share_click", 2, { target: "ias16", meta: { kind: "trap" } }),
      // B: from an ambassador's link — 2 answers with the trap fallen into, sees the paywall, leaves.
      ev("B", "landing_view", 3, { meta: { ref: "dana" } }),
      ev("B", "exercise_answer", 3, { target: "ias16-intro", ok: false, meta: { id: "land-dealer", trap: true } }),
      ev("B", "exercise_answer", 3, { target: "ias16-intro", ok: true, meta: { id: "e1", try: 1 } }),
      ev("B", "paywall_view", 3, { target: "/study/ias16-cost" }),
      ev("B", "check_start", 3, { target: "ias16" }),
      ev("B", "check_complete", 3, { target: "ias16", meta: { right: 3, of: 5 } }),
      // C: direct, looks and leaves.
      ev("C", "landing_view", 3),
      // D: an old visitor, outside the window.
      ev("D", "landing_view", 200),
    ].join("\n"),
  );
  // The trap has three answers in all (A's and B's, plus one more by C) — enough to rank.
  await db.exec(ev("C", "exercise_answer", 3, { target: "ias16-intro", ok: false, meta: { id: "land-dealer", trap: true } }));
});
after(() => db.close());

const funnel = async (who = ADMIN, source: string | null = null) =>
  (await db.as<{ f: F }>(who, "select public.admin_funnel(now() - interval '30 days', now(), $1) as f", [source]))[0].f;

describe("admin_funnel", () => {
  it("only an admin reads it", async () => {
    assert.equal(await db.can(USER, "select public.admin_funnel(now() - interval '30 days')"), false);
    assert.equal(await db.can("guest", "select public.admin_funnel(now() - interval '30 days')"), false);
  });

  it("counts each browser once per step, in the window only", async () => {
    const f = await funnel();
    assert.deepEqual(f.funnel, { entered: 3, answered: 3, activated: 1, signedUp: 1, returned: 1, paywall: 2, plan: 1, checkout: 1, paid: 1 });
  });

  it("splits by source, and filters to one", async () => {
    const f = await funnel();
    const by = Object.fromEntries(f.sources.map((s) => [s.source, s]));
    assert.equal(by.share.paid, 1);
    assert.equal(by["ref:dana"].visitors, 1);
    assert.equal(by.direct.visitors, 1);
    const only = await funnel(ADMIN, "ref:dana");
    assert.equal(only.funnel.entered, 1);
    assert.equal(only.funnel.paywall, 1);
  });

  it("weekly learners need ten answers; traps rank by how often they catch people", async () => {
    const f = await funnel();
    assert.equal(f.weekly.reduce((a, w) => a + w.learners, 0), 1);
    const trap = f.traps.find((t) => t.id === "land-dealer")!;
    assert.deepEqual([trap.answers, trap.falls], [3, 2]);
  });

  it("paywall gates, shares, checks, streaks and next-day return", async () => {
    const f = await funnel();
    assert.deepEqual(f.paywalls, [{ gate: "/study/ias16-cost", views: 2, clicks: 1 }]);
    assert.equal(f.shares.clicks, 1);
    assert.equal(f.shares.byKind.trap, 1);
    assert.equal(f.checks.completed, 1);
    assert.equal(Number(f.checks.avgRight), 3);
    assert.equal(f.streaks.s2, 1);
    assert.equal(f.retention.reduce((a, r) => a + r.d1, 0), 1);
  });
});
