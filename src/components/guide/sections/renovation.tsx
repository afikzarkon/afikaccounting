import { Callout, DataTable, Dt, Givens, JournalEntry, Num, Steps, Topic } from "../blocks";
import { Formula, Tex } from "../math";
import { decliningBalance } from "./depreciation";

const RENO = 60_000;
const NEW_RESIDUAL = 25_000;
const NEW_LIFE = 4;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Rows from the renovation year (X3) on: [year, charge, closing carrying amount]. */
function after(charges: number[], opening: number) {
  let ca = opening;
  return charges.map((d, i) => {
    ca -= d;
    return [`X${3 + i}`, r2(d), r2(ca)];
  });
}

const HEAD = ["שנה", "הוצאות פחת", "יתרה בספרים בסוף השנה"];

const SL_AFTER = Array.from({ length: NEW_LIFE }, () => (140_000 + RENO - NEW_RESIDUAL) / NEW_LIFE);
const SYD_AFTER = [4, 3, 2, 1].map((k) => ((100_000 + RENO - NEW_RESIDUAL) * k) / 10);
const DB_AFTER = decliningBalance(79_200 + RENO, NEW_RESIDUAL, 0.4, NEW_LIFE);

export function RenovationSection() {
  return (
    <>
      <Topic title="מתי מהוונים ואיך מחשבים מחדש" refs="IAS 16.7, 16.12–13, 16.51" open>
        <p>
          עלות שיפוץ מוכרת כנכס רק אם צפויות ממנה הטבות כלכליות עתידיות והיא ניתנת למדידה מהימנה (16.7). תיקונים ותחזוקה שוטפת
          נזקפים לרווח והפסד (16.12). כשהשיפוץ מחליף חלק מהנכס — גורעים את היתרה בספרים של החלק המוחלף (16.13).
        </p>
        <p>
          עדכון אורך החיים או ערך השייר הוא <strong>שינוי באומדן</strong> (IAS 8), ולכן מטופל <strong>מכאן ולהבא</strong>: לא מתקנים
          את הפחת של שנים קודמות, אלא מפחיתים את היתרה החדשה על פני יתרת החיים המעודכנת.
        </p>
        <Formula
          tex={String.raw`B_{\text{new}} = \left(CA_{\text{before}} + \text{Renovation}\right) - R_{\text{new}}`}
          legend={[["CA_{\\text{before}}", "יתרה בספרים ערב השיפוץ"], ["R_{\\text{new}}", "ערך שייר מעודכן"], ["n_{\\text{new}}", "יתרת חיים מעודכנת"]]}
        />
        <Givens
          title="נתונים משותפים לשלוש השיטות"
          items={[
            [<>עלות מקורית (<Dt>1.1.X1</Dt>)</>, <Num key="c" v={220_000} />],
            ["ערך שייר / אורך חיים מקוריים", "20,000 / 5 שנים"],
            ["מועד השיפוץ", <><Dt>1.1.X3</Dt> (אחרי שנתיים)</>],
            ["עלות השיפוץ המהוונת", <Num key="r" v={RENO} />],
            ["יתרת חיים", "3 שנים ← 4 שנים (X3–X6)"],
            ["ערך שייר מעודכן", <Num key="nr" v={NEW_RESIDUAL} />],
          ]}
        />
        <JournalEntry
          title="היוון השיפוץ"
          date="1.1.X3"
          lines={[
            { account: "רכוש קבוע — ציוד", dr: RENO },
            { account: "מזומן / ספקים", cr: RENO },
          ]}
        />
      </Topic>

      <Topic title="שיפוץ בשיטת הקו הישר" refs="IAS 16.51">
        <Steps
          items={[
            <>
              ערב השיפוץ: <Tex>{String.raw`CA = 220{,}000 - 2 \cdot 40{,}000 = 140{,}000`}</Tex>
            </>,
            <>
              בסיס פחת חדש: <Tex>{String.raw`(140{,}000 + 60{,}000) - 25{,}000 = 175{,}000`}</Tex>
            </>,
            <>
              פחת שנתי חדש: <Tex>{String.raw`\frac{175{,}000}{4} = 43{,}750`}</Tex> (במקום 40,000)
            </>,
          ]}
        />
        <DataTable
          caption="לפני השיפוץ מול אחרי השיפוץ"
          head={["", "לפני", "אחרי"]}
          rows={[
            ["בסיס פחת", 120_000, 175_000],
            ["יתרת חיים (שנים)", 3, 4],
            ["פחת שנתי", 40_000, 43_750],
          ]}
        />
        <DataTable head={HEAD} rows={after(SL_AFTER, 200_000)} foot={["סה״כ", 175_000, ""]} />
      </Topic>

      <Topic title="שיפוץ בשיטת סכום ספרות השנים" refs="IAS 16.51, 16.62">
        <p>
          אחרי השיפוץ <strong>מתחילים סדרת ספרות חדשה</strong> לפי יתרת החיים המעודכנת — לא ממשיכים את הסדרה המקורית (3, 2, 1).
        </p>
        <Steps
          items={[
            <>
              פחת שנצבר: <Tex>{String.raw`200{,}000 \cdot \frac{5 + 4}{15} = 120{,}000`}</Tex>, ולכן{" "}
              <Tex>{String.raw`CA = 100{,}000`}</Tex>
            </>,
            <>
              בסיס פחת חדש: <Tex>{String.raw`(100{,}000 + 60{,}000) - 25{,}000 = 135{,}000`}</Tex>
            </>,
            <>
              סכום ספרות חדש ל-4 שנים: <Tex>{String.raw`S = \frac{4 \cdot 5}{2} = 10`}</Tex>
            </>,
            <>
              X3: <Tex>{String.raw`135{,}000 \cdot \frac{4}{10} = 54{,}000`}</Tex>
            </>,
          ]}
        />
        <DataTable
          caption="לפני השיפוץ מול אחרי השיפוץ"
          head={["שנה", "לפני — משקל", "לפני — פחת", "אחרי — משקל", "אחרי — פחת"]}
          rows={[
            ["X3", "3/15", 40_000, "4/10", 54_000],
            ["X4", "2/15", 26_666.67, "3/10", 40_500],
            ["X5", "1/15", 13_333.33, "2/10", 27_000],
            ["X6", "—", "—", "1/10", 13_500],
          ]}
          foot={["סה״כ", "", 80_000, "", 135_000]}
        />
        <p className="text-sm text-muted">
          בדיקה: <Num v={SYD_AFTER.reduce((a, b) => a + b, 0)} /> = 135,000 ✓
        </p>
      </Topic>

      <Topic title="שיפוץ בשיטת יתרה פוחתת" refs="IAS 16.51, 16.62">
        <p>
          עלות השיפוץ <strong>מתווספת ליתרה בספרים</strong>, וממשיכים להפחית לפי האחוז הקבוע (40%) — עם תקרת הגרט המעודכן.
        </p>
        <Steps
          items={[
            <>
              ערב השיפוץ: <Tex>{String.raw`CA = 220{,}000 - 88{,}000 - 52{,}800 = 79{,}200`}</Tex>
            </>,
            <>
              אחרי ההיוון: <Tex>{String.raw`79{,}200 + 60{,}000 = 139{,}200`}</Tex>
            </>,
            <>
              X3: <Tex>{String.raw`139{,}200 \cdot 40\% = 55{,}680`}</Tex> (לפני השיפוץ היה <Tex>{String.raw`79{,}200 \cdot 40\% = 31{,}680`}</Tex>)
            </>,
          ]}
        />
        <DataTable head={HEAD} rows={after(DB_AFTER, 139_200)} foot={["סה״כ", r2(DB_AFTER.reduce((a, b) => a + b, 0)), ""]} highlight={[3]} />
        <p className="text-sm text-muted">
          בשנה האחרונה (X6) הפחת נעצר על <Num v={5_067.2} /> כדי שהיתרה לא תרד מתחת לגרט המעודכן; סה״כ{" "}
          <Tex>{String.raw`139{,}200 - 25{,}000 = 114{,}200`}</Tex> ✓
        </p>
        <Callout kind="warn" title="יתרה פוחתת כפולה — השיעור משתנה עם אורך החיים">
          <p>
            אם השאלה מגדירה <em>יתרה פוחתת כפולה</em> ולא אחוז קבוע, השיעור הוא <Tex>{String.raw`\frac{2}{n_{\text{new}}}`}</Tex> לפי
            יתרת החיים המעודכנת (כך מחשב גם המנוע). כאן: <Tex>{String.raw`\frac{2}{4} = 50\%`}</Tex>, כלומר{" "}
            <Tex>{String.raw`139{,}200 \cdot 50\% = 69{,}600`}</Tex> ב-X3.
          </p>
        </Callout>
      </Topic>

      <Topic title="שיפוץ באמצע שנה (קו ישר)" refs="IAS 16.51">
        <Givens
          items={[
            ["מועד השיפוץ", <Dt key="d">1.7.X3</Dt>],
            ["עלות השיפוץ", <Num key="r" v={68_000} />],
            ["יתרת חיים", "2.5 שנים ← 3.5 שנים (42 חודשים)"],
            ["ערך שייר", "ללא שינוי — 20,000"],
          ]}
        />
        <Steps
          items={[
            <>
              מחצית ראשונה של X3 (לפי האומדן הישן): <Tex>{String.raw`40{,}000 \cdot \tfrac{6}{12} = 20{,}000`}</Tex>
            </>,
            <>
              יתרה בספרים ב-<Dt>30.6.X3</Dt>: <Tex>{String.raw`220{,}000 - 100{,}000 = 120{,}000`}</Tex>
            </>,
            <>
              בסיס פחת חדש: <Tex>{String.raw`(120{,}000 + 68{,}000) - 20{,}000 = 168{,}000`}</Tex>
            </>,
            <>
              פחת חודשי חדש: <Tex>{String.raw`\frac{168{,}000}{42} = 4{,}000`}</Tex>; מחצית שנייה: <Num v={24_000} />
            </>,
            <>
              סה״כ X3: <Tex>{String.raw`20{,}000 + 24{,}000 = 44{,}000`}</Tex>; משנת X4 — <Num v={48_000} /> לשנה.
            </>,
          ]}
        />
      </Topic>

      <Topic title="💡 טריקים ובדיקות נאותות לשיפוצים" open>
        <Callout title="טריק בסיס הפחת החדש">
          <Formula tex={String.raw`\text{בסיס פחת חדש} = \left(\text{יתרה בספרים ערב השיפוץ} + \text{עלות השיפוץ}\right) - \text{גרט מעודכן}`} />
          <p>
            תמיד מתחילים מהיתרה בספרים — לא מהעלות המקורית. בשיטת היתרה הפוחתת לא מנכים את הגרט מהבסיס, אבל הוא ממשיך לשמש תקרה.
          </p>
        </Callout>
        <Callout kind="check" title="אימפולס פחת במחצית השנייה">
          <p>היחס בין הפחת החודשי אחרי השיפוץ לפחת שלפניו חייב להיות מכפלת שני יחסים — הבסיס ויתרת החיים:</p>
          <Formula tex={String.raw`\frac{D_{\text{after}}}{D_{\text{before}}} = \frac{B_{\text{new}}}{B_{\text{old}}} \cdot \frac{n_{\text{old}}}{n_{\text{new}}} = \frac{168{,}000}{100{,}000} \cdot \frac{30}{42} = 1.2`} />
          <p>
            ואכן <Tex>{String.raw`3{,}333.33 \times 1.2 = 4{,}000`}</Tex> ✓. כאן <Tex>{String.raw`B_{\text{old}}`}</Tex> הוא הבסיס
            שנותר להפחתה ערב השיפוץ (<Tex>{String.raw`120{,}000 - 20{,}000`}</Tex>) ו-<Tex>{String.raw`n_{\text{old}}`}</Tex> הוא יתרת
            החיים לפי האומדן הישן (30 חודשים).
          </p>
        </Callout>
        <Callout kind="warn" title="שינוי אומדן אינו מתקן את העבר">
          <p>
            אם הפחת של השנים שלפני השיפוץ משתנה בפתרון שלכם — טיפלתם בשינוי כתיקון טעות. הפחת עד מועד השיפוץ נשאר לפי האומדן
            הישן.
          </p>
        </Callout>
      </Topic>
    </>
  );
}
