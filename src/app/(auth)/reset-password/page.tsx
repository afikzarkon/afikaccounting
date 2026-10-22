import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "בחירת סיסמה חדשה" };

/** Reached from the reset email via /auth/confirm, which signs the user in first. */
export default function ResetPasswordPage() {
  return (
    <AuthCard title="בחירת סיסמה חדשה" description="בחרו סיסמה שלא השתמשתם בה כאן בעבר.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
