export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so the form keeps them after an error. */
  values?: Record<string, string>;
};

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "לפחות 8 תווים.";
  if (password.length > 72) return "עד 72 תווים.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "יש לכלול לפחות אות אחת וספרה אחת.";
  return null;
}
