import assert from "node:assert/strict";
import { test } from "node:test";
import { assign, compare, EXPERIMENTS, type Experiment, pickVariant } from "./experiments";

const on: Experiment = { ...EXPERIMENTS[0], active: true };
const off: Experiment = { ...EXPERIMENTS[0], active: false };

test("variants are picked by weight", () => {
  assert.equal(pickVariant(on, 0), "control");
  assert.equal(pickVariant(on, 0.49), "control");
  assert.equal(pickVariant(on, 0.5), "doors");
  assert.equal(pickVariant(on, 0.999), "doors");
});

test("a running experiment keeps a visitor's variant and stores a fresh pick", () => {
  assert.deepEqual(assign(on, "doors", "", 0.1), { variant: "doors", store: false });
  assert.deepEqual(assign(on, undefined, "", 0.9), { variant: "doors", store: true });
  assert.deepEqual(assign(on, "gone", "", 0.1), { variant: "control", store: true }, "a cookie for a variant that no longer exists is replaced");
});

test("an experiment that's off serves the control; ?ab= previews a variant either way", () => {
  assert.deepEqual(assign(off, undefined, "", 0.9), { variant: "control", store: false });
  assert.deepEqual(assign(off, undefined, "?ab=hero:doors", 0.1), { variant: "doors", store: true });
  assert.deepEqual(assign(off, undefined, "?ab=hero:nope", 0.9), { variant: "control", store: false });
  assert.deepEqual(assign(off, undefined, "?ab=other:doors", 0.9), { variant: "control", store: false });
});

test("compare: a clear difference is significant, a small sample is not judged", () => {
  const r = compare({ n: 1000, x: 200 }, { n: 1000, x: 260 })!;
  assert.ok(r.p < 0.01 && r.z > 0);
  assert.ok(Math.abs(r.lift! - 0.3) < 1e-9);
  assert.ok(compare({ n: 1000, x: 200 }, { n: 1000, x: 205 })!.p > 0.5);
  assert.equal(compare({ n: 10, x: 2 }, { n: 1000, x: 260 }), null);
});
