import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { navFor } from "@/lib/site";
import { NOTHING_HIDDEN, type Visibility, isHidden, isLinkHidden, labelOf } from "./rules";

const v = (links: string[], hidden: string[] = [], labels: Record<string, string> = {}): Visibility => ({ hidden: [...hidden, ...links.map((l) => `link:${l}`)], links, labels });

describe("which addresses a hidden one covers", () => {
  it("the same page, with or without a trailing slash or a #fragment", () => {
    assert.equal(isLinkHidden(["/pricing"], "/pricing"), true);
    assert.equal(isLinkHidden(["/pricing"], "/pricing/"), true);
    assert.equal(isLinkHidden(["/pricing"], "/pricing#faq"), true);
  });

  it("a page hides all its query variants: the engine its calculators, a lesson its screens", () => {
    assert.equal(isLinkHidden(["/engine"], "/engine?calc=ifrs-16-leases"), true);
    assert.equal(isLinkHidden(["/study/inventory-fifo"], "/study/inventory-fifo?screen=x"), true);
  });

  it("a query variant hides only itself", () => {
    const links = ["/engine?calc=ifrs-16-leases"];
    assert.equal(isLinkHidden(links, "/engine?calc=ifrs-16-leases"), true);
    assert.equal(isLinkHidden(links, "/engine?calc=ifrs-16-leases&v=abc"), true);
    assert.equal(isLinkHidden(links, "/engine?calc=ias-37-provisions"), false);
    assert.equal(isLinkHidden(links, "/engine"), false);
  });

  it("a page doesn't hide the pages under it, unless it's a whole area (/*)", () => {
    assert.equal(isLinkHidden(["/basics"], "/basics/inventory"), false);
    assert.equal(isLinkHidden(["/exams", "/exams/*"], "/exams/1234"), true);
    assert.equal(isLinkHidden(["/exams", "/exams/*"], "/examsx"), false);
  });

  it("keys without an address are matched exactly; labels fall back to the button's own", () => {
    const vis = v([], ["home:faq"], { "cta:hero-start": "בואו נתחיל" });
    assert.equal(isHidden(vis, "home:faq"), true);
    assert.equal(isHidden(vis, "home:how"), false);
    assert.equal(labelOf(vis, "cta:hero-start", "התחילו"), "בואו נתחיל");
    assert.equal(labelOf(vis, "cta:header-start", "התחילו בחינם"), "התחילו בחינם");
  });
});

describe("the menu without what the admin hid", () => {
  const labels = (items: ReturnType<typeof navFor>) => items.map((i) => ("items" in i ? i.label : i.href));

  it("nothing hidden: the whole menu", () => {
    assert.deepEqual(labels(navFor(NOTHING_HIDDEN)), ["קורסים", "/exams", "כלים", "/pricing"]);
  });

  it("a hidden top-level link drops out", () => {
    assert.deepEqual(labels(navFor(v(["/exams", "/exams/*", "/pricing"]))), ["קורסים", "כלים"]);
  });

  it("a hidden course leaves its category; an emptied category with a hidden hub goes", () => {
    const courses = navFor(v(["/basics/inventory"])).find((i) => "items" in i && i.label === "קורסים");
    assert.ok(courses && "items" in courses && !courses.items.some((i) => i.href === "/basics/inventory"));

    const engineAndTools = ["/engine", ...navFor(NOTHING_HIDDEN).flatMap((i) => ("items" in i && i.label === "כלים" ? i.items.map((x) => x.href) : []))];
    assert.deepEqual(labels(navFor(v(engineAndTools))), ["קורסים", "/exams", "/pricing"]);
  });
});
