import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "איפוס סיסמה" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="איפוס הסיסמה"
      description="הזינו את כתובת האימייל ונשלח אליכם קישור לבחירת סיסמה חדשה."
      footer={
        <Link href="/login" className="font-medium text-accent hover:underline">
          חזרה להתחברות
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
