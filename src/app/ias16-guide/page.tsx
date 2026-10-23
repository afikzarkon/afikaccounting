import { ArrowLeft, ArrowLeftRight, Hammer, LineChart, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { GuideTabs } from "@/components/guide/guide-tabs";
import { DepreciationSection } from "@/components/guide/sections/depreciation";
import { ExchangeSection } from "@/components/guide/sections/exchange";
import { RenovationSection } from "@/components/guide/sections/renovation";
import { RevaluationSection } from "@/components/guide/sections/revaluation";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "מדריך IAS 16 — מנוע הלוגיקה, דוגמאות וטריקים",
  description:
    "החלפת נכסים, שיטות פחת, שיפוצים והערכה מחדש לפי IAS 16: נוסחאות, דוגמאות מספריות צעד-אחר-צעד, פקודות יומן ובדיקות נאותות.",
};

const ENGINE_HREF = "/engine?calc=ias-16-property-plant-equipment";

export default function Ias16GuidePage() {
  return (
    <div className="relative">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative pt-10 pb-6 sm:pt-14">
        <p className="text-xs font-semibold text-accent">IAS 16 · רכוש קבוע</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">מדריך מנוע הלוגיקה, דוגמאות וטריקים</h1>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            ההיגיון שמאחורי מחשבון IAS 16: נוסחאות, דוגמאות מספריות מלאות עם פקודות יומן מאוזנות, ובכל נושא — טריקים ובדיקות נאותות
            שעוזרים לוודא שהפתרון נכון. כל הדוגמאות ללא השפעות מס.
          </p>
          <div className="no-print flex flex-wrap gap-2">
            <ButtonLink href="/ias16-lab#simulator" variant="ghost">
              סימולטור פחת אינטראקטיבי
            </ButtonLink>
            <ButtonLink href={ENGINE_HREF} variant="secondary">
              לפתרון תרחיש במחשבון <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-8">
          <GuideTabs
            tabs={[
              {
                id: "exchange",
                label: "החלפת נכסים",
                blurb: "IAS 16.24–26 · היררכיית מדידה",
                icon: <ArrowLeftRight className="h-4 w-4" />,
                panel: <ExchangeSection />,
              },
              {
                id: "depreciation",
                label: "שיטות פחת",
                blurb: "IAS 16.60–62 · ארבע שיטות",
                icon: <LineChart className="h-4 w-4" />,
                panel: <DepreciationSection />,
              },
              {
                id: "renovation",
                label: "שיפוצים ושיפורים",
                blurb: "היוון ואומדן מחדש",
                icon: <Hammer className="h-4 w-4" />,
                panel: <RenovationSection />,
              },
              {
                id: "revaluation",
                label: "הערכה מחדש",
                blurb: "IAS 16.31–42 · קרן ועודפים",
                icon: <TrendingUp className="h-4 w-4" />,
                panel: <RevaluationSection />,
              },
            ]}
          />
        </div>
      </Container>
    </div>
  );
}
