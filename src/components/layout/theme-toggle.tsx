"use client";

import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known on the client; render a stable placeholder on the server.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={mounted ? `מעבר למצב ${dark ? "בהיר" : "כהה"}` : "החלפת ערכת נושא"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mounted ? (dark ? "moon" : "sun") : "idle"}
          initial={{ y: -14, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 14, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.18 }}
        >
          {dark ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
