import type { Metadata } from "next";
import { Suspense } from "react";
import { MarkReveal } from "@/components/admin/mark-reveal";
import { AdminHeader, AdminSkeleton, Panel } from "@/components/admin/ui";
import { inputClass } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/dal";
import { findByMarkCode } from "@/lib/data/admin";
import { shortDate } from "@/lib/utils";
import { MARK_SPOTS, markCode, parseMarkCode } from "@/lib/watermark";

export const metadata: Metadata = { title: "סימני מים" };

export default function AdminWatermarkPage({ searchParams }: PageProps<"/admin/watermark">) {
  return (
    <>
      <AdminHeader
        title="סימני מים"
        description="בדפי הקורסים, השיעורים, החזרה והמבחנים מופיע קוד של המשתמש המחובר, כמעט שקוף, בארבעה מקומות קבועים. בקריאה רגילה לא רואים אותו; בצילום מסך או בתמונה של המסך הוא נשאר."
      />
      <div className="space-y-6">
        <Panel title="איפה הסימנים" description="הקוד נראה כך: AA- ואחריו 8 תווים (למשל AA-3F2A9C1B). אותו קוד בכל ארבעת המקומות, כך שגם צילום חתוך שומר לפחות אחד.">
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <ol className="space-y-2.5 text-sm">
              {MARK_SPOTS.map((s, i) => (
                <li key={s.id} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">{i + 1}</span>
                  <span>
                    <span className="font-medium text-fg">{s.label}</span>
                    <span className="block text-xs text-muted">{s.hint}</span>
                  </span>
                </li>
              ))}
            </ol>
            <ScreenMap />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            לראות אותם בעצמך: היכנס לשיעור כשאתה מחובר, צלם מסך, וטען את הצילום בכלי שלמטה. אפשר גם בכל עורך תמונות: להעלות את הניגודיות (Contrast / Levels) עד הסוף. צילום מסך רגיל (PNG) שומר על הסימן היטב; צילום בטלפון של המסך, או תמונה דחוסה מאוד, עלולים לטשטש אותו.
          </p>
        </Panel>

        <Panel title="חשיפת הסימן בצילום" description="טוענים צילום שדלף, והכלי מגביר את ההבדלים הזעירים בבהירות עד שהקוד בולט.">
          <MarkReveal />
        </Panel>

        <Panel title="איתור המשתמש לפי הקוד" description="מקלידים את הקוד שנמצא בצילום, ומקבלים את החשבון ואת הכניסות האחרונות שלו.">
          <form className="flex flex-wrap gap-3" action="/admin/watermark">
            <input name="code" dir="ltr" placeholder="AA-3F2A9C1B" className={`${inputClass} max-w-xs font-mono`} />
            <Button type="submit">חיפוש</Button>
          </form>
          <Suspense fallback={<AdminSkeleton />}>
            <Lookup searchParams={searchParams} />
          </Suspense>
        </Panel>
      </div>
    </>
  );
}

/** A screen with the four spots marked, to point at. */
function ScreenMap() {
  const dot = "absolute grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg";
  return (
    <div className="relative aspect-[4/3] w-full rounded-lg border border-line bg-surface-2/60" aria-hidden>
      <div className="h-5 border-b border-line bg-surface" />
      <span className={dot} style={{ top: 2, right: 4 }}>1</span>
      <span className={dot} style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>2</span>
      <span className={dot} style={{ top: "50%", left: 4, transform: "translateY(-50%)" }}>3</span>
      <span className={dot} style={{ bottom: 4, left: 4 }}>4</span>
    </div>
  );
}

async function Lookup({ searchParams }: { searchParams: PageProps<"/admin/watermark">["searchParams"] }) {
  await requireAdmin("/admin/watermark");
  const raw = (await searchParams).code;
  const input = typeof raw === "string" ? raw : "";
  if (!input) return null;
  const hex = parseMarkCode(input);
  if (!hex) return <p className="mt-4 text-sm text-danger">זה לא נראה כמו קוד: AA- ואחריו 8 תווים (0-9, A-F).</p>;

  const matches = await findByMarkCode(hex);
  if (!matches.length) return <p className="mt-4 text-sm text-muted">לא נמצא חשבון עם הקוד {markCode(hex)}.</p>;
  return (
    <ul className="mt-4 divide-y divide-line">
      {matches.map((m) => (
        <li key={m.id} className="space-y-1.5 py-3 text-sm">
          <span className="block font-medium text-fg">{m.fullName || "ללא שם"}</span>
          <span className="block font-mono text-xs text-muted" dir="ltr">
            {m.id}
          </span>
          <span className="block text-xs text-muted">נרשם {shortDate(m.createdAt)}</span>
          {m.signIns.length > 0 && (
            <span className="block text-xs text-muted">
              כניסות אחרונות: {m.signIns.map((s) => `${s.device}${s.country ? ` (${s.country})` : ""} ${shortDate(s.at)}`).join(" · ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
