"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { SideChip } from "./ui";

type Action = { group: string; action: string; dr: string; cr: string; note?: string; common?: boolean };

// The course's events by the one question that decides the entry: when does the money move?
// Today, later (credit or a post-dated cheque), or before (an advance). The owner and the bank have their own group.
const ACTIONS: Action[] = [
  { group: "הכסף זז היום", action: "קונים סחורה למכירה ומשלמים מיד (במזומן, בהעברה או בצ׳ק מזומן)", dr: "קניות", cr: "מזומן", common: true },
  { group: "הכסף זז היום", action: "מוכרים ומקבלים את הכסף מיד", dr: "מזומן", cr: "מכירות", common: true },
  { group: "הכסף זז היום", action: "משלמים על משהו שנגמר עכשיו: שכר, חשמל, שכירות, פרסום", dr: "הוצאות (לפי הנושא)", cr: "מזומן", common: true },
  { group: "הכסף זז היום", action: "מקבלים כסף על שירות, ריבית או שכירות", dr: "מזומן", cr: "הכנסות (לפי הנושא)" },
  { group: "הכסף זז היום", action: "קונים משהו שימשיך לעבוד בשבילנו — מכונה, מחשב, רכב — ומשלמים מיד", dr: "שם הנכס", cr: "מזומן" },
  { group: "הכסף יזוז אחר כך", action: "קונים סחורה למכירה, והתשלום בעוד זמן (אשראי או צ׳ק דחוי)", dr: "קניות", cr: "ספקים", common: true, note: "צ׳ק דחוי הוא חוב עד יום הפירעון — בדיוק כמו אשראי." },
  { group: "הכסף יזוז אחר כך", action: "מוכרים, והלקוח ישלם בעוד זמן (אשראי או צ׳ק דחוי)", dr: "לקוחות", cr: "מכירות", common: true },
  { group: "הכסף יזוז אחר כך", action: "קונים ציוד או שירות, והתשלום בעוד זמן", dr: "שם הנכס / הוצאות", cr: "זכאים", note: "חוב שאינו על סחורה למכירה — זכאים, לא ספקים." },
  { group: "הכסף יזוז אחר כך", action: "הרווחנו ריבית או שכירות, והכסף עוד לא הגיע", dr: "חייבים", cr: "הכנסות (לפי הנושא)", note: "מי שחייב לנו על משהו שאינו מכירה רגילה — חייבים." },
  { group: "הכסף יזוז אחר כך", action: "היום שבו משלמים לספק", dr: "ספקים", cr: "מזומן", common: true, note: "אין קנייה חדשה — היא נרשמה כשהסחורה הגיעה." },
  { group: "הכסף יזוז אחר כך", action: "היום שבו הלקוח משלם (או שהצ׳ק שלו נפרע)", dr: "מזומן", cr: "לקוחות", common: true, note: "אין הכנסה חדשה — היא נרשמה ביום המכירה." },
  { group: "הכסף יזוז אחר כך", action: "הצ׳ק של הלקוח חזר מהבנק", dr: "לקוחות", cr: "מזומן", note: "הפוך לפקודת הפירעון. המכירה לא מתבטלת." },
  { group: "הכסף זז לפני", action: "לקוח משלם מראש על הזמנה", dr: "מזומן", cr: "מקדמות מלקוחות", note: "אנחנו חייבים לו את ההזמנה — התחייבות, לא הכנסה." },
  { group: "הכסף זז לפני", action: "מספקים ללקוח את מה שכבר שילם עליו", dr: "מקדמות מלקוחות", cr: "מכירות" },
  { group: "הכסף זז לפני", action: "משלמים לספק מראש", dr: "מקדמות לספקים", cr: "מזומן", note: "הספק חייב לנו סחורה — נכס, עוד לא קנייה." },
  { group: "הכסף זז לפני", action: "הספק מספק את מה ששילמנו עליו", dr: "קניות", cr: "מקדמות לספקים" },
  { group: "הכסף זז לפני", action: "רק חלק מהעסקה שולם מראש", dr: "העסקה כולה / המקדמה ושאר אופני התשלום", cr: "המקדמה ושאר אופני התשלום / העסקה כולה", note: "צד אחד — העסקה כולה. בצד השני — שורה לכל אופן תשלום." },
  { group: "הבעלים והבנק", action: "הבעלים מכניסים כסף לעסק", dr: "מזומן", cr: "הון בעלים (בחברה: הון מניות)", common: true },
  { group: "הבעלים והבנק", action: "הבעלים לוקחים כסף מהעסק לעצמם", dr: "הון בעלים", cr: "מזומן", note: "זו לא הוצאה — ההון קטן, הרווח לא." },
  { group: "הבעלים והבנק", action: "הבנק נותן לעסק הלוואה", dr: "מזומן", cr: "הלוואה" },
  { group: "הבעלים והבנק", action: "מחזירים לבנק קרן וריבית", dr: "הלוואה + הוצאות ריבית", cr: "מזומן", note: "רק הריבית היא הוצאה. הקרן מקטינה את החוב." },
  { group: "הבעלים והבנק", action: "הבנק גובה עמלה", dr: "הוצאות עמלות בנק", cr: "מזומן" },
];
const GROUPS = ["הכול", ...new Set(ACTIONS.map((a) => a.group))];
const COMMON = ACTIONS.filter((a) => a.common);

function ActionCard({ a }: { a: Action }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-3">
      <p className="text-[14px] font-semibold leading-snug text-fg">{a.action}</p>
      <p className="mt-2 flex items-center gap-2 text-[14px]">
        <SideChip side="dr" />
        <span className="font-medium text-debit">{a.dr}</span>
      </p>
      <p className="mt-1 flex items-center gap-2 ps-5 text-[14px]">
        <SideChip side="cr" />
        <span className="font-medium text-credit">{a.cr}</span>
      </p>
      {a.note && <p className="mt-1.5 text-xs leading-snug text-muted">{a.note}</p>}
    </li>
  );
}

/** The course's events by when the money moves → debit and credit: the everyday ones first, and the full list, searchable, on request. */
export function ActionFinder() {
  const id = useId();
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("הכול");
  const query = q.trim();
  const rows = ACTIONS.filter(
    (a) => (group === "הכול" || a.group === group) && (!query || [a.action, a.dr, a.cr, a.note ?? ""].some((t) => t.includes(query))),
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
        <p className="me-auto text-sm font-semibold text-fg">{all ? "כל הפעולות" : "הפעולות הנפוצות: מה בחובה ומה בזכות"}</p>
        <span className="num text-xs text-muted">
          {all ? rows.length : COMMON.length} מתוך {ACTIONS.length}
        </span>
      </div>
      {all && (
        <div className="space-y-3 border-b border-line p-4">
          <label htmlFor={id} className="sr-only">
            חפשו פעולה או חשבון
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-subtle" aria-hidden />
            <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="חפשו: ספק, מקדמה, צ'ק דחוי…" className={cn(inputClass, "ps-9")} />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="סינון: מתי הכסף זז?">
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", group === g ? "bg-accent text-accent-fg" : "bg-surface text-muted ring-1 ring-line hover:text-fg")}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3" aria-live="polite">
        {(all ? rows : COMMON).map((a) => (
          <ActionCard key={a.action} a={a} />
        ))}
        {all && rows.length === 0 && <li className="col-span-full py-6 text-center text-sm text-muted">לא נמצאה פעולה. נסו מילה אחרת.</li>}
      </ul>
      <div className="border-t border-line px-4 py-2.5 text-center">
        <button type="button" aria-expanded={all} onClick={() => setAll((x) => !x)} className="text-sm font-semibold text-accent hover:underline">
          {all ? "הצג רק את הנפוצות" : `הצג עוד — לרשימה המלאה (${ACTIONS.length})`}
        </button>
      </div>
    </div>
  );
}
