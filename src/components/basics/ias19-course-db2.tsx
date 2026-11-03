import { Briefcase, Inbox, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Deeper, Part, Remember } from "@/components/study-mode/screen-parts";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { CTO, CTO_OPENING, CTO_YEAR, RETIRE, RETIRE_PAID, RETIRE_PN, SETTLE, SETTLE_GAIN, SMALL, SMALL_LOSS } from "@/lib/study/ias19/lessons/amend";
import {
  PLAN,
  PLAN_ASSETS,
  PLAN_EFFECT,
  PLAN_OPENING,
  PLAN_PER_YEAR,
  PLAN_YEAR,
  SPLIT,
  SPLIT_INTEREST,
  SPLIT_OTHER,
  SURPLUS,
  SURPLUS_A,
  SURPLUS_CEILING,
  SURPLUS_EFFECT,
  SURPLUS_END,
  SURPLUS_END_CEILING,
  SURPLUS_NET,
  SURPLUS_OPEN_ASSETS,
  SURPLUS_PN_OBLIGATION,
  SURPLUS_RATE,
} from "@/lib/study/ias19/lessons/assets";
import { AM_ASSETS, AM_ASSETS_PARTS, AM_EFFECT, AM_YEAR, AMENDED, NOTE, NOTE_ADDED, NOTE_CONTRIBUTION, NOTE_FROM_ASSETS, NOTE_PAYROLL, NOTE_RATE, NOTE_X } from "@/lib/study/ias19/lessons/present";
import { EXAM_B } from "@/lib/learn/ias19-exams";
import { lessonRef, lessonsRef, pct } from "@/lib/study/ias19/shared";
import { FormulaFill } from "./ias19-formula";
import { Bridge, DestTag, ExplainTask, HintLadder, Ladder, MapBranch, RollForward, T19, TwoBuckets } from "./ias19-ui";
import { BeforeAfter, Fork, NetBars, Routing, SplitBar, TwoPanel } from "./ias19-visuals";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { JE, Money, Rule, Stepper } from "./ui";

/** The employee-benefits course, lessons 8–10: an amendment mid-year and settlement, plan assets and the ceiling, presentation and reverse engineering. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const n5 = CTO.retire - CTO.from;

/** Three events that sound alike, and where each lands. */
const EVENTS = (
  <Fork
    label="שלושה אירועים: שיפור תנאים יוצר שירות עבר לרווח והפסד; הסכם לסגור את החוב הוא סילוק לרווח והפסד; פרישה לפי התנאים, מוקדם מהצפוי, היא P.N. ל-OCI"
    question="מה קרה באמצע השנה?"
    branches={[
      { when: "התנאים השתפרו", then: "שירות עבר על השנים שעברו", to: "pl" },
      { when: "״ניתן לך סכום ונסגור עניין״", then: "סילוק: עסקה חדשה", to: "pl" },
      { when: "עזב לפי התנאים, מוקדם", then: "טעות באומדן: P.N.", to: "oci" },
    ]}
  />
);

/** The technology manager's year, cut at the amendment: each half with its terms, its rate and its years to payment. */
const SPLIT_YEAR = (
  <SplitBar
    title={`השנה של מנהל הטכנולוגיה, ${CTO.from + 1}: חתוכה ב-1.7`}
    periods={[
      { months: 6, label: `תנאים ישנים: ${CTO.oldPerYear.toLocaleString("he-IL")} ₪ לשנה`, rate: pct(CTO.rateEnd2023), n: `${n5 - 0.5} שנים מ-30.6`, tone: 1 },
      { months: 6, label: `תנאים חדשים: ${CTO.newPerYear.toLocaleString("he-IL")} ₪ לשנה`, rate: pct(CTO.rateAmend), n: `${n5 - 1} שנים מ-31.12`, tone: 4 },
    ]}
    cuts={[`1.1.${CTO.from + 1}`, "1.7: התיקון", `31.12.${CTO.from + 1}`]}
  />
);

/** Settlement against an unexpected retirement: one question decides. */
const SETTLE_FORK = (
  <Fork
    label="האם התשלום לפי תנאי התוכנית? לא: סילוק, ההפרש לרווח והפסד. כן, רק מוקדם: P.N., ההפרש ל-OCI"
    question="התשלום לפי תנאי התוכנית?"
    branches={[
      { when: "לא: הסכם חדש", then: "סילוק. יתרה פחות תשלום", to: "pl" },
      { when: "כן, רק מוקדם מהצפוי", then: "טעות באומדן. P.N.", to: "oci" },
    ]}
  />
);

/** Where each line of the year goes, without numbers. */
const ROUTES = (
  <Routing
    label="עלות שירות, שירות עבר, סילוק וריבית נטו לרווח והפסד; P.N. של החוב, של הקופה והשפעת התקרה ל-OCI; ההתחייבות נטו למאזן"
    title="לאן הולכת כל שורה"
    rows={[
      { label: "עלות שירות שוטף ושירות עבר", to: "pl" },
      { label: "רווח או הפסד מסילוק", to: "pl" },
      { label: "ריבית נטו", to: "pl" },
      { label: "P.N. של החוב", to: "oci" },
      { label: "P.N. של הקופה, והתקרה", to: "oci" },
      { label: "התחייבות נטו (או נכס נטו)", to: "bs" },
    ]}
  />
);

export const IAS19_DB2_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 8: amendment, past service, settlement.
  "emp-amend-hook": {
    lead: "שלושה אירועים שנשמעים דומים, וכל אחד נרשם אחרת.",
    body: (
      <>
        <Story icon={<Briefcase />} title="המענק עולה מ-1 באפריל">
          <p>הבוס מודיע: מ-1 באפריל המענק בפרישה עולה מ-60,000 ל-80,000 ₪ לכל שנת עבודה. התוספת מגיעה רק על העבודה מכאן, או גם על מה שכבר עבדתם?</p>
          <p>ומה אם תגידו ״תן לי 150,000 עכשיו ונסגור עניין״? או שפשוט תעזבו מחר?</p>
        </Story>
        {EVENTS}
        <MapBranch lesson="ias19-amend">ב{lessonRef("ias19-rollforward")} ההנחות היו קבועות כל השנה. כאן נכנס אירוע אחד באמצע השנה, ועליו נשענים {lessonsRef("ias19-assets", "ias19-present")}.</MapBranch>
      </>
    ),
  },
  "emp-amend-split": {
    lead: "שינוי תנאים חותך את השנה לשתיים, ומעדכן גם את העבר.",
    body: (
      <>
        <P>
          <T19 he="שינוי תנאי תוכנית" en="Plan amendment" />: מיום השינוי ההנחות חדשות. לכן חותכים את השנה לשתי תקופות, ולכל אחת התנאים, הריבית וה-n שלה.
        </P>
        {SPLIT_YEAR}
        <P>
          גם העבר מתעדכן לתנאים החדשים. ההפרש הוא <T19 he="עלות שירות עבר" en="Past service cost" par="102–103" />, והוא נרשם מיד לרווח והפסד.
        </P>
        <BeforeAfter
          title="שירות עבר: החוב ביום התיקון, לפני ואחרי"
          before={{ label: "בתנאים הישנים", v: Math.round(CTO_YEAR.pastBefore) }}
          after={{ label: "בתנאים החדשים", v: Math.round(CTO_YEAR.pastAfter) }}
          jump={<>הקפיצה היא שירות עבר: לרווח והפסד, מיד</>}
        />
        <P>
          ריבית על חצי שנה (<span dir="ltr">IAS 19.123</span>): עד השינוי על הפתיחה, ומהשינוי על היתרה המעודכנת. תשלום באמצע השנה מקטין את הריבית מיומו.
        </P>
      </>
    ),
    check: quiz("emp-amend-split", [
      { q: "המענק עולה גם על השנים שעברו. ההפרש על העבר: שירות שוטף או שירות עבר?", options: ["שירות עבר", "שירות שוטף", "P.N.", "סילוק"], answer: 0, why: "תוספת על עבודה שכבר נעשתה = שירות עבר." },
      { q: "באיזו ריבית מחשבים את שני הצדדים של שירות העבר?", options: ["בריבית של יום השינוי", "בריבית של תחילת השנה", "בריבית של סוף השנה", "צד אחד בכל ריבית"], answer: 0, why: "שתי היתרות ביום השינוי." },
    ]),
  },
  "emp-amend-settle": {
    lead: "תשלום מחוץ לתנאים הוא סילוק, לרווח והפסד. לפי התנאים, גם מוקדם, הוא P.N. ב-OCI.",
    body: (
      <>
        <P>
          <T19 he="סילוק" en="Settlement" par="109–111" />: החברה משלמת סכום בהסכם חדש, כדי להיפטר מהחוב לתמיד.
        </P>
        <P>פרישה בלתי צפויה: העובד מקבל בדיוק מה שהתוכנית קובעת, רק מוקדם מהצפוי. זה לא סילוק, אלא טעות באומדן.</P>
        {SETTLE_FORK}
      </>
    ),
    check: quiz("emp-amend-settle", [
      { q: "החברה משלמת 92,000 ₪ לביטול חוב שבספרים 96,500. מה הרישום?", options: ["רווח מסילוק 4,500 ברווח והפסד", "P.N. רווח 4,500 ב-OCI", "שירות עבר שלילי", "אין רישום"], answer: 0, why: "תשלום מחוץ לתנאים = סילוק." },
      { q: "עובד פורש לפי התנאים, מוקדם מהצפוי. סילוק או P.N.?", options: ["P.N. ב-OCI", "סילוק"], answer: 0, why: "תשלום לפי התנאים אינו סילוק." },
    ]),
  },
  "emp-amend-rule": {
    lead: "שנה חתוכה: ארבעה צעדים, תמיד באותו סדר.",
    body: (
      <>
        <Ladder
          steps={[
            { q: "שירות שוטף, לכל תקופה:", yes: "הריבית של תחילת התקופה, n עד סוף התקופה, רק חודשי התקופה." },
            { q: "שירות עבר, ביום השינוי:", yes: "החוב אחרי פחות החוב לפני, באותה ריבית ובאותו n." },
            { q: "ריבית, לכל תקופה:", yes: "עד השינוי על הפתיחה; אחריו על היתרה אחרי שירות העבר." },
            { q: "סגירה, ו-P.N.:", yes: "הסגירה בריבית סוף השנה; P.N. מאזן." },
          ]}
        />
        {SPLIT_YEAR}
        <Rule>וסילוק: יתרה פחות תשלום, לרווח והפסד. תשלום לפי התנאים: P.N. ב-OCI.</Rule>
      </>
    ),
    check: quiz("emp-amend-rule", [{ q: "אחרי התיקון, על איזו יתרה הריבית?", options: ["על היתרה אחרי שירות העבר", "על הפתיחה", "על הסגירה", "על שירות העבר בלבד"], answer: 0, why: "מיום התיקון: היתרה המעודכנת." }]),
  },
  "emp-amend-solved": {
    lead: "חותכים, מודדים את שני הצדדים ביום התיקון, וסוגרים במעגל.",
    body: (
      <>
        <Story icon={<Briefcase />} title="מנהל הטכנולוגיה">
          <p>
            התחיל ב-1.1.{CTO.from}. בפרישה ב-31.12.{CTO.retire} יקבל <Money v={CTO.oldPerYear} /> לכל שנת עבודה. הריבית ב-31.12.{CTO.from}: {pct(CTO.rateEnd2023)}.
          </p>
          <p>
            ב-1.7.{CTO.from + 1} המענק עולה ל-<Money v={CTO.newPerYear} /> לשנה, גם על העבר. הריבית יורדת ל-{pct(CTO.rateAmend)}, ונשארת כך עד סוף השנה.
          </p>
        </Story>
        {SPLIT_YEAR}
        <Stepper
          label="שנה חתוכה"
          steps={[
            { title: "פתיחה", body: <p><Money v={CTO.oldPerYear} plain /> × 1 ÷ <L>{1 + CTO.rateEnd2023}^{n5}</L> = <strong><M v={CTO_OPENING} /></strong>.</p> },
            {
              title: "(א) שירות שוטף, שתי תקופות",
              body: (
                <div className="space-y-1.5">
                  <p>עד התיקון: <Money v={CTO.oldPerYear / 2} plain /> ÷ <L>{1 + CTO.rateEnd2023}^{n5 - 0.5}</L> = <M v={CTO_YEAR.serviceBefore} />. מהוון מ-30.6, בריבית של תחילת התקופה.</p>
                  <p>אחרי: <Money v={CTO.newPerYear / 2} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 1}</L> = <M v={CTO_YEAR.serviceAfter} />. סה״כ <strong><M v={CTO_YEAR.service} /></strong>.</p>
                </div>
              ),
            },
            {
              title: "(ב) שירות עבר ב-1.7",
              body: (
                <div className="space-y-1.5">
                  <p>1.5 שנות עבודה. לפני: <Money v={CTO.oldPerYear * 1.5} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 0.5}</L> = <M v={CTO_YEAR.pastBefore} />.</p>
                  <p>אחרי: <Money v={CTO.newPerYear * 1.5} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 0.5}</L> = <M v={CTO_YEAR.pastAfter} />. הפרש: <strong><M v={CTO_YEAR.pastService} /></strong>, לרווח והפסד.</p>
                  <BeforeAfter before={{ label: "לפני התיקון", v: Math.round(CTO_YEAR.pastBefore) }} after={{ label: "אחרי התיקון", v: Math.round(CTO_YEAR.pastAfter) }} jump="שירות עבר" />
                </div>
              ),
            },
            {
              title: "(ג) ריבית, שתי תקופות",
              body: (
                <p>
                  <M v={CTO_OPENING} /> × (<L>{1 + CTO.rateEnd2023}^0.5 − 1</L>) = <M v={CTO_YEAR.interestBefore} />, ועוד <M v={CTO_YEAR.pastAfter} /> × (<L>{1 + CTO.rateAmend}^0.5 − 1</L>) = <M v={CTO_YEAR.interestAfter} />. סה״כ{" "}
                  <strong><M v={CTO_YEAR.interest} /></strong>.
                </p>
              ),
            },
            {
              title: "סגירה, והמעגל",
              body: (
                <RollForward
                  title={`מנהל הטכנולוגיה, ${CTO.from + 1}`}
                  rows={[
                    { label: "יתרת פתיחה", value: CTO_OPENING, kind: "balance", how: `${pct(CTO.rateEnd2023)}, n = ${n5}` },
                    { label: "עלות ריבית", value: CTO_YEAR.interest, how: `חצי שנה ${pct(CTO.rateEnd2023)} על הפתיחה, חצי ${pct(CTO.rateAmend)} על היתרה אחרי התיקון` },
                    { label: "עלות שירות שוטף", value: CTO_YEAR.service, how: `חצי ${pct(CTO.rateEnd2023)} (n = ${n5 - 0.5}), חצי ${pct(CTO.rateAmend)} (n = ${n5 - 1})` },
                    { label: "עלות שירות עבר", value: CTO_YEAR.pastService, how: `${pct(CTO.rateAmend)}, n = ${n5 - 0.5}, ביום התיקון` },
                    { label: "P.N., הפסד", value: CTO_YEAR.pn, kind: "pn", how: "בלי עיגולי ביניים" },
                    { label: "יתרת סגירה", value: CTO_YEAR.closing, kind: "balance", how: `2 × ${CTO.newPerYear.toLocaleString("en-US")}, ${pct(CTO.rateAmend)}, n = ${n5 - 1}` },
                  ]}
                />
              ),
            },
          ]}
        />
      </>
    ),
  },
  "emp-amend-together": {
    lead: "אותה יתרה, שלוש דרכים לצאת ממנה. השאלה תמיד: לפי התנאים, או הסכם חדש?",
    body: (
      <>
        {SETTLE_FORK}
        <Part title="א. סילוק">
          <HintLadder
            task={
              <>
                ב-31.12.{CTO.from + 1} החברה משלמת למנהל <Money v={SETTLE.paid} /> תמורת ביטול החוב שבספרים, <M v={CTO_YEAR.closing} />. מה הרישום?
              </>
            }
            hints={[
              "התשלום לפי תנאי התוכנית, או הסכם חדש?",
              "הסכם מחוץ לתנאים: סילוק. יתרה פחות תשלום, לרווח והפסד.",
              <>
                <M v={CTO_YEAR.closing} /> − <Money v={SETTLE.paid} /> = <M v={SETTLE_GAIN} />
              </>,
              <JE
                key="je"
                entry={{
                  id: "1",
                  text: "סילוק",
                  lines: [
                    { account: "התחייבות בשל הטבה מוגדרת", dr: Math.round(CTO_YEAR.closing) },
                    { account: "מזומן", cr: SETTLE.paid },
                    { account: "רווח מסילוק", cr: Math.round(CTO_YEAR.closing) - SETTLE.paid },
                  ],
                }}
              />,
            ]}
          />
        </Part>
        <Part title="ב. פרישה בלתי צפויה">
          <HintLadder
            task={
              <>
                במקום זאת: המנהל פורש במפתיע ב-{RETIRE.date}, וזכאי לפי התנאים ל-{RETIRE.years} × <Money v={CTO.newPerYear} plain /> = <Money v={RETIRE_PAID} />. איך נרשם ההפרש מול היתרה?
              </>
            }
            hints={["התשלום חורג מתנאי התוכנית?", "לא. זו פרישה לפי התנאים, ולכן אין סילוק.", <>ההפרש: <Money v={RETIRE_PAID} plain /> − <M v={CTO_YEAR.closing} /></>, <><strong><M v={RETIRE_PN} /></strong> הפסד: P.N. ב-OCI.</>]}
          />
        </Part>
        <Part title="ג. ביטול תוכנית קטנה">
          <HintLadder
            task={
              <>
                חברה משלמת לעובד <Money v={SMALL.paid} /> תמורת ביטול התוכנית, והיתרה בספרים <Money v={SMALL.books} />. מה הרישום? ומה היה משתנה אילו העובד פשוט התפטר?
              </>
            }
            hints={["הביטול לפי תנאי התוכנית?", "לא. זו עסקה שמבטלת את החוב: סילוק.", <>הפסד: <Money v={SMALL.paid} plain /> − <Money v={SMALL.books} plain /></>, <><strong><Money v={SMALL_LOSS} /></strong> הפסד מסילוק, לרווח והפסד. אילו התפטר ויצא לפי התנאים: פרישה בלתי צפויה, P.N. ב-OCI.</>]}
          />
        </Part>
      </>
    ),
  },
  "emp-amend-master": {
    lead: "שינוי תנאים יוצר שירות עבר. תשלום מחוץ לתנאים: סילוק. לפי התנאים: P.N.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר, בשלושה משפטים, מה ההבדל בין סילוק לפרישה בלתי צפויה."
          model={
            <>
              בשניהם החוב יוצא מהספרים. בסילוק החברה עושה עסקה חדשה, מחוץ לתנאים, וההפרש הוא רווח או הפסד מהעסקה, ברווח והפסד. בפרישה בלתי צפויה העובד מקבל בדיוק מה שהתוכנית קובעת, רק מוקדם; ההפרש הוא טעות באומדן, ב-OCI.
              <span className="mt-2 block">{SETTLE_FORK}</span>
            </>
          }
        />
        <Bridge summary="שינוי תנאים חותך את השנה ויוצר שירות עבר. תשלום מחוץ לתנאים הוא סילוק; לפי התנאים, P.N.">
          ומה אם החברה הפקידה כסף בקופה נפרדת שתשלם את ההטבה? איך זה משפיע על החוב ועל הריבית? {lessonRef("ias19-assets")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-amend-master", [
      { q: "המענק עולה ל-7.5% גם על השנים שעברו. ההפרש על העבר?", options: ["שירות עבר", "שירות שוטף", "P.N.", "סילוק"], answer: 0, why: "תוספת על עבודה שכבר נעשתה." },
      { q: "שני הצדדים של שירות העבר: באיזו ריבית?", options: ["של יום השינוי", "של תחילת השנה", "של סוף השנה", "כל צד בשלו"], answer: 0, why: "באותה ריבית ובאותו n." },
      { q: "החברה משלמת 64,000 והחוב בספרים 70,500. מה הרישום?", options: ["רווח מסילוק 6,500 ברווח והפסד", "P.N. רווח 6,500", "הפסד 6,500", "אין"], answer: 0, why: "סילוק: יתרה פחות תשלום." },
      { q: "עובד פורש לפי התנאים, מוקדם מהצפוי. סילוק או P.N.?", options: ["P.N. ב-OCI", "סילוק ברווח והפסד"], answer: 0, why: "לפי התנאים: לא סילוק." },
      { q: "תשלום של 18,000 ₪ באוגוסט: משפיע על הריבית?", options: ["כן, מקטין אותה מיומו", "לא", "מגדיל אותה", "רק בשנה הבאה"], answer: 0, why: "החוב קטן מיום התשלום." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 9: plan assets and the ceiling.
  "emp-assets-hook": {
    lead: "המצב האמיתי הוא חוב פחות קופה. אבל רק אם הקופה באמת שלכם.",
    body: (
      <>
        <Story icon={<Wallet />} title="חוב, וקופה בצד">
          <p>אתם חייבים 15,000 ₪, ושמתם בצד קופה של 4,200 ₪ רק בשביל החוב הזה. המצב האמיתי: חוב נטו של 10,800.</p>
          <NetBars obligation={15_000} assets={4_200} title="חוב, קופה, ומה שנשאר" />
          <p>ומה אם בקופה יש יותר מהחוב, אבל היא נעולה אצל נאמן שמחליט אם להחזיר לכם? העודף באמת שלכם?</p>
        </Story>
        <MapBranch lesson="ias19-assets">{lessonsRef("ias19-measure", "ias19-amend")} מדדו רק את החוב. כאן מוסיפים את הצד השני, הקופה. ובשיעור הבא מציגים את הכול בדוחות.</MapBranch>
      </>
    ),
  },
  "emp-assets-what": {
    lead: "הקופה מקטינה את החוב. ויש לה מעגל משלה, עם ריבית באותו שיעור כמו החוב.",
    body: (
      <>
        <P>
          <T19 he="נכסי תכנית" en="Plan assets" par="8, 113" /> הם כסף בקופה נפרדת מהחברה. הם נועדו רק לתשלום לעובדים, ונושי החברה לא יכולים לגעת בהם.
        </P>
        <P>
          לכן מורידים אותם מהחוב: <strong>התחייבות נטו = החוב פחות שווי הקופה</strong>.
        </P>
        <DataTable
          head={["שורה במעגל הקופה", "איך"]}
          rows={[
            ["הכנסות ריבית", "באותה ריבית של החוב, ובאותו פיצול תקופות (סעיף 125). הפקדה באמצע שנה: ריבית מיומה"],
            ["הפקדות", "מה שהחברה העבירה לקופה"],
            ["הטבות ששולמו מהקופה", "רק מה שיצא מהקופה, לא מה שהחברה שילמה מהכיס שלה"],
            ["P.N.", "התשואה בפועל מעבר להכנסות הריבית (סעיף 127): ל-OCI"],
          ]}
        />
        <SplitBar
          title="הפקדה ב-1.4: מרוויחה ריבית רק תשעה חודשים"
          periods={[
            { months: 3, label: "לפני ההפקדה", tone: 0 },
            { months: 9, label: "ההפקדה בקופה: מרוויחה ריבית", rate: pct(PLAN.rate), tone: 1 },
          ]}
          cuts={["1.1", "1.4: הפקדה", "31.12"]}
        />
        <Deeper title="הערה: כשהריבית השתנתה באמצע השנה">
          <p>
            הכלל (<span dir="ltr">IAS 19.125</span>): הריבית על הפתיחה ועל הפקדה באמצע שנה, באותה ריבית ובאותו פיצול כמו החוב.
          </p>
          <p>
            דוגמה: בפתיחה <Money v={SPLIT.opening} />, ריבית {pct(SPLIT.periods[0].i)} עד 30.6 ו-{pct(SPLIT.periods[1].i)} מ-1.7, והפקדה של <Money v={SPLIT.contribution} /> ב-1.7.
          </p>
          <p>
            הכנסות הריבית לפי הכלל: <strong>{SPLIT_INTEREST.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>.
          </p>
          <p>
            יש מרצים שמחשבים את הפתיחה בשיעור הראשון לשנה שלמה ({SPLIT_OTHER.toLocaleString("en-US", { maximumFractionDigits: 2 })}). כאן מלמדים את הכלל; בררו מה מקובל אצל המרצה שלכם.
          </p>
        </Deeper>
      </>
    ),
    check: quiz("emp-assets-what", [
      { q: "חוב 24,000 וקופה 9,500. מה ההתחייבות נטו?", options: ["14,500", "33,500", "24,000", "9,500"], answer: 0, why: "24,000 − 9,500." },
      { q: "באיזו ריבית מחשבים הכנסות ריבית על הקופה?", options: ["באותה ריבית של החוב", "בתשואה בפועל", "בריבית הממשלתית", "בלי ריבית"], answer: 0, why: "IAS 19.125." },
    ]),
  },
  "emp-assets-ceiling": {
    lead: "עודף בקופה מוצג רק עד מה שהחברה באמת יכולה להשתמש בו: התקרה.",
    body: (
      <>
        <P>
          <T19 he="תקרת נכס" en="Asset ceiling" par="64" />: כשבקופה יותר מהחוב, מציגים את העודף רק עד מה שהחברה יכולה ליהנות ממנו.
        </P>
        <P>
          ליהנות פירושו: לקבל החזר מהקופה, או להפקיד פחות בעתיד (<span dir="ltr">IFRIC 14</span>). מה שמעבר לזה ״נשרף״, ב-OCI.
        </P>
        <NetBars obligation={SURPLUS.obligation} assets={SURPLUS.assets} ceiling={SURPLUS_CEILING} title="עודף, ותקרה" />
        <Remember>כסף שנעול אצל נאמן, שמחזיר רק לפי שיקול דעתו, הוא לא עודף של החברה. התקרה: אפס.</Remember>
      </>
    ),
    check: quiz("emp-assets-ceiling", [
      { q: "קופה 45,000, חוב 40,000, תקרה 1,500. מה הנכס נטו?", options: ["1,500", "5,000", "45,000", "0"], answer: 0, why: "הנמוך מבין 5,000 ל-1,500." },
      { q: "התקרה: מה היא עושה לחוב?", options: ["כלום; היא מגבילה רק את הנכס", "מקטינה", "מגדילה", "מבטלת"], answer: 0, why: "היא פועלת בצד הקופה." },
    ]),
  },
  "emp-assets-rule": {
    lead: "שני מעגלים, נטו ביניהם, ותקרה על עודף.",
    body: (
      <>
        <Ladder
          steps={[
            { q: "נטו:", yes: "החוב פחות הקופה." },
            { q: "מעגל הקופה:", yes: "פתיחה + ריבית + הפקדות − תשלומים מהקופה + P.N. = סגירה. ריבית כמו בחוב; הפקדה באמצע שנה מקבלת ריבית חלקית." },
            { q: "תשלומים:", yes: "מהחוב מורידים את כל מה ששולם; מהקופה רק מה שיצא ממנה." },
            { q: "בקופה יותר מהחוב?", yes: "נכס נטו = הנמוך מבין העודף לתקרה." },
          ]}
        />
      </>
    ),
    check: quiz("emp-assets-rule", [{ q: "שולמו לעובדים 180,000, מהם 45,000 מהקופה. כמה מורידים מהקופה?", options: ["45,000", "180,000", "135,000", "0"], answer: 0, why: "רק מה שיצא מהקופה." }]),
  },
  "emp-assets-solved": {
    lead: "שני מעגלים זה ליד זה, הנטו ביניהם, ותוצאת השנה בשלוש קופסאות.",
    body: (
      <>
        <Story icon={<Inbox />} title="מענק עם קופה">
          <p>
            מענק של <Money v={PLAN.grant} />, שנצבר שווה בשווה על {PLAN.years} שנות עבודה: <Money v={PLAN_PER_YEAR} /> לשנה. העובד עבד שנה אחת עד 31.12.2023, והתשלום בעוד {PLAN.n} שנים מאז.
          </p>
          <p>
            ריבית {pct(PLAN.rate)}, בלי שינוי בהנחות. בקופה: <Money v={PLAN.assets.opening} /> ב-31.12.2023, הפקדה של <Money v={PLAN.assets.contribution} /> ב-1.4.2024, ושווי <Money v={PLAN.assets.closing} /> בסוף 2024.
          </p>
        </Story>
        <div className="grid gap-3 lg:grid-cols-2">
          <RollForward
            title="החוב, 2024"
            rows={[
              { label: "יתרת פתיחה", value: PLAN_OPENING, kind: "balance", how: `${pct(PLAN.rate)}, n = ${PLAN.n}` },
              { label: "עלות ריבית", value: PLAN_YEAR.interest, how: `${pct(PLAN.rate)} × הפתיחה` },
              { label: "עלות שירות", value: PLAN_YEAR.service, how: `n = ${PLAN.n - 1}` },
              { label: "P.N.", value: PLAN_YEAR.pn, kind: "pn", how: "אין שינוי בהנחות" },
              { label: "יתרת סגירה", value: PLAN_YEAR.closing, kind: "balance", how: `2 שנים, n = ${PLAN.n - 1}` },
            ]}
          />
          <RollForward
            side="debit"
            title="הקופה, 2024"
            rows={[
              { label: "יתרת פתיחה", value: PLAN.assets.opening, kind: "balance" },
              { label: "הכנסות ריבית", value: PLAN_ASSETS.interest, how: `${pct(PLAN.rate)} על הפתיחה, ועל ההפקדה 9 חודשים` },
              { label: "הפקדות", value: PLAN.assets.contribution },
              { label: "P.N., רווח", value: PLAN_ASSETS.pn, kind: "pn", how: "תשואה מעבר להכנסות הריבית" },
              { label: "שווי בסגירה", value: PLAN.assets.closing, kind: "balance" },
            ]}
          />
        </div>
        <NetBars obligation={Math.round(PLAN_YEAR.closing)} assets={PLAN.assets.closing} title="31.12.2024: החוב מול הקופה" />
        <Routing
          label="השפעת 2024: עלות שירות וריבית נטו לרווח והפסד; P.N. ל-OCI; ההתחייבות נטו למאזן"
          title="השפעת 2024 (בסוגריים: הוצאה או הפסד)"
          rows={[
            { label: "עלות שירות", value: Math.round(PLAN_EFFECT.salary), to: "pl" },
            { label: "ריבית נטו (עלות פחות הכנסה)", value: Math.round(PLAN_EFFECT.netInterest), to: "pl" },
            { label: "P.N. של הקופה", value: Math.round(PLAN_EFFECT.oci), to: "oci" },
            { label: "התחייבות נטו, 31.12.2024", value: Math.round(PLAN_EFFECT.net), to: "bs" },
          ]}
        />
        <p className="text-[14px] text-muted">
          סך הרווח הכולל: <M v={PLAN_EFFECT.total} />. התחייבות נטו בפתיחה: <M v={PLAN_OPENING} /> − <Money v={PLAN.assets.opening} plain /> = <M v={PLAN_OPENING - PLAN.assets.opening} />.
        </p>
      </>
    ),
  },
  "emp-assets-together": {
    lead: "כשיש עודף, בודקים תקרה בכל תאריך. ואת הריבית משחזרים מהחוב.",
    body: (
      <Part title="עודף, ותקרה של 5% מהחוב">
        <div className="grid gap-3 lg:grid-cols-2">
          <NetBars obligation={SURPLUS.obligation} assets={SURPLUS.assets} ceiling={SURPLUS_CEILING} title="31.12.2023" />
          <NetBars obligation={SURPLUS.closingObligation} assets={SURPLUS.closingAssets} ceiling={SURPLUS_END_CEILING} title="31.12.2024" />
        </div>
        <HintLadder
          task={
            <>
              ב-31.12.2023: קופה <Money v={SURPLUS.assets} />, חוב <Money v={SURPLUS.obligation} />; התקרה {pct(SURPLUS.ceilingShare)} מהחוב. ב-2024: עלות ריבית <Money v={SURPLUS.interestCost} />, שירות{" "}
              <Money v={SURPLUS.service} />, חוב בסגירה <Money v={SURPLUS.closingObligation} />, וקופה בסגירה <Money v={SURPLUS.closingAssets} />. מה הנכס נטו בשני התאריכים, ומה ה-OCI של 2024?
            </>
          }
          hints={[
            "כל העודף של 2023 הוא נכס של החברה?",
            "הכלל: נכס נטו = הנמוך מבין העודף לתקרה. והריבית משוחזרת מהחוב: ריבית ÷ פתיחה.",
            <>
              2023: עודף <Money v={SURPLUS.assets - SURPLUS.obligation} plain />, תקרה <Money v={SURPLUS_CEILING} plain />: נכס נטו <Money v={SURPLUS_NET} />; הקופה מוכרת ב-<Money v={SURPLUS_OPEN_ASSETS} />. ריבית: <Money v={SURPLUS.interestCost} plain /> ÷{" "}
              <Money v={SURPLUS.obligation} plain /> = {pct(SURPLUS_RATE)}.
            </>,
            <span key="s" className="block space-y-1">
              <span className="block">
                קופה: ריבית <Money v={SURPLUS_A.interest} />; P.N. = <Money v={SURPLUS.closingAssets} plain /> − <Money v={SURPLUS_OPEN_ASSETS} plain /> − <Money v={SURPLUS_A.interest} plain /> = <Money v={SURPLUS_A.pn} /> רווח.
              </span>
              <span className="block">
                חוב: P.N. = <Money v={SURPLUS.closingObligation} plain /> − <Money v={SURPLUS.obligation} plain /> − <Money v={SURPLUS.interestCost} plain /> − <Money v={SURPLUS.service} plain /> = <Money v={SURPLUS_PN_OBLIGATION} /> הפסד.
              </span>
              <span className="block">
                2024: עודף <Money v={SURPLUS.closingAssets - SURPLUS.closingObligation} plain /> מול תקרה <Money v={SURPLUS_END_CEILING} plain />: מכירים ב-<Money v={SURPLUS_END} />. השפעה: שירות <Money v={SURPLUS_EFFECT.salary} />, ריבית נטו{" "}
                <Money v={SURPLUS_EFFECT.netInterest} />, OCI <strong><Money v={SURPLUS_EFFECT.oci} /></strong>.
              </span>
            </span>,
          ]}
        />
      </Part>
    ),
  },
  "emp-assets-master": {
    lead: "שני מעגלים, חוב וקופה. הפער ביניהם הוא נטו, ותקרה חוסמת עודף.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר: קופה 52,000 ₪, חוב 46,000 ₪, תקרה 2,300 ₪. למה מציגים נכס של 2,300 ולא של 6,000?"
          model={
            <>
              העודף של 6,000 שווה לחברה רק אם היא יכולה להשתמש בו: לקבל אותו בחזרה או להפקיד פחות. לפי הנתונים, מה שהיא יכולה להשתמש בו שווה 2,300 בלבד, ולכן רק זה נכס. השאר נעול בקופה לטובת העובדים.
              <span className="mt-2 block">
                <NetBars obligation={46_000} assets={52_000} ceiling={2_300} />
              </span>
            </>
          }
        />
        <Bridge summary="שני מעגלים (חוב וקופה), הפער ביניהם הוא נטו, ותקרה חוסמת עודף.">יש לנו כל מה שצריך לחשב. איך מציגים את התוצאות בדוחות, ואיך מחלצים שיעורים מביאור? {lessonRef("ias19-present")}.</Bridge>
      </>
    ),
    check: quiz("emp-assets-master", [
      { q: "חוב 18,000, קופה 7,200. מה ההתחייבות נטו?", options: ["10,800", "25,200", "7,200", "18,000"], answer: 0, why: "IAS 19.113." },
      { q: "קופה נעולה: 540, חוב 470, ואין החזר או הקטנת הפקדות. מה הנכס נטו?", options: ["0, והפער הוא הפסד ב-OCI", "70", "540", "470"], answer: 0, why: "התקרה אפס." },
      { q: "הופקדו 1,200 ב-1.7, ריבית 5%. הכנסות ריבית על ההפקדה?", options: ["כ-30: 1,200 × (1.05^0.5 − 1)", "60", "0", "120"], answer: 0, why: "חצי שנה, ריבית דריבית." },
      { q: "באיזו ריבית: הכנסות ריבית על הקופה?", options: ["של החוב", "התשואה בפועל"], answer: 0, why: "IAS 19.125." },
      { q: "הטבות ששולמו 240,000, מהן 66,000 מהקופה. כמה מורידים מהקופה?", options: ["66,000", "240,000"], answer: 0, why: "רק מה שיצא מהקופה." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 10: presentation and reverse engineering.
  "emp-present-hook": {
    lead: "כל שורה הולכת לקופסה אחת, ואסור לערבב.",
    body: (
      <>
        <Story icon={<Inbox />} title="כל שורה לקופסה שלה">
          <p>דף הבנק של החודש: ריבית, החזר הלוואה, ותיקון של טעות. בבית כל שורה נכנסת לקופסה אחרת. אם מערבבים, התקציב לא מסתדר.</p>
          <p>בדוחות זה אותו דבר: שורה אחת לרווח והפסד, אחת ל-OCI, ואחת רק למאזן.</p>
        </Story>
        <MapBranch lesson="ias19-present">הצעד האחרון בהטבה המוגדרת: מחברים את המעגלים של {lessonsRef("ias19-measure", "ias19-assets")} לדוחות. ואחר כך הופכים כיוון: מביאור של שנה קודמת חושפים הנחות.</MapBranch>
        <TwoBuckets pl={["עלות העבודה של השנה", "ריבית נטו"]} oci={["P.N. של החוב", "P.N. של הקופה", "השפעת התקרה"]} />
      </>
    ),
  },
  "emp-present-three": {
    lead: "שירות, שירות עבר, סילוק וריבית נטו: רווח והפסד. מדידות מחדש: OCI. היתרה נטו: מאזן.",
    body: (
      <>
        {ROUTES}
        <DataTable
          head={["שורה", "לאן", "הערה"]}
          rows={[
            ["עלות שירות שוטף, שירות עבר, סילוק", <DestTag key="a" to="pl" />, "בשכר של המחלקה: ייצור בעלות המכר; מכירות במכירה ושיווק; הנהלה בהנהלה וכלליות"],
            [<T19 key="b" he="ריבית נטו" en="Net interest" par="123" />, <DestTag key="b2" to="pl" />, "הכנסות ריבית על הקופה פחות עלות ריבית: במימון או בשכר, לפי המדיניות"],
            [<T19 key="c" he="מדידה מחדש" en="Remeasurement" par="120, 122" />, <DestTag key="c2" to="oci" />, "P.N. של החוב, P.N. של הקופה, השפעת התקרה. לא חוזרת לרווח והפסד"],
            ["התחייבות נטו או נכס נטו", <DestTag key="d" to="bs" />, "שורה אחת"],
          ]}
        />
        <P>וקרן ההון (ה-OCI המצטבר)? היא נצברת מכל השנים, ולכן מנתוני שנה אחת אי אפשר לחשב אותה.</P>
      </>
    ),
    check: quiz("emp-present-three", [
      { q: "לאן הולכת עלות שירות עבר?", options: ["רווח והפסד, ביחד עם השכר", "OCI", "מאזן", "קרן הון"], answer: 0, why: "כמו השירות השוטף." },
      { q: "הכנסות ריבית 3,150 ועלות ריבית 2,900. מה מוצג?", options: ["הכנסות ריבית נטו 250", "3,150 הכנסה ו-2,900 הוצאה", "2,900 הוצאה", "6,050"], answer: 0, why: "נטו." },
    ]),
  },
  "emp-present-reverse": {
    lead: "ביאור של שנה קודמת הוא מעגל מלא. מתוכו מחלצים את מה שהשאלה לא אמרה.",
    body: (
      <>
        <P>כשהשאלה נותנת ביאור של השנה הקודמת, היא נותנת מעגל שלם. ממנו מחלצים את ההנחות:</P>
        <FormulaFill
          label="שיעור ההיוון מתוך הביאור: עלות הריבית חלקי יתרת הפתיחה"
          lhs="ריבית ההיוון"
          terms={{
            int: { c: 0, sym: "עלות ריבית", from: "שורת הריבית בביאור", why: "כמה ריבית נרשמה על החוב השנה." },
            open: { c: 0, sym: "יתרת פתיחה", from: "שורת הפתיחה בביאור", why: "על מה חושבה הריבית." },
          }}
          top={[{ t: "int" }]}
          bottom={[{ t: "open" }]}
          working={["מותר רק כשלא היו תשלומים או שינוי באמצע השנה. ובלי לעגל."]}
          stepwise={false}
        />
        <DataTable
          head={["מה מחלצים", "איך", "מתי מותר"]}
          rows={[
            ["ריבית ההיוון", "עלות ריבית ÷ יתרת פתיחה", "רק בלי תשלומים או שינוי באמצע השנה, ובלי לעגל"],
            ["החלק של הקופה בתשלומים", "הטבות ששולמו מהקופה ÷ כל ההטבות ששולמו", "תמיד"],
            ["שיעור ההפקדה", "ההפקדה ÷ השכר של כל מי שעבד ביום ההפקדה", "כולל מי שעזב אחר כך"],
            ["תוספת להטבה", "שירות עבר ÷ החוב לפני התיקון", "באותו יום ובאותה ריבית"],
          ]}
        />
        <Remember>שיעור שמשוחזר מביאור לא מעגלים. יצא 4.4987%? משתמשים ב-4.4987%, לא ב-4.5%.</Remember>
      </>
    ),
    check: quiz("emp-present-reverse", [
      { q: "עלות ריבית 2,035 על פתיחה 47,320. ומתי מותר לחלץ כך?", options: ["4.3005%, כשאין תשלומים או שינוי באמצע השנה", "4.3%, תמיד", "4.3005%, תמיד", "אי אפשר לחלץ"], answer: 0, why: "החילוץ הפשוט נכון רק בשנה ״נקייה״, ובלי לעגל." },
    ]),
  },
  "emp-present-rule": {
    lead: "שכר לפי מחלקה. ריבית נטו לפי מדיניות. מדידות מחדש ל-OCI. יתרות למאזן, נטו.",
    body: (
      <>
        {ROUTES}
        <Rule>
          השכר לפי המחלקה של העובד. הריבית הנטו במימון או בשכר, לפי המדיניות. OCI בשורה נטו אחת. והנדסה לאחור: ריבית ÷ פתיחה, רק בשנה בלי תשלומים או שינוי באמצע.
        </Rule>
      </>
    ),
    check: quiz("emp-present-rule", [{ q: "P.N. קופה 940 רווח ו-P.N. חוב 1,310 הפסד. מה ב-OCI?", options: ["הפסד נטו 370", "רווח 940 והפסד 1,310, בנפרד", "הפסד 1,310", "רווח 940"], answer: 0, why: "OCI בשורה נטו אחת." }]),
  },
  "emp-present-solved": {
    lead: "תיקון באמצע השנה, וגם הריבית על הקופה מפוצלת באותן תקופות. ואז כל שורה לקופסה שלה.",
    body: (
      <>
        <Story icon={<Inbox />} title={`המענק עם הקופה, מ${lessonRef("ias19-assets")}, עם תיקון`}>
          <p>
            ב-1.7.2024 המענק עולה מ-<Money v={PLAN_PER_YEAR} /> ל-<Money v={AMENDED.newPerYear} /> לשנה, גם על העבר. הריבית יורדת מ-{pct(PLAN.rate)} ל-{pct(AMENDED.rateAfter)} ביום התיקון, ובסוף השנה היא{" "}
            {pct(AMENDED.rateEnd)}.
          </p>
          <p>
            הקופה כמו קודם: <Money v={PLAN.assets.opening} /> בפתיחה, <Money v={PLAN.assets.contribution} /> ב-1.4, <Money v={PLAN.assets.closing} /> בסוף.
          </p>
        </Story>
        <SplitBar
          title="השנה, חתוכה ב-1.7: אותו פיצול לחוב ולקופה"
          periods={[
            { months: 6, label: "עד התיקון", rate: pct(PLAN.rate), tone: 1 },
            { months: 6, label: "אחרי התיקון", rate: pct(AMENDED.rateAfter), tone: 4 },
          ]}
          cuts={["1.1", "1.4: הפקדה · 1.7: תיקון", "31.12"]}
        />
        <Stepper
          label="תיקון והצגה"
          steps={[
            {
              title: "החוב",
              body: (
                <RollForward
                  title="החוב, 2024"
                  rows={[
                    { label: "יתרת פתיחה", value: PLAN_OPENING, kind: "balance" },
                    { label: "עלות ריבית", value: AM_YEAR.interest, how: `${Math.round(AM_YEAR.interestBefore)} (חצי שנה, ${pct(PLAN.rate)}) + ${Math.round(AM_YEAR.interestAfter)} (חצי שנה, ${pct(AMENDED.rateAfter)}, על היתרה אחרי התיקון)` },
                    { label: "עלות שירות שוטף", value: AM_YEAR.service, how: `${Math.round(AM_YEAR.serviceBefore)} (n = ${PLAN.n - 0.5}) + ${Math.round(AM_YEAR.serviceAfter)} (n = ${PLAN.n - 1})` },
                    { label: "עלות שירות עבר", value: AM_YEAR.pastService, how: `${Math.round(AM_YEAR.pastAfter)} − ${Math.round(AM_YEAR.pastBefore)}, ${pct(AMENDED.rateAfter)}, n = ${PLAN.n - 0.5}` },
                    { label: "P.N., הפסד", value: AM_YEAR.pn, kind: "pn" },
                    { label: "יתרת סגירה", value: AM_YEAR.closing, kind: "balance", how: `2 × ${AMENDED.newPerYear.toLocaleString("en-US")}, ${pct(AMENDED.rateEnd)}, n = ${PLAN.n - 1}` },
                  ]}
                />
              ),
            },
            {
              title: "הקופה, באותו פיצול",
              body: (
                <RollForward
                  side="debit"
                  title="הקופה, 2024"
                  rows={[
                    { label: "יתרת פתיחה", value: PLAN.assets.opening, kind: "balance" },
                    { label: "הכנסות ריבית", value: AM_ASSETS.interest, how: `${AM_ASSETS_PARTS.parts[0].toFixed(0)} עד 30.6 (${pct(PLAN.rate)}, כולל ההפקדה לרבעון) + ${AM_ASSETS_PARTS.parts[1].toFixed(0)} מ-1.7 (${pct(AMENDED.rateAfter)})` },
                    { label: "הפקדות", value: PLAN.assets.contribution },
                    { label: "P.N., רווח", value: AM_ASSETS.pn, kind: "pn" },
                    { label: "שווי בסגירה", value: PLAN.assets.closing, kind: "balance" },
                  ]}
                />
              ),
            },
            {
              title: "הדוחות",
              body: (
                <div className="space-y-2">
                  <Routing
                    label="שכר וריבית נטו לרווח והפסד; מדידה מחדש נטו ל-OCI; התחייבות נטו למאזן"
                    rows={[
                      { label: "שכר: שירות שוטף + שירות עבר", value: Math.round(AM_EFFECT.salary), to: "pl" },
                      { label: "ריבית נטו", value: Math.round(AM_EFFECT.netInterest), to: "pl" },
                      { label: "מדידה מחדש נטו", value: Math.round(AM_EFFECT.oci), to: "oci" },
                      { label: "התחייבות נטו", value: Math.round(AM_EFFECT.net), to: "bs" },
                    ]}
                  />
                  <p className="text-[13.5px] text-muted">בסוגריים: הוצאה או הפסד. את קרן ההון אי אפשר לחשב: אין נתונים על השנים הקודמות.</p>
                </div>
              ),
            },
          ]}
        />
      </>
    ),
  },
  "emp-present-together": {
    lead: "המדיניות קובעת רק באיזו שורה, לא את הסך. וביאור של שנה קודמת מגלה מה השאלה לא אמרה.",
    body: (
      <>
        <Part title="א. מדיניות אחרת">
          <TwoPanel
            label="שתי מדיניויות: ריבית נטו במימון או ריבית נטו בשכר. הסך ברווח והפסד זהה"
            panels={[
              { title: "ריבית נטו במימון", steps: [<>שכר <Money key="s" v={Math.round(AM_EFFECT.salary)} plain /></>, <>מימון <Money key="m" v={Math.round(AM_EFFECT.netInterest)} plain /></>], verdict: <>רווח והפסד: <Money v={Math.round(AM_EFFECT.pl)} plain /></>, tone: 1 },
              { title: "ריבית נטו בשכר", steps: [<>שכר <Money key="s" v={Math.round(AM_EFFECT.pl)} plain /></>, "מימון 0"], verdict: <>רווח והפסד: <Money v={Math.round(AM_EFFECT.pl)} plain /></>, tone: 4 },
            ]}
          />
          <HintLadder
            task="אותה שנה, אבל החברה מציגה את הריבית הנטו בהוצאות השכר. מה משתנה?"
            hints={["המדיניות משנה את הסכומים, או רק את השורה?", "רק את השורה. הסך ברווח והפסד זהה.", <>שכר: <Money v={-AM_EFFECT.salary} plain /> + <Money v={-AM_EFFECT.netInterest} plain /></>, <>= <M v={-AM_EFFECT.pl} /> בשכר, ובמימון אפס.</>]}
          />
        </Part>
        <Part title="ב. ביאור של שנה קודמת (אלפי ₪)">
          <p className="text-[14.5px]">
            רשת מלונות, הביאור לשנה שעברה: יתרת פתיחה {NOTE.openingLast.toLocaleString("en-US")}, עלות ריבית {NOTE.interestLast.toLocaleString("en-US")}.
          </p>
          <p className="text-[14.5px]">
            הטבות ששולמו {NOTE.paidLast.toLocaleString("en-US")} (מהן מהקופה {NOTE.paidFromAssetsLast.toLocaleString("en-US")}), הפקדה לקופה {NOTE.contributionLast.toLocaleString("en-US")}, ושירות עבר {NOTE.pastServiceLast} (תוספת לדרג א׳).
          </p>
          <p className="text-[14.5px]">כל התשלומים והתיקון בסוף השנה; ההפקדה ב-30.6.</p>
          <HintLadder
            task="חלצו: ריבית ההיוון, אחוז התשלומים מהקופה, שיעור ההפקדה, ושיעור התוספת לדרג א׳."
            hints={[
              "מה מותר לחלץ ישירות, ובאיזה תנאי?",
              "ריבית = עלות ריבית ÷ פתיחה (מותר: אין תשלומים או שינוי באמצע השנה). האחוזים: חלק ÷ שלם.",
              <>ריבית: {NOTE.interestLast} ÷ {NOTE.openingLast.toLocaleString("en-US")} = {pct(NOTE_RATE, 4)}, בלי לעגל.</>,
              <span key="s" className="block space-y-1">
                <span className="block">קופה: {NOTE.paidFromAssetsLast} ÷ {NOTE.paidLast} = {pct(NOTE_FROM_ASSETS)}.</span>
                <span className="block">
                  הפקדה: {NOTE.contributionLast} ÷ ({NOTE_PAYROLL.map((g) => `${g.heads} × ${g.salary}`).join(" + ")}) = {pct(NOTE_CONTRIBUTION, 2)} → {pct(NOTE_X.contributionRate)}: על כל מי שעבד ב-30.6, כולל מי שפרש בדצמבר.
                </span>
                <span className="block">
                  תוספת: {NOTE.pastServiceLast} ÷ {NOTE_X.beforeLast.toFixed(1)} (החוב לדרג א׳ לפני התיקון: {EXAM_B.grades[0].heads} × {EXAM_B.year - EXAM_B.startYear} × {EXAM_B.grades[0].salaryLast} × {1 + EXAM_B.grades[0].raise}^{EXAM_B.retireYear - EXAM_B.year + 1} ÷ (1 + הריבית)^{EXAM_B.retireYear - EXAM_B.year + 1}) = {pct(NOTE_ADDED, 2)} → {pct(NOTE_X.addedLast)}.
                </span>
              </span>,
            ]}
          />
        </Part>
      </>
    ),
  },
  "emp-present-master": {
    lead: "כל שורה במעגל מגיעה לקופסה אחת: רווח והפסד, OCI או מאזן.",
    body: (
      <>
        <ExplainTask
          task="הסבירו לחבר איך מחלצים את שיעור ההפקדה מביאור של שנה קודמת."
          model={
            <>
              לוקחים את ההפקדה שבביאור, ומחלקים בשכר של כל מי שעבד ביום ההפקדה. גם מי שפרש מאוחר יותר נספר, כי ביום ההפקדה הוא עוד עבד. האחוז שיוצא הוא שיעור ההפקדה, ואותו מפעילים על השכר של השנה.
            </>
          }
        />
        {ROUTES}
        <Bridge summary="כל שורה במעגל מגיעה לקופסה אחת: רווח והפסד, OCI או מאזן.">סיימנו את ההטבה המוגדרת. מה קורה כשההטבה משולמת באמצע העבודה, כמו שבתון או מענק יובל? {lessonRef("ias19-other")}.</Bridge>
      </>
    ),
    check: quiz("emp-present-master", [
      { q: "לאן: עלות שירות עבר?", options: ["רווח והפסד, עם השכר", "OCI"], answer: 0, why: "כמו שירות שוטף." },
      { q: "הכנסות ריבית 1,840, עלות ריבית 2,260. מה מוצג?", options: ["הוצאות ריבית נטו 420", "שתיהן בנפרד"], answer: 0, why: "נטו." },
      { q: "P.N. קופה 620 רווח, P.N. חוב 410 הפסד. ב-OCI?", options: ["רווח נטו 210", "רווח 620"], answer: 0, why: "נטו." },
      { q: "עלות ריבית 1,164 על פתיחה 25,857, בשנה בלי תשלומים באמצע. מה השיעור?", options: ["4.5017%, בלי לעגל", "4.5%", "4%", "אי אפשר לדעת"], answer: 0, why: "ריבית ÷ פתיחה, ולא מעגלים." },
      { q: "P.N. חוזר לרווח והפסד בשנה הבאה?", options: ["לא (סעיף 122)", "כן, כשהעובד פורש", "כן, בהדרגה", "רק בסילוק"], answer: 0, why: "מדידה מחדש לא חוזרת." },
    ]),
  },
};
