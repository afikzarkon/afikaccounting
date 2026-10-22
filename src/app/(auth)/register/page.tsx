import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "יצירת חשבון" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="יצירת חשבון"
      description="שמרו תרחישים, עקבו אחרי שיעורים והמשיכו מהמקום שבו עצרתם."
      footer={
        <>
          כבר יש לכם חשבון?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            התחברות
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
