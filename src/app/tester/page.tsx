import type { Metadata } from "next";
import { Suspense } from "react";
import { FeedbackForm } from "@/components/tester/feedback-form";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { getCurrentUser, isAdmin, isTester } from "@/lib/auth/dal";

// For the people testing a course (docs/user-testing/): not a page for search engines or the site's menus.
export const metadata: Metadata = {
  title: "דף משוב לניסיין",
  robots: { index: false, follow: false },
};

export default function TesterPage() {
  return (
    <Container className="max-w-4xl pt-10 pb-16 sm:pt-14">
      <p className="text-xs font-semibold text-accent">בדיקת קורס</p>
      <h1 className="mt-2 text-[2rem] leading-tight font-bold text-fg sm:text-[2.5rem]">דף משוב לניסיין</h1>
      <Suspense fallback={<div className="card mt-8 h-96 animate-pulse" />}>
        <TesterGate />
      </Suspense>
    </Container>
  );
}

/** The form for an account an admin marked as a tester, and for admins (to preview it); a note for anyone else. */
async function TesterGate() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Note title="הדף הזה מיועד לניסיינים של הקורס">
        <p>אם קיבלתם הזמנה לבדוק את הקורס, התחברו עם החשבון שאיתו נרשמתם.</p>
        <ButtonLink href="/login?next=/tester" className="mt-4">
          התחברות
        </ButtonLink>
      </Note>
    );
  }
  const [tester, admin] = await Promise.all([isTester(), isAdmin()]);
  if (!tester && !admin) {
    return (
      <Note title="החשבון הזה לא מוגדר כניסיין">
        <p>
          הדף מיועד לניסיינים של הקורס. אם קיבלתם הזמנה, בקשו מאיש הקשר להוסיף את האימייל שאיתו נרשמתם (
          <span dir="ltr">{user.email}</span>) לרשימת הניסיינים.
        </p>
      </Note>
    );
  }
  return (
    <>
      <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
        את הפתיחה ממלאים פעם אחת, בכל מודול מוסיפים דף משלו, ואת הסיכום ממלאים אחרי בחינת הסיום. בכל דף באתר יש לכם כפתור כתום &quot;משוב&quot;:
        נתקעתם? לוחצים עליו ורושמים שורה, בלי לעזוב את השיעור. כל מה שתכתבו נשמר בחשבון שלכם ומגיע אלינו.
      </p>
      <div className="mt-8">
        <FeedbackForm />
      </div>
    </>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mt-8 p-6 text-[15px] leading-relaxed text-muted">
      <p className="mb-2 text-lg font-semibold text-fg">{title}</p>
      {children}
    </div>
  );
}
