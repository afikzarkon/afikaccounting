import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormulaFill } from "./ias19-formula";
import { TwoBuckets } from "./ias19-ui";
import { BankStatement, BeforeAfter, Fork, NetBars, PeopleGrid, PvSlide, Routing, SplitBar, Staircase, Timeline, TwoPanel, WrongRight } from "./ias19-visuals";

/** Each figure of the course renders with sample data and says what it shows in an aria-label. */
const FIGURES: [string, ReactElement][] = [
  ["Timeline", h(Timeline, { label: "ציר זמן", from: 0, to: 10, ticks: [{ at: 0, label: "היום" }, { at: 10, label: "פרישה" }], spans: [{ from: 0, to: 4, label: "עבד", tone: 2 }], marks: [{ at: 4, label: "מדידה" }] })],
  ["PvSlide", h(PvSlide, { fv: 100, i: 0.08, n: 5 })],
  ["PvSlide (long)", h(PvSlide, { fv: 1_000, i: 0.05, n: 12 })],
  ["Staircase", h(Staircase, {})],
  ["PeopleGrid", h(PeopleGrid, { total: 400, leaving: 60 })],
  ["SplitBar", h(SplitBar, { periods: [{ months: 6, label: "עד התיקון", rate: "6%" }, { months: 6, label: "אחרי", rate: "5%" }] })],
  ["BeforeAfter", h(BeforeAfter, { before: { label: "לפני", v: 100 }, after: { label: "אחרי", v: 130 }, jump: "שירות עבר" })],
  ["Routing", h(Routing, { label: "לאן", rows: [{ label: "עלות שירות", value: 100, to: "pl" }, { label: "P.N.", value: 20, to: "oci" }, { label: "סגירה", value: 900, to: "bs" }] })],
  ["NetBars", h(NetBars, { obligation: 1_000, assets: 1_300, ceiling: 100 })],
  ["NetBars (deficit)", h(NetBars, { obligation: 1_000, assets: 700 })],
  ["BankStatement", h(BankStatement, { opening: 1_000, moves: [{ label: "הפקדה", v: 300 }], closing: 1_350, unexplained: "לא הוסבר" })],
  ["TwoPanel", h(TwoPanel, { label: "שני מקרים", panels: [{ title: "א", steps: ["1", "2"], verdict: "ס" }, { title: "ב", steps: ["1"], verdict: "ס" }] })],
  ["WrongRight", h(WrongRight, { label: "טעות מול נכון", wrong: "x", right: "y" })],
  ["Fork", h(Fork, { label: "התפצלות", question: "?", branches: [{ when: "כן", then: "א", to: "pl" }, { when: "לא", then: "ב", to: "oci" }] })],
  ["TwoBuckets", h(TwoBuckets, {})],
  [
    "FormulaFill",
    h(FormulaFill, {
      label: "ערך נוכחי",
      lhs: "ערך נוכחי",
      terms: { fv: { c: 0, sym: "סכום", value: "100" }, i: { c: 5, sym: "i", value: "8%" }, n: { c: 4, sym: "n", value: "5" } },
      top: [{ t: "fv" }],
      bottom: ["(1 + ", { t: "i" }, ")", { sup: "n" }],
      result: "68",
    }),
  ],
];

describe("the course's figures", () => {
  for (const [name, el] of FIGURES)
    it(`${name} renders, with an aria-label`, () => {
      const html = renderToStaticMarkup(el);
      assert.ok(html.length > 50, name);
      assert.match(html, /aria-label="[^"]+"/, name);
    });

  it("the present value slide lands on today's value, from the solver", () => {
    assert.match(renderToStaticMarkup(h(PvSlide, { fv: 100, i: 0.08, n: 5 })), /שווים היום 68/);
  });

  it("over the ceiling, the net bars say how much is not recognised", () => {
    assert.match(renderToStaticMarkup(h(NetBars, { obligation: 1_000, assets: 1_300, ceiling: 100 })), /מוכר עד התקרה 100/);
  });
});
