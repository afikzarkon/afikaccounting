import {
  ArrowLeftRight,
  Building2,
  Calculator,
  CalendarRange,
  CircleHelp,
  Coins,
  Factory,
  Hammer,
  Landmark,
  LandPlot,
  type LucideIcon,
  Scale,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { CalculatorSchema } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

/** Calculator schemas name their icon as a string so they stay JSON; resolve it here. */
const ICONS: Record<string, LucideIcon> = { Building2, Factory, Scale, Landmark };

const SECTION_ICONS: Record<string, LucideIcon> = {
  ArrowLeftRight,
  CalendarRange,
  CircleHelp,
  Coins,
  Hammer,
  LandPlot,
  Search,
  TrendingDown,
  TrendingUp,
};

/** The icon a calculator assigns to a wizard section, or nothing. */
export function SectionIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? SECTION_ICONS[name] : undefined;
  if (!Icon) return null;
  return (
    <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent", className)}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

export const ACCENTS: Record<CalculatorSchema["accent"], { tile: string; glow: string; text: string }> = {
  sky: {
    tile: "from-sky-500/20 to-blue-600/10 text-sky-600 dark:text-sky-300 ring-sky-500/20",
    glow: "group-hover:shadow-[0_20px_60px_-25px_rgb(14_165_233_/_0.55)]",
    text: "text-sky-600 dark:text-sky-300",
  },
  violet: {
    tile: "from-violet-500/20 to-fuchsia-600/10 text-violet-600 dark:text-violet-300 ring-violet-500/20",
    glow: "group-hover:shadow-[0_20px_60px_-25px_rgb(139_92_246_/_0.55)]",
    text: "text-violet-600 dark:text-violet-300",
  },
  amber: {
    tile: "from-amber-500/20 to-orange-600/10 text-amber-600 dark:text-amber-300 ring-amber-500/20",
    glow: "group-hover:shadow-[0_20px_60px_-25px_rgb(245_158_11_/_0.5)]",
    text: "text-amber-600 dark:text-amber-300",
  },
  emerald: {
    tile: "from-emerald-500/20 to-teal-600/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/20",
    glow: "group-hover:shadow-[0_20px_60px_-25px_rgb(16_185_129_/_0.5)]",
    text: "text-emerald-600 dark:text-emerald-300",
  },
};

export function CalculatorIcon({
  calc,
  className,
}: {
  calc: Pick<CalculatorSchema, "icon" | "accent">;
  className?: string;
}) {
  const Icon = ICONS[calc.icon] ?? Calculator;
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1",
        ACCENTS[calc.accent].tile,
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}
