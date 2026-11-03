import { Statement } from "@/components/study/ledger";
import { NOTE_2026 } from "@/lib/study/ias16/bakery";

type ByClass = { land: number; building: number; oven: number; van: number };

const CLASSES = ["קרקע", "מבנה", "ציוד (תנור)", "כלי רכב", "סה״כ"];

/** A row's amounts: one per class and their total; a class with nothing to show stays empty. */
const cols = (o: ByClass, sign = 1) => {
  const v = [o.land, o.building, o.oven, o.van].map((x) => sign * x);
  return [...v, v.reduce((a, b) => a + b, 0)].map((x) => (Math.abs(x) < 0.005 ? null : x));
};
const minus = (a: ByClass, b: ByClass, c: ByClass = { land: 0, building: 0, oven: 0, van: 0 }): ByClass => ({
  land: a.land + c.land - b.land,
  building: a.building + c.building - b.building,
  oven: a.oven + c.oven - b.oven,
  van: a.van + c.van - b.van,
});

/**
 * The bakery's property, plant and equipment note, as published: a column per
 * class, the cost and the accumulated depreciation each rolled from the
 * opening to the closing, and the carrying amount the balance sheet shows.
 */
export function PpeNote() {
  const N = NOTE_2026;
  const costEnd = minus(N.opening, N.disposed);
  const accEnd = minus(N.accOpening, N.accDisposed, N.charge);
  return (
    <Statement
      title={`ביאור — רכוש קבוע, ${N.year}`}
      head={CLASSES}
      rows={[
        { label: "עלות", kind: "heading" },
        { label: `יתרה ליום 1.1.${N.year}`, values: cols(N.opening) },
        { label: "גריעות", values: cols(N.disposed, -1) },
        { label: `יתרה ליום 31.12.${N.year}`, values: cols(costEnd), kind: "subtotal" },
        { label: "פחת נצבר", kind: "heading" },
        { label: `יתרה ליום 1.1.${N.year}`, values: cols(N.accOpening) },
        { label: "פחת השנה", values: cols(N.charge) },
        { label: "גריעות", values: cols(N.accDisposed, -1) },
        { label: `יתרה ליום 31.12.${N.year}`, values: cols(accEnd), kind: "subtotal" },
        { label: `עלות מופחתת ליום 31.12.${N.year}`, values: cols(minus(costEnd, accEnd)), kind: "total" },
      ]}
    />
  );
}
