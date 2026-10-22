import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";
import { SEED_CONTENT } from "@/lib/content/seed";
import type { ContentFilters, ContentItem } from "@/lib/content/types";
import { createPublicClient } from "@/lib/supabase/public";

const COLUMNS =
  "id, slug, kind, title, summary, standard, category, level, duration_seconds, video_url, body, chapters, resources, tags, published_at";

type ContentRow = {
  id: string;
  slug: string;
  kind: ContentItem["kind"];
  title: string;
  summary: string;
  standard: string;
  category: string;
  level: ContentItem["level"];
  duration_seconds: number;
  video_url: string | null;
  body: ContentItem["body"];
  chapters: ContentItem["chapters"];
  resources: ContentItem["resources"];
  tags: string[];
  published_at: string;
};

const fromRow = (r: ContentRow): ContentItem => ({
  id: r.id,
  slug: r.slug,
  kind: r.kind,
  title: r.title,
  summary: r.summary,
  standard: r.standard,
  category: r.category,
  level: r.level,
  durationSeconds: r.duration_seconds,
  videoUrl: r.video_url,
  body: r.body ?? [],
  chapters: r.chapters ?? [],
  resources: r.resources ?? [],
  tags: r.tags ?? [],
  publishedAt: r.published_at,
});

const newestFirst = (a: ContentItem, b: ContentItem) => b.publishedAt.localeCompare(a.publishedAt);

function matches(item: ContentItem, f: ContentFilters) {
  const q = f.q?.trim().toLowerCase();
  return (
    (!f.standard || item.standard === f.standard) &&
    (!f.category || item.category === f.category) &&
    (!f.level || item.level === f.level) &&
    (!f.kind || item.kind === f.kind) &&
    (!q || [item.title, item.summary, item.standard, ...item.tags].some((s) => s.toLowerCase().includes(q)))
  );
}

/** Escape characters with special meaning in PostgREST filter strings and LIKE patterns. */
const likeTerm = (q: string) => q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()"]/g, " ");

export async function listContent(filters: ContentFilters = {}): Promise<ContentItem[]> {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  if (!isSupabaseConfigured) return SEED_CONTENT.filter((i) => matches(i, filters)).sort(newestFirst);

  let query = createPublicClient().from("content").select(COLUMNS).eq("is_published", true);
  if (filters.standard) query = query.eq("standard", filters.standard);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.level) query = query.eq("level", filters.level);
  if (filters.kind) query = query.eq("kind", filters.kind);
  const q = filters.q?.trim();
  if (q) {
    const term = likeTerm(q);
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%,standard.ilike.%${term}%`);
  }
  const { data, error } = await query.order("published_at", { ascending: false }).limit(200);
  if (error) throw new Error(`Could not load content: ${error.message}`);
  return (data as ContentRow[]).map(fromRow);
}

export async function getContent(slug: string): Promise<ContentItem | null> {
  "use cache";
  cacheTag("content", `content:${slug}`);
  cacheLife("hours");

  if (!isSupabaseConfigured) return SEED_CONTENT.find((i) => i.slug === slug) ?? null;

  const { data, error } = await createPublicClient()
    .from("content")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load content: ${error.message}`);
  return data ? fromRow(data as ContentRow) : null;
}

export async function getFacets() {
  const all = await listContent();
  const unique = (xs: string[]) => [...new Set(xs)].sort();
  return {
    standards: unique(all.map((i) => i.standard)),
    categories: unique(all.map((i) => i.category)),
  };
}
