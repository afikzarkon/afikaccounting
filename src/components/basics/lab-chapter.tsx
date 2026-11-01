import type { ScreenContent } from "@/components/study-mode/shell";
import { CANDLES } from "@/lib/learn/basics";
import { TransactionLab } from "./lab";
import { Money } from "./ui";

export const LAB_SCREENS: Record<string, ScreenContent> = {
  lab: {
    lead: "עכשיו הכול ביחד: עסק אחד, פעולה אחר פעולה. כל פעולה היא פקודת יומן אחת, אחרי כל פקודה הכרטיסים זזים — והמאזן תמיד נשאר מאוזן.",
    body: (
      <>
        <p>
          ב-1.3.2025 פתחתם סדנה קטנה שמכינה ומוכרת נרות. כל נר עולה לכם <Money v={CANDLES.unitCost} /> ונמכר ב-<Money v={CANDLES.unitPrice} />. עברו על הפעולות אחת אחת:
        </p>
        <TransactionLab />
      </>
    ),
  },
};
