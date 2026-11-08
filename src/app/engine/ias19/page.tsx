import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Ias19Calculator } from "@/components/engine/ias19-calculator";
import { Paywall } from "@/components/pricing/paywall";
import { Container, Skeleton } from "@/components/ui/primitives";
import { canAccess } from "@/lib/auth/access";
import { studyHref } from "@/lib/study/href";

export const metadata: Metadata = {
  title: "מחשבון הטבות עובד (IAS 19)",
  description: "עונים על השאלון ומקבלים פתרון מלא לכל סוג של הטבת עובד: לזמן קצר, לאחר סיום העסקה, לזמן ארוך ופיטורין. טבלאות תנועה, ביאורים, דוחות ופקודות יומן.",
};

/** The frame is the same for everyone; reading the session waits behind a boundary. */
export default function Ias19CalculatorPage() {
  return (
    <Container className="pt-10 pb-16 sm:pt-14">
      <Link href="/engine" className="text-xs font-semibold text-accent hover:underline">
        מנוע הפתרונות החשבונאי
      </Link>
      <h1 className="mt-2 text-[2.2rem] leading-tight font-bold tracking-tight text-fg sm:text-5xl">מחשבון הטבות עובד</h1>
      <p className="mt-2 mb-8 max-w-2xl text-[15px] leading-relaxed text-muted">עונים על כמה שאלות על ההטבה, ומקבלים את הפתרון המלא: טבלת תנועה, חישוב לכל שורה, דוחות ופקודת יומן.</p>
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-3xl rounded-2xl" />}>
        <Gate />
      </Suspense>
    </Container>
  );
}

/** Open with the plan that opens the IAS 19 course. Without it the calculator is never rendered, and the paywall takes its place. */
async function Gate() {
  if (await canAccess("ias19")) return <Ias19Calculator />;
  return (
    <div className="max-w-4xl">
      <Paywall
        title="מחשבון הטבות עובד"
        course="הטבות עובד (IAS 19)"
        where="/engine/ias19"
        lead="המחשבון פותר כל הטבת עובד שהקורס מלמד, עם הפתרון המלא."
        taste={{ href: studyHref("ias19-map"), label: "לשיעור 1 של הקורס — בחינם" }}
      />
    </div>
  );
}
