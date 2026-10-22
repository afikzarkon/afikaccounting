"use client";

import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/primitives";
import { deleteContent, setContentPublished } from "@/lib/actions/admin-content";
import { LEVELS, levelLabel } from "@/lib/content/types";
import type { AdminContentRow } from "@/lib/data/admin";
import { shortDate } from "@/lib/utils";
import { DataTable } from "./data-table";

const iconBtn = "grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg";

export function ContentTable({ rows }: { rows: AdminContentRow[] }) {
  const standards = [...new Set(rows.map((r) => r.standard))].sort();

  const remove = async (r: AdminContentRow) => {
    if (!confirm(`למחוק את ״${r.title}״? היסטוריית הצפייה של המשתמשים בפריט תימחק גם היא.`)) return;
    const res = await deleteContent(r.id);
    if (!res.ok) alert(res.error);
  };
  const publish = async (r: AdminContentRow) => {
    const res = await setContentPublished(r.id, !r.isPublished);
    if (!res.ok) alert(res.error);
  };

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      searchText={(r) => [r.title, r.slug, r.standard, r.category].join(" ")}
      initialSort={{ key: "updated", dir: "desc" }}
      empty="אין עדיין תוכן. צרו פריט ראשון."
      filters={[
        { key: "kind", label: "סוג", options: [{ value: "video", label: "וידאו" }, { value: "article", label: "מאמר" }], test: (r, v) => r.kind === v },
        { key: "standard", label: "תקן", options: standards.map((s) => ({ value: s, label: s })), test: (r, v) => r.standard === v },
        { key: "level", label: "רמה", options: LEVELS, test: (r, v) => r.level === v },
        { key: "status", label: "סטטוס", options: [{ value: "1", label: "פורסם" }, { value: "0", label: "טיוטה" }], test: (r, v) => r.isPublished === (v === "1") },
      ]}
      columns={[
        {
          key: "title",
          label: "כותרת",
          sort: (r) => r.title,
          render: (r) => (
            <Link href={`/admin/content/${r.id}`} className="group block">
              <span className="font-medium text-fg group-hover:text-accent">{r.title}</span>
              <span dir="ltr" className="block text-start font-mono text-[11px] text-subtle">
                /{r.slug}
              </span>
            </Link>
          ),
        },
        { key: "kind", label: "סוג", sort: (r) => r.kind, render: (r) => <Badge>{r.kind === "video" ? "וידאו" : "מאמר"}</Badge> },
        { key: "standard", label: "תקן / קטגוריה", sort: (r) => r.standard, render: (r) => <span className="text-xs text-muted">{r.standard} · {r.category}</span> },
        { key: "level", label: "רמה", sort: (r) => LEVELS.findIndex((l) => l.value === r.level), render: (r) => <span className="text-xs text-muted">{levelLabel(r.level)}</span> },
        {
          key: "status",
          label: "סטטוס",
          sort: (r) => Number(r.isPublished),
          render: (r) => <Badge tone={r.isPublished ? "success" : "warning"}>{r.isPublished ? "פורסם" : "טיוטה"}</Badge>,
        },
        { key: "updated", label: "עודכן", sort: (r) => r.updatedAt, className: "whitespace-nowrap", render: (r) => <span className="text-xs text-muted">{shortDate(r.updatedAt)}</span> },
        {
          key: "actions",
          label: "",
          className: "w-px whitespace-nowrap",
          render: (r) => (
            <div className="flex justify-end gap-0.5">
              <button type="button" onClick={() => publish(r)} aria-label={r.isPublished ? "העברה לטיוטה" : "פרסום"} title={r.isPublished ? "העברה לטיוטה" : "פרסום"} className={iconBtn}>
                {r.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {r.isPublished && (
                <a href={`/content/${r.slug}`} target="_blank" rel="noopener noreferrer" aria-label="צפייה באתר" title="צפייה באתר" className={iconBtn}>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <Link href={`/admin/content/${r.id}`} aria-label="עריכה" title="עריכה" className={iconBtn}>
                <Pencil className="h-4 w-4" />
              </Link>
              <button type="button" onClick={() => remove(r)} aria-label="מחיקה" title="מחיקה" className={`${iconBtn} hover:text-danger`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
        },
      ]}
    />
  );
}
