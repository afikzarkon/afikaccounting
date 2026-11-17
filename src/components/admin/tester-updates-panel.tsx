import { Panel } from "@/components/admin/ui";
import { CourseChanges, ManualTesterUpdate, PublishedTesterUpdate } from "@/components/admin/tester-updates-manager";
import { type TesterRow, courseGrantsOf, latestContentBaselines, listTesterUpdates } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { LESSON_COURSES, type Suggestion, coursePrint, courseTitle, suggest } from "@/lib/tester/fingerprint";
import { canDecideHere } from "@/lib/tester/updates";

const day = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Jerusalem" });

/**
 * Updates for the testers, by course. The site compares each course's lessons to how they were at the
 * last decision and offers what changed as a ready update for that course's testers only; the admin
 * publishes or skips it. Below: an update of the admin's own, and what was published, with who saw it.
 */
export async function TesterUpdatesPanel({ people }: { people: TesterRow[] }) {
  const published = await listTesterUpdates();
  const title = "עדכונים לניסיינים";
  const description =
    "האתר משווה כל קורס למצב שלו בהחלטה האחרונה, ומציע את מה שהשתנה כעדכון מוכן. עדכון שמתפרסם מגיע רק לניסיינים שקיבלו את הקורס, וקופץ להם בחלון בכניסה הראשונה לאתר אחרי הפרסום.";
  if (published === null)
    return (
      <Panel title={title} description={description}>
        <p className="text-sm text-muted">
          כדי להפעיל עדכונים צריך להריץ את המיגרציה <span dir="ltr">supabase/migrations/20261117000000_tester_updates.sql</span> ב-SQL Editor של Supabase.
        </p>
      </Panel>
    );

  const grants = await courseGrantsOf(people.map((p) => p.userId));
  const testersOf = (courseId: string | null) => people.filter((p) => courseId === null || grants.get(p.userId)?.has(courseId));
  const live = canDecideHere();

  // A course looked at for the first time on the live site starts from its lessons as they are now.
  let baselines = await latestContentBaselines();
  const fresh = LESSON_COURSES.filter((c) => !baselines.has(c.id));
  if (live && fresh.length) {
    const supabase = await createClient();
    await supabase.from("tester_content_baselines").insert(fresh.map((c) => ({ course_id: c.id, fingerprint: coursePrint(c.id), decision: "start" })));
    baselines = await latestContentBaselines();
  }

  const changes: (Suggestion & { since: string })[] = [];
  for (const c of LESSON_COURSES) {
    const base = baselines.get(c.id);
    if (!base) continue;
    const s = suggest(c.id, base.fingerprint, coursePrint(c.id));
    if (s) changes.push({ ...s, since: day.format(new Date(base.createdAt)) });
  }
  // The courses with testers first, then the bigger changes.
  changes.sort((a, b) => testersOf(b.courseId).length - testersOf(a.courseId).length || b.size - a.size);
  const tracked = LESSON_COURSES.filter((c) => baselines.has(c.id)).length;

  return (
    <Panel title={title} description={description}>
      <h3 className="text-sm font-semibold text-fg">שינויים שזוהו</h3>
      {changes.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted">
          {tracked ? "אין שינויים חדשים בשיעורים מאז ההחלטה האחרונה בכל קורס." : "המעקב מתחיל בכניסה הראשונה לדף הזה באתר החי: מאותו רגע כל שינוי בשיעורים יופיע כאן."}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {changes.map((s) => (
            <CourseChanges
              key={s.courseId}
              course={{ id: s.courseId, title: courseTitle(s.courseId) }}
              suggestion={{ title: s.title, body: s.body, linkHref: s.linkHref ?? "", linkLabel: s.linkLabel ?? "" }}
              testers={testersOf(s.courseId).length}
              since={s.since}
              canDecide={live}
            />
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-subtle">
        מזוהה אוטומטית: מסכים חדשים או ששונו (טקסט, מספרים וטבלאות), שאלות תרגול ופתרונות, שאלות מלכודת, טיפים, סרטונים ושיעורים חדשים. שינוי בעיצוב של רכיב
        משותף לא מזוהה: עליו אפשר לכתוב עדכון ידני.
      </p>

      <details className="mt-6 border-t border-line pt-5">
        <summary className="cursor-pointer text-sm font-semibold text-fg">עדכון ידני</summary>
        <ManualTesterUpdate courses={LESSON_COURSES} />
      </details>

      {published.updates.length > 0 && (
        <div className="mt-6 space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-fg">פורסמו</h3>
          {published.updates.map((u) => {
            // Meant for the course's testers who were testers when it went out.
            const audience = testersOf(u.courseId).filter((p) => new Date(p.addedAt) < new Date(u.createdAt));
            const seen = published.seenBy.get(u.id) ?? new Set<string>();
            const unseen = audience.filter((p) => !seen.has(p.userId)).map((p) => p.email);
            return (
              <PublishedTesterUpdate
                key={u.id}
                update={{ ...u, audience: audience.length, seen: audience.length - unseen.length }}
                courseTitle={u.courseId ? `לניסיינים של ${courseTitle(u.courseId)}` : "לכל הניסיינים"}
                unseen={unseen}
              />
            );
          })}
        </div>
      )}
    </Panel>
  );
}
