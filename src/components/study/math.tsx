import "katex/dist/katex.min.css";
import type { ReactNode } from "react";
import { renderTex as render } from "@/lib/tex";

// Server components: the lab ships the rendered HTML and CSS only, no math runtime.

/** Inline formula. Math always reads left to right, even inside Hebrew prose. */
export function Tex({ children }: { children: string }) {
  return <span dir="ltr" className="inline-block align-middle" dangerouslySetInnerHTML={{ __html: render(children, false) }} />;
}

/** Display formula on its own card, with an optional caption and symbol legend. */
export function Formula({ tex, caption, legend }: { tex: string; caption?: ReactNode; legend?: [string, ReactNode][] }) {
  return (
    <figure className="my-4 rounded-xl border border-line bg-surface-2/60 px-4 py-3">
      {caption && <figcaption className="mb-1 text-xs font-semibold text-muted">{caption}</figcaption>}
      <div dir="ltr" className="overflow-x-auto py-1 text-fg" dangerouslySetInnerHTML={{ __html: render(tex, true) }} />
      {legend && (
        <dl className="mt-2 grid gap-x-6 gap-y-1 border-t border-line pt-2 text-xs text-muted sm:grid-cols-2">
          {legend.map(([sym, meaning]) => (
            <div key={sym} className="flex items-baseline gap-2">
              <dt className="shrink-0 text-fg">
                <Tex>{sym}</Tex>
              </dt>
              <dd>{meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}
