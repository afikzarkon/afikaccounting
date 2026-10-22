"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { recordActivity } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "./types";

const field = (fd: FormData, name: string) => String(fd.get(name) ?? "").trim();

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "תוקף ההתחברות פג. יש להתחבר מחדש." };

  const values = {
    fullName: field(fd, "fullName"),
    organization: field(fd, "organization"),
    jobTitle: field(fd, "jobTitle"),
    preferredStandard: field(fd, "preferredStandard"),
  };
  const fieldErrors: Record<string, string> = {};
  if (values.fullName.length < 2) fieldErrors.fullName = "יש להזין שם.";
  for (const [k, v] of Object.entries(values)) if (v.length > 120) fieldErrors[k] = "עד 120 תווים.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      organization: values.organization,
      job_title: values.jobTitle,
      preferred_standard: values.preferredStandard.slice(0, 40),
    })
    .eq("id", user.id);
  if (error) return { error: error.message, values };

  await recordActivity("profile_updated", "עדכון פרטי הפרופיל", "/profile");
  refresh();
  return { ok: true, message: "הפרופיל נשמר.", values };
}
