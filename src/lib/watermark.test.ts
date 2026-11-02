import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MARK_SPOTS, markCode, parseMarkCode } from "./watermark";

describe("watermark codes", () => {
  it("is AA- and the account id's first 8 hex digits, upper-case", () => {
    assert.equal(markCode("3f2a9c1b-0000-4000-8000-000000000001"), "AA-3F2A9C1B");
  });

  it("reads back what an admin types, however it's written", () => {
    for (const typed of ["AA-3F2A9C1B", "aa-3f2a9c1b", "3F2A9C1B", " AA3F2A 9C1B ", "3f2a-9c1b"]) assert.equal(parseMarkCode(typed), "3f2a9c1b", typed);
  });

  it("refuses anything that isn't 8 hex digits", () => {
    for (const typed of ["", "AA-", "AA-3F2A9C1", "AA-3F2A9C1BB", "AA-3F2A9C1G", "dana@example.com"]) assert.equal(parseMarkCode(typed), null, typed);
  });

  it("round-trips: the code on the page finds its account", () => {
    const id = "c0ffee12-3456-4789-8abc-def012345678";
    assert.equal(parseMarkCode(markCode(id)), id.slice(0, 8));
  });

  it("has four spots, each with its own place", () => {
    assert.equal(MARK_SPOTS.length, 4);
    assert.equal(new Set(MARK_SPOTS.map((s) => JSON.stringify(s.style))).size, 4);
  });
});
