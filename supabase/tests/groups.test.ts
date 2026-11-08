/**
 * Study habits and study groups, on the real migrations (see pg.ts): each reader
 * owns their habits row; a group is seen only by its members, joined only by its
 * invite code, and a member's row is changed only by that member.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const A = "00000000-0000-4000-8000-0000000000b1";
const B = "00000000-0000-4000-8000-0000000000b2";
const C = "00000000-0000-4000-8000-0000000000b3";

let db: Db;
let group: { id: string; invite_code: string };

before(async () => {
  db = await startDb();
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@example.com'), ('${B}', 'b@example.com'), ('${C}', 'c@example.com');`);
});
after(() => db.close());

describe("study habits", () => {
  it("a reader writes and reads only their own row", async () => {
    assert.ok(await db.can(A, `insert into public.study_habits (days, exams) values ('{100,101}', '{"ias16":"2027-01-20"}')`));
    assert.equal(await db.can(B, `insert into public.study_habits (user_id, days) values ('${A}', '{1}')`), false);
    assert.equal((await db.as(B, "select * from public.study_habits")).length, 0);
    const [row] = await db.as<{ days: number[]; reminders: boolean }>(A, "select days, reminders from public.study_habits");
    assert.deepEqual(row.days, [100, 101]);
    assert.equal(row.reminders, false, "reminders are off until the reader turns them on");
    await db.as(B, `update public.study_habits set reminders = true where user_id = '${A}'`);
    assert.equal((await db.as<{ reminders: boolean }>(A, "select reminders from public.study_habits"))[0].reminders, false);
  });

  it("guests have no habits", async () => {
    assert.equal((await db.as("guest", "select * from public.study_habits")).length, 0);
    assert.equal(await db.can("guest", `insert into public.study_habits (user_id) values ('${C}')`), false);
  });
});

describe("study groups", () => {
  it("a signed-in reader creates a group and is its first member", async () => {
    [group] = await db.as<{ id: string; invite_code: string }>(A, "select * from public.create_study_group('הקבוצה של דנה', 'ias16', '2027-01-20', 'דנה')");
    assert.match(group.invite_code, /^[a-z0-9]{10}$/);
    const members = await db.as<{ user_id: string }>(A, "select user_id from public.study_group_members");
    assert.deepEqual(members.map((m) => m.user_id), [A]);
    assert.equal(await db.can("guest", "select * from public.create_study_group('x', 'ias16', null, 'x')"), false);
  });

  it("outsiders see nothing of the group, and can't add themselves without the code", async () => {
    assert.equal((await db.as(B, "select * from public.study_groups")).length, 0);
    assert.equal((await db.as(B, "select * from public.study_group_members")).length, 0);
    assert.equal(await db.can(B, `insert into public.study_group_members (group_id, display_name) values ('${group.id}', 'B')`), false);
    assert.equal(await db.can(B, "select public.join_study_group('wrongcode0', 'B')"), false);
  });

  it("the invite shows the group's name and size before joining, to a signed-in reader only", async () => {
    const [p] = await db.as<{ name: string; members: number }>(B, `select * from public.study_group_preview('${group.invite_code}')`);
    assert.equal(p.name, "הקבוצה של דנה");
    assert.equal(p.members, 1);
    assert.equal(await db.can("guest", `select * from public.study_group_preview('${group.invite_code}')`), false);
    assert.equal((await db.as(B, "select * from public.study_group_preview('wrongcode0')")).length, 0);
  });

  it("the invite code joins, once; members then see each other", async () => {
    await db.as(B, `select public.join_study_group('${group.invite_code}', 'בני')`);
    await db.as(B, `select public.join_study_group('${group.invite_code}', 'בני')`);
    const members = await db.as<{ display_name: string }>(B, "select display_name from public.study_group_members order by joined_at");
    assert.deepEqual(members.map((m) => m.display_name), ["דנה", "בני"]);
    assert.equal((await db.as(B, "select * from public.study_groups")).length, 1);
  });

  it("a member changes only their own row; only the owner edits the group", async () => {
    await db.as(B, `update public.study_group_members set share_progress = true, readiness = 40 where user_id = '${B}'`);
    await db.as(B, `update public.study_group_members set readiness = 99 where user_id = '${A}'`);
    const rows = await db.as<{ user_id: string; readiness: number | null }>(A, "select user_id, readiness from public.study_group_members");
    assert.equal(rows.find((r) => r.user_id === B)!.readiness, 40);
    assert.equal(rows.find((r) => r.user_id === A)!.readiness, null);
    await db.as(B, `update public.study_groups set name = 'נחטפה' where id = '${group.id}'`);
    assert.equal((await db.as<{ name: string }>(A, "select name from public.study_groups"))[0].name, "הקבוצה של דנה");
  });

  it("a member leaves and stops seeing the group", async () => {
    await db.as(B, `delete from public.study_group_members where user_id = '${B}'`);
    assert.equal((await db.as(B, "select * from public.study_groups")).length, 0);
    assert.equal((await db.as(A, "select * from public.study_group_members")).length, 1);
  });
});
