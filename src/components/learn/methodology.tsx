import {
  BookOpenCheck,
  CalendarCheck,
  CircleCheck,
  CircleX,
  ClipboardList,
  GitBranch,
  Hourglass,
  Landmark,
  LineChart,
  ListChecks,
  Percent,
  Receipt,
} from "lucide-react";
import { Callout, DataTable, Dt, JournalEntry, Num } from "./blocks";
import { Formula, Tex } from "./math";
import { StepCard, texNum } from "./ui";
import { ProrationWidget } from "./widgets";

// The worked example every step follows; it lands on the simulator's defaults.
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
  ["מחיר רכישה, כולל מכס ומסים שאינם ניתנים להשבה, בניכוי הנחות", "סעיף 16(א)"],
  ["הובלה, טיפול וביטוח עד הגעה למיקום", "סעיף 17(ג)"],
  ["הכנת האתר ויסודות", "סעיף 17(ב)"],
  ["התקנה והרכבה", "סעיף 17(ד)"],
  ["בדיקה שהנכס פועל כראוי — התמורה ממכירת פריטים שיוצרו בבדיקה נזקפת לרווח והפסד", "סעיפים 17(ה), 20א"],
  ["שכר טרחה מקצועי (מהנדסים, אדריכלים)", "סעיף 17(ו)"],
  ["הטבות עובדים שנובעות ישירות מהקמת הנכס", "סעיף 17(א)"],
  ["אומדן ראשוני של פירוק, פינוי ושיקום האתר (בערך נוכחי)", "סעיף 16(ג)"],
  ["עלויות אשראי לנכס כשיר", "תקן עלויות אשראי"],
];
const EXPENSED_ITEMS: [string, string][] = [
  ["פרסום וקידום מכירות", "סעיף 19(ב)"],
  ["הדרכת עובדים וגיוס לקוחות חדשים", "סעיף 19(ג)"],
  ["פתיחת מתקן חדש ועלויות הנהלה וכלליות", "סעיפים 19(א), (ד)"],
  ["הפסדי הרצה ראשוניים, ועלויות כשהנכס מוכן אך עדיין לא בשימוש מלא", "סעיף 20"],
  ["העברה או ארגון מחדש של פעילות", "סעיף 20"],
  ["פחת חומרים וכוח אדם חריגים (בזבוז)", "סעיף 22"],
  ["מע״מ שניתן לקזז", "סעיף 16(א)"],
  ["ריבית בגין אשראי ספקים מעבר לתנאי אשראי רגילים", "סעיף 23"],
];

const STEPS = [
  "רישום כל הנתונים הבסיסיים",
  "מועד כניסה לשימוש",
  "שיטת פחת",
  "מציאת עלות הנכס",
  "אורך חיים וערך גרט",
  "מודל חשבונאי",
  "שינויים במהלך חיי הנכס",
  "תחילת הפחתה",
  "נדרשי השאלה",
];

const METHODS: [string, string, string][] = [
  ["קו ישר", "ההטבות מהנכס מתפזרות באופן אחיד לאורך השנים", "אותו סכום פחת בכל שנה מלאה"],
  ["יתרה פוחתת", "הנכס מפיק יותר בשנים הראשונות", "שיעור קבוע על היתרה בספרים — הגרט לא מנוכה מהבסיס"],
  ["סכום ספרות השנים", "פחת מואץ שיורד בסכום קבוע משנה לשנה", "משקל לכל שנת חיים: 5/15, 4/15, 3/15..."],
  ["יחידות תפוקה", "הנכס נשחק לפי השימוש בו, לא לפי הזמן", "פחת ליחידה כפול היחידות שהופקו בפועל"],
];

const CHANGES: [string, string][] = [
  ["שיפור או שיפוץ שמאריך את החיים או מגדיל את התפוקה", "מוסיפים לעלות, ומחשבים פחת מחדש על היתרה החדשה לאורך יתרת החיים"],
  ["תיקונים ותחזוקה שוטפת", "הוצאה בתקופה שבה התרחשו — לא נוגעים בנכס"],
  ["שינוי באורך החיים, בערך הגרט או בשיטת הפחת", "שינוי אומדן: לא מתקנים אחורה, מחלקים מחדש את היתרה בספרים מכאן ולהבא"],
  ["הערכה מחדש (רק במודל הערכה מחדש)", "מעדכנים לשווי ההוגן; עלייה לקרן הערכה מחדש, ירידה לרווח והפסד"],
  ["ירידת ערך", "מפחיתים את הנכס לסכום בר-ההשבה, ומחשבים פחת עתידי על היתרה החדשה"],
  ["מכירה, החלפה או גריעה", "רווח או הפסד = התמורה פחות היתרה בספרים במועד הגריעה"],
];

export function MethodologySection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">דרכים לפתור שאלה — במבט אחד</p>
        <p className="mt-1 text-[15px] text-fg/90">
          כל שאלה על רכוש קבוע — פשוטה או מסובכת — נפתרת באותם שלבים, באותו הסדר. לאורך הדרך נפתור דוגמה אחת: מכונה שהוזמנה ושולמה
          ב-<Dt>1.2.X1</Dt> ונכנסה לשימוש ב-<Dt>1.4.X1</Dt>.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2.5 text-sm font-medium text-fg">
              <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <StepCard step={1} title="רישום כל הנתונים הבסיסיים בשאלה" lead="טבלה אחת בצד הדף, לפני שמחשבים משהו" icon={<ClipboardList className="h-5 w-5" />}>
        <p>
          שאלות מבחן מפזרות נתונים לאורך כמה פסקאות, ולפעמים הנתון החשוב ביותר מופיע בשורה תמימה בסוף. עוברים על השאלה פעם אחת ורושמים כל
          נתון במקום קבוע — כך שום דבר לא נשכח, והבודק יכול לעקוב אחרי הפתרון.
        </p>
        <DataTable
          caption="בדוגמה שלנו"
          head={["נתון", "מה כתוב בשאלה"]}
          rows={[
            ["הזמנה ותשלום", <Dt key="d">1.2.X1</Dt>],
            ["סיום ההתקנה — המכונה מוכנה לעבודה", <Dt key="d">1.4.X1</Dt>],
            ["רכיבי עלות", "שבעה סכומים מהחשבוניות (שלב 4)"],
            ["אורך חיים", `${LIFE} שנים`],
            ["ערך גרט", SALVAGE],
            ["שיטת פחת", "קו ישר"],
            ["מודל", "מודל העלות"],
            ["שינויים במהלך החיים", "אין"],
            ["נדרשי השאלה", "פקודת יומן, הצגה מאזנית ליום 31.12.X1 והצגה תוצאתית לשנת X1"],
          ]}
        />
      </StepCard>

      <StepCard step={2} title="מועד הכניסה לשימוש" lead="מתי הנכס מוכן לפעול כפי שההנהלה התכוונה — לא מתי שילמו עליו" icon={<CalendarCheck className="h-5 w-5" />}>
        <p>
          לפי <strong>סעיף 55 לתקן</strong>, הפחת מתחיל כשהנכס <strong>זמין לשימוש</strong>: נמצא במיקום ובמצב הדרושים כדי לפעול באופן
          שההנהלה התכוונה. התקן מתעניין ביכולת של הנכס להפיק הטבות, לא בתזרים המזומנים — ולכן מועד התשלום, מועד ההזמנה ואפילו מועד
          תחילת הייצור בפועל אינם רלוונטיים.
        </p>
        <Callout kind="warn" title="המלכודת הקלאסית">
          <p>
            &quot;החברה רכשה ושילמה ב-1.2&quot; — ורק בהמשך השאלה, בשורה תמימה: &quot;ההתקנה הסתיימה ב-1.4&quot;. מי שמחשב 11 חודשי פחת במקום 9
            מאבד את כל הלוח. סמנו בטקסט השאלה כל תאריך, ושאלו על כל אחד: האם <em>בתאריך הזה</em> הנכס כבר יכול לעבוד?
          </p>
        </Callout>
      </StepCard>

      <StepCard step={3} title="שיטת הפחת" lead="השיטה משקפת את הדרך שבה הנכס מפיק הטבות" icon={<LineChart className="h-5 w-5" />}>
        <p>
          לפי <strong>סעיף 60</strong>, שיטת הפחת צריכה לשקף את דפוס הצריכה של ההטבות מהנכס. במבחן השיטה כמעט תמיד נתונה — המשימה היא לזהות
          אותה ולדעת מה היא משנה בחישוב:
        </p>
        <DataTable head={["שיטה", "מתי מתאימה", "מה זה אומר בחישוב"]} rows={METHODS} />
        <p>
          את כל ארבע השיטות, עם לוח נוסחאות צמוד, אפשר לנסות ב<a href="#simulator" className="font-medium text-accent hover:underline">סימולטור הפחת</a>.
        </p>
      </StepCard>

      <StepCard step={4} title="מציאת עלות הנכס" lead="מה נכנס לעלות הנכס, ומה נזקף מיד לרווח והפסד" icon={<Receipt className="h-5 w-5" />}>
        <p>
          העיקרון: נכללות רק עלויות <strong>שניתן לייחס במישרין</strong> להבאת הנכס למיקום ולמצב הדרושים לפעולתו (סעיף 16). כל מה שקורה{" "}
          <em>אחרי</em> שהנכס מוכן, או שקשור לעסק ולא לנכס — הוצאה.
        </p>
        <div className="my-4 grid gap-3 md:grid-cols-2">
          <CostList title="נכלל בעלות הנכס" tone="in" items={INCLUDED} />
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

      <StepCard step={5} title="אורך חיים וערך גרט" lead="על פני כמה זמן מפחיתים, ואיזה חלק מהעלות לא מפחיתים בכלל" icon={<Hourglass className="h-5 w-5" />}>
        <p>
          <strong>אורך החיים</strong> הוא התקופה שהחברה מצפה להשתמש בנכס — לא כמה זמן הוא מחזיק פיזית. <strong>ערך הגרט</strong> הוא מה
          שהחברה מצפה לקבל על הנכס בסוף השימוש, נטו מעלויות המימוש. את הגרט לא מפחיתים, ולכן הסכום שמתפזר על פני החיים הוא:
        </p>
        <Formula
          tex={String.raw`\text{סכום בר-פחת} = \text{עלות} - \text{ערך גרט} = ${texNum(COST)} - ${texNum(SALVAGE)} = ${texNum(BASE)}`}
        />
        <Formula tex={String.raw`\text{פחת לשנה מלאה} = \frac{\text{סכום בר-פחת}}{\text{אורך חיים}} = \frac{${texNum(BASE)}}{${LIFE}} = ${texNum(ANNUAL)}`} />
        <p>
          זהו הבסיס של קו ישר, סכום ספרות השנים ויחידות התפוקה. <strong>יוצאת הדופן: יתרה פוחתת</strong> — שם השיעור מוחל על היתרה בספרים
          המלאה, והגרט כבר מגולם בשיעור עצמו (ראו את הסימולטור).
        </p>
      </StepCard>

      <StepCard step={6} title="המודל החשבונאי" lead="מודל העלות או מודל הערכה מחדש — לכל קבוצת נכסים" icon={<Landmark className="h-5 w-5" />}>
        <p>
          לפי <strong>סעיף 29</strong>, החברה בוחרת מודל אחד לכל קבוצה של רכוש קבוע (מבנים, מכונות, כלי רכב...) ומיישמת אותו על כל הנכסים
          בקבוצה. המודל קובע איך הנכס נמדד אחרי ההכרה הראשונית:
        </p>
        <div className="my-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm font-semibold text-fg">מודל העלות (סעיף 30)</p>
            <p className="mt-1 text-sm text-fg/85">עלות, פחות פחת נצבר, פחות הפסדים מירידת ערך. הנכס לא &quot;עולה&quot; בספרים גם אם שוויו בשוק עלה.</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm font-semibold text-fg">מודל הערכה מחדש (סעיף 31)</p>
            <p className="mt-1 text-sm text-fg/85">
              שווי הוגן במועד ההערכה, פחות פחת נצבר שנצבר אחריה. עלייה בשווי נזקפת לקרן הערכה מחדש ברווח כולל אחר; ירידה — לרווח והפסד,
              אחרי שמנצלים את הקרן שנצברה לאותו נכס.
            </p>
          </div>
        </div>
        <p>בדוגמה שלנו: מודל העלות, ולכן היתרה בספרים היא פשוט העלות פחות הפחת הנצבר.</p>
      </StepCard>

      <StepCard step={7} title="שינויים שקרו במהלך חיי הנכס" lead="כל אירוע שדורש מתן ביטוי חשבונאי — ומה עושים איתו" icon={<GitBranch className="h-5 w-5" />}>
        <p>מסמנים בשאלה כל אירוע שקרה אחרי הכניסה לשימוש. כל אחד מהם משנה את הנתונים מאותו מועד והלאה:</p>
        <DataTable head={["אירוע", "מה עושים בפתרון"]} rows={CHANGES} />
        <Callout title="מחלקים את ציר הזמן בכל אירוע">
          <p>
            מחשבים פחת עד מועד האירוע לפי הנתונים הישנים, מטפלים באירוע עצמו (רישום, רווח או הפסד), ורק אז ממשיכים עם הנתונים החדשים על
            יתרת החיים. בדוגמה שלנו אין שינויים, ולכן הלוח רציף.
          </p>
        </Callout>
      </StepCard>

      <StepCard step={8} title="תחילת ההפחתה — כמה חודשים בשנה הראשונה" lead="סופרים חודשים מלאים מחודש הכניסה לשימוש ועד סוף השנה" icon={<Percent className="h-5 w-5" />}>
        <p>
          כל שנת חיים של הנכס היא <strong>שנה מלאה של 12 חודשים</strong> שמתחילה בחודש הכניסה לשימוש — אבל שנת הכספים מתחילה בינואר. לכן
          בשנת הכספים הראשונה מפחיתים רק את החודשים מחודש הכניסה (כולל) ועד דצמבר, ואת שאר החודשים של אותה שנת חיים — בשנת הכספים הבאה.
        </p>
        <p>
          בדוגמה: המכונה נכנסה לשימוש באפריל. אפריל, מאי, יוני... ועד דצמבר — <strong>9 חודשים</strong>. במילים אחרות: שנה מלאה, פחות שלושת
          החודשים שעברו לפני הכניסה (ינואר עד מרץ).
        </p>
        <Formula
          tex={String.raw`\text{פחת בשנה הראשונה} = \text{פחת לשנה מלאה} \times \frac{\text{חודשי שימוש}}{12} = ${texNum(ANNUAL)} \times \frac{9}{12} = ${texNum(FIRST)}`}
        />
        <p>שחקו עם חודש הכניסה:</p>
        <ProrationWidget annual={ANNUAL} />
        <Callout title="חודש הכניסה נספר כחודש מלא">
          <p>
            נכס שנכנס לשימוש בינואר מופחת שנה מלאה — 12 חודשים. נכס שנכנס בדצמבר מופחת חודש אחד בלבד. אם השאלה מציינת אמצע חודש, בדקו בה
            את המוסכמה (חצי חודש או חודש שלם).
          </p>
        </Callout>
      </StepCard>

      <StepCard step={9} title="נדרשי השאלה" lead="קוראים שוב מה בדיוק מבקשים — ועונים על כל סעיף בנפרד" icon={<ListChecks className="h-5 w-5" />}>
        <p>
          לפני שכותבים תשובה, חוזרים לנדרשי השאלה ומסמנים כל סעיף. מציגים בדיוק את מה שנדרש — אבל מחשבים תמיד דרך הלוח, שנה אחרי שנה,
          עד השנה המבוקשת. הנדרשים הנפוצים:
        </p>
        <DataTable
          head={["הנדרש", "מה מציגים"]}
          rows={[
            ["פקודות יומן", "פקודה מאוזנת לכל אירוע ולכל שנה שנדרשה: רכישה, פחת, שיפור, הערכה מחדש, ירידת ערך, מכירה"],
            ["הצגה מאזנית לשנת 20XX", "עלות, פחת נצבר ויתרה בספרים ליום 31.12.20XX — ובמודל הערכה מחדש גם קרן הערכה מחדש"],
            ["הצגה תוצאתית לשנת 20XX", "הוצאות פחת, הפסד מירידת ערך, רווח או הפסד ממימוש — ובמודל הערכה מחדש גם רווח כולל אחר"],
            ["לוח פחת", "שורה לכל שנת כספים: יתרת פתיחה, פחת, פחת נצבר ויתרה בספרים"],
          ]}
        />
        <p>בדוגמה שלנו נדרשו שלושה סעיפים, כולם לשנת X1:</p>
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
                  חובה: הוצאות פחת (רווח והפסד) · זכות: פחת נצבר (חשבון שמקטין את הנכס). היתרה בספרים: <Num v={COST} /> − <Num v={FIRST} /> ={" "}
                  <Num v={COST - FIRST} />.
                </>
              }
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <DataTable
            caption="הצגה מאזנית ליום 31.12.X1"
            head={["רכוש קבוע", "סכום"]}
            rows={[
              ["עלות", COST],
              ["בניכוי פחת נצבר", -FIRST],
            ]}
            foot={["יתרה בספרים", COST - FIRST]}
          />
          <DataTable caption="הצגה תוצאתית לשנת X1" head={["סעיף", "סכום"]} rows={[["הוצאות פחת", FIRST]]} />
        </div>
        <Callout kind="check" title="שלוש בדיקות מהירות לפני שממשיכים">
          <ul className="list-inside list-disc space-y-1">
            <li>
              סך הפחת על פני כל החיים = <Tex>{String.raw`\text{עלות} - \text{גרט}`}</Tex> = <Num v={BASE} />, בכל שיטה.
            </li>
            <li>היתרה בספרים אף פעם לא יורדת מתחת לגרט.</li>
            <li>
              נכס של {LIFE} שנים שנכנס באמצע שנה מופיע ב-{LIFE + 1} שנות כספים: 9 חודשים בהתחלה ו-3 בסוף.
            </li>
          </ul>
        </Callout>
        <p className="flex items-center gap-2 text-sm text-muted">
          <BookOpenCheck className="h-4 w-4 shrink-0 text-accent" />
          בסוף כל תרגיל — עברו על הצ׳ק-ליסט בלשונית <a href="#exam" className="font-medium text-accent hover:underline">טיפים למבחן</a>.
        </p>
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
            <span className="num shrink-0 text-[11px] text-subtle">{ref}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
