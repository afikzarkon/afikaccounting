import { Callout, DataTable, Dt, Givens, Num, SubHeading, Topic } from "../blocks";
import { Formula, Tex } from "../math";

const COST = 220_000;
const RESIDUAL = 20_000;
const LIFE = 5;
const BASE = COST - RESIDUAL;
const S = (LIFE * (LIFE + 1)) / 2;
const UNITS = [30_000, 25_000, 20_000, 15_000, 10_000];
const TOTAL_UNITS = 100_000;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Year-by-year rows of [year, charge, accumulated, carrying amount]. */
function schedule(charges: number[], opening = COST, firstYear = 1) {
  let acc = 0;
  return charges.map((d, i) => {
    acc += d;
    return [`שנה ${firstYear + i}`, r2(d), r2(acc), r2(opening - acc)];
  });
}

/** Fixed-rate declining balance that stops at the residual value in the last year. */
export function decliningBalance(opening: number, residual: number, rate: number, years: number) {
  const out: number[] = [];
  let ca = opening;
  for (let y = 1; y <= years; y++) {
    let d = ca * rate;
    if (y === years || ca - d < residual) d = ca - residual;
    out.push(r2(d));
    ca -= d;
  }
  return out;
}

const SL = Array.from({ length: LIFE }, () => BASE / LIFE);
const SYD_DOWN = Array.from({ length: LIFE }, (_, i) => (BASE * (LIFE - i)) / S);
const SYD_UP = Array.from({ length: LIFE }, (_, i) => (BASE * (i + 1)) / S);
const DB = decliningBalance(COST, RESIDUAL, 0.4, LIFE);
const UOP = UNITS.map((u) => (u * BASE) / TOTAL_UNITS);

const HEAD = ["שנה", "הוצאות פחת", "פחת שנצבר", "יתרה בספרים"];
const FOOT = (charges: number[]) => ["סה״כ", r2(charges.reduce((a, b) => a + b, 0)), "", ""];

export function DepreciationSection() {
  return (
    <>
      <Topic title="נתוני בסיס לכל הדוגמאות" refs="IAS 16.50–62" open>
        <p>
          כל השיטות מחלקות את אותו <strong>סכום בר-פחת</strong> — העלות בניכוי ערך השייר — על פני אורך החיים. השיטה צריכה
          לשקף את הדפוס שבו צפויות להיצרך ההטבות הכלכליות מהנכס (IAS 16.60), ונבחנת לפחות בסוף כל שנה (16.61).
        </p>
        <Givens
          items={[
            ["עלות", <Num key="c" v={COST} />],
            ["ערך שייר (גרט)", <Num key="r" v={RESIDUAL} />],
            ["אורך חיים שימושיים", `${LIFE} שנים`],
            ["סכום בר-פחת", <Num key="b" v={BASE} />],
          ]}
        />
        <Formula tex={String.raw`B = C - R = 220{,}000 - 20{,}000 = 200{,}000`} legend={[["C", "עלות"], ["R", "ערך שייר"], ["B", "בסיס הפחת"], ["n", "אורך חיים בשנים"]]} />
      </Topic>

      <Topic title="קו ישר (Straight-Line)" refs="IAS 16.62">
        <Formula tex={String.raw`D = \frac{C - R}{n} \qquad D_{\text{חודשי}} = \frac{C - R}{12n}`} />
        <p>
          בדוגמה: <Tex>{String.raw`\frac{200{,}000}{5} = 40{,}000`}</Tex> לשנה, ו-<Tex>{String.raw`\frac{200{,}000}{60} = 3{,}333.33`}</Tex> לחודש.
        </p>
        <DataTable head={HEAD} rows={schedule(SL)} foot={FOOT(SL)} />
      </Topic>

      <Topic title="סכום ספרות השנים — יורד ועולה (SYD)" refs="IAS 16.62">
        <p>
          בשיטה היורדת השנה הראשונה מקבלת את המשקל הגבוה ביותר (<Tex>n</Tex>) והאחרונה את הנמוך (1). בשיטה העולה הסדר הפוך —
          מתאימה לנכס שהתפוקה ממנו עולה עם הזמן.
        </p>
        <Formula
          tex={String.raw`D_k^{\downarrow} = (C - R)\cdot\frac{n - k + 1}{S} \qquad D_k^{\uparrow} = (C - R)\cdot\frac{k}{S} \qquad S = \sum_{i=1}^{n} i`}
          legend={[["k", "מספר שנת החיים (1…n)"], ["S", "סכום הספרות"]]}
        />
        <p>
          בדוגמה <Tex>{String.raw`S = 1+2+3+4+5 = 15`}</Tex>, והשנה הראשונה בשיטה היורדת: <Tex>{String.raw`200{,}000 \cdot \frac{5}{15} = 66{,}666.67`}</Tex>.
        </p>
        <DataTable
          head={["שנה", "משקל (יורד)", "פחת — יורד", "משקל (עולה)", "פחת — עולה"]}
          rows={SYD_DOWN.map((d, i) => [`שנה ${i + 1}`, `${LIFE - i}/${S}`, r2(d), `${i + 1}/${S}`, r2(SYD_UP[i])])}
          foot={["סה״כ", "15/15", BASE, "15/15", BASE]}
        />
      </Topic>

      <Topic title="אחוז קבוע מיתרה פוחתת (Declining Balance)" refs="IAS 16.62">
        <p>
          השיעור מוחל על <strong>היתרה בספרים</strong> בתחילת כל שנה (ולא על הסכום בר-הפחת), ולכן ערך השייר לא מנוכה מהבסיס —
          הוא משמש תקרה שמתחתיה לא מפחיתים.
        </p>
        <Formula
          tex={String.raw`D_t = r \cdot CA_{t-1} \qquad r_{\text{כפולה}} = \frac{2}{n} \qquad r_{\text{מדויק}} = 1 - \sqrt[n]{\frac{R}{C}}`}
          legend={[["CA_{t-1}", "יתרה בספרים בתחילת השנה"], ["r", "השיעור הקבוע"]]}
        />
        <p>
          בדוגמה השיעור הוא <Tex>{String.raw`\frac{2}{5} = 40\%`}</Tex> (יתרה פוחתת כפולה). בשנה 5 החישוב הרגיל (
          <Tex>{String.raw`28{,}512 \times 40\% = 11{,}404.80`}</Tex>) היה מוריד את היתרה ל-17,107 — מתחת לגרט — ולכן הפחת נעצר על{" "}
          <Num v={8_512} />.
        </p>
        <DataTable head={HEAD} rows={schedule(DB)} foot={FOOT(DB)} highlight={[4]} />
        <Callout title="השיעור המדויק מגיע לגרט בלי תיקון">
          <p>
            עם <Tex>{String.raw`r = 1 - \sqrt[5]{20{,}000 / 220{,}000} \approx 38.10\%`}</Tex> היתרה בסוף שנה 5 שווה בדיוק לגרט.
            בשיעור ״כפול״ (2/n) תמיד צריך את בדיקת התקרה, ובמנוע — גם מעבר לקו ישר ברגע שהקו הישר על היתרה נותן פחת גבוה
            יותר.
          </p>
        </Callout>
      </Topic>

      <Topic title="לפי יחידות תפוקה / שעות עבודה (Units of Production)" refs="IAS 16.62">
        <Formula
          tex={String.raw`\text{תעריף ליחידה} = \frac{C - R}{U_{\text{total}}} \qquad D_t = u_t \cdot \frac{C - R}{U_{\text{total}}}`}
          legend={[["U_{\\text{total}}", "סך היחידות (או השעות) הצפויות"], ["u_t", "יחידות שהופקו בשנה"]]}
        />
        <p>
          בדוגמה צפויות <Num v={TOTAL_UNITS} /> יחידות, ולכן <Tex>{String.raw`\frac{200{,}000}{100{,}000} = 2`}</Tex> ₪ ליחידה.
          אותה נוסחה בדיוק משמשת לשעות מכונה.
        </p>
        <DataTable
          head={["שנה", "יחידות שהופקו", "הוצאות פחת", "פחת שנצבר", "יתרה בספרים"]}
          rows={schedule(UOP).map((row, i) => [row[0], UNITS[i], ...row.slice(1)])}
          foot={["סה״כ", TOTAL_UNITS, BASE, "", ""]}
        />
        <Callout kind="warn" title="אין חלוקה לחלקי שנה">
          <p>בשיטת התפוקה הפחת נקבע לפי השימוש בפועל, ולכן רכישה באמצע שנה לא דורשת התאמת זמן — רק את היחידות שהופקו מאז.</p>
        </Callout>
      </Topic>

      <Topic title="רכישה באמצע שנה ופחת חודשי" refs="IAS 16.55">
        <p>
          הפחת מתחיל כשהנכס <strong>זמין לשימוש</strong>, לא במועד הרכישה ולא בתחילת השימוש בפועל. נניח שהנכס זמין לשימוש ב-<Dt>1.4.X1</Dt>
          (9 חודשים בשנת X1). שנות החיים של הנכס (1.4–31.3) כבר לא חופפות לשנות הכספים.
        </p>
        <SubHeading>קו ישר</SubHeading>
        <p>
          X1: <Tex>{String.raw`40{,}000 \cdot \frac{9}{12} = 30{,}000`}</Tex>; משנת X2 — <Num v={40_000} /> מלאים. בשנה השישית (X6) נותרים 3
          חודשים: <Num v={10_000} />.
        </p>
        <SubHeading>סכום ספרות השנים — שקלול שתי שנות חיים</SubHeading>
        <Formula
          tex={String.raw`D_{\text{FY}} = a \cdot D_k + (1 - a)\cdot D_{k+1}`}
          legend={[["a", "החלק משנת הכספים שנופל בשנת החיים k"]]}
        />
        <DataTable
          head={["שנת כספים", "חישוב", "הוצאות פחת"]}
          rows={[
            ["X1", <Tex key="1">{String.raw`\tfrac{9}{12} \cdot 66{,}666.67`}</Tex>, 50_000],
            ["X2", <Tex key="2">{String.raw`\tfrac{3}{12} \cdot 66{,}666.67 + \tfrac{9}{12} \cdot 53{,}333.33`}</Tex>, 56_666.67],
            ["X3", <Tex key="3">{String.raw`\tfrac{3}{12} \cdot 53{,}333.33 + \tfrac{9}{12} \cdot 40{,}000`}</Tex>, 43_333.33],
          ]}
        />
        <SubHeading>יתרה פוחתת</SubHeading>
        <p>
          בשנה הראשונה מקצים לפי זמן, ומשם ממשיכים על היתרה בתחילת כל שנת כספים: X1 —{" "}
          <Tex>{String.raw`220{,}000 \cdot 40\% \cdot \tfrac{9}{12} = 66{,}000`}</Tex>; X2 —{" "}
          <Tex>{String.raw`(220{,}000 - 66{,}000) \cdot 40\% = 61{,}600`}</Tex>.
        </p>
      </Topic>

      <Topic title="💡 טריקים ובדיקות נאותות לשיטות פחת" open>
        <Callout title="קיצור דרך לסכום ספרות השנים">
          <Formula tex={String.raw`S = \frac{n(n+1)}{2}`} />
          <p>
            5 שנים: <Tex>{String.raw`\frac{5 \cdot 6}{2} = 15`}</Tex>; 10 שנים: <Tex>{String.raw`\frac{10 \cdot 11}{2} = 55`}</Tex>; 20 שנים:{" "}
            <Tex>{String.raw`210`}</Tex>. כשיתרת החיים אינה מספר שלם (למשל אחרי שיפוץ באמצע שנה), המשקלים הם יתרת החיים בתחילת כל
            שנה — <Tex>{String.raw`3.5, 2.5, 1.5, 0.5`}</Tex> — וסכומם:
          </p>
          <Formula tex={String.raw`S = m\left(n - \frac{m-1}{2}\right),\quad m = \lceil n \rceil \qquad\Rightarrow\qquad n = 3.5:\; S = 4\,(3.5 - 1.5) = 8`} />
        </Callout>
        <Callout kind="check" title="בדיקת תקרת הגרט בשיטת יתרה פוחתת">
          <Formula tex={String.raw`CA_t \ge R \quad\text{לכל } t \qquad D_n = CA_{n-1} - R`} />
          <p>
            לפני שרושמים את הפחת של שנה, בודקים ש-<Tex>{String.raw`CA_{t-1}(1 - r) \ge R`}</Tex>. אם לא — הפחת הוא ההפרש עד לגרט,
            והפחת בשנים שאחריה הוא אפס.
          </p>
        </Callout>
        <Callout kind="check" title="סך הפחת זהה בכל השיטות">
          <p>
            בכל שיטה, סכום הפחת על פני כל אורך החיים שווה בדיוק ל-<Tex>{String.raw`C - R`}</Tex> (<Num v={BASE} /> בדוגמה). בסכום ספרות
            השנים יש בדיקה נוספת: הפחת יורד בכל שנה בסכום קבוע של <Tex>{String.raw`\frac{C - R}{S} = 13{,}333.33`}</Tex>.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
