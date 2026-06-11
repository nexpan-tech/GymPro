// Delight system — celebration & momentum micro-moments built on the GymPro
// design language. Strict palette (red / black / white / soft-gray), CSS-only
// motion, reduced-motion safe. These turn "software" into a "fitness experience".
import { type ReactNode, useEffect, useState } from "react";
import { TrendingUp, TrendingDown, X, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";

// ─── CelebrationBanner ──────────────────────────────────────────────────────
// Big jet-black/red moment: revenue milestones, great month, etc.
interface CelebrationBannerProps {
  icon?: ReactNode;
  /** Emoji rendered before the title when no icon node is supplied. */
  emoji?: string;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function CelebrationBanner({
  icon, emoji, title, message, action, onDismiss, className,
}: CelebrationBannerProps) {
  return (
    <section
      className={cn(
        "command-surface sheen celebrate relative flex items-center gap-4 p-6 md:gap-5",
        className
      )}
      role="status"
    >
      <span className="float-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-2xl shadow-[0_14px_38px_rgba(231,55,37,0.45)] [&_svg]:h-7 [&_svg]:w-7 [&_svg]:text-white">
        {icon ?? emoji ?? <Trophy />}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-display text-xl text-white md:text-2xl">{title}</h3>
        {message && <p className="mt-1 text-sm leading-relaxed text-white/70">{message}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </section>
  );
}

// ─── EncouragementBanner ────────────────────────────────────────────────────
// Softer, supportive nudge — light surface, red accent rail.
interface EncouragementBannerProps {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EncouragementBanner({ icon, title, message, action, className }: EncouragementBannerProps) {
  return (
    <div
      className={cn(
        "surface-card relative flex items-center gap-4 overflow-hidden p-5 pl-6",
        "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-(image:--gradient-primary)",
        className
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 [&_svg]:h-5 [&_svg]:w-5">
        {icon ?? <Sparkles />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-black tracking-tight text-(--text-primary)">{title}</p>
        {message && <p className="mt-0.5 text-sm text-(--text-secondary)">{message}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── MilestoneCard ──────────────────────────────────────────────────────────
// Celebrates a single achieved number (streak, revenue, members).
interface MilestoneCardProps {
  icon?: ReactNode;
  emoji?: string;
  value: ReactNode;
  label: ReactNode;
  caption?: ReactNode;
  /** When true, renders as an achieved/glowing card. */
  achieved?: boolean;
  className?: string;
}

export function MilestoneCard({ icon, emoji, value, label, caption, achieved = true, className }: MilestoneCardProps) {
  return (
    <div
      className={cn(
        "surface-card lift relative overflow-hidden p-5 text-center",
        achieved && "sheen ring-1 ring-primary/30",
        className
      )}
    >
      <span
        className={cn(
          "mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-xl [&_svg]:h-6 [&_svg]:w-6",
          achieved
            ? "bg-(image:--gradient-primary) text-white shadow-[0_10px_26px_rgba(231,55,37,0.4)]"
            : "bg-muted text-(--text-muted) ring-1 ring-border"
        )}
      >
        {icon ?? emoji ?? <Trophy />}
      </span>
      <p className="metric-number count-in text-3xl text-(--text-primary)">{value}</p>
      <p className="mt-1 text-sm font-bold text-(--text-primary)">{label}</p>
      {caption && <p className="mt-0.5 text-xs text-(--text-muted)">{caption}</p>}
    </div>
  );
}

// ─── MomentumIndicator ──────────────────────────────────────────────────────
// Compact trend chip — "+12.4% momentum". Red for up (energy), gray for down.
interface MomentumIndicatorProps {
  value: number;
  label?: ReactNode;
  /** Force direction; otherwise derived from the sign of value. */
  direction?: "up" | "down";
  className?: string;
}

export function MomentumIndicator({ value, label, direction, className }: MomentumIndicatorProps) {
  const dir = direction ?? (value >= 0 ? "up" : "down");
  const Icon = dir === "up" ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
        dir === "up" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
      {label && <span className="font-semibold opacity-80">{label}</span>}
    </span>
  );
}

// ─── ProgressReveal ─────────────────────────────────────────────────────────
// Animated progress bar that fills from 0 on mount. value = 0..100.
interface ProgressRevealProps {
  value: number;
  label?: ReactNode;
  caption?: ReactNode;
  /** Show the % value on the right of the label row. */
  showValue?: boolean;
  className?: string;
}

export function ProgressReveal({ value, label, caption, showValue = true, className }: ProgressRevealProps) {
  const pct = Math.max(0, Math.min(100, value));
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-xs font-bold text-(--text-secondary)">{label}</span>}
          {showValue && <span className="text-xs font-black tabular-nums text-primary">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-(--surface-secondary)" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="progress-reveal h-full rounded-full bg-(image:--gradient-primary)"
          style={{ width: `${w}%`, boxShadow: pct > 0 ? "0 0 12px rgba(231,55,37,0.5)" : "none" }}
        />
      </div>
      {caption && <p className="mt-1.5 text-xs text-(--text-muted)">{caption}</p>}
    </div>
  );
}

// ─── SuccessState ───────────────────────────────────────────────────────────
// Full celebratory confirmation (e.g. after an action completes).
interface SuccessStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SuccessState({ title, message, action, size = "md", className }: SuccessStateProps) {
  const pad = size === "sm" ? "py-8" : size === "lg" ? "py-16" : "py-12";
  return (
    <div className={cn("flex flex-col items-center px-6 text-center", pad, className)} role="status">
      <div className="celebrate relative mb-5">
        <span className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-2xl" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-(image:--gradient-primary) text-white shadow-[0_14px_38px_rgba(231,55,37,0.4)] [&_svg]:h-9 [&_svg]:w-9">
          <CheckCircle2 />
        </span>
      </div>
      <h3 className="text-display text-xl text-(--text-primary)">{title}</h3>
      {message && <p className="mt-2 max-w-md text-balance text-sm leading-relaxed text-(--text-secondary)">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─── AchievementToast ───────────────────────────────────────────────────────
// Floating bottom-right achievement popup. Controlled (open + onClose) with an
// optional auto-dismiss. No portal — render near the page root.
interface AchievementToastProps {
  open: boolean;
  onClose: () => void;
  icon?: ReactNode;
  emoji?: string;
  title: string;
  subtitle?: string;
  /** Auto-dismiss after N ms (default 4000). Set 0 to disable. */
  duration?: number;
}

export function AchievementToast({
  open, onClose, icon, emoji, title, subtitle, duration = 4000,
}: AchievementToastProps) {
  useEffect(() => {
    if (!open || !duration) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm" role="status" aria-live="polite">
      <div className="command-surface sheen toast-in flex items-center gap-3 p-4 pr-10">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(image:--gradient-primary) text-xl shadow-[0_10px_26px_rgba(231,55,37,0.45)] [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-white">
          {icon ?? emoji ?? <Trophy />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Achievement unlocked</p>
          <p className="truncate font-black text-white">{title}</p>
          {subtitle && <p className="truncate text-xs text-white/60">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
