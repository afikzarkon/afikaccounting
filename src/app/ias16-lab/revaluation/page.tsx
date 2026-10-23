import { ArrowRight, Building2, Calculator, ChevronLeft, ListOrdered, Search, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RevaluationCalculator } from "@/components/revaluation/calculator";
import { CheckTipsSection } from "@/components/revaluation/check-tips";
import { RevaluationExamplesSection } from "@/components/revaluation/examples";
import { LandBuildingSection } from "@/components/revaluation/land-building";
import { RevaluationStepsSection } from "@/components/revaluation/steps";
import { LabTabs } from "@/components/study/lab-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "מודל הערכה מחדש — תקן IAS 16",
  description:
    "מודל הערכה מחדש לפי תקן IAS 16: דרכים לפתור שאלה, קרן הערכה מחדש מול רווח והפסד, שיטת הביטול וההתאמה היחסית, קרקע מול מבנה, העברה לעודפים, טיפ בדיקה למבחן ומחשבון.",
};

export default function RevaluationPage() {
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
          <span aria-current="page">מודל הערכה מחדש</span>
        </nav>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          מודל <span className="text-gradient">הערכה מחדש</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            פחת עד יום ההערכה, פער לשווי ההוגן, וסיווג — קרן הערכה מחדש או רווח והפסד. ואחר כך: קרקע מול מבנה, העברה לעודפים, דוגמאות בכל שיטות
            הפחת, טיפ בדיקה שתופס כמעט כל טעות — ומחשבון.
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
                label: "דרכים לפתור שאלה",
                blurb: "פער, סיווג ופחת נצבר",
                icon: <ListOrdered className="h-4 w-4" />,
                panel: <RevaluationStepsSection />,
              },
              {
                id: "land-building",
                label: "קרקע מול מבנה",
                blurb: "והעברה לעודפים",
                icon: <Building2 className="h-4 w-4" />,
                panel: <LandBuildingSection />,
              },
              {
                id: "examples",
                label: "דוגמאות לפי שיטות",
                blurb: "קו ישר · ספרות השנים · יתרה פוחתת",
                icon: <TrendingUp className="h-4 w-4" />,
                panel: <RevaluationExamplesSection />,
              },
              {
                id: "check",
                label: "בדיקה ודגשים",
                blurb: "טיפ הזהב · מועדים · מסים נדחים",
                icon: <Search className="h-4 w-4" />,
                panel: <CheckTipsSection />,
              },
              {
                id: "calculator",
                label: "מחשבון הערכה מחדש",
                blurb: "כמה הערכות · שתי שיטות",
                icon: <Calculator className="h-4 w-4" />,
                panel: <RevaluationCalculator />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
