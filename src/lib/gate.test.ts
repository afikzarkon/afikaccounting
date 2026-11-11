import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TOPICS } from "./catalog";
import { COURSE_ROUTES, type GateState, courseOfPath, decide } from "./gate";
import { STUDY_MODULES } from "./study";

const GUEST: GateState = { signedIn: false };
const PENDING: GateState = { signedIn: true, admin: false, status: "pending", courses: [] };
const REJECTED: GateState = { signedIn: true, admin: false, status: "rejected", courses: ["ias16"] };
const IAS16: GateState = { signedIn: true, admin: false, status: "approved", courses: ["ias16"] };
const ADMIN: GateState = { signedIn: true, admin: true, status: "pending", courses: [] };

const kind = (path: string, s: GateState) => decide(path, s).kind;

describe("course routes", () => {
  it("match the catalog's courses", () => {
    assert.deepEqual(
      COURSE_ROUTES.map((c) => [c.id, c.href]),
      TOPICS.map((t) => [t.id, t.href]),
    );
  });

  it("every lesson belongs to the course whose page it lists", () => {
    for (const m of Object.values(STUDY_MODULES)) {
      const topic = TOPICS.find((t) => t.href === m.backHref)!;
      assert.equal(courseOfPath(`/study/${m.slug}`), topic.id, m.slug);
    }
  });

  it("maps pages, lessons and exam mode, and nothing else", () => {
    assert.equal(courseOfPath("/basics"), "basics");
    assert.equal(courseOfPath("/basics/ias16/"), "ias16");
    assert.equal(courseOfPath("/exam-mode/ifrs16"), "ifrs16");
    assert.equal(courseOfPath("/exam-mode/nope"), null);
    assert.equal(courseOfPath("/study/unknown-lesson"), null);
    assert.equal(courseOfPath("/engine"), null);
    assert.equal(courseOfPath("/basics/ias16/x"), null);
  });
});

describe("the gate", () => {
  it("sends a guest to sign-in from every page but sign-in and the legal pages", () => {
    for (const p of ["/", "/basics", "/study/basics-intro", "/learn", "/admin", "/api/search", "/pending", "/my-courses", "/engine", "/x/home/b"]) assert.equal(kind(p, GUEST), "login", p);
    for (const p of ["/login", "/register", "/forgot-password", "/reset-password", "/terms", "/auth/callback", "/api/billing/webhook", "/api/track"]) assert.equal(kind(p, GUEST), "allow", p);
  });

  it("keeps an account that isn't approved on the waiting page", () => {
    for (const s of [PENDING, REJECTED]) {
      assert.equal(kind("/pending", s), "allow");
      for (const p of ["/", "/basics/ias16", "/study/ias16-intro", "/my-courses", "/profile", "/dashboard", "/admin", "/api/search"]) assert.equal(kind(p, s), "pending", p);
    }
  });

  it("opens an approved account's own course and nothing else", () => {
    for (const p of ["/basics/ias16", "/study/ias16-intro", "/study/ias16-methods", "/exam-mode/ias16", "/my-courses", "/profile"]) assert.equal(kind(p, IAS16), "allow", p);
    for (const p of ["/basics", "/basics/inventory", "/study/basics-intro", "/study/ias19-map", "/exam-mode/inventory", "/engine", "/engine/ias19", "/exams", "/exams/1", "/review", "/groups", "/pricing", "/checkout", "/about", "/admin", "/admin/users", "/api/search", "/api/calculators", "/x/home/b"])
      assert.equal(kind(p, IAS16), "denied", p);
  });

  it("leads general pages and sign-in pages to where the account belongs", () => {
    assert.deepEqual(decide("/", IAS16), { kind: "home", to: "/my-courses" });
    assert.deepEqual(decide("/learn", IAS16), { kind: "home", to: "/my-courses" });
    assert.deepEqual(decide("/pending", IAS16), { kind: "home", to: "/my-courses" });
    assert.deepEqual(decide("/login", IAS16), { kind: "home", to: "/my-courses" });
    assert.deepEqual(decide("/login", PENDING), { kind: "home", to: "/pending" });
    assert.deepEqual(decide("/register", ADMIN), { kind: "home", to: "/admin" });
  });

  it("opens everything to an admin", () => {
    for (const p of ["/", "/basics/inventory", "/study/ias19-map", "/admin/users", "/engine", "/api/search"]) assert.equal(kind(p, ADMIN), "allow", p);
  });
});
