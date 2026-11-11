/**
 * The closed site, on the real migrations: a new account waits for approval,
 * only an admin approves it or grants it courses, and an account reads its own
 * access (public.access_state) and nobody else's.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const USER = "00000000-0000-4000-8000-0000000000c1";
const OTHER = "00000000-0000-4000-8000-0000000000c2";
const ADMIN = "00000000-0000-4000-8000-0000000000c3";
let db: Db;

type State = { access_state: { admin: boolean; status: string; courses: string[] } };
const stateOf = async (who: string) => (await db.as<State>(who, "select public.access_state()"))[0].access_state;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${USER}', 'user@example.com'), ('${OTHER}', 'other@example.com'), ('${ADMIN}', 'admin@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
});
after(() => db.close());

describe("access control", () => {
  it("a new account starts pending, with no courses", async () => {
    assert.deepEqual(await stateOf(USER), { admin: false, status: "pending", courses: [] });
    assert.equal((await stateOf(ADMIN)).admin, true);
    assert.deepEqual(await stateOf("guest"), { admin: false, status: "anonymous", courses: [] });
  });

  it("an account can't approve itself or grant itself a course", async () => {
    await db.as(USER, `update public.profiles set approval_status = 'approved' where id = '${USER}'`).catch(() => {});
    assert.equal((await stateOf(USER)).status, "pending");
    assert.equal(await db.can(USER, `insert into public.course_grants (user_id, course_id) values ('${USER}', 'ias16')`), false);
    assert.equal(await db.can(USER, `select public.admin_set_access('${USER}', 'approved', array['ias16'])`), false);
    assert.equal(await db.can(USER, "select public.admin_users()"), false);
    // Editing the rest of their own profile still works.
    assert.equal(await db.can(USER, `update public.profiles set full_name = 'דנה' where id = '${USER}'`), true);
  });

  it("an admin approves an account with its courses, and only those open", async () => {
    await db.as(ADMIN, `select public.admin_set_access('${USER}', 'approved', array['ias16', 'ifrs16'])`);
    assert.deepEqual(await stateOf(USER), { admin: false, status: "approved", courses: ["ias16", "ifrs16"] });
    const open = async (course: string) => (await db.as<{ can_open_course: boolean }>(USER, `select public.can_open_course('${course}')`))[0].can_open_course;
    assert.equal(await open("ias16"), true);
    assert.equal(await open("inventory"), false);
  });

  it("changing the courses replaces them; rejecting closes them all", async () => {
    await db.as(ADMIN, `select public.admin_set_access('${USER}', 'approved', array['inventory'])`);
    assert.deepEqual((await stateOf(USER)).courses, ["inventory"]);
    await db.as(ADMIN, `select public.admin_set_access('${USER}', 'rejected', array['inventory'])`);
    assert.deepEqual(await stateOf(USER), { admin: false, status: "rejected", courses: [] });
  });

  it("an account sees only its own grants", async () => {
    await db.as(ADMIN, `select public.admin_set_access('${OTHER}', 'approved', array['basics'])`);
    assert.deepEqual(await db.as(USER, "select user_id from public.course_grants"), []);
    assert.equal((await db.as(OTHER, "select course_id from public.course_grants")).length, 1);
  });

  it("the admin's list carries every account, and an admin can't change their own access", async () => {
    const [{ admin_users: users }] = await db.as<{ admin_users: { email: string; status: string; courses: string[] }[] }>(ADMIN, "select public.admin_users()");
    assert.equal(users.length, 3);
    assert.deepEqual(users.find((u) => u.email === "other@example.com")?.courses, ["basics"]);
    assert.equal(await db.can(ADMIN, `select public.admin_set_access('${ADMIN}', 'rejected', array[]::text[])`), false);
  });
});
