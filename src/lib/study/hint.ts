import type { QuestionExercise } from "./types";

/**
 * The help a question gives after a wrong try: the first step of its solution,
 * cut down so it never gives the answer away. A first step often ends with the
 * computed result ("18,000 × … ÷ 0.045 = 94,401"), which would turn the second
 * try into copying, so every line that shows the answer is dropped, and a step
 * with nothing left gives no hint at all ("try again" alone).
 */
export function hintOf(q: QuestionExercise): string | undefined {
  if (q.steps.length < 2) return undefined;
  const lines = q.steps[0].split("\n");
  const shown = lines.map((line) => line.trim() !== "" && !revealsAnswer(line, q));
  // A heading line ("באקסל:") goes with what it heads: it stays only when the line under it stays.
  const kept = lines.filter((line, i) => shown[i] && !(line.trim().endsWith(":") && !shown[i + 1]));
  return kept.length ? kept.join("\n") : undefined;
}

/** The numbers written in a text, read with their thousands separators ("94,401.5" is 94401.5). */
const numbersIn = (text: string) =>
  (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, ""))).filter((n) => Number.isFinite(n));

/** Whether a text shows this amount, at the precision the answer is checked (±0.5); a sub-shekel answer must match exactly. */
const showsAmount = (text: string, amount: number) => {
  const want = Math.abs(amount);
  return numbersIn(text).some((n) => (want >= 1 ? Math.abs(n - want) <= 0.5 : Math.abs(n - want) < 1e-9));
};

/** Whether a line of text gives the question's answer away. */
export function revealsAnswer(text: string, q: QuestionExercise): boolean {
  if (q.kind === "number") return showsAmount(text, q.answer);
  if (q.kind === "choice") {
    const right = q.options[q.answer].trim();
    const asNumber = Number(right.replace(/[,₪\s]/g, ""));
    return right.replace(/[,₪\s]/g, "") !== "" && Number.isFinite(asNumber) ? showsAmount(text, asNumber) : text.includes(right);
  }
  // An entry: naming both accounts is the answer.
  return text.includes(q.dr) && text.includes(q.cr);
}
