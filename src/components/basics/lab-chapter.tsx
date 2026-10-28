import { KITS } from "@/lib/learn/basics";
import { TransactionLab } from "./lab";
import { Lesson, Money } from "./ui";

export function TransactionLabChapter() {
  return (
    <Lesson id="lab" lead="כל פעולה בעסק היא פקודת יומן אחת. אחרי כל פקודה הכרטיסים זזים — והמאזן תמיד נשאר מאוזן.">
      <p>
        ב-1.1.2023 פתחתם עסק שמוכר ערכות מדע לילדים. כל ערכה עולה לכם <Money v={KITS.unitCost} /> ונמכרת ב-<Money v={KITS.unitPrice} />. עברו על הפעולות אחת אחת:
      </p>
      <TransactionLab />
    </Lesson>
  );
}
