import { ArrowLeftRight, Building2, CalendarClock, Cog, Landmark, Printer, Repeat, Scale, Truck, Wrench } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import type { ScreenContent } from "@/components/study-mode/shell";
import { DataTable } from "@/components/study/blocks";
import { LOGI_Q, logi, PRESS_Q, press } from "@/lib/learn/ias16-exams";
import { BACKUP, PLOT } from "@/lib/study/ias16/lessons/land";
import { CHECK, PROP, PROP_ACCUM, PROP_GROSS, SALE } from "@/lib/study/ias16/lessons/revalue";
import { MOTOR, MOTOR_RATE, TANK, TANK_LOSS } from "@/lib/study/ias16/lessons/subsequent";
import { DEAL, FLEET, FLEET_EACH } from "@/lib/study/ias16/lessons/swap";
import { YEAR, YEAR_DEP } from "@/lib/study/ias16/lessons/worksheet";
import { AnswerCheck, MiniQuiz } from "./inventory-interactive";
import { ChainChips, MoreDialog, Reveal, Sorted, Story } from "./inventory-teach";
import { Card, KeyCard, Money, Rule, type Step, Stepper, Wide } from "./ui";

/** The concept screens of lessons 7–12 of the fixed-assets course: subsequent costs, exchanges, revaluation, the answer sheet and the two exam questions. */

/** Steps or items made on the server and handed to a client component: each needs a key. */
const keyed = (xs: ReactNode[]) => xs.map((x, i) => <Fragment key={i}>{x}</Fragment>);
const n = (v: number) => v.toLocaleString("he-IL", { maximumFractionDigits: 2 });
const quiz = (chapter: string, items: Parameters<typeof MiniQuiz>[0]["items"]) => <MiniQuiz bare prefix="ias16" chapter={chapter} items={items} />;

const tankAccum = (TANK.tank / TANK.life) * TANK.years;
const propCarrying = PROP.cost - (PROP.cost / PROP.life) * PROP.years;
const checkCostModel = CHECK.cost - ((CHECK.cost - CHECK.land) / CHECK.life) * CHECK.years;

// ---------------------------------------------------------------------------
// Lesson 12: the two questions.

const P = press();
const L = logi();
const pct = (v: number) => `${Math.round(v * 100)}%`;
const months = 13 - PRESS_Q.availableMonth;

const pressSteps: Step[] = [
  {
    title: "1 · עלות המכונה",
    body: (
      <DataTable
        head={["תשלום", "בעלות", "הוצאה"]}
        rows={[
          ["מחיר", PRESS_Q.price, ""],
          ["הובלה", PRESS_Q.transport, ""],
          ["הרכבה והתקנה", PRESS_Q.install, ""],
          [`עובדי החברה (${PRESS_Q.staffHours} × ${PRESS_Q.hourly})`, PRESS_Q.staffHours * PRESS_Q.hourly, ""],
          ["בדיקות תקינות", PRESS_Q.testing, ""],
          [`יועצים — התקנה ${pct(1 - PRESS_Q.consultantsChoosing)} / בחירה ${pct(PRESS_Q.consultantsChoosing)}`, P.consultantsIn, PRESS_Q.consultants * PRESS_Q.consultantsChoosing],
          ["הדרכת עובדים", "", PRESS_Q.training],
          ["אירוע השקה", "", PRESS_Q.launch],
        ]}
        foot={["סה״כ", P.cost, P.expensed2024]}
      />
    ),
  },
  {
    title: "2 · ציר זמן וחלוקה לרכיבים",
    body: (
      <>
        <p>
          הפחת מתחיל ב-1.{PRESS_Q.availableMonth}.2024 — המכונה זמינה; השביתה עד 1.{PRESS_Q.startedMonth} לא דוחה אותו. ב-2024: {months} חודשים.
        </p>
        <DataTable
          head={["רכיב", "עלות", "שיטה"]}
          rows={[
            ["ראש הדפסה", P.parts.head, `סכום ספרות יורד, ${PRESS_Q.head.life} שנים`],
            ["שלדה", P.parts.frame, `קו ישר, ${PRESS_Q.frame.life} שנים, גרט ${n(PRESS_Q.frame.salvage)}`],
            ["מנוע", P.parts.motor, `תפוקה, ${n(PRESS_Q.motor.hours)} שעות, גרט ${n(PRESS_Q.motor.salvage)}`],
          ]}
        />
      </>
    ),
  },
  {
    title: "3 · ראש ההדפסה: שנות חיים מול שנות כספים",
    body: (
      <Reveal
        steps={keyed([
          <>
            שנת חיים 1 (1.4.24–31.3.25): <Money v={P.parts.head} plain /> × 4/10 = <Money v={P.headLife[0]} />. שנת חיים 2: × 3/10 = <Money v={P.headLife[1]} />.
          </>,
          <>
            2024: {months}/12 משנת חיים 1 = <Money v={P.head[0]} />.
          </>,
          <>
            2025: 3/12 משנת חיים 1 + 9/12 משנת חיים 2 = <Money v={P.head[1]} />.
          </>,
        ])}
      />
    ),
  },
  {
    title: "4 · השלדה בקו ישר",
    body: (
      <p>
        (<Money v={P.parts.frame} plain /> − <Money v={PRESS_Q.frame.salvage} plain />) ÷ {PRESS_Q.frame.life} = <Money v={P.frameAnnual} /> לשנה. 2024 ({months} חודשים): <Money v={P.frame[0]} />; 2025:{" "}
        <Money v={P.frame[1]} />.
      </p>
    ),
  },
  {
    title: "5 · המנוע: לפני השיפור ואחריו",
    body: (
      <Reveal
        steps={keyed([
          <>
            פחת לשעה: (<Money v={P.parts.motor} plain /> − <Money v={PRESS_Q.motor.salvage} plain />) ÷ {n(PRESS_Q.motor.hours)} = {n(P.rate1)} ₪. 2024: {n(PRESS_Q.motor.used2024)} שעות ={" "}
            <Money v={P.motor[0]} />.
          </>,
          <>
            ינואר–יוני 2025: {n(PRESS_Q.motor.firstHalf2025)} שעות = <Money v={P.rate1 * PRESS_Q.motor.firstHalf2025} />. ערך בספרים ביום השיפור: <Money v={P.motorCarryingAtImprovement} />.
          </>,
          <>
            בסיס חדש: <Money v={P.motorCarryingAtImprovement} plain /> + <Money v={PRESS_Q.improvement} plain /> − <Money v={PRESS_Q.motor.salvage} plain />, על {n(P.hoursLeft)} + {n(PRESS_Q.extraHours)} שעות ={" "}
            {n(P.rate2)} ₪ לשעה.
          </>,
          <>
            יולי–דצמבר: {n(PRESS_Q.motor.secondHalf2025)} שעות × {n(P.rate2)} = <Money v={P.rate2 * PRESS_Q.motor.secondHalf2025} />. פחת המנוע 2025: <Money v={P.motor[1]} />.
          </>,
        ])}
      />
    ),
  },
  {
    title: "6 · יתרות והחלפה",
    body: (
      <>
        <DataTable
          head={["", "31.12.2024", "31.12.2025 (לפני ההחלפה)"]}
          rows={[
            ["עלות", P.cost, P.cost2025],
            ["פחת נצבר", -P.accum2024, -P.accum2025],
            ["עלות מופחתת", P.carrying2024, P.carrying2025],
          ]}
        />
        <p>
          החלפה עם מהות מסחרית: רווח <Money v={PRESS_Q.fairValue} plain /> − <Money v={P.carrying2025} plain /> = <Money v={P.gain} />. המכונה החדשה: <Money v={PRESS_Q.fairValue} plain /> −{" "}
          <Money v={PRESS_Q.cashIn} plain /> = <Money v={P.newCost} />.
        </p>
      </>
    ),
  },
  {
    title: "7 · רווח או הפסד",
    body: (
      <DataTable
        head={["", "2024", "2025"]}
        rows={[
          ["הוצאות פחת", -P.dep[0], -P.dep[1]],
          ["הדרכה, השקה ויועצי בחירה", -P.expensed2024, 0],
          ["אחזקה שוטפת", 0, -PRESS_Q.maintenance],
          ["רווח מהחלפת נכסים", 0, P.gain],
        ]}
      />
    ),
  },
];

const T = LOGI_Q.trucks;
const logiSteps: Step[] = [
  {
    title: "1 · עלות, וקרקע מול מבנה",
    body: (
      <p>
        <Money v={LOGI_Q.price} plain /> × {100 + (LOGI_Q.purchaseTax + LOGI_Q.lawyer) * 100}% = <Money v={L.cost} />. קרקע {pct(LOGI_Q.land)}: <Money v={L.landCost} />; מבנה:{" "}
        <Money v={L.buildingCost} /> ÷ {LOGI_Q.life} = <Money v={L.dep2023} /> לשנה.
      </p>
    ),
  },
  {
    title: "2 · 31.12.2023: הערכה ראשונה",
    body: (
      <DataTable
        head={["", "מבנה", "קרקע"]}
        rows={[
          ["ערך בספרים לפני", L.carrying2023, L.landCost],
          [`שווי הוגן (${n(LOGI_Q.fair[0])} בחלוקה)`, L.fair2023.building, L.fair2023.land],
          ["לקרן (רווח כולל אחר)", L.surplusBuilding2023, L.surplusLand2023],
        ]}
        foot={["קרן ב-31.12.2023", L.oci2023, ""]}
      />
    ),
  },
  {
    title: "3 · 2024: פחת חדש והעברה לעודפים",
    body: (
      <p>
        יתרת חיים {LOGI_Q.life - 1} שנים: פחת <Money v={L.fair2023.building} plain /> ÷ {LOGI_Q.life - 1} = <Money v={L.dep2024} />. העברה: <Money v={L.surplusBuilding2023} plain /> ÷ {LOGI_Q.life - 1} ={" "}
        <Money v={L.transfer2024} /> (ח׳ קרן / ז׳ עודפים). ערך המבנה לפני ההערכה: <Money v={L.carryingBuilding2024} />; קרן המבנה: <Money v={L.surplusBuildingBefore} />.
      </p>
    ),
  },
  {
    title: "4 · 31.12.2024: ירידה",
    body: (
      <DataTable
        head={["", "מבנה", "קרקע"]}
        rows={[
          ["ערך לפני", L.carryingBuilding2024, L.fair2023.land],
          ["שווי הוגן", L.fair2024.building, L.fair2024.land],
          ["ירידה", -L.buildingFall, -L.landFall],
          ["מהקרן", -L.buildingFall, -L.surplusLand2023],
          ["הפסד ברווח או הפסד", 0, -L.landLoss],
          ["קרן אחרי", L.surplusBuilding2024, 0],
        ]}
      />
    ),
  },
  {
    title: "5 · 1.1.2025: המכירה",
    body: (
      <p>
        ערך בספרים <Money v={L.carryingAtSale} plain />, תמורה <Money v={LOGI_Q.salePrice} plain />: רווח <Money v={L.saleGain} />. הקרן — <Money v={L.surplusAtSale} /> — ח׳ קרן הערכה מחדש / ז׳
        עודפים.
      </p>
    ),
  },
  {
    title: "6 · המשאיות",
    body: (
      <Reveal
        steps={keyed([
          <>
            כל משאית: (<Money v={T.each} plain /> − <Money v={T.salvage} plain />) ÷ {T.life} = <Money v={L.truck.annual} /> לשנה, מ-1.{T.availableMonth}.2023 (לא מיום הקנייה).
          </>,
          <>
            2023: 4 חודשים × {T.count} = <Money v={L.truck.dep2023} />; 2024: <Money v={L.truck.dep2024} />.
          </>,
          <>
            המשאית שנמכרה ב-1.{T.soldMonth}.2025: פחת עד המכירה <Money v={L.truck.soldDep2025} />, נצבר <Money v={L.truck.soldAccum} />, ערך בספרים <Money v={L.truck.soldCarrying} />; תמורה{" "}
            <Money v={T.salePrice} plain /> — הפסד <Money v={-L.truck.result} />.
          </>,
          <>
            שלוש שנשארו, 31.12.2025: עלות <Money v={L.truck.keptCost} plain />, פחת נצבר <Money v={L.truck.keptAccum2025} plain />, עלות מופחתת{" "}
            <Money v={L.truck.keptCost - L.truck.keptAccum2025} />. פחת 2025 כולו: <Money v={L.truck.dep2025} />.
          </>,
        ])}
      />
    ),
  },
  {
    title: "7 · הדוחות",
    body: (
      <DataTable
        head={["", "2023", "2024", "2025"]}
        rows={[
          ["פחת מבנה", -L.dep2023, -L.dep2024, 0],
          ["פחת משאיות", -L.truck.dep2023, -L.truck.dep2024, -L.truck.dep2025],
          ["הפסד מירידת ערך (קרקע)", 0, -L.landLoss, 0],
          ["רווח ממכירת הנכס", 0, 0, L.saleGain],
          ["הפסד ממכירת משאית", 0, 0, L.truck.result],
          ["רווח כולל אחר", L.oci2023, L.oci2024, 0],
        ]}
      />
    ),
  },
];

export const IAS16_COURSE_MORE_SCREENS: Record<string, ScreenContent> = {
  // ---------------------------------------------------------------- lesson 7
  "ppe-replace": {
    lead: "כשמחליפים חלק של נכס, החלק הישן יוצא מהספרים — עם העלות שלו והפחת שנצבר עליו — והחדש נכנס לעלות. מה שנשאר מהישן הוא הפסד.",
    body: (
      <>
        <Story icon={<Wrench />} title={`מערכת ייצור ב-${n(TANK.system)} ₪, ${TANK.life} שנים, מופחתת כיחידה אחת`}>
          <p>
            מתוך העלות, מכל קרמיקה עלה <Money v={TANK.tank} />. אחרי {TANK.years} שנים המכל נשבר והוחלף בחדש באותו מחיר.
          </p>
        </Story>
        <Reveal
          steps={keyed([
            <>
              המכל הישן נשא פחת: <Money v={TANK.tank} plain /> ÷ {TANK.life} × {TANK.years} = <Money v={tankAccum} />.
            </>,
            <>
              גריעה: ח׳ פחת נצבר {n(tankAccum)}, ח׳ הפסד {n(TANK_LOSS)} / ז׳ מערכת ייצור {n(TANK.tank)}.
            </>,
            <>
              המכל החדש: ח׳ מערכת ייצור {n(TANK.tank)} / ז׳ מזומן — ומופחת מעכשיו על מה שנותר.
            </>,
          ])}
        />
        <KeyCard>גם כשהנכס מופחת כיחידה אחת, את החלק שהוחלף מוציאים. אחרת שני מכלים — הישן והחדש — יושבים בספרים יחד.</KeyCard>
      </>
    ),
    check: quiz("ppe-replace", [
      {
        q: "הוחלף גג שעלותו 50,000 ₪ והפחת שנצבר עליו 35,000 ₪. מה ההפסד?",
        options: ["15,000 ₪", "50,000 ₪", "35,000 ₪", "0"],
        answer: 0,
        why: "מה שנשאר ממנו בספרים: 50,000 − 35,000.",
      },
      {
        q: "והגג החדש?",
        options: ["נכנס לעלות המבנה", "הוצאת תיקונים", "נכס נפרד שלא מופחת", "מקטין את ההפסד"],
        answer: 0,
        why: "החלפת רכיב שעומדת בתנאי ההכרה מהוונת.",
      },
    ]),
  },
  "ppe-estimate": {
    lead: "אורך חיים, ערך גרט ושיטת פחת הם אומדנים — ובודקים אותם כל שנה. כשהם משתנים, לא מתקנים אחורה: מפחיתים את הערך בספרים על מה שנותר, מעכשיו.",
    body: (
      <>
        <Story icon={<CalendarClock />} title="מנוע שמופחת לפי שעות — ושיפור באמצע השנה">
          <p>
            ערכו בספרים ביום השיפור <Money v={MOTOR.carrying} />, גרט <Money v={MOTOR.salvage} plain />, נותרו {n(MOTOR.hoursLeft)} שעות. השיפור — <Money v={MOTOR.improvement} plain /> — הוסיף{" "}
            {n(MOTOR.extraHours)} שעות.
          </p>
        </Story>
        <Rule>
          פחת לשעה מעכשיו: (<Money v={MOTOR.carrying} plain /> + <Money v={MOTOR.improvement} plain /> − <Money v={MOTOR.salvage} plain />) ÷ ({n(MOTOR.hoursLeft)} + {n(MOTOR.extraHours)}) ={" "}
          {n(MOTOR_RATE)} ₪
        </Rule>
        <KeyCard>אחרי שיפוץ או שינוי אומדן — הכול מתחיל מהיום הזה: ערך בספרים, יתרת חיים (או תפוקה), גרט ושיטה מעודכנים.</KeyCard>
        <MoreDialog label="גם השיטה יכולה להשתנות">
          <p>אם אחרי השיפוץ החברה קובעת שיטה אחרת (למשל סכום ספרות במקום קו ישר), מיישמים אותה על הבסיס החדש, על יתרת החיים — שוב, מכאן ולהבא.</p>
        </MoreDialog>
      </>
    ),
    check: quiz("ppe-estimate", [
      {
        q: "ערך בספרים 60,000 ₪; האומדן עודכן: נותרו 4 שנים, בלי גרט. מה הפחת השנתי?",
        options: ["15,000 ₪", "תלוי בעלות המקורית", "6,000 ₪", "60,000 ₪"],
        answer: 0,
        why: "60,000 ÷ 4.",
      },
      {
        q: "האם מתקנים את הפחת של השנים הקודמות כשהאומדן משתנה?",
        options: ["לא — מכאן ולהבא", "כן", "רק אם האומדן ירד", "רק בקו ישר"],
        answer: 0,
        why: "שינוי אומדן אינו טעות — הוא מידע חדש.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 8
  "ppe-swap-rule": {
    lead: "בהחלפת נכסים שואלים שתי שאלות: יש לעסקה מהות מסחרית? ואפשר למדוד שווי הוגן? אם כן — שווי הוגן ורווח; אם לא — ערך בספרים, בלי רווח.",
    body: (
      <>
        <Wide>
          <ChainChips items={["פחת עד יום ההחלפה", "יש מהות מסחרית?", "אפשר למדוד שווי הוגן?", "עלות הנכס החדש", "רווח או הפסד"]} />
        </Wide>
        <Story icon={<ArrowLeftRight />} title={`נכס בערך בספרים ${n(DEAL.carrying)} ₪, הוחלף בנכס אחר + ${n(DEAL.cashIn)} ₪ במזומן`}>
          <DataTable
            head={["מצב", "עלות הנכס שהתקבל", "רווח"]}
            rows={[
              [`מהות מסחרית; שווי מה שנמסר ${n(DEAL.fairGiven)}`, DEAL.fairGiven - DEAL.cashIn, DEAL.fairGiven - DEAL.carrying],
              [`מהות מסחרית; שווי מה שהתקבל ${n(DEAL.fairReceived)} — ראיה ברורה יותר`, DEAL.fairReceived, DEAL.fairReceived + DEAL.cashIn - DEAL.carrying],
              ["אין מהות מסחרית", DEAL.carrying - DEAL.cashIn, 0],
            ]}
          />
        </Story>
        <KeyCard>מזומן שקיבלנו מקטין את עלות הנכס החדש; מזומן ששילמנו מגדיל אותה. הרווח הוא תמיד: שווי מה שנמסר − הערך בספרים שלו.</KeyCard>
        <MoreDialog label="מהי מהות מסחרית">
          <p>העסקה משנה באופן משמעותי את התזרימים הצפויים — בסכום, בעיתוי או בסיכון. מזומן בעסקה יכול להעיד על כך, אבל לא בהכרח.</p>
          <p>בלי מהות מסחרית (או בלי שווי הוגן מהימן לשני הנכסים), החלפה ״טכנית״ לא יוצרת רווח: הנכס החדש ממשיך את הערך בספרים של הישן.</p>
        </MoreDialog>
      </>
    ),
    check: quiz("ppe-swap-rule", [
      {
        q: "נכס בערך בספרים 40,000 ₪, שווי הוגן 52,000 ₪, הוחלף עם תוספת 8,000 ₪ שהחברה שילמה (מהות מסחרית). מה עלות הנכס החדש?",
        options: ["60,000 ₪", "44,000 ₪", "48,000 ₪", "52,000 ₪"],
        answer: 0,
        why: "52,000 + 8,000.",
      },
      {
        q: "ואם לעסקה אין מהות מסחרית?",
        options: ["48,000 ₪", "60,000 ₪", "40,000 ₪", "52,000 ₪"],
        answer: 0,
        why: "ערך בספרים 40,000 + המזומן ששולם 8,000.",
      },
    ]),
  },
  "ppe-swap-back": {
    lead: "כששאלה נותנת את הרווח ומבקשת את השווי — הופכים: שווי מה שנמסר = ערך בספרים + רווח. וכשמוחלפים כמה נכסים — מחשבים קודם את כל מה שנמסר, ואז מחלקים.",
    body: (
      <>
        <Reveal
          steps={keyed([
            <>נתון: ערך בספרים 120,000 ₪, קיבלנו 10,000 ₪ במזומן, רווח 15,000 ₪.</>,
            <>שווי מה שנמסר: 120,000 + 15,000 = 135,000 ₪.</>,
            <>הנכס שהתקבל: 135,000 − 10,000 = 125,000 ₪.</>,
          ])}
        />
        <Story icon={<Truck />} title={`${FLEET.given} כלי רכב (${n(FLEET.fairEach)} ₪ כל אחד) + ${n(FLEET.cashOut)} ₪ תמורת ${FLEET.received}`}>
          <p>
            מה שנמסר: {FLEET.given} × <Money v={FLEET.fairEach} plain /> + <Money v={FLEET.cashOut} plain /> = <Money v={FLEET.given * FLEET.fairEach + FLEET.cashOut} />; לכל רכב חדש:{" "}
            <Money v={FLEET_EACH} />.
          </p>
        </Story>
        <KeyCard>שלוש משוואות מספיקות לכל שאלה: עלות חדש = שווי נמסר ± מזומן; רווח = שווי נמסר − ערך בספרים; ערך בספרים = עלות − פחת נצבר עד היום.</KeyCard>
      </>
    ),
    check: quiz("ppe-swap-back", [
      {
        q: "ערך בספרים 80,000 ₪, הפסד מההחלפה 6,000 ₪. מה השווי ההוגן של מה שנמסר?",
        options: ["74,000 ₪", "86,000 ₪", "80,000 ₪", "6,000 ₪"],
        answer: 0,
        why: "80,000 − 6,000.",
      },
      {
        q: "3 מכונות ששוויין 50,000 ₪ כל אחת הוחלפו ב-2 מכונות, בלי מזומן. מה עלות כל מכונה חדשה?",
        options: ["75,000 ₪", "50,000 ₪", "150,000 ₪", "100,000 ₪"],
        answer: 0,
        why: "150,000 ÷ 2.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 9
  "ppe-models": {
    lead: "אחרי ההכרה בוחרים מודל לכל קבוצת נכסים: מודל העלות — עלות פחות פחת נצבר; או מודל הערכה מחדש — שווי הוגן פחות פחת שנצבר מאז.",
    body: (
      <>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Card title="מודל העלות">
            <p>עלות − פחת נצבר. פשוט ואובייקטיבי — אבל המאזן לא מראה מה הנכס שווה היום.</p>
          </Card>
          <Card title="מודל הערכה מחדש">
            <p>שווי הוגן ביום ההערכה − פחת מאז. רלוונטי יותר — אבל דורש אומדן שווי, ומערבב מדידות.</p>
          </Card>
        </Wide>
        <KeyCard>הבחירה היא לכל קבוצה (קרקעות, מבנים, מכונות…), ולכל הנכסים בה — כדי שאי אפשר יהיה לבחור רק את מה שעלה.</KeyCard>
        <MoreDialog label="כמה פעמים מעריכים">
          <p>בתדירות שמבטיחה שהערך בספרים לא שונה מהותית מהשווי ההוגן: נכס תנודתי — כל שנה; יציב — אולי כל 3–5 שנים. את כל הקבוצה מעריכים באותו מועד.</p>
        </MoreDialog>
      </>
    ),
    check: quiz("ppe-models", [
      {
        q: "חברה מיישמת מודל הערכה מחדש על המבנים. האם מותר לה מודל עלות על המכונות?",
        options: ["כן — הבחירה לכל קבוצה", "לא — מודל אחד לכל הרכוש הקבוע", "רק אם המכונות חדשות", "רק בשנה הראשונה"],
        answer: 0,
        why: "מבנים ומכונות הן קבוצות שונות.",
      },
      {
        q: "למה מעריכים את כל הקבוצה, ולא נכס בודד?",
        options: ["כדי למנוע בחירה של מה שעלה בלבד", "כי זה זול יותר", "כי התקן אוסר שווי הוגן לנכס בודד", "כדי להקטין את הפחת"],
        answer: 0,
        why: "עקרון הקבוצה מונע ״ייפוי״ סלקטיבי של הדוחות.",
      },
    ]),
  },
  "ppe-land-values": {
    lead: "קרקע לא מופחתת, ולכן כל הערכה היא רק הפער לשווי ההוגן: עלייה — לקרן; ירידה — קודם מהקרן, והשאר להפסד; והתאוששות — קודם מבטלת את ההפסד.",
    body: (
      <>
        <Story icon={<Landmark />} title={`קרקע ב-${n(PLOT.cost)} ₪; אחרי שנה — ${n(PLOT.first)} ₪`}>
          <p>
            עלייה ראשונה: ח׳ קרקע {n(PLOT.first - PLOT.cost)} / ז׳ קרן הערכה מחדש {n(PLOT.first - PLOT.cost)}. ומה בשנה שאחרי?
          </p>
        </Story>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Card title={`שווי ${n(PLOT.up)} — עוד עלייה`} className="border-success/40">
            <p>
              +{n(PLOT.up - PLOT.first)} לקרן. הקרן: <Money v={PLOT.up - PLOT.cost} />.
            </p>
          </Card>
          <Card title={`שווי ${n(PLOT.down)} — מתחת לעלות`} className="border-danger/40">
            <p>
              ירידה של {n(PLOT.first - PLOT.down)}: {n(PLOT.first - PLOT.cost)} מאפסים את הקרן, ו-{n(PLOT.cost - PLOT.down)} — הפסד ברווח והפסד.
            </p>
          </Card>
        </Wide>
        <Reveal
          steps={keyed([
            <>
              התאוששות: קרקע ב-<Money v={BACKUP.cost} plain /> ירדה ל-<Money v={BACKUP.fell} plain /> — הפסד <Money v={BACKUP.cost - BACKUP.fell} />.
            </>,
            <>
              בהערכה הבאה: <Money v={BACKUP.rose} plain />. קודם מבטלים את ההפסד — <Money v={BACKUP.cost - BACKUP.fell} /> רווח ברווח והפסד.
            </>,
            <>
              רק מה שמעל העלות — <Money v={BACKUP.rose - BACKUP.cost} /> — לקרן.
            </>,
          ])}
        />
        <KeyCard>קו האפס הוא העלות: מעליה — קרן (רווח כולל אחר); מתחתיה — רווח והפסד. הקרן לעולם לא שלילית.</KeyCard>
      </>
    ),
    check: quiz("ppe-land-values", [
      {
        q: "קרקע בעלות 300,000 ₪, קרן 50,000 ₪ (ערכה 350,000 ₪). השווי ירד ל-280,000 ₪. מה ההפסד ברווח והפסד?",
        options: ["20,000 ₪", "70,000 ₪", "0", "50,000 ₪"],
        answer: 0,
        why: "ירידה 70,000: 50,000 מהקרן, 20,000 הפסד.",
      },
      {
        q: "קרקע שנרשם עליה בעבר הפסד של 30,000 ₪ עלתה ב-50,000 ₪. כמה לקרן?",
        options: ["20,000 ₪", "50,000 ₪", "30,000 ₪", "0"],
        answer: 0,
        why: "30,000 מבטלים את ההפסד ברווח והפסד; 20,000 לקרן.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 10
  "ppe-reset-prop": {
    lead: "ביום ההערכה צריך להחליט מה לעשות בפחת הנצבר: לאפס אותו מול העלות (והנכס עומד על השווי ההוגן), או להציג מחדש עלות ופחת נצבר באותו יחס. הערך בספרים יוצא אותו דבר.",
    body: (
      <>
        <Story icon={<Repeat />} title={`נכס ב-${n(PROP.cost)} ₪, ${PROP.life} שנים; אחרי ${PROP.years} שנים — שווי הוגן ${n(PROP.fairValue)} ₪`}>
          <p>
            ערך בספרים לפני: <Money v={propCarrying} />; קרן: <Money v={PROP.fairValue - propCarrying} />.
          </p>
        </Story>
        <Wide>
          <DataTable
            head={["", "איפוס", "יחסי"]}
            rows={[
              ["עלות (ברוטו)", PROP.fairValue, PROP_GROSS],
              ["פחת נצבר", 0, -PROP_ACCUM],
              ["ערך בספרים", PROP.fairValue, PROP.fairValue],
            ]}
          />
        </Wide>
        <KeyCard>
          ביחסי מכפילים את העלות ואת הפחת הנצבר ב-(שווי הוגן ÷ ערך בספרים) = {PROP.fairValue / propCarrying}. באיפוס — מוחקים את הפחת הנצבר ומעלים או מורידים את הנכס לשווי ההוגן.
        </KeyCard>
      </>
    ),
    check: quiz("ppe-reset-prop", [
      {
        q: "בשיטת האיפוס, מה יתרת הפחת הנצבר מיד אחרי ההערכה?",
        options: ["0", "כמו לפני", "יחסית לשווי", "שווה לקרן"],
        answer: 0,
        why: "הפחת הנצבר מבוטל מול עלות הנכס.",
      },
      {
        q: "האם הערך בספרים שונה בין שתי השיטות?",
        options: ["לא — בשתיהן הוא השווי ההוגן", "כן — ביחסי גבוה יותר", "כן — באיפוס גבוה יותר", "תלוי בשיטת הפחת"],
        answer: 0,
        why: "רק ההצגה (ברוטו ופחת נצבר) שונה.",
      },
    ]),
  },
  "ppe-transfer": {
    lead: "הקרן עוברת לעודפים באחת משתי דרכים: בקצב הפחת — חלק בכל שנה — או כולה, בגריעה. בשתיהן היא עוקפת את רווח והפסד.",
    body: (
      <>
        <Wide className="grid gap-3 md:grid-cols-2">
          <Card title="בקצב הפחת">
            <p>בכל שנה: פחת לפי ההערכה − פחת לפי העלות. בקו ישר — קרן ÷ יתרת החיים.</p>
            <p className="text-sm text-muted">ח׳ קרן הערכה מחדש / ז׳ עודפים. בסוף החיים הקרן מתאפסת.</p>
          </Card>
          <Card title="בגריעה">
            <p>בשנים שבין ההערכות הקרן לא זזה. כשהנכס נמכר או מוחלף — כל היתרה לעודפים.</p>
            <p className="text-sm text-muted">קרקע — תמיד כך: היא לא מופחתת.</p>
          </Card>
        </Wide>
        <Story icon={<Scale />} title="הבדיקה שתופסת כמעט כל טעות (בקצב הפחת)">
          <p>
            מבנה ב-<Money v={CHECK.cost} plain />, קרקע <Money v={CHECK.land} plain />, {CHECK.life} שנה. אחרי {CHECK.years} שנים — שווי <Money v={CHECK.fairValue} plain />.
          </p>
          <p>
            לפי מודל העלות: <Money v={checkCostModel} />. הקרן חייבת להיות <Money v={CHECK.fairValue} plain /> − <Money v={checkCostModel} plain /> = <Money v={CHECK.fairValue - checkCostModel} />.
          </p>
        </Story>
        <KeyCard>הסדר בכל סוף שנה: פחת → העברה לעודפים → הערכה מחדש. העברה אחרי ההערכה מחשבת על קרן שכבר השתנתה — וזו טעות.</KeyCard>
      </>
    ),
    check: quiz("ppe-transfer", [
      {
        q: "קרן של 48,000 ₪ נוצרה ביום ההערכה; נותרו 12 שנים; קו ישר; העברה בקצב הפחת. כמה עובר בכל שנה?",
        options: ["4,000 ₪", "48,000 ₪", "0", "12,000 ₪"],
        answer: 0,
        why: "48,000 ÷ 12.",
      },
      {
        q: "ההעברה לעודפים — איפה היא בדוח רווח והפסד?",
        options: ["אינה שם — היא בתוך ההון", "מקטינה את הפחת", "הכנסה אחרת", "רווח כולל אחר"],
        answer: 0,
        why: "ח׳ קרן / ז׳ עודפים — שני חשבונות הון.",
      },
    ]),
  },
  "ppe-reval-sale": {
    lead: "במכירה של נכס משוערך, הרווח נמדד מול הערך בספרים המשוערך — והקרן עוברת לעודפים בפקודה נפרדת. אם השאלה אומרת להעריך לפני המכירה — קודם מעריכים.",
    body: (
      <>
        <Story icon={<Building2 />} title={`מבנה בערך ${n(SALE.carrying)} ₪, קרן ${n(SALE.surplus)} ₪, נמכר ב-${n(SALE.price)} ₪`}>
          <Reveal
            steps={keyed([
              <>
                רווח הון: <Money v={SALE.price} plain /> − <Money v={SALE.carrying} plain /> = <Money v={SALE.price - SALE.carrying} />.
              </>,
              <>
                הקרן: ח׳ קרן הערכה מחדש {n(SALE.surplus)} / ז׳ עודפים {n(SALE.surplus)} — לא לרווח.
              </>,
            ])}
          />
        </Story>
        <KeyCard>
          ״ביצעה שערוך לפני המכירה״: קודם פחת עד יום המכירה, אחר כך הערכה לשווי (שהוא בדרך כלל התמורה) — ואז אין רווח, וכל הקרן לעודפים. השאלה תמיד אומרת איזו דרך.
        </KeyCard>
        <MoreDialog label="ובהחלפה?">
          <p>אותו דבר: מעריכים אם נדרש, מחשבים רווח מול הערך המשוערך, והקרן — לעודפים. הנכס שהתקבל נכנס בשווי ההוגן, כמו בכל החלפה עם מהות מסחרית.</p>
        </MoreDialog>
      </>
    ),
    check: quiz("ppe-reval-sale", [
      {
        q: "נכס משוערך בערך 500,000 ₪ (קרן 80,000 ₪) נמכר ב-470,000 ₪, בלי הערכה נוספת. מה ברווח והפסד?",
        options: ["הפסד הון 30,000 ₪", "רווח 50,000 ₪", "הפסד 110,000 ₪", "רווח 80,000 ₪"],
        answer: 0,
        why: "470,000 − 500,000. הקרן לעודפים, בנפרד.",
      },
      {
        q: "ומה קורה לקרן?",
        options: ["80,000 ₪ לעודפים", "מקזזת את ההפסד", "נשארת", "לרווח כולל אחר"],
        answer: 0,
        why: "הנכס יצא — הקרן עוברת לעודפים.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 11
  "ppe-sheet": {
    lead: "לכל נכס בשאלה — ציר זמן משלו, וטבלה עם שורה לכל שנה. כך שום חודש לא נשכח, וכל מספר בדוחות נלקח ממקום אחד.",
    body: (
      <>
        <Wide>
          <ChainChips items={["רכישה", "זמין לשימוש", "אירוע (שיפוץ / מכירה / החלפה / הערכה)", "31.12 של כל שנה"]} />
        </Wide>
        <Wide>
          <DataTable
            head={["שנה", "עלות", "פחת השנה", "פחת נצבר", "ערך בספרים", "קרן", "אירועים"]}
            rows={[
              ["2024", "", "", "", "", "", "מ-1.4: זמין; 9 חודשים"],
              ["2025", "", "", "", "", "", "1.7: שיפור — שני חלקים"],
              ["2026", "", "", "", "", "", "31.12: החלפה — פחת עד היום, ואז גריעה"],
            ]}
          />
        </Wide>
        <Story icon={<CalendarClock />} title="שלוש מכונות, שנה אחת">
          <p>
            א׳ כל השנה (<Money v={YEAR.whole.cost} plain />, {YEAR.whole.life} שנים); ב׳ נקנתה ב-1.7 (<Money v={YEAR.bought.cost} plain />, {YEAR.bought.life}); ג׳ נמכרה ב-1.4 (
            <Money v={YEAR.sold.cost} plain />, {YEAR.sold.life}). פחת השנה: <Money v={YEAR_DEP} />.
          </p>
        </Story>
        <KeyCard>הטבלה היא התשובה: עמודת ״פחת השנה״ — לרווח והפסד; ״עלות״, ״פחת נצבר״ ו״קרן״ — למאזן.</KeyCard>
      </>
    ),
    check: quiz("ppe-sheet", [
      {
        q: "מה ממלאים ראשון לכל נכס?",
        options: ["ציר זמן עם התאריכים", "פקודת הרכישה", "את השווי ההוגן", "את הדוחות"],
        answer: 0,
        why: "בלי חודשים אין פחת נכון.",
      },
      {
        q: "באיזו שורה בטבלה נמצא הסכום של ״הוצאות פחת״ בדוח רווח והפסד?",
        options: ["״פחת השנה״ של אותה שנה", "״פחת נצבר״", "״ערך בספרים״", "״עלות״"],
        answer: 0,
        why: "הפחת הנצבר הוא מאזני — מצטבר משנים קודמות.",
      },
    ]),
  },
  "ppe-statements": {
    lead: "כל מספר בשאלת רכוש קבוע יושב באחד משלושה מקומות: במאזן, ברווח או הפסד, או ברווח הכולל האחר. ההעברה לעודפים — באף אחד מדוחות הרווח.",
    body: (
      <>
        <Wide>
          <Sorted
            columns={[
              { title: "מאזן", tone: "neutral", items: ["עלות / שווי הוגן", "פחת נצבר", "עלות מופחתת", "קרן הערכה מחדש (בהון)", "הפרשה לירידת ערך"] },
              { title: "רווח או הפסד", tone: "neutral", items: ["הוצאות פחת", "הדרכה, השקה, תחזוקה", "רווח / הפסד הון", "הפסד מירידת ערך (וביטולו)"] },
              { title: "רווח כולל אחר", tone: "neutral", items: ["עלייה לקרן", "ירידה מהקרן"] },
            ]}
          />
        </Wide>
        <KeyCard icon={<Printer className="h-5 w-5" />}>ההעברה מהקרן לעודפים היא בתוך ההון: היא מופיעה רק בדוח על השינויים בהון — לא ברווח או הפסד, ולא ברווח הכולל האחר.</KeyCard>
      </>
    ),
    check: quiz("ppe-statements", [
      {
        q: "עלייה של 100,000 ₪ בשווי מבנה (בלי הפסדים קודמים) — איפה?",
        options: ["רווח כולל אחר", "רווח או הפסד", "רק בעודפים", "בשום מקום"],
        answer: 0,
        why: "ובמאזן — בקרן הערכה מחדש.",
      },
      {
        q: "הפסד ממכירת משאית — איפה?",
        options: ["רווח או הפסד", "רווח כולל אחר", "קרן הערכה מחדש", "הון"],
        answer: 0,
        why: "גריעה — ברווח או הפסד.",
      },
    ]),
  },

  // ---------------------------------------------------------------- lesson 12
  "ppe-press": {
    lead: "שאלה ברמת מבחן. בנו ציר זמן וטבלה לכל רכיב, ופתרו על דף — לפני שאתם פותחים את הפתרון.",
    body: (
      <>
        <Card title={<span className="flex items-center gap-2"><Cog className="h-5 w-5 text-accent" aria-hidden /> חברת ״הדפוס הירוק״ בע״מ</span>}>
          <div className="space-y-2 text-[14.5px]">
            <p>החברה הוקמה ב-1.1.2024 ומיישמת את מודל העלות לגבי המכונות.</p>
            <p>
              <strong>1.</strong> ב-1.1.2024 נקנתה מכונת דפוס ב-{n(PRESS_Q.price)} ₪. הובלה {n(PRESS_Q.transport)} ₪; הרכבה והתקנה {n(PRESS_Q.install)} ₪; עובדי החברה הקדישו {PRESS_Q.staffHours} שעות
              להתקנה, בשכר {PRESS_Q.hourly} ₪ לשעה; בדיקות תקינות {n(PRESS_Q.testing)} ₪; יועצים קיבלו {n(PRESS_Q.consultants)} ₪ — {pct(PRESS_Q.consultantsChoosing)} על בחירת המכונה והיתר על
              ההתקנה; הדרכת עובדים {n(PRESS_Q.training)} ₪; אירוע השקה ללקוחות {n(PRESS_Q.launch)} ₪.
            </p>
            <p>
              <strong>2.</strong> המכונה הייתה זמינה לשימוש ב-1.{PRESS_Q.availableMonth}.2024, אבל בגלל שביתה החלה לייצר רק ב-1.{PRESS_Q.startedMonth}.2024.
            </p>
            <p>
              <strong>3.</strong> רכיבים: ראש הדפסה {pct(PRESS_Q.head.share)} — סכום ספרות שנים יורד, {PRESS_Q.head.life} שנים, בלי גרט; שלדה {pct(PRESS_Q.frame.share)} — קו ישר, {PRESS_Q.frame.life} שנים, גרט{" "}
              {n(PRESS_Q.frame.salvage)} ₪; מנוע {pct(PRESS_Q.motor.share)} — לפי שעות מנוע, {n(PRESS_Q.motor.hours)} שעות, גרט {n(PRESS_Q.motor.salvage)} ₪.
            </p>
            <p>
              <strong>4.</strong> שעות מנוע: 2024 — {n(PRESS_Q.motor.used2024)}; ינואר–יוני 2025 — {n(PRESS_Q.motor.firstHalf2025)}; יולי–דצמבר 2025 — {n(PRESS_Q.motor.secondHalf2025)}.
            </p>
            <p>
              <strong>5.</strong> ב-1.7.2025: טיפול שוטף במכונה {n(PRESS_Q.maintenance)} ₪; ובאותו יום שיפור במנוע ב-{n(PRESS_Q.improvement)} ₪, שהוסיף {n(PRESS_Q.extraHours)} שעות עבודה (הגרט לא השתנה).
            </p>
            <p>
              <strong>6.</strong> ב-31.12.2025 הוחלפה המכונה כולה במכונה חדישה, בעסקה עם מהות מסחרית. שוויה ההוגן של המכונה הישנה {n(PRESS_Q.fairValue)} ₪, והחברה קיבלה גם {n(PRESS_Q.cashIn)} ₪ במזומן.
            </p>
            <p className="font-semibold">נדרש: (א) עלות המכונה. (ב) הפחת של כל רכיב ב-2024 וב-2025. (ג) יתרות המכונה ב-31.12.2024 וב-31.12.2025 (לפני ההחלפה). (ד) פקודת ההחלפה והרווח. (ה) הסעיפים ברווח או הפסד.</p>
          </div>
        </Card>
        <AnswerCheck
          answers={[
            { label: "עלות המכונה", value: P.cost, kind: "amount" },
            { label: "פחת 2024", value: P.dep[0], kind: "amount" },
            { label: "פחת 2025", value: P.dep[1], kind: "amount" },
            { label: "עלות מופחתת 31.12.2025", value: P.carrying2025, kind: "amount" },
            { label: "רווח מההחלפה", value: P.gain, kind: "amount" },
          ]}
        />
      </>
    ),
  },
  "ppe-press-solve": {
    lead: "הפתרון לפי הבלוקים: העלות, ציר הזמן והחלוקה, כל רכיב בשיטה שלו, היתרות וההחלפה — ובסוף הדוח.",
    body: (
      <>
        <Stepper label="הדפוס הירוק · הפתרון" steps={pressSteps} />
        <Rule>
          עלות <Money v={P.cost} /> · פחת 2024 <Money v={P.dep[0]} /> · פחת 2025 <Money v={P.dep[1]} /> · רווח מההחלפה <Money v={P.gain} />
        </Rule>
      </>
    ),
  },
  "ppe-logi": {
    lead: "שאלה שנייה, במודל הערכה מחדש: מבנה וקרקע עם קרן לכל אחד, ירידה מתחת לעלות, מכירה — ומשאיות במודל העלות. נסו לבד לפני הפתרון.",
    body: (
      <>
        <Card title={<span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" aria-hidden /> חברת ״לוגיסטיקה צפונית״ בע״מ</span>}>
          <div className="space-y-2 text-[14.5px]">
            <p>החברה הוקמה ב-1.1.2023.</p>
            <p>
              <strong>1.</strong> ביום הקמתה קנתה מבנה משרדים ב-{n(LOGI_Q.price)} ₪, ושילמה גם מס רכישה {LOGI_Q.purchaseTax * 100}% (לא מוחזר) ושכר טרחה {LOGI_Q.lawyer * 100}%. בכל מועד,{" "}
              {pct(LOGI_Q.land)} מהנכס מיוחסים לקרקע. המבנה מופחת בקו ישר על פני {LOGI_Q.life} שנה, בלי ערך גרט.
            </p>
            <p>
              <strong>2.</strong> החברה מיישמת מודל הערכה מחדש לקבוצת המבנים והקרקעות, אחת לשנה מ-31.12.2023, באיפוס הפחת הנצבר; הקרן מועברת לעודפים בקצב הפחת.
            </p>
            <p>
              <strong>3.</strong> שווי הוגן של הנכס כולו (מבנה וקרקע): 31.12.2023 — {n(LOGI_Q.fair[0])} ₪; 31.12.2024 — {n(LOGI_Q.fair[1])} ₪.
            </p>
            <p>
              <strong>4.</strong> ב-1.1.2025 נמכר הנכס ב-{n(LOGI_Q.salePrice)} ₪, בלי הערכה נוספת.
            </p>
            <p>
              <strong>5.</strong> ב-1.{T.boughtMonth}.2023 נקנו {T.count} משאיות זהות, {n(T.each)} ₪ כל אחת; הן היו זמינות לשימוש ב-1.{T.availableMonth}.2023. קו ישר, {T.life} שנים, גרט {n(T.salvage)} ₪
              למשאית, מודל העלות. ב-1.{T.soldMonth}.2025 נמכרה משאית אחת ב-{n(T.salePrice)} ₪.
            </p>
            <p className="font-semibold">
              נדרש: (א) עלות הנכס והחלוקה לקרקע ולמבנה. (ב) פקודות ההערכה ויתרות הקרן ב-2023 וב-2024. (ג) סעיפי רווח או הפסד ורווח כולל אחר ל-2023–2025. (ד) תוצאת מכירת המשאית ויתרות המשאיות ב-31.12.2025.
            </p>
          </div>
        </Card>
        <AnswerCheck
          answers={[
            { label: "עלות המבנה (בלי קרקע)", value: L.buildingCost, kind: "amount" },
            { label: "קרן ב-31.12.2023", value: L.oci2023, kind: "amount" },
            { label: "קרן ב-31.12.2024", value: L.surplusBuilding2024, kind: "amount" },
            { label: "הפסד מירידת ערך 2024", value: L.landLoss, kind: "amount" },
            { label: "רווח ממכירת הנכס", value: L.saleGain, kind: "amount" },
            { label: "הפסד ממכירת המשאית", value: -L.truck.result, kind: "amount" },
          ]}
        />
      </>
    ),
  },
  "ppe-logi-solve": {
    lead: "הפתרון: העלות והחלוקה, כל הערכה — קודם פחת והעברה ואז הפער, כל נכס עם הקרן שלו — המכירה, המשאיות והדוחות.",
    body: (
      <>
        <Stepper label="לוגיסטיקה צפונית · הפתרון" steps={logiSteps} />
        <Rule>
          קרן 2023 <Money v={L.oci2023} /> · קרן 2024 <Money v={L.surplusBuilding2024} /> · הפסד 2024 <Money v={L.landLoss} /> · רווח מהמכירה <Money v={L.saleGain} />
        </Rule>
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          <Truck className="h-4 w-4" aria-hidden /> את המבנה אפשר לבדוק גם במחשבון ההערכה מחדש (שיעור 10).
        </div>
      </>
    ),
  },
};
