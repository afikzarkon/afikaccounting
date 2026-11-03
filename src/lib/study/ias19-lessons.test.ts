import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { TOPICS } from "../catalog";
import { STUDY_MODULES } from ".";
import { IAS19_LESSONS } from "./ias19";
import { IAS19_GLOSSARY } from "./ias19/glossary";
import { FORMULA, putIn, said, TOOL, tool, work } from "./ias19/formulas";
import { ltrFormulas } from "./ias19/ltr";
import { MIND_MAP } from "./ias19/map";
import { PRIMER, PRIMER_NEEDS, PRIMER_PERCENT_ANSWER, PRIMER_PV_ANSWER, PRIMER_ROLL_ANSWER } from "./ias19/primer";
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

describe("before we start: the primer, and the glossary", () => {
  it("seven cards with unique ids, each saying why it is needed and with a self-check", () => {
    assert.equal(PRIMER.length, 7);
    assert.equal(new Set(PRIMER.map((c) => c.id)).size, 7);
    for (const c of PRIMER) {
      assert.ok(c.need.trim(), c.id);
      assert.ok(c.checks.length > 0, c.id);
      for (const q of c.checks) assert.ok(q.answer >= 0 && q.answer < q.options.length && new Set(q.options).size === q.options.length, `${c.id}: ${q.q}`);
    }
    assert.equal(PRIMER.find((c) => c.id === "pl-oci")!.checks.length, 2);
  });

  it("who needs what: a key for every lesson, only real cards, lesson 1 empty, the present value in lessons 5 to 11", () => {
    assert.deepEqual(Object.keys(PRIMER_NEEDS), Object.keys(LESSON_N));
    const ids = new Set(PRIMER.map((c) => c.id));
    for (const needs of Object.values(PRIMER_NEEDS)) for (const id of needs) assert.ok(ids.has(id), id);
    assert.deepEqual(PRIMER_NEEDS["ias19-map"], []);
    for (const slug of ["ias19-measure", "ias19-attribute", "ias19-rollforward", "ias19-amend", "ias19-assets", "ias19-present", "ias19-other"] as const) assert.ok(PRIMER_NEEDS[slug].includes("pv"), slug);
    // The blueprint's table, in the site's numbering.
    const byN = (id: string) => PRIMER.find((c) => c.id === id)!.needed.map((s) => LESSON_N[s]).sort((a, b) => a - b);
    assert.deepEqual(byN("pv"), [2, 5, 6, 7, 8, 9, 10, 11]);
    assert.deepEqual(byN("roll"), [2, 7, 8, 9, 10, 11]);
    assert.deepEqual(byN("pl-oci"), [4, 7, 8, 9, 10, 11]);
    assert.deepEqual(byN("accrual"), [1, 3]);
    assert.deepEqual(byN("journal"), [3, 4, 10]);
    assert.deepEqual(byN("percent"), [3, 5, 6]);
    assert.deepEqual(byN("obligation"), [1, 3, 11]);
  });

  it("the self-checks' answers are the solver's", () => {
    assert.equal(PRIMER_PV_ANSWER, 9_070);
    assert.equal(PRIMER_ROLL_ANSWER, 30);
    assert.equal(PRIMER_PERCENT_ANSWER, 230);
    assert.ok(PRIMER.find((c) => c.id === "pv")!.checks[0].options[0].includes("9,070"));
  });

  it("the glossary: sixteen terms, none twice, none empty", () => {
    assert.equal(IAS19_GLOSSARY.length, 16);
    assert.equal(new Set(IAS19_GLOSSARY.map(([t]) => t)).size, 16);
    for (const [t, d] of IAS19_GLOSSARY) assert.ok(t.trim() && d.trim(), t);
  });

  it("no orphan screens: the course's screen files define exactly the screens its lessons list", () => {
    // screens.ts is server-only, so its orphanScreens is read here from the sources it maps.
    const dir = join(process.cwd(), "src/components/basics");
    const defined = readdirSync(dir)
      .filter((f) => /^ias19-course.*\.tsx$/.test(f))
      .flatMap((f) => [...readFileSync(join(dir, f), "utf8").matchAll(/^ {2}"(emp-[\w-]+)": \{/gm)].map((m) => m[1]));
    const listed = IAS19_LESSONS.flatMap((m) => m.screens.map((s) => s.id));
    assert.deepEqual([...defined].sort(), [...listed].sort());
  });

  it("the course opens on what IAS 19 is and why it is needed", () => {
    assert.equal(IAS19_LESSONS[0].screens[0].id, "emp-map-why");
  });
});

describe("formulas read left to right", () => {
  const LRI = String.fromCharCode(0x2066);
  const PDI = String.fromCharCode(0x2069);
  /** The text as read, without the marks that hold each operator in place. */
  const plain = (s: string) => s.replaceAll(String.fromCharCode(0x200e), "");
  it("wraps the formula clause, and leaves the words around it outside", () => {
    assert.equal(plain(ltrFormulas("שיעור לרבעון: 1.08^(3/12) − 1 = 1.94%.")), `שיעור לרבעון: ${LRI}1.08^(3/12) − 1 = 1.94%${PDI}.`);
    assert.equal(plain(ltrFormulas("פתיחה + הוצאה − תשלומים = סגירה, ולכן הוצאה = סגירה − פתיחה.")), `${LRI}פתיחה + הוצאה − תשלומים = סגירה${PDI}, ולכן ${LRI}הוצאה = סגירה − פתיחה${PDI}.`);
    assert.equal(ltrFormulas("מיום התשלום החוב קטן, ולכן אין עליו ריבית."), "מיום התשלום החוב קטן, ולכן אין עליו ריבית.");
  });

  it("every solution step with a formula in the course is laid out left to right", () => {
    for (const m of IAS19_LESSONS)
      for (const x of m.exercises)
        if (x.kind !== "journal") for (const s of x.steps) if (/[=×÷^]/.test(s)) assert.ok(s.includes(LRI), `${m.slug}/${x.id}: ${s}`);
  });
});

describe("formulas read left to right: P.N.", () => {
  it("does not take the dot of P.N. for the end of a sentence", () => {
    const out = ltrFormulas("P.N. = סגירה − פתיחה. ולכל שורה, המקום שלה.").replaceAll(String.fromCharCode(0x200e), "");
    assert.equal(out, `${String.fromCharCode(0x2066)}P.N. = סגירה − פתיחה${String.fromCharCode(0x2069)}. ולכל שורה, המקום שלה.`);
  });
});

describe("every result is worked: the formula, then the numbers", () => {
  /** The lessons already written this way; each lesson joins as it is converted. */
  const WORKED: string[] = ["ias19-toolkit", "ias19-short", "ias19-dc", "ias19-measure", "ias19-attribute", "ias19-rollforward"];
  const formulas = [...Object.values(FORMULA), ...Object.values(TOOL)] as string[];
  const plain = (s: string) => s.replaceAll(/[‎⁦⁩]/g, "");

  it("a formula over its numbers stays two lines, each left to right", () => {
    const out = ltrFormulas(said(work.pv(15_600, 0.07, 6)));
    assert.deepEqual(plain(out).split("\n"), [FORMULA.pv, "15,600 ÷ 1.07^6 = 10,395 ₪"]);
    assert.ok(out.split("\n").every((l) => l.startsWith("⁦")));
    assert.equal(putIn(work.pv(15_600, 0.07, 6)), "15,600 ÷ 1.07^6");
  });

  it("lesson 2 works every result both ways: the main page's formula, and Excel", () => {
    const w = tool.pv(8_000, 0.06, 4);
    assert.equal(w.formula, "FV ÷ (1 + RATE)^YEAR = PV");
    assert.equal(w.numbers, "8,000 ÷ (1.06)^4 = 6,337 ₪");
    assert.deepEqual(w.excel, { formula: "=PV(rate;nper;pmt;fv)", numbers: "=PV(6%;4;0;-8000) → 6,337 ₪" });
    assert.equal(tool.partRate(0.08, 3).numbers, "(1.08)^(3/12) − 1 = 1.9427%");
    assert.equal(tool.partRate(0.08, 24).numbers, "(1.08)^2 − 1 = 16.64%");
    assert.equal(tool.part(18_000, 0.05, 8).excel?.numbers, "=FV(5%;8/12;0;-18000)-18000 → 595 ₪");
    const toolkit = IAS19_LESSONS.find((l) => l.slug === "ias19-toolkit")!;
    for (const x of toolkit.exercises) if (x.kind === "number") assert.ok(x.steps.some((s) => s.includes("באקסל:")), `${x.id}: no Excel`);
  });

  it("every calculation's solution shows one of the course's formulas, and a line with the numbers in", () => {
    for (const m of IAS19_LESSONS.filter((l) => WORKED.includes(l.slug)))
      for (const x of m.exercises) {
        if (x.kind !== "number") continue;
        const lines = x.steps.flatMap((s) => plain(s).split("\n"));
        assert.ok(lines.some((l) => formulas.includes(l)), `${m.slug}/${x.id}: no formula`);
        assert.ok(lines.some((l) => /\d.*=\s*[\d,.−-]+/.test(l)), `${m.slug}/${x.id}: no numbers`);
      }
  });
});
