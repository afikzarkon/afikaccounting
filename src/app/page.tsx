import { ArrowLeft, BookOpenCheck, FileSpreadsheet, ListTree, MousePointerClick, ScrollText } from "lucide-react";
import Link from "next/link";
import { ContentCard } from "@/components/content/content-card";
import { ACCENTS, CalculatorIcon } from "@/components/engine/calculator-visuals";
import { Hero } from "@/components/home/hero";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { listContent } from "@/lib/data/content";
import { CALCULATORS } from "@/lib/engine/registry";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: ListTree, title: "בוחרים תקן", body: "IFRS 16, IAS 16, IAS 37 או מס חברות בישראל." },
  { icon: MousePointerClick, title: "מתארים את העובדות", body: "המתגים והאפשרויות מתאימים את עצמם לתרחיש שבחרתם." },
  { icon: FileSpreadsheet, title: "מזינים את המספרים", body: "שדות עם בדיקת תקינות, וסרטון ההסבר במרחק לחיצה." },
  { icon: ScrollText, title: "מקבלים פתרון מלא", body: "פקודות יומן, לוחות, באור וההנמקה שמאחוריהם." },
];

export default async function Home() {
  const latest = (await listContent()).slice(0, 6);

  return (
    <>
      <Hero />

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="מחשבונים חכמים"
          title="כלים מבוססי תקינה, בנויים כמו שמבקר היה בונה"
          description="כל מחשבון מפיק רישום כפול מאוזן, לוח מלא וטיוטת נוסח לבאור — ומפנה לסעיפים שעליהם הוא מסתמך."
          action={
            <ButtonLink href="/engine" variant="outline">
              למנוע הפתרונות <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CALCULATORS.map((c) => (
            <Link
              key={c.slug}
              href={`/engine?calc=${c.slug}`}
              className={cn(
                "group card relative flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1",
                ACCENTS[c.accent].glow,
              )}
            >
              <div className="pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <CalculatorIcon calc={c} />
              <p className={cn("mt-5 text-xs font-semibold", ACCENTS[c.accent].text)}>
                {c.standard}
              </p>
              <p className="mt-1 font-semibold text-fg">{c.title}</p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{c.tagline}</p>
              <div className="mt-5 flex items-center justify-between">
                <Badge>{c.category}</Badge>
                <ArrowLeft className="h-4 w-4 text-subtle transition-all group-hover:-translate-x-0.5 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <section className="border-y border-line bg-surface/50">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold text-accent">איך המנוע עובד</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">ארבעה צעדים מהעובדות ועד לבאור</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                נתקעתם בשיקול דעת? כל שלב מקושר לדקה המדויקת בשיעור שמסבירה אותו.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card flex gap-4 p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      <span className="me-1.5 font-mono text-xs text-subtle">0{i + 1}</span>
                      {s.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="תוכן חדש"
          title="טרי ממרכז התוכן"
          description="כיתות אמן בווידאו ומאמרים מעשיים על התקנים שאתם מיישמים בכל יום."
          action={
            <ButtonLink href="/content" variant="outline">
              <BookOpenCheck className="h-4 w-4" /> לכל התכנים
            </ButtonLink>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </Container>
    </>
  );
}
