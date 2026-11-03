import { ArrowLeft } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Deeper, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { Statement } from "@/components/study/ledger";
import { SHAKED_Q, shaked } from "@/lib/learn/ias16-exams";
import {
  BAKERY,
  BUILDING_ANNUAL,
  BUILDING_COST,
  LAND_COST,
  NEW_VAN_COST,
  OVEN,
  OVEN_ANNUAL,
  OVEN_BEFORE_UPGRADE,
  ovenRows,
  PREMISES,
  UPGRADE,
  UPGRADE_ANNUAL,
  UPGRADE_BASE,
  VAN,
  VAN_ACCUM_AT_SALE,
  VAN_ANNUAL,
  VAN_CARRYING_AT_SALE,
  VAN_FIRST,
  VAN_FIRST_MONTHS,
  VAN_LIFE,
  VAN_SALE,
  VAN_SALE_CHARGE,
  VAN_SALE_MONTHS,
  VAN_SALE_RESULT,
  VAN_SWAP,
  vanRows,
  YEAR_2026,
} from "@/lib/study/ias16/bakery";
import { DB_BACK, UNITS_BACK } from "@/lib/study/ias16/lessons/methods";
import {
  UNK_LAND,
  UNK_LIFE,
  UNK_RENO,
  UNK_REVAL,
  UNK_SALVAGE,
  UNK_SWAP,
  UNK_SYD,
  unkLandBefore,
  unkLife,
  unkLifeAnnual,
  unkLifeMonths,
  unkReno,
  unkRenoBase,
  unkRevalFair,
  unkRevalSurplus,
  unkSalvage,
  unkSwapCost,
  unkSwapFair,
  unkSydBase,
  unkSydDigits,
  unkSydSalvage,
  unkTwoAccum,
  unkTwoCarrying,
  unkTwoMonths,
} from "@/lib/study/ias16/lessons/unknowns";
import { cn } from "@/lib/utils";
import { PpeNote } from "./ias16-note";
import { AssetSheet, type SheetLine } from "./ias16-sheet";
import { FillGrid, MiniQuiz } from "./inventory-interactive";
import { ChainChips, Reveal, Sorted } from "./inventory-teach";
import { Formula, JE, Money, Wide } from "./ui";

/**
 * The screens the fourteen-lesson course added: the four words and the sheet
 * (lesson 3), the five questions (4), why there are several methods and how a
 * question names one (5), the bakery's sale, upgrade and exchange (7–9), all
 * of its assets side by side (12), the lesson of unknowns (13) and the third
 * exam question (14). The bakery's figures come from lib/study/ias16/bakery.
 */

const n = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });
const keyed = (xs: ReactNode[]) => xs.map((x, i) => <Fragment key={i}>{x}</Fragment>);
const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias16" chapter={chapter} items={items} />;

/** A forward calculation as boxes joined by arrows; the unknown box is marked. */
function Chain({ boxes }: { boxes: { label: string; value?: ReactNode; unknown?: boolean }[] }) {
  return (
    <ol className="flex flex-wrap items-stretch gap-1.5" aria-label="החישוב קדימה">
      {boxes.map((b, i) => (
        <li key={b.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex min-w-[6.5rem] flex-col items-center rounded-xl px-3 py-2 text-center ring-1",
              b.unknown ? "bg-amber-400/15 ring-2 ring-amber-500/70" : "bg-surface ring-line-strong",
            )}
          >
            <span className="text-[12px] font-medium text-muted">{b.label}</span>
            <span className={cn("num text-[16px] font-bold", b.unknown ? "text-amber-700 dark:text-amber-300" : "text-fg")}>{b.unknown ? "?" : b.value}</span>
          </span>
          {i < boxes.length - 1 && <ArrowLeft className="h-4 w-4 shrink-0 text-subtle" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

/** A titled block of a worked example or a question: a bold line over its own lines, with no box around them. */
function Titled({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="font-semibold text-fg">{title}</p>
      {children}
    </section>
  );
}

// The oven's sheet, with a note under each row: where its cells came from.
const OVEN_ROWS = ovenRows();
const ovenSheet: SheetLine[] = OVEN_ROWS.map((r, i) => ({
  label: String(r.year),
  cost: r.cost,
  charge: r.charge,
  accumulated: r.accumulated,
  carrying: r.carrying,
  note:
    i === 0 ? (
      <>
        <strong>B2</strong> — העלות: <Money v={OVEN.cost} />, ולא תשתנה. <strong>C2</strong> — פחת השנה: (<Money v={OVEN.cost} plain /> − <Money v={OVEN.salvage} plain />) ÷ {OVEN.life} = <Money v={OVEN_ANNUAL} />.{" "}
        <strong>D2</strong> — אין פחת משנים קודמות, ולכן הפחת הנצבר שווה לפחת השנה. <strong>E2</strong> — <Money v={OVEN.cost} plain /> − <Money v={r.accumulated} plain /> = <Money v={r.carrying} />.
      </>
    ) : i === OVEN_ROWS.length - 1 ? (
      <>
        השורה האחרונה: הפחת הנצבר הגיע ל-<Money v={r.accumulated} />, והעלות המופחתת — <Money v={r.carrying} /> — שווה בדיוק לערך הגרט. התנור סיים את חייו בספרים.
      </>
    ) : (
      <>
        <strong>C{i + 2}</strong> — אותו פחת כמו בכל שנה, <Money v={r.charge} />. <strong>D{i + 2}</strong> = D{i + 1} + C{i + 2}: <Money v={OVEN_ROWS[i - 1].accumulated} plain /> + <Money v={r.charge} plain /> = <Money v={r.accumulated} />.{" "}
        <strong>E{i + 2}</strong> = B − D: <Money v={r.carrying} />.
      </>
    ),
}));

// The truck over its whole life: nine months in its first year, three in its last.
const VAN_CHARGES = [VAN_FIRST, ...Array.from({ length: VAN_LIFE - 1 }, () => VAN_ANNUAL), VAN_ANNUAL - VAN_FIRST];
const vanLife: SheetLine[] = VAN_CHARGES.map((charge, i) => {
  const accumulated = VAN_CHARGES.slice(0, i + 1).reduce((s, v) => s + v, 0);
  const months = i === 0 ? VAN_FIRST_MONTHS : i === VAN_CHARGES.length - 1 ? 12 - VAN_FIRST_MONTHS : 12;
  return {
    label: `${VAN.from + i}${months < 12 ? ` (${months} ח׳)` : ""}`,
    cost: VAN.cost,
    charge,
    accumulated,
    carrying: VAN.cost - accumulated,
    note:
      months < 12 ? (
        <>
          {months} חודשים בלבד: <Money v={VAN_ANNUAL} plain /> × {months}/12 = <Money v={charge} />.
        </>
      ) : (
        <>שנה מלאה: <Money v={VAN_ANNUAL} />.</>
      ),
  };
});

// The truck until its sale, then the row of its leaving.
const VAN_BEFORE = vanRows(VAN_SALE.year - VAN.from);
const vanSaleSheet: SheetLine[] = [
  ...VAN_BEFORE.map((r) => ({ label: String(r.year), cost: r.cost, charge: r.charge, accumulated: r.accumulated, carrying: r.carrying })),
  { label: `1–${VAN_SALE_MONTHS}.${VAN_SALE.year}`, cost: VAN.cost, charge: VAN_SALE_CHARGE, accumulated: VAN_ACCUM_AT_SALE, carrying: VAN_CARRYING_AT_SALE },
  { label: `מכירה ${`1.${VAN_SALE.month}.${VAN_SALE.year}`}`, cost: 0, charge: "—", accumulated: 0, carrying: 0, event: true },
];

// The oven up to its upgrade, the upgrade, and two years after it.
const UPGRADE_YEARS = UPGRADE.year - OVEN.from;
const upgradeSheet: SheetLine[] = [
  ...OVEN_ROWS.slice(0, UPGRADE_YEARS).map((r) => ({ label: String(r.year), cost: r.cost, charge: r.charge, accumulated: r.accumulated, carrying: r.carrying })),
  { label: `שדרוג 1.1.${UPGRADE.year}`, cost: OVEN.cost + UPGRADE.cost, charge: "—", accumulated: OVEN_ROWS[UPGRADE_YEARS - 1].accumulated, carrying: UPGRADE_BASE, event: true },
  ...[0, 1].map((k) => {
    const accumulated = OVEN_ROWS[UPGRADE_YEARS - 1].accumulated + UPGRADE_ANNUAL * (k + 1);
    return { label: String(UPGRADE.year + k), cost: OVEN.cost + UPGRADE.cost, charge: UPGRADE_ANNUAL, accumulated, carrying: OVEN.cost + UPGRADE.cost - accumulated };
  }),
];

const S = shaked();

export const IAS16_COURSE_NEW_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------- lesson 3
  "ppe-four-words": {
    lead: "לכל נכס ארבעה מספרים. העלות — לא משתנה. הוצאות פחת — של השנה בלבד. פחת נצבר — כל הפחת מאז הקנייה. ועלות מופחתת — מה שנשאר: העלות פחות הפחת הנצבר.",
    body: (
      <>
        <p>
          <strong>{`התנור של ${BAKERY}.`}</strong> עלות <Money v={OVEN.cost} />, ערך גרט <Money v={OVEN.salvage} />, {OVEN.life} שנות חיים בקו ישר, מ-1.1.{OVEN.from}. פחת שנתי:{" "}
          <Money v={OVEN_ANNUAL} />. כך נראים ארבעת המספרים שלו בסוף {OVEN.from + 2} — אחרי שלוש שנים.
        </p>
        <Wide>
          <div className="space-y-1.5" role="img" aria-label={`עלות ${n(OVEN.cost)}: שלוש שנים של פחת, ${n(OVEN_ANNUAL * 3)}, ועלות מופחתת ${n(OVEN.cost - OVEN_ANNUAL * 3)}`}>
            <div className="flex h-12 overflow-hidden rounded-xl ring-1 ring-line-strong">
              {[1, 2, 3].map((y) => (
                <div key={y} className="grid place-items-center border-e border-white/40 bg-accent text-[12px] font-bold text-accent-fg" style={{ width: `${(OVEN_ANNUAL / OVEN.cost) * 100}%` }}>
                  שנה {y}
                </div>
              ))}
              <div className="grid place-items-center bg-surface-2 text-[12px] font-semibold text-fg" style={{ width: `${((OVEN.cost - OVEN.salvage - 3 * OVEN_ANNUAL) / OVEN.cost) * 100}%` }}>
                עוד לא הופחת
              </div>
              <div className="grid place-items-center bg-[repeating-linear-gradient(45deg,var(--surface-2),var(--surface-2)_6px,var(--line)_6px,var(--line)_12px)] text-[11px] font-semibold text-muted" style={{ width: `${(OVEN.salvage / OVEN.cost) * 100}%` }}>
                גרט
              </div>
            </div>
            <div className="flex text-[12.5px]">
              <span className="font-semibold text-accent" style={{ width: `${((3 * OVEN_ANNUAL) / OVEN.cost) * 100}%` }}>
                פחת נצבר: <Money v={3 * OVEN_ANNUAL} plain />
              </span>
              <span className="font-semibold text-fg">עלות מופחתת: <Money v={OVEN.cost - 3 * OVEN_ANNUAL} plain /></span>
            </div>
          </div>
        </Wide>
        <Wide>
          <DataTable
            head={["המילה", "מה זה", `בסוף ${OVEN.from + 2}`, "איפה", "שנה או מצטבר?"]}
            rows={[
              ["עלות", "מה שהנכס עלה (שיעור 2)", OVEN.cost, "מאזן", "לא משתנה"],
              ["הוצאות פחת", "החלק של הנכס שנצרך השנה", OVEN_ANNUAL, "רווח והפסד", "שנה אחת — מתחיל כל שנה מאפס"],
              ["פחת נצבר", "כל הפחת מאז הקנייה", 3 * OVEN_ANNUAL, "מאזן — מקטין את הנכס", "מצטבר"],
              ["עלות מופחתת", "עלות − פחת נצבר", OVEN.cost - 3 * OVEN_ANNUAL, "מאזן", "מצטבר (יורד)"],
            ]}
          />
        </Wide>
        <Remember>
          עלות מופחתת = ערך בספרים = יתרה בספרים — שלושה שמות לאותו מספר. בשאלות ובספרים תפגשו את שלושתם; בקורס נגיד בעיקר ״עלות מופחתת״.
        </Remember>
      </>
    ),
    check: quiz("ppe-four-words", [
      {
        q: `מה הפחת הנצבר של התנור בסוף ${OVEN.from + 4}, אחרי חמש שנים?`,
        options: [`${n(OVEN_ANNUAL * 5)} ₪`, `${n(OVEN_ANNUAL)} ₪`, `${n(OVEN.cost - OVEN_ANNUAL * 5)} ₪`, `${n(OVEN.cost)} ₪`],
        answer: 0,
        why: `פחת נצבר מצטבר: ${n(OVEN_ANNUAL)} × 5. ${n(OVEN_ANNUAL)} הוא רק הפחת של השנה, ו-${n(OVEN.cost - OVEN_ANNUAL * 5)} — העלות המופחתת.`,
      },
      {
        q: "שאלה מבקשת את ״הערך בספרים״ של מכונה. מה מחשבים?",
        options: ["עלות פחות פחת נצבר", "את העלות", "את הוצאות הפחת של השנה", "את שווי השוק"],
        answer: 0,
        why: "ערך בספרים הוא שם אחר לעלות המופחתת: עלות − פחת נצבר.",
      },
    ]),
  },
  "ppe-table": {
    lead: "כל שאלת רכוש קבוע נפתרת בטבלה אחת: שורה לכל שנה, ובכל שורה ארבעת המספרים. כל שורה נבנית מהשורה שמעליה — ומכאן והלאה, כל נושא בקורס הוא שינוי בטבלה הזו.",
    body: (
      <>
        <div className="space-y-1.5">
          <p className="font-semibold text-fg">שלוש הנוסחאות של הטבלה:</p>
          <ul className="space-y-1.5">
            <li>
              <strong>C</strong> — הוצאות פחת השנה = (עלות − ערך גרט) ÷ שנות חיים
            </li>
            <li>
              <strong>D</strong> — פחת נצבר = הפחת הנצבר של השורה הקודמת + הוצאות הפחת של השנה
            </li>
            <li>
              <strong>E</strong> — עלות מופחתת = עלות − פחת נצבר
            </li>
          </ul>
        </div>
        <Wide>
          <AssetSheet caption={`תנור — ${BAKERY}`} rows={ovenSheet} grow />
        </Wide>
        <Wide>
          <FillGrid
            caption="תורכם: מכונה בעלות 50,000 ₪, ערך גרט 10,000 ₪, 4 שנים בקו ישר. השלימו את התאים הריקים."
            head={["שנה", "עלות", "הוצאות פחת", "פחת נצבר", "עלות מופחתת"]}
            rows={[
              ["1", 50_000, { find: 10_000 }, 10_000, { find: 40_000 }],
              ["2", 50_000, 10_000, { find: 20_000 }, 30_000],
              ["3", 50_000, 10_000, 30_000, { find: 20_000 }],
              ["4", 50_000, 10_000, { find: 40_000 }, { find: 10_000 }],
            ]}
            hint="רמז: בשורה האחרונה העלות המופחתת שווה לערך הגרט."
          />
        </Wide>
        <Remember>בכל שיעור מכאן נשנה את הטבלה: שנה חלקית מוסיפה שורה קצרה, שיפוץ מוסיף לעלות, מכירה מוציאה את השורה, והערכה מחדש מאפסת את הפחת הנצבר.</Remember>
      </>
    ),
  },
  "ppe-bs-view": {
    lead: "את מספרי הטבלה מציגים בשני דוחות: הוצאות הפחת של השנה — ברווח והפסד; העלות, הפחת הנצבר והעלות המופחתת — במאזן.",
    body: (
      <>
        <p>
          <strong>{`התנור בדוחות של ${OVEN.from + 2}.`}</strong> אותה שורה מהטבלה — שורת {OVEN.from + 2} — מתפצלת לשני דוחות.
        </p>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Statement
            title={`מאזן ליום 31.12.${OVEN.from + 2} (קטע)`}
            rows={[
              { label: "רכוש קבוע", kind: "heading" },
              { label: "תנור — עלות (B)", values: [OVEN.cost] },
              { label: "בניכוי פחת נצבר (D)", values: [-3 * OVEN_ANNUAL] },
              { label: "עלות מופחתת (E)", values: [OVEN.cost - 3 * OVEN_ANNUAL], kind: "total" },
            ]}
          />
          <div className="space-y-2">
            <Statement title={`רווח והפסד לשנת ${OVEN.from + 2} (קטע)`} rows={[{ label: "הוצאות פחת (C)", values: [-OVEN_ANNUAL] }]} />
            <p className="text-sm text-muted">רק הפחת של השנה, בסוגריים כי זו הוצאה. הפחת של השנים הקודמות כבר נרשם ברווח והפסד שלהן.</p>
          </div>
        </Wide>
        <Remember>מאזן — תמונה ביום אחד, ולכן מספרים מצטברים (B, D, E). רווח והפסד — שנה אחת, ולכן רק C.</Remember>
      </>
    ),
    check: quiz("ppe-bs-view", [
      {
        q: "באיזה דוח מופיע הפחת הנצבר?",
        options: ["במאזן, בניכוי מהעלות", "ברווח והפסד", "בשניהם", "באף אחד"],
        answer: 0,
        why: "פחת נצבר הוא חשבון מאזני שמקטין את הנכס. ברווח והפסד — רק הוצאות הפחת של השנה.",
      },
      {
        q: `במאזן של התנור ליום 31.12.${OVEN.from + 4}, מה תהיה העלות המופחתת?`,
        options: [`${n(OVEN.cost - 5 * OVEN_ANNUAL)} ₪`, `${n(OVEN.cost)} ₪`, `${n(5 * OVEN_ANNUAL)} ₪`, `${n(OVEN_ANNUAL)} ₪`],
        answer: 0,
        why: `אחרי חמש שנים: ${n(OVEN.cost)} − ${n(5 * OVEN_ANNUAL)}.`,
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 4
  "ppe-five-questions": {
    lead: "לפני כל חישוב פחת שואלים חמש שאלות. כל נתון בשאלה עונה על אחת מהן — וכשיש תשובה לכל החמש, הפחת כבר כתוב.",
    body: (
      <>
        <p>
          <strong>{`המשאית של ${BAKERY}.`}</strong> נקנתה ב-1.{VAN.boughtMonth}.{VAN.from} ב-<Money v={VAN.cost} />, הייתה מוכנה לשימוש ב-1.{VAN.readyMonth}.{VAN.from}, ומופחתת{" "}
          {VAN.rate * 100}% לשנה בקו ישר.
        </p>
        <Wide>
          <DataTable
            head={["השאלה", "איפה מוצאים בשאלה", "במשאית"]}
            rows={[
              ["1. מה העלות?", "המחיר ומה שהביא את הנכס למקומו (שיעור 2)", <Money key="c" v={VAN.cost} />],
              ["2. מה ערך הגרט?", "״יימכר בסוף חייו ב-״; אם לא נאמר — אפס", "0"],
              ["3. כמה שנים — או איזה שיעור?", "״X שנים״, או ״X% לשנה״ (שנים = 100 ÷ שיעור)", `${VAN.rate * 100}% = ${VAN_LIFE} שנים`],
              ["4. מאיזה תאריך?", "היום שבו הנכס זמין לשימוש — לא יום הקנייה", `1.${VAN.readyMonth}.${VAN.from}`],
              ["5. כמה חודשים השנה?", "מהתאריך ועד 31.12 (או עד יום האירוע)", `${VAN_FIRST_MONTHS} חודשים`],
            ]}
          />
        </Wide>
        <Wide>
          <Formula
            title="ומכאן הפחת"
            when={`הפחת של ${VAN.from}`}
            formula={<>עלות × שיעור × חודשים/12</>}
            example={
              <>
                <Money v={VAN.cost} plain /> × {VAN.rate * 100}% × {VAN_FIRST_MONTHS}/12 = <Money v={VAN_FIRST} />
              </>
            }
          />
        </Wide>
        <Wide>
          <AssetSheet caption={`משאית — ${BAKERY}, לאורך כל חייה`} rows={vanLife} grow />
        </Wide>
        <Remember>
          נכס ל-{VAN_LIFE} שנים שנכנס באפריל מופיע ב-{VAN_LIFE + 1} שנות כספים: {VAN_FIRST_MONTHS} חודשים בראשונה, ו-{12 - VAN_FIRST_MONTHS} באחרונה.
        </Remember>
      </>
    ),
    check: quiz("ppe-five-questions", [
      {
        q: "מכונה ב-90,000 ₪, 10% לשנה בקו ישר, נקנתה ב-1.5 והייתה מוכנה לשימוש ב-1.8. מה הפחת לשנה הראשונה?",
        options: ["3,750 ₪", "6,000 ₪", "9,000 ₪", "4,500 ₪"],
        answer: 0,
        why: "מ-1.8: 5 חודשים. 90,000 × 10% × 5/12 = 3,750. 6,000 יוצא כשסופרים מיום הקנייה.",
      },
      {
        q: "השאלה לא מזכירה ערך גרט. מה מניחים?",
        options: ["אפס", "10% מהעלות", "אי אפשר לפתור", "שנה אחת של פחת"],
        answer: 0,
        why: "כשלא נאמר דבר על ערך גרט — הוא אפס.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 5
  "ppe-why-methods": {
    lead: "כל השיטות מפחיתות בדיוק את אותו סכום — העלות פחות ערך הגרט. ההבדל הוא רק איך הסכום מתחלק בין השנים, ולכן בוחרים את השיטה שמשקפת איך הנכס באמת נשחק.",
    body: (
      <>
        <p>
          <strong>נכס אחד, שלוש חלוקות.</strong> נכס ב-<Money v={100_000} />, בלי ערך גרט, 4 שנים. בשיטת התפוקה הוא צפוי לייצר 100,000 יחידות: 10,000, 30,000, 40,000
          ו-20,000 בשנים 1–4.
        </p>
        <Wide>
          <DataTable
            head={["שנה", "קו ישר", "סכום ספרות (יורד)", "תפוקה"]}
            rows={[
              ["1", 25_000, 40_000, 10_000],
              ["2", 25_000, 30_000, 30_000],
              ["3", 25_000, 20_000, 40_000],
              ["4", 25_000, 10_000, 20_000],
            ]}
            foot={["סה״כ", 100_000, 100_000, 100_000]}
          />
        </Wide>
        <Wide>
          <Sorted
            columns={[
              { title: "קו ישר", tone: "neutral", items: ["נשחק שווה בכל שנה", "מבנה, ריהוט"] },
              { title: "מואץ: יתרה פוחתת, ספרות יורד", tone: "neutral", items: ["מאבד הכי הרבה בהתחלה", "מחשבים, כלי רכב"] },
              { title: "תפוקה", tone: "neutral", items: ["נשחק לפי השימוש", "משאית לפי ק״מ, מכונה לפי שעות"] },
            ]}
          />
        </Wide>
        <Remember>בוחרים שיטה ונשארים איתה. שינוי שיטה הוא שינוי אומדן — מכאן ולהבא (שיעור 8).</Remember>
      </>
    ),
    check: quiz("ppe-why-methods", [
      {
        q: "נכס ב-60,000 ₪, בלי גרט. מה סך הפחת לאורך כל חייו — בקו ישר, ובסכום ספרות השנים?",
        options: ["60,000 ₪ בשתיהן", "יותר בסכום ספרות", "יותר בקו ישר", "תלוי במספר השנים"],
        answer: 0,
        why: "כל שיטה מפחיתה את כל הסכום בר-הפחת. רק החלוקה בין השנים שונה.",
      },
    ]),
  },
  "ppe-which-method": {
    lead: "השאלה כמעט תמיד אומרת באיזו שיטה לחשב — לפעמים במילים, ולפעמים רק דרך הנתונים שהיא נותנת. השיטה קובעת אילו נתונים נכנסים לחישוב.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["מה כתוב בשאלה", "השיטה", "הנוסחה"]}
            rows={[
              ["״X שנים״, ״X% לשנה״ — בלי מילה נוספת", "קו ישר", "(עלות − גרט) ÷ שנים, או עלות × שיעור"],
              ["״יתרה פוחתת״, ״שיעור קבוע על היתרה״", "יתרה פוחתת", "שיעור × עלות מופחתת בתחילת השנה"],
              ["״סכום ספרות השנים״, ״פחת יורד (או עולה) מדי שנה״", "סכום ספרות", "(עלות − גרט) × מונה ÷ סכום הספרות"],
              ["״ק״מ״, ״שעות עבודה״, ״יחידות״, ״תפוקה צפויה״", "תפוקה", "(עלות − גרט) × תפוקת השנה ÷ תפוקה כוללת"],
            ]}
          />
        </Wide>
        <Remember>נתון שהשיטה לא צריכה — לא נכנס לחישוב. בשיטת התפוקה, למשל, תאריך הכניסה ואורך החיים בשנים לא משנים את הפחת: רק התפוקה.</Remember>
      </>
    ),
    check: quiz("ppe-which-method", [
      {
        q: "״המכונה צפויה לעבוד 20,000 שעות; השנה עבדה 3,000 שעות.״ באיזו שיטה מחשבים?",
        options: ["תפוקה", "קו ישר", "יתרה פוחתת", "סכום ספרות"],
        answer: 0,
        why: "שעות עבודה הן מדד תפוקה.",
      },
      {
        q: "״הפחת מחושב בשיעור של 30% מהערך בספרים בתחילת כל שנה.״ איזו שיטה?",
        options: ["יתרה פוחתת", "קו ישר", "סכום ספרות", "תפוקה"],
        answer: 0,
        why: "שיעור קבוע על ערך שהולך וקטן — יתרה פוחתת.",
      },
      {
        q: "״רכב, 25% לשנה.״ איזו שיטה?",
        options: ["קו ישר: 25% מהעלות בכל שנה", "יתרה פוחתת", "סכום ספרות", "אי אפשר לדעת"],
        answer: 0,
        why: "שיעור בלי מילה נוספת — קו ישר על העלות: 4 שנים.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 7
  "ppe-sale-bakery": {
    lead: `ב-1.${VAN_SALE.month}.${VAN_SALE.year} המאפייה מוכרת את המשאית. הסדר כמו תמיד: קודם פחת עד יום המכירה, אחר כך העלות המופחתת מול התמורה — והשורה של המשאית יוצאת מהטבלה.`,
    body: (
      <>
        <p>
          <strong>{`המשאית נמכרת ב-${n(VAN_SALE.proceeds)} ₪.`}</strong> עלות <Money v={VAN.cost} />, {VAN.rate * 100}% לשנה מ-1.{VAN.readyMonth}.{VAN.from} — אותה משאית
          משיעור 4.
        </p>
        <Wide>
          <AssetSheet caption="משאית — עד המכירה" rows={vanSaleSheet} mark={vanSaleSheet.length - 2} />
        </Wide>
        <Wide>
          <Reveal
            steps={keyed([
              <>
                פחת עד יום המכירה — {VAN_SALE_MONTHS} חודשים ב-{VAN_SALE.year}: <Money v={VAN_ANNUAL} plain /> × {VAN_SALE_MONTHS}/12 = <Money v={VAN_SALE_CHARGE} />.
              </>,
              <>
                פחת נצבר ביום המכירה: <Money v={VAN_ACCUM_AT_SALE} />. עלות מופחתת: <Money v={VAN.cost} plain /> − <Money v={VAN_ACCUM_AT_SALE} plain /> = <Money v={VAN_CARRYING_AT_SALE} />.
              </>,
              <>
                תמורה מול עלות מופחתת: <Money v={VAN_SALE.proceeds} plain /> − <Money v={VAN_CARRYING_AT_SALE} plain /> = <Money v={VAN_SALE_RESULT} /> — {VAN_SALE_RESULT < 0 ? "הפסד הון" : "רווח הון"}.
              </>,
            ])}
          />
        </Wide>
        <Wide className="grid gap-3 md:grid-cols-2">
          <JE
            entry={{ id: "1", date: `1.${VAN_SALE.month}.${VAN_SALE.year}`, text: "פחת עד יום המכירה", lines: [{ account: "הוצאות פחת", dr: VAN_SALE_CHARGE }, { account: "פחת נצבר", cr: VAN_SALE_CHARGE }] }}
            note="קודם מעדכנים את הפחת — אחרת העלות המופחתת היא של יום אחר."
          />
          <JE
            entry={{
              id: "2",
              date: `1.${VAN_SALE.month}.${VAN_SALE.year}`,
              text: "המכירה",
              lines: [
                { account: "מזומן", dr: VAN_SALE.proceeds },
                { account: "פחת נצבר", dr: VAN_ACCUM_AT_SALE },
                VAN_SALE_RESULT < 0 ? { account: "הפסד הון", dr: -VAN_SALE_RESULT } : { account: "רווח הון", cr: VAN_SALE_RESULT },
                { account: "כלי רכב", cr: VAN.cost },
              ],
            }}
            note="העלות והפחת הנצבר יוצאים יחד — המשאית כבר לא בספרים."
          />
        </Wide>
      </>
    ),
    check: quiz("ppe-sale-bakery", [
      {
        q: `אילו המשאית הייתה נמכרת ב-${n(VAN_CARRYING_AT_SALE + 5_000)} ₪ באותו יום — מה התוצאה?`,
        options: ["רווח הון של 5,000 ₪", `רווח של ${n(VAN_CARRYING_AT_SALE + 5_000)} ₪`, "הפסד הון של 5,000 ₪", "אין רווח ואין הפסד"],
        answer: 0,
        why: `${n(VAN_CARRYING_AT_SALE + 5_000)} − ${n(VAN_CARRYING_AT_SALE)} = 5,000 — תמורה גבוהה מהעלות המופחתת.`,
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 8
  "ppe-upgrade-bakery": {
    lead: `ב-1.1.${UPGRADE.year} המאפייה משדרגת את התנור: השדרוג מגדיל את התפוקה, ולכן נכנס לעלות. בטבלה עובר קו — מעליו לא נוגעים בכלום; מתחתיו בסיס חדש, ופחת חדש על השנים שנותרו.`,
    body: (
      <>
        <p>
          <strong>{`שדרוג ב-${n(UPGRADE.cost)} ₪.`}</strong> אחרי {UPGRADE_YEARS} שנים. מיום השדרוג נותרו לתנור {UPGRADE.lifeLeft} שנים (במקום {OVEN.life - UPGRADE_YEARS}),
          וערך הגרט נשאר <Money v={OVEN.salvage} />.
        </p>
        <Wide>
          <AssetSheet caption="תנור — לפני השדרוג ואחריו" rows={upgradeSheet} mark={UPGRADE_YEARS} />
        </Wide>
        <Wide>
          <Reveal
            steps={keyed([
              <>
                עלות מופחתת ביום השדרוג: <Money v={OVEN_BEFORE_UPGRADE} />. השורות מעל הקו נשארות כפי שהן.
              </>,
              <>
                בסיס חדש: <Money v={OVEN_BEFORE_UPGRADE} plain /> + <Money v={UPGRADE.cost} plain /> = <Money v={UPGRADE_BASE} />.
              </>,
              <>
                פחת חדש: (<Money v={UPGRADE_BASE} plain /> − <Money v={OVEN.salvage} plain />) ÷ {UPGRADE.lifeLeft} = <Money v={UPGRADE_ANNUAL} /> לשנה.
              </>,
            ])}
          />
        </Wide>
        <JE entry={{ id: "1", date: `1.1.${UPGRADE.year}`, text: "השדרוג", lines: [{ account: "מכונה", dr: UPGRADE.cost }, { account: "מזומן", cr: UPGRADE.cost }] }} note="השדרוג נכנס לעלות — לא להוצאות." />
        <Remember>זה אותו רעיון כמו שינוי אומדן: לא מתקנים את העבר, ומפחיתים את מה שנשאר על השנים שנותרו. ההבדל היחיד — לבסיס נוסף כסף.</Remember>
      </>
    ),
    check: quiz("ppe-upgrade-bakery", [
      {
        q: "אחרי השדרוג — האם מתקנים את הפחת של השנים שלפניו?",
        options: ["לא — מכאן ולהבא", "כן — מחשבים הכול מחדש מהקנייה", "רק את השנה האחרונה", "רק אם אורך החיים השתנה"],
        answer: 0,
        why: "השדרוג משנה רק את מה שאחריו: בסיס חדש, ופחת חדש על השנים שנותרו.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 9
  "ppe-swap-is-sale": {
    lead: "החלפת נכס היא שתי עסקאות שקורות באותו יום: מכירה של הנכס הישן וקנייה של החדש. את שתיהן כבר יודעים לרשום — רק מחברים אותן לפקודה אחת.",
    body: (
      <>
        <p>
          <strong>המשאית של המאפייה — הפעם בהחלפה.</strong> במקום למכור את המשאית ב-1.{VAN_SALE.month}.{VAN_SALE.year} תמורת מזומן, המאפייה מוסרת אותה לסוכנות (שוויה
          ההוגן <Money v={VAN_SWAP.fairValue} />), משלמת עוד <Money v={VAN_SWAP.cashPaid} />, ומקבלת משאית חדשה. לעסקה יש מהות מסחרית.
        </p>
        <Wide className="grid gap-3 md:grid-cols-2">
          <JE
            title="1 · כאילו מכרנו את הישנה בשווי ההוגן"
            entry={{
              id: "1",
              text: "מכירה",
              lines: [
                { account: "מזומן (כאילו)", dr: VAN_SWAP.fairValue },
                { account: "פחת נצבר", dr: VAN_ACCUM_AT_SALE },
                { account: "הפסד הון", dr: VAN_CARRYING_AT_SALE - VAN_SWAP.fairValue },
                { account: "כלי רכב — ישן", cr: VAN.cost },
              ],
            }}
            note="בדיוק כמו בשיעור 7."
          />
          <JE
            title="2 · וקנינו את החדשה בשווי + המזומן"
            entry={{ id: "2", text: "קנייה", lines: [{ account: "כלי רכב — חדש", dr: NEW_VAN_COST }, { account: "מזומן", cr: NEW_VAN_COST }] }}
            note="בדיוק כמו בשיעור 2."
          />
        </Wide>
        <JE
          title="1 + 2 · הפקודה האחת: ה״מזומן כאילו״ מתקזז"
          entry={{
            id: "3",
            text: "ההחלפה",
            lines: [
              { account: "כלי רכב — חדש", dr: NEW_VAN_COST },
              { account: "פחת נצבר", dr: VAN_ACCUM_AT_SALE },
              { account: "הפסד הון", dr: VAN_CARRYING_AT_SALE - VAN_SWAP.fairValue },
              { account: "כלי רכב — ישן", cr: VAN.cost },
              { account: "מזומן", cr: VAN_SWAP.cashPaid },
            ],
          }}
          note={`עלות המשאית החדשה: ${n(VAN_SWAP.fairValue)} + ${n(VAN_SWAP.cashPaid)} = ${n(NEW_VAN_COST)} ₪.`}
        />
        <Remember>כך כשיש מהות מסחרית ושווי הוגן מהימן. בלעדיהם — מודדים לפי העלות המופחתת, בלי רווח או הפסד (המסך הבא).</Remember>
      </>
    ),
    check: quiz("ppe-swap-is-sale", [
      {
        q: "בהחלפה עם מהות מסחרית — ממה מורכבת עלות הנכס החדש?",
        options: ["השווי ההוגן של מה שנמסר + המזומן ששולם", "העלות המופחתת של הישן", "העלות המקורית של הישן", "רק המזומן ששולם"],
        answer: 0,
        why: "כאילו מכרנו את הישן בשוויו ההוגן, והשתמשנו בכסף — ועוד המזומן — כדי לקנות את החדש.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 12
  "ppe-bakery-all": {
    lead: `כל מה שקרה לנכסים של ${BAKERY} — בטבלה אחת, ומשם לדוחות של ${YEAR_2026.year}. זו הטבלה שבניתם מאז שיעור 3: שאלת מבחן היא אותה טבלה, עם עוד נכסים ועוד אירועים.`,
    body: (
      <>
        <Wide>
          <ChainChips items={["שיעור 2: עלות", "שיעור 3: הטבלה", "שיעור 4: שנה חלקית וקרקע", "שיעור 7: מכירה", `${YEAR_2026.year}: הדוחות`]} />
        </Wide>
        <Wide>
          <DataTable
            caption={`הנכסים ב-31.12.${YEAR_2026.year}`}
            head={["נכס", "עלות", `הוצאות פחת ${YEAR_2026.year}`, "פחת נצבר", "עלות מופחתת"]}
            rows={[
              ["תנור", OVEN.cost, YEAR_2026.charges.oven, YEAR_2026.oven.accumulated, YEAR_2026.oven.carrying],
              ["מבנה", BUILDING_COST, YEAR_2026.charges.building, YEAR_2026.building.accumulated, YEAR_2026.building.carrying],
              ["קרקע", LAND_COST, "—", "—", LAND_COST],
              [`משאית (נמכרה ב-1.${VAN_SALE.month})`, "—", YEAR_2026.charges.van, "—", "—"],
            ]}
            foot={[
              "סה״כ",
              OVEN.cost + BUILDING_COST + LAND_COST,
              YEAR_2026.totalCharge,
              YEAR_2026.oven.accumulated + YEAR_2026.building.accumulated,
              YEAR_2026.oven.carrying + YEAR_2026.building.carrying + LAND_COST,
            ]}
          />
        </Wide>
        <Wide>
          <PpeNote />
        </Wide>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Statement
            title={`רווח והפסד לשנת ${YEAR_2026.year} (קטע)`}
            rows={[
              { label: "הוצאות פחת", values: [-YEAR_2026.totalCharge] },
              { label: VAN_SALE_RESULT < 0 ? "הפסד הון ממכירת המשאית" : "רווח הון ממכירת המשאית", values: [VAN_SALE_RESULT] },
              { label: "השפעה על הרווח", values: [VAN_SALE_RESULT - YEAR_2026.totalCharge], kind: "total" },
            ]}
          />
          <Statement
            title={`מאזן ליום 31.12.${YEAR_2026.year} (קטע)`}
            rows={[
              { label: "רכוש קבוע", kind: "heading" },
              { label: "עלות", values: [OVEN.cost + BUILDING_COST + LAND_COST] },
              { label: "בניכוי פחת נצבר", values: [-(YEAR_2026.oven.accumulated + YEAR_2026.building.accumulated)] },
              { label: "עלות מופחתת", values: [YEAR_2026.oven.carrying + YEAR_2026.building.carrying + LAND_COST], kind: "total" },
            ]}
          />
        </Wide>
        <Deeper title="מאיפה כל מספר?">
          <p>
            תנור: <Money v={OVEN_ANNUAL} /> בשנה מ-{OVEN.from}. מבנה: <Money v={BUILDING_COST} /> (מתוך <Money v={PREMISES.total} />, אחרי הפרדת הקרקע) ÷ {PREMISES.life} = <Money v={BUILDING_ANNUAL} /> בשנה. קרקע — בלי פחת.
          </p>
          <p>
            משאית: פחת עד יום המכירה בלבד — <Money v={VAN_SALE_CHARGE} />; ובסוף השנה היא כבר לא במאזן.
          </p>
        </Deeper>
      </>
    ),
    check: quiz("ppe-bakery-all", [
      {
        q: `למה המשאית לא מופיעה במאזן ליום 31.12.${YEAR_2026.year}, אבל הפחת שלה כן מופיע ברווח והפסד?`,
        options: ["היא נמכרה במהלך השנה: עד המכירה היא עבדה והופחתה, ואחריה יצאה מהספרים", "שכחו לרשום אותה", "כלי רכב לא מופיעים במאזן", "הפחת שלה שייך לשנה הבאה"],
        answer: 0,
        why: "רווח והפסד מודד את כל השנה — כולל החודשים שבהם המשאית עוד עבדה. המאזן הוא תמונה של 31.12.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 13
  "ppe-unk-method": {
    lead: "כל נעלם הוא חלק מחישוב רגיל. כותבים את החישוב קדימה, ממלאים את מה שנתון — ונשארת תיבה אחת ריקה: משוואה אחת עם נעלם אחד.",
    body: (
      <>
        <Wide>
          <ChainChips items={["כותבים את החישוב הרגיל קדימה", "ממלאים כל מה שנתון", "פותרים את התיבה הריקה"]} />
        </Wide>
        <p>
          <strong>דוגמה.</strong> מכונה בעלות <Money v={UNK_LIFE.cost} /> נכנסה לשימוש ב-1.{UNK_LIFE.readyMonth}.{UNK_LIFE.from}, קו ישר, בלי גרט. ב-31.12.{UNK_LIFE.to} הפחת
          הנצבר <Money v={UNK_LIFE.accumulated} />. מה אורך החיים?
        </p>
        <Wide>
          <Chain
            boxes={[
              { label: "עלות", value: n(UNK_LIFE.cost) },
              { label: "÷ שנות חיים", unknown: true },
              { label: "= פחת שנתי", value: "…" },
              { label: "× חודשים/12", value: `${unkLifeMonths} ח׳` },
              { label: "= פחת נצבר", value: n(UNK_LIFE.accumulated) },
            ]}
          />
        </Wide>
        <Wide>
          <Reveal
            steps={keyed([
              <>החישוב קדימה: עלות ÷ שנים = פחת שנתי; פחת שנתי × חודשים/12 = פחת נצבר.</>,
              <>
                ממלאים מהסוף: פחת שנתי = <Money v={UNK_LIFE.accumulated} plain /> ÷ {unkLifeMonths} × 12 = <Money v={unkLifeAnnual} />.
              </>,
              <>
                ועכשיו התיבה הריקה: שנות חיים = <Money v={UNK_LIFE.cost} plain /> ÷ <Money v={unkLifeAnnual} plain /> = <strong>{n(unkLife)} שנים</strong>.
              </>,
            ])}
          />
        </Wide>
        <Remember>לא מנחשים ולא מחפשים נוסחה הפוכה בעל-פה: כותבים את מה שכבר יודעים לחשב — והנעלם נגלה לבד.</Remember>
      </>
    ),
    check: quiz("ppe-unk-method", [
      {
        q: "שאלה נותנת עלות מופחתת ומבקשת עלות. מה כותבים קודם?",
        options: ["עלות − פחת נצבר = עלות מופחתת", "עלות = עלות מופחתת", "עלות מופחתת × שנות חיים", "עלות מופחתת ÷ פחת שנתי"],
        answer: 0,
        why: "כותבים את החישוב הרגיל של המספר שנתון — ומשם מחלצים.",
      },
    ]),
  },
  "ppe-unk-dep": {
    lead: "בפחת עצמו יש ארבעה נעלמים אפשריים: עלות, ערך גרט, אורך חיים ותאריך. כולם יוצאים מאותה נוסחה: פחת שנתי = (עלות − גרט) ÷ חיים, ובשנה חלקית × חודשים/12.",
    body: (
      <>
        <Titled title={`ערך גרט: מכונה ב-${n(UNK_SALVAGE.cost)} ₪, ${UNK_SALVAGE.life} שנים, פחת שנתי ${n(UNK_SALVAGE.annual)} ₪`}>
          <Chain
            boxes={[
              { label: "עלות", value: n(UNK_SALVAGE.cost) },
              { label: "− גרט", unknown: true },
              { label: `÷ ${UNK_SALVAGE.life} שנים`, value: UNK_SALVAGE.life },
              { label: "= פחת שנתי", value: n(UNK_SALVAGE.annual) },
            ]}
          />
          <p>
            עלות − גרט = <Money v={UNK_SALVAGE.annual} plain /> × {UNK_SALVAGE.life} = <Money v={UNK_SALVAGE.annual * UNK_SALVAGE.life} />; גרט = <Money v={UNK_SALVAGE.cost} plain /> − <Money v={UNK_SALVAGE.annual * UNK_SALVAGE.life} plain /> = <strong><Money v={unkSalvage} /></strong>.
          </p>
        </Titled>
        <Wide>
          <DataTable
            head={["חסר", "נתון", "חילוץ"]}
            rows={[
              ["עלות", "פחת שנתי, חיים, גרט", "פחת × חיים + גרט"],
              ["ערך גרט", "עלות, פחת שנתי, חיים", "עלות − פחת × חיים"],
              ["אורך חיים", "עלות, פחת נצבר, תאריכים", "פחת שנתי מהנצבר, ואז (עלות − גרט) ÷ פחת שנתי"],
              ["תאריך כניסה", "פחת השנה, פחת שנתי", "חודשים = פחת השנה ÷ פחת שנתי × 12"],
            ]}
          />
        </Wide>
        <Remember>כשיש תאריכים — סופרים חודשים, לא שנות כספים. מ-1.7.2023 עד 31.12.2025: 30 חודשים, לא 3 שנים.</Remember>
      </>
    ),
    check: quiz("ppe-unk-dep", [
      {
        q: "פחת שנתי 18,000 ₪, 5 שנים, ערך גרט 10,000 ₪. מה העלות?",
        options: ["100,000 ₪", "90,000 ₪", "80,000 ₪", "108,000 ₪"],
        answer: 0,
        why: "18,000 × 5 = 90,000 — זה הסכום בר-הפחת. מוסיפים את הגרט: 100,000.",
      },
    ]),
  },
  "ppe-unk-methods": {
    lead: "גם בשיטות האחרות — כותבים את הנוסחה של השיטה, ומחלצים. ביתרה פוחתת היחס בין שתי שנים עוקבות מגלה את השיעור; בסכום ספרות המונה והמכנה ידועים — חסר רק הסכום בר-הפחת.",
    body: (
      <>
        <Titled title={`סכום ספרות: עלות ${n(UNK_SYD.cost)} ₪, ${UNK_SYD.life} שנים, פחת שנה 1 — ${n(UNK_SYD.first)} ₪. מה הגרט?`}>
          <Chain
            boxes={[
              { label: "(עלות − גרט)", unknown: true },
              { label: "× מונה/סכום ספרות", value: <bdi dir="ltr">{`${UNK_SYD.life}/${unkSydDigits}`}</bdi> },
              { label: "= פחת שנה 1", value: n(UNK_SYD.first) },
            ]}
          />
          <p>
            עלות − גרט = <Money v={UNK_SYD.first} plain /> × {unkSydDigits}/{UNK_SYD.life} = <Money v={unkSydBase} />; גרט = <Money v={UNK_SYD.cost} plain /> − <Money v={unkSydBase} plain /> = <strong><Money v={unkSydSalvage} /></strong>.
          </p>
        </Titled>
        <Titled title={`יתרה פוחתת: פחת שנה 1 — ${n(DB_BACK.first)} ₪, שנה 2 — ${n(DB_BACK.second)} ₪`}>
          <p>
            שנה 2 = שנה 1 × (1 − שיעור), ולכן 1 − שיעור = <Money v={DB_BACK.second} plain /> ÷ <Money v={DB_BACK.first} plain /> = {n(DB_BACK.second / DB_BACK.first)}: השיעור {n(((DB_BACK.first - DB_BACK.second) / DB_BACK.first) * 100)}%, והעלות{" "}
            <Money v={DB_BACK.first} plain /> ÷ {n(((DB_BACK.first - DB_BACK.second) / DB_BACK.first) * 100)}% = <Money v={(DB_BACK.first * DB_BACK.first) / (DB_BACK.first - DB_BACK.second)} />.
          </p>
        </Titled>
        <Titled title={`תפוקה: ${n(UNITS_BACK.charge)} ₪ פחת על ${n(UNITS_BACK.km)} ק״מ`}>
          <p>
            פחת לק״מ = <Money v={UNITS_BACK.charge} plain /> ÷ <Money v={UNITS_BACK.km} plain /> = <Money v={UNITS_BACK.charge / UNITS_BACK.km} />. מכאן אפשר לחלץ גם את הסכום בר-הפחת (× סך הק״מ), וממנו — עלות או גרט.
          </p>
        </Titled>
      </>
    ),
    check: quiz("ppe-unk-methods", [
      {
        q: "ביתרה פוחתת, פחת שנה 1 — 30,000 ₪ ושנה 2 — 21,000 ₪. מה השיעור?",
        options: ["30%", "70%", "21%", "9%"],
        answer: 0,
        why: "21,000 ÷ 30,000 = 0.7 = 1 − שיעור. השיעור: 30%.",
      },
    ]),
  },
  "ppe-unk-events": {
    lead: "באירועים, הנעלם מסתתר מאחורי רווח או פחת חדש. רווח = שווי (או תמורה) − עלות מופחתת; פחת חדש = בסיס חדש ÷ שנים שנותרו. מהם מחלצים תמורה, שווי הוגן או עלות שיפוץ.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["אירוע", "הנוסחה קדימה", "מה בדרך כלל חסר"]}
            rows={[
              ["מכירה", "תמורה − עלות מופחתת = רווח (או הפסד)", "תמורה, או פחת נצבר ביום המכירה"],
              ["החלפה", "שווי הוגן − עלות מופחתת = רווח; שווי + מזומן = עלות החדש", "שווי הוגן, עלות הנכס החדש"],
              ["שיפוץ", "(עלות מופחתת + שיפוץ − גרט) ÷ שנים שנותרו = פחת חדש", "עלות השיפוץ, השנים שנותרו"],
            ]}
          />
        </Wide>
        <Titled title={`החלפה: עלות מופחתת ${n(UNK_SWAP.carrying)} ₪, שולמו ${n(UNK_SWAP.cashPaid)} ₪, רווח ${n(UNK_SWAP.gain)} ₪`}>
          <Chain
            boxes={[
              { label: "שווי הוגן", unknown: true },
              { label: "− עלות מופחתת", value: n(UNK_SWAP.carrying) },
              { label: "= רווח", value: n(UNK_SWAP.gain) },
            ]}
          />
          <p>
            שווי הוגן = <Money v={UNK_SWAP.carrying} plain /> + <Money v={UNK_SWAP.gain} plain /> = <Money v={unkSwapFair} />; עלות הנכס החדש = <Money v={unkSwapFair} plain /> + <Money v={UNK_SWAP.cashPaid} plain /> = <strong><Money v={unkSwapCost} /></strong>.
          </p>
        </Titled>
        <Titled title={`שיפוץ: עלות מופחתת ${n(UNK_RENO.carrying)} ₪, אחריו ${n(UNK_RENO.annual)} ₪ לשנה על ${UNK_RENO.lifeLeft} שנים`}>
          <Chain
            boxes={[
              { label: "עלות מופחתת", value: n(UNK_RENO.carrying) },
              { label: "+ שיפוץ", unknown: true },
              { label: `÷ ${UNK_RENO.lifeLeft} שנים`, value: UNK_RENO.lifeLeft },
              { label: "= פחת חדש", value: n(UNK_RENO.annual) },
            ]}
          />
          <p>
            בסיס חדש = <Money v={UNK_RENO.annual} plain /> × {UNK_RENO.lifeLeft} = <Money v={unkRenoBase} />; שיפוץ = <Money v={unkRenoBase} plain /> − <Money v={UNK_RENO.carrying} plain /> = <strong><Money v={unkReno} /></strong>.
          </p>
        </Titled>
      </>
    ),
    check: quiz("ppe-unk-events", [
      {
        q: "עלות מופחתת ביום המכירה 30,000 ₪, ונרשם הפסד הון של 4,000 ₪. מה הייתה התמורה?",
        options: ["26,000 ₪", "34,000 ₪", "30,000 ₪", "4,000 ₪"],
        answer: 0,
        why: "הפסד — התמורה נמוכה מהעלות המופחתת: 30,000 − 4,000.",
      },
    ]),
  },
  "ppe-unk-reval": {
    lead: "בהערכה מחדש, הפחת שאחרי ההערכה מגלה את השווי ההוגן: שווי הוגן ÷ שנים שנותרו = פחת חדש. ובקרקע — הקרן וההפסד יחד מגלים כמה ירד השווי.",
    body: (
      <>
        <Titled title={`מבנה: עלות מופחתת לפני ההערכה ${n(UNK_REVAL.carrying)} ₪; אחריה ${n(UNK_REVAL.annual)} ₪ לשנה על ${UNK_REVAL.lifeLeft} שנים`}>
          <Chain
            boxes={[
              { label: "שווי הוגן", unknown: true },
              { label: `÷ ${UNK_REVAL.lifeLeft} שנים`, value: UNK_REVAL.lifeLeft },
              { label: "= פחת חדש", value: n(UNK_REVAL.annual) },
            ]}
          />
          <p>
            שווי הוגן = <Money v={UNK_REVAL.annual} plain /> × {UNK_REVAL.lifeLeft} = <Money v={unkRevalFair} />; עלייה ראשונה — כולה לקרן: <Money v={unkRevalFair} plain /> − <Money v={UNK_REVAL.carrying} plain /> = <strong><Money v={unkRevalSurplus} /></strong>.
          </p>
        </Titled>
        <Titled title={`קרקע: קרן ${n(UNK_LAND.surplus)} ₪, ירדה ל-${n(UNK_LAND.after)} ₪, הפסד ${n(UNK_LAND.loss)} ₪`}>
          <p>
            נרשם הפסד — ולכן הקרן נוצלה כולה קודם. הירידה: <Money v={UNK_LAND.surplus} plain /> + <Money v={UNK_LAND.loss} plain /> = <Money v={UNK_LAND.surplus + UNK_LAND.loss} />; השווי הקודם: <Money v={UNK_LAND.after} plain /> + <Money v={UNK_LAND.surplus + UNK_LAND.loss} plain /> ={" "}
            <strong><Money v={unkLandBefore} /></strong>.
          </p>
        </Titled>
        <Remember>אם יש גרט אחרי ההערכה — מוסיפים אותו: שווי הוגן = פחת חדש × שנים שנותרו + גרט.</Remember>
      </>
    ),
    check: quiz("ppe-unk-reval", [
      {
        q: "אחרי הערכה, מבנה מופחת 15,000 ₪ לשנה על 30 השנים שנותרו (בלי גרט). מה השווי ההוגן?",
        options: ["450,000 ₪", "15,000 ₪", "30,000 ₪", "500,000 ₪"],
        answer: 0,
        why: "15,000 × 30 = 450,000.",
      },
    ]),
  },
  "ppe-unk-two": {
    lead: "בשאלות הקשות נעלם אחד מוביל לנעלם הבא. פותרים אחד, מכניסים אותו כנתון — וממשיכים לחישוב הבא.",
    body: (
      <>
        <p>
          <strong>המשאית של המאפייה — מהסוף להתחלה.</strong> עלות <Money v={VAN.cost} />, {VAN.rate * 100}% לשנה, בלי גרט. נמכרה ב-1.{VAN_SALE.month}.{VAN_SALE.year} ב-
          <Money v={VAN_SALE.proceeds} />, ונרשם הפסד הון של <Money v={-VAN_SALE_RESULT} />. כמה חודשים היא הופחתה?
        </p>
        <Wide className="space-y-2">
          <Chain
            boxes={[
              { label: "תמורה", value: n(VAN_SALE.proceeds) },
              { label: "− עלות מופחתת", unknown: true },
              { label: "= הפסד", value: n(VAN_SALE_RESULT) },
            ]}
          />
          <Chain
            boxes={[
              { label: "עלות", value: n(VAN.cost) },
              { label: "− פחת נצבר", unknown: true },
              { label: "= עלות מופחתת", value: n(unkTwoCarrying) },
            ]}
          />
          <Chain
            boxes={[
              { label: "פחת שנתי", value: n(VAN_ANNUAL) },
              { label: "× חודשים/12", unknown: true },
              { label: "= פחת נצבר", value: n(unkTwoAccum) },
            ]}
          />
        </Wide>
        <Wide>
          <Reveal
            steps={keyed([
              <>
                נעלם 1: עלות מופחתת = <Money v={VAN_SALE.proceeds} plain /> + <Money v={-VAN_SALE_RESULT} plain /> = <Money v={unkTwoCarrying} />.
              </>,
              <>
                נעלם 2: פחת נצבר = <Money v={VAN.cost} plain /> − <Money v={unkTwoCarrying} plain /> = <Money v={unkTwoAccum} />.
              </>,
              <>
                נעלם 3: חודשים = <Money v={unkTwoAccum} plain /> ÷ <Money v={VAN_ANNUAL} plain /> × 12 = <strong>{n(unkTwoMonths)}</strong> — מ-1.{VAN.readyMonth}.{VAN.from}, בדיוק כמו בשיעור 4.
              </>,
            ])}
          />
        </Wide>
        <Remember>כל שורה היא חישוב שכבר מכירים. הקושי בשאלה כזו הוא רק הסדר — ולכן כותבים את כל השרשראות לפני שמתחילים לחשב.</Remember>
      </>
    ),
    check: quiz("ppe-unk-two", [
      {
        q: "מכונה בעלות 100,000 ₪, 10% לשנה, נמכרה ב-50,000 ₪ ברווח של 5,000 ₪. כמה שנים היא הופחתה?",
        options: ["5.5", "5", "4.5", "6"],
        answer: 0,
        why: "עלות מופחתת 45,000; פחת נצבר 55,000; ÷ 10,000 לשנה = 5.5 שנים.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 14
  "ppe-shaked": {
    lead: "שאלה שלישית, שבה חלק מהנתונים חבויים בתוצאות. כתבו לכל נעלם את השרשרת שלו, ופתרו על דף — לפני שאתם פותחים את הפתרון.",
    body: (
      <>
        <Titled title="שקד תעשיות בע״מ — רכוש קבוע, 2026">
          <ol className="list-inside list-decimal space-y-1.5">
            <li>
              מכונה א׳ נקנתה ב-<Money v={SHAKED_Q.machine.cost} /> והייתה זמינה לשימוש ב-1.{SHAKED_Q.machine.readyMonth}.{SHAKED_Q.machine.from}. היא מופחתת בקו ישר, בלי ערך גרט. ב-31.12.2025 הפחת הנצבר שלה <Money v={SHAKED_Q.machine.accumulated2025} />.
            </li>
            <li>
              ב-1.{SHAKED_Q.exchange.month}.{SHAKED_Q.exchange.year} הוחלפה מכונה א׳ במכונה ב׳, בעסקה עם מהות מסחרית. החברה שילמה בנוסף <Money v={SHAKED_Q.exchange.cashPaid} /> במזומן, ורשמה רווח מההחלפה של <Money v={SHAKED_Q.exchange.gain} />. מכונה ב׳ תשמש {SHAKED_Q.exchange.newLife} שנים, בלי ערך גרט.
            </li>
            <li>
              מבנה נקנה ב-1.1.{SHAKED_Q.building.from} ב-<Money v={SHAKED_Q.building.cost} />, ל-{SHAKED_Q.building.life} שנים בלי ערך גרט. החברה מיישמת מודל הערכה מחדש (שיטת האיפוס), ומעבירה את הקרן לעודפים בקצב הפחת. ההערכה הראשונה הייתה ב-31.12.{SHAKED_Q.building.revalued}, והוצאות הפחת של המבנה ב-2026 הן <Money v={SHAKED_Q.building.charge2026} />.
            </li>
          </ol>
        </Titled>
        <Titled title="נדרש">
          <ol className="list-inside list-[hebrew] space-y-1">
            <li>אורך החיים של מכונה א׳.</li>
            <li>השווי ההוגן של מכונה א׳ ביום ההחלפה, ועלות מכונה ב׳.</li>
            <li>השווי ההוגן של המבנה ב-31.12.{SHAKED_Q.building.revalued}, והסכום שנזקף לקרן.</li>
            <li>ההעברה לעודפים ב-2026, ויתרת הקרן ב-31.12.2026.</li>
            <li>סך הוצאות הפחת ב-2026, והרווח מההחלפה — איפה הם בדוחות.</li>
            <li>הצגת מכונה ב׳ והמבנה במאזן ליום 31.12.2026.</li>
          </ol>
        </Titled>
        <Remember>שלושה נעלמים מרכזיים: אורך חיים (מהפחת הנצבר), שווי הוגן של מכונה (מהרווח), ושווי הוגן של מבנה (מהפחת החדש). כל אחד — חישוב רגיל עם תיבה ריקה.</Remember>
      </>
    ),
  },
  "ppe-shaked-solve": {
    lead: "הפתרון, נעלם אחר נעלם: כל אחד מתחיל בחישוב הרגיל, ממלא את מה שנתון, ומחלץ את מה שחסר — ובסוף, הדוחות.",
    body: (
      <>
        <Titled title="א. אורך החיים של מכונה א׳">
          <p>
            מ-1.{SHAKED_Q.machine.readyMonth}.{SHAKED_Q.machine.from} עד 31.12.2025: {S.monthsTo2025} חודשים. פחת שנתי = <Money v={SHAKED_Q.machine.accumulated2025} plain /> ÷ {S.monthsTo2025} × 12 = <Money v={S.annual} />. חיים = <Money v={SHAKED_Q.machine.cost} plain /> ÷{" "}
            <Money v={S.annual} plain /> = <strong>{n(S.life)} שנים</strong>.
          </p>
        </Titled>
        <Titled title="ב. ההחלפה">
          <p>
            פחת 2026 עד ההחלפה: <Money v={S.annual} plain /> × 6/12 = <Money v={S.dep2026Old} />. פחת נצבר: <Money v={S.accumAtExchange} />; עלות מופחתת: <Money v={S.carryingAtExchange} />.
          </p>
          <p>
            שווי הוגן = עלות מופחתת + רווח = <Money v={S.carryingAtExchange} plain /> + <Money v={SHAKED_Q.exchange.gain} plain /> = <strong><Money v={S.fairValue} /></strong>. עלות מכונה ב׳ = <Money v={S.fairValue} plain /> + <Money v={SHAKED_Q.exchange.cashPaid} plain /> = <strong><Money v={S.newCost} /></strong>.
          </p>
          <JE
            entry={{
              id: "1",
              date: `1.${SHAKED_Q.exchange.month}.${SHAKED_Q.exchange.year}`,
              text: "ההחלפה",
              lines: [
                { account: "מכונה ב׳", dr: S.newCost },
                { account: "פחת נצבר", dr: S.accumAtExchange },
                { account: "מכונה א׳", cr: SHAKED_Q.machine.cost },
                { account: "מזומן", cr: SHAKED_Q.exchange.cashPaid },
                { account: "רווח מהחלפת נכסים", cr: SHAKED_Q.exchange.gain },
              ],
            }}
            note={null}
          />
          <p>
            פחת מכונה ב׳ ב-2026: <Money v={S.newCost} plain /> ÷ {SHAKED_Q.exchange.newLife} × 6/12 = <Money v={S.dep2026New} />.
          </p>
        </Titled>
        <Titled title="ג–ד. המבנה">
          <p>
            לפי עלות: <Money v={S.costAnnual} /> לשנה; עד 31.12.{SHAKED_Q.building.revalued} — {S.yearsToRevaluation} שנים, ועלות מופחתת <Money v={S.carryingAtRevaluation} />. נותרו {S.lifeLeft} שנים.
          </p>
          <p>
            שווי הוגן = פחת חדש × שנים שנותרו = <Money v={SHAKED_Q.building.charge2026} plain /> × {S.lifeLeft} = <strong><Money v={S.fair} /></strong>. לקרן: <Money v={S.fair} plain /> − <Money v={S.carryingAtRevaluation} plain /> = <strong><Money v={S.surplus} /></strong>.
          </p>
          <p>
            העברה לעודפים ב-2026: <Money v={SHAKED_Q.building.charge2026} plain /> − <Money v={S.costAnnual} plain /> = <Money v={S.transfer2026} />. יתרת הקרן ב-31.12.2026: <Money v={S.surplus2026} />.
          </p>
        </Titled>
        <Titled title="ה–ו. הדוחות">
          <DataTable
            head={["רווח והפסד 2026", "₪"]}
            rows={[
              ["הוצאות פחת: מכונה א׳ + מכונה ב׳ + מבנה", S.totalDep2026],
              ["רווח מהחלפת נכסים", SHAKED_Q.exchange.gain],
            ]}
          />
          <DataTable
            head={["מאזן 31.12.2026", "עלות / שווי", "פחת נצבר", "עלות מופחתת"]}
            rows={[
              ["מכונה ב׳", S.newCost, S.dep2026New, S.newCarrying2026],
              ["מבנה (משוערך)", S.fair, SHAKED_Q.building.charge2026, S.building2026],
            ]}
          />
          <p className="text-sm text-muted">
            בהון: קרן הערכה מחדש <Money v={S.surplus2026} />. ההעברה לעודפים (<Money v={S.transfer2026} />) — בדוח על השינויים בהון בלבד, לא ברווח והפסד.
          </p>
        </Titled>
      </>
    ),
  },
};
