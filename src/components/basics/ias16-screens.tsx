import type { ReactNode } from "react";
import { ExchangeCalculator } from "@/components/exchange/calculator";
import { ExchangeJournalSection } from "@/components/exchange/journal";
import { NewAssetSection } from "@/components/exchange/new-asset";
import { ExchangeStepsSection } from "@/components/exchange/steps";
import { ExamTipsSection } from "@/components/learn/exam-tips";
import { FundamentalsSection } from "@/components/learn/fundamentals";
import { MethodologySection } from "@/components/learn/methodology";
import { DepreciationSimulator } from "@/components/learn/simulator";
import { WhatIsPpeSection } from "@/components/learn/what-is-ppe";
import { RenovationCalculator } from "@/components/renovation/calculator";
import { DistinctionSection } from "@/components/renovation/distinction";
import { RenovationExamplesSection } from "@/components/renovation/examples";
import { RenovationStepsSection } from "@/components/renovation/steps";
import { RenovationTipsSection } from "@/components/renovation/tips";
import { RevaluationCalculator } from "@/components/revaluation/calculator";
import { CheckTipsSection } from "@/components/revaluation/check-tips";
import { RevaluationExamplesSection } from "@/components/revaluation/examples";
import { LandBuildingSection } from "@/components/revaluation/land-building";
import { RevaluationStandardSection } from "@/components/revaluation/standard";
import { RevaluationStepsSection } from "@/components/revaluation/steps";
import { YearlyRevaluationSection } from "@/components/revaluation/yearly";
import type { ScreenContent } from "@/components/study-mode/shell";

/**
 * A section of the former long page as a concept screen: whole, across the
 * screen's width (it was laid out for a full column), under the one principle
 * it teaches.
 */
const screen = (lead: string, body: ReactNode): ScreenContent => ({ lead, body: <div className="space-y-4 [column-span:all]">{body}</div> });

/** The concept screens of the fixed-assets course, by id: each section of the former page, with its principle on top. */
export const IAS16_SCREENS: Record<string, ScreenContent> = {
  "ppe-what": screen("רכוש קבוע הוא פריט מוחשי, שמוחזק כדי להשתמש בו בפעילות, ושישמש יותר מתקופה אחת — שלושה תנאים, וכולם צריכים להתקיים.", <WhatIsPpeSection />),
  concepts: screen("עלות, פחת וערך בספרים יושבים על ציר אחד: את העלות מפחיתים לאורך חיי הנכס עד ערך הגרט, ומה שנשאר בכל רגע הוא הערך בספרים.", <FundamentalsSection />),

  depreciation: screen("שיטת הפחת קובעת רק איך הסכום בר-הפחת מתחלק בין השנים — הסכום הכולל זהה בכל השיטות.", <DepreciationSimulator />),
  method: screen("כל שאלה על רכוש קבוע נפתרת באותם תשעה שלבים ובאותו סדר: קודם הנתונים וציר הזמן, ורק אחר כך החישובים.", <MethodologySection />),
  exam: screen("רוב הנקודות הולכות על כמה טעויות קבועות — מכירים אותן, ובודקים כל פתרון מולן.", <ExamTipsSection />),

  "renovation-distinction": screen("שיפוץ שמשפר את הנכס או מאריך את חייו נכנס לנכס; תחזוקה ששומרת עליו במצבו — הוצאה.", <DistinctionSection />),
  "renovation-steps": screen("בכל שיפוץ: פחת עד יום השיפוץ, מוסיפים את השיפוץ לערך בספרים, ומפחיתים את הבסיס החדש על יתרת אורך החיים.", <RenovationStepsSection />),
  "renovation-examples": screen("אותו שיפוץ בכל שיטת פחת: הבסיס החדש זהה, ורק החלוקה שלו בין השנים משתנה — במכנה חדש או בשיעור חדש.", <RenovationExamplesSection />),
  "renovation-calculator": screen("מזינים את הנכס ואת השיפוץ — והמחשבון מראה את הפחת לפני השיפוץ ואחריו, שנה אחרי שנה, עם כל הדרך.", <RenovationCalculator />),
  "renovation-tips": screen("הטעויות שחוזרות בשאלות שיפוץ: שוכחים את הפחת היחסי עד השיפוץ, ומפחיתים מהעלות במקום מהערך בספרים.", <RenovationTipsSection />),

  "exchange-steps": screen("שלושה שלבים קבועים לכל החלפה: תאריך ההחלפה, עדכון הפחת עד אליו, וסיווג העסקה — יש או אין מהות מסחרית.", <ExchangeStepsSection />),
  "exchange-entries": screen("בפקודת ההחלפה הנכס הישן יוצא כולו — עלותו והפחת שנצבר עליו — והנכס החדש נכנס בעלות שנקבעה לו.", <ExchangeJournalSection />),
  "exchange-new-asset": screen("מיום ההחלפה ועד סוף השנה מפחיתים את הנכס החדש, מהעלות שנקבעה לו בהחלפה.", <NewAssetSection />),
  "exchange-calculator": screen("מזינים את הנכס הישן ואת תנאי העסקה — והמחשבון מראה את הפחת, הסיווג, הפקודות והמשך השנה.", <ExchangeCalculator />),

  "revaluation-standard": screen("במודל הערכה מחדש הנכס מוצג בשווי ההוגן: עלייה לקרן הערכה מחדש, ירידה לרווח והפסד — וכל צד מבטל קודם את מה שהצד השני רשם.", <RevaluationStandardSection />),
  "revaluation-steps": screen("פחת עד יום ההערכה, פער לשווי ההוגן, סיווג הפער — ואז פחת חדש מהשווי ההוגן, על יתרת אורך החיים.", <RevaluationStepsSection />),
  "revaluation-land-building": screen("קרקע לא מופחתת, ולכן הקרן שלה עוברת לעודפים רק כשהיא נמכרת; במבנה אפשר להעביר אותה בהדרגה, לפי הפחת.", <LandBuildingSection />),
  "revaluation-examples": screen("בכל שיטת פחת, ההעברה לעודפים היא הפרש הפחת שנובע מההערכה — ובסוף החיים הקרן מתאפסת.", <RevaluationExamplesSection />),
  "revaluation-yearly": screen("כשמעריכים בכל שנה, חוזרים על אותו סדר בכל שנה: פחת, העברה לעודפים, ורק אז הערכה מחדש.", <YearlyRevaluationSection />),
  "revaluation-check": screen("כשמעבירים את הקרן לעודפים לפי הפחת, יתרתה בכל רגע שווה לערך בספרים לפי ההערכה, פחות הערך בספרים לפי העלות — בדיקה שתופסת כמעט כל טעות.", <CheckTipsSection />),
  "revaluation-calculator": screen("מזינים את הנכס ואת ההערכות — והמחשבון מראה כל שנה: פחת, העברה לעודפים, הערכה מחדש וקרן.", <RevaluationCalculator />),
};
