"use client";

import { useActionState } from "react";
import { FormAlert, inputClass, SubmitButton, TextField } from "@/components/ui/form";
import { updateProfile } from "@/lib/actions/profile";
import type { FormState } from "@/lib/actions/types";
import type { Profile } from "@/lib/auth/dal";

export function ProfileForm({ profile, standards }: { profile: Profile | null; standards: string[] }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const v = state.values ?? {
    fullName: profile?.fullName ?? "",
    organization: profile?.organization ?? "",
    jobTitle: profile?.jobTitle ?? "",
    preferredStandard: profile?.preferredStandard ?? "",
  };
  const err = state.fieldErrors ?? {};

  return (
    // Keyed on the submitted values so inputs pick up the server's echo after a save.
    <form action={action} key={JSON.stringify(v)} className="space-y-5" noValidate>
      <FormAlert error={state.error} message={state.ok ? state.message : undefined} />
      <TextField label="שם מלא" name="fullName" autoComplete="name" defaultValue={v.fullName} error={err.fullName} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="ארגון"
          name="organization"
          autoComplete="organization"
          defaultValue={v.organization}
          error={err.organization}
        />
        <TextField label="תפקיד" name="jobTitle" autoComplete="organization-title" defaultValue={v.jobTitle} error={err.jobTitle} />
      </div>
      <div>
        <label htmlFor="preferredStandard" className="mb-1.5 block text-[13px] font-medium text-fg">
          תקן עיקרי
        </label>
        <select id="preferredStandard" name="preferredStandard" defaultValue={v.preferredStandard} className={inputClass}>
          <option value="">ללא העדפה</option>
          {standards.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">משמש להתאמת ההמלצות בלוח האישי.</p>
      </div>
      <div className="flex justify-end">
        <SubmitButton>שמירת השינויים</SubmitButton>
      </div>
    </form>
  );
}
