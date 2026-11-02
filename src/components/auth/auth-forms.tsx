"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { TrackEvent } from "@/components/layout/track-event";
import { FormAlert, SubmitButton, TextField } from "@/components/ui/form";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/types";
import { GOOGLE_AUTH_ENABLED } from "@/lib/env";

const initial: FormState = {};

/** Set by the proxy when this device was signed out because the account signed in on another. */
const REASONS: Record<string, string> = {
  elsewhere: "התנתקת כי החשבון התחבר ממכשיר אחר. אפשר להיות מחוברים ממכשיר אחד בכל פעם.",
};

/** "Continue with Google" and an "or" rule, above the email form. Shown once Google is enabled (NEXT_PUBLIC_GOOGLE_AUTH=1). */
function GoogleButton({ next }: { next: string }) {
  if (!GOOGLE_AUTH_ENABLED) return null;
  return (
    <>
      {/* A plain link, not prefetched: it starts the sign-in. */}
      <a
        href={`/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium text-fg transition hover:bg-surface-2"
      >
        <GoogleMark />
        המשך עם Google
      </a>
      <div className="flex items-center gap-3 text-xs text-subtle" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        או עם אימייל
        <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  // Set by /auth/confirm or /auth/callback when a sign-in link fails.
  const linkError = params.get("error")?.slice(0, 200);
  const reason = REASONS[params.get("reason") ?? ""];
  const [state, action] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormAlert error={state.error ?? linkError ?? reason} />
      <GoogleButton next={next} />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        autoFocus
      />
      <div>
        <TextField label="סיסמה" name="password" type="password" autoComplete="current-password" dir="ltr" required />
        <Link href="/forgot-password" className="mt-2 inline-block text-xs font-medium text-accent hover:underline">
          שכחתם את הסיסמה?
        </Link>
      </div>
      <SubmitButton className="w-full" size="lg">
        התחברות
      </SubmitButton>
    </form>
  );
}

/** Reads ?plan= from the URL: the plan chosen on the pricing page, kept on the new account. */
export function RegisterForm() {
  const params = useSearchParams();
  const plan = params.get("plan") ?? "";
  const next = params.get("next") ?? "";
  const [state, action] = useActionState(signUp, initial);
  if (state.ok)
    return (
      <>
        {/* Signed up, waiting on the email link. (Signed straight in, the dashboard records it.) */}
        <TrackEvent event={{ kind: "signup", meta: { plan: plan || "free", confirm: true } }} />
        <FormAlert message={state.message} />
      </>
    );
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="next" value={next} />
      <FormAlert error={state.error} />
      <GoogleButton next={next} />
      <TextField
        label="שם מלא"
        name="fullName"
        autoComplete="name"
        required
        defaultValue={state.values?.fullName}
        error={err.fullName}
        autoFocus
      />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        error={err.email}
      />
      <TextField
        label="סיסמה"
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={err.password}
        hint="לפחות 8 תווים, כולל אות וספרה."
      />
      <TextField label="אימות סיסמה" name="confirm" type="password" autoComplete="new-password" dir="ltr" required error={err.confirm} />
      <SubmitButton className="w-full" size="lg">
        יצירת חשבון
      </SubmitButton>
      <p className="text-center text-xs leading-relaxed text-subtle">
        ביצירת החשבון אתם מאשרים שהתכנים הם לצורכי לימוד ואינם מהווים ייעוץ מקצועי.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  if (state.ok) return <FormAlert message={state.message} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert error={state.error} />
      <TextField
        label="אימייל"
        name="email"
        type="email"
        autoComplete="email"
        dir="ltr"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
        autoFocus
      />
      <SubmitButton className="w-full" size="lg">
        שליחת קישור לאיפוס
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  if (state.ok) {
    return (
      <div className="space-y-4">
        <FormAlert message={state.message} />
        <Link href="/dashboard" className="block text-center text-sm font-medium text-accent hover:underline">
          המשך ללוח האישי
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormAlert error={state.error} />
      <TextField
        label="סיסמה חדשה"
        name="password"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={state.fieldErrors?.password}
        hint="לפחות 8 תווים, כולל אות וספרה."
        autoFocus
      />
      <TextField
        label="אימות הסיסמה החדשה"
        name="confirm"
        type="password"
        autoComplete="new-password"
        dir="ltr"
        required
        error={state.fieldErrors?.confirm}
      />
      <SubmitButton className="w-full" size="lg">
        עדכון הסיסמה
      </SubmitButton>
    </form>
  );
}

/** "Already have an account?" / "New here?": the link to the other form, keeping ?next= and ?plan= — so a checkout survives the switch. */
export function AuthSwitchLink({ to, children }: { to: "/login" | "/register"; children: React.ReactNode }) {
  const params = useSearchParams();
  const keep = new URLSearchParams();
  for (const k of ["next", "plan"]) {
    const v = params.get(k);
    if (v) keep.set(k, v);
  }
  const qs = keep.toString();
  return (
    <Link href={qs ? `${to}?${qs}` : to} className="font-medium text-accent hover:underline">
      {children}
    </Link>
  );
}
