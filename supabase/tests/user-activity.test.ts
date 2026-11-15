/**
 * The admin's per-account usage (admin_user_activity): sign-ins, visits (per-tab
 * sessions while signed in), active days and when the account was last seen.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const USER = "00000000-0000-4000-8000-0000000000b1";
const ADMIN = "00000000-0000-4000-8000-0000000000b2";
const IDLE = "00000000-0000-4000-8000-0000000000b3";
const SID = "aaaaaaaa-0000-4000-8000-0000000000b1";

type Activity = { userId: string; signIns: number; visits: number; activeDays: number; lastSeen: string | null };
let db: Db;
const activity = async (who: string) => (await db.as<{ a: Activity[] }>(who, "select public.admin_user_activity() as a"))[0].a;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${USER}', 'user@example.com'), ('${ADMIN}', 'admin@example.com'), ('${IDLE}', 'idle@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.sign_ins (user_id, session_id, created_at) values
      ('${USER}', '${SID}', now() - interval '3 days'),
      ('${USER}', '${SID}', now() - interval '1 day');
    insert into public.analytics_events (kind, session_id, user_id, path, created_at) values
      ('page_view', 'tab-one-aaaa', '${USER}', '/a', now() - interval '3 days'),
      ('page_view', 'tab-one-aaaa', '${USER}', '/b', now() - interval '3 days'),
      ('page_view', 'tab-two-bbbb', '${USER}', '/a', now() - interval '1 day'),
      ('page_view', 'tab-three-cc', '${USER}', '/c', now()),
      ('page_view', 'anonymous-xx', null, '/a', now());
  `);
});
after(() => db.close());

describe("admin_user_activity", () => {
  it("counts sign-ins, visits and active days per account", async () => {
    const rows = await activity(ADMIN);
    const user = rows.find((r) => r.userId === USER);
    assert.ok(user);
    assert.equal(user.signIns, 2);
    assert.equal(user.visits, 3);
    assert.ok(user.activeDays >= 2 && user.activeDays <= 3, `active days ${user.activeDays}`);
    assert.ok(user.lastSeen && Date.now() - new Date(user.lastSeen).getTime() < 60_000);
  });

  it("leaves out accounts with no activity", async () => {
    assert.equal((await activity(ADMIN)).some((r) => r.userId === IDLE), false);
  });

  it("is for admins only", async () => {
    await assert.rejects(activity(USER), /Admins only/);
  });
});
