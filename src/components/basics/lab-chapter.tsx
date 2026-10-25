import { Callout } from "@/components/study/blocks";
import { KITS } from "@/lib/learn/basics";
import { TransactionLab } from "./lab";
import { Chapter, Money, ReportTag } from "./ui";

export function TransactionLabChapter() {
  return (
    <Chapter n={7} id="lab" title="למידת פקודות יומן לפי סוגיהן" lead="פותחים עסק לערכות מדע לילדים — ורושמים כל סוג של פעולה, צעד אחר צעד">
      <p>
        ב-1.1.2023 פתחתם עסק שמוכר ערכות מדע לילדים. כל ערכה עולה לכם <Money v={KITS.unitCost} /> ונמכרת ב-<Money v={KITS.unitPrice} />. עברו על הפעולות אחת
        אחת: בכל צעד יש הסבר במילים, פקודת היומן, והיתרות אחריה — השורות שהשתנו מודגשות.
      </p>
      <p>
        ליד כל חשבון מופיע הסיווג שלו: <ReportTag account="מזומן" /> — נכס, התחייבות או הון, שעובר לשנה הבאה; <ReportTag account="מכירות" /> — הכנסה או הוצאה,
        שמתאפסת בסוף השנה. כך תראו בכל פקודה איזה צד שלה נוגע במאזן ואיזה ברווח והפסד.
      </p>
      <TransactionLab />
      <Callout kind="warn" title="למה זה חשוב">
        <p>
          בלי ספירת מלאי בסוף השנה, עסק שקנה הרבה סחורה ייראה מפסיד גם כשהוא מרוויח. המלאי שבמחסן הוא נכס — לא הוצאה שנעלמה. נחזור לזה בפרק 13.
        </p>
      </Callout>
    </Chapter>
  );
}
