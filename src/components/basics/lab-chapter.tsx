import type { ScreenContent } from "@/components/study-mode/shell";
import { KITS } from "@/lib/learn/basics";
import { TransactionLab } from "./lab";
import { Money } from "./ui";

export const LAB_SCREENS: Record<string, ScreenContent> = {
  lab: {
    lead: "עכשיו הכול ביחד: עסק אחד, פעולה אחר פעולה. כל פעולה היא פקודת יומן אחת, אחרי כל פקודה הכרטיסים זזים — והמאזן תמיד נשאר מאוזן.",
    body: (
      <>
        <p>
          ב-1.1.2023 פתחתם עסק שמוכר ערכות מדע לילדים. כל ערכה עולה לכם <Money v={KITS.unitCost} /> ונמכרת ב-<Money v={KITS.unitPrice} />. עברו על הפעולות אחת אחת:
        </p>
        <TransactionLab />
      </>
    ),
  },
};
