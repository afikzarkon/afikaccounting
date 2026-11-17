"use client";

import { useEffect } from "react";
import { markTester } from "@/lib/tester/store";

/** Rendered only for a tester (components/tester/feedback-gate.tsx): tells the lessons to show the rating and hold "next". */
export function TesterMarker() {
  useEffect(markTester, []);
  return null;
}
