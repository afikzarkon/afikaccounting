/**
 * Testers and their feedback (public.testers, public.tester_feedback), on the real
 * migrations (see pg.ts): only an admin marks a tester; only a tester writes feedback,
 * and only their own; an admin reads every row; a guest reads nothing.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const ADMIN = "00000000-0000-4000-8000-0000000000f1";
const A = "00000000-0000-4000-8000-0000000000f2";
const B = "00000000-0000-4000-8000-0000000000f3";
const PLAIN = "00000000-0000-4000-8000-0000000000f4";

let db: Db;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ADMIN}', 'admin@example.com'), ('${A}', 'a@example.com'), ('${B}', 'b@example.com'), ('${PLAIN}', 'plain@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
  `);
});
after(() => db.close());

describe("testers", () => {
  it("only an admin marks a tester", async () => {
    assert.equal(await db.can(PLAIN, `insert into public.testers (user_id) values ('${PLAIN}')`), false);
    assert.equal(await db.can(ADMIN, `insert into public.testers (user_id) values ('${A}'), ('${B}')`), true);
  });

  it("a tester sees only themselves, and knows they are one", async () => {
    const rows = await db.as<{ user_id: string }>(A, `select user_id from public.testers`);
    assert.deepEqual(rows.map((r) => r.user_id), [A]);
    const [a] = await db.as<{ t: boolean }>(A, `select public.is_tester() as t`);
    const [p] = await db.as<{ t: boolean }>(PLAIN, `select public.is_tester() as t`);
    assert.equal(a.t, true);
    assert.equal(p.t, false);
  });

  it("only an admin lists testers with their emails", async () => {
    const [r] = await db.as<{ r: { email: string }[] }>(ADMIN, `select public.admin_testers() as r`);
    assert.deepEqual(r.r.map((t) => t.email).sort(), ["a@example.com", "b@example.com"]);
    await assert.rejects(db.as(A, `select public.admin_testers()`));
  });

  it("a tester can't remove themselves; an admin can", async () => {
    await db.as(B, `delete from public.testers where user_id = '${B}'`);
    assert.equal((await db.as(ADMIN, `select 1 from public.testers where user_id = '${B}'`)).length, 1);
  });
});

describe("tester_feedback", () => {
  it("a tester writes their own row and reads only it", async () => {
    assert.equal(await db.can(A, `insert into public.tester_feedback (answers) values ('{"intake":{"x":"a"}}')`), true);
    assert.equal(await db.can(B, `insert into public.tester_feedback (user_id, answers) values ('${B}', '{"intake":{"x":"b"}}')`), true);
    const rows = await db.as<{ user_id: string }>(A, `select user_id from public.tester_feedback`);
    assert.deepEqual(rows.map((r) => r.user_id), [A]);
  });

  it("someone who isn't a tester can't write feedback", async () => {
    assert.equal(await db.can(PLAIN, `insert into public.tester_feedback (answers) values ('{}')`), false);
  });

  it("a tester can't write someone else's row", async () => {
    assert.equal(await db.can(A, `insert into public.tester_feedback (user_id, answers) values ('${ADMIN}', '{}')`), false);
    await db.as(A, `update public.tester_feedback set answers = '{"hacked":true}' where user_id = '${B}'`);
    const [b] = await db.as<{ answers: Record<string, unknown> }>(B, `select answers from public.tester_feedback`);
    assert.equal(b.answers.hacked, undefined);
  });

  it("an admin reads every row; a guest reads none", async () => {
    const all = await db.as<{ user_id: string }>(ADMIN, `select user_id from public.tester_feedback order by user_id`);
    assert.deepEqual(all.map((r) => r.user_id), [A, B]);
    const guest = await db.as<{ user_id: string }>("guest", `select user_id from public.tester_feedback`);
    assert.equal(guest.length, 0);
  });

  it("a removed tester stops writing, and what they wrote stays", async () => {
    await db.as(ADMIN, `delete from public.testers where user_id = '${B}'`);
    await db.as(B, `update public.tester_feedback set answers = '{"intake":{"x":"later"}}' where user_id = '${B}'`);
    const [b] = await db.as<{ answers: { intake: { x: string } } }>(ADMIN, `select answers from public.tester_feedback where user_id = '${B}'`);
    assert.equal(b.answers.intake.x, "b");
  });

  it("only a JSON object is stored", async () => {
    assert.equal(await db.can(A, `update public.tester_feedback set answers = '[1,2]' where user_id = '${A}'`), false);
  });
});
