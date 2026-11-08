import { Building, Factory, ListChecks, RefreshCw, Scale, Search, Store, Truck, Wrench } from "lucide-react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { JournalEntry } from "@/components/study/blocks";
import * as C from "@/lib/study/ifrs16/lessons/changes";
import { Ltr } from "./ias19-formula";
import { TaskFrame, TaskText } from "./ias19-question";
import { Bridge, FullSteps } from "./ias19-ui";
import { Fork, Timeline, TwoPanel, WrongRight } from "./ias19-visuals";
import { ChangeLab, DecisionWalk, LeaseDrill } from "./ifrs16-interactive";
import { FullSolution, P, quiz, T16, Tbl } from "./ifrs16-parts";
import { SortQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Money, Rule } from "./ui";

/**
 * The leases course, lesson 5: the lessee when something changes. Every figure
 * comes from lib/study/ifrs16/lessons/changes.ts, in whole shekels, and every
 * table adds up.
 */

const M = ({ v, plain }: { v: number; plain?: boolean }) => <Money v={Math.round(v)} plain={plain} />;
const pct = (r: number, d = 0) => `${(r * 100).toFixed(d)}%`;
const n = (v: number) => Math.round(v).toLocaleString("en-US");

export const IFRS16_CHANGES_SCREENS: Record<string, ScreenContent> = {
  "ls-chg-hook": {
    lead: "כשמשהו משתנה, שואלים קודם: האם הצדדים שינו את החוזה, או שרק ההערכה או המדד השתנו?",
    body: (
      <>
        <Story icon={<Truck />} title="שני טלפונים מהמחכיר">
          <p>בטלפון הראשון אומרים לכם: ״המדד עלה, והתשלום הבא גבוה יותר״. אף אחד לא שינה שום דבר בחוזה. זה פשוט מה שהחוזה קבע.</p>
          <p>בטלפון השני אתם סוגרים עסקה: ״נחזיר קומה, ונקבל מחיר אחר״. כאן שני הצדדים משנים את החוזה.</p>
        </Story>
        <TwoPanel
          label="שני סוגי שינוי. הערכה מחדש: החוזה נשאר, והתשלומים הצפויים השתנו. תיקון חכירה: הצדדים משנים את ההיקף או את התמורה"
          panels={[
            { title: "הערכה מחדש (סעיפים 39–43)", icon: <RefreshCw />, steps: ["החוזה לא השתנה", "מדד, ערבות, תקופה, אופציה"], verdict: "מודדים מחדש", tone: 3 },
            { title: "תיקון חכירה (סעיפים 44–46)", icon: <Scale />, steps: ["הצדדים שינו את החוזה", "היקף או תמורה"], verdict: "שלוש דרכים", tone: 1 },
          ]}
        />
        <Rule>בהערכה מחדש, ובתיקון שאינו חכירה נפרדת, ההתחייבות מחושבת מחדש והנכס מתעדכן. ההבדלים הם איזו ריבית, ואם יש רווח או הפסד.</Rule>
      </>
    ),
  },
  "ls-chg-rate": {
    lead: "בהערכה מחדש, הריבית מתעדכנת כשהשינוי נוגע לתקופה, לאופציית רכישה או לריבית עצמה. במדד ובערבות שייר היא נשארת.",
    body: (
      <>
        <Tbl head={["מה השתנה", "ריבית", "ההפרש הולך ל", "מקור"]} rows={C.RATE_ROWS} />
        <P>
          בשינוי תקופה או אופציית רכישה, ״ריבית מעודכנת״ היא הגלומה ליתרת התקופה אם ניתנת לקביעה בנקל, ואחרת התוספתית של היום (<T16 he="סעיף 41" />). בריבית משתנה מעדכנים רק לפי השינוי בריבית (<T16 he="סעיף 43" />).
        </P>
        <TaskFrame label="שאלת מיון" icon={<ListChecks className="h-[18px] w-[18px]" aria-hidden />}>
          <SortQuiz prefix="ifrs16" id="ls-chg-rate" items={C.RATE_ITEMS} options={C.RATE_OPTIONS} />
        </TaskFrame>
        <Remember>שאלות נותנות לפעמים ריבית חדשה גם כשהשינוי הוא מדד או ערבות. זו מלכודת: לא משתמשים בה.</Remember>
      </>
    ),
  },
  "ls-chg-asset": {
    lead: "ההפרש בהתחייבות לא נכנס לרווח: הוא מתאים את הנכס. רק כשהנכס התאפס, השאר ברווח או הפסד.",
    body: (
      <>
        <Part title="סעיף 39">
          <p className="text-[15.5px] font-semibold">
            יתרת הנכס + הפרש בהתחייבות = הנכס אחרי
          </p>
        </Part>
        <Story icon={<Wrench />} title="ירידה גדולה מהנכס">
          <p>
            יתרת הנכס <M v={C.ZERO.asset} />, וההתחייבות קטנה ב-<M v={C.ZERO.decrease} />. הנכס יורד לאפס, והשאר, <M v={C.ZERO_GAIN} />, רווח.
          </p>
        </Story>
        <JournalEntry
          title="כשהנכס עוצר באפס"
          lines={[
            { account: "התחייבות חכירה", dr: C.ZERO.decrease },
            { account: "נכס זכות שימוש", cr: C.ZERO.asset },
            { account: "רווח מעדכון התחייבות", cr: C.ZERO_GAIN },
          ]}
        />
        <Part title="פחת אחרי כל שינוי">
          <p className="text-[15.5px] font-semibold">
            יתרת הנכס אחרי השינוי ÷ השנים שנשארו = פחת
          </p>
        </Part>
        <Remember>המשמעות: הפחת משתנה מעכשיו והלאה. לא מתקנים שנים קודמות.</Remember>
      </>
    ),
    check: quiz("ls-chg-asset", [
      {
        q: "יתרת הנכס 90,000 ש״ח. מדידה מחדש מגדילה את ההתחייבות ב-10,000 ש״ח. נשארו 4 שנים. מהו הפחת מעכשיו?",
        options: ["25,000 ש״ח", "30,000 ש״ח", "5,000 ש״ח", "20,000 ש״ח"],
        answer: 0,
        why: "(90,000 + 10,000) ÷ 4 = 25,000.",
      },
    ]),
  },
  "ls-chg-index": {
    lead: "מודדים מחדש רק כשהתשלום החוזי משתנה, לפי התשלום המעודכן ובלי תחזית. הריבית נשארת.",
    body: (
      <>
        <Story icon={<Factory />} title="ציוד צמוד למדד">
          <p>
            ציוד ל-{C.IDX.years} שנים, <M v={C.IDX.payment} /> בסוף כל שנה, צמוד למדד. מדד הבסיס {C.IDX.base}. בסוף שנה 1 הוא {C.IDX.indexes[0]}, ובסוף שנה 2 הוא {C.IDX.indexes[1]}. הריבית התוספתית בתחילה {pct(C.IDX.rate)}, ובסופי השנים {pct(C.IDX.rates[0])} ו-{pct(C.IDX.rates[1])}. אורך החיים {C.IDX.life} שנים, והציוד חוזר למחכיר.
          </p>
        </Story>
        <Timeline
          label="כל שנה: מוסיפים ריבית, משלמים לפי המדד של אותו יום, ואז מודדים את כל מה שנשאר"
          title="הסדר ב-31.12"
          from={0}
          to={3}
          ticks={[
            { at: 0, label: "ריבית" },
            { at: 1, label: "תשלום לפי מדד חדש" },
            { at: 2, label: "לפני מדידה" },
            { at: 3, label: "אחרי מדידה" },
          ]}
        />
        <Tbl
          dense
          head={["התחייבות החכירה", "שנה 1", "שנה 2"]}
          rows={[
            ["יתרה ב-1.1", C.IDX_ROWS[0].opening, C.IDX_ROWS[1].opening],
            [`ריבית ${pct(C.IDX.rate)}`, C.IDX_ROWS[0].interest, C.IDX_ROWS[1].interest],
            ["תשלום", -C.IDX_ROWS[0].paid, -C.IDX_ROWS[1].paid],
            ["לפני מדידה מחדש", C.IDX_ROWS[0].before, C.IDX_ROWS[1].before],
            ["מדידה מחדש", C.IDX_ROWS[0].change, C.IDX_ROWS[1].change],
          ]}
          foot={["יתרה ב-31.12", C.IDX_ROWS[0].after, C.IDX_ROWS[1].after]}
        />
        <P>
          היתרה אחרי המדידה היא הערך הנוכחי של מה שנשאר, לפי התשלום החדש. בשנה 1: <Ltr>{`=PV(6%;7;-${C.IDX_ROWS[0].paid}) → ${n(C.IDX_ROWS[0].after)}`}</Ltr>.
        </P>
        <Tbl
          dense
          head={["נכס זכות שימוש", "שנה 1", "שנה 2"]}
          rows={[
            ["יתרה ב-1.1", C.IDX_ROWS[0].rouOpen, C.IDX_ROWS[1].rouOpen],
            ["פחת", -C.IDX_ROWS[0].dep, -C.IDX_ROWS[1].dep],
            ["מדידה מחדש", C.IDX_ROWS[0].change, C.IDX_ROWS[1].change],
          ]}
          foot={["יתרה ב-31.12", C.IDX_ROWS[0].rou, C.IDX_ROWS[1].rou]}
        />
        <P>
          הפחת של שנה 2 הוא היתרה חלקי 7 השנים שנשארו, ולכן גבוה יותר. הריביות {pct(C.IDX.rates[0])} ו-{pct(C.IDX.rates[1])} לא משמשות בכלל.
        </P>
        <Tbl
          dense
          head={["מצב כספי, 31.12", "שנה 1", "שנה 2"]}
          rows={[
            ["התחייבות, לא שוטפת", C.IDX_ROWS[0].nonCurrent, C.IDX_ROWS[1].nonCurrent],
            ["התחייבות, שוטפת", C.IDX_ROWS[0].current, C.IDX_ROWS[1].current],
          ]}
        />
        <Remember>הלא שוטף מחושב על התשלום של היום, בלי לנחש מדד עתידי.</Remember>
        <Deeper title="ואם התשלום מתעדכן רק פעם בכמה שנים?">
          <P>מודדים רק כשהעדכון נכנס לתוקף (סעיף 42(ב)). עד אז לא נוגעים בהתחייבות, גם אם המדד זז.</P>
        </Deeper>
      </>
    ),
    check: quiz("ls-chg-index", [
      {
        q: "מדד הבסיס 100, והיום 106. התשלום הבסיסי 50,000 ש״ח, ומתעדכן בכל שנה. מהו התשלום של השנה?",
        options: ["53,000 ש״ח", "50,000 ש״ח", "56,000 ש״ח", "47,170 ש״ח"],
        answer: 0,
        why: "50,000 × 106 ÷ 100 = 53,000.",
      },
    ]),
  },
  "ls-chg-guar": {
    lead: "האומדן לערך השייר השתנה. מחשבים מחדש את מה שצפוי לתשלום, ומהוונים בריבית הישנה.",
    body: (
      <>
        <Story icon={<Wrench />} title="מכונה עם ערבות">
          <p>
            מכונה ל-{C.GUAR.years} שנים, <M v={C.GUAR.payment} /> בסוף כל שנה, וערבות שייר של <M v={C.GUAR.guarantee} />. אורך החיים {C.GUAR.life} שנים, והיא חוזרת למחכיר. הריבית הגלומה {pct(C.GUAR.rate)}, ניתנת לקביעה בנקל. הריבית התוספתית {pct(C.GUAR.ibr)}. בתחילה החוכר צפה ערך של <M v={C.GUAR.expected} />. בסוף שנה 1 הוא צופה <M v={C.GUAR.newExpected} />, והריבית הגלומה היום {pct(C.GUAR.newRate)}.
          </p>
        </Story>
        <FullSteps
          label="הפתרון לשנתיים"
          steps={[
            {
              title: "ביום הראשון",
              body: (
                <p>
                  צפוי לתשלום: <Ltr>{`${n(C.GUAR.guarantee)} − ${n(C.GUAR.expected)} = ${n(C.GUAR_SHORT)}`}</Ltr>. הגלומה קודמת לתוספתית, ולכן <Ltr>{`=PV(6%;5;-55000;-${C.GUAR_SHORT}) → ${n(C.GUAR_COST)}`}</Ltr>.
                </p>
              ),
            },
            {
              title: "מדידה מחדש, 31.12 של שנה 1",
              body: (
                <>
                  <p>
                    צפוי לתשלום עכשיו: <Ltr>{`${n(C.GUAR.guarantee)} − ${n(C.GUAR.newExpected)} = ${n(C.GUAR_NEW_SHORT)}`}</Ltr>. הריבית נשארת {pct(C.GUAR.rate)} (סעיף 43).
                  </p>
                  <Tbl
                    dense
                    head={["", "התחייבות", "נכס"]}
                    rows={[
                      ["1.1", C.GUAR_COST, C.GUAR_COST],
                      ["ריבית", C.GUAR_INT1, 0],
                      ["תשלום", -C.GUAR.payment, 0],
                      ["פחת: 5 שנים", 0, -C.GUAR_DEP1],
                      ["מדידה מחדש", C.GUAR_CHANGE, C.GUAR_CHANGE],
                    ]}
                    foot={["31.12 של שנה 1", C.GUAR_AFTER, C.GUAR_ROU1]}
                  />
                  <JournalEntry
                    title="מדידה מחדש"
                    lines={[
                      { account: "התחייבות חכירה", dr: -C.GUAR_CHANGE },
                      { account: "נכס זכות שימוש", cr: -C.GUAR_CHANGE },
                    ]}
                  />
                </>
              ),
            },
            {
              title: "שנה 2",
              body: (
                <Tbl
                  dense
                  head={["", "התחייבות", "נכס"]}
                  rows={[
                    ["1.1", C.GUAR_AFTER, C.GUAR_ROU1],
                    ["ריבית", C.GUAR_INT2, 0],
                    ["תשלום", -C.GUAR.payment, 0],
                    ["פחת: היתרה ÷ 4", 0, -C.GUAR_DEP2],
                  ]}
                  foot={["31.12 של שנה 2", C.GUAR_CLOSE2, C.GUAR_ROU2]}
                />
              ),
            },
            {
              title: "הדוחות",
              body: (
                <Tbl
                  dense
                  head={["", "שנה 1", "שנה 2"]}
                  rows={[
                    ["הוצאות פחת", C.GUAR_DEP1, C.GUAR_DEP2],
                    ["הוצאות מימון", C.GUAR_INT1, C.GUAR_INT2],
                    ["נכס זכות שימוש, נטו", C.GUAR_ROU1, C.GUAR_ROU2],
                    ["התחייבות, שוטפת", C.GUAR_AFTER - C.GUAR_NC1, C.GUAR_CLOSE2 - C.GUAR_NC2],
                    ["התחייבות, לא שוטפת", C.GUAR_NC1, C.GUAR_NC2],
                  ]}
                />
              ),
            },
            {
              title: "מלכודת נפוצה",
              body: <p>להשתמש ב-{pct(C.GUAR.newRate)} כי הוא נתון בשאלה, או להוריד את ההפרש ישר בלי להוון. הוא משולם רק בסוף התקופה.</p>,
            },
          ]}
        />
        <Remember>כשהאומדן משתפר, הנכס והחוב יורדים. בודקים שהנכס לא נהיה שלילי.</Remember>
      </>
    ),
  },
  "ls-chg-term": {
    lead: "כשאירוע בשליטת החוכר הופך הארכה לוודאית, התקופה משתנה. לכן גם הריבית מתעדכנת.",
    body: (
      <>
        <Story icon={<Building />} title="מפעל שמתרחב">
          <p>
            מבנה ל-{C.TERM.years} שנים, <M v={C.TERM.payment} /> בתחילת כל שנה. אופציה ל-{C.TERM.optionYears} שנים נוספות ב-<M v={C.TERM.optionPayment} /> לשנה, שלא ודאי שתמומש. עלויות ישירות <M v={C.TERM.direct} />, וריבית תוספתית {pct(C.TERM.rate)}. בשנה {C.TERM.eventYear} החברה רכשה עסק, ובסופה ודאי באופן סביר שתאריך. הריבית התוספתית היום {pct(C.TERM.newRate)}.
          </p>
          <p className="font-semibold">נדרש: הסעיפים של שנה 1, פקודת המדידה מחדש ב-31.12 של שנה {C.TERM.eventYear}, והסעיפים של שנה 7.</p>
        </Story>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "שנה 1",
              body: (
                <Tbl
                  dense
                  head={["", "סכום"]}
                  rows={[
                    ["ערך נוכחי של 8 התשלומים", C.TERM_GROSS],
                    ["עלות הנכס, עם עלויות ישירות", C.TERM_COST],
                    ["הוצאות פחת: 8 שנים", C.TERM_DEP],
                    ["הוצאות מימון: על היתרה אחרי התשלום", C.TERM_INT1],
                    ["נכס זכות שימוש, נטו", C.TERM_ROU1],
                    ["התחייבות, שוטפת", C.TERM.payment],
                    ["התחייבות, לא שוטפת", C.TERM_CLOSE1 - C.TERM.payment],
                  ]}
                />
              ),
            },
            {
              title: `לפני השינוי, 31.12 של שנה ${C.TERM.eventYear}`,
              body: (
                <P>
                  נשארו {C.TERM_LEFT} תשלומים, והראשון מחר. התחייבות: <Ltr>{`=PV(6%;3;-60000;;1) → ${n(C.TERM_BEFORE_L)}`}</Ltr>. נכס: {C.TERM_LEFT}/{C.TERM.years} מהעלות, כלומר {n(C.TERM_BEFORE_A)}.
                </P>
              ),
            },
            {
              title: "אחרי השינוי",
              body: (
                <>
                  <Tbl
                    dense
                    head={["תשלום ב-1.1", "סכום"]}
                    rows={[
                      ["מחר ועוד שנתיים, 3 פעמים", C.TERM.payment],
                      ["3 השנים של האופציה", C.TERM.optionPayment],
                    ]}
                  />
                  <p>
                    מהוונים הכול ב-{pct(C.TERM.newRate)}: {n(C.TERM_AFTER_L)}. המדידה מחדש: {n(C.TERM_CHANGE)}.
                  </p>
                  <JournalEntry
                    title={`31.12 של שנה ${C.TERM.eventYear}`}
                    lines={[
                      { account: "נכס זכות שימוש", dr: C.TERM_CHANGE },
                      { account: "התחייבות חכירה", cr: C.TERM_CHANGE },
                    ]}
                  />
                  <p>
                    נכס אחרי: {n(C.TERM_AFTER_A)}. התחייבות שוטפת {n(C.TERM.payment)}, לא שוטפת {n(C.TERM_AFTER_L - C.TERM.payment)}.
                  </p>
                </>
              ),
            },
            {
              title: "שנה 7",
              body: (
                <Tbl
                  dense
                  head={["", "סכום"]}
                  rows={[
                    [<>הוצאות פחת: <Ltr>{`${n(C.TERM_AFTER_A)} ÷ ${C.TERM_NEW_YEARS}`}</Ltr></>, C.TERM_DEP2],
                    ["הוצאות מימון: 7%, אחרי התשלום", C.TERM_INT7],
                    ["נכס זכות שימוש, נטו", C.TERM_ROU7],
                    ["התחייבות, שוטפת", C.TERM.payment],
                    ["התחייבות, לא שוטפת", C.TERM_CLOSE7 - C.TERM.payment],
                  ]}
                />
              ),
            },
            {
              title: "מלכודת נפוצה",
              body: <p>להשאיר {pct(C.TERM.rate)}, או לשכוח שהתשלום של מחר עדיין בהתחייבות ולא נושא ריבית.</p>,
            },
          ]}
        />
        <Remember>הוראות מתי בודקים מחדש את התקופה למדנו בשיעור 2: אירוע משמעותי בשליטת החוכר, או שינוי בפועל בתקופה שאינה ניתנת לביטול (סעיף 21). שינוי בשוק לבדו לא מספיק.</Remember>
      </>
    ),
  },
  "ls-chg-buy": {
    lead: "כשאופציית רכישה הופכת לוודאית, קורים שלושה דברים: מחירה נכנס לחוב, הריבית מתעדכנת, והפחת עובר לאורך החיים.",
    body: (
      <>
        <Tbl
          dense
          head={["מה משתנה", "מקור"]}
          rows={[
            ["מחיר האופציה מהוון ונכנס להתחייבות ולנכס", "סעיף 40(ב)"],
            ["ריבית מעודכנת על כל מה שנשאר", "סעיף 41"],
            ["הפחת: היתרה החדשה חלקי יתרת אורך החיים", "סעיף 32"],
          ]}
        />
        <Rule>אותו דבר בכיוון ההפוך: אופציה שהפסיקה להיות ודאית יוצאת מהחוב, והפחת חוזר לקצר מבין השניים.</Rule>
        <Deeper title="ומה עם תשלום משתנה שהופך לקבוע?">
          <P>תשלום שנקבע לפי השימוש עד תאריך מסוים, ומאז קבוע ליתרת התקופה, הוא קבוע במהותו מאותו רגע (ב42(א)(ii)). מאז הוא בהתחייבות, ומודדים מחדש (סעיף 36(ג)).</P>
        </Deeper>
      </>
    ),
    check: quiz("ls-chg-buy", [
      {
        q: "חכירה ל-5 שנים נוספות, יתרת חיים 12 שנים. עכשיו ודאי שאופציית הרכישה תמומש. על פני כמה שנים מפחיתים מעכשיו?",
        options: ["12", "5", "17", "7"],
        answer: 0,
        why: "סעיף 32: העלות משקפת עכשיו מימוש של אופציית רכישה.",
      },
    ]),
  },
  "ls-chg-mod": {
    lead: "תיקון הוא שינוי בהיקף או בתמורה, שלא היה חלק מהתנאים המקוריים. ענו על השאלות, וראו מה עושים.",
    body: (
      <>
        <DecisionWalk nodes={C.CHANGE_WALK} start={C.CHANGE_WALK_START} label="מה השתנה, ומה עושים" again="בודקים שינוי אחר" />
        <Part title="תיקון שאינו נפרד: מה עושים (סעיף 45)">
          <ul className="list-disc space-y-1.5 ps-5 text-[15px]">
            <li>מקצים מחדש את התמורה לרכיבים.</li>
            <li>קובעים מחדש את תקופת החכירה.</li>
            <li>מודדים מחדש בריבית מעודכנת, ביום שבו הצדדים הסכימו.</li>
          </ul>
        </Part>
        <Remember>גם אם ההשפעה מתחילה רק בעתיד, המועד הוא יום ההסכמה.</Remember>
      </>
    ),
  },
  "ls-chg-sep": {
    lead: "תיקון הוא חכירה נפרדת רק כשמתקיימים שני תנאים יחד: נכס נוסף, ומחיר נפרד.",
    body: (
      <>
        <Fork
          label="חכירה נפרדת דורשת גם תוספת זכות שימוש וגם תמורה לפי המחיר הנפרד. אחרת מודדים מחדש את החכירה הקיימת"
          question="מוסיפים 1,000 מ״ר למשרדים"
          branches={[
            { when: "במחיר השוק, פחות הנחה על חיסכון של המחכיר בשיווק", then: "שני התנאים מתקיימים: חכירה נפרדת" },
            { when: "בהנחה שאינה משקפת את מחיר השוק", then: "המחיר אינו נפרד: מדידה מחדש כנגד הנכס" },
          ]}
        />
        <Story icon={<Building />} title="חכירה נפרדת, במספרים">
          <p>
            {n(C.SEP.area)} מ״ר נוספים ל-{C.SEP.years} שנים, <M v={C.SEP.yearly} /> בסוף כל שנה, במחיר הנפרד. ריבית ל-{pct(C.SEP.rate)}. נרשם נכס והתחייבות חדשים של <M v={C.SEP_L} />, והחכירה הישנה לא משתנה: לא בריבית, לא ביתרות.
          </p>
        </Story>
        <Rule>הארכה של אותו נכס אינה ״תוספת״, גם במחיר שוק. לכן היא אף פעם לא חכירה נפרדת.</Rule>
      </>
    ),
    check: quiz("ls-chg-sep", [
      {
        q: "חוכר מוסיף מכונה שנייה לחוזה, במחיר השוק שלה. מה קורה לריבית של המכונה הראשונה?",
        options: ["לא משתנה. המכונה השנייה היא חכירה נפרדת", "מתעדכנת לריבית של היום", "ממוצע של שתי הריביות", "מתאפסת"],
        answer: 0,
        why: "סעיף 44: החכירה המקורית נשארת כמו שהיא.",
      },
    ]),
  },
  "ls-chg-extend": {
    lead: "הארכה בתיקון: מודדים את כל מה שנשאר בריבית של היום, וההפרש כנגד הנכס. אין רווח ואין הפסד.",
    body: (
      <>
        <Story icon={<Building />} title="משרדים: לפני התיקון">
          <p>
            {n(C.OFFICE.area)} מ״ר ל-{C.OFFICE.years} שנים, <M v={C.OFFICE.payment} /> בסוף כל שנה, ריבית תוספתית {pct(C.OFFICE.rate)}. אחרי {C.OFFICE.passed} שנים, ב-1.1 של שנה {C.OFFICE.passed + 1}, הריבית התוספתית {pct(C.OFFICE.newRate)}.
          </p>
          <p>
            נכס: {C.OFFICE_LEFT}/{C.OFFICE.years} מהעלות <M v={C.OFFICE_COST} />, כלומר <M v={C.OFFICE_A} />. התחייבות: <Ltr>{`=PV(5%;4;-90000) → ${n(C.OFFICE_L)}`}</Ltr>.
          </p>
        </Story>
        <P>הצדדים מסכימים על עוד {C.EXT.extra} שנים, באותם תנאים:</P>
        <Tbl
          dense
          head={["", "התחייבות", "נכס"]}
          rows={[
            ["לפני", C.OFFICE_L, C.OFFICE_A],
            ["מדידה מחדש", C.EXT_CHANGE, C.EXT_CHANGE],
          ]}
          foot={["אחרי", C.EXT_AFTER, C.OFFICE_A + C.EXT_CHANGE]}
        />
        <P>
          ההתחייבות אחרי: <Ltr>{`=PV(6%;7;-90000) → ${n(C.EXT_AFTER)}`}</Ltr>.
        </P>
        <JournalEntry
          title="יום התיקון"
          lines={[
            { account: "נכס זכות שימוש", dr: C.EXT_CHANGE },
            { account: "התחייבות חכירה", cr: C.EXT_CHANGE },
          ]}
        />
      </>
    ),
  },
  "ls-chg-shrink": {
    lead: "הקטנת שטח בשני שלבים: קודם מוציאים את מה שנעלם ורושמים רווח או הפסד, ורק אז מודדים את מה שנשאר.",
    body: (
      <>
        <P>
          אותם משרדים. התיקון: {n(C.HALF.area)} מ״ר במקום {n(C.OFFICE.area)}, ותשלום של <M v={C.HALF.payment} /> ליתרת התקופה.
        </P>
        <Tbl
          dense
          head={["", "התחייבות", "נכס"]}
          rows={[
            ["לפני", C.OFFICE_L, C.OFFICE_A],
            ["שלב 1: גריעת מחצית", -C.HALF_L_OUT, -C.HALF_A_OUT],
            ["שלב 2: מדידה מחדש", C.HALF_REM, C.HALF_REM],
          ]}
          foot={["אחרי", C.HALF_AFTER, C.HALF_ASSET]}
        />
        <JournalEntry
          title="שלב 1: גריעה, סעיף 46(א)"
          lines={[
            { account: "התחייבות חכירה", dr: C.HALF_L_OUT },
            { account: "נכס זכות שימוש", cr: C.HALF_A_OUT },
            { account: "רווח מתיקון חכירה", cr: C.HALF_GAIN },
          ]}
        />
        <JournalEntry
          title="שלב 2: מדידה מחדש, סעיף 45(ג)"
          lines={[
            { account: "נכס זכות שימוש", dr: C.HALF_REM },
            { account: "התחייבות חכירה", cr: C.HALF_REM },
          ]}
        />
        <P>
          ההתחייבות בסוף: <Ltr>{`=PV(6%;4;-55000) → ${n(C.HALF_AFTER)}`}</Ltr>. ההפרש בשלב 2 הוא גם הריבית החדשה וגם התשלום החדש.
        </P>
        <WrongRight
          label="טעות: לחשב הכול בבת אחת ברווח או הפסד. נכון: הגריעה לרווח או הפסד, והשאר לנכס"
          wrong={<p>״הנכס וההתחייבות יורדים למספרים החדשים, וכל ההפרש ברווח.״</p>}
          right={<p>רק החלק שבוטל הולך לרווח או הפסד. שינוי הריבית והתשלום של החלק שנשאר הולך לנכס.</p>}
        />
      </>
    ),
    check: quiz("ls-chg-shrink", [
      {
        q: "התחייבות 100,000, נכס 90,000. החברה מחזירה 30% מהשטח. מה הרווח בשלב הגריעה?",
        options: ["3,000 ש״ח", "10,000 ש״ח", "30,000 ש״ח", "27,000 ש״ח"],
        answer: 0,
        why: "30,000 − 27,000 = 3,000.",
      },
    ]),
  },
  "ls-chg-cut": {
    lead: "גם קיצור תקופה הוא הקטנת היקף. מהנכס גורעים לפי השנים, ומההתחייבות לפי מה שנשאר בריבית הישנה.",
    body: (
      <>
        <P>
          אותם משרדים. התיקון: מוסיפים {n(C.CUT.extraArea)} מ״ר, אבל נשארות רק {C.CUT.left} שנים, ב-<M v={C.CUT.payment} /> לשנה. המחיר אינו המחיר הנפרד של התוספת, ולכן זו אינה חכירה נפרדת.
        </P>
        <Tbl
          dense
          head={["", "התחייבות", "נכס"]}
          rows={[
            ["לפני", C.OFFICE_L, C.OFFICE_A],
            [`גריעה: נשארו ${C.CUT.left} מ-${C.OFFICE_LEFT}`, -C.CUT_L_OUT, -C.CUT_A_OUT],
            [`ריבית חדשה ${pct(C.OFFICE.newRate)}`, C.CUT_M1, C.CUT_M1],
            ["תשלום חדש ושטח נוסף", C.CUT_M2, C.CUT_M2],
          ]}
          foot={["אחרי", C.CUT_R2, C.CUT_ASSET]}
        />
        <Tbl
          dense
          head={["השורה", "מאיפה"]}
          rows={[
            ["התחייבות אחרי גריעה", <Ltr key="a">{`=PV(5%;2;-90000) → ${n(C.CUT_KEEP)}`}</Ltr>],
            ["אחרי ריבית חדשה", <Ltr key="b">{`=PV(6%;2;-90000) → ${n(C.CUT_R1)}`}</Ltr>],
            ["אחרי תשלום חדש", <Ltr key="c">{`=PV(6%;2;-110000) → ${n(C.CUT_R2)}`}</Ltr>],
          ]}
        />
        <JournalEntry
          title="גריעה"
          lines={[
            { account: "התחייבות חכירה", dr: C.CUT_L_OUT },
            { account: "נכס זכות שימוש", cr: C.CUT_A_OUT },
            { account: "רווח מתיקון חכירה", cr: C.CUT_GAIN },
          ]}
        />
        <JournalEntry
          title="מדידה מחדש"
          lines={[
            { account: "נכס זכות שימוש", dr: C.CUT_M1 + C.CUT_M2 },
            { account: "התחייבות חכירה", cr: C.CUT_M1 + C.CUT_M2 },
          ]}
        />
        <Remember>שתי מדידות מחדש הן שני שלבים של אותו דבר. אפשר להציג אותן בשורה אחת, כמו בפקודה.</Remember>
      </>
    ),
    check: quiz("ls-chg-cut", [
      {
        q: "יתרת הנכס 120,000, ונשארו 6 שנים. התיקון מקצר לשנה אחת. כמה נגרע מהנכס?",
        options: ["100,000 ש״ח", "20,000 ש״ח", "60,000 ש״ח", "40,000 ש״ח"],
        answer: 0,
        why: "120,000 × 5 ÷ 6 = 100,000: 5 מתוך 6 השנים בוטלו.",
      },
    ]),
  },
  "ls-chg-shop": {
    lead: "דוגמה שלמה, בשתי הנחות נפרדות: אותה חנות קטנה, ואותה חנות גדלה.",
    body: (
      <>
        <Story icon={<Store />} title="חנות של 600 מ״ר">
          <p>
            ב-1.1 של שנה 1 חברה חכרה חנות של {n(C.SHOP.area)} מ״ר ל-{C.SHOP.years} שנים, כולל אופציה ודאית. התשלום <M v={C.SHOP.payment} /> בסוף כל שנה, כלומר {C.SHOP.perMeter} ש״ח למ״ר, ועוד 2% מהכנסות החנות. ריבית גלומה {pct(C.SHOP.rate)}, ידועה לחברה. הכנסות שנה 1: <M v={C.SHOP.sales} />. ב-31.12, אחרי התשלום, הריבית הגלומה {pct(C.SHOP.newRate)}.
          </p>
          <p className="font-semibold">
            הנחה א׳: השטח יורד ל-{n(C.SHOP.half)} מ״ר. הנחה ב׳: השטח עולה ב-{n(C.SHOP.half)} מ״ר, ב-90% ממחיר השוק, שאינו המחיר הנפרד. נדרש: דוחות לשנה 1.
          </p>
        </Story>
        <FullSteps
          label="הפתרון"
          steps={[
            {
              title: "משותף, עד 31.12 לפני התיקון",
              body: (
                <Tbl
                  dense
                  head={["", "סכום"]}
                  rows={[
                    ["התחייבות ונכס ב-1.1", C.SHOP_COST],
                    ["הוצאות פחת: 6 שנים", C.SHOP_DEP],
                    ["הוצאות מימון", C.SHOP_INT],
                    ["התחייבות לפני התיקון", C.SHOP_BEFORE],
                    ["נכס לפני התיקון", C.SHOP_A],
                    ["הוצאה לפי הכנסות: 2%", C.SHOP_VAR],
                  ]}
                />
              ),
            },
            {
              title: "הנחה א׳: הקטנה",
              body: (
                <Tbl
                  dense
                  head={["", "התחייבות", "נכס"]}
                  rows={[
                    ["לפני", C.SHOP_BEFORE, C.SHOP_A],
                    ["גריעת מחצית", -(C.SHOP_BEFORE - C.SHOP_KEEP), -(C.SHOP_A - C.SHOP_A_KEEP)],
                    ["מדידה מחדש ב-6%", C.SHOP_REM, C.SHOP_REM],
                  ]}
                  foot={["אחרי", C.SHOP_AFTER, C.SHOP_ASSET]}
                />
              ),
            },
            {
              title: "הנחה ב׳: הגדלה",
              body: (
                <>
                  <p>
                    התוספת: <Ltr>{`${C.SHOP.half} × ${C.SHOP.perMeter} × 0.9 = ${n(C.SHOP_EXTRA)}`}</Ltr>. התשלום החדש {n(C.SHOP_B_PAY)}. המחיר אינו נפרד, ולכן מודדים מחדש הכול כנגד הנכס.
                  </p>
                  <Tbl
                    dense
                    head={["", "התחייבות", "נכס"]}
                    rows={[
                      ["לפני", C.SHOP_BEFORE, C.SHOP_A],
                      ["מדידה מחדש ב-6%", C.SHOP_B_CH, C.SHOP_B_CH],
                    ]}
                    foot={["אחרי", C.SHOP_B_AFTER, C.SHOP_B_ASSET]}
                  />
                </>
              ),
            },
            {
              title: "הדוחות לשנה 1",
              body: (
                <Tbl
                  dense
                  head={["", "הנחה א׳", "הנחה ב׳"]}
                  rows={[
                    ["הוצאות פחת", C.SHOP_DEP, C.SHOP_DEP],
                    ["הוצאות מימון", C.SHOP_INT, C.SHOP_INT],
                    ["לפי הכנסות", C.SHOP_VAR, C.SHOP_VAR],
                    ["רווח מהקטנה", -C.SHOP_GAIN, 0],
                    ["סך ההוצאות נטו", C.SHOP_TOTAL, C.SHOP_B_TOTAL],
                    ["נכס זכות שימוש, נטו", C.SHOP_ASSET, C.SHOP_B_ASSET],
                    ["התחייבות, שוטפת", C.SHOP_AFTER - C.SHOP_NC, C.SHOP_B_AFTER - C.SHOP_B_NC],
                    ["התחייבות, לא שוטפת", C.SHOP_NC, C.SHOP_B_NC],
                  ]}
                />
              ),
            },
            {
              title: "מלכודת נפוצה",
              body: <p>להניח שתוספת שטח תמיד נפרדת. כאן 90% ממחיר השוק אינו המחיר הנפרד, ולכן הכול נמדד מחדש.</p>,
            },
          ]}
        />
      </>
    ),
  },
  "ls-chg-store": {
    lead: "שאלה שלמה: מדד, אופציית רכישה שלא צמודה, ותשלום לפי הכנסות. קודם פתרו לבד.",
    body: (
      <TaskFrame>
        <TaskText>
          <p>
            ב-1.1 של שנה 1 חברה חכרה חנות ל-{C.STORE.years} שנים, כולל הארכה ודאית. <Money v={C.STORE.payment} /> בסוף כל שנה, צמוד למדד. בנוסף 2% מההכנסות. ודאי באופן סביר שבסוף התקופה תקנה את החנות ב-<Money v={C.STORE.option} />. מחיר האופציה והתשלום לפי ההכנסות אינם צמודים.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 ps-5">
            <li>הריבית הגלומה לא ידועה, והריבית התוספתית {pct(C.STORE.rate)} לאורך כל התקופה.</li>
            <li>אורך החיים {C.STORE.life} שנים, והפחת בקו ישר.</li>
            <li>
              המדד עלה מ-{C.STORE.base} ל-{C.STORE.index} בסוף שנה 1. הכנסות שנה 1: <Money v={C.STORE.sales} />.
            </li>
          </ul>
          <p className="mt-2 font-semibold">נדרש: הציגו את הסעיפים בדוחות של שנה 1.</p>
        </TaskText>
        <FullSolution>
          <FullSteps
            label="הפתרון המלא"
            steps={[
              {
                title: "מדידה לראשונה",
                body: (
                  <p>
                    <Ltr>{`=PV(4%;8;-100000;-8000) → ${n(C.STORE_COST)}`}</Ltr>. המחיר של האופציה בפנים, כי ודאי שתמומש. 2% מההכנסות בחוץ.
                  </p>
                ),
              },
              {
                title: "המעגלים",
                body: (
                  <Tbl
                    dense
                    head={["", "התחייבות", "נכס"]}
                    rows={[
                      ["1.1", C.STORE_COST, C.STORE_COST],
                      ["ריבית", C.STORE_INT, 0],
                      ["תשלום: 100,000 × 103 ÷ 100", -C.STORE_PAID, 0],
                      ["פחת: 10 שנים", 0, -C.STORE_DEP],
                      ["מדידה מחדש", C.STORE_CH, C.STORE_CH],
                    ]}
                    foot={["31.12", C.STORE_AFTER, C.STORE_ROU]}
                  />
                ),
              },
              {
                title: "ההתחייבות אחרי",
                body: (
                  <p>
                    <Ltr>{`=PV(4%;7;-103000;-8000) → ${n(C.STORE_AFTER)}`}</Ltr>. ההצמדה חלה על התשלומים, ולא על מחיר האופציה.
                  </p>
                ),
              },
              {
                title: "הדוחות",
                body: (
                  <Tbl
                    dense
                    head={["", "שנה 1"]}
                    rows={[
                      ["הוצאות פחת", C.STORE_DEP],
                      ["הוצאות מימון", C.STORE_INT],
                      ["הוצאות לפי הכנסות", C.STORE_VAR],
                      ["נכס זכות שימוש, נטו", C.STORE_ROU],
                      ["התחייבות, שוטפת", C.STORE_AFTER - C.STORE_NC],
                      ["התחייבות, לא שוטפת", C.STORE_NC],
                    ]}
                  />
                ),
              },
              {
                title: "מלכודת נפוצה",
                body: <p>לשלם 100,000 ב-31.12. התשלום של אותו יום כבר לפי המדד החדש, וההפרש עובר דרך המדידה מחדש, ולכן הוא לא הוצאה.</p>,
              },
            ]}
          />
        </FullSolution>
      </TaskFrame>
    ),
  },
  "ls-chg-lab": {
    lead: "בחרו סוג שינוי, שנו את המספרים, וראו את שתי היתרות לפני ואחרי, עם הפקודה.",
    body: <ChangeLab />,
  },
  "ls-chg-drill": {
    lead: "כל לחיצה נותנת חכירה חדשה ושינוי חדש. פתרו, בדקו, וראו את הפתרון המלא.",
    body: <LeaseDrill families={["indexChange", "extendMod", "shrink"]} />,
  },
  "ls-chg-mistake": {
    lead: "הפתרון הבא כולל שלוש טעויות נפוצות. מצאו אותן.",
    body: (
      <Story icon={<Search />} title="הפתרון של סטודנטית">
        <p>הנתונים: חכירה צמודה למדד. בסוף שנה המדד עלה, והריבית התוספתית עלתה מ-5% ל-7%. באותו יום הצדדים גם הסכימו להקטין את השטח ב-20%.</p>
        <p>הפתרון: ״במדידה מחדש בגלל המדד השתמשתי ב-7%. את ההפרש הגדול רשמתי כהוצאת מימון. בהקטנה מדדתי קודם מחדש, ורק אחר כך גרעתי 20%.״</p>
      </Story>
    ),
    check: quiz("ls-chg-mistake", [
      {
        q: "מה הטעות בריבית של המדד?",
        options: ["מדד נמדד בריבית הישנה: 5%", "צריך להשתמש בממוצע", "צריך לעדכן ל-8%", "אין טעות"],
        answer: 0,
        why: "סעיף 43.",
      },
      {
        q: "מה הטעות ברישום ההפרש?",
        options: ["ההפרש מתאים את הנכס, ולא הוצאת מימון", "צריך לרשום אותו כהכנסה", "לא רושמים אותו", "אין טעות"],
        answer: 0,
        why: "סעיף 39.",
      },
      {
        q: "מה הטעות בסדר של ההקטנה?",
        options: ["קודם גריעה ורווח או הפסד, ורק אז מדידה מחדש", "קודם מחשבים פחת שנתי מחדש", "מקטינים רק את הנכס", "אין טעות"],
        answer: 0,
        why: "סעיף 46(א) מטפל בחלק שבוטל לפני השאר.",
      },
    ]),
  },
  "ls-chg-master": {
    lead: "כמו במבחן: תיקון אחד שעושה כמה דברים בבת אחת. קודם פתרו לבד.",
    body: (
      <>
        <TaskFrame>
          <TaskText>
            <p>
              ב-1.1 של שנה 1 חברת ״אורן הנדסה״ חכרה {C.MASTER.floors} קומות זהות במגדל משרדים, ל-{C.MASTER.years} שנים, בלי אופציות. כל קומה ניתנת להשכרה בנפרד. התשלום <Money v={C.MASTER.perFloor} /> לקומה, בסוף כל שנה. הריבית התוספתית {pct(C.MASTER.rate)}, ואין עלויות ישירות או תמריצים. הנכס במודל העלות.
            </p>
            <p className="mt-2">ב-1.1 של שנה 3 הצדדים הסכימו, וביום זה הריבית התוספתית {pct(C.MASTER.newRate)}:</p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5">
              <li>הקומה העליונה תוחזר בעוד שנה, ב-1.1 של שנה 4.</li>
              <li>שלוש הקומות האחרות יישארו {C.MASTER.newYears} שנים מיום ההסכמה, במקום {C.M_LEFT}.</li>
              <li>
                מיום ההסכמה התשלום לכל קומה יהיה <Money v={C.MASTER.newPerFloor} />, מחיר השוק.
              </li>
            </ul>
            <p className="mt-2 font-semibold">נדרש: פקודות היומן ליום ההסכמה, עם חישובי עזר.</p>
          </TaskText>
          <FullSolution>
            <FullSteps
              label="הפתרון המלא"
              steps={[
                {
                  title: "כמה חכירות",
                  body: <p>כל קומה ניתנת להשכרה בנפרד, ולכן כל קומה היא רכיב חכירה נפרד (ב32). מטפלים בכל קומה לפי מה שקרה לה.</p>,
                },
                {
                  title: "היתרות לפני, לכל קומה",
                  body: (
                    <p>
                      עלות: <Ltr>{`=PV(6%;6;-240000) → ${n(C.M_COST)}`}</Ltr>. נכס: {C.M_LEFT}/{C.MASTER.years} ממנה, {n(C.M_A)}. התחייבות: <Ltr>{`=PV(6%;4;-240000) → ${n(C.M_L)}`}</Ltr>.
                    </p>
                  ),
                },
                {
                  title: "הקומה העליונה: קיצור הוא הקטנה",
                  body: (
                    <>
                      <p>נשארה שנה אחת מתוך 4. מהנכס נשאר 1/4, ומההתחייבות נשאר תשלום אחד בריבית הישנה.</p>
                      <Tbl
                        dense
                        head={["", "התחייבות", "נכס"]}
                        rows={[
                          ["לפני", C.M_L, C.M_A],
                          ["שלב 1: גריעה", -C.M_TOP_L_OUT, -C.M_TOP_A_OUT],
                          ["שלב 2: 8% ותשלום חדש", C.M_TOP_REM, C.M_TOP_REM],
                        ]}
                        foot={["אחרי", C.M_TOP_AFTER, C.M_TOP_ASSET]}
                      />
                      <JournalEntry
                        title="שלב 1"
                        lines={[
                          { account: "התחייבות חכירה", dr: C.M_TOP_L_OUT },
                          { account: "נכס זכות שימוש", cr: C.M_TOP_A_OUT },
                          { account: "רווח מתיקון חכירה", cr: C.M_TOP_GAIN },
                        ]}
                      />
                      <JournalEntry
                        title="שלב 2"
                        lines={[
                          { account: "התחייבות חכירה", dr: -C.M_TOP_REM },
                          { account: "נכס זכות שימוש", cr: -C.M_TOP_REM },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "שלוש הקומות: הארכה ומחיר חדש",
                  body: (
                    <>
                      <p>אין תוספת נכס, ולכן אין חכירה נפרדת, גם במחיר השוק. אין הקטנה. מודדים מחדש כנגד הנכס.</p>
                      <Tbl
                        dense
                        head={["", "התחייבות", "נכס"]}
                        rows={[
                          ["לפני: 3 קומות", C.M_REST_L, C.M_REST_A],
                          ["מדידה מחדש", C.M_REST_CH, C.M_REST_CH],
                        ]}
                        foot={["אחרי", C.M_REST_AFTER, C.M_REST_ASSET]}
                      />
                      <p>
                        <Ltr>{`=PV(8%;6;-210000) × 3 → ${n(C.M_REST_AFTER)}`}</Ltr>
                      </p>
                      <JournalEntry
                        title="מדידה מחדש"
                        lines={[
                          { account: "נכס זכות שימוש", dr: C.M_REST_CH },
                          { account: "התחייבות חכירה", cr: C.M_REST_CH },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  title: "מלכודת נפוצה",
                  body: <p>לחכות לשנה 4 עם הקומה העליונה, או להשאיר 1/4 מההתחייבות, כמו בנכס. המועד הוא יום ההסכמה, וההתחייבות שנשארת היא תשלום אחד בריבית הישנה.</p>,
                },
              ]}
            />
          </FullSolution>
        </TaskFrame>
        <Bridge summary="עכשיו אתם מכירים את כל הדרך של החוכר. ומה קורה בצד השני של החוזה?">בשיעור הבא: המחכיר, שני המודלים שלו, ומתי נכס יוצא מהספרים.</Bridge>
      </>
    ),
  },
};

