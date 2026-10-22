"use server";

import { refresh, updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import type { ArticleSection, Chapter, ContentKind, Level, Resource } from "@/lib/content/types";
import { createClient } from "@/lib/supabase/server";
import type { AdminResult } from "./admin-media";

export type ContentInput = {
  slug: string;
  kind: ContentKind;
  title: string;
  summary: string;
  standard: string;
  category: string;
  level: Level;
  durationSeconds: number;
  videoUrl: string;
  body: ArticleSection[];
  chapters: Chapter[];
  resources: Resource[];
  tags: string[];
  isPublished: boolean;
};

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESOURCE_KINDS: Resource["kind"][] = ["csv", "txt", "pdf", "xlsx", "link"];
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/** The database row for untrusted editor input, or a message saying what is wrong. */
function toRow(input: ContentInput): { row: Record<string, unknown> } | { error: string } {
  const slug = str(input.slug, 120);
  if (!SLUG.test(slug)) return { error: "כתובת (slug): אותיות לטיניות קטנות, ספרות ומקפים בלבד." };
  const title = str(input.title, 200);
  if (!title) return { error: "חסרה כותרת." };
  if (!["video", "article"].includes(input.kind)) return { error: "סוג תוכן לא מוכר." };
  if (!["beginner", "intermediate", "advanced"].includes(input.level)) return { error: "רמה לא מוכרת." };
  const standard = str(input.standard, 40);
  const category = str(input.category, 80);
  if (!standard || !category) return { error: "יש למלא תקן וקטגוריה." };

  const body = (Array.isArray(input.body) ? input.body : [])
    .map((s) => ({ heading: str(s?.heading, 200), paragraphs: (Array.isArray(s?.paragraphs) ? s.paragraphs : []).map((p) => str(p, 8000)).filter(Boolean) }))
    .filter((s) => s.heading || s.paragraphs.length)
    .slice(0, 60);
  const chapters = (Array.isArray(input.chapters) ? input.chapters : [])
    .map((c) => ({ at: Math.max(0, Math.round(Number(c?.at) || 0)), title: str(c?.title, 200) }))
    .filter((c) => c.title)
    .sort((a, b) => a.at - b.at)
    .slice(0, 100);
  const resources = (Array.isArray(input.resources) ? input.resources : [])
    .map((r) => ({ title: str(r?.title, 200), kind: RESOURCE_KINDS.includes(r?.kind) ? r.kind : "link", url: str(r?.url, 1000), ...(r?.size ? { size: str(r.size, 20) } : {}) }))
    .filter((r) => r.title && /^(https?:\/\/|\/)/.test(r.url))
    .slice(0, 30);
  const videoUrl = str(input.videoUrl, 1000);
  if (videoUrl && !/^https?:\/\//.test(videoUrl)) return { error: "קישור הווידאו חייב להתחיל ב-http(s)://" };

  return {
    row: {
      slug,
      kind: input.kind,
      title,
      summary: str(input.summary, 1000),
      standard,
      category,
      level: input.level,
      duration_seconds: Math.max(0, Math.round(Number(input.durationSeconds) || 0)),
      video_url: videoUrl || null,
      body,
      chapters,
      resources,
      tags: [...new Set((input.tags ?? []).map((t) => str(t, 40)).filter(Boolean))].slice(0, 20),
      is_published: Boolean(input.isPublished),
    },
  };
}

/** Create (no id) or update a content item; the public pages refresh at once. */
export async function saveContent(input: ContentInput, id?: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const parsed = toRow(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const supabase = await createClient();
  const res = id
    ? await supabase.from("content").update(parsed.row).eq("id", id).select("id, slug").single()
    : await supabase.from("content").insert(parsed.row).select("id, slug").single();
  if (res.error) return { ok: false, error: res.error.code === "23505" ? "כבר קיים תוכן עם הכתובת הזו." : res.error.message };
  updateTag("content");
  return { ok: true, id: res.data.id };
}

export async function setContentPublished(id: string, published: boolean): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("content").update({ is_published: published }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("content");
  refresh();
  return { ok: true, id };
}

export async function deleteContent(id: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  updateTag("content");
  refresh();
  return { ok: true };
}
