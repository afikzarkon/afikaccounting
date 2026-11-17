import type { Metadata } from "next";
import { Suspense } from "react";
import { MyRatings } from "@/components/tester/my-ratings";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { getCurrentUser, isAdmin, isTester } from "@/lib/auth/dal";
import { topicByHref } from "@/lib/catalog";
import { STUDY_MODULES } from "@/lib/study";
import { studyHref } from "@/lib/study/href";
import { createClient } from "@/lib/supabase/server";

// For the people testing a course (docs/user-testing/): not a page for search engines or the site's menus.
export const metadata: Metadata = {
  title: "הדירוגים שלי",
  robots: { index: false, follow: false },
};

export default function TesterPage() {
  return (
    <Container className="max-w-4xl pt-10 pb-16 sm:pt-14">
      <p className="text-xs font-semibold text-accent">בדיקת קורס</p>
      <h1 className="mt-2 text-[2rem] leading-tight font-bold text-fg sm:text-[2.5rem]">הדירוגים שלי</h1>
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
  // The lessons of the courses this account was given (an admin previewing sees every course).
  const supabase = await createClient();
  const { data: grants } = await supabase.from("course_grants").select("course_id").eq("user_id", user.id);
  const mine = new Set((grants ?? []).map((g: { course_id: string }) => g.course_id));
  const lessons = Object.values(STUDY_MODULES)
    .map((m) => ({ m, topic: topicByHref(m.backHref) }))
    .filter(({ topic }) => topic && (admin || mine.has(topic.id)))
    .sort((a, b) => (a.topic!.id === b.topic!.id ? a.m.n - b.m.n : a.topic!.title.localeCompare(b.topic!.title)))
    .map(({ m, topic }) => ({ slug: m.slug, n: m.n, title: m.title, course: topic!.title, href: studyHref(m.slug) }));

  return (
    <>
      <div className="mt-4 max-w-2xl space-y-2 text-[16px] leading-relaxed text-muted">
        <p>
          מתחת לכל מסך בשיעור יש כרטיס: <strong className="text-fg">איך היה המסך הזה?</strong> לוחצים ברור, הבנתי בקושי או לא הבנתי. אם משהו לא היה ברור, בוחרים מה
          בדיוק הבעיה, ואפשר להוסיף משפט משלכם.
        </p>
        <p>עד שהמסך מדורג אי אפשר לעבור לחלק הבא. בסוף כל שיעור יש שאלה אחת: עד כמה תוכלו לפתור שאלת בחינה בנושא.</p>
        <p>כל דירוג נשמר בחשבון שלכם ומגיע אלינו מיד. אין טופס לשלוח.</p>
      </div>
      <div className="mt-8">
        <MyRatings lessons={lessons} />
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
