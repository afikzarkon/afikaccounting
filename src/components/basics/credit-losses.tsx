import { Callout, DataTable } from "@/components/study/blocks";
import { type Entry, round2, type TAccount } from "@/lib/learn/basics";
import { ALLOW, ALON, AR, BARAK, DOR, ERAN, GILBOA, HEN } from "@/lib/learn/credit-losses";
import { CreditLossCalculator } from "./credit-calculator";
import { Card, Chapter, EntryView, Money, Rule, TCard, Term } from "./ui";

const pct = (r: number) => `${round2(r * 100)}%`;
const f = (v: number) => v.toLocaleString("he-IL");
const pick = (accounts: TAccount[], ...names: string[]) => names.map((n) => accounts.find((t) => t.account === n)!).filter(Boolean);

/** Customers as the balance sheet shows them: gross, less the allowance, net. */
function NetView({ gross, allowance, caption }: { gross: number; allowance: number; caption: string }) {
  return (
    <figure className="my-3 overflow-hidden rounded-xl border-2 border-accent/40 bg-surface">
      <figcaption className="bg-accent px-4 py-2 text-[15px] font-bold text-accent-fg">{caption}</figcaption>
      <div className="divide-y divide-line/60 text-sm">
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">לקוחות (ברוטו)</span>
          <Money v={gross} plain />
        </p>
        <p className="flex justify-between gap-3 px-4 py-2">
          <span className="text-fg">בניכוי: הפרשה להפסדי אשראי חזויים</span>
          <Money v={-allowance} plain className="text-danger" />
        </p>
        <p className="flex justify-between gap-3 border-t-2 border-fg/70 px-4 py-2 font-bold text-fg">
          <span>לקוחות, נטו</span>
          <Money v={round2(gross - allowance)} plain />
        </p>
      </div>
    </figure>
  );
}

/** A few entries side by side. */
function Entries({ entries, cols = 2 }: { entries: Entry[]; cols?: 2 | 3 }) {
  return (
    <div className={cols === 3 ? "grid gap-3 xl:grid-cols-3" : "grid gap-3 lg:grid-cols-2"}>
      {entries.map((x) => (
        <EntryView key={x.id} entry={x} title={`${x.id}. ${x.text}`} />
      ))}
    </div>
  );
}

function TCards({ accounts }: { accounts: TAccount[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {accounts.map((t) => (
        <TCard key={t.account} t={t} />
      ))}
    </div>
  );
}

/** One numbered step of a worked solution. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs text-accent-fg">{n}</span>
        {title}
      </p>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </div>
  );
}

const ENTRY_TABLE: [string, string, string, string][] = [
  ["מכירה באשראי", "לקוחות", "מכירות", "לקוחות ברוטו גדלים"],
  ["גבייה מלקוח", "מזומן", "לקוחות", "לקוחות ברוטו קטנים; ההפרשה לא משתנה"],
  ["הגדלת ההפרשה בסוף השנה", "הוצאות הפסדי אשראי", "הפרשה להפסדי אשראי חזויים", "הוצאה ברווח והפסד; לקוחות נטו קטנים"],
  ["ביטול הפרשה עודפת", "הפרשה להפסדי אשראי חזויים", "הוצאות הפסדי אשראי", "מקטין את ההוצאה; לקוחות נטו גדלים"],
  ["מחיקת חוב אבוד", "הפרשה להפסדי אשראי חזויים", "לקוחות", "ברוטו וההפרשה קטנים יחד; הנטו ורווח והפסד לא משתנים"],
  ["גביית חוב שנמחק — שלב 1", "לקוחות", "הפרשה להפסדי אשראי חזויים", "מחזירים את החוב לספרים"],
  ["גביית חוב שנמחק — שלב 2", "מזומן", "לקוחות", "גבייה רגילה"],
];

const MISTAKES: [string, string][] = [
  ["רושמים הוצאה במחיקת חוב אבוד", "המחיקה היא כנגד ההפרשה בלבד. ההוצאה נרשמה כבר כשהופרש, ותושלם — אם צריך — בהתאמה של סוף השנה."],
  ["רושמים כהוצאה את ההפרשה הנדרשת כולה", "ההוצאה היא רק ההפרש בין הנדרשת לבין היתרה שכבר יש בהפרשה (אחרי מחיקות וגביות)."],
  ["מחשבים הפרשה כללית גם על הלקוח הספציפי", "קודם מוציאים את הלקוח הספציפי מהבסיס, ורק על השאר מחילים את האחוז הכללי."],
  ["מחשבים את האחוז לפני מחיקת החובות האבודים", "האחוז חל על יתרת הלקוחות בסוף השנה — אחרי המחיקות, הגבייה והמכירות."],
  ["מציגים במאזן רק את הלקוחות נטו", "מציגים שלוש שורות: לקוחות ברוטו, בניכוי ההפרשה, ולקוחות נטו."],
  ["חושבים שקניות באשראי משפיעות על ההפרשה", "קניות באשראי מגדילות ספקים — התחייבות. אין להן קשר ללקוחות או להפרשה."],
];

const SELF: { q: string; a: string }[] = [
  {
    q: "יתרת ההפרשה ב-1.1 היא 25,000. במהלך השנה נמחקו חובות של 31,000. ההפרשה הנדרשת בסוף השנה 40,000. מה הוצאות הפסדי האשראי?",
    a: "יתרה לפני התאמה: 25,000 − 31,000 = 6,000 בחובה (מינוס 6,000). כדי להגיע ל-40,000 בזכות צריך 46,000. פקודה: ח' הוצאות הפסדי אשראי / ז' הפרשה 46,000.",
  },
  {
    q: "יתרת ההפרשה ב-31.12 היא 54,000 והוצאות הפסדי האשראי השנה 18,000. נמחקו חובות של 9,000 ונגבה חוב שנמחק בעבר בסך 2,000. מה הייתה יתרת הפתיחה?",
    a: "פתיחה − מחיקות + גביית חוב שנמחק + הוצאה = סגירה. פתיחה = 54,000 − 18,000 + 9,000 − 2,000 = 43,000.",
  },
  {
    q: "לקוחות 400,000, מהם לקוח בקשיים שחייב 50,000 (הפרשה ספציפית 80%). הפרשה כללית 3%. יתרת ההפרשה לפני התאמה 60,000. מה הפקודה?",
    a: "ספציפית 40,000 + כללית 3% × 350,000 = 10,500 → נדרשת 50,500. קיימת 60,000 → ביטול 9,500: ח' הפרשה / ז' הוצאות הפסדי אשראי 9,500.",
  },
];

export function CreditLossChapters() {
  const g = GILBOA;
  return (
    <>
      <Chapter n={1} id="cl-why" title="למה מפרישים להפסדי אשראי" lead="לקוחות שלא ישלמו הם הפסד כבר היום — גם אם עוד לא יודעים מי">
        <p>
          כשעסק מוכר באשראי, הוא רושם <Term he="לקוחות" /> — נכס: כסף שמגיע לו. אבל ניסיון מלמד שלא כל הלקוחות ישלמו. אם נציג את כל החוב במאזן, נציג נכס
          גדול ממה שבאמת ייגבה, ורווח גדול ממה שבאמת הורווח.
        </p>
        <p>
          לכן בכל סוף שנה מעריכים כמה מהחוב <strong>צפוי</strong> שלא ייגבה, ורושמים את האומדן בחשבון נפרד:{" "}
          <Term he="הפרשה להפסדי אשראי חזויים" />. זה <Term he="חשבון מנוגד לנכס" /> — יתרתו בזכות, והוא מקטין את הלקוחות במאזן. את חשבון הלקוחות עצמו לא
          מקטינים, כי עוד לא יודעים <em>איזה</em> לקוח לא ישלם.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <Card title="לקוחות ברוטו">
            <p>כל מה שהלקוחות חייבים לפי החשבוניות. יתרה בחובה.</p>
          </Card>
          <Card title="הפרשה להפסדי אשראי">
            <p>האומדן של החלק שלא ייגבה. יתרה בזכות — מנוגדת ללקוחות.</p>
          </Card>
          <Card title="לקוחות נטו">
            <p>ברוטו פחות ההפרשה — מה שהעסק באמת מצפה לגבות. זה הסכום שנכנס לסך הנכסים.</p>
          </Card>
        </div>
        <p>
          ההוצאה — <Term he="הוצאות הפסדי אשראי" /> — נרשמת ברווח והפסד של <strong>השנה שבה נעשתה המכירה</strong>, לפי עיקרון ההקבלה: ההפסד הצפוי שייך
          לשנה שבה נרשמה ההכנסה, לא לשנה שבה התברר שהלקוח פשט רגל.
        </p>
        <Rule>שלוש פעולות בלבד נוגעות בהפרשה: הוצאה בסוף השנה (מגדילה), מחיקת חוב אבוד (מקטינה), וגבייה של חוב שנמחק (מחזירה).</Rule>
      </Chapter>

      <Chapter n={2} id="cl-taccount" title="כרטיס ההפרשה" lead="יתרת פתיחה, מחיקות, התאמה — ויתרת סגירה">
        <p>כל שאלה על הפסדי אשראי נפתרת בכרטיס אחד. זה המבנה שלו (חובה מימין, זכות משמאל):</p>
        <DataTable
          caption="כרטיס הפרשה להפסדי אשראי חזויים"
          head={["חובה — מה מקטין את ההפרשה", "זכות — מה מגדיל את ההפרשה"]}
          rows={[
            ["מחיקת חובות אבודים", "יתרת פתיחה (1.1)"],
            ["ביטול הפרשה עודפת (קיטון)", "גביית חובות שנמחקו בעבר"],
            ["", "הוצאות הפסדי אשראי (גידול)"],
            ["יתרת סגירה (31.12) — ההפרשה הנדרשת", ""],
          ]}
        />
        <Rule>יתרת פתיחה − מחיקות + גביית חובות שנמחקו + הוצאה (או − ביטול) = יתרת סגירה</Rule>
        <p>
          הסדר בשאלות תמיד זהה: קודם רושמים את מה שקרה במהלך השנה (מחיקות, גביות), אחר כך מחשבים את ההפרשה <strong>הנדרשת</strong> בסוף השנה, וההוצאה היא
          ההפרש — מה שחסר בכרטיס כדי להגיע לנדרשת.
        </p>
        <Card title='דוגמה: חברת אלון בע"מ, 2025'>
          <p>
            יתרת ההפרשה ב-1.1.2025: <Money v={ALON.opening} />. ב-15.5 נמחק חוב אבוד של <Money v={ALON.written} />. ב-31.12 יתרת הלקוחות (ברוטו, אחרי
            המחיקה) <Money v={ALON.gross} />, וההנהלה מעריכה ש-{pct(ALON.rate)} לא ייגבו.
          </p>
          <DataTable
            head={["", "חישוב", "סכום"]}
            rows={[
              ["יתרת פתיחה", "", ALON.opening],
              ["פחות מחיקה", "", -ALON.written],
              ["יתרה לפני התאמה", `${f(ALON.opening)} − ${f(ALON.written)}`, ALON.before],
              ["הפרשה נדרשת", `${f(ALON.gross)} × ${pct(ALON.rate)}`, ALON.required],
            ]}
            foot={["הוצאות הפסדי אשראי", "נדרשת − לפני התאמה", ALON.required - ALON.before]}
          />
          <Entries entries={ALON.entries} />
          <TCards accounts={pick(ALON.result.accounts, ALLOW)} />
          <NetView gross={ALON.gross} allowance={ALON.result.allowance} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
        </Card>
        <Card title="ואם ההפרשה הקיימת גדולה מהנדרשת? ביטול הפרשה">
          <p>
            נניח שבאלון ההנהלה מעריכה רק {pct(ALON.lowRate)}: נדרשת <Money v={ALON.lowRequired} />, אבל בכרטיס כבר יש <Money v={ALON.before} />. יש עודף של{" "}
            <Money v={ALON.before - ALON.lowRequired} />, ומבטלים אותו — ההפרשה קטנה (חובה), וההוצאה קטנה (זכות). אם אין השנה הוצאה אחרת, הזכות הזו מוצגת
            ברווח והפסד כהקטנת הוצאות (או כהכנסה מביטול הפרשה).
          </p>
          <EntryView entry={ALON.reversal[1]} title={`2. ${ALON.reversal[1].text}`} />
          <TCards accounts={pick(ALON.reversed.accounts, ALLOW)} />
        </Card>
      </Chapter>

      <Chapter n={3} id="cl-entries" title="כל פקודות היומן" lead="שבע פקודות — וכל שאלה בנויה מהן">
        <div className="my-4 overflow-hidden rounded-xl border border-line">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] table-fixed text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead className="bg-surface-2/60">
                <tr className="text-xs text-muted">
                  <th className="px-3 py-2.5 text-start font-semibold">הפעולה</th>
                  <th className="px-3 py-2.5 text-start font-semibold text-debit">חובה</th>
                  <th className="px-3 py-2.5 text-start font-semibold text-credit">זכות</th>
                  <th className="px-3 py-2.5 text-start font-semibold">ההשפעה</th>
                </tr>
              </thead>
              <tbody>
                {ENTRY_TABLE.map(([a, dr, cr, effect]) => (
                  <tr key={a} className="border-t border-line/70 align-top">
                    <td className="px-3 py-2.5 font-medium text-fg">{a}</td>
                    <td className="px-3 py-2.5 font-medium text-debit">{dr}</td>
                    <td className="px-3 py-2.5 font-medium text-credit">{cr}</td>
                    <td className="px-3 py-2.5 text-[13px] text-muted">{effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Callout kind="warn" title="למה מחיקת חוב לא נוגעת ברווח והפסד?">
          <p>
            כי ההפסד כבר נרשם — כשהפרשנו. המחיקה רק מעבירה את החוב מ&quot;צפוי שלא ייגבה&quot; ל&quot;ודאי שלא ייגבה&quot;: הלקוחות והפרשה קטנים באותו סכום, והלקוחות
            נטו לא משתנים. אם המחיקות גדולות מההפרשה, הכרטיס עובר זמנית לחובה — וההתאמה של סוף השנה משלימה.
          </p>
        </Callout>
        <Callout title="גביית חוב שנמחק — למה בשני שלבים?">
          <p>
            כדי שכרטיס הלקוח יספר את כל הסיפור: החוב חוזר לספרים (מבטלים את המחיקה), ואז נגבה כרגיל. התוצאה נטו: מזומן בחובה, הפרשה בזכות. ההפרשה גדלה
            — ולכן ההוצאה של סוף השנה תהיה קטנה יותר באותו סכום.
          </p>
        </Callout>
      </Chapter>

      <Chapter n={4} id="cl-opening" title="נעלם ביתרת הפתיחה" lead="נתונה הסגירה — מחשבים אחורה">
        <p>
          לפעמים השאלה נותנת את סוף הסיפור ומבקשת את ההתחלה. הכלי: אותה משוואת כרטיס, רק פותרים אותה לנעלם. כך גם בכרטיס הלקוחות:
        </p>
        <Rule>לקוחות: פתיחה + מכירות באשראי − גבייה − מחיקות = סגירה</Rule>
        <Card title='דוגמה: חברת ברק בע"מ, 2025'>
          <p>
            נתונים ל-31.12.2025: לקוחות ברוטו <Money v={BARAK.closingGross} />, וההפרשה בסוף השנה {pct(BARAK.rate)} מהם. ברווח והפסד של 2025 הוצאות הפסדי
            אשראי <Money v={BARAK.expense} />. במהלך השנה: מכירות באשראי <Money v={BARAK.creditSales} />, גבייה מלקוחות <Money v={BARAK.collections} />,
            ומחיקת חובות אבודים <Money v={BARAK.written} />. מה היו יתרות הלקוחות וההפרשה ב-1.1.2025?
          </p>
          <div className="space-y-3">
            <Step n={1} title="יתרת הסגירה של ההפרשה">
              <p>
                {f(BARAK.closingGross)} × {pct(BARAK.rate)} = <Money v={BARAK.closingAllowance} />.
              </p>
            </Step>
            <Step n={2} title="יתרת הפתיחה של ההפרשה — הנעלם">
              <p>
                פתיחה − מחיקות + הוצאה = סגירה, ולכן: פתיחה = {f(BARAK.closingAllowance)} − {f(BARAK.expense)} + {f(BARAK.written)} ={" "}
                <strong>
                  <Money v={BARAK.openingAllowance} />
                </strong>
                .
              </p>
            </Step>
            <Step n={3} title="יתרת הפתיחה של הלקוחות — הנעלם">
              <p>
                פתיחה = סגירה − מכירות באשראי + גבייה + מחיקות = {f(BARAK.closingGross)} − {f(BARAK.creditSales)} + {f(BARAK.collections)} + {f(BARAK.written)} ={" "}
                <strong>
                  <Money v={BARAK.openingGross} />
                </strong>
                .
              </p>
            </Step>
            <Step n={4} title="בדיקה: רושמים קדימה ומגיעים לסגירה הנתונה">
              <Entries entries={BARAK.entries} />
              <TCards accounts={pick(BARAK.result.accounts, AR, ALLOW)} />
            </Step>
          </div>
          <NetView gross={BARAK.result.gross} allowance={BARAK.result.allowance} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
        </Card>
      </Chapter>

      <Chapter n={5} id="cl-closing" title="חישוב יתרת הסגירה" lead="אחוז מהלקוחות, או ניתוח גיל חובות">
        <p>
          ההפרשה הנדרשת בסוף השנה היא אומדן. שתי השיטות הנפוצות בשאלות: <strong>אחוז אחיד</strong> מיתרת הלקוחות ברוטו, או{" "}
          <Term he="ניתוח גיל חובות" /> — מחלקים את הלקוחות לפי כמה זמן החוב פתוח, וככל שהחוב ותיק יותר, אחוז ההפרשה גבוה יותר.
        </p>
        <Card title='דוגמה: חברת חן בע"מ, 31.12.2025'>
          <p>
            לקוחות ברוטו <Money v={HEN.gross} />. ההפרשה ב-1.1 הייתה <Money v={HEN.opening} />, ובמהלך השנה נמחקו <Money v={HEN.written} /> — לפני ההתאמה יש
            בכרטיס <Money v={HEN.before} />.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="font-semibold text-fg">שיטה א: אחוז אחיד של {pct(HEN.flatRate)}</p>
              <p className="text-sm text-muted">
                נדרשת: {f(HEN.gross)} × {pct(HEN.flatRate)} = <Money v={HEN.flat} />. בכרטיס יש יותר — מבטלים <Money v={HEN.before - HEN.flat} />.
              </p>
              <EntryView entry={HEN.flatEntry} title={`א. ${HEN.flatEntry.text}`} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-fg">שיטה ב: ניתוח גיל חובות</p>
              <DataTable
                head={["גיל החוב", "יתרה", "אחוז", "הפרשה"]}
                rows={HEN.buckets.map((b) => [b.label, b.amount, pct(b.rate), b.allowance])}
                foot={["סה״כ", HEN.bucketsTotal, "", HEN.aging]}
              />
              <p className="text-sm text-muted">
                נדרשת <Money v={HEN.aging} />, בכרטיס <Money v={HEN.before} /> — משלימים <Money v={HEN.aging - HEN.before} />.
              </p>
              <EntryView entry={HEN.agingEntry} title={`ב. ${HEN.agingEntry.text}`} />
            </div>
          </div>
          <Rule>אותה יתרה לפני התאמה, שתי שיטות — ושני כיוונים. ההוצאה תלויה תמיד בהפרש, לא בנדרשת לבדה.</Rule>
        </Card>
      </Chapter>

      <Chapter n={6} id="cl-specific" title="הפרשה ספציפית מול הפרשה כללית" lead="לקוח בקשיים מקבל חישוב משלו — ויוצא מהבסיס הכללי">
        <p>
          <Term he="הפרשה ספציפית" /> נקבעת ללקוח מסוים שידוע שהוא בקשיים (הליכי פשיטת רגל, צ&apos;קים שחזרו): מעריכים איזה חלק מהחוב שלו לא ייגבה.{" "}
          <Term he="הפרשה כללית" /> היא אחוז על <strong>שאר</strong> הלקוחות. הלקוח הספציפי לא נכנס לבסיס הכללי — אחרת ההפסד שלו נספר פעמיים.
        </p>
        <Card title='דוגמה: חברת דור בע"מ, 31.12.2025'>
          <p>
            לקוחות ברוטו <Money v={DOR.gross} />, מהם <Money v={DOR.specificDebt} /> של &quot;{DOR.specificName}&quot; שנקלע לקשיים — מעריכים ש-
            {pct(DOR.specificRate)} מהחוב לא ייגבה. על שאר הלקוחות מפרישים {pct(DOR.generalRate)}. לפני ההתאמה יש בכרטיס <Money v={DOR.before} />.
          </p>
          <DataTable
            caption="נכון: הלקוח הספציפי מחוץ לבסיס הכללי"
            head={["", "חישוב", "סכום"]}
            rows={[
              ["הפרשה ספציפית", `${f(DOR.specificDebt)} × ${pct(DOR.specificRate)}`, DOR.specific],
              ["הפרשה כללית", `(${f(DOR.gross)} − ${f(DOR.specificDebt)}) × ${pct(DOR.generalRate)}`, DOR.general],
              ["הפרשה נדרשת", "ספציפית + כללית", DOR.required],
              ["פחות יתרה לפני התאמה", "", -DOR.before],
            ]}
            foot={["הוצאות הפסדי אשראי", "", DOR.required - DOR.before]}
          />
          <DataTable
            caption="שגוי: האחוז הכללי על כל הלקוחות"
            head={["", "חישוב", "סכום"]}
            rows={[
              ["הפרשה ספציפית", `${f(DOR.specificDebt)} × ${pct(DOR.specificRate)}`, DOR.specific],
              ["הפרשה כללית", `${f(DOR.gross)} × ${pct(DOR.generalRate)}`, DOR.wrongGeneral],
            ]}
            foot={["נדרשת (שגוי)", `עודף של ${f(DOR.wrongRequired - DOR.required)}`, DOR.wrongRequired]}
          />
          <EntryView entry={DOR.entry} title={`${DOR.entry.text} — עם הלקוח הספציפי`} />
          <NetView gross={DOR.gross} allowance={DOR.required} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
        </Card>
        <Card title="וריאציה: הלקוח פשט רגל לפני סוף השנה">
          <p>
            אם עוד לפני 31.12 התברר ש&quot;{DOR.specificName}&quot; לא ישלם דבר, זה כבר לא אומדן — זה חוב אבוד. מוחקים את כל <Money v={DOR.specificDebt} />{" "}
            כנגד ההפרשה, הלקוח יוצא מהלקוחות, ואין לו יותר הפרשה ספציפית. המחיקה גדולה מהיתרה שבכרטיס, ולכן לפני ההתאמה ההפרשה בחובה:{" "}
            <Money v={-DOR.bankruptBefore} />.
          </p>
          <p>
            נדרשת: {f(DOR.bankruptGross)} × {pct(DOR.generalRate)} = <Money v={DOR.bankruptRequired} />. ההתאמה משלימה מ-
            <Money v={-DOR.bankruptBefore} /> בחובה עד <Money v={DOR.bankruptRequired} /> בזכות: <Money v={DOR.bankruptResult.expense} />.
          </p>
          <Entries entries={DOR.bankrupt} />
          <TCards accounts={pick(DOR.bankruptResult.accounts, AR, ALLOW)} />
        </Card>
      </Chapter>

      <Chapter n={7} id="cl-flow" title="מכירות באשראי, גבייה וחוב שחזר" lead="איך תנועות השנה בונות את יתרת הלקוחות — לפני ההפרשה ואחריה">
        <Card title='דוגמה: חברת ערן בע"מ, 2025'>
          <p>
            ב-1.1.2025: לקוחות <Money v={ERAN.openingGross} />, הפרשה <Money v={ERAN.openingAllowance} />. במהלך השנה: מכירות באשראי{" "}
            <Money v={ERAN.creditSales} />, גבייה <Money v={ERAN.collections} />, קניות באשראי <Money v={ERAN.creditPurchases} />, מחיקת חוב אבוד{" "}
            <Money v={ERAN.written} />, וגבייה של חוב שנמחק ב-2024 בסך <Money v={ERAN.recovered} />. בסוף השנה מפרישים {pct(ERAN.rate)} מהלקוחות.
          </p>
          <Entries entries={ERAN.year} />
          <Callout kind="check" title="הקניות באשראי לא נוגעות בלקוחות">
            <p>פקודה 3 מגדילה ספקים (התחייבות) וקניות (הוצאה). אין לה קשר ללקוחות או להפרשה — היא כאן כי שאלות בחינה אוהבות לשלב אותה כמסיח.</p>
          </Callout>
          <div className="grid gap-4 lg:grid-cols-2">
            <NetView gross={ERAN.mid.gross} allowance={ERAN.mid.allowance} caption="לפני ההתאמה של סוף השנה" />
            <NetView gross={ERAN.result.gross} allowance={ERAN.result.allowance} caption="אחרי ההתאמה — כפי שיוצג במאזן" />
          </div>
          <p>
            נדרשת: {f(ERAN.mid.gross)} × {pct(ERAN.rate)} = <Money v={ERAN.required} />. בכרטיס לפני התאמה: {f(ERAN.openingAllowance)} − {f(ERAN.written)} +{" "}
            {f(ERAN.recovered)} = <Money v={ERAN.mid.allowance} />. ההוצאה: <Money v={ERAN.result.expense} />.
          </p>
          <EntryView entry={ERAN.adj} title={`${ERAN.adj.id}. ${ERAN.adj.text}`} />
          <TCards accounts={pick(ERAN.result.accounts, AR, ALLOW)} />
        </Card>
      </Chapter>

      <Chapter n={8} id="cl-exam" title="שאלה ברמת בחינה" lead="הכול ביחד: נעלם בפתיחה, אשראי, פשיטת רגל, חוב שחזר, לקוח ספציפי והצגה במאזן">
        <Card title='חברת גלבוע בע"מ — 2025'>
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              במאזן ליום 31.12.2024 הוצגו לקוחות נטו <Money v={g.openingNet} />. ההפרשה באותו יום הייתה {pct(g.openingRate)} מיתרת הלקוחות ברוטו. יתרת הספקים
              הייתה <Money v={g.openingSuppliers} />.
            </li>
            <li>
              ב-2025: מכירות באשראי <Money v={g.creditSales} />, מכירות במזומן <Money v={g.cashSales} />, גבייה מלקוחות <Money v={g.collections} />.
            </li>
            <li>
              קניות באשראי <Money v={g.creditPurchases} />, תשלומים לספקים <Money v={g.supplierPayments} />.
            </li>
            <li>
              ב-15.6.2025 פשטה רגל &quot;{g.bankruptName}&quot;, שחייבה <Money v={g.bankruptDebt} />. החוב נמחק.
            </li>
            <li>
              ב-10.9.2025 נגבה במזומן חוב של <Money v={g.recovered} /> שנמחק ב-2023.
            </li>
            <li>
              ב-31.12.2025: הלקוח &quot;{g.specificName}&quot; חייב <Money v={g.specificDebt} /> ונמצא בקשיים — הפרשה ספציפית {pct(g.specificRate)}. על שאר הלקוחות
              — הפרשה כללית {pct(g.generalRate)}.
            </li>
          </ul>
          <p className="font-semibold text-fg">
            נדרש: (1) יתרות הפתיחה של הלקוחות וההפרשה; (2) פקודות היומן ל-2025; (3) הוצאות הפסדי האשראי; (4) סעיף הלקוחות במאזן ליום 31.12.2025.
          </p>
        </Card>

        <h3 className="pt-2 text-lg font-semibold text-fg">הפתרון, שלב אחר שלב</h3>
        <div className="space-y-3">
          <Step n={1} title="יתרות פתיחה — מתוך הנטו">
            <p>
              הנטו הוא ברוטו פחות {pct(g.openingRate)}, כלומר {pct(1 - g.openingRate)} מהברוטו. ברוטו = {f(g.openingNet)} ÷ {pct(1 - g.openingRate)} ={" "}
              <strong>
                <Money v={g.openingGross} />
              </strong>
              . הפרשה = {f(g.openingGross)} − {f(g.openingNet)} ={" "}
              <strong>
                <Money v={g.openingAllowance} />
              </strong>
              .
            </p>
          </Step>
          <Step n={2} title="פקודות היומן של השנה">
            <Entries entries={g.year} />
          </Step>
          <Step n={3} title="יתרת הלקוחות ברוטו בסוף השנה">
            <p>
              {f(g.openingGross)} + {f(g.creditSales)} − {f(g.collections)} − {f(g.bankruptDebt)} + {f(g.recovered)} − {f(g.recovered)} ={" "}
              <strong>
                <Money v={g.mid.gross} />
              </strong>
              . מכירות במזומן, קניות ותשלומים לספקים לא נכנסים לחישוב.
            </p>
          </Step>
          <Step n={4} title="ההפרשה הנדרשת">
            <DataTable
              head={["", "חישוב", "סכום"]}
              rows={[
                ["הפרשה ספציפית", `${f(g.specificDebt)} × ${pct(g.specificRate)}`, g.specific],
                ["הפרשה כללית", `(${f(g.mid.gross)} − ${f(g.specificDebt)}) × ${pct(g.generalRate)}`, g.general],
              ]}
              foot={["הפרשה נדרשת", "", g.required]}
            />
          </Step>
          <Step n={5} title="היתרה בכרטיס לפני ההתאמה, וההוצאה">
            <p>
              {f(g.openingAllowance)} − {f(g.bankruptDebt)} + {f(g.recovered)} = <Money v={g.mid.allowance} />. ההוצאה: {f(g.required)} − {f(g.mid.allowance)} ={" "}
              <strong>
                <Money v={g.result.expense} />
              </strong>
              .
            </p>
            <EntryView entry={g.adj} title={`${g.adj.id}. ${g.adj.text}`} />
          </Step>
          <Step n={6} title="כרטיסי הלקוחות וההפרשה">
            <TCards accounts={pick(g.result.accounts, AR, ALLOW)} />
          </Step>
          <Step n={7} title="הצגה בדוחות">
            <div className="grid gap-4 lg:grid-cols-2">
              <NetView gross={g.result.gross} allowance={g.result.allowance} caption="המאזן ליום 31.12.2025 — סעיף הלקוחות" />
              <figure className="my-3 overflow-hidden rounded-xl border-2 border-fg/30 bg-surface">
                <figcaption className="bg-fg px-4 py-2 text-[15px] font-bold text-surface">רווח והפסד לשנת 2025 — מתוך</figcaption>
                <div className="divide-y divide-line/60 text-sm">
                  <p className="flex justify-between gap-3 px-4 py-2">
                    <span className="text-fg">מכירות (באשראי ובמזומן)</span>
                    <Money v={g.creditSales + g.cashSales} plain />
                  </p>
                  <p className="flex justify-between gap-3 px-4 py-2">
                    <span className="text-fg">הוצאות הפסדי אשראי</span>
                    <Money v={-g.result.expense} plain className="text-danger" />
                  </p>
                </div>
              </figure>
            </div>
          </Step>
        </div>
      </Chapter>

      <Chapter n={9} id="cl-tools" title="מחשבון, טעויות ותרגול" lead="בדקו את עצמכם">
        <p>הזינו את נתוני השאלה — המחשבון מחשב את ההפרשה הנדרשת, ההוצאה או הביטול, ואת פקודת ההתאמה.</p>
        <CreditLossCalculator />
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">טעויות נפוצות</h3>
          <ul className="mt-3 space-y-2.5">
            {MISTAKES.map(([wrong, right]) => (
              <li key={wrong} className="text-sm">
                <span className="font-semibold text-danger">✗ {wrong}</span>
                <span className="mt-0.5 block text-fg/85">✓ {right}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-fg">תרגול עצמי</h3>
          <div className="mt-3 divide-y divide-line">
            {SELF.map(({ q, a }, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer list-none text-[15px] font-medium text-fg [&::-webkit-details-marker]:hidden">
                  <span className="num me-2 text-accent">{i + 1}.</span>
                  {q}
                  <span className="ms-2 text-xs text-accent group-open:hidden">הציגו פתרון</span>
                </summary>
                <p className="mt-2 rounded-lg bg-surface-2/70 px-3 py-2 text-sm text-fg">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Chapter>
    </>
  );
}
