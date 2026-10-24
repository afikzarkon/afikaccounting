import { ArrowRight, Calculator, GraduationCap, Hammer, Layers, ListOrdered } from "lucide-react";
import type { Metadata } from "next";
import { RenovationCalculator } from "@/components/renovation/calculator";
import { DistinctionSection } from "@/components/renovation/distinction";
import { RenovationExamplesSection } from "@/components/renovation/examples";
import { RenovationStepsSection } from "@/components/renovation/steps";
import { RenovationTipsSection } from "@/components/renovation/tips";
import { LabTabs } from "@/components/study/lab-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata: Metadata = {
  title: "שיפוצים ואירועים עוקבים — תקן IAS 16",
  description:
    "שיפוצים בנכסי רכוש קבוע לפי תקן IAS 16: מה נכנס לנכס ומה הוצאה, חמישה שלבים קבועים לפתרון, דוגמאות מלאות בקו ישר, סכום ספרות השנים ויתרה פוחתת, ומחשבון שיפוץ.",
};

export default function RenovationPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-12 sm:pt-14">
        <Breadcrumbs trail={[{ label: "IAS 16 · רכוש קבוע", href: "/ias16-lab" }, { label: "שיפוצים ואירועים עוקבים" }]} />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          שיפוצים ואירועים עוקבים <span className="text-gradient">בנכסים</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            מתי שיפוץ נכנס לנכס ומתי הוא הוצאה, חמישה שלבים קבועים לפתרון, דוגמאות מלאות בכל שיטות הפחת — ומחשבון שמראה את הפחת לפני השיפוץ
            ואחריו, שנה אחרי שנה.
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
                id: "distinction",
                label: "נכנס לנכס או הוצאה",
                blurb: "שיפוץ מהותי מול תחזוקה",
                icon: <Layers className="h-4 w-4" />,
                panel: <DistinctionSection />,
              },
              {
                id: "steps",
                label: "שלבי הפתרון",
                blurb: "חמישה שלבים קבועים",
                icon: <ListOrdered className="h-4 w-4" />,
                panel: <RenovationStepsSection />,
              },
              {
                id: "examples",
                label: "דוגמאות לפי שיטות",
                blurb: "קו ישר · ספרות השנים · יתרה פוחתת",
                icon: <Hammer className="h-4 w-4" />,
                panel: <RenovationExamplesSection />,
              },
              {
                id: "calculator",
                label: "מחשבון שיפוץ",
                blurb: "כל תרחיש · לוח נוסחאות צמוד",
                icon: <Calculator className="h-4 w-4" />,
                panel: <RenovationCalculator />,
              },
              {
                id: "tips",
                label: "דגשים למבחן",
                blurb: "הטעויות הנפוצות",
                icon: <GraduationCap className="h-4 w-4" />,
                panel: <RenovationTipsSection />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
