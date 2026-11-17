import { getCurrentUser } from "@/lib/auth/dal";
import { PresencePing } from "./presence-ping";

/** Only a signed-in account reports that it is on the site (for "active now" in /admin/users). */
export async function PresenceGate() {
  return (await getCurrentUser()) ? <PresencePing /> : null;
}
