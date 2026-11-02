import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { STUDY_MODULES } from ".";
import { IAS19_LESSONS } from "./ias19";
import { MIND_MAP } from "./ias19/map";
import { LESSON_N, PREREQS, STAGES } from "./ias19/shared";
import { SKILLS } from "./ias19/skills";

describe("the employee-benefits course", () => {
  it("twelve lessons, numbered in order, all on the course's page, the first free", () => {
    assert.equal(IAS19_LESSONS.length, 12);
    IAS19_LESSONS.forEach((m, i) => {
      assert.equal(m.n, i + 1, m.slug);
      assert.equal(m.backHref, "/basics/ias19", m.slug);
      assert.equal(STUDY_MODULES[m.slug], m);
      assert.ok(m.slug.startsWith("ias19-"), m.slug);
    });
    assert.deepEqual(TOPICS.find((t) => t.id === "ias19")?.preview, ["ias19-map"]);
  });

  it("every reference to a lesson's number goes through LESSON_N, which matches the course's order", () => {
    assert.deepEqual(
      IAS19_LESSONS.map((m) => [m.slug, m.n]),
      Object.entries(LESSON_N),
    );
  });

  it("every screen of the course is an emp- screen", () => {
    for (const m of IAS19_LESSONS) for (const s of m.screens) assert.ok(s.id.startsWith("emp-"), `${m.slug}: ${s.id}`);
  });

  it("prerequisites come before the lesson; the stages cover every lesson once, in order", () => {
    for (const [slug, needs] of Object.entries(PREREQS)) for (const p of needs) assert.ok(LESSON_N[p] < LESSON_N[slug as keyof typeof LESSON_N], `${slug} needs ${p}`);
    assert.deepEqual(
      STAGES.flatMap((s) => s.lessons),
      Object.keys(LESSON_N),
    );
  });

  it("the mind map names every lesson, and every skill is taught in a lesson", () => {
    const onMap = new Set(MIND_MAP.flatMap((b) => b.leaves.map((l) => l.lesson)));
    for (const slug of Object.keys(LESSON_N)) assert.ok(onMap.has(slug as keyof typeof LESSON_N), slug);
    assert.equal(SKILLS.length, 11);
    for (const s of SKILLS) assert.ok(s.lessons.length > 0, s.skill);
  });
});
