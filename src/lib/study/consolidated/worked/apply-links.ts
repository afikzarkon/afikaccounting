import { LINKS } from "./links";
import type { WCell, Worked, WRow, WTable } from "./types";

/**
 * The links in `links.ts` written into the example itself: the source gets an `id`, the carried
 * figure a `from`, so the solution draws the arrow the same way it does for links written inline.
 */

type Place = { kind: "line"; step: number; line: number } | { kind: "cell"; table: WTable; row: number; col: number };

function locate(ex: Worked, path: string): Place | null {
  const p = path.split(".");
  if (p[0] === "g") {
    const table = ex.tables?.[+p[1]];
    return table && p.length === 4 ? { kind: "cell", table, row: +p[2], col: +p[3] } : null;
  }
  const step = ex.steps[+p[0] - 1];
  if (!step) return null;
  if (p[1] === "l" && p.length === 3) return step.sheet?.[+p[2]] ? { kind: "line", step: +p[0] - 1, line: +p[2] } : null;
  if (p[1] === "t" && p.length === 5) {
    const table = step.tables?.[+p[2]];
    return table ? { kind: "cell", table, row: +p[3], col: +p[4] } : null;
  }
  return null;
}

/** What a place shows, or undefined when the example has no such place. */
export function placeValue(ex: Worked, path: string): WCell | undefined {
  const at = locate(ex, path);
  if (!at) return undefined;
  if (at.kind === "line") return ex.steps[at.step].sheet![at.line].a;
  return at.table.rows[at.row]?.c[at.col];
}

export function withLinks(ex: Worked, links: string[] | undefined = LINKS[ex.title]): Worked {
  if (!links?.length) return ex;
  // Copies all the way down to the rows and lines, so the example's own data stays as it was.
  const copy: Worked = {
    ...ex,
    tables: ex.tables?.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r })) })),
    steps: ex.steps.map((s) => ({
      ...s,
      sheet: s.sheet?.map((l) => ({ ...l })),
      tables: s.tables?.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r })) })),
    })),
  };
  const mark = (path: string, key: "id" | "from", value: string) => {
    const at = locate(copy, path);
    if (!at) return;
    if (at.kind === "line") {
      copy.steps[at.step].sheet![at.line][key] = value;
      return;
    }
    const row: WRow | undefined = at.table.rows[at.row];
    if (row) row[key] = { ...row[key], [at.col]: value };
  };
  for (const link of links) {
    const [src, dst] = link.split(">").map((s) => s.trim());
    const id = `k:${src}`;
    mark(src, "id", id);
    mark(dst, "from", id);
  }
  return copy;
}
