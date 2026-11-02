import "server-only";

/**
 * One structured line per security event (failed sign-in, refused admin
 * action, rejected webhook), on stderr so the host's log drain picks it up and
 * an alert can count them. Emails are masked: the log shows a pattern, not who.
 */
export function securityLog(event: string, details: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "warn", event: `security.${event}`, at: new Date().toISOString(), ...details }));
}

/** "dana@example.com" → "d***@example.com". */
export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return domain ? `${name.slice(0, 1)}***@${domain}` : "***";
}
