"use client";

import { Share2 } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/**
 * Send something to the course's group: the phone's share sheet where there is one,
 * else WhatsApp. The link carries its source, so a visit it brings is counted as a share.
 */
export function ShareButton({ path, text, campaign, kind, label, className }: { path: string; text: string; campaign: string; kind: string; label: string; className?: string }) {
  const share = async () => {
    track({ kind: "share_click", target: campaign, meta: { kind } });
    const link = `${window.location.origin}${path}?utm_source=share&utm_medium=${kind}&utm_campaign=${encodeURIComponent(campaign)}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url: link });
        return;
      } catch {
        // Cancelled, or not allowed here: WhatsApp instead.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, "_blank", "noopener");
  };
  return (
    <button type="button" onClick={share} className={cn("inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline", className)}>
      <Share2 className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}
