/**
 * One live session per account, on the real migrations (see pg.ts): signing in
 * elsewhere takes the account; the older session is "replaced", can't take it
 * back, and stops counting as a paying reader. Sign-ins are recorded for the
 * admin's shared-account alerts.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const USER = "00000000-0000-4000-8000-0000000000a1";
const ADMIN = "00000000-0000-4000-8000-0000000000a2";
const SHARED = "00000000-0000-4000-8000-0000000000a3";
const S = {
  laptop: "aaaaaaaa-0000-4000-8000-000000000001",
  phone: "aaaaaaaa-0000-4000-8000-000000000002",
  admin: "aaaaaaaa-0000-4000-8000-000000000003",
};

let db: Db;
const on = (user: string, session: string) => `${user}/${session}`;
const status = async (who: string) => (await db.as<{ s: string }>(who, "select public.session_status() as s"))[0].s;
const claim = async (who: string, device = "", country = "IL") =>
  (await db.as<{ s: string }>(who, "select public.claim_session($1, 'Chrome · Windows', $2) as s", [device, country]))[0].s;
const hasExams = async (who: string) => (await db.as<{ ok: boolean }>(who, "select public.has_tier('exams') as ok"))[0].ok;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${USER}', 'user@example.com'), ('${ADMIN}', 'admin@example.com'), ('${SHARED}', 'shared@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.subscriptions (user_id, tier, status, current_period_end) values ('${USER}', 'exams', 'active', null);
    insert into auth.sessions (id, user_id, created_at) values
      ('${S.laptop}', '${USER}', now() - interval '1 hour'),
      ('${S.phone}', '${USER}', now()),
      ('${S.admin}', '${ADMIN}', now());
  `);
});
after(() => db.close());

describe("one session per account", () => {
  it("starts unclaimed, and the first sign-in holds the account", async () => {
    assert.equal(await status(on(USER, S.laptop)), "unclaimed");
    assert.equal(await claim(on(USER, S.laptop), "dev-laptop"), "current");
    assert.equal(await status(on(USER, S.laptop)), "current");
    assert.equal(await hasExams(on(USER, S.laptop)), true);
  });

  it("a newer sign-in takes the account; the older session is replaced and loses the paid plan", async () => {
    assert.equal(await claim(on(USER, S.phone), "dev-phone"), "current");
    assert.equal(await status(on(USER, S.phone)), "current");
    assert.equal(await status(on(USER, S.laptop)), "replaced");
    assert.equal(await hasExams(on(USER, S.laptop)), false);
    assert.equal(await hasExams(on(USER, S.phone)), true);
  });

  it("a replaced session can't claim the account back", async () => {
    assert.equal(await claim(on(USER, S.laptop), "dev-laptop"), "replaced");
    assert.equal(await status(on(USER, S.phone)), "current");
  });

  it("claiming needs a signed-in session", async () => {
    assert.equal(await db.can("guest", "select public.claim_session('', '', '')"), false);
    assert.equal(await db.can(USER, "select public.claim_session('', '', '')"), false);
  });

  it("a reader sees only their own current session, and writes it only through claim_session", async () => {
    assert.equal((await db.as(on(ADMIN, S.admin), "select * from public.user_sessions where user_id <> auth.uid()")).length, 0);
    assert.equal(await db.can(on(USER, S.laptop), `update public.user_sessions set session_id = '${S.laptop}'`), true);
    // The update runs but matches nothing: there is no update policy.
    assert.equal(await status(on(USER, S.phone)), "current");
  });
});

describe("shared-account alerts", () => {
  before(async () => {
    // Four devices in two countries within the month: flagged. The user above signed in on two: not.
    await db.exec(`
      insert into public.sign_ins (user_id, session_id, device_id, device, country) values
        ('${SHARED}', gen_random_uuid(), 'd1', 'Chrome · Windows', 'IL'),
        ('${SHARED}', gen_random_uuid(), 'd2', 'Safari · iPhone', 'IL'),
        ('${SHARED}', gen_random_uuid(), 'd3', 'Chrome · Android', 'IL'),
        ('${SHARED}', gen_random_uuid(), 'd4', 'Firefox · Mac', 'DE');
    `);
  });

  it("lists accounts on three or more devices or two countries, for admins only", async () => {
    const [{ a }] = await db.as<{ a: { userId: string; devices: number; countries: number }[] }>(on(ADMIN, S.admin), "select public.admin_device_alerts(30) as a");
    assert.deepEqual(
      a.map((r) => [r.userId, Number(r.devices), Number(r.countries)]),
      [[SHARED, 4, 2]],
    );
    assert.equal(await db.can(on(USER, S.phone), "select public.admin_device_alerts(30)"), false);
  });

  it("sign-ins are readable by admins only", async () => {
    assert.equal((await db.as(on(USER, S.phone), "select * from public.sign_ins")).length, 0);
    assert.ok((await db.as(on(ADMIN, S.admin), "select * from public.sign_ins")).length >= 6);
  });
});
