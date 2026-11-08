import { verifyUnsubscribe } from "@/lib/reminders-server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * One click from a reminder email turns reminders off — no sign-in, the link's
 * signature names the reader. GET from the link, POST from a mail client's
 * one-click unsubscribe (RFC 8058).
 */
async function stop(request: Request) {
  const url = new URL(request.url);
  const u = url.searchParams.get("u") ?? "";
  const t = url.searchParams.get("t") ?? "";
  if (!verifyUnsubscribe(u, t)) return page("הקישור לא תקין", "אפשר לכבות את התזכורות גם בעמוד הפרופיל.", 400);
  await createServiceClient().from("study_habits").update({ reminders: false }).eq("user_id", u);
  return page("התזכורות בוטלו", "לא נשלח לכם יותר מייל תזכורת. אפשר להפעיל אותן שוב בעמוד הפרופיל.", 200);
}

const page = (title: string, line: string, status: number) =>
  new Response(
    `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#16261f"><h1 style="font-size:1.5rem">${title}</h1><p>${line}</p><p><a href="/profile">לעמוד הפרופיל</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );

export const GET = stop;
export const POST = stop;
