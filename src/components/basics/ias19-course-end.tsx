import { Building, ClipboardList, Hotel, PartyPopper, Printer, Timer } from "lucide-react";
import type { ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { assemblyBenefit, EXAM_A, EXAM_B, fieldWindow } from "@/lib/learn/ias19-exams";
import { EXAM_A_SOLVED as A, EXAM_B_ROUNDED as BR, EXAM_B_SOLVED as B } from "@/lib/study/ias19/lessons/exams";
import { AWARD, AWARD_IF_POST, AWARD_META, AWARD_OPENING, AWARD_PL, AWARD_SERVICE, AWARD_YEAR, TERM, TERM_DISCOUNTED, TERM_LATE } from "@/lib/study/ias19/lessons/other";
import { CLOSING, CLOSING_EXTRA } from "@/lib/study/ias19/lessons/map";
import { lessonRef, lessonsRef, pct } from "@/lib/study/ias19/shared";
import { Bridge, DestTag, ExplainTask, HintLadder, MapBranch, RECIPE_STEPS, RollForward, T19 } from "./ias19-ui";
import { MiniQuiz } from "./inventory-interactive";
import { Story } from "./inventory-teach";
import { PrintButton } from "./print-button";
import { Card, JE, KeyCard, Money, Rule, Stepper, Wide } from "./ui";

/** The employee-benefits course, lessons 11–12: other long-term and termination benefits, the two exam-level questions, and the cheat sheet. */

const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias19" chapter={chapter} items={items} />;
const P = ({ children }: { children: ReactNode }) => <p className="text-[15.5px] leading-relaxed">{children}</p>;
const L = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const M = ({ v }: { v: number }) => <Money v={Math.round(v)} />;
/** Thousands, one decimal. */
const K = ({ v }: { v: number }) => <bdi dir="ltr" className="num">{(Math.round(v * 10) / 10).toLocaleString("en-US")}</bdi>;
const y1 = EXAM_A.firstYear;
const y2 = y1 + 1;
const asm = A.assembly;
const fld = A.field;
const CIRCLED = ["①", "②", "③", "④", "⑤"];

export const IAS19_END_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------------------
  // Lesson 11: other long-term and termination benefits.
  "emp-other-hook": {
    lead: "הטבה שמשולמת בזמן העבודה, והטבה שנולדת מהחלטה לסיים אותה — שני ענפים, שני כללים קצרים.",
    body: (
      <>
        <Story icon={<PartyPopper />} title="מענק יובל, וסניף שנסגר">
          <p>אחרי 10 שנים בחברה מקבלים מענק יובל של 150,000 ₪. האם זה שווה הפרשה כבר בשנה הרביעית — או רק בעשירית?</p>
          <p>ומה אם היום החברה מודיעה על סגירת סניף, ועל 8,000 ₪ לכל עובד שיעזוב? האם ההוצאה נרשמת היום, או כשהעובדים יוצאים?</p>
        </Story>
        <MapBranch lesson="ias19-other">
          שני הענפים האחרונים מ{lessonRef("ias19-map")}: הטבות אחרות לזמן ארוך, והטבות בגין פיטורין. אחרי ההטבה המוגדרת, כל ענף הוא שינוי קטן ברכיב אחד.
        </MapBranch>
      </>
    ),
  },
  "emp-other-olt": {
    lead: "הטבה אחרת לזמן ארוך נמדדת בדיוק כמו הטבה מוגדרת — אבל כל התנועות, גם ה-P.N., לרווח והפסד.",
    body: (
      <>
        <P>
          <T19 he="הטבה אחרת לזמן ארוך" en="Other long-term benefit" par="153" />: משולמת בזמן העבודה, אבל לא מסולקת במלואה תוך 12 חודשים מסוף שנת השירות — מענק יובל, שבתון, בונוס רב־שנתי.
        </P>
        <P>
          המדידה זהה להטבה מוגדרת (<span dir="ltr">IAS 19.155</span>), אבל הניתוח פשוט יותר (<span dir="ltr">IAS 19.156</span>): עלות שירות אחת (שוטף ועבר יחד), ריבית, ומדידה מחדש — וכולן ברווח
          והפסד, בלי OCI.
        </P>
      </>
    ),
    check: quiz("emp-other-olt", [
      { q: "איפה נרשם P.N. של הטבה אחרת לזמן ארוך?", options: ["ברווח והפסד", "ב-OCI", "בקרן הון", "לא נרשם"], answer: 0, why: "IAS 19.156." },
      { q: "שבתון שישולם בעוד שלוש שנים, בזמן העבודה — איזה סוג?", options: ["אחרת לזמן ארוך", "לזמן קצר", "לאחר סיום העסקה", "פיטורין"], answer: 0, why: "בזמן העבודה, אבל מעבר ל-12 חודשים." },
    ]),
  },
  "emp-other-term": {
    lead: "הטבת פיטורין נולדת מההחלטה — לכן אין שיוך לשנות שירות, וההכרה מלאה במועד המוקדם מבין שניים.",
    body: (
      <>
        <P>
          <T19 he="הטבת פיטורין" en="Termination benefit" par="159–170" />: ההתחייבות נובעת מההחלטה לפטר — או מהסכמת העובד להצעה של החברה — ולא מהשירות. לכן אין ייחוס לשנות שירות (
          <span dir="ltr">IAS 19.170</span>).
        </P>
        <Card title={<>מועד ההכרה (<span dir="ltr">IAS 19.165</span>)</>}>
          <p>המוקדם מבין: הרגע שבו החברה כבר לא יכולה לבטל את ההצעה, והרגע שבו היא מכירה בהפרשה לארגון מחדש לפי <span dir="ltr">IAS 37</span>.</p>
        </Card>
        <P>תוספת שמותנית בשירות עתידי אינה הטבת פיטורין (סעיף 162) — היא שכר. והטבה שמשולמת בין אם העובד עוזב ובין אם לא — לאחר סיום העסקה (סעיף 164).</P>
      </>
    ),
    check: quiz("emp-other-term", [
      { q: "החברה הודיעה על סגירת מפעל. מתי מכירים בהתחייבות לפיטורין?", options: ["במוקדם מבין: כשאי אפשר לבטל את ההצעה, או כשמכירים בהפרשה לארגון מחדש", "כשהעובדים עוזבים", "בסוף השנה הבאה", "כשמשלמים"], answer: 0, why: "IAS 19.165." },
      { q: "תוספת למי שנשאר עד הסגירה — פיטורין?", options: ["לא, הטבה בגין שירות", "כן"], answer: 0, why: "IAS 19.162." },
    ]),
  },
  "emp-other-rule": {
    lead: "אחרות לזמן ארוך: אותו מעגל, הכול לרווח והפסד. פיטורין: הכול במועד ההכרה, בלי שיוך ובלי היוון בתוך שנה.",
    body: (
      <Rule>
        אחרות לזמן ארוך: אותו מעגל כמו ב{lessonsRef("ias19-rollforward", "ias19-amend")}, אבל עלות שירות (שוטף ועבר), ריבית ו-P.N. — כולן ברווח והפסד. פיטורין: התחייבות מלאה במוקדם מבין שני המועדים;
        ללא ייחוס לשנים; ללא היוון אם נפרעת תוך 12 חודשים מסוף השנה, ועם היוון בשיעור סעיף 83 אם לא (סעיף 169). הסכום — ההטבה שניתנה, בלי תלות בצפי העזיבה.
      </Rule>
    ),
    check: quiz("emp-other-rule", [{ q: "הטבת פיטורין שתשולם בעוד שנתיים — מהוונים?", options: ["כן (סעיף 169)", "לא — פיטורין לא מהוונים", "רק אם גדולה", "רק בהחלטת דירקטוריון"], answer: 0, why: "מעבר ל-12 חודשים — מהוונים." }]),
  },
  "emp-other-solved": {
    lead: "אותו פיצול, אותו שירות עבר, אותה ריבית — רק שהכול נוחת ברווח והפסד.",
    body: (
      <>
        <Story icon={<PartyPopper />} title="מענק יובל שעלה">
          <p>
            עובדת התחילה ב-1.1.{AWARD.from}; בתום {AWARD.years} שנים תקבל מענק יובל של <Money v={AWARD.oldTotal} /> (<Money v={AWARD.oldTotal / AWARD.years} /> לשנה). ב-1.7.2023 המענק עולה ל-
            <Money v={AWARD.newTotal} /> — גם על העבר. השיעור: {pct(AWARD.rateStart)} ב-31.12.2022, {pct(AWARD.rateAmend)} מ-1.7.2023 ועד סוף השנה.
          </p>
        </Story>
        <Wide>
          <Stepper
            label="מענק יובל — 2023"
            steps={[
              { title: "פתיחה", body: <p>{AWARD_META.servedAtStart} × <Money v={AWARD.oldTotal / AWARD.years} plain /> ÷ <L>{1 + AWARD.rateStart}^{AWARD_META.nEnd + 1}</L> = <strong><M v={AWARD_OPENING} /></strong>.</p> },
              {
                title: "שירות — שוטף ועבר, סכום אחד",
                body: (
                  <p>
                    שוטף: <M v={AWARD_YEAR.serviceBefore} /> (עד התיקון) + <M v={AWARD_YEAR.serviceAfter} /> (אחריו). שירות עבר: <M v={AWARD_YEAR.pastAfter} /> − <M v={AWARD_YEAR.pastBefore} /> = <M v={AWARD_YEAR.pastService} />. עלות
                    שירות אחת: <strong><M v={AWARD_SERVICE} /></strong>.
                  </p>
                ),
              },
              {
                title: "המעגל",
                body: (
                  <RollForward
                    title="מענק יובל — 2023"
                    rows={[
                      { label: "יתרת פתיחה", value: AWARD_OPENING, kind: "balance" },
                      { label: "עלות ריבית", value: AWARD_YEAR.interest, how: `חצי שנה ${pct(AWARD.rateStart)}, חצי ${pct(AWARD.rateAmend)} על היתרה אחרי התיקון` },
                      { label: "עלות שירות (שוטף ועבר)", value: AWARD_SERVICE, how: "סכום אחד" },
                      { label: `P.N. — ${AWARD_YEAR.pn < 0 ? "רווח" : "הפסד"}`, value: AWARD_YEAR.pn, kind: "pn", how: "ברווח והפסד!" },
                      { label: "יתרת סגירה", value: AWARD_YEAR.closing, kind: "balance", how: `${pct(AWARD.rateAmend)}, n = ${AWARD_META.nEnd}` },
                    ]}
                  />
                ),
              },
              {
                title: "בדיקה: הכול לרווח והפסד",
                body: (
                  <p>
                    <M v={AWARD_SERVICE} /> + <M v={AWARD_YEAR.interest} /> {AWARD_YEAR.pn < 0 ? "−" : "+"} <M v={Math.abs(AWARD_YEAR.pn)} /> = <strong><M v={AWARD_PL} /></strong> — בדיוק ההפרש בין הסגירה לפתיחה.
                  </p>
                ),
              },
            ]}
          />
        </Wide>
      </>
    ),
  },
  "emp-other-together": {
    lead: "בפיטורין מכירים במה שההחלטה נותנת לכולם — לא לפי מי שצפוי לעזוב, ובלי היוון בתוך שנה.",
    body: (
      <>
        <Card title={`א. מרכז השירות מ${lessonRef("ias19-map")} — בסכומים`}>
          <HintLadder
            task={
              <>
                ב-31.12 הוחלט סופית לסגור את המרכז בעוד שנה. מי שעוזב לפני הסגירה — <Money v={CLOSING.leaveEarly} />; מי שנשאר עד הסגירה — <Money v={CLOSING.stayToEnd} />. {CLOSING.staff} עובדים; צפוי ש-45
                יעזבו מוקדם ו-15 יישארו. מה ההוצאה עכשיו, והפקודה?
              </>
            }
            hints={[
              "מה מקבל כל עובד בכל מקרה?",
              "פיטורין = מה שההחלטה נותנת לכולם; התוספת — שכר על שירות.",
              <>
                <Money v={CLOSING.leaveEarly} plain /> × {CLOSING.staff} = <Money v={TERM} />, בלי היוון.
              </>,
              <span key="j" className="block space-y-2">
                <JE entry={{ id: "1", text: "הטבת פיטורין", lines: [{ account: "הוצאות שכר", dr: TERM }, { account: "התחייבות בגין פיטורין", cr: TERM }] }} />
                <span className="block">
                  התוספת של <Money v={CLOSING_EXTRA} /> תוכר בשנה הבאה, כשהעובדים עובדים בשבילה. פיצול אחר של עוזבים ונשארים — לא משנה את הסכום. ואילו התשלום היה בעוד {TERM_LATE.years} שנים ב-{pct(TERM_LATE.rate)}:{" "}
                  <Money v={TERM} plain /> ÷ <L>{1 + TERM_LATE.rate}^{TERM_LATE.years}</L> = <M v={TERM_DISCOUNTED} />.
                </span>
              </span>,
            ]}
          />
        </Card>
        <Card title="ב. ואילו מענק היובל היה הטבה לאחר סיום העסקה?">
          <HintLadder
            task="אותם מספרים, אבל המענק משולם בפרישה. מה משתנה ברווח והפסד?"
            hints={["איזו שורה במעגל מחליפה כתובת?", "ה-P.N. — בהטבה מוגדרת הוא עובר ל-OCI.", <>רווח והפסד: שירות <M v={AWARD_SERVICE} /> + ריבית <M v={AWARD_YEAR.interest} /></>, <>= <strong><M v={AWARD_IF_POST} /></strong>, וה-P.N. (<M v={Math.abs(AWARD_YEAR.pn)} />) — ב-OCI.</>]}
          />
        </Card>
      </>
    ),
  },
  "emp-other-master": {
    lead: "אחרות לזמן ארוך — הכול לרווח והפסד; פיטורין — הכול במועד ההכרה.",
    body: (
      <>
        <ExplainTask task="הסבירו לחבר למה מענק יובל מוצג בלי OCI." model="מענק יובל משולם בזמן העבודה, ואין בו את אי־הוודאות הגדולה של פנסיה רחוקה. לכן התקן מפשט: את כל השינויים — גם שינויי הנחות — רושמים מיד ברווח והפסד, בלי להפריד ל-OCI." />
        <Bridge summary="אחרות לזמן ארוך: אותו מעגל, הכול לרווח והפסד. פיטורין: הכרה מלאה במועד המוקדם.">כל החומר נלמד. עכשיו מחברים אותו בשתי שאלות סיכום — כמו במבחן. {lessonRef("ias19-exams")}.</Bridge>
      </>
    ),
    check: quiz("emp-other-master", [
      { q: "P.N. של הטבה אחרת לזמן ארוך — איפה?", options: ["רווח והפסד", "OCI"], answer: 0, why: "IAS 19.156." },
      { q: "שבתון שישולם בעוד שלוש שנים — סוג?", options: ["אחרת לזמן ארוך", "לזמן קצר"], answer: 0, why: "מעבר ל-12 חודשים, בזמן העבודה." },
      { q: "הודעה על סגירת מפעל — מתי מכירים?", options: ["במוקדם מבין שני המועדים", "כשהעובדים עוזבים"], answer: 0, why: "IAS 19.165." },
      { q: "תוספת המותנית בהישארות עד הסגירה — פיטורין?", options: ["לא, שירות", "כן"], answer: 0, why: "IAS 19.162." },
      { q: "פיטורין שתשולם בעוד שנתיים — מהוונים?", options: ["כן", "לא"], answer: 0, why: "IAS 19.169." },
    ]),
  },

  // ---------------------------------------------------------------------------
  // Lesson 12: two exam-level questions.
  "emp-exam-hook": {
    lead: "במבחן אין כותרת שאומרת באיזה שיעור אנחנו — מתחילים נכון כשיודעים מה לשאול לפני שמחשבים.",
    body: (
      <>
        <Story icon={<Timer />} title="יום המבחן">
          <p>אין כותרת שאומרת ״עכשיו שירות עבר״. יש עמוד של חברה עם שתי מחלקות, שני מענקים שונים, תיקון באמצע השנה, עובדים שעוזבים וירידת ריבית בדצמבר.</p>
          <p>כך גם בעבודה: הלקוח שולח קובץ, לא שיעור. המשימה — להתחיל נכון.</p>
        </Story>
        <MapBranch lesson="ias19-exams">
          אין ענף חדש — כאן מחברים הכול: סיווג ({lessonRef("ias19-map")}), חמשת הצעדים ({lessonRef("ias19-measure")}), שיוך ותקרה ({lessonRef("ias19-attribute")}), מעגל ({lessonRef("ias19-rollforward")}), שינוי באמצע שנה
          ({lessonRef("ias19-amend")}), נכסים ({lessonRef("ias19-assets")}), הצגה ושחזור ({lessonRef("ias19-present")}), אחרות ופיטורין ({lessonRef("ias19-other")}).
        </MapBranch>
      </>
    ),
  },
  "emp-exam-scan": {
    lead: "מבחן הוא לא חומר חדש אלא סדר פעולות — והוא מתחיל בחמש שאלות סריקה.",
    body: (
      <ol className="space-y-2">
        {[
          "מה סוג ההטבה, ומה היא מפעילה בדוחות?",
          "מה נוסחת ההטבה, האם יש תקרה, ולמה ההטבה מתייחסת — שנות שירות או סיבת זכאות?",
          "מה ציר הזמן: מועדי כניסה, מועדי תשלום צפויים, מועדי שינוי?",
          "איזה מעגל מבקשים, אילו שורות נתונות, ואיזו שורה מאזנת (בדרך כלל P.N.)?",
          "איזה נתון מוסתר, ואפשר לשחזר אותו מהמספרים שבשאלה (ריבית, אחוזי תשלום והפקדה)?",
        ].map((q, i) => (
          <li key={q} className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[15px]">
            <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-fg">{i + 1}</span>
            {q}
          </li>
        ))}
      </ol>
    ),
    check: quiz("emp-exam-scan", [
      { q: "איזו שורה במעגל מאזנת, ולמה לא מחשבים אותה ישירות?", options: ["P.N. — היא מה שנשאר אחרי כל השורות שנתונות או ניתנות לחישוב", "הריבית — כי היא קטנה", "השירות — כי הוא תלוי בשכר", "הסגירה — כי היא נתונה"], answer: 0, why: "P.N. היא תמיד ההפרש." },
    ]),
  },
  "emp-exam-order": {
    lead: "סדר עבודה קבוע: טבלת קבוצות, פתיחה, ריבית, שירות, שירות עבר, סגירה — ו-P.N. מאזנת.",
    body: (
      <>
        <Rule>
          א. טבלת קבוצות: שורה לכל קבוצה — כמות, שנות שירות שעברו, שנות שירות צפויות, הטבה צפויה אחרי תקרה, הטבה לשנה (סכום ÷ שנות הצבירה) ו-n עד התשלום. ב. פתיחה = הטבה לשנה × שנות שירות שעברו ×
          כמות ÷ (1+i)ⁿ, בריבית תחילת השנה. ג. ריבית על הפתיחה לשנה שלמה; בשינוי באמצע שנה — פיצול. ד. שירות שוטף = שנה נוספת באותה שיטה; בשינוי באמצע שנה, כל תת־תקופה מהוונת מסופה. ה. שירות עבר =
          אחרי פחות לפני, במועד התיקון. ו. סגירה = חישוב מחדש בנתוני סוף השנה ובריבית סוף השנה. ז. P.N. = סגירה פחות כל מה שחושב — לעולם לא מחשבים אותה ישירות.
        </Rule>
        <KeyCard icon={<ClipboardList className="h-5 w-5" />}>כלל זהב: מה שנתון בשאלה — לא מחשבים. מה שלא נתון — מחלצים.</KeyCard>
      </>
    ),
    check: quiz("emp-exam-order", [{ q: "למה בשנה השנייה של שאלה אין להשתמש בשיעור של תחילת השנה לסגירה, כשהריבית ירדה בדצמבר?", options: ["כי הסגירה נמדדת בריבית סוף השנה", "כי זה יגדיל את ה-P.N.", "מותר", "כי הריבית שייכת לשירות"], answer: 0, why: "סגירה — נתוני סוף השנה." }]),
  },
  "emp-exam-a": {
    lead: "שאלה 1: שתי מחלקות, שני מענקים בשני סוגי שיוך, שנתיים — קראו, וסרקו בחמש השאלות.",
    body: (
      <>
        <Story icon={<Building />} title={`תעשיות גל־אור בע״מ — מענקי פרישה, ${y1}–${y2}`}>
          <p>
            <strong>מחלקת ההרכבה.</strong> מענק חד־פעמי בסיום ההעסקה: עד {EXAM_A.assembly.early.upTo} שנות עבודה — <Money v={EXAM_A.assembly.early.perYear} /> לכל שנה; מעל {EXAM_A.assembly.early.upTo} —{" "}
            <Money v={EXAM_A.assembly.later.first} /> לכל אחת מ-{EXAM_A.assembly.early.upTo} השנים הראשונות ו-<Money v={EXAM_A.assembly.later.beyond} /> לכל שנה נוספת, עד תקרה של <Money v={EXAM_A.assembly.cap} />.
          </p>
          <Wide>
            <DataTable
              head={["קבוצה (שנת כניסה)", "עובדים", "שנות עבודה צפויות"]}
              rows={EXAM_A.assembly.groups.map((g) => [`1.1.${g.from}`, g.heads, g.years])}
            />
          </Wide>
          <p>
            ב-1.7.{y2} הוחלט על מענק נוסף של <Money v={EXAM_A.assembly.amendment.grant} /> לכל מי שיעבוד {EXAM_A.assembly.amendment.minYears} שנים לפחות, שנצבר על {EXAM_A.assembly.amendment.minYears} שנים. שיעור
            ההיוון {pct(EXAM_A.assembly.rate)}, ובדצמבר {y2} ירד ל-{pct(EXAM_A.assembly.endRate)}.
          </p>
          <p>
            <strong>מחלקת השטח.</strong> מענק של <Money v={EXAM_A.field.grant} /> למי שעבד יותר מ-{EXAM_A.field.serviceYears} שנים, או שסיים את העסקתו אחרי גיל {EXAM_A.field.age}; השיוך לפי הסיבה שבגללה העובד
            יהיה זכאי.
          </p>
          <Wide>
            <DataTable
              head={["קבוצה", "עובדים", "כניסה", "גיל בכניסה", "שנות עבודה צפויות"]}
              rows={EXAM_A.field.groups.map((g) => [g.id === "older" ? "ותיקים" : g.id === "young" ? "צעירים" : "ארוכי טווח", g.heads, `1.1.${g.from}`, g.ageAtStart, g.years])}
            />
          </Wide>
          <p>
            לקראת סוף {y2} עזבו {EXAM_A.field.leavers.heads} עובדים מקבוצת ארוכי הטווח, והשיעור ירד מ-{pct(EXAM_A.field.rate)} ל-{pct(EXAM_A.field.endRate)}.
          </p>
        </Story>
        <Card title="נדרש">
          <p>מעגל ההתחייבות של {y1} ושל {y2}, לכל מחלקה בנפרד.</p>
        </Card>
      </>
    ),
  },
  "emp-exam-a-solve": {
    lead: "אני פותר: טבלת קבוצות, ואז הצעדים לפי הסדר — שנה בלי חדשות, ושנה עם תיקון וירידת ריבית.",
    body: (
      <Wide>
        <Stepper
          label="מחלקת ההרכבה"
          steps={[
            {
              title: "סריקה",
              body: (
                <p>
                  מענק בסיום ההעסקה בגין שירות — הטבה לאחר סיום העסקה. הנוסחה קופצת בשנים המאוחרות — קו ישר (סעיף 73) — והתקרה מושגת אחרי {asm.groups[0].grants[0].window} שנים: <Money v={assemblyBenefit(asm.groups[0].grants[0].window)} />.
                </p>
              ),
            },
            {
              title: "טבלת קבוצות",
              body: (
                <DataTable
                  head={["קבוצה", "עובדים", "צפויות", "הטבה", "חלון", "לשנה", `שירות ב-1.1.${y1}`, "n"]}
                  rows={asm.groups.map((g, i) => {
                    const yrs = EXAM_A.assembly.groups[i].years;
                    return [g.id, g.heads, yrs, Math.min(assemblyBenefit(yrs), EXAM_A.assembly.cap), g.grants[0].window, Math.round(g.grants[0].perYear), g.served, g.nEnd + 1];
                  })}
                />
              ),
            },
            {
              title: `${y1}: בלי חדשות`,
              body: (
                <RollForward
                  title={`מחלקת ההרכבה — ${y1}`}
                  rows={[
                    { label: "פתיחה", value: asm.year1.opening, kind: "balance", how: `${pct(EXAM_A.assembly.rate)}` },
                    { label: "ריבית", value: asm.year1.interest, how: "שנה שלמה על הפתיחה" },
                    { label: "שירות — מאזן", value: asm.year1.service, how: "אין מידע על שינויים: P.N. אפס" },
                    { label: "P.N.", value: 0, kind: "pn" },
                    { label: "סגירה", value: asm.year1.closing, kind: "balance", how: "עוד שנה לכל קבוצה, n − 1" },
                  ]}
                />
              ),
            },
            {
              title: `${y2}: התיקון`,
              body: (
                <p>
                  המענק הנוסף ({EXAM_A.assembly.amendment.grant.toLocaleString("en-US")} ÷ {EXAM_A.assembly.amendment.minYears} = <Money v={asm.addedPerYear} /> לשנה) — רק לקבוצות {asm.addedTo.join(" ו-")}. שירות עבר ב-1.7: <M v={asm.year2.after} /> −{" "}
                  <M v={asm.year2.before} /> = <strong><M v={asm.year2.pastService} /></strong>.
                </p>
              ),
            },
            {
              title: `${y2}: המעגל`,
              body: (
                <RollForward
                  title={`מחלקת ההרכבה — ${y2}`}
                  rows={[
                    { label: "פתיחה", value: asm.year2.opening, kind: "balance" },
                    { label: "ריבית", value: asm.year2.interest, how: `${Math.round(asm.year2.interestBefore)} על הפתיחה + ${Math.round(asm.year2.interestAfter)} על היתרה אחרי התיקון` },
                    { label: "שירות שוטף", value: asm.year2.service, how: `${Math.round(asm.year2.serviceBefore)} (מהוון מ-30.6) + ${Math.round(asm.year2.serviceAfter)} (מסוף השנה)` },
                    { label: "שירות עבר", value: asm.year2.pastService, how: "ב-1.7, אחרי פחות לפני" },
                    { label: "P.N. — הפסד", value: asm.year2.pn, kind: "pn", how: "ירידת הריבית בדצמבר" },
                    { label: "סגירה", value: asm.year2.closing, kind: "balance", how: `${pct(EXAM_A.assembly.endRate)}` },
                  ]}
                />
              ),
            },
          ]}
        />
      </Wide>
    ),
  },
  "emp-exam-a-field": {
    lead: "פותרים יחד: שיוך לפי סיבת הזכאות — חלון צבירה משלו לכל קבוצה, והיוון עד התשלום.",
    body: (
      <Card title="מחלקת השטח">
        <HintLadder
          task={`בנו את טבלת הקבוצות, ואת המעגלים של ${y1} ו-${y2}.`}
          hints={[
            "לכל קבוצה: מה יקרה קודם — גיל 55 או 12 שנות עבודה? ואם אף אחד — מה אז?",
            "השיוך לפי סיבת הזכאות; ההיוון — עד יום הסיום של הקבוצה.",
            <Wide key="t">
              <DataTable
                head={["קבוצה", "עובדים", "זכאות אחרי", "לשנה", `שירות ב-1.1.${y1}`, "n"]}
                rows={EXAM_A.field.groups.map((g, i) => {
                  const w = fieldWindow(g);
                  return [g.id === "older" ? "ותיקים" : g.id === "young" ? "צעירים" : "ארוכי טווח", g.heads, w ?? "לא זכאים", w ? Math.round(EXAM_A.field.grant / w) : 0, fld.groups[i].served, fld.groups[i].nEnd + 1];
                })}
              />
            </Wide>,
            <span key="r" className="block space-y-2">
              <RollForward
                title={`מחלקת השטח — ${y1}`}
                rows={[
                  { label: "פתיחה", value: fld.year1.opening, kind: "balance" },
                  { label: "ריבית", value: fld.year1.interest },
                  { label: "שירות — מאזן", value: fld.year1.service },
                  { label: "P.N.", value: 0, kind: "pn" },
                  { label: "סגירה", value: fld.year1.closing, kind: "balance" },
                ]}
              />
              <RollForward
                title={`מחלקת השטח — ${y2}`}
                rows={[
                  { label: "פתיחה", value: fld.year2.opening, kind: "balance" },
                  { label: "ריבית", value: fld.year2.interest },
                  { label: "שירות", value: fld.year2.service },
                  { label: "P.N. — הפסד", value: fld.year2.pn, kind: "pn", how: "עזיבה וירידת ריבית — שתיהן שינוי הנחות, לא סילוק" },
                  { label: "סגירה", value: fld.year2.closing, kind: "balance", how: `${EXAM_A.field.groups[2].heads - EXAM_A.field.leavers.heads} בקבוצה הגדולה, ${pct(EXAM_A.field.endRate)}` },
                ]}
              />
            </span>,
          ]}
        />
      </Card>
    ),
  },
  "emp-exam-b": {
    lead: "שאלה 2 במתכונת מבחן: 60 דקות, בלי להסתכל בפתרון — ושלושה נתונים מסתתרים בביאור.",
    body: (
      <>
        <Story icon={<Hotel />} title={`רשת מלונות אופק בע״מ — ${EXAM_B.year} (אלפי ₪)`}>
          <p>
            {EXAM_B.grades.reduce((s, g) => s + g.heads, 0)} עובדים בשלושה דרגים, כולם התחילו ב-1.1.{EXAM_B.startYear} וצפויים לפרוש ב-31.12.{EXAM_B.retireYear}. ההטבה בפרישה: משכורת חודשית אחרונה לכל שנת שירות.
            השכר עולה בתחילת כל שנה.
          </p>
          <Wide>
            <DataTable
              head={["דרג", `עובדים ב-${EXAM_B.year}`, `עובדים ב-30.6.${EXAM_B.year - 1}`, `משכורת ${EXAM_B.year - 1}`, "עלייה שנתית"]}
              rows={EXAM_B.grades.map((g) => [g.id, g.heads, g.headsLastMid, g.salaryLast, pct(g.raise)])}
            />
          </Wide>
          <p>
            <strong>ביאור {EXAM_B.year - 1}:</strong> יתרת פתיחה {EXAM_B.note.openingLast.toLocaleString("en-US")}; עלות ריבית {EXAM_B.note.interestLast.toLocaleString("en-US")}; הטבות ששולמו {EXAM_B.note.paidLast.toLocaleString("en-US")}
            (מהן מהקרן {EXAM_B.note.paidFromAssetsLast.toLocaleString("en-US")}); הפקדה לקרן ב-30.6 — {EXAM_B.note.contributionLast.toLocaleString("en-US")}; שירות עבר {EXAM_B.note.pastServiceLast} (תוספת לדרג {EXAM_B.note.amendedLast}׳ ב-31.12);
            יתרת סגירה {EXAM_B.note.obligation.toLocaleString("en-US")}. נכסי התכנית בסוף השנה: {EXAM_B.note.assets.toLocaleString("en-US")}. כל התשלומים — בסוף השנה.
          </p>
          <p>
            <strong>אירועי {EXAM_B.year}:</strong> ב-30.12 פרשו במפתיע {EXAM_B.leavers.heads} עובדי דרג {EXAM_B.leavers.grade}׳, ושולם להם ב-31.12. ב-31.12 תוקנה התוכנית: דרג {EXAM_B.amendment.grade}׳ מקבל חצי מהתוספת שקיבל דרג{" "}
            {EXAM_B.note.amendedLast}׳ בשנה הקודמת. ב-30.6 מופקד לקרן אותו אחוז מהמשכורת החודשית כמו בשנה הקודמת. מפורשים משולם מהקרן אותו אחוז כמו בשנה הקודמת, והיתר מחשבון הבנק. התשואה על הנכסים
            מעבר להכנסות הריבית: {EXAM_B.excessReturn}.
          </p>
        </Story>
        <Card title="נדרש">
          <ol className="list-inside list-[hebrew] space-y-1">
            <li>מעגל ההתחייבות ל-{EXAM_B.year}.</li>
            <li>מעגל נכסי התכנית ל-{EXAM_B.year}, וההתחייבות נטו.</li>
          </ol>
        </Card>
        <KeyCard icon={<Timer className="h-5 w-5" />}>שימו שעון ל-60 דקות, ופתרו על דף. התשובות נבדקות אחת אחת בתרגול שבסוף השיעור.</KeyCard>
      </>
    ),
  },
  "emp-exam-b-solve": {
    lead: "קודם משחזרים את הנסתר מהביאור — בלי לעגל את השיעור — ורק אז בונים שני מעגלים.",
    body: (
      <Wide>
        <Stepper
          label="שאלה 2 — הפתרון"
          steps={[
            {
              title: "שחזור מהביאור",
              body: (
                <ul className="list-inside list-disc space-y-1 text-[15px]">
                  <li>
                    שיעור: {EXAM_B.note.interestLast} ÷ {EXAM_B.note.openingLast.toLocaleString("en-US")} = <strong>{pct(B.exactRate, 4)}</strong> — לא {pct(BR.rate)}.
                  </li>
                  <li>
                    מהקרן: {EXAM_B.note.paidFromAssetsLast} ÷ {EXAM_B.note.paidLast} = {pct(B.fromAssets)}.
                  </li>
                  <li>
                    הפקדה: {EXAM_B.note.contributionLast} ÷ {B.payrollLast.toLocaleString("en-US")} (כל מי שעבד ב-30.6, כולל מי שפרש בדצמבר) = {pct(B.contributionRate)}.
                  </li>
                  <li>
                    תוספת לדרג {EXAM_B.note.amendedLast}׳: {EXAM_B.note.pastServiceLast} ÷ <K v={B.beforeLast} /> = {pct(B.addedLast)}; דרג {EXAM_B.amendment.grade}׳ יקבל {pct(B.addedNow)}.
                  </li>
                </ul>
              ),
            },
            {
              title: "המשכורות",
              body: (
                <DataTable
                  head={["דרג", `משכורת ${EXAM_B.year}`, "משכורת בפרישה", "תוספת"]}
                  rows={EXAM_B.grades.map((g, i) => [g.id, Math.round(B.salaries[i] * 1000) / 1000, Math.round(B.finals[i] * 1000) / 1000, g.id === EXAM_B.note.amendedLast ? pct(B.addedLast) : g.id === EXAM_B.amendment.grade ? `${pct(B.addedNow)} (מ-31.12)` : "—"])}
                />
              ),
            },
            {
              title: "מעגל ההתחייבות",
              body: (
                <RollForward
                  unit="אלפי ₪"
                  title={`התחייבות — ${EXAM_B.year}`}
                  rows={[
                    { label: "פתיחה (נתונה)", value: B.obligation.opening, kind: "balance" },
                    { label: "ריבית", value: B.obligation.interest, how: `${pct(B.exactRate, 4)} × הפתיחה` },
                    { label: "שירות שוטף", value: B.obligation.service, how: `שנה אחת לכל עובד, n = ${B.nEnd}` },
                    { label: "שירות עבר", value: B.obligation.pastService, how: `דרג ${EXAM_B.amendment.grade}׳, ${pct(B.addedNow)} על ${B.servedEnd} שנים` },
                    { label: "תשלומים", value: -B.obligation.payments, how: `${EXAM_B.leavers.heads} × משכורת × ${B.servedEnd}` },
                    { label: "P.N. — הפסד", value: B.obligation.pn, kind: "pn", how: "הפרישה המפתיעה, והנחות אחרות" },
                    { label: "סגירה", value: B.obligation.closing, kind: "balance", how: `${B.servedEnd} שנים, n = ${B.nEnd}` },
                  ]}
                />
              ),
            },
            {
              title: "מעגל הנכסים",
              body: (
                <RollForward
                  unit="אלפי ₪"
                  title={`נכסי תכנית — ${EXAM_B.year}`}
                  rows={[
                    { label: "פתיחה", value: B.assets.opening, kind: "balance" },
                    { label: "הכנסות ריבית", value: B.assets.interest, how: `${Math.round(B.assets.interestOnOpening)} על הפתיחה + ${Math.round(B.assets.interestOnContribution)} על ההפקדה, חצי שנה` },
                    { label: "הפקדה", value: B.assets.contribution, how: `${pct(B.contributionRate)} × ${Math.round(B.assets.payroll)}` },
                    { label: "שולם מהקרן", value: -B.assets.paid, how: `${pct(B.fromAssets)} מהתשלומים` },
                    { label: "P.N. — רווח", value: B.assets.pn, kind: "pn", how: "נתון" },
                    { label: "סגירה", value: B.assets.closing, kind: "balance" },
                  ]}
                />
              ),
            },
            {
              title: "נטו, ועיגול",
              body: (
                <div className="space-y-2">
                  <p>
                    התחייבות נטו: <K v={B.obligation.closing} /> − <K v={B.assets.closing} /> = <strong><K v={B.net} /></strong> אלפי ₪.
                  </p>
                  <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[14.5px]">
                    מי שעיגל את השיעור ל-{pct(BR.rate)} יקבל ריבית <K v={BR.obligation.interest} />, סגירה <K v={BR.obligation.closing} />, P.N. <K v={BR.obligation.pn} /> ונטו <K v={BR.net} />. ההבדל הוא העיגול בלבד — ולכן לפעמים יש שתי
                    גרסאות לפתרון. בדקו מה המרצה מבקש.
                  </p>
                </div>
              ),
            },
          ]}
        />
      </Wide>
    ),
  },
  "emp-exam-master": {
    lead: "מבחן הוא סדר עבודה — סריקה, טבלת קבוצות, פתיחה, ריבית, שירות, שירות עבר, סגירה — ו-P.N. מאזנת.",
    body: (
      <>
        <ExplainTask task="ציון עצמי: מה היו שלוש הנקודות הקשות בשאלה 2, ואיך פתרתם כל אחת?" model={`שחזור אחוז ההפקדה — על כל מי שעבד ב-30.6, כולל מי שפרש אחר כך; שירות עבר על כל ${B.servedEnd} שנות השירות, גם כשהתיקון בסוף השנה; והכנסות הריבית על הנכסים — באותו שיעור כמו ההתחייבות, וחצי שנה בלבד על ההפקדה.`} />
        <Bridge summary="מבחן הוא סדר עבודה: סריקה, טבלת קבוצות, פתיחה, ריבית, שירות, שירות עבר, סגירה ו-P.N. מאזנת.">זה סוף חומר הלימוד. המסך הבא הוא דף סיכום לפני מבחן — אפשר להדפיס אותו.</Bridge>
      </>
    ),
    check: quiz("emp-exam-master", [
      { q: "איזו שורה במעגל מאזנת, ולמה לא מחשבים אותה?", options: ["P.N. — היא מה שנשאר אחרי כל השורות שנתונות או ניתנות לחישוב", "השירות — כי הוא תלוי בשכר", "הריבית", "הסגירה"], answer: 0, why: "P.N. היא תמיד ההפרש." },
      { q: "בשאלה 1 — מה ההטבה של קבוצת 2016 בהרכבה, ולמה?", options: [`${EXAM_A.assembly.cap.toLocaleString("en-US")} — התקרה כבר מומשה`, "חישוב לפי 15 שנה בנוסחה", "4,000", "אפס"], answer: 0, why: "אחרי 10 שנים התקרה מושגת." },
      { q: `בשנה השנייה של שאלה 1, למה הסגירה לא ב-${pct(EXAM_A.assembly.rate)}?`, options: ["כי הריבית ירדה בדצמבר, והסגירה בריבית סוף השנה", "כי זו שנה של תיקון", "היא כן ב-6%", "כי השירות השתנה"], answer: 0, why: "סגירה — שיעור סוף השנה." },
      { q: "בשאלה 2 — מה ההבדל בין שירות העבר ל-P.N.?", options: ["שירות עבר מהחלטת החברה (התיקון); P.N. מהפרישה המפתיעה ומהנחות אחרות", "אין הבדל", "שירות עבר ב-OCI", "P.N. ברווח והפסד"], answer: 0, why: "מקור שונה, כתובת שונה." },
      { q: "איך משחזרים את אחוז ההפקדה?", options: ["ההפקדה בשנה הקודמת ÷ השכר החודשי של כל מי שהועסק ב-30.6 של אותה שנה", "ההפקדה ÷ השכר של השנה הנוכחית", "ההפקדה ÷ ההתחייבות", "אי אפשר"], answer: 0, why: "כולל מי שפרש אחר כך." },
      { q: "באיזה שיעור — הכנסות ריבית על הנכסים?", options: ["באותו שיעור ובאותה חלוקה לתקופות כמו ההתחייבות", "בתשואה בפועל"], answer: 0, why: "IAS 19.125." },
    ]),
  },
  "emp-cheatsheet": {
    lead: "לקריאה בלילה שלפני המבחן, אחרי שעברתם את השיעורים. מספרי הסעיפים — של IAS 19.",
    body: (
      <Wide>
        <section className="card print-sheet space-y-5 p-5" aria-labelledby="ias19-sheet-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="ias19-sheet-title" className="text-xl font-bold text-fg">
              דף סיכום למבחן · <span dir="ltr">IAS 19</span>
            </h3>
            <PrintButton icon={<Printer className="h-4 w-4" />} />
          </div>

          <div>
            <h4 className="mb-2 font-bold text-fg">א. מתכון חמשת הצעדים ({lessonRef("ias19-measure")})</h4>
            <p className="mb-2 text-[15px] font-semibold">
              התחייבות = <span dir="ltr">① × ② × ③ ÷ (1+i)ⁿ</span>
            </p>
            <DataTable
              head={["צעד", "מה עושים", "הערה"]}
              rows={[
                [CIRCLED[0], "הטבה לשנה = ההטבה הצפויה בפרישה (לפי השכר החזוי) ÷ שנות הצבירה", `שנות שירות או שנות צבירה (${lessonRef("ias19-attribute")})`],
                [CIRCLED[1], RECIPE_STEPS[1], "רק שנים שמקנות זכאות"],
                [CIRCLED[2], "עובדים צפויים = כמות × הסתברות להישאר ולקבל", "רק מי שצפוי לקבל"],
                [CIRCLED[3], "n = שנים עד התשלום", "לא שנות הצבירה"],
                [CIRCLED[4], "i = תשואה על אג״ח קונצרניות איכותיות במועד המדידה", "סעיף 83; בישראל השוק עמוק — הממשלתית היא פיתיון"],
              ]}
            />
          </div>

          <div>
            <h4 className="mb-2 font-bold text-fg">ב. מעגל התחייבות: איזו ריבית ואיזה n בכל שורה ({lessonsRef("ias19-rollforward", "ias19-amend")})</h4>
            <DataTable
              head={["שורה", "ריבית", "n או תקופה", "הערות"]}
              rows={[
                ["יתרת פתיחה", "הריבית שבה נמדדה בסגירת השנה הקודמת", "—", "הסגירה של השנה הקודמת"],
                ["ריבית", "תחילת התקופה", "שנה שלמה, או (1+i)^(m÷12) − 1 לחלק שנה", "תשלום באמצע שנה מקטין את הריבית מיומו (סעיף 123)"],
                ["עלות שירות שוטף", "תחילת השנה (בפיצול: תחילת כל תת־תקופה)", "n מסוף התקופה שאליה מתייחסת העלות", "בשינוי באמצע שנה — שתי תקופות"],
                ["עלות שירות עבר", "הריבית ביום התיקון", "n מיום התיקון עד התשלום", "אחרי פחות לפני, לרווח והפסד מיד (סעיפים 102–103)"],
                ["תשלומים", "—", "לפי המציאות", "סילוק: התחייבות פחות תשלום, לרווח והפסד (סעיפים 109–111)"],
                ["P.N.", "—", "—", "שורה מאזנת; ב-OCI ולא מסווגת מחדש (סעיפים 57, 122)"],
                ["יתרת סגירה", "ריבית סוף השנה", "n מסוף השנה", "נתוני סוף השנה"],
              ]}
            />
          </div>

          <div>
            <h4 className="mb-2 font-bold text-fg">ג. איפה כל תנועה נרשמת</h4>
            <DataTable
              head={["תנועה", "הטבה מוגדרת", "הטבה אחרת לזמן ארוך", "הטבת פיטורין"]}
              rows={[
                ["עלות שירות שוטף", <span key="1"><DestTag to="pl" /> (שכר)</span>, <span key="2"><DestTag to="pl" />, בלי הפרדה בין שוטף לעבר</span>, "אין ייחוס לשנות שירות (סעיף 170)"],
                ["שירות עבר", <span key="3"><DestTag to="pl" /> מיד</span>, <DestTag key="4" to="pl" />, "לא רלוונטי"],
                ["ריבית נטו", <span key="5"><DestTag to="pl" /> (מימון או שכר, לפי מדיניות)</span>, <DestTag key="6" to="pl" />, "רק אם משולם אחרי יותר מ-12 חודשים — ואז כמו הטבה אחרת לזמן ארוך"],
                ["P.N.", <span key="7"><DestTag to="oci" />, ללא העברה לרווח והפסד</span>, <DestTag key="8" to="pl" />, <span key="9">תוך 12 חודשים: אין; אחרת: <DestTag to="pl" /> (סעיף 169)</span>],
                ["סילוק", <DestTag key="10" to="pl" />, "—", "—"],
                ["יתרות", <span key="11"><DestTag to="bs" /> — נטו</span>, <DestTag key="12" to="bs" />, <DestTag key="13" to="bs" />],
                ["מועד ההכרה", "לאורך השירות", "לאורך השירות", "מלוא הסכום במוקדם מבין הצעה שאינה ניתנת לביטול והכרה בהפרשה לארגון מחדש (סעיף 165)"],
              ]}
            />
          </div>

          <div>
            <h4 className="mb-2 font-bold text-fg">ד. נכסי תוכנית ותקרה ({lessonRef("ias19-assets")})</h4>
            <ul className="list-inside list-disc space-y-1 text-[15px]">
              <li>התחייבות נטו = התחייבות פחות שווי הוגן של הנכסים (סעיף 113).</li>
              <li>הכנסות ריבית על נכסים: אותו שיעור ואותו פיצול תקופות כמו על ההתחייבות (סעיף 125).</li>
              <li>הפקדה באמצע שנה מרוויחה ריבית חלקית בלבד: (1+i) בחזקת (m ÷ 12) פחות 1.</li>
              <li>רק תשלום שיצא מהנכסים מקטין את הנכסים; ההתחייבות קטנה בכל התשלום.</li>
              <li>נכס נטו = הנמוך מבין (נכסים פחות התחייבות) והתקרה (סעיף 64). ההפרש בין התשואה בפועל לריבית — ב-OCI.</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2 font-bold text-fg">ה. מלכודות שחוזרות במבחן</h4>
            <ol className="list-inside list-decimal space-y-1 text-[15px]">
              <li>הריבית הממשלתית היא פיתיון; משתמשים בתשואת אג״ח קונצרניות איכותיות.</li>
              <li>מחלקים לשנים לפי נוסחת התוכנית — אלא אם השנים המאוחרות גבוהות מהותית: אז קו ישר (סעיפים 71, 73).</li>
              <li>תקרה מקצרת את חלון הצבירה, ואינה מקטינה את הסכום לשנה.</li>
              <li>צבירה מתחילה רק משעה שהשירות מקנה זכאות.</li>
              <li>מהוונים לפי השנים עד התשלום, לא לפי שנות הצבירה.</li>
              <li>ריבית ועלות שירות שוטף — לפי ריבית תחילת התקופה; הסגירה — לפי ריבית סוף השנה.</li>
              <li>בשינוי באמצע שנה מפצלים את השנה: הריבית על היתרה אחרי השינוי, לא על הפתיחה.</li>
              <li>P.N. היא שורה מאזנת; לעולם לא ממציאים אותה ישירות.</li>
              <li>פרישה לפי התנאים המקוריים, גם אם מוקדמת מהצפוי, אינה סילוק: היא P.N. ב-OCI.</li>
              <li>סילוק הוא רק עסקה שמבטלת את ההתחייבות החוקית או המשתמעת לגבי חלק מההטבות או כולן, מעבר לתשלום שנקבע בתנאי התוכנית (סעיפים 109–111).</li>
              <li>הטבה אחרת לזמן ארוך: הכול לרווח והפסד, בלי OCI.</li>
              <li>פיטורין: ההכרה במוקדם משני מועדים; תוספת המותנית בשירות נוסף היא הטבה בגין שירות, לא פיטורין.</li>
              <li>מה שנתון בשאלה לא מחשבים מחדש. שחזור ריבית ואחוזים מביאור — בלי עיגול ביניים, ורק כשאין תשלומים או שינויים באמצע השנה.</li>
            </ol>
          </div>
        </section>
      </Wide>
    ),
  },
};
