import { ArrowLeft, BookMarked, Calculator, GraduationCap, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "אודות", description: site.description };

const PILLARS = [
  {
    icon: Calculator,
    title: "תקינה כקוד",
    body: "כל מחשבון מקודד את כללי המדידה של התקן. כל פקודת יומן נבדקת לאיזון עוד לפני שתראו אותה.",
  },
  {
    icon: BookMarked,
    title: "הנמקה, לא רק תוצאות",
    body: "התוצאות מפנות לסעיפים שעליהם הן נשענות ומסבירות את שיקולי הדעת, כך שתוכלו להגן על המספר בביקורת.",
  },
  {
    icon: GraduationCap,
    title: "למידה בהקשר",
    body: "השיעורים מחולקים לפרקים שממופים לשדות האשף. נתקעתם במתג? צפו בדקה שמסבירה אותו.",
  },
  {
    icon: ShieldCheck,
    title: "המידע שלכם נשאר שלכם",
    body: "התרחישים השמורים וההיסטוריה מוגנים באבטחה ברמת השורה: רק אתם יכולים לקרוא או לשנות אותם.",
  },
];

export default function AboutPage() {
  return (
    <Container className="pt-12 sm:pt-16">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold text-accent">אודות {site.name}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          נבנה לרואי חשבון שצריכים את ה<span className="text-gradient">למה</span> לא פחות מהמספר.
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          {site.name} משלבת מנוע פתרונות מבוסס תקינה עם ספריית שיעורים של מומחים. היא מיועדת לצוותי דיווח כספי,
          למבקרים, לסטודנטים המתכוננים לבחינות המקצועיות ולכל מי שצריך להפוך חוזה לרישומים ולבאורים התואמים את
          התקינה.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
              <p.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-fg">{p.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-14 flex flex-col items-start gap-5 rounded-3xl p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-fg">נסו על תרחיש אמיתי</p>
          <p className="mt-1 text-sm text-muted">אין צורך בחשבון כדי להפעיל את המנוע. הרשמה מאפשרת לשמור את העבודה.</p>
        </div>
        <ButtonLink href="/engine" size="lg">
          הפעלת המנוע החשבונאי <ArrowLeft className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Container>
  );
}
