"use server";

import { refresh } from "next/cache";
import { assertAdmin } from "@/lib/auth/dal";
import type { MediaKind } from "@/lib/data/admin";
import { parseEmbed } from "@/lib/media/embed";
import { createClient } from "@/lib/supabase/server";

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string };

const DENIED: AdminResult = { ok: false, error: "אין הרשאת מנהל." };
const KINDS: MediaKind[] = ["excel", "pdf", "video", "image", "other"];

type Labels = { title: string; description?: string; category?: string; module?: string; tags?: string[] };

function labels(input: Labels) {
  const title = String(input.title ?? "").trim().slice(0, 200);
  return {
    title,
    description: String(input.description ?? "").trim().slice(0, 2000),
    category: String(input.category ?? "").trim().slice(0, 80),
    module: String(input.module ?? "").trim().slice(0, 80),
    tags: [...new Set((input.tags ?? []).map((t) => String(t).trim().slice(0, 40)).filter(Boolean))].slice(0, 20),
  };
}

/**
 * Record a file the browser has just uploaded to the "media" bucket. The bucket
 * policy already limited the upload to admins; this checks the path is really
 * in the bucket and stores its public URL.
 */
export async function registerUpload(input: Labels & { kind: MediaKind; path: string; mimeType: string; sizeBytes: number }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const meta = labels(input);
  if (!meta.title) return { ok: false, error: "חסרה כותרת." };
  if (!KINDS.includes(input.kind)) return { ok: false, error: "סוג קובץ לא מוכר." };
  if (!/^[a-z]+\/[\w.-]+$/.test(input.path)) return { ok: false, error: "נתיב קובץ לא תקין." };

  const supabase = await createClient();
  const { data: url } = supabase.storage.from("media").getPublicUrl(input.path);
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      ...meta,
      kind: input.kind,
      source: "upload",
      url: url.publicUrl,
      storage_path: input.path,
      mime_type: String(input.mimeType ?? "").slice(0, 120) || null,
      size_bytes: Math.max(0, Math.round(Number(input.sizeBytes) || 0)),
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id };
}

/** Add a YouTube or Vimeo video to the library by its link. */
export async function addEmbed(input: Labels & { url: string }): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const embed = parseEmbed(input.url);
  if (!embed) return { ok: false, error: "הקישור אינו סרטון YouTube או Vimeo מוכר." };
  const meta = labels(input);
  if (!meta.title) return { ok: false, error: "חסרה כותרת." };

  const url = embed.source === "youtube" ? `https://www.youtube.com/watch?v=${embed.id}` : `https://vimeo.com/${embed.id}`;
  const supabase = await createClient();
  const { data, error } = await supabase.from("media_assets").insert({ ...meta, kind: "video", source: embed.source, url }).select("id").single();
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id: data.id };
}

export async function updateMedia(id: string, input: Labels): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const meta = labels(input);
  if (!meta.title) return { ok: false, error: "חסרה כותרת." };
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").update(meta).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, id };
}

/** Delete the library entry and, for an upload, the stored file with it. */
export async function deleteMedia(id: string): Promise<AdminResult> {
  if (!(await assertAdmin())) return DENIED;
  const supabase = await createClient();
  const { data: row, error: readError } = await supabase.from("media_assets").select("storage_path").eq("id", id).maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!row) return { ok: false, error: "הפריט לא נמצא." };
  if (row.storage_path) {
    const { error } = await supabase.storage.from("media").remove([row.storage_path]);
    if (error) return { ok: false, error: `מחיקת הקובץ נכשלה: ${error.message}` };
  }
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
