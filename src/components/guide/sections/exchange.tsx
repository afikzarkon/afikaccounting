import { Callout, Dt, Givens, JournalEntry, Num, Steps, SubHeading, Topic } from "../blocks";
import { Formula, Tex } from "../math";

const LEVELS = [
  {
    tag: "עדיפות א׳",
    title: "שווי הוגן של הנכס שנמסר",
    when: "ברירת המחדל: לעסקה יש מהות מסחרית והשווי ההוגן של הנכס הישן ניתן למדידה מהימנה.",
    tex: String.raw`C_{\text{new}} = FV_{\text{given}} + \text{Cash}_{\text{paid}} - \text{Cash}_{\text{received}}`,
  },
  {
    tag: "עדיפות ב׳",
    title: "שווי הוגן של הנכס שהתקבל",
    when: "כשהשווי ההוגן של הנכס החדש ברור וחד-משמעי יותר (IAS 16.26) — למשל מחירון של ספק לנכס חדש.",
    tex: String.raw`C_{\text{new}} = FV_{\text{received}}`,
  },
  {
    tag: "עדיפות ג׳",
    title: "הערך בספרים של הנכס שנמסר",
    when: "לעסקה אין מהות מסחרית, או ששווי הוגן של אף אחד מהנכסים אינו ניתן למדידה מהימנה. אין רווח או הפסד.",
    tex: String.raw`C_{\text{new}} = CA_{\text{given}} + \text{Cash}_{\text{paid}} - \text{Cash}_{\text{received}}`,
  },
];

const COMPONENTS = [
  { name: "הוני — הנכס החדש", side: "חובה", what: "עלות הנכס שהתקבל, לפי היררכיית המדידה." },
  { name: "גרעוני — הנכס הישן", side: "זכות + חובה", what: "זכות: העלות המקורית (ברוטו). חובה: הפחת שנצבר עד מועד העסקה." },
  { name: "תזרימי — מזומן", side: "זכות / חובה", what: "מזומן ששולם בזכות; מזומן שהתקבל בחובה." },
  { name: "תוצאתי — רווח / הפסד", side: "זכות / חובה", what: "ההפרש בין התמורה (שווי הוגן) ליתרה בספרים, בדוח רווח והפסד (IAS 16.68, לא כהכנסה)." },
  { name: "הערכה מחדש — קרן", side: "חובה קרן / זכות עודפים", what: "יתרת הקרן של הנכס הישן נסגרת ישירות לעודפים, לא דרך רווח והפסד (IAS 16.41)." },
];

export function ExchangeSection() {
  return (
    <>
      <Topic title="היררכיית המדידה החשבונאית" refs="IAS 16.24–26" open>
        <p>
          נכס שנרכש בתמורה לנכס לא-כספי (או בשילוב מזומן) נמדד <strong>בשווי הוגן</strong>, אלא אם לעסקה אין מהות
          מסחרית או שלא ניתן למדוד באופן מהימן את השווי ההוגן של אף אחד מהנכסים. סדר העדיפויות:
        </p>
        <div className="my-5 grid gap-3 lg:grid-cols-3">
          {LEVELS.map((l, i) => (
            <div key={l.tag} className="rounded-xl border border-line bg-surface-2/50 p-4">
              <div className="flex items-center gap-2">
                <span className="num grid h-7 w-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">{i + 1}</span>
                <p className="text-xs font-semibold text-accent">{l.tag}</p>
              </div>
              <p className="mt-2 font-semibold text-fg">{l.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{l.when}</p>
              <div className="mt-3 overflow-x-auto text-[13px]">
                <Tex>{l.tex}</Tex>
              </div>
            </div>
          ))}
        </div>
        <SubHeading>מבחן המהות המסחרית (IAS 16.25)</SubHeading>
        <p>לעסקה יש מהות מסחרית אם מתקיים (א) או (ב), וגם (ג):</p>
        <Steps
          items={[
            "התצורה (סיכון, עיתוי וסכום) של תזרימי המזומנים מהנכס שהתקבל שונה מזו של הנכס שנמסר; או",
            "הערך הספציפי לישות של החלק בפעילותה המושפע מהעסקה משתנה כתוצאה מהעסקה; וגם",
            "ההבדל בסעיפים (א) או (ב) משמעותי ביחס לשווי ההוגן של הנכסים שהוחלפו.",
          ]}
        />
        <Callout title="סימן המזומן קובע רק את עלות הנכס החדש">
          <p>
            בעדיפות א׳ המזומן מתווסף לשווי ההוגן (שילמנו) או מופחת ממנו (קיבלנו) — אבל הוא <strong>לא</strong> משפיע על
            הרווח או ההפסד ממימוש. הרווח נקבע רק מול הנכס שנמסר.
          </p>
        </Callout>
      </Topic>

      <Topic title="ניתוח רכיבי הרישום בעסקה" refs="IAS 16.41, 16.67–72">
        <p>פקודת החלפה היא בעצם שתי עסקאות בפקודה אחת: גריעה של הנכס הישן ורכישה של הנכס החדש. חמישה רכיבים:</p>
        <div className="my-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="px-4 py-2 text-start font-medium">רכיב</th>
                <th className="px-4 py-2 text-start font-medium">צד</th>
                <th className="px-4 py-2 text-start font-medium">מה רושמים</th>
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((c) => (
                <tr key={c.name} className="border-t border-line/70 align-top">
                  <td className="px-4 py-2 font-medium whitespace-nowrap text-fg">{c.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-muted">{c.side}</td>
                  <td className="px-4 py-2 text-fg/90">{c.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout kind="warn" title="קודם מעדכנים פחת עד יום העסקה">
          <p>
            לפני רישום ההחלפה רושמים את הוצאות הפחת של הנכס הישן מתחילת השנה ועד מועד העסקה. רווח ממימוש שחושב על יתרה
            בספרים לא מעודכנת מוטה בדיוק בסכום הפחת החסר.
          </p>
        </Callout>
      </Topic>

      <Topic title="דוגמה מספרית מלאה" refs="IAS 16.24">
        <Givens
          items={[
            ["מכונה א׳ (נמסרת) — עלות מקורית", <Num key="a" v={500_000} />],
            ["פחת שנצבר עד יום העסקה", <Num key="b" v={200_000} />],
            ["שווי הוגן של מכונה א׳", <Num key="c" v={340_000} />],
            ["מזומן ששולם בנוסף", <Num key="d" v={60_000} />],
            ["מועד העסקה", <Dt key="d">1.1.X4</Dt>],
            ["מהות מסחרית", "יש"],
          ]}
        />
        <SubHeading>תרחיש בסיס — עדיפות א׳</SubHeading>
        <Steps
          items={[
            <>
              יתרה בספרים של הנכס שנמסר: <Tex>{String.raw`500{,}000 - 200{,}000 = 300{,}000`}</Tex>
            </>,
            <>
              עלות מכונה ב׳: <Tex>{String.raw`340{,}000 + 60{,}000 = 400{,}000`}</Tex>
            </>,
            <>
              רווח ממימוש: <Tex>{String.raw`340{,}000 - 300{,}000 = 40{,}000`}</Tex>
            </>,
          ]}
        />
        <JournalEntry
          title="החלפת מכונה א׳ במכונה ב׳"
          date="1.1.X4"
          lines={[
            { account: "מכונה ב׳ (נכס חדש)", dr: 400_000 },
            { account: "פחת שנצבר — מכונה א׳", dr: 200_000 },
            { account: "מכונה א׳ (עלות מקורית)", cr: 500_000 },
            { account: "מזומן", cr: 60_000 },
            { account: "רווח ממימוש רכוש קבוע (רווח והפסד)", cr: 40_000 },
          ]}
        />

        <SubHeading>וריאציה — עדיפות ב׳: השווי ההוגן של מכונה ב׳ ברור יותר (410,000)</SubHeading>
        <p>
          העלות היא <Num v={410_000} />, והתמורה המשתמעת עבור מכונה א׳ היא <Tex>{String.raw`410{,}000 - 60{,}000 = 350{,}000`}</Tex>,
          ולכן הרווח <Tex>{String.raw`350{,}000 - 300{,}000 = 50{,}000`}</Tex>.
        </p>
        <JournalEntry
          title="החלפה לפי שווי הוגן של הנכס שהתקבל"
          lines={[
            { account: "מכונה ב׳", dr: 410_000 },
            { account: "פחת שנצבר — מכונה א׳", dr: 200_000 },
            { account: "מכונה א׳", cr: 500_000 },
            { account: "מזומן", cr: 60_000 },
            { account: "רווח ממימוש רכוש קבוע", cr: 50_000 },
          ]}
        />

        <SubHeading>וריאציה — עדיפות ג׳: אין מהות מסחרית</SubHeading>
        <p>
          העלות היא היתרה בספרים בתוספת המזומן: <Tex>{String.raw`300{,}000 + 60{,}000 = 360{,}000`}</Tex>. אין רווח ואין
          הפסד.
        </p>
        <JournalEntry
          title="החלפה ללא מהות מסחרית"
          lines={[
            { account: "מכונה ב׳", dr: 360_000 },
            { account: "פחת שנצבר — מכונה א׳", dr: 200_000 },
            { account: "מכונה א׳", cr: 500_000 },
            { account: "מזומן", cr: 60_000 },
          ]}
        />

        <SubHeading>וריאציה — התקבל מזומן (20,000) במקום ששולם</SubHeading>
        <p>
          עלות מכונה ב׳: <Tex>{String.raw`340{,}000 - 20{,}000 = 320{,}000`}</Tex>. הרווח לא משתנה (40,000) — המזומן עובר
          לצד החובה.
        </p>
        <JournalEntry
          title="החלפה עם קבלת מזומן"
          lines={[
            { account: "מכונה ב׳", dr: 320_000 },
            { account: "מזומן", dr: 20_000 },
            { account: "פחת שנצבר — מכונה א׳", dr: 200_000 },
            { account: "מכונה א׳", cr: 500_000 },
            { account: "רווח ממימוש רכוש קבוע", cr: 40_000 },
          ]}
        />

        <SubHeading>וריאציה — הנכס הישן נמדד במודל ההערכה מחדש</SubHeading>
        <p>
          נניח שמכונה א׳ הוצגה במודל ההערכה מחדש (בשיטת השערוך הפרופורציונלי, כך שהעלות והפחת שנצבר זהים לנתונים לעיל), ובקרן
          ההערכה מחדש שלה נותרה יתרה של <Num v={25_000} />. פקודת ההחלפה זהה לתרחיש הבסיס, ובנוסף:
        </p>
        <JournalEntry
          title="סגירת יתרת הקרן של הנכס שנגרע"
          lines={[
            { account: "קרן הערכה מחדש", dr: 25_000 },
            { account: "עודפים (יתרת רווח)", cr: 25_000 },
          ]}
          note="ההעברה היא בתוך ההון ואינה עוברת דרך רווח והפסד או רווח כולל אחר."
        />
      </Topic>

      <Topic title="💡 טריקים ובדיקות נאותות להחלפת נכסים" open>
        <Callout kind="check" title="בדיקת איזון פקודת החלפה">
          <Formula tex={String.raw`\text{רווח (הפסד) ממימוש} = \text{שווי הוגן של נכס נמסר} - \text{יתרה בספרים של נכס נמסר}`} />
          <p>
            בדוגמה: <Tex>{String.raw`340{,}000 - 300{,}000 = 40{,}000`}</Tex> ✓. בעדיפות ב׳ מציבים במקום השווי ההוגן את
            התמורה המשתמעת:
          </p>
          <Formula tex={String.raw`\text{רווח} = \left(FV_{\text{received}} - \text{Cash}_{\text{paid}} + \text{Cash}_{\text{received}}\right) - CA_{\text{given}}`} />
          <p>בעדיפות ג׳ התוצאה חייבת להיות אפס. אם בפקודה שלכם מופיע רווח — יש טעות במדידה.</p>
        </Callout>
        <Callout kind="check" title="איזון פקודת היומן">
          <Formula
            tex={String.raw`\underbrace{C_{\text{new}} + AD_{\text{old}} + \text{Loss} + \text{Cash}_{\text{rec}}}_{\text{חובה}} = \underbrace{C_{\text{old}} + \text{Cash}_{\text{paid}} + \text{Gain}}_{\text{זכות}}`}
          />
          <p>
            בדוגמה: <Tex>{String.raw`400{,}000 + 200{,}000 = 500{,}000 + 60{,}000 + 40{,}000 = 600{,}000`}</Tex> ✓
          </p>
        </Callout>
        <Callout title="עלות הנכס החדש בשורה אחת">
          <p>
            כשמדובר בעדיפות א׳, אפשר לחשב את עלות הנכס החדש כ״יתרה בספרים + רווח + מזומן ששולם״:{" "}
            <Tex>{String.raw`300{,}000 + 40{,}000 + 60{,}000 = 400{,}000`}</Tex>. זו בדיוק פקודת היומן כשמעבירים אגפים.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
