import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBalanced, typeOf } from "@/lib/learn/basics";
import { checkDrill, drill, DRILL_FAMILIES, type BasicsDrill, type DrillFamily, familiesOf } from "./basics/drills";

const SEEDS = 500;
const families = Object.keys(DRILL_FAMILIES) as DrillFamily[];
const n = (d: BasicsDrill, k: string) => Number(d.inputs[k]);

/** Months from the first of (year, month) to the end of December of `to`. */
const monthsTo = (year: number, month: number, toYear: number, toMonth = 12) => (toYear - year) * 12 + toMonth - month + 1;

/** Each family's answer, worked out again from its inputs alone, apart from the generator's own code. */
function expected(d: BasicsDrill): number {
  switch (d.family) {
    case "prepaidAsset":
      return (n(d, "paid") / n(d, "months")) * (13 - n(d, "start"));
    case "prepaidExpense":
      return n(d, "paid") - (n(d, "paid") / n(d, "months")) * (13 - n(d, "start"));
    case "unearned":
      return (n(d, "received") / n(d, "months")) * (13 - n(d, "start"));
    case "inventory":
      return n(d, "opening") + n(d, "purchases") - Math.min(n(d, "cost"), n(d, "nrv"));
    case "depFull":
      return n(d, "cost") / n(d, "years");
    case "depPart": {
      const yearly = n(d, "cost") / n(d, "years");
      if (d.inputs.variant === "first") return (yearly * (13 - n(d, "month"))) / 12;
      const acc = (yearly * monthsTo(n(d, "year"), n(d, "month"), 2025)) / 12;
      return d.inputs.variant === "accumulated" ? acc : n(d, "cost") - acc;
    }
    case "ppeSale": {
      const acc = ((n(d, "cost") / n(d, "years")) * monthsTo(n(d, "year"), n(d, "month"), 2025, n(d, "soldMonth"))) / 12;
      return Math.abs(n(d, "proceeds") - (n(d, "cost") - acc));
    }
    case "salaryRaise":
      return (n(d, "recorded") / 11) * (1 + n(d, "raise"));
    case "salaryBonus":
      return (n(d, "recorded") - n(d, "gift") * n(d, "staff")) / 11;
    case "oddBill": {
      const v = d.inputs.variant;
      if (v === "twoMonths") return (n(d, "recorded") / 10) * 2;
      if (v === "dearDecember") return (n(d, "recorded") / 11) * (1 + n(d, "rise"));
      return (n(d, "recorded") / 10) * (2 + n(d, "rise"));
    }
    case "interest":
      return (n(d, "principal") * n(d, "rate") * (13 - n(d, "start"))) / (n(d, "half") ? 6 : 12);
    case "oldContract": {
      const left = n(d, "months") - monthsTo(n(d, "startYear"), n(d, "start"), 2024);
      return (n(d, "paid") / n(d, "months")) * Math.min(12, left);
    }
    case "unknownPrepaid":
      return (n(d, "paid") / n(d, "months")) * (n(d, "months") - monthsTo(n(d, "startYear"), n(d, "start"), 2024));
    case "endsOrCycles":
      return d.inputs.variant === "ends" ? n(d, "balance") : n(d, "monthly") * 12;
    case "correction":
      return n(d, "amount") * (d.inputs.variant === "reversed" ? 2 : 1);
    case "renewedNewPrice": {
      const month = n(d, "balance") / n(d, "left");
      return n(d, "balance") + month * (1 + n(d, "raise")) * (12 - n(d, "left"));
    }
    case "ppeUnknown": {
      const cost = (n(d, "count") - n(d, "sold")) * n(d, "each");
      return n(d, "askAcc") ? (cost / n(d, "years")) * (monthsTo(n(d, "year"), n(d, "month"), 2024) / 12) : cost;
    }
    case "ppeX":
      return n(d, "acc") / (monthsTo(n(d, "year"), n(d, "month"), 2024) / (n(d, "years") * 12));
    case "generalTopUp":
      return n(d, "customers") * n(d, "rate") - n(d, "before");
    case "decrease":
      return n(d, "before") - n(d, "customers") * n(d, "rate");
    case "writeOffTopUp":
    case "recovered":
      return n(d, "customers") * n(d, "rate") - (n(d, "opening") - n(d, "written") + n(d, "recovered"));
    case "specificGeneral":
      return n(d, "specific") * n(d, "p") + (n(d, "customers") - n(d, "specific")) * n(d, "g") - n(d, "before");
    case "grossFromNet":
      return n(d, "net") / (1 - n(d, "rate"));
    case "collections":
      return n(d, "opening") + n(d, "sales") - n(d, "written") - n(d, "closing");
    case "unknownSpecific": {
      const closing = n(d, "opening") - n(d, "written") + n(d, "expense");
      return (closing - n(d, "customers") * n(d, "g")) / (n(d, "p") - n(d, "g"));
    }
  }
}

/** Families whose answer is the amount of their (first) journal entry. */
const ANSWER_IS_ENTRY: DrillFamily[] = ["prepaidAsset", "prepaidExpense", "unearned", "depFull", "salaryRaise", "salaryBonus", "oddBill", "interest", "oldContract", "endsOrCycles", "correction", "generalTopUp", "decrease", "writeOffTopUp", "recovered", "specificGeneral"];

describe("the basics drills", () => {
  it("26 families across lessons 5, 6 and 7, in three levels", () => {
    assert.equal(families.length, 26);
    assert.deepEqual([familiesOf(5).length, familiesOf(6).length, familiesOf(7).length], [11, 7, 8]);
    for (const l of [5, 6, 7] as const) for (const lv of [1, 2, 3]) assert.ok(familiesOf(l).some((f) => DRILL_FAMILIES[f].level === lv), `lesson ${l} level ${lv}`);
  });

  for (const f of families)
    it(`${f}: ${SEEDS} draws, each a whole positive answer that the inputs give again`, () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= SEEDS; seed++) {
        const d = checkDrill(drill(f, seed));
        seen.add(d.prompt);
        assert.equal(d.family, f);
        assert.ok(Number.isInteger(d.answer) && d.answer > 0, `${f} #${seed}: ${d.answer}`);
        assert.ok(Math.abs(expected(d) - d.answer) < 0.01, `${f} #${seed}: ${d.answer} vs ${expected(d)}`);
        assert.ok(!/NaN|undefined|Infinity/.test(d.prompt + JSON.stringify(d.steps) + d.excel), `${f} #${seed}`);
        assert.ok(d.excel.startsWith("="), `${f} #${seed}: ${d.excel}`);
        for (const e of d.entries) {
          assert.ok(isBalanced(e), `${f} #${seed}`);
          for (const l of e.lines) {
            typeOf(l.account);
            assert.ok(((l.dr ?? l.cr)! > 0) && Number.isInteger((l.dr ?? l.cr)!), `${f} #${seed}: ${l.account}`);
          }
        }
        if (ANSWER_IS_ENTRY.includes(f)) assert.equal(d.entries[0].lines[0].dr, d.answer, `${f} #${seed}`);
      }
      assert.ok(seen.size > SEEDS * 0.8, `${f}: only ${seen.size} different stories`);
    });
});
