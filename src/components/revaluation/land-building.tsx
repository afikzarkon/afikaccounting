import { Building2, Trees } from "lucide-react";
import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { splitRevaluation } from "@/lib/learn/revaluation";
import { LAND, transferLines } from "./data";

const UP = splitRevaluation(LAND.firstUp - LAND.cost, 0, 0);
const DOWN = splitRevaluation(LAND.thenDown - LAND.firstUp, UP.oci, UP.losses);
const SURPLUS = UP.oci + DOWN.oci;
const GAIN = LAND.proceeds - LAND.thenDown;

export function LandBuildingSection() {
  return (
    <>
      <DataTable
        caption="קרקע מול מבנה במודל הערכה מחדש"
        head={["", "קרקע (אינה מופחתת)", "מבנה (נכס מופחת)"]}
        rows={[
          ["פחת שוטף", "אין — אורך החיים בלתי מוגבל (סעיף 58)", "יש — לפי השווי ההוגן האחרון"],
          ["ביום ההערכה", "השינוי נזקף ישירות מול הקרקע, לקרן או לרווח והפסד", "פחת עד היום, ביטול הפחת הנצבר, והתאמה לשווי ההוגן"],
          ["אחרי ההערכה", "שום דבר — עד ההערכה הבאה", "פחת חדש: (שווי הוגן − גרט) ÷ יתרת אורך החיים"],
          ["קרן ההערכה מחדש", "נשארת ללא שינוי בהון עד מימוש או גריעה", "עוברת לעודפים בקצב הפחת — או בגריעה, לפי מדיניות החברה"],
        ]}
      />

      <Topic title="דוגמה 3: קרקע — הערכה מחדש, ירידה, ומכירה" open>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Trees className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            קרקע נרכשה ב-{LAND.buyYear} ב-<Num v={LAND.cost} /> ₪. ב-31.12.{LAND.upYear} שוויה ההוגן <Num v={LAND.firstUp} /> ₪, וב-31.12.{LAND.downYear}{" "}
            ירד ל-<Num v={LAND.thenDown} /> ₪. ב-{LAND.saleYear} נמכרה ב-<Num v={LAND.proceeds} /> ₪. אין פחת בשום שלב.
          </p>
        </div>
        <DataTable
          head={["מועד", "אירוע", "פער", "לקרן", "לרווח והפסד", "יתרת הקרן"]}
          rows={[
            [`31.12.${LAND.upYear}`, "הערכה ראשונה — עלייה", LAND.firstUp - LAND.cost, UP.oci, UP.pl, UP.oci],
            [`31.12.${LAND.downYear}`, "ירידה — מקטינה קודם את הקרן", LAND.thenDown - LAND.firstUp, DOWN.oci, DOWN.pl, SURPLUS],
            [`${LAND.saleYear}`, "מכירה — הקרן עוברת לעודפים", "—", -SURPLUS, GAIN, 0],
          ]}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <JournalEntry
            title="1. הערכה ראשונה"
            date={`31.12.${LAND.upYear}`}
            lines={[
              { account: "קרקע", dr: UP.oci },
              { account: "קרן הערכה מחדש (רווח כולל אחר)", cr: UP.oci },
            ]}
          />
          <JournalEntry
            title="2. ירידה — כנגד הקרן, לא ברווח והפסד"
            date={`31.12.${LAND.downYear}`}
            lines={[
              { account: "קרן הערכה מחדש (רווח כולל אחר)", dr: -DOWN.oci },
              { account: "קרקע", cr: -DOWN.oci },
            ]}
          />
          <JournalEntry
            title="3. המכירה"
            date={`${LAND.saleYear}`}
            lines={[
              { account: "מזומן", dr: LAND.proceeds },
              { account: "קרקע", cr: LAND.thenDown },
              { account: "רווח ממכירת קרקע (רווח והפסד)", cr: GAIN },
            ]}
            note={
              <>
                הרווח נמדד מול השווי ההוגן האחרון (<Num v={LAND.thenDown} />), לא מול העלות המקורית.
              </>
            }
          />
          <JournalEntry title="4. העברת הקרן לעודפים" date={`${LAND.saleYear}`} lines={transferLines(SURPLUS)} />
        </div>
        <Callout kind="warn" title="הקרן לא עוברת דרך רווח והפסד">
          <p>
            העברת הקרן לעודפים היא פקודה בתוך ההון העצמי (סעיף 41). מי שרושם את <Num v={SURPLUS} /> כרווח ממכירה — מנפח את הרווח והפסד.
          </p>
        </Callout>
      </Topic>

      <Topic title="מבנה: שתי חלופות לתנועה בקרן ההערכה מחדש" refs="סעיף 41" open>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Building2 className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            אחרי ההערכה הפחת השנתי מחושב לפי <strong>השווי ההוגן החדש</strong> בניכוי גרט מעודכן, מחולק ב<strong>יתרת אורך החיים</strong>. לגבי הקרן
            — החברה בוחרת אחת משתי חלופות:
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm font-semibold text-fg">1. העברה בקצב הפחת — מימוש תוך כדי שימוש</p>
            <p className="mt-1 text-[14px] text-fg/90">
              מדי שנה מעבירים סכום מהקרן ישירות לעודפים — בלי לעבור ברווח והפסד:
            </p>
            <Formula tex={String.raw`\text{העברה שנתית} = \text{פחת לפי שווי הוגן} - \text{פחת לפי מודל העלות המקורי}`} />
          </div>
          <div className="rounded-xl border border-line bg-surface-2/40 p-4">
            <p className="text-sm font-semibold text-fg">2. העברה במועד הגריעה בלבד</p>
            <p className="mt-1 text-[14px] text-fg/90">
              הקרן נשארת שלמה בהון לאורך כל חיי הנכס, ורק כשהוא נמכר או נגרע — כולה עוברת בבת אחת לעודפים.
            </p>
          </div>
        </div>
      </Topic>
    </>
  );
}
