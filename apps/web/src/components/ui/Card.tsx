import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardVariant = "default" | "glass" | "solid" | "premium" | "flat";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-(--border) bg-(--surface-solid) shadow-(--shadow-md) dark:bg-(--surface)",
  glass:
    "border border-(--glass-border) bg-(--glass) shadow-(--shadow-lg) backdrop-blur-xl",
  solid:
    "border border-(--border) bg-(--surface-solid) shadow-(--shadow-sm)",
  premium:
    "relative overflow-hidden border border-(--border) bg-(--surface-solid) shadow-(--shadow-lg) dark:bg-(--surface)",
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
      className={clsx(
        "rounded-2xl text-(--text-primary) transition-all duration-300",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "hover:-translate-y-1 hover:shadow-(--shadow-xl)",
        className
      )}
      {...props}
    >
      {variant === "premium" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-(--gradient-primary)" />
      )}

      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "border-b border-(--border) px-6 py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div className={clsx("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <h3
      className={clsx(
        "text-lg font-bold tracking-tight text-(--text-primary)",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <p
      className={clsx(
        "mt-1 text-sm leading-6 text-(--text-secondary)",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}