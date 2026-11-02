import { Briefcase, FileSearch, Inbox, Lock, Wallet } from "lucide-react";
import type { ReactNode } from "react";
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
import { Bridge, DestTag, ExplainTask, HintLadder, MapBranch, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { Card, JE, KeyCard, Money, Rule, Stepper, Wide } from "./ui";

/** The employee-benefits course, lessons 8–10: an amendment mid-year and settlement, plan assets and the ceiling, presentation and reverse engineering. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
const n5 = CTO.retire - CTO.from;

export const IAS19_DB2_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 8: amendment, past service, settlement.
  "emp-amend-hook": {
    lead: "שלושה אירועים שנשמעים דומים — שיפור תנאים, ״בוא נסגור עניין״, ועזיבה — וכל אחד נרשם אחרת.",
    body: (
      <>
        <Story icon={<Briefcase />} title="המענק עולה מ-1 באפריל">
          <p>הבוס מודיע: מ-1 באפריל המענק בפרישה עולה מ-60,000 ל-80,000 ₪ לכל שנת עבודה. האם התוספת מגיעה רק על העבודה מכאן והלאה, או גם על כל מה שכבר עבדתם?</p>
          <p>ומה אם תגידו ״תן לי 150,000 עכשיו ונסגור את העניין״? או שפשוט תעזבו מחר? אותה חברה, שלושה אירועים, וכל אחד נרשם אחרת.</p>
        </Story>
        <MapBranch lesson="ias19-amend">ב{lessonRef("ias19-rollforward")} כל ההנחות היו קבועות לאורך השנה. כאן נכנס אירוע אחד באמצע השנה — ועליו נשענים {lessonsRef("ias19-assets", "ias19-present")} (נכסים והצגה).</MapBranch>
      </>
    ),
  },
  "emp-amend-split": {
    lead: "שינוי תנאים מפצל את השנה לשתי תקופות, והעבר ״מתעדכן״: ההפרש הוא עלות שירות עבר — לרווח והפסד, מיד.",
    body: (
      <>
        <P>
          <T19 he="שינוי תנאי תוכנית" en="Plan amendment" />: מרגע השינוי ההנחות חדשות, ולכן מפצלים את השנה לשתי תקופות — לכל אחת התנאים, השיעור וה-n שלה.
        </P>
        <P>
          בנוסף, העבר מתעדכן לתנאים החדשים. ההפרש הוא <T19 he="עלות שירות עבר" en="Past service cost" par="102–103" />: ההתחייבות אחרי השינוי פחות ההתחייבות לפניו — שתיהן ביום השינוי — והוא נרשם
          מיד לרווח והפסד.
        </P>
        <P>
          ריבית על חלק משנה (<span dir="ltr">IAS 19.123</span>): עד השינוי — על הפתיחה; מהשינוי — על היתרה המעודכנת. ותשלום באמצע השנה מפחית ריבית מיומו.
        </P>
      </>
    ),
    check: quiz("emp-amend-split", [
      { q: "המענק עולה גם על השנים שעברו. ההפרש על העבר — שירות שוטף או שירות עבר?", options: ["שירות עבר", "שירות שוטף", "P.N.", "סילוק"], answer: 0, why: "תוספת על שירות שכבר ניתן = שירות עבר." },
      { q: "באיזו ריבית מחשבים את שני צדי שירות העבר?", options: ["בריבית של יום השינוי", "בריבית של תחילת השנה", "בריבית של סוף השנה", "צד אחד בכל ריבית"], answer: 0, why: "שתי היתרות ביום השינוי." },
    ]),
  },
  "emp-amend-settle": {
    lead: "סילוק — תשלום מחוץ לתנאים שמבטל את ההתחייבות — לרווח והפסד; פרישה לפי התנאים, גם מוקדמת — P.N. ב-OCI.",
    body: (
      <>
        <Wide className="grid gap-3 sm:grid-cols-2">
          <Card title={<T19 he="סילוק" en="Settlement" par="109–111" />}>
            <p>החברה משלמת סכום כדי להיפטר מההתחייבות, בהסכם שאינו לפי תנאי התוכנית. הרווח או ההפסד: יתרת ההתחייבות פחות התשלום — לרווח והפסד.</p>
          </Card>
          <Card title="פרישה בלתי צפויה">
            <p>העובד עוזב ומקבל בדיוק מה שמגיע לו לפי התוכנית — רק מוקדם מהצפוי. זה לא סילוק: ההפרש בין היתרה לתשלום הוא שינוי אומדן — P.N. ב-OCI.</p>
          </Card>
        </Wide>
      </>
    ),
    check: quiz("emp-amend-settle", [
      { q: "החברה משלמת 150,000 ₪ לביטול התחייבות שבספרים 155,000. מה הרישום?", options: ["רווח מסילוק 5,000 ברווח והפסד", "P.N. רווח 5,000 ב-OCI", "שירות עבר שלילי", "אין רישום"], answer: 0, why: "תשלום מחוץ לתנאים = סילוק." },
      { q: "עובד פורש לפי התנאים, מוקדם מהצפוי. סילוק או P.N.?", options: ["P.N. ב-OCI", "סילוק"], answer: 0, why: "תשלום לפי התנאים אינו סילוק." },
    ]),
  },
  "emp-amend-rule": {
    lead: "שנה מפוצלת: ארבעה צעדים — שירות לכל תקופה, שירות עבר, ריבית לכל תקופה, וסגירה ו-P.N.",
    body: (
      <Rule>
        (א) לכל תקופה: ריבית של תחילתה, n עד סוף התקופה, וצבירה של חודשי התקופה בלבד. (ב) שירות עבר = יתרה אחרי השינוי פחות יתרה לפניו, באותה ריבית ובאותו n של יום השינוי. (ג) ריבית: עד השינוי
        על היתרה בפתיחה; אחרי השינוי על היתרה אחרי שירות העבר. (ד) סילוק: יתרה פחות תשלום — לרווח והפסד; תשלום לפי התנאים — P.N. ב-OCI.
      </Rule>
    ),
    check: quiz("emp-amend-rule", [{ q: "אחרי התיקון — על איזו יתרה הריבית?", options: ["על היתרה אחרי שירות העבר", "על הפתיחה", "על הסגירה", "על שירות העבר בלבד"], answer: 0, why: "מיום התיקון — היתרה המעודכנת." }]),
  },
  "emp-amend-solved": {
    lead: "מפצלים, מודדים את שני הצדדים ביום התיקון, ומסיימים במעגל — וה-P.N. מאזן.",
    body: (
      <>
        <Story icon={<Briefcase />} title="מנהל הטכנולוגיה">
          <p>
            התחיל ב-1.1.{CTO.from}; בפרישה ב-31.12.{CTO.retire} יקבל <Money v={CTO.oldPerYear} /> לכל שנת שירות. השיעור ב-31.12.{CTO.from}: {pct(CTO.rateEnd2023)}. ב-1.7.{CTO.from + 1} המענק עולה ל-
            <Money v={CTO.newPerYear} /> לשנה — גם על העבר — והשיעור יורד ל-{pct(CTO.rateAmend)}, ונשאר כך עד סוף השנה.
          </p>
        </Story>
        <Wide>
          <Stepper
            label="שנה מפוצלת"
            steps={[
              { title: "פתיחה", body: <p><Money v={CTO.oldPerYear} plain /> × 1 ÷ <L>{1 + CTO.rateEnd2023}^{n5}</L> = <strong><M v={CTO_OPENING} /></strong>.</p> },
              {
                title: "(א) שירות שוטף, שתי תקופות",
                body: (
                  <div className="space-y-1.5">
                    <p>עד התיקון: <Money v={CTO.oldPerYear / 2} plain /> ÷ <L>{1 + CTO.rateEnd2023}^{n5 - 0.5}</L> = <M v={CTO_YEAR.serviceBefore} /> — מהוון מ-30.6, בשיעור של תחילת התקופה.</p>
                    <p>אחרי: <Money v={CTO.newPerYear / 2} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 1}</L> = <M v={CTO_YEAR.serviceAfter} />. סה״כ <strong><M v={CTO_YEAR.service} /></strong>.</p>
                  </div>
                ),
              },
              {
                title: "(ב) שירות עבר ב-1.7",
                body: (
                  <div className="space-y-1.5">
                    <p>1.5 שנות שירות. לפני: <Money v={CTO.oldPerYear * 1.5} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 0.5}</L> = <M v={CTO_YEAR.pastBefore} />.</p>
                    <p>אחרי: <Money v={CTO.newPerYear * 1.5} plain /> ÷ <L>{1 + CTO.rateAmend}^{n5 - 0.5}</L> = <M v={CTO_YEAR.pastAfter} />. הפרש: <strong><M v={CTO_YEAR.pastService} /></strong> — לרווח והפסד.</p>
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
                    title={`מנהל הטכנולוגיה — ${CTO.from + 1}`}
                    rows={[
                      { label: "יתרת פתיחה", value: CTO_OPENING, kind: "balance", how: `${pct(CTO.rateEnd2023)}, n = ${n5}` },
                      { label: "עלות ריבית", value: CTO_YEAR.interest, how: `חצי שנה ${pct(CTO.rateEnd2023)} על הפתיחה, חצי ${pct(CTO.rateAmend)} על היתרה אחרי התיקון` },
                      { label: "עלות שירות שוטף", value: CTO_YEAR.service, how: `חצי ${pct(CTO.rateEnd2023)} (n = ${n5 - 0.5}), חצי ${pct(CTO.rateAmend)} (n = ${n5 - 1})` },
                      { label: "עלות שירות עבר", value: CTO_YEAR.pastService, how: `${pct(CTO.rateAmend)}, n = ${n5 - 0.5}, ביום התיקון` },
                      { label: "P.N. — הפסד", value: CTO_YEAR.pn, kind: "pn", how: "בלי עיגולי ביניים" },
                      { label: "יתרת סגירה", value: CTO_YEAR.closing, kind: "balance", how: `2 × ${CTO.newPerYear.toLocaleString("en-US")}, ${pct(CTO.rateAmend)}, n = ${n5 - 1}` },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Wide>
      </>
    ),
  },
  "emp-amend-together": {
    lead: "אותה יתרה — שלוש דרכים לצאת ממנה: סילוק (רווח והפסד), פרישה לפי התנאים (OCI), וביטול תוכנית בתשלום (סילוק).",
    body: (
      <>
        <Card title="א. סילוק">
          <HintLadder
            task={
              <>
                ב-31.12.{CTO.from + 1} החברה משלמת למנהל <Money v={SETTLE.paid} /> תמורת ביטול ההתחייבות שבספרים — <M v={CTO_YEAR.closing} />. מה הרישום?
              </>
            }
            hints={[
              "התשלום לפי תנאי התוכנית, או הסכם חדש?",
              "הסכם מחוץ לתנאים — סילוק: יתרה פחות תשלום, לרווח והפסד.",
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
        </Card>
        <Card title="ב. פרישה בלתי צפויה">
          <HintLadder
            task={
              <>
                במקום זאת: המנהל פורש במפתיע ב-{RETIRE.date}, וזכאי לפי התנאים ל-{RETIRE.years} × <Money v={CTO.newPerYear} plain /> = <Money v={RETIRE_PAID} />. איך נרשם ההפרש מול היתרה?
              </>
            }
            hints={["האם התשלום חורג מתנאי התוכנית?", "לא — זו פרישה לפי התנאים, ולכן אין סילוק.", <>ההפרש: <Money v={RETIRE_PAID} plain /> − <M v={CTO_YEAR.closing} /></>, <><strong><M v={RETIRE_PN} /></strong> הפסד — P.N. ב-OCI.</>]}
          />
        </Card>
        <Card title="ג. ביטול תוכנית קטנה">
          <HintLadder
            task={
              <>
                חברה משלמת לעובד <Money v={SMALL.paid} /> תמורת ביטול התוכנית, והיתרה בספרים <Money v={SMALL.books} />. מה הרישום — ומה היה משתנה אילו העובד פשוט התפטר מיוזמתו?
              </>
            }
            hints={["האם הביטול הוא לפי תנאי התוכנית?", "לא — זו עסקה שמבטלת את ההתחייבות: סילוק.", <>הפסד: <Money v={SMALL.paid} plain /> − <Money v={SMALL.books} plain /></>, <><strong><Money v={SMALL_LOSS} /></strong> הפסד מסילוק, לרווח והפסד. אילו התפטר מיוזמתו ויצא לפי התנאים — זו פרישה בלתי צפויה: P.N. ב-OCI.</>]}
          />
        </Card>
      </>
    ),
  },
  "emp-amend-master": {
    lead: "שינוי תנאים מפצל ויוצר שירות עבר; תשלום מחוץ לתנאים — סילוק; לפי התנאים — P.N.",
    body: (
      <>
        <ExplainTask task="הסבירו לחבר, בשלושה משפטים, מה ההבדל בין סילוק לבין פרישה בלתי צפויה." model="בשניהם ההתחייבות יוצאת מהספרים. בסילוק החברה עושה עסקה חדשה, מחוץ לתנאי התוכנית, כדי להיפטר מההתחייבות — וההפרש הוא רווח או הפסד מהעסקה, ברווח והפסד. בפרישה בלתי צפויה העובד מקבל בדיוק מה שהתוכנית קובעת, רק מוקדם — אז ההפרש הוא טעות באומדן, ומקומו ב-OCI." />
        <Bridge summary="שינוי תנאים מפצל את השנה ויוצר שירות עבר; תשלום מחוץ לתנאים הוא סילוק; תשלום לפי התנאים הוא P.N.">
          ומה אם החברה הפקידה כסף בקרן נפרדת שתשלם את ההטבה? איך זה משפיע על ההתחייבות ועל הריבית? {lessonRef("ias19-assets")}.
        </Bridge>
      </>
    ),
    check: quiz("emp-amend-master", [
      { q: "המענק עולה ל-7.5% גם על השנים שעברו. ההפרש על העבר?", options: ["שירות עבר", "שירות שוטף", "P.N.", "סילוק"], answer: 0, why: "תוספת על שירות שכבר ניתן." },
      { q: "שני צדי שירות העבר — באיזו ריבית?", options: ["של יום השינוי", "של תחילת השנה", "של סוף השנה", "כל צד בשלו"], answer: 0, why: "באותה ריבית ובאותו n." },
      { q: "החברה משלמת 150,000 וההתחייבות בספרים 158,000. מה הרישום?", options: ["רווח מסילוק 8,000 ברווח והפסד", "P.N. רווח 8,000", "הפסד 8,000", "אין"], answer: 0, why: "סילוק — יתרה פחות תשלום." },
      { q: "עובד פורש לפי התנאים, מוקדם מהצפוי. סילוק או P.N.?", options: ["P.N. ב-OCI", "סילוק ברווח והפסד"], answer: 0, why: "לפי התנאים — לא סילוק." },
      { q: "תשלום של 50,000 באפריל — משפיע על הריבית?", options: ["כן, מקטין אותה מיומו", "לא", "מגדיל אותה", "רק בשנה הבאה"], answer: 0, why: "החוב קטן מיום התשלום." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 9: plan assets and the ceiling.
  "emp-assets-hook": {
    lead: "מה שמצב באמת הוא חוב פחות קופה — אבל רק אם הקופה באמת שלכם.",
    body: (
      <>
        <Story icon={<Wallet />} title="חוב, וקופה בצד">
          <p>אתם חייבים 15,000 ₪, ושמתם בצד קופה נפרדת של 4,200 ₪ רק בשביל החוב הזה. המצב האמיתי: חוב נטו של 10,800.</p>
          <p>ומה אם בקופה יש יותר כסף מהחוב, אבל היא נעולה אצל נאמן שמחליט אם להחזיר לכם את העודף? האם העודף הוא באמת נכס שלכם?</p>
        </Story>
        <MapBranch lesson="ias19-assets">{lessonsRef("ias19-measure", "ias19-amend")} מדדו רק את ההתחייבות. כאן מוסיפים את הצד השני — ובשיעור הבא מציגים את הכול בדוחות.</MapBranch>
      </>
    ),
  },
  "emp-assets-what": {
    lead: "נכסי תכנית מקטינים את ההתחייבות — ולהם מעגל משלהם, עם ריבית באותו שיעור של ההתחייבות.",
    body: (
      <>
        <P>
          <T19 he="נכסי תכנית" en="Plan assets" par="8, 113" /> הם כסף וניירות ערך בקרן נפרדת מהחברה, שנועדו רק לתשלום הטבות עובד ואינם זמינים לנושי החברה. מנכים אותם מההתחייבות:{" "}
          <strong>התחייבות נטו = התחייבות פחות שווי הוגן של הנכסים</strong>.
        </P>
        <Wide>
          <DataTable
            head={["שורה במעגל הנכסים", "איך"]}
            rows={[
              ["הכנסות ריבית", "באותו שיעור היוון של ההתחייבות, ובאותו פיצול תקופות (סעיף 125); הפקדה באמצע שנה — ריבית מיומה"],
              ["הפקדות", "מה שהחברה העבירה לקרן"],
              ["הטבות ששולמו מהקרן", "רק מה שיצא מהנכסים — לא מה שהחברה שילמה מהקופה שלה"],
              ["P.N.", "התשואה בפועל מעבר להכנסות הריבית (סעיף 127) — ל-OCI"],
            ]}
          />
        </Wide>
        <Card title="הערה: איך מחשבים כשהשיעור השתנה באמצע השנה">
          <p className="text-[14.5px]">
            הכלל (<span dir="ltr">IAS 19.125</span>): הכנסות הריבית על הפתיחה ועל הפקדה באמצע שנה — באותו שיעור ובאותו פיצול תקופות כמו ההתחייבות. בקרן שבה{" "}
            <Money v={SPLIT.opening} /> בפתיחה, שיעור {pct(SPLIT.periods[0].i)} עד 30.6 ו-{pct(SPLIT.periods[1].i)} מ-1.7, והפקדה של <Money v={SPLIT.contribution} /> ב-1.7 — הכנסות הריבית לפי הכלל{" "}
            <strong>{SPLIT_INTEREST.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>. יש מרצים שמחשבים את הפתיחה בשיעור הראשון לשנה שלמה ({SPLIT_OTHER.toLocaleString("en-US", { maximumFractionDigits: 2 })}); כאן
            מלמדים את הכלל — וכדאי לברר מה מקובל אצל המרצה שלכם.
          </p>
        </Card>
      </>
    ),
    check: quiz("emp-assets-what", [
      { q: "התחייבות 10,000 ונכסים 3,500. מה ההתחייבות נטו?", options: ["6,500", "13,500", "10,000", "3,500"], answer: 0, why: "10,000 − 3,500." },
      { q: "באיזה שיעור מחשבים הכנסות ריבית על נכסים?", options: ["באותו שיעור של ההתחייבות", "בתשואה בפועל", "בשיעור הממשלתי", "בלי ריבית"], answer: 0, why: "IAS 19.125." },
    ]),
  },
  "emp-assets-ceiling": {
    lead: "עודף של נכסים מוכר רק עד מה שהחברה יכולה להשתמש בו בפועל — התקרה.",
    body: (
      <>
        <P>
          <T19 he="תקרת נכס" en="Asset ceiling" par="64" />: כשהנכסים גדולים מההתחייבות, החברה מכירה בעודף רק עד הערך הנוכחי של מה שהיא יכולה להשתמש בו — החזר מהקרן, או הקטנת הפקדות עתידיות
          (<span dir="ltr">IFRIC 14</span>). מה שמעבר לזה נשרף — ב-OCI, בצד הנכסים.
        </P>
        <KeyCard icon={<Lock className="h-5 w-5" />}>כסף שנעול אצל נאמן, שמחזיר רק לפי שיקול דעתו — אינו עודף שהחברה שולטת בו. התקרה: אפס.</KeyCard>
      </>
    ),
    check: quiz("emp-assets-ceiling", [
      { q: "נכסים 45,000, התחייבות 40,000, תקרה 1,500. מה הנכס נטו?", options: ["1,500", "5,000", "45,000", "0"], answer: 0, why: "הנמוך מבין 5,000 ל-1,500." },
      { q: "התקרה — מה היא עושה להתחייבות?", options: ["כלום; היא מגבילה רק את הנכס", "מקטינה", "מגדילה", "מבטלת"], answer: 0, why: "היא פועלת בצד הנכסים." },
    ]),
  },
  "emp-assets-rule": {
    lead: "שני מעגלים, נטו ביניהם, ותקרה על עודף.",
    body: (
      <Rule>
        (א) התחייבות נטו = התחייבות פחות נכסים. (ב) מעגל נכסים: פתיחה + ריבית + הפקדות − תשלומים מהנכסים + P.N. = סגירה; הריבית בשיעור של ההתחייבות ובאותו פיצול תקופות, והפקדה באמצע שנה מקבלת
        ריבית חלקית. (ג) בתנועה בהתחייבות מורידים את כל ההטבות שנפרעו; בתנועה בנכסים — רק את אלה שנפרעו מהנכסים. (ד) כשהנכסים גדולים מההתחייבות: נכס נטו = הנמוך מבין (נכסים פחות התחייבות) לבין
        התקרה.
      </Rule>
    ),
    check: quiz("emp-assets-rule", [{ q: "שולמו לעובדים 270,000, מהם 57,000 מהקרן. כמה מורידים מהנכסים?", options: ["57,000", "270,000", "213,000", "0"], answer: 0, why: "רק מה שיצא מהקרן." }]),
  },
  "emp-assets-solved": {
    lead: "שני מעגלים זה לצד זה, וההתחייבות נטו ביניהם — ותוצאת השנה בשלוש כתובות.",
    body: (
      <>
        <Story icon={<Inbox />} title="מענק עם קרן">
          <p>
            מענק של <Money v={PLAN.grant} /> שנצבר שווה בשווה על {PLAN.years} שנות עבודה — <Money v={PLAN_PER_YEAR} /> לשנה. העובד עבד שנה אחת עד 31.12.2023, והתשלום בעוד {PLAN.n} שנים מאז. שיעור {pct(PLAN.rate)}, בלי
            שינוי בהנחות. בקרן: <Money v={PLAN.assets.opening} /> ב-31.12.2023, הפקדה של <Money v={PLAN.assets.contribution} /> ב-1.4.2024, ושווי הוגן <Money v={PLAN.assets.closing} /> בסוף 2024.
          </p>
        </Story>
        <Wide className="grid gap-3 lg:grid-cols-2">
          <RollForward
            title="התחייבות — 2024"
            rows={[
              { label: "יתרת פתיחה", value: PLAN_OPENING, kind: "balance", how: `${pct(PLAN.rate)}, n = ${PLAN.n}` },
              { label: "עלות ריבית", value: PLAN_YEAR.interest, how: `${pct(PLAN.rate)} × הפתיחה` },
              { label: "עלות שירות", value: PLAN_YEAR.service, how: `n = ${PLAN.n - 1}` },
              { label: "P.N.", value: PLAN_YEAR.pn, kind: "pn", how: "אין שינוי בהנחות" },
              { label: "יתרת סגירה", value: PLAN_YEAR.closing, kind: "balance", how: `2 שנים, n = ${PLAN.n - 1}` },
            ]}
          />
          <RollForward
            title="נכסי תכנית — 2024"
            rows={[
              { label: "יתרת פתיחה", value: PLAN.assets.opening, kind: "balance" },
              { label: "הכנסות ריבית", value: PLAN_ASSETS.interest, how: `${pct(PLAN.rate)} על הפתיחה, ועל ההפקדה 9 חודשים` },
              { label: "הפקדות", value: PLAN.assets.contribution },
              { label: "P.N. — רווח", value: PLAN_ASSETS.pn, kind: "pn", how: "תשואה מעבר להכנסות הריבית" },
              { label: "שווי הוגן בסגירה", value: PLAN.assets.closing, kind: "balance" },
            ]}
          />
        </Wide>
        <Wide>
          <DataTable
            head={["", "סכום", "איפה"]}
            rows={[
              ["עלות שירות", Math.round(PLAN_EFFECT.salary), <DestTag key="a" to="pl" />],
              ["ריבית נטו (עלות פחות הכנסה)", Math.round(PLAN_EFFECT.netInterest), <DestTag key="b" to="pl" />],
              ["P.N. של הנכסים", Math.round(PLAN_EFFECT.oci), <DestTag key="c" to="oci" />],
              ["התחייבות נטו, 31.12.2024", Math.round(PLAN_EFFECT.net), <DestTag key="d" to="bs" />],
            ]}
            foot={["סך הרווח הכולל", Math.round(PLAN_EFFECT.total), ""]}
            caption="השפעת 2024 — בסוגריים: הוצאה או הפסד"
          />
        </Wide>
        <p className="text-[14px] text-muted">
          התחייבות נטו בפתיחה: <M v={PLAN_OPENING} /> − <Money v={PLAN.assets.opening} plain /> = <M v={PLAN_OPENING - PLAN.assets.opening} />.
        </p>
      </>
    ),
  },
  "emp-assets-together": {
    lead: "כשיש עודף — בודקים תקרה בכל תאריך, ומשחזרים את השיעור מההתחייבות.",
    body: (
      <Card title="עודף, ותקרה של 5% מההתחייבות">
        <HintLadder
          task={
            <>
              ב-31.12.2023: נכסים <Money v={SURPLUS.assets} />, התחייבות <Money v={SURPLUS.obligation} />; התקרה — {pct(SURPLUS.ceilingShare)} מההתחייבות. ב-2024: עלות ריבית <Money v={SURPLUS.interestCost} />, שירות{" "}
              <Money v={SURPLUS.service} />, התחייבות בסגירה <Money v={SURPLUS.closingObligation} />, ונכסים בסגירה <Money v={SURPLUS.closingAssets} />. מה הנכס נטו בשני התאריכים, ומה ה-OCI של 2024?
            </>
          }
          hints={[
            "האם כל העודף של 2023 הוא נכס של החברה?",
            "שאלה (ד) בכלל: נכס נטו = הנמוך מבין העודף לתקרה; והשיעור משוחזר מההתחייבות: ריבית ÷ פתיחה.",
            <>
              2023: עודף <Money v={SURPLUS.assets - SURPLUS.obligation} plain />, תקרה <Money v={SURPLUS_CEILING} plain /> → נכס נטו <Money v={SURPLUS_NET} />; הנכסים מוכרים ב-<Money v={SURPLUS_OPEN_ASSETS} />. שיעור: <Money v={SURPLUS.interestCost} plain /> ÷{" "}
              <Money v={SURPLUS.obligation} plain /> = {pct(SURPLUS_RATE)}.
            </>,
            <span key="s" className="block space-y-1">
              <span className="block">
                נכסים: ריבית <Money v={SURPLUS_A.interest} />; P.N. = <Money v={SURPLUS.closingAssets} plain /> − <Money v={SURPLUS_OPEN_ASSETS} plain /> − <Money v={SURPLUS_A.interest} plain /> = <Money v={SURPLUS_A.pn} /> רווח.
              </span>
              <span className="block">
                התחייבות: P.N. = <Money v={SURPLUS.closingObligation} plain /> − <Money v={SURPLUS.obligation} plain /> − <Money v={SURPLUS.interestCost} plain /> − <Money v={SURPLUS.service} plain /> = <Money v={SURPLUS_PN_OBLIGATION} /> הפסד.
              </span>
              <span className="block">
                2024: עודף <Money v={SURPLUS.closingAssets - SURPLUS.closingObligation} plain /> מול תקרה <Money v={SURPLUS_END_CEILING} plain /> — מכירים ב-<Money v={SURPLUS_END} />. השפעה: שירות <Money v={SURPLUS_EFFECT.salary} />, ריבית נטו{" "}
                <Money v={SURPLUS_EFFECT.netInterest} />, OCI <strong><Money v={SURPLUS_EFFECT.oci} /></strong>.
              </span>
            </span>,
          ]}
        />
      </Card>
    ),
  },
  "emp-assets-master": {
    lead: "שני מעגלים — התחייבות ונכסים — הפער ביניהם הוא נטו, ותקרה חוסמת עודף.",
    body: (
      <>
        <ExplainTask task="הסבירו לחבר: נכסים 52,000 ₪, התחייבות 46,000 ₪, תקרה 2,300 ₪. למה מציגים נכס של 2,300 ולא של 6,000?" model="העודף של 6,000 שווה לחברה רק אם היא יכולה להשתמש בו — לקבל אותו בחזרה או לחסוך הפקדות. לפי הנתונים, הערך הנוכחי של מה שהיא יכולה להשתמש בו הוא 2,300 בלבד, ולכן רק זה נכס. השאר נעול בקרן לטובת העובדים." />
        <Bridge summary="שני מעגלים (התחייבות ונכסים), הפער ביניהם הוא נטו, ותקרה חוסמת עודף.">יש לנו כל מה שצריך לחשב. איך מציגים את התוצאות ברווח והפסד, ב-OCI ובמאזן — ואיך מחלצים שיעורים מביאור? {lessonRef("ias19-present")}.</Bridge>
      </>
    ),
    check: quiz("emp-assets-master", [
      { q: "התחייבות 10,000, נכסים 3,500. מה ההתחייבות נטו?", options: ["6,500", "13,500", "3,500", "10,000"], answer: 0, why: "IAS 19.113." },
      { q: "קרן נעולה: נכסים 300, התחייבות 268, ואין החזר או הקטנת הפקדות. מה הנכס נטו?", options: ["0, והפער הוא הפסד ב-OCI", "32", "300", "268"], answer: 0, why: "התקרה אפס." },
      { q: "הופקדו 1,000 ב-1.7, שיעור 4%. הכנסות ריבית על ההפקדה?", options: ["כ-20 — 1,000 × (1.04^0.5 − 1)", "40", "0", "80"], answer: 0, why: "חצי שנה, ריבית דריבית." },
      { q: "באיזה שיעור — הכנסות ריבית על נכסים?", options: ["של ההתחייבות", "התשואה בפועל"], answer: 0, why: "IAS 19.125." },
      { q: "הטבות ששולמו 270,000, מהם 57,000 מהקרן. כמה מורידים מהנכסים?", options: ["57,000", "270,000"], answer: 0, why: "רק מה שיצא מהקרן." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 10: presentation and reverse engineering.
  "emp-present-hook": {
    lead: "כל שורה הולכת לקופסה אחת — ואסור להעביר אותה לקופסה הלא נכונה.",
    body: (
      <>
        <Story icon={<Inbox />} title="כל שורה לקופסה שלה">
          <p>דף הבנק של החודש: ריבית, החזר חודשי של הלוואה, ותיקון חד־פעמי של טעות. בבית, כל שורה נכנסת לקופסה אחרת — ואם מערבבים, התקציב לא מסתדר.</p>
          <p>בדוחות זה אותו דבר: שורה אחת לרווח והפסד, אחת ל-OCI, ואחת רק למאזן.</p>
        </Story>
        <MapBranch lesson="ias19-present">הצעד האחרון בהטבה המוגדרת: מחברים את המעגלים של {lessonsRef("ias19-measure", "ias19-assets")} לדוחות — והופכים את הכיוון: מביאור של שנה קודמת חושפים הנחות.</MapBranch>
      </>
    ),
  },
  "emp-present-three": {
    lead: "שירות, שירות עבר, סילוק וריבית נטו — לרווח והפסד; כל המדידות מחדש — ל-OCI; היתרה נטו — למאזן.",
    body: (
      <>
        <Wide>
          <DataTable
            head={["שורה", "כתובת", "הערה"]}
            rows={[
              ["עלות שירות שוטף, שירות עבר, סילוק", <DestTag key="a" to="pl" />, "בסעיף השכר של המחלקה: ייצור — עלות המכר; מכירות — מכירה ושיווק; הנהלה — הנהלה וכלליות"],
              [<T19 key="b" he="ריבית נטו" en="Net interest" par="123" />, <DestTag key="b2" to="pl" />, "הכנסות ריבית על הנכסים פחות עלות ריבית — במימון או בשכר, לפי המדיניות"],
              [<T19 key="c" he="מדידה מחדש" en="Remeasurement" par="120, 122" />, <DestTag key="c2" to="oci" />, "P.N. של ההתחייבות, P.N. של הנכסים, השפעת התקרה — ולא חוזרת לרווח והפסד"],
              ["התחייבות נטו או נכס נטו", <DestTag key="d" to="bs" />, "שורה אחת"],
            ]}
          />
        </Wide>
        <P>וקרן ההון (OCI מצטבר)? היא מצטברת מכל השנים — מנתוני שנה אחת אי אפשר לחשב אותה.</P>
      </>
    ),
    check: quiz("emp-present-three", [
      { q: "לאן הולכת עלות שירות עבר?", options: ["רווח והפסד, ביחד עם עלות השכר", "OCI", "מאזן", "קרן הון"], answer: 0, why: "כמו השירות השוטף." },
      { q: "הכנסות ריבית 4,200 ועלות ריבית 4,000 — מה מוצג?", options: ["הכנסות ריבית נטו 200", "4,200 הכנסה ו-4,000 הוצאה", "4,000 הוצאה", "8,200"], answer: 0, why: "נטו." },
    ]),
  },
  "emp-present-reverse": {
    lead: "ביאור של שנה קודמת הוא מעגל מלא — ומתוכו אפשר לחלץ את ההנחות: שיעור, אחוזים ותוספות.",
    body: (
      <>
        <P>כשהשאלה נותנת ביאור של השנה הקודמת, היא בעצם נותנת מעגל שלם. מתוכו מחלצים את מה שלא נאמר במפורש:</P>
        <Wide>
          <DataTable
            head={["מה מחלצים", "איך", "מתי מותר"]}
            rows={[
              ["שיעור ההיוון", "עלות ריבית ÷ יתרת פתיחה", "רק כשלא היו תשלומים או שינוי באמצע השנה — ובלי לעגל"],
              ["חלק הקרן בתשלומים", "הטבות ששולמו מהקרן ÷ כל ההטבות ששולמו", "תמיד"],
              ["שיעור ההפקדה", "ההפקדה ÷ השכר של כל מי שהועסק ביום ההפקדה", "כולל מי שעזב אחר כך"],
              ["תוספת להטבה", "שירות עבר ÷ ההתחייבות לפני התיקון", "באותו יום ובאותו שיעור"],
            ]}
          />
        </Wide>
        <KeyCard icon={<FileSearch className="h-5 w-5" />}>
          שיעור שמשוחזר ממספרי ביאור לא מעגלים. אם יוצא 4.4987% — משתמשים ב-4.4987%, לא ב-4.5%. שתי גרסאות פתרון יכולות להיבדל ביחידות בודדות רק בגלל עיגול השיעור; בדקו מה המרצה שלכם מבקש.
        </KeyCard>
      </>
    ),
    check: quiz("emp-present-reverse", [
      { q: "עלות ריבית 1,302 על פתיחה 32,561 — ומתי מותר לחלץ כך?", options: ["3.9987%, כשאין תשלומים או שינוי באמצע השנה", "4%, תמיד", "3.9987%, תמיד", "אי אפשר לחלץ"], answer: 0, why: "החילוץ הפשוט נכון רק בשנה ״נקייה״, ובלי לעגל." },
    ]),
  },
  "emp-present-rule": {
    lead: "ניתוב: שכר — לפי מחלקה; ריבית נטו — לפי מדיניות; מדידות מחדש — OCI נטו; יתרות — מאזן נטו.",
    body: (
      <Rule>
        ניתוב כל שורה: שירות שוטף, שירות עבר וסילוק — לרווח והפסד, בסעיף השכר של מחלקת העובד (ייצור: עלות המכר; מכירות: מכירה ושיווק; הנהלה: הנהלה וכלליות). ריבית נטו (עלות פחות הכנסה) — לרווח
        והפסד, במימון או בשכר לפי מדיניות. P.N. של ההתחייבות, P.N. של הנכסים והשפעת התקרה — OCI, בשורה נטו אחת. יתרות סגירה — מאזן, התחייבות נטו. הנדסה לאחור: שיעור ההיוון = עלות ריבית ÷ יתרת
        פתיחה, רק כשלא היו תשלומים או שינוי באמצע השנה.
      </Rule>
    ),
    check: quiz("emp-present-rule", [{ q: "P.N. נכסים 568 רווח ו-P.N. התחייבות 721 הפסד. מה ב-OCI?", options: ["הפסד נטו 153", "רווח 568 והפסד 721, בנפרד", "הפסד 721", "רווח 568"], answer: 0, why: "OCI בשורה נטו אחת." }]),
  },
  "emp-present-solved": {
    lead: "תיקון באמצע השנה — וגם הכנסות הריבית על הנכסים מפוצלות באותן תקופות; ואז כל שורה לכתובת שלה.",
    body: (
      <>
        <Story icon={<Inbox />} title={`המענק עם הקרן, מ${lessonRef("ias19-assets")} — עם תיקון`}>
          <p>
            ב-1.7.2024 המענק עולה מ-<Money v={PLAN_PER_YEAR} /> ל-<Money v={AMENDED.newPerYear} /> לשנה, גם על העבר; השיעור יורד מ-{pct(PLAN.rate)} ל-{pct(AMENDED.rateAfter)} ביום התיקון, ובסוף השנה הוא{" "}
            {pct(AMENDED.rateEnd)}. הקרן כמו קודם: <Money v={PLAN.assets.opening} /> בפתיחה, <Money v={PLAN.assets.contribution} /> ב-1.4, <Money v={PLAN.assets.closing} /> בסוף.
          </p>
        </Story>
        <Wide>
          <Stepper
            label="תיקון והצגה"
            steps={[
              {
                title: "ההתחייבות",
                body: (
                  <RollForward
                    title="התחייבות — 2024"
                    rows={[
                      { label: "יתרת פתיחה", value: PLAN_OPENING, kind: "balance" },
                      { label: "עלות ריבית", value: AM_YEAR.interest, how: `${Math.round(AM_YEAR.interestBefore)} (חצי שנה, ${pct(PLAN.rate)}) + ${Math.round(AM_YEAR.interestAfter)} (חצי שנה, ${pct(AMENDED.rateAfter)}, על היתרה אחרי התיקון)` },
                      { label: "עלות שירות שוטף", value: AM_YEAR.service, how: `${Math.round(AM_YEAR.serviceBefore)} (n = ${PLAN.n - 0.5}) + ${Math.round(AM_YEAR.serviceAfter)} (n = ${PLAN.n - 1})` },
                      { label: "עלות שירות עבר", value: AM_YEAR.pastService, how: `${Math.round(AM_YEAR.pastAfter)} − ${Math.round(AM_YEAR.pastBefore)}, ${pct(AMENDED.rateAfter)}, n = ${PLAN.n - 0.5}` },
                      { label: "P.N. — הפסד", value: AM_YEAR.pn, kind: "pn" },
                      { label: "יתרת סגירה", value: AM_YEAR.closing, kind: "balance", how: `2 × ${AMENDED.newPerYear.toLocaleString("en-US")}, ${pct(AMENDED.rateEnd)}, n = ${PLAN.n - 1}` },
                    ]}
                  />
                ),
              },
              {
                title: "הנכסים — באותו פיצול",
                body: (
                  <RollForward
                    title="נכסי תכנית — 2024"
                    rows={[
                      { label: "יתרת פתיחה", value: PLAN.assets.opening, kind: "balance" },
                      { label: "הכנסות ריבית", value: AM_ASSETS.interest, how: `${AM_ASSETS_PARTS.parts[0].toFixed(0)} עד 30.6 (${pct(PLAN.rate)}, כולל ההפקדה לרבעון) + ${AM_ASSETS_PARTS.parts[1].toFixed(0)} מ-1.7 (${pct(AMENDED.rateAfter)})` },
                      { label: "הפקדות", value: PLAN.assets.contribution },
                      { label: "P.N. — רווח", value: AM_ASSETS.pn, kind: "pn" },
                      { label: "שווי הוגן בסגירה", value: PLAN.assets.closing, kind: "balance" },
                    ]}
                  />
                ),
              },
              {
                title: "הדוחות",
                body: (
                  <DataTable
                    head={["", "סכום", "איפה"]}
                    rows={[
                      ["שכר: שירות שוטף + שירות עבר", Math.round(AM_EFFECT.salary), <DestTag key="a" to="pl" />],
                      ["ריבית נטו", Math.round(AM_EFFECT.netInterest), <DestTag key="b" to="pl" />],
                      ["מדידה מחדש נטו", Math.round(AM_EFFECT.oci), <DestTag key="c" to="oci" />],
                      ["התחייבות נטו", Math.round(AM_EFFECT.net), <DestTag key="d" to="bs" />],
                    ]}
                    caption="בסוגריים: הוצאה או הפסד. קרן ההון אינה ניתנת לחישוב — אין נתונים על השנים הקודמות."
                  />
                ),
              },
            ]}
          />
        </Wide>
      </>
    ),
  },
  "emp-present-together": {
    lead: "המדיניות קובעת רק איפה בתוך רווח והפסד — לא את הסך; וביאור של שנה קודמת מגלה מה השאלה לא אמרה.",
    body: (
      <>
        <Card title="א. מדיניות אחרת">
          <HintLadder
            task="אותה שנה, אבל החברה מציגה את הריבית הנטו בהוצאות השכר. מה משתנה?"
            hints={["האם המדיניות משנה את הסכומים, או רק את השורה?", "רק את השורה. הסך ברווח והפסד — זהה.", <>שכר: <Money v={-AM_EFFECT.salary} plain /> + <Money v={-AM_EFFECT.netInterest} plain /></>, <>= <M v={-AM_EFFECT.pl} /> בשכר, ובמימון — אפס.</>]}
          />
        </Card>
        <Card title="ב. ביאור של שנה קודמת (אלפי ₪)">
          <p className="text-[14.5px]">
            רשת מלונות — הביאור לשנה שעברה: יתרת פתיחה {NOTE.openingLast.toLocaleString("en-US")}, עלות ריבית {NOTE.interestLast.toLocaleString("en-US")}, הטבות ששולמו {NOTE.paidLast.toLocaleString("en-US")} (מהן מהקרן{" "}
            {NOTE.paidFromAssetsLast.toLocaleString("en-US")}), הפקדה לקרן {NOTE.contributionLast.toLocaleString("en-US")}, ושירות עבר {NOTE.pastServiceLast} (תוספת לדרג א׳ בסוף השנה). כל התשלומים והתיקון —
            בסוף השנה; ההפקדה — ב-30.6.
          </p>
          <HintLadder
            task="חלצו: שיעור ההיוון, אחוז התשלומים שמהקרן, שיעור ההפקדה, ושיעור התוספת לדרג א׳."
            hints={[
              "מה מותר לחלץ ישירות — ובאיזה תנאי?",
              "שיעור = ריבית ÷ פתיחה (מותר: אין תשלומים או שינוי באמצע השנה). האחוזים — חלק ÷ שלם.",
              <>שיעור: {NOTE.interestLast} ÷ {NOTE.openingLast.toLocaleString("en-US")} = {pct(NOTE_RATE, 4)} — בלי לעגל.</>,
              <span key="s" className="block space-y-1">
                <span className="block">קרן: {NOTE.paidFromAssetsLast} ÷ {NOTE.paidLast} = {pct(NOTE_FROM_ASSETS)}.</span>
                <span className="block">
                  הפקדה: {NOTE.contributionLast} ÷ ({NOTE_PAYROLL.map((g) => `${g.heads} × ${g.salary}`).join(" + ")}) = {pct(NOTE_CONTRIBUTION, 2)} → {pct(NOTE_X.contributionRate)} — על כל מי שהועסק ב-30.6, כולל מי שפרש בדצמבר.
                </span>
                <span className="block">
                  תוספת: {NOTE.pastServiceLast} ÷ {NOTE_X.beforeLast.toFixed(1)} (ההתחייבות לדרג א׳ לפני התיקון: {EXAM_B.grades[0].heads} × {EXAM_B.year - EXAM_B.startYear} × {EXAM_B.grades[0].salaryLast} × {1 + EXAM_B.grades[0].raise}^{EXAM_B.retireYear - EXAM_B.year + 1} ÷ (1 + השיעור)^{EXAM_B.retireYear - EXAM_B.year + 1}) = {pct(NOTE_ADDED, 2)} → {pct(NOTE_X.addedLast)}.
                </span>
              </span>,
            ]}
          />
        </Card>
      </>
    ),
  },
  "emp-present-master": {
    lead: "כל שורה במעגל מגיעה לכתובת אחת: רווח והפסד, OCI או מאזן.",
    body: (
      <>
        <ExplainTask task="הסבירו לחבר איך מחלצים את שיעור ההפקדה מביאור של שנה קודמת." model="לוקחים את ההפקדה שבביאור, ומחלקים בסך השכר החודשי של כל מי שהועסק ביום ההפקדה — גם מי שפרש מאוחר יותר באותה שנה, כי ביום ההפקדה הוא עוד עבד. האחוז שיוצא הוא שיעור ההפקדה, ואותו מפעילים על השכר של השנה הנוכחית." />
        <Bridge summary="כל שורה במעגל מגיעה לכתובת אחת: רווח והפסד, OCI או מאזן.">סיימנו את ההטבה המוגדרת. מה קורה כשההטבה משולמת באמצע העבודה — שבתון, מענק יובל — ולא בפרישה? {lessonRef("ias19-other")}.</Bridge>
      </>
    ),
    check: quiz("emp-present-master", [
      { q: "לאן — עלות שירות עבר?", options: ["רווח והפסד, עם השכר", "OCI"], answer: 0, why: "כמו שירות שוטף." },
      { q: "הכנסות ריבית 4,200, עלות ריבית 4,000. מה מוצג?", options: ["הכנסות ריבית נטו 200", "שתיהן בנפרד"], answer: 0, why: "נטו." },
      { q: "P.N. נכסים 568 רווח, P.N. התחייבות 721 הפסד. ב-OCI?", options: ["הפסד נטו 153", "רווח 568"], answer: 0, why: "נטו." },
      { q: "האם P.N. חוזר לרווח והפסד בשנה הבאה?", options: ["לא (סעיף 122)", "כן, כשהעובד פורש", "כן, בהדרגה", "רק בסילוק"], answer: 0, why: "מדידה מחדש לא מסווגת מחדש." },
    ]),
  },
};
