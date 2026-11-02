/**
 * Who may read and change what the site shows (site_visibility), on the real
 * migrations: everyone reads it — the menus are built from it — and only an
 * admin writes it.
 */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { type Db, startDb } from "./pg";

const USER = "00000000-0000-4000-8000-0000000000b1";
const ADMIN = "00000000-0000-4000-8000-0000000000b2";
let db: Db;

before(async () => {
  db = await startDb();
  await db.exec(`
    insert into auth.users (id, email) values ('${USER}', 'user@example.com'), ('${ADMIN}', 'admin@example.com');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.site_visibility (key, hidden) values ('link:/exams', true);
  `);
});
after(() => db.close());

describe("site visibility", () => {
  it("everyone reads it, guests included", async () => {
    for (const who of ["guest", USER, ADMIN]) assert.deepEqual(await db.as(who, "select key, hidden from public.site_visibility"), [{ key: "link:/exams", hidden: true }]);
  });

  it("a guest or a reader can't hide, show or rename anything", async () => {
    assert.equal(await db.can("guest", "insert into public.site_visibility (key, hidden) values ('home:faq', true)"), false);
    assert.equal(await db.can(USER, "insert into public.site_visibility (key, hidden) values ('home:faq', true)"), false);
    await db.as(USER, "update public.site_visibility set hidden = false");
    await db.as(USER, "delete from public.site_visibility");
    assert.equal((await db.as<{ hidden: boolean }>("guest", "select hidden from public.site_visibility where key = 'link:/exams'"))[0].hidden, true);
  });

  it("an admin can", async () => {
    assert.equal(await db.can(ADMIN, "insert into public.site_visibility (key, hidden, label) values ('cta:hero-start', false, 'בואו נתחיל')"), true);
    await db.as(ADMIN, "update public.site_visibility set hidden = false where key = 'link:/exams'");
    await db.as(ADMIN, "delete from public.site_visibility where key = 'cta:hero-start'");
    assert.deepEqual(await db.as("guest", "select key, hidden from public.site_visibility"), [{ key: "link:/exams", hidden: false }]);
  });

  it("a button's text has a length limit", async () => {
    assert.equal(await db.can(ADMIN, `insert into public.site_visibility (key, label) values ('cta:x1', '${"א".repeat(81)}')`), false);
  });
});
