import { UserPlus, Users, Wallet, Zap } from "lucide-react";
import type { AmbassadorRow } from "@/lib/data/admin";
import { RANGES, Segmented } from "./dashboard-view";
import { Table } from "./funnel-view";
import { AdminHeader, count, Kpi, Panel, pct } from "./ui";

const sum = (rows: AmbassadorRow[], key: "entered" | "activated" | "signedUp" | "paid") => rows.reduce((total, r) => total + r[key], 0);

/** A count with its share of those who entered through the same link. */
const ofEntered = (n: number, entered: number) => (
  <>
    {count(n)} <span className="block text-xs text-subtle sm:inline">({pct(n, entered)})</span>
  </>
);

/** What each personal ?ref= link brought in. Pure: the page loads the data and checks access. */
export function AmbassadorsView({ rows, days }: { rows: AmbassadorRow[]; days: number }) {
  const entered = sum(rows, "entered");
  return (
    <div>
      <AdminHeader
        title="שגרירים"
        description="מה הביא כל קישור אישי. כל דפדפן שייך לקישור הראשון שדרכו הגיע, גם אם חזר אחר כך בדרך אחרת. נתונים מצרפיים בלבד, בלי מידע על משתמש בודד."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented label="טווח" options={RANGES.map((r) => ({ label: r.label, href: `/admin/ambassadors?range=${r.days}`, on: r.days === days }))} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Users} label="נכנסו דרך קישור" value={count(entered)} />
        <Kpi icon={Zap} label="Activation" value={count(sum(rows, "activated"))} hint={pct(sum(rows, "activated"), entered)} />
        <Kpi icon={UserPlus} label="נרשמו" value={count(sum(rows, "signedUp"))} hint={pct(sum(rows, "signedUp"), entered)} />
        <Kpi icon={Wallet} label="שילמו" value={count(sum(rows, "paid"))} hint={pct(sum(rows, "paid"), entered)} />
      </div>

      <Panel title="לפי קוד" description="מי שנכנס בטווח הזה דרך הקישור, ומה עשה מאז.">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            אין כניסות דרך קישור אישי בטווח הזה. קישור אישי הוא כתובת באתר עם קוד בסופה, למשל <span dir="ltr" className="inline-block font-mono whitespace-nowrap text-fg">?ref=dana</span>. הקוד יופיע כאן אחרי הכניסה הראשונה דרכו.
          </p>
        ) : (
          <Table
            compact
            head={["קוד", "נכנסו", "Activation", "נרשמו", "שילמו"]}
            rows={rows.map((r) => [
              <span key="code" dir="ltr" className="font-medium text-fg">
                {r.code}
              </span>,
              count(r.entered),
              ofEntered(r.activated, r.entered),
              ofEntered(r.signedUp, r.entered),
              ofEntered(r.paid, r.entered),
            ])}
          />
        )}
        <p className="mt-3 text-xs text-subtle">
          Activation = לפחות 5 תשובות, ואחת מהן מלכודת. המספרים כאן יכולים להיות גבוהים מאלה של אותו מקור ב״משפך וצמיחה״, שמייחס כל מבקר לכניסה הראשונה שלו בטווח בלבד. כל אחד יכול להקליד קוד בכתובת, אז קוד לא מוכר הוא לא בהכרח שגריר.
        </p>
      </Panel>
    </div>
  );
}
