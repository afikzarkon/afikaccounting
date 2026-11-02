import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/primitives";
import { LEGAL_DETAILS_FINAL, LEGAL_LINKS } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** A legal page: title, last update, a list of the sections that jumps to each, and the sections. */
export function LegalPage({ title, intro, updated, sections }: { title: string; intro: ReactNode; updated: string; sections: LegalSection[] }) {
  return (
    <Container className="max-w-3xl pt-12 pb-20 sm:pt-16">
      <p className="text-xs font-semibold text-accent">מסמכים משפטיים</p>
      <h1 className="mt-3 text-[2.2rem] leading-tight font-bold tracking-tight text-fg sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-subtle">עודכן לאחרונה: {updated}</p>
      {!LEGAL_DETAILS_FINAL && (
        <p role="note" className="mt-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm leading-relaxed text-fg">
          פרטי בעל האתר ופרטי הקשר בעמוד זה בהשלמה.
        </p>
      )}
      <div className="mt-6 space-y-3 text-[15.5px] leading-relaxed text-muted">{intro}</div>

      <nav aria-label="תוכן העניינים" className="card mt-8 p-5">
        <p className="text-sm font-semibold text-fg">תוכן העניינים</p>
        <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-muted hover:text-accent hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
            <h2 id={`${s.id}-title`} className="text-xl font-bold tracking-tight text-fg">
              {i + 1}. {s.title}
            </h2>
            <div className="legal-body mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{s.body}</div>
          </section>
        ))}
      </div>

      <nav aria-label="מסמכים משפטיים נוספים" className="mt-14 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-6 text-sm">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="font-medium text-accent hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </Container>
  );
}

/** A bulleted list inside a section. */
export function Items({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 ps-5 marker:text-subtle">{children}</ul>;
}
