// StatusPill — strict-palette status indicator. The brand palette is red /
// black / white / soft-gray only, so states are separated by TREATMENT + ICON
// (not by hue):
//   active    → white/black surface with a red accent ring + red dot
//   pending   → calm soft-gray
//   expired   → solid GymPro red (demands attention)
//   completed → outlined red with a check
//   live      → red pulse dot
//   neutral   → plain gray meta tag
import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatusTone =
  | "active"
  | "pending"
  | "expired"
  | "completed"
  | "live"
  | "neutral";

interface StatusPillProps {
  children: ReactNode;
  tone?: StatusTone;
  size?: "sm" | "md";
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  active: "bg-card text-foreground border border-primary/55 ring-1 ring-primary/15",
  pending: "bg-muted text-muted-foreground border border-border",
  expired: "bg-(image:--gradient-primary) text-white border border-primary glow-red-sm",
  completed: "bg-primary/10 text-primary border border-primary/35",
  live: "bg-primary/10 text-primary border border-primary/30",
  neutral: "bg-(--surface-secondary) text-(--text-secondary) border border-border",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export default function StatusPill({
  children,
  tone = "neutral",
  size = "md",
  className,
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold tracking-tight",
        toneClasses[tone],
        sizeClasses[size],
        className
      )}
    >
      {tone === "active" && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      )}
      {tone === "pending" && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
      )}
      {tone === "live" && <span className="pulse-dot" aria-hidden="true" />}
      {tone === "completed" && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
