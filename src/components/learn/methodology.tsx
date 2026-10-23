import { BookOpenCheck, CalendarCheck, CircleCheck, CircleX, Percent, Receipt, Scale } from "lucide-react";
import { Callout, DataTable, Dt, JournalEntry, Num } from "@/components/guide/blocks";
import { Formula, Tex } from "@/components/guide/math";
import { StepCard, texNum } from "./ui";
import { ProrationWidget, StartDateQuiz } from "./widgets";

// The worked example all five steps follow; it lands on the simulator's defaults.
const COST_LINES: [string, number, boolean][] = [
  ["מחיר המכונה לפי חשבונית הספק (אחרי הנחה מסחרית)", 280_000, true],
  ["הובלה וביטוח בדרך למפעל", 6_000, true],
  ["התקנה, הרכבה וכיול על ידי טכנאי הספק", 9_000, true],
  ["יציקת יסודות בטון למכונה", 5_000, true],
  ["השתלמות לעובדים שיפעילו את המכונה", 4_000, false],
  ["מודעות פרסום על קו הייצור החדש", 3_000, false],
  ["הפסדי הרצה בחודש הראשון לאחר שהמכונה כבר מוכנה", 2_000, false],
];
const COST = COST_LINES.filter(([, , inc]) => inc).reduce((s, [, v]) => s + v, 0);
const EXPENSED = COST_LINES.filter(([, , inc]) => !inc).reduce((s, [, v]) => s + v, 0);
const SALVAGE = 30_000;
const LIFE = 5;
const BASE = COST - SALVAGE;
const ANNUAL = BASE / LIFE;
const FIRST = (ANNUAL * 9) / 12;

const INCLUDED: [string, string][] = [
  ["מחיר רכישה, כולל מכס ומסים שאינם ניתנים להשבה, בניכוי הנחות", "16.16(a)"],
  ["הובלה, טיפול וביטוח עד הגעה למיקום", "16.17(c)"],
  ["הכנת האתר ויסודות", "16.17(b)"],
  ["התקנה והרכבה", "16.17(d)"],
  ["בדיקת תקינות (Testing) — התמורה ממכירת פריטי ניסיון נזקפת לרווח והפסד", "16.17(e), 20A"],
  ["שכר טרחה מקצועי (מהנדסים, אדריכלים)", "16.17(f)"],
  ["הטבות עובדים שנובעות ישירות מהקמת הנכס", "16.17(a)"],
  ["אומדן ראשוני של פירוק, פינוי ושיקום האתר (בערך נוכחי)", "16.16(c)"],
  ["עלויות אשראי לנכס כשיר", "IAS 23"],
];
const EXPENSED_ITEMS: [string, string][] = [
  ["פרסום וקידום מכירות", "16.19(b)"],
  ["הדרכת עובדים וגיוס לקוחות חדשים", "16.19(c)"],
  ["פתיחת מתקן חדש ועלויות הנהלה וכלליות", "16.19(a), (d)"],
  ["הפסדי הרצה ראשוניים, ועלויות כשהנכס מוכן אך עדיין לא בשימוש מלא", "16.20"],
  ["העברה או ארגון מחדש של פעילות", "16.20"],
  ["פחת חומרים וכוח אדם חריגים (בזבוז)", "16.22"],
  ["מע״מ שניתן לקזז", "16.16(a)"],
  ["ריבית בגין אשראי ספקים מעבר לתנאי אשראי רגילים", "16.23"],
];

const ALGORITHM = ["מועד כניסה לשימוש", "בסיס העלות", "בסיס הפחת", "חודשים בשנה א׳", "רישום ובדיקה"];

export function MethodologySection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">האלגוריתם במבט אחד</p>
        <p className="mt-1 text-[15px] text-fg/90">
          כל שאלת פחת במבחן — פשוטה או מסובכת — נפתרת באותם חמשת השלבים, באותו הסדר. לאורך הדרך נפתור דוגמה אחת: מכונה שהוזמנה
          ושולמה ב-<Dt>1.2.X1</Dt> ונכנסה לשימוש ב-<Dt>1.4.X1</Dt>.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {ALGORITHM.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <StepCard step={1} title="זיהוי מועד הכניסה לשימוש (Start Date)" lead="מתי הנכס מוכן לפעול כפי שההנהלה התכוונה — לא מתי שילמו עליו" icon={<CalendarCheck className="h-5 w-5" />}>
        <p>
          לפי <strong>IAS 16.55</strong>, הפחת מתחיל כשהנכס <strong>זמין לשימוש</strong>: נמצא במיקום ובמצב הדרושים כדי לפעול באופן
          שההנהלה התכוונה. התקן מתעניין ביכולת של הנכס להפיק הטבות, לא בתזרים המזומנים — ולכן מועד התשלום, מועד ההזמנה ואפילו מועד
          תחילת הייצור בפועל אינם רלוונטיים.
        </p>
        <StartDateQuiz />
        <Callout kind="warn" title="המלכודת הקלאסית">
          <p>
            &quot;החברה רכשה ושילמה ב-1.2&quot; — ורק בהמשך השאלה, בשורה תמימה: &quot;ההתקנה הסתיימה ב-1.4&quot;. מי שמחשב 11 חודשי פחת במקום 9
            מאבד את כל הלוח. סמנו בטקסט השאלה כל תאריך, ושאלו על כל אחד: האם <em>בתאריך הזה</em> הנכס כבר יכול לעבוד?
          </p>
        </Callout>
      </StepCard>

      <StepCard step={2} title="קביעת בסיס העלות (Cost Basis)" lead="מה מהוון לנכס, ומה נזקף מיד לרווח והפסד" icon={<Receipt className="h-5 w-5" />}>
        <p>
          העיקרון: נכללות רק עלויות <strong>שניתן לייחס במישרין</strong> להבאת הנכס למיקום ולמצב הדרושים לפעולתו (IAS 16.16). כל מה
          שקורה <em>אחרי</em> שהנכס מוכן, או שקשור לעסק ולא לנכס — הוצאה.
        </p>
        <div className="my-4 grid gap-3 md:grid-cols-2">
          <CostList title="נכלל בעלות הנכס (מהוון)" tone="in" items={INCLUDED} />
          <CostList title="נזקף מיידית לרווח והפסד" tone="out" items={EXPENSED_ITEMS} />
        </div>
        <DataTable
          caption="בדוגמה שלנו"
          head={["פריט", "סכום", "טיפול"]}
          rows={COST_LINES.map(([label, v, inc]) => [
            label,
            v,
            <span key="t" className={inc ? "font-medium text-success" : "font-medium text-danger"}>
              {inc ? "עלות הנכס" : "הוצאה"}
            </span>,
          ])}
          foot={[
            "עלות הנכס",
            COST,
            <span key="e" className="text-xs font-normal text-muted">
              ועוד <Num v={EXPENSED} /> להוצאות
            </span>,
          ]}
        />
      </StepCard>

      <StepCard step={3} title="חישוב בסיס הפחת (Depreciable Amount)" lead="הסכום שמתפזר על פני אורך החיים — עלות פחות גרט" icon={<Scale className="h-5 w-5" />}>
        <Formula
          tex={String.raw`\text{Depreciable Amount} = \text{Cost} - \text{Salvage} = ${texNum(COST)} - 30{,}000 = 270{,}000`}
          legend={[
            [String.raw`\text{Cost}`, "העלות מהשלב הקודם"],
            [String.raw`\text{Salvage}`, "ערך גרט (שייר) — מה שצפוי להתקבל בסוף, נטו מעלויות מימוש"],
          ]}
        />
        <p>
          זהו הבסיס של קו ישר, סכום ספרות השנים ויחידות התפוקה. <strong>יוצאת הדופן: יתרה פוחתת</strong> — שם השיעור מוחל על היתרה בספרים
          המלאה, והגרט משמש רצפה בלבד (ראו את הסימולטור).
        </p>
      </StepCard>

      <StepCard step={4} title="התאמת החודשים בשנה א׳ (Proration / Mid-Year)" lead="כמה חודשי פחת נופלים בשנת הכספים הראשונה" icon={<Percent className="h-5 w-5" />}>
        <Formula tex={String.raw`m = 13 - \text{Purchase Month} \qquad D_1 = D_{\text{annual}} \times \frac{m}{12}`} caption="בהנחה שהנכס זמין לשימוש בתחילת החודש ושנת הכספים קלנדרית" />
        <p>
          בדוגמה: אפריל הוא החודש הרביעי, ולכן <Tex>{String.raw`m = 13 - 4 = 9`}</Tex> חודשים. הפחת השנתי בקו ישר הוא{" "}
          <Tex>{String.raw`\frac{270{,}000}{5} = 54{,}000`}</Tex>, ובשנה א׳: <Tex>{String.raw`54{,}000 \times \frac{9}{12} = 40{,}500`}</Tex>. שחקו
          עם החודש:
        </p>
        <ProrationWidget annual={ANNUAL} />
        <Callout title="למה דווקא 13?">
          <p>
            כי החודש עצמו נספר. נכס שנכנס בדצמבר (חודש 12) מופחת חודש אחד: <Tex>{String.raw`13 - 12 = 1`}</Tex>. נכס שנכנס בינואר —{" "}
            <Tex>{String.raw`13 - 1 = 12`}</Tex>, שנה מלאה. אם השאלה מציינת אמצע חודש, בדקו בה את המוסכמה (חצי חודש או חודש שלם).
          </p>
        </Callout>
      </StepCard>

      <StepCard step={5} title="בדיקת שפיות ורישום פקודת היומן" lead="הפקודה הטיפוסית — והבדיקות שתופסות טעויות לפני שהבודק תופס" icon={<BookOpenCheck className="h-5 w-5" />}>
        <div className="my-4 rounded-2xl bg-linear-to-br from-[#0b1d4a] to-[#060d22] p-1 shadow-card ring-1 ring-white/10">
          <div className="rounded-xl bg-surface">
            <JournalEntry
              title="פחת לשנת X1 — קו ישר"
              date="31.12.X1"
              lines={[
                { account: "הוצאות פחת", dr: FIRST },
                { account: "פחת נצבר — מכונות", cr: FIRST },
              ]}
              note={
                <>
                  חובה: הוצאות פחת (רווח והפסד) · זכות: פחת נצבר (מנוגד נכס). היתרה בספרים: <Num v={COST} /> − <Num v={FIRST} /> ={" "}
                  <Num v={COST - FIRST} />.
                </>
              }
            />
          </div>
        </div>
        <Callout kind="check" title="שלוש בדיקות של עשר שניות">
          <ul className="list-inside list-disc space-y-1">
            <li>
              סך הפחת על פני כל החיים = <Tex>{String.raw`C - S`}</Tex> = <Num v={BASE} />, בכל שיטה.
            </li>
            <li>היתרה בספרים אף פעם לא יורדת מתחת לגרט.</li>
            <li>
              נכס של {LIFE} שנים שנכנס באמצע שנה מופיע ב-{LIFE + 1} שנות כספים: 9 חודשים בהתחלה ו-3 בסוף.
            </li>
          </ul>
        </Callout>
      </StepCard>
    </>
  );
}

function CostList({ title, tone, items }: { title: string; tone: "in" | "out"; items: [string, string][] }) {
  const Icon = tone === "in" ? CircleCheck : CircleX;
  return (
    <div className={tone === "in" ? "rounded-xl border border-success/30 bg-success/[0.05]" : "rounded-xl border border-danger/30 bg-danger/[0.04]"}>
      <p className={tone === "in" ? "border-b border-success/20 px-4 py-2.5 text-sm font-semibold text-success" : "border-b border-danger/20 px-4 py-2.5 text-sm font-semibold text-danger"}>
        {title}
      </p>
      <ul className="divide-y divide-line/70 text-sm">
        {items.map(([text, ref]) => (
          <li key={text} className="flex items-start gap-2.5 px-4 py-2">
            <Icon className={tone === "in" ? "mt-0.5 h-4 w-4 shrink-0 text-success" : "mt-0.5 h-4 w-4 shrink-0 text-danger"} />
            <span className="min-w-0 flex-1 text-fg/90">{text}</span>
            <bdi dir="ltr" className="num shrink-0 text-[11px] text-subtle">
              {ref}
            </bdi>
          </li>
        ))}
      </ul>
    </div>
  );
}
