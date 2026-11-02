/**
 * Hidden watermarks on the course and exam pages: a short code for the
 * signed-in reader, nearly transparent, in fixed spots on the screen. Invisible
 * in normal use; a screenshot or a phone photo, with its contrast pushed
 * (the reveal tool in /admin/watermark), shows the code, and the code leads
 * back to the account.
 */

/** "AA-3F2A9C1B": the first 8 hex digits of the account id. */
export const markCode = (userId: string) => `AA-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

/** The 8 hex digits from what an admin typed ("aa-3f2a9c1b", "3F2A 9C1B"…), or null. */
export function parseMarkCode(input: string) {
  const hex = input.trim().toLowerCase().replace(/^aa-?/, "").replace(/[\s-]/g, "");
  return /^[0-9a-f]{8}$/.test(hex) ? hex : null;
}

/**
 * Where the marks are. Four spots, so a cropped capture still keeps one; the
 * admin page lists them from here, so the page and the description can't drift.
 */
export const MARK_SPOTS = [
  { id: "top", label: "פינה ימנית עליונה", hint: "בתוך פס הניווט, צמוד לקצה הימני", style: { top: 4, right: 6 } },
  { id: "center", label: "מרכז המסך", hint: "בדיוק באמצע, מעל התוכן", style: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } },
  { id: "side", label: "הקצה השמאלי, באמצע הגובה", hint: "כתוב לאורך הקצה, מסובב ב-90°", style: { top: "50%", left: 2, transform: "rotate(-90deg)", transformOrigin: "left top" } },
  { id: "bottom", label: "פינה שמאלית תחתונה", hint: "צמוד לתחתית ולקצה השמאלי", style: { bottom: 4, left: 6 } },
] as const;
