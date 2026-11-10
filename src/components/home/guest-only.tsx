"use client";

import type { ReactNode } from "react";
import { useSession } from "@/components/layout/session-store";

/** Shown to guests and while the session is still unknown; hidden once we know the reader is signed in (the "why sign up" band). */
export function GuestOnly({ children }: { children: ReactNode }) {
  const session = useSession();
  if (session.known && session.signedIn) return null;
  return <>{children}</>;
}
