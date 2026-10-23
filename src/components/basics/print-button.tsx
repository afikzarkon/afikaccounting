"use client";

import type { ReactNode } from "react";

/** Prints the cheat sheet alone: the page's print styles hide everything else while `printing-sheet` is set. */
export function PrintButton({ icon }: { icon: ReactNode }) {
  const print = () => {
    document.documentElement.classList.add("printing-sheet");
    const done = () => {
      document.documentElement.classList.remove("printing-sheet");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };
  return (
    <button type="button" onClick={print} className="no-print inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-line hover:text-fg">
      {icon} הדפסה
    </button>
  );
}
