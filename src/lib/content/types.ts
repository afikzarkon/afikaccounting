export type Level = "beginner" | "intermediate" | "advanced";
export type ContentKind = "video" | "article";

export type Chapter = { at: number; title: string };
export type Resource = { title: string; kind: "csv" | "txt" | "pdf" | "xlsx" | "link"; url: string; size?: string };
export type ArticleSection = { heading: string; paragraphs: string[] };

export type ContentItem = {
  id: string;
  slug: string;
  kind: ContentKind;
  title: string;
  summary: string;
  standard: string;
  category: string;
  level: Level;
  durationSeconds: number;
  videoUrl: string | null;
  body: ArticleSection[];
  chapters: Chapter[];
  resources: Resource[];
  tags: string[];
  publishedAt: string;
};

export type ContentFilters = {
  q?: string;
  standard?: string;
  category?: string;
  level?: string;
  kind?: string;
};

export const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "מתחילים" },
  { value: "intermediate", label: "ביניים" },
  { value: "advanced", label: "מתקדמים" },
];

export const levelLabel = (level: string) => LEVELS.find((l) => l.value === level)?.label ?? level;
