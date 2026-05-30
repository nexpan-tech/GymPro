import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

type CardVariant = "default" | "outlined" | "ghost" | "glass" | "solid" | "premium" | "flat";
type CardPadding = "none" | "sm" | "md" | "lg";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-(--border) bg-(--glass-strong) shadow-(--shadow-md) backdrop-blur-xl",
  outlined:
    "border border-(--border) bg-transparent",
  ghost:
    "bg-transparent border-transparent",
  glass:
    "border border-(--glass-border) bg-(--glass) shadow-(--shadow-md) backdrop-blur-xl",
  solid:
    "border border-(--border) bg-(--surface-solid) shadow-(--shadow-sm)",
  premium:
    "relative overflow-hidden border border-(--border) bg-[image:var(--gradient-surface)] shadow-(--shadow-lg) backdrop-blur-xl",
  flat:
    "border border-(--border) bg-(--surface-secondary) shadow-none",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  variant = "default",
  padding = "none",
  hover = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] text-(--text-primary) transition-all duration-300",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "cursor-pointer hover:-translate-y-1 hover:shadow-(--shadow-xl)",
        className
      )}
      {...props}
    >
      {variant === "premium" && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/70 to-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  children,
  title,
  subtitle,
  action,
  className,
  ...props
}: CardHeaderProps) {
  // If title/subtitle/action are provided use structured layout, otherwise render children
  if (title || subtitle || action) {
    return (
      <div
        className={cn(
          "flex items-start justify-between gap-4 border-b border-(--border) px-6 py-5",
          className
        )}
        {...props}
      >
        <div className="min-w-0">
          {title && (
            <h3 className="truncate text-base font-bold tracking-tight text-(--text-primary)">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-(--text-secondary)">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn("border-b border-(--border) px-6 py-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardContent ──────────────────────────────────────────────────────────────

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "border-t border-(--border) px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-black tracking-tight text-(--text-primary)",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// ─── CardDescription ──────────────────────────────────────────────────────────

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("mt-1 text-sm leading-6 text-(--text-secondary)", className)}
      {...props}
    >
      {children}
    </p>
  );
}
