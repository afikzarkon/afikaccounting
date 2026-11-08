import { connection } from "next/server";
import { TOPICS } from "@/lib/catalog";
import { sendEmail } from "@/lib/email";
import { SITE_URL } from "@/lib/env";
import { israelDay, reminderFor } from "@/lib/reminders";
import { unsubscribeToken } from "@/lib/reminders-server";
import { MASTERED } from "@/lib/study/review";
import { sanitizeHabits } from "@/lib/study/habits";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * The daily study reminders, run by the scheduler (vercel.json crons) with
 * `Authorization: Bearer <CRON_SECRET>`. For every reader who turned reminders
 * on: if today they haven't studied, weren't reminded, and have mistakes due or an
 * exam within two weeks, one email. Without CRON_SECRET the route doesn't exist;
 * without an email provider it is a dry run that reports what it would send.
 */
export async function GET(request: Request) {
  // At request time, always: the secret and the day are read per run, never frozen into a build.
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response(null, { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });

  const supabase = createServiceClient();
  const today = israelDay();
  const { data: habits, error } = await supabase.from("study_habits").select("user_id, days, exams, reminded_on").eq("reminders", true).limit(1000);
  if (error) return Response.json({ error: "habits" }, { status: 500 });

  const courseName = (id: string) => {
    const t = TOPICS.find((x) => x.id === id);
    return t ? (t.standard ?? t.title) : id;
  };
  let due = 0;
  let sent = 0;
  let dry = 0;
  for (const h of habits ?? []) {
    const { days, exams } = sanitizeHabits(h);
    const { data: rows } = await supabase.from("lesson_progress").select("progress").eq("user_id", h.user_id);
    const reviews = (rows ?? []).reduce((n, r) => {
      const review = (r.progress as { review?: Record<string, { box?: number; due?: number }> })?.review ?? {};
      return n + Object.values(review).filter((e) => typeof e?.box === "number" && e.box < MASTERED && typeof e.due === "number" && e.due <= today).length;
    }, 0);
    const reminder = reminderFor({ today, days, exams, remindedOn: h.reminded_on, due: reviews, courseName });
    if (!reminder) continue;
    due++;
    const { data: u } = await supabase.auth.admin.getUserById(h.user_id);
    const to = u?.user?.email;
    if (!to) continue;
    const stop = `${SITE_URL}/api/reminders/unsubscribe?u=${h.user_id}&t=${unsubscribeToken(h.user_id)}`;
    const link = `${SITE_URL}/review?utm_source=email&utm_medium=reminder`;
    const r = await sendEmail({
      to,
      subject: reminder.subject,
      text: `${reminder.lines.join("\n")}\n\nלחזרה: ${link}\n\nקיבלתם את המייל כי הפעלתם תזכורות לימוד. לביטול: ${stop}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:#16261f">${reminder.lines.map((l) => `<p>${l}</p>`).join("")}<p><a href="${link}" style="display:inline-block;background:#1d6b47;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">לחזרה</a></p><p style="font-size:12px;color:#6b7c73">קיבלתם את המייל כי הפעלתם תזכורות לימוד ב־AfikAccounting. <a href="${stop}">לביטול בלחיצה אחת</a></p></div>`,
      headers: { "List-Unsubscribe": `<${stop}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (r.dry) dry++;
    if (r.sent) {
      sent++;
      await supabase.from("study_habits").update({ reminded_on: today }).eq("user_id", h.user_id);
    }
  }
  return Response.json({ day: today, opted_in: habits?.length ?? 0, due, sent, dry });
}
