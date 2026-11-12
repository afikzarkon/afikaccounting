"use client";

import { RotateCcw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { bondRedemption, impairmentViews, inventoryDeferral, type Books, consolidate, excessTable, goodwillCalc, groupPosition, managerReward, meetingShare, partnersToBeat, profitSplit, pvBond, revalue, whole, amortizedCost } from "@/lib/learn/consolidated";
import { drill, DRILL_FAMILIES, type DrillFamily } from "@/lib/study/consolidated/drills";
import { ARMON, NOFAR } from "@/lib/study/consolidated/lessons/worksheet";
import { cn } from "@/lib/utils";
import { ExcessTbl } from "./consolidated-parts";
import { Tbl } from "./ifrs16-parts";

function Amount({ label, value, onChange, step = 10_000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block text-[13.5px] text-muted">
      {label}
      <input type="number" inputMode="decimal" min={0} step={step} value={value} onChange={(e) => onChange(Math.max(0, +e.target.value || 0))} dir="ltr" className="num mt-1 block min-h-11 w-full rounded-lg border border-line-strong bg-surface px-2 text-[15px] text-fg" />
    </label>
  );
}

/** Change a company's figures or the holding, and watch what moves in the consolidated statements: the holding moves only the split. */
export function GroupLab() {
  const [parentAssets, setParentAssets] = useState(1_240_000);
  const [parentLiabilities, setParentLiabilities] = useState(470_000);
  const [subAssets, setSubAssets] = useState(860_000);
  const [subLiabilities, setSubLiabilities] = useState(420_000);
  const [parentProfit, setParentProfit] = useState(176_000);
  const [subProfit, setSubProfit] = useState(64_000);
  const [pct, setPct] = useState(75);
  const holding = pct / 100;
  const g = groupPosition({ parentAssets, parentLiabilities, subAssets, subLiabilities, holding });
  const p = profitSplit({ parentProfit, subProfit, holding });
  return (
    <section aria-label="מעבדה: בונים דוח מאוחד" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <Amount label="האם: נכסים, בלי ההשקעה" value={parentAssets} onChange={setParentAssets} />
        <Amount label="הבת: נכסים" value={subAssets} onChange={setSubAssets} />
        <Amount label="האם: התחייבויות" value={parentLiabilities} onChange={setParentLiabilities} />
        <Amount label="הבת: התחייבויות" value={subLiabilities} onChange={setSubLiabilities} />
        <Amount label="האם: רווח, בלי מה שמהבת" value={parentProfit} onChange={setParentProfit} />
        <Amount label="הבת: רווח" value={subProfit} onChange={setSubProfit} />
      </div>
      <label className="block text-[14px] font-semibold text-fg">
        האם מחזיקה ב־<bdi dir="ltr" className="num">{pct}%</bdi> מהבת
        <input type="range" min={51} max={100} value={pct} onChange={(e) => setPct(+e.target.value)} dir="ltr" className="mt-2 block w-full accent-[var(--color-accent)]" aria-label="שיעור ההחזקה" />
      </label>
      <Tbl
        head={["דוח מאוחד על המצב הכספי", "סכום"]}
        rows={[
          ["נכסים: 100% משתיהן", g.assets],
          ["התחייבויות: 100% משתיהן", g.liabilities],
          ["הון המיוחס לבעלים של האם", g.owners],
          ["זשמ״ש", g.nci],
        ]}
        foot={["בדיקה: סך ההון שווה לנכסים פחות התחייבויות", g.owners + g.nci]}
      />
      <Tbl head={["דוח מאוחד על הרווח", "סכום"]} rows={[["רווח נקי: 100% משתיהן", p.total], ["מתוכו לבעלים של האם", p.owners], ["מתוכו לזשמ״ש", p.nci]]} />
    </section>
  );
}

function Percent({ label, value, onChange, min = 0, max = 100 }: { label: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <label className="block text-[14px] font-semibold text-fg">
      {label}: <bdi dir="ltr" className="num">{value}%</bdi>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} dir="ltr" className="mt-2 block w-full accent-[var(--color-accent)]" aria-label={typeof label === "string" ? label : undefined} />
    </label>
  );
}

/** Move the holding and the attendance, and watch who decides in the room. It calculates; the decision on power weighs more than this. */
export function AttendanceLab() {
  const [holding, setHolding] = useState(42);
  const [attendance, setAttendance] = useState(75);
  const [a, setA] = useState(8);
  const [b, setB] = useState(6);
  const [c, setC] = useState(4);
  const present = Math.max(attendance, holding);
  const m = meetingShare({ holding, attendance: present });
  const others = [a, b, c].filter((v) => v > 0);
  const partners = partnersToBeat(holding, others);
  const share = Math.round(m.share * 10) / 10;
  const verdict = holding > 50 ? { tone: "text-success", text: "יש לו רוב מכלל הקולות, והנוכחות לא משנה." } : m.decides ? { tone: "text-success", text: "יש לו יותר ממחצית הקולות באסיפה. הוא מכריע לבד כל עוד הנוכחות נשארת כזו." } : { tone: "text-danger", text: "אין לו יותר ממחצית הקולות באסיפה. בלי קולות של אחרים הוא לא מעביר החלטה." };
  return (
    <section aria-label="מעבדה: נוכחות ואחוזים" className="card space-y-4 p-4 sm:p-5">
      <Percent label="המשקיע מחזיק" value={holding} onChange={setHolding} min={5} max={60} />
      <Percent label="נוכחים באסיפה, כולל המשקיע" value={present} onChange={setAttendance} min={holding} />
      <div aria-hidden className="flex h-7 overflow-hidden rounded-lg border border-line">
        <div className="bg-accent" style={{ width: `${(holding / present) * 100}%` }} />
        <div className="flex-1 bg-surface-2" />
      </div>
      <Tbl
        head={["בחדר", "אחוז"]}
        rows={[
          ["המשקיע", `${share}%`],
          ["כל שאר הנוכחים", `${Math.round((100 - share) * 10) / 10}%`],
          ["מאיזו נוכחות הוא מאבד את הרוב בחדר", holding * 2 > 100 ? "לעולם לא" : `${m.lostAbove}%`],
        ]}
      />
      <p aria-live="polite" className={cn("text-[15px] font-semibold", verdict.tone)}>{verdict.text}</p>
      <div className="grid grid-cols-3 gap-3">
        <Amount label="בעל מניות א, %" value={a} onChange={setA} step={1} />
        <Amount label="בעל מניות ב, %" value={b} onChange={setB} step={1} />
        <Amount label="בעל מניות ג, %" value={c} onChange={setC} step={1} />
      </div>
      <p className="text-[15px] text-fg">{partners === null ? "גם שלושתם יחד לא מגיעים להחזקה שלו." : partners === 1 ? "מספיק אחד מהם כדי שיהיו לו יותר קולות ממנו." : `צריך ${partners} מהם יחד כדי שיהיו להם יותר קולות ממנו.`}</p>
    </section>
  );
}

/** Move a fund manager's holding and the fund's profit, and see how much of the result reaches the manager. It decides only where a rule decides. */
export function ManagerLab() {
  const [holding, setHolding] = useState(3);
  const [profit, setProfit] = useState(5_000_000);
  const [singleRemover, setSingleRemover] = useState(false);
  const [marketFee, setMarketFee] = useState(true);
  const m = managerReward({ nav: 40_000_000, feeRate: 0.015, profit, hurdle: 1_000_000, perfRate: 0.15, holding: holding / 100 });
  const verdict = singleRemover
    ? { tone: "text-danger", text: "סוכן. צד יחיד שיכול להדיח בלי סיבה מכריע לבדו." }
    : !marketFee
      ? { tone: "text-success", text: "לא יכול להיות סוכן. עם כוח השפעה, הוא שולט." }
      : { tone: "text-fg", text: "אין כלל שמכריע. שוקלים את החשיפה יחד עם הסמכות שלו ועם הזכויות של האחרים." };
  return (
    <section aria-label="מעבדה: כמה מגיע למנהל" className="card space-y-4 p-4 sm:p-5">
      <Percent label="המנהל מחזיק מהקרן" value={holding} onChange={setHolding} max={40} />
      <Amount label="רווח הקרן לפני עמלות" value={profit} onChange={setProfit} step={500_000} />
      <Tbl
        head={["הנכסים נטו 40,000,000. עמלה 1.5%, ו־15% מעל 1,000,000", "סכום"]}
        rows={[
          ["עמלה קבועה", m.fee],
          ["עמלה על ביצועים", m.performance],
          ["החלק במה שנשאר", m.fromHolding],
        ]}
        foot={["סך הכול למנהל", m.total]}
      />
      <p className="text-[15px] font-semibold text-fg">
        {m.left < 0 ? "העמלות גדולות מהרווח, ולכן אחרי העמלות הקרן בהפסד, והמנהל נושא בחלקו." : <>מגיע אליו <bdi dir="ltr" className="num">{Math.round(m.share * 10) / 10}%</bdi> מהרווח</>}
      </p>
      <label className="flex min-h-11 items-center gap-2 text-[15px] text-fg">
        <input type="checkbox" checked={singleRemover} onChange={(e) => setSingleRemover(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
        צד יחיד יכול להדיח אותו בלי סיבה
      </label>
      <label className="flex min-h-11 items-center gap-2 text-[15px] text-fg">
        <input type="checkbox" checked={marketFee} onChange={(e) => setMarketFee(e.target.checked)} className="h-5 w-5 accent-[var(--color-accent)]" />
        התגמול תואם את השירות, ובתנאי שוק
      </label>
      <p aria-live="polite" className={cn("text-[15px] font-semibold", verdict.tone)}>{verdict.text}</p>
    </section>
  );
}

/** Change an item's figures, how much was sold and how long has passed: the table of excess cost builds itself. */
export function ExcessLab() {
  const [invBook, setInvBook] = useState(140_000);
  const [invFair, setInvFair] = useState(155_000);
  const [soldPct, setSoldPct] = useState(60);
  const [eqBook, setEqBook] = useState(300_000);
  const [eqFair, setEqFair] = useState(348_000);
  const [life, setLife] = useState(8);
  const [months, setMonths] = useState(6);
  const [suit, setSuit] = useState(20_000);
  const [tax, setTax] = useState(23);
  const inv = invFair - invBook;
  const eq = eqFair - eqBook;
  const table = excessTable(
    [
      { name: "מלאי", at: inv, end: (inv * (100 - soldPct)) / 100 },
      { name: "ציוד", at: eq, end: eq - (eq * months) / 12 / Math.max(life, 1) },
      { name: "תביעה", at: -suit, end: -suit },
    ],
    tax / 100,
  );
  return (
    <section aria-label="מעבדה: בונים טבלה" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <Amount label="מלאי: בספרים" value={invBook} onChange={setInvBook} />
        <Amount label="מלאי: שווי הוגן" value={invFair} onChange={setInvFair} />
        <Amount label="ציוד: בספרים" value={eqBook} onChange={setEqBook} />
        <Amount label="ציוד: שווי הוגן" value={eqFair} onChange={setEqFair} />
        <Amount label="ציוד: שנות חיים" value={life} onChange={setLife} step={1} />
        <Amount label="תביעה: שווי הוגן" value={suit} onChange={setSuit} />
      </div>
      <Percent label="מהמלאי נמכרו" value={soldPct} onChange={setSoldPct} />
      <label className="block text-[14px] font-semibold text-fg">
        חודשים עד סוף השנה: <bdi dir="ltr" className="num">{months}</bdi>
        <input type="range" min={1} max={12} value={months} onChange={(e) => setMonths(+e.target.value)} dir="ltr" className="mt-2 block w-full accent-[var(--color-accent)]" aria-label="חודשים עד סוף השנה" />
      </label>
      <Percent label="שיעור המס" value={tax} onChange={setTax} max={40} />
      <ExcessTbl table={table} />
    </section>
  );
}

/** Change the deal and switch between the two ways of measuring the minority: what moves, and whose goodwill it is. */
export function GoodwillLab() {
  const [paid, setPaid] = useState(183_000);
  const [prior, setPrior] = useState(24_000);
  const [net, setNet] = useState(202_000);
  const [price, setPrice] = useState(12);
  const [nciShares, setNciShares] = useState(4_000);
  const [pct, setPct] = useState(80);
  const [fairWay, setFairWay] = useState(true);
  const g = goodwillCalc({ paid, prior, holding: pct / 100, net, nciFair: fairWay ? nciShares * price : undefined });
  return (
    <section aria-label="מעבדה: זשמ״ש ומוניטין" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <Amount label="תמורה שהועברה" value={paid} onChange={setPaid} />
        <Amount label="זכויות קודמות, שווי הוגן" value={prior} onChange={setPrior} />
        <Amount label="נמ״נ" value={net} onChange={setNet} />
        <Amount label="מניות של המיעוט" value={nciShares} onChange={setNciShares} step={500} />
        <Amount label="מחיר מניה" value={price} onChange={setPrice} step={1} />
      </div>
      <Percent label="האם מחזיקה אחרי העסקה" value={pct} onChange={setPct} min={51} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="מדידת הזשמ״ש">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" aria-pressed={fairWay === v} onClick={() => setFairWay(v)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", fairWay === v ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {v ? "שווי הוגן" : "חלק בנמ״נ"}
          </button>
        ))}
      </div>
      <Tbl
        head={["", "סכום"]}
        rows={[
          ["זשמ״ש", g.nci],
          ["עלות צירוף העסקים", g.cost],
          ...(g.goodwill < 0
            ? [["רווח מרכישה במחיר הזדמנותי, של הרוכש", -g.goodwill] as [string, number]]
            : ([["מוניטין", g.goodwill], ["מתוכו של בעלי מניות האם", g.ownersGoodwill], ["מתוכו של הזשמ״ש", g.nciGoodwill]] as [string, number][])),
        ]}
      />
    </section>
  );
}

/** Change the deal and the subsidiary's year, starting from Nofar and Armon, and watch what moves in the consolidated statements. The dividend never moves the consolidated profit. */
export function WorksheetLab() {
  const [paid, setPaid] = useState(140_000);
  const [pct, setPct] = useState(75);
  const [fairWay, setFairWay] = useState(true);
  const [nciFair, setNciFair] = useState(40_000);
  const [profit, setProfit] = useState(28_000);
  const [dividend, setDividend] = useState(12_000);
  const [inv, setInv] = useState(12_000);
  const [eq, setEq] = useState(20_000);
  const [life, setLife] = useState(5);
  const holding = pct / 100;
  const dividendIncome = whole(dividend * holding);
  const a: Books = { ...NOFAR, investment: paid, dividendIncome, cash: NOFAR.cash + dividendIncome - NOFAR.dividendIncome - (paid - NOFAR.investment) };
  const b: Books = { ...ARMON, sales: ARMON.sales + profit - 28_000, cash: ARMON.cash + (profit - 28_000) - (dividend - ARMON.dividend), dividend };
  const s = consolidate({
    a,
    b,
    holding,
    paid,
    nciFair: fairWay ? nciFair : undefined,
    excess: [
      { name: "מלאי", row: "מלאי", at: inv, amortized: -inv, line: "cogs" },
      { name: "ציוד", row: "רכוש קבוע", at: eq, amortized: -eq / Math.max(life, 1), line: "admin" },
    ],
    taxRate: 0.25,
  });
  return (
    <section aria-label="מעבדה: דף העבודה" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <Amount label="תמורה ששולמה" value={paid} onChange={setPaid} />
        <Amount label="ערמון: רווח השנה" value={profit} onChange={setProfit} step={2_000} />
        <Amount label="ערמון: דיבידנד שהוכרז" value={dividend} onChange={setDividend} step={2_000} />
        <Amount label="עודף עלות: מלאי, נמכר" value={inv} onChange={setInv} step={2_000} />
        <Amount label="עודף עלות: ציוד" value={eq} onChange={setEq} step={2_000} />
        <Amount label="ציוד: שנות חיים" value={life} onChange={setLife} step={1} />
      </div>
      <Percent label="נופר מחזיקה" value={pct} onChange={setPct} min={51} max={95} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="מדידת הזשמ״ש">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" aria-pressed={fairWay === v} onClick={() => setFairWay(v)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", fairWay === v ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {v ? "זשמ״ש בשווי הוגן" : "זשמ״ש לפי חלק בנמ״נ"}
          </button>
        ))}
      </div>
      {fairWay && <Amount label="שווי הוגן של הזשמ״ש" value={nciFair} onChange={setNciFair} step={2_000} />}
      {s.goodwill.goodwill < 0 ? (
        <p aria-live="polite" className="text-[15px] font-semibold text-danger">יוצא רווח מרכישה במחיר הזדמנותי. המעבדה לא מטפלת בו: הגדילו את התמורה.</p>
      ) : (
        <Tbl
          head={["", "סכום"]}
          rows={[
            ["מוניטין", s.goodwill.goodwill],
            ["הרווח המתוקן של ערמון", s.adjusted.b.total],
            ["רווח נקי מאוחד", s.split.profit.total],
            ["מתוכו לזשמ״ש", s.split.profit.nci],
            ["מתוכו לבעלים של נופר", s.split.profit.owners],
            ["זשמ״ש בהון בסוף השנה", s.equity.nci],
            ["עודפים במאוחד בסוף השנה", s.equity.retained],
          ]}
        />
      )}
    </section>
  );
}

/** One fair value, two histories: how the subsidiary and the group each split a revaluation, and the adjustment between them. The scenarios are the lesson's building and land. */
const REVAL_CASES = [
  { key: "b25", label: "המבנה, 2025", fair: 168_000, sub: { carrying: 144_000, surplus: 0, priorLoss: 16_000 }, group: { carrying: 144_000, surplus: 0, priorLoss: 0 } },
  { key: "b26", label: "המבנה, 2026", fair: 126_000, sub: { carrying: 147_000, surplus: 7_000, priorLoss: 0 }, group: { carrying: 147_000, surplus: 21_000, priorLoss: 0 } },
  { key: "land", label: "הקרקע, מעבר להערכה מחדש", fair: 324_000, sub: { carrying: 300_000, surplus: 0, priorLoss: 0 }, group: { carrying: 336_000, surplus: 0, priorLoss: 0 } },
] as const;

export function RevalLab() {
  const [key, setKey] = useState<(typeof REVAL_CASES)[number]["key"]>("b25");
  const c = REVAL_CASES.find((x) => x.key === key)!;
  const [fairs, setFairs] = useState<Record<string, number>>({});
  const fair = fairs[key] ?? c.fair;
  const sub = revalue({ ...c.sub, fairValue: fair });
  const group = revalue({ ...c.group, fairValue: fair });
  return (
    <section aria-label="מעבדה: אותו שערוך, שני פיצולים" className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="המקרה">
        {REVAL_CASES.map((x) => (
          <button key={x.key} type="button" aria-pressed={key === x.key} onClick={() => setKey(x.key)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", key === x.key ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {x.label}
          </button>
        ))}
      </div>
      <Tbl
        head={["לפני השערוך", "הבת", "הקבוצה"]}
        rows={[
          ["ערך בספרים", c.sub.carrying, c.group.carrying],
          ["קרן על הנכס, ברוטו", c.sub.surplus, c.group.surplus],
          ["הפסד שערוך קודם שעוד לא הופחת", c.sub.priorLoss, c.group.priorLoss],
        ]}
      />
      <Amount label="השווי ההוגן ביום השערוך" value={fair} onChange={(v) => setFairs((f) => ({ ...f, [key]: v }))} step={1_000} />
      <Tbl
        head={["השערוך, לפני מס", "רווח או הפסד", "רווח כולל אחר"]}
        rows={[
          ["אצל הבת", sub.pl, sub.oci],
          ["אצל הקבוצה", group.pl, group.oci],
        ]}
        foot={["ההתאמה במאוחד", group.pl - sub.pl, group.oci - sub.oci]}
      />
    </section>
  );
}

/** Gome's bond: the subsidiary's schedule is fixed; move the market rate on the day of acquisition and watch the group's schedule, the excess and each year's adjustment. */
export function BondLab() {
  const [rate, setRate] = useState(5);
  const sub = amortizedCost({ start: whole(pvBond(0.06, 4, 4_500, 100_000)), rate: 0.06, coupon: 4_500, years: 4, face: 100_000 });
  const fair = whole(pvBond(rate / 100, 3, 4_500, 100_000));
  const group = amortizedCost({ start: fair, rate: rate / 100, coupon: 4_500, years: 3, face: 100_000 });
  return (
    <section aria-label="מעבדה: שתי ריביות" className="card space-y-4 p-4 sm:p-5">
      <Percent label="ריבית השוק ביום הרכישה" value={rate} onChange={setRate} min={2} max={9} />
      <Tbl
        head={["ביום הרכישה", "סכום"]}
        rows={[
          ["עלות מופחתת אצל הבת", sub[0].close],
          ["שווי הוגן: העלות לקבוצה", fair],
        ]}
        foot={["עודף עלות", fair - sub[0].close]}
      />
      <Tbl
        dense
        head={["הכנסות מימון", "הבת", "הקבוצה", "התאמה"]}
        rows={group.map((g, i) => [String(2025 + i), sub[i + 1].interest, g.interest, g.interest - sub[i + 1].interest])}
        foot={["סך הכול", sub.slice(1).reduce((a, x) => a + x.interest, 0), group.reduce((a, x) => a + x.interest, 0), fair - sub[0].close === 0 ? 0 : -(fair - sub[0].close)]}
      />
    </section>
  );
}

/** Levana's machine: change the recoverable amounts and see the balance at the subsidiary, at the group, and the excess between them. */
export function ImpairLab() {
  const [rec, setRec] = useState([140_000, 84_000, 112_000]);
  const v = impairmentViews({ subBook: 120_000, groupCost: 168_000, years: 8, recoverable: rec });
  return (
    <section aria-label="מעבדה: שתי ירידות ערך" className="card space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-3">
        {rec.map((x, i) => (
          <Amount key={i} label={`סכום בר השבה ${2025 + i}`} value={x} onChange={(val) => setRec((r) => r.map((y, k) => (k === i ? val : y)))} step={2_000} />
        ))}
      </div>
      <Tbl
        dense
        head={["31.12", "הבת", "הקבוצה", "עודף"]}
        rows={v.rows.map((r, i) => [String(2025 + i), r.sub, r.group, r.excess])}
      />
      <p className="text-[14px] text-muted">העלות המופחתת בלי ירידות ערך: אצל הבת {v.rows.map((r) => r.subAc.toLocaleString("en-US")).join(", ")}. אצל הקבוצה {v.rows.map((r) => r.groupAc.toLocaleString("en-US")).join(", ")}.</p>
    </section>
  );
}

/** Tzeelon and Moran's goods: pick who sold, the price, the margin and how much reached outside buyers, and see what is deferred and who bears it. */
export function IntercoLab() {
  const [up, setUp] = useState(true);
  const [price, setPrice] = useState(120_000);
  const [margin, setMargin] = useState(20);
  const [sold, setSold] = useState(0);
  const v = inventoryDeferral({ price, margin: margin / 100, leftShare: 1 - sold / 100, taxRate: 0.23, up, nciShare: 0.3 });
  return (
    <section aria-label="מעבדה: כיוון, רווח, חלק שנמכר" className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        {([true, false] as const).map((x) => (
          <button key={String(x)} type="button" aria-pressed={up === x} onClick={() => setUp(x)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", up === x ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {x ? "Up: מורן מכרה" : "Down: צאלון מכרה"}
          </button>
        ))}
      </div>
      <Amount label="מחיר המכירה בתוך הקבוצה" value={price} onChange={setPrice} />
      <Percent label="שיעור רווח גולמי" value={margin} onChange={setMargin} min={5} max={50} />
      <Percent label="החלק שנמכר החוצה עד סוף השנה" value={sold} onChange={setSold} />
      <Tbl
        head={["", "סכום"]}
        rows={[
          ["ביטול מכירות ועלות מכר", price],
          ["רווח בעסקה", v.profit],
          ["רט״מ ברוטו: מקטינים את המלאי", v.gross],
          ["נכס מסים נדחים, 23%", v.tax],
          ["דחייה נטו", v.net],
        ]}
      />
      <Tbl head={["מי נושא בדחייה נטו", "סכום"]} rows={[["הבעלים של צאלון", v.owners], ["זשמ״ש, 30%", v.nci]]} />
    </section>
  );
}

/** Kalanit's bonds: pick the market rate on the day Nurit buys and the share she buys, and see the gain on redemption and its realisation the year after. */
export function BondRedeemLab() {
  const [rate, setRate] = useState(9);
  const [share, setShare] = useState(50);
  const face = 200_000 * (share / 100);
  const coupon = face * 0.06;
  const price = whole(pvBond(rate / 100, 4, coupon, face));
  const v = bondRedemption({ carrying: face, issuerRate: 0.06, price, marketRate: rate / 100, coupon, taxRate: 0.23 });
  return (
    <section aria-label="מעבדה: ריבית ביום הקנייה" className="card space-y-4 p-4 sm:p-5">
      <Percent label="ריבית השוק ביום הקנייה" value={rate} onChange={setRate} min={3} max={12} />
      <div className="flex flex-wrap gap-2">
        {[25, 50, 75, 100].map((x) => (
          <button key={x} type="button" aria-pressed={share === x} onClick={() => setShare(x)} className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", share === x ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}>
            {`נורית קונה ${x}%`}
          </button>
        ))}
      </div>
      <Tbl
        head={["31.12.2025", "סכום"]}
        rows={[
          ["ההתחייבות בספרי כלנית", face],
          ["התמורה ששילמה נורית", price],
          [v.gain >= 0 ? "רווח מפדיון" : "הפסד מפדיון", Math.abs(v.gain)],
          ["אחרי מס, על חשבון כלנית", Math.abs(v.net)],
        ]}
      />
      <Tbl
        head={["2026", "סכום"]}
        rows={[
          ["הכנסות הריבית של נורית", v.income],
          ["הוצאות הריבית של כלנית", v.expense],
          [v.adjust <= 0 ? "ביטול הריבית מקטין את הרווח ב־" : "ביטול הריבית מגדיל את הרווח ב־", Math.abs(v.adjust)],
        ]}
      />
    </section>
  );
}

/** Endless practice with new numbers: pick a calculation, solve, check, and see the whole solution. */
export function ConsolidatedDrill({ families }: { families: DrillFamily[] }) {
  const [family, setFamily] = useState(families[0]);
  const [seed, setSeed] = useState(1);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const d = drill(family, seed);
  const value = Number(typed.replaceAll(",", ""));
  const right = checked && Number.isFinite(value) && value === d.answer;
  const reset = () => {
    setTyped("");
    setChecked(false);
    setShown(false);
  };
  return (
    <section aria-label="מחולל תרגילים" className="card space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="סוג תרגיל">
        {families.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === family}
            onClick={() => {
              setFamily(f);
              reset();
            }}
            className={cn("min-h-11 rounded-lg border px-3 py-1.5 text-[13.5px] font-semibold", f === family ? "border-accent bg-accent-soft text-fg" : "border-line text-muted hover:bg-surface-2")}
          >
            {DRILL_FAMILIES[f]}
          </button>
        ))}
      </div>
      <p data-givens className="text-[16px] leading-relaxed font-semibold text-fg">{d.prompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setChecked(false);
          }}
          inputMode="decimal"
          dir="ltr"
          aria-label={d.unit === "percent" ? "התשובה באחוזים" : d.unit === "holders" ? "מספר בעלי המניות" : "התשובה בש״ח"}
          className="num min-h-11 w-40 rounded-lg border border-line-strong bg-surface px-3 text-[15px] text-fg"
        />
        <button type="button" onClick={() => setChecked(true)} disabled={!typed.trim()} className="min-h-11 rounded-lg bg-accent px-4 text-[14.5px] font-semibold text-accent-fg disabled:opacity-50">
          בדיקה
        </button>
        <button type="button" onClick={() => setShown((v) => !v)} className="min-h-11 rounded-lg border border-line-strong px-3 text-[14px] font-semibold text-accent">
          {shown ? "הסתרת הפתרון" : "הצגת הפתרון המלא"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeed((s) => s + 1);
            reset();
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-accent hover:underline"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> תרגיל חדש
        </button>
      </div>
      {checked && (
        <p aria-live="polite" className={cn("text-[15px] font-semibold", right ? "text-success" : "text-danger")}>
          {right ? "נכון." : "לא בדיוק. נסו שוב, או פתחו את הפתרון המלא."}
        </p>
      )}
      {shown && (
        <div className="space-y-2.5 rounded-xl border border-line bg-surface-2/40 p-3.5 text-[14.5px]">
          {d.steps.map((s) => (
            <div key={s.title}>
              <p className="font-bold text-fg">{s.title}</p>
              <p dir="ltr" className="num break-words">{s.numbers}</p>
            </div>
          ))}
          <p>
            <strong>התשובה:</strong> <bdi dir="ltr" className="num">{d.answer.toLocaleString("en-US")}{d.unit === "percent" ? "%" : ""}</bdi> {d.unit === "holders" ? "בעלי מניות" : d.unit === "percent" ? "" : "ש״ח"}
          </p>
          <p>
            <strong>מלכודת נפוצה:</strong> {d.trap}
          </p>
        </div>
      )}
    </section>
  );
}
