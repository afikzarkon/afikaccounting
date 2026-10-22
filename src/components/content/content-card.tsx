import { Clock, FileText, Play } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { type ContentItem, levelLabel } from "@/lib/content/types";
import { duration } from "@/lib/engine/format";
import { cn } from "@/lib/utils";

/** Deterministic gradient per standard so the grid reads as a system. */
const THUMBS: Record<string, string> = {
  "IFRS 16": "from-sky-500/80 via-blue-600/70 to-indigo-900",
  "IAS 16": "from-amber-400/80 via-orange-600/70 to-rose-900",
  "IAS 37": "from-violet-500/80 via-fuchsia-600/70 to-slate-900",
  "IAS 12": "from-emerald-400/80 via-teal-600/70 to-slate-900",
};
const FALLBACK_THUMB = "from-slate-500/80 via-slate-700/70 to-slate-950";

const LEVEL_TONE = { beginner: "success", intermediate: "accent", advanced: "warning" } as const;

export function readingMinutes(item: Pick<ContentItem, "durationSeconds">) {
  return Math.max(1, Math.round(item.durationSeconds / 60));
}

export function ContentCard({ item, className }: { item: ContentItem; className?: string }) {
  const video = item.kind === "video";
  return (
    <Link
      href={`/content/${item.slug}`}
      className={cn(
        "group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent/40",
        className,
      )}
    >
      <div className={cn("relative aspect-[16/9] overflow-hidden bg-gradient-to-br", THUMBS[item.standard] ?? FALLBACK_THUMB)}>
        <div className="bg-grid absolute inset-0 opacity-60 [--grid:rgb(255_255_255_/_0.08)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(255_255_255_/_0.25),transparent_45%)]" />
        <span className="absolute top-3 start-3 rounded-md bg-black/30 px-2 py-0.5 font-mono text-[11px] font-medium text-white backdrop-blur">
          {item.standard}
        </span>
        <span className="absolute end-3 bottom-3 flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {video ? <Clock className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {video ? duration(item.durationSeconds) : `${readingMinutes(item)} דק׳ קריאה`}
        </span>
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/40 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
            {video ? <Play className="h-5 w-5 translate-x-px fill-current" /> : <FileText className="h-5 w-5" />}
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={LEVEL_TONE[item.level]}>{levelLabel(item.level)}</Badge>
          <Badge>{item.category}</Badge>
        </div>
        <p className="mt-3 leading-snug font-semibold text-fg transition-colors group-hover:text-accent">{item.title}</p>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{item.summary}</p>
      </div>
    </Link>
  );
}
