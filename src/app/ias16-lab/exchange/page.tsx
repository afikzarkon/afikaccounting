import { ArrowLeftRight, ArrowRight, BookText, CalendarClock, Calculator, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ExchangeCalculator } from "@/components/exchange/calculator";
import { ExchangeJournalSection } from "@/components/exchange/journal";
import { NewAssetSection } from "@/components/exchange/new-asset";
import { ExchangeStepsSection } from "@/components/exchange/steps";
import { LabTabs } from "@/components/study/lab-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "החלפת נכסים — תקן IAS 16",
  description:
    "החלפת רכוש קבוע לפי תקן IAS 16: שלושה שלבים קבועים לפתרון, מהות מסחרית, עלות הנכס החדש, רווח או הפסד מהחלפה, פקודות יומן מלאות ומקוצרות, ופחת הנכס החדש עד סוף השנה.",
};

export default function ExchangePage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-12 sm:pt-14">
        <nav aria-label="מיקום בעמוד" className="flex flex-wrap items-center gap-1 text-xs font-semibold text-accent">
          <span>לימוד תקנים</span>
          <ChevronLeft className="h-3.5 w-3.5 text-subtle" />
          <Link href="/ias16-lab" className="hover:underline">
            IAS 16
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 text-subtle" />
          <span aria-current="page">החלפת נכסים</span>
        </nav>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          החלפת נכסים <span className="text-gradient">צעד אחר צעד</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            שלושה שלבים קבועים לכל שאלת החלפה: תאריך ההחלפה, עדכון הפחת עד אליו, וסיווג העסקה — יש או אין מהות מסחרית. ואחר כך: פקודות
            היומן, פחת הנכס החדש עד סוף השנה, ומחשבון שפותר כל תרחיש.
          </p>
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink href="/ias16-lab" variant="secondary">
              <ArrowRight className="h-4 w-4" /> לעמוד הראשי של IAS 16
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <LabTabs
            tabs={[
              {
                id: "steps",
                label: "שלבי הפתרון",
                blurb: "שלושה שלבים קבועים",
                icon: <ArrowLeftRight className="h-4 w-4" />,
                panel: <ExchangeStepsSection />,
              },
              {
                id: "entries",
                label: "פקודות יומן",
                blurb: "מלאה ומקוצרת",
                icon: <BookText className="h-4 w-4" />,
                panel: <ExchangeJournalSection />,
              },
              {
                id: "new-asset",
                label: "המשך השנה",
                blurb: "פחת הנכס החדש עד 31.12",
                icon: <CalendarClock className="h-4 w-4" />,
                panel: <NewAssetSection />,
              },
              {
                id: "calculator",
                label: "מחשבון החלפה",
                blurb: "כל תרחיש · לוח נוסחאות צמוד",
                icon: <Calculator className="h-4 w-4" />,
                panel: <ExchangeCalculator />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
