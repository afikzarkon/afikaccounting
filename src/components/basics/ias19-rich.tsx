import type { ReactNode } from "react";
import { Diff } from "./ias19-visuals";

/**
 * Light emphasis inside plain question text: `**words**` is bold, `==words==`
 * is highlighted. A string without markers comes back unchanged. Only for
 * prose (facts, point, required, step and note text) — never for formulas,
 * calculations or values.
 */
export function rich(s: string): ReactNode {
  if (!s.includes("**") && !s.includes("==")) return s;
  const parts = s.split(/(\*\*[^*]+\*\*|==[^=]+==)/);
  if (parts.length === 1) return s;
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("==") && p.endsWith("==") && p.length > 4) return <Diff key={i}>{p.slice(2, -2)}</Diff>;
    return p;
  });
}
