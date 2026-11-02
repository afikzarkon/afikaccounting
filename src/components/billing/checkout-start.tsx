"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form";
import { startCheckout } from "@/lib/actions/billing";
import { track } from "@/lib/analytics/track";

/**
 * Agreeing to the terms (renewal, cancellation) comes first — a ticked box, not
 * a line of small print — and then the button opens the provider's payment
 * page; on a failure, says why and offers to try again.
 */
export function CheckoutStart({ tier, interval, from }: { tier: string; interval: string; from?: string }) {
  const [error, setError] = useState<string>();
  const [agreed, setAgreed] = useState(false);
  const [going, setGoing] = useState(false);
  const id = useId();
  const go = async () => {
    setError(undefined);
    setGoing(true);
    const res = await startCheckout({ tier, interval, from });
    if (!res.ok || !res.url) {
      setGoing(false);
      return setError(res.ok ? "לא התקבל דף תשלום." : res.error);
    }
    track({ kind: "checkout_start", target: tier, meta: { interval } });
    window.location.assign(res.url);
  };
  if (going)
    return (
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden /> מעבירים לדף התשלום המאובטח…
        <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
      </p>
    );
  return (
    <div className="space-y-4">
      <FormAlert error={error} />
      <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed text-muted marker:text-subtle">
        <li>המנוי מתחדש אוטומטית בסוף כל {interval === "year" ? "שנה" : "חודש"}, עד שתבטלו אותו בדף הפרופיל.</li>
        <li>בתוך 14 יום אפשר לבטל ולקבל החזר, בניכוי דמי ביטול של 5% או 100 ₪ — הנמוך מביניהם.</li>
        <li>אחרי כן — ביטול בכל עת: החיוב הבא לא יתבצע, והגישה נשארת עד סוף התקופה ששולמה.</li>
      </ul>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <label htmlFor={id} className="text-sm leading-relaxed text-fg">
          קראתי ואני מסכים/ה ל
          <Link href="/terms" target="_blank" className="font-medium text-accent hover:underline">
            תנאי השימוש
          </Link>
          , כולל{" "}
          <Link href="/terms#cancel" target="_blank" className="font-medium text-accent hover:underline">
            מדיניות הביטול
          </Link>
          , ול
          <Link href="/privacy" target="_blank" className="font-medium text-accent hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </label>
      </div>
      <Button onClick={go} disabled={!agreed} className="w-full" size="lg">
        <ShieldCheck className="h-4 w-4" aria-hidden /> {error ? "לנסות שוב" : "המשך לתשלום מאובטח"}
      </Button>
    </div>
  );
}
