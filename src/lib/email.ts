import "server-only";

/**
 * Sending an email, through the provider set in EMAIL_PROVIDER. Unset, nothing is
 * sent (a dry run: the caller learns what would have gone out), so the reminders
 * route can run in development and before a provider is chosen. "resend" sends
 * through Resend's HTTP API with RESEND_API_KEY, from EMAIL_FROM. Keys live in the
 * environment only.
 */
export type Email = { to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

export const emailProvider = () => (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "resend" : null);

export async function sendEmail(e: Email): Promise<{ sent: boolean; dry?: boolean }> {
  if (emailProvider() !== "resend") return { sent: false, dry: true };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [e.to], subject: e.subject, html: e.html, text: e.text, headers: e.headers }),
  });
  return { sent: res.ok };
}
