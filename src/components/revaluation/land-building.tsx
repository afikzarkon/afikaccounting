import { Building2, Trees } from "lucide-react";
import { Callout, DataTable, JournalEntry, Num, Topic } from "@/components/study/blocks";
import { Formula } from "@/components/study/math";
import { solveLand } from "@/lib/learn/revaluation";
import { LAND, side, transferLines } from "./data";

const ROWS = solveLand(LAND.cost, LAND.values);
const LAST = ROWS.at(-1)!;
const GAIN = LAND.proceeds - LAST.fairValue;

const whatHappened = (r: (typeof ROWS)[number]) =>
  r.diff > 0 ? (r.opening === LAND.cost ? "הערכה ראשונה — עלייה לקרן" : "עלייה — לקרן") : r.pl < 0 ? "ירידה — הקרן מתאפסת, והיתרה הפסד" : "ירידה — מקטינה את הקרן";

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

      <Topic title="קרקע — הערכה מחדש בכל שנה, ואז מכירה" open>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Trees className="h-5 w-5" />
          </span>
          <p className="!mt-0">
            קרקע נרכשה ב-1.1.{ROWS[0].year} ב-<Num v={LAND.cost} /> ₪ ומוערכת מחדש בכל 31.12. ב-{LAND.saleYear} נמכרה ב-<Num v={LAND.proceeds} /> ₪. אין פחת
            בשום שלב — בכל שנה רק פער בין השווי הקודם לחדש.
          </p>
        </div>
        <DataTable
          head={["31.12", "שווי קודם", "שווי הוגן", "פער", "לקרן", "לרווח והפסד", "יתרת הקרן", "מה קרה"]}
          rows={[
            ...ROWS.map((r) => [String(r.year), r.opening, r.fairValue, r.diff, r.oci + 0, r.pl + 0, r.surplus + 0, whatHappened(r)]),
            [String(LAND.saleYear), LAST.fairValue, "—", "—", -LAST.surplus, GAIN, 0, "מכירה — הקרן עוברת לעודפים"],
          ]}
          highlight={ROWS.map((r, i) => (r.pl !== 0 ? i : -1)).filter((i) => i >= 0)}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {ROWS.map((r) => (
            <JournalEntry
              key={r.year}
              title={`הערכה מחדש ${r.year}`}
              date={`31.12.${r.year}`}
              lines={[
                ...side("קרקע", r.diff),
                ...side("קרן הערכה מחדש — קרקע (רווח כולל אחר)", -r.oci),
                ...side("הפסד מירידת ערך (רווח והפסד)", -r.pl),
              ].sort((x, y) => Number(x.cr !== undefined) - Number(y.cr !== undefined))}
            />
          ))}
          <JournalEntry
            title="המכירה"
            date={`${LAND.saleYear}`}
            lines={[
              { account: "מזומן", dr: LAND.proceeds },
              { account: "קרקע", cr: LAST.fairValue },
              { account: "רווח ממכירת קרקע (רווח והפסד)", cr: GAIN },
            ]}
            note={
              <>
                הרווח נמדד מול השווי ההוגן האחרון (<Num v={LAST.fairValue} />), לא מול העלות המקורית.
              </>
            }
          />
          <JournalEntry title="העברת הקרן לעודפים" date={`${LAND.saleYear}`} lines={transferLines(LAST.surplus)} />
        </div>
        <Callout kind="warn" title="הקרן לא עוברת דרך רווח והפסד">
          <p>
            העברת הקרן לעודפים היא פקודה בתוך ההון העצמי (סעיף 41). מי שרושם את <Num v={LAST.surplus} /> כרווח ממכירה — מנפח את הרווח והפסד.
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
