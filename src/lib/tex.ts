import katex from "katex";
import type { MathExpr } from "@/lib/engine/types";

const cache = new Map<string, string>();

/** KaTeX HTML for a formula. Safe on the server and in the browser; results are memoised. */
export function renderTex(tex: string, displayMode = false) {
  const key = `${displayMode ? "D" : "I"}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    // KaTeX has no glyph metrics for Hebrew and warns once per character; the
    // browser lays the text out fine, so mute the warning for this synchronous call.
    const warn = console.warn;
    console.warn = () => {};
    try {
      html = katex.renderToString(tex, { displayMode, throwOnError: false, strict: "ignore" });
    } finally {
      console.warn = warn;
    }
    cache.set(key, html);
  }
  return html;
}

const MATH_SYMBOLS: Record<string, string> = { "×": String.raw`\times `, "−": "-", "·": String.raw`\cdot `, "÷": String.raw`\div `, "%": String.raw`\%`, ",": "{,}" };
// Runs of anything that is not a digit or an operator are words, kept as one \text{} phrase. A parenthesised
// aside made only of words, like "יתרת אורך חיים (חודשים)", stays inside the phrase so it reads right to left
// with it; brackets around arithmetic, like "(עלות − גרט)", remain math.
const W = String.raw`[^\d.,%()+\-−×÷·=\s/]+`;
const WORDS = new RegExp(String.raw`(${W}(?:\s+${W}|\s*\(${W}(?:\s+${W})*\))*)`);

const escapeText = (s: string) => s.replace(/[\\{}$&#^_%~]/g, (c) => (c === "\\" ? String.raw`\textbackslash{}` : `\\${c}`));

function stringToTex(s: string) {
  return s
    .split(WORDS)
    .map((part, i) => (i % 2 ? String.raw`\text{${escapeText(part)}}` : part.replace(/[×−·÷%,]/g, (c) => MATH_SYMBOLS[c]).replace(/\s+/g, " ")))
    .join("");
}

/** The engine's structured expression (words, figures, fractions) as LaTeX. */
export function exprToTex(expr: MathExpr): string {
  if (typeof expr === "string") return stringToTex(expr);
  if (Array.isArray(expr)) return expr.map(exprToTex).join(" ");
  return String.raw`\dfrac{${exprToTex(expr.over[0])}}{${exprToTex(expr.over[1])}}`;
}
