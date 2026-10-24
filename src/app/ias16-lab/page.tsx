import { ArrowLeft, ArrowLeftRight, Calculator, Hammer, GraduationCap, ListOrdered, Plane, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { ExamTipsSection } from "@/components/learn/exam-tips";
import { FundamentalsSection } from "@/components/learn/fundamentals";
import { MethodologySection } from "@/components/learn/methodology";
import { DepreciationSimulator } from "@/components/learn/simulator";
import { LabTabs } from "@/components/study/lab-tabs";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "תקן IAS 16 רכוש קבוע מהקל לקשה",
  description:
    "מההתחלה ועד לפיתרון שאלות מבחן, דרכי פעולה לפתור כל שאלה, מושגים בגובה העיניים, סימולטור לשיטות הפחת עם לוח נוסחאות צמוד וצ׳ק-ליסט שמוודא שלא פספסתם כלום.",
};

export default function Ias16LabPage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-12 sm:pt-14">
        <p className="text-xs font-semibold text-accent">לימוד תקנים · רכוש קבוע</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          תקן IAS 16 רכוש קבוע <span className="text-gradient">מהקל לקשה</span>
        </h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            מההתחלה ועד לפיתרון שאלות מבחן, דרכי פעולה לפתור כל שאלה, מושגים בגובה העיניים, סימולטור לשיטות הפחת עם לוח נוסחאות צמוד
            וצ׳ק-ליסט שמוודא שלא פספסתם כלום.
          </p>
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink href="/ias16-lab/exchange" variant="ghost">
              <ArrowLeftRight className="h-4 w-4" /> החלפת נכסים
            </ButtonLink>
            <ButtonLink href="/ias16-lab/renovation" variant="ghost">
              <Hammer className="h-4 w-4" /> שיפוצים ואירועים עוקבים
            </ButtonLink>
            <ButtonLink href="/ias16-lab/revaluation" variant="ghost">
              <TrendingUp className="h-4 w-4" /> מודל הערכה מחדש
            </ButtonLink>
            <ButtonLink href="/engine?calc=ias-16-property-plant-equipment" variant="secondary">
              פתרון תרחיש במחשבון <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <LabTabs
            tabs={[
              {
                id: "basics",
                label: "יסודות ועקרונות",
                blurb: "מושגים, ורכיבי מטוס",
                icon: <Plane className="h-4 w-4" />,
                panel: <FundamentalsSection />,
              },
              {
                id: "method",
                label: "דרכים לפתור שאלה",
                blurb: "תשעה שלבים, על שאלה אחת מלאה",
                icon: <ListOrdered className="h-4 w-4" />,
                panel: <MethodologySection />,
              },
              {
                id: "simulator",
                label: "סימולטור פחת",
                blurb: "4 שיטות · לוח נוסחאות צמוד",
                icon: <Calculator className="h-4 w-4" />,
                panel: <DepreciationSimulator />,
              },
              {
                id: "exam",
                label: "טיפים למבחן",
                blurb: "טעויות נפוצות · צ׳ק-ליסט",
                icon: <GraduationCap className="h-4 w-4" />,
                panel: <ExamTipsSection />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
