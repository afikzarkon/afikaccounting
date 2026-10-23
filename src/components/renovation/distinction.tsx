import { CircleCheck, CircleX, Wrench } from "lucide-react";
import { Callout, DataTable, JournalEntry, Topic } from "@/components/study/blocks";

const CASES: [string, boolean, string][] = [
  ["החלפת מנוע במכונה, שמאריכה את חייה בשלוש שנים", true, "הארכת אורך החיים"],
  ["הוספת קומה למבנה משרדים", true, "הגדלת התפוקה (שטח להשכרה)"],
  ["התקנת מערכת שמקטינה את צריכת החשמל של קו הייצור ב-30%", true, "הפחתה משמעותית של עלויות ההפעלה"],
  ["שדרוג מכונה כך שהמוצרים יוצאים ברמת דיוק גבוהה יותר", true, "שיפור איכות התפוקה"],
  ["צביעת המבנה מחדש", false, "שמירה על המצב הקיים"],
  ["טיפול תקופתי לרכב והחלפת שמן", false, "שמירה על הכושר התפעולי"],
  ["תיקון תקלה שמחזיר את המכונה לפעולה רגילה", false, "החזרה למצב הקודם — לא שיפור"],
  ["החלפת חלקים קטנים (מסננים, רצועות)", false, "חלקי חילוף שוטפים"],
];

export function DistinctionSection() {
  return (
    <>
      <div className="card p-5">
        <p className="text-xs font-semibold text-accent">השאלה הראשונה בכל שאלת שיפוץ</p>
        <p className="mt-1 text-[15px] text-fg/90">
          לפני כל חישוב שואלים: האם ההוצאה <strong>משפרת</strong> את הנכס — או רק <strong>שומרת</strong> עליו? התשובה קובעת אם העלות נכנסת לנכס
          ומופחתת על פני השנים הבאות, או נזקפת מיד להוצאות השנה (סעיפים 7, 12–13).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <p className="flex items-center gap-2 border-b border-success/20 bg-success/[0.06] px-5 py-3 text-[15px] font-semibold text-success">
            <CircleCheck className="h-5 w-5" /> שיפוץ מהותי — העלות נכנסת לנכס
          </p>
          <div className="space-y-3 px-5 py-4 text-[14.5px] leading-relaxed text-fg/90">
            <p>
              <strong>מה אומר התקן:</strong> עלויות שמגדילות את ההטבות הכלכליות העתידיות מהנכס — הארכת אורך החיים השימושיים, הגדלת התפוקה,
              שיפור איכות התפוקה או הפחתה משמעותית של עלויות ההפעלה.
            </p>
            <p>
              <strong>הטיפול:</strong> העלות מתווספת לערך בספרים (העלות המופחתת) של הנכס, ומופחתת מכאן והלאה יחד איתו.
            </p>
            <JournalEntry
              title="היוון שיפוץ מהותי"
              lines={[
                { account: "רכוש קבוע (שם הנכס)", dr: 30_000 },
                { account: "מזומן / ספקים", cr: 30_000 },
              ]}
            />
          </div>
        </div>
        <div className="card overflow-hidden">
          <p className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.07] px-5 py-3 text-[15px] font-semibold text-amber-700 dark:text-amber-400">
            <Wrench className="h-5 w-5" /> תחזוקה שוטפת ותיקונים — הוצאה מיידית
          </p>
          <div className="space-y-3 px-5 py-4 text-[14.5px] leading-relaxed text-fg/90">
            <p>
              <strong>מה אומר התקן:</strong> עלויות שנדרשות באופן שוטף כדי לשמור על הכושר התפעולי הקיים של הנכס — תיקונים קלים, צבע, טיפול
              תקופתי (סעיף 12).
            </p>
            <p>
              <strong>הטיפול:</strong> מוכרות מיד כהוצאה בדוח רווח והפסד. הנכס עצמו לא משתנה, וגם הפחת לא.
            </p>
            <JournalEntry
              title="תחזוקה שוטפת"
              lines={[
                { account: "הוצאות אחזקה ותיקונים (רווח והפסד)", dr: 4_000 },
                { account: "מזומן / ספקים", cr: 4_000 },
              ]}
            />
          </div>
        </div>
      </div>

      <DataTable
        caption="תרגול סיווג: נכנס לנכס או הוצאה?"
        head={["ההוצאה", "סיווג", "למה"]}
        rows={CASES.map(([text, capital, why]) => [
          text,
          <span key="c" className={capital ? "inline-flex items-center gap-1 font-medium text-success" : "inline-flex items-center gap-1 font-medium text-danger"}>
            {capital ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
            {capital ? "נכנס לנכס" : "הוצאה"}
          </span>,
          why,
        ])}
      />

      <Topic title="רכיב שמוחלף בשיפוץ — גורעים את הישן" refs="סעיפים 13, 70" open>
        <p>
          כששיפוץ <strong>מחליף</strong> חלק קיים בנכס — גג, מנוע, מערכת מיזוג — לא מספיק להוסיף את החלק החדש. החלק הישן כבר לא קיים, ולכן גורעים
          אותו מהספרים: סוגרים את העלות שלו ואת הפחת שנצבר עליו, והיתרה שנותרה נרשמת כהפסד מגריעה.
        </p>
        <p>
          לדוגמה: גג ישן שעלותו 20,000 ₪ ונצבר עליו פחת של 7,000 ₪ מוחלף בגג חדש בעלות 35,000 ₪.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          <JournalEntry
            title="1. גריעת הגג הישן"
            lines={[
              { account: "פחת נצבר — גג ישן", dr: 7_000 },
              { account: "הפסד מגריעת רכיב (רווח והפסד)", dr: 13_000 },
              { account: "רכוש קבוע — גג ישן", cr: 20_000 },
            ]}
          />
          <JournalEntry
            title="2. היוון הגג החדש"
            lines={[
              { account: "רכוש קבוע — גג חדש", dr: 35_000 },
              { account: "מזומן / ספקים", cr: 35_000 },
            ]}
          />
        </div>
        <Callout title="ואם לא יודעים מה הייתה העלות של החלק הישן?">
          <p>
            לפי סעיף 70, כשאי אפשר לזהות את העלות המקורית של החלק שהוחלף, משתמשים בעלות של החלק החדש כאינדיקציה למה שהחלק הישן עלה בזמנו —
            ומפחיתים ממנה את הפחת שהיה נצבר עליו עד היום.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
