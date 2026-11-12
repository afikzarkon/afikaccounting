import { isTester } from "@/lib/auth/dal";
import { TesterFeedbackButton } from "./feedback-button";

/** The floating feedback button, only for an account an admin marked as a tester (/admin/feedback). */
export async function TesterFeedbackGate() {
  return (await isTester()) ? <TesterFeedbackButton /> : null;
}
