"use client";

import { Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { addTester, removeTester } from "@/lib/actions/admin-testers";
import { Field } from "./modal";

/** Mark an account as a tester by its email. */
export function AddTester() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const run = async () => {
    setBusy(true);
    const res = await addTester({ email });
    setBusy(false);
    setMessage(res.ok ? { ok: true, text: `${email} מוגדר עכשיו כניסיין.` } : { ok: false, text: res.error });
    if (res.ok) setEmail("");
  };

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (email && !busy) void run();
      }}
    >
      <div className="min-w-64 flex-1">
        <Field label="אימייל של משתמש רשום">
          <input type="email" dir="ltr" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </Field>
      </div>
      <Button type="submit" disabled={busy || !email}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} הוספת ניסיין
      </Button>
      {message && <p className={message.ok ? "w-full text-sm text-success" : "w-full text-sm text-danger"}>{message.text}</p>}
    </form>
  );
}

export function RemoveTester({ userId, email }: { userId: string; email: string }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!confirm(`להסיר את ${email} מהניסיינים? הכפתור והטופס ייעלמו לו. מה שכבר כתב יישאר כאן.`)) return;
    setBusy(true);
    const res = await removeTester(userId);
    setBusy(false);
    if (!res.ok) alert(res.error);
  };
  return (
    <Button variant="danger" size="sm" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} הסרה
    </Button>
  );
}
