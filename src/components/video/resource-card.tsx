import { Download, ExternalLink, FileSpreadsheet, FileText, Link2 } from "lucide-react";
import type { Resource } from "@/lib/content/types";

const KIND = {
  csv: { icon: FileSpreadsheet, label: "CSV", tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  xlsx: { icon: FileSpreadsheet, label: "Excel", tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  pdf: { icon: FileText, label: "PDF", tone: "text-rose-600 dark:text-rose-400 bg-rose-500/10" },
  txt: { icon: FileText, label: "טקסט", tone: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
  link: { icon: Link2, label: "קישור", tone: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
} as const;

export function ResourceCard({ resource }: { resource: Resource }) {
  const kind = KIND[resource.kind] ?? KIND.link;
  const Icon = kind.icon;
  const external = resource.kind === "link";
  return (
    <a
      href={resource.url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : { download: "" })}
      className="group card flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${kind.tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{resource.title}</span>
        <span className="text-xs text-muted">
          {kind.label}
          {resource.size && ` · ${resource.size}`}
        </span>
      </span>
      {external ? (
        <ExternalLink className="h-4 w-4 text-subtle transition-colors group-hover:text-accent" />
      ) : (
        <Download className="h-4 w-4 text-subtle transition-colors group-hover:text-accent" />
      )}
    </a>
  );
}
