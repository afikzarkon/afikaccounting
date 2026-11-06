"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { work } from "@/lib/study/ias19/formulas";
import { Work } from "./ias19-formula";
import { RollForward } from "./ias19-ui";

/**
 * The roll-forward on a worksheet, with the year-end rate to pick: the four
 * ordinary lines stay put, only the closing moves, and the OCI line is what
 * balances the column.
 */

const OPENING = 5_000;
const SERVICE = 1_500;
const INTEREST = OPENING * 0.06;
const PAID = 1_000;
const EXPECTED = OPENING + SERVICE + INTEREST - PAID;

const CASES = [
  { id: "down", label: "הריבית ירדה", closing: 6_300, says: "ריבית נמוכה מגדילה את הערך הנוכחי, ולכן הסגירה החדשה גדולה מהצפוי. ה-OCI בזכות: הפסד אקטוארי." },
  { id: "same", label: "שום הנחה לא השתנתה", closing: EXPECTED, says: "הסגירה יוצאת בדיוק כמו הצפוי, ולכן אין OCI." },
  { id: "up", label: "הריבית עלתה", closing: 5_400, says: "ריבית גבוהה מקטינה את הערך הנוכחי, ולכן הסגירה החדשה קטנה מהצפוי. ה-OCI בחובה: רווח אקטוארי." },
] as const;

export function RollSchedule() {
  const [id, setId] = useState<(typeof CASES)[number]["id"]>("down");
  const c = CASES.find((x) => x.id === id)!;
  const pn = c.closing - EXPECTED;

  return (
    <figure className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <figcaption className="space-y-1">
        <p className="text-[15.5px] font-bold text-fg">המעגל, כמו בגיליון</p>
        <p className="text-[13.5px] text-muted">
          ההתחייבות היא יתרת זכות, ולכן היא וכל מה שמגדיל אותה <span className="text-credit">במינוס</span>; תשלום מקטין אותה ולכן <span className="text-debit">בפלוס</span>. בחרו מה קרה לריבית בסוף השנה.
        </p>
      </figcaption>

      <div className="flex flex-wrap gap-2" role="group" aria-label="מה קרה לריבית בסוף השנה">
        {CASES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={id === x.id}
            onClick={() => setId(x.id)}
            className={cn("h-8 rounded-lg px-3 text-[13px] font-semibold ring-1 transition", id === x.id ? "bg-accent text-accent-fg ring-accent" : "bg-surface text-muted ring-line-strong hover:text-fg")}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className="max-w-md">
        <RollForward
          title="מעגל ההתחייבות להטבה מוגדרת"
          rows={[
            { label: "יתרת פתיחה", value: OPENING, kind: "balance" },
            { label: "שירות שוטף", value: SERVICE },
            { label: "הוצ׳ ריבית", value: INTEREST, how: <Work w={work.interestCost(OPENING, 0.06)} /> },
            { label: "הטבות ששולמו", value: -PAID },
            { label: "רווח (הפסד) אקטוארי", value: pn, kind: "pn", how: "P.N." },
            { label: "יתרת סגירה (ס.י)", value: c.closing, kind: "balance" },
          ]}
        />
      </div>

      <div className="space-y-1.5 rounded-xl bg-surface-2/60 px-3.5 py-3 text-[14px] leading-relaxed text-fg">
        <p>צפוי, בלי OCI:</p>
        <Work w={work.rollExpected({ opening: OPENING, interest: INTEREST, service: SERVICE, payments: PAID })} />
        <p>המדידה החדשה בסוף השנה, והפער הוא ה-OCI:</p>
        <Work w={work.pnDB({ opening: OPENING, interest: INTEREST, service: SERVICE, payments: PAID, closing: c.closing })} />
        <p>{c.says}</p>
      </div>
    </figure>
  );
}
