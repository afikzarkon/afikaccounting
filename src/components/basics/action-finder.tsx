"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { SideChip } from "./ui";

type Action = { group: string; action: string; dr: string; cr: string; note?: string; common?: boolean };

// The course's "action → debit/credit" table, one row per case.
const ACTIONS: Action[] = [
  { group: "קנייה", action: "קניית סחורה במזומן", dr: "קניות", cr: "מזומן", common: true },
  { group: "קנייה", action: "קניית סחורה באשראי", dr: "קניות", cr: "ספקים", common: true },
  { group: "קנייה", action: "קניית סחורה בצ'ק מזומן (נפרע מיד)", dr: "קניות", cr: "מזומן" },
  { group: "קנייה", action: "קניית סחורה בצ'ק דחוי", dr: "קניות", cr: "ספקים", note: "הצ'ק עוד לא נפרע — זה חוב לספק עד מועד הפירעון." },
  { group: "קנייה", action: "תשלום לספק על חשבון החוב", dr: "ספקים", cr: "מזומן", common: true },
  { group: "מכירה", action: "מכירת סחורה במזומן", dr: "מזומן", cr: "מכירות", common: true },
  { group: "מכירה", action: "מכירת סחורה באשראי", dr: "לקוחות", cr: "מכירות", common: true },
  { group: "מכירה", action: "מכירת סחורה בצ'ק מזומן", dr: "מזומן", cr: "מכירות" },
  { group: "מכירה", action: "מכירת סחורה בצ'ק דחוי", dr: "לקוחות", cr: "מכירות", note: "עד שהצ'ק נפרע, הלקוח עדיין חייב." },
  { group: "מכירה", action: "לקוח שילם את חובו", dr: "מזומן", cr: "לקוחות", common: true },
  { group: "הוצאות", action: "הוצאה ששולמה במזומן (שכר, חשמל, שכירות…)", dr: "הוצאות (לפי סוג)", cr: "מזומן", common: true },
  { group: "הוצאות", action: "הוצאה שטרם שולמה או שולמה בצ'ק דחוי", dr: "הוצאות (לפי סוג)", cr: "ספקים / זכאים", note: "זכאים — מי שהעסק חייב לו ואינו ספק סחורה." },
  { group: "הכנסות", action: "התקבל מזומן על הכנסה (שכירות, ריבית…)", dr: "מזומן", cr: "הכנסות (לפי סוג)" },
  { group: "הכנסות", action: "הכנסה שטרם התקבלה או התקבלה בצ'ק דחוי", dr: "חייבים", cr: "הכנסות (לפי סוג)", note: "חייבים — מי שחייב לעסק ואינו לקוח שקנה סחורה." },
  { group: "בעלים", action: "הבעלים השקיע בעסק במזומן", dr: "מזומן", cr: "הון בעלים", common: true },
  { group: "בעלים", action: "הבעלים משך כסף מהעסק", dr: "הון בעלים", cr: "מזומן", note: "משיכה היא לא הוצאה — היא מקטינה את ההון." },
  { group: "רכוש", action: "קניית רכוש (מחשב, מכונה, ריהוט) במזומן", dr: "שם הרכוש", cr: "מזומן" },
  { group: "רכוש", action: "קניית רכוש באשראי או בצ'ק דחוי", dr: "שם הרכוש", cr: "זכאים" },
  { group: "הלוואה", action: "העסק לקח הלוואה מהבנק", dr: "מזומן", cr: "הלוואה" },
  { group: "הלוואה", action: "העסק פרע הלוואה", dr: "הלוואה", cr: "מזומן" },
  { group: "הלוואה", action: "העסק שילם ריבית על הלוואה", dr: "הוצאות ריבית", cr: "מזומן" },
  { group: "מקדמות", action: "קבלת מקדמה מלקוח", dr: "מזומן", cr: "מקדמות מלקוחות" },
  { group: "מקדמות", action: "אספקת הסחורה ללקוח שנתן מקדמה", dr: "מקדמות מלקוחות", cr: "מכירות" },
  { group: "מקדמות", action: "תשלום מקדמה לספק", dr: "מקדמות לספקים", cr: "מזומן" },
  { group: "מקדמות", action: "הספק סיפק את הסחורה ששולמה במקדמה", dr: "קניות", cr: "מקדמות לספקים" },
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

/** The course's action → debit/credit list: the everyday actions first, and the full list, searchable, on request. */
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
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="סינון לפי נושא">
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
