import { isTester } from "@/lib/auth/dal";
import { unseenTesterUpdates } from "@/lib/actions/tester-updates";
import { TesterMarker } from "./tester-marker";
import { TesterUpdatesPopup } from "./updates-popup";

/**
 * Only for an account an admin marked as a tester (/admin/feedback): the rating under every lesson
 * page (turned on by the marker), and the window with the updates published since they last looked.
 */
export async function TesterFeedbackGate() {
  if (!(await isTester())) return null;
  const updates = await unseenTesterUpdates();
  return (
    <>
      <TesterMarker />
      <TesterUpdatesPopup updates={updates} />
    </>
  );
}
