/**
 * The dashboard's counts (public.admin_analytics), on the real migrations (see pg.ts):
 * tabs, browsers, accounts and people are told apart, and the visit analysis reads
 * entries the way the tracker records them.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const ADMIN = "00000000-0000-4000-8000-0000000000a1";
const DANA = "00000000-0000-4000-8000-0000000000a2";

let db: Db;

const ev = (kind: string, session: string, meta: Record<string, unknown>, opts: { user?: string; path?: string; ago?: string } = {}) =>
  `insert into public.analytics_events (kind, session_id, user_id, path, meta, created_at) values ('${kind}', '${session}', ${opts.user ? `'${opts.user}'` : "null"}, '${opts.path ?? "/"}', '${JSON.stringify(meta)}', now() - interval '${opts.ago ?? "1 hour"}');`;

type Totals = { entries: number; sessions: number; visitors: number; people: number; accounts: number; pageViews: number };
type Visits = { newVisitors: number; returningVisitors: number; signedInEntries: number; pagesPerVisit: number; onePageVisits: number; devices: { device: string; entries: number }[]; sources: { source: string; entries: number }[] };

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${ADMIN}', 'admin@example.com'), ('${DANA}', 'dana@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
  await db.exec(
    [
      // Dana: her laptop browser (two tabs), signed in on one of them; and her phone, signed in.
      ev("landing_view", "tab-dana-1", { v: "laptop", device: "desktop" }),
      ev("page_view", "tab-dana-1", { v: "laptop" }),
      ev("page_view", "tab-dana-1", { v: "laptop" }, { path: "/basics" }),
      ev("landing_view", "tab-dana-2", { v: "laptop", device: "desktop", utm_source: "whatsapp" }, { user: DANA }),
      ev("page_view", "tab-dana-2", { v: "laptop" }, { user: DANA }),
      ev("landing_view", "tab-dana-3", { v: "phone", device: "mobile" }, { user: DANA }),
      ev("page_view", "tab-dana-3", { v: "phone" }, { user: DANA }),
      // A guest who never signs in, who first came long ago.
      ev("page_view", "tab-old-01", { v: "guest" }, { ago: "90 days" }),
      ev("landing_view", "tab-guest-01", { v: "guest", device: "mobile" }),
      ev("page_view", "tab-guest-01", { v: "guest" }),
    ].join("\n"),
  );
});
after(() => db.close());

const read = async () => (await db.as<{ r: { totals: Totals; visits: Visits } }>(ADMIN, `select public.admin_analytics(now() - interval '30 days') as r`))[0].r;

describe("admin_analytics", () => {
  it("tells tabs, browsers, accounts and people apart", async () => {
    const { totals } = await read();
    assert.equal(totals.entries, 4);
    assert.equal(totals.sessions, 4); // four tabs
    assert.equal(totals.visitors, 3); // laptop, phone, guest
    assert.equal(totals.accounts, 1); // Dana
    assert.equal(totals.people, 2); // Dana (laptop + phone, via her account) and the guest
    assert.equal(totals.pageViews, 5);
  });

  it("reads new and returning visitors, sources, devices and pages per visit", async () => {
    const { visits } = await read();
    assert.equal(visits.newVisitors, 2); // laptop, phone
    assert.equal(visits.returningVisitors, 1); // the guest, first seen 90 days ago
    assert.equal(visits.signedInEntries, 3); // every entry from a browser that was ever signed in
    assert.equal(visits.onePageVisits, 3);
    assert.equal(Number(visits.pagesPerVisit), 1.3);
    assert.deepEqual(Object.fromEntries(visits.devices.map((d) => [d.device, d.entries])), { desktop: 2, mobile: 2 });
    assert.deepEqual(Object.fromEntries(visits.sources.map((s) => [s.source, s.entries])), { direct: 3, whatsapp: 1 });
  });

  it("only an admin reads it", async () => {
    await assert.rejects(db.as(DANA, `select public.admin_analytics(now() - interval '30 days')`));
  });
});

describe("admin_funnel counts people", () => {
  type F = { funnel: { entered: number; accounts: number; approved: number; lessonStarted: number }; pendingApproval: number; newAccounts: number };
  const funnel = async () => (await db.as<{ r: F }>(ADMIN, `select public.admin_funnel(now() - interval '30 days') as r`))[0].r;

  it("one student on two devices is one person, with their account and its approval", async () => {
    await db.exec(`
      update public.profiles set approval_status = 'approved' where id = '${DANA}';
      ${ev("lesson_start", "tab-dana-3", { v: "phone" }, { user: DANA })}
    `);
    const f = await funnel();
    assert.equal(f.funnel.entered, 2); // Dana (laptop + phone) and the guest
    assert.equal(f.funnel.accounts, 1);
    assert.equal(f.funnel.approved, 1);
    assert.equal(f.funnel.lessonStarted, 1);
  });

  it("counts accounts waiting for approval and accounts created in the window", async () => {
    await db.exec(`insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a3', 'new@example.com');`);
    const f = await funnel();
    assert.equal(f.pendingApproval, 1);
    assert.equal(f.newAccounts, 3);
  });
});
