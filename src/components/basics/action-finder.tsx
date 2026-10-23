"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/utils";

type Action = { group: string; action: string; dr: string; cr: string; note?: string };

// The course's "action → debit/credit" table, one row per case.
const ACTIONS: Action[] = [
  { group: "קנייה", action: "קניית סחורה במזומן", dr: "קניות", cr: "מזומן" },
  { group: "קנייה", action: "קניית סחורה באשראי", dr: "קניות", cr: "ספקים" },
  { group: "קנייה", action: "קניית סחורה בצ'ק מזומן (נפרע מיד)", dr: "קניות", cr: "מזומן" },
  { group: "קנייה", action: "קניית סחורה בצ'ק דחוי", dr: "קניות", cr: "ספקים", note: "הצ'ק עוד לא נפרע — זה חוב לספק עד מועד הפירעון." },
  { group: "קנייה", action: "תשלום לספק על חשבון החוב", dr: "ספקים", cr: "מזומן" },
  { group: "מכירה", action: "מכירת סחורה במזומן", dr: "מזומן", cr: "מכירות" },
  { group: "מכירה", action: "מכירת סחורה באשראי", dr: "לקוחות", cr: "מכירות" },
  { group: "מכירה", action: "מכירת סחורה בצ'ק מזומן", dr: "מזומן", cr: "מכירות" },
  { group: "מכירה", action: "מכירת סחורה בצ'ק דחוי", dr: "לקוחות", cr: "מכירות", note: "עד שהצ'ק נפרע, הלקוח עדיין חייב." },
  { group: "מכירה", action: "לקוח שילם את חובו", dr: "מזומן", cr: "לקוחות" },
  { group: "הוצאות", action: "הוצאה ששולמה במזומן (שכר, חשמל, שכירות…)", dr: "הוצאות (לפי סוג)", cr: "מזומן" },
  { group: "הוצאות", action: "הוצאה שטרם שולמה או שולמה בצ'ק דחוי", dr: "הוצאות (לפי סוג)", cr: "ספקים / זכאים", note: "זכאים — מי שהעסק חייב לו ואינו ספק סחורה." },
  { group: "הכנסות", action: "התקבל מזומן על הכנסה (שכירות, ריבית…)", dr: "מזומן", cr: "הכנסות (לפי סוג)" },
  { group: "הכנסות", action: "הכנסה שטרם התקבלה או התקבלה בצ'ק דחוי", dr: "חייבים", cr: "הכנסות (לפי סוג)", note: "חייבים — מי שחייב לעסק ואינו לקוח שקנה סחורה." },
  { group: "בעלים", action: "הבעלים השקיע בעסק במזומן", dr: "מזומן", cr: "הון בעלים" },
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

export function ActionFinder() {
  const id = useId();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("הכול");
  const query = q.trim();
  const rows = ACTIONS.filter(
    (a) => (group === "הכול" || a.group === group) && (!query || [a.action, a.dr, a.cr, a.note ?? ""].some((t) => t.includes(query))),
  );

  return (
    <div className="card overflow-hidden">
      <div className="space-y-3 border-b border-line bg-surface-2/50 p-4">
        <label htmlFor={id} className="block text-sm font-semibold text-fg">
          חפשו פעולה או חשבון
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-subtle" aria-hidden />
          <input id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="למשל: ספק, מקדמה, צ'ק דחוי" className={cn(inputClass, "ps-9")} />
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">פעולה, החשבון בחובה והחשבון בזכות</caption>
          <thead>
            <tr className="text-xs text-muted">
              <th className="px-4 py-2 text-start font-medium">הפעולה</th>
              <th className="px-4 py-2 text-start font-medium text-debit">חובה (מקבל)</th>
              <th className="px-4 py-2 text-start font-medium text-credit">זכות (נותן)</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {rows.map((a) => (
              <tr key={a.action} className="border-t border-line/70 align-top">
                <td className="px-4 py-2 text-fg">
                  {a.action}
                  {a.note && <span className="mt-0.5 block text-xs text-muted">{a.note}</span>}
                </td>
                <td className="px-4 py-2 font-medium text-debit">{a.dr}</td>
                <td className="px-4 py-2 font-medium text-credit">{a.cr}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">
                  לא נמצאה פעולה. נסו מילה אחרת.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
