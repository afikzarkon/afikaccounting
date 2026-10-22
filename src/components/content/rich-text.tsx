import "katex/dist/katex.min.css";
import { Fragment, type ReactNode } from "react";
import { renderTex } from "@/lib/tex";

/**
 * The light markup editors write in an article paragraph:
 *   **bold**   *italic*   [text](https://…)   $inline formula$
 * A paragraph that is only $$formula$$ is a display formula; one whose every
 * line starts with "- " is a bullet list. Everything else is plain text, so
 * existing articles render exactly as before.
 */
const INLINE = /(\$[^$\n]+\$|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    if (part.startsWith("$")) return <span key={i} dir="ltr" className="inline-block" dangerouslySetInnerHTML={{ __html: renderTex(part.slice(1, -1)) }} />;
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
    const external = m[2].startsWith("http");
    return (
      <a key={i} href={m[2]} className="text-accent underline-offset-2 hover:underline" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {m[1]}
      </a>
    );
  });
}

export function RichParagraph({ text, className }: { text: string; className?: string }) {
  const t = text.trim();
  const display = t.match(/^\$\$([\s\S]+)\$\$$/);
  if (display) {
    return <div dir="ltr" className="my-4 overflow-x-auto rounded-xl bg-surface-2/60 px-4 py-3" dangerouslySetInnerHTML={{ __html: renderTex(display[1].trim(), true) }} />;
  }
  const lines = t.split("\n");
  if (lines.every((l) => l.trim().startsWith("- "))) {
    return (
      <ul className={`list-disc space-y-1 ps-5 ${className ?? ""}`}>
        {lines.map((l, i) => (
          <li key={i}>{inline(l.trim().slice(2))}</li>
        ))}
      </ul>
    );
  }
  return <p className={className}>{inline(t)}</p>;
}
