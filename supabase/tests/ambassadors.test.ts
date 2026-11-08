/**
 * What each ?ref= link brought in (public.admin_ambassadors), on the real
 * migrations (see pg.ts): a browser belongs to the first link it came through,
 * is followed from that entry on, and only an admin may read the numbers.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const ADMIN = "00000000-0000-4000-8000-0000000000d1";
const USER = "00000000-0000-4000-8000-0000000000d2";

type Row = { code: string; entered: number; answered: number; activated: number; signedUp: number; paid: number };

let db: Db;

// One event, `ago` days back at noon, for a browser.
const ev = (v: string, kind: string, ago: number, meta: Record<string, unknown> = {}) =>
  `insert into public.analytics_events (kind, session_id, path, meta, created_at) values ('${kind}', 'session-${v}', '/', '${JSON.stringify({ v, ...meta })}', date_trunc('day', now()) - interval '${ago} days' + interval '12 hours');`;
const answers = (v: string, n: number, ago: number) =>
  Array.from({ length: n }, (_, i) => ev(v, "exercise_answer", ago, i === 0 ? { trap: true } : {})).join("\n");

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com'), ('${USER}', 'user@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
  await db.exec(
    [
      // A: through dana's link, activates and signs up, comes back directly and pays later.
      ev("A", "landing_view", 10, { ref: "dana" }),
      answers("A", 6, 10),
      ev("A", "signup", 10),
      ev("A", "landing_view", 2),
      ev("A", "payment_success", 2),
      // B: through dana's link too, answers once. A second link later doesn't take them from her.
      ev("B", "landing_view", 9, { ref: "dana" }),
      answers("B", 1, 9),
      ev("B", "landing_view", 3, { ref: "yossi" }),
      // C: already paid and signed up before ever following yossi's link: he didn't bring that.
      ev("C", "landing_view", 8),
      ev("C", "signup", 8),
      ev("C", "payment_success", 8),
      ev("C", "landing_view", 5, { ref: "yossi" }),
      // D: dana's link long before the window, pays inside it: not one of this window's entries.
      ev("D", "landing_view", 60, { ref: "dana" }),
      ev("D", "payment_success", 1),
      // E: no link at all. F: a blank code.
      ev("E", "landing_view", 4),
      ev("F", "landing_view", 4, { ref: "  " }),
    ].join("\n"),
  );
});
after(() => db.close());

const rows = async (ago = 30) => (await db.as<{ r: Row[] }>(ADMIN, `select public.admin_ambassadors(now() - interval '${ago} days') as r`))[0].r;

describe("admin_ambassadors", () => {
  it("only an admin reads it", async () => {
    assert.equal(await db.can(USER, "select public.admin_ambassadors(now() - interval '30 days')"), false);
    assert.equal(await db.can("guest", "select public.admin_ambassadors(now() - interval '30 days')"), false);
  });

  it("follows a browser from its first link, even when it returns another way", async () => {
    const [dana] = (await rows()).filter((r) => r.code === "dana");
    assert.deepEqual(dana, { code: "dana", entered: 2, answered: 2, activated: 1, signedUp: 1, paid: 1 });
  });

  it("doesn't credit a link with what a browser did before following it", async () => {
    const [yossi] = (await rows()).filter((r) => r.code === "yossi");
    assert.deepEqual(yossi, { code: "yossi", entered: 1, answered: 0, activated: 0, signedUp: 0, paid: 0 }, "C alone: B was dana's first");
  });

  it("leaves out visitors with no code, and sorts by entries", async () => {
    assert.deepEqual((await rows()).map((r) => r.code), ["dana", "yossi"]);
  });

  it("counts an entry in the window it happened in", async () => {
    const wide = (await rows(90)).find((r) => r.code === "dana")!;
    assert.deepEqual([wide.entered, wide.paid], [3, 2], "D's entry is in the longer window, with their payment");
    assert.deepEqual(await rows(1), [], "nobody entered through a link in the last day");
  });
});
