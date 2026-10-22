"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { purgeEvents } from "@/lib/actions/admin-settings";

export function PurgeEvents() {
  const [days, setDays] = useState(365);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  const run = async () => {
    if (!confirm(`למחוק לצמיתות את כל אירועי האנליטיקה שנרשמו לפני יותר מ-${days} ימים?`)) return;
    setBusy(true);
    const res = await purgeEvents(days);
    setBusy(false);
    setMessage(res.ok ? `נמחקו ${res.deleted ?? 0} אירועים.` : res.error);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-fg">שמירת נתונים (ימים)</span>
        <input type="number" min={30} className={`${inputClass} w-32`} value={days} onChange={(e) => setDays(Number(e.target.value))} />
      </label>
      <Button variant="danger" onClick={run} disabled={busy || days < 30}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} מחיקת אירועים ישנים
      </Button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
