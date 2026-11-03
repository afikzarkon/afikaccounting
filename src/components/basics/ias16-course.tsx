import { Fragment, type ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { bodyCharge, computerCharge, motorCharge, partCost, PARTS, PARTS_COST } from "@/lib/study/ias16/lessons/components";
import { LATE, PRESS, PRESS_IN, PRESS_OUT, SHOP, SHOP_COST } from "@/lib/study/ias16/lessons/cost";
import { GROUP, GROUP_GAIN, SOLD, SOLD_GAIN, TRUCK_LOSS, TRUCK_SALE } from "@/lib/study/ias16/lessons/disposal";
import { DB, DB_RATE, SYD, SYD_FISCAL } from "@/lib/study/ias16/lessons/methods";
import { READY, TRUCK } from "@/lib/study/ias16/lessons/straight";
import { FIRST_SL, SPREAD } from "@/lib/study/ias16/lessons/what";
import { MiniQuiz, SortQuiz } from "./inventory-interactive";
import { Reveal, Sorted } from "./inventory-teach";
import { Card, Formula, Frac, JE, Money, ReportTag, Rule, type Step, Stepper, Wide } from "./ui";

/**
 * The concept screens the twelve-lesson fixed-assets course added to the ones
 * it kept, lessons 1–7 of the fourteen: the course map, what an item is, its cost, straight-line and the other
 * methods, components, and disposal. One principle per screen, each with a
 * self-check on a page of its own.
 */

/** Steps or items made on the server and handed to a client component: each needs a key. */
const keyed = (xs: ReactNode[]) => xs.map((x, i) => <Fragment key={i}>{x}</Fragment>);
const n = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });
const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias16" chapter={chapter} items={items} />;

// Lesson 3's truck, year by year.
const truckAnnual = TRUCK.cost * TRUCK.rate;
const truckRows = [0.5, 1, 1, 1, 0.5].map((part, i) => {
  const accum = truckAnnual * [0.5, 1.5, 2.5, 3.5, 4][i];
  return [`${TRUCK.year + i}`, truckAnnual * part, accum, TRUCK.cost - accum];
});

// Lesson 4's declining balance, year by year.
const dbRows = (() => {
  let carrying = DB.cost;
  return Array.from({ length: DB.life }, (_, i) => {
    const charge = i === DB.life - 1 ? carrying - DB.salvage : carrying * DB_RATE;
    carrying -= charge;
    return [`שנה ${i + 1}`, carrying + charge, charge, carrying];
  });
})();
const sydDigits = (SYD.life * (SYD.life + 1)) / 2;
const sydLife = (k: number) => (SYD.cost * (SYD.life - k + 1)) / sydDigits;

// Lesson 5's machine in its three parts, for two years.
const componentSteps: Step[] = [
  {
    title: "1 · עלות המכונה כולה, ואז החלוקה",
    body: (
      <DataTable
        head={["רכיב", "חלק", "עלות", "שיטה"]}
        rows={[
          ["מנוע", `${PARTS.motor.share * 100}%`, partCost(PARTS.motor.share), `תפוקה — ${n(PARTS.motor.hours)} שעות`],
          ["גוף", `${PARTS.body.share * 100}%`, partCost(PARTS.body.share), `קו ישר — ${PARTS.body.life} שנים, גרט ${n(PARTS.body.salvage)}`],
          ["מחשב בקרה", `${PARTS.computer.share * 100}%`, partCost(PARTS.computer.share), `סכום ספרות יורד — ${PARTS.computer.life} שנים`],
        ]}
        foot={["סה״כ", "100%", PARTS_COST, ""]}
      />
    ),
  },
  {
    title: "2 · פחת לכל רכיב, בשיטה שלו",
    body: (
      <DataTable
        head={["רכיב", "שנה 1", "שנה 2"]}
        rows={[
          [`מנוע (${n(PARTS.motor.used[0])} ו-${n(PARTS.motor.used[1])} שעות)`, motorCharge(0), motorCharge(1)],
          ["גוף", bodyCharge, bodyCharge],
          ["מחשב בקרה", computerCharge(0), computerCharge(1)],
        ]}
        foot={["סה״כ פחת המכונה", motorCharge(0) + bodyCharge + computerCharge(0), motorCharge(1) + bodyCharge + computerCharge(1)]}
      />
    ),
  },
  {
    title: "3 · במאזן: שורה אחת",
    body: (
      <Rule>
        מכונה: עלות <Money v={PARTS_COST} plain />, פחת נצבר אחרי שנתיים <Money v={motorCharge(0) + motorCharge(1) + 2 * bodyCharge + computerCharge(0) + computerCharge(1)} plain />, עלות מופחתת{" "}
        <Money v={PARTS_COST - (motorCharge(0) + motorCharge(1) + 2 * bodyCharge + computerCharge(0) + computerCharge(1))} />.
      </Rule>
    ),
  },
];

const COST_ITEMS = [
  { text: "מחיר הרכישה, פחות הנחה מסחרית", answer: "in", why: "הבסיס של העלות." },
  { text: "מכס שלא מוחזר", answer: "in", why: "מס שלא מוחזר — חלק מהמחיר." },
  { text: "מע״מ שמוחזר", answer: "out", why: "מס שמקבלים בחזרה — לא עלות." },
  { text: "הובלה למפעל", answer: "in", why: "מביאה את הנכס למקומו." },
  { text: "שכר עובדי החברה על התקנת המכונה", answer: "in", why: "עבודה ישירה בהבאת הנכס למצבו." },
  { text: "בדיקות תקינות לפני הפעלה", answer: "in", why: "חלק מהבאת הנכס למצב שבו יפעל." },
  { text: "הדרכת העובדים לתפעול", answer: "out", why: "לא משנה את מצב המכונה — הוצאה." },
  { text: "אירוע השקה ללקוחות", answer: "out", why: "פרסום וקידום מכירות — הוצאה." },
  { text: "סקר שוק לפני בחירת המכונה", answer: "out", why: "קרה לפני שהיה נכס — הוצאה." },
  { text: "מס רכישה על מבנה", answer: "in", why: "עלות ישירה של רכישת המבנה." },
  { text: "שכר טרחת עורך דין בעסקת המבנה", answer: "in", why: "עלות ישירה של הרכישה." },
  { text: "בזבוז חריג של חומרים בהתאמת המכונה", answer: "out", why: "סכום חריג שבוזבז — לא עלות." },
  { text: "הפסדי הרצה בחודשים הראשונים לייצור", answer: "out", why: "אחרי שהנכס מוכן — ההיוון נעצר." },
];

const SORT_ITEMS = [
  { text: "משאית שחברת הובלות משתמשת בה", answer: "ppe", why: "מוחזקת לשימוש, ליותר משנה." },
  { text: "משאיות שסוכנות רכב מחזיקה למכירה", answer: "inv", why: "מוחזקות כדי למכור — מלאי." },
  { text: "דלק לרכבי החברה", answer: "exp", why: "נצרך תוך זמן קצר — הוצאה." },
  { text: "מבנה המשרדים של החברה", answer: "ppe", why: "שימוש בהנהלה, לשנים." },
  { text: "מנוע רזרבי למטוס, שישמש שנים", answer: "ppe", why: "חלק חילוף שעומד בהגדרה — רכוש קבוע." },
  { text: "ברגים ושמנים לתחזוקה שוטפת", answer: "exp", why: "חומרי עזר שנצרכים מהר." },
  { text: "דירות שקבלן בנה כדי למכור", answer: "inv", why: "מוחזקות למכירה במהלך העסקים הרגיל." },
  { text: "שרת מחשבים שהחברה משכירה ללקוחות", answer: "ppe", why: "מוחזק להשכרה לאחרים — רכוש קבוע." },
];

export const IAS16_COURSE_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------- lesson 1
  "ppe-welcome": {
    lead: "לפני המושגים — מפה: מה נלמד בקורס, באיזה סדר, והחברה שתלווה אותנו לאורכו.",
    body: (
      <>
        <p>
          <strong>מה שאלת רכוש קבוע במבחן מבקשת.</strong> חברה קונה מכונות, מבנים וכלי רכב, ומשתמשת בהם שנים. צריך לקבוע בכמה לרשום כל נכס, כמה פחת להוציא בכל שנה ומה
          הערך שלו בספרים — ומה קורה כשמשפצים אותו, מוכרים אותו, מחליפים אותו או מעריכים אותו מחדש.
        </p>
        <ol className="max-w-[70ch] space-y-2.5">
          {(
            [
              ["שיעורים 1–3 · לזהות, ולבנות את הטבלה", "מהו רכוש קבוע, מה נכנס לעלות שלו — וארבע המילים של כל נכס בטבלה אחת: עלות, הוצאות פחת, פחת נצבר ועלות מופחתת."],
              ["שיעורים 4–6 · לחשב לאורך זמן", "ממתי מפחיתים ושנה חלקית, כל שיטות הפחת ואיך בוחרים ביניהן, ופחת לפי רכיבים."],
              ["שיעורים 7–9 · אירועים בחיי הנכס", "מכירה וגריעה, תחזוקה, שיפוץ והחלפת רכיב — והחלפת נכס בנכס."],
              ["שיעורים 10–14 · הערכה מחדש, ולרמת מבחן", "הערכה מחדש לקרקע ולנכס שמופחת, דף הפתרון, שאלות עם נעלמים — ושלוש שאלות מלאות ברמת מבחן."],
            ] as const
          ).map(([t, d], i) => (
            <li key={t} className="flex items-baseline gap-2.5">
              <span className="num grid h-6 w-6 shrink-0 place-items-center self-start rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
              <span>
                <strong className="text-fg">{t}</strong> — {d}
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-1.5">
          <p className="font-semibold text-fg">בשיעור הזה:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>למה מכונה אינה הוצאה של השנה שבה נקנתה</li>
            <li>נוסחת הקו הישר — הפחת הראשון שלכם</li>
            <li>מהו רכוש קבוע לפי התקן, ומתי מכירים בו</li>
            <li>רכוש קבוע, מלאי או הוצאה?</li>
          </ul>
        </div>
        <Part title="מאפיית הגליל בע״מ — החברה שתלווה אותנו">
          <p>שלושה נכסים: תנור, מבנה על קרקע ומשאית חלוקה. נבנה להם טבלה בשיעור 3, נמכור את המשאית בשיעור 7, נשדרג את התנור בשיעור 8 — ובשיעור 12 נראה את כולם יחד בדוחות.</p>
        </Part>
        <Remember>כל שיעור בנוי אותו דבר: בפתיחה — מה המטרה ומה תדעו לעשות בסופו; אחר כך מושגים קצרים, אחד בכל מסך, עם בדיקה קטנה אחרי כל אחד — ואז תרגול, שאלה הפוכה אחת לפחות, וסיכום. מה שצריך לדעת מראש: רק חובה וזכות.</Remember>
      </>
    ),
  },
  "ppe-matching": {
    lead: "מכונה שתשמש ארבע שנים לא נצרכת בשנה אחת. לכן העלות שלה לא נרשמת כהוצאה ביום הקנייה — היא נפרסת על השנים שבהן המכונה מייצרת הכנסות.",
    body: (
      <>
        <p>
          <strong>{`מכונה ב-${n(SPREAD.cost)} ₪ שתשמש ${SPREAD.life} שנים.`}</strong> בכל שנה היא מייצרת הכנסות של <Money v={SPREAD.revenue} />. מה יקרה לרווח אם כל
          העלות תירשם כהוצאה בשנה הראשונה — ומה אם נפרוס אותה?
        </p>
        <div className="grid gap-3">
          <Card title="✗ הכול כהוצאה בשנה הראשונה" className="border-danger/40">
            <DataTable
              head={["שנה", "הכנסות", "הוצאה", "רווח"]}
              rows={Array.from({ length: SPREAD.life }, (_, i) => {
                const expense = i === 0 ? SPREAD.cost : 0;
                return [`${i + 1}`, SPREAD.revenue, expense, SPREAD.revenue - expense];
              })}
            />
            <p className="text-sm text-muted">
              שנה 1: <Money v={SPREAD.revenue} plain /> − <Money v={SPREAD.cost} plain /> = הפסד של <Money v={SPREAD.cost - SPREAD.revenue} />. בשנים 2–4 אין הוצאה בכלל — אותה מכונה, אותה עבודה.
            </p>
          </Card>
          <Card title="✓ פריסה — פחת" className="border-success/40">
            <DataTable head={["שנה", "הכנסות", "הוצאה", "רווח"]} rows={Array.from({ length: SPREAD.life }, (_, i) => [`${i + 1}`, SPREAD.revenue, SPREAD.cost / SPREAD.life, SPREAD.revenue - SPREAD.cost / SPREAD.life])} />
            <p className="text-sm text-muted">
              הוצאה בכל שנה: <Money v={SPREAD.cost} plain /> ÷ {SPREAD.life} = <Money v={SPREAD.cost / SPREAD.life} />. רווח: <Money v={SPREAD.revenue} plain /> − <Money v={SPREAD.cost / SPREAD.life} plain /> ={" "}
              <Money v={SPREAD.revenue - SPREAD.cost / SPREAD.life} /> — בכל שנה.
            </p>
          </Card>
        </div>
        <Remember>זה עיקרון ההקבלה: הוצאה נרשמת יחד עם ההכנסה שהיא יצרה. החלק של הנכס שנצרך בכל שנה נקרא פחת.</Remember>
      </>
    ),
    check: quiz("ppe-matching", [
      {
        q: "חברה קנתה מכונה ב-60,000 ₪ שתשמש 3 שנים. מה נרשם ברווח והפסד ביום הקנייה?",
        options: ["כלום — המכונה נרשמת כנכס", "60,000 ₪ הוצאה", "20,000 ₪ הוצאה", "60,000 ₪ הכנסה"],
        answer: 0,
        why: "ביום הקנייה רק מחליפים מזומן במכונה. ההוצאה תגיע דרך הפחת, לאורך שלוש השנים.",
      },
      {
        q: "מה הפחת מייצג?",
        options: ["את החלק של הנכס שנצרך בתקופה", "את הירידה במחיר השוק של הנכס", "כסף שהחברה חוסכת להחלפת הנכס", "את עלות התיקונים"],
        answer: 0,
        why: "פחת הוא הקצאה של העלות לתקופות השימוש — לא מדידה של שווי השוק.",
      },
    ]),
  },
  "ppe-sl-first": {
    lead: "יש כמה שיטות לחשב פחת. הנפוצה ביותר היא קו ישר: כל שנה מלאה מקבלת אותו פחת. עד שיעור 5 — כל חישוב פחת בקורס הוא בקו ישר.",
    body: (
      <>
        <Formula
          title="קו ישר"
          when={`מכונה ב-${n(FIRST_SL.cost)} ₪ תשמש ${FIRST_SL.life} שנים, ובסופן תימכר כגרוטאה ב-${n(FIRST_SL.salvage)} ₪.`}
          formula={
            <>
              פחת שנתי = <Frac top="עלות − ערך גרט" bottom="שנות חיים" />
            </>
          }
          example={
            <>
              <Frac top={<><Money v={FIRST_SL.cost} plain /> − <Money v={FIRST_SL.salvage} plain /></>} bottom={FIRST_SL.life} /> = <Money v={(FIRST_SL.cost - FIRST_SL.salvage) / FIRST_SL.life} />
            </>
          }
        />
        <DataTable
          head={["בנוסחה", "מה זה", "בדוגמה"]}
          rows={[
            ["עלות", "מה שהנכס עלה — בשיעור 2 נראה בדיוק מה נכנס אליה", FIRST_SL.cost],
            ["ערך גרט", "מה שצפוי להתקבל על הנכס בסוף השימוש; אם לא נאמר — אפס", FIRST_SL.salvage],
            ["שנות חיים", "כמה שנים הנכס ישמש את החברה", FIRST_SL.life],
          ]}
        />
        <Deeper title="ושיטות אחרות?">
          <p>יתרה פוחתת, סכום ספרות השנים ויחידות תפוקה — כל אחת מחלקת את אותו סכום אחרת בין השנים. נלמד אותן בשיעור 5.</p>
          <p>לפעמים השאלה נותנת שיעור באחוזים במקום שנות חיים — למשל 25% לשנה, שהם 4 שנים. בשיעור 4 נראה גם את זה, וגם שנה שבה הנכס עבד רק חלק ממנה.</p>
        </Deeper>
        <Remember>מפחיתים רק את מה שבאמת ייצרך — העלות פחות ערך הגרט — ומחלקים אותו שווה בשווה בין השנים. בסוף החיים נשאר בספרים בדיוק ערך הגרט.</Remember>
      </>
    ),
    check: quiz("ppe-sl-first", [
      {
        q: "מכונה ב-90,000 ₪, בלי ערך גרט, תשמש 6 שנים. מה הפחת השנתי בקו ישר?",
        options: ["15,000 ₪", "90,000 ₪", "18,000 ₪", "6,000 ₪"],
        answer: 0,
        why: "(90,000 − 0) ÷ 6 = 15,000 ₪.",
      },
      {
        q: "משאית ב-70,000 ₪, ערך גרט 10,000 ₪, 5 שנים. מה הפחת השנתי בקו ישר?",
        options: ["12,000 ₪", "14,000 ₪", "16,000 ₪", "10,000 ₪"],
        answer: 0,
        why: "(70,000 − 10,000) ÷ 5 = 12,000 ₪. 14,000 יוצא כששוכחים להוריד את הגרט.",
      },
    ]),
  },
  "ppe-dep-entry": {
    lead: "את הפחת רושמים בסוף כל שנה בפקודה אחת: ח׳ הוצאות פחת / ז׳ פחת נצבר. הוצאות פחת הן חשבון תוצאתי, שמתחיל כל שנה מאפס; פחת נצבר הוא חשבון מאזני, שמצטבר משנה לשנה ומקטין את הנכס.",
    body: (
      <>
        <p>
          <strong>{`אותה מכונה: ${n(FIRST_SL.cost)} ₪, ערך גרט ${n(FIRST_SL.salvage)} ₪, ${FIRST_SL.life} שנים.`}</strong> הפחת השנתי, מהמסך הקודם:{" "}
          <Money v={FIRST_SL.annual} />. אלה שתי הפקודות שהמכונה מקבלת — אחת ביום הקנייה, ואחת בסוף כל שנה.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <JE
            entry={{ id: "1", text: "ביום הקנייה", lines: [{ account: "מכונה", dr: FIRST_SL.cost }, { account: "ספקים", cr: FIRST_SL.cost }] }}
            note="רק המאזן משתנה: נכס נכנס, התחייבות לספק נוצרת. ברווח והפסד — כלום."
          />
          <JE
            entry={{ id: "2", text: "בסוף כל שנה", lines: [{ account: "הוצאות פחת", dr: FIRST_SL.annual }, { account: "פחת נצבר", cr: FIRST_SL.annual }] }}
            note="החלק של המכונה שנצרך השנה עובר להוצאות."
          />
        </div>
        <Wide>
          <DataTable
            head={["חשבון", "סוג", "איפה בדוחות", "משנה לשנה"]}
            rows={[
              ["הוצאות פחת", <ReportTag key="e" account="הוצאות פחת" />, "רווח והפסד — מקטין את הרווח", "מתחיל כל שנה מאפס: כל שנה מקבלת את הפחת שלה"],
              ["פחת נצבר", <ReportTag key="a" account="פחת נצבר" />, "מאזן — מתחת למכונה, ומקטין אותה", "מצטבר: סכום כל הפחת מאז הקנייה"],
              ["מכונה", <ReportTag key="m" account="מכונה" />, "מאזן", "נשארת בעלותה — את הפחת לא מזכים בה"],
            ]}
          />
        </Wide>
        <Wide>
          <DataTable
            caption="המכונה לאורך חייה"
            head={["שנה", "הוצאות פחת (רווח והפסד)", "פחת נצבר (מאזן)", "ערך בספרים"]}
            rows={Array.from({ length: FIRST_SL.life }, (_, i) => [`${i + 1}`, FIRST_SL.annual, FIRST_SL.annual * (i + 1), FIRST_SL.cost - FIRST_SL.annual * (i + 1)])}
          />
        </Wide>
        <Deeper title="למה לא מזכים את המכונה ישירות?">
          <p>כך העלות המקורית נשארת גלויה בספרים, ולידה רואים כמה ממנה כבר נצרך. במאזן מציגים את שתיהן: מכונה {n(FIRST_SL.cost)}, פחות פחת נצבר — ומתחת, הערך בספרים.</p>
          <p>פחת נצבר הוא ״נכס בניכוי״: חשבון מאזני עם יתרת זכות, שכל תפקידו להקטין נכס אחר.</p>
        </Deeper>
        <Remember>ערך בספרים = עלות − פחת נצבר. ההוצאה זהה בכל שנה; הפחת הנצבר גדל, והערך בספרים יורד — עד ערך הגרט.</Remember>
      </>
    ),
    check: quiz("ppe-dep-entry", [
      {
        q: "מה פקודת הפחת בסוף השנה?",
        options: ["ח׳ הוצאות פחת / ז׳ פחת נצבר", "ח׳ פחת נצבר / ז׳ הוצאות פחת", "ח׳ הוצאות פחת / ז׳ מכונה", "ח׳ מכונה / ז׳ פחת נצבר"],
        answer: 0,
        why: "ההוצאה בחובה; בזכות — הפחת הנצבר, שמקטין את הנכס. את חשבון המכונה עצמו לא מזכים.",
      },
      {
        q: "מכונה ב-60,000 ₪, בלי ערך גרט, 5 שנים בקו ישר. בסוף שנה 3 — מה הוצאות הפחת של השנה, ומה הפחת הנצבר?",
        options: ["הוצאות פחת 12,000 ₪; פחת נצבר 36,000 ₪", "הוצאות פחת 36,000 ₪; פחת נצבר 36,000 ₪", "הוצאות פחת 12,000 ₪; פחת נצבר 12,000 ₪", "הוצאות פחת 36,000 ₪; פחת נצבר 12,000 ₪"],
        answer: 0,
        why: "הוצאות פחת — תוצאתי, רק של השנה: 60,000 ÷ 5 = 12,000. פחת נצבר — מאזני, מצטבר: 12,000 × 3 = 36,000.",
      },
    ]),
  },
  "ppe-recognition": {
    lead: "מכירים בפריט כרכוש קבוע כשמתקיימים שני תנאים: צפויות ממנו הטבות כלכליות — גם בעקיפין — והעלות שלו ניתנת למדידה מהימנה.",
    body: (
      <>
        <Wide>
          <Sorted
            columns={[
              { title: "הטבה ישירה", tone: "good", items: ["מכונת ייצור", "משאית חלוקה", "מבנה משרדים"] },
              { title: "הטבה עקיפה — גם רכוש קבוע", tone: "neutral", items: ["מסנן שהחוק מחייב, שבלעדיו המכונות לא יעבדו", "מערכת בטיחות במפעל", "מנוע רזרבי שיחליף מנוע בתיקון"] },
            ]}
          />
        </Wide>
        <Deeper title="חלקי חילוף, ומה נחשב ״פריט״">
          <p>חלקי חילוף, ציוד גיבוי וציוד עזר הם רכוש קבוע כשהם עומדים בהגדרה — ישמשו יותר מתקופה אחת. אחרת הם מלאי, ונרשמים כהוצאה כשנצרכים.</p>
          <p>התקן לא קובע מהו ״פריט״: מטוס יכול להיות פריט אחד, או גוף, מנועים ומושבים. פריטים קטנים שאינם משמעותיים לחוד אפשר לקבץ יחד.</p>
          <p>התקן לא חל על רכוש קבוע שמוחזק למכירה, נכסים ביולוגיים לחקלאות וזכויות למינרלים — לכל אלה תקן משלהם.</p>
        </Deeper>
        <Remember>
          השאלה אינה ״האם הפריט מייצר הכנסה בעצמו?״, אלא ״האם בלעדיו אפשר להפיק את ההטבות?״. פריט שבלעדיו נכסים אחרים לא יפעלו — עומד בתנאי.
        </Remember>
      </>
    ),
    check: quiz("ppe-recognition", [
      {
        q: "מערכת כיבוי אש במחסן לא מגדילה את המכירות. האם היא רכוש קבוע?",
        options: ["כן — היא מאפשרת להפעיל את המחסן", "לא — אין לה הכנסה משלה", "רק אם החוק מחייב", "היא מלאי"],
        answer: 0,
        why: "ההטבה עקיפה: בלעדיה אי אפשר להפעיל את המחסן כמו שצריך.",
      },
      {
        q: "חלק חילוף שיוחלף בתוך כמה שבועות ונצרך בבת אחת — מה הוא?",
        options: ["מלאי (ואז הוצאה כשנצרך)", "רכוש קבוע", "קרקע", "הון"],
        answer: 0,
        why: "הוא לא ישמש יותר מתקופה אחת — לא עומד בהגדרה של רכוש קבוע.",
      },
    ]),
  },
  "ppe-sort": {
    lead: "לפני שממשיכים — בודקים שההבנה יושבת: לכל פריט, האם הוא רכוש קבוע, מלאי או הוצאה?",
    body: (
      <Wide>
        <SortQuiz
          id="ppe-sort"
          prefix="ias16"
          title="רכוש קבוע, מלאי או הוצאה?"
          options={[
            ["ppe", "רכוש קבוע"],
            ["inv", "מלאי"],
            ["exp", "הוצאה"],
          ]}
          items={SORT_ITEMS}
        />
      </Wide>
    ),
  },

  // ---------------------------------------------------------------- lesson 2
  "ppe-cost-rule": {
    lead: "עלות הנכס היא כל מה שהיה צריך כדי להביא אותו למקומו ולמצב שבו יפעל כפי שהתכוונה ההנהלה — ולא שקל יותר.",
    body: (
      <>
        <Wide>
          <Sorted
            columns={[
              {
                title: "נכנס לעלות",
                tone: "good",
                items: ["מחיר, ומסים שלא מוחזרים", "הובלה וטיפול", "הכנת אתר, הרכבה והתקנה", "שכר עובדים שהתקינו", "יועצים להתקנה", "בדיקות תקינות"],
              },
              { title: "בחוץ — הוצאה", tone: "bad", items: ["מע״מ מוחזר", "הדרכת עובדים", "פרסום והשקה", "סקר או נסיעה לפני ההחלטה", "בזבוז חריג", "הפסדי הרצה, עלויות העברה וארגון מחדש"] },
            ]}
          />
        </Wide>
        <Deeper title="מתי ההיוון נעצר">
          <p>ברגע שהנכס מוכן לפעול כפי שהתכוונה ההנהלה — מפסיקים להוסיף לו עלויות, גם אם עוד לא התחילו להשתמש בו, וגם אם הוא עובד בפחות מתפוקה מלאה.</p>
          <p>הכנסות והוצאות מפעילות צדדית בזמן ההקמה (למשל חניון באתר הבנייה) הולכות לרווח והפסד — לא לעלות.</p>
        </Deeper>
        <Remember>לכל תשלום שואלים: האם בלעדיו הנכס היה מגיע לכאן ופועל? אם לא — זה עלות. אם כן — זו הוצאה.</Remember>
      </>
    ),
    check: quiz("ppe-cost-rule", [
      {
        q: "עלות פירוק הגדר הישנה כדי להתקין מכונה חדשה באותו מקום — מה הטיפול?",
        options: ["עלות המכונה — הכנת אתר", "הוצאה", "נכס נפרד", "מנוכה מהמחיר"],
        answer: 0,
        why: "הכנת האתר הייתה נחוצה כדי שהמכונה תותקן — חלק מהעלות.",
      },
      {
        q: "שלושה חודשים אחרי שהמכונה מוכנה, החברה ייצרה בה מעט ונוצר הפסד. מה הטיפול?",
        options: ["הוצאה — ההיוון נעצר כשהמכונה מוכנה", "חלק מעלות המכונה", "נכס נפרד", "מקטין את המחיר"],
        answer: 0,
        why: "אחרי שהנכס מוכן, עלויות והפסדים תפעוליים לא נכנסים לעלות.",
      },
    ]),
  },
  "ppe-cost-build": {
    lead: "בונים את עלות המכונה שורה אחר שורה: כל תשלום נכנס לעלות, או נשאר בחוץ כהוצאה — עם הסיבה.",
    body: (
      <>
        <p>
          <strong>מכבש חדש למפעל.</strong> על השולחן עשרה תשלומים. נעבור עליהם אחד-אחד:
        </p>
        <Reveal
          steps={keyed([
            <>
              מחיר <Money v={PRESS.price} /> ומכס שלא מוחזר <Money v={PRESS.importTax} /> — נכנסים. המע״מ (<Money v={PRESS.vat} plain />) מוחזר — בחוץ.
            </>,
            <>
              הובלה <Money v={PRESS.transport} /> — נכנסת: הביאה את המכבש למקומו.
            </>,
            <>
              עובדי החברה התקינו {PRESS.installHours} שעות × {PRESS.hourly} ₪ = <Money v={PRESS.installHours * PRESS.hourly} /> — נכנס.
            </>,
            <>
              בדיקות תקינות <Money v={PRESS.testing} /> — נכנסות.
            </>,
            <>
              יועצים <Money v={PRESS.consultants} plain />: {Math.round(PRESS.consultantsInstall * 100)}% על ההתקנה (<Money v={PRESS.consultants * PRESS.consultantsInstall} />) נכנסים; היתר — על הבחירה — הוצאה.
            </>,
            <>
              הדרכה <Money v={PRESS.training} plain />, השקה <Money v={PRESS.launch} plain /> וסקר שוק <Money v={PRESS.survey} plain /> — הוצאות.
            </>,
            <>
              עלות המכבש: <Money v={PRESS_IN} />. הוצאות התקופה: <Money v={PRESS_OUT} />.
            </>,
          ])}
        />
        <Remember>תשלום אחד יכול להתפצל: החלק שהביא את הנכס למצבו — עלות; החלק שקדם לו או בא אחריו — הוצאה.</Remember>
      </>
    ),
    check: quiz("ppe-cost-build", [
      {
        q: "יועץ קיבל 20,000 ₪: חצי על בחירת המכונה וחצי על התקנתה. כמה בעלות?",
        options: ["10,000 ₪", "20,000 ₪", "0", "5,000 ₪"],
        answer: 0,
        why: "רק החלק של ההתקנה.",
      },
      {
        q: "עובדי החברה הקדישו 30 שעות להתקנה, בשכר 100 ₪ לשעה. מה קורה ל-3,000 ₪?",
        options: ["נכנסים לעלות המכונה", "הוצאות שכר", "לא נרשמים — השכר כבר שולם", "מנוכים מהמחיר"],
        answer: 0,
        why: "שכר שקשור ישירות להתקנה מועבר מהוצאות השכר לעלות הנכס.",
      },
    ]),
  },
  "ppe-cost-building": {
    lead: "גם במבנה — כל עלות ישירה של הרכישה נכנסת: מס רכישה ושכר טרחה. ועיקרון שאסור לפספס: לקרקע אין פחת. כשמחשבים פחת, קודם מורידים ממנה את הקרקע.",
    body: (
      <>
        <p>
          <strong>{`חנות ב-${n(SHOP.price)} ₪.`}</strong> מס רכישה {SHOP.purchaseTax * 100}% (לא מוחזר), שכר טרחת עורך דין {SHOP.lawyer * 100}%, ו-{SHOP.land * 100}%
          מהנכס מיוחסים לקרקע.
        </p>
        <Reveal
          steps={keyed([
            <>
              עלות: <Money v={SHOP.price} plain /> × {100 + (SHOP.purchaseTax + SHOP.lawyer) * 100}% = <Money v={SHOP_COST} />.
            </>,
            <>
              קרקע: <Money v={SHOP_COST * SHOP.land} /> — לא מופחתת.
            </>,
            <>
              מבנה: <Money v={SHOP_COST * (1 - SHOP.land)} /> — מופחת על פני אורך חייו.
            </>,
          ])}
        />
        <Wide>
          <Formula
            title="מאיזה סכום מפחיתים"
            when="נכס שכולל קרקע ומבנה."
            formula={<>סכום לפחת = עלות כוללת − קרקע</>}
            example={
              <>
                <Money v={SHOP_COST} plain /> − <Money v={SHOP_COST * SHOP.land} plain /> = <Money v={SHOP_COST * (1 - SHOP.land)} />
              </>
            }
            note="אם יש ערך גרט למבנה — מורידים גם אותו, כמו בכל נכס."
          />
        </Wide>
        <Deeper title="על איזה סכום חל האחוז של הקרקע?">
          <p>על העלות כולה — כולל מס הרכישה ושכר הטרחה — אלא אם השאלה אומרת אחרת.</p>
        </Deeper>
        <Remember>לקרקע אין פחת, ואסור להפחית אותה: היא לא מתבלה ולא נצרכת, ואורך החיים שלה אינו מוגבל. מחשבים פחת רק על המבנה — העלות פחות הקרקע.</Remember>
      </>
    ),
    check: quiz("ppe-cost-building", [
      {
        q: "מבנה ב-1,000,000 ₪, מס רכישה 6%, ו-30% מהנכס מיוחסים לקרקע. מאיזה סכום נחשב את הפחת, ועל מה לא יהיה פחת?",
        options: ["מפחיתים 742,000 ₪ (המבנה); על 318,000 ₪ (הקרקע) — אין פחת", "מפחיתים את כל העלות — 1,060,000 ₪", "מפחיתים 700,000 ₪; על 300,000 ₪ — אין פחת", "מפחיתים 318,000 ₪; על 742,000 ₪ — אין פחת"],
        answer: 0,
        why: "עלות: 1,000,000 × 106% = 1,060,000 ₪. הקרקע — 30%, 318,000 ₪ — לא מופחתת. הפחת מחושב רק מהמבנה: 1,060,000 − 318,000 = 742,000 ₪.",
      },
      {
        q: "שכר טרחה לעורך הדין שליווה את הרכישה — איפה?",
        options: ["בעלות הנכס", "הוצאות משפטיות", "רק בקרקע", "לא נרשם"],
        answer: 0,
        why: "עלות ישירה של הרכישה.",
      },
    ]),
  },
  "ppe-cost-credit": {
    lead: "שתי מלכודות במחיר: תשלום שנדחה מעבר לאשראי רגיל — העלות היא מחיר המזומן; ונכס שהחברה בונה לעצמה — בלי רווח פנימי ובלי בזבוז.",
    body: (
      <>
        <p>
          <strong>תשלום נדחה.</strong> מחיר במזומן <Money v={LATE.cash} />, ישולם בעוד שנתיים <Money v={LATE.paid} />. עלות: <Money v={LATE.cash} />. ההפרש —{" "}
          <Money v={LATE.paid - LATE.cash} /> — הוצאות מימון לאורך התקופה.
        </p>
        <p>
          <strong>נכס שבונים לבד.</strong> אותם כללים כמו בקנייה: חומרים, עבודה ועלויות ישירות. בלי רווח פנימי, ובלי סכומים חריגים של חומרים או עבודה שבוזבזו.
        </p>
        <Remember>המחיר במזומן הוא מה שהנכס עלה; כל מה שמעבר לו הוא מחיר הכסף — לא מחיר הנכס.</Remember>
      </>
    ),
    check: quiz("ppe-cost-credit", [
      {
        q: "מכונה במזומן 90,000 ₪; בתנאי אשראי חריגים — 99,000 ₪ בעוד שנה. מה העלות?",
        options: ["90,000 ₪", "99,000 ₪", "94,500 ₪", "9,000 ₪"],
        answer: 0,
        why: "המחיר במזומן. 9,000 ₪ — הוצאות מימון.",
      },
      {
        q: "בבניית מחסן עצמית התבזבזו חומרים ב-40,000 ₪ בגלל טעות. מה הטיפול?",
        options: ["הוצאה", "עלות המחסן", "נכס נפרד", "מקטין את עלות המחסן"],
        answer: 0,
        why: "בזבוז חריג לא נכלל בעלות.",
      },
    ]),
  },
  "ppe-cost-sort": {
    lead: "לפני התרגול של השיעור — בודקים שההבנה יושבת: לכל תשלום, האם הוא נכנס לעלות הנכס או נשאר הוצאה?",
    body: (
      <Wide>
        <SortQuiz
          id="ppe-cost-sort"
          prefix="ias16"
          title="בעלות או הוצאה?"
          options={[
            ["in", "נכנס לעלות"],
            ["out", "הוצאה / לא עלות"],
          ]}
          items={COST_ITEMS}
        />
      </Wide>
    ),
  },

  // ---------------------------------------------------------------- lesson 3
  "ppe-available": {
    lead: "פחת מתחיל ביום שבו הנכס זמין לשימוש — במקומו ובמצב שבו הוא יכול לפעול — לא ביום הקנייה, ולא ביום שבו באמת התחילו להשתמש בו.",
    body: (
      <>
        <div className="space-y-1.5">
          <p>
            <strong>דוגמה.</strong> {`מכונה ב-${n(READY.cost)} ₪, ${READY.life} שנים:`}
          </p>
          <ol className="list-inside list-decimal space-y-1">
            <li>1.{READY.bought} — נקנתה ושולמה.</li>
            <li>1.{READY.ready} — הותקנה ונבדקה: זמינה לשימוש.</li>
            <li>1.{READY.used} — אחרי שביתה, התחילה לייצר.</li>
          </ol>
        </div>
        <p>
          <strong>פחת השנה:</strong> מ-1.{READY.ready} — {13 - READY.ready} חודשים: <Money v={READY.cost / READY.life} plain /> × {13 - READY.ready}/12 ={" "}
          <Money v={((READY.cost / READY.life) * (13 - READY.ready)) / 12} />
        </p>
        <Remember>הפחת מודד את הזמן שבו הנכס יכול לשרת. גם כשהוא עומד מושבת, או כשמחכים ללקוחות — הוא ממשיך להתבלות, והפחת ממשיך.</Remember>
      </>
    ),
    check: quiz("ppe-available", [
      {
        q: "מכונה נקנתה ב-1.3, הייתה מוכנה ב-1.5, והתחילה לעבוד ב-1.8. ממתי מפחיתים (בקו ישר)?",
        options: ["1.5", "1.3", "1.8", "1.1 של השנה הבאה"],
        answer: 0,
        why: "מהיום שבו היא זמינה לשימוש.",
      },
      {
        q: "מכונה עמדה מושבתת חודשיים לתיקון. מה קורה לפחת בקו ישר?",
        options: ["ממשיך", "נעצר", "מוכפל", "נדחה לסוף החיים"],
        answer: 0,
        why: "ההפחתה לא נפסקת כשהנכס מושבת.",
      },
    ]),
  },
  "ppe-rate": {
    lead: "לפעמים השאלה נותנת שיעור פחת באחוזים במקום שנות חיים — או להפך. ההמרה היא תמיד אותה חלוקה: 100% מחולק במה שנתון.",
    body: (
      <>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Formula title="משנים לאחוזים" when="נתונות שנות חיים, ורוצים את השיעור." formula={<>שיעור = <Frac top="100%" bottom="שנות חיים" /></>} example={<><Frac top="100%" bottom="4" /> = 25% לשנה</>} />
          <Formula title="מאחוזים לשנים" when="נתון שיעור, ורוצים את שנות החיים." formula={<>שנות חיים = <Frac top="100%" bottom="שיעור" /></>} example={<><Frac top="100%" bottom="12.5%" /> = 8 שנים</>} />
        </Wide>
        <Wide>
          <DataTable head={["שנות חיים", "שיעור לשנה"]} rows={[2, 4, 5, 8, 10, 20, 25].map((y) => [`${y}`, `${n(100 / y)}%`])} />
        </Wide>
        <p>
          כשנתון שיעור, הפחת השנתי בקו ישר = עלות × שיעור. למשל <Money v={TRUCK.cost} plain /> × {TRUCK.rate * 100}% = <Money v={truckAnnual} /> — בדיוק כמו <Money v={TRUCK.cost} plain /> ÷ {1 / TRUCK.rate}.
        </p>
        <Remember>השיעור הוא החלק מהעלות שנצרך בכל שנה: 25% לשנה — רבע בכל שנה, ולכן ארבע שנים.</Remember>
      </>
    ),
    check: quiz("ppe-rate", [
      {
        q: "נכס ישמש 8 שנים. מה שיעור הפחת השנתי בקו ישר?",
        options: ["12.5%", "8%", "80%", "1.25%"],
        answer: 0,
        why: "100% ÷ 8 = 12.5% לשנה.",
      },
      {
        q: "שיעור הפחת 20% לשנה. כמה שנות חיים?",
        options: ["5", "20", "2", "50"],
        answer: 0,
        why: "100% ÷ 20% = 5 שנים.",
      },
    ]),
  },
  "ppe-sl": {
    lead: "בקו ישר כל שנה מלאה מקבלת אותו פחת: (עלות − ערך גרט) ÷ שנות החיים. שנה חלקית — לפי החודשים; שיעור באחוזים — כפול העלות.",
    body: (
      <>
        <p>
          <strong>{`משאית ב-${n(TRUCK.cost)} ₪, ${TRUCK.rate * 100}% לשנה, מ-1.${TRUCK.startMonth}.${TRUCK.year}.`}</strong> {TRUCK.rate * 100}% לשנה = {1 / TRUCK.rate} שנות
          חיים, בלי ערך גרט.
        </p>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Formula
            title="שנות חיים נתונות"
            when="הנוסחה מהשיעור הראשון."
            formula={
              <>
                פחת שנתי = <Frac top="עלות − ערך גרט" bottom="שנות חיים" />
              </>
            }
            example={
              <>
                <Frac top={<><Money v={TRUCK.cost} plain /> − 0</>} bottom={1 / TRUCK.rate} /> = <Money v={truckAnnual} />
              </>
            }
          />
          <Formula
            title="שיעור באחוזים נתון"
            when="השיעור חל על העלות; 100% ÷ השיעור = שנות החיים."
            formula={<>פחת שנתי = עלות × שיעור</>}
            example={
              <>
                <Money v={TRUCK.cost} plain /> × {TRUCK.rate * 100}% = <Money v={truckAnnual} />
              </>
            }
          />
        </Wide>
        <Rule>
          שנה חלקית — פחת שנתי × חודשים ÷ 12. ב-{TRUCK.year}, מ-1.{TRUCK.startMonth}: <Money v={truckAnnual} plain /> × {13 - TRUCK.startMonth}/12 = <Money v={(truckAnnual * (13 - TRUCK.startMonth)) / 12} />.
        </Rule>
        <Wide>
          <DataTable head={["שנה", "פחת השנה", "פחת נצבר", "עלות מופחתת"]} rows={truckRows} />
        </Wide>
        <Deeper title="הפקודה, ואיך מחשבים פחת נצבר ישירות">
          <p>בכל סוף שנה: ח׳ הוצאות פחת / ז׳ פחת נצבר. הפחת הנצבר הוא חשבון מאזני בזכות, שמקטין את הנכס.</p>
          <p>
            פחת נצבר ישירות: פחת שנתי × מספר השנים מיום הזמינות. כאן, ב-31.12.{TRUCK.year + 2}: {n(truckAnnual)} × 2.5 = {n(truckAnnual * 2.5)} ₪.
          </p>
        </Deeper>
        <Remember>
          הפחת הנצבר הוא סכום כל הפחת עד היום, והוא לעולם לא עובר את הסכום בר-הפחת. עלות מופחתת = עלות − פחת נצבר; בסוף החיים היא שווה לערך הגרט.
        </Remember>
      </>
    ),
    check: quiz("ppe-sl", [
      {
        q: "נכס ב-90,000 ₪, ערך גרט 10,000 ₪, 8 שנים בקו ישר. מה הפחת השנתי?",
        options: ["10,000 ₪", "11,250 ₪", "12,500 ₪", "80,000 ₪"],
        answer: 0,
        why: "(90,000 − 10,000) ÷ 8 = 10,000 ₪.",
      },
      {
        q: "משאית ב-60,000 ₪, שיעור פחת 20% לשנה בקו ישר, נכנסה לשימוש ב-1.10. מה הפחת לשנה הראשונה?",
        options: ["3,000 ₪", "12,000 ₪", "9,000 ₪", "1,000 ₪"],
        answer: 0,
        why: "פחת שנתי: 60,000 × 20% = 12,000 ₪. מ-1.10 — 3 חודשים: 12,000 × 3/12 = 3,000 ₪.",
      },
    ]),
  },
  "ppe-land": {
    lead: "לקרקע אין אורך חיים מוגבל, ולכן היא לא מופחתת. כשנקנים קרקע ומבנה יחד — מפרידים ביניהם ביום הרכישה, ומפחיתים רק את המבנה.",
    body: (
      <>
        <p>
          <strong>דוגמה.</strong> מבנה משרדים ב-300,000 ₪; שליש מהמחיר מיוחס לקרקע; 20 שנה.
        </p>
        <Reveal
          steps={keyed([
            <>
              קרקע: <Money v={100_000} /> — נשארת בעלותה.
            </>,
            <>
              מבנה: <Money v={200_000} /> ÷ 20 = <Money v={10_000} /> פחת לשנה.
            </>,
            <>
              אחרי שנתיים: קרקע <Money v={100_000} plain /> + מבנה <Money v={180_000} plain /> = <Money v={280_000} /> בספרים.
            </>,
          ])}
        />
        <Remember>טעות נפוצה: לחלק את כל המחיר בשנות החיים. קודם מוציאים את הקרקע — ורק אז מחשבים פחת.</Remember>
      </>
    ),
    check: quiz("ppe-land", [
      {
        q: "מבנה וקרקע ב-800,000 ₪, הקרקע 25%, 30 שנה בקו ישר. מה הפחת השנתי?",
        options: ["20,000 ₪", "26,667 ₪", "6,667 ₪", "0"],
        answer: 0,
        why: "600,000 ÷ 30 = 20,000 ₪.",
      },
      {
        q: "קרקע שנקנתה לפני 10 שנים ב-500,000 ₪ (מודל העלות). בכמה היא מוצגת?",
        options: ["500,000 ₪", "0", "250,000 ₪", "בשווי השוק"],
        answer: 0,
        why: "בלי פחת — בעלותה.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 4
  "ppe-db": {
    lead: "ביתרה פוחתת מכפילים שיעור קבוע בערך בספרים של תחילת השנה — ולכן הפחת גבוה בהתחלה ויורד משנה לשנה. את ערך הגרט לא מנכים מהבסיס.",
    body: (
      <>
        <p>
          <strong>{`נכס ב-${n(DB.cost)} ₪, ערך גרט ${n(DB.salvage)} ₪, ${DB.life} שנים.`}</strong> השיעור שמביא את הנכס בדיוק לגרט: 1 − ({n(DB.salvage)} ÷ {n(DB.cost)})^(1/
          {DB.life}) = {Math.round(DB_RATE * 100)}%.
        </p>
        <Wide>
          <Formula
            title="יתרה פוחתת"
            when="השיעור חל כל שנה על מה שנשאר בספרים — לא על העלות."
            formula={<>פחת השנה = ערך בספרים בתחילת השנה × שיעור</>}
            example={
              <span className="flex flex-col items-center gap-1">
                <span>
                  שנה 1: <Money v={DB.cost} plain /> × {Math.round(DB_RATE * 100)}% = <Money v={dbRows[0][2] as number} />
                </span>
                <span>
                  שנה 2: <Money v={dbRows[1][1] as number} plain /> × {Math.round(DB_RATE * 100)}% = <Money v={dbRows[1][2] as number} />
                </span>
              </span>
            }
            note="בשנה האחרונה מורידים בדיוק עד ערך הגרט."
          />
        </Wide>
        <Wide>
          <DataTable head={["", "ערך בתחילת השנה", "פחת", "ערך בסוף השנה"]} rows={dbRows} />
        </Wide>
        <Deeper title="כשהשיעור נתון בשאלה">
          <p>לפעמים השאלה פשוט נותנת שיעור (למשל 30%). אז: שנה 1 — עלות × 30%; שנה 2 — (עלות − פחת שנה 1) × 30%, וכן הלאה.</p>
        </Deeper>
        <Remember>השיעור חל על מה שנשאר, לא על העלות. הגרט כבר ״בפנים״ — בנוסחת השיעור — ולכן לא מורידים אותו שוב.</Remember>
      </>
    ),
    check: quiz("ppe-db", [
      {
        q: "נכס ב-200,000 ₪, יתרה פוחתת 25%. מה הפחת בשנה השנייה?",
        options: ["37,500 ₪", "50,000 ₪", "25,000 ₪", "12,500 ₪"],
        answer: 0,
        why: "שנה 1: 50,000; נשאר 150,000 × 25% = 37,500 ₪.",
      },
      {
        q: "ביתרה פוחתת — על איזה בסיס מחשבים את פחת השנה?",
        options: ["הערך בספרים בתחילת השנה", "העלות פחות הגרט", "העלות המקורית", "הגרט"],
        answer: 0,
        why: "שיעור × מה שנשאר.",
      },
    ]),
  },
  "ppe-syd": {
    lead: "בסכום ספרות השנים מחלקים את הסכום בר-הפחת לפי משקלות: n, n−1, …, 1 (יורד) או 1, 2, …, n (עולה), חלקי סכום כל המשקלות.",
    body: (
      <>
        <p>
          <strong>{`סכום בר-פחת ${n(DB.cost - DB.salvage)} ₪, ${DB.life} שנים.`}</strong> סכום הספרות: {Array.from({ length: DB.life }, (_, i) => i + 1).join(" + ")} ={" "}
          {(DB.life * (DB.life + 1)) / 2}.
        </p>
        <Wide>
          <Formula
            title="סכום ספרות השנים"
            when="סכום הספרות = n × (n + 1) ÷ 2. יורד — המונה מתחיל ב-n; עולה — ב-1."
            formula={
              <>
                פחת השנה = (עלות − ערך גרט) × <Frac top="מונה השנה" bottom="סכום הספרות" />
              </>
            }
            example={
              <span className="flex flex-col items-center gap-1">
                <span>
                  יורד, שנה 1: <Money v={DB.cost - DB.salvage} plain /> × <Frac top={DB.life} bottom={(DB.life * (DB.life + 1)) / 2} /> ={" "}
                  <Money v={((DB.cost - DB.salvage) * DB.life) / ((DB.life * (DB.life + 1)) / 2)} />
                </span>
                <span>
                  עולה, שנה 1: <Money v={DB.cost - DB.salvage} plain /> × <Frac top={1} bottom={(DB.life * (DB.life + 1)) / 2} /> ={" "}
                  <Money v={(DB.cost - DB.salvage) / ((DB.life * (DB.life + 1)) / 2)} />
                </span>
              </span>
            }
          />
        </Wide>
        <Wide>
          <DataTable
            head={["שנה", "יורד", "עולה"]}
            rows={Array.from({ length: DB.life }, (_, i) => [
              `שנה ${i + 1}`,
              ((DB.cost - DB.salvage) * (DB.life - i)) / ((DB.life * (DB.life + 1)) / 2),
              ((DB.cost - DB.salvage) * (i + 1)) / ((DB.life * (DB.life + 1)) / 2),
            ])}
            foot={["סה״כ", DB.cost - DB.salvage, DB.cost - DB.salvage]}
          />
        </Wide>
        <Remember>יורד — הנכס מתבלה מהר בהתחלה; עולה — הבלאי גדל עם השנים. בשתיהן הגרט מנוכה מהבסיס, וסך הפחת שווה לסכום בר-הפחת.</Remember>
      </>
    ),
    check: quiz("ppe-syd", [
      {
        q: "5 שנות חיים — מה סכום הספרות?",
        options: ["15", "10", "25", "5"],
        answer: 0,
        why: "1 + 2 + 3 + 4 + 5 = 15 (או 5 × 6 ÷ 2).",
      },
      {
        q: "בסכום ספרות עולה, מה המונה בשנה השלישית מתוך 5?",
        options: ["3", "5", "1", "15"],
        answer: 0,
        why: "בעולה מתחילים מ-1, אז בשנה השלישית — 3.",
      },
    ]),
  },
  "ppe-syd-part": {
    lead: "כשהנכס נכנס באמצע שנה, שנות החיים לא מתלכדות עם שנות הכספים: מחשבים פחת לכל שנת חיים, ומחלקים אותה בין שתי שנות כספים לפי חודשים.",
    body: (
      <>
        <p>
          <strong>{`נכס ב-${n(SYD.cost)} ₪, ${SYD.life} שנים, סכום ספרות יורד, מ-1.${SYD.startMonth}.`}</strong> שנת חיים 1 (מונה {SYD.life}): <Money v={sydLife(1)} />.
          שנת חיים 2 (מונה {SYD.life - 1}): <Money v={sydLife(2)} />.
        </p>
        <Wide>
          <Formula
            title="שנת כספים שמתחלקת בין שתי שנות חיים"
            when="קודם מחשבים כל שנת חיים בנוסחה של השיטה, ואז לוקחים מכל אחת את החודשים שנפלו בשנת הכספים."
            formula={
              <>
                <span className="whitespace-nowrap">פחת השנה =</span>
                <span className="inline-flex items-center whitespace-nowrap">
                  שנת חיים א׳ × <Frac top="חודשים" bottom="12" />
                </span>
                +
                <span className="inline-flex items-center whitespace-nowrap">
                  שנת חיים ב׳ × <Frac top="חודשים" bottom="12" />
                </span>
              </>
            }
            example={
              <>
                שנת כספים 2: <Money v={sydLife(1)} plain /> × <Frac top={SYD.startMonth - 1} bottom="12" /> + <Money v={sydLife(2)} plain /> × <Frac top={13 - SYD.startMonth} bottom="12" /> ={" "}
                <Money v={SYD_FISCAL[1]} />
              </>
            }
          />
        </Wide>
        <Reveal
          steps={keyed([
            <>
              שנת כספים 1: {13 - SYD.startMonth} חודשים משנת חיים 1 = <Money v={SYD_FISCAL[0]} />.
            </>,
            <>
              שנת כספים 2: {SYD.startMonth - 1} חודשים אחרונים משנת חיים 1 + {13 - SYD.startMonth} ראשונים משנת חיים 2 = <Money v={SYD_FISCAL[1]} />.
            </>,
            <>וכך הלאה: כל שנת כספים לוקחת סוף של שנת חיים אחת ותחילה של הבאה.</>,
          ])}
        />
        <Remember>אותו דבר ביתרה פוחתת. רק בקו ישר זה לא משנה — כל החודשים שווים.</Remember>
      </>
    ),
    check: quiz("ppe-syd-part", [
      {
        q: "נכס בסכום ספרות יורד נכנס ב-1.7. שנת החיים הראשונה שווה 40,000 ₪. מה הפחת בשנת הכספים הראשונה?",
        options: ["20,000 ₪", "40,000 ₪", "10,000 ₪", "30,000 ₪"],
        answer: 0,
        why: "חצי משנת החיים הראשונה.",
      },
      {
        q: "באיזו שיטה לא צריך לפצל שנות חיים?",
        options: ["קו ישר", "סכום ספרות יורד", "יתרה פוחתת", "סכום ספרות עולה"],
        answer: 0,
        why: "בקו ישר כל חודש שווה — הפיצול לא משנה דבר.",
      },
    ]),
  },
  "ppe-units": {
    lead: "ביחידות תפוקה הפחת עוקב אחרי השימוש: (עלות − גרט) × התפוקה של השנה ÷ התפוקה הכוללת הצפויה. שנה בלי ייצור — בלי פחת.",
    body: (
      <>
        <Wide>
          <Formula
            title="יחידות תפוקה"
            when="מכונה ב-512,000 ₪, ערך גרט 2,000 ₪, צפויה לייצר 100,000 יחידות; בשנה הראשונה ייצרה 50,000."
            formula={
              <>
                פחת השנה = (עלות − ערך גרט) × <Frac top="תפוקת השנה" bottom="תפוקה כוללת צפויה" />
              </>
            }
            example={
              <>
                <Money v={510_000} plain /> × <Frac top={<Money v={50_000} plain />} bottom={<Money v={100_000} plain />} /> = <Money v={255_000} />
              </>
            }
          />
        </Wide>
        <DataTable
          caption="אותה מכונה, ארבע שנים"
          head={["שנה", "יחידות", "פחת"]}
          rows={[50_000, 20_000, 25_000, 5_000].map((u, i) => [`${i + 1}`, u, (510_000 * u) / 100_000])}
          foot={["סה״כ", 100_000, 510_000]}
        />
        <Deeper title="ומה אסור? ומה כשהמכונה עומדת?">
          <p>אסור להפחית לפי הכנסות מהנכס: הכנסות תלויות גם במחירים ובמכירות, לא רק בשימוש בנכס.</p>
          <p>בקו ישר הפחת ממשיך גם כשהנכס עומד מושבת. כאן הפחת תלוי בתפוקה בפועל — אז בחודשים בלי ייצור הוא יוצא אפס. זה לא חריג לכלל: השיטה עצמה מודדת את הצריכה לפי השימוש.</p>
        </Deeper>
        <Remember>השיטה הכי מדויקת להקבלה — כשאפשר לאמוד את התפוקה. תאריך הכניסה לא משנה; רק כמה ייצרו.</Remember>
      </>
    ),
    check: quiz("ppe-units", [
      {
        q: "מנוע ב-90,000 ₪, בלי גרט, ל-30,000 שעות. השנה עבד 4,000 שעות. מה הפחת?",
        options: ["12,000 ₪", "3,000 ₪", "30,000 ₪", "4,000 ₪"],
        answer: 0,
        why: "3 ₪ לשעה × 4,000 = 12,000 ₪.",
      },
      {
        q: "מכונה ביחידות תפוקה נכנסה לשימוש ב-1.10 וייצרה עד סוף השנה 1,000 יחידות. האם מכפילים ב-3/12?",
        options: ["לא — התפוקה כבר משקפת את התקופה", "כן", "רק אם יש גרט", "כן, ב-9/12"],
        answer: 0,
        why: "ביחידות תפוקה סופרים יחידות, לא חודשים.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 5
  "ppe-components": {
    lead: "כשלחלקים משמעותיים של נכס יש אורך חיים או דפוס בלאי שונה, כל חלק מופחת לחוד. בדוחות — הנכס עדיין שורה אחת.",
    body: (
      <>
        <p>
          <strong>מטוס.</strong> הגוף ישמש 25 שנה, המנועים — 10, והמושבים יוחלפו כל 5 שנים. פחת אחד לכל המטוס היה מפחית את המושבים לאט מדי ואת הגוף מהר מדי.
        </p>
        <Wide>
          <Sorted
            columns={[
              { title: "מפרידים", tone: "good", items: ["חלק משמעותי מהעלות", "עם אומדני פחת שונים (חיים, שיטה או גרט)"] },
              { title: "לא חייבים להפריד", tone: "neutral", items: ["חלקים עם אותם אומדנים — אפשר יחד", "חלקים לא משמעותיים — מקבצים יחד"] },
            ]}
          />
        </Wide>
        <Remember>הפיצול הוא כלי לחישוב הפחת בלבד. במאזן מוצגת המכונה — עלות כוללת, פחת נצבר כולל.</Remember>
      </>
    ),
    check: quiz("ppe-components", [
      {
        q: "למה מפצלים נכס לרכיבים?",
        options: ["כי לרכיבים אומדני פחת שונים", "כדי להציג אותם בשורות נפרדות", "כדי להקטין את הפחת", "כי התקן מחייב לפצל כל נכס"],
        answer: 0,
        why: "כדי שהפחת של כל חלק ישקף את הבלאי שלו.",
      },
      {
        q: "שני רכיבים עם אותו אורך חיים ואותה שיטה — מה עושים?",
        options: ["אפשר להפחית אותם יחד", "חייבים לפצל", "לא מפחיתים", "מפחיתים רק אחד"],
        answer: 0,
        why: "אותם אומדנים — אותה תוצאה גם יחד.",
      },
    ]),
  },
  "ppe-components-table": {
    lead: "שאלת רכיבים נפתרת בשלושה צעדים: עלות המכונה כולה וחלוקתה, פחת לכל רכיב בשיטה שלו, וחיבור לשורה אחת.",
    body: (
      <>
        <p>
          <strong>{`מכונה: מחיר ${n(PARTS.price)}, הובלה ${n(PARTS.transport)}, התקנה ${n(PARTS.install)}.`}</strong> מנוע, גוף ומחשב בקרה — שלוש שיטות.
        </p>
        <Stepper label="מכונה בשלושה רכיבים" steps={componentSteps} />
        <Remember>החלוקה באחוזים חלה על העלות המלאה — כולל ההובלה וההתקנה — לא על מחיר הקנייה בלבד.</Remember>
      </>
    ),
    check: quiz("ppe-components-table", [
      {
        q: "מכונה ב-500,000 ₪ + התקנה 40,000 ₪; הגוף 50%. מהי עלות הגוף?",
        options: ["270,000 ₪", "250,000 ₪", "290,000 ₪", "20,000 ₪"],
        answer: 0,
        why: "540,000 × 50% = 270,000 ₪.",
      },
      {
        q: "שלושת הרכיבים — איך מוצגים במאזן?",
        options: ["שורה אחת: המכונה", "שלוש שורות", "רק הרכיב היקר", "לא מוצגים"],
        answer: 0,
        why: "הפיצול — לחישוב בלבד.",
      },
    ]),
  },
  "ppe-components-back": {
    lead: "שאלות רכיבים כמעט תמיד נותנות תשובה ומבקשות נתון: אורך חיים, ערך גרט או תפוקה. הופכים את הנוסחה — משוואה אחת, נעלם אחד.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["נתון", "חסר", "המשוואה"]}
            rows={[
              ["פחת שנתי (קו ישר)", "אורך חיים", "שנים = (עלות − גרט) ÷ פחת שנתי"],
              ["פחת של שנה חלקית", "פחת שנתי", "שנתי = פחת × 12 ÷ חודשים"],
              ["עלות מופחתת אחרי t שנים", "ערך גרט", "פחת שנתי = (עלות − ע.מ.) ÷ t; גרט = עלות − פחת שנתי × n"],
              ["פחת בתפוקה", "יחידות/שעות", "יחידות = פחת ÷ ((עלות − גרט) ÷ תפוקה כוללת)"],
              ["פחת בסכום ספרות", "ערך גרט", "סכום בר-פחת = פחת × סכום הספרות ÷ מונה; גרט = עלות − סכום בר-פחת"],
            ]}
          />
        </Wide>
        <Reveal
          steps={keyed([
            <>דוגמה: גוף מכונה בעלות 180,000 ₪, גרט 20,000 ₪, זמין מ-1.7, פחת השנה 8,000 ₪. כמה שנות חיים?</>,
            <>השלמה לשנה מלאה: 8,000 × 12 ÷ 6 = 16,000 ₪.</>,
            <>שנים: (180,000 − 20,000) ÷ 16,000 = 10.</>,
          ])}
        />
        <Remember>הטעות הנפוצה: לשכוח שהפחת הנתון הוא של שנה חלקית. קודם משלימים לשנה מלאה — ורק אז מחלקים.</Remember>
      </>
    ),
    check: quiz("ppe-components-back", [
      {
        q: "רכיב בעלות 100,000 ₪, בלי גרט, קו ישר; הפחת השנתי 12,500 ₪. כמה שנות חיים?",
        options: ["8", "12.5", "10", "6"],
        answer: 0,
        why: "100,000 ÷ 12,500 = 8.",
      },
      {
        q: "מנוע בעלות 60,000 ₪, בלי גרט, ל-20,000 שעות; הפחת השנה 9,000 ₪. כמה שעות עבד?",
        options: ["3,000", "9,000", "4,500", "6,667"],
        answer: 0,
        why: "3 ₪ לשעה; 9,000 ÷ 3 = 3,000.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 6
  "ppe-sale": {
    lead: "במכירה ״מוכרים״ את הערך בספרים: התמורה נטו פחות הערך בספרים ביום המכירה היא רווח (או הפסד) הון.",
    body: (
      <>
        <p>
          <strong>דוגמה.</strong> {`מכונה ב-${n(SOLD.cost)} ₪, ${SOLD.life} שנים, נמכרה בסוף השנה ה-${SOLD.years} ב-${n(SOLD.price)} ₪.`}
        </p>
        <Reveal
          steps={keyed([
            <>
              פחת נצבר: <Money v={(SOLD.cost / SOLD.life) * SOLD.years} />; ערך בספרים: <Money v={SOLD.cost - (SOLD.cost / SOLD.life) * SOLD.years} />.
            </>,
            <>
              רווח הון: <Money v={SOLD.price} plain /> − <Money v={SOLD.cost - (SOLD.cost / SOLD.life) * SOLD.years} plain /> = <Money v={SOLD_GAIN} />.
            </>,
            <>
              הפקודה: ח׳ מזומן {n(SOLD.price)}, ח׳ פחת נצבר {n((SOLD.cost / SOLD.life) * SOLD.years)} / ז׳ מכונה {n(SOLD.cost)}, ז׳ רווח הון {n(SOLD_GAIN)}.
            </>,
          ])}
        />
        <Deeper title="תמורה נטו">
          <p>מהמחיר מורידים את העלויות הישירות של המכירה (עמלת תיווך, פירוק). רווח הון מוצג ברווח או הפסד — לא בהכנסות ממכירות.</p>
        </Deeper>
        <Remember>הנכס יוצא מהספרים כולו: העלות שלו בזכות, והפחת שנצבר עליו בחובה. מה שנשאר כדי לאזן — הרווח או ההפסד.</Remember>
      </>
    ),
    check: quiz("ppe-sale", [
      {
        q: "נכס שערכו בספרים 30,000 ₪ נמכר ב-25,000 ₪. מה התוצאה?",
        options: ["הפסד הון של 5,000 ₪", "רווח הון של 25,000 ₪", "הפסד של 30,000 ₪", "אין"],
        answer: 0,
        why: "25,000 − 30,000 = −5,000.",
      },
      {
        q: "בפקודת המכירה, איזה פחת נצבר נגרע?",
        options: ["כל הפחת שנצבר על הנכס עד יום המכירה", "רק של השנה", "אף אחד", "רק של השנה הקודמת"],
        answer: 0,
        why: "הנכס יוצא כולו — עם כל הפחת שלו.",
      },
    ]),
  },
  "ppe-sale-date": {
    lead: "לפני שמחשבים רווח — רושמים פחת עד יום המכירה. ערך בספרים של תחילת השנה הוא ערך של יום אחר.",
    body: (
      <>
        <p>
          <strong>דוגמה.</strong> {`משאית ב-${n(TRUCK_SALE.cost)} ₪, ${TRUCK_SALE.rate * 100}% לשנה, מ-1.7.2021; נמכרה ב-31.12.2023 ב-${n(TRUCK_SALE.price)} ₪.`}
        </p>
        <Reveal
          steps={keyed([
            <>
              פחת 2021 (חצי שנה) <Money v={TRUCK_SALE.cost * TRUCK_SALE.rate * 0.5} plain />, 2022 <Money v={TRUCK_SALE.cost * TRUCK_SALE.rate} plain />, 2023 עד המכירה{" "}
              <Money v={TRUCK_SALE.cost * TRUCK_SALE.rate} plain />.
            </>,
            <>
              פחת נצבר: <Money v={TRUCK_SALE.cost * TRUCK_SALE.rate * TRUCK_SALE.years} />; ערך בספרים: <Money v={TRUCK_SALE.cost * (1 - TRUCK_SALE.rate * TRUCK_SALE.years)} />.
            </>,
            <>
              הפסד הון: <Money v={TRUCK_SALE.cost * (1 - TRUCK_SALE.rate * TRUCK_SALE.years)} plain /> − <Money v={TRUCK_SALE.price} plain /> = <Money v={TRUCK_LOSS} />.
            </>,
          ])}
        />
        <Remember>שנת מכירה באמצע השנה = פחת עד המכירה, ואז גריעה. גם בממוצעים בשאלות הצגת דוחות — הנכס שנמכר מפחית עד יום המכירה.</Remember>
      </>
    ),
    check: quiz("ppe-sale-date", [
      {
        q: "מכונה עם פחת שנתי 12,000 ₪ נמכרה ב-1.5. כמה פחת רושמים עליה השנה?",
        options: ["4,000 ₪", "12,000 ₪", "0", "8,000 ₪"],
        answer: 0,
        why: "4 חודשים: 12,000 × 4/12.",
      },
      {
        q: "מה קורה לרווח אם שוכחים את הפחת עד המכירה?",
        options: ["יוצא נמוך מדי (או הפסד גדול מדי)", "יוצא גבוה מדי", "לא משתנה", "תלוי בשיטה"],
        answer: 0,
        why: "הערך בספרים גבוה מדי — והרווח נמוך מדי. ההוצאה פשוט ״עוברת״ מפחת להפסד הון.",
      },
    ]),
  },
  "ppe-sale-part": {
    lead: "כשנמכר רק חלק מקבוצה — גורעים רק את החלק: העלות של מה שנמכר, והפחת שנצבר עליו. שאר הקבוצה נשארת כמו שהיא.",
    body: (
      <>
        <p>
          <strong>{`${GROUP.units} מחשבים זהים, ${n(GROUP.each)} ₪ כל אחד, ${GROUP.life} שנים.`}</strong> אחרי {GROUP.years} שנים נמכרו {GROUP.sold} ב-
          <Money v={GROUP.price} />.
        </p>
        <Reveal
          steps={keyed([
            <>
              עלות מה שנמכר: {GROUP.sold} × <Money v={GROUP.each} plain /> = <Money v={GROUP.sold * GROUP.each} />.
            </>,
            <>
              פחת שנצבר עליו: <Money v={((GROUP.sold * GROUP.each) / GROUP.life) * GROUP.years} />; ערך בספרים <Money v={GROUP.sold * GROUP.each * (1 - GROUP.years / GROUP.life)} />.
            </>,
            <>
              רווח הון: <Money v={GROUP_GAIN} />. בקבוצה נשארים {GROUP.units - GROUP.sold} מחשבים, עם העלות והפחת שלהם בלבד.
            </>,
          ])}
        />
        <Remember>חלק יחסי: אם נמכרו מחצית מהיחידות הזהות — נגרעות מחצית העלות ומחצית הפחת הנצבר.</Remember>
      </>
    ),
    check: quiz("ppe-sale-part", [
      {
        q: "לקבוצה עלות 200,000 ₪ ופחת נצבר 80,000 ₪. נמכר רבע ממנה. כמה פחת נצבר נגרע?",
        options: ["20,000 ₪", "80,000 ₪", "50,000 ₪", "0"],
        answer: 0,
        why: "רבע מ-80,000.",
      },
      {
        q: "ואיזו עלות נגרעת?",
        options: ["50,000 ₪", "200,000 ₪", "120,000 ₪", "30,000 ₪"],
        answer: 0,
        why: "רבע מ-200,000.",
      },
    ]),
  },
  "ppe-worksheet": {
    lead: "בשאלות גיליון עבודה ומאזן בוחן, רכוש קבוע מגיע כשורות עם סימני שאלה: עלות, פחת נצבר והוצאות פחת. ממלאים אותן באותם כללים — ומוסיפים פקודות שלא נרשמו.",
    body: (
      <>
        <p>
          <strong>מאזן בוחן לפני פקודות התאמה, 31.12.2023.</strong> 10 מחשבים נקנו ב-1.1.2021 ב-120,000 ₪ (4 שנים); 5 נמכרו ב-31.12.2023 ב-30,000 ₪ — והמכירה עוד לא
          נרשמה. שתי מכונות: 250,000 ₪ מ-1.1.2023 ו-360,000 ₪ מ-1.7.2023, 5 שנים.
        </p>
        <Reveal
          steps={keyed([
            <>פחת נצבר על המחשבים בפתיחה: 120,000 ÷ 4 × 2 = 60,000 ₪. פחת 2023 לכל העשרה: 30,000 ₪.</>,
            <>מכירת 5: ח׳ מזומן 30,000, ח׳ פחת נצבר 45,000 (60,000 ÷ 4 × 3) / ז׳ מחשבים 60,000, ז׳ רווח הון 15,000.</>,
            <>מכונות: 250,000 ÷ 5 = 50,000 ₪, ועוד 360,000 ÷ 5 × ½ = 36,000 ₪ — הוצאות פחת 86,000 ₪.</>,
            <>יתרות מתוקנות: מחשבים — עלות 60,000, פחת נצבר 45,000; מכונות — עלות 610,000, פחת נצבר 86,000.</>,
          ])}
        />
        <Remember>הסדר בגיליון: קודם הפחת של השנה לכל הנכסים (כולל אלה שנמכרו — עד המכירה), ורק אחר כך פקודת המכירה.</Remember>
      </>
    ),
    check: quiz("ppe-worksheet", [
      {
        q: "במאזן הבוחן חסרה יתרת פחת נצבר בפתיחה. איך מוצאים אותה?",
        options: ["פחת שנתי × השנים שעברו עד תחילת השנה", "עלות פחות שווי שוק", "פחת השנה בלבד", "היא תמיד אפס"],
        answer: 0,
        why: "פחת נצבר = כל הפחת מיום הזמינות עד אותו תאריך.",
      },
      {
        q: "נכס נקנה השנה. מה יתרת הפחת הנצבר שלו בפתיחה?",
        options: ["0", "פחת שנה", "חצי שנה", "עלותו"],
        answer: 0,
        why: "הוא לא היה קיים בסוף השנה הקודמת.",
      },
    ]),
  },
};
