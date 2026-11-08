import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The one-click unsubscribe link's signature: an HMAC of the user id with the
 * reminders secret, so a link stops reminders for its own reader only, with no sign-in.
 */
const secret = () => process.env.REMINDERS_SECRET || process.env.CRON_SECRET || "";

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribe(userId: string, token: string): boolean {
  if (!secret() || !/^[0-9a-f-]{36}$/i.test(userId) || typeof token !== "string") return false;
  const want = Buffer.from(unsubscribeToken(userId));
  const got = Buffer.from(token);
  return want.length === got.length && timingSafeEqual(want, got);
}
