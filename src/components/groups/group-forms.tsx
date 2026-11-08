"use client";

import { useActionState } from "react";
import { FormAlert, inputClass, SubmitButton, TextField } from "@/components/ui/form";
import { createGroup, type GroupFormState, joinGroup } from "@/lib/actions/groups";

const initial: GroupFormState = {};

/** A new group: its name, the course, the exam date (optional), and the reader's name in it. */
export function CreateGroupForm({ courses, course, name }: { courses: { id: string; label: string }[]; course?: string; name: string }) {
  const [state, action] = useActionState(createGroup, initial);
  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state.error} />
      <TextField label="שם הקבוצה" name="name" required maxLength={60} placeholder="למשל: IAS 16 — הקבוצה של יום שלישי" />
      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-fg" htmlFor="group-course">
          הקורס
        </label>
        <select id="group-course" name="course" defaultValue={course ?? courses[0]?.id} className={inputClass}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <TextField label="תאריך המבחן (לא חובה)" name="exam_date" type="date" dir="ltr" />
      <TextField label="השם שלכם בקבוצה" name="display_name" required maxLength={40} defaultValue={name} hint="רק חברי הקבוצה יראו אותו." />
      <SubmitButton className="w-full sm:w-auto">פתיחת הקבוצה</SubmitButton>
    </form>
  );
}

/** Join from an invite link: the reader's name in the group, and the code from the link. */
export function JoinGroupForm({ code, name }: { code: string; name: string }) {
  const [state, action] = useActionState(joinGroup, initial);
  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state.error} />
      <input type="hidden" name="code" value={code} />
      <TextField label="השם שלכם בקבוצה" name="display_name" required maxLength={40} defaultValue={name} hint="רק חברי הקבוצה יראו אותו." />
      <SubmitButton className="w-full sm:w-auto">הצטרפות לקבוצה</SubmitButton>
    </form>
  );
}
