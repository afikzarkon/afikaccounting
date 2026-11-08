import { Building2, Handshake, Layers, ListChecks, Repeat, Search, Users } from "lucide-react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import * as L from "@/lib/study/ifrs16/lessons/special";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { WrongRight } from "./ias19-visuals";
import { DecisionWalk, LeaseDrill } from "./ifrs16-interactive";
import { FullSolution, P, quiz, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 8: land and buildings, subleases, sale and leaseback.
 * Every figure comes from lib/study/ifrs16/lessons/special.ts, in whole shekels,
 * and every table adds up.
 */

const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const pct = (r: number, d = 0) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");
const CH_HEAD_ROWS = [
  { open: L.CH_HEAD_PV, income: L.CH_HEAD_I1, close: L.CH_HEAD_C1 },
  { open: L.CH_HEAD_C1, income: L.CH_HEAD_I2, close: L.CH_HEAD_C2 },
];

/** The building shown on two screens, each standing alone. */
function BuildingStory() {
  return (
    <Story icon={<Building2 />} title="בניין עם קרקע">
      <p>
        מחכיר שאינו סוחר החכיר בניין ל-{L.LAND.years} שנים, ב-<M v={L.LAND.payment} /> בסוף כל שנה. שווי הבניין כולו <M v={L.LAND.fairValue} />. בספרים: מבנה <M v={L.LAND.buildingBV} />, וקרקע <M v={L.LAND.landBV} />. אין העברת בעלות, אין אופציה, והחוכר לא ערב לשייר.
      </p>
    </Story>
  );
}

/** The hall on two screens, each standing alone. */
function HallStory() {
  return (
    <Story icon={<Repeat />} title="אולם שמפסיקים להשתמש בו">
      <p>
        ב-1.1 של שנה 1 חברה חכרה אולם ל-{L.HALL.years} שנים, <M v={L.HALL.payment} /> בסוף כל שנה, בריבית תוספתית של {pct(L.HALL.rate)}. נכס זכות השימוש והתחייבות החכירה: <M v={L.HALL_L} />. פחת שנתי <M v={L.HALL_DEP} />.
      </p>
    </Story>
  );
}

/** The sale on four screens, each standing alone. */
function SaleStory() {
  return (
    <Story icon={<Handshake />} title="מחסן שנמכר ונחכר בחזרה">
      <p>
        ב-1.1 חברה העבירה מחסן לקונה. הערך בספרים <M v={L.SLB.bookValue} />, והשווי ההוגן <M v={L.SLB.fairValue} />. באותו יום חכרה אותו בחזרה ל-{L.SLB.years} שנים, <M v={L.SLB.payment} /> בסוף כל שנה, בריבית גלומה ידועה של {pct(L.SLB.rate)}. חיי המחסן {L.SLB.life} שנה.
      </p>
    </Story>
  );
}

export const IFRS16_SPECIAL_SCREENS: Record<string, ScreenContent> = {
  "ls-spc-hook": {
    lead: "עד כאן: חוזה אחד, נכס אחד, שני צדדים. עכשיו שלושה מקרים שבהם התמונה מורכבת יותר, והכלים לא משתנים.",
    body: (
      <>
        <Tbl
          head={["המקרה", "השאלה המיוחדת"]}
          rows={[
            ["בניין: קרקע ומבנה", "חכירה אחת, או שתיים?"],
            ["חכירת משנה: שלושה צדדים", "מול מה מסווגים?"],
            ["מכירה וחכירה בחזרה", "האם בכלל מכרו, וכמה?"],
          ]}
        />
        <Story icon={<Layers />} title="מה שנשאר אותו דבר">
          <p>סימני הסיווג מהשיעור השישי, ההשקעה נטו, ומעגל ההתחייבות. השיעור הזה מוסיף רק את השאלה שקודמת לחישוב.</p>
        </Story>
        <Rule>בכל מקרה: קודם מזהים, אחר כך מחשבים.</Rule>
      </>
    ),
  },
  "ls-spc-land": {
    lead: "לקרקע בדרך כלל אין סוף לחיים הכלכליים, ולמבנה יש. לכן בניין הוא לעיתים קרובות שתי חכירות בחוזה אחד.",
    body: (
      <>
        <DecisionWalk nodes={L.LAND_WALK} start={L.LAND_WALK_START} label="קרקע ומבנה" again="בודקים בניין אחר" />
        <WrongRight
          label="טעות: 30 שנים זה הרבה, ולכן חכירת הקרקע מימונית. נכון: לקרקע חיים לא מוגדרים"
          wrong={<p>״חכירת קרקע ל-30 שנים היא החלק העיקרי של חייה.״</p>}
          right={<p>לקרקע בדרך כלל חיים כלכליים לא מוגדרים (סעיף ב55). בלי העברת בעלות או אופציה, ובלי שהערך הנוכחי הוא כמעט כל השווי, היא תפעולית.</p>}
        />
      </>
    ),
    check: quiz("ls-spc-land", [
      {
        q: "סכום הקרקע מהותי, ואפשר להקצות באופן מהימן. כמה חכירות יש?",
        options: ["שתיים, כל מרכיב בנפרד", "אחת, לפי המבנה", "אחת, לפי הקרקע", "לפי בחירת המחכיר"],
        answer: 0,
        why: "סעיפים ב55, ב56.",
      },
    ]),
  },
  "ls-spc-split": {
    lead: "כשאפשר להקצות, הכול מתחלק: התשלום, השווי והשייר. אחר כך כל מרכיב הולך בדרך שלו.",
    body: (
      <>
        <BuildingStory />
        <Part title="נתוני ההקצאה">
          <p className="text-[15px]">
            ביום ההתקשרות {L.LAND.landPct}% מהשווי במרכיב הקרקע. למבנה {L.LAND.buildingLife} שנות חיים. בסוף החכירה צפוי ערך של <M v={L.LAND.buildingEnd} /> למבנה, ושל <M v={L.LAND.landEnd} /> לקרקע.
          </p>
        </Part>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "מחלקים",
              body: (
                <Tbl
                  dense
                  head={["", "קרקע", "מבנה"]}
                  rows={[
                    ["תשלום שנתי", L.LAND_PAY, L.BLD_PAY],
                    ["שווי הוגן", L.LAND_FV, L.BLD_FV],
                    ["ערך בסוף החכירה", L.LAND.landEnd, L.LAND.buildingEnd],
                  ]}
                />
              ),
            },
            {
              title: "קרקע: תפעולית",
              body: (
                <p>
                  ריבית גלומה: <Ltr>{`=RATE(8;15000;-90000;100000) → ${pct(L.LAND_RATE, 2)}`}</Ltr>. הערך הנוכחי של התשלומים, בלי השייר הלא מובטח: {n(L.LAND_PV)}, שהם {pct(L.LAND_PV / L.LAND_FV)} מהשווי. אין העברת בעלות, ולכן תפעולית. הקרקע נשארת בספרים, והכנסה של {n(L.LAND_PAY)} בשנה.
                </p>
              ),
            },
            {
              title: "מבנה: מימונית",
              body: (
                <>
                  <p>
                    {L.LAND.years} מתוך {L.LAND.buildingLife} שנים: {pct(L.LAND.years / L.LAND.buildingLife)}, החלק העיקרי. ריבית גלומה: <Ltr>{`=RATE(8;45000;-270000;12000) → ${pct(L.BLD_RATE, 2)}`}</Ltr>.
                  </p>
                  <JournalEntry
                    title="1.1 של שנה 1"
                    lines={[
                      { account: "השקעה נטו בחכירה", dr: L.BLD_FV },
                      { account: "מבנה", cr: L.LAND.buildingBV },
                      { account: "רווח הון", cr: L.BLD_GAIN },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "שנה 1 בדוחות",
              body: (
                <Tbl
                  dense
                  head={["", "סכום"]}
                  rows={[
                    ["רווח הון", L.BLD_GAIN],
                    ["הכנסות מימון, מבנה", L.BLD_INT],
                    ["הכנסות מהשכרה, קרקע", L.LAND_PAY],
                    ["השקעה נטו, 31.12", L.BLD_CLOSE],
                    ["קרקע, 31.12", L.LAND.landBV],
                  ]}
                />
              ),
            },
            { title: "מלכודת נפוצה", body: <p>להקצות לפי הערכים בספרים. ההקצאה לפי השווי ההוגן של זכויות החכירה, ביום ההתקשרות.</p> },
          ]}
        />
      </>
    ),
    check: quiz("ls-spc-split", [
      {
        q: "תשלום שנתי 40,000. 20% מהשווי בקרקע. מה התשלום שמוקצה למבנה?",
        options: ["32,000 ש״ח", "8,000 ש״ח", "40,000 ש״ח", "20,000 ש״ח"],
        answer: 0,
        why: "40,000 × 80% = 32,000.",
      },
    ]),
  },
  "ls-spc-whole": {
    lead: "שני מצבים שבהם לא מפרידים. אותו בניין, ותוצאה הפוכה: הכול מימונית, או הכול תפעולית.",
    body: (
      <>
        <BuildingStory />
        <Part title="אי אפשר להקצות">
          <p className="text-[15px]">
            סכום הקרקע מהותי, אבל אין הקצאה מהימנה. למבנה {L.LAND.buildingLife} שנות חיים, ולכן לא ברור ששני המרכיבים תפעוליים: הכול מימונית. בסוף החכירה צפוי ערך כולל של <M v={L.ALL_END} />.
          </p>
        </Part>
        <P>
          <Ltr>{`=RATE(8;60000;-360000;112000) → ${pct(L.ALL_RATE, 2)}`}</Ltr>
        </P>
        <JournalEntry
          title="1.1 של שנה 1"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.LAND.fairValue },
            { account: "מבנה", cr: L.LAND.buildingBV },
            { account: "קרקע", cr: L.LAND.landBV },
            { account: "רווח הון", cr: L.ALL_GAIN },
          ]}
        />
        <P>
          בסוף שנה 1: הכנסות מימון {n(L.ALL_INT)}, והשקעה נטו {n(L.ALL_CLOSE)}.
        </P>
        <Part title="קרקע לא מהותית">
          <p className="text-[15px]">
            הפעם סכום הקרקע לא מהותי, ולמבנה {L.LAND.unitLife} שנות חיים. יחידה אחת, לפי חיי המבנה (סעיף ב57).
          </p>
        </Part>
        <Tbl
          dense
          head={["סימן", "מה יצא", "מסקנה"]}
          rows={[
            ["תקופה מהחיים", pct(L.LAND.years / L.LAND.unitLife), "לא העיקרי"],
            ["ערך נוכחי מהשווי", pct(L.ALL_PV / L.LAND.fairValue), "לא כל השווי"],
          ]}
        />
        <Remember>לכן הכול תפעולית: הבניין נשאר בספרים, עם הכנסה של {n(L.LAND.payment)} בשנה.</Remember>
      </>
    ),
    check: quiz("ls-spc-whole", [
      {
        q: "אי אפשר להקצות. המבנה מוחכר לרוב חייו. מה הסיווג?",
        options: ["הכול מימונית", "הכול תפעולית", "מפרידים בכל זאת", "לא מכירים עד שאפשר להקצות"],
        answer: 0,
        why: "סעיף ב56: מימונית, אלא אם ברור ששניהם תפעוליים.",
      },
    ]),
  },
  "ls-spc-sub": {
    lead: "החוכר נהיה גם מחכיר. מה שהוא מעביר הלאה הוא לא הבניין, אלא זכות השימוש שלו. לכן מולה מסווגים.",
    body: (
      <>
        <Tbl
          dense
          head={["צד", "תפקיד", "בספרים"]}
          rows={[
            ["א", "מחכיר ראשי", "לפי הסיווג שלו"],
            ["ב", "חוכר ומחכיר משנה", "התחייבות, ונכס או השקעה נטו"],
            ["ג", "חוכר משנה", "נכס והתחייבות, כרגיל"],
          ]}
        />
        <DecisionWalk nodes={L.SUB_WALK} start={L.SUB_WALK_START} label="סיווג חכירת משנה" again="בודקים חכירת משנה אחרת" />
        <WrongRight
          label="טעות: מסווגים מול חיי הבניין. נכון: מול זכות השימוש"
          wrong={<p>״החוכר מחכיר ל-3 שנים בניין עם 40 שנות חיים. 8% בלבד, ולכן תפעולית.״</p>}
          right={<p>אם נשארו לו בדיוק 3 שנים בחכירה הראשית, הוא העביר את כל מה שיש לו. 100% מזכות השימוש, ולכן מימונית (סעיף ב58(ב)).</p>}
        />
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-spc-sub" items={L.SUB_ITEMS} options={L.SUB_OPTIONS} />
        </TaskFrame>
        <Deeper title="ערך נמוך וחכירת משנה">
          <P>חוכר שמחכיר נכס בחכירת משנה, או מצפה לעשות זאת, לא יכול ליישם על החכירה הראשית את הקלת הערך הנמוך (סעיף ב7).</P>
        </Deeper>
      </>
    ),
  },
  "ls-spc-subfin": {
    lead: "במימונית החוכר ״מכר״ את זכות השימוש: הנכס יוצא, ובמקומו השקעה נטו. החוב למחכיר הראשי נשאר כמו שהיה.",
    body: (
      <>
        <Story icon={<Users />} title="שלוש חברות, בניין אחד">
          <p>
            חברה חכרה בניין ל-{L.CH.years} שנים. ב-1.1 של שנה 2 נכס זכות השימוש בספריה <M v={L.CH_ROU1} />, ועוד שיפורים במושכר של <M v={L.CH.renovation} />. התחייבות החכירה <M v={L.CH_C1} />.
          </p>
          <p>
            באותו יום היא מחכירה בחכירת משנה ל-{L.CH.subYears} השנים שנשארו, <M v={L.CH.subPayment} /> בסוף כל שנה, בריבית גלומה של {pct(L.CH.subRate)}.
          </p>
        </Story>
        <P>
          {L.CH.subYears} מתוך {L.CH.subYears} השנים שנשארו, ולכן מימונית. <Ltr>{`=PV(7%;11;-470000) → ${n(L.CH_NI)}`}</Ltr>.
        </P>
        <JournalEntry
          title="1.1 של שנה 2"
          lines={[
            { account: "השקעה נטו בחכירה", dr: L.CH_NI },
            { account: "נכס זכות שימוש", cr: L.CH_ROU1 },
            { account: "שיפורים במושכר", cr: L.CH.renovation },
            { account: "רווח הון", cr: L.CH_GAIN },
          ]}
        />
        <P>השיפורים יוצאים גם הם, כי החברה כבר לא תשתמש בהם. במאזן נשארות מעכשיו שתי יתרות נפרדות, בלי קיזוז:</P>
        <Tbl
          dense
          head={["שנה 2", "השקעה נטו", "התחייבות"]}
          rows={[
            ["1.1", L.CH_NI, L.CH_C1],
            ["ריבית", L.CH_NI_INT, L.CH_I2],
            ["תקבול או תשלום", -L.CH.subPayment, -L.CH.payment],
          ]}
          foot={["31.12", L.CH_NI_CLOSE, L.CH_C2]}
        />
        <Remember>שתי ריביות שונות: הכנסות מימון על ההשקעה נטו, והוצאות מימון על ההתחייבות.</Remember>
        <Deeper title="אם הריבית הגלומה לא ידועה, או שנתון שווי הוגן">
          <P>אם אי אפשר לקבוע בקלות את הריבית הגלומה בחכירת המשנה, אפשר להשתמש בשיעור של החכירה הראשית, עם התאמה לעלויות ישירות (סעיף 68). אם השווי ההוגן של זכות השימוש נתון, ההשקעה נטו היא השווי הזה, והריבית נגזרת ממנו, לפי ההגדרה של ריבית גלומה.</P>
        </Deeper>
      </>
    ),
    check: quiz("ls-spc-subfin", [
      {
        q: "השקעה נטו 200,000, נכס זכות שימוש 170,000, והתחייבות 190,000. כמה רווח הון ביום חכירת המשנה?",
        options: ["30,000 ש״ח", "10,000 ש״ח", "20,000 ש״ח", "אפס"],
        answer: 0,
        why: "200,000 − 170,000 = 30,000. ההתחייבות לא משתתפת.",
      },
    ]),
  },
  "ls-spc-subop": {
    lead: "בתפעולית החוכר לא העביר את עיקר הזכות. הנכס נשאר בספריו, ממשיך להיות מופחת, ועליו הכנסה בקו ישר.",
    body: (
      <>
        <HallStory />
        <Part title="חכירת המשנה">
          <p className="text-[15px]">
            ב-1.1 של שנה 3 החברה הפסיקה להשתמש באולם, והחכירה אותו בחכירת משנה ל-{L.HALL.subYears} שנים, <M v={L.HALL.subPayment} /> בסוף כל שנה, בריבית גלומה של {pct(L.HALL.subRate)}. השווי ההוגן של זכות השימוש באותו יום <M v={L.HALL.rightFV} />. נדל״ן להשקעה נמדד בעלות.
          </p>
        </Part>
        <Tbl
          dense
          head={["סימן", "מה יצא", "מסקנה"]}
          rows={[
            ["תקופה מהיתרה", `${L.HALL.subYears} מתוך ${L.HALL.left}: ${pct(L.HALL.subYears / L.HALL.left)}`, "לא העיקרי"],
            ["ערך נוכחי מהשווי", pct(L.HALL_SUB_PV / L.HALL.rightFV), "לא כל השווי"],
          ]}
        />
        <P>לכן תפעולית. במודל העלות המעבר לנדל״ן להשקעה לא משנה סכומים (IAS 40 סעיף 59).</P>
        <Tbl
          dense
          head={["שנה 3", "סכום"]}
          rows={[
            ["הכנסות מהשכרה", L.HALL.subPayment],
            [<>פחת: <Ltr>{`${n(L.HALL_ROU2)} ÷ ${L.HALL.left}`}</Ltr></>, -L.HALL_DEP],
            ["הוצאות מימון", -L.HALL_INT],
            ["נכס זכות שימוש, 31.12", L.HALL_ROU3],
            ["התחייבות, שוטפת", L.HALL_CLOSE - L.HALL_NC],
            ["התחייבות, לא שוטפת", L.HALL_NC],
          ]}
        />
        <Remember>הפחת אחרי שינוי: היתרה חלקי השנים שנשארו. כאן הוא לא השתנה, כי גם היתרה וגם התקופה נשארו. הלא שוטף: היתרה של סוף השנה הבאה.</Remember>
      </>
    ),
    check: quiz("ls-spc-subop", [
      {
        q: "חכירת משנה תפעולית. מה קורה לנכס זכות השימוש?",
        options: ["נשאר בספרים, וממשיך להיות מופחת", "יוצא מהספרים", "נמדד מחדש לשווי הוגן תמיד", "עובר לחוכר המשנה"],
        answer: 0,
        why: "במודל העלות אין שינוי בסכום. רק במודל השווי ההוגן יש שערוך, וזה המסך הבא.",
      },
    ]),
  },
  "ls-spc-ip": {
    lead: "אם החברה מודדת נדל״ן להשקעה בשווי הוגן, סיום השימוש הוא אירוע: קודם הערכה מחדש, ומאותו יום שווי הוגן.",
    body: (
      <>
        <HallStory />
        <Part title="מה קרה בשנה 3">
          <p className="text-[15px]">
            ב-1.4 הדירקטוריון החליט לפנות את האולם. ב-1.7 העובדים עזבו, ונחתמה חכירת משנה תפעולית. השווי ההוגן של זכות השימוש ב-1.7 <M v={L.IP.fairValue} />, וב-31.12 <M v={L.IP.endFV} />. נדל״ן להשקעה נמדד בשווי הוגן.
          </p>
        </Part>
        <FullSteps
          label="הפתרון"
          steps={[
            { title: "מועד המעבר", body: <p>1.7, סיום השימוש של הבעלים, ולא 1.4 של ההחלטה (IAS 40 סעיף 61). עד אז ממשיכים להפחית.</p> },
            {
              title: "ביום המעבר",
              body: (
                <>
                  <Tbl
                    dense
                    head={["נכס זכות שימוש", "סכום"]}
                    rows={[
                      ["31.12 של שנה 2", L.HALL_ROU2],
                      ["פחת, חצי שנה", -L.IP_HALF],
                      ["הערכה מחדש", L.IP_OCI],
                    ]}
                    foot={["שווי הוגן, 1.7", L.IP.fairValue]}
                  />
                  <JournalEntry
                    title="1.7 של שנה 3"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.IP.fairValue },
                      { account: "נכס זכות שימוש", cr: L.IP_AT },
                      { account: "קרן הערכה מחדש", cr: L.IP_OCI },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "אחרי המעבר",
              body: (
                <>
                  <JournalEntry
                    title="31.12 של שנה 3"
                    lines={[
                      { account: "הפסד משערוך נדל״ן", dr: L.IP_LOSS },
                      { account: "נדל״ן להשקעה", cr: L.IP_LOSS },
                    ]}
                  />
                  <p>בלי פחת, וההתחייבות ממשיכה כרגיל. הירידה הולכת לרווח או הפסד, והקרן לא נוגעת.</p>
                </>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לחבר את הרווח הכולל האחר עם ההפסד. הם מוצגים בנפרד: {n(L.IP_OCI)} ברווח כולל אחר, ו-{n(L.IP_LOSS)} ברווח או הפסד.</p> },
          ]}
        />
        <Tbl
          dense
          head={["מה קורה לשווי", "ביום המעבר", "אחרי המעבר"]}
          rows={[
            ["עלייה", "רווח כולל אחר", "רווח או הפסד"],
            ["ירידה", "רווח או הפסד", "רווח או הפסד"],
          ]}
        />
        <Remember>הקרן קפואה. בגריעת הנכס אפשר להעביר אותה לעודפים, בלי לעבור דרך רווח או הפסד (IAS 40 סעיף 62(ב)(ii)).</Remember>
        <Deeper title="ואם רק קומה אחת עוברת?">
          <P>מעבירים רק את חלקה בנכס זכות השימוש, למשל שליש בבניין של שלוש קומות זהות. שאר הקומות נשארות רכוש קבוע, עם פחת רגיל. ההתחייבות נשארת אחת.</P>
        </Deeper>
      </>
    ),
    check: quiz("ls-spc-ip", [
      {
        q: "ביום המעבר הערך בספרים 500,000 והשווי ההוגן 460,000. אין קרן קודמת. איפה נרשם ההפרש?",
        options: ["הפסד של 40,000 ברווח או הפסד", "ברווח כולל אחר", "לא נרשם", "נפרס על החכירה"],
        answer: 0,
        why: "IAS 40 סעיף 62(א): ירידה הולכת לרווח או הפסד, אלא אם יש קרן קודמת לאותו נדל״ן.",
      },
    ]),
  },
  "ls-spc-rates": {
    lead: "הכלל היחיד: הריבית והתקופות באותה יחידת זמן. חודשים עם ריבית חודשית, וחצאי שנה עם ריבית של חצי שנה.",
    body: (
      <>
        <Part title="חודשי">
          <p className="text-[15px]">
            {L.MON.months} חודשים, <M v={L.MON.payment} /> בסוף כל חודש, בריבית חודשית של {pct(L.MON.rate, 1)}.
          </p>
        </Part>
        <P>
          <Ltr>{`=PV(0.8%;96;-20000) → ${n(L.MON_L)}`}</Ltr>
        </P>
        <P>הוצאות המימון של שנה שלמה: קשה לחשב חודש חודש. יש דרך קצרה:</P>
        <Tbl
          dense
          head={["שנה 3", "סכום"]}
          rows={[
            ["יתרה ב-31.12, נשארו 60 תשלומים", L.MON_CLOSE],
            ["תשלומי השנה: 12 תשלומים", L.MON_PAID],
            ["יתרה ב-1.1, נשארו 72 תשלומים", -L.MON_OPEN],
          ]}
          foot={["הוצאות מימון", L.MON_INT]}
        />
        <Part title="חצי שנתי, מתוך ריבית שנתית">
          <p className="text-[15px]">
            {L.HALF.periods} תשלומים של <M v={L.HALF.payment} />, כל חצי שנה. הריבית השנתית {pct(L.HALF.annual)}.
          </p>
        </Part>
        <P>
          <Ltr>{`(1 + 7%)^(1/2) − 1 = ${pct(L.HALF_RATE, 2)}`}</Ltr>
        </P>
        <P>
          <Ltr>{`=PV(3.44%;6;-300000) → ${n(L.HALF_PV)}`}</Ltr>
        </P>
        <WrongRight
          label="טעות: מחלקים את הריבית השנתית ב-2. נכון: ריבית דריבית"
          wrong={<p>״7% ÷ 2 = 3.5%, ולכן {n(L.HALF_WRONG)}.״</p>}
          right={<p>שני חצאי שנה ב-3.5% נותנים יותר מ-7%. הריבית השקולה היא {pct(L.HALF_RATE, 2)}.</p>}
        />
        <Deeper title="ריבית חודשית מתוך שווי הוגן">
          <P>
            בחכירה מימונית עם שווי הוגן נתון, הריבית נגזרת באותה דרך: <Ltr>{`=RATE(60;30000;-1500000) → ${pct(L.FVM_RATE, 2)}`}</Ltr> לחודש.
          </P>
        </Deeper>
      </>
    ),
    check: quiz("ls-spc-rates", [
      {
        q: "יתרה ב-1.1: 100,000. יתרה ב-31.12: 90,000. שולמו בשנה 18,000. מהן הוצאות המימון?",
        options: ["8,000 ש״ח", "10,000 ש״ח", "18,000 ש״ח", "28,000 ש״ח"],
        answer: 0,
        why: "90,000 + 18,000 − 100,000 = 8,000.",
      },
    ]),
  },
  "ls-spc-slb": {
    lead: "חברה מוכרת נכס ומיד חוכרת אותו בחזרה. לפני כל חישוב, שתי שאלות: האם היא שלטה בו, והאם הקונה באמת קיבל שליטה.",
    body: (
      <>
        <DecisionWalk nodes={L.SLB_WALK} start={L.SLB_WALK_START} label="מכירה וחכירה בחזרה" again="בודקים עסקה אחרת" />
        <Part title="סימנים להעברת שליטה (IFRS 15 סעיף 38)">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>למוכר יש זכות לתשלום בהווה.</li>
            <li>הקונה קיבל בעלות משפטית.</li>
            <li>הקונה קיבל חזקה פיזית.</li>
            <li>הקונה נושא בסיכונים ובהטבות המשמעותיים.</li>
            <li>הקונה אישר את קבלת הנכס.</li>
          </ul>
        </Part>
        <SaleStory />
        <Part title="אם אין מכירה">
          <p className="text-[15px]">
            הפעם המחסן לא עבר לבעלות הקונה, והוא לא נושא בסיכונים. התמורה <M v={L.SLB.fairValue} />.
          </p>
        </Part>
        <Tbl
          dense
          head={["", "מוכר-חוכר", "קונה-מחכיר"]}
          rows={[
            ["הנכס", "נשאר בספרים", "לא נרשם"],
            ["הכסף", "ז׳ התחייבות פיננסית", "ח׳ הלוואה לקבל"],
            ["רווח", "אין", "אין"],
          ]}
        />
        <P>
          המשך לפי IFRS 9, בריבית האפקטיבית: <Ltr>{`=RATE(20;130000;-2200000) → ${pct(L.SLB_LOAN_RATE, 2)}`}</Ltr>. בשנה הראשונה הוצאות מימון של {n(L.SLB_LOAN_INT)}, ויתרת החוב {n(L.SLB_LOAN_CLOSE)}.
        </P>
      </>
    ),
    check: quiz("ls-spc-slb", [
      {
        q: "העברה שאינה מכירה. המוכר קיבל 300,000. מה הוא רושם?",
        options: ["ח׳ מזומן, ז׳ התחייבות פיננסית", "ח׳ מזומן, ז׳ הנכס, ז׳ רווח", "ח׳ מזומן, ז׳ הכנסות מראש", "ח׳ נכס זכות שימוש, ז׳ מזומן"],
        answer: 0,
        why: "סעיף 103(א).",
      },
    ]),
  },
  "ls-spc-fair": {
    lead: "החברה מכרה, אבל חלק מהנכס נשאר אצלה דרך החכירה. לכן היא מרוויחה רק על מה שבאמת עזב.",
    body: (
      <>
        <SaleStory />
        <P>הקונה קיבל בעלות וסיכונים, והתמורה שווה לשווי ההוגן: <M v={L.SLB.fairValue} />.</P>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "ההתחייבות",
              body: (
                <p>
                  <Ltr>{`=PV(5%;20;-130000) → ${n(L.SLB_L)}`}</Ltr>
                </p>
              ),
            },
            {
              title: "כמה נשאר בידי החברה",
              body: (
                <p>
                  <Ltr>{`${n(L.SLB_L)} ÷ ${n(L.SLB.fairValue)} = ${pct(L.SLB_SHARE, 2)}`}</Ltr> מהנכס.
                </p>
              ),
            },
            {
              title: "נכס זכות השימוש",
              body: (
                <p>
                  <Ltr>{`${n(L.SLB.bookValue)} × ${pct(L.SLB_SHARE, 2)} = ${n(L.SLB_ROU)}`}</Ltr>. חלק מהערך בספרים, ולא כמו ההתחייבות (סעיף 100(א)).
                </p>
              ),
            },
            {
              title: "הפקודה בספרי המוכר",
              body: (
                <>
                  <JournalEntry
                    title="1.1"
                    lines={[
                      { account: "מזומן", dr: L.SLB.fairValue },
                      { account: "נכס זכות שימוש", dr: L.SLB_ROU },
                      { account: "בניין", cr: L.SLB.bookValue },
                      { account: "התחייבות חכירה", cr: L.SLB_L },
                      { account: "רווח הון", cr: L.SLB_GAIN },
                    ]}
                  />
                  <p>
                    בדיקה: <Ltr>{`${n(L.SLB_GAP)} × (1 − ${pct(L.SLB_SHARE, 2)}) = ${n(L.SLB_GAIN)}`}</Ltr>.
                  </p>
                </>
              ),
            },
            {
              title: "בספרי הקונה",
              body: (
                <>
                  <JournalEntry
                    title="1.1"
                    lines={[
                      { account: "נדל״ן להשקעה", dr: L.SLB.fairValue },
                      { account: "מזומן", cr: L.SLB.fairValue },
                    ]}
                  />
                  <p>
                    סיווג רגיל: {L.SLB.years} מתוך {L.SLB.life} שנים, והערך הנוכחי {pct(L.SLB_SHARE)} מהשווי. תפעולית, עם הכנסה של {n(L.SLB.payment)} בשנה.
                  </p>
                </>
              ),
            },
            {
              title: "שנה 1, אצל המוכר",
              body: (
                <p>
                  פחת: <Ltr>{`${n(L.SLB_ROU)} ÷ ${L.SLB.years} = ${n(L.SLB_DEP)}`}</Ltr>. הוצאות מימון: {n(L.SLB_INT)}.
                </p>
              ),
            },
            { title: "מלכודת נפוצה", body: <p>לרשום רווח של {n(L.SLB_GAP)}, כאילו הכול נמכר. זה היה נכון בלי החכירה בחזרה.</p> },
          ]}
        />
      </>
    ),
    check: quiz("ls-spc-fair", [
      {
        q: "ערך בספרים 400,000, שווי הוגן 1,000,000, והתחייבות חכירה 600,000. כמה רווח?",
        options: ["240,000 ש״ח", "600,000 ש״ח", "360,000 ש״ח", "400,000 ש״ח"],
        answer: 0,
        why: "600,000 × (1 − 60%) = 240,000.",
      },
    ]),
  },
  "ls-spc-low": {
    lead: "קונה שמשלם פחות מהשווי, בתמורה לדמי חכירה נוחים. בפועל החוכר כבר שילם חלק מהחכירה מראש.",
    body: (
      <>
        <SaleStory />
        <P>
          הפעם התמורה <M v={L.SLB.low} />. נמוכה מהשווי ב-{n(L.LOW_PRE)}, וזו מקדמה על החכירה (סעיף 101(א)).
        </P>
        <Tbl
          dense
          head={["כמה נשאר בידי החברה", "סכום"]}
          rows={[
            ["התחייבות חכירה", L.SLB_L],
            ["מקדמה", L.LOW_PRE],
          ]}
          foot={["זכות השימוש", L.SLB_L + L.LOW_PRE]}
        />
        <P>
          <Ltr>{`${n(L.SLB_L + L.LOW_PRE)} ÷ ${n(L.SLB.fairValue)} = ${pct(L.LOW_SHARE, 2)}`}</Ltr>, ולכן נכס זכות השימוש {n(L.LOW_ROU)}.
        </P>
        <JournalEntry
          title="1.1, בספרי המוכר"
          lines={[
            { account: "מזומן", dr: L.SLB.low },
            { account: "נכס זכות שימוש", dr: L.LOW_ROU },
            { account: "בניין", cr: L.SLB.bookValue },
            { account: "התחייבות חכירה", cr: L.SLB_L },
            { account: "רווח הון", cr: L.LOW_GAIN },
          ]}
        />
        <P>
          הקונה רושם את המחסן בשווי ההוגן, ואת ההפרש כהכנסות מראש. הכנסה בקו ישר: <Ltr>{`(${n(L.SLB.payment)} × ${L.SLB.years} + ${n(L.LOW_PRE)}) ÷ ${L.SLB.years} = ${n(L.LOW_RENT)}`}</Ltr>.
        </P>
        <JournalEntry
          title="1.1 וכל 31.12, בספרי הקונה"
          lines={[
            { account: "נדל״ן להשקעה", dr: L.SLB.fairValue },
            { account: "מזומן", cr: L.SLB.low },
            { account: "הכנסות מראש", cr: L.LOW_PRE },
          ]}
        />
        <JournalEntry
          title="כל 31.12"
          lines={[
            { account: "מזומן", dr: L.SLB.payment },
            { account: "הכנסות מראש", dr: L.LOW_FALL },
            { account: "הכנסות מהשכרה", cr: L.LOW_RENT },
          ]}
        />
      </>
    ),
    check: quiz("ls-spc-low", [
      {
        q: "שווי הוגן 900,000, תמורה 850,000. מה זה ההפרש?",
        options: ["מקדמה על החכירה", "הפסד מיידי", "הלוואה מהקונה", "הנחה שנרשמת ברווח"],
        answer: 0,
        why: "סעיף 101(א).",
      },
    ]),
  },
  "ls-spc-high": {
    lead: "קונה שמשלם יותר מהשווי לא עושה טובה. הוא מלווה לחברה את ההפרש, וגובה אותו בחזרה דרך דמי החכירה.",
    body: (
      <>
        <SaleStory />
        <P>
          הפעם התמורה <M v={L.SLB.high} />. גבוהה מהשווי ב-{n(L.HIGH_LOAN)}, וזו הלוואה (סעיף 101(ב)). הערך הנוכחי של כל התשלומים לא השתנה, אבל חלק ממנו הוא חוב ולא חכירה.
        </P>
        <Tbl
          dense
          head={["הערך הנוכחי של התשלומים", "סכום"]}
          rows={[
            ["הלוואה", L.HIGH_LOAN],
            ["התחייבות חכירה", L.HIGH_L],
          ]}
          foot={["סך הכול", L.SLB_L]}
        />
        <P>
          <Ltr>{`${n(L.HIGH_L)} ÷ ${n(L.SLB.fairValue)} = ${pct(L.HIGH_SHARE, 2)}`}</Ltr>, ולכן נכס זכות השימוש {n(L.HIGH_ROU)}.
        </P>
        <JournalEntry
          title="1.1, בספרי המוכר"
          lines={[
            { account: "מזומן", dr: L.SLB.high },
            { account: "נכס זכות שימוש", dr: L.HIGH_ROU },
            { account: "בניין", cr: L.SLB.bookValue },
            { account: "התחייבות חכירה", cr: L.HIGH_L },
            { account: "התחייבות פיננסית", cr: L.HIGH_LOAN },
            { account: "רווח הון", cr: L.HIGH_GAIN },
          ]}
        />
        <P>הקונה מפריד את התקבול השנתי לשני חלקים:</P>
        <JournalEntry
          title="1.1, בספרי הקונה"
          lines={[
            { account: "נדל״ן להשקעה", dr: L.SLB.fairValue },
            { account: "הלוואה לקבל", dr: L.HIGH_LOAN },
            { account: "מזומן", cr: L.SLB.high },
          ]}
        />
        <Tbl
          dense
          head={["התקבול השנתי", "סכום"]}
          rows={[
            [<>פירעון הלוואה: <Ltr>{`=PMT(5%;20;-200000)`}</Ltr></>, L.HIGH_PMT],
            ["הכנסות מהשכרה", L.HIGH_RENT],
          ]}
          foot={["סך הכול", L.SLB.payment]}
        />
        <P>בנוסף הכנסות מימון של {n(L.HIGH_INT)} בשנה הראשונה על ההלוואה: 5% על {n(L.HIGH_LOAN)}.</P>
        <Remember>לסיכום, נמוכה: מקדמה, ונכס זכות השימוש גדל. גבוהה: הלוואה, ונכס זכות השימוש קטן.</Remember>
        <Deeper title="איך מודדים את התיאום">
          <P>לפי מה שקל יותר לקבוע: ההפרש בין התמורה לשווי ההוגן של הנכס, או ההפרש בין הערך הנוכחי של התשלומים בחוזה לבין הערך הנוכחי לפי שיעורי שוק (סעיף 102).</P>
        </Deeper>
        <Deeper title="תשלומים משתנים בעסקה כזו (סעיף 102א)">
          <P>בגרסה מאוחרת יותר של התקן נוסף סעיף 102א, ולפיו קובעים את תשלומי החכירה כך שלא יוכר רווח על זכות השימוש שנשארה, גם כשהתשלומים משתנים ואינם תלויים במדד. בגרסה מינואר 2016 שעליה נשען הקורס הסעיף לא מופיע, ולכן לא אימתנו את נוסחו.</P>
        </Deeper>
      </>
    ),
    check: quiz("ls-spc-high", [
      {
        q: "שווי הוגן 700,000, תמורה 760,000. ערך נוכחי של התשלומים 500,000. מהי התחייבות החכירה?",
        options: ["440,000 ש״ח", "500,000 ש״ח", "560,000 ש״ח", "60,000 ש״ח"],
        answer: 0,
        why: "500,000 − 60,000 = 440,000. ה-60,000 הם הלוואה.",
      },
    ]),
  },
  "ls-spc-drill": {
    lead: "כל לחיצה נותנת עסקה חדשה. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["landGain", "subGain", "halfPv", "slbGain", "slbLow"]} />,
  },
  "ls-spc-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנט">
        <p>העסקה: חברה החכירה בחכירת משנה ל-5 השנים שנשארו לה בבניין עם 40 שנות חיים. בנפרד, היא מכרה מחסן בשווי הוגן של 1,000,000 ש״ח, בערך בספרים של 600,000 ש״ח, וחכרה אותו בחזרה, עם התחייבות של 700,000 ש״ח.</p>
        <p>הפתרון: ״חכירת המשנה תפעולית, כי 5 שנים הן מעט מ-40. במימונית הייתי גורע גם את התחייבות החכירה. במחסן: רווח 400,000 ש״ח.״</p>
      </Story>
    ),
    check: quiz("ls-spc-mistake", [
      {
        q: "מה הטעות בסיווג?",
        options: ["מסווגים מול זכות השימוש: 5 מתוך 5, ולכן מימונית", "צריך להשוות ל-35 שנה", "חכירת משנה תמיד תפעולית", "אין טעות"],
        answer: 0,
        why: "סעיף ב58(ב).",
      },
      {
        q: "מה הטעות בהתחייבות?",
        options: ["היא נשארת. יוצא רק נכס זכות השימוש", "היא מתקזזת עם ההשקעה נטו", "היא עוברת לחוכר המשנה", "אין טעות"],
        answer: 0,
        why: "החברה עדיין חייבת למחכיר הראשי.",
      },
      {
        q: "מה הטעות ברווח במחסן?",
        options: ["רק 30% עברו לקונה, ולכן 120,000", "צריך 700,000", "אין רווח בכלל", "אין טעות"],
        answer: 0,
        why: "400,000 × (1 − 70%) = 120,000 (סעיף 100(א)).",
      },
    ]),
  },
  "ls-spc-master": {
    lead: "כמו במבחן: בניין אחד, שלוש חברות. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״גשר״ חכרה מחברת ״אלון״ בניין משרדים ל-{L.CH.firstYears} שנים, עם אופציה של ״גשר״ ל-{L.CH.optionYears} שנים נוספות. התשלום <Money v={L.CH.payment} /> בסוף כל שנה, גם בתקופת האופציה, בזמן שמחיר השוק הצפוי באותן שנים <Money v={L.CH.marketRent} />.
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>
                <strong>אלון:</strong> ערך הבניין בספרים <Money v={L.CH.bookValue} />, ושוויו ההוגן <Money v={L.CH.fairValue} />. קרקע זניחה. {L.CH.life} שנות חיים. הריבית הגלומה {pct(L.CH.implicit)}, ואינה ידועה ל״גשר״. אלון אינה סוחרת, והיו לה עלויות ישירות.
              </li>
              <li>
                <strong>גשר:</strong> ריבית תוספתית {pct(L.CH.ibr)}. עלויות ישירות <Money v={L.CH.costs} />. שיפוץ של <Money v={L.CH.renovation} /> במהלך שנה 1, כשיפורים במושכר. השיפוץ הסתיים ב-31.12 של שנה 1.
              </li>
              <li>
                <strong>חכירת משנה:</strong> ב-1.1 של שנה 2 גשר החליטה לא להשתמש בבניין, והחכירה אותו לחברת ״תמר״ ל-{L.CH.subYears} שנים, <Money v={L.CH.subPayment} /> בסוף כל שנה. הריבית הגלומה {pct(L.CH.subRate)}, ואינה ידועה לתמר. הריבית התוספתית של תמר {pct(L.CH.subIbr)}.
              </li>
              <li>כל החברות: מודל העלות, פחת בקו ישר.</li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: חשבו את העלויות הישירות של אלון, והציגו את היתרות ב-31.12 של שנה 2 ואת ההשפעה על רווח או הפסד של שנה 2, בכל אחת משלוש החברות.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                {
                  title: "תקופת החכירה",
                  body: <p>{L.CH.years} שנים: {n(L.CH.payment)} במקום {n(L.CH.marketRent)} הוא תמריץ ברור לממש את האופציה (סעיף 18).</p>,
                },
                {
                  title: "אלון: עלויות וסיווג",
                  body: (
                    <>
                      <p>
                        <Ltr>{`=PV(9%;12;-400000) → ${n(L.CH_HEAD_PV)}`}</Ltr>. בריבית הגלומה הערך הנוכחי שווה לשווי ההוגן ולעלויות:
                      </p>
                      <p>
                        <Ltr>{`${n(L.CH_HEAD_PV)} − ${n(L.CH.fairValue)} = ${n(L.CH_HEAD_COSTS)}`}</Ltr>. {L.CH.years} מתוך {L.CH.life} שנים: מימונית.
                      </p>
                    </>
                  ),
                },
                {
                  title: "אלון: השקעה נטו",
                  body: (
                    <>
                      <Tbl
                        dense
                        head={["", "שנה 1", "שנה 2"]}
                        rows={[
                          ["1.1", CH_HEAD_ROWS[0].open, CH_HEAD_ROWS[1].open],
                          ["הכנסות מימון", CH_HEAD_ROWS[0].income, CH_HEAD_ROWS[1].income],
                          ["תקבול", -L.CH.payment, -L.CH.payment],
                        ]}
                        foot={["31.12", CH_HEAD_ROWS[0].close, CH_HEAD_ROWS[1].close]}
                      />
                      <Tbl
                        dense
                        head={["31.12 של שנה 2", "סכום"]}
                        rows={[
                          ["שוטפת", L.CH_HEAD_C2 - L.CH_HEAD_NC],
                          ["לא שוטפת", L.CH_HEAD_NC],
                          ["הכנסות מימון, שנה 2", L.CH_HEAD_I2],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: שנה 1",
                  body: (
                    <>
                      <p>
                        התחייבות: <Ltr>{`=PV(10%;12;-400000) → ${n(L.CH_L)}`}</Ltr>. נכס: <Ltr>{`${n(L.CH_L)} + ${n(L.CH.costs)} = ${n(L.CH_ROU)}`}</Ltr>.
                      </p>
                      <Tbl
                        dense
                        head={["שנה 1", "סכום"]}
                        rows={[
                          ["פחת, מהיום הראשון", -L.CH_DEP],
                          ["נכס זכות שימוש, 31.12", L.CH_ROU1],
                          ["שיפורים במושכר, 31.12", L.CH.renovation],
                          ["התחייבות, 31.12", L.CH_C1],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: חכירת המשנה",
                  body: (
                    <>
                      <p>
                        {L.CH.subYears} מתוך {L.CH.subYears} השנים שנשארו: מימונית, מול זכות השימוש. <Ltr>{`=PV(7%;11;-470000) → ${n(L.CH_NI)}`}</Ltr>.
                      </p>
                      <JournalEntry
                        title="1.1 של שנה 2"
                        lines={[
                          { account: "השקעה נטו בחכירה", dr: L.CH_NI },
                          { account: "נכס זכות שימוש", cr: L.CH_ROU1 },
                          { account: "שיפורים במושכר", cr: L.CH.renovation },
                          { account: "רווח הון", cr: L.CH_GAIN },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "גשר: שנה 2 בדוחות",
                  body: (
                    <>
                      <Tbl
                        dense
                        head={["רווח או הפסד", "סכום"]}
                        rows={[
                          ["רווח הון", L.CH_GAIN],
                          ["הכנסות מימון", L.CH_NI_INT],
                          ["הוצאות מימון", -L.CH_I2],
                        ]}
                        foot={["סך הכול", L.CH_TOTAL]}
                      />
                      <Tbl
                        dense
                        head={["31.12 של שנה 2", "שוטף", "לא שוטף"]}
                        rows={[
                          ["השקעה נטו", L.CH_NI_CLOSE - L.CH_NI_NC, L.CH_NI_NC],
                          ["התחייבות חכירה", L.CH_C2 - L.CH_NC, L.CH_NC],
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "תמר: חוכרת רגילה",
                  body: (
                    <>
                      <p>
                        הריבית הגלומה לא ידועה לה: <Ltr>{`=PV(8%;11;-470000) → ${n(L.CH_S_L)}`}</Ltr>.
                      </p>
                      <Tbl
                        dense
                        head={["שנה 2", "סכום"]}
                        rows={[
                          ["פחת", -L.CH_S_DEP],
                          ["הוצאות מימון", -L.CH_S_INT],
                          ["נכס זכות שימוש, 31.12", L.CH_S_ROU],
                          ["התחייבות, שוטפת", L.CH_S_CLOSE - L.CH_S_NC],
                          ["התחייבות, לא שוטפת", L.CH_S_NC],
                        ]}
                      />
                    </>
                  ),
                },
                { title: "מלכודת נפוצה", body: <p>לסווג את חכירת המשנה מול {L.CH.life} שנות חיי הבניין, ולקבל תפעולית. או לקזז בספרי גשר בין ההשקעה נטו להתחייבות.</p> },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אתם מכירים את כל התקן. נשאר לבדוק את זה בלי רמזים.">בשיעור הבא: מבחני סיכום ברמת מועצה, ועץ החלטה של כל התקן.</Bridge>
      </>
    ),
  },
};
